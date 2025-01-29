import Room from './room.html'
import mustache from 'mustache';

export default {
    onChatMessage(data, socket) {
        console.log("Message from the client: ", data.text);

        const processed_data = JSON.stringify({
            sid : null,
            type : data.type,
            sender : {
                image : "image.png",
                name : "Ginocchio",
            },
            text : data.text
        });

        socket.send(processed_data);
    },

    async get (request, env, ctx) {
        const url = new URL(request.url);

        const html = mustache.render(Room, { 
            user : { name : "John Doe", image : "/image", url : "https://example.com" }, 
            room : { queue : [], artists : [], status : "playing", devices : []},
            eq: (a, b) => { return a === b; }
        });

        return new Response(html, { headers: { 'Content-Type': 'text/html' }});
    }
}