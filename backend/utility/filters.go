/*
These are my Filtering-specific functions for filtering the scraped film data (contained inside MutualData vars).
This file is also "package utils" so I can use functions defined in utils.go and anything else in the same package with ease.

NOTE: It seems like these files may have been made redundant for the "final product" since it uses TanStack to generate the display table
on the frontend. (TanStack provides built-in sorting and filtering options that kind of made these obsolete).
*/
package utils

import (
	models "github.com/timan-z/letterboxd-mutual-ratings-scraper/models"
)

// FilterAllAboveThreshold - Keep films where all members rated it >= threshold.
// NOTE: (Aware the naming is sorta ambiguous "filter as in remove? or keep?" but c'est la vie).
func FilterAllAboveThreshold(mutualFilms []models.MutualData, threshold float32) []models.MutualData {
	var filteredMFilms []models.MutualData
	for _, film := range mutualFilms {
		if AllAboveThreshold(film.Ratings, threshold) {
			filteredMFilms = append(filteredMFilms, film)
		}
	}
	return filteredMFilms
}

// FilterAllBelowThreshold - Keep films <= rating treshold.
func FilterAllBelowThreshold(mutualFilms []models.MutualData, threshold float32) []models.MutualData {
	var filteredMFilms []models.MutualData
	for _, film := range mutualFilms {
		if AllBelowThreshold(film.Ratings, threshold) {
			filteredMFilms = append(filteredMFilms, film)
		}
	}
	return filteredMFilms
}

// FilterByUserThreshold - Keep films >= or <= a specific user's rating (which depends on the bool value of arg "above")
func FilterByUserThreshold(mutualFilms []models.MutualData, threshold float32, userUrl string, above bool) []models.MutualData {
	var filteredMFilms []models.MutualData
	for _, film := range mutualFilms {
		rating, ratingExists := film.Ratings[userUrl]
		if !ratingExists {
			continue // skip to next loop iteration. (another safety guard that shouldn't be met, but you know).
		}
		if (above && rating >= threshold) || (!above && rating <= threshold) {
			filteredMFilms = append(filteredMFilms, film)
		}
	}
	return filteredMFilms
}
