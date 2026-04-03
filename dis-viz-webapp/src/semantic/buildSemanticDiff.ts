import type {
  DisvizSemanticBlob,
  SemanticDiffDocument,
  SemanticDiffFunctionResult,
  SemanticDiffUnit,
  SemanticFunctionJson,
  SemanticRegionJson,
  TransformationType,
} from './semanticTypes';

function regionSourceSpan(r: SemanticRegionJson): {
  file: string | null;
  line_start: number | null;
  line_end: number | null;
} {
  const s = r.source;
  if (!s || typeof s !== 'object') return { file: null, line_start: null, line_end: null };
  const file = typeof s.file === 'string' ? s.file : null;
  const line_start = typeof s.line_start === 'number' ? s.line_start : null;
  const line_end = typeof s.line_end === 'number' ? s.line_end : line_start;
  return { file, line_start, line_end };
}

function lineOverlapRatio(a: SemanticRegionJson, b: SemanticRegionJson): number {
  const A = regionSourceSpan(a);
  const B = regionSourceSpan(b);
  if (A.line_start == null || B.line_start == null) return 0;
  const lo = Math.max(A.line_start, B.line_start);
  const hi = Math.min(A.line_end ?? A.line_start, B.line_end ?? B.line_start);
  if (hi < lo) return 0;
  const inter = hi - lo + 1;
  const aSpan = (A.line_end ?? A.line_start) - A.line_start + 1;
  const bSpan = (B.line_end ?? B.line_start) - B.line_start + 1;
  const uni = Math.max(aSpan, bSpan, inter);
  return uni > 0 ? inter / uni : 0;
}

function kindSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a === 'loop_region' && b === 'loop_region') return 1;
  return 0;
}

function regionScore(left: SemanticRegionJson, right: SemanticRegionJson): number {
  const src = lineOverlapRatio(left, right);
  const kind = kindSimilarity(left.kind, right.kind);
  const lf = left.features?.facts as Record<string, unknown> | undefined;
  const rf = right.features?.facts as Record<string, unknown> | undefined;
  const ld = typeof lf?.loop_depth === 'number' ? lf.loop_depth : 0;
  const rd = typeof rf?.loop_depth === 'number' ? rf.loop_depth : 0;
  const depthSim = ld === rd ? 1 : 0.5;
  return 0.35 * src + 0.35 * kind + 0.2 * depthSim + 0.1 * (src > 0 ? 1 : 0);
}

function boolFact(r: SemanticRegionJson, key: string): boolean {
  const v = r.features?.facts?.[key];
  return v === true;
}

function boolHeuristic(r: SemanticRegionJson, key: string): boolean {
  const v = r.features?.heuristics?.[key];
  return v === true;
}

function classifyRegions(
  left: SemanticRegionJson,
  right: SemanticRegionJson,
  idx: number,
  fn: string
): SemanticDiffUnit {
  const spanL = regionSourceSpan(left);
  const evidence: string[] = [];
  const alternatives: { type: TransformationType; confidence: number }[] = [];

  let transformation_type: TransformationType = 'unchanged_semantics_changed_layout';
  let confidence = 0.5;

  if (left.kind === 'loop_region' && right.kind === 'loop_region') {
    const vL = boolFact(left, 'vectorized');
    const vR = boolFact(right, 'vectorized');
    const csL = boolHeuristic(left, 'compare_swap_pattern');
    const csR = boolHeuristic(right, 'compare_swap_pattern');
    if (!vL && vR && (csL || csR)) {
      transformation_type = 'scalar_to_vectorized';
      confidence = 0.88;
      evidence.push('Left loop facts.vectorized is false; right is true');
      evidence.push('Compare/swap heuristic on at least one side');
      if (spanL.line_start != null) evidence.push(`Overlapping source around lines ${spanL.line_start}–${spanL.line_end ?? spanL.line_start}`);
      alternatives.push({ type: 'memory_access_reorganized', confidence: 0.25 });
    } else if (!vL && vR) {
      transformation_type = 'not_vectorized_to_vectorized';
      confidence = 0.82;
      evidence.push('SIMD / vectorized facts appear only on the right loop region');
      alternatives.push({ type: 'scalar_to_vectorized', confidence: 0.7 });
    } else if (vL === vR && csL && csR) {
      transformation_type = 'unchanged_semantics_changed_layout';
      confidence = 0.55;
      evidence.push('Both sides vectorization flag match; compare/swap pattern on both');
    }
  }

  const strongLoopDiff =
    transformation_type === 'scalar_to_vectorized' || transformation_type === 'not_vectorized_to_vectorized';
  if (
    !strongLoopDiff &&
    left.kind === 'call_site' &&
    (right.kind === 'inlined_call_region' || boolFact(right, 'has_inline_instruction'))
  ) {
    transformation_type = 'call_to_inlined';
    confidence = 0.74;
    evidence.length = 0;
    alternatives.length = 0;
    evidence.push('Left has call_site region; right shows inlined_call_region or inline facts in a loop');
    alternatives.push({ type: 'unchanged_semantics_changed_layout', confidence: 0.2 });
  }

  if (transformation_type === 'unchanged_semantics_changed_layout' && evidence.length === 0) {
    evidence.push(`Aligned ${left.kind} ↔ ${right.kind} by source/kind score`);
    confidence = 0.4;
  }

  return {
    unit_id: `${fn}.diff.${idx}`,
    source_file: spanL.file ?? regionSourceSpan(right).file,
    source_line_start: spanL.line_start ?? regionSourceSpan(right).line_start,
    source_line_end: spanL.line_end ?? regionSourceSpan(right).line_end,
    left_region_id: left.region_id,
    right_region_id: right.region_id,
    left_kind: left.kind,
    right_kind: right.kind,
    transformation_type,
    confidence,
    evidence,
    alternatives: alternatives.length ? alternatives : undefined,
  };
}

