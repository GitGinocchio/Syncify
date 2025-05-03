import { Artist } from './artist.js';
import { Album } from './album.js';

export interface Track {
    artists : Artist[];
    album : Album;
    disc_number : number;
    duration_ms : number;
    duration_string : string;
    explicit : boolean;
    external_ids : { isrc : string };
    href : string; 
    id : string;
    is_local : boolean;
    is_playable : boolean;
    name : string;
    popularity : number;
    preview_url : string;
    track_number : number;
    type : string;
    uri : string;
    addedby : { url : string, image : string, name : string };
    asObject() : object;
}

export class Track {
    constructor(data : Track, addedby? : { url : string, image : string, name : string }) {
        this.artists = data.artists.map(artist => new Artist(artist));
        this.album = new Album(data.album);
        this.disc_number = data.disc_number;
        this.duration_ms = data.duration_ms;
        this.duration_string = Track.formatDuration(this.duration_ms);
        this.explicit = data.explicit;
        this.external_ids = data.external_ids;
        this.href = data.href; 
        this.id = data.id;
        this.is_local = data.is_local;
        this.is_playable = data.is_playable;
        this.name = data.name;
        this.popularity = data.popularity;
        this.preview_url = data.preview_url;
        this.track_number = data.track_number;
        this.type = data.type;
        this.uri = data.uri;
        this.addedby = addedby ? addedby : data.addedby;
    }

    toString() : string { 
        return `Track(name:${this.name}, id: ${this.id})`;
    }

    asObject() : object {
        return {
            artists : this.artists.map((artist) => artist.asObject()),
            album : this.album.asObject(),
            disc_number : this.disc_number,
            duration_ms : this.duration_ms,
            duration_string : this.duration_string,
            explicit : this.explicit,
            external_ids : this.external_ids,
            href : this.href,
            id : this.id,
            is_local : this.is_local,
            is_playable : this.is_playable,
            name : this.name,
            popularity : this.popularity,
            preview_url : this.preview_url,
            track_number : this.track_number,
            type : this.type,
            uri : this.uri,
            addedby : this.addedby
        }
    }

    static formatDuration(ms : number) : string {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        
        let formattedDuration = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
        return hours > 0 ? `${String(hours).padStart(2, '0')}:${formattedDuration}` : formattedDuration;
    }
}