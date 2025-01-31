import Challenge from './challenge.html'
import mustache from 'mustache';

import auth from '../../auth.js'

export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const id = env.users.idFromString(code);

        const user = env.users.get(id);
        const data = await user.getUserData();

        const html = mustache.render(Challenge, { 
            user : {
                name : data.user.display_name, 
                image : data.user.images[0].url, 
                url: data.user.external_urls.spotify
            }
        });

        const max_age = 10400;

        const token = await auth.generateToken({ id }, max_age)

        return new Response(html, { 
            headers: { 
                'Content-Type': 'text/html',
                'Set-Cookie' : `user_access_token=${token}; Max-Age=${max_age}; Secure; HttpOnly`
            },
            status: 200
        });
    }
}