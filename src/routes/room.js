import Room from '../templates/room.html'
import { compile } from 'handlebars';

export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);

        const html = compile(Room)({

        })

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}