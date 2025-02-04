import New from './new.html';
import mustache from 'mustache';

import Auth from '../../auth.js'
import Utils from '../../utils.js';

export default {
    async get (request, env, ctx) {
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        const url = new URL(request.url);
        
        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token, env.JWT_SECRET_KEY);
        const id = env.users.idFromString(payload.id);

        const user = env.users.get(id);
        const data = await user.getUserData();

        const html = mustache.render(New, { 
            user : { 
                name : data.user.display_name, 
                image : data.user.images[0].url, 
                url: data.user.external_urls.spotify
            }, 
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    },

    async post(request, env, ctx) {
        const url = new URL(request.url);
        const cookies = Utils.parseCookies(request.headers.get('cookie'));

        const raw = await request.text();
        const room_data = raw.split('&').reduce((acc, pair) => ({ ...acc, [pair.split('=')[0]]: pair.split('=')[1] }), {});

        const user_token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(user_token, env.JWT_SECRET_KEY);
        const userid = env.users.idFromString(payload.id);

        const user = env.users.get(userid);
        const user_data = await user.getUserData();

        // Ci assicuriamo che ci sia un singolo id
        // non possiamo generarlo con il nome della stanza, perché potrebbe essere già esistente
        // e ritornerebbe una stanza gia presente
        // 
        // (Questo id potrebbe essere utilizzato per unirsi alle stanze private)
        // (Il roomid come lo userid non ha senso inserirlo nei dati salvati nel Durable Object 
        //  perche di per se' il Durable Object e' gia' a conoscenza del suo id)
        const roomid = env.rooms.newUniqueId();
        const room = env.rooms.get(roomid);

        let rooms = await env.kv.get("rooms");

        if (rooms != null) {
            rooms = JSON.parse(rooms);
            rooms[roomid] = null;
        } else {
            rooms = { [roomid]: null };
        }

        await env.kv.put("rooms", JSON.stringify(rooms));

        const room_token = await Auth.generateToken({ id : roomid.toString() }, env.ROOM_ACCESS_TOKEN_MAX_AGE, env.JWT_SECRET_KEY);

        await room.setRoomData({
            id : roomid.toString(),
            name : room_data.name,
            num_members : 0,
            userlimit : room_data.userlimit,
            visibility : room_data.visibility,
            editablequeue : room_data.editablequeue,
            owner : user_data
        })

        return new Response(null, { 
            headers: {
                'Set-Cookie' : `room_access_token=${room_token}; Max-Age=${env.ROOM_ACCESS_TOKEN_MAX_AGE}; Secure; HttpOnly`,
                Location : '/room'
            },
            status: 302
        });
    }
}