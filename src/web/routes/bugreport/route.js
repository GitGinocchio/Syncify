import BugReport from './bugreport.html'
import mustache from 'mustache';

import Auth from '../../auth.js'
import Utils from '../../utils.js';

export default {
    async post (request, env, ctx) {
        return new Response("Not implemented");
    },

    async get (request, env, ctx) {
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        const url = new URL(request.url);
        
        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token);

        let data = null;
        if (payload != null){
            const id = env.users.idFromString(payload.id);
            const user = env.users.get(id);
            data = await user.getUserData();
        }

        const html = mustache.render(BugReport, { 
            user : { 
                name : data?.user.display_name, 
                image : data?.user.images[0].url, 
                url: data?.user.external_urls.spotify
            }, 
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}