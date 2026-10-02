function handler(event) {
  var request = event.request;
  var uri = request.uri || "/";
  if (uri === "/api" || uri.indexOf("/api/") === 0) {
    return request;
  }
  if (uri.indexOf(".") !== -1) {
    return request;
  }
  request.uri = "/index.html";
  return request;
}
