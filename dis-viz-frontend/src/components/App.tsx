import React from 'react';
import * as api from "../api";

import { DockLayout, LayoutData, DropDirection, TabData, PanelData } from 'rc-dock'
import "rc-dock/dist/rc-dock.css";
import TabContent from "./TabContent";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectSelections, setActiveDisassemblyView, addDisassemblyView, removeDisassemblyView } from '../features/selections/selectionsSlice'
import { selectBinaryFilePath } from '../features/binary-data/binaryDataSlice'
import DisassemblyView from './DisassemblyView';
import SourceView from './SourceView';
import InputFilePath from './InputFilePath';
import SourceFileTree from "./SourceFileTree";


const App = () => {

  const dispatch = useAppDispatch();

  const [sourceViewStates, setSourceViewStates] = React.useState<{
    file_name: string,
    status: "opened" | "closed"
  }[]>([])

  const selections = useAppSelector(selectSelections)

  let dockRef: DockLayout | null;
  const binaryFilePath = useAppSelector(selectBinaryFilePath)

  // Automatically create a disassemblyView if there is none but binaryFilePath is selected
  React.useEffect(() => {
    if (binaryFilePath.length === 0) return;

    api.getSourceFiles(binaryFilePath).then(files => {
      setSourceViewStates(files.map(file_name => ({
        file_name,
        status: "closed"
      })))
    })

    // TODO: close all disassembly views and create a new one

    if (Object.keys(selections).length !== 0) return
    dispatch(addDisassemblyView(null))
  }, [binaryFilePath])

  React.useEffect(() => {
    dockRef!.updateTab("InputFilePath:1", {
      id: "InputFilePath:1",
      title: "Input File",
      content: <TabContent><InputFilePath /></TabContent>,
      closable: false,
      minHeight: 150,
      minWidth: 250,
    })
    dockRef!.updateTab("SourceFileTree:1", {
      id: "SourceFileTree:1",
      title: "Source Files",
      content: <TabContent><SourceFileTree
        sourceViewData={sourceViewStates}
        setSourceViewData={setSourceViewStates}
      /></TabContent>,
      closable: false,
      minHeight: 150,
      minWidth: 250
    })
  }, [sourceViewStates])

  // Reconcile disassemblyViewState and dis-views
  React.useEffect(() => {
    if (dockRef === null || Object.keys(selections).length === 0) return;
    Object.keys(selections)
      .map<TabData>(disId => ({
        id: "DisassemblyView:" + disId,
        title: "Disassembly View: " + disId,
        content: <TabContent><DisassemblyView
          key={"DisassemblyView:" + disId}
          id={parseInt(disId)}
        /></TabContent>,
        closable: true,
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
    // set it active if there is only one dis-view
    if (Object.keys(selections).length === 1) {
      dispatch(setActiveDisassemblyView(parseInt(Object.keys(selections)[0])))
    }
  }, [selections])

  // Reconcile sourceViewStates and source-views
  React.useEffect(() => {
    if (!dockRef) return;
    sourceViewStates
      .forEach(sourceViewDaton => {
        if (sourceViewDaton.status === "opened") {
          const foundTab = dockRef!.find("SourceView:" + sourceViewDaton.file_name) as TabData
          const newTab: TabData = {
            id: "SourceView:" + sourceViewDaton.file_name,
            title: "Source: " + sourceViewDaton.file_name.split("/")[sourceViewDaton.file_name.split("/").length - 1],
            content: <TabContent><SourceView
              file_name={sourceViewDaton.file_name}
            />
            </TabContent>,
            closable: true
          }
          if (foundTab === undefined) {
            const newPanel: PanelData = {
              tabs: [newTab],
              x: 10, y: 10, w: 400, h: 400
            }
            dockRef!.dockMove(newPanel, 'SourceViewPanel', 'middle')
          }
          else {
            dockRef!.updateTab("SourceView:" + sourceViewDaton.file_name, newTab)
          }
        }
      });
  }, [sourceViewStates])

  const [layout, setLayout] = React.useState<LayoutData>({
    dockbox: {
      mode: 'horizontal',
      children: [
        {
          mode: 'vertical',
          size: 1,
          children: [
            {
              size: 1,
              tabs: [
                {
                  id: "InputFilePath:1",
                  title: "Input File",
                  content: <TabContent><InputFilePath /></TabContent>,
                  closable: false,
                  minHeight: 150,
                  minWidth: 250
                }
              ],
            },
            {
              size: 5,
              tabs: [
                {
                  id: "SourceFileTree:1",
                  title: "Source Files",
                  content: <TabContent><SourceFileTree
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
                  dispatch(addDisassemblyView(null))
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
    // console.log("Layout Change Called")
    // console.log("    currentTabId", currentTabId)
    // console.log("    direction", direction)
    // console.log("    newLayout", newLayout)

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
        ref={(r) => { dockRef = r }}
        defaultLayout={layout}
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