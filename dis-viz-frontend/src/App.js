import SourceView from "./components/SourceView";
import ObjectViz from "./components/ObjectViz";
import React from 'react';
import { Layout, Model } from 'flexlayout-react';
import "flexlayout-react/style/light.css";
import InputFilePath from "./components/InputFilePath";
import * as api from "./api";


function App() {
  const ObjectViz_data = {
    setDotString: null
  }

  const [binaryFilePath, setBinaryFilePath] = React.useState("");
  if (binaryFilePath.length !== 0) {
    api.openExe(binaryFilePath)
      .then((result) => {
        if (result.message === "success") {
          api.getDisassemblyDot().then((result) => {
            ObjectViz_data.setDotString(result);
          })
        }
      });
  }


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

  const factory = (node) => {
    var component = node.getComponent();
    switch (component) {
      case "SourceView":
        return <SourceView />;
      case "InputFilePath":
        return <InputFilePath setBinaryFilePath={setBinaryFilePath} />;
      case "ObjectViz":
        return <ObjectViz onLoad={(data) => { ObjectViz_data.setDotString = data; }} />;
      default:
        return <div>{component}<br />(Stub!!!)</div>;
    }
  }




  return (
    <div className="App">
      <Layout
        model={model}
        factory={factory}
      />
    </div>

  );
}

export default App;
