const patterns: Array<[RegExp, string]> = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email removed]'],
  [/(?<!\d)(?:\+?880|0)?1[3-9]\d{8}(?!\d)/g, '[phone removed]'],
  [/\b\d{10,17}\b/g, '[identifier removed]'],
  [/\b(?:NID|passport|account)\s*(?:no\.?|number|#)?\s*[:=-]?\s*[A-Z0-9-]{5,}\b/gi, '[identifier removed]'],
];

export function redactPublicText(value: unknown, maximumLength = 1200) {
  let text = typeof value === 'string' ? value.trim() : '';
  for (const [pattern, replacement] of patterns) text = text.replace(pattern, replacement);
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > maximumLength ? `${text.slice(0, maximumLength - 3)}...` : text;
}

export function normalizePublicKeywords(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item).trim().toLowerCase()).filter((item) => /^[a-z0-9 _-]{2,40}$/.test(item)))].slice(0, 12);
}
