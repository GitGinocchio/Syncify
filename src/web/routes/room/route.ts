// @ts-ignore
import RoomPage from './room.html'
import mustache from 'mustache';

import { Room, User } from '../../durables.js'
import Auth from '../../auth.js'
import Utils from '../../utils.js';

export default {
    async get(request : Request, env : any, ctx : any) {
        const url = new URL(request.url);
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        
        const user_token = cookies.get('user_access_token');
        const user_payload = await Auth.verifyToken(user_token, env.JWT_SECRET_KEY);
        const user_id = env.users.idFromString(user_payload.id);

        const user : User = env.users.get(user_id);
        const user_data = await user.getData();

        const room_token = cookies.get('room_access_token');
        const room_payload = await Auth.verifyToken(room_token, env.JWT_SECRET_KEY);
        const room_id = env.rooms.idFromString(room_payload.id);
        const room : Room = env.rooms.get(room_id);

        if (request.headers.get("Upgrade") == "websocket") {
            return room.fetch(request);
        }

        const html = mustache.render(RoomPage, { 
            user : { 
                name : user_data.display_name, 
                // @ts-ignore
                image : user_data.images[0].url,
                // @ts-ignore
                url: user_data.external_urls.spotify
            }, 
            room : { 
                id : room_id,
                queue : [], 
                artists : [],
                status : "playing", 
                devices : []
            },
            eq: (a : any, b : any) => { return a === b; }
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}