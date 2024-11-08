import React from 'react'
import { useAppSelector } from '../app/hooks';
import { selectSelection } from '../features/selections/selectionsSlice';
import '../styles/sourcefiletree.css'
import CSS from 'csstype';
import { HIGHLIGHT_COLOR } from '../utils';
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
    const selectedFiles = useAppSelector(selectSelection).source_selection.map(file => file.source_file)
    
    const clickedOnSource = (e: React.MouseEvent<HTMLLIElement>) => {
        const clickedSourceFile = e.currentTarget.getAttribute('data-source')!
        const sourceViewDataCopy = [...sourceViewData]
        const index = sourceViewDataCopy.findIndex(sourceData => sourceData.file_name === clickedSourceFile)!
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
    // Simplify the nested single directories
    function simplifyStructure(root: FileType) {
        if (root.type === 'file') return
        while(root.subdir && root.subdir.length === 1 && root.subdir[0].type !== 'file') {
            root.name = root.name + '/' + root.subdir[0].name
            root.fullPath = root.subdir[0].fullPath
            root.status = root.subdir[0].status
            root.type = root.subdir[0].type
            root.subdir = root.subdir[0].subdir
        }

        root.subdir?.forEach(file => {
            simplifyStructure(file)
        })
    }
    simplifyStructure(rootFile)

    function getJSXfromFiles(rootFile: FileType) {
        if (rootFile.type === "file") {
            const style: CSS.Properties = {
                whiteSpace: 'nowrap',
                backgroundColor: selectedFiles.includes(rootFile.fullPath) ? HIGHLIGHT_COLOR : 'transparent'
            }
            if (rootFile.status === 'opened') {
                style.textDecoration = 'underline'
                style.textDecorationColor = 'red'
            }
            return (
                <li
                    key={rootFile.name}
                    data-source={rootFile.fullPath}
                    onClick={clickedOnSource}
                    style={style}
                >
                    {rootFile.name}
                </li>
            );
        }
        return <div className="folder-wrapper" key={'d'+rootFile.name}>
            <li className="folder">
                <button
                    onClick={e => {
                        e.currentTarget.classList.toggle("collapsed")
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'black',
                        cursor: 'pointer',
                        display: 'inline',
                        textAlign: 'left',
                        padding: '0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                >
                    {rootFile.name}
                </button>
                <ul>
                    {rootFile.subdir!.map(getJSXfromFiles)}
                </ul>
            </li></div>
    }

    return <ul className="directory-list">
            {getJSXfromFiles(rootFile)}
        </ul>
}


export default SourceFileTree;