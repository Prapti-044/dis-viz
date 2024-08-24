import React from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import 'bootstrap/dist/css/bootstrap.min.css'
import * as api from "../api"
import '../styles/inputsourcefilepath.css'
import { selectBinaryFilePath, setBinaryFilePath } from '../features/binary-data/binaryDataSlice'
import { useAppSelector, useAppDispatch } from '../app/hooks'

function InputFilePath() {
    const [binaryList, setBinaryList] = React.useState<{
        name: string,
        executable_path: string
    }[]>([]);

    const dispatch = useAppDispatch();
    const binaryFilePath = useAppSelector(selectBinaryFilePath)!

    React.useEffect(() => {
        if(binaryList.length !== 0) return;
        const fetchBinaryList = async () => {
            const result =  await api.getBinaryList();
            setBinaryList(result);
        }
        fetchBinaryList().catch(console.error);
    }, [binaryList]);

    return <div style={{ margin: "25px" }}>
        <Form.Group className="mb-3">
            <Form.Label>Binary File Path</Form.Label>
            <Form.Select
                style={{
                    width: "90%"
                }}
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
    </div>
}

export default InputFilePath