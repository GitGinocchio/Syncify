import Join from './join.html'
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
    }
}