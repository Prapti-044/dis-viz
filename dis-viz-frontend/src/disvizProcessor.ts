import * as pako from 'pako';
import * as tar from 'tar-stream';
import * as dagre from 'dagre';
import { BlockPage, SourceFile, InstructionBlock, BLOCK_ORDERS, SourceLine, Hidable, InlineEntry } from './types';
import { MinimapType } from './features/minimap/minimapSlice';
import { Selection } from './features/selections/selectionsSlice';
import { INSTRUCTION_TAGS, SOURCE_TAGS } from './utils';

// Interface for the JSON structure in .disviz files

const PAGE_SIZE = 500; // TODO: Make Smooth Scrolling like RecyclerView

interface InstructionData {
    address: number;
    flags: (typeof INSTRUCTION_TAGS)[number]['id'][];
    instruction: string;
    correspondence: {
        [source_file: string]: number[];
    };
}

interface MinimapData {
    block_heights: number[];
    block_loop_indents: number[];
    block_start_address: number[];
    block_types: ("memory_read" | "memory_write" | "call" | "vectorized" | "normal" | "hoisted" | "inline")[]; // TODO: Fix backend to send INSTRUCTION_TAGS[].id[];
    built_in_block: boolean[];
}

interface BlockData {
    backedges: string[];
    block_type: "normal" | "pseudoloop";
    end_address: number;
    function_name: string;
    instructions: InstructionData[];
    is_loop_header: boolean;
    loops: {
        name: string;
        loop_count: number;
        loop_total: number;
    }[];
    n_instructions: number;
    name: string;
    next_block_numbers: string[];
    start_address: number;
    hidables: Hidable[];
}

interface InlineEntryData {
  name: string;
  simplified_name: string;
  callsite_file: string;
  callsite_line: number;
  ranges: { start: number; end: number }[];
  children?: InlineEntryData[];
}

interface SourceCodeInfo {
  file: string;
  copied_path: string | null;
  total_lines: number;
  lines: {
    line: number;
    flags: (typeof SOURCE_TAGS)[number]['id'][];
    correspondences: number[];
    inline_tree: InlineEntryData[];
  }[];
}

interface DisvizMetadata {
  architecture: string;
  compiler: string;
  date: string;
  flags: string[];
  time: string;
}

interface VariableLocation {
  start: string;
  end: string;
  location: string;
}

interface VariableInfo {
  name: string;
  file: string;
  line: number;
  locations: VariableLocation[];
  var_type: "local" | "param";
}

interface CallInfo {
  address: number;
  target: number;
  target_func_names: string[];
}

interface LoopBackedge {
  from: string;
  to: string;
}

interface LoopInfo {
  name: string;
  header_block: string;
  latch_block: string;
  blocks: string[];
  backedges: LoopBackedge[];
  loops?: LoopInfo[];
}

interface HidableInfo {
  name: string;
  start: number;
  end: number;
}

interface FunctionInfo {
  name: string;
  entry: number;
  basic_blocks: string[];
  local_vars: VariableInfo[];
  params: VariableInfo[];
  calls: CallInfo[];
  inlines: InlineEntryData[];
  loops: LoopInfo[];
  hidables: HidableInfo[];
  is_builtin: boolean;
}

