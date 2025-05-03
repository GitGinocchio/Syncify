import { DurableObject } from "cloudflare:workers";
import { User } from './user.js';
import { Track } from '../models/track.js';
import { Queue } from '../models/queue.js';
import Auth from '../auth.js';
import { parseCookies } from '../utils.js';



export interface Room {
    storage : DurableObjectStorage;
    clients : Map<string, WebSocket>;
    env : DurableObjectNamespace;
    id : DurableObjectId;
    awakaned : boolean;

    messages : Array<{ sender : { id : string, name : string, image : string, type : string}, message : string, type : string }>;
    members : Map<string, { id : string | undefined, name : string | undefined, image : string | undefined}>;
    queue : Queue;
    history : Queue;

    owner : any;
    name : string | undefined;
    max_members : number;
    editable_queue : boolean;
    public : boolean;

    init(name : string, max_members : number, editable_queue : boolean, ispublic : boolean, owner: object) : Promise<void>;
    awake() : Promise<void>;
    getData() : Promise<object | null>;
    showSearchResultsToUser(data : any): Promise<void>;
}

export class Room extends DurableObject {
    constructor(ctx : DurableObjectState, env : DurableObjectNamespace) {
        super(ctx, env);
        this.ctx = ctx;
        this.storage = this.ctx.storage;
        this.env = env;
        this.awakaned = false;
        this.id = this.ctx.id;

        this.queue = new Queue();
        this.history = new Queue();
        this.clients = new Map();
        this.ctx.getWebSockets().forEach((ws) => {
            const attachments = ws.deserializeAttachment();
            this.clients.set(attachments.userid, ws);
        })
    }

    async init(name : string, max_members : number, editable_queue : boolean, ispublic : boolean, owner : object) {
        // @ts-ignore
        let rooms = await this.env.kv.get("rooms");

        if (rooms != null) {
            rooms = JSON.parse(rooms);
        } else {
            rooms = [];
        }

        rooms.push(this.ctx.id.toString());
        // @ts-ignore
        await this.env.kv.put("rooms", JSON.stringify(rooms));

        await this.storage.put('name', name);
        await this.storage.put('max_members', max_members);
        await this.storage.put('editable_queue', editable_queue);
        await this.storage.put('public', ispublic);
        await this.storage.put('owner' , owner);
        await this.storage.put('queue', this.queue);
        await this.storage.put('history', this.history);
    }

    async awake() {
        console.log(`Waking up room durable object with id: ${this.id}`)
        this.awakaned = true;

        this.name = String(await this.storage.get('name'));
        this.max_members = Number(await this.storage.get('max_members'));
        this.editable_queue = Boolean(await this.storage.get('editable_queue'));
        this.public = Boolean(await this.storage.get('public'));
        this.owner = await this.storage.get('owner');

        const raw_queue : Track[] | undefined = await this.storage.get('queue');
        const raw_history : Track[] | undefined = await this.storage.get('history');
        
        this.messages = await this.storage.get('messages') || new Array();
        this.members = new Map(await this.storage.get('members') || new Array());
        this.queue = raw_queue !== undefined ? Queue.fromObject(raw_queue) : new Queue();
        this.history = raw_history !== undefined ? Queue.fromObject(raw_history) : new Queue();
    }

    async getData() {
        if (!this.awakaned) { await this.awake(); }

        // @ts-ignore
        //console.log("artist:", this.queue.asObject()[0].album.images[0]);

        return {
            id : this.id.toString(), 
            name : this.name, 
            max_members : this.max_members,
            editable_queue : this.editable_queue, 
            public : this.public,
            owner : this.owner,
            messages : this.messages,
            members : this.members,
            queue : this.queue.asObject(),
            history : this.history.asObject()
        };
    }

    async fetch(request : Request) {
        const [client, server] = Object.values(new WebSocketPair());
        this.ctx.acceptWebSocket(server);

        const cookies = parseCookies(request.headers.get('Cookie'));
        const token = cookies.get('user_access_token');

        // @ts-ignore
        const payload = await Auth.verifyToken(token, this.env.JWT_SECRET_KEY);

        if (!payload) {
            console.log("Token verification failed");
            return Response.error();
        }

        // @ts-ignore
        const userid = await this.env.users.idFromString(payload.id);
        // @ts-ignore
        const user : User = await this.env.users.get(userid);
        const user_data = await user.getData();

        const current_client = this.clients.get(payload.id);

        const attachments = {...server.deserializeAttachment(), userid: payload.id };
    
        if (current_client) {
            attachments['nextAllowedTime'] = current_client.deserializeAttachment().nextAllowedTime;
            current_client.close(1000, "User already connected");
        }
        else {
            attachments['nextAllowedTime'] = 0;
        }

        server.serializeAttachment(attachments);

        this.clients.set(payload.id, server);

        // @ts-ignore
        const member = { id : user_data.spotifyid, name : user_data.display_name, image : user_data.images[0].url }

        this.members.set(payload.id, member);
        this.broadcast(null, JSON.stringify({ type : 'member-joined', ...member }));

        await this.storage.put('members', this.members);

        return new Response(null, { status : 101, webSocket : client});
    }

    async checkCooldown(ws : WebSocket, actionPerformed : boolean = false) {
        let now = Date.now() / 1000;

        const attachments = ws.deserializeAttachment();

        attachments.nextAllowedTime = Math.max(now, attachments.nextAllowedTime);

        if (actionPerformed) {
            attachments.nextAllowedTime += 5;
        }

        ws.serializeAttachment(attachments);

        return Math.max(0, attachments.nextAllowedTime - now - 20);
    }

