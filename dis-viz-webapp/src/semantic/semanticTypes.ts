/** Diff-side vocabulary (not embedded in .disviz). Keep in sync with buildSemanticDiff heuristics. */
export const TRANSFORMATION_TYPES = [
  'unchanged_semantics_changed_layout',
  'scalar_to_vectorized',
  'not_vectorized_to_vectorized',
  'call_to_inlined',
  'inlined_to_call',
  'loop_structure_changed',
  'control_flow_simplified',
  'memory_access_reorganized',
  'register_reuse_increased',
  'partially_unrolled',
  'fully_unrolled',
  'region_split',
  'region_merged',
  'unmatched_region',
] as const;

export type TransformationType = (typeof TRANSFORMATION_TYPES)[number];

/** CLI `semantic` object (schema_version 1). */
export interface SemanticRegionJson {
  region_id: string;
  kind: string;
  subkind: string | null;
  canonical_block_ids: string[];
  original_block_names: string[];
  source: {
    file?: string | null;
    line_start?: number;
    line_end?: number;
  } | null;
  loop_name?: string;
  features: {
    facts: Record<string, unknown>;
    heuristics: Record<string, unknown>;
  };
}

export interface SemanticFunctionJson {
  name: string;
  source_file: string;
  source_line: number;
  variable_role_hints: {
    facts: Record<string, unknown>;
    heuristics: Record<string, unknown>;
  };
  loop_signatures: unknown[];
  regions: SemanticRegionJson[];
}

export interface DisvizSemanticBlob {
  schema_version: number;
  vocabulary: { region_kinds: string[] };
  functions: SemanticFunctionJson[];
}

export interface SemanticDiffAlternative {
  type: TransformationType;
  confidence: number;
}

export interface SemanticDiffUnit {
  unit_id: string;
  source_file: string | null;
  source_line_start: number | null;
  source_line_end: number | null;
  left_region_id: string | null;
  right_region_id: string | null;
  left_kind: string | null;
  right_kind: string | null;
  transformation_type: TransformationType;
  confidence: number;
  evidence: string[];
  alternatives?: SemanticDiffAlternative[];
}

export interface SemanticDiffFunctionResult {
  function: string;
  status: 'matched' | 'left_only' | 'right_only';
  source_region: {
    file: string;
    line_start: number;
    line_end: number;
  } | null;
  semantic_diff_units: SemanticDiffUnit[];
}

export interface SemanticDiffDocument {
  schema_version: 1;
  left_binary: string;
  right_binary: string;
  functions: SemanticDiffFunctionResult[];
}
