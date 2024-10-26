
// Grab any variables you need
const react = Spicetify.React;
const reactDOM = Spicetify.ReactDOM;
const {
    URI,
    React: { useState, useEffect, useCallback },
    Platform: { History },
} = Spicetify;

function loadCSS(filename) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = filename;
    document.head.appendChild(link);
}

loadCSS("./style.css");

// The main custom app render function. The component returned is what is rendered in Spotify.
function render() {
    return react.createElement(Grid, { title: "Syncify" });
}

// Our main component
class Grid extends react.Component {
    constructor(props) {
        super(props);
        Object.assign(this, props);
    }

    render() {
        return react.createElement("div",
            { className: "grid-container" },
            react.createElement("h1", { className: "title" }, this.props.title)
        );
    }
}