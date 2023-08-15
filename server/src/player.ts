type Point = [number, number]

interface Player {
    id: string,
    score: number,
    location: Point,
    commands: string[],
    icon: string,
    dead: boolean

    sendState() : void
}

function equalPoints(a: Point, b: Point): boolean {
    return a[0] === b[0] && a[1] === b[1]
}

export { Player , Point , equalPoints }

