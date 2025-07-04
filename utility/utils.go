package utils

// 0. models package/types.go-related functions:
/*func (m * models.MutualData) ComputeMDStats() {
	m.AvgRating = GetAverage(m.Ratings)
	m.Variance = GetVariance(m.Ratings)
}*/ // <-- "cannot define new methods on non-local type" Guess I can't do this? Find a workaround later.

/* These are broad helper utility functions (to assist in the more advanced Filtering, Sorting, and
Analytical functions defined in the same directory). */

// GetAverage - For filling out the "AvgRating" field of the MutualData struct:
func GetAverage(ratings map[string]float32) float32 {
	if len(ratings) == 0 {
		return 0
	} // The condition of this if-branch will never be met, but it's good practice, I guess.
	var sum float32
	for _, rating := range ratings {
		sum += rating
	}
	return (sum / float32(len(ratings)))
}

// GetVariance - For filling out the "Variance" field of the MutualData struct:
func GetVariance(ratings map[string]float32) float32 {
	if len(ratings) == 0 {
		return 0
	}
	/* Recall the formula for calculating Variance is:
	- The sum of [(each of the numbers in the set minus the mean of the overall set)^2]
	- Divide the aforementioned sum by (n-1) where n is ofc the length of the set.  */
	mean := GetAverage(ratings) // Recall the mean of a set of numbers is just the average.
	denom := float32(len(ratings) - 1)
	var squareDiff float32
	squareDiff = 0
	for _, rating := range ratings {
		diff := rating - mean
		squareDiff += diff * diff
	}
	return squareDiff / denom
}

// AllAboveThreshold - Check if the rating spread for a particular film passes a positive rating threshold (e.g., >= 3.0):
func AllAboveThreshold(ratings map[string]float32, threshold float32) bool {
	if len(ratings) == 0 {
		return false
	}
	for _, rating := range ratings {
		if rating < threshold {
			return false
		}
	}
	return true
}

// AllBelowThreshold - Opposite of AllAbovethreshold (e.g., <= 3.0):
func AllBelowThreshold(ratings map[string]float32, threshold float32) bool {
	if len(ratings) == 0 {
		return false
	}
	for _, rating := range ratings {
		if rating > threshold {
			return false
		}
	}
	return true
}

// UserAboveThreshold - Check if a specific user's rating for a particular film passes a positive rating threshold:
func UserAboveThreshold(ratings map[string]float32, threshold float32, userUrl string) bool {
	rating, ratingExists := ratings[userUrl] // ratingExists could be _ instead (it will always be true), but, again, this is good practice.
	return ratingExists && rating >= threshold
}

// UserBelowThreshold - Opposite of UserAboveThreshold:
func UserBelowThreshold(ratings map[string]float32, threshold float32, userUrl string) bool {
	rating, ratingExists := ratings[userUrl]
	return ratingExists && rating <= threshold
}
