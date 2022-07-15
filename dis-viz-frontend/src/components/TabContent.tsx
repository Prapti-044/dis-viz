import React from 'react'

function TabContent({children}:{children: React.ReactNode}) {
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