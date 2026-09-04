import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import exifr from 'exifr';
import { LockIcon, LogoIcon, ShieldIcon } from '../components/AppIcons';
import {
  uploadEvidence,
  getEvidenceByReportId,
  deleteEvidence,
  getPreviewUrl,
} from '../services/evidenceApi';
import type { ExtractedGps, UploadEvidenceResponse, EvidenceItem } from '../services/evidenceApi';
import { getMyReports } from '../services/reportApi';
import type { Report } from '../services/reportApi';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EvidenceVaultPage() {
  const [searchParams] = useSearchParams();
  const queryReportId = searchParams.get('reportId') ?? '';

  const [file, setFile] = useState<File | null>(null);
  const [reportId, setReportId] = useState<string>(queryReportId);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [attachedEvidence, setAttachedEvidence] = useState<EvidenceItem[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<EvidenceItem | null>(null);

  // Security Pipeline state tracking
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [secured, setSecured] = useState<boolean>(false);

  // Result details
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
  const [extractedGpsData, setExtractedGpsData] = useState<ExtractedGps | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadEvidenceResponse | null>(null);

  // Fetch user's reports to populate dropdown
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyReports();
        if (!cancelled && res?.reports) {
          setMyReports(res.reports);
          if (!queryReportId && res.reports.length > 0) {
            setReportId(res.reports[0].report_id);
          }
        }
      } catch {
        // Silently ignore if unauthenticated or guest
      }
    })();
    return () => { cancelled = true; };
  }, [queryReportId]);

  // Fetch attached evidence when selected reportId changes
  const fetchAttachedEvidence = useCallback(async (targetReportId: string) => {
    if (!targetReportId) {
      setAttachedEvidence([]);
      return;
    }
    setLoadingEvidence(true);
    try {
      const items = await getEvidenceByReportId(targetReportId);
      setAttachedEvidence(items);
    } catch {
      setAttachedEvidence([]);
    } finally {
      setLoadingEvidence(false);
    }
  }, []);

  useEffect(() => {
    fetchAttachedEvidence(reportId);
  }, [reportId, fetchAttachedEvidence]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setNotification(null);
    setSecured(false);
    setCalculatedHash(null);
    setExtractedGpsData(null);
    setUploadResult(null);
    setCurrentStep(0);

    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMsg(`File size exceeds maximum limit of 30 MB (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB uploaded).`);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  /**
   * Helper to scrub image EXIF metadata and convert image to WebP blob using Canvas
   */
  const scrubAndCompressImage = (imageFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas 2D rendering context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas WebP conversion produced null blob'));
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  };

  /**
   * Calculate SHA-256 integrity hash of a Blob
   */
  const computeSha256 = async (blob: Blob): Promise<string> => {
    const arrayBuffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  /**
   * Execute Client-Side Pipeline and Upload
   */
  const handleSecureAndStore = async () => {
    if (!file) return;
    if (!reportId.trim()) {
      setErrorMsg('Please select a report first.');
      return;
    }

    setErrorMsg(null);
    setNotification(null);
    setIsProcessing(true);
    setSecured(false);
    setUploadResult(null);

    try {
      // --- Step 1: EXIF and GPS metadata extraction & scrubbing ---
      setCurrentStep(1);
      let gps: ExtractedGps | null = null;
      let processedBlob: Blob = file;
      let finalFileName = file.name;

      if (file.type.startsWith('image/')) {
        try {
          const rawGps = await exifr.gps(file);
          if (rawGps && typeof rawGps.latitude === 'number' && typeof rawGps.longitude === 'number') {
            gps = { latitude: rawGps.latitude, longitude: rawGps.longitude };
          }
        } catch {
          // Ignore EXIF parsing error if absent
        }
        setExtractedGpsData(gps);

        // Scrub EXIF by rendering to Canvas & converting to WebP
        processedBlob = await scrubAndCompressImage(file);
        finalFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
      }

      // --- Step 2: File integrity hash generated (SHA-256) ---
      setCurrentStep(2);
      const hash = await computeSha256(processedBlob);
      setCalculatedHash(hash);

      // --- Step 3: AES-256 encryption applied & uploaded ---
      setCurrentStep(3);
      const result = await uploadEvidence(
        processedBlob,
        finalFileName,
        reportId.trim(),
        hash,
        gps
      );

      setUploadResult(result);
      setSecured(true);
      setFile(null);

      // Refresh attached evidence list immediately
      fetchAttachedEvidence(reportId.trim());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during security pipeline processing.';
      setErrorMsg(message);
      setSecured(false);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles evidence deletion
   */
  const handleDeleteEvidence = async (item: EvidenceItem) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${item.originalFilename}"?`);
    if (!confirmDelete) return;

    try {
      await deleteEvidence(item.evidenceId);
      setNotification(`Evidence "${item.originalFilename}" deleted successfully.`);
      fetchAttachedEvidence(reportId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete evidence';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10">
        <div className="max-w-[1100px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold">Truth Uncovered</span>
          </Link>
          <span className="text-xs font-bold uppercase text-brand-teal">Evidence Security</span>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-12">
        <h1 className="font-sora text-3xl font-bold text-white mt-2">Encrypted Evidence Vault</h1>
        <p className="text-sm text-on-surface/60 mt-3">
          Upload evidence, remove identifying camera metadata, extract GPS coordinates, and store with AES-256 zero-knowledge encryption.
        </p>

        {errorMsg && (
          <div className="mt-6 p-4 border border-brand-red/50 bg-brand-red/10 rounded-lg text-sm text-brand-red font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {notification && (
          <div className="mt-6 p-4 border border-brand-teal/50 bg-brand-teal/10 rounded-lg text-sm text-brand-teal font-medium flex items-center justify-between">
            <span>✓ {notification}</span>
            <button onClick={() => setNotification(null)} className="text-xs opacity-60 hover:opacity-100">Dismiss</button>
          </div>
        )}

        {/* Preview Modal */}
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewItem(null)}>
            <div className="w-full max-w-2xl bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="font-sora font-bold text-white text-base truncate max-w-[80%]">{previewItem.originalFilename}</h3>
                <button onClick={() => setPreviewItem(null)} className="text-on-surface/60 hover:text-white text-lg leading-none">✕</button>
              </div>
              <div className="py-6 flex flex-col items-center justify-center">
                {previewItem.fileType.startsWith('image/') ? (
                  <img
                    src={getPreviewUrl(previewItem.evidenceId)}
                    alt={previewItem.originalFilename}
                    className="max-h-96 rounded-lg object-contain border border-white/10"
                  />
                ) : previewItem.fileType.startsWith('audio/') ? (
                  <div className="w-full px-4">
                    <p className="text-xs text-brand-teal mb-3 font-mono">Decrypted Audio Stream</p>
                    <audio controls className="w-full" src={getPreviewUrl(previewItem.evidenceId)} />
                  </div>
                ) : (
                  <p className="text-sm text-on-surface/50">Preview unavailable for this format.</p>
                )}
              </div>
              <div className="flex justify-end pt-4 border-t border-white/10 text-xs text-on-surface/50">
                {formatFileSize(previewItem.fileSizeBytes)} · Uploaded {new Date(previewItem.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          {/* Upload & Form Section */}
          <section className="border border-white/10 rounded-lg p-7 bg-white/[0.02]">
            <h2 className="font-sora text-lg font-bold text-white mb-5">Add Evidence</h2>

            <div className="mb-5">
              <label className="block text-xs font-bold uppercase text-on-surface/60 mb-2">
                Target Report *
              </label>

              {myReports.length > 0 ? (
                <select
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-teal transition-colors"
                >
                  {myReports.map((r) => (
                    <option key={r.report_id} value={r.report_id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 border border-white/10 rounded-lg bg-black/30 text-xs text-on-surface/50">
                  No completed reports found on this account. Please submit a report first.
                </div>
              )}
            </div>

            <label className="aspect-[4/2] border border-dashed border-brand-teal/40 rounded-lg grid place-items-center text-center cursor-pointer bg-brand-teal/[0.03] hover:bg-brand-teal/[0.06] transition-colors">
              <input
                type="file"
                accept="image/*,audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <span>
                <ShieldIcon className="w-8 h-8 text-brand-teal mx-auto mb-3" />
                <strong className="text-sm text-white">Choose image or audio file</strong>
                <small className="block text-on-surface/40 mt-2">Maximum file size: 30 MB (WebP image scrubbing applied)</small>
              </span>
            </label>

            {file && (
              <div className="mt-5 p-4 border border-white/10 rounded-lg bg-black/20">
                <p className="text-sm font-bold text-white truncate">{file.name}</p>
                <p className="text-xs text-on-surface/50 mt-1">
                  {formatFileSize(file.size)} · {file.type || 'Unknown type'}
                </p>
              </div>
            )}

            <button
              disabled={!file || !reportId || isProcessing}
              onClick={handleSecureAndStore}
              className="mt-5 w-full py-3 bg-brand-red hover:bg-brand-red/90 text-white rounded-lg text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LockIcon /> {isProcessing ? 'Processing Pipeline...' : 'Encrypt and Store'}
            </button>

            {/* Attached Evidence List Section */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="font-sora text-sm font-bold text-white uppercase tracking-wider mb-4">
                Attached Evidence
              </h3>

              {loadingEvidence ? (
                <p className="text-xs text-on-surface/40">Loading attached files...</p>
              ) : attachedEvidence.length === 0 ? (
                <p className="text-xs text-on-surface/40 py-3 italic">No evidence attached to this report yet.</p>
              ) : (
                <div className="space-y-3">
                  {attachedEvidence.map((item) => (
                    <div
                      key={item.evidenceId}
                      className="p-3 border border-white/10 rounded-lg bg-black/30 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.fileType.startsWith('image/') ? (
                          <span className="w-8 h-8 rounded bg-brand-teal/10 border border-brand-teal/20 text-brand-teal grid place-items-center shrink-0">
                            🖼️
                          </span>
                        ) : (
                          <span className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 grid place-items-center shrink-0">
                            🎵
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[180px] sm:max-w-[220px]" title={item.originalFilename}>
                            {item.originalFilename}
                          </p>
                          <p className="text-on-surface/40 mt-0.5">
                            {formatFileSize(item.fileSizeBytes)} · {new Date(item.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-brand-teal font-medium transition-colors cursor-pointer"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleDeleteEvidence(item)}
                          className="p-1.5 bg-brand-red/10 hover:bg-brand-red/20 border border-brand-red/30 rounded text-brand-red transition-colors cursor-pointer"
                          title="Delete Evidence"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Security Pipeline & Status Section */}
          <section className="border border-white/10 rounded-lg p-7 bg-white/[0.02]">
            <h2 className="font-sora text-lg font-bold text-white mb-5">Security Pipeline</h2>

            {[
              { title: 'EXIF and GPS metadata scrubbed', stepNum: 1 },
              { title: 'File integrity hash generated', stepNum: 2 },
              { title: 'AES-256 encryption applied', stepNum: 3 },
            ].map(({ title, stepNum }) => {
              const isCompleted = secured || currentStep > stepNum;
              const isActive = isProcessing && currentStep === stepNum;
              return (
                <div key={title} className="flex items-center gap-4 py-4 border-b border-white/10">
                  <span
                    className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-brand-teal text-black'
                        : isActive
                        ? 'bg-brand-teal/30 text-brand-teal border border-brand-teal animate-pulse'
                        : 'bg-white/5 text-on-surface/40'
                    }`}
                  >
                    {isCompleted ? '✓' : stepNum}
                  </span>
                  <div className="flex-1">
                    <span className={`text-sm ${isCompleted || isActive ? 'text-white font-medium' : 'text-on-surface/60'}`}>
                      {title}
                    </span>
                    {stepNum === 1 && extractedGpsData && (
                      <p className="text-xs text-brand-teal mt-0.5 font-mono">
                        GPS Extracted: Lat {extractedGpsData.latitude.toFixed(4)}, Lon {extractedGpsData.longitude.toFixed(4)}
                      </p>
                    )}
                    {stepNum === 2 && calculatedHash && (
                      <p className="text-xs text-brand-teal mt-0.5 font-mono truncate max-w-[280px]">
                        SHA-256: {calculatedHash}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Vault Status Card */}
            <div className="mt-6 p-4 rounded-lg bg-black/30 border border-white/10">
              <p className="text-xs uppercase font-bold text-on-surface/40">Vault Status</p>
              <p className={`mt-2 font-sora font-bold ${secured ? 'text-brand-teal' : isProcessing ? 'text-yellow-400' : 'text-white'}`}>
                {secured
                  ? 'Evidence secured & stored successfully'
                  : isProcessing
                  ? 'Running security pipeline...'
                  : 'Waiting for evidence submission'}
              </p>

              {secured && uploadResult && (
                <div className="mt-3 text-xs border-t border-white/10 pt-3 text-on-surface/70">
                  <p>
                    <strong className="text-white">Size Encrypted:</strong>{' '}
                    <span className="text-brand-teal font-medium">{formatFileSize(uploadResult.evidence.fileSizeBytes)}</span>
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
