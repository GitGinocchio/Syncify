import { DurableObject } from "cloudflare:workers";


export class Room extends DurableObject {
    constructor(state, env) {
        super(state, env);
        this.state = state;
        this.storage = this.state.storage;
        this.env = env;
    }

    async setRoomData(data) {
        await this.storage.put('data', data);
    }

    async getRoomData() {
        return await this.storage.get('data');
    }

    }

    async webSocketMessage(ws, message) {
        console.log(ws, message);
    }

    async webSocketClose(ws, closeEvent) {
        console.log(ws, closeEvent);
    }

    async webSocketError(ws, error) {
        console.log(ws, error);
    }
};

export class User extends DurableObject {
    constructor(state, env) {
        super(state, env);
        this.state = state;
        this.storage = this.state.storage;
        this.env = env;

        this.nextAllowedTime = 0;
    }

    async setUserData(data) {
        await this.storage.put('data', data);
    }

    async getUserData() {
        return await this.storage.get('data');
    }

    async fetch(request) {
    }

    async webSocketMessage(ws, message) {

    }

    async webSocketClose(ws, closeEvent) {
        
    }

    async webSocketError(ws, error) {

    }
};