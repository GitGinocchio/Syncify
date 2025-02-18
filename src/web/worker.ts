import { Router, error, json, withParams } from 'itty-router'

import IndexRoute from './routes/index/route.js';
import AuthRoute from './routes/auth/route.js';
import UserRoute from './routes/user/route.js';
import LogoutRoute from './routes/logout/route.js';
import NewRoute from './routes/new/route.js';
import JoinRoute from './routes/join/route.js';
import RoomRoute from './routes/room/route.js';
import OnBoardRoute from './routes/onboard/route.js';
import ChallengeRoute from './routes/challenge/route.js';
import BugReportRoute from './routes/bugreport/route.js';

import AllRoute from './routes/all/route.js';
import Route404 from './routes/404/route.js';
import Route403 from './routes/403/route.js';

import { User, Room } from './durables.js';
import Utils from './utils.js';
import Auth from './auth.js';

const router = Router({
    before: [Utils.redirectToNormPath],
    catch: error,
    finally: [json]
});

export { User, Room };

router
// Route per controllare tutte le richieste in arrivo utilizzando dei JWT (JSON Web Token)
.all('*', (request, env, ctx) => Auth.auth(request, env, ctx))

.get('/',               (request, env, ctx) => IndexRoute.get(request, env, ctx))
.get('/onboard',        (request, env, ctx) => OnBoardRoute.get(request, env, ctx))
.get('/challenge',      (request, env, ctx) => ChallengeRoute.get(request, env, ctx))
.get('/auth',           (request, env, ctx) => AuthRoute.get(request, env, ctx))
.get('/logout',         (request, env, ctx) => LogoutRoute.get(request, env, ctx))

.get('/user',           (request, env, ctx) => UserRoute.get(request, env, ctx))

.get('/new',            (request, env, ctx) => NewRoute.get(request, env, ctx))
.post('/new',           (request, env, ctx) => NewRoute.post(request, env, ctx))

.get('/join',           (request, env, ctx) => JoinRoute.get(request, env, ctx))
.get('/join/:roomid',   (request, env, ctx) => JoinRoute.get(request, env, ctx))
.post('/join',          (request, env, ctx) => JoinRoute.post(request, env, ctx))

.get('/room',           (request, env, ctx) => RoomRoute.get(request, env, ctx))

.get('/bugreport',      (request, env, ctx) => BugReportRoute.get(request, env, ctx))
.post('/bugreport',     (request, env, ctx) => BugReportRoute.post(request, env, ctx))

.all('/404',            (request, env, ctx) => Route404.get(request, env, ctx))
.all('/403',            (request, env, ctx) => Route403.get(request, env, ctx))

.all('*',               (request, env, ctx) => AllRoute.get(request, env, ctx))

export default router;