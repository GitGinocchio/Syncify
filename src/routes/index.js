const fs = require('fs')

export default {
    async post (request, env, ctx) {

    },

    async get (request, env, ctx) {
        const url = new URL(request.url);

        /*
        const file_path = new URL("login.html", url).toString();
        console.log(file_path);
        await env.ASSETS.fetch(file_path).then((response) => {
            console.log(response);
            const fileContent = response.body.toString();

            return new Response(fileContent, {
                headers: { 'Content-Type': 'text/html' }
              });
            //console.log(fileContent);
            //return new Response(fileContent, {
                //headers: { 'Content-Type': 'text/html' }
              //});
        });
        */

        return new Response("index");
    }
}