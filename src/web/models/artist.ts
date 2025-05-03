

export interface Artist {
    external_urls : { spotify : string };
    href : string;
    id : string;
    name : string;
    type : string;
    uri : string;
    asObject() : object;
}

export class Artist extends Object {
    constructor(data : Artist) {
        super();
        this.external_urls = data.external_urls;
        this.href = data.href;
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.uri = data.uri;
    }

    toString() : string { 
        return `Artist(name:${this.name}, id: ${this.id})`;
    }

    asObject() : object {
        return {
            external_urls : this.external_urls,
            href : this.href,
            id : this.id,
            name : this.name,
            type : this.type,
            uri : this.uri,
        };
    }
}