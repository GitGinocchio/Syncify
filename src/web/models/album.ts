import { Track } from './track.js';
import { Artist } from './artist.js';

export interface Album {
    album_type : string;
    artists : Artist[];
    external_urls : { spotify : string };
    href : string;
    id : string;
    images : { url : string, height : number, width : number }[];
    is_playable : boolean;
    name : string;
    release_date : string;
    release_date_precision : string;
    total_tracks : number;
    type : string;
    uri : string;
    asObject() : object;
}

export class Album extends Object {
    constructor(data : Album) {
        super();
        this.album_type = data.album_type;
        this.artists = data.artists.map(artist => new Artist(artist));
        this.external_urls = data.external_urls;
        this.href = data.href; 
        this.id = data.id;
        this.images = data.images;
        this.is_playable = data.is_playable;
        this.name = data.name;
        this.release_date = data.release_date;
        this.release_date_precision = data.release_date_precision;
        this.total_tracks = data.total_tracks;
        this.type = data.type;
        this.uri = data.uri;
    }

    toString() : string { 
        return `Album(name:${this.name}, id: ${this.id})`;
    }

    asObject() : object {
        return {
            album_type : this.album_type,
            artists : this.artists.map((artist) => { return artist.asObject(); }),
            external_urls : this.external_urls,
            href : this.href,
            id : this.id,
            images : this.images,
            is_playable : this.is_playable,
            name : this.name,
            release_date : this.release_date,
            release_date_precision : this.release_date_precision,
            total_tracks : this.total_tracks,
            type : this.type,
            uri : this.uri
        };
    }
}