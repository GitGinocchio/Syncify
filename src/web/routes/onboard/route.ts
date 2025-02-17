import OnBoard from './onboard.html'
import mustache from 'mustache';

export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);

        /*
        const html = mustache.render(OnBoard, { 
            "user" : { "name" : "John Doe", "image" : "/image", "url" : "https://example.com" }, 
        });
        */

        return new Response(OnBoard, { headers: { 'Content-Type': 'text/html' }});
    }
}