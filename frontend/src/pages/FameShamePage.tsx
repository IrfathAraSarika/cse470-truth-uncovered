import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogoIcon } from "../components/AppIcons";
import DashboardLink from "../components/DashboardLink";
import {
  createFameShame,
  getAdminFameShame,
  getFameShame,
  reviewFameShame,
  type FameShameRecord,
} from "../services/transparencyApi";

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

export default function FameShamePage() {
  const [type, setType] = useState("all");
  const [records, setRecords] = useState<FameShameRecord[]>([]);
  const [adminRecords, setAdminRecords] = useState<FameShameRecord[]>([]);
  const [entryType, setEntryType] = useState<"fame" | "shame">("fame");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isAdmin = readRole() === "admin";

  useEffect(() => {
    let active = true;
    getFameShame(type)
      .then(({ records: rows }) => {
        if (active) setRecords(rows);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [type]);
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    getAdminFameShame()
      .then(({ records: rows }) => {
        if (active) setAdminRecords(rows);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const reload = async () => {
    const publicResult = await getFameShame(type);
    setRecords(publicResult.records);
    if (isAdmin) {
      const adminResult = await getAdminFameShame();
      setAdminRecords(adminResult.records);
    }
  };
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await createFameShame({
        type: entryType,
        name,
        description,
        institutionId: institutionId || null,
        caseId: caseId || null,
      });
      setName("");
      setDescription("");
      setInstitutionId("");
      setCaseId("");
      setMessage("Entry created in the pending review queue.");
      await reload();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not create entry.",
      );
    }
  };
  const review = async (recordId: string, approved: boolean) => {
    setError("");
    try {
      await reviewFameShame(recordId, approved);
      setMessage(
        approved
          ? "Entry approved and published."
          : "Entry rejected and kept private.",
      );
      await reload();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not review entry.",
      );
    }
  };
  const pending = adminRecords.filter(
    (item) => item.review_status === "pending",
  );

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
          Feature #15
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mt-2">
          <div>
            <h1 className="font-sora text-3xl font-bold text-white">
              Fame and Shame Wall
            </h1>
            <p className="text-sm text-on-surface/60 mt-3">
              Approved records recognizing action and documenting verified
              institutional failure.
            </p>
          </div>
          <div className="inline-flex border border-white/10 rounded-lg p-1 bg-black/30">
            <button
              onClick={() => setType("all")}
              className={`px-4 py-2 rounded text-xs font-bold ${type === "all" ? "bg-white/10 text-white" : "text-on-surface/50"}`}
            >
              All
            </button>
            <button
              onClick={() => setType("fame")}
              className={`px-4 py-2 rounded text-xs font-bold ${type === "fame" ? "bg-brand-teal text-black" : "text-on-surface/50"}`}
            >
              Fame
            </button>
            <button
              onClick={() => setType("shame")}
              className={`px-4 py-2 rounded text-xs font-bold ${type === "shame" ? "bg-brand-red text-white" : "text-on-surface/50"}`}
            >
              Shame
            </button>
          </div>
        </div>
        {error && <p className="mt-5 text-sm text-brand-red">{error}</p>}
        {message && (
          <p className="mt-5 p-4 border border-brand-teal/30 bg-brand-teal/5 rounded-lg text-sm text-brand-teal">
            {message}
          </p>
        )}
        <section className="mt-8 grid md:grid-cols-2 gap-5">
          {records.length === 0 ? (
            <div className="md:col-span-2 border border-white/10 rounded-lg p-10 text-center text-sm text-on-surface/50">
              No approved entries match this view.
            </div>
          ) : (
            records.map((item) => (
              <article
                key={item.record_id}
                className={`border rounded-lg p-6 bg-white/[0.02] ${item.type === "fame" ? "border-brand-teal/30" : "border-brand-red/30"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded ${item.type === "fame" ? "bg-brand-teal/15 text-brand-teal" : "bg-brand-red/15 text-brand-red"}`}
                  >
                    {item.type}
                  </span>
                  <time className="text-xs text-on-surface/40">
                    {new Date(item.date_added).toLocaleDateString()}
                  </time>
                </div>
                <h2 className="font-sora text-lg font-bold text-white mt-5">
                  {item.name}
                </h2>
                {item.institution_name && (
                  <p className="text-xs text-brand-teal mt-2">
                    {item.institution_name}
                  </p>
                )}
                <p className="text-sm text-on-surface/65 mt-4 whitespace-pre-wrap">
                  {item.description}
                </p>
                {item.case_id && (
                  <p className="mt-5 text-[10px] uppercase text-on-surface/35 break-all">
                    Case {item.case_id}
                  </p>
                )}
              </article>
            ))
          )}
        </section>
        {isAdmin && (
          <section className="mt-12 border-t border-white/10 pt-10">
            <p className="text-xs uppercase font-bold text-brand-red">
              Administrator Tools
            </p>
            <h2 className="font-sora text-xl font-bold text-white mt-1">
              Editorial Review
            </h2>
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <form
                onSubmit={create}
                className="border border-white/10 rounded-lg p-6 bg-white/[0.02]"
              >
                <h3 className="font-sora text-sm font-bold text-white">
                  Propose Wall Entry
                </h3>
                <select
                  value={entryType}
                  onChange={(event) =>
                    setEntryType(event.target.value as "fame" | "shame")
                  }
                  className="mt-4 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                >
                  <option value="fame">Fame - positive response</option>
                  <option value="shame">Shame - verified accountability</option>
                </select>
                <input
                  required
                  minLength={3}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Public entry title"
                  className="mt-3 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                />
                <textarea
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Verified context and outcome"
                  className="mt-3 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                />
                <input
                  value={institutionId}
                  onChange={(event) => setInstitutionId(event.target.value)}
                  placeholder="Institution UUID (optional)"
                  className="mt-3 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                />
                <input
                  value={caseId}
                  onChange={(event) => setCaseId(event.target.value)}
                  placeholder="Case reference or legacy UUID (optional)"
                  className="mt-3 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm"
                />
                <button className="mt-4 px-5 py-3 bg-brand-red text-white rounded-lg text-sm font-bold">
                  Add to Review Queue
                </button>
              </form>
              <div className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02]">
                <div className="px-5 py-4 border-b border-white/10 text-xs uppercase font-bold text-on-surface/50">
                  Pending Approval ({pending.length})
                </div>
                {pending.length === 0 ? (
                  <p className="p-8 text-sm text-on-surface/50 text-center">
                    No entries are waiting.
                  </p>
                ) : (
                  pending.map((item) => (
                    <article
                      key={item.record_id}
                      className="p-5 border-b border-white/10 last:border-0"
                    >
                      <span
                        className={`text-[10px] uppercase font-bold ${item.type === "fame" ? "text-brand-teal" : "text-brand-red"}`}
                      >
                        {item.type}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-on-surface/50 mt-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => void review(item.record_id, true)}
                          className="px-3 py-2 bg-brand-teal text-black rounded text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => void review(item.record_id, false)}
                          className="px-3 py-2 border border-brand-red/40 text-brand-red rounded text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
