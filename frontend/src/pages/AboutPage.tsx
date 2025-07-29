
function AboutPage() {
    return(
        <div id="apWrapper" className="wrapper">
            <div className="navBar">
                <nav>
                    {" "}<a href="/main" style={{textDecoration:"none"}}>Main Page</a> {" "}<a href="/about" style={{textDecoration:"none"}}>About Page</a>
                </nav>
            </div>

            <header id="pageTitle">
                <h1 className="headerEl">
                    <img style={{width:"50px"}} src="../src/assets/images/eustache.png" alt="Picture of Jean Eustache" title="This was originally supposed to be the Letterboxd icon but after reviewing their TOS, might be best to avoid doing that! Instead here's a picture of Jean Eustache when he was (presumably) happy in life."/>
                    "Letterboxd Comparator" ABOUT PAGE
                </h1>
                <p id="pageUndertext" style={{fontSize:"22px"}} >(Obviously a fan-project <b>not affiliated with the official Letterboxd team</b> in any way)</p>
            </header>

            <main>
                {/* About Page <div> #1 - "WHAT IS THIS PROJECT???": */}
                <div className="aboutPageDiv">
                    {/* Header and subheader: */}
                    <h1>WHAT IS THIS PROJECT???</h1>
                    <h2>TL;DR — GO-based Letterboxd crawler for intersecting film rating data</h2>

                    {/* Paragraph blocks: */}
                    <p>
                        This is a (small-scale) full-stack web development project: It is a Go-based web crawler that takes 2-6 (public) Letterboxd profiles, 
                        aggregates their film ratings, and then finds the intersecting data between the profiles. The result is visualized on the frontend using 
                        a table that can be interacted with (filtered, sorted, used to generate a heat map, and so on).
                    </p>

                    <p>
                        I was then inspired by the work of <u>Cheers, Derek</u> (<u>Derek Ahmedzai</u>, who has coded quite a few Letterboxd-related bots and sites) 
                        to write a frontend to interact with this .go script and then render the data it obtains in a creative manner. (That, of course, being the site 
                        that you are currently using — or rather the "<u>Main Page</u>"). As a big film nerd, Letterboxd is a service that I use frequently and have paid 
                        for in the past, so this ended up being a mini-passion project of mine. 
                    </p>

                    <p>
                        <b>Breaking it down:</b><br/><ul>
                        <li>The <u>backend</u> was written in <b>Go (Golang)</b> with the assistance of <b>Colly</b> (Go framework for building web crawlers) for all related to data scraping.</li><br/>
                        <li>The <u>frontend</u> was written using <b>React</b> with <b>TypeScript</b> (another language I used this project as an excuse to familiarize with) by way of <b>Vite</b> with <b>standard CSS</b> for styling.</li></ul>
                        For more a comprehensive breakdown of all the technologies used, visit my public GitHub repo.<br/><br/>
                        As of this moment, I am hosting my frontend on <b>Netlify</b> and my backend on <b>Railway</b> (although I intend to switch the latter to <b>Fly.io</b> at some point).
                    </p>
                </div>

                {/* About Page <div> #2 - "ETHICAL CONCERNS AND CONSIDERATIONS": */}
                <div className="aboutPageDiv">
                    <h1>ETHICAL CONCERNS AND CONSIDERATIONS</h1>
                    <h2>After all — this is a site structured around a web scraper (or crawler) application</h2>

                    <p>This is <b>very important</b> to highlight because this is a web scraper (or crawler) project. Many websites are sensitive about allowing web crawler bots to operate on their domains, particularly in the age of artificial intelligence.</p>
                    
                    <p>As of 7/25/2025, Letterboxd does not have any official policy regarding web crawling or web scraping in its <u>Terms of Use</u> documentation. However, it does expose its <u>robots.txt</u> which does offer explicit indication about what is and is not accepted.</p>

                    <p>This project was built with respect to Letterboxd's robots.txt file (in its current form as of 7/25/2025 — a copy of which is saved in my GitHub repo). In my project, only two routes are ever scraped:</p>
                    <ul>
                        <li><code>/&lt;user&gt;/films/rated/.5-5/</code></li>
                        <li><code>/film/&lt;slug&gt;/</code></li>
                    </ul>

                    <p>None of these routes are disallowed. No user reviews, friend pages, genre filters, or AI training is involved.</p>
                    <p>
                        Crawling is human-triggered only (not automated), with heavy throttling built-in:
                    </p>

                    <pre>
                        {`c.Limit(&colly.LimitRule{
                            DomainGlob:  "*letterboxd./*",
                            Parallelism: 1,
                            Delay:       10 * time.Second,
                            RandomDelay: 10 * time.Second,
                        })
                        c.Async(false)`}
                    </pre>
                    
                    <p>I have taken all precautionary steps to be a good netizen and prevent my GO web crawler from overloading or causing disruption to Letterboxd's site traffic. Further details of which can be seen in the project README file.</p>
                </div>

                {/* About Page <div> #3 - "CONTACT INFORMATION": */}
                <div className="aboutPageDiv">
                    <h1>CONTACT INFORMATION</h1>
                    <h2>If Letterboxd TOS (+ robots.txt) is updated such that my project is no longer TOS compliant.</h2>

                    <p>
                        If you're Letterboxd staff with concerns about this crawler, please reach out to me via the contact email in the repository. I'm happy to shut this down or adapt accordingly.
                    </p>

                    <h2>If any misuse is detected originating from my Go crawler bot</h2>

                    <p>
                        The web crawler backend for this project is currently hosted at:
                        <br/>
                        <b>https://letterboxd-mutual-ratings-scraper-production.up.railway.app/</b> {/* <--NOTE:+TO-DO:+DEBUG: When I switch to Fly.io, I must change this!!! */}
                    </p>

                    <p>
                        If you are the Letterboxd team and observe any scraping traffic from this
                        domain or server that is abusive or misaligned with our ethics policy outlined above,
                        <b>please contact me immediately</b> via the email address listed below. I will temporarily
                        suspend the backend and investigate the issue.
                    </p>
                    <p>
                        If scraping is observed from another IP, domain, or server using a similar User-Agent or logic,
                        please note that this code is open-source and may have been repurposed by third parties.
                        Regardless, I am happy to collaborate on mitigation efforts.
                    </p>

                </div>

            </main>

        </div>
    )
}

export default AboutPage;
