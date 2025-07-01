// DESIGN-CHOICE: Let's cap the number of accounts you can provide to six. (This is fair -- don't want to go overboard for ethical reasons).
package main

import (
	"fmt"
	"time"

	"github.com/gocolly/colly/v2"
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

// var userFilms = make(map[string]FilmDetails) <-- do this in-function and add them to a slice that keeps track of this stuff! (see line below):
var allUsersData []map[string]FilmDetails

//var filmTitles []string

type FilmDetails struct {
	FilmUrl    string
	FilmRating float32
}

func main() {
	// Declare the collector with supported domains:
	c := colly.NewCollector(colly.AllowedDomains("www.letterboxd.com", "letterboxd.com", "https://letterboxd.com"))
	c.Limit(&colly.LimitRule{
		DomainGlob:  "letterboxd.com/*", // domains that will be affected here.
		Delay:       2 * time.Second,    // Set a delay between requests to these domains.
		RandomDelay: 2 * time.Second,    // Addtional random delay.
	}) // <-- Definitely should add a delay effect so Letterboxd doesn't IP-ban me.

	// Should have these two functions below (just for debugging, lets you know when the crawling starts + if any errors come your way):
	c.OnRequest(func(r *colly.Request) {
		fmt.Printf("Visiting %s\n", r.URL)
	})
	c.OnError(func(r *colly.Response, e error) {
		fmt.Printf("Error while scraping: %s\n", e.Error())
	})

	// let's define URL variables for two profiles (we'll take this as CLI arguments later, and eventually from an HTML Form):
	//urlOne = "jacquesrivette_"
	//urlTwo = "jeanluc_godard"

	// Extracting the username of the profile whose films section you're crawling over (not URL ID):
	c.OnHTML("h1.title-3", func(h *colly.HTMLElement) {
		fmt.Printf("The Letterboxd profile you're crawling over is: %s\n", h.Text)
	})

	// Here's where I can start working to extract a list of the films + ratings:
	c.OnHTML("ul.poster-list", func(h *colly.HTMLElement) {
		var userFilms = make(map[string]FilmDetails)
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
					filmTitles = append(filmTitles, filmName) // ADDING FILM TITLE TO MY FILMTITLES SLICE.
					userFilms[filmName] = FilmDetails{FilmUrl: filmUrlPath, FilmRating: rating}
				}
			}
		})

		/* Once the ForEach loop above has iterated to completion, userFilms will be populated with all the movie data for this particular user,
		and its information can be appended to Slice "allUsersData": */
		//allUsersData = append(allUsersData, userFilms)

	})

	//c.Visit("https://letterboxd.com/jacquesrivette_/films/rated/.5-5/")
}
