import type { DisvizSemanticBlob, SemanticRegionJson } from './semanticTypes';

export function findSemanticRegion(
  semantic: DisvizSemanticBlob,
  functionName: string,
  regionId: string | null
): SemanticRegionJson | null {
  if (!regionId) return null;
  const fn = semantic.functions.find((f) => f.name === functionName);
  if (!fn) return null;
  return fn.regions.find((r) => r.region_id === regionId) ?? null;
}
