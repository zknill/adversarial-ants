package game

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"

	"github.com/ably/ably-go/ably"
	"github.com/zknill/adversarial-ably-ants/pkg/area"
)

type Brain interface {
	TakeAction(terrain area.Terrain) (command string)
}

type Screen interface {
	Render(*area.GameState)
}

type Client struct {
	done     chan struct{}
	state    *ably.RealtimeChannel
	commands *ably.RealtimeChannel
	brain    Brain
	screen   Screen
}

func NewClient(key string, brain Brain, screen Screen) (*Client, error) {
	id := fmt.Sprintf("abc%d", rand.Intn(1000))

	client, err := ably.NewRealtime(
		ably.WithKey(key),
		ably.WithAutoConnect(false),
		ably.WithClientID(id),
	)
	if err != nil {
		return nil, fmt.Errorf("new ably realtime: %w", err)
	}

	client.Connect()

	ctx := context.Background()

	channel := client.Channels.Get("game:manager")
	if err := channel.Attach(ctx); err != nil {
		return nil, fmt.Errorf("attach manager channel: %w", err)
	}

	// could be presence
	if err := channel.Publish(ctx, "join", ""); err != nil {
		return nil, fmt.Errorf("join game: %w", err)
	}

	state := client.Channels.Get(fmt.Sprintf("player:%s:state", id))
	commands := client.Channels.Get(fmt.Sprintf("player:%s:commands", id))

	return &Client{
		done:     make(chan struct{}),
		state:    state,
		commands: commands,
		brain:    brain,
		screen:   screen,
	}, nil
}

func (c *Client) Run() error {
	unsub, err := c.state.Subscribe(context.Background(), "state", func(m *ably.Message) {
		gameState := gameStateFromMessage(m)
		c.screen.Render(gameState)

		cmd := c.brain.TakeAction(gameState.Terrain)

		c.publish(cmd)
	})

	if err != nil {
		return fmt.Errorf("subscribe: %w", err)
	}
	defer unsub()

	<-c.done

	return nil
}

func (c *Client) publish(cmd string) {
	go c.commands.Publish(context.Background(), "command", cmd)
}

func gameStateFromMessage(m *ably.Message) *area.GameState {
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

	return &area.GameState{
		Score:   data.Score,
		Terrain: terrain,
	}
}

func (c *Client) Close() {
	defer c.state.Detach(context.Background())
	defer c.commands.Detach(context.Background())
	defer close(c.done)
}
