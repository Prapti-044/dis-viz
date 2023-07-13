export function getUrls() {
  const host_url = window.location.protocol + "//" + window.location.host.split(':')[0] + ':' + process.env.REACT_APP_BACKEND_PORT;

  // if hosted on same port
  // const host_url = window.location.protocol + "//" + window.location.host;
  return {
    backend: host_url
  }
}