// BASICALLY JUST TEST CODE FOR FIGURING OUT GETTING ARGUMENTS FROM CLI / VERIFYING THAT THE URLS ACTUALLY LEAD TO LEGITIMATE PAGES!!!
package main

import (
	"fmt"
	"os"
	"regexp"
	"time"

	"github.com/gocolly/colly/v2"
)

var currentUrl string

var userUrls []string // <-- store the user urls here (slice of strings).

var profilePageRegex = regexp.MustCompile(`^https://letterboxd\.com/[^/]+/?$`)

var ValidUrls bool = true // <-- global flag that keeps track of if URLs passed by CLI (eventually HTML form) are valid (true by default).

func main() {
	fmt.Println("All arguments:", os.Args)
	/* so everything after the "[filename].exe" will be separated by whitespace.
	Thus, I can ideally tokenize os.Args based on whitespace. I can count everything that comes after the
	first index, make sure the count > 1 and < 7. (Eventually, I want to verify that these profile URLs provided lead to valid pages). */

	fmt.Println("No tokenizing needed: ((", os.Args[1:], "))") // Guess I don't need to tokenize, I can just do this!
	/*fmt.Println("Name 1: ", os.Args[1])
	fmt.Println("Name 2: ", os.Args[2])
	fmt.Println("Name 3: ", os.Args[3])*/
	fmt.Println("The length of os.Args => ", len(os.Args))

	/* So, I want the number of arguments provided to be greater than 1 but less than 7 (minimum 2 users, maximum 6).
	So, I should reject the CLI input if there wasn't enough: */
	if !(len(os.Args) > 2 && len(os.Args) < 8) {
		fmt.Println("ERROR: Must provide at least two Profile URLs OR there is a maximum limit of six.")
		return
	}

	// so i just need to iterate from 1 up until len(os.Args):
	for i := 1; i < len(os.Args); i++ {
		fmt.Printf("Name %d: %s\n", i, os.Args[i])
		userUrls = append(userUrls, os.Args[i])
	}

	/* Now I want to verify that the URLs provided lead to proper accounts (create Collector -> visit webpage, etc).
	I'll be able to do this by visiting the site, and then checking to see if <title>'s Text value = "Letterboxd - Not Found" or not. */

	c := colly.NewCollector(colly.AllowedDomains("www.letterboxd.com", "letterboxd.com", "https://letterboxd.com"))
	c.Limit(&colly.LimitRule{
		DomainGlob:  "*letterboxd./*", // domains that will be affected here.
		Parallelism: 1,                // "parallelism refers to the ability to process multiple web requests concurrently."
		Delay:       5 * time.Second,  // Set a delay between requests to these domains.
		RandomDelay: 5 * time.Second,  // Addtional random delay.
	}) // <-- Definitely should add a delay effect so Letterboxd doesn't IP-ban me.

	// MY OBLIGATORY [1] ON-REQUEST AND [2] ON-ERROR METHODS:
	c.OnRequest(func(r *colly.Request) {
		fmt.Printf("Visiting %s\n", r.URL)
	})
	c.OnError(func(r *colly.Response, e error) {
		fmt.Printf("Error while scraping: %s\n", e.Error())
		cWebPageUrl := r.Request.URL.String()
		fmt.Printf("Error: The value of cWebPageUrl is %s\n", cWebPageUrl)

		if profilePageRegex.MatchString(cWebPageUrl) && e.Error() == "Not Found" {
			fmt.Printf("Invalid Letterboxd Profiles are caught auto.\n")
			ValidUrls = false
		}
	})

	// Extracting the [username] and [film avatar link] of the profile whose films section you're crawling over:
	// NOTE: Probably will make the OnHTML("h1.title-3") method obsolete, so remove that afterwards.
	// NOTE: ^ Maybe position this after the OnHTML("ul.poster-list") method?
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
		}
	})

	// MY METHOD FOR CHECKING IF THE <title> TAG GOT TEXT VALUE OF "Letterboxd - Not Found":
	// (ALL UNINTELLIGIBLE URLS WILL MAP TO THE "LETTERBOXD - NOT FOUND" PAGE SO I CAN ASSURE THIS IS SOUND):
	c.OnHTML("title", func(e *colly.HTMLElement) {
		/* DEBUG: I will be integrating all this code in test.go back into main.go file, so need to make sure this OnHTML
		will not trigger for when I'm scraping actual ratings (only when I'm traversing profiles): */
		cWebPageUrl := e.Request.URL.String()

		if profilePageRegex.MatchString(cWebPageUrl) {
			fmt.Println("ACCEPTED WEBPAGE: ", cWebPageUrl)
			// DEBUG: Here I want to investigate the <title> tag...
			titleElem := e.DOM.Find("title").First()
			titleText := titleElem.Text()
			if titleText == "Letterboxd - Not Found" {
				ValidUrls = false
			}
		}
	})
	// ^ UPDATE: Nevermind, seems like I don't need this OnHTML function at all? c.OnError will catch failed traversal.

	// This OnHTML method will target any <a class="next"> element that's within an element with class "paginate-nextprev"
	c.OnHTML(".paginate-nextprev a.next", func(e *colly.HTMLElement) {
		if profilePageRegex.MatchString(e.Request.URL.String()) {
			return
		}
		// Getting the next button:
		nextPage := e.Request.AbsoluteURL(e.Attr("href"))
		fmt.Println("Visiting the next page: ", nextPage)
		e.Request.Visit(nextPage)
	})

	// We will iterate through userUrls now, and for each URL, we will visit them to see if c.OnHTML("title") catches an error or not.
	for i := 0; i < len(userUrls); i++ {
		urlToInspect := "https://letterboxd.com/"
		urlToInspect += userUrls[i]
		urlToInspect += "/"

		c.Visit(urlToInspect)
	} // <-- Once this for-loop iterates completely, the value of ValidUrls should be checked.
	if ValidUrls {
		fmt.Println("The value of ValidUrls is True.")
	} else {
		fmt.Println("ERROR: The value of ValidUrls is False.")
		return
	}

	// Write some code to iterate through the pages now until I reach the end!

	// Iterate through userUrls again, this time to visit the proper pages for the purpose of data scraping:
	for i := 0; i < len(userUrls); i++ {
		currentUrl = userUrls[i]
		urlToScrape := "https://letterboxd.com/"
		urlToScrape += currentUrl
		urlToScrape += "/films/rated/.5-5/"

		fmt.Printf("The value of urlToScrape => %s\n", urlToScrape)
		c.Visit(urlToScrape)
	}

}
