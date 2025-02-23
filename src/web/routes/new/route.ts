// @ts-ignore
import New from './new.html';
import mustache from 'mustache';

import { User, Room } from '../../durables.js';
import Auth from '../../auth.js';
import Utils from '../../utils.js';

export default {
    async get (request : Request, env, ctx) {
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        const url = new URL(request.url);
        
        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token, env.JWT_SECRET_KEY);

        if (!payload) {
            url.pathname = '/logout';
            return Response.redirect(url, 302);
        }
    
        const id = env.users.idFromString(payload.id);

        const user = env.users.get(id);
        const data : User = await user.getData();

        const html = mustache.render(New, { 
            user : { 
                name : data.display_name, 
                // @ts-ignore
                image : data.images[0].url, 
                // @ts-ignore
                url: data.external_urls.spotify
            }, 
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    },

    async post(request : Request, env, ctx) {
        const url = new URL(request.url);
        const cookies = Utils.parseCookies(request.headers.get('cookie'));

        const room_data = Utils.parseParams(await request.text());

        console.log(room_data);
        console.log(room_data.name);

        const user_token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(user_token, env.JWT_SECRET_KEY);
        

        if (!payload) {
            url.pathname = '/logout';
            return Response.redirect(url, 302);
        }

        const userid = env.users.idFromString(payload.id);

        const user : User = env.users.get(userid);
        const user_data = await user.getData();

        // Ci assicuriamo che ci sia un singolo id
        // non possiamo generarlo con il nome della stanza, perché potrebbe essere già esistente
        // e ritornerebbe una stanza gia presente
        // 
        // (Questo id potrebbe essere utilizzato per unirsi alle stanze private)
        const roomid = env.rooms.newUniqueId();
        const room : Room = env.rooms.get(roomid);

        // @ts-ignore
        const room_token = await Auth.generateToken({ id : roomid.toString() }, env.ROOM_ACCESS_TOKEN_MAX_AGE, env.JWT_SECRET_KEY);

        // Aggiungere l'id dell'owner della stanza
        await room.init(
            room_data.name,
            room_data.userlimit,
            room_data.editablequeue == undefined ? false : true,
            room_data.visibility == 'public' ? true : false,
            user_data
        )

        return new Response(null, { 
            headers: {
                'Set-Cookie' : `room_access_token=${room_token}; Path=/; Max-Age=${env.ROOM_COOKIE_MAX_AGE}; Secure; HttpOnly;`,
                Location : '/room'
            },
            status: 302
        });
    }
}