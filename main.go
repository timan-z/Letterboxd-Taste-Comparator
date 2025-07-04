// DESIGN-CHOICE: Let's cap the number of accounts you can provide to six. (This is fair -- don't want to go overboard for ethical reasons).
package main

import (
	"fmt"
	"math"
	"os"
	"regexp"
	"time"

	"github.com/gocolly/colly/v2"
	models "github.com/timan-z/letterboxd-mutual-ratings-scraper/models"
)

var ratingMap = map[string]float32{
	"½":     0.5,
	"★":     1,
	"★½":    1.5,
	"★★":    2,
	"★★½":   2.5,
	"★★★":   3,
	"★★★½":  3.5,
	"★★★★":  4,
	"★★★★½": 4.5,
	"★★★★★": 5,
} // because Letterboxd stores their film ratings as these symbols even in the raw HTML code. (Only need float32).

var userUrls []string // <-- store the user urls here (slice of strings).

// two global flags:
var currentUrl string // <-- keeps track of current URL. (Probably isn't great practice tbh, but this is just a learning exercise for now).
var shortestLen int
var urlWShortest string
var ValidUrls bool = true // <-- global flag that keeps track of if URLs passed by CLI (eventually HTML form) are valid (true by default).

/*type FilmDetails struct {
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

	// DEBUG: These two members will be for the sorting/filtering options I implement later:
	AvgRating float32
	Variance  float32
}*/
// DEBUG: For calculating AvgRating and Variance -- TO-DO: Don't forget to throw this in the appropriate OnHTML function for-loop later.
/*func (m * MutualData) ComputeMDStats() {
	m.AvgRating = utils.GetAverage(m.Ratings)
	m.Variance = utils.GetVariance(m.Ratings)
}*/

var allUsersData map[string]models.UserData // username will be mapped to a UserData struct var (contains all the assoc films + details).

var mutualFilms []models.MutualData

var profilePageRegex = regexp.MustCompile(`^https://letterboxd\.com/[^/]+/?$`)

