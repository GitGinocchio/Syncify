import Challenge from './challenge.html'
import mustache from 'mustache';

export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);

        const html = mustache.render(Challenge, { 
            user : { name : "John Doe", image : "/image", url: "https://example.com" },
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}