import Join from './join.html'
import mustache from 'mustache';

import Auth from '../../auth.js'
import Utils from '../../utils.js';

export default {
    async post (request, env, ctx) {
        const raw = await request.text();
        const params = Utils.parseParams(raw);

        const room_token = await Auth.generateToken({ id : params.roomid }, env.ROOM_ACCESS_TOKEN_MAX_AGE, env.JWT_SECRET_KEY);

        return new Response(null, { 
            headers: {
                'Set-Cookie' : `room_access_token=${room_token}; Max-Age=${env.ROOM_COOKIE_MAX_AGE}; Secure; HttpOnly`,
                Location : '/room'
            },
            status: 302
        });
    },

    async get (request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname == '/join/') {
            url.pathname = '/join';
            return Response.redirect(url);
        }

        if (request.params.roomid) {
            const room_token = await Auth.generateToken({ id : request.params.roomid }, env.ROOM_ACCESS_TOKEN_MAX_AGE, env.JWT_SECRET_KEY);

            return new Response(null, {
                headers: {
                    'Set-Cookie' : `room_access_token=${room_token}; Max-Age=${env.ROOM_COOKIE_MAX_AGE}; Secure; HttpOnly`,
                    Location : '/room'
                },
                status: 302
            })
        }

        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        
        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token, env.JWT_SECRET_KEY);
        const id = env.users.idFromString(payload.id);

        const user = env.users.get(id);
        const user_data = await user?.getUserData();

        // Qui dobbiamo ottenere tutte le stanze (durable objects) e filtrare per le stanze pubbliche
        let roomids = await env.kv.get("rooms");
        
        const rooms = [];
        
        if (roomids != null) {
            roomids = JSON.parse(roomids);
            let changed = false;
            for (const roomidstring in roomids) {
                const roomid = env.rooms.idFromString(roomidstring);
                let room = env.rooms.get(roomid);
                let data = await room?.getRoomData();

                if (room != null && data != null) {
                    if (data.visibility == "public") { rooms.push(data); }
                }
                else {
                    delete roomids[roomidstring];
                    changed = true;
                }
            }

            if (changed) {
                await env.kv.put("rooms", JSON.stringify(roomids));
            }
        }

        const html = mustache.render(Join, { 
            user : { 
                name : user_data?.user.display_name, 
                image : user_data?.user.images[0].url, 
                url: user_data?.user.external_urls.spotify
            },
            rooms : rooms.length > 0 ? rooms : null // null if vuoto else {...}
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    },
}