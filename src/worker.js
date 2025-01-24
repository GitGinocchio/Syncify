
import User from './routes/user.js';
import Room from './routes/room.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        switch (url.pathname) {
            case './routes/user.js':
                User.fetch(request, env, ctx);
            case './routes/room.js':
                Room.fetch(request, env, ctx);
            default:
                return new Response("hello world!");
        }
    }
}