import * as pako from 'pako';
import * as tar from 'tar-stream';
import * as dagre from 'dagre';
import { BlockPage, SourceFile, InstructionBlock, BLOCK_ORDERS, SourceLine, Hidable, InlineEntry, MemoryInfo } from './types';
import { MinimapType } from './features/minimap/minimapSlice';
import { Selection } from './features/selections/selectionsSlice';
import { INSTRUCTION_TAGS, SOURCE_TAGS } from './utils';

// Helper function to transform old memory flags to new merged flag
function transformMemoryFlags(flags: string[]): string[] {
  const hasMemoryRead = flags.includes('MEMORY_READ');
  const hasMemoryWrite = flags.includes('MEMORY_WRITE');
  
  if (hasMemoryRead || hasMemoryWrite) {
    // Remove old flags and add new merged flag
    return flags
      .filter(f => f !== 'MEMORY_READ' && f !== 'MEMORY_WRITE')
      .concat(['MEMORY']);
  }
  
  return flags;
}

// Helper function to transform old call graph flags to new merged flag
function transformCallGraphFlags(flags: string[]): string[] {
  const hasCallIn = flags.includes('CALL_IN');
  const hasCallOut = flags.includes('CALL_OUT');
  
  if (hasCallIn || hasCallOut) {
    // Remove old flags and add new merged flag
    return flags
      .filter(f => f !== 'CALL_IN' && f !== 'CALL_OUT')
      .concat(['CALL_GRAPH']);
  }
  
  return flags;
}

// Helper function to transform all old flags
function transformFlags(flags: string[]): string[] {
  let transformed = transformMemoryFlags(flags);
  transformed = transformCallGraphFlags(transformed);
  return transformed;
}

// Helper function to create MemoryInfo from flags
function createMemoryInfo(flags: string[]): MemoryInfo | undefined {
  const hasMemoryRead = flags.includes('MEMORY_READ');
  const hasMemoryWrite = flags.includes('MEMORY_WRITE');
  
  if (hasMemoryRead || hasMemoryWrite) {
    return {
      isRead: hasMemoryRead,
      isWrite: hasMemoryWrite
    };
  }
  
  return undefined;
}

// Interface for the JSON structure in .disviz files

const PAGE_SIZE = 500; // TODO: Make Smooth Scrolling like RecyclerView