// Call Graph Types
export interface CallGraphNode {
  id: string;
  name: string;
  entry: number;
  isExternal: boolean;
  isBuiltIn: boolean;
  callCount: number;
  level: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CallGraphEdge {
  id: string;
  source: string;
  target: string;
  callAddress: number;
  targetAddress: number;
  isExternal: boolean;
  callCount: number;
  points?: Array<{ x: number; y: number }>; // Control points for curved edges
}

export interface CallGraph {
  nodes: CallGraphNode[];
  edges: CallGraphEdge[];
  externalFunctions: Set<string>;
  maxLevel: number;
  totalFunctions: number;
}

interface DisvizData {
  disassembly: {
    memory_order_blocks: BlockData[];
    loop_order_blocks: BlockData[];
  };
  minimap: {
    memory_order: MinimapData;
    loop_order: MinimapData;
  };
  source_code_info: SourceCodeInfo[];
  functionInfos: FunctionInfo[];
  metadata?: DisvizMetadata;
}

// Global storage for loaded .disviz files
interface LoadedDisvizFile {
  name: string;
  data: DisvizData;
  sourceFiles: Map<string, string>; // Maps source file paths to content
  addressRange: { start: number; end: number };
  memoryOrderPages: BlockData[][];
  loopOrderPages: BlockData[][];
}

const loadedFiles: Map<string, LoadedDisvizFile> = new Map();

// Track the order of loaded files for drag and drop
let fileOrder: string[] = [];

// Function to extract tar.gz content
async function extractTarGz(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const files = new Map<string, Uint8Array>();
  
  // Decompress gzip
  const decompressed = pako.ungzip(new Uint8Array(buffer));
  
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    
    extract.on('entry', (header, stream, next) => {
      const chunks: Uint8Array[] = [];
      
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        const content = new Uint8Array(
          chunks.reduce((total, chunk) => total + chunk.length, 0)
        );
        let offset = 0;
        for (const chunk of chunks) {
          content.set(chunk, offset);
          offset += chunk.length;
        }
        files.set(header.name, content);
        next();
      });
      
      stream.resume();
    });
    
    extract.on('finish', () => {
      resolve(files);
    });
    
    extract.on('error', reject);
    
    extract.write(decompressed);
    extract.end();
  });
}

// Function to load and process .disviz files
export async function loadDisvizFile(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const extractedFiles = await extractTarGz(buffer);
    
    // Get data.json
    const dataJsonBytes = extractedFiles.get('data.json');
    if (!dataJsonBytes) {
      throw new Error('data.json not found in .disviz file');
    }
    
    const dataJsonText = new TextDecoder().decode(dataJsonBytes);
    const data: DisvizData = JSON.parse(dataJsonText);
    
    // Extract source files
    const sourceFiles = new Map<string, string>();
    for (const [path, content] of Array.from(extractedFiles)) {
      if (path.startsWith('sources/')) {
        const text = new TextDecoder().decode(content);
        sourceFiles.set(path, text);
      }
    }
    
    // Calculate address range
    let minAddress = Number.MAX_SAFE_INTEGER;
    let maxAddress = Number.MIN_SAFE_INTEGER;
    
    for (const block of [...data.disassembly.memory_order_blocks, ...data.disassembly.loop_order_blocks]) {
      if (block.start_address < minAddress) minAddress = block.start_address;
      if (block.end_address > maxAddress) maxAddress = block.end_address;
    }
    
    // Pre-compute pages for both orders
    const memoryOrderPages: BlockData[][] = [];
    for (let i = 0; i < data.disassembly.memory_order_blocks.length; i += PAGE_SIZE) {
      memoryOrderPages.push(data.disassembly.memory_order_blocks.slice(i, i + PAGE_SIZE));
    }
    
    const loopOrderPages: BlockData[][] = [];
    for (let i = 0; i < data.disassembly.loop_order_blocks.length; i += PAGE_SIZE) {
      loopOrderPages.push(data.disassembly.loop_order_blocks.slice(i, i + PAGE_SIZE));
    }
    
    let fileName = file.name.replace('.disviz', '');
    
    // If file with same name exists, append number
    let counter = 1;
    let originalName = fileName;
    while (loadedFiles.has(fileName)) {
      fileName = `${originalName}(${counter})`;
      counter++;
    }
    
    loadedFiles.set(fileName, {
      name: fileName,
      data,
      sourceFiles,
      addressRange: { start: minAddress, end: maxAddress },
      memoryOrderPages,
      loopOrderPages
    });
    
    // Add to file order if not already present
    if (!fileOrder.includes(fileName)) {
      fileOrder.push(fileName);
    }
    
    return fileName;
  } catch (error) {
    console.error('Error loading .disviz file:', error);
    throw error;
  }
}

