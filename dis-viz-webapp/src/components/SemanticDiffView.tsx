'use client';

import React, { memo, startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Tooltip } from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { selectBinarySelection } from '../features/selections/selectionsSlice';
import {
  selectSemanticCompareLeft,
  selectSemanticCompareRight,
} from '../features/binary-data/binaryDataSlice';
import * as disvizProcessor from '../disvizProcessor';
import { buildSemanticDiffDocument, extractSemanticBlob } from '../semantic/buildSemanticDiff';
import { findSemanticRegion } from '../semantic/blockDiffAnnotations';
import { TRANSFORMATION_COPY } from '../semantic/transformationDescriptions';
import type { SemanticDiffFunctionResult, SemanticDiffUnit } from '../semantic/semanticTypes';
import type { SemanticRegionJson } from '../semantic/semanticTypes';
import type { InstructionBlock, BLOCK_ORDERS, BlockPage } from '../types';
import { shortenName } from '../utils';
import DisassemblyBlock from './DisassemblyBlock';
import '../styles/disassemblyview.css';
import '../styles/semanticDiffView.css';

const MEMORY_ORDER: BLOCK_ORDERS = 'memory_order';
const SEMANTIC_DIFF_DIS_ID_LEFT = 990_001;
const SEMANTIC_DIFF_DIS_ID_RIGHT = 990_002;

function formatTransformation(t: string): string {
  return t.replace(/_/g, ' ');
}

function regionBlockCount(r: SemanticRegionJson | null): number {
  return r?.original_block_names?.length ?? 0;
}

function rowKeyFor(fnName: string, unit: SemanticDiffUnit): string {
  return `${fnName}\n${unit.unit_id}`;
}

const TransformationTooltipBody = memo(function TransformationTooltipBody({ unit }: { unit: SemanticDiffUnit }) {
  const copy = TRANSFORMATION_COPY[unit.transformation_type];
  return (
    <div style={{ maxWidth: 380, padding: 4 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{copy.title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.45, marginBottom: unit.evidence.length ? 10 : 0 }}>
        {copy.description}
      </div>
      {unit.evidence.length > 0 && (
        <>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>How this was inferred</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.4 }}>
            {unit.evidence.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </>
      )}
      {unit.alternatives && unit.alternatives.length > 0 && (
        <>
          <div style={{ fontWeight: 600, fontSize: 12, marginTop: 10, marginBottom: 4 }}>
            Other interpretations considered
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, lineHeight: 1.35, opacity: 0.95 }}>
            {unit.alternatives.map((alt, i) => (
              <li key={i}>
                {formatTransformation(alt.type)} ({(alt.confidence * 100).toFixed(0)}%)
              </li>
            ))}
          </ul>
        </>
      )}
      <div style={{ fontSize: 11, marginTop: 8, opacity: 0.85 }}>
        Confidence: {(unit.confidence * 100).toFixed(0)}%
      </div>
    </div>
  );
});

const SemanticDiffRegionDisassembly = memo(function SemanticDiffRegionDisassembly({
  filepath,
  functionName,
  region,
  allBlocks,
  pages,
  disId,
}: {
  filepath: string;
  functionName: string;
  region: SemanticRegionJson | null;
  allBlocks: InstructionBlock[];
  pages: BlockPage[];
  disId: number;
}) {
  const selections = useAppSelector(selectBinarySelection);
  const selectedAddresses = useMemo(
    () => selections.find((s) => s.binary_file === filepath)?.addresses ?? [],
    [selections, filepath]
  );
  const disassemblyBlockRefs = useRef<{
    [start_address: number]: { div: HTMLDivElement; idx: number };
  }>({});

  if (!region) {
    return (
      <div className="semantic-diff-card semantic-diff-card--empty">
        <div className="semantic-diff-card-id">—</div>
        <div className="semantic-diff-subkind">No matched region</div>
      </div>
    );
  }

  const { regionBlocks, missing } = useMemo(() => {
    const names = new Set(region.original_block_names ?? []);
    const rb = allBlocks.filter((b) => b.function_name === functionName && names.has(b.name));
    const found = new Set(rb.map((b) => b.name));
    const miss = (region.original_block_names ?? []).filter((n) => !found.has(n));
    return { regionBlocks: rb, missing: miss };
  }, [allBlocks, functionName, region.original_block_names]);

  const src = region.source;
  const srcHint =
    src && typeof src.line_start === 'number'
      ? `${src.file ? shortenName(src.file, 40) : '?'} :${src.line_start}${src.line_end != null && src.line_end !== src.line_start ? `–${src.line_end}` : ''}`
      : null;

  return (
    <div className="semantic-diff-card">
      <div className="semantic-diff-region-meta">
        <span className="semantic-diff-kind">{region.kind}</span>
        {region.subkind ? <span className="semantic-diff-subkind">{region.subkind}</span> : null}
        <div className="semantic-diff-card-id" title={region.region_id}>
          {region.region_id}
        </div>
        {srcHint ? <div className="semantic-diff-subkind">{srcHint}</div> : null}
      </div>
      <div className="semantic-diff-block-list">
        {regionBlocks.map((block) => {
          const i = allBlocks.findIndex(
            (b) => b.name === block.name && b.start_address === block.start_address
          );
          if (i < 0) return null;
          const addressSelection = block.instructions.map((ins) => selectedAddresses.includes(ins.address));
          return (
            <DisassemblyBlock
              key={`${block.name}-${block.start_address}`}
              binaryFilePath={filepath}
              block={block}
              i={i}
              allBlocks={allBlocks}
              id={disId}
              pages={pages}
              disassemblyBlockRefs={disassemblyBlockRefs}
              addressSelection={addressSelection}
              backedgeTargets={[]}
              drawPseudo="full"
              blockOrder={MEMORY_ORDER}
            />
          );
        })}
        {missing.map((name) => (
          <div key={name} className="semantic-diff-block-missing">
            Not found in disassembly: {name}
          </div>
        ))}
      </div>
    </div>
  );
});

