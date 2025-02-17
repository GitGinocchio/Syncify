

export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);
        url.pathname = '/404'
        return Response.redirect(url);
    }
}