import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldIcon } from './AppIcons';
import { submitReport, type ReportScreening, type ReportSubmission } from '../services/reportApi';
import { getQueuedReports, queueReport, syncQueuedReports } from '../services/offlineReportQueue';

// ─── Constants ───────────────────────────────────────────────────────────────

const categories = [
  ['corruption', 'Corruption'],
  ['bribery', 'Bribery'],
  ['dowry', 'Dowry'],
  ['harassment', 'Harassment'],
  ['extortion', 'Extortion'],
  ['land_grabbing', 'Land Grabbing'],
  ['hazard', 'Public Hazard'],
  ['antisocial_activity', 'Antisocial Activity'],
  ['other', 'Other'],
] as const;

const districts = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh'];

// Default center: Bangladesh
const BD_CENTER: [number, number] = [23.685, 90.3563];

// ─── Location State Interface ─────────────────────────────────────────────────

interface LocationData {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  district: string | null;
  division: string | null;
}

// ─── Custom Leaflet Pin Icon ─────────────────────────────────────────────────

const pinIcon = L.divIcon({
  className: 'custom-report-pin',
  html: `<div style="
    width:24px;height:24px;
    background:#00adb5;
    border:2px solid #fff;
    border-radius:50%;
    box-shadow:0 0 10px rgba(0,173,181,0.8);
    display:flex;align-items:center;justify-content:center;">
    <div style="width:8px;height:8px;background:#fff;border-radius:50%;"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

// ─── Map Sub-components ───────────────────────────────────────────────────────

/** Smoothly re-centers the map when `center` changes */
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

/** Handles map clicks and marker drag to produce new lat/lng */
function DraggableMarker({
  position,
  onMove,
}: {
  position: [number, number];
  onMove: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={position}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend(e) {
          const marker = e.target as L.Marker;
          const pos = marker.getLatLng();
          onMove(pos.lat, pos.lng);
        },
      }}
    />
  );
}

// ─── Main Form Component ──────────────────────────────────────────────────────

export default function ReportForm() {
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('corruption');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reportId, setReportId] = useState('');
  const [screening, setScreening] = useState<ReportScreening | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(getQueuedReports().length);

  // Location / map state
  const [locationData, setLocationData] = useState<LocationData>({
    address: null, latitude: null, longitude: null, district: null, division: null,
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>(BD_CENTER);
  const [markerPos, setMarkerPos] = useState<[number, number]>(BD_CENTER);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [reverseGeoText, setReverseGeoText] = useState('');
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Online / offline listeners ─────────────────────────────────────────────
  const refreshQueue = useCallback(() => setQueuedCount(getQueuedReports().length), []);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); void syncQueuedReports().then(refreshQueue); };
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('truth-report-queue-change', refreshQueue);
    if (navigator.onLine) void syncQueuedReports().then(refreshQueue);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('truth-report-queue-change', refreshQueue);
    };
  }, [refreshQueue]);

  // ── Forward geocoding (address → coordinates, debounced 800ms) ────────────
  const handleAddressChange = (value: string) => {
    setAddress(value);
    setLocationConfirmed(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 4) return;

    debounceRef.current = setTimeout(async () => {
      try {
        setGeocoding(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=1`,
          { headers: { 'Accept-Language': 'en' } },
        );
        const data = (await res.json()) as Array<{
          lat: string; lon: string;
          display_name: string;
          address: Record<string, string>;
        }>;
        const first = data?.[0];
        if (!first) return;

        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        if (isNaN(lat) || isNaN(lon)) return;

        const addrObj = first.address ?? {};
        const dist = addrObj.county ?? addrObj.state_district ?? addrObj.city_district ?? null;
        const div  = addrObj.state ?? null;

        setMapCenter([lat, lon]);
        setMarkerPos([lat, lon]);
        setLocationData({ address: first.display_name, latitude: lat, longitude: lon, district: dist, division: div });

        // Auto-select matching district dropdown option
        if (dist) {
          const matched = districts.find(
            d => d.toLowerCase() === dist.toLowerCase() ||
                 dist.toLowerCase().includes(d.toLowerCase()),
          );
          if (matched) setDistrict(matched);
        }
      } catch {
        // Silently ignore network errors during geocoding
      } finally {
        setGeocoding(false);
      }
    }, 800);
  };

  // ── Reverse geocoding (pin drop → address) ────────────────────────────────
  const handlePinMove = async (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    setMapCenter([lat, lng]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = (await res.json()) as {
        display_name?: string;
        address?: Record<string, string>;
      };
      if (!data.display_name) return;

      const addrObj = data.address ?? {};
      const dist = addrObj.county ?? addrObj.state_district ?? addrObj.city_district ?? null;
      const div  = addrObj.state ?? null;

      setReverseGeoText(data.display_name);
      setLocationData({ address: data.display_name, latitude: lat, longitude: lng, district: dist, division: div });
    } catch {
      // Silently ignore
    }
  };

  // ── Confirm location from modal ───────────────────────────────────────────
  const handleConfirmLocation = () => {
    const resolvedAddress = locationData.address ?? reverseGeoText ?? address;
    if (resolvedAddress) setAddress(resolvedAddress);

    if (locationData.district) {
      const matched = districts.find(
        d => d.toLowerCase() === locationData.district!.toLowerCase() ||
             locationData.district!.toLowerCase().includes(d.toLowerCase()),
      );
      if (matched) setDistrict(matched);
    }

    setLocationConfirmed(true);
    setMapModalOpen(false);
  };

  // ── Payload builder ───────────────────────────────────────────────────────
  const buildPayload = (): ReportSubmission => ({
    title,
    description,
    category,
    incidentDateTime: incidentDate
      ? new Date(`${incidentDate}T${incidentTime || '00:00'}`).toISOString()
      : null,
    isAnonymous,
    district,
    address,
    locationData: locationData.latitude !== null && locationData.longitude !== null
      ? locationData
      : null,
  });

  // ── Form actions ──────────────────────────────────────────────────────────
  const saveOffline = () => {
    if (!title.trim() || !description.trim()) {
      setError('Add a title and detailed statement before saving the offline draft.');
      return;
    }
    queueReport(buildPayload());
    setError('');
    setReportId('');
    setScreening(null);
    setTitle('');
    setDescription('');
    setMessage('Report draft saved safely on this device.');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setReportId('');

    try {
      if (!navigator.onLine) {
        queueReport(buildPayload());
        setTitle('');
        setDescription('');
        setMessage('Report queued locally on device. Will auto-sync when connection is restored.');
        return;
      }
      const result = await submitReport(buildPayload());
      setReportId(result.report.report_id);
      setScreening(result.screening);
      setTitle('');
      setDescription('');
    } catch (requestError) {
      if (!navigator.onLine || requestError instanceof TypeError) {
        queueReport(buildPayload());
        setTitle('');
        setDescription('');
        setMessage('Network error encountered. Report saved safely in offline queue.');
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Report submission failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const fieldClass = 'mt-2 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm normal-case font-normal text-on-surface focus:outline-none focus:border-brand-teal/50 transition-colors';

  return (
    <>
      {/* ── Map Expand Modal ──────────────────────────────────────────────── */}
      {mapModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setMapModalOpen(false); }}
        >
          <div className="w-full max-w-3xl bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <p className="font-sora font-bold text-white text-sm">Pick Incident Location</p>
                <p className="text-xs text-on-surface/50 mt-0.5">Click anywhere or drag the pin to set location</p>
              </div>
              <button
                onClick={() => setMapModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-on-surface/60 hover:text-white transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Map */}
            <div className="w-full h-[450px] relative">
              <MapContainer
                center={mapCenter}
                zoom={12}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ background: '#080808' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenterUpdater center={mapCenter} />
                <DraggableMarker position={markerPos} onMove={handlePinMove} />
              </MapContainer>

              {/* GPS Coord Overlay */}
              {locationData.latitude !== null && (
                <div className="absolute bottom-3 left-3 z-[1000] bg-black/80 border border-white/10 text-xs text-brand-teal font-mono px-3 py-1.5 rounded-lg backdrop-blur-md">
                  {locationData.latitude.toFixed(5)}, {locationData.longitude?.toFixed(5)}
                </div>
              )}
            </div>

            {/* Reverse-geocoded address preview */}
            {reverseGeoText && (
              <div className="px-5 pt-3 pb-0">
                <p className="text-xs text-on-surface/60 leading-relaxed line-clamp-2">
                  <span className="text-brand-teal font-semibold">📍 </span>
                  {reverseGeoText}
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-white/10 mt-3">
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="px-5 py-2.5 border border-white/10 text-on-surface/60 rounded-lg text-sm font-bold hover:border-white/20 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLocation}
                disabled={locationData.latitude === null}
                className="px-6 py-2.5 bg-brand-teal text-bg-dark rounded-lg text-sm font-sora font-bold hover:bg-brand-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-teal/20"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Form ─────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="mt-8 border border-white/10 rounded-lg bg-white/[0.02] overflow-hidden">
        {/* Status Bar */}
        <div className="px-6 md:px-8 py-3 border-b border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className={online ? 'text-brand-teal' : 'text-amber-300'}>
            {online ? 'Online — automatic sync available' : 'Offline — reports will be queued'}
          </span>
          <span className="text-on-surface/50">
            {queuedCount} queued draft{queuedCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* Section 1 — Incident Summary */}
        <section className="p-6 md:p-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 grid place-items-center rounded-full bg-brand-red text-white text-xs font-bold">1</span>
            <h2 className="font-sora text-lg font-bold text-white">Incident Summary</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <label className="text-xs font-bold uppercase text-on-surface/60">
              Report Title *
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={fieldClass}
                placeholder="Brief title of the incident"
              />
            </label>
            <label className="text-xs font-bold uppercase text-on-surface/60">
              Category *
              <select required value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
                {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
        </section>

        {/* Section 2 — When and Where */}
        <section className="p-6 md:p-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 grid place-items-center rounded-full bg-brand-teal text-black text-xs font-bold">2</span>
            <h2 className="font-sora text-lg font-bold text-white">When and Where</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-5">
            <label className="text-xs font-bold uppercase text-on-surface/60">
              Incident Date *
              <input
                required
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-bold uppercase text-on-surface/60">
              Time
              <input
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-bold uppercase text-on-surface/60">
              District *
              <select required value={district} onChange={(e) => setDistrict(e.target.value)} className={fieldClass}>
                {districts.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          {/* Address input with geocoding indicator */}
          <label className="block text-xs font-bold uppercase text-on-surface/60">
            <div className="flex items-center justify-between mb-0.5">
              <span>Address or Landmark *</span>
              {geocoding && (
                <span className="text-[10px] text-brand-teal font-normal normal-case flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-brand-teal border-t-transparent rounded-full animate-spin inline-block" />
                  Locating…
                </span>
              )}
              {locationConfirmed && !geocoding && (
                <span className="text-[10px] text-emerald-400 font-normal normal-case flex items-center gap-1">
                  <span>✓</span> GPS confirmed
                </span>
              )}
            </div>
            <input
              required
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              className={fieldClass}
              placeholder="Office, road, institution, or nearby landmark"
            />
          </label>

          {/* Inline Map Preview */}
          <div className="mt-3 relative group border border-white/10 rounded-lg overflow-hidden" style={{ height: '180px' }}>
            <MapContainer
              center={mapCenter}
              zoom={12}
              scrollWheelZoom={false}
              dragging={false}
              zoomControl={false}
              doubleClickZoom={false}
              className="w-full h-full"
              style={{ background: '#080808' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapCenterUpdater center={mapCenter} />
              <Marker position={markerPos} icon={pinIcon} />
            </MapContainer>

            {/* Gradient overlay so button is legible */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Expand button overlay */}
            <button
              type="button"
              onClick={() => setMapModalOpen(true)}
              className="absolute bottom-2.5 right-2.5 z-[500] flex items-center gap-1.5 px-3 py-1.5 bg-black/70 border border-white/20 text-white text-xs font-bold rounded-md hover:bg-brand-teal hover:border-brand-teal hover:text-bg-dark transition-all backdrop-blur-md"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Expand Map
            </button>

            {/* Hint label */}
            <div className="absolute bottom-2.5 left-2.5 z-[500] text-[10px] text-white/50 font-mono pointer-events-none">
              {locationData.latitude !== null
                ? `${locationData.latitude.toFixed(4)}, ${locationData.longitude?.toFixed(4)}`
                : 'Pin not set'}
            </div>
          </div>

          {/* Location confirmed banner */}
          {locationConfirmed && locationData.latitude !== null && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-teal/5 border border-brand-teal/20 text-xs text-brand-teal">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>GPS coordinates captured — {locationData.latitude.toFixed(5)}, {locationData.longitude?.toFixed(5)}</span>
              {locationData.division && (
                <span className="ml-auto shrink-0 text-brand-teal/60">{locationData.division}</span>
              )}
            </div>
          )}
        </section>

        {/* Section 3 — Detailed Statement */}
        <section className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 grid place-items-center rounded-full bg-brand-teal text-black text-xs font-bold">3</span>
            <h2 className="font-sora text-lg font-bold text-white">Detailed Statement</h2>
          </div>
          <textarea
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass}
            placeholder="Describe what happened, who was involved, and any supporting facts."
          />
          <label className="mt-5 flex items-start gap-3 text-sm text-on-surface/70">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-1 w-4 h-4 accent-brand-teal"
            />
            Hide my identity from public and non-authorized views.
          </label>

          {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}

          {message && (
            <div className="mt-4 p-4 border border-brand-teal/30 bg-brand-teal/5 rounded-lg flex justify-between items-center text-sm text-brand-teal">
              <span>{message}</span>
              <Link to="/offline-drafts" className="font-bold underline text-xs">View Offline Queue</Link>
            </div>
          )}

          {reportId && (
            <div className="mt-5 p-4 border border-brand-teal/30 bg-brand-teal/5 rounded-lg">
              <p className="text-sm font-bold text-brand-teal">Report submitted successfully.</p>
              <p className="mt-1 text-xs text-on-surface/60">Report ID: {reportId}</p>
              {screening && (
                <p className="mt-2 text-xs text-on-surface/60">
                  Duplicate score {screening.duplicateScore}% — moderation score {screening.moderationScore}% — {screening.possibleDuplicates.length} possible match{screening.possibleDuplicates.length === 1 ? '' : 'es'}.
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
            <Link
              to="/evidence-vault"
              className="px-5 py-3 border border-brand-teal/40 text-brand-teal rounded-lg text-sm font-bold text-center"
            >
              Continue to Evidence Vault
            </Link>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={saveOffline}
                className="px-5 py-3 border border-white/15 text-white rounded-lg text-sm font-bold"
              >
                Save Offline Draft
              </button>
              <button
                disabled={loading}
                className="px-6 py-3 bg-brand-red text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldIcon className="w-4 h-4" />
                {loading ? 'Submitting…' : online ? 'Submit Report' : 'Queue Report'}
              </button>
            </div>
          </div>
        </section>
      </form>
    </>
  );
}
