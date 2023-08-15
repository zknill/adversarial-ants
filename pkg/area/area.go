package area

import (
	"bytes"
	"fmt"
	"math/rand"
	"time"
)

func Start() *GameState {
	t := Terrain([][]rune{
		[]rune("ooofo"),
		[]rune("fofoo"),
		[]rune("ofnfo"),
		[]rune("ooffo"),
		[]rune("ooooo"),
	})

	return &GameState{Terrain: t}
}

type GameState struct {
	Score   int
	Terrain Terrain
}

type Terrain [][]rune

func (g *GameState) MoveN() {
	t := g.Terrain
	middle := len(t) / 2
	last := t[len(t)-1]

	if t[middle-1][middle] == 'f' {
		g.Score++
	}

	for row := len(t) - 1; row > 0; row-- {
		t[row] = t[row-1]
	}

	t[middle][middle] = 'n'
	t[middle+1][middle] = 'o'

	t[0] = last
}

func (g *GameState) MoveS() {
	t := g.Terrain
	middle := len(t) / 2
	first := t[0]

	if t[middle+1][middle] == 'f' {
		g.Score++
	}

	for row := 0; row < len(t)-1; row++ {
		t[row] = t[row+1]
	}

	t[middle][middle] = 's'
	t[middle-1][middle] = 'o'

	t[len(t)-1] = first
}

func (g *GameState) MoveE() {
	t := g.Terrain
	middle := len(t) / 2

	if t[middle][middle+1] == 'f' {
		g.Score++
	}

	for row := 0; row < len(t); row++ {
		first := t[row][0]

		for col := 0; col < len(t[row])-1; col++ {
			t[row][col] = t[row][col+1]
		}

		t[row][len(t[row])-1] = first
	}

	t[middle][middle] = 'e'
	t[middle][middle-1] = 'o'
}

func (g *GameState) MoveW() {
	t := g.Terrain
	middle := len(t) / 2

	if t[middle][middle-1] == 'f' {
		g.Score++
	}

	for row := 0; row < len(t); row++ {
		last := t[row][len(t[row])-1]

		for col := len(t[row]) - 1; col > 0; col-- {
			t[row][col] = t[row][col-1]
		}

		t[row][0] = last
	}

	t[middle][middle] = 'w'
	t[middle][middle+1] = 'o'

}

func (g *GameState) String() string {
	t := g.Terrain
	b := bytes.Buffer{}
	for _, row := range t {
		fmt.Fprintf(&b, "%s\n", string(row))
	}

	return b.String()
}

func RandomAreas(start *GameState, tick time.Duration, out chan GameState) {
	out <- *start

	ticker := time.NewTicker(tick)

	for {
		dir := rand.Intn(3)
		ShiftArea(start, dir)

		<-ticker.C
		out <- *start
	}
}

func ShiftArea(g *GameState, direction int) {
	switch direction {
	case 0:
		g.MoveN()
		// north
	case 1:
		// east
		g.MoveE()
	case 2:
		// south
		g.MoveS()
	case 3:
		// west
		g.MoveW()
	}
}
