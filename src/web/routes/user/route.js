import User from './user.html'
import mustache from 'mustache';

import Auth from '../../auth.js';
import Utils from '../../utils.js';

export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        
        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token);
        const id = env.users.idFromString(payload.id);

        const user = env.users.get(id);
        const data = await user.getUserData();

        const html = mustache.render(User, { 
            user : {
                name : data.user.display_name, 
                image : data.user.images[0].url, 
                url: data.user.external_urls.spotify
            },
            num_rooms : Object.keys(env.rooms).length,
            num_public_rooms : 0
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}