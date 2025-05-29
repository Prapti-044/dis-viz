import React from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import 'bootstrap/dist/css/bootstrap.min.css'
import * as api from "../api"
import '../styles/inputsourcefilepath.css'
import { selectBinaryFilePaths, addBinaryFilePath, removeBinaryFilePath, replaceBinaryFilePath } from '../features/binary-data/binaryDataSlice'
import { useAppSelector, useAppDispatch } from '../app/hooks'

function InputFilePath() {
    const [binaryList, setBinaryList] = React.useState<{
        name: string,
        executable_path: string
    }[]>([]);

    const dispatch = useAppDispatch();
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths)!

    React.useEffect(() => {
        if(binaryList.length !== 0) return;
        api.getBinaryList().then(bList => {
            bList.sort((a, b) => a.name.localeCompare(b.name || ""));
            setBinaryList(bList)
        }).catch(console.error);
    }, [binaryList]);

    return <div style={{ margin: "25px" }}>
        {binaryFilePaths.length === 0 && <Form.Select
            onChange={(e) => {
                dispatch(addBinaryFilePath(e.target.value));
            }}
        >
            <option key={-1} value="">Select a Binary</option>
            {binaryList.map((binary, index) => {
                return <option key={index} value={binary.executable_path}>{binary.name}</option>
            })}
        </Form.Select>}
        {binaryFilePaths.map((binaryFilePath, index) => {
            const row = (index % 2) + 1;
            const col = Math.floor(index / 2) + 1;
            const totalColumns = Math.ceil(binaryFilePaths.filter(path => path !== "").length / 2);

            const hasSelectedBinaries = binaryFilePath !== "";
            return <div key={index} className="input-source-file-path" style={{
                display: "flex",
                alignItems: "center",
                marginTop: "10px"
            }}>
                <div className="binary-index" style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${totalColumns}, 12px)`,
                    gap: "1px",
                    marginRight: "10px",
                    width: `${totalColumns * 12 + (totalColumns - 1)}px`,
                    height: "25px"
                }}>
                    {hasSelectedBinaries && [...Array(totalColumns * 2)].map((_, i) => {
                        const squareRow = Math.floor(i / totalColumns) + 1;
                        const squareCol = (i % totalColumns) + 1;
                        console.log(squareRow, squareCol)
                        return <div key={i} style={{
                            width: "12px",
                            height: "12px",
                            border: "1px solid #ccc",
                            backgroundColor: (squareRow === row && squareCol === col && binaryFilePath !== "") ? "#868686" : "transparent",
                            color: (squareRow === row && squareCol === col && binaryFilePath !== "") ? "#dddddd" : "transparent"
                        }}></div>
                    })}
                </div>
                <Form.Select value={binaryFilePath} 
                onChange={(e) => {
                    dispatch(replaceBinaryFilePath({ index, binaryFilePath: e.target.value }));
                }}>
                    <option key={-1} value="">Select a Binary</option>
                    {binaryList.map((binary, index) => {
                        return <option key={index} value={binary.executable_path}>{binary.name}</option>
                    })}
                </Form.Select>
                <Button onClick={() => dispatch(removeBinaryFilePath(index))}>-</Button>
            </div>
        })}
        <Button style={{
            marginTop: "10px",
            float: "right"
        }} onClick={() => {
            dispatch(addBinaryFilePath(""));
        }}> Add Another Binary </Button>
    </div>
}

export default InputFilePath