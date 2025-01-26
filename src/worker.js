import { AutoRouter } from 'itty-router';

import Index from './routes/index/route.js';
import User from './routes/user/route.js';
import New from './routes/new/route.js';
import Join from './routes/join/route.js';
import Room from './routes/room/route.js';
import OnBoard from './routes/onboard/route.js';
import Challenge from './routes/challenge/route.js';
import BugReport from './routes/bugreport/route.js';

import Auth from './auth.js';
import Sock from './sock.js'

const router = AutoRouter();

// Route per controllare tutte le richieste in arrivo utilizzando dei JWT (JSON Web Token)
router.all('*', (request, env, ctx) => Auth.auth(request, env, ctx));

router.get('/socket.io', (request, env, ctx) => Sock.handle(request, env, ctx));

router.get('/',     (request, env, ctx) => Index.get(request, env, ctx));
router.post('/',     (request, env, ctx) => Index.post(request, env, ctx));

router.get('/onboard', (request, env, ctx) => OnBoard.get(request, env, ctx));

router.get('/challenge', (request, env, ctx) => Challenge.get(request, env, ctx));

router.get('/user', (request, env, ctx) => User.get(request, env, ctx));

router.get('/join', (request, env, ctx) => Join.get(request, env, ctx));
router.post('/join', (request, env, ctx) => Join.post(request, env, ctx));

router.get('/new', (request, env, ctx) => New.get(request, env, ctx));
router.get('/new', (request, env, ctx) => New.post(request, env, ctx));

router.get('/room', (request, env, ctx) => Room.get(request, env, ctx));
router.post('/room', (request, env, ctx) => Room.post(request, env, ctx));

router.get('/bugreport', (request, env, ctx) => BugReport.get(request, env, ctx));
router.post('/bugreport', (request, env, ctx) => BugReport.post(request, env, ctx));

router.all('*', (request, env, ctx) => { 
    return new Response('Not Found', { status: 404 });
});

export default router