from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


import json

import simpleoptparser as sopt

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
    

@app.post("/open")
async def open_binary(filepath: FilePath):
    sopt.decode(filepath.path)
    return { "message":  "success" }

@app.get("/getdisassembly")
async def getdisassembly():
    return json.loads(sopt.get_assembly())

@app.get("/sourcefiles")
async def getsourcefiles():
    return json.loads(sopt.get_sourcefiles())

@app.post("/getsourcefile")
async def getsourcefile(filepath: FilePath):
    with open(filepath.path, "r") as f:
        return {
            "result": f.readlines()
        }

@app.get("/getdyninstinfo")
async def getdyninstinfo():
    return json.loads(sopt.get_json())

@app.get("/getdisassemblydot")
async def getdisassemblydot():
    return {"dot": sopt.get_dot()}