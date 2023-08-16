import {Point} from "./player";

function key(p: Point): string {
    return p[0] + "," + p[1]
}

function generateRandomCoordinateAround(x: number, y: number, radius: number): Point {
    const xOffset = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    const yOffset = Math.floor(Math.random() * (radius * 2 + 1)) - radius;

    const newX = x + xOffset;
    const newY = y + yOffset;

    return [newX, newY];
}


export {key, generateRandomCoordinateAround}
