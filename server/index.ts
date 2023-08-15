import * as Ably from 'ably'
import {handlePlayerJoin} from './src/game'


const key = process.env.ABLY_KEY || 'missing'
let client = new Ably.Realtime.Promise(key)
let gameManagerChannel = client.channels.get("game:manager")

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






