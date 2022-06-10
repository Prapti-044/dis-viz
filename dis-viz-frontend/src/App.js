import SourceView from "./components/SourceView";
import ObjectViz from "./components/ObjectViz";
import React from 'react';
import InputFilePath from "./components/InputFilePath";
import * as api from "./api";
import DisassemblyView from "./components/DisassemblyView";

import { DockLayout, DockContextType } from 'rc-dock'
import "rc-dock/dist/rc-dock.css";




function App() {

  const [binaryFilePath, setBinaryFilePath] = React.useState("");
  const [selectedSourceFile, setSelectedSourceFile] = React.useState("");
  const [dotString, setDotString] = React.useState("");
  const [sourceFiles, setSourceFiles] = React.useState([]);
  const [disassemblyData, setDisassemblyData] = React.useState([]);
  const [dyninstInfo, setDyninstInfo] = React.useState({});
  const [sourceData, setSourceData] = React.useState([]);
  const [disassemblyViewList, setDisassemblyViewList] = React.useState([]);
  const [sourceFileLineSelection, setSourceFileLineSelection] = React.useState({ start: -1, end: -1 });

  console.log(sourceFileLineSelection);

  React.useEffect(() => {
    if (binaryFilePath.length === 0) return;
    api.openExe(binaryFilePath).then((result) => {
      if (result.message !== "success") return;

      api.getDisassemblyDot().then((result) => {
        setDotString(result);
      });

      api.getSourceFiles().then((result) => {
        setSourceFiles(result);
      });

      api.getDisassembly().then((result) => {
        setDisassemblyData(result);
      })

      api.getDyninstInfo().then((result) => {
        setDyninstInfo(result);
      })
    });
  }, [binaryFilePath]);

  React.useEffect(() => {
    if (selectedSourceFile.length === 0) return;
    api.getSourceLines(selectedSourceFile).then((result) => {
      setSourceData(result);
    })
  }, [binaryFilePath, selectedSourceFile])


  const loadTab = ({id}) => {
    switch (id) {
      case "SourceView":
        return {
          title: `Source View (${selectedSourceFile})`,
          content: <SourceView sourceData={sourceData} selectedLines={sourceFileLineSelection} setSelectedLines={setSourceFileLineSelection} />,
          closable: true,
          id,
        }
      case "InputFilePath":
        return {
          title: "Input File",
          content: <InputFilePath
            setBinaryFilePath={setBinaryFilePath}
            setSelectedSourceFile={setSelectedSourceFile}
            sourceFiles={sourceFiles}
            binaryFilePath={binaryFilePath}
            selectedSourceFile={selectedSourceFile}
          />,
          closable: true,
          id,
          minHeight: 150,
          minWidth: 250
        }
      case "ObjectView":
        return {
          title: "Object Visualization",
          content: <ObjectViz dotString={dotString} />,
          closable: true,
          id,
        }
      case "DisassemblyView":
        return {
          title: `Disassembly View (${selectedSourceFile})`,
          content: <DisassemblyView disassemblyData={disassemblyData} />,
          closable: true,
          id,
        }
      case 'protect1' :
        return {
          id, title: 'Protect',
          closable: true,
          content: <div>
            <p>Removal of this tab will be rejected</p>
            This is done in the onLayoutChange callback
          </div>
        };
      default:
        return {
          title: "Stub", 
          content: <div>{id}<br />(Stub!!!)</div>,
          closable: true,
          id,
        }
    }
  }

  const [layout, setLayout] = React.useState({
    dockbox: {
      mode: 'horizontal',
      children: [
        {
          mode: 'vertical',
          size: 1,
          children: [
            {
              tabs: [
                { id: "InputFilePath" },
              ],
            },
            {
              tabs: [
                { id: "VariableRenamer" },
                { id: "Selection" }],
            },
          ]
        },
        {
          size: 4,
          tabs: [
            { id: "SourceView" },
          ],
        },
        {
          size: 4,
          tabs: [
            { id: "DisassemblyView"},
          ],
        },
        {
          size: 4,
          tabs: [
            { id: "ObjectView" },
          ],
        },
      ]
    },
    floatbox: {
      mode: 'float',
      children: [
        // {
        //   tabs: [
        //     { id: 't9', title: 'Tab 9', content: <div>Float</div>, closable: true },
        //     { id: 't10', title: 'Tab 10', content: <div>Binary</div>, closable: true },
        //   ],
        //   x: 300, y: 150, w: 400, h: 300
        // }
      ]
    }
  });

  const dockRef = React.useRef();
  React.useEffect(() => {
    if(dockRef.current)
      dockRef.current.loadLayout(layout);
  })

  const onLayoutChange = (newLayout, currentTabId, direction) => {
    setLayout(newLayout);
  };


  return (
    <div className="App">
      <DockLayout ref={dockRef} layout={layout} loadTab={loadTab} onLayoutChange={onLayoutChange} style={{ position: 'absolute', left: 10, top: 10, right: 10, bottom: 10 }} />
    </div>
  )
}

export default App;
