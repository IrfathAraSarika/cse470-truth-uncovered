import React, { useState } from 'react';
import { submitReportData } from '../services/reportApi';

export default function ReportForm() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State matching the DB schema
  const [formData, setFormData] = useState({
    citizen_id: '123e4567-e89b-12d3-a456-426614174000', // MOCKED UUID: Replace with real user's ID
    title: '',
    description: '',
    category: 'corruption', // Default enum value
    is_anonymous: false,
    incident_datetime: '',
    location_id: '',
    institution_id: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await submitReportData(formData);
      setSuccessMsg('Report submitted successfully. Thank you for your courage.');
      // Reset form
      setFormData({ ...formData, title: '', description: '', incident_datetime: '', location_id: '', institution_id: '', is_anonymous: false });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1d24] border border-gray-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        Submit a Report
      </h2>

      {errorMsg && <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-md text-sm">{errorMsg}</div>}
      {successMsg && <div className="mb-4 p-3 bg-green-900/50 border border-green-500 text-green-200 rounded-md text-sm">{successMsg}</div>}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Incident Title *</label>
          <input required type="text" name="title" value={formData.title} onChange={handleChange} 
            className="w-full bg-[#0f1115] border border-gray-700 text-white rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
            placeholder="Brief summary of the incident" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Detailed Description *</label>
          <textarea required name="description" value={formData.description} onChange={handleChange} rows={5}
            className="w-full bg-[#0f1115] border border-gray-700 text-white rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
            placeholder="Provide as much detail as possible..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange}
              className="w-full bg-[#0f1115] border border-gray-700 text-white rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value="corruption">Corruption</option>
              <option value="fraud">Fraud</option>
              <option value="harassment">Harassment</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Incident Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Date & Time of Incident</label>
            <input type="datetime-local" name="incident_datetime" value={formData.incident_datetime} onChange={handleChange}
              className="w-full bg-[#0f1115] border border-gray-700 text-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
        </div>

        {/* Anonymous Checkbox */}
        <div className="flex items-center pt-2">
          <input type="checkbox" name="is_anonymous" checked={formData.is_anonymous} onChange={handleChange} id="anon"
            className="w-4 h-4 text-blue-600 bg-[#0f1115] border-gray-700 rounded focus:ring-blue-500 focus:ring-offset-gray-900" />
          <label htmlFor="anon" className="ml-2 text-sm text-gray-300">Submit anonymously (Your identity will be hidden)</label>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button type="submit" disabled={loading}
          className="bg-white text-black hover:bg-gray-200 font-medium py-2.5 px-6 rounded-md transition duration-150 ease-in-out disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </form>
  );
}