function TransformationPill({ unit }: { unit: SemanticDiffUnit }) {
  return (
    <Tooltip
      title={<TransformationTooltipBody unit={unit} />}
      placement="left"
      enterDelay={200}
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 420,
            bgcolor: '#fff',
            color: '#252525',
            border: '1px solid #ccc',
            boxShadow: 2,
          },
        },
      }}
    >
      <span className="semantic-diff-transform semantic-diff-transform--hoverable">
        {formatTransformation(unit.transformation_type)}
      </span>
    </Tooltip>
  );
}

function SemanticDiffUnitRow({
  fn,
  unit,
  leftReg,
  rightReg,
  leftPath,
  rightPath,
  expanded,
  onExpand,
  onCollapse,
}: {
  fn: SemanticDiffFunctionResult;
  unit: SemanticDiffUnit;
  leftReg: SemanticRegionJson | null;
  rightReg: SemanticRegionJson | null;
  leftPath: string;
  rightPath: string;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}) {
  const nL = regionBlockCount(leftReg);
  const nR = regionBlockCount(rightReg);

  const leftAsm = useMemo(() => {
    if (!expanded) return null;
    return disvizProcessor.getSemanticDiffAssemblyContext(leftPath, MEMORY_ORDER);
  }, [expanded, leftPath]);

  const rightAsm = useMemo(() => {
    if (!expanded) return null;
    return disvizProcessor.getSemanticDiffAssemblyContext(rightPath, MEMORY_ORDER);
  }, [expanded, rightPath]);

  if (!expanded) {
    return (
      <button type="button" className="semantic-diff-row-toggle" onClick={() => startTransition(onExpand)}>
        <span className="semantic-diff-row-toggle-main">
          <code className="semantic-diff-row-unit-id">{shortenName(unit.unit_id, 36)}</code>
          <span className="semantic-diff-row-kinds">
            <span title="Left region">{leftReg?.kind ?? '—'}</span>
            <span className="semantic-diff-arrow-inline">→</span>
            <span title="Right region">{rightReg?.kind ?? '—'}</span>
          </span>
          <span className="semantic-diff-row-blocks">
            {nL} block{nL === 1 ? '' : 's'} · {nR} block{nR === 1 ? '' : 's'}
          </span>
        </span>
        <span className="semantic-diff-row-toggle-right">
          <TransformationPill unit={unit} />
          <span className="semantic-diff-row-chevron">Show disassembly ▾</span>
        </span>
      </button>
    );
  }

  if (!leftAsm || !rightAsm) {
    return null;
  }

  return (
    <div className="semantic-diff-row-expanded-wrap">
      <div className="semantic-diff-row-expanded-toolbar">
        <button type="button" className="semantic-diff-collapse-btn" onClick={() => startTransition(onCollapse)}>
          ▴ Collapse
        </button>
        <TransformationPill unit={unit} />
        <span className="semantic-diff-confidence">conf {(unit.confidence * 100).toFixed(0)}%</span>
      </div>
      <div className="semantic-diff-row">
        <SemanticDiffRegionDisassembly
          filepath={leftPath}
          functionName={fn.function}
          region={leftReg}
          allBlocks={leftAsm.allBlocks}
          pages={leftAsm.pages}
          disId={SEMANTIC_DIFF_DIS_ID_LEFT}
        />
        <div className="semantic-diff-center">
          <span className="semantic-diff-arrow" aria-hidden>
            →
          </span>
          <div className="semantic-diff-transform semantic-diff-transform--static">
            {formatTransformation(unit.transformation_type)}
          </div>
          <div className="semantic-diff-confidence">conf {(unit.confidence * 100).toFixed(0)}%</div>
        </div>
        <SemanticDiffRegionDisassembly
          filepath={rightPath}
          functionName={fn.function}
          region={rightReg}
          allBlocks={rightAsm.allBlocks}
          pages={rightAsm.pages}
          disId={SEMANTIC_DIFF_DIS_ID_RIGHT}
        />
      </div>
    </div>
  );
}

