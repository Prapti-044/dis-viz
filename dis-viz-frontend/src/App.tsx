import ObjectViz from "./components/ObjectViz";
import React from 'react';
import * as api from "./api";

import { DockLayout, LayoutData, DropDirection, TabData, PanelData } from 'rc-dock'
import "rc-dock/dist/rc-dock.css";
import TabContent from "./components/TabContent";
import { DyninstInfo } from './types';
// import * as ComponentFactory from './ComponentFactory';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAppSelector, useAppDispatch } from './app/hooks';
import { selectSelections, selectActiveDisassemblyView, setActiveDisassemblyView, addDisassemblyView, removeDisassemblyView } from './features/selections/selectionsSlice'
import { selectBinaryFilePath } from './features/binary-data/binaryDataSlice'
import DisassemblyView from './components/DisassemblyView';
import SourceView from './components/SourceView';
import InputFilePath from './components/InputFilePath';


const App = () => {

  const dispatch = useAppDispatch();

  const [sourceViewStates, setSourceViewStates] = React.useState<{
    file_name: string,
    status: "opened" | "opening" | "closed"
  }[]>([])
  const selections = useAppSelector(selectSelections)

  let dockRef: DockLayout | null;
  const binaryFilePath = useAppSelector(selectBinaryFilePath)

  // Automatically create a disassemblyView if there is none but binaryFilePath is selected
  React.useEffect(() => {
    if(binaryFilePath.length === 0) return;

    api.getSourceFiles(binaryFilePath).then(files => {
      setSourceViewStates(files.map(file_name => ({
        file_name,
        status: "closed"
      })))
    })

    if(Object.keys(selections).length !== 0) return
    dispatch(addDisassemblyView())
  }, [binaryFilePath])

  React.useEffect(() => {
    console.log("SourceView State", sourceViewStates)
    dockRef!.updateTab("InputFilePath:1", {
      id: "InputFilePath:1",
      title: "Input File",
      content: <TabContent><InputFilePath
        sourceViewData={sourceViewStates}
        setSourceViewData={setSourceViewStates}
      /></TabContent>,
      closable: false,
      minHeight: 150,
      minWidth: 250,
    })
  }, [sourceViewStates])

  // Consolidates disassemblyViewState and dis-views
  React.useEffect(() => {
    if (dockRef === null || Object.keys(selections).length === 0) return;
    Object.keys(selections)
      .map<TabData>(disId => ({
        id: "DisassemblyView:"+disId,
        title: "Disassembly View: " + disId,
        content: <TabContent><DisassemblyView
                key={"DisassemblyView:" + disId}
                id={parseInt(disId)}
                pageNo={null}
            /></TabContent>,
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
      if (Object.keys(selections).length === 1) {
        dispatch(setActiveDisassemblyView(parseInt(Object.keys(selections)[0])))
      }
  }, [selections])

  // Consolidates sourceViewStates and source-views
  React.useEffect(() => {
    if (!dockRef) return;
    let changedSourceViewStates = false;
    const sourceViewStatesCopy = [...sourceViewStates]
    sourceViewStatesCopy
      .filter(sourceViewState => sourceViewState.status === "opening")
      .forEach(sourceViewDaton => {
        changedSourceViewStates = true;
        const tab: TabData = {
            id: "SourceView:"+sourceViewDaton.file_name,
            title: "Source: " + sourceViewDaton.file_name,
            content: <TabContent><SourceView
              file_name={sourceViewDaton.file_name}
            />
            </TabContent>,
            closable: true
        }

        const newPanel: PanelData = {
            tabs: [tab],
            x: 10, y: 10, w: 400, h: 400
        }
        dockRef!.dockMove(newPanel, 'SourceViewPanel', 'middle')
        sourceViewDaton.status = "opened"
    });
    if(changedSourceViewStates)
      setSourceViewStates(sourceViewStatesCopy);
  }, [sourceViewStates])

  const loadTab = ({ id }: { id: string }): TabData => {
    const [compName, compNum] = id.split(':')
    switch (compName) {
      case "InputFilePath":
        return {
          id: "InputFilePath:1",
          title: "Input File",
          content: <TabContent><InputFilePath
            sourceViewData={sourceViewStates}
            setSourceViewData={setSourceViewStates}
          /></TabContent>,
          closable: false,
          minHeight: 150,
          minWidth: 250,
        }
      case "ObjectView":
        return {
          id,
          title: "Object Visualization",
          content: <TabContent><ObjectViz /></TabContent>,
          closable: true,
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
                {
                  id: "InputFilePath:1",
                  title: "Input File",
                  content: <TabContent><InputFilePath
                    sourceViewData={sourceViewStates}
                    setSourceViewData={setSourceViewStates}
                  /></TabContent>,
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
                    <button onClick={e => {
                      dispatch(addDisassemblyView())
                    }}>
                      add
                    </button>
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
        dispatch(removeDisassemblyView(parseInt(currentTabId.split(":")[1])))
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
      <DockLayout
        ref={(r) => {dockRef = r}}
        defaultLayout={layout}
        // loadTab={loadTab}
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