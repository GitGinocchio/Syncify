import Index from '../templates/login.html'


export default {
    async post (request, env, ctx) {

    },

    async get (request, env, ctx) {
        const url = new URL(request.url);

        return new Response(Index, { headers: { 'Content-Type': 'text/html' }});
    }
}