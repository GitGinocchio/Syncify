
export default {
    async fetch(request, env, ctx) {
        if (request.headers.get("Upgrade") != "websocket") {
            return new Response("Not Found", { status: 404 })
        }

        const [client, server] = Object.values(new WebSocketPair());

        server.accept();

        server.addEventListener("open", (event) => {
            console.log(event);
        });

        server.addEventListener("message", (event) => {
            const data = JSON.parse(event.data.data);

            // Abbiamo ricevuto i dati dell'account dell'utente
            // 1. Dobbiamo processare i dati dell'utente e creare un durable Object per quell'utente
            // 2. Dobbiamo inviare una risposta al client per notificargli che il login e' andato a buon fine
            //server.send();
        });

        server.addEventListener("close", (event) => {
            console.log(event);
        });

        return new Response(null, { 
            status: 101, 
            webSocket: client, 
            headers : {
                "sec-websocket-key" : request.headers.get('sec-websocket-key'),
                "sec-websocket-protocol" : request.headers.get("sec-websocket-protocol"),
                "sec-websocket-version" : request.headers.get("sec-websocket-version"),
        } })
    }
}
