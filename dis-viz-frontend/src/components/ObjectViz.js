import React from 'react'
import { Graphviz } from 'graphviz-react';


function ObjectViz({dotString}) {

  return <>
    {dotString?<Graphviz dot={dotString} />:<div></div>}
  </>
}

export default ObjectViz;