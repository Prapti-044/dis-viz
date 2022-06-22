import SourceView from "./components/SourceView";
import ObjectViz from "./components/ObjectViz";
import React from 'react';
import InputFilePath from "./components/InputFilePath";
import * as api from "./api";
import DisassemblyView from "./components/DisassemblyView";

import { DockLayout, DockContextType } from 'rc-dock'
import "rc-dock/dist/rc-dock.css";
import TabContent from "./components/TabContent";




const App = () => {

  const [binaryFilePath, setBinaryFilePath] = React.useState("");
  const [selectedSourceFile, setSelectedSourceFile] = React.useState("");
  const [dotString, setDotString] = React.useState(null);
  const [sourceFiles, setSourceFiles] = React.useState([]);
  const [disassemblyData, setDisassemblyData] = React.useState(null);
  const [dyninstInfo, setDyninstInfo] = React.useState({});
  const [sourceData, setSourceData] = React.useState([]);
  const [sourceFileLineSelection, setSourceFileLineSelection] = React.useState({ start: -1, end: -1 });

  const [disassemblySelectedLines, setDisassemblySelectedLines] = React.useState({ start: -1, end: -1 });
  const [disassemblyViewStates, setDisassemblyViewStates] = React.useState([
    { id: 1, lineSelection: { start: -1, end: -1 } }
  ]);
  const dockRef = React.useRef();



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


  const loadTab = ({ id }) => {
    const [compName, compNum] = id.split(':')
    switch (compName) {
      case "SourceView":
        return {
          title: `Source View (${selectedSourceFile})`,
          content: <TabContent><SourceView sourceData={sourceData} selectedLines={sourceFileLineSelection} setSelectedLines={setSourceFileLineSelection} /></TabContent>,
          closable: true,
          id,
          minHeight: 150,
          minWidth: 150
        }
      case "InputFilePath":
        return {
          title: "Input File",
          content: <TabContent><InputFilePath
            setBinaryFilePath={setBinaryFilePath}
            setSelectedSourceFile={setSelectedSourceFile}
            sourceFiles={sourceFiles}
            binaryFilePath={binaryFilePath}
            selectedSourceFile={selectedSourceFile}
          /></TabContent>,
          closable: true,
          id,
          minHeight: 150,
          minWidth: 250
        }
      case "ObjectView":
        return {
          title: "Object Visualization",
          content: <TabContent><ObjectViz dotString={dotString} /></TabContent>,
          closable: true,
          id,
        }
      case "DisassemblyView":
        return {
          title: 'Disassembly View',
          content: <TabContent><DisassemblyView
            disassemblyData={disassemblyData}
            setSelectedLines={setDisassemblySelectedLines}
            selectedLines={disassemblySelectedLines}
          /></TabContent>,
          closable: true,
          id,
          minHeight: 150,
          minWidth: 150
        }
      default:
        return {
          title: id,
          content: <div style={{ textAlign: 'center', height: '100%', top: '50%', position: 'absolute' }}>(Stub!!!)</div>,
          closable: true,
          id,
          minHeight: 150,
          minWidth: 150
        }
    }
  }

  const addNewDisassembly = (panelData, context) => {
    const newId = disassemblyViewStates[disassemblyViewStates.length - 1].id + 1;
    const disassemblyViewStatesCopy = [...disassemblyViewStates]
    disassemblyViewStatesCopy.push({
      id: newId,
      lineSelection: { start: -1, end: -1 }
    })

    context.dockMove(loadTab({ id: "DisassemblyView:" + newId }), panelData, 'middle')

    // Changing states like this is not recommended. But could not find a better way
    disassemblyViewStates.push(disassemblyViewStatesCopy[disassemblyViewStatesCopy.length - 1])
    setDisassemblyViewStates(disassemblyViewStatesCopy)
  }

  function moveToNewWindow(panelData, context) {
    if (!('isDocked' in panelData) || panelData['isDocked']) {
      panelData.h = 700;
      panelData.w = 512;
      panelData.x = 200;
      panelData.y = 200;
      panelData['isDocked'] = false;
      context.dockMove(panelData, panelData, 'new-window')
    }
    else {
      panelData['isDocked'] = true;
      panelData.h = 700;
      panelData.w = 512;
      panelData.x = 200;
      panelData.y = 200;
      context.dockMove(panelData, panelData, 'float')
    }
  }

  const panelLockData = {
    panelExtra: (panelData, context) => (<>
      <button
        style={{
          margin: "4px"
        }}
        onClick={(event) => { addNewDisassembly(panelData, context) }}
      >
        +
      </button>
      <button
        style={{
          margin: "4px"
        }}
        onClick={(event) => { moveToNewWindow(panelData, context) }}
      >
      </button>
    </>)
  };

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
                { id: "InputFilePath:1" },
              ],
            },
            {
              tabs: [
                { id: "VariableRenamer:1" },
                { id: "Selection:1" }
              ],
            },
          ]
        },
        {
          size: 4,
          tabs: [
            { id: "SourceView:1" },
          ],
        },
        {
          size: 4,
          tabs: disassemblyViewStates.map(viewState => ({ id: "DisassemblyView:"+viewState.id})),
          id: "DisassemblyViewPanel",
          panelLock: panelLockData,
        },
        {
          size: 4,
          tabs: [
            { id: "ObjectView:1" },
          ],
        },
      ]
    },
  });

  function addPanelLockToLayout(newLayout, panelData) {
    function addPanelLockToLayoutRecurse(newLayout, panelData) {
      if (typeof newLayout == "object" && newLayout !== null) {
        // if (!newLayout.hasOwnProperty('tabs')) return; 
        if ('tabs' in newLayout) {
          let foundDisassemblyView = false;
          for(let tab in newLayout.tabs) {
            if(tab.id.split(':')[0] === 'DisassemblyView') {
              foundDisassemblyView = true;
              break
            }
          }
          if (foundDisassemblyView) {
            newLayout['panelLock'] = panelData;
          }
        }
        else if ('children' in newLayout) {
          for(let panelChild in newLayout.children) {
            addPanelLockToLayoutRecurse(panelChild, panelData);
          }
        }
      }
    }
    const newLayoutCopy = {...newLayout};
    for(let key in newLayoutCopy) {
      addPanelLockToLayoutRecurse(newLayoutCopy[key], panelData);
    }
    console.log("New Layout Copy")
    console.log(newLayoutCopy);
    return newLayoutCopy;
  }


  console.log("Layout")
  console.log(layout);
  React.useEffect(() => {
    console.log("calling laodlayout")
    if (dockRef.current)
      dockRef.current.loadLayout(layout);
  })


  const onLayoutChange = (newLayout, currentTabId, direction) => {
    console.log("Called onLayoutChange")
    setLayout(addPanelLockToLayout(newLayout, panelLockData));
  };

  return (
    <div className="App">
      <DockLayout
        ref={dockRef}
        defaultLayout={layout}
        loadTab={loadTab}
        onLayoutChange={onLayoutChange}
        style={{
          position: 'absolute',
          left: 5,
          top: 5,
          right: 5,
          bottom: 5
        }}
      />
    </div>
  )
}

export default App;
