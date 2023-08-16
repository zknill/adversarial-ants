"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePlayerJoin = void 0;
const game_1 = require("./game");
const game_helpers_1 = require("./game_helpers");
const player_1 = require("./player");
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
            sendPlayerState(ch, game_1.gameState, id);
        },
    };
    game_1.gameState.players.set(id, p);
    p.sendState();
    setInterval(() => processPlayerAction(game_1.gameState, id), 1000);
    client.channels
        .get("player:" + id + ":commands")
        .subscribe("command", (message) => {
        bufferCommand(game_1.gameState, message.clientId, message.data);
    })
        .catch((err) => console.error(err));
}
exports.handlePlayerJoin = handlePlayerJoin;
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
            const opponent = (0, game_1.playerLocations)().get((0, game_helpers_1.key)(loc));
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
            const otherPlayer = (0, game_1.playerLocations)().get((0, game_helpers_1.key)(loc));
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
            if (game_1.gameState.food.get((0, game_helpers_1.key)(p.location))) {
                p.score += 1;
                game_1.gameState.food.delete((0, game_helpers_1.key)(p.location));
            }
            else {
                p.location = old;
            }
            break;
    }
    p.sendState();
}
function playerStateRows(g, p) {
    const offset = Math.floor(g.viewSize / 2);
    const lowX = p.location[0] - offset;
    const highX = p.location[0] + offset;
    const lowY = p.location[1] - offset;
    const highY = p.location[1] + offset;
    const rows = [];
    const pLocs = (0, game_1.playerLocations)();
    for (let col = lowX; col <= highX; col++) {
        let rowBuffer = "";
        for (let row = lowY; row <= highY; row++) {
            if ((0, player_1.equalPoints)(p.location, [col, row])) {
                rowBuffer += p.icon;
                continue;
            }
            const opponent = pLocs.get((0, game_helpers_1.key)([col, row]));
            if (opponent !== undefined) {
                if (opponent.dead) {
                    rowBuffer += 'd';
                }
                else {
                    rowBuffer += 'x';
                }
                continue;
            }
            if (g.food.get((0, game_helpers_1.key)([col, row]))) {
                rowBuffer += "f";
                continue;
            }
            rowBuffer += "o";
        }
        rows.push(rowBuffer);
    }
    return rows;
}
function bufferCommand(g, id, c) {
    const p = g.players.get(id);
    if (p === undefined) {
        console.log("cant find player: ", id);
        return;
    }
    p.commands.push(c);
}
