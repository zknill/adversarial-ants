# Adversarial ants

This is a mini-game built on top of Ably Realtime channels. 

Each client connects to the server with a channel, and makes decisions about what that clients ant should do. 

The ant can score points by eating food, or attacking other ants. If an ant is attacked it dies, and can no longer participate in the game. 

The ant who attacks first will win.

![ants](https://raw.githubusercontent.com/zknill/adversarial-ants/main/ants.png)

## Server [typescript]

The server operates on ticks, it ticks once per second. On each tick it will process one command from each client, and return the state of the client back to that client.

State is represented in a list of strings like so:

```
ooooo
ofooo
ooxoo
fooox
ooooo
```

The current ant client is always in the middle of the strings (marked here by an x). 

Symbol | meaning
----|-----
`x` | an ant
`o` | an empty map cell
`f` | food that can be eaten using the EAT command
`d` | a dead ant
`n` | the current ant facing north
`s` | the current ant facing south
`e` | the current ant facing east
`w` | the current ant facing west

## Client [go]

Each client connects to the server by sending a message on the `game:manager` channel. 
The server and client then switch over to channels specific for that client: 
- `player:{client_id}:state` - for the server to tell the client about the state of the map
- `player:{client_id}:command` - for the client to issue commands to the server

The client can make one of the following commands: 

- `MOV [direction]`
- `ATK [direction]`
- `EAT [direction]`

A `[direction]` can be one of `N`, `S`, `E`, `W`; representing North, South, East, West.

e.g. `MOV N` -- move north

`ATK` commands are only valid when there is a directly neighbouring ant in that direction.

`EAT` commands are only valid when there is a directly neighbouring food in that direction.

`MOV` commands can be issued at any time, but an ant cannot move into a space occupied by another ant.
