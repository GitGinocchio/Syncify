import BugReport from '../templates/bugreport.html'
import mustache from 'mustache';

export default {
    async post (request, env, ctx) {

    },

    async get (request, env, ctx) {
        const url = new URL(request.url);

        const html = mustache.render(BugReport, { 
            "user" : { "name" : "John Doe", "image" : "/image", "url" : "https://example.com" }, 
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}