



export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);

        return new Response("user");
    }
}