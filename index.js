'use strict'

import * as http from 'node:http'
import * as net from 'node:net'

// Спеціальні символи для представлення кінця рядка та порту сервера
const CRLF = '\r\n'
const PORT = 8000
const DEFAULT_HTTP_PORT = 80

// Функція для отримання асинхронного тіла запиту
const receiveBody = async (stream) => {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)

  return Buffer.concat(chunks)
}

// Створення HTTP-сервера
const server = http.createServer(async (req, res) => {
  console.log('\nRequest received (HTTP)')
  const { remoteAddress, remotePort } = req.socket
  console.log(`Connection from ${remoteAddress}:${remotePort} to ${req.url}`)

  const { headers, url, method } = req
  const { pathname, hostname } = new URL(url)
  const options = { hostname, path: pathname, method, headers }

// Створення HTTP-запиту та передача відповіді клієнту
  const request = http.request(options, (result) => void result.pipe(res))

// Якщо метод запиту не 'GET' або 'HEAD', отримуємо тіло запиту та відправляємо його у запит
  if (method !== 'GET' && method !== 'HEAD') {
    const body = await receiveBody(req)
    request.write(body)
  }

  request.end()
})

// Обробка події 'connect' для HTTPS-запитів
server.on('connect', (req, socket, head) => {
  console.log('\nRequest received (HTTPS)')

// Надсилання успішної відповіді для встановлення тунелю
  socket.write('HTTP/1.1 200 Connection Established' + CRLF + CRLF)

  const { remoteAddress, remotePort } = socket
  const { hostname, port } = new URL(`http://${req.url}`)
  const targetPort = parseInt(port, 10) || DEFAULT_HTTP_PORT

 // Створення TCP-з'єднання з цільовим сервером та встановлення тунелю
  const proxy = net.connect(targetPort, hostname, () => {
    if (head) proxy.write(head)
    socket.pipe(proxy).pipe(socket)
  })

  console.log(
    `Connection from ${remoteAddress}:${remotePort} to ${hostname}:${targetPort}`
  )

  // Обробка помилок та завершення з'єднання при виникненні помилок
  proxy.on('error', (err) => {
    console.error(`Proxy connection error: ${err.message}\n`)
    socket.end()
  })

  socket.on('error', (err) => {
    console.error(`Socket error: ${err.message}\n`)
    proxy.end()
  })

  socket.on('end', () => {
    console.log(`Connection from ${remoteAddress}:${remotePort} closed\n`)
    proxy.end()
  })
})

// Запуск HTTP-проксі-сервера
console.log(`Starting HTTP proxy server on port ${PORT}...`)
server.listen(PORT, '0.0.0.0')
