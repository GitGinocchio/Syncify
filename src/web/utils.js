

export default {
    parseCookies(cookies) {
        if (!cookies) { return new Map(); }
        
        return new Map(
            Object.entries(
                cookies.split(';').reduce((dictionary, pair) => 
                ({...dictionary, [pair.split("=")[0].trim()] : pair.split("=")[1] }), {})
                // cookies + [key] = value
        ));
    }
}