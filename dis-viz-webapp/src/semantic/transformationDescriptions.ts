import type { TransformationType } from './semanticTypes';

/** User-facing copy for each diff classifier; keep aligned with `buildSemanticDiff` heuristics. */
export const TRANSFORMATION_COPY: Record<
  TransformationType,
  { title: string; description: string }
> = {
  unchanged_semantics_changed_layout: {
    title: 'Same semantics, different layout',
    description:
      'The abstract region kind and high-level meaning line up, but the compiler chose a different CFG shape, block split, or scheduling. Compare basic blocks and instructions on both sides.',
  },
  scalar_to_vectorized: {
    title: 'Scalar to vectorized',
    description:
      'The left side used scalar instructions; the right side shows SIMD/vector patterns in the semantic facts (e.g. vectorized loop body). Typical of auto-vectorization at higher optimization.',
  },
  not_vectorized_to_vectorized: {
    title: 'Not vectorized → vectorized',
    description:
      'Vectorization was absent or not reported on the left and appears on the right. Often the same source loop with different cost-model / pragma / unroll decisions.',
  },
  call_to_inlined: {
    title: 'Call replaced by inline body',
    description:
      'A call-site style region on one side corresponds to inlined straight-line or multi-block code on the other. Control transfers were folded into the caller.',
  },
  inlined_to_call: {
    title: 'Inline expanded back to a call',
    description:
      'The opposite of inlining: code that lived inside the caller is now executed via an outlined call (or the heuristic sees a call site on this side only).',
  },
  loop_structure_changed: {
    title: 'Loop structure changed',
    description:
      'Nesting, latch/header structure, or loop depth facts differ between matched loop regions. May come from unrolling, fusion, or different loop rotation.',
  },
  control_flow_simplified: {
    title: 'Control flow simplified',
    description:
      'Fewer branches or a simpler region shape on one side—often from if-conversion, speculation, or dead branch removal.',
  },
  memory_access_reorganized: {
    title: 'Memory access reorganized',
    description:
      'Load/store scheduling, addressing modes, or memory-region heuristics differ while the surrounding region still aligns. Common with LICM, rematerialization, or vector memory ops.',
  },
  register_reuse_increased: {
    title: 'Register reuse increased',
    description:
      'Heuristic signal that values are kept in registers across more instructions on one side—often from better allocation or fewer spills.',
  },
  partially_unrolled: {
    title: 'Partially unrolled',
    description:
      'The right side shows a loop body replicated or widened without full elimination of the loop back-edge.',
  },
  fully_unrolled: {
    title: 'Fully unrolled',
    description:
      'The loop is no longer a loop in the IR we see: the region maps to straight-line blocks only on one side.',
  },
  region_split: {
    title: 'One region became several',
    description:
      'A single semantic region on one binary was split into multiple regions on the other—often after optimization passes cut the CFG differently.',
  },
  region_merged: {
    title: 'Several regions became one',
    description:
      'Multiple regions on one side were merged into a larger region on the other, e.g. after block merging or broader detector spans.',
  },
  unmatched_region: {
    title: 'Unmatched region',
    description:
      'No confident pairing was found for this region in the other binary. It may be new code, optimized away, or below alignment confidence.',
  },
};
