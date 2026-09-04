import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoIcon } from "../components/AppIcons";
import DashboardLink from "../components/DashboardLink";
import {
  assignInstitution,
  createInstitution,
  getInstitutionRankings,
  recalculateInstitutionScores,
  updateCaseOutcome,
  type InstitutionMetric,
} from "../services/transparencyApi";

type RankingMode = "redFlags" | "trust";
function readRole() {
  try {
    return (
      (
        JSON.parse(localStorage.getItem("user") ?? "null") as {
          role?: string;
        } | null
      )?.role ?? null
    );
  } catch {
    return null;
  }
}

export default function InstitutionRankingsPage({
  initialMode,
}: {
  initialMode: RankingMode;
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<RankingMode>(initialMode);
  const [institutions, setInstitutions] = useState<InstitutionMetric[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [institutionType, setInstitutionType] = useState("Government office");
  const [address, setAddress] = useState("");
  const [reportId, setReportId] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [outcomeCaseId, setOutcomeCaseId] = useState("");
  const [outcomeStatus, setOutcomeStatus] = useState("action_taken");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [closedAt, setClosedAt] = useState("");
  const isAdmin = readRole() === "admin";

  useEffect(() => {
    let active = true;
    getInstitutionRankings()
      .then(({ institutions: rows }) => {
        if (active) setInstitutions(rows);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const ranked = useMemo(
    () =>
      [...institutions].sort((left, right) =>
        mode === "redFlags"
          ? right.redFlagScore - left.redFlagScore
          : right.trustScore - left.trustScore,
      ),
    [institutions, mode],
  );
  const refresh = async () => {
    const result = await getInstitutionRankings();
    setInstitutions(result.institutions);
  };
  const switchMode = (next: RankingMode) => {
    setMode(next);
    navigate(next === "redFlags" ? "/institution-rankings" : "/trust-scores");
  };
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const result = await createInstitution(name, institutionType, address);
      setName("");
      setAddress("");
      setInstitutionId(result.institution.institution_id);
      setMessage(`${result.institution.name} is ready for report assignment.`);
      await refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save institution.",
      );
    }
  };
  const assign = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await assignInstitution(reportId, institutionId);
      setReportId("");
      setMessage("Report linked to the selected institution.");
      await refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not assign report.",
      );
    }
  };
  const recalculate = async () => {
    setError("");
    try {
      const result = await recalculateInstitutionScores();
      setInstitutions(result.institutions);
      setMessage(
        `Recalculated and stored ${result.updated} institution score${result.updated === 1 ? "" : "s"}.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not recalculate scores.",
      );
    }
  };
  const saveOutcome = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const result = await updateCaseOutcome(
        outcomeCaseId,
        outcomeStatus,
        resolutionNotes,
        outcomeStatus === "closed" ? new Date(closedAt).toISOString() : null,
      );
      setInstitutions(result.institutions);
      setOutcomeCaseId("");
      setResolutionNotes("");
      setClosedAt("");
      setMessage(
        `Case ${result.case.case_id} changed to ${result.case.status.replaceAll("_", " ")}; institution scores were recalculated.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not update the case outcome.",
      );
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
          <DashboardLink />
        </div>
      </header>
      <main className="max-w-[1100px] mx-auto px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">
          Features #13 and #14
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mt-2">
          <div>
            <h1 className="font-sora text-3xl font-bold text-white">
              {mode === "redFlags"
                ? "Red Flag Institution Rankings"
                : "Community Trust Score Engine"}
            </h1>
            <p className="text-sm text-on-surface/60 mt-3 max-w-2xl">
              {mode === "redFlags"
                ? "Highlights institutions with verified report volume and unresolved case risk."
                : "Measures action-taken rate and resolution speed using verified case outcomes."}
            </p>
          </div>
          <div className="inline-flex self-start border border-white/10 rounded-lg p-1 bg-black/30">
            <button
              onClick={() => switchMode("redFlags")}
              className={`px-4 py-2 rounded text-xs font-bold ${mode === "redFlags" ? "bg-brand-red text-white" : "text-on-surface/50"}`}
            >
              Red Flags
            </button>
            <button
              onClick={() => switchMode("trust")}
              className={`px-4 py-2 rounded text-xs font-bold ${mode === "trust" ? "bg-brand-teal text-black" : "text-on-surface/50"}`}
            >
              Trust Scores
            </button>
          </div>
        </div>
        {error && <p className="mt-5 text-sm text-brand-red">{error}</p>}
        {message && (
          <p className="mt-5 p-4 border border-brand-teal/30 bg-brand-teal/5 rounded-lg text-sm text-brand-teal">
            {message}
          </p>
        )}
        <section className="mt-8 border border-white/10 rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-[56px_1.7fr_0.8fr_0.8fr_0.8fr] gap-4 px-5 py-3 bg-white/[0.04] text-[10px] uppercase font-bold text-on-surface/40">
            <span>Rank</span>
            <span>Institution</span>
            <span>Verified</span>
            <span>Action Rate</span>
            <span>{mode === "redFlags" ? "Red Flag" : "Trust"}</span>
          </div>
          {ranked.length === 0 ? (
            <div className="p-10 text-center text-sm text-on-surface/50">
              No institutions have been registered yet.
            </div>
          ) : (
            ranked.map((item, index) => (
              <article
                key={item.institutionId}
                className="grid md:grid-cols-[56px_1.7fr_0.8fr_0.8fr_0.8fr] gap-3 md:gap-4 items-center px-5 py-5 border-t border-white/10 first:border-t-0"
              >
                <span className="font-sora text-xl font-bold text-on-surface/30">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-sora text-sm font-bold text-white">
                    {item.name}
                  </h2>
                  <p className="text-xs text-on-surface/40 mt-1">
                    {item.type ?? "Institution"}
                    {item.address ? ` / ${item.address}` : ""}
                  </p>
                </div>
                <div>
                  <span className="md:hidden text-[10px] uppercase text-on-surface/40">
                    Verified reports{" "}
                  </span>
                  <strong className="text-sm text-white">
                    {item.verifiedReports}
                  </strong>
                </div>
                <div>
                  <span className="md:hidden text-[10px] uppercase text-on-surface/40">
                    Action rate{" "}
                  </span>
                  <strong className="text-sm text-white">
                    {item.actionTakenRate}%
                  </strong>
                </div>
                <div>
                  <span
                    className={`inline-block min-w-20 px-3 py-2 rounded-lg text-center font-sora font-bold ${mode === "redFlags" ? (item.redFlagScore >= 70 ? "bg-brand-red/15 text-brand-red" : "bg-amber-400/10 text-amber-300") : item.trustScore >= 70 ? "bg-brand-teal/15 text-brand-teal" : "bg-white/5 text-on-surface/60"}`}
                  >
                    {mode === "redFlags" ? item.redFlagScore : item.trustScore}
                  </span>
                </div>
              </article>
            ))
          )}
        </section>
        {isAdmin && (
          <section className="mt-12 border-t border-white/10 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase font-bold text-brand-red">
                  Administrator Tools
                </p>
                <h2 className="font-sora text-xl font-bold text-white mt-1">
                  Institution Data Management
                </h2>
              </div>
              <button
                onClick={recalculate}
                className="px-4 py-2.5 border border-brand-teal/40 text-brand-teal rounded-lg text-xs font-bold"
              >
                Recalculate Scores
              </button>
            </div>
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <form
                onSubmit={create}
                className="border border-white/10 rounded-lg p-6 bg-white/[0.02]"
              >
                <h3 className="font-sora text-sm font-bold text-white">
                  Register Institution
                </h3>
                <input
                  required
                  minLength={3}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Institution name"
                  className="mt-4 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                />
                <input
                  value={institutionType}
                  onChange={(event) => setInstitutionType(event.target.value)}
                  placeholder="Institution type"
                  className="mt-3 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                />
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Address"
                  className="mt-3 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                />
                <button className="mt-4 px-5 py-3 bg-brand-red text-white rounded-lg text-sm font-bold">
                  Save Institution
                </button>
              </form>
              <form
                onSubmit={assign}
                className="border border-white/10 rounded-lg p-6 bg-white/[0.02]"
              >
                <h3 className="font-sora text-sm font-bold text-white">
                  Link Verified Report
                </h3>
                <input
                  required
                  value={reportId}
                  onChange={(event) => setReportId(event.target.value)}
                  placeholder="Report reference or legacy UUID"
                  className="mt-4 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                />
                <select
                  required
                  value={institutionId}
                  onChange={(event) => setInstitutionId(event.target.value)}
                  className="mt-3 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                >
                  <option value="">Select institution</option>
                  {institutions.map((item) => (
                    <option key={item.institutionId} value={item.institutionId}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button className="mt-4 px-5 py-3 bg-brand-teal text-black rounded-lg text-sm font-bold">
                  Link Report
                </button>
              </form>
            </div>
            <form
              onSubmit={saveOutcome}
              className="mt-6 border border-brand-teal/20 rounded-lg p-6 bg-brand-teal/[0.02]"
            >
              <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                <div className="flex-1">
                  <h3 className="font-sora text-sm font-bold text-white">
                    Update Case Outcome
                  </h3>
                  <p className="text-xs text-on-surface/45 mt-1">
                    Saving immediately recalculates red-flag and trust scores.
                  </p>
                  <input
                    required
                    value={outcomeCaseId}
                    onChange={(event) => setOutcomeCaseId(event.target.value)}
                    placeholder="Case/report reference or legacy UUID"
                    className="mt-4 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                  />
                </div>
                <label className="lg:w-56 text-xs font-bold uppercase text-on-surface/50">
                  New status
                  <select
                    value={outcomeStatus}
                    onChange={(event) => {
                      setOutcomeStatus(event.target.value);
                      if (event.target.value !== "closed") setClosedAt("");
                    }}
                    className="mt-2 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm normal-case text-on-surface"
                  >
                    <option value="received">Received</option>
                    <option value="verified">Verified</option>
                    <option value="under_investigation">Under Investigation</option>
                    <option value="action_taken">Action Taken</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
                {outcomeStatus === "closed" && (
                  <label className="lg:w-64 text-xs font-bold uppercase text-on-surface/50">
                    Closed at
                    <input
                      required
                      type="datetime-local"
                      value={closedAt}
                      onChange={(event) => setClosedAt(event.target.value)}
                      className="mt-2 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm normal-case text-on-surface"
                    />
                  </label>
                )}
              </div>
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={3}
                value={resolutionNotes}
                onChange={(event) => setResolutionNotes(event.target.value)}
                placeholder="Document the investigation result or action taken"
                className="mt-4 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
              />
              <button className="mt-4 px-5 py-3 bg-brand-teal text-black rounded-lg text-sm font-bold">
                Save Outcome and Recalculate
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
