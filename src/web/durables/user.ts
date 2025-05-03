import { DurableObject } from "cloudflare:workers";
import { Room } from './room.js';

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
    external_urls : { spotify : string };
    explicit_content : object;
    images : Array<{ url : string, height : string, width : string }>,
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
    sendMessageToFirstAvailableDevice(message : string) : void;
}



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
        await this.storage.put('initialized', true);
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

    async hasInitialized() { return await this.storage.get('initialized') === true; }

    async awake() {
        console.log(`Waking up user durable object with id: ${this.id}`)
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

        if (await this.hasInitialized()) {
            const response = JSON.stringify({
                status: 'success',
                message : 'successfully logged in'
            });

            ws.send(response);
            return;
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
            status: 'finalize',
            message : 'finalize login',
            id : this.id.toString()
        });

        ws.send(response);
    }

    async onSearchResults(ws : WebSocket, data : any) {
        // @ts-ignore
        const roomid = await this.env.rooms.idFromString(data.roomid);
        // @ts-ignore
        const room : Room = await this.env.rooms.get(roomid);
        // console.log(data);

        await room.showSearchResultsToUser(data);
    }

    async webSocketMessage(ws : WebSocket, message : string) {
        const data : Map<string, any> = JSON.parse(message);

        // @ts-ignore
        switch (data.type) {
            case 'auth':
                await this.onAuthRequest(ws, data);
                break;
            case 'search-results':
                await this.onSearchResults(ws, data);
                break;
            default:
                console.log(`Invalid Spotify Websocket message received from user ${this.display_name}(id: ${this.spotifyid})`);
        }
    }

    sendMessageToFirstAvailableDevice(message : string) {
        if (this.devices.size == 0) { console.error('No devices connected to user ' + this.display_name); }

        for (const [deviceid, ws] of this.devices.entries()) {
            try {
                ws.send(message);
                break;
            } catch (error) {
                console.error("Error sending WebSocket message to device " + deviceid + ": ", error);
                continue;
            }
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

