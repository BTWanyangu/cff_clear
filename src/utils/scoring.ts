export function computeWaterMainScore({ ageYears, material, upgradedPct }: { ageYears?: number; material?: string; upgradedPct?: number }) {
  // 1.0 -> 5.0
  let ageScore = 5 - Math.min(4, Math.max(0, (ageYears ?? 0) / 20));
  const materialMap: Record<string, number> = {
    lead: -2.0,
    galvanized: -1.0,
    cast_iron: -0.5,
    ductile_iron: 0.2,
    pvc: 0.8,
    hdpe: 1.0,
    copper: 0.6,
    unknown: 0
  };
  const matAdj = materialMap[material ?? "unknown"] ?? 0;
  const upgradeAdj = ((upgradedPct ?? 0) / 100) * 1.0;
  const raw = ageScore + matAdj + upgradeAdj;
  return Number(Math.min(5, Math.max(1, Number(raw.toFixed(1)))));
}

export function computeClearScore(parsedValues: Record<string, number>, limits: Record<string, number>) {
  let score = 5.0;
  const penalties: string[] = [];
  for (const [k, v] of Object.entries(parsedValues || {})) {
    const lim = limits[k] ?? null;
    if (lim != null && v > lim) {
      score -= 0.5; // penalty per exceeded limit (tweakable)
      penalties.push(`${k} > limit (${v} > ${lim})`);
    }
  }
  return { score: Math.max(1, Number(score.toFixed(1))), penalties };
}
