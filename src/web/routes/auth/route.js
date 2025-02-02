


export default {

    async get (request, env, ctx) {
        const url = new URL(request.url);

        return Response.redirect(`${url.protocol}//${url.hostname}:${url.port}/user`, 302);
    }
}