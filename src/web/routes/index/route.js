import Index from './index.html'

import Auth from '../../auth.js';
import Utils from '../../utils.js';

export default {
    async get (request, env, ctx) {
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        const url = new URL(request.url);

        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token, env.JWT_SECRET_KEY);

        if (payload) { 
            return Response.redirect(`${url.protocol}${url.hostname}:${url.port}/user`); 
        }

        return new Response(Index, { headers: { 'Content-Type': 'text/html' }});
    }
}