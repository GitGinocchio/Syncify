export default {
    async get (request, env, ctx) {
        const url = new URL(request.url);

        return new Response(null, {
            headers: {
              'Set-Cookie': `user_access_token=; Max-Age=-1; room_access_token=; Max-Age=-1;`,
              Location: `/`
            },
            status: 302
        });
    }
}