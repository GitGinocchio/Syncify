// @ts-ignore
import RoomPage from './room.html'
import mustache from 'mustache';

import { Room, User } from '../../durables.js'
import Auth from '../../auth.js'
import Utils from '../../utils.js';



export default {
    async tail(events) {
        fetch("https://syncify.ginocchio.workers.dev/logs", {
            method: "POST",
            body: JSON.stringify(events),
        });
    },

    async logs(request : Request, env : any, ctx : any) {
        console.log(request);
        return new Response('Hello World', { status: 200 });
    }
}