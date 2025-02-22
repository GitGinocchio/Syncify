
import { User } from '../../durables.js';
import Utils from '../../utils.js';

export default {

    async get (request : Request, env, ctx) {
        const url = new URL(request.url);

        if (request.headers.get("Upgrade") != "websocket") {
            url.pathname = "/404";
            return Response.redirect(url);
        }

        const raw = await request.text();
        const params = Utils.parseParams(raw);

        let id = env.users.idFromName(params.spotifyid);
        let user : User = env.users.get(id);

        return user.fetch(request);
    }
}