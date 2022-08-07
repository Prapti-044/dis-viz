import React from 'react'
import { useAppSelector } from '../app/hooks';
import { selectSelections } from '../features/selections/selectionsSlice';
import { codeColors } from '../utils';
import '../styles/sourcefiletree.css'


const DEFAULT_FILE_COLOR = "white"

type FileType = {
    name: string,
    fullPath: string,
    type: "file" | "directory",
    subdir: FileType[] | null,
    status: "closed" | "opened"
}


function SourceFileTree({ sourceViewData, setSourceViewData }:{
    sourceViewData: { file_name: string, status: "opened" | "closed" }[],
    setSourceViewData: (_: { file_name: string, status: "opened" | "closed" }[]) => void,
}) {
    const selections = useAppSelector(selectSelections)!
    
    const sourceColors: {[source_file: string]: string[]} = {}
    Object.entries(selections)
        .filter(([_, obj]) => obj)
        .map(([disassemblyId, obj]) => ({ colorId: disassemblyId, source_files: obj!.source_selection.map(sel => sel.source_file)}))
        .map(({colorId, source_files}) => source_files.map(source_file => ({colorId: Number(colorId), source_file})))
        .flat()
        .forEach(sel => {
            if(!(sel.source_file in sourceColors)) {
                sourceColors[sel.source_file] = []
            }
            sourceColors[sel.source_file].push(codeColors[sel.colorId])
        })

    sourceViewData.forEach((viewData) => {
        if (!(viewData.file_name in sourceColors)) {
            sourceColors[viewData.file_name] = [DEFAULT_FILE_COLOR];
        }
    })

    const finalSourceCSSBackground: {[source_file: string]: string} = {}
    sourceViewData.forEach(viewData => {
        const currentColors = sourceColors[viewData.file_name]
        if (currentColors.length > 1) {
            const percent = Math.floor(1/currentColors.length * 100)
            finalSourceCSSBackground[viewData.file_name] = "linear-gradient(to right, " + currentColors.map((color,i) => `${color} ${i*percent}%, ${color} ${i===currentColors.length-1?100:((i+1)*percent)}%`).join(', ') + ")"
        }
        else {
            finalSourceCSSBackground[viewData.file_name] = sourceColors[viewData.file_name][0]
        }
    })
    console.log(finalSourceCSSBackground)

    const clickedOnSource = (e: React.MouseEvent<HTMLLIElement>) => {
        const clickedSourceFile = e.currentTarget.getAttribute('datasource')!
        let sourceViewDataCopy = [...sourceViewData]
        const index = sourceViewDataCopy.findIndex(sourceData => sourceData.file_name === clickedSourceFile)!

        if (sourceViewDataCopy[index].status === "opened")
            sourceViewDataCopy[index].status = "closed"
        else if(sourceViewDataCopy[index].status === "closed")
            sourceViewDataCopy[index].status = "opened"
        setSourceViewData(sourceViewDataCopy)
    }


    const rootFile: FileType = {
        name: '/',
        fullPath: "/",
        type: "directory",
        subdir: [],
        status: "opened"
    }

    sourceViewData.forEach(({ file_name, status }) => {
        let currentLoc = rootFile
        const list = file_name.split("/").slice(1)
        list.forEach((fileOrFolder, i) => {
            const isFile = i === list.length-1
            if (isFile) {
                const newDir: FileType = {
                    name: fileOrFolder,
                    fullPath: "/"+list.slice(0,i+1).join('/'),
                    type: "file",
                    subdir: null,
                    status: status,
                }
                currentLoc.subdir!.push(newDir)
            }
            else {
                if(currentLoc.subdir?.map(dir => dir.name).includes(fileOrFolder)) {
                    currentLoc = currentLoc.subdir.find(dir => dir.name === fileOrFolder)!
                }
                else {
                    const newDir: FileType = {
                        name: fileOrFolder,
                        fullPath: "/"+list.slice(0,i+1).join('/'),
                        type: "directory",
                        subdir: [],
                        status: "opened",
                    }
                    currentLoc.subdir!.push(newDir)
                    currentLoc = newDir
                }
            }
        })
    })
    console.log(rootFile)

    function getJSXfromFiles(rootFile: FileType) {
        if (rootFile.type === "file")
            return <li
                key={rootFile.name}
                // @ts-ignore
                datasource={rootFile.fullPath}
                onClick={clickedOnSource}
                style={{
                    background: finalSourceCSSBackground[rootFile.fullPath]

                }}
                >
                    {rootFile.name}
            </li>
        return <li key={'l'+rootFile.name} className="folder">
                <a key={'a'+rootFile.name} onClick={e => {
                    e.currentTarget.classList.toggle("collapsed")
                }}>
                    {rootFile.name}
                </a>
                <ul key={'u'+rootFile.name}>
                    {rootFile.subdir!.map(getJSXfromFiles)}
                </ul>
            </li>
    }

    return <div className="box">
        <ul className="directory-list">
            {getJSXfromFiles(rootFile)}
        </ul>
    </div>
}


export default SourceFileTree;