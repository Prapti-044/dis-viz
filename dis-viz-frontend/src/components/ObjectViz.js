import React from 'react'

function ObjectViz({onLoad}) {

  const [dotString, setDotString] = React.useState("");

  onLoad(setDotString);

  return (
    <div>{dotString}</div>
  )
}

export default ObjectViz;