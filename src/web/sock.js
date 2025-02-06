

async function onAuthEvent(request, env, ctx, server, event) {
    // Abbiamo ricevuto i dati dell'account dell'utente
    // 1. Dobbiamo processare i dati dell'utente e creare un durable Object per quell'utente
    // 2. Dobbiamo inviare una risposta al client per notificargli che il login e' andato a buon fine

    const data = JSON.parse(event.data).data;

    // Qui dobbiamo considerare che se e' gia' presente un utente con lo stesso id 
    // (Cosa impossibile perche gli id di spotify sono univoci)
    // Verra' ritornato lo stesso user
    // Qui dobbiamo gestire il caso in cui l'utente stia accedendo da due dispositivi diversi con lo stesso account
    // Dobbiamo quindi aggiornare i dati dell'utente per inserire il nuovo client
    let id = env.users.idFromName(data.user.id);
    let user = env.users.get(id);

    await user.setUserData(data);

    const response = JSON.stringify({
        route : '/auth',
        type: 'auth',
        status: 'success',
        message : 'successfully logged in',
        id : id.toString()
    });

    server.send(response);
}

export default {
    async fetch(request, env, ctx) {
        if (request.headers.get("Upgrade") != "websocket") {
            const url = new URL(request.url);
            url.pathname = "/404";
            return Response.redirect(url);
        }
        const [client, server] = Object.values(new WebSocketPair());

        server.accept();

        server.addEventListener("open", (event) => {
            console.log(event);
        });

        server.addEventListener("message", async (event) => {
            const data = JSON.parse(event.data);

            switch (data.route) {
                case '/auth':
                    await onAuthEvent(request, env, ctx, server, event);
                    break;
                default:
                    console.log(`Unknown Websocket event ${event}`)
            }
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
            } 
        })
    }
}