interface InstructionData {
    address: number;
    flags: (typeof INSTRUCTION_TAGS)[number]['id'][];
    instruction: string;
    correspondence: {
        [source_file: string]: number[]; // Line numbers are 1-based from backend
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
  callsite_line: number; // 1-based line number from backend
  ranges: { start: number; end: number }[];
  children?: InlineEntryData[];
}

interface SourceCodeInfo {
  file: string;
  copied_path: string | null;
  total_lines: number;
  lines: {
    line: number; // 1-based line number from backend
    flags: (typeof SOURCE_TAGS)[number]['id'][];
    correspondences: number[]; // Array of addresses
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
  line: number; // 1-based line number from backend
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

interface SourceFunctionParam {
  type: string;
  name: string;
}

interface SourceFunctionInfo {
  file: string; // Source file where function is defined
  line: number; // 1-based line number from backend
  return_type: string;
  parameters: SourceFunctionParam[];
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
  call_graph_in_degree: number;
  call_graph_out_degree: number;
  source_info: SourceFunctionInfo;
}

// Call Graph Types
export interface CallGraphNode {
  id: string;
  name: string;
  entry: number;
  isExternal: boolean;
  isBuiltIn: boolean;
  isInline: boolean;
  parentFunction?: string; // For inline functions, the parent function name
  simplifiedName?: string; // For inline functions, the simplified name
  callsiteFile?: string;
  callsiteLine?: number;
  addressRanges?: Array<{ start: number; end: number }>; // For inline functions
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

// ===== Lazy/Indexed Call Graph Types (for scalable visualization) =====

export interface CallGraphNodeInfo {
  id: string;
  name: string;
  entry: number;
  isBuiltIn: boolean;
  isInline: boolean;
  parentFunction?: string;
  simplifiedName?: string;
  callsiteFile?: string;
  callsiteLine?: number;
  addressRanges?: Array<{ start: number; end: number }>;
  callCount: number;
}

export interface CallGraphIndex {
  nodes: Map<string, CallGraphNodeInfo>;
  outgoing: Map<string, Set<string>>;
  incoming: Map<string, Set<string>>;
  edgeMap: Map<string, { id: string; source: string; target: string; callCount: number }>;
  nameToId: Map<string, string>;
  parentToInlineIds: Map<string, Set<string>>;
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

// Tag count result per source file
export interface SourceFileTagCounts {
  file: string;
  tagCounts: {
    [tagId: string]: number;
  };
  // Lines that have each tag (for detecting line-level differences)
  tagLines: {
    [tagId: string]: number[];
  };
}

// Get tag counts for all source files in a binary
export function getSourceFileTagCounts(binaryFilePath: string): SourceFileTagCounts[] {
  const file = loadedFiles.get(binaryFilePath);
  if (!file) return [];
  
  return file.data.source_code_info.map(sourceInfo => {
    const tagCounts: { [tagId: string]: number } = {};
    const tagLines: { [tagId: string]: number[] } = {};
    
    sourceInfo.lines.forEach(line => {
      if (line.flags) {
        line.flags.forEach(rawFlag => {
          // Cast to string since raw data may have old flag names not in current type
          const flag = rawFlag as string;
          // Transform old memory flags to new merged format for counting
          if (flag === 'MEMORY_READ' || flag === 'MEMORY_WRITE') {
            tagCounts['MEMORY'] = (tagCounts['MEMORY'] || 0) + 1;
            if (!tagLines['MEMORY']) tagLines['MEMORY'] = [];
            if (!tagLines['MEMORY'].includes(line.line)) {
              tagLines['MEMORY'].push(line.line);
            }
          }
          tagCounts[flag] = (tagCounts[flag] || 0) + 1;
          if (!tagLines[flag]) tagLines[flag] = [];
          if (!tagLines[flag].includes(line.line)) {
            tagLines[flag].push(line.line);
          }
        });
      }
    });
    
    return {
      file: sourceInfo.file,
      tagCounts,
      tagLines
    };
  });
}

// Result type for tag info per binary
export interface BinaryTagInfo {
  counts: { [tagId: string]: number };
  lines: { [tagId: string]: number[] };
}

// Get tag counts for a specific source file across multiple binaries
export function getSourceFileTagCountsForFile(
  binaryFilePaths: string[], 
  sourceFile: string
): { [binaryPath: string]: BinaryTagInfo } {
  const result: { [binaryPath: string]: BinaryTagInfo } = {};
  
  for (const binaryPath of binaryFilePaths) {
    const file = loadedFiles.get(binaryPath);
    if (!file) continue;
    
    const sourceInfo = file.data.source_code_info.find(s => s.file === sourceFile);
    if (sourceInfo) {
      const tagCounts: { [tagId: string]: number } = {};
      const tagLines: { [tagId: string]: number[] } = {};
      
      sourceInfo.lines.forEach(line => {
        if (line.flags) {
          line.flags.forEach(rawFlag => {
            // Cast to string since raw data may have old flag names not in current type
            const flag = rawFlag as string;
            // Transform old memory flags to new merged format for counting
            if (flag === 'MEMORY_READ' || flag === 'MEMORY_WRITE') {
              tagCounts['MEMORY'] = (tagCounts['MEMORY'] || 0) + 1;
              if (!tagLines['MEMORY']) tagLines['MEMORY'] = [];
              if (!tagLines['MEMORY'].includes(line.line)) {
                tagLines['MEMORY'].push(line.line);
              }
            }
            tagCounts[flag] = (tagCounts[flag] || 0) + 1;
            if (!tagLines[flag]) tagLines[flag] = [];
            if (!tagLines[flag].includes(line.line)) {
              tagLines[flag].push(line.line);
            }
          });
        }
      });
      
      result[binaryPath] = { counts: tagCounts, lines: tagLines };
    }
  }
  
  return result;
}

// Get all tag counts for all source files across all binaries
export function getAllSourceFileTagCounts(binaryFilePaths: string[]): {
  [sourceFile: string]: { [binaryPath: string]: BinaryTagInfo }
} {
  const result: { [sourceFile: string]: { [binaryPath: string]: BinaryTagInfo } } = {};
  
  for (const binaryPath of binaryFilePaths) {
    const tagCounts = getSourceFileTagCounts(binaryPath);
    
    for (const { file, tagCounts: counts, tagLines: lines } of tagCounts) {
      if (!result[file]) {
        result[file] = {};
      }
      result[file][binaryPath] = { counts, lines };
    }
  }
  
  return result;
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
    call_graph_info?: { [binaryFilePath: string]: any };
  }[] = [];

  // Build a map of function definition lines for each binary
  const functionLineMap: { [binaryFilePath: string]: Map<number, FunctionInfo> } = {};

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

      // Build function line map for call graph information
      functionLineMap[binaryFileName] = new Map();
      const allFunctions = binaryFile.data.functionInfos || [];

      for (const func of allFunctions) {
        // Add function to map only if it's defined in the current source file with valid line number
        if (func.source_info && func.source_info.file === sourceFile && func.source_info.line > 0) {
          functionLineMap[binaryFileName].set(func.source_info.line, func);
        }
      }

      // Ensure function definition lines are in the lines array even if they don't have correspondences
      for (const funcLine of functionLineMap[binaryFileName].keys()) {
        // funcLine is 1-based from backend, match directly with l.line which is also 1-based
        let existingLine = lines.find(l => l.line === funcLine);
        if (!existingLine) {
          existingLine = {
            line: funcLine, // Keep 1-based line number
            correspondences: {},
            flags: {},
            inline_tree: {}
          };
          // Initialize for all binary files
          for (const binFile of binaryFiles) {
            existingLine.correspondences[binFile] = [];
            existingLine.flags[binFile] = [];
            existingLine.inline_tree[binFile] = [];
          }
          lines.push(existingLine);
        } else {
          // Ensure this binary's data is initialized
          if (!existingLine.correspondences[binaryFileName]) {
            existingLine.correspondences[binaryFileName] = [];
          }
          if (!existingLine.flags[binaryFileName]) {
            existingLine.flags[binaryFileName] = [];
          }
          if (!existingLine.inline_tree[binaryFileName]) {
            existingLine.inline_tree[binaryFileName] = [];
          }
        }
      }
    }
  }
  
  // Sort lines by line number
  lines.sort((a, b) => a.line - b.line);
  
  if (!file || !total_lines || !copiedPath) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }
  
