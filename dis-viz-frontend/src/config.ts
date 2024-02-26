export function getUrls() {
  const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT;
  if (BACKEND_PORT) {
    const host_url = window.location.protocol + "//" + window.location.hostname + ":" + BACKEND_PORT;
    return {
      backend: host_url
    }
  }

  const host_url = window.location.protocol + "//" + window.location.host;
  
  return {
    backend: host_url
  }
}


export const marginHorizontal = 10
export const marginSameVertical = 20 // 10
export const marginDifferentVertical = 80 //100
export const LOOP_INDENT_SIZE = 26
export const BLOCK_MAX_WIDTH = 420 //400