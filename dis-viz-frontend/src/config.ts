export function getUrls() {
  const host_url = window.location.protocol + "//" + window.location.host;
  
  return {
    backend: host_url
  }
}