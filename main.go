package main

import (
	"log/slog"
	"os"

	"github.com/zknill/adversarial-ably-ants/pkg/brains"
	"github.com/zknill/adversarial-ably-ants/pkg/game"
)

func main() {
	key := os.Getenv("ABLY_KEY")

	// The brain decides on the moves for
	// the ant controlled by this client.
	// The basic brain is very simple, but
	// it should be relatively easy to build
	// a cleverer brain.
	brain := &brains.Basic{}

	screen := game.NewTerminalScreen()

	gameClient, err := game.NewClient(key, brain, screen)
	if err != nil {
		slog.Error("create game client", "error", err)
		os.Exit(1)
	}

	go func() {
		defer gameClient.Close()
		<-screen.ListenForCancel()
		slog.Info("exiting")
	}()

	slog.Info("run error", "error", gameClient.Run())
}