export default function SemanticDiffView() {
  const leftPath = useAppSelector(selectSemanticCompareLeft);
  const rightPath = useAppSelector(selectSemanticCompareRight);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    setExpandedKey(null);
  }, [leftPath, rightPath]);

  const payload = useMemo(() => {
    if (!leftPath || !rightPath) return { kind: 'no_pair' as const };
    const leftData = disvizProcessor.getDisvizData(leftPath) ?? {};
    const rightData = disvizProcessor.getDisvizData(rightPath) ?? {};
    const L = extractSemanticBlob(leftData);
    const R = extractSemanticBlob(rightData);
    if (!L || !R) return { kind: 'no_semantic' as const, leftHas: !!L, rightHas: !!R };
    const doc = buildSemanticDiffDocument(leftPath, rightPath, leftData, rightData);
    return { kind: 'ok' as const, doc, L, R };
  }, [leftPath, rightPath]);

  const functionsWithUnits = useMemo(() => {
    if (payload.kind !== 'ok') return [];
    return payload.doc.functions.filter((f) => f.semantic_diff_units.length > 0);
  }, [payload]);

  const totalUnits = useMemo(
    () => functionsWithUnits.reduce((acc, f) => acc + f.semantic_diff_units.length, 0),
    [functionsWithUnits]
  );

  if (payload.kind === 'no_pair') {
    return (
      <div className="semantic-diff-root" style={{ padding: 24 }}>
        <Alert severity="info">
          Choose a left and right binary in the <strong>Input File</strong> tab, then open this view again.
        </Alert>
      </div>
    );
  }

  if (payload.kind === 'no_semantic') {
    return (
      <div className="semantic-diff-root" style={{ padding: 24 }}>
        <Alert severity="warning">
          One or both files lack a <code>semantic</code> section. Re-run DisViz on debug binaries to emit semantic
          data.
          {!payload.leftHas && <div>Missing semantic: left</div>}
          {!payload.rightHas && <div>Missing semantic: right</div>}
        </Alert>
      </div>
    );
  }

  const { doc } = payload;

  return (
    <div className="semantic-diff-root">
      <div className="semantic-diff-scroll">
        {totalUnits > 0 ? (
          <p className="semantic-diff-hint">
            {totalUnits} diff unit{totalUnits === 1 ? '' : 's'}. Expand one row at a time to load disassembly (keeps the
            tab responsive on large binaries).
          </p>
        ) : null}
        {doc.functions.length === 0 ? (
          <Alert severity="info">No functions to compare.</Alert>
        ) : functionsWithUnits.length === 0 ? (
          <Alert severity="info">No semantic diff units to show for this pair.</Alert>
        ) : (
          functionsWithUnits.map((fn) => (
            <section key={fn.function} className="semantic-diff-fn">
              <h2 className="semantic-diff-fn-title">{fn.function}</h2>
              {fn.semantic_diff_units.map((unit) => {
                const key = rowKeyFor(fn.function, unit);
                const leftReg = findSemanticRegion(payload.L, fn.function, unit.left_region_id);
                const rightReg = findSemanticRegion(payload.R, fn.function, unit.right_region_id);
                return (
                  <SemanticDiffUnitRow
                    key={key}
                    fn={fn}
                    unit={unit}
                    leftReg={leftReg}
                    rightReg={rightReg}
                    leftPath={leftPath!}
                    rightPath={rightPath!}
                    expanded={expandedKey === key}
                    onExpand={() => setExpandedKey(key)}
                    onCollapse={() => setExpandedKey((k) => (k === key ? null : k))}
                  />
                );
              })}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