// Get list of loaded binary files
export function getBinaryList(): Array<{ executable_path: string; name: string }> {
  return Array.from(loadedFiles.keys()).map(name => ({
    executable_path: name,
    name: name
  }));
}

// Get source files for a binary
export function getSourceFiles(filepath: string): string[] {
  const file = loadedFiles.get(filepath);
  if (!file) return [];
  
  return file.data.source_code_info.map(info => info.file);
}

// Get minimap data
export function getMinimapData(filepath: string, order: BLOCK_ORDERS): MinimapType {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  const minimapData = file.data.minimap[order];
  return {
    blockHeights: minimapData.block_heights,
    builtInBlock: minimapData.built_in_block,
    blockStartAddress: minimapData.block_start_address,
    blockLoopIndents: minimapData.block_loop_indents,
    blockTypes: minimapData.block_types,
  };
}

// Get address range
export function getAddressRange(filepath: string): { start: number; end: number } {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  return file.addressRange;
}

// Get metadata for a loaded file
export function getFileMetadata(filepath: string): DisvizMetadata | null {
  const file = loadedFiles.get(filepath);
  if (!file) return null;
  
  return file.data.metadata || null;
}

export function getSourceLines(binaryFiles: string[], sourceFile: string): SourceFile {
  let copiedPath: string | null = null;
  let file: string | null = null;
  let total_lines: number | null = null;
  let lines: {
    line: number;
    flags: { [binaryFilePath: string]: (typeof SOURCE_TAGS)[number]['id'][] };
    correspondences: { [binaryFilePath: string]: number[] };
    inline_tree: { [binaryFilePath: string]: InlineEntryData[] };
  }[] = [];

  for (const binaryFileName of binaryFiles) {
    const binaryFile = loadedFiles.get(binaryFileName);
    if (binaryFile) {
      const info = binaryFile.data.source_code_info.find(s => s.file === sourceFile);
      if (info) {
        if (!copiedPath) {
          copiedPath = info.copied_path;
        }
        if (!file) {
          file = info.file;
        }
        if (!total_lines) {
          total_lines = info.total_lines;
        }
        if (lines.length === 0) {
          lines = info.lines.map(line => ({
            line: line.line,
            correspondences: { [binaryFileName]: line.correspondences },
            flags: { [binaryFileName]: line.flags },
            inline_tree: { [binaryFileName]: line.inline_tree || [] }
          }));
        } else {
          for (const infoLine of info.lines) {
            const existingLine = lines.find(l => l.line === infoLine.line);
            if (existingLine) {
              existingLine.correspondences[binaryFileName] = infoLine.correspondences;
              existingLine.flags[binaryFileName] = infoLine.flags;
              existingLine.inline_tree[binaryFileName] = infoLine.inline_tree || [];
            } else {
              lines.push({
                line: infoLine.line,
                correspondences: { [binaryFileName]: infoLine.correspondences },
                flags: { [binaryFileName]: infoLine.flags },
                inline_tree: { [binaryFileName]: infoLine.inline_tree || [] }
              });
            }
          }
        }
      }
    }
  }
  
  if (!file || !total_lines || !copiedPath) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }
  
  // Get the actual source file content
  let sourceContent = '';
  for (const binaryFileName of binaryFiles) {
    const binaryFile = loadedFiles.get(binaryFileName);
    if (binaryFile && binaryFile.sourceFiles.has(copiedPath)) {
      sourceContent = binaryFile.sourceFiles.get(copiedPath)!;
      break;
    }
  }
  
  const sourceLines = sourceContent.split('\n').map((lineContent, index) => {
    const lineNo = index + 1;
    const lineInfo = lines.find(l => l.line === lineNo);
    if (lineInfo) {
      // Convert inline tree data
      const inlineTreeConverted: { [binaryFilePath: string]: InlineEntry[] } = {};
      console.log(lineInfo)
      for (const [binaryFile, inlineData] of Object.entries(lineInfo.inline_tree)) {
        inlineTreeConverted[binaryFile] = inlineData.map(convertInlineEntryData);
      }
      
      return new SourceLine(
        lineContent, 
        lineInfo.correspondences, 
        lineInfo.flags,
        inlineTreeConverted
      );
    }
    else {
      return new SourceLine(
        lineContent,
        Object.fromEntries(binaryFiles.map(f => [f, []])),
        Object.fromEntries(binaryFiles.map(f => [f, []])),
        Object.fromEntries(binaryFiles.map(f => [f, []]))
      );
    }
  });
  
  return new SourceFile(sourceLines);
}

