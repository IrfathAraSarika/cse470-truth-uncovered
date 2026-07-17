export const submitReportData = async (reportData: any) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to submit report');
  }

  return await response.json();
};