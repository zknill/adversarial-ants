package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"os"

	"github.com/ably/ably-go/ably"
	"github.com/gdamore/tcell"
	"github.com/gdamore/tcell/encoding"
	"github.com/zknill/adversarial-ably-ants/pkg/area"
)

var (
	green  = tcell.NewRGBColor(133, 175, 105)
	green2 = tcell.NewRGBColor(97, 153, 61)
	green3 = tcell.NewRGBColor(76, 119, 47)
)

func main() {
	s := initScreen()

	ctx, cancel := context.WithCancel(context.Background())

	id := fmt.Sprintf("abc%d", rand.Intn(1000))

	client, err := ably.NewRealtime(
		ably.WithKey(os.Getenv("ABLY_KEY")),
		ably.WithAutoConnect(false),
		ably.WithClientID(id),
	)
	if err != nil {
		panic(err)
	}

	client.Connect()

	channel := client.Channels.Get("game:manager")
	if err := channel.Attach(ctx); err != nil {
		slog.Error("attach ", err)
		return
	}

	// could be presence
	if err := channel.Publish(ctx, "join", ""); err != nil {
		slog.Error("publish ", err)
		return
	}

	state := client.Channels.Get(fmt.Sprintf("player:%s:state", id))
	commands := client.Channels.Get(fmt.Sprintf("player:%s:commands", id))

	go func() {
		defer cancel()
		defer s.Fini()
		defer s.Clear()

		defer state.Detach(context.Background())
		defer commands.Detach(context.Background())

		for {
			event := s.PollEvent()
			switch ev := event.(type) {
			case *tcell.EventKey:
				if ev.Key() == tcell.KeyEsc || ev.Key() == tcell.KeyCtrlC {
					slog.Info("exiting")
					return
				}
			}
		}
	}()

	state.Subscribe(ctx, "state", func(m *ably.Message) {
		var data struct {
			Rows  []string `json:"rows"`
			Score int      `json:"score"`
		}

		if err := json.Unmarshal([]byte(m.Data.(string)), &data); err != nil {
			panic(err)
		}

		terrain := make([][]rune, len(data.Rows))
		for i := range data.Rows {
			terrain[i] = []rune(data.Rows[i])
		}

		// send to render
		s.Clear()
		render(s, &area.GameState{
			Score:   data.Score,
			Terrain: terrain,
		})
		s.Sync()

		middle := len(terrain) / 2

		switch {
		// Attach neighbours
		case terrain[middle-1][middle] == 'x':
			go commands.Publish(ctx, "command", "ATK N")
		case terrain[middle+1][middle] == 'x':
			go commands.Publish(ctx, "command", "ATK S")
		case terrain[middle][middle+1] == 'x':
			go commands.Publish(ctx, "command", "ATK E")
		case terrain[middle][middle-1] == 'x':
			go commands.Publish(ctx, "command", "ATK W")

		// Move to neighbouring food
		case terrain[middle-1][middle] == 'f':
			go commands.Publish(ctx, "command", "EAT N")
		case terrain[middle+1][middle] == 'f':
			go commands.Publish(ctx, "command", "EAT S")
		case terrain[middle][middle+1] == 'f':
			go commands.Publish(ctx, "command", "EAT E")
		case terrain[middle][middle-1] == 'f':
			go commands.Publish(ctx, "command", "EAT W")

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

			go commands.Publish(ctx, "command", command)
		}
	})

	<-ctx.Done()
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
