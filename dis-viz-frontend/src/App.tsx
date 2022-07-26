import 'reflect-metadata';
import ObjectViz from "./components/ObjectViz";
import React from 'react';
import * as api from "./api";

import { DockLayout, LayoutData, DropDirection, TabData, PanelData } from 'rc-dock'
import "rc-dock/dist/rc-dock.css";
import TabContent from "./components/TabContent";
import { SourceViewData, DyninstInfo, DisassemblyLineSelection, ReactContext } from './types';
import * as ComponentFactory from './ComponentFactory';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAppSelector, useAppDispatch } from './app/hooks';
import { selectActiveDisassemblyView, setActiveDisassemblyView } from './features/active-disassembly-view/activeDisassemblyViewSlice'
import { selectSelections, initializeSourceFiles, setSourceLineSelection } from './features/selections/selectionsSlice'


export const Context = React.createContext<ReactContext>({
  binaryFilePath: "",
  setBinaryFilePath: _ => {},
  binaryData: {
    dotString: null,
    dyninstInfo: { line_correspondence: [], functions: [] }
  },
  setBinaryData: _ => {},
  sourceViewStates: [],
  setSourceViewStates: _ => {},
  activeDisassemblyView: null,
  setActiveDisassemblyView: _ => {},
  disassemblyViewStates: [],
  setDisassemblyViewStates: _ => {}
});


