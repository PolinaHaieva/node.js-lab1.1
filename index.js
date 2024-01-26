'use strict';

import { createServer, request as _request } from 'node:http';

const PORT = 8000;

const receiveBody = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

createServer(async (req, res) => {
  const { headers, url, method } = req;
  const { pathname, hostname } = new URL(url);
  const options = { hostname, path: pathname, method, headers };

  const request = _request(options, (response) => {
    console.log(`Proxying request to: ${hostname}${pathname}, Method: ${method}, Status: ${response.statusCode}`);
    res.writeHead(response.statusCode, response.headers);
    response.pipe(res);
  });

  request.on('error', (err) => {
    console.error('Proxy request error:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  });

  if (method === 'POST' || method === 'PUT') {
    const body = await receiveBody(req);
    request.write(body);
  }

  request.end();
}).listen(PORT);

console.log(`HTTP Proxy listening on port ${PORT}`);
