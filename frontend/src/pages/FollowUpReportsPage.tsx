import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { LogoIcon } from "../components/AppIcons";
import DashboardLink from "../components/DashboardLink";
import {
  createFollowUp,
  getFollowUps,
  type FollowUpRecord,
  type FollowUpThread,
} from "../services/followUpApi";

export default function FollowUpReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [caseId, setCaseId] = useState(searchParams.get("caseId") ?? "");
  const [thread, setThread] = useState<FollowUpThread | null>(null);
  const [details, setDetails] = useState("");
  const [hasNewEvidence, setHasNewEvidence] = useState(false);
  const [replyTo, setReplyTo] = useState<FollowUpRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isLoggedIn = Boolean(localStorage.getItem("user"));

  const loadThread = async (requestedCaseId = caseId.trim()) => {
    if (!requestedCaseId) return;
    setLoading(true);
    setError("");
    try {
      const result = await getFollowUps(requestedCaseId);
      setThread(result);
      setCaseId(result.caseReference);
      setSearchParams({ caseId: result.caseReference });
    } catch (reason) {
      setThread(null);
      setError(
        reason instanceof Error ? reason.message : "Could not load follow-ups.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialCaseId = searchParams.get("caseId");
    if (!initialCaseId || !isLoggedIn) return;
    let active = true;
    getFollowUps(initialCaseId)
      .then((result) => {
        if (active) {
          setThread(result);
          setCaseId(result.caseReference);
          if (initialCaseId !== result.caseReference) setSearchParams({ caseId: result.caseReference });
        }
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [isLoggedIn, searchParams, setSearchParams]);

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createFollowUp(
        caseId,
        details,
        hasNewEvidence,
        replyTo?.follow_up_id ?? null,
      );
      setDetails("");
      setHasNewEvidence(false);
      setReplyTo(null);
      const result = await getFollowUps(caseId);
      setThread(result);
      setCaseId(result.caseReference);
      setSearchParams({ caseId: result.caseReference });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not add follow-up.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10">
        <div className="max-w-[1000px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold">Truth Uncovered</span>
          </Link>
          <DashboardLink />
        </div>
      </header>
      <main className="max-w-[900px] mx-auto px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">
          Feature #11
        </p>
        <h1 className="font-sora text-3xl font-bold text-white mt-2">
          Recursive Follow-Up Report Chain
        </h1>
        <p className="text-sm text-on-surface/60 mt-3">
          Continue an active case or reply to a specific update without losing
          the original context.
        </p>
        <label className="block mt-7 text-xs font-bold uppercase text-on-surface/50">
          Case or Report Reference
        </label>
        <div className="mt-2 flex flex-col sm:flex-row gap-3">
          <input
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
            placeholder="TU-C-..., TU-R-..., or legacy UUID"
            className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-brand-teal/50"
          />
          <button
            onClick={() => void loadThread()}
            disabled={loading || !caseId.trim()}
            className="px-5 py-3 bg-brand-red text-white rounded-lg text-sm font-bold disabled:opacity-40"
          >
            {loading ? "Loading..." : "Open Case Thread"}
          </button>
        </div>
        {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}
        {thread && (
          <>
            <section className="mt-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="font-sora text-lg font-bold text-white">
                  Follow-Up Timeline
                </h2>
                <span className="text-xs text-on-surface/50">
                  {thread.followUps.length} update
                  {thread.followUps.length === 1 ? "" : "s"}
                </span>
              </div>
              {thread.followUps.length === 0 ? (
                <div className="border border-white/10 rounded-lg p-8 text-center text-sm text-on-surface/50">
                  No follow-ups have been added to this case.
                </div>
              ) : (
                <div className="space-y-3">
                  {thread.followUps.map((item) => (
                    <article
                      key={item.follow_up_id}
                      style={{
                        marginLeft: `${Math.min(item.depth, 4) * 20}px`,
                      }}
                      className="border border-white/10 rounded-lg p-5 bg-white/[0.02]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <strong className="text-sm text-white">
                            {item.author_name}
                          </strong>
                          <span className="ml-2 text-[10px] uppercase font-bold text-brand-teal">
                            {item.author_role.replaceAll("_", " ")}
                          </span>
                        </div>
                        <time className="text-xs text-on-surface/40">
                          {new Date(item.follow_up_date).toLocaleString()}
                        </time>
                      </div>
                      <p className="text-sm text-on-surface/70 mt-3 whitespace-pre-wrap">
                        {item.details}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        {item.has_new_evidence ? (
                          <span className="text-xs font-bold text-amber-300">
                            Includes new evidence
                          </span>
                        ) : (
                          <span />
                        )}
                        {thread.access.canPost && (
                          <button
                            onClick={() => {
                              setReplyTo(item);
                              document
                                .getElementById("follow-up-form")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-xs font-bold text-brand-teal"
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            {thread.access.canPost && (
              <form
                id="follow-up-form"
                onSubmit={submit}
                className="mt-8 border border-white/10 rounded-lg p-6 bg-white/[0.02]"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-sora text-lg font-bold text-white">
                    {replyTo
                      ? `Reply to ${replyTo.author_name}`
                      : "Add Case Follow-Up"}
                  </h2>
                  {replyTo && (
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="text-xs text-brand-red font-bold"
                    >
                      Cancel Reply
                    </button>
                  )}
                </div>
                <textarea
                  required
                  minLength={20}
                  maxLength={4000}
                  rows={6}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Describe the new development, response, or supporting facts."
                  className="mt-4 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-brand-teal/50"
                />
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="flex items-center gap-3 text-sm text-on-surface/70">
                    <input
                      type="checkbox"
                      checked={hasNewEvidence}
                      onChange={(event) =>
                        setHasNewEvidence(event.target.checked)
                      }
                      className="w-4 h-4 accent-brand-teal"
                    />
                    This update includes new evidence
                  </label>
                  <button
                    disabled={loading || details.trim().length < 20}
                    className="px-5 py-3 bg-brand-red text-white rounded-lg text-sm font-bold disabled:opacity-40"
                  >
                    Submit Follow-Up
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