  // Add call graph tags to lines with function definitions
  for (const lineInfo of lines) {
    for (const binaryFileName of binaryFiles) {
      // lineInfo.line is 1-based from backend, use directly
      const funcAtLine = functionLineMap[binaryFileName]?.get(lineInfo.line);
      if (funcAtLine) {
        if (!lineInfo.flags[binaryFileName].includes('CALL_GRAPH' as any)) {
          lineInfo.flags[binaryFileName].push('CALL_GRAPH' as any);
        }

        // Build call graph info
        const binaryFile = loadedFiles.get(binaryFileName);
        if (binaryFile) {
          const allFunctions = binaryFile.data.functionInfos || [];
          
          // Find functions this function calls with their built-in status
          const calledFunctionsMap = new Map<string, boolean>();
          funcAtLine.calls.forEach(call => {
            call.target_func_names.forEach(targetName => {
              if (!calledFunctionsMap.has(targetName)) {
                const targetFunc = allFunctions.find(f => f.name === targetName);
                calledFunctionsMap.set(targetName, targetFunc?.is_builtin ?? true);
              }
            });
          });
          
          const calledFunctions = Array.from(calledFunctionsMap.keys());
          const calledFunctionsBuiltIn = Object.fromEntries(calledFunctionsMap);
          
          // Find functions that call this function with their built-in status
          const callingFunctionsMap = new Map<string, boolean>();
          allFunctions
            .filter(f => f.calls.some(call => call.target_func_names.includes(funcAtLine.name)))
            .forEach(f => {
              if (!callingFunctionsMap.has(f.name)) {
                callingFunctionsMap.set(f.name, f.is_builtin);
              }
            });
          
          const callingFunctions = Array.from(callingFunctionsMap.keys());
          const callingFunctionsBuiltIn = Object.fromEntries(callingFunctionsMap);
          
          if (!lineInfo.call_graph_info) {
            lineInfo.call_graph_info = {};
          }
          
          // Extract inline functions
          const inlines = (funcAtLine.inlines || []).map(inline => ({
            name: inline.name,
            simplified_name: inline.simplified_name
          }));
          
          lineInfo.call_graph_info[binaryFileName] = {
            functionName: funcAtLine.name,
            calledFunctions,
            calledFunctionsBuiltIn,
            callingFunctions,
            callingFunctionsBuiltIn,
            returnType: funcAtLine.source_info.return_type || 'void',
            parameters: funcAtLine.source_info.parameters || [],
            inDegree: funcAtLine.call_graph_in_degree,
            outDegree: funcAtLine.call_graph_out_degree,
            inlines
          };
        }
      }
    }
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
    // index is 0-based (array index), lineInfo.line is 1-based (from backend)
    // Convert index to 1-based to match lineInfo.line
    const lineInfo = lines.find(l => l.line === index + 1);
    if (lineInfo) {
      // Convert inline tree data
      const inlineTreeConverted: { [binaryFilePath: string]: InlineEntry[] } = {};
      for (const [binaryFile, inlineData] of Object.entries(lineInfo.inline_tree)) {
        inlineTreeConverted[binaryFile] = inlineData.map(convertInlineEntryData);
      }
      
      // Transform flags and create memory_info for each binary
      const transformedFlags: { [binaryFilePath: string]: string[] } = {};
      const memoryInfo: { [binaryFilePath: string]: MemoryInfo } = {};
      
      for (const [binaryFile, flags] of Object.entries(lineInfo.flags)) {
        transformedFlags[binaryFile] = transformFlags(flags) as any;
        const memInfo = createMemoryInfo(flags);
        if (memInfo) {
          memoryInfo[binaryFile] = memInfo;
        }
      }
      
      return new SourceLine(
        lineContent, 
        lineInfo.correspondences, 
        transformedFlags as any,
        inlineTreeConverted,
        lineInfo.call_graph_info || {},
        memoryInfo
      );
    }
    else {
      return new SourceLine(
        lineContent,
        Object.fromEntries(binaryFiles.map(f => [f, []])),
        Object.fromEntries(binaryFiles.map(f => [f, []])),
        Object.fromEntries(binaryFiles.map(f => [f, []])),
        {},
        {}
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
    flags: transformFlags(inst.flags || []) as any
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

// Helper function to recursively process inline functions
function processInlineFunction(
  inlineData: InlineEntryData,
  parentFunctionName: string,
  nodes: CallGraphNode[],
  edges: CallGraphEdge[],
  processedInlines: Set<string>
): void {
  // Create unique ID for inline function
  const inlineId = `inline-${parentFunctionName}-${inlineData.simplified_name}-${inlineData.callsite_line}`;
  
  // Avoid processing the same inline function multiple times
  if (processedInlines.has(inlineId)) return;
  processedInlines.add(inlineId);
  
  // Calculate entry address as the first address range start
  const entryAddress = inlineData.ranges.length > 0 ? inlineData.ranges[0].start : 0;
  
  // Create inline function node
  const inlineNode: CallGraphNode = {
    id: inlineId,
    name: inlineData.name,
    entry: entryAddress,
    isExternal: false,
    isBuiltIn: false,
    isInline: true,
    parentFunction: parentFunctionName,
    simplifiedName: inlineData.simplified_name,
    callsiteFile: inlineData.callsite_file,
    callsiteLine: inlineData.callsite_line,
    addressRanges: inlineData.ranges,
    callCount: 0, // Inline functions don't make calls in the traditional sense
    level: 0,
    x: 0,
    y: 0,
    width: 140, // Slightly wider for inline functions to accommodate longer names
    height: 50,  // Slightly shorter to distinguish visually
  };
  
  nodes.push(inlineNode);
  
  // Create edge from parent function to inline function
  const parentNode = nodes.find(n => n.name === parentFunctionName && !n.isInline);
  if (parentNode) {
    const edgeId = `${parentNode.id}-${inlineId}`;
    const edge: CallGraphEdge = {
      id: edgeId,
      source: parentNode.id,
      target: inlineId,
      callAddress: entryAddress,
      targetAddress: entryAddress,
      isExternal: false,
      callCount: 1
    };
    edges.push(edge);
  }
  
  // Recursively process children inline functions
  if (inlineData.children) {
    for (const child of inlineData.children) {
      processInlineFunction(child, parentFunctionName, nodes, edges, processedInlines);
      
      // Create edge from this inline function to its child
      const childId = `inline-${parentFunctionName}-${child.simplified_name}-${child.callsite_line}`;
      const childEdgeId = `${inlineId}-${childId}`;
      const childEdge: CallGraphEdge = {
        id: childEdgeId,
        source: inlineId,
        target: childId,
        callAddress: child.ranges.length > 0 ? child.ranges[0].start : 0,
        targetAddress: child.ranges.length > 0 ? child.ranges[0].start : 0,
        isExternal: false,
        callCount: 1
      };
      edges.push(childEdge);
    }
  }
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
  const processedInlines = new Set<string>();
  
  functionInfos.forEach((func, index) => {
    const node: CallGraphNode = {
      id: `${func.name}-${func.entry}`, // Include entry address to ensure uniqueness
      name: func.name,
      entry: func.entry,
      isExternal: false,
      isBuiltIn: func.is_builtin,
      isInline: false,
      callCount: func.calls.length,
      level: 0, // Will be calculated later
      x: 0, // Will be calculated during layout
      y: 0, // Will be calculated during layout
      width: 120, // Default width
      height: 60, // Default height
    };
    nodes.push(node);
    
    // Process inline functions for this function
    if (func.inlines) {
      for (const inlineData of func.inlines) {
        processInlineFunction(inlineData, func.name, nodes, edges, processedInlines);
      }
    }
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

// Find the main function node in the call graph
export function findMainFunctionNode(callGraph: CallGraph): CallGraphNode | null {
  // Try to find "main" function first
  let mainNode = callGraph.nodes.find(node => node.name === 'main');
  if (mainNode) return mainNode;
  
  // Try alternative main function names
  const mainVariants = ['_main', '__main', 'Main', 'MAIN'];
  for (const variant of mainVariants) {
    mainNode = callGraph.nodes.find(node => node.name === variant);
    if (mainNode) return mainNode;
  }
  
  // If no main found, find the node with the lowest entry address (likely entry point)
  const sortedNodes = [...callGraph.nodes].sort((a, b) => a.entry - b.entry);
  return sortedNodes.length > 0 ? sortedNodes[0] : null;
}

// Get direct neighbors of a node (both incoming and outgoing)
export function getNodeNeighbors(callGraph: CallGraph, nodeId: string): Set<string> {
  const neighbors = new Set<string>();
  
  // Find outgoing edges (functions this node calls)
  callGraph.edges
    .filter(edge => edge.source === nodeId)
    .forEach(edge => neighbors.add(edge.target));
  
  // Find incoming edges (functions that call this node)
  callGraph.edges
    .filter(edge => edge.target === nodeId)
    .forEach(edge => neighbors.add(edge.source));
  
  // For inline functions, also include their parent and children
  const node = callGraph.nodes.find(n => n.id === nodeId);
  if (node && node.isInline && node.parentFunction) {
    // Add parent function
    const parentNode = callGraph.nodes.find(n => n.name === node.parentFunction && !n.isInline);
    if (parentNode) {
      neighbors.add(parentNode.id);
    }
    
    // Add sibling inline functions from the same parent
    callGraph.nodes
      .filter(n => n.isInline && n.parentFunction === node.parentFunction && n.id !== nodeId)
      .forEach(sibling => neighbors.add(sibling.id));
  }
  
  // For regular functions, include their inline functions
  if (node && !node.isInline) {
    callGraph.nodes
      .filter(n => n.isInline && n.parentFunction === node.name)
      .forEach(inline => neighbors.add(inline.id));
  }
  
  return neighbors;
}

// Build a subgraph containing specified node IDs and their connections
export function buildSubgraph(callGraph: CallGraph, nodeIds: Set<string>): CallGraph {
  // Filter nodes to only include specified IDs
  const filteredNodes = callGraph.nodes.filter(node => nodeIds.has(node.id));
  
  // Filter edges to only include connections between included nodes
  const filteredEdges = callGraph.edges.filter(edge => 
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
  
  // Recalculate layout for the subgraph
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    align: 'UL',
    nodesep: 80,
    edgesep: 40,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
    acyclicer: 'greedy',
    ranker: 'tight-tree'
  });
  
  g.setDefaultNodeLabel(() => ({}));
  g.setDefaultEdgeLabel(() => ({}));
  
  // Add nodes to dagre graph
  filteredNodes.forEach(node => {
    g.setNode(node.id, {
      width: node.width,
      height: node.height,
      label: node.name
    });
  });
  
  // Add edges to dagre graph
  filteredEdges.forEach(edge => {
    g.setEdge(edge.source, edge.target, {
      weight: edge.callCount
    });
  });
  
  // Apply layout
  dagre.layout(g);
  
  // Update node positions from dagre layout
  let maxLevel = 0;
  const updatedNodes = filteredNodes.map(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      const updatedNode = { ...node };
      updatedNode.x = dagreNode.x - node.width / 2;
      updatedNode.y = dagreNode.y - node.height / 2;
      updatedNode.level = Math.floor(updatedNode.y / 100);
      maxLevel = Math.max(maxLevel, updatedNode.level);
      return updatedNode;
    }
    return node;
  });
  
  // Store edge control points for curved rendering
  const updatedEdges = filteredEdges.map(edge => {
    const dagreEdge = g.edge(edge.source, edge.target);
    if (dagreEdge && dagreEdge.points) {
      return { ...edge, points: dagreEdge.points };
    }
    return edge;
  });
  
  return {
    nodes: updatedNodes,
    edges: updatedEdges,
    externalFunctions: callGraph.externalFunctions,
    maxLevel,
    totalFunctions: filteredNodes.length
  };
}

// Find function containing a specific address
export function getFunctionContainingAddress(filepath: string, address: number): FunctionInfo | null {
  const file = loadedFiles.get(filepath);
  if (!file) return null;
  
  const functionInfos = file.data.functionInfos || [];
  
  // Find function whose basic blocks contain the address
  for (const func of functionInfos) {
    for (const blockName of func.basic_blocks) {
      const block = file.data.disassembly.memory_order_blocks.find(b => b.name === blockName);
      if (block && address >= block.start_address && address <= block.end_address) {
        return func;
      }
    }
  }
  
  return null;
}

// ===== Lazy Call Graph Index Functions =====
// These build a lightweight adjacency index without running dagre layout,
// then only layout the small visible subset on demand.

const callGraphIndexCache = new Map<string, CallGraphIndex>();

function addToAdjacencySet(map: Map<string, Set<string>>, from: string, to: string): void {
  let set = map.get(from);
  if (!set) { set = new Set(); map.set(from, set); }
  set.add(to);
}

function processInlineFunctionForIndex(
  inlineData: InlineEntryData,
  parentFunctionName: string,
  parentNodeId: string,
  index: CallGraphIndex,
  processedInlines: Set<string>,
  directParentInlineId?: string
): void {
  const inlineId = `inline-${parentFunctionName}-${inlineData.simplified_name}-${inlineData.callsite_line}`;
  if (processedInlines.has(inlineId)) return;
  processedInlines.add(inlineId);

  const entryAddress = inlineData.ranges.length > 0 ? inlineData.ranges[0].start : 0;

  index.nodes.set(inlineId, {
    id: inlineId,
    name: inlineData.name,
    entry: entryAddress,
    isBuiltIn: false,
    isInline: true,
    parentFunction: parentFunctionName,
    simplifiedName: inlineData.simplified_name,
    callsiteFile: inlineData.callsite_file,
    callsiteLine: inlineData.callsite_line,
    addressRanges: inlineData.ranges,
    callCount: 0,
  });

  // Track inline -> parent relationship
  let inlineSet = index.parentToInlineIds.get(parentFunctionName);
  if (!inlineSet) { inlineSet = new Set(); index.parentToInlineIds.set(parentFunctionName, inlineSet); }
  inlineSet.add(inlineId);

  // Edge: non-inline parent -> this inline
  const parentEdgeKey = `${parentNodeId}|${inlineId}`;
  if (!index.edgeMap.has(parentEdgeKey)) {
    index.edgeMap.set(parentEdgeKey, {
      id: `${parentNodeId}-${inlineId}`,
      source: parentNodeId,
      target: inlineId,
      callCount: 1,
    });
    addToAdjacencySet(index.outgoing, parentNodeId, inlineId);
    addToAdjacencySet(index.incoming, inlineId, parentNodeId);
  }

  // Edge: direct inline parent -> this inline (if nested)
  if (directParentInlineId) {
    const inlineEdgeKey = `${directParentInlineId}|${inlineId}`;
    if (!index.edgeMap.has(inlineEdgeKey)) {
      index.edgeMap.set(inlineEdgeKey, {
        id: `${directParentInlineId}-${inlineId}`,
        source: directParentInlineId,
        target: inlineId,
        callCount: 1,
      });
      addToAdjacencySet(index.outgoing, directParentInlineId, inlineId);
      addToAdjacencySet(index.incoming, inlineId, directParentInlineId);
    }
  }

  // Recursively process children
  if (inlineData.children) {
    for (const child of inlineData.children) {
      processInlineFunctionForIndex(child, parentFunctionName, parentNodeId, index, processedInlines, inlineId);
    }
  }
}

export function buildCallGraphIndex(filepath: string): CallGraphIndex {
  const cached = callGraphIndexCache.get(filepath);
  if (cached) return cached;

  const file = loadedFiles.get(filepath);
  if (!file) throw new Error(`File not found: ${filepath}`);

  const functionInfos = file.data.functionInfos || [];

  const index: CallGraphIndex = {
    nodes: new Map(),
    outgoing: new Map(),
    incoming: new Map(),
    edgeMap: new Map(),
    nameToId: new Map(),
    parentToInlineIds: new Map(),
    totalFunctions: functionInfos.length,
  };

  // Build function name -> info map for edge target resolution
  const functionMap = new Map<string, FunctionInfo>();
  functionInfos.forEach(func => functionMap.set(func.name, func));

  const processedInlines = new Set<string>();

  // Create nodes for all functions
  functionInfos.forEach(func => {
    const nodeId = `${func.name}-${func.entry}`;

    index.nodes.set(nodeId, {
      id: nodeId,
      name: func.name,
      entry: func.entry,
      isBuiltIn: func.is_builtin,
      isInline: false,
      callCount: func.calls.length,
    });

    index.nameToId.set(func.name, nodeId);

    // Process inlines
    if (func.inlines) {
      for (const inlineData of func.inlines) {
        processInlineFunctionForIndex(inlineData, func.name, nodeId, index, processedInlines);
      }
    }
  });

  // Create edges from function calls (aggregate duplicates)
  functionInfos.forEach(func => {
    const sourceId = `${func.name}-${func.entry}`;

    func.calls.forEach(call => {
      const targetFuncName = call.target_func_names[0] || '';
      const targetFunction = functionMap.get(targetFuncName);
      if (!targetFunction) return; // Skip external calls

      const targetId = `${targetFunction.name}-${targetFunction.entry}`;
      const edgeKey = `${sourceId}|${targetId}`;

      const existing = index.edgeMap.get(edgeKey);
      if (existing) {
        existing.callCount++;
      } else {
        index.edgeMap.set(edgeKey, {
          id: `${func.name}-${targetFunction.name}-${call.address}`,
          source: sourceId,
          target: targetId,
          callCount: 1,
        });
      }
      addToAdjacencySet(index.outgoing, sourceId, targetId);
      addToAdjacencySet(index.incoming, targetId, sourceId);
    });
  });

  callGraphIndexCache.set(filepath, index);
  return index;
}

export function getCallGraphStatsFromIndex(index: CallGraphIndex): {
  totalNodes: number;
  totalEdges: number;
  averageCallsPerFunction: number;
} {
  let totalCalls = 0;
  for (const [, edge] of index.edgeMap) {
    totalCalls += edge.callCount;
  }
  return {
    totalNodes: index.nodes.size,
    totalEdges: index.edgeMap.size,
    averageCallsPerFunction: index.totalFunctions > 0 ? totalCalls / index.totalFunctions : 0,
  };
}

export function findMainInIndex(index: CallGraphIndex): string | null {
  // Try exact name matches
  const mainNames = ['main', '_main', '__main', 'Main', 'MAIN'];
  for (const name of mainNames) {
    const id = index.nameToId.get(name);
    if (id) return id;
  }

  // Fallback: lowest entry address among non-inline functions
  let minEntry = Infinity;
  let minId: string | null = null;
  for (const [id, node] of index.nodes) {
    if (!node.isInline && node.entry < minEntry) {
      minEntry = node.entry;
      minId = id;
    }
  }
  return minId;
}

export function getNeighborsFromIndex(index: CallGraphIndex, nodeId: string): Set<string> {
  const neighbors = new Set<string>();

  // Outgoing edges (O(degree) via adjacency set)
  const outgoing = index.outgoing.get(nodeId);
  if (outgoing) for (const id of outgoing) neighbors.add(id);

  // Incoming edges (O(degree) via adjacency set)
  const incoming = index.incoming.get(nodeId);
  if (incoming) for (const id of incoming) neighbors.add(id);

  // For inline functions, add siblings (via parentToInlineIds)
  const node = index.nodes.get(nodeId);
  if (node?.isInline && node.parentFunction) {
    const siblings = index.parentToInlineIds.get(node.parentFunction);
    if (siblings) {
      for (const sibId of siblings) {
        if (sibId !== nodeId) neighbors.add(sibId);
      }
    }
  }

  return neighbors;
}

export function layoutVisibleSubgraph(index: CallGraphIndex, visibleNodeIds: Set<string>): CallGraph {
  const nodes: CallGraphNode[] = [];
  const edges: CallGraphEdge[] = [];

  // Create nodes from index metadata
  for (const nodeId of visibleNodeIds) {
    const info = index.nodes.get(nodeId);
    if (!info) continue;

    nodes.push({
      id: info.id,
      name: info.name,
      entry: info.entry,
      isExternal: false,
      isBuiltIn: info.isBuiltIn,
      isInline: info.isInline,
      parentFunction: info.parentFunction,
      simplifiedName: info.simplifiedName,
      callsiteFile: info.callsiteFile,
      callsiteLine: info.callsiteLine,
      addressRanges: info.addressRanges,
      callCount: info.callCount,
      level: 0,
      x: 0,
      y: 0,
      width: info.isInline ? 140 : 120,
      height: info.isInline ? 50 : 60,
    });
  }

  // Create edges between visible nodes only
  for (const nodeId of visibleNodeIds) {
    const outNeighbors = index.outgoing.get(nodeId);
    if (!outNeighbors) continue;

    for (const targetId of outNeighbors) {
      if (!visibleNodeIds.has(targetId)) continue;

      const edgeKey = `${nodeId}|${targetId}`;
      const edgeInfo = index.edgeMap.get(edgeKey);
      if (!edgeInfo) continue;

      edges.push({
        id: edgeInfo.id,
        source: nodeId,
        target: targetId,
        callAddress: 0,
        targetAddress: 0,
        isExternal: false,
        callCount: edgeInfo.callCount,
      });
    }
  }

  // Run dagre layout on this small visible subset only
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    align: 'UL',
    nodesep: 80,
    edgesep: 40,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
    acyclicer: 'greedy',
    ranker: 'tight-tree',
  });
  g.setDefaultNodeLabel(() => ({}));
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(node => {
    g.setNode(node.id, { width: node.width, height: node.height, label: node.name });
  });

  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target, { weight: edge.callCount });
  });

