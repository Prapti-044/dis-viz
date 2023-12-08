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