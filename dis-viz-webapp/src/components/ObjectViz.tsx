import React from 'react'
import { Graphviz } from '@hpcc-js/wasm-graphviz';


function ObjectViz() {

  const [dotString, setDotString] = React.useState<string|null>(null)
  const [svgString, setSvgString] = React.useState<string|null>(null)

  React.useEffect(() => {
    if (!dotString) {
      setSvgString(null);
      return;
    }

    let cancelled = false;
    Graphviz.load().then((graphviz) => {
      if (!cancelled) {
        setSvgString(graphviz.dot(dotString));
      }
    });

    return () => { cancelled = true; };
  }, [dotString]);

  return <>
    {svgString
      ? <div dangerouslySetInnerHTML={{ __html: svgString }} />
      : <div></div>}
  </>
}

export default ObjectViz;
