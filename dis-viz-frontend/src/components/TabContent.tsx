import React from 'react'

function TabContent({children}:{children: React.ReactNode}): React.ReactElement {
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