const App = () => {

  const dispatch = useAppDispatch();

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

  // const [sourceViewStates, setSourceViewStates] = React.useState<SourceViewData[]>([])
  // const [activeDisassemblyView, setActiveDisassemblyView] = React.useState<number|null>(null);
  // const [disassemblyViewStates, setDisassemblyViewStates] = React.useState<{
  //   id: number,
  //   lineSelection: DisassemblyLineSelection|null
  // }[]>([]);

  const activeDisassemblyView = useAppSelector(selectActiveDisassemblyView)

  console.log("From App:")
  // console.log("    sourceViewStates", sourceViewStates)
  // console.log("    disassemblyViewStates", disassemblyViewStates)
  console.log("    activeDisassemblyView", activeDisassemblyView)

  let dockRef: DockLayout | null;

  // Gets all info if binary file is changed
  React.useEffect(() => {
    if (binaryFilePath.length === 0) return;
    Promise.all([
      api.getDisassemblyDot(binaryFilePath),
      api.getSourceFiles(binaryFilePath),
      api.getDyninstInfo(binaryFilePath),
    ]).then(([resultDot, resultSourceFiles, resultDyninstInfo]) => {
      setBinaryData({
        dotString: resultDot,
        dyninstInfo: resultDyninstInfo
      })
      dispatch(initializeSourceFiles(resultSourceFiles))
      // setSourceViewStates(resultSourceFiles.map<SourceViewData>(sourceFile => ({
      //   file_name: sourceFile,
      //   lineSelections: [],
      //   status: "closed"
      // })))
      // setDisassemblyViewStates([{
      //   id: 1,
      //   lineSelection: null
      // }])

    })
  }, [binaryFilePath]);

  // Consolidates disassemblyViewState and dis-views
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
          (newActiveDisView) => { dispatch(setActiveDisassemblyView(newActiveDisView)) },
          disassemblyViewState.lineSelection,
          1,
          newSelection => {
            // set disassembly line selection
            const disassemblyViewStateCopy = [...disassemblyViewStates]
            const stateIndex = disassemblyViewStateCopy.findIndex(disState => disState.id === disassemblyViewState.id)
            disassemblyViewStateCopy[stateIndex] = {
              id: disassemblyViewState.id,
              lineSelection: newSelection
            }
            setDisassemblyViewStates(disassemblyViewStateCopy)

            // set corresponding source line selection
            // const sourceViewStatesCopy = [...sourceViewStates]
            
          },
          binaryData.dyninstInfo,
          Context
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
          dockRef!.dockMove(newPanel, 'DisassemblyViewPanel', 'middle')
        }
      })
      // set it active if there is only one disview
      if (disassemblyViewStates.length === 1) {
        dispatch(setActiveDisassemblyView(disassemblyViewStates[0].id))
      }

  }, [disassemblyViewStates])

  const addNewLineSelection = (newLineSelection: {start: number, end: number}, sourceViewI: number) => {
                      // set source line selection
                      console.log("Inside newLineSelection:")
                      console.log("    activeDisView", activeDisassemblyView)
                      // I had to use setState hook to get the latest value of activeDisassemblyView
                      const sourceViewStatesCopy = [...sourceViewStates]
                      const oldLineSelections = sourceViewStatesCopy[sourceViewI].lineSelections
                      const oldLineSelectionIndex = oldLineSelections.findIndex(selection => selection.disassemblyViewId === activeDisassemblyView)

                      if (oldLineSelectionIndex === -1) {
                        sourceViewStatesCopy[sourceViewI].lineSelections.push({
                          ...newLineSelection,
                          disassemblyViewId: activeDisassemblyView
                        })
                      }
                      else {
                        sourceViewStatesCopy[sourceViewI].lineSelections[oldLineSelectionIndex] = {
                          ...newLineSelection,
                          disassemblyViewId: activeDisassemblyView
                        }
                      }
                      setSourceViewStates(sourceViewStatesCopy)

                      // set disassembly line selection
                      api.getSourceCorresponding(binaryFilePath, sourceViewStates[sourceViewI].file_name, newLineSelection.start, newLineSelection.end).then(newDisLine => {
                        const disassemblyViewStateCopy = [...disassemblyViewStates]
                        console.log('    disassemblyViewStatesCOpy', disassemblyViewStateCopy)
                        const stateIndex = disassemblyViewStateCopy.findIndex(disState => disState.id === activeDisassemblyView)
                        console.log('    stateIndex', stateIndex)
                        disassemblyViewStateCopy[stateIndex].lineSelection = newDisLine
                        setDisassemblyViewStates(disassemblyViewStateCopy)
                      })

  }

  // Consolidates sourceViewStates and source-views
  React.useEffect(() => {
    let changed = false
    const sourceViewStatesCopy = [...sourceViewStates]
    sourceViewStatesCopy
        .filter(daton => daton.status === "opening")
        .forEach((sourceViewDaton, sourceViewI) => {
            changed = true
            const tab: TabData = {
                id: "SourceView:"+sourceViewDaton.file_name,
                title: "Source: " + sourceViewDaton.file_name,
                content: ComponentFactory.CreateSourceView(
                    sourceViewDaton,
                    newLineSelection => addNewLineSelection(newLineSelection, sourceViewI),
                ),
                closable: true
            }

            const newPanel: PanelData = {
                tabs: [tab],
                x: 10, y: 10, w: 400, h: 400
            }
            dockRef!.dockMove(newPanel, 'SourceViewPanel', 'middle')
            sourceViewDaton.status = 'opened'
        })
      
      if(changed)
        setSourceViewStates(sourceViewStatesCopy)
  }, [sourceViewStates])

  const loadTab = ({ id }: { id: string }): TabData => {
    const [compName, compNum] = id.split(':')
    switch (compName) {
      case "InputFilePath":
        return {
          id: "InputFilePath:1",
          title: "Input File",
          content: ComponentFactory.CreateInputFilePath(binaryFilePath, setBinaryFilePath, sourceViewStates, Context),
          closable: false,
          minHeight: 150,
          minWidth: 250,
        }
      case "ObjectView":
        return {
          id,
          title: "Object Visualization",
          content: <TabContent><ObjectViz dotString={binaryData.dotString} /></TabContent>,
          closable: true,
        }
      // case "DisassemblyView":
      //   console.log("Creating DisView from loadTab")
      //   return {
      //     id:"DisassemblyView:"+compNum,
      //     title: "Disassembly View: " + compNum,
      //     content: ComponentFactory.CreateDisassemblyView(
      //       parseInt(compNum),
      //       binaryFilePath,
      //       activeDisassemblyView,
      //       setActiveDisassemblyView,
      //       disassemblyViewStates.find(disState => disState.id === parseInt(compNum))!.lineSelection,
      //       1,
      //       (newSelection) => { 
      //         const disassemblyViewStateCopy = [...disassemblyViewStates]
      //         const stateIndex = disassemblyViewStateCopy.findIndex(disState => disState.id === parseInt(compNum))
      //         disassemblyViewStateCopy[stateIndex] = {
      //           id: parseInt(compNum),
      //           lineSelection: newSelection
      //         }
      //         setDisassemblyViewStates(disassemblyViewStateCopy)
      //       },
      //       binaryData.dyninstInfo,
      //       Context
      //     ),
      //     closable: true,
      //     minHeight: 150,
      //     minWidth: 150
      //   }
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
                  content: ComponentFactory.CreateInputFilePath(binaryFilePath, setBinaryFilePath, sourceViewStates, Context),
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
            id: 'SourceViewPanel',
            tabs: [],
            panelLock: {
              minWidth: 300,
              minHeight: 300,
              // panelExtra: (panelData) => (
              //   <p>Source Files</p>
              // )
            }
          }]
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
                <Context.Consumer>
                  {val => (
                    <button onClick={e => {
                      if (val.binaryFilePath.length === 0) {
                        toast.error('Please select a binary file first!', {
                          position: "bottom-center",
                          autoClose: 5000,
                          hideProgressBar: false,
                          closeOnClick: true,
                          pauseOnHover: true,
                          draggable: true,
                          progress: undefined,
                        });
                        return
                      };
                      const disassemblyViewStateCopy = [...val.disassemblyViewStates]
                      const newId = Math.max(...disassemblyViewStateCopy.map(disState => disState.id))+1
                      disassemblyViewStateCopy.push({
                        id: newId,
                        lineSelection: null
                      })
                      dispatch(setActiveDisassemblyView(newId))
                      setDisassemblyViewStates(disassemblyViewStateCopy)
                    }}>
                      add
                    </button>
                  )}
                </Context.Consumer>
              )
            }
          }]
        },
      ]
    },
  });

  const onLayoutChange = (newLayout: LayoutData, currentTabId: string, direction: DropDirection) => {
    console.log("Layout Change Called")
    console.log("    currentTabId", currentTabId)
    console.log("    direction", direction)
    console.log("    newLayout", newLayout)

    if (direction === 'remove') {
      if (currentTabId.split(':')[0] === 'SourceView') {
        const sourceFileName = currentTabId.split(':')[1]
        const sourceViewStatesCopy = [...sourceViewStates]
        sourceViewStatesCopy.find(vState => vState.file_name === sourceFileName)!.status = 'closed'
        setSourceViewStates(sourceViewStatesCopy)
      }
      else if (currentTabId.split(':')[0] === 'DisassemblyView') {
        const disViewId = parseInt(currentTabId.split(':')[1])
        const disViewStatesCopy = [...disassemblyViewStates]
        const index = disViewStatesCopy.findIndex(disState => disState.id === disViewId)
        disViewStatesCopy.splice(index, 1)
        setDisassemblyViewStates(disViewStatesCopy)
      }
    }
    setLayout(newLayout)
  };

  return (
    <div className="App">
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Context.Provider value={{
        binaryFilePath,
        setBinaryFilePath,
        binaryData,
        setBinaryData,
        sourceViewStates,
        setSourceViewStates,
        activeDisassemblyView,
        setActiveDisassemblyView,
        disassemblyViewStates,
        setDisassemblyViewStates,
      }}>

      <DockLayout
        ref={(r) => {dockRef = r}}
        defaultLayout={layout}
        loadTab={loadTab}
        // onLayoutChange={onLayoutChange}
        style={{
          position: 'absolute',
          left: 5,
          top: 5,
          right: 5,
          bottom: 5
        }}
      />
      </Context.Provider>
    </div>
  )
}

export default App;