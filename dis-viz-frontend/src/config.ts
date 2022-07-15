export function getUrls() {
  const host_url = window.location.protocol + "//" + window.location.host.split(':')[0] + ':' + process.env.REACT_APP_BACKEND_PORT;
  return {
    backend: host_url
  }
}