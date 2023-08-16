package brains

import (
	"math/rand"

	"github.com/zknill/adversarial-ably-ants/pkg/area"
)

type Basic struct{}

func (b *Basic) TakeAction(terrain area.Terrain) string {
	middle := len(terrain) / 2

	switch {
	// Attach neighbours
	case terrain[middle-1][middle] == 'x':
		return "ATK N"
	case terrain[middle+1][middle] == 'x':
		return "ATK S"
	case terrain[middle][middle+1] == 'x':
		return "ATK E"
	case terrain[middle][middle-1] == 'x':
		return "ATK W"

	// Move to neighbouring food
	case terrain[middle-1][middle] == 'f':
		return "EAT N"
	case terrain[middle+1][middle] == 'f':
		return "EAT S"
	case terrain[middle][middle+1] == 'f':
		return "EAT E"
	case terrain[middle][middle-1] == 'f':
		return "EAT W"

	// Move a random direction
	default:
		dir := rand.Intn(3)
		command := "MOV "

		switch dir {
		case 0:
			command += "N"
		case 1:
			command += "E"
		case 2:
			command += "S"
		case 3:
			command += "W"
		}

		return command
	}
}
