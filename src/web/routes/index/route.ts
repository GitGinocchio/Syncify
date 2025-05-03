// @ts-ignore
import Index from './index.html'

import Auth from '../../auth.js';
import { parseCookies, parseParams } from '../../utils.js';

export default {
    async get (request : Request, env, ctx) {
        const cookies = parseCookies(request.headers.get('cookie'));
        const url = new URL(request.url);

        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token, env.JWT_SECRET_KEY);

        if (payload) {
            url.pathname = '/user'
            return Response.redirect(url); 
        }

        return new Response(Index, { headers: { 'Content-Type': 'text/html' }});
    }
}