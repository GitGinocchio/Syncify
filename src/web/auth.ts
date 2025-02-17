// @ts-ignore
const jwt = require('jsonwebtoken');

import Utils from './utils.js';

const protectedRoutes = [
    '/user',
    '/room',
    '/join',
    '/new',
]

export default {
    async auth(request : Request, env, ctx) {
        const url = new URL(request.url);
        if (!protectedRoutes.includes(url.pathname)) { return; }

        const cookies = Utils.parseCookies(request.headers.get('cookie'));

        const token = cookies.get('user_access_token');
        const payload = await this.verifyToken(token, env.JWT_SECRET_KEY);
        
        if (!payload) {
            url.pathname = '/403'
            return Response.redirect(url);
        }

        const id = env.users.idFromString(payload.id);

        const user = env.users.get(id);
        const data = await user?.getData();

        if (!data) {
            url.pathname = '/logout'
            return Response.redirect(url);
        }
    },

    async generateToken(payload : Request, expiration, secret) {
        return jwt.sign(payload, secret, { expiresIn: expiration });
    },

    async verifyToken(token, secret) {
        if (!token) return null;

        try {
            const decoded = jwt.verify(token, secret);
            return decoded;
        } catch (err) {
            console.log(err);
            return null;
        }
    }
}