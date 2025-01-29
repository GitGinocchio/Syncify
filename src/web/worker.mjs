import { DurableObject } from "cloudflare:workers";
import { AutoRouter } from 'itty-router';

import IndexRoute from './routes/index/route.js';
import AuthRoute from './routes/auth/route.js';
import UserRoute from './routes/user/route.js';
import NewRoute from './routes/new/route.js';
import JoinRoute from './routes/join/route.js';
import RoomRoute from './routes/room/route.js';
import OnBoardRoute from './routes/onboard/route.js';
import ChallengeRoute from './routes/challenge/route.js';
import BugReportRoute from './routes/bugreport/route.js';

import UserDurableObjMethods from './user.js';
import RoomDurableObjMethods from './room.js';
import Sock from './sock.js'

const router = AutoRouter()

export class Room extends DurableObject {
    constructor(state, env) {
    }

    async fetch(request) { RoomDurableObjMethods.fetch(request) }
}

export class User extends DurableObject {
    constructor(state, env) {
        this.nextAllowedTime = 0;
    }

    async fetch(request) { UserDurableObjMethods.fetch(request) }
}


/*
// Route per controllare tutte le richieste in arrivo utilizzando dei JWT (JSON Web Token)
router.all('*', (request, env, ctx) => { 
    console.log("ciao");
});
*/

router.get('/websocket', (request, env, ctx) => Sock.fetch(request, env, ctx));

router.get('/',           (request, env, ctx) => IndexRoute.get(request, env, ctx));

router.get('/onboard',    (request, env, ctx) => OnBoardRoute.get(request, env, ctx));

router.get('/challenge',  (request, env, ctx) => ChallengeRoute.get(request, env, ctx));

router.get('/auth',       (request, env, ctx) => AuthRoute.get(request, env, ctx));

router.get('/user',       (request, env, ctx) => UserRoute.get(request, env, ctx));

router.get('/join',       (request, env, ctx) => JoinRoute.get(request, env, ctx));
router.post('/join',      (request, env, ctx) => JoinRoute.post(request, env, ctx));

router.get('/new',        (request, env, ctx) => NewRoute.get(request, env, ctx));
router.get('/new',        (request, env, ctx) => NewRoute.post(request, env, ctx));

router.get('/room',       (request, env, ctx) => RoomRoute.get(request, env, ctx));
router.post('/room',      (request, env, ctx) => RoomRoute.post(request, env, ctx));

router.get('/bugreport',  (request, env, ctx) => BugReportRoute.get(request, env, ctx));
router.post('/bugreport', (request, env, ctx) => BugReportRoute.post(request, env, ctx));

router.all('*',           (request, env, ctx) => { return new Response('Not Found', { status: 404 }); });

export default router;