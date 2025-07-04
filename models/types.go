package models

type FilmDetails struct {
	FilmUrl    string
	FilmRating float32
}

type UserData struct {
	Username     string
	AvatarLink   string
	FilmNames    []string
	FilmNamesLen int
	FilmMap      map[string]FilmDetails
}

type MutualData struct {
	Title   string
	FilmUrl string
	Ratings map[string]float32

	AvgRating float32
	Variance  float32
}
