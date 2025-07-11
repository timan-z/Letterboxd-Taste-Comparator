package models

type FilmDetails struct {
	FilmUrl    string
	FilmDir    string
	FilmPoster string
	FilmYear   string // int or string doesn't matter really.
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

/*type UserSummary struct {
	Username    string
	DisplayName string
	AvatarLink  string
}*/

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
