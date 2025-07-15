// This is for my [POST /api/mutual] endpoint that will accept POST data (JSON w/ profile URLs) and then perform actions.
// This file defines Request + Response Data Structures.
package models

// Each user's rating of a particular film:
type FilmRatings map[string]float32 // {"url1": 4.0, "url2": 3.5}

// The response that will be posted back per film:
type MutualResponseFilm struct {
	Title      string      `json:"title"`
	FilmUrl    string      `json:"filmUrl"`
	FilmYear   string      `json:"filmYear"`
	FilmDir    string      `json:"filmDir"`
	FilmPoster string      `json:"filmPoster,omitempty"`
	Ratings    FilmRatings `json:"ratings"`
	AvgRating  float32     `json:"avgRating"`
	Variance   float32     `json:"variance"`
}

type UserSummary struct {
	Username    string `json:"username"`
	Displayname string `json:"displayname"`
	AvatarLink  string `json:"avatarLink"`
}

// Entire response sent back:
type MutualResponse struct {
	MutualFilms []MutualResponseFilm `json:"mutualFilms"`
	Users       []UserSummary        `json:"users"`
}

// Requests and stuff...
type MutualRequest struct {
	Profiles []string `json:"profiles"` // e.g., ["url1", "url2", etc]. DEBUG: Maybe I should tweak this so plain usernames work too?
}

type HeatMapRequest struct {
	Films []MutualResponseFilm
	Users []UserSummary
}
