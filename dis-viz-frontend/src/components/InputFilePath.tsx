import React from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import 'bootstrap/dist/css/bootstrap.min.css'
import * as disvizProcessor from "../disvizProcessor"
import '../styles/inputsourcefilepath.css'
import { selectBinaryFilePaths, addBinaryFilePath, removeBinaryFilePath, replaceBinaryFilePath, clearBinaryFilePaths } from '../features/binary-data/binaryDataSlice'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { toast } from 'react-toastify'

function InputFilePath() {
    const [uploadStatus, setUploadStatus] = React.useState<string>('');
    const [isUploading, setIsUploading] = React.useState<boolean>(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const dispatch = useAppDispatch();
    const binaryFilePaths = useAppSelector(selectBinaryFilePaths)!

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        setIsUploading(true);
        setUploadStatus('');

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                if (!file.name.endsWith('.disviz')) {
                    throw new Error(`Invalid file type: ${file.name}. Only .disviz files are supported.`);
                }
                
                const fileName = await disvizProcessor.loadDisvizFile(file);
                return fileName;
            });

            const loadedFileNames = await Promise.all(uploadPromises);
            
            // Clear existing paths and add new ones
            dispatch(clearBinaryFilePaths());
            loadedFileNames.forEach(fileName => {
                dispatch(addBinaryFilePath(fileName));
            });

            setUploadStatus(`Successfully loaded ${loadedFileNames.length} .disviz file(s)`);
            toast.success(`Loaded ${loadedFileNames.length} .disviz file(s)`);
            
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setUploadStatus(`Error: ${errorMessage}`);
            toast.error(`Failed to load file(s): ${errorMessage}`);
        } finally {
            setIsUploading(false);
        }
    };

    const loadedFileNames = disvizProcessor.getLoadedFileNames();

    return <div style={{ margin: "25px" }}>
        <div style={{ marginBottom: "20px" }}>
            <h5>Upload .disviz Files</h5>
            <Form.Group>
                <Form.Control
                    ref={fileInputRef}
                    type="file"
                    accept=".disviz"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isUploading}
                />
                <Form.Text className="text-muted">
                    Select one or more .disviz files to analyze. These files contain pre-processed binary analysis data.
                </Form.Text>
            </Form.Group>
            
            {isUploading && (
                <Alert variant="info" style={{ marginTop: "10px" }}>
                    Uploading and processing files...
                </Alert>
            )}
            
            {uploadStatus && !isUploading && (
                <Alert 
                    variant={uploadStatus.startsWith('Error') ? 'danger' : 'success'} 
                    style={{ marginTop: "10px" }}
                >
                    {uploadStatus}
                </Alert>
            )}
        </div>

        {loadedFileNames.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
                <h6>Loaded Files:</h6>
                <ul>
                    {loadedFileNames.map(fileName => (
                        <li key={fileName}>{fileName}</li>
                    ))}
                </ul>
            </div>
        )}

        {binaryFilePaths.length === 0 && loadedFileNames.length > 0 && (
            <Alert variant="warning">
                Files are loaded but not selected. Use the buttons below to add them to your analysis.
            </Alert>
        )}

        {/* File selection interface */}
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
                    <option key={-1} value="">Select a Loaded File</option>
                    {loadedFileNames.map((fileName, idx) => {
                        return <option key={idx} value={fileName}>{fileName}</option>
                    })}
                </Form.Select>
                <Button 
                    variant="outline-danger"
                    size="sm"
                    style={{ marginLeft: "10px" }}
                    onClick={() => dispatch(removeBinaryFilePath(index))}
                >
                    -
                </Button>
            </div>
        })}
        
        {loadedFileNames.length > 0 && (
            <Button 
                variant="outline-primary"
                style={{
                    marginTop: "10px",
                    float: "right"
                }} 
                onClick={() => {
                    dispatch(addBinaryFilePath(""));
                }}
                disabled={loadedFileNames.length === 0}
            > 
                Add Another File 
            </Button>
        )}

        {loadedFileNames.length === 0 && (
            <Alert variant="info">
                Please upload .disviz files using the file selector above to begin analysis.
            </Alert>
        )}
    </div>
}

export default InputFilePath