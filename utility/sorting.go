package utils

import (
	"sort"

	models "github.com/timan-z/letterboxd-mutual-ratings-scraper/models"
)

/* These are my Sorting-specific functions for sorting the scraped film data (contained inside MutualData vars).
This file is also "package utils" so I can use functions defined in utils.go and anything else in the same package with ease. */

// SortByAverageRating - Sorts the list of films by average rating (ascending or descending will be determined by passed arguments):
func SortByAverageRating(mutualFilms []models.MutualData, descending bool) {
	if len(mutualFilms) == 0 {
		return
	}
	sort.SliceStable(mutualFilms, func(i, j int) bool {
		a := GetAverage(mutualFilms[i].Ratings)
		b := GetAverage(mutualFilms[j].Ratings)
		if descending {
			return a > b
		}
		return a < b // ascending ofc.
	})
}

// SortByVariance - Same idea as SortByAverageRating but with variance instead of average rating:
func SortByVariance(mutualFilms []models.MutualData, descending bool) {
	if len(mutualFilms) == 0 {
		return
	}
	sort.SliceStable(mutualFilms, func(i, j int) bool {
		a := GetVariance(mutualFilms[i].Ratings)
		b := GetVariance(mutualFilms[j].Ratings)
		if descending {
			return a > b
		}
		return a < b
	})
}

// SortByUserRating - Similar idea as SortByAverageRating etc, but with user-specific ratings:
func SortByUserRating(mutualFilms []models.MutualData, descending bool, userUrl string) {
	if len(mutualFilms) == 0 {
		return
	}
	sort.SliceStable(mutualFilms, func(i, j int) bool {
		a, aExists := mutualFilms[i].Ratings[userUrl]
		b, bExists := mutualFilms[j].Ratings[userUrl]

		// More safety guards (even though their conditions shouldn't be met with my setup):
		if !aExists && bExists {
			return false
		}
		if aExists && !bExists {
			return true
		}
		if !aExists && !bExists {
			return false
		} // no change.
		// Safety guards end.

		if descending {
			return a > b
		}
		return a < b
	})
}

// SortByTitle - Pretty self-explanatory (sorts by ascending):
func SortByTitle(mutualFilms []models.MutualData) {
	sort.SliceStable(mutualFilms, func(i, j int) bool {
		return mutualFilms[i].Title < mutualFilms[j].Title
	})
}
