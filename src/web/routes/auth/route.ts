
import { User } from '../../durables/user.js';

export default {

    async get (request : Request, env, ctx) {
        const url = new URL(request.url);

        if (request.headers.get("Upgrade") != "websocket") {
            url.pathname = "/404";
            return Response.redirect(url);
        }

        // @ts-ignore
        let id = env.users.idFromName(request.params.spotifyid);
        let user : User = env.users.get(id);

        return user.fetch(request);
    }
}