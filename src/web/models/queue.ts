import { Track } from './track.js';

export interface Queue {
    toJson() : string;
    asObject() : object;
}

export class Queue extends Array<Track> {
    constructor(...items : Track[]) {
        super(...items);
    }

    toJson() {
        return JSON.stringify(this);
    }

    asObject() : object[] { 
        return this.map(track => { return track.asObject(); })
    }

    static fromObject(queueData : Track[]) {
        const queue = new Queue();

        queueData.forEach(trackData => { queue.push(new Track(trackData)) });

        return queue
    }
}