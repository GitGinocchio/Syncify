export default {
    async get (request : Request, env, ctx) {
        const url = new URL(request.url);

        return new Response(null, {
            headers: {
                'Set-Cookie': [
                    'user_access_token=; Path=/; Max-Age=0; Secure; HttpOnly;',
                    'room_access_token=; Path=/; Max-Age=0; Secure; HttpOnly;'
                ].join(' '),
              Location: `/`
            },
            status: 302
        });
    }
}