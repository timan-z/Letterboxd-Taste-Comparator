# Letterboxd Taste Comparator
<u>Version</u>: <b>1.0</b> (<i>To be updated contingent on future changes to the Letterboxd TOS and drastic structural alterations to the Letterboxd site DOM</i>)<br>
<u>Author</u>: <b>Timan Zheng</b><br>
<u>Date</u>: <b>7/25/2025</b><br>
<u>Description</u>: <b>This is a (small-scale) full-stack web development project: It is a GO-based web crawler that iterates over a user-input list of (public) Letterboxd profiles, aggregates their film ratings, and then finds the intersecting data between the profiles — if applicable. That mutual data is then displayed on the front-end in a table where it can be interacted with (filtered, sorted, converted to a heat map, and so on).</b>

[<b>Skip to Project Ethics Section</b>](#project-ethics---important)

## Overview
As mentioned, this lightweight Letterboxd web crawler/scraper is built in GO, paired with a React TypeScript frontend for visualizing mutual film ratings among multiple accounts. This crawler handles pagination, aggregates and intersects data manually in GO. From the frontend, users can input 2-6 Letterboxd usernames and generate:
- A sortable/filterable table of the intersected film ratings.
- A statistical breakdown of the data (variance, average rating among <i>provided</i> users).
- A heatmap visualization of the mutual film ratings with minor visual customization.

## Project Structure (Simplified)
```
letterboxd-mutual-scraper/
│
├── /frontend/src         # React-TS frontend via Vite
│   ├── /components/      # Table + Profile input logic
│   ├── /pages/           # MainPage.tsx and AboutPage.tsx
│   ├── /utility/         # API wrappers, types
│   ├── /assets/
|   |   ├──/sampleData/   # Bypass-scraping test data
│   └── main.tsx, App.tsx # Routing and base setup
│
├── /backend/             # Go web server (Colly-based)
│   ├── /models/          # Request/response structs
│   ├── /utility/         # Stats utilities (avg, variance, sort)
│   └── main.go           # Scraper logic and HTTP handlers
│
├── /testData/            # JSON samples for table injection
└── README.md
```
## How It Works
1. <b>Input Phase</b>: The user enters 2–6 Letterboxd usernames. After validation, a POST request is sent to the Go backend.

2. <b>Backend Scraping (Golang + Colly)</b>: The Go server uses [Colly](https://github.com/gocolly/colly) to:
   1. Validate and traverse each profile’s `/films/rated/.5-5/` pages.
   2. Extract titles, ratings, release years, directors, and poster URLs.
   3. Cross-reference data to find mutually rated films.
   4. Compute per-film statistics (average, variance).
   5. Return this data as a JSON response to the frontend.

3. <b>Frontend Rendering (React + TanStack Table + Nivo HeatMap)</b>:
   - A Dynamic TanStack Table with filter/sort support.
   - Optional Nivo-based heatmap visualization for comparing rating patterns

The process of backend scraping relies entirely on the current Letterboxd DOM structure and thus it is brittle. Thus, on the frontend, I have provided the option to skip the backend call and populate the TanStack table with test data to account for future DOM breakage or offline demos.

<b>Usage of the site</b> pretty much follows this pattern. The UI is intuitive enough that navigating the table and heatmap controls, accessing the test data, should come naturally. It should be noted that the time the scraping process takes in step 2 may scale in length dependent on the film count of the profiles provided.

## Local Development
- Host the frontend with `npm run dev` and the backend with `go run main.go`.
- Add a `.env` file to the `/backend` directory with `CORS_ALLOWED_ORIGIN` set to where the frontend is hosted (locally).
- Add a `.env` file to the `/frontend` directory with `VITE_API_BASE` set to where the backend is hosted (locally).

## Hosting
- Currently hosting the <b>frontend</b> on <b>Netlify</b> at: https://letterboxd-comparator.netlify.app/
- Currently hosting the <b>backend</b> on <b>Railway</b> at: https://letterboxd-taste-comparator.up.railway.app/

<b>NOTE</b>: I intend to switch the backend hosting domain to Fly.io eventually.

## Technologies and Skills Demonstrated
- <b>Golang</b>
  - Advanced web scraping with Colly
  - Structs, interfaces, and type-safe JSON APIs
- <b>React + TypeScript</b>
  - Typed props and modular components
  - TanStack Table v8
  - Nivo charting (heatmap)
- <b>Frontend/Backend integration</b>
  - RESTful API design
  - Environment-aware CORS setup
  - Monorepo project structuring
- <b>Deployment</b>
  - Netlify (frontend)
  - Railway / Fly.io (backend, CORS-aware)
- <b>Ethical Scraping Practices</b>
   - See the [Project Ethics section](#project-ethics---important).

## Project Ethics - IMPORTANT!!!
This is <b>very important</b> to highlight because this is a web crawler project. Many websites are sensitive about allowing web crawler bots to operate on their domains, particularly in the age of artificial intelligence. For instance, a website similar to Letterboxd, RateYourMusic has a firewall set up explicitly to block crawlers and will only allow access with explicit permission granted. In this respect, <b>Letterboxd is not so strict in that there is no explicit mention of policies regarding web crawling or scraping</b> in [Letterboxd's Terms of Use documentation](https://letterboxd.com/legal/terms-of-use/) <b>as of 7/25/2025</b>.

However, Letterboxd <i>does</i> publicize its [robots.txt](https://letterboxd.com/robots.txt) file, which does offer explicit indication about what is acceptable usage of web crawler bots over its domain. Before discerning its contents, <b>it is important to note that its content is subject to change</b> — and with any and all future changes, my project must adapt accordingly (<b>and if absolutely necessary, the GO-based crawling component will be taken offline</b>). 

This project was built with the robots.txt file present on their site as of 7/25/2025, a copy of which will be included in my project directory for full transparency.

### Letterboxd's robots.txt Analysis (and how my project comforms to its standards):
Letterboxd does explicitly disallow certain <i>known</i> web crawler bots such as <b>GPTBot</b>, <b>ClaudeBot</b>, <b>ICC-Crawler</b>, <b>Google-Extended</b>, and many more (essentially all for the reason that they are AI Data Scrapers). Which you can see many of at the top of the file:
```
# AI Data Scraper
# https://darkvisitors.com/agents/gptbot

User-agent: GPTBot
Disallow: /
```
However, these restrictions <b>do not</b> apply to general-purpose bots although there are explicit rules set out for said bots such as the one that I have created in GO. This comes in the form of a list of routes that are disallowed <i>presumably with some firewall</i> (seen at the bottom of the robots.txt file):
```
# All other crawlers
User-agent: *
Disallow: /*/by/*                     # sorting options
Disallow: /*/popular/this/*           # popularity sorting options
Disallow: /*/on/*                     # availability options
Disallow: /*/tag/*                    # Members? tag lists
Disallow: /*/genre/*                  # Films by genre
Disallow: /*/country/*                # Films by country
Disallow: /*/language/*               # Films by language
Disallow: /*/decade/*                 # Films by decade
Disallow: /films/year/*               # Films by year
Disallow: /films/*/year/*             # Films by year
Disallow: /films/*/size/large/*       # Films with large posters (and therefore stats)
Disallow: /*/friends/*                # stuff grouped for users' friends
```
Knowing the structure of Letterboxd's routes, it seems that these particular routes are primarily disabled to reduce traffic to pages that can be aggregated in <b>particularly</b> high volume (the routes beginning with `/films/` quite litterally refer to the <i>entire</i> Letterboxd film database filtered through conditions like `/decade/*`).

### My GO web crawler bot will only interact with pages of two forms (with pagination in mind for the first one):
1. `https://letterboxd.com/<username>/films/rated/.5-5/`
2. `https://letterboxd.com/film/<slug>/`

<b>Neither of these routes are explicitly disallowed by the robots.txt file</b>, nor is there any sorting or explicit targeting of popularity, tags, or anything like that. All that's being pulled is raw data (relating to film titles, years, directors, and so on) from a user's `*/films/rated/` page. (Either way, I <i>personally</i> feel that numerical film ratings <b>from visibly public profiles</b> are fairly impersonal and ethical to aggregate — unlike, say, written reviews — but <b>if I'm wrong, Letterboxd staff please contact my business email and let me know</b>). I should also note that "nothing is really done" with this data once the intersection and frontend visualization is performed (the data isn't even cached anywhere).

<b>Additionally</b>, this GO web crawler is user-initiated. It will only crawl and scrape when a human user interacts with the frontend, gives it a list of usernames, and instructs the backend crawler to perform its function. <b>This is not automated crawling or data mining</b>. Thus, this project does <b>not</b> "hammer" the site at scale.

Furthermore, I have taken all precautionary steps to be a good netizen and prevent my GO web crawler from overloading or causing disruption to Letterboxd's site traffic. (<i>Perhaps at the expense to the user experience of my site, but this is just a resume project after all. It will never be shared commercially outside of GitHub or wherever most film people would never venture</i>).

### Configuring My GO Web Crawler to Respect Site Traffic (Throttle Requests, Reduce Frequency, and so on):

My GO backend uses Colly, a Golang framework for building web scrapers to, well, build the web scraper. It also offers a variety of ways in which I can configure it to slow down request frequency. I wanted to make this project to be a little of a nuisance as it humanly could be for my target (Letterboxd).

<b>Here is how I configured my Colly collector</b>:
```
c.Limit(&colly.LimitRule{
	DomainGlob:  "*letterboxd./*",
	Parallelism: 1,
	Delay:       10 * time.Second,
	RandomDelay: 10 * time.Second,
})
c.Async(false)
```
- With `Parallelism: 1`, I essentially disable concurrency.
- With `Delay:` and `RandomDelay:`, I added delay and jitter between requests to slow down the crawling process.
- With `c.Async(false)`, I disabled asynchronous crawling, slowing the crawl down even further.

<b>Additionally</b>, I set measures in place within my GO code to avoid redundant parsing and thus <b>reduce bandwidth consumption</b>. For example:
- In <b>main.go</b>, using variable `visitedPaginatedPages map[string]bool`, I skip revisiting paginated pages (which is something that will inevitably occur when scraping rating data if there is indeed mutual film data between users):
```
if visitedPaginatedPages[nextPage] {
   return
}
visitedPaginatedPages[nextPage] = true
e.Request.Visit(nextPage)
```
- Skipping DOM parsing on non-target pages:
```
if !(filmPageRegex.MatchString(e.Request.URL.String())) {
    return
}
```
- My error-handling logic detects invalid profile URLs provided by the user and terminates scraping if any of them are detected invalid. This is a proactive measure to preventing "hammering" the server with invalid or malformed requests.
```
if !(ValidUrls) {
   fmt.Println("ERROR: One (or more) of the Profile URLs provided led to an invalid page.")
   return models.MutualResponse{}, errors.New("one or more of the URLs provided lead to invalid profiles")
}
```
- Even my limiting of profiles the user can provide relates to the proactive reduction of bandwidth, scraping volume, concurrency load, and backend pressure. I am sure that Railway/Fly.io appreciate this.

<b>ONE LAST-MINUTE ADDITION:</b> I have implemented locking and throttling for concurrent requests in my `main.go` code on my backend. (And this is recognized by my frontend). That is, I have made it so that, across all the clients that visit the frontend, there can be one scraping request made to the backend <b>ONE AT A TIME</b> (done for ethical reasons to further reduce traffic to Letterboxd).<br>

I have implemented this with the following code:
```
var scrapeMutex sync.Mutex
```
and
```
if !scrapeMutex.TryLock() {
		http.Error(w, "The Letterboxd Comparator Scraper/Crawler Bot is currently in use! Please try again later!", http.StatusTooManyRequests)
		return
}
```



## Contact Information

If you're Letterboxd staff with concerns about this project, please reach out to me via the contact email below. I am absolutely happy to shut down the backend portion of this project and/or adapt accordingly with changes to the TOS, robots.txt file, and so on. Thank you.

<b>My professional email:</b>timanzproper@gmail.com<br>
<b>My GitHub:</b> https://github.com/timan-z<br>
<b>My LinkedIn:</b> https://www.linkedin.com/in/timan-zheng/

The web crawler backend for this project is currently hosted at:
https://letterboxd-taste-comparator.up.railway.app/

If you are the Letterboxd team and observe any scraping traffic from this domain or server that is abusive or misaligned with our ethics policy outlined above, please contact me immediately via the email address listed above. I will temporarily suspend the backend and investigate the issue.

<b>IMPORTANT NOTE</b>: If scraping is observed from another IP, domain, or server using a similar User-Agent or logic, please note that this code is open-source and may have been repurposed by third parties. Regardless, I am happy to collaborate on mitigation efforts.
