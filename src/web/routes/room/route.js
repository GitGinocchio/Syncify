import Room from './room.html'
import mustache from 'mustache';

import Auth from '../../auth.js'
import Utils from '../../utils.js';

export default {
    onChatMessage(data, socket) {
        console.log("Message from the client: ", data.text);

        const processed_data = JSON.stringify({
            sid : null,
            type : data.type,
            sender : {
                image : "image.png",
                name : "Ginocchio",
            },
            text : data.text
        });

        socket.send(processed_data);
    },

    async get(request, env, ctx) {
        const url = new URL(request.url);
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        
        const user_token = cookies.get('user_access_token');
        const user_payload = await Auth.verifyToken(user_token);
        const user_id = env.users.idFromString(user_payload.id);

        const user = env.users.get(user_id);
        const user_data = await user.getUserData();

        const room_token = cookies.get('room_access_token');
        const room_payload = await Auth.verifyToken(room_token);
        const room_id = env.rooms.idFromString(room_payload.id);

        const html = mustache.render(Room, { 
            user : { 
                name : user_data.user.display_name, 
                image : user_data.user.images[0].url, 
                url: user_data.user.external_urls.spotify
            }, 
            room : { 
                id : room_id,
                queue : [], 
                artists : [],
                status : "playing", 
                devices : []
            },
            eq: (a, b) => { return a === b; }
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}