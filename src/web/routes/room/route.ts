// @ts-ignore
import RoomPage from './templates/room.html';
import mustache from 'mustache';

import { Room } from '../../durables/room.js';
import { User } from '../../durables/user.js';
import { Queue } from '../../models/queue.js';
import { Track } from '../../models/track.js';

import Auth from '../../auth.js';
import { parseCookies } from '../../utils.js';

function renderChat(messages : any, user_data : any) {
    return function(text : string, render : Function) {
        let chat = '';

        messages.forEach((message) => {
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
                <div class="message system-message">
                    ${message_template}
                </div>
                `;
            }
            else {
                chat += `
                <div class="message other-message">
                    ${message_template}
                </div>
                `;
            }
        });

        return chat;
    }
}

/*
<div class="song-elements">
    <ul id="queue-list">
        {{#room.queue}}
        <li class="song-info" id="{{id}}">
            <img class="album-art" src="{{album.images[2].url}}">
            <div class="details">
                <span class="song-title">{{name}}</span>
                <span class="song-artists">
                {{#artists}}
                    <a href="{{external_urls.spotify}}" target="_blank">{{name}}</a>{{#next}}, {{/next}}
                {{/artists}}
                </span>
            </div>
            <span class="addedby-user">
                Added by:
                <a href="{{addedby.url}}" target="_blank">
                        <img src="{{addedby.image}}" class="member-icon">
                        {{addedby.name}}
                </a>
            </span>
            <span class="song-duration">{{duration}}</span>
        </li>
        {{/room.queue}}
    </ul>
    <ul id="history-list" class="hide">
        {{#room.history}}
        <li class="song-info" id="{{id}}">
            <img class="album-art" src="{{album.images[2].url}}">
            <div class="details">
                <span class="song-title">{{name}}</span>
                <span class="song-artists">
                    {{#artists}}
                    <a href="{{external_urls.spotify}}" target="_blank">{{name}}</a>{{#next}}, {{/next}}
                    {{/artists}}
                </span>
            </div>
            <span class="addedby-user">
                Added by:
                <a href="{{addedby.url}}" target="_blank">
                    <img src="{{addedby.image}}" class="member-icon">
                    {{addedby.name}}
                </a>
            </span>
            <span class="song-duration">{{duration}}</span>
        </li>
        {{/room.history}}
    </ul>
</div>
*/

function renderTracks(tracks : Queue) {
    return function(text : string, render : Function) {
        let content = "";

        tracks.forEach((track) => {
            content += `
            <li class="song-info" id="${track.id}">
                <img class="album-art" src="${track.album.images[2].url}">
                <div class="details">
                    <span class="song-title">${track.name}</span>
                    <span class="song-artists">
                    ${track.artists.map((artist) => `<a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a>`).join(',')}
                    </span>
                </div>
                <span class="addedby-user">
                    Added by:
                    <a href="${track.addedby.url}" target="_blank">
                        <img src="${track.addedby.image}" class="member-icon">
                        ${track.addedby.name}
                    </a>
                </span>
                <span class="song-duration">${track.duration_string}</span>
            </li>
            `
        });
        return content;
    }
}

export default {
    async get(request : Request, env : any, ctx : any) {
        const url = new URL(request.url);

        const cookies = parseCookies(request.headers.get('cookie'));
        
        const user_token = cookies.get('user_access_token');
        const room_token = cookies.get('room_access_token');

        const user_payload = await Auth.verifyToken(user_token, env.JWT_SECRET_KEY);
        const room_payload = await Auth.verifyToken(room_token, env.JWT_SECRET_KEY);

        if (!user_payload || !room_payload) {
            url.pathname = '/logout';
            return Response.redirect(url, 302);
        }

        const user_id = env.users.idFromString(user_payload.id);
        const user : User = env.users.get(user_id);
        const user_data = await user.getData();

        const room_id = env.rooms.idFromString(room_payload.id);
        const room : Room = env.rooms.get(room_id);
        const room_data = await room.getData();

        if (request.headers.get("Upgrade") == "websocket") {
            return room.fetch(request);
        }

        if (url.pathname == '/room/leave') {
            url.pathname = '/user';
            return Response.redirect(url);
        }

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
                id : room_payload.id.toString(),
                chat : room_data.messages,
                members : room_data.members.values(),
                status : "playing",
                devices : []
            },
            renderChat : (text : string, render : Function) => renderChat(room_data.messages, user_data),
            renderQueue : (text : string, render : Function) => renderTracks(Queue.fromObject(room_data.queue as Track[])),
            renderHistory : (text : string, render : Function) => renderTracks(Queue.fromObject(room_data.history as Track[]))
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}