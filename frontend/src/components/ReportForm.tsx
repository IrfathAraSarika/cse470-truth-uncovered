import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldIcon } from './AppIcons';
import { submitReport } from '../services/reportApi';

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

export default function ReportForm() {
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
  const [reportId, setReportId] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setReportId('');

    try {
      const incidentDateTime = incidentDate
        ? new Date(`${incidentDate}T${incidentTime || '00:00'}`).toISOString()
        : null;
      const result = await submitReport({
        title,
        description,
        category,
        incidentDateTime,
        isAnonymous,
        district,
        address,
      });
      setReportId(result.report.report_id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Report submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = 'mt-2 w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm normal-case font-normal text-on-surface focus:outline-none focus:border-brand-teal/50';

  return (
    <form onSubmit={handleSubmit} className="mt-8 border border-white/10 rounded-lg bg-white/[0.02] overflow-hidden">
      <section className="p-6 md:p-8 border-b border-white/10">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-7 h-7 grid place-items-center rounded-full bg-brand-red text-white text-xs font-bold">1</span>
          <h2 className="font-sora text-lg font-bold text-white">Incident Summary</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <label className="text-xs font-bold uppercase text-on-surface/60">
            Report Title *
            <input required value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} placeholder="Brief title of the incident" />
          </label>
          <label className="text-xs font-bold uppercase text-on-surface/60">
            Category *
            <select required value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}>
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="p-6 md:p-8 border-b border-white/10">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-7 h-7 grid place-items-center rounded-full bg-brand-teal text-black text-xs font-bold">2</span>
          <h2 className="font-sora text-lg font-bold text-white">When and Where</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <label className="text-xs font-bold uppercase text-on-surface/60">
            Incident Date *
            <input required type="date" value={incidentDate} onChange={(event) => setIncidentDate(event.target.value)} className={fieldClass} />
          </label>
          <label className="text-xs font-bold uppercase text-on-surface/60">
            Time
            <input type="time" value={incidentTime} onChange={(event) => setIncidentTime(event.target.value)} className={fieldClass} />
          </label>
          <label className="text-xs font-bold uppercase text-on-surface/60">
            District *
            <select required value={district} onChange={(event) => setDistrict(event.target.value)} className={fieldClass}>
              {districts.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label className="block mt-5 text-xs font-bold uppercase text-on-surface/60">
          Address or Landmark *
          <input required value={address} onChange={(event) => setAddress(event.target.value)} className={fieldClass} placeholder="Office, road, institution, or nearby landmark" />
        </label>
      </section>

      <section className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-7 h-7 grid place-items-center rounded-full bg-brand-teal text-black text-xs font-bold">3</span>
          <h2 className="font-sora text-lg font-bold text-white">Detailed Statement</h2>
        </div>
        <textarea required rows={6} value={description} onChange={(event) => setDescription(event.target.value)} className={fieldClass} placeholder="Describe what happened, who was involved, and any supporting facts." />
        <label className="mt-5 flex items-start gap-3 text-sm text-on-surface/70">
          <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} className="mt-1 w-4 h-4 accent-brand-teal" />
          Hide my identity from public and non-authorized views.
        </label>

        {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}
        {reportId && (
          <div className="mt-5 p-4 border border-brand-teal/30 bg-brand-teal/5 rounded-lg">
            <p className="text-sm font-bold text-brand-teal">Report submitted successfully.</p>
            <p className="mt-1 text-xs text-on-surface/60">Report ID: {reportId}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
          <Link to="/evidence-vault" className="px-5 py-3 border border-brand-teal/40 text-brand-teal rounded-lg text-sm font-bold text-center">Continue to Evidence Vault</Link>
          <button disabled={loading} className="px-6 py-3 bg-brand-red text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <ShieldIcon className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </section>
    </form>
  );
}
