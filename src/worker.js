import { AutoRouter } from 'itty-router';

import Index from './routes/index.js';
import User from './routes/user.js';
import Room from './routes/room.js';
import BugReport from './routes/bugreport.js';

const router = AutoRouter()

router.get('/',     (request, env, ctx) => Index.get(request, env, ctx));
router.post('/',     (request, env, ctx) => Index.post(request, env, ctx));

router.get('/user', (request, env, ctx) => User.get(request, env, ctx));
router.get('/room', (request, env, ctx) => Room.get(request, env, ctx));
router.get('/bugreport', (request, env, ctx) => BugReport.get(request, env, ctx))


router.all('*', (request, env, ctx) => { 
    return new Response('Not Found', { status: 404 })
});

export default router