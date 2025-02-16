// import ... from 'socket.io-serverless';

async function onAuthEvent(request, env, ctx, server, event) {
    // Abbiamo ricevuto i dati dell'account dell'utente
    // 1. Dobbiamo processare i dati dell'utente e creare un durable Object per quell'utente
    // 2. Dobbiamo inviare una risposta al client per notificargli che il login e' andato a buon fine

    const data = JSON.parse(event.data).data;

    let id = env.users.idFromName(data.user.id);
    let user = env.users.get(id);

    let saved_data = await user.getUserData();

    if (!saved_data) {
        saved_data = {};
        saved_data['user'] = data.user;
        saved_data['user']['syncifyid'] = id.toString();
        saved_data['locale'] = data.locale;
        saved_data['platforms'] = {};
    }
    
    saved_data['platforms'][data.platform.event_sender_context_information.device_id] = data.platform;

    await user.setUserData(saved_data);

    const response = JSON.stringify({
        route : '/auth',
        type: 'auth',
        status: 'success',
        message : 'successfully logged in',
        id : id.toString()
    });

    server.send(response);
}

async function onRoomMessage(request, env, ctx, server, event) {
    console.log(event);
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
                case '/room':
                    if (data.type == 'message') {
                        await onRoomMessage(request, env, ctx, server, event);
                    }
                    break;
                default:
                    console.log(`Unknown Websocket event ${event}`)
            }
        });

        server.addEventListener("error", (event) => {
            console.log(event);
        });

        server.addEventListener("close", (event) => {
            console.log(event);
        });

        const response = new Response(null, { status : 101, webSocket : client, 
            headers : {
                "sec-websocket-key" : request.headers.get('sec-websocket-key'),
                "sec-websocket-version" : request.headers.get("sec-websocket-version"),
            } 
        });

        const proto = request.headers.get("sec-websocket-protocol");
        if (proto) { response.headers.set("sec-websocket-protocol", proto); }

        return response;
    }
}
