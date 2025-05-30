import * as pako from 'pako';
import * as tar from 'tar-stream';
import { BlockPage, SourceFile, InstructionBlock, BLOCK_ORDERS, SourceLine, Hidable } from './types';
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

interface SourceCodeInfo {
  file: string;
  copied_path: string | null;
  total_lines: number;
  lines: {
    line: number;
    flags: (typeof SOURCE_TAGS)[number]['id'][];
    correspondences: number[];
  }[];
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
}

// Global storage for loaded .disviz files
interface LoadedDisvizFile {
  name: string;
  data: DisvizData;
  sourceFiles: Map<string, string>; // Maps source file paths to content
  addressRange: { start: number; end: number };
}

const loadedFiles: Map<string, LoadedDisvizFile> = new Map();

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
    for (const [path, content] of extractedFiles) {
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
      addressRange: { start: minAddress, end: maxAddress }
    });
    
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

// Get source lines with correspondences
export function getSourceLines(binaryFiles: string[], sourceFile: string): SourceFile {
  let copiedPath: string | null = null;
  let file: string | null = null;
  let total_lines: number | null = null;
  let lines: {
    line: number;
    flags: { [binaryFilePath: string]: (typeof SOURCE_TAGS)[number]['id'][] };
    correspondences: { [binaryFilePath: string]: number[] };
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
            flags: { [binaryFileName]: line.flags }
          }));
        } else {
          info.lines.forEach(infoLine => {
            const existingLine = lines.find(l => l.line === infoLine.line);
            if (existingLine) {
              existingLine.correspondences[binaryFileName] = infoLine.correspondences;
              existingLine.flags[binaryFileName] = infoLine.flags;
            } else {
              lines.push({
                line: infoLine.line,
                correspondences: { [binaryFileName]: infoLine.correspondences },
                flags: { [binaryFileName]: infoLine.flags }
              });
            }
          });
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
      return new SourceLine(lineContent, lineInfo.correspondences, lineInfo.flags);
    }
    else {
      return new SourceLine(
        lineContent,
        Object.fromEntries(binaryFiles.map(f => [f, []])),
        Object.fromEntries(binaryFiles.map(f => [f, []]))
      );
    }
  });
  
  return new SourceFile(sourceLines);
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
  
  const blocks = file.data.disassembly[`${order}_blocks`];
  const startIndex = pageNo * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, blocks.length);
  
  const pageBlocks = blocks.slice(startIndex, endIndex).map(convertToInstructionBlock);
  
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
    endIndex >= blocks.length,
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
  
  const blocks = file.data.disassembly[`${order}_blocks`];
  
  // Find the block containing this address
  const blockIndex = blocks.findIndex(b => 
    b.start_address <= startAddress && startAddress <= b.end_address
  );
  
  if (blockIndex === -1) {
    throw new Error(`No block found containing address: ${startAddress}`);
  }
  
  // Return a page starting from this block
  const startIndex = blockIndex;
  const endIndex = Math.min(startIndex + PAGE_SIZE, blocks.length);
  
  const pageBlocks = blocks.slice(startIndex, endIndex).map(convertToInstructionBlock);
  
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
    Math.floor(startIndex / PAGE_SIZE),
    endIndex >= blocks.length,
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

// Remove a specific file from loaded files, TODO: Add a button to InputFilePath component
export function clearLoadedFile(filepath: string): void {
  if (!loadedFiles.has(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  loadedFiles.delete(filepath);
}


// Get loaded file names
export function getLoadedFileNames(): string[] {
  return Array.from(loadedFiles.keys());
} 