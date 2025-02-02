const jwt = require('jsonwebtoken');

import Utils from './utils.js';

const secret = "wdahgahwdhsghjjahwjdhauwhruahwuodhoauwf";

const protectedRoutes = [
    '/user',
    '/room',
    '/join',
    '/new',
]

export default {
    async auth(request, env, ctx) {
        const url = new URL(request.url);
        const cookies = Utils.parseCookies(request.headers.get('cookie'));

        const token = cookies.get('user_access_token');
        const payload = await this.verifyToken(token);

        if (!protectedRoutes.includes(url.pathname)) { return; }

        if (!payload) {
            return new Response('Not Authorized', { status: 403 });
        }
    },

    async generateToken(payload, expiration) {
        console.log(expiration);
        return jwt.sign(payload, secret, { expiresIn: expiration });
    },

    async verifyToken(token) {
        if (!token) return null;

        try {
            const decoded = jwt.verify(token, secret);
            return decoded;
        } catch (err) {
            return null;
        }
    }
}