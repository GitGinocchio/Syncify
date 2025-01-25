import Room from '../templates/room.html'

export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);

        return new Response(Room, { headers: { 'Content-Type': 'text/html' }});
    }
}