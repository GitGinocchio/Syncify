// @ts-ignore
const jwt = require('jsonwebtoken');

import Utils from './utils.js';

const protectedRoutes = [
    '/user',
    '/room',
    '/join',
    '/new',
]

const roomidRequiredRoutes = [
    '/room'
]

export default {
    async auth(request : Request, env, ctx) {
        const url = new URL(request.url);
        if (!protectedRoutes.includes(url.pathname)) { return; }

        const cookies = Utils.parseCookies(request.headers.get('cookie'));

        const user_token = cookies.get('user_access_token');
        const room_token = cookies.get('room_access_token');

        const user_payload = await this.verifyToken(user_token, env.JWT_SECRET_KEY);
        const room_payload = await this.verifyToken(room_token, env.JWT_SECRET_KEY);

        if (!user_payload) {
            url.pathname = '/403'
            return Response.redirect(url);
        }

        const userid = env.users.idFromString(user_payload.id);

        const user = env.users.get(userid);
        const user_data = await user?.getData();

        if (!Object.keys(user_data).every((key) => user_data[key] !== undefined)) {
            url.pathname = '/logout'
            return Response.redirect(url);
        }

        if (!roomidRequiredRoutes.includes(url.pathname)) { 
            if (room_token == undefined) { return; }

            // Se la route non richiede un roomid, ma è presente un room_access_token, allora lo rimuovo
            // e reindirizzo l'utente alla stessa pagina in cui cercava di andare
            // (Questa procedura non viene fatta per le route che non richiedono uno userid)
            return new Response(null, {
                headers: {
                    'Set-Cookie': `room_access_token=; Path=/; Max-Age=0; Secure; HttpOnly`,
                    Location: `${url.pathname}`
                },
                status: 302
            });
        }

        return new Response(room_payload?.id.toString(), { status: 200 });

        if (!room_payload) {
            url.pathname = '/403'
            return Response.redirect(url);
        }

        const roomid = env.rooms.idFromString(room_payload.id);
        
        const room = env.users.get(roomid);
        const room_data = await room?.getData();

        if (!room_data) {
            url.pathname = '/room/leave'
            return Response.redirect(url);
        }
    },

    async generateToken(payload : Request, expiration : string, secret : string): Promise<string> {
        return jwt.sign(payload, secret, { expiresIn: expiration });
    },

    async verifyToken(token : string, secret : string): Promise<{ id : string, iat : number, exp : number } | null> {
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