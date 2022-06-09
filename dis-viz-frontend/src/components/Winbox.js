import React from 'react'
import ReactDOMServer from 'react-dom/server'
import WinBox from 'winbox/src/js/winbox'
import 'winbox/dist/css/winbox.min.css'


const WinboxReact = ({
    title= 'STUB',
    border= '0',
    background= '#28292d',
    className= "modern",
    x= "center",
    y= "center",
    modal= false,
    width= "100px",
    height= "100px",
    onclose= () => { },
    children
}) => {
    React.useEffect(() => {
        const wb = new WinBox(title, {
            border,
            background,
            x,
            y,
            width,
            height,
            modal,
            html: ReactDOMServer.renderToStaticMarkup(children),
            class: className,
            onclose
        })
    })
    return <div style={{
        minHeight: "100vh"
      }}
      ></div>
}

export default WinboxReact