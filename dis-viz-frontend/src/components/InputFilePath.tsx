import React from 'react'
import { Form, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as api from "../api";
import { SourceViewData } from '../types';
import '../styles/inputsourcefilepath.css'

function InputFilePath({ binaryFilePath, setBinaryFilePath, sourceViewData }:{
    binaryFilePath: string,
    setBinaryFilePath: (path: string) => void,
    sourceViewData: SourceViewData[]
}) {

    const [binaryList, setBinaryList] = React.useState<{
        name: string,
        executable_path: string
    }[]>([]);

    React.useEffect(() => {
        if(binaryList.length !== 0) return;
        const fetchBinaryList = async () => {
            const result =  await api.getBinaryList();
            setBinaryList(result);
        }
        fetchBinaryList().catch(console.error);
    }, [binaryList]);

    const clickedOnSource = (e: React.MouseEvent<HTMLButtonElement>) => {
        console.log('clicked on ', e.currentTarget.getAttribute('datasource'))
    }

    return <div style={{ margin: "25px" }}>
        <Form.Group className="mb-3">
            <Form.Label>Binary File Path</Form.Label>
            <Form.Select
                aria-label="Binary File Selection"
                onChange={(event: React.FormEvent<HTMLSelectElement>) => {
                    setBinaryFilePath((event.target as HTMLSelectElement).value);
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
                    .filter(sourceViewDaton => !sourceViewDaton.opened)
                    .map(sourceViewDaton => <li
                        className={'sourcename'}
                        key={sourceViewDaton.file_name}
                    // @ts-ignore
                    ><button datasource={sourceViewDaton.file_name} onClick={clickedOnSource}>
                        {sourceViewDaton.file_name}
                    </button>
                </li>)}
            </ul>
        </div>

    </div>
}

export default InputFilePath