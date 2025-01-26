import Room from './routes/room/route.js';
import User from './routes/user/route.js';

const eventHandlers = {
  '/room' : {
    'message' : (data, socket) => Room.onChatMessage(data, socket),
  },
  '/user' : {
  }
}

/*
// Global list to store all active WebSocket connections
const clients = new Set();

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  // Add the new connection to the global list
  clients.add(server);
  server.accept();

  // Handle incoming messages
  server.addEventListener('message', event => {
    console.log('Message received from client:', event.data);

    // Broadcast the message to all connected clients
    clients.forEach(client => {
      if (client !== server && client.readyState === WebSocket.OPEN) {
        client.send(`Broadcast: ${event.data}`);
      }
    });
  });

  // Handle connection close
  server.addEventListener('close', () => {
    console.log('Client disconnected');
    // Remove the connection from the global list
    clients.delete(server);
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}
*/

export default {
  async handle(request, env, ctx) {
    if (request.headers.get("Upgrade") === "websocket") {
      const [clientSocket, serverSocket] = Object.values(new WebSocketPair());

      serverSocket.accept();

      serverSocket.addEventListener("open", (event) => {
        console.log("Connected to the server: ", event);
      });

      serverSocket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        console.log("Message from the client: ", data);

        const handler = eventHandlers[data.route][data.type];
        if (handler) { handler(data, serverSocket); } 
        else { console.error("UnHandled Route:", data.route); }
      });

      serverSocket.addEventListener("close", (event) => {
        console.log("Connection closed: ", event);
      });

      clientSocket.addEventListener("error", (event) => {
        console.log("Error: ", event);
      });



      return new Response(null, { status: 101, webSocket: clientSocket });
    }
  }
};