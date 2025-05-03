export function parseCookies(cookies) {
    if (!cookies) { return new Map(); }
    
    return new Map(
        Object.entries(
            cookies.split(';').reduce((dictionary, pair) => 
            ({...dictionary, [pair.split("=")[0].trim()] : pair.split("=")[1] }), {})
            // cookies + [key] = value
    ));
}

export function parseParams(raw) {
    return raw.split('&').reduce((acc, pair) => ({ ...acc, [pair.split('=')[0]]: pair.split('=')[1] }), {});
}

export function redirectToNormPath(request : Request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/') && url.pathname !== '/') {
        url.pathname = url.pathname.replace(/\/+$/, '');
        return Response.redirect(url);
    }
}
