// @ts-ignore
import BugReport from './bugreport.html'
import mustache from 'mustache';

import { User } from '../../durables.js';
import Auth from '../../auth.js'
import Utils from '../../utils.js';

export default {
    async post (request : Request, env, ctx) {
        return new Response("Not implemented");
    },

    async get (request : Request, env, ctx) {
        const cookies = Utils.parseCookies(request.headers.get('cookie'));
        const url = new URL(request.url);
        
        const token = cookies.get('user_access_token');
        const payload = await Auth.verifyToken(token, env.JWT_SECRET_KEY);

        let data : any = null;
        if (payload != null){
            const id = env.users.idFromString(payload.id);
            const user : User = env.users.get(id);
            data = await user.getData();
        }

        const html = mustache.render(BugReport, { 
            user : { 
                name : data?.display_name, 
                image : data?.images[0].url, 
                url: data?.external_urls.spotify
            }, 
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}