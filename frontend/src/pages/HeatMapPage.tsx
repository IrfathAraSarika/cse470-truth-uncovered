import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LogoIcon } from '../components/AppIcons';
import { getMapIncidents, type MapIncident } from '../services/mapApi';

// Custom Leaflet Icons
const yellowIcon = L.divIcon({
  className: 'custom-map-pin-yellow',
  html: `
    <div style="
      width: 22px;
      height: 22px;
      background-color: #eab308;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(234, 179, 8, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background-color: #ffffff; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

const redIcon = L.divIcon({
  className: 'custom-map-pin-red',
  html: `
    <div style="
      width: 22px;
      height: 22px;
      background-color: #ff4c29;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(255, 76, 41, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background-color: #ffffff; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

export default function HeatMapPage() {
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'verified'>('all');

  useEffect(() => {
    let isMounted = true;
    getMapIncidents()
      .then((data) => {
        if (isMounted) {
          setIncidents(data.incidents);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load incident map data.');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredIncidents = useMemo(() => {
    if (filter === 'all') return incidents;
    return incidents.filter((inc) => inc.status === filter);
  }, [incidents, filter]);

  const submittedCount = useMemo(() => incidents.filter((i) => i.status === 'submitted').length, [incidents]);
  const verifiedCount = useMemo(() => incidents.filter((i) => i.status === 'verified').length, [incidents]);

  return (
    <div className="min-h-screen bg-[#080808] text-[#e5e2e1] font-inter">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-[#080808]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold text-white text-lg">
              Truth <span className="text-[#ff4c29]">Uncovered</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/submit-report"
              className="px-4 py-2 bg-brand-teal text-bg-dark text-xs font-sora font-bold rounded hover:bg-brand-teal/90 transition-colors"
            >
              Report Incident
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-2">
            GPS-Tagged Incident Location Mapper
          </p>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-sora text-3xl md:text-4xl font-bold text-white mb-2">Heat Map</h1>
              <p className="text-sm text-zinc-400 max-w-2xl">
                Geographic visualization of reported and verified incidents across Bangladesh. Filter by status to inspect submitted claims and verified reports.
              </p>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-sora font-semibold rounded transition-colors ${
                  filter === 'all' ? 'bg-brand-teal text-bg-dark font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({incidents.length})
              </button>
              <button
                onClick={() => setFilter('submitted')}
                className={`px-3 py-1.5 text-xs font-sora font-semibold rounded transition-colors ${
                  filter === 'submitted' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Submitted ({submittedCount})
              </button>
              <button
                onClick={() => setFilter('verified')}
                className={`px-3 py-1.5 text-xs font-sora font-semibold rounded transition-colors ${
                  filter === 'verified' ? 'bg-brand-red/20 text-brand-red border border-brand-red/40' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Verified ({verifiedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card glass-border rounded-xl p-5 border-l-4 border-l-brand-teal">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Mapped Incidents</p>
            <p className="font-sora text-3xl font-bold text-white">{incidents.length}</p>
          </div>
          <div className="glass-card glass-border rounded-xl p-5 border-l-4 border-l-amber-400">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Submitted (Yellow Pins)</p>
            <p className="font-sora text-3xl font-bold text-white">{submittedCount}</p>
          </div>
          <div className="glass-card glass-border rounded-xl p-5 border-l-4 border-l-brand-red">
            <p className="text-xs font-bold text-brand-red uppercase tracking-wider mb-1">Verified (Red Pins)</p>
            <p className="font-sora text-3xl font-bold text-white">{verifiedCount}</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-brand-red/10 border border-brand-red/30 text-brand-red text-sm">
            {error}
          </div>
        )}

        {/* Map Container Card */}
        <div className="glass-card glass-border rounded-xl overflow-hidden shadow-2xl p-2 relative">
          <div className="w-full h-[600px] rounded-lg overflow-hidden relative z-0">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center bg-black/60 text-brand-teal font-sora font-semibold">
                Loading GPS Incident Map...
              </div>
            ) : (
              <MapContainer
                center={[23.685, 90.3563]}
                zoom={7}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ background: '#080808' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredIncidents.map((incident) => (
                  <Marker
                    key={incident.reportId}
                    position={[incident.latitude, incident.longitude]}
                    icon={incident.status === 'verified' ? redIcon : yellowIcon}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                      <span className="font-bold">{incident.title}</span>
                    </Tooltip>
                    <Popup className="dark-leaflet-popup">
                      <div className="p-2 min-w-[200px] text-zinc-900 font-inter">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                              incident.status === 'verified'
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {incident.status}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">ID: {incident.reportId.slice(0, 8)}</span>
                        </div>
                        <h4 className="font-sora font-bold text-sm text-zinc-900 mb-1 leading-tight">{incident.title}</h4>
                        {incident.address && (
                          <p className="text-xs text-zinc-600 mt-1 flex items-start gap-1">
                            <span>📍</span>
                            <span>{incident.address}</span>
                          </p>
                        )}
                        <p className="text-[11px] text-zinc-500 mt-2 font-mono">
                          GPS: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Map Legend overlay */}
          <div className="absolute bottom-6 right-6 z-10 glass-card glass-border rounded-lg p-3 bg-black/80 backdrop-blur-md text-xs space-y-2">
            <p className="font-sora font-bold text-white mb-1 border-b border-white/10 pb-1">Map Legend</p>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-white shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
              <span className="text-zinc-300">Submitted Incident</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-red border border-white shadow-[0_0_8px_rgba(255,76,41,0.8)]"></span>
              <span className="text-zinc-300">Verified Incident</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