func main() {
	// Expect minimum two additional arguments on the CLI (for rep'ing Profile URLs) with a maximum of six:
	// [NOTE: ^ Transition using CLI arguments (for passing in Profile URLs) away to HTML Form Data later (when I get to site rendering).]
	argsListC := len(os.Args)
	if !(argsListC > 2 && argsListC < 8) {
		// > 2 and < 8 instead of 1 and 7 to adjust for the "go run..." command.
		fmt.Println("ERROR: Must provide at least two Profile URLs OR there is a maximum limit of six.")
		return
	}

	for i := 1; i < argsListC; i++ {
		userUrls = append(userUrls, os.Args[i])
	}

	allUsersData = make(map[string]models.UserData) // Initializing this global map that I have.
	shortestLen = math.MaxInt64                     // inf

	// Declare the collector with supported domains:
	c := colly.NewCollector(colly.AllowedDomains("www.letterboxd.com", "letterboxd.com", "https://letterboxd.com"), colly.Async(false)) // disabling async to reduce load (ethics!)
	c.Limit(&colly.LimitRule{
		DomainGlob:  "*letterboxd./*", // domains that will be affected here.
		Parallelism: 1,                // "parallelism refers to the ability to process multiple web requests concurrently."
		Delay:       5 * time.Second,  // Set a delay between requests to these domains.
		RandomDelay: 5 * time.Second,  // Addtional random delay.
	}) // <-- Definitely should add a delay effect so Letterboxd doesn't IP-ban me.
	c.UserAgent = "JustPlayingAroundBot/0.1 (Learning Golang Colly, have delays put in effect, async disabled, and more to REDUCE TRAFFIC!!!)"

	// My obligatory [1] On-Request method and my [2] On-Error method:
	c.OnRequest(func(r *colly.Request) {
		fmt.Printf("Visiting %s\n", r.URL)
	})
	c.OnError(func(r *colly.Response, e error) {
		fmt.Printf("Error while scraping: %s\n", e.Error())
		cWebPageUrl := r.Request.URL.String()
		fmt.Printf("Error: The value of cWebPageUrl is %s\n", cWebPageUrl)

		// Notify in case any of the profile URLs provided on the CLI/Form Data don't correspond to valid webpages:
		if profilePageRegex.MatchString(cWebPageUrl) && e.Error() == "Not Found" {
			fmt.Printf("Invalid Letterboxd Profiles are caught auto.\n")
			ValidUrls = false
		}
	})

	// Extracting the username of the profile whose films section you're crawling over (not URL ID):
	// NOTE:+DEBUG: ^ This OnHTML method might be rendered obsolete shortly...
	c.OnHTML("h1.title-3", func(h *colly.HTMLElement) {
		fmt.Printf("The Letterboxd profile you're crawling over is: %s\n", h.Text)
	})

	// Extracting the [username] and [film avatar link] of the profile whose films section you're crawling over:
	// NOTE: Probably will make the OnHTML("h1.title-3") method obsolete, so remove that afterwards.
	c.OnHTML("div.profile-mini-person", func(e *colly.HTMLElement) {
		divElem := e.DOM
		// Extracting username:
		h1Elem := divElem.Find("h1.title-3").First()
		profileUser := h1Elem.Text() // This will be the username of the Letterboxd profile you're crawling over.

		// Extracting avatar link:
		imgElem := divElem.Find("a.avatar img").First()
		avatarLink, avLinkExists := imgElem.Attr("src")

		if avLinkExists {
			fmt.Printf("debug: The value of profileUser: (%s) and avatarLink: (%s)\n", profileUser, avatarLink)
			/* DEBUG: Going to have the Profile URL saved in my global var "currentUrl".
			- So I can use that to access allUsersData, see if I can pull out an existing value it maps to.
			- If there IS an existing value, I think I just skip this part of the code. (NOTE: Actually, maybe have this guard at the start of this method).
			- If not, I slip in the username and avatar link values into the proper items...
			*/
			existingData, exists := allUsersData[currentUrl]
			if !exists {
				existingData = models.UserData{FilmNames: []string{}, FilmNamesLen: 0, FilmMap: make(map[string]models.FilmDetails)}
			}
			existingData.Username = profileUser
			existingData.AvatarLink = avatarLink
			allUsersData[currentUrl] = existingData
		}
	})

	// Here's where I can start working to extract a list of the films + ratings:
	// DEBUG: This OnHTML method below is where a lot of the work happens -- BE SURE TO RETURN HERE AND DEBUG IT EXTRA HARD!!!
	c.OnHTML("ul.poster-list", func(h *colly.HTMLElement) {
		// NOTE: I should add guards to make sure this OnHTML method only executes for the proper form page (not the base profile page):
		if profilePageRegex.MatchString(h.Request.URL.String()) {
			fmt.Printf("DEBUG: c.OnHTML(\"ul.poster-list\") prevented from running...\n")
			return
		}

		var userFilms = make(map[string]models.FilmDetails)
		var filmTitles []string

		h.ForEach("li.poster-container", func(_ int, e *colly.HTMLElement) {
			liElem := e.DOM
			childNodes := liElem.Children().Nodes

			/* This whole DOM traversal and the values I'm retrieving will be based on the raw (pre-JS injection DOM) HTML of the LB webpage.
			(That's the HTML page DOM you see when you click "View Page Source" instead of looking at what's inside Inspect Element). This is
			because Letterboxd, like many modern sites, load an initial HTML structure and uses JavaScript to "hydrate" it later and flesh it out.
			I'm using Colly, which will only look at this initial HTML structure. */

			// There will be two child elements: a <div> and a <p>. Here's a guard to ensure of that:
			if len(childNodes) == 2 {
				// Getting the name of the film and URL path (/films/{URL-path}):
				divElem := liElem.Find("div[data-film-slug]").First()
				filmUrlPath, fupExists := divElem.Attr("data-film-slug")

				imgElem := divElem.Find("img[alt]").First()
				filmName, fnExists := imgElem.Attr("alt")

				pElem := liElem.Find("p.poster-viewingdata").First()
				spanElem := pElem.Find("span.rating").First()
				rawRating := spanElem.Text()
				rating := ratingMap[rawRating]
				//fmt.Printf("The value of filmName => %s\n", filmName)
				//fmt.Printf("The value of filmUrlPath => %s\n", filmUrlPath)
				//fmt.Printf("The value of the rating => %.1f\n", rating)

				if fupExists && fnExists {

					fmt.Printf("DEBUG: The value of filmName is (%s), filmUrlPath is (%s), and rating is (%.1f)\n", filmName, filmUrlPath, rating)

					filmTitles = append(filmTitles, filmName) // ADDING FILM TITLE TO MY FILMTITLES SLICE.
					userFilms[filmName] = models.FilmDetails{FilmUrl: filmUrlPath, FilmRating: rating}
				}
			}
		})
		filmTitlesLen := len(filmTitles)

		// allUsersData[currentUrl] = UserData{FilmNames: filmTitles, FilmNamesLen: filmTitlesLen, FilmMap: userFilms}
		/* DEBUG: ^ This is bad logic on my end. It will overwrite all the data I scraped from previous page scrapings, so I
		need to adjust my code such that I'm appending the data I assign here. */
		existingData, exists := allUsersData[currentUrl]
		if !exists {
			existingData = models.UserData{FilmNames: []string{}, FilmNamesLen: 0, FilmMap: make(map[string]models.FilmDetails)}
		}
		// Merge film titles:
		existingData.FilmNames = append(existingData.FilmNames, filmTitles...)
		// Merge film map:
		for k, v := range userFilms {
			existingData.FilmMap[k] = v
		}
		existingData.FilmNamesLen += filmTitlesLen
		// finalize:
		allUsersData[currentUrl] = existingData
	})
	// DEBUG: This OnHTML method above is where a lot of the work happens -- BE SURE TO RETURN HERE AND DEBUG IT EXTRA HARD!!!

	// This c.OnHTML method will be what performs pagination (important to have **after** the ul.poster-list method above):
	c.OnHTML(".paginate-nextprev a.next", func(e *colly.HTMLElement) {
		if profilePageRegex.MatchString(e.Request.URL.String()) {
			return
		}
		// Getting the next button:
		nextPage := e.Request.AbsoluteURL(e.Attr("href"))
		fmt.Println("Visiting the next page: ", nextPage)
		e.Request.Visit(nextPage)
	})

	// First iterate through all the provided URLs to inspect their validity:
	for i := 0; i < len(userUrls); i++ {
		urlToInspect := "https://letterboxd.com/"
		urlToInspect += userUrls[i]
		urlToInspect += "/"
		c.Visit(urlToInspect)
	}
	// Global boolean flag ValidUrls will be set to false if any of the URLs were invalid:
	if !(ValidUrls) {
		fmt.Println("ERROR: One (or more) of the Profile URLs provided led to an invalid page.")
		return
	}
	// Iterate through userUrls again, this time to visit the proper pages for the purpose of data scraping:
	for i := 0; i < len(userUrls); i++ {
		currentUrl = userUrls[i]
		urlToScrape := "https://letterboxd.com/"
		urlToScrape += currentUrl
		urlToScrape += "/films/rated/.5-5/"

		fmt.Printf("The value of urlToScrape => %s\n", urlToScrape)
		c.Visit(urlToScrape)

		userDataVar := allUsersData[userUrls[i]]
		if shortestLen > userDataVar.FilmNamesLen {
			shortestLen = userDataVar.FilmNamesLen
			urlWShortest = userUrls[i]
		}
	}

	// Now I can iterate through the allUsersData map using userUrls:
	for i := 0; i < len(userUrls); i++ {
		userDataVar := allUsersData[userUrls[i]] // Retrieve the userData val.
		listOfFilms := userDataVar.FilmNames
		theFilmMap := userDataVar.FilmMap
		theUsername := userDataVar.Username
		theAvatar := userDataVar.AvatarLink

		fmt.Printf("Printing out the list of Films+ for user (URL: %s, Username: %s, Avatar: %s)\n", userUrls[i], theUsername, theAvatar)
		fmt.Printf("**************************************************\n")
		for index, value := range listOfFilms {
			fmt.Printf("For Film \"%s\" (index %d):\n ", value, index)
			theFilmDetails := theFilmMap[listOfFilms[index]]
			fmt.Printf("- The FilmUrl: (%s) and the FilmRating: (%.1f)\n", theFilmDetails.FilmUrl, theFilmDetails.FilmRating)
		}
	}
	fmt.Printf("[[THE URL WITH THE SHORTEST FILM COUNT => (%s) AND THAT LENGTH IS => (%d)]]\n", urlWShortest, allUsersData[urlWShortest].FilmNamesLen)

	// DEBUG: Now I can do the intersection logic, which shoulnd't be hard:
	sListOfFilms := allUsersData[urlWShortest].FilmNames
	// for-loop that does the intersection:
	for _, film := range sListOfFilms {
		ratedCounter := 0
		mutualDataVar := models.MutualData{Ratings: make(map[string]float32)}
		// For each "film", I need to check if the other users have it too:
		for _, user := range userUrls {
			userDataVar := allUsersData[user]
			if user != urlWShortest {
				hasRating, exists := userDataVar.FilmMap[film]
				if exists {
					mutualDataVar.Title = film
					mutualDataVar.FilmUrl = hasRating.FilmUrl
					mutualDataVar.Ratings[user] = hasRating.FilmRating
					ratedCounter += 1
				}
			} else {
				// otherwise, urlWShortest value's profile ratings etc won't show.
				mutualDataVar.Title = film
				mutualDataVar.FilmUrl = userDataVar.FilmMap[film].FilmUrl
				mutualDataVar.Ratings[user] = userDataVar.FilmMap[film].FilmRating
			}
		}
		if ratedCounter == (len(userUrls) - 1) {
			mutualFilms = append(mutualFilms, mutualDataVar)
		}
	}

	// debug: for-loop that will iterate through the mutualFilms array and print everything out:
	for index, mFilm := range mutualFilms {
		fmt.Printf("The film is: [%s] (index %d)\n", mFilm.Title, index)
		for _, user := range userUrls {
			fmt.Printf("- User:(%s) rated it: [%.1f/4] ", user, mFilm.Ratings[user])
		}
		fmt.Printf("\n")
	}

	// Now I should be able to iterate through mutualFilms to check if everything went well:
	fmt.Printf("The value of len(mutualFilms) => %d\n", len(mutualFilms))
}
