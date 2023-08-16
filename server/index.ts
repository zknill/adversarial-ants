import * as Ably from 'ably'
import {seedFood} from './src/game'
import {handlePlayerJoin} from './src/game_player'

const key = process.env.ABLY_KEY || 'missing'
let client = new Ably.Realtime.Promise(key)
let gameManagerChannel = client.channels.get("game:manager")

// add food to the map every 1 second
seedFood(1000)

// subscribe to join requests
gameManagerChannel
    .subscribe("join", (message) => {
        console.log("new player entered the game: ", message.clientId)
        handlePlayerJoin(message.clientId, client)
    })
    .then((state) => {
        console.log("subscribe state: ", state)
        return
    })
    .catch((err) => console.error(err))






