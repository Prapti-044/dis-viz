import 'reflect-metadata';
import SourceView from "./components/SourceView";
import ObjectViz from "./components/ObjectViz";
import React from 'react';
import * as api from "./api";
import DisassemblyView from "./components/DisassemblyView";

import { DockLayout, DockContextType, LayoutData, LayoutBase, DropDirection, TabData, PanelData, TabBase } from 'rc-dock'
import "rc-dock/dist/rc-dock.css";
import TabContent from "./components/TabContent";
import { LineCorrespondence, Function, SourceViewData, DyninstInfo, DisassemblyLineSelection } from './types';
import * as ComponentFactory from './ComponentFactory';





const App = () => {

  console.log("Module Loading")

  const [binaryFilePath, setBinaryFilePath] = React.useState("");
  const [binaryData, setBinaryData] = React.useState<{
    dotString: string|null,
    dyninstInfo: DyninstInfo,
  }>({
    dotString: null,
    dyninstInfo: {
      line_correspondence: [],
      functions: []
    }
  })

  const [activeSourceView, setActiveSourceView] = React.useState<number|null>(null)
  const [sourceViewStates, setSourceViewStates] = React.useState<SourceViewData[]>([])

  const [activeDisassemblyView, setActiveDisassemblyView] = React.useState<number|null>(null);
  const [disassemblyViewStates, setDisassemblyViewStates] = React.useState<{
    id: number,
    lineSelection: DisassemblyLineSelection|null
  }[]>([]);

  let dockRef: DockLayout | null;

  console.log("activeDisassemblyView", activeDisassemblyView)

  React.useEffect(() => {
    if (binaryFilePath.length === 0) return;
    console.log("Binary File Updated")
    Promise.all([
      api.getDisassemblyDot(binaryFilePath),
      api.getSourceFiles(binaryFilePath),
      api.getDyninstInfo(binaryFilePath),
    ]).then(([resultDot, resultSourceFiles, resultDyninstInfo]) => {
      setBinaryData({
        dotString: resultDot,
        dyninstInfo: resultDyninstInfo
      })
      setSourceViewStates(resultSourceFiles.map<SourceViewData>(sourceFile => ({
        file_name: sourceFile,
        lineSelection: null,
        opened: false
      })))
      setDisassemblyViewStates([{
        id: 1,
        lineSelection: null
      }])

    })
  }, [binaryFilePath]);

  React.useEffect(() => {
    if (dockRef === null) return;
    disassemblyViewStates
      .map<TabData>(disassemblyViewState => ({
        id: "DisassemblyView:"+disassemblyViewState.id,
        title: "Disassembly View: " + disassemblyViewState.id,
        content: ComponentFactory.CreateDisassemblyView(
          disassemblyViewState.id,
          binaryFilePath,
          activeDisassemblyView,
          setActiveDisassemblyView,
          disassemblyViewState.lineSelection,
          1,
          newSelection => {
            const disassemblyViewStateCopy = [...disassemblyViewStates]
            const stateIndex = disassemblyViewStateCopy.findIndex(disState => disState.id === disassemblyViewState.id)
            disassemblyViewStateCopy[stateIndex] = {
              id: disassemblyViewState.id,
              lineSelection: newSelection
            }
            setDisassemblyViewStates(disassemblyViewStateCopy)
          },
          binaryData.dyninstInfo
        ),
        closable: true
      }))
      .forEach(disassemblyViewComponent => {
        const tabData = dockRef!.find(disassemblyViewComponent.id!)
        if (tabData !== undefined) {
          dockRef!.updateTab(tabData.id!.toString(), disassemblyViewComponent);
        }
        else {
          const newPanel: PanelData = {
            tabs: [disassemblyViewComponent],
            x: 10, y: 10, w: 400, h: 400
          }
          dockRef!.dockMove(newPanel, null, 'float')
        }
      })
  }, [disassemblyViewStates])


  const loadTab = ({ id }: { id: string }): TabData => {
    const [compName, compNum] = id.split(':')
    switch (compName) {
      case "InputFilePath":
        return {
          id: "InputFilePath:1",
          cached: true,
          title: "Input File",
          content: ComponentFactory.CreateInputFilePath(binaryFilePath, setBinaryFilePath, sourceViewStates),
          closable: false,
          minHeight: 150,
          minWidth: 250,
        }
      case "ObjectView":
        return {
          id,
          title: "Object Visualization",
          cached: true,
          content: <TabContent><ObjectViz dotString={binaryData.dotString} /></TabContent>,
          closable: true,
        }
      case "DisassemblyView":
        return {
          id:"DisassemblyView:"+compNum,
          title: "Disassembly View: " + compNum,
          cached: true,
          content: ComponentFactory.CreateDisassemblyView(
            parseInt(compNum),
            binaryFilePath,
            activeDisassemblyView,
            setActiveDisassemblyView,
            disassemblyViewStates.find(disState => disState.id === parseInt(compNum))!.lineSelection,
            1,
            (newSelection) => { 
              const disassemblyViewStateCopy = [...disassemblyViewStates]
              const stateIndex = disassemblyViewStateCopy.findIndex(disState => disState.id === parseInt(compNum))
              disassemblyViewStateCopy[stateIndex] = {
                id: parseInt(compNum),
                lineSelection: newSelection
              }
              setDisassemblyViewStates(disassemblyViewStateCopy)
            },
            binaryData.dyninstInfo
          ),
          closable: true,
          minHeight: 150,
          minWidth: 150
        }
      default:
        return {
          id,
          title: id,
          content: <div style={{ textAlign: 'center', height: '100%', top: '50%', position: 'absolute' }}>(Stub!!!)</div>,
          closable: true,
          minHeight: 150,
          minWidth: 150
        }
    }
  }

  const [layout, setLayout] = React.useState<LayoutData>({
    dockbox: {
      mode: 'horizontal',
      children: [
        {
          mode: 'vertical',
          size: 1,
          children: [
            {
              tabs: [
                // { id: "InputFilePath:1" } as TabData
                {
                  id: "InputFilePath:1",
                  title: "Input File",
                  content: ComponentFactory.CreateInputFilePath(binaryFilePath, setBinaryFilePath, sourceViewStates),
                  closable: false,
                  minHeight: 150,
                  minWidth: 250
                }
              ],
            },
          ]
        },
        {
          mode: 'vertical',
          size: 4,
          children: [{
            id: 'DisassemblyViewPanel',
            tabs: [],
            panelLock: {
              minWidth: 300,
              minHeight: 300,
              panelExtra: (panelData) => (
                <button onClick={() => {
                  console.log(panelData)
                }}>
                  add
                </button>
              )

            }
          }]
        }
      ]
    },
  });

  const onLayoutChange = (newLayout: LayoutData, currentTabId: string, direction: DropDirection) => {
    console.log("Layout Change Called")
    console.log("    currentTabId", currentTabId)
    console.log("    direction", direction)
    console.log("    newLayout", newLayout)
    setLayout(newLayout)
  };

  return (
    <div className="App">
      <DockLayout
        ref={(r) => {dockRef = r}}
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
