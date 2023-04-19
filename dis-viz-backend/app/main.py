from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import json
from .utils import decode_cache_binary
from .instructions import InstructionBlock, LineCorrespondence, SourceFile, SourceLine

class FilePath(BaseModel):
    path: str


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def index():
    return RedirectResponse(url='/docs')
    
@app.post("/getdisassemblypage/{order}/{page_no}")
async def getdisassemblypage(order: str, page_no: int, filepath: FilePath):
    pages = decode_cache_binary(filepath.path)['disassembly'][order]['pages']
    page_no = max(0, min(page_no, len(pages)-1))
    return next(page for page in pages if page.page_no == page_no)

@app.post("/getdisassemblypagebyaddress/{order}/{start_address}")
async def getdisassembly(order: str, start_address: int, filepath: FilePath):
    pages = decode_cache_binary(filepath.path)['disassembly'][order]['pages']
    return next(page for page in pages if any((block.start_address <= start_address <= block.end_address) for block in page.blocks))

@app.post("/getdisassemblyblockbyid/{order}/{block_id}")
async def getdisassemblybyid(order: str, block_id: str, filepath: FilePath):
    blocks = decode_cache_binary(filepath.path)['disassembly'][order]['blocks']
    return next(block for block in blocks if block.name == block_id and block.block_type == 'normal')

@app.post("/getminimapdata")
async def getminimapdata(filepath: FilePath):
    minimap = decode_cache_binary(filepath.path)['minimap']
    return minimap


@app.post("/sourcefiles")
async def getsourcefiles(filepath: FilePath):
    return decode_cache_binary(filepath.path)['source_files']

@app.post("/getsourcefile")
async def getsourcefile(binary_file_path: FilePath, filepath: FilePath) -> SourceFile:

    with open(filepath.path, "r") as f:
        file_content = f.readlines()
    
    blocks: list[InstructionBlock] = list(filter(lambda block: filepath.path in block.instructions[0].correspondence, decode_cache_binary(binary_file_path.path)['disassembly']['memory_order']['blocks']))
    line_correspondences: list[LineCorrespondence] = list(filter(
        lambda line_correspondence: line_correspondence.source_file == filepath.path,
        decode_cache_binary(binary_file_path.path)['dyninst_info']['line_correspondence'])
    )

    lines: list[SourceLine] = []
    for cur_line, line_val in enumerate(file_content):
        result: list[int] = []
        for line_correspondence in line_correspondences:
            if line_correspondence.source_line == cur_line:
                cur_blocks = list(filter(lambda block: block.start_address <= line_correspondence.start_address <= block.end_address or block.start_address <= line_correspondence.end_address <= block.end_address or line_correspondence.start_address <= block.start_address and line_correspondence.end_address >= block.end_address, blocks))
                addresses = [ins.address for block in cur_blocks for ins in block.instructions if line_correspondence.start_address <= ins.address < line_correspondence.end_address]
                result += addresses
        lines.append(SourceLine(
            line=line_val,
            addresses=result
        ))
    source_file = SourceFile(lines=lines)
    
    return source_file

@app.post("/getdyninstinfo")
async def getdyninstinfo(filepath: FilePath):
    dyninst_info = decode_cache_binary(filepath.path)['dyninst_info']
    return dyninst_info

@app.post("/getdisassemblydot")
async def getdisassemblydot(filepath: FilePath):
    return {"dot": decode_cache_binary(filepath.path)['dot']}

@app.get("/binarylist")
async def binarylist():
    with open('BinaryList.json') as f:
        return json.load(f)