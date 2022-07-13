from dataclasses import dataclass
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import json
from functools import lru_cache
import simpleoptparser as sopt


class FilePath(BaseModel):
    path: str
    
@dataclass
class Instruction:
    address: int
    instruction: str

@dataclass
class InstructionBlock:
    def __init__(self, block_number: int, function_name: str, instructions: list[Instruction], hidden: bool = False):
        self.block_number = block_number
        self.function_name = function_name



@lru_cache(maxsize=10)
def decode_cache_binary(filepath: str):
    print("Called decode on :", filepath)
    sopt.decode(filepath)
    disassembly = json.loads(sopt.get_assembly())

    print(disassembly)


    source_files = json.loads(sopt.get_sourcefiles())
    dyninst_info : dict[str, dict] = json.loads(sopt.get_json())
    dot : dict[str, str] = {"dot": sopt.get_dot()}

    return {
        'disassembly': disassembly,
        'source_files': source_files,
        'dyninst_info': dyninst_info,
        'dot': dot
    }


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
    

@app.post("/open")
async def open_binary(filepath: FilePath):
    try:
        result = decode_cache_binary(filepath.path)
        return { "message":  "success" }
    except Exception as e:
        return { "message": "failed", 'detail': str(e) }

@app.post("/getdisassembly")
async def getdisassembly(filepath: FilePath):
    return decode_cache_binary(filepath.path)['disassembly']

@app.post("/getdisassemblypageinfo")
async def getdisassemblypageinfo(filepath: FilePath):
    pass


@app.post("/getdisassembly/{page_no}")
async def getdisassemblypage(page_no: int, filepath: FilePath):
    pass
    

@app.post("/sourcefiles")
async def getsourcefiles(filepath: FilePath):
    return decode_cache_binary(filepath.path)['source_files']
    return json.loads(sopt.get_sourcefiles())

@app.post("/getsourcefile")
async def getsourcefile(filepath: FilePath):
    with open(filepath.path, "r") as f:
        return {
            "result": f.readlines()
        }

@app.post("/getdyninstinfo")
async def getdyninstinfo(filepath: FilePath):
    return decode_cache_binary(filepath.path)['dyninst_info']

@app.post("/getdisassemblydot")
async def getdisassemblydot(filepath: FilePath):
    return {"dot": decode_cache_binary(filepath.path)['dot']}

@app.get("/binarylist")
async def binarylist():
    with open('BinaryList.json') as f:
        binary_list = json.load(f)
    return binary_list