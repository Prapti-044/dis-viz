import React from 'react';
import * as api from "../api";

import { Menu, SubMenu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

import { DockLayout, LayoutData, DropDirection, TabData, PanelData } from 'rc-dock'
import "rc-dock/dist/rc-dock.css";
import TabContent from "./TabContent";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice'
import DisassemblyView from './DisassemblyView';
import SourceView from './SourceView';
import InputFilePath from './InputFilePath';
import SourceFileTree from "./SourceFileTree";

const App = () => {
  const dockRef = React.useRef<DockLayout>(null)
  const binaryFilePaths = useAppSelector(selectBinaryFilePaths)
  const [disassemblyViewIds, setDisassemblyViewIds] = React.useState<number[]>([]);
  const [sourceViewStates, setSourceViewStates] = React.useState<{
      file_name: string,
      status: "opened" | "closed"
  }[]>([])
  
  const binaryFilePathsRef = React.useRef(binaryFilePaths);

  React.useEffect(() => {
    binaryFilePathsRef.current = binaryFilePaths;
  }, [binaryFilePaths]);

  const removeSelfDisassemblyView = React.useCallback((disId: number) => {
    console.log("removing disassembly view", disId)
    setDisassemblyViewIds(disassemblyViewIds.filter(id => id !== disId))
    if (dockRef.current) {
      const disassemblyViewPanel = dockRef.current.find('DisassemblyViewPanel') as PanelData;
      if (disassemblyViewPanel) {
        const tabToRemove = disassemblyViewPanel.tabs.find(tab => tab.id === `DisassemblyView:${disId}`);
        if (tabToRemove) {
          dockRef.current.dockMove(tabToRemove, null, 'remove')
        }
      }
    }
  }, [disassemblyViewIds, dockRef])

  // Get the source files for each binary file
  React.useEffect(() => {
      const curSourceViewStates: { [file_name: string]: "opened" | "closed" } = {}
      Promise.all(binaryFilePaths.filter(binaryFilePath => binaryFilePath !== "").map(async (binaryFilePath) => {
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
  
  const onAddDisassemblyView = React.useCallback(() => {
    if (binaryFilePathsRef.current.filter((binaryFilePath) => binaryFilePath !== "").length > 0) {
      let newId = 1;
      for (const disassemblyViewId of disassemblyViewIds) {
        if (disassemblyViewId === newId) newId++;
        else break;
      }
      const newDisassemblyViewId = `DisassemblyView:${newId}`;
      const newDisassemblyViewComponent: TabData = {
        id: newDisassemblyViewId,
        title: `Disassembly View: ${newId}`,
        content: <TabContent key={`tab-DisassemblyView-${newId}`}>
          <DisassemblyView
            id={newId}
            removeSelf={() => { removeSelfDisassemblyView(newId) }}
          /></TabContent>,
        closable: true,
      };
      const newPanel: PanelData = {
        tabs: [newDisassemblyViewComponent],
        x: 10, y: 10, w: 400, h: 400
      };
      dockRef.current?.dockMove(newPanel, 'DisassemblyViewPanel', 'middle');
      setDisassemblyViewIds([...disassemblyViewIds, newId])
    }
    else {
      toast.error("No valid binary file paths found")
    }
  }, [disassemblyViewIds, removeSelfDisassemblyView])
  
  React.useEffect(() => {
    if (dockRef.current === null) return;
    // update the panel extra button with the new validBinaryFilePaths
    const disassemblyViewPanel = dockRef.current.find('DisassemblyViewPanel') as PanelData
    if (disassemblyViewPanel === undefined) return
    disassemblyViewPanel.panelLock!.panelExtra = (panelData: PanelData) => (
      <button
        onClick={onAddDisassemblyView}
        style={{
          background: 'none',
          color: 'black',
          cursor: 'pointer'
        }}>
        +
      </button>
    )
  }, [binaryFilePaths, onAddDisassemblyView])

  // Reconcile sourceViewStates and source-views
  React.useEffect(() => {
    if (dockRef.current === null) return;
    sourceViewStates
      .forEach(sourceViewDaton => {
        if (sourceViewDaton.status === "opened") {
          const foundTab = dockRef.current!.find("SourceView:" + sourceViewDaton.file_name) as TabData
          if (foundTab === undefined) {
            const newTab: TabData = {
              id: "SourceView:" + sourceViewDaton.file_name,
              title: "Source: " + sourceViewDaton.file_name.split("/").slice(-1),
              content: <TabContent>
                <SourceView file_name={sourceViewDaton.file_name} />
              </TabContent>,
              closable: true
            }
            dockRef.current!.dockMove(newTab, 'SourceViewPanel', 'middle')
          }
        }
        else {
          const foundTab = dockRef.current!.find("SourceView:" + sourceViewDaton.file_name) as TabData
          if (foundTab !== undefined) {
            dockRef.current!.dockMove(foundTab, null, 'remove')
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
                  onClick={onAddDisassemblyView}
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
        setDisassemblyViewIds(disassemblyViewIds.filter(id => id !== parseInt(currentTabId.split(':')[1])))
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
      <Menu menuButton={<MenuButton>File</MenuButton>}>
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