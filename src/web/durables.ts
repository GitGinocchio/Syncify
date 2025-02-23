import { DurableObject } from "cloudflare:workers";

import Auth from './auth.js';
import Utils from './utils.js';

export interface Room {
    storage : DurableObjectStorage;
    clients : Map<string, WebSocket>;
    env : DurableObjectNamespace;
    id : DurableObjectId;
    awakaned : boolean;

    messages : Array<{ sender : { id : string, name : string, image : string, type : string}, message : string, type : string }>;
    members : Map<string, { id : string | undefined, name : string | undefined, image : string | undefined}>;
    queue : Array<object>;
    artists : Array<object>;

    owner : any;
    name : string | undefined;
    max_members : number;
    editable_queue : boolean;
    public : boolean;

    init(name : string, max_members : number, editable_queue : boolean, ispublic : boolean, owner: object) : Promise<void>;
    awake() : Promise<void>;
    getData() : Promise<object | null>;
}

export interface User {
    storage : DurableObjectStorage;
    env : DurableObjectNamespace;
    id : DurableObjectId;
    awakaned : boolean;
    
    devices : Map<string, WebSocket>;


    spotifyid : string | undefined;
    display_name : string | undefined;
    nextAllowedTime : number;
    birthdate : string | undefined;
    email : string | undefined;
    platform : object;
    locale : string | undefined;
    external_urls : Map<string, any>;
    explicit_content : object;
    images : Array<Map<string, any>>,
    policies : Map<string, any>,
    product : string | undefined,
    followers : object;
    country : string | undefined;
    type : string | undefined;
    uri : string | undefined;

    init(
        spotifyid : string,
        display_name : string,
        birthdate : string,
        email : string,
        platform : object,
        locale : string,
        external_urls : object,
        explicit_content : object,
        images : Array<Map<string, any>>,
        policies : Map<string, any>,
        product : string,
        followers : object,
        country : string,
        type : string,
        uri : string
    ) : Promise<void>;
    awake() : Promise<void>;
    getData() : Promise<object | null>;
}

export class Room extends DurableObject {
    constructor(ctx : DurableObjectState, env : DurableObjectNamespace) {
        super(ctx, env);
        this.ctx = ctx;
        this.storage = this.ctx.storage;
        this.env = env;
        this.awakaned = false;
        this.id = this.ctx.id;

        this.clients = new Map();
        this.ctx.getWebSockets().forEach((ws) => {
            const attachments = ws.deserializeAttachment();
            this.clients.set(attachments.userid, ws);
        })
    }

    async init(name : string, max_members : number, editable_queue : boolean, ispublic : boolean, owner : object) {
        // @ts-ignore
        let rooms = await this.env.kv.get("rooms");

        console.log("rooms: ", rooms);

        if (rooms != null || rooms != "") {
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
    }

    async awake() {
        this.awakaned = true;

        this.name = await this.storage.get('name');
        this.max_members = Number(await this.storage.get('max_members'));
        this.editable_queue = Boolean(await this.storage.get('editable_queue'));
        this.public = Boolean(await this.storage.get('public'));
        this.owner = await this.storage.get('owner');
        
        this.messages = await this.storage.get('messages') || Array();
        this.artists = await this.storage.get('artists') || Array();
        this.members = new Map(await this.storage.get('members') || []);
        this.queue = await this.storage.get('queue') || Array();
    }

    async getData() {
        if (!this.awakaned) { await this.awake(); }

        return {
            id : this.id.toString(), 
            name : this.name, 
            max_members : this.max_members,
            editable_queue : this.editable_queue, 
            public : this.public,
            owner : this.owner,
            messages : this.messages,
            artists : this.artists,
            members : this.members,
            queue : this.queue
        };
    }

    async fetch(request : Request) {
        const [client, server] = Object.values(new WebSocketPair());
        this.ctx.acceptWebSocket(server);

        const cookies = Utils.parseCookies(request.headers.get('Cookie'));
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
        const user = await this.env.users.get(userid);
        const user_data = await user.getData();

        console.log(user_data);
    }


    async webSocketMessage(ws : WebSocket, message : string) {
        const data : Map<string, any> = JSON.parse(message);

        const cooldown = await this.checkCooldown(ws, true);

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
            case 'search_song':
                await this.onSearchSong(ws, data);
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

export class User extends DurableObject {
    constructor(ctx : DurableObjectState, env : DurableObjectNamespace) {
        super(ctx, env);
        this.ctx = ctx;
        this.storage = this.ctx.storage;
        this.env = env;
        this.id = ctx.id;
        this.awakaned = false;
        this.nextAllowedTime = 0;

        this.devices = new Map();
        this.ctx.getWebSockets().forEach((ws) => {
            const attachments = ws.deserializeAttachment();
            this.devices.set(attachments.deviceid, ws);
        });
    }

    async init(spotifyid : string, display_name : string, birthdate : string, email : string, platform : object,locale : string, external_urls : object, explicit_content : object, images : Array<object>,policies : Map<string, any>,product : string,followers : object, country : string, type : string, uri : string) {
        await this.storage.put('spotifyid', spotifyid);
        await this.storage.put('display_name', display_name);
        await this.storage.put('birthdate', birthdate);
        await this.storage.put('email', email);
        await this.storage.put('platform', platform);
        await this.storage.put('locale', locale);
        await this.storage.put('external_urls', external_urls);
        await this.storage.put('explicit_content', explicit_content);
        await this.storage.put('images', images);
        await this.storage.put('policies', policies);
        await this.storage.put('product', product);
        await this.storage.put('followers', followers);
        await this.storage.put('country', country);
        await this.storage.put('type', type);
        await this.storage.put('uri', uri);
    }

    async awake() {
        this.awakaned = true;
    
        this.spotifyid = await this.storage.get('spotifyid');
        this.display_name = await this.storage.get('display_name');
        this.birthdate = await this.storage.get('birthdate');
        this.email = await this.storage.get('email');
        this.platform = Object(await this.storage.get('platform'));
        this.locale = await this.storage.get('locale');
        this.external_urls = Object(await this.storage.get('external_urls'));
        this.explicit_content = Object(await this.storage.get('explicit_content'));
        this.images = Object(await this.storage.get('images'));
        this.policies = Object(await this.storage.get('policies'));
        this.product = await this.storage.get('product');
        this.followers = Object(await this.storage.get('followers'));
        this.country = await this.storage.get('country');
        this.type = await this.storage.get('type');
        this.uri = await this.storage.get('uri');
    }

    async getData() {
        if (!this.awakaned) { await this.awake(); }

        return {
            id : this.id.toString(),
            spotifyid : this.spotifyid,
            display_name : this.display_name,
            birthdate : this.birthdate,
            email : this.email,
            platform : this.platform,
            locale : this.locale,
            external_urls : this.external_urls,
            explicit_content : this.explicit_content,
            images : this.images,
            policies : this.policies,
            product : this.product,
            followers : this.followers,
            country : this.country,
            type : this.type,
            uri : this.uri
        };
    }

    checkCooldown(actionPerformed : boolean = false) {
        let now = Date.now() / 1000;

        this.nextAllowedTime = Math.max(now, this.nextAllowedTime);

        if (actionPerformed) {
            this.nextAllowedTime += 5;
        }

        return Math.max(0, this.nextAllowedTime - now - 20);
    }

    async fetch(request : Request) {
        const [client, server] = Object.values(new WebSocketPair());
        this.ctx.acceptWebSocket(server);

        return new Response(null, { status : 101, webSocket : client});
    }

    async onAuthRequest(ws : WebSocket, data : any) {
        const attachments = ws.deserializeAttachment();
        // @ts-ignore
        const deviceid = data.platform.event_sender_context_information.device_id;

        if (!attachments || !attachments.deviceid || !this.devices.has(attachments.deviceid)) {
            ws.serializeAttachment({ ...attachments, deviceid: deviceid });
            this.devices.set(deviceid, ws);
        }

        await this.init(
            data.user.id,
            data.user.display_name,
            data.user.birthdate,
            data.user.email,
            data.platform,
            data.locale,
            data.user.external_urls,
            data.user.explicit_content,
            data.user.images,
            data.user.policies,
            data.user.product,
            data.user.followers,
            data.user.country,
            data.user.type,
            data.user.uri
        );

        const response = JSON.stringify({
            status: 'success',
            message : 'successfully logged in',
            id : this.id.toString()
        });

        ws.send(response);
    }

    async webSocketMessage(ws : WebSocket, message : string) {
        const data : Map<string, any> = JSON.parse(message);

        // @ts-ignore
        switch (data.type) {
            case 'auth':
                await this.onAuthRequest(ws, data);
                break;
            default:
                console.log(`Invalid Spotify Websocket message received from user ${this.display_name}(id: ${this.spotifyid})`);
        }
    }

    broadcast(sender : WebSocket | null, message : string) {
        for (let [deviceid, ws] of this.devices) {
            if (sender != null && ws === sender) { continue; }

            ws.send(message);
        }
    }

    async webSocketClose(ws : WebSocket, code : number, reason : string, wasClean : boolean) {
        console.log(`Spotify Websocket of user ${this.display_name}(id: ${this.spotifyid}) closed with code ${code} and reason ${reason}`);
        ws.close(1000, "Spotify Websocket closed");
    }
    
    async webSocketError(ws : WebSocket, error : any) {
        console.log(`Spotify Websocket of user ${this.display_name}(id: ${this.spotifyid}) raised an error: ${error}`);
    }
};