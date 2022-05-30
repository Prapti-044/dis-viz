from fastapi import FastAPI, RedirectResponse
import simpleoptparser as sopt
from pydantic import BaseModel

class FilePath(BaseModel):
    path: str

app = FastAPI()

@app.get("/")
async def index():
    return RedirectResponse(url='/docs')
    

@app.post("/open")
async def open(filepath: FilePath):
    sopt.decode(filepath.path)
    return { "message":  "success" }

@app.get("/getdisassembly")
async def getdisassembly():
    return { "message": sopt.get_dot() }
