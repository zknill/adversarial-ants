package game

import (
	"fmt"
	"math/rand"
	"os"

	"github.com/gdamore/tcell"
	"github.com/gdamore/tcell/encoding"
	"github.com/zknill/adversarial-ably-ants/pkg/area"
)

var (
	green  = tcell.NewRGBColor(133, 175, 105)
	green2 = tcell.NewRGBColor(97, 153, 61)
	green3 = tcell.NewRGBColor(76, 119, 47)
)

type TerminalScreen struct {
	s    tcell.Screen
	done chan struct{}
}

func NewTerminalScreen() *TerminalScreen {
	s := initScreen()

	return &TerminalScreen{s: s}
}

func (t *TerminalScreen) ListenForCancel() <-chan struct{} {
	if t.done == nil {
		t.done = make(chan struct{})

		go func() {
			defer close(t.done)

			for {
				event := t.s.PollEvent()
				switch ev := event.(type) {
				case *tcell.EventKey:
					if ev.Key() == tcell.KeyEsc || ev.Key() == tcell.KeyCtrlC {
						return
					}
				}
			}
		}()
	}

	return t.done
}

func (t *TerminalScreen) Render(gameState *area.GameState) {
	t.s.Clear()
	render(t.s, gameState)
	t.s.Sync()
}

func (t *TerminalScreen) Close() {
	defer t.s.Fini()
	defer t.s.Clear()
}

func initScreen() tcell.Screen {
	encoding.Register()

	s, err := tcell.NewScreen()
	if err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}
	if err := s.Init(); err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}

	return s
}

func render(s tcell.Screen, g *area.GameState) {
	terrain := g.Terrain

	for y := 0; y < len(terrain); y++ {
		for x := 0; x < len(terrain[y]); x++ {
			var st tcell.Style

			switch rand.Intn(3) {
			case 1:
				st = tcell.StyleDefault.Background(green)
			case 2:
				st = tcell.StyleDefault.Background(green)
			default:
				st = tcell.StyleDefault.Background(green)
			}

			switch terrain[y][x] {
			case 'd':
				s.SetContent(x, y, ' ', []rune{'💀'}, st)
			case 'p':
				s.SetContent(x, y, ' ', []rune{'➕'}, st)
			case 'f':
				s.SetContent(x, y, ' ', []rune{'🥜'}, st)
			case 'n':
				s.SetContent(x, y, ' ', []rune("⬆️ "), st)
			case 's':
				s.SetContent(x, y, ' ', []rune("⬇️ "), st)
			case 'e':
				s.SetContent(x, y, ' ', []rune("➡️ "), st)
			case 'w':
				s.SetContent(x, y, ' ', []rune("⬅️ "), st)
			case 'x':
				s.SetContent(x, y, ' ', []rune{'🐜'}, st)
			default:
				s.SetContent(x, y, ' ', []rune{' ', ' '}, st)
			}
		}
	}

	s.SetContent(0, 6, ' ', []rune(fmt.Sprintf("score: %d", g.Score)), tcell.StyleDefault)
}
