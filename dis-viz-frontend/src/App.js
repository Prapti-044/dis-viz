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
  const [dyninstInfo, setDyninstInfo] = React.useState(null);
  const [sourceData, setSourceData] = React.useState([]);

  const [sourceViewStates, setSourceViewStates] = React.useState([
    { id: 0, lineSelection: { start: -1, end: -1 } }
  ]);

  const [activeDisassemblyView, setActiveDisassemblyView] = React.useState(0);
  const [disassemblyViewStates, setDisassemblyViewStates] = React.useState([
    { id: 0, lineSelection: { start: -1, end: -1 } }
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
          content: <TabContent><SourceView
            sourceData={sourceData}
            viewState={sourceViewStates}
            setNewSelection={(newSelection) => {

              // get the corresponding assembly address from newSelection
              const disassemblyLineSelection = dyninstInfo.lines
                .filter(data => data.file === selectedSourceFile)
                .filter(data => newSelection.start <= data.line && data.line <= newSelection.end)
                .reduce((acc, data) => ({
                  from: Math.min(acc.from, data.from),
                  to: Math.max(acc.to, data.to)
                }))

              // Update active disassemblyViewState
              const disassemblyViewStatesCopy = [...disassemblyViewStates];
              disassemblyViewStatesCopy[activeDisassemblyView] = {
                ...disassemblyViewStatesCopy[activeDisassemblyView],
                lineSelection: {
                  start: disassemblyLineSelection.from,
                  end: disassemblyLineSelection.to
                }
              }
              setDisassemblyViewStates(disassemblyViewStatesCopy);

              // Update sourceFileView state
              const sourceViewStatesCopy = [...sourceViewStates];
              sourceViewStatesCopy[activeDisassemblyView] = {
                ...sourceViewStatesCopy[activeDisassemblyView],
                lineSelection: {
                  start: newSelection.start,
                  end: newSelection.end
                }
              }
              setSourceViewStates(sourceViewStatesCopy);
            }}
            dyninstInfo={dyninstInfo}
          /></TabContent>,
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
          title: `Disassembly View (${parseInt(compNum)+1})`,
          content: <TabContent><DisassemblyView
            active={activeDisassemblyView===parseInt(compNum)}
            setActive={disassemblyViewId => {
              setActiveDisassemblyView(disassemblyViewId)
            }}
            disassemblyData={disassemblyData}
            viewState={disassemblyViewStates[compNum]}
            setNewSelection={(newSelection) => {
              // get the corresponding assembly address from newSelection
              const sourceLineSelection = dyninstInfo.lines
                .filter(data => data.file === selectedSourceFile)
                .filter(data => (data.from <= newSelection.start && newSelection.start < data.to) || (data.from <= newSelection.end && newSelection.end < data.to))
                .reduce((acc, data) => ({
                  from: Math.min(acc.from, data.line),
                  to: Math.max(acc.to, data.line)
                }), {from:9999999, to:-1})

              // Update active disassemblyViewState
              const sourceViewStatesCopy = [...sourceViewStates];
              sourceViewStatesCopy[activeDisassemblyView] = {
                ...sourceViewStatesCopy[activeDisassemblyView],
                lineSelection: {
                  start: sourceLineSelection.from,
                  end: sourceLineSelection.to
                }
              }
              setSourceViewStates(sourceViewStatesCopy);

              // Update sourceFileView state
              const disassemblyViewStatesCopy = [...disassemblyViewStates];
              disassemblyViewStatesCopy[activeDisassemblyView] = {
                ...disassemblyViewStatesCopy[activeDisassemblyView],
                lineSelection: {
                  start: newSelection.start,
                  end: newSelection.end
                }
              }
              setDisassemblyViewStates(disassemblyViewStatesCopy);
            }}
            dyninstInfo={dyninstInfo}
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
    const newDisassemblyViewState = {
      id: newId,
      lineSelection: { start: -1, end: -1 }
    }
    disassemblyViewStatesCopy.push(newDisassemblyViewState)
    setDisassemblyViewStates(disassemblyViewStatesCopy)

    const sourceViewStatesCopy = [...sourceViewStates]
    const newSourceViewState = {
      id: newId,
      lineSelection: { start: -1, end: -1 }
    }
    sourceViewStatesCopy.push(newSourceViewState)
    setSourceViewStates(sourceViewStatesCopy)


    // I shouldn't be writing this, but without this, it is not working
    context.dockMove(loadTab({
      id: "DisassemblyView:" + newId
    }), panelData, 'middle')
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
          margin: "4px",
          background: "white",
          border: "1px solid black",
          borderRadius: '5px'
        }}
        onClick={(event) => { addNewDisassembly(panelData, context) }}
      >
        +
      </button>
      <button
        style={{
          margin: "4px",
          background: "url('../assets/icons8-external-link-64.png')",
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
            // {
            //   tabs: [
            //     { id: "VariableRenamer:1" },
            //     { id: "Selection:1" }
            //   ],
            // },
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
          tabs: disassemblyViewStates.map(viewState => ({
            id: "DisassemblyView:"+viewState.id
          })),
          id: "DisassemblyViewPanel",
          panelLock: panelLockData,
        },
        // {
        //   size: 4,
        //   tabs: [
        //     { id: "ObjectView:1" },
        //   ],
        // },
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
            if(newLayout.tabs[tab].id.split(':')[0] === 'DisassemblyView') {
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
            addPanelLockToLayoutRecurse(newLayout.children[panelChild], panelData);
          }
        }
      }
    }
    const newLayoutCopy = {...newLayout};
    for(let key in newLayoutCopy) {
      addPanelLockToLayoutRecurse(newLayoutCopy[key], panelData);
    }
    return newLayoutCopy;
  }


  React.useEffect(() => {
    if (dockRef.current)
      dockRef.current.loadLayout(layout);
  })


  const onLayoutChange = (newLayout, currentTabId, direction) => {
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
