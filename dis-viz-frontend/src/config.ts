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


export const marginHorizontal = 10 //10
export const marginSameVertical = 10 // 10
export const marginDifferentVertical = 100 //100
export const LOOP_INDENT_SIZE = 20 //25
export const BLOCK_MAX_WIDTH = 420 //420