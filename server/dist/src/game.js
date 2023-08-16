"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedFood = exports.playerLocations = exports.gameState = void 0;
const game_helpers_1 = require("./game_helpers");
const gameState = {
    viewSize: 5,
    players: new Map([
        [
            "seed1", {
                id: "seed1",
                score: 0,
                location: [4, 5],
                commands: [],
                dead: false,
                icon: 'x',
                sendState: () => { },
            },
        ],
        [
            "seed2", {
                id: "seed2",
                score: 0,
                location: [6, 5],
                commands: [],
                dead: false,
                icon: 'x',
                sendState: () => { },
            },
        ],
        [
            "seed3",
            {
                id: "seed3",
                score: 0,
                location: [5, 4],
                commands: [],
                dead: false,
                icon: 'x',
                sendState: () => { },
            },
        ],
        [
            "seed4", {
                id: "seed4",
                score: 0,
                location: [5, 6],
                commands: [],
                dead: false,
                icon: 'x',
                sendState: () => { },
            },
        ],
    ]),
    food: new Map(),
};
exports.gameState = gameState;
function playerLocations() {
    let out = new Map();
    for (const p of gameState.players.values()) {
        out.set((0, game_helpers_1.key)(p.location), p);
    }
    return out;
}
exports.playerLocations = playerLocations;
function seedFood(ms) {
    setInterval(() => {
        const players = [];
        for (const p of gameState.players.values()) {
            players.push(p);
        }
        if (players.length === 0) {
            return;
        }
        const i = Math.floor(Math.random() * players.length);
        const player = players[i];
        const p = (0, game_helpers_1.generateRandomCoordinateAround)(player.location[0], player.location[1], 2);
        if (playerLocations().has((0, game_helpers_1.key)(p))) {
            // can't seed food onto player
            return;
        }
        // This can collide with the eating of food
        // not threadsafe?
        gameState.food.set((0, game_helpers_1.key)(p), true);
    }, ms);
}
exports.seedFood = seedFood;
