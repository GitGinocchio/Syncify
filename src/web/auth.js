const jwt = require('jsonwebtoken');

const protectedRoutes = [
    '/user',
    '/room',
    '/join',
    '/new',
]

export default {
    async auth(request, env, ctx) {
        const url = new URL(request.url);
        if (protectedRoutes.includes(url.pathname)) {
            //return new Response('Not Authorized', { status: 403 });
        }
    },

    async generateToken(payload, expiration) {
        const secret = "wdahgahwdhsghjjahwjdhauwhruahwuodhoauwf";

        console.log(process.env);
        return jwt.sign(payload, secret, { expiresIn: expiration });
    }

}