    async onChatMessageReceived(ws : WebSocket, data : Map<string, any>) {
        if (!this.awakaned) { await this.awake(); } // Ensure the data is loaded
        const attachments = ws.deserializeAttachment();

        // @ts-ignore
        const userid = this.env.users.idFromString(attachments.userid);

        // @ts-ignore
        const user = await this.env.users.get(userid);
        const user_data = await user.getData();

        const message = {
            sender : {
                id : user_data.spotifyid,
                name : user_data.display_name,
                image : user_data.images[0].url,
                type : 'user'
            },
            // @ts-ignore
            message : data.text,
            // @ts-ignore
            type : data.type
        }

        this.messages.push(message);

        await this.storage.put('messages', this.messages);

        this.broadcast(ws, JSON.stringify(message));

        // Send a different response to the user who sent the message
        const messagecopy = JSON.parse(JSON.stringify(message));
        messagecopy.sender.type = 'me';
        ws.send(JSON.stringify(messagecopy));
    }

    async onSearchSong(ws : WebSocket, data : Map<string, any>) {
        const attachments = ws.deserializeAttachment();

        // @ts-ignore
        const userid = this.env.users.idFromString(attachments.userid);

        // @ts-ignore
        const user : User = await this.env.users.get(userid);

        user.sendMessageToFirstAvailableDevice(JSON.stringify({...data, roomid : this.id.toString(), userid : attachments.userid }));
    }

    async onAddSong(ws : WebSocket, data : Map<string, any>) {
        if (!this.awakaned) { await this.awake(); } // Ensure the data is loaded

        const attachments = ws.deserializeAttachment();

        // @ts-ignore
        const userid = this.env.users.idFromString(attachments.userid);

        // @ts-ignore
        const user : User = await this.env.users.get(userid);

        const user_data = await user.getData();

        // @ts-ignore
        const trackdata = JSON.parse(data.song);

        const track = new Track(
            trackdata, 
            { url : user_data.external_urls.spotify, name : user_data.display_name as string, image : user_data.images[0].url }
        );

        this.queue.push(track);

        await this.storage.put("queue", this.queue.asObject());

        const message = { type : 'add-song', song : track.asObject(), container : "queue", index : -1 }
        this.broadcast(null, JSON.stringify(message));
    }

    async showSearchResultsToUser(data : Map<string, any>) {
        // @ts-ignore
        const ws = this.clients.get(data.userid);

        const message = {
            type : 'search-results',
            // @ts-ignore
            results : data.results
        }

        ws?.send(JSON.stringify(message));
    }

    async webSocketMessage(ws : WebSocket, message : string) {
        const data : Map<string, any> = JSON.parse(message);

        let actionPerformed = true;

        // @ts-ignore
        if (data.type !== 'message') {
            actionPerformed = false;
        }

        const cooldown = await this.checkCooldown(ws, actionPerformed);

        if (cooldown > 0.0) {
            const data = {
                type : 'rate-limit-reached',
                cooldown : cooldown
            }
            ws.send(JSON.stringify(data));
            return;
        }

        // @ts-ignore
        switch (data.type) {
            case 'message':
                await this.onChatMessageReceived(ws, data);
                break;
            case 'search-song':
                await this.onSearchSong(ws, data);
                break;
            case 'add-song':
                await this.onAddSong(ws, data);
                break;
            default:
                // @ts-ignore
                console.log(`Invalid Room Websocket message type received in room ${this.name}(id: ${this.id}): ${data.type}`);
        }
    }

    broadcast(sender : WebSocket | null, message : string) {
        for (let [userid, ws] of this.clients) {
            if (sender != null && ws === sender) { continue; }

            ws.send(message);
        }
    }

    async webSocketClose(ws : WebSocket, code : number, reason : string, wasClean : boolean) {
        if (!this.awakaned) { await this.awake(); } // Ensure the data is loaded
        const attachments = ws.deserializeAttachment();

        if (attachments.userid == this.owner.id) {
            // @ts-ignore
            let rooms = await this.env.kv.get("rooms");

            if (rooms == null) {
                console.log("An error occurred: rooms should not be null");
                return;
            }

            rooms = JSON.parse(rooms);
            rooms = rooms.filter((roomid : string) => roomid !== this.id.toString());

            // Qui dovremmo inviare un segnale a tutti gli utenti che il proprietario ha lasciato la stanza
            // e che la stanza è stata chiusa e i membri devono essere disconnessi

            // @ts-ignore
            await this.env.kv.put("rooms", JSON.stringify(rooms));

            return;
        }

        this.members.delete(attachments.userid);

        // @ts-ignore
        const userid = await this.env.users.idFromString(attachments.userid);
        // @ts-ignore
        const user : User = await this.env.users.get(userid);
        const user_data = await user.getData();

        this.broadcast(ws, JSON.stringify({ id : user_data.spotifyid, type : "member-left" }));
        
        ws.close(1000, "User left the room");
        this.clients.delete(attachments.userid);

        await this.storage.put('members', this.members);
        await this.storage.put('clients', this.clients);

        console.log(`Room Websocket closed (code: ${code}, clean: ${wasClean}, reason: User left the room):\n\tUser: ${user_data.display_name} (id: ${user_data.id})\n\tRoom: ${this.name} (id: ${this.id})`);
    }

    async webSocketError(ws : WebSocket, error : any) {
        console.log(`One user Websocket of room ${this.name}(id: ${this.id}) raised an error: ${error}`);
    }
};