import React from 'react'
import { Form, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as api from "../api";

function InputFilePath({ binaryFilePath, setBinaryFilePath, selectedSourceFile, setSelectedSourceFile, sourceFiles }:{
    binaryFilePath: string,
    setBinaryFilePath: (path: string) => void,
    selectedSourceFile: string,
    setSelectedSourceFile: (path: string) => void,
    sourceFiles: string[]
}) {

    const [activeSourceFile, setActiveSourceFile] = React.useState("");
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
    });

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

        <Form.Select
            aria-label="Source File Selection"
            onChange={(event: React.FormEvent<HTMLSelectElement>) => {
                setActiveSourceFile((event.target as HTMLSelectElement).value);
                setSelectedSourceFile((event.target as HTMLSelectElement).value);
            }}
            value={selectedSourceFile}
        >
            {activeSourceFile===""?<option key={-1} value="">Select a source file to view</option>:<></>}
            { sourceFiles.map((d, i) => 
                <option key={i} value={d}>{d}</option>
            )}
        </Form.Select>
    </div>
}

export default InputFilePath