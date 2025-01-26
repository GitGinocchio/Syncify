import Room from './routes/room/route.js';
import User from './routes/user/route.js';

const eventHandlers = {
  '/room' : {
    'message' : (data, socket) => Room.onChatMessage(data, socket),
  },
  '/user' : {
  }
}

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