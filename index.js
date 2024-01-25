import http from "http";

const proxyServer = http.createServer((clientReq, clientRes) => {
  const targetUrl = `http://jsonplaceholder.typicode.com${clientReq.url}`;
  const options = new URL(targetUrl);
  options.method = clientReq.method;
  options.headers = clientReq.headers;
  options.headers.host = "jsonplaceholder.typicode.com"; // Set the Host header

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, {
      end: true,
    });
  });

  clientReq.pipe(proxyReq, {
    end: true,
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy request error:", err.message);
    clientRes.writeHead(500, {
      "Content-Type": "text/plain",
    });
    clientRes.end("Internal Server Error");
  });
});

const PORT = 3000;

proxyServer.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});