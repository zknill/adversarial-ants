"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePlayerJoin = void 0;
const player_1 = require("./player");
const gameState = {
    viewSize: 5,
    players: new Map([
        ["seed1", { id: "seed1", score: 0, location: [4, 5], commands: [], dead: false, icon: 'x', sendState: () => { } }],
        ["seed2", { id: "seed2", score: 0, location: [6, 5], commands: [], dead: false, icon: 'x', sendState: () => { } }],
        ["seed3", { id: "seed3", score: 0, location: [5, 4], commands: [], dead: false, icon: 'x', sendState: () => { } }],
        ["seed4", { id: "seed4", score: 0, location: [5, 6], commands: [], dead: false, icon: 'x', sendState: () => { } }],
    ]),
    food: new Map(),
};
setInterval(seedFood, 1000);
function seedFood() {
    const players = [];
    for (const p of gameState.players.values()) {
        players.push(p);
    }
    if (players.length === 0) {
        return;
    }
    const i = Math.floor(Math.random() * players.length);
    const player = players[i];
    const p = generateRandomCoordinateAround(player.location[0], player.location[1], 2);
    if (playerLocations().has(key(p))) {
        // can't seed food onto player
        return;
    }
    gameState.food.set(key(p), true);
}
function playerLocations() {
    let out = new Map();
    for (const p of gameState.players.values()) {
        out.set(key(p.location), p);
    }
    return out;
}
function generateRandomCoordinateAround(x, y, radius) {
    const xOffset = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    const yOffset = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    const newX = x + xOffset;
    const newY = y + yOffset;
    return [newX, newY];
}
function sendPlayerState(ch, g, id) {
    const p = g.players.get(id);
    if (p === undefined) {
        console.log("cant find player: ", id);
        return;
    }
    const rows = playerStateRows(g, p);
    const out = {
        rows: rows,
        score: p.score
    };
    ch
        .publish("state", JSON.stringify(out))
        .catch((err) => console.error("send player state", err));
}
function playerStateRows(g, p) {
    const offset = Math.floor(g.viewSize / 2);
    const lowX = p.location[0] - offset;
    const highX = p.location[0] + offset;
    const lowY = p.location[1] - offset;
    const highY = p.location[1] + offset;
    const rows = [];
    const pLocs = playerLocations();
    for (let col = lowX; col <= highX; col++) {
        let rowBuffer = "";
        for (let row = lowY; row <= highY; row++) {
            if ((0, player_1.equalPoints)(p.location, [col, row])) {
                rowBuffer += p.icon;
                continue;
            }
            const opponent = pLocs.get(key([col, row]));
            if (opponent !== undefined) {
                if (opponent.dead) {
                    rowBuffer += 'd';
                }
                else {
                    rowBuffer += 'x';
                }
                continue;
            }
            if (g.food.get(key([col, row]))) {
                rowBuffer += "f";
                continue;
            }
            rowBuffer += "o";
        }
        rows.push(rowBuffer);
    }
    return rows;
}
function processPlayerAction(g, id) {
    const p = g.players.get(id);
    if (p === undefined) {
        console.log("cant find player: ", id);
        return;
    }
    if (p.dead) {
        p.sendState();
        return;
    }
    if (p.commands.length === 0) {
        return;
    }
    const c = p.commands.shift();
    if (c === undefined) {
        return;
    }
    let loc = [...p.location];
    const old = [...p.location];
    const parts = c.split(' ');
    const action = parts[0];
    const direction = parts[1].toLowerCase();
    switch (action) {
        case "ATK":
            switch (direction) {
                case "n":
                    loc[0] -= 1;
                    break;
                case "e":
                    loc[1] += 1;
                    break;
                case "s":
                    loc[0] += 1;
                    break;
                case "w":
                    loc[1] -= 1;
                    break;
            }
            p.icon = direction;
            const opponent = playerLocations().get(key(loc));
            if (opponent !== undefined && !opponent.dead && p.id !== opponent.id) {
                opponent.dead = true;
                opponent.icon = 'd';
                p.score += 1;
                p.icon = 'p';
                p.location = loc;
                console.log("successful attack");
            }
            break;
        case "MOV":
            loc = [...p.location];
            switch (direction) {
                case "n":
                    loc[0] -= 1;
                    break;
                case "e":
                    loc[1] += 1;
                    break;
                case "s":
                    loc[0] += 1;
                    break;
                case "w":
                    loc[1] -= 1;
                    break;
            }
            p.icon = direction;
            // moves into spaces taken by other players not allowed
            // unless that player is dead
            const otherPlayer = playerLocations().get(key(loc));
            if (otherPlayer === undefined || otherPlayer.dead) {
                p.location = loc;
            }
            break;
        case "EAT":
            switch (direction) {
                case "n":
                    p.location[0] -= 1;
                    break;
                case "e":
                    p.location[1] += 1;
                    break;
                case "s":
                    p.location[0] += 1;
                    break;
                case "w":
                    p.location[1] -= 1;
                    break;
            }
            p.icon = 'p';
            if (gameState.food.get(key(p.location))) {
                p.score += 1;
                gameState.food.delete(key(p.location));
            }
            else {
                p.location = old;
            }
            break;
    }
    p.sendState();
}
function bufferCommand(g, id, c) {
    const p = g.players.get(id);
    if (p === undefined) {
        console.log("cant find player: ", id);
        return;
    }
    p.commands.push(c);
}
function key(p) {
    return p[0] + "," + p[1];
}
function handlePlayerJoin(id, client) {
    const x = Math.floor(Math.random() * 5) + 5;
    const y = Math.floor(Math.random() * 5) + 5;
    let ch = client.channels.get("player:" + id + ":state");
    const p = {
        id: id,
        score: 0,
        location: [x, y],
        commands: [],
        icon: 'n',
        dead: false,
        sendState: function () {
            sendPlayerState(ch, gameState, id);
        },
    };
    gameState.players.set(id, p);
    p.sendState();
    setInterval(() => processPlayerAction(gameState, id), 1000);
    client.channels
        .get("player:" + id + ":commands")
        .subscribe("command", (message) => {
        bufferCommand(gameState, message.clientId, message.data);
    })
        .catch((err) => console.error(err));
}
exports.handlePlayerJoin = handlePlayerJoin;
