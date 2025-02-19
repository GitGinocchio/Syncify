// @ts-ignore
import RoomPage from './room.html'
import mustache from 'mustache';

import { Room, User } from '../../durables.js'
import Auth from '../../auth.js'
import Utils from '../../utils.js';

function renderChat(data : any, user_data : any) {
    return function(text : string, render : Function) {
        let chat = '';

        data.messages.forEach((message) => {
            const message_template = `					
            <div class="sender">
                <img src="${message.sender.image}">
                <p>${message.sender.name}</p>
            </div>
            <p>${message.message}</p>`;

            if (message.sender.id == user_data.spotifyid) {
                chat += `
                <div class="message my-message">
                    ${message_template}
                </div>
                `;
            }
            else if (message.sender.type == "system") {
                chat += `
                <div class="message other-message">
                    ${message_template}
                </div>
                `;
            }
            else {
                chat += `
                <div class="message system-message">
                    ${message_template}
                </div>
                `;
            }
        });

        return chat;
    }
}

export default {
    async get(request : Request, env : any, ctx : any) {
        const url = new URL(request.url);

        if (url.pathname == '/room/leave') {
            return new Response(null, {
                headers: {
                    'Set-Cookie': `room_access_token=; Max-Age=-1;`,
                    Location: '/user'
                },
                status: 302
            });
        }

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

        const data = await room.getData();

        const html = mustache.render(RoomPage, { 
            user : {
                id : user_data.spotifyid,
                name : user_data.display_name, 
                // @ts-ignore
                image : user_data.images[0].url,
                // @ts-ignore
                url: user_data.external_urls.spotify
            }, 
            room : {
                id : room_id,
                chat : data.messages,
                members : data.members.values(),
                artists : data.artists,
                queue : data.queue,
                status : "playing",
                devices : []
            },
            renderChat : (text : string, render : Function) => renderChat(data, user_data)
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}