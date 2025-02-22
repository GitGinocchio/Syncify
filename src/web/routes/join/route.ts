// @ts-ignore
import Join from './join.html'
import mustache from 'mustache';

import { User, Room } from '../../durables.js';
import Auth from '../../auth.js'
import Utils from '../../utils.js';

export default {
    async post (request : Request, env, ctx) {
        const url = new URL(request.url);
        const raw = await request.text();
        const params = Utils.parseParams(raw);

        // @ts-ignore
        const room_token = await Auth.generateToken({ id : params.roomid }, env.ROOM_ACCESS_TOKEN_MAX_AGE, env.JWT_SECRET_KEY);

        var rooms = await env.kv.get("rooms");
        var rooms = JSON.parse(rooms);

        if (!rooms.includes(params.roomid)) {
            // La stanza e' stata eliminata e non esiste piu'
            // dovremmo notificare l'utente che la stanza a cui sta cercando di accedere non esiste piu'
            url.pathname = '/404';
            return Response.redirect(url, 302);
        }

        return new Response(null, { 
            headers: {
                'Set-Cookie' : `room_access_token=${room_token}; Max-Age=${env.ROOM_COOKIE_MAX_AGE}; Secure; HttpOnly`,
                Location : '/room'
            },
            status: 302
        });
    },

    async get (request : Request, env, ctx) {
        const url = new URL(request.url);

        // @ts-ignore
        if (request.params.roomid) {
            // @ts-ignore
            const room_token = await Auth.generateToken({ id : request.params.roomid }, env.ROOM_ACCESS_TOKEN_MAX_AGE, env.JWT_SECRET_KEY);

            return new Response(null, {
                headers: {
                    'Set-Cookie' : `room_access_token=${room_token}; Path=/; Max-Age=${env.ROOM_COOKIE_MAX_AGE}; Secure; HttpOnly`,
                    Location : '/room'
                },
                status: 302
            })
        }

        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        
        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token, env.JWT_SECRET_KEY);

        if (!payload) {
            url.pathname = '/logout';
            return Response.redirect(url, 302);
        }

        const id = env.users.idFromString(payload.id);

        const user : User = env.users.get(id);
        const user_data = await user?.getData();

        // Qui dobbiamo ottenere tutte le stanze (durable objects) e filtrare per le stanze pubbliche
        let roomids = await env.kv.get("rooms");
        
        const rooms : Array<Object> = [];
        
        if (roomids != null) {
            roomids = JSON.parse(roomids);

            let changed = false;
            for (const roomidstring of roomids) {
                let roomid = env.rooms.idFromString(roomidstring);
                let room : Room = env.rooms.get(roomid);
                let data = await room?.getData();

                if (room != null && data != null) {
                    if (data.public) { rooms.push(data); }
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
                name : user_data?.display_name, 
                // @ts-ignore
                image : user_data?.images[0].url, 
                // @ts-ignore
                url: user_data?.external_urls.spotify
            },
            rooms : rooms.length > 0 ? rooms : null // null if vuoto else {...}
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    },
}