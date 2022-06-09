import SourceView from "./components/SourceView";
import ObjectViz from "./components/ObjectViz";
import React from 'react';
import { Layout, Model } from 'flexlayout-react';
import "flexlayout-react/style/light.css";
import InputFilePath from "./components/InputFilePath";
import * as api from "./api";
import DisassemblyView from "./components/DisassemblyView";

import WinboxReact from './components/Winbox'


function App() {
  console.log("Loading App")

  const [binaryFilePath, setBinaryFilePath] = React.useState("");
  const [selectedSourceFile, setSelectedSourceFile] = React.useState("");
  const [dotString, setDotString] = React.useState("");
  const [sourceFiles, setSourceFiles] = React.useState([]);
  const [disassemblyData, setDisassemblyData] = React.useState([]);
  const [dyninstInfo, setDyninstInfo] = React.useState({});
  const [sourceData, setSourceData] = React.useState([]);
  const [disassemblyViewList, setDisassemblyViewList] = React.useState([]);

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
              name: `Source View (${selectedSourceFile})`,
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
    switch (component) {
      case "SourceView":
        return <>
            <SourceView sourceData={sourceData}/>;
        </>
      case "InputFilePath":
        return <>
            <InputFilePath
              binaryFilePath={binaryFilePath}
              setBinaryFilePath={setBinaryFilePath}
              sourceFiles={sourceFiles}
              selectedSourceFile={selectedSourceFile}
              setSelectedSourceFile={setSelectedSourceFile}
            />;
        </>
      case "ObjectViz":
        return <>
            <ObjectViz dotString={dotString} />;
        </>
      default:
        return <>
            <div>{component}<br />(Stub!!!)</div>;
        </>
    }
  }

  return (
    <div className="App">
      <WinboxReact
          width="500px"
          height="500px"
          x="center"
          y="center"
          title="stub"
          border="0"
          className="modern"
        >
          <DisassemblyView disassemblyData={disassemblyData}/>
        </WinboxReact>
      <Layout
        model={model}
        factory={componentFactory}
      />
    </div>
  )
}

export default App;
