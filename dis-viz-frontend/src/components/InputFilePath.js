import React from 'react'
import { Form, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function InputFilePath({ setBinaryFilePath, setSelectedSourceFile, sourceFiles }) {
    console.log("Loading InputFilePath");
    const [filepath, setFilepath] = React.useState("/samples/hello");
    const [activeSourceFile, setActiveSourceFile] = React.useState("");

    return <div style={{ margin: "25px" }}>
        <Form onSubmit={(event) => {
            event.preventDefault();
            setBinaryFilePath(filepath);
        }}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Binary File Path</Form.Label>
                <Form.Control type="text" value={filepath} onChange={(event) => {
                    setFilepath(event.target.value);
                }} />
                <Form.Text className="text-muted">
                    Use Absolute Path
                </Form.Text>
            </Form.Group>

            <Button variant="primary" type="submit">
                Submit
            </Button>
        </Form>

        <Form.Select
            aria-label="Source File Selection"
            onChange={(event) => {
                setActiveSourceFile(event.target.value);
                setSelectedSourceFile(event.target.value);
            }}
            defaultValue=""
        >
            {activeSourceFile===""?<option key={-1} value="">Select a source file to view</option>:<></>}
            { sourceFiles.map((d, i) => 
                <option key={i} value={d}>{d}</option>
            )}
        </Form.Select>
    </div>
}

export default InputFilePath