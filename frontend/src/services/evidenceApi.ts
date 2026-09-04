const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');

export interface ExtractedGps {
  latitude: number;
  longitude: number;
}

export interface EvidenceItem {
  evidenceId: string;
  reportId: string;
  originalFilename: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface UploadEvidenceResponse {
  message: string;
  evidence: {
    evidenceId: string;
    reportId: string;
    filePath: string;
    fileType: string;
    originalFilename?: string;
    fileSizeBytes: number;
    fileHash: string;
    encryptionIv: string;
    extractedGps: ExtractedGps | null;
    uploadedAt: string;
  };
}

/**
 * Uploads evidence file payload to backend /api/evidence/upload
 */
export async function uploadEvidence(
  file: Blob | File,
  fileName: string,
  reportId: string,
  fileHash: string,
  extractedGps: ExtractedGps | null
): Promise<UploadEvidenceResponse> {
  const formData = new FormData();
  formData.append('file', file, fileName);
  formData.append('reportId', reportId);
  formData.append('fileHash', fileHash);
  if (extractedGps) {
    formData.append('extractedGps', JSON.stringify(extractedGps));
  }

  const response = await fetch(`${API_URL}/evidence/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Evidence upload failed');
  }

  return data as UploadEvidenceResponse;
}

/**
 * Fetches evidence list attached to a specific report.
 */
export async function getEvidenceByReportId(reportId: string): Promise<EvidenceItem[]> {
  const response = await fetch(`${API_URL}/evidence/report/${reportId}`, {
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch attached evidence');
  return data.evidence as EvidenceItem[];
}

/**
 * Deletes an evidence file item by evidenceId.
 */
export async function deleteEvidence(evidenceId: string): Promise<void> {
  const response = await fetch(`${API_URL}/evidence/${evidenceId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete evidence');
}

/**
 * Returns streamable preview URL for evidence file.
 */
export function getPreviewUrl(evidenceId: string): string {
  return `${API_URL}/evidence/${evidenceId}/preview`;
}
