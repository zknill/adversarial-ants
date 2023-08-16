import * as Ably from 'ably'
import {gameState, Game, playerLocations} from "./game";
import {key} from './game_helpers';
import {equalPoints, Player, Point} from "./player";

function handlePlayerJoin(id: string, client: Ably.Types.RealtimePromise) {
    const x = Math.floor(Math.random() * 5) + 5;
    const y = Math.floor(Math.random() * 5) + 5;
    let ch = client.channels.get("player:" + id + ":state")

    const p: Player = {
        id: id,
        score: 0,
        location: [x, y],
        commands: [],
        icon: 'n',
        dead: false,
        sendState: function (): void {
            sendPlayerState(ch, gameState, id)
        },
    }

    gameState.players.set(id, p)
    p.sendState()

    setInterval(() => processPlayerAction(gameState, id), 1000)

    client.channels
        .get("player:" + id + ":commands")
        .subscribe("command", (message) => {
            bufferCommand(gameState, message.clientId, message.data as string)
        })
        .catch((err) => console.error(err))
}

function sendPlayerState(ch: Ably.Types.RealtimeChannelPromise, g: Game, id: string) {
    const p = g.players.get(id)

    if (p === undefined) {
        console.log("cant find player: ", id)
        return
    }

    const rows = playerStateRows(g, p)

    const out = {
        rows: rows,
        score: p.score
    }

    ch
        .publish("state", JSON.stringify(out))
        .catch((err) => console.error("send player state", err))
}

function processPlayerAction(g: Game, id: string) {
    const p = g.players.get(id)

    if (p === undefined) {
        console.log("cant find player: ", id)
        return
    }

    if (p.dead) {
        p.sendState()
        return
    }

    if (p.commands.length === 0) {
        return
    }

    const c = p.commands.shift()
    if (c === undefined) {
        return
    }

    let loc: Point = [...p.location]
    const old: Point = [...p.location]

    const parts = c.split(' ')

    const action = parts[0]
    const direction = parts[1].toLowerCase()

    switch (action) {
        case "ATK":
            switch (direction) {
                case "n":
                    loc[0] -= 1
                    break
                case "e":
                    loc[1] += 1
                    break
                case "s":
                    loc[0] += 1
                    break
                case "w":
                    loc[1] -= 1
                    break
            }
            p.icon = direction

            const opponent = playerLocations().get(key(loc))

            if (opponent !== undefined && !opponent.dead && p.id !== opponent.id) {
                opponent.dead = true
                opponent.icon = 'd'
                p.score += 1
                p.icon = 'p'
                p.location = loc
                console.log("successful attack")
            }

            break
        case "MOV":
            loc = [...p.location]
            switch (direction) {
                case "n":
                    loc[0] -= 1
                    break
                case "e":
                    loc[1] += 1
                    break
                case "s":
                    loc[0] += 1
                    break
                case "w":
                    loc[1] -= 1
                    break
            }
            p.icon = direction

            // moves into spaces taken by other players not allowed
            // unless that player is dead
            const otherPlayer = playerLocations().get(key(loc))

            if (otherPlayer === undefined || otherPlayer.dead) {
                p.location = loc
            }

            break
        case "EAT":
            switch (direction) {
                case "n":
                    p.location[0] -= 1
                    break
                case "e":
                    p.location[1] += 1
                    break
                case "s":
                    p.location[0] += 1
                    break
                case "w":
                    p.location[1] -= 1
                    break
            }
            p.icon = 'p'

            if (gameState.food.get(key(p.location))) {
                p.score += 1
                gameState.food.delete(key(p.location))
            } else {
                p.location = old
            }

            break
    }


    p.sendState()
}

function playerStateRows(g: Game, p: Player): string[] {
    const offset = Math.floor(g.viewSize / 2)

    const lowX = p.location[0] - offset
    const highX = p.location[0] + offset

    const lowY = p.location[1] - offset
    const highY = p.location[1] + offset

    const rows: string[] = []
    const pLocs = playerLocations()

    for (let col = lowX; col <= highX; col++) {
        let rowBuffer: string = ""

        for (let row = lowY; row <= highY; row++) {
            if (equalPoints(p.location, [col, row])) {
                rowBuffer += p.icon

                continue
            }

            const opponent = pLocs.get(key([col, row]))
            if (opponent !== undefined) {
                if (opponent.dead) {
                    rowBuffer += 'd'
                } else {
                    rowBuffer += 'x'
                }


                continue
            }

            if (g.food.get(key([col, row]))) {
                rowBuffer += "f"

                continue
            }

            rowBuffer += "o"
        }

        rows.push(rowBuffer)
    }

    return rows
}

function bufferCommand(g: Game, id: string, c: string) {
    const p = g.players.get(id)

    if (p === undefined) {
        console.log("cant find player: ", id)
        return
    }


    p.commands.push(c)
}

export {handlePlayerJoin}