// Helper function to convert InlineEntryData to InlineEntry
function convertInlineEntryData(data: InlineEntryData): InlineEntry {
  return new InlineEntry(
    data.name,
    data.simplified_name,
    data.callsite_file,
    data.callsite_line,
    data.ranges,
    data.children?.map(child => convertInlineEntryData(child)) || []
  );
}

// Convert block data to InstructionBlock instances
function convertToInstructionBlock(blockData: BlockData): InstructionBlock {
  const instructions = blockData.instructions.map(inst => ({
    instruction: inst.instruction,
    address: inst.address,
    variables: [],
    correspondence: inst.correspondence || {},
    flags: inst.flags || []
  }));
  
  return new InstructionBlock(
    blockData.name,
    instructions,
    blockData.function_name,
    blockData.start_address,
    blockData.end_address,
    blockData.n_instructions,
    blockData.next_block_numbers,
    blockData.hidables || [],
    blockData.loops || [],
    blockData.block_type,
    blockData.backedges || [],
    blockData.is_loop_header || false
  );
}

// Get disassembly page
export function getDisassemblyPage(filepath: string, pageNo: number, order: BLOCK_ORDERS): BlockPage {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  const pages = order === 'memory_order' ? file.memoryOrderPages : file.loopOrderPages;
  
  if (pageNo >= pages.length || pageNo < 0) {
    throw new Error(`Page ${pageNo} is out of range. Available pages: 0-${pages.length - 1}`);
  }
  
  const pageBlocks = pages[pageNo].map(convertToInstructionBlock);
  
  // Calculate page address range
  let startAddress = Number.MAX_SAFE_INTEGER;
  let endAddress = Number.MIN_SAFE_INTEGER;
  let totalInstructions = 0;
  
  for (const block of pageBlocks) {
    if (block.start_address < startAddress) startAddress = block.start_address;
    if (block.end_address > endAddress) endAddress = block.end_address;
    totalInstructions += block.n_instructions;
  }
  
  return new BlockPage(
    pageBlocks,
    pageNo,
    pageNo === pages.length - 1,
    startAddress,
    endAddress,
    totalInstructions
  );
}

// Get single disassembly block by name
export function getDisassemblyBlock(filepath: string, blockId: string, order: BLOCK_ORDERS): InstructionBlock {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  const blocks = file.data.disassembly[`${order}_blocks`];
  const blockData = blocks.find(b => b.name === blockId);
  
  if (!blockData) throw new Error(`Block not found: ${blockId}`);
  
  return convertToInstructionBlock(blockData);
}

// Get disassembly page by address
export function getDisassemblyPageByAddress(filepath: string, startAddress: number, order: BLOCK_ORDERS): BlockPage {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  const pages = order === 'memory_order' ? file.memoryOrderPages : file.loopOrderPages;

  // Find which page contains the address
  const pageIndex = pages.findIndex(pageBlocks => 
    pageBlocks.some(block => block.start_address <= startAddress && startAddress <= block.end_address)
  );

  if (pageIndex === -1) {
    throw new Error(`No block found containing address: ${startAddress}`);
  }

  const pageBlocks = pages[pageIndex].map(convertToInstructionBlock);

  // Calculate page address range
  let pageStartAddress = Number.MAX_SAFE_INTEGER;
  let pageEndAddress = Number.MIN_SAFE_INTEGER;
  let totalInstructions = 0;
  
  for (const block of pageBlocks) {
    if (block.start_address < pageStartAddress) pageStartAddress = block.start_address;
    if (block.end_address > pageEndAddress) pageEndAddress = block.end_address;
    totalInstructions += block.n_instructions;
  }

  return new BlockPage(
    pageBlocks,
    pageIndex,
    pageIndex === pages.length - 1,
    pageStartAddress,
    pageEndAddress,
    totalInstructions
  );
}

