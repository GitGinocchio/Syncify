import Challenge from './challenge.html'
import mustache from 'mustache';

export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const id = env.users.idFromString(code);

        const user = env.users.get(id);

        // user.data non funziona, i dati all'interno di user devono essere salvati utilizzando il metodo fetch
        // quindi nel file sock.js devo inviare una richiesta al durable object per inviare i dati

        const html = mustache.render(Challenge, { 
            user : { name : "John Doe", image : "/image", url: "https://example.com" },
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}