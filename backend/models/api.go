// This is for my [POST /api/mutual] endpoint that will accept POST data (JSON w/ profile URLs) and then perform actions.
// This file defines Request + Response Data Structures.
package models

// What'll be sent over from the frontend:
type MutualRequest struct {
	Profiles []string `json:"profiles"` // e.g., ["url1", "url2", etc]. DEBUG: Maybe I should tweak this so plain usernames work too?
}

// Each user's rating of a particular film:
type FilmRatings map[string]float32 // {"url1": 4.0, "url2": 3.5}

// The response that will be posted back per film:
type MutualResponseFilm struct {
	Title     string      `json:"title"`
	FilmUrl   string      `json:"filmUrl"`
	PosterUrl string      `json:"posterUrl,omitempty"`
	Ratings   FilmRatings `json:"ratings"`
	AvgRating float32     `json:"avgRating"`
	Variance  float32     `json:"variance"`
}

// Entire response sent back:
type MutualResponse struct {
	MutualFilms []MutualResponseFilm `json:"mutualFilms"`
}
