import React from 'react'

function TabContent({children}) {
  return (
    <div style={{
        overflow: 'auto',
        height: '100%',
    }}>
        {children}
    </div>
  )
}

export default TabContent