import Index from './index.html'

import Utils from '../../utils.js';

export default {
    async get (request, env, ctx) {
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        const url = new URL(request.url);

        const token = cookies.get('user_access_token');
        
        // Non controlliamo se il token sia valido perche' viene fatto automaticamente prima di ogni richiesta.
        if (token) { return Response.redirect(`${url.protocol}${url.hostname}:${url.port}/user`); }

        return new Response(Index, { headers: { 'Content-Type': 'text/html' }});
    }
}