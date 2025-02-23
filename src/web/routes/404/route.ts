// @ts-ignore
import Page404 from './404.html';
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

        let data : any = null;
        if (payload != null){
            const id = env.users.idFromString(payload.id);
            const user : User = env.users.get(id);
            data = await user.getData();
        }

        const html = mustache.render(Page404, {
            user : {
                // @ts-ignore
                name : payload && data ? data.display_name : null, 
                // @ts-ignore
                image : payload && data ? data.images[0].url : null, 
                // @ts-ignore
                url: payload && data ? data.external_urls.spotify : null
            },
        });

        return new Response(html, { headers: {'Content-Type': 'text/html'} });
    }
}