  dagre.layout(g);

  let maxLevel = 0;
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      node.x = dagreNode.x - node.width / 2;
      node.y = dagreNode.y - node.height / 2;
      node.level = Math.floor(node.y / 100);
      maxLevel = Math.max(maxLevel, node.level);
    }
  });

  edges.forEach(edge => {
    const dagreEdge = g.edge(edge.source, edge.target);
    if (dagreEdge && dagreEdge.points) {
      (edge as any).points = dagreEdge.points;
    }
  });

  return {
    nodes,
    edges,
    externalFunctions: new Set<string>(),
    maxLevel,
    totalFunctions: nodes.length,
  };
}

export function searchFunctionsInIndex(index: CallGraphIndex, query: string, limit: number = 20): CallGraphNodeInfo[] {
  const lowerQuery = query.toLowerCase();
  const results: CallGraphNodeInfo[] = [];

  for (const [, node] of index.nodes) {
    if (node.isInline) continue; // Skip inlines in search
    if (node.name.toLowerCase().includes(lowerQuery)) {
      results.push(node);
      if (results.length >= limit * 3) break; // Collect extra for sorting
    }
  }

  // Sort: exact matches first, then prefix matches, then by name length
  results.sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();
    const aExact = aLower === lowerQuery ? 0 : 1;
    const bExact = bLower === lowerQuery ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    const aPrefix = aLower.startsWith(lowerQuery) ? 0 : 1;
    const bPrefix = bLower.startsWith(lowerQuery) ? 0 : 1;
    if (aPrefix !== bPrefix) return aPrefix - bPrefix;
    return a.name.length - b.name.length;
  });

  return results.slice(0, limit);
}

