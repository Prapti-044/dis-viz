import React from 'react'
import { Form, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as api from "../api";
import { SourceViewData } from '../types';
import '../styles/inputsourcefilepath.css'
import { selectBinaryFilePath, setBinaryFilePath } from '../features/binary-data/binaryDataSlice'
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectSelections } from '../features/selections/selectionsSlice';
import { codeColors } from '../utils'


const DEFAULT_FILE_COLOR = "gray"

function InputFilePath({ sourceViewData, setSourceViewData }:{
    sourceViewData: { file_name: string, status: "opened" | "closed" | "opening" }[],
    setSourceViewData: (_: { file_name: string, status: "opened" | "closed" | "opening" }[]) => void,
}) {

    const [binaryList, setBinaryList] = React.useState<{
        name: string,
        executable_path: string
    }[]>([]);

    const dispatch = useAppDispatch();
    const binaryFilePath = useAppSelector(selectBinaryFilePath)!
    const selections = useAppSelector(selectSelections)!

    const sourceColors: {[source_file: string]: string[]} = {}
    const sourceSelections = Object.entries(selections)
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

    

    React.useEffect(() => {
        if(binaryList.length !== 0) return;
        const fetchBinaryList = async () => {
            const result =  await api.getBinaryList();
            setBinaryList(result);
        }
        fetchBinaryList().catch(console.error);
    }, [binaryList]);

    const clickedOnSource = (e: React.MouseEvent<HTMLButtonElement>) => {
        const clickedSourceFile = e.currentTarget.getAttribute('datasource')!
        let sourceViewDataCopy = [...sourceViewData]
        const index = sourceViewDataCopy.findIndex(sourceData => sourceData.file_name === clickedSourceFile)!
        sourceViewDataCopy[index].status = "opening"
        setSourceViewData(sourceViewDataCopy)
    }

    return <div style={{ margin: "25px" }}>
        <Form.Group className="mb-3">
            <Form.Label>Binary File Path</Form.Label>
            <Form.Select
                aria-label="Binary File Selection"
                onChange={(event: React.FormEvent<HTMLSelectElement>) => {
                    dispatch(setBinaryFilePath((event.target as HTMLSelectElement).value))
                }}
                value={binaryFilePath}
            >
                {binaryFilePath===""?<option key={-1} value="">Select Binary file to open</option>:<></>}
                { binaryList.map((d, i) => 
                    <option key={i} value={d.executable_path}>{d.name}</option>
                )}
            </Form.Select>
        </Form.Group>

        <div>
            <ul style={{
                listStyleType: 'none',
                margin: '0',
                padding: '0'
            }}>
                {sourceViewData
                    .filter(sourceViewDaton => sourceViewDaton.status === "closed")
                    .map(sourceViewDaton => <li
                        className={'sourcename'}
                        key={sourceViewDaton.file_name}
                    // @ts-ignore
                    ><button datasource={sourceViewDaton.file_name}
                        title={sourceViewDaton.file_name} onClick={clickedOnSource}
                        style={{
                            background: sourceColors[sourceViewDaton.file_name][0]
                        }}
                    >
                        {/* I had to reverse the string to make truncating work properly */}
                        {sourceViewDaton.file_name.split("").reverse().join("")}
                    </button>
                </li>)}
            </ul>
        </div>

    </div>
}

export default InputFilePath