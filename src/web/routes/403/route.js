import Page403 from './403.html'
import mustache from 'mustache';

import Auth from '../../auth.js';
import Utils from '../../utils.js';

export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        
        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token, env.JWT_SECRET_KEY);

        let data = null;
        if (payload != null){
            const id = env.users.idFromString(payload.id);
            const user = env.users.get(id);
            data = await user.getUserData();
        }

        const html = mustache.render(Page403, { 
            user : {
                name : payload ? data.user.display_name : null, 
                image : payload ? data.user.images[0].url : null, 
                url: payload ? data.user.external_urls.spotify : null
            },
        });

        return new Response(html, { headers: {'Content-Type': 'text/html'} });
    }
}