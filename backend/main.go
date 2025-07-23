// DESIGN-CHOICE: Let's cap the number of accounts you can provide to six. (This is fair -- don't want to go overboard for ethical reasons).
package main

import (
	// new stuff (for new phase)
	"encoding/json"
	"net/http"

	// old imports
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gocolly/colly/v2"
	models "github.com/timan-z/letterboxd-mutual-ratings-scraper/models"
	utils "github.com/timan-z/letterboxd-mutual-ratings-scraper/utility"
)

func main() {
	// DEBUG: Test below.
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "HELLO FROM GO RAILWAY!!!")
	})

	// DEBUG: Start a webserver for Railway (and eventually Fly.io when I can get the site to stop rejecting my info).
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // What I had originally (fallback for if Railway does not provide a PORT).
	}

	// Serve backend on port 8080:
	http.HandleFunc("/api/mutual", handleMutualRatings)
	http.HandleFunc("/api/heatmap", handleHeatMap)
	// Allow CORS:
	//http.ListenAndServe(":8080", corsMiddleware(http.DefaultServeMux))

	fmt.Printf("Starting server on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(http.DefaultServeMux)))
}

// Function for handling POST /api/mutual requests (when list of profile URLs are sent over):
func handleMutualRatings(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		// DEBUG: CORS preflight — return OK with headers already set by middleware
		w.WriteHeader(http.StatusOK)
		return
	}

	fmt.Println("Received:", r.Method, "on", r.URL.Path)
	if r.Method != http.MethodPost {
		http.Error(w, "[handleMutualRatings]ERROR: Only POST calls are allowed for the /api/mutual endpoint.", http.StatusMethodNotAllowed)
		return
	}

	var req models.MutualRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "[handleMutualRatings]ERROR: Invalid request body", http.StatusBadRequest)
		return
	}

	// scrapeMutualRatings() will be a new function that contains the scraping and intersection logic originally in my main()
	response, err := scrapeMutualRatings(req.Profiles)
	if err != nil {
		http.Error(w, "Scraping failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Function for handling POST /api/heatmap requests (sending back user and mutualFilm data to then send back HeatMap data):
func handleHeatMap(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
	}
	if r.Method != http.MethodPost {
		http.Error(w, "[handleHeatMap]ERROR: Only POST calls are allowed for the /api/heatmap endpoint.", http.StatusMethodNotAllowed)
		return
	}
	var req models.HeatMapRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "[handleHeatMap]ERROR: Invalid request body", http.StatusBadRequest)
		return
	}

	// should call a function now that does the heatmap calculation, returns the values here after:
	//hydrHeatMap, filmTitles, err := genHeatMapValues(req.Films, req.Users)
	hydrHeatMap, err := genHeatMapValues(req.Films, req.Users)
	if err != nil {
		http.Error(w, "Heatmap stuff failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	/*responseVal := models.HeatMapResponse{
		Data:       hydrHeatMap,
		FilmTitles: filmTitles,
	}*/
	// json.NewEncoder(w).Encode(responseVal)
	json.NewEncoder(w).Encode(hydrHeatMap)
}

// Function that will calculate the values needed for generating a HeatMap based on intersected users film data:
func genHeatMapValues(mutualFilms []models.MutualResponseFilm, users []models.UserSummary) ([]map[string]interface{}, error) {
	var heatMapData []map[string]interface{}

	for _, user := range users {
		row := map[string]interface{}{
			"id":   user.Username,
			"data": []map[string]interface{}{},
		}
		dataSlice := row["data"].([]map[string]interface{})

		for _, film := range mutualFilms {
			var rating interface{}
			if ratingVal, ok := film.Ratings[user.Username]; ok {
				rating = ratingVal
			} else {
				rating = nil
			}
			cell := map[string]interface{}{
				"x": film.Title,
				"y": rating,
			}
			dataSlice = append(dataSlice, cell)
		}
		row["data"] = dataSlice
		heatMapData = append(heatMapData, row)
	}
	return heatMapData, nil
}

// Function that contains my scraping and intersection logic (all my code that was originally in main.go when it was just a CLI thing):
func scrapeMutualRatings(profiles []string) (models.MutualResponse, error) {
	// Variables:
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
	var currentUrl string
	//var currentFilm string
	var urlWShortest string

	//var filmYearBuffer string
	//var filmDirBuffer string
	//var filmPosterBuffer string

	visitedFilms := make(map[string]models.FilmDetails) // filmUrlPath -> FilmDetails
	visitedPaginatedPages := map[string]bool{}          // <-- GUARD THAT MIGHT BE COMPLETLEY UNNECESSARY???

	//var userUrls []string // Slice of strings to store the Profile URLs
	var mutualFilms []models.MutualData
	var profilePageRegex = regexp.MustCompile(`^https://letterboxd\.com/[^/]+/?$`)
	var filmPageRegex = regexp.MustCompile(`^https://letterboxd\.com/film/[^/]+/?$`)

	ValidUrls := true                                // keeps track of if the URLs passed in are all valid.
	allUsersData := make(map[string]models.UserData) // username will be mapped to a UserData struct var (contains all the assoc films + details).
	shortestLen := math.MaxInt64                     // inf

	//var userFilms = make(map[string]models.FilmDetails) // <-- UPDATE: Moving this here.

	// Declare the collector with supported domains:
	c := colly.NewCollector(colly.AllowedDomains("www.letterboxd.com", "letterboxd.com", "https://letterboxd.com"), colly.Async(false)) // disabling async to reduce load (ethics!)
	c.Limit(&colly.LimitRule{
		DomainGlob:  "*letterboxd./*", // domains that will be affected here.
		Parallelism: 1,                // "parallelism refers to the ability to process multiple web requests concurrently."
		Delay:       10 * time.Second, // Set a delay between requests to these domains.
		RandomDelay: 10 * time.Second, // Addtional random delay.
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

		// if existingFilm, alreadyVisited := visitedFilms[filmUrlPath]; alreadyVisited {
		if alreadyRetrCheck, alreadyRetr := allUsersData[currentUrl]; alreadyRetr {
			if alreadyRetrCheck.AvatarLink != "" && alreadyRetrCheck.Username != "" {
				fmt.Println("AVOIDED UNNECESSARY c.OnHTML(\"div.profile-mini-person\", func(e *colly.HTMLElement) INVOCATION!!!")
				return
			}
		}

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
			existingData.Username = currentUrl
			existingData.Displayname = profileUser
			existingData.AvatarLink = avatarLink
			allUsersData[currentUrl] = existingData
		}
	})

	// onHTML methods for extracting the [1] - Film Release Year (e.g., 1954), [2] - Director Name (e.g., Akira Kurosawa), [3] -Poster Link:
	// [1] - Film Release Year and [2] - Director Name:
	c.OnHTML("div.productioninfo ", func(e *colly.HTMLElement) {
		if !(filmPageRegex.MatchString(e.Request.URL.String())) {
			// This OnHTML method should only be triggered for a specific film-page (e.g., "https://letterboxd.com/film/seven-samurai/"), nothing else.
			return
		}
		releaseYear := e.DOM.Find("span.releasedate").First().Text()
		director := e.DOM.Find("span.prettify").First().Text()
		e.Request.Ctx.Put("releaseYear", releaseYear)
		e.Request.Ctx.Put("director", director)
		/*divElem := e.DOM
		// Film Release Year:
		yearSpan := divElem.Find("span.releasedate").First()
		releaseYear := yearSpan.Text()
		fmt.Printf("GetYearDir-Debug: The value of releaseYear => %s\n", releaseYear)

		// Director:
		dirSpan := divElem.Find("span.prettify").First()
		director := dirSpan.Text()
		fmt.Printf("GetYearDir-Debug: The value of director => %s\n", director)

		// NEW DEBUG:
		filmYearBuffer = releaseYear
		filmDirBuffer = director*/
	})

	// [3] - Poster Link:
	c.OnHTML("script[type='application/ld+json']", func(e *colly.HTMLElement) {
		if !(filmPageRegex.MatchString(e.Request.URL.String())) {
			// This OnHTML method should only be triggered for a specific film-page (e.g., "https://letterboxd.com/film/seven-samurai/"), nothing else.
			return
		}

		/* Extracting the poster link will be a little awkward, it's lodged within a <span> element at the bottom of the Page Source HTML within
		a JSON string surrounded by prefix and suffix comments (which I'll need to remove): */
		rawJSON := e.Text
		rawJSON = strings.TrimSpace(rawJSON)
		if !(strings.HasPrefix(rawJSON, `/* <![CDATA[ */`) && !(strings.HasSuffix(rawJSON, `/* ]]> */\s`))) {
			// TO-DO: Insert some kind of proper error handling for this situation...
			fmt.Println("ERROR: LOOKS LIKE THE LETTERBOXD SOURCE DOM HAS BEEN CHANGED!!!!!")
			return
		}
		rawJSON = strings.TrimPrefix(rawJSON, "/* <![CDATA[ */")
		rawJSON = strings.TrimSuffix(rawJSON, "/* ]]> */")
		// Get the poster URL:
		var GiveMePoster struct {
			Image string `json:"image"`
		}
		decoder := json.NewDecoder(strings.NewReader(rawJSON))
		if err := decoder.Decode(&GiveMePoster); err != nil && err != io.EOF {
			log.Printf("ERROR: Poster JSON decode failed: %v\n", err)
		}
		fmt.Println("Image URL: ", GiveMePoster.Image)

		ctx := e.Request.Ctx
		filmName := ctx.Get("filmName")
		filmUrlPath := ctx.Get("filmUrlPath")
		profile := ctx.Get("profile")

		ratingVal, _ := ctx.GetAny("rating").(float32)
		releaseYear := ctx.Get("releaseYear")
		director := ctx.Get("director")

		// Final FilmDetails struct
		film := models.FilmDetails{
			FilmUrl:    filmUrlPath,
			FilmRating: ratingVal,
			FilmYear:   releaseYear,
			FilmDir:    director,
			FilmPoster: GiveMePoster.Image,
		}

		visitedFilms[filmUrlPath] = film

		// Merge into user data
		existingData := allUsersData[profile]
		existingData.FilmNames = append(existingData.FilmNames, filmName)
		existingData.FilmMap[filmName] = film
		existingData.FilmNamesLen++
		allUsersData[profile] = existingData

		// NEW DEBUG:
		//filmPosterBuffer = GiveMePoster.Image
	})

	// Here's where I can start working to extract a list of the films + ratings:
	// DEBUG: This OnHTML method below is where a lot of the work happens -- BE SURE TO RETURN HERE AND DEBUG IT EXTRA HARD!!!
	c.OnHTML("ul.poster-list", func(h *colly.HTMLElement) {
		// NOTE: I should add guards to make sure this OnHTML method only executes for the proper form page (not the base profile page):
		if profilePageRegex.MatchString(h.Request.URL.String()) {
			fmt.Printf("DEBUG: c.OnHTML(\"ul.poster-list\") prevented from running...\n")
			return
		}

		//var userFilms = make(map[string]models.FilmDetails)
		//var filmTitles []string

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

				if fupExists && fnExists {

					//fmt.Printf("DEBUG: The value of filmName is (%s), filmUrlPath is (%s), and rating is (%.1f)\n", filmName, filmUrlPath, rating)
					//filmTitles = append(filmTitles, filmName) // ADDING FILM TITLE TO MY FILMTITLES SLICE.
					//userFilms[filmName] = models.FilmDetails{FilmUrl: filmUrlPath, FilmRating: rating}
					//currentFilm = filmName

					ctx := colly.NewContext()
					ctx.Put("filmName", filmName)
					ctx.Put("filmUrlPath", filmUrlPath)
					ctx.Put("rating", rating)
					ctx.Put("profile", currentUrl)
					// If we've already visited this film's page, reuse the stored data
					if existingFilm, alreadyVisited := visitedFilms[filmUrlPath]; alreadyVisited {
						existingData := allUsersData[currentUrl]
						existingData.FilmNames = append(existingData.FilmNames, filmName)

						/* EDIT: So it'd be best if I can avoid re-visiting the link for ethical traffic reasons, so reusing existingData
						is ideal for sure. Only, I need this current specific user's rating to be transferred in (from var "rating"): */
						existingDataTweak := models.FilmDetails{
							FilmRating: rating, // <-- that's the tweak I need.
							FilmUrl:    existingFilm.FilmUrl,
							FilmDir:    existingFilm.FilmDir,
							FilmYear:   existingFilm.FilmYear,
							FilmPoster: existingFilm.FilmPoster,
						}

						existingData.FilmMap[filmName] = existingDataTweak // <-- need to tweak this so it's just the existing film but the rating is changed.
						existingData.FilmNamesLen++
						allUsersData[currentUrl] = existingData
					} else {
						// Not visited yet — continue to request it
						err := c.Request("GET", "https://letterboxd.com/film/"+filmUrlPath, nil, ctx, nil)
						if err != nil {
							log.Printf("Visit error for %s: %v\n:", filmName, err)
						}
					}

					//e.Request.Visit("https://letterboxd.com/film/" + filmUrlPath) // NOTE: This will work recursively (we'll return after!)
					// ^ DEBUG: Visiting this link is important for grabbing the release-year of the film, the poster link, and also director name!

					//fmt.Printf("debuggo: The value of filmDirBuffer is (%s) and filmPosterBuffer is (%s)\n", filmDirBuffer, filmPosterBuffer)

					//userFilms[filmName] = models.FilmDetails{FilmUrl: filmUrlPath, FilmRating: rating, FilmYear: filmYearBuffer, FilmDir: filmDirBuffer, FilmPoster: filmPosterBuffer}
				}
			}
		})
		//filmTitlesLen := len(filmTitles)

		// allUsersData[currentUrl] = UserData{FilmNames: filmTitles, FilmNamesLen: filmTitlesLen, FilmMap: userFilms}
		/* DEBUG: ^ This is bad logic on my end. It will overwrite all the data I scraped from previous page scrapings, so I
		need to adjust my code such that I'm appending the data I assign here. */
		/*existingData, exists := allUsersData[currentUrl]
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
		allUsersData[currentUrl] = existingData*/
	})
	// DEBUG: This OnHTML method above is where a lot of the work happens -- BE SURE TO RETURN HERE AND DEBUG IT EXTRA HARD!!!

	// This c.OnHTML method will be what performs pagination (important to have **after** the ul.poster-list method above):
	c.OnHTML(".paginate-nextprev a.next", func(e *colly.HTMLElement) {
		if profilePageRegex.MatchString(e.Request.URL.String()) {
			return
		}
		// Getting the next button:
		nextPage := e.Request.AbsoluteURL(e.Attr("href"))

		/* DEBUG: [BELOW] Honestly this guard below is just a suggestion GPT made for me to count for buggy pagination
		Trying to implement every possible step I can to be a good netizen since Letterboxd has no real policy about web scraping, crawling, etc. */
		if visitedPaginatedPages[nextPage] {
			return
		}
		visitedPaginatedPages[nextPage] = true
		// DEBUG: ABOVE

		fmt.Println("Visiting the next page: ", nextPage)
		e.Request.Visit(nextPage)
	})

	// First iterate through all the provided URLs to inspect their validity:
	for i := 0; i < len(profiles); i++ {
		urlToInspect := "https://letterboxd.com/"
		urlToInspect += profiles[i]
		urlToInspect += "/"
		c.Visit(urlToInspect)
	}

	// Global boolean flag ValidUrls will be set to false if any of the URLs were invalid:
	if !(ValidUrls) {
		fmt.Println("ERROR: One (or more) of the Profile URLs provided led to an invalid page.")
		return models.MutualResponse{}, errors.New("one or more of the URLs provided lead to invalid profiles")
	}

	// Iterate through profiles again, this time to visit the proper pages for the purpose of data scraping:
	for i := 0; i < len(profiles); i++ {
		currentUrl = profiles[i]
		urlToScrape := "https://letterboxd.com/"
		urlToScrape += currentUrl
		urlToScrape += "/films/rated/.5-5/"

		fmt.Printf("The value of urlToScrape => %s\n", urlToScrape)
		c.Visit(urlToScrape)

		userDataVar := allUsersData[profiles[i]]
		if shortestLen > userDataVar.FilmNamesLen {
			shortestLen = userDataVar.FilmNamesLen
			urlWShortest = profiles[i]
		}
	}

	// Now I can iterate through the allUsersData map using profiles:
	for i := 0; i < len(profiles); i++ {
		userDataVar := allUsersData[profiles[i]] // Retrieve the userData val.
		listOfFilms := userDataVar.FilmNames
		theFilmMap := userDataVar.FilmMap
		theDisplayname := userDataVar.Displayname
		theUsername := userDataVar.Username
		theAvatar := userDataVar.AvatarLink

		fmt.Printf("Printing out the list of Films+ for user (URL: %s, Displayname: %s, Avatar: %s)\n", theUsername, theDisplayname, theAvatar)
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
		for _, user := range profiles {
			userDataVar := allUsersData[user]
			if user != urlWShortest {
				hasRating, exists := userDataVar.FilmMap[film]
				if exists {
					mutualDataVar.Title = film
					mutualDataVar.FilmUrl = hasRating.FilmUrl
					mutualDataVar.Ratings[user] = hasRating.FilmRating
					mutualDataVar.FilmDir = hasRating.FilmDir
					mutualDataVar.FilmYear = hasRating.FilmYear
					mutualDataVar.FilmPoster = hasRating.FilmPoster
					ratedCounter += 1
				}
			} else {
				// otherwise, urlWShortest value's profile ratings etc won't show.
				mutualDataVar.Title = film
				mutualDataVar.FilmUrl = userDataVar.FilmMap[film].FilmUrl
				mutualDataVar.Ratings[user] = userDataVar.FilmMap[film].FilmRating
				mutualDataVar.FilmDir = userDataVar.FilmMap[film].FilmDir
				mutualDataVar.FilmYear = userDataVar.FilmMap[film].FilmYear
				mutualDataVar.FilmPoster = userDataVar.FilmMap[film].FilmPoster
			}
		}
		if ratedCounter == (len(profiles) - 1) {
			mutualFilms = append(mutualFilms, mutualDataVar)
		}
	}

	// debug: for-loop that will iterate through the mutualFilms array and print everything out:
	for index, mFilm := range mutualFilms {
		fmt.Printf("The film is: [%s] (index %d)\n", mFilm.Title, index)
		for _, user := range profiles {
			fmt.Printf("- User:(%s) rated it: [%.1f/4] ", user, mFilm.Ratings[user])
		}
		fmt.Printf("\n")
	}

	// Now I should be able to iterate through mutualFilms to check if everything went well:
	fmt.Printf("The value of len(mutualFilms) => %d\n", len(mutualFilms))

	// This final for-loop below is for the frontend integration (populating a MutualResponse interface var to send back to the frontend):
	var response models.MutualResponse
	for _, film := range mutualFilms {
		avg := utils.GetAverage(film.Ratings)
		variance := utils.GetVariance(film.Ratings)

		response.MutualFilms = append(response.MutualFilms, models.MutualResponseFilm{
			Title:      film.Title,
			FilmUrl:    film.FilmUrl,
			FilmYear:   film.FilmYear,
			FilmDir:    film.FilmDir,
			FilmPoster: film.FilmPoster,
			Ratings:    film.Ratings,
			AvgRating:  avg,
			Variance:   variance,
		})
	}
	// EDIT: Extended MutualResponse so I'll also be passing on the information of the users too (to the frontend):
	for _, user := range profiles {
		response.Users = append(response.Users, models.UserSummary{
			Username:    allUsersData[user].Username,
			Displayname: allUsersData[user].Displayname,
			AvatarLink:  allUsersData[user].AvatarLink,
		})
	}
	return response, nil
}

// Middleware function to allow CORS (needed for frontend requests from Vite, since they're hosted on different servers):
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		//w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173") // DEFAULT PORT FOR VITE FRONTEND.
		origin := r.Header.Get("Origin")
		if origin == "http://localhost:5173" { // <-- DEBUG:TO-DO: Yeah I'll need this changed to an environment variable too later.
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		if origin == "https://cute-torte-4c6b97.netlify.app" { // <-- DEBUG:TO-DO: Yeah I'll need this changed to an environment variable too later.
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin") // Ensure caching is handled correctly
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
