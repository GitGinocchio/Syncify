import Index from './index.html'


export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);

        return new Response(Index, { headers: { 'Content-Type': 'text/html' }});
    }
}