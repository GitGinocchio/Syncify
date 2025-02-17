import { DurableObject } from "cloudflare:workers";

export interface Room {
    storage : DurableObjectStorage;
    clients : Map<WebSocket, any>;
    id : DurableObjectId;
    awakaned : boolean;

    name : string;
    max_members : number;
    queue_editable : boolean;
    public : boolean;

    init(name : string, max_members : number, queue_editable : boolean, ispublic : boolean) : Promise<void>;
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
            this.clients.set(ws, {...ws.deserializeAttachment()});
        })
    }

    async init(name : string, max_members : number, queue_editable : boolean, ispublic : boolean) {
        // @ts-ignore
        let rooms = await this.env.kv.get("rooms");

        if (rooms != null) {
            rooms = JSON.parse(rooms);
            rooms[this.ctx.id.toString()] = null;
        } else {
            rooms = { [this.ctx.id.toString()]: null };
        }
        // @ts-ignore
        await this.env.kv.put("rooms", JSON.stringify(rooms));

        await this.storage.put('name', name);
        await this.storage.put('max_members', max_members);
        await this.storage.put('queue_editable', queue_editable);
        await this.storage.put('public', ispublic);
    }

    async awake() {
        this.awakaned = true;

        this.name = String(await this.storage.get('name'));
        this.max_members = Number(await this.storage.get('max_members'));
        this.queue_editable = Boolean(await this.storage.get('queue_editable'));
        this.public = Boolean(await this.storage.get('public'));
    }

    async getData() {
        if (!this.awakaned) { await this.awake(); }

        return {
            id : this.id, 
            name : this.name, 
            max_members : this.max_members, 
            queue_editable : this.queue_editable, 
            public : this.public
        };
    }

    async fetch(request : Request) {
        const [client, server] = Object.values(new WebSocketPair());
        this.ctx.acceptWebSocket(server);

        //server.serializeAttachment({...server.deserializeAttachment(), user: user});

        this.clients.set(server, {});

        return new Response(null, { status : 101, webSocket : client});
    }

    async webSocketMessage(ws : WebSocket, message : string) {
        const data = JSON.parse(message);
        console.log(data);
    }

    async broadcastWebSocketMessage(sender : WebSocket, message : string) {

    }

    async webSocketClose(ws : WebSocket, code : number, reason : string, wasClean : boolean) {

    }

    async webSocketError(ws : WebSocket, error : any) {

    }
};

export interface User {
    storage : DurableObjectStorage;
    env : DurableObjectNamespace;
    id : DurableObjectId;
    awakaned : boolean;

    spotifyid : string;
    display_name : string;
    nextAllowedTime : number;
    birthdate : string;
    email : string;
    platform : object;
    locale : string;
    external_urls : Map<string, any>;
    explicit_content : object;
    images : Array<Map<string, any>>,
    policies : Map<string, any>,
    product : string,
    followers : object;
    country : string;
    type : string;
    uri : string;

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

export class User extends DurableObject {
    constructor(ctx : DurableObjectState, env : DurableObjectNamespace) {
        super(ctx, env);
        this.ctx = ctx;
        this.storage = this.ctx.storage;
        this.env = env;
        this.id = ctx.id;
        this.awakaned = false;
    }

    async init(spotifyid : string, display_name : string, birthdate : string, email : string, platform : object,locale : string, external_urls : object, explicit_content : object, images : Array<object>,policies : Map<string, any>,product : string,followers : object, country : string, type : string, uri : string) {
        await this.storage.put('spotifyid', spotifyid);
        await this.storage.put('display_name', display_name);
        await this.storage.put('next_allowed_time', 0);
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
    
        this.spotifyid = String(await this.storage.get('spotifyid'));
        this.display_name = String(await this.storage.get('display_name'));
        this.nextAllowedTime = Number(await this.storage.get('next_allowed_time'));
        this.birthdate = String(await this.storage.get('birthdate'));
        this.email = String(await this.storage.get('email'));
        this.platform = Object(await this.storage.get('platform'));
        this.locale = String(await this.storage.get('locale'));
        this.external_urls = Object(await this.storage.get('external_urls'));
        this.explicit_content = Object(await this.storage.get('explicit_content'));
        this.images = Object(await this.storage.get('images'));
        this.policies = Object(await this.storage.get('policies'));
        this.product = String(await this.storage.get('product'));
        this.followers = Object(await this.storage.get('followers'));
        this.country = String(await this.storage.get('country'));
        this.type = String(await this.storage.get('type'));
        this.uri = String(await this.storage.get('uri'));
    }

    async getData() {
        if (!this.awakaned) { await this.awake(); }

        return {
            id : this.id,
            spotifyid : this.spotifyid,
            display_name : this.display_name,
            next_allowed_time : this.nextAllowedTime,
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

    async fetch(request : Request) {
        const [client, server] = Object.values(new WebSocketPair());
        this.ctx.acceptWebSocket(server);

        return new Response(null, { status : 101, webSocket : client});
    }

};