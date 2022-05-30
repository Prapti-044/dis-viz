import React from 'react'
import { Form, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function InputFilePath() {
    const [filepath, setFilepath] = React.useState("/home/ccnavuser/a3.out");


    return (
        <Form style={{ margin: "25px" }} onSubmit={(event) => {
            event.preventDefault();
            console.log(filepath);
        }}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Binary File Path</Form.Label>
                <Form.Control type="text" value={filepath} onChange={(event) => setFilepath(event.target.value)} />
                <Form.Text className="text-muted">
                    Use Absolute Path
                </Form.Text>
            </Form.Group>

            <Button variant="primary" type="submit">
                Submit
            </Button>
        </Form>
    )
}

export default InputFilePath