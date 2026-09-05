import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { Link } from "react-router-dom";
import { LogoIcon } from "../components/AppIcons";
import DashboardLink from "../components/DashboardLink";
import { getHeatmap, type HeatmapPoint } from "../services/transparencyApi";

const categories = [
  "all",
  "corruption",
  "bribery",
  "dowry",
  "harassment",
  "extortion",
  "land_grabbing",
  "hazard",
  "antisocial_activity",
  "other",
];
const regions = [
  "all",
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Mymensingh",
];
const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function HeatmapPage() {
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");
  const [months, setMonths] = useState(12);
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [summary, setSummary] = useState({ reports: 0, regions: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getHeatmap(category, region, months)
      .then((result) => {
        if (active) {
          setPoints(result.points);
          setSummary(result.summary);
          setError("");
          setLoading(false);
        }
      })
      .catch((reason: Error) => {
        if (active) {
          setError(reason.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [category, region, months]);

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10">
        <div className="max-w-[1100px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>
          </Link>
          <DashboardLink />
        </div>
      </header>
      <main className="max-w-[1100px] mx-auto px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">
          Feature #12
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mt-2">
          <div>
            <h1 className="font-sora text-3xl font-bold text-white">
              Interactive Corruption Heatmap
            </h1>
            <p className="text-sm text-on-surface/60 mt-3">
              Only verified or closed reports are included in public aggregates.
            </p>
          </div>
          <div className="flex gap-5">
            <div>
              <p className="text-2xl font-sora font-bold text-brand-red">
                {summary.reports}
              </p>
              <p className="text-xs text-on-surface/40">Verified reports</p>
            </div>
            <div>
              <p className="text-2xl font-sora font-bold text-brand-teal">
                {summary.regions}
              </p>
              <p className="text-xs text-on-surface/40">Regions shown</p>
            </div>
          </div>
        </div>
        <section className="mt-7 grid sm:grid-cols-3 gap-4">
          <label className="text-xs font-bold uppercase text-on-surface/50">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-2 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm normal-case text-on-surface"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {label(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase text-on-surface/50">
            Region
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="mt-2 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm normal-case text-on-surface"
            >
              {regions.map((item) => (
                <option key={item} value={item}>
                  {label(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase text-on-surface/50">
            Time Range
            <select
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
              className="mt-2 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm normal-case text-on-surface"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
              <option value={24}>Last 24 months</option>
              <option value={60}>Last 5 years</option>
            </select>
          </label>
        </section>
        {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}
        <section className="mt-6 relative border border-white/10 rounded-lg overflow-hidden bg-white/[0.02]">
          <MapContainer
            center={[23.685, 90.3563]}
            zoom={7}
            scrollWheelZoom
            className="h-[520px] w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map((point) => (
              <CircleMarker
                key={`${point.district}-${point.category}`}
                center={[point.latitude, point.longitude]}
                radius={Math.min(32, 8 + point.reportCount * 3)}
                pathOptions={{
                  color:
                    point.severityIndex >= 70
                      ? "#ff4c29"
                      : point.severityIndex >= 45
                        ? "#f59e0b"
                        : "#00adb5",
                  fillOpacity: 0.55,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{point.district}</strong>
                  <br />
                  {label(point.category)}: {point.reportCount}
                  <br />
                  Severity index: {point.severityIndex}
                  {point.usedDistrictCenter ? (
                    <>
                      <br />
                      <small>District center used for privacy</small>
                    </>
                  ) : null}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          {loading && (
            <div className="absolute inset-0 z-[500] grid place-items-center bg-black/60 text-sm font-bold">
              Loading verified report data...
            </div>
          )}
          {!loading && points.length === 0 && (
            <div className="absolute left-4 bottom-4 z-[500] max-w-sm p-4 rounded-lg bg-black/85 border border-white/15 text-sm text-on-surface/70">
              No verified reports match these filters yet.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