/** Greedy one-to-one match of regions (prefer loop_region), by score threshold. */
function alignRegions(
  leftRegions: SemanticRegionJson[],
  rightRegions: SemanticRegionJson[]
): { left: SemanticRegionJson; right: SemanticRegionJson; score: number }[] {
  const pairs: { left: SemanticRegionJson; right: SemanticRegionJson; score: number }[] = [];
  const usedR = new Set<string>();

  const leftSorted = [...leftRegions].sort((a, b) => {
    const sa = regionSourceSpan(a).line_start ?? 0;
    const sb = regionSourceSpan(b).line_start ?? 0;
    return sa - sb;
  });

  for (const L of leftSorted) {
    let best: SemanticRegionJson | null = null;
    let bestScore = 0;
    for (const R of rightRegions) {
      if (usedR.has(R.region_id)) continue;
      const s = regionScore(L, R);
      if (s > bestScore) {
        bestScore = s;
        best = R;
      }
    }
    if (best && bestScore >= 0.25) {
      usedR.add(best.region_id);
      pairs.push({ left: L, right: best, score: bestScore });
    }
  }
  return pairs;
}

function functionSourceEnvelope(fn: SemanticFunctionJson): SemanticDiffFunctionResult['source_region'] {
  let minL = Infinity;
  let maxL = -Infinity;
  let file = fn.source_file || '';
  for (const r of fn.regions) {
    const sp = regionSourceSpan(r);
    if (sp.line_start != null) {
      minL = Math.min(minL, sp.line_start);
      maxL = Math.max(maxL, sp.line_end ?? sp.line_start);
      if (sp.file) file = sp.file;
    }
  }
  if (minL === Infinity) {
    return fn.source_line > 0 ? { file, line_start: fn.source_line, line_end: fn.source_line } : null;
  }
  return { file, line_start: minL, line_end: maxL };
}

export function extractSemanticBlob(data: { semantic?: DisvizSemanticBlob }): DisvizSemanticBlob | null {
  const s = data.semantic;
  if (!s || typeof s.schema_version !== 'number') return null;
  return s;
}

export function buildSemanticDiffDocument(
  leftBinary: string,
  rightBinary: string,
  leftData: { semantic?: DisvizSemanticBlob },
  rightData: { semantic?: DisvizSemanticBlob }
): SemanticDiffDocument {
  const L = extractSemanticBlob(leftData);
  const R = extractSemanticBlob(rightData);
  const functions: SemanticDiffFunctionResult[] = [];

  if (!L || !R) {
    return {
      schema_version: 1,
      left_binary: leftBinary,
      right_binary: rightBinary,
      functions: [
        {
          function: '__missing_semantic__',
          status: 'left_only',
          source_region: null,
          semantic_diff_units: [
            {
              unit_id: 'error.no_semantic_blob',
              source_file: null,
              source_line_start: null,
              source_line_end: null,
              left_region_id: null,
              right_region_id: null,
              left_kind: null,
              right_kind: null,
              transformation_type: 'unmatched_region',
              confidence: 1,
              evidence: [
                !L ? 'Left .disviz has no semantic section (re-export with current DisViz CLI).' : '',
                !R ? 'Right .disviz has no semantic section (re-export with current DisViz CLI).' : '',
              ].filter(Boolean),
            },
          ],
        },
      ],
    };
  }

  const rightByName = new Map(R.functions.map((f) => [f.name, f]));
  const leftNameSet = new Set(L.functions.map((f) => f.name));

  for (const lf of L.functions) {
    const rf = rightByName.get(lf.name);
    if (!rf) {
      functions.push({
        function: lf.name,
        status: 'left_only',
        source_region: functionSourceEnvelope(lf),
        semantic_diff_units: [],
      });
      continue;
    }
    const pairs = alignRegions(lf.regions, rf.regions);
    const units: SemanticDiffUnit[] = pairs.map((p, i) => classifyRegions(p.left, p.right, i, lf.name));
    functions.push({
      function: lf.name,
      status: 'matched',
      source_region: functionSourceEnvelope(lf),
      semantic_diff_units: units,
    });
  }

  for (const rf of R.functions) {
    if (!leftNameSet.has(rf.name)) {
      functions.push({
        function: rf.name,
        status: 'right_only',
        source_region: functionSourceEnvelope(rf),
        semantic_diff_units: [],
      });
    }
  }

  return {
    schema_version: 1,
    left_binary: leftBinary,
    right_binary: rightBinary,
    functions,
  };
}

export function downloadSemanticDiffJson(doc: SemanticDiffDocument, filename: string): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
