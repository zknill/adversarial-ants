"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomCoordinateAround = exports.key = void 0;
function key(p) {
    return p[0] + "," + p[1];
}
exports.key = key;
function generateRandomCoordinateAround(x, y, radius) {
    const xOffset = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    const yOffset = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    const newX = x + xOffset;
    const newY = y + yOffset;
    return [newX, newY];
}
exports.generateRandomCoordinateAround = generateRandomCoordinateAround;
