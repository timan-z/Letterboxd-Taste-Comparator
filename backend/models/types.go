// This file defines data structures that will be used in the scraping process defined in main.go:
package models

type FilmDetails struct {
	FilmUrl    string
	FilmDir    string
	FilmPoster string
	FilmYear   string // int, string doesn't matter really.
	FilmRating float32
}

type UserData struct {
	Username     string
	Displayname  string
	AvatarLink   string
	FilmNames    []string
	FilmNamesLen int
	FilmMap      map[string]FilmDetails
}

type MutualData struct {
	Title      string
	FilmUrl    string
	FilmDir    string
	FilmPoster string
	FilmYear   string
	Ratings    map[string]float32

	AvgRating float32
	Variance  float32
}