// Get disassembly block by address
export function getDisassemblyBlockByAddress(filepath: string, order: BLOCK_ORDERS, blockStartAddress: number): InstructionBlock {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  const blocks = file.data.disassembly[`${order}_blocks`];
  const blockData = blocks.find(b => b.start_address === blockStartAddress);
  
  if (!blockData) throw new Error(`Block not found at address: ${blockStartAddress}`);
  
  return convertToInstructionBlock(blockData);
}

// Get source file correspondences from binary address
export function getSourceFromBinary(binary_file: string, address: number): { [source_file: string]: number[] } {
  const file = loadedFiles.get(binary_file);
  if (!file) throw new Error(`File not found: ${binary_file}`);
  
  const result: { [source_file: string]: number[] } = {};
  
  // Look through all blocks to find instructions at this address
  for (const block of file.data.disassembly.memory_order_blocks) {
    const instruction = block.instructions?.find(inst => inst.address === address);
    if (instruction && instruction.correspondence) {
      for (const [sourceFile, lineNumbers] of Object.entries(instruction.correspondence)) {
        if (!result[sourceFile]) result[sourceFile] = [];
        result[sourceFile].push(...(lineNumbers as number[]));
      }
    }
  }
  
  return result;
}

// Get binary addresses from source file line
export function getSourceLinesFromBinary(binary_paths: string[], source_file: string, line_no: number): { [binary_path: string]: number[] } {
  const result: { [binary_path: string]: number[] } = {};
  
  for (const binaryPath of binary_paths) {
    const file = loadedFiles.get(binaryPath);
    if (!file) continue;
    
    const sourceInfo = file.data.source_code_info.find(s => s.file === source_file);
    if (sourceInfo) {
      const lineInfo = sourceInfo.lines.find(l => l.line === line_no);
      if (lineInfo) {
        result[binaryPath] = lineInfo.correspondences || [];
      }
    }
  }
  
  return result;
}

export function downloadDisassembly(filepath: string, includeAddresses: boolean): Blob {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  // Generate a text representation of the disassembly
  let content = `Disassembly of ${filepath}\n\n`;
  
  for (const block of file.data.disassembly.memory_order_blocks) {
    content += `Block: ${block.name} (${block.function_name})\n`;
    if (includeAddresses) {
      content += `Address Range: 0x${block.start_address.toString(16)} - 0x${block.end_address.toString(16)}\n`;
    }
    content += `Instructions:\n`;
    
    for (const inst of block.instructions || []) {
      if (includeAddresses) {
        content += `  0x${inst.address.toString(16)}: ${inst.instruction}\n`;
      } else {
        content += `  ${inst.instruction}\n`;
      }
    }
    content += '\n';
  }
  
  return new Blob([content], { type: 'text/plain' });
}

// Get selection from binary (placeholder for complex selection logic)
export function getSelectionFromBinary_indirect(
  binary_file: string, 
  addresses: number[], 
  other_binary_files: string[], 
  order: BLOCK_ORDERS
): Selection {
  // This would need to be implemented based on the Selection interface
  // For now, return a minimal selection
  return {
    source_selection: [],
    binary_selection: [{ binary_file, addresses }],
    source_hover_highlight: [],
    binary_hover_highlight: []
  };
}