/**
 * Given a binary file, a source file, and an array of 1-based source line numbers,
 * find the function(s) whose definition contains those lines.
 *
 * Heuristic: sort all function definition lines for this source file and, for each
 * selected line, return the function whose definition line is the greatest value ≤
 * the selected line (i.e. the most-recently-opened function scope).
 */
export function getFunctionsForSourceLines(
  binaryFilePath: string,
  sourceFile: string,
  sourceLines: number[]
): FunctionInfo[] {
  const file = loadedFiles.get(binaryFilePath);
  if (!file) return [];

  const allFunctions = file.data.functionInfos || [];

  // Collect functions defined in the requested source file, sorted by line asc
  const funcsInFile = allFunctions
    .filter(f => f.source_info && f.source_info.file === sourceFile && f.source_info.line > 0)
    .sort((a, b) => a.source_info.line - b.source_info.line);

  if (funcsInFile.length === 0) return [];

  const defLines = funcsInFile.map(f => f.source_info.line);

  const result = new Map<string, FunctionInfo>(); // deduplicate by function name

  for (const line of sourceLines) {
    // Binary search for the last definition line <= line
    let lo = 0;
    let hi = defLines.length - 1;
    let idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (defLines[mid] <= line) {
        idx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (idx >= 0) {
      const func = funcsInFile[idx];
      result.set(func.name, func);
    }
  }

  return Array.from(result.values());
}