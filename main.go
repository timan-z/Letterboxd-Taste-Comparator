package main

import (
	"fmt"
	"time"

	"github.com/gocolly/colly/v2"
)

/* Colly is event-based. So we're going to need to register functions that are triggered
when our crawler sees specific things (i.e., HTML-related). */

func main() {
	/* when we want to make a scraper, first task is to make a collector.
	The collector will accept a list of options that we can pass to it.
	- the AllowedDomains option will tell c what domains you are allowed to scrape.
	*/
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
		h.ForEach("li.poster-container", func(i int, e *colly.HTMLElement) {
			//fmt.Printf("DEBUG: How many lines? 72 right?\n")
			fmt.Printf("DEBUG: Currently iterating through <li> #%d\n", i)

			/* Inside each <li class="poster-container"> element will be two children:
			[1] - <div> [2] - <p>, you can search into <div> to extract the film name and release year, <p> for the rating...*/
			liElem := e.DOM
			childNodes := liElem.Children().Nodes

			html, _ := e.DOM.Html()
			fmt.Println("Debug: The <li> html is => ", html)

			// Expect that there are exactly two children elements. Need to account for expected DOM, code is fragile in that respect.
			if len(childNodes) == 2 {
				//divElem := liElem.Find("div").First()
				// Latching onto this <div> element, we can just scan through its entire depth and extract what I want (<a> element with data-original-title attr):
				//aElem := divElem.Find("div > a[data-original-title]").First()
				//aElem := e.DOM.Find("div > div > a[data-original-title]").First()
				//filmTitleYear, exists := aElem.Attr("data-original-title") // returns the value and ig a boolean for if it exists or not.
				/*if exists {
					fmt.Printf("Value of filmTitleYear %s\n", filmTitleYear)
				}*/

				divElemOne := liElem.Find("div").First()
				divElemTwo := divElemOne.Find("div").First()
				//aElem := divElemTwo.Find("a[data-original-title]").First()
				aElem := divElemTwo.Find("a[href]").First()
				filmTitleYear, exists := aElem.Attr("href")

				if exists {
					fmt.Printf("The value of filmTitleYear %s\n", filmTitleYear)
				} else {
					//fmt.Printf("Nah still not here.")
				}
			}
		})
	})

	c.Visit("https://letterboxd.com/jacquesrivette_/films/rated/.5-5/")
}
