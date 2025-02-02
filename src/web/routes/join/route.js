import Join from './join.html'
import mustache from 'mustache';

import Auth from '../../auth.js'
import Utils from '../../utils.js';

export default {
    async get (request, env, ctx) {
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        const url = new URL(request.url);
        
        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token);
        const id = env.users.idFromString(payload.id);

        const user = env.users.get(id);
        const user_data = await user.getUserData();

        // Qui dobbiamo ottenere tutte le stanze (durable objects) e filtrare per le stanze pubbliche

        const html = mustache.render(Join, { 
            user : { 
                name : user_data.user.display_name, 
                image : user_data.user.images[0].url, 
                url: user_data.user.external_urls.spotify
            },
            rooms : null // null if vuoto else {...}
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}