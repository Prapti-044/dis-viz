import React from 'react';
import * as api from "../api";

import { Menu, SubMenu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

import { DockLayout, LayoutData, DropDirection, TabData, PanelData, BoxData } from 'rc-dock'
import "rc-dock/dist/rc-dock.css";
import TabContent from "./TabContent";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectSelections, setActiveDisassemblyView, addDisassemblyView, removeDisassemblyView } from '../features/selections/selectionsSlice'
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice'
import DisassemblyView from './DisassemblyView';
import SourceView from './SourceView';
import InputFilePath from './InputFilePath';
import SourceFileTree from "./SourceFileTree";


const App = () => {

  const dispatch = useAppDispatch();

  const selections = useAppSelector(selectSelections)

  const dockRef = React.useRef<DockLayout>(null)
  const binaryFilePaths = useAppSelector(selectBinaryFilePaths)
  const validBinaryFilePaths = binaryFilePaths.filter((binaryFilePath) => binaryFilePath !== "")
  const [sourceViewStates, setSourceViewStates] = React.useState<{
      file_name: string,
      status: "opened" | "closed"
  }[]>([])

  const removeSelfDisassemblyView = (disId: number) => {
    if (dockRef.current === null) return
    
    const tabData = dockRef.current.find("DisassemblyView:" + disId) as TabData
    dockRef.current.dockMove(
      tabData,
      null,
      'remove'
    )
    dispatch(removeDisassemblyView(disId))
  }


  // Automatically create a disassemblyView if there is none but binaryFilePath is selected
  React.useEffect(() => {
    if (validBinaryFilePaths.length === 0) return;
    if (Object.keys(selections).length !== 0) return
    dispatch(addDisassemblyView({ binaryFilePath: validBinaryFilePaths[0], addresses: [], source_selection: [] }))
  }, [binaryFilePaths, dispatch, selections])

  React.useEffect(() => {
      const curSourceViewStates: { [file_name: string]: "opened" | "closed" } = {}
      Promise.all(validBinaryFilePaths.map(async (binaryFilePath) => {
          const sourceFiles = await api.getSourceFiles(binaryFilePath)
          sourceFiles.forEach(sourceFile => {
              if (!(sourceFile in curSourceViewStates)) {
                  curSourceViewStates[sourceFile] = "closed"
              }
          })
      })).then(() => {
        setSourceViewStates(Object.entries(curSourceViewStates).map(([file_name, status]) => ({ file_name, status })))
      })
  }, [binaryFilePaths])

  React.useEffect(() => {
    if(dockRef.current === null) return;
    dockRef.current.updateTab("InputFilePath:1", {
      id: "InputFilePath:1",
      title: "Input File",
      content: <TabContent><InputFilePath /></TabContent>,
      closable: false,
      minHeight: 150,
      minWidth: 250,
    })
    dockRef.current.updateTab("SourceFileTree:1", {
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
    if (dockRef.current === null || Object.keys(selections).length === 0) return;
    Object.keys(selections)
      .map<TabData>(disId => ({
        id: "DisassemblyView:" + disId,
        title: "Disassembly View: " + disId,
        content: <TabContent key={`tab-DisassemblyView-${disId}`}>
          <DisassemblyView
            removeSelf={() => {
              removeSelfDisassemblyView(parseInt(disId))
            }}
            key={`DisassemblyView-${disId}`}
            id={parseInt(disId)}
            defaultBinaryFilePath={validBinaryFilePaths[parseInt(disId)]}
          /></TabContent>,
        closable: true,
      }))
      .forEach(disassemblyViewComponent => {
        const tabData = dockRef.current!.find(disassemblyViewComponent.id!)
        if (tabData !== undefined) {
          dockRef.current!.updateTab(tabData.id!.toString(), disassemblyViewComponent);
        }
        else {
          const newPanel: PanelData = {
            tabs: [disassemblyViewComponent],
            x: 10, y: 10, w: 400, h: 400
          }
          dockRef.current!.dockMove(newPanel, 'DisassemblyViewPanel', 'middle')
        }
      })
    // set it active if there is only one dis-view
    if (Object.keys(selections).length === 1) {
      dispatch(setActiveDisassemblyView(parseInt(Object.keys(selections)[0])))
    }
  }, [dispatch, selections])

  // Reconcile sourceViewStates and source-views
  React.useEffect(() => {
    if (dockRef.current === null) return;
    sourceViewStates
      .forEach(sourceViewDaton => {
        if (sourceViewDaton.status === "opened") {
          const foundTab = dockRef.current!.find("SourceView:" + sourceViewDaton.file_name) as TabData
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
            dockRef.current!.dockMove(newPanel, 'SourceViewPanel', 'middle')
          }
          else {
            dockRef.current!.updateTab("SourceView:" + sourceViewDaton.file_name, newTab)
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
          size: 2,
          children: [{
            id: 'SourceViewPanel',
            tabs: [],
            panelLock: {
              minWidth: 10,
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
                <button
                  onClick={e => {
                    dispatch(addDisassemblyView({ binaryFilePath: validBinaryFilePaths[0], addresses: [], source_selection: [] }))
                  }}
                  style={{
                    background: 'none',
                    color: 'black',
                    cursor: 'pointer'
                  }}>
                +
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
      <Menu menuButton={<MenuButton>Menu</MenuButton>}>
        <MenuItem>New File</MenuItem>
        <SubMenu label="Edit">
          <MenuItem>Cut</MenuItem>
          <MenuItem>Copy</MenuItem>
          <MenuItem>Paste</MenuItem>
          <SubMenu label="Find">
            <MenuItem>Find...</MenuItem>
            <MenuItem>Find Next</MenuItem>
            <MenuItem>Find Previous</MenuItem>
          </SubMenu>
        </SubMenu>
        <MenuItem>Print...</MenuItem>
      </Menu>
      <DockLayout
        ref={dockRef}
        defaultLayout={layout}
        onLayoutChange={onLayoutChange}
        style={{
          position: 'absolute',
          left: 5,
          top: 36,
          right: 5,
          bottom: 5
        }}
      />
    </div>
  )
}

export default App;