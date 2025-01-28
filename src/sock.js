


export default {
    async fetch(request, env, ctx) {
        if (request.headers.get("Upgrade") != "websocket") {
            return new Response("Not Found", { status: 404 })
        }

        let pair = new WebSocketPair();

        return new Response(null, { status: 101, webSocket: pair[0] })
    }
}
