import SourceView from "./components/SourceView";
import ReactDetachableWindow from 'react-detachable-window'
import ObjectViz from "./components/ObjectViz";
import React from 'react';
import { Layout, Model } from 'flexlayout-react';
import "flexlayout-react/style/light.css";
import InputFilePath from "./components/InputFilePath";
import * as api from "./api";
import DisassemblyView from "./components/DisassemblyView";


function App() {
  console.log("Loading App")

  const [binaryFilePath, setBinaryFilePath] = React.useState("");
  const [selectedSourceFile, setSelectedSourceFile] = React.useState("");
  const [dotString, setDotString] = React.useState("");
  const [sourceFiles, setSourceFiles] = React.useState([]);
  const [disassemblyData, setDisassemblyData] = React.useState([]);
  const [dyninstInfo, setDyninstInfo] = React.useState({});
  const [sourceData, setSourceData] = React.useState({});

  React.useEffect(() => {
    console.log("Updating BinaryPath");
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
    console.log("Updating SourceFilePath")
    if(selectedSourceFile.length === 0) return;
    api.getSourceLines(selectedSourceFile).then((result) => {
      setSourceData(result);
    })
  }, [binaryFilePath, selectedSourceFile])


  const model = Model.fromJson({
    global: {
      tabBorderWidth: 10
    },
    borders: [],
    layout: {
      type: "row",
      children: [
        {
          type: "row",
          weight: 1,
          children: [
            {
              type: "tabset",
              children: [
                {
                  type: "tab",
                  name: "Input Source",
                  component: "InputFilePath"
                }
              ]
            },
            {
              type: "tabset",
              children: [
                {
                  type: "tab",
                  name: "Selections",
                  component: "Selection"
                }
              ]
            },
            {
              type: "tabset",
              children: [
                {
                  type: "tab",
                  name: "Variable Renamer",
                  component: "VarRenamer"
                }
              ]
            }
          ]
        },
        {
          type: "tabset",
          weight: 2,
          children: [
            {
              type: "tab",
              name: "Source View",
              enableClose: false,
              component: "SourceView",
            }
          ]
        },
        {
          type: "tabset",
          weight: 2,
          children: [
            {
              type: "tab",
              name: "Disassembly View",
              component: "DisassemblyView",
            }
          ]
        },
        {
          type: "tabset",
          weight: 2,
          children: [
            {
              type: "tab",
              name: "Object Visualization",
              component: "ObjectViz",
            }
          ]
        }
      ]
    }
  });

  const componentFactory = (node) => {
    var component = node.getComponent();
    let reattachButton = (<button type='button'>Close!</button>)
    let detachButton = (<button type='button'>Detach!</button>)
    switch (component) {
      case "SourceView":
        return <>
          <ReactDetachableWindow
            windowOptions={{ width: 800, height: 600 }}
            reattachButton={reattachButton}i
            detachButton={detachButton}>
            <SourceView selectedSourceFile={selectedSourceFile} sourceData={sourceData}/>;
          </ReactDetachableWindow>
        </>
      case "InputFilePath":
        return <>
          <ReactDetachableWindow
            windowOptions={{ width: 800, height: 600 }}
            reattachButton={reattachButton}i
            detachButton={detachButton}>
            <InputFilePath setBinaryFilePath={setBinaryFilePath} setSelectedSourceFile={setSelectedSourceFile} sourceFiles={sourceFiles} />;
          </ReactDetachableWindow>
        </>
      case "ObjectViz":
        return <>
          <ReactDetachableWindow
            windowOptions={{ width: 800, height: 600 }}
            reattachButton={reattachButton}i
            detachButton={detachButton}>
            <ObjectViz dotString={dotString} />;
          </ReactDetachableWindow>
        </>
      case "DisassemblyView":
        return <>
          <ReactDetachableWindow
            windowOptions={{ width: 800, height: 600 }}
            reattachButton={reattachButton}i
            detachButton={detachButton}>
            <DisassemblyView disassemblyData={disassemblyData} />;
          </ReactDetachableWindow>
        </>
      default:
        return <>
          <ReactDetachableWindow
            windowOptions={{ width: 800, height: 600 }}
            reattachButton={reattachButton}i
            detachButton={detachButton}>
            <div>{component}<br />(Stub!!!)</div>;
          </ReactDetachableWindow>
        </>
    }
  }

  return (
    <div className="App">
      <Layout
        model={model}
        factory={componentFactory}
      />
    </div>

  );
}

export default App;
