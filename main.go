package main

import (
	"fmt"

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

	// let's define URL variables for two profiles (we'll take this as CLI arguments later, and eventually from an HTML Form):
	//urlOne = "jacquesrivette_"
	//urlTwo = "jeanluc_godard"

	// Extracting the username of the profile whose films section you're crawling over (not URL ID):
	c.OnHTML("h1.title-3", func(h *colly.HTMLElement) {
		fmt.Printf("The Letterboxd profile you're crawling over is: %s\n", h.Text)
	})
	// Here's where I can start working to extract a list of the films + ratings:
	c.OnHTML("ul.poster-list", func(h *colly.HTMLElement) {

		/*h.DOM.find("li.poster-container").Each(func(i int, s * goquery.Selection) {
		})*/
		//selection := h.DOM
		//childNodes := selection.Children().Nodes
		//fmt.Printf(selection.Text())
		//fmt.Printf(childNodes.Text())
		// li.poster-container
		//selection := h.DOM
		//childNodes := selection.Children().Nodes
		//fmt.Printf(selection)
		//fmt.Printf(childNodes)
	})

	// Should have these two functions below (just for debugging, lets you know when the crawling starts + if any errors come your way):
	c.OnRequest(func(r *colly.Request) {
		fmt.Printf("Visiting %s\n", r.URL)
	})
	c.OnError(func(r *colly.Response, e error) {
		fmt.Printf("Error while scraping: %s\n", e.Error())
	})
	// We will need to tell c what criteria to watch out for...
	/*c.OnHTML("div.myclass", func(h *colly.HTMLElement) {
	})*/
	c.Visit("https://letterboxd.com/jacquesrivette_/films/rated/.5-5/")
}
