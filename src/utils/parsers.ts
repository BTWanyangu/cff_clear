export function parseContaminantValues(text: string) {
  const map: Record<string, number> = {};
  const pairs: Array<[string, RegExp]> = [
    ["Lead (ppm)", /Lead\s*[:\-]?\s*(\d+\.?\d*)\s*ppm/i],
    ["Copper (ppm)", /Copper\s*[:\-]?\s*(\d+\.?\d*)\s*ppm/i],
    ["Nitrate (ppm)", /Nitrate\s*[:\-]?\s*(\d+\.?\d*)\s*ppm/i],
    ["Arsenic (ppb)", /Arsenic\s*[:\-]?\s*(\d+\.?\d*)\s*ppb/i],
    ["PFOA (ppt)", /PFOA\s*[:\-]?\s*(\d+\.?\d*)\s*ppt/i],
    ["PFOS (ppt)", /PFOS\s*[:\-]?\s*(\d+\.?\d*)\s*ppt/i],
    ["pH", /pH\s*[:\-]?\s*(\d+\.?\d*)/i]
  ];
  for (const [k, rx] of pairs) {
    const m = text.match(rx);
    if (m) map[k] = Number(m[1]);
  }
  return map;
}
