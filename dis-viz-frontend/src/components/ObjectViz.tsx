import React from 'react'
import { Graphviz } from 'graphviz-react';


function ObjectViz() {

  const [dotString, setDotString] = React.useState<string|null>(null)

  return <>
    {dotString?<Graphviz dot={dotString} />:<div></div>}
  </>
}

export default ObjectViz;