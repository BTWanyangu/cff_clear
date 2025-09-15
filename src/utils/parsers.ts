export function parseContaminantValues(text: string) {
  const map: Record<string, number> = {};
  const pairs: Array<[string, RegExp]> = [
    ["Lead (ppm)", /Lead\s*[:\-]?\s*(\d+\.?\d*)\s*ppm/i],
    ["Copper (ppm)", /Copper\s*[:\-]?\s*(\d+\.?\d*)\s*ppm/i],
    ["Nitrate (ppm)", /Nitrate\s*[:\-]?\s*(\d+\.?\d*)\s*ppm/i],
    ["Barium", /Barium\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Chromium", /Chromium\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Sodium", /Sodium\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Iron", /Iron\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Manganese", /Manganese\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Zinc", /Zinc\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Chloride", /Chloride\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Calcium", /Calcium\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Magnesium", /Magnesium\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Nickel", /Nickel\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Sulfate", /Sulfate\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Perchlorate", /Perchlorate\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Fluoride", /Flouride\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Hydrogen Sulfide", /Hydrogen Sulfide\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Silica", /Silica\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Arsenic (ppb)", /Arsenic\s*[:\-]?\s*(\d+\.?\d*)\s*ppb/i],
    ["Trichloroethene", /Trichloroethene\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Tetrachloroethene", /Tetrachloroethene\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["1,1-Dichloroethane", /1,1-Dichloroethane\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["1,1-Dichloroethene", /1,1-Dichloroethene\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["1,1,1-Trichloroethane", /1,1,1-Trichloroethane\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Benzene", /Benzene\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Gross Alpha", /Gross Alpha\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Gross Beta", /Gross Beta\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Combined Radium 226 & 228", /Combined Radium 226 & 228\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Uranium", /Uranium\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Free Chlorine", /Free Chlorine\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Chloramine", /Chloramine\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Total Trihalomethanes", /Total Trihalomethanes\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Bromodichloromethane ", /Bromodichloromethane \s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Chloroform", /Chloroform\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Dibromochloromethane", /Dibromochloromethane\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Haloacetic Acids (HAA5-ppb)", /Haloacetic Acids\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Haloacetic Acids (HAA9-ppb)", /Haloacetic Acids \s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Dibromoacetic Acid", /Dibromoacetic Acid\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Dichloroacetic Acid ", /Dichloroacetic Acid \s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Trichloroacetic Acid", /Trichloroacetic Acid\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Atrazine", /Atrazine\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Simazine", /Simazine\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["1,4-Dioxane", /1,4-Dioxane\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Total Pharmaceuticals", /Total Pharmaceuticals\s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Quaternary Ammonium Compounds ", /Quaternary Ammonium Compounds \s*[:\-]?\s*(\d+\.?\d*)/i],
    ["Turbidity", /Turbidity\s*[:\-]?\s*(\d+\.?\d*)/i],
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