export function clearLoadedFile(filepath: string): void {
  if (!loadedFiles.has(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  loadedFiles.delete(filepath);
  // Remove from file order as well
  fileOrder = fileOrder.filter(name => name !== filepath);
}

// Get loaded file names in order
export function getLoadedFileNames(): string[] {
  // Filter fileOrder to only include files that are still loaded
  const validOrder = fileOrder.filter(name => loadedFiles.has(name));
  
  // Add any loaded files that aren't in the order (shouldn't happen, but just in case)
  const allLoaded = Array.from(loadedFiles.keys());
  const missingFiles = allLoaded.filter(name => !validOrder.includes(name));
  
  return [...validOrder, ...missingFiles];
}

// Reorder files
export function reorderFiles(newOrder: string[]): void {
  // Validate that all files in newOrder exist and all loaded files are included
  const loadedFileNames = Array.from(loadedFiles.keys());
  const validOrder = newOrder.filter(name => loadedFileNames.includes(name));
  
  if (validOrder.length !== loadedFileNames.length) {
    throw new Error('Invalid reorder: missing or extra files');
  }
  
  fileOrder = validOrder;
}

// Clear all loaded files
export function clearAllLoadedFiles(): void {
  loadedFiles.clear();
  fileOrder = [];
}

// Get all function information for a binary file
export function getFunctionInfos(filepath: string): FunctionInfo[] {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  return file.data.functionInfos || [];
}

// Get a specific function by name
export function getFunctionInfo(filepath: string, functionName: string): FunctionInfo | null {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  return file.data.functionInfos?.find(func => func.name === functionName) || null;
}

// Get a specific function by entry address
export function getFunctionInfoByAddress(filepath: string, entryAddress: number): FunctionInfo | null {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  return file.data.functionInfos?.find(func => func.entry === entryAddress) || null;
}

// Get functions that contain a specific basic block
export function getFunctionsContainingBlock(filepath: string, blockName: string): FunctionInfo[] {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  return file.data.functionInfos?.filter(func => 
    func.basic_blocks.includes(blockName)
  ) || [];
}

// Get all function names for a binary file
export function getFunctionNames(filepath: string): string[] {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  return file.data.functionInfos?.map(func => func.name) || [];
}

// Get function statistics
export function getFunctionStats(filepath: string): {
  totalFunctions: number;
  totalBasicBlocks: number;
  totalInstructions: number;
  functionsWithLoops: number;
  functionsWithInlines: number;
} {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  const functionInfos = file.data.functionInfos || [];
  
  let totalBasicBlocks = 0;
  let totalInstructions = 0;
  let functionsWithLoops = 0;
  let functionsWithInlines = 0;
  
  for (const func of functionInfos) {
    totalBasicBlocks += func.basic_blocks.length;
    
    // Count instructions by looking at blocks
    for (const blockName of func.basic_blocks) {
      const block = file.data.disassembly.memory_order_blocks.find(b => b.name === blockName);
      if (block) {
        totalInstructions += block.n_instructions;
      }
    }
    
    if (func.loops.length > 0) {
      functionsWithLoops++;
    }
    
    if (func.inlines.length > 0) {
      functionsWithInlines++;
    }
  }
  
  return {
    totalFunctions: functionInfos.length,
    totalBasicBlocks,
    totalInstructions,
    functionsWithLoops,
    functionsWithInlines
  };
}

// Call Graph Construction Functions
export function buildCallGraph(filepath: string): CallGraph {
  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);
  
  const functionInfos = file.data.functionInfos || [];
  const nodes: CallGraphNode[] = [];
  const edges: CallGraphEdge[] = [];
  
  // Create a map of function names to their info for quick lookup
  const functionMap = new Map<string, FunctionInfo>();
  functionInfos.forEach(func => {
    functionMap.set(func.name, func);
  });
  
  // Create nodes for all functions
  functionInfos.forEach((func, index) => {
    const node: CallGraphNode = {
      id: `${func.name}-${func.entry}`, // Include entry address to ensure uniqueness
      name: func.name,
      entry: func.entry,
      isExternal: false,
      isBuiltIn: func.is_builtin,
      callCount: func.calls.length,
      level: 0, // Will be calculated later
      x: 0, // Will be calculated during layout
      y: 0, // Will be calculated during layout
      width: 120, // Default width
      height: 60, // Default height
    };
    nodes.push(node);
  });
  
  // Process calls and create edges (only internal calls)
  functionInfos.forEach(func => {
    func.calls.forEach(call => {
      // Check if target function exists in our function list
      const targetFunction = functionMap.get(call.target_func_names[0] || '');
      
      if (targetFunction) {
        // Internal call only
        const edge: CallGraphEdge = {
          id: `${func.name}-${targetFunction.name}-${call.address}`,
          source: `${func.name}-${func.entry}`,
          target: `${targetFunction.name}-${targetFunction.entry}`,
          callAddress: call.address,
          targetAddress: call.target,
          isExternal: false,
          callCount: 1
        };
        edges.push(edge);
      }
      // Skip external calls - they are filtered out
    });
  });
  
  // Create dagre graph for Sugiyama layout
  const g = new dagre.graphlib.Graph();
  
  // Set graph properties for Sugiyama layout
  g.setGraph({
    rankdir: 'TB',        // Top to Bottom direction
    align: 'UL',          // Upper Left alignment
    nodesep: 80,          // Horizontal separation between nodes
    edgesep: 40,          // Separation between edges
    ranksep: 100,         // Vertical separation between ranks (levels)
    marginx: 50,          // Horizontal margin
    marginy: 50,          // Vertical margin
    acyclicer: 'greedy',  // Algorithm to make graph acyclic
    ranker: 'tight-tree'  // Ranking algorithm for better hierarchy
  });
  
  // Set default node and edge properties
  g.setDefaultNodeLabel(() => ({}));
  g.setDefaultEdgeLabel(() => ({}));
  
  // Add nodes to dagre graph
  nodes.forEach(node => {
    g.setNode(node.id, {
      width: node.width,
      height: node.height,
      label: node.name
    });
  });
  
  // Add edges to dagre graph
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target, {
      weight: edge.callCount // Use call count as edge weight
    });
  });
  
  // Apply Sugiyama layout algorithm
  dagre.layout(g);
  
  // Update node positions from dagre layout
  let maxLevel = 0;
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      node.x = dagreNode.x - node.width / 2;  // dagre centers nodes, we want top-left
      node.y = dagreNode.y - node.height / 2;
      
      // Calculate level based on y position for compatibility
      node.level = Math.floor(node.y / 100);
      maxLevel = Math.max(maxLevel, node.level);
    }
  });
  
  // Store edge control points for curved rendering
  edges.forEach(edge => {
    const dagreEdge = g.edge(edge.source, edge.target);
    if (dagreEdge && dagreEdge.points) {
      (edge as any).points = dagreEdge.points;
    }
  });
  
  return {
    nodes,
    edges,
    externalFunctions: new Set<string>(), // Empty set since we filter out external calls
    maxLevel,
    totalFunctions: functionInfos.length
  };
}

// Get call graph statistics
export function getCallGraphStats(filepath: string): {
  totalNodes: number;
  totalEdges: number;
  externalFunctions: number;
  maxDepth: number;
  averageCallsPerFunction: number;
} {
  const callGraph = buildCallGraph(filepath);
  
  const totalCalls = callGraph.edges.reduce((sum, edge) => sum + edge.callCount, 0);
  const averageCallsPerFunction = callGraph.totalFunctions > 0 ? totalCalls / callGraph.totalFunctions : 0;
  
  return {
    totalNodes: callGraph.nodes.length,
    totalEdges: callGraph.edges.length,
    externalFunctions: callGraph.externalFunctions.size,
    maxDepth: callGraph.maxLevel,
    averageCallsPerFunction
  };
} 