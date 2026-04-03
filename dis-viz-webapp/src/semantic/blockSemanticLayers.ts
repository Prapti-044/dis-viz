import { getDisvizData } from '../disvizProcessor';
import { extractSemanticBlob } from './buildSemanticDiff';
import type { SemanticRegionJson } from './semanticTypes';

/** One semantic region from the CLI that covers a basic block (abstract layer: loop, entry, call, …). */
export interface BlockSemanticLayerAnnotation {
  function_name: string;
  region_id: string;
  kind: string;
  subkind: string | null;
  loop_name?: string;
  source_line_start: number | null;
  source_line_end: number | null;
  /** Short human-readable fact/heuristic hints for tooltips */
  factLabels: string[];
}

function collectFactLabels(r: SemanticRegionJson): string[] {
  const out: string[] = [];
  const facts = r.features?.facts ?? {};
  if (facts.vectorized === true) out.push('vectorized');
  if (facts.has_call === true) out.push('call');
  if (facts.has_inline === true) out.push('inline');
  if (facts.has_inline_instruction === true) out.push('inline (instr.)');
  if (typeof facts.loop_depth === 'number') out.push(`loop depth ${facts.loop_depth}`);
  if (typeof facts.n_blocks === 'number') out.push(`${facts.n_blocks} block(s)`);
  const heur = r.features?.heuristics ?? {};
  if (heur.compare_swap_pattern === true) out.push('compare-swap (heuristic)');
  return out;
}

/**
 * Map basic block name → all semantic regions that list this block in `original_block_names`.
 * Requires embedded `semantic` from current DisViz CLI.
 */
export function buildSemanticLayersForBinary(viewPath: string): Map<string, BlockSemanticLayerAnnotation[]> | null {
  const data = getDisvizData(viewPath);
  const sem = extractSemanticBlob(data ?? {});
  if (!sem) return null;

  const map = new Map<string, BlockSemanticLayerAnnotation[]>();
  for (const fn of sem.functions) {
    for (const r of fn.regions) {
      const ann: BlockSemanticLayerAnnotation = {
        function_name: fn.name,
        region_id: r.region_id,
        kind: r.kind,
        subkind: r.subkind,
        loop_name: r.loop_name,
        source_line_start:
          r.source && typeof r.source.line_start === 'number' ? r.source.line_start : null,
        source_line_end:
          r.source && typeof r.source.line_end === 'number' ? r.source.line_end : null,
        factLabels: collectFactLabels(r),
      };
      for (const bn of r.original_block_names) {
        const arr = map.get(bn) ?? [];
        arr.push(ann);
        map.set(bn, arr);
      }
    }
  }
  return map;
}

/** Distinct color per region kind for chips / strip. */
export function semanticLayerColor(kind: string): string {
  switch (kind) {
    case 'function_entry':
      return '#6a1b9a';
    case 'loop_region':
      return '#2e7d32';
    case 'loop_header':
      return '#00838f';
    case 'call_site':
      return '#1565c0';
    case 'inlined_call_region':
      return '#e65100';
    case 'return_region':
      return '#5d4037';
    case 'straightline_compute_region':
      return '#455a64';
    case 'memory_access_region':
      return '#c62828';
    case 'branch_region':
      return '#6d4c41';
    default:
      return '#616161';
  }
}

export function semanticLayerChipLabel(kind: string, subkind: string | null): string {
  const abbrev: Record<string, string> = {
    function_entry: 'entry',
    loop_region: 'loop',
    loop_header: 'loop-hdr',
    call_site: 'call',
    inlined_call_region: 'inlined',
    return_region: 'return',
    straightline_compute_region: 'straight',
    memory_access_region: 'mem',
    branch_region: 'branch',
  };
  const base = abbrev[kind] ?? kind.replace(/_/g, ' ');
  if (subkind && subkind !== 'generic_loop') {
    const sk = subkind.replace(/_/g, ' ');
    return sk.length > 18 ? `${base}: ${sk.slice(0, 16)}…` : `${base}: ${sk}`;
  }
  return base.length > 22 ? `${base.slice(0, 20)}…` : base;
}

export function semanticLayerTooltip(ann: BlockSemanticLayerAnnotation): string {
  const lines = [
    `${ann.function_name}`,
    `${ann.kind}${ann.subkind ? ` · ${ann.subkind}` : ''}`,
    ann.loop_name ? `Loop: ${ann.loop_name}` : '',
    ann.source_line_start != null
      ? `Source lines: ${ann.source_line_start}${
          ann.source_line_end != null && ann.source_line_end !== ann.source_line_start
            ? `–${ann.source_line_end}`
            : ''
        }`
      : '',
    ann.factLabels.length ? `Signals: ${ann.factLabels.join(', ')}` : '',
    `region_id: ${ann.region_id}`,
  ];
  return lines.filter(Boolean).join('\n');
}
