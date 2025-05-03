// @ts-ignore
import Challenge from './challenge.html';
import mustache from 'mustache';
import { User } from '../../durables/user.js';

import Auth from '../../auth.js'

export default {
    async get (request : Request, env, ctx) {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const id = env.users.idFromString(code);

        const user : User = env.users.get(id);
        const data = await user?.getData();

        const html = mustache.render(Challenge, { 
            user : {
                name : data?.display_name, 
                // @ts-ignore
                image : data?.images[0]?.url,
                // @ts-ignore
                url: data?.external_urls.spotify
            }
        });

        // @ts-ignore
        const token = await Auth.generateToken({ id : id.toString() }, env.USER_ACCESS_TOKEN_MAX_AGE, env.JWT_SECRET_KEY);
        
        return new Response(html, { 
            headers: { 
                'Content-Type': 'text/html',
                'Set-Cookie' : `user_access_token=${token}; Max-Age=${env.USER_COOKIE_MAX_AGE}; Secure; HttpOnly`
            },
            status: 200
        });
    }
}