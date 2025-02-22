// @ts-ignore
import UserPage from './user.html';
import mustache from 'mustache';

import { User } from '../../durables.js';
import Auth from '../../auth.js';
import Utils from '../../utils.js';

export default {
    async get (request : Request, env, ctx) {
        const url = new URL(request.url);
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        
        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token, env.JWT_SECRET_KEY);
        const id = env.users.idFromString(payload.id);

        const user : User = env.users.get(id);
        const data = await user.getData();

        const html = mustache.render(UserPage, { 
            user : {
                name : data.display_name, 
                //@ts-ignore
                image : data.images[0].url,
                //@ts-ignore
                url: data.external_urls.spotify
            },
            num_rooms : Object.keys(env.rooms).length,
            num_public_rooms : 0,
            num_total_rooms : 0
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}