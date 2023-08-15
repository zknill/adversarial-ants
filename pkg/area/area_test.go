package area_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/zknill/adversarial-ably-ants/pkg/area"
)

func TestTerrain_MoveN(t *testing.T) {
	want := &area.GameState{
		Score: 1,
		Terrain: area.Terrain([][]rune{
			[]rune("ooooo"),
			[]rune("ooofo"),
			[]rune("fonoo"),
			[]rune("ofofo"),
			[]rune("ooffo"),
		}),
	}

	terra := area.Start()
	terra.MoveN()

	assert.Equal(t, want, terra)
}

func TestTerrain_MoveS(t *testing.T) {
	want := &area.GameState{
		Score: 1,
		Terrain: area.Terrain([][]rune{
			[]rune("fofoo"),
			[]rune("ofofo"),
			[]rune("oosfo"),
			[]rune("ooooo"),
			[]rune("ooofo"),
		}),
	}

	terra := area.Start()
	terra.MoveS()

	assert.Equal(t, want, terra)
}

func TestTerrain_MoveE(t *testing.T) {
	want := &area.GameState{
		Score: 1,
		Terrain: area.Terrain([][]rune{
			[]rune("oofoo"),
			[]rune("ofoof"),
			[]rune("foeoo"),
			[]rune("offoo"),
			[]rune("ooooo"),
		}),
	}

	terra := area.Start()
	terra.MoveE()

	assert.Equal(t, want, terra)
}

func TestTerrain_MoveW(t *testing.T) {
	want := &area.GameState{
		Score: 1,
		Terrain: area.Terrain([][]rune{
			[]rune("oooof"),
			[]rune("ofofo"),
			[]rune("oowof"),
			[]rune("oooff"),
			[]rune("ooooo"),
		}),
	}

	terra := area.Start()
	terra.MoveW()

	assert.Equal(t, want, terra)
}
