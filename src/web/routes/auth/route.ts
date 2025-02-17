import { User } from '../../durables.js';


export default {

    async get (request : Request, env, ctx) {
        const url = new URL(request.url);

        if (request.headers.get("Upgrade") != "websocket") {
            url.pathname = "/404";
            return Response.redirect(url);
        }

        const [client, server] = Object.values(new WebSocketPair());

        server.accept();

        server.addEventListener("open", (event) => {
            console.log(event);
        });

        server.addEventListener("message", async (event) => {
            // Abbiamo ricevuto i dati dell'account dell'utente
            // 1. Dobbiamo processare i dati dell'utente e creare un durable Object per quell'utente
            // 2. Dobbiamo inviare una risposta al client per notificargli che il login e' andato a buon fine
            const data = JSON.parse(event.data);

            let id = env.users.idFromName(data.user.id);
            let user : User = env.users.get(id);

            await user.init(
                data.user.id,
                data.user.display_name,
                data.user.birthdate,
                data.user.email,
                data.platform,
                data.locale,
                data.user.external_urls,
                data.user.explicit_content,
                data.user.images,
                data.user.policies,
                data.user.product,
                data.user.followers,
                data.user.country,
                data.user.type,
                data.user.uri
            );

            console.log(await user.getData());

            const response = JSON.stringify({
                status: 'success',
                message : 'successfully logged in',
                id : id.toString()
            });

            server.send(response);
        });

        server.addEventListener("error", (event) => {
            console.log(event);
        });

        server.addEventListener("close", (event) => {
            console.log(event);
        });

        const response = new Response(null, { 
            status : 101,
            webSocket : client,
            // @ts-ignore
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