import {generateRandomCoordinateAround, key} from "./game_helpers";
import {Player} from "./player"

interface Game {
    viewSize: number,
    players: Map<string, Player>,
    food: Map<string, boolean>,
}

const gameState: Game = {
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
                sendState: () => {},
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
                sendState: () => {},
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
                sendState: () => {},
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
                sendState: () => {},
            },
        ],
    ]),
    food: new Map(),
}

function playerLocations(): Map<string, Player> {
    let out: Map<string, Player> = new Map();

    for (const p of gameState.players.values()) {
        out.set(key(p.location), p)
    }

    return out
}

function seedFood(ms: number) {
    setInterval(() => {
        const players: Player[] = []

        for (const p of gameState.players.values()) {
            players.push(p)
        }

        if (players.length === 0) {
            return
        }

        const i = Math.floor(Math.random() * players.length)
        const player = players[i]

        const p = generateRandomCoordinateAround(player.location[0], player.location[1], 2)

        if (playerLocations().has(key(p))) {
            // can't seed food onto player
            return
        }

        // This can collide with the eating of food
        // not threadsafe?
        gameState.food.set(key(p), true)
    },
        ms,
    )
}

export {Game, gameState, playerLocations, seedFood}
