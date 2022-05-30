import SourceView from "./components/SourceView";
import React from 'react';
import { Layout, Model } from 'flexlayout-react';
import "flexlayout-react/style/light.css";
import InputFilePath from "./components/InputFilePath";


function App() {
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
              component: "Disassembly View",
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
        return <InputFilePath/>;
      default:
        return <div>{component}<br/>(Stub!!!)</div>;
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
