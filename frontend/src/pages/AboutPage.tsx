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
                    <img style={{width:"50px"}} src="/assets/images/eustache.png" alt="Picture of Jean Eustache" title="This was originally supposed to be the Letterboxd icon but after reviewing their TOS, might be best to avoid doing that! Instead here's a picture of Jean Eustache when he was (presumably) happy in life."/>
                    "Letterboxd Comparator" ABOUT PAGE
                </h1>
                <p id="pageUndertext" style={{fontSize:"22px"}} >(Obviously a fan-project <b>not affiliated with the official Letterboxd team</b> in any way)</p>
            </header>

            <main>
                {/* About Page <div> #0 - Just going to have a small Table of Contents sign below the header (last-min addition): */}
                <div className="apTableOfContents">
                    <h3>Table of Contents:</h3>
                    <ul>
                        <li>WHAT IS THIS PROJECT???</li>
                        <li>ETHICAL CONCERNS AND CONSIDERATIONS [!]</li>
                        <li>CONTACT INFORMATION</li>
                    </ul>
                </div>

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
                        I was then inspired by the work of <a href="https://cheersderek.com/" target="_blank">Cheers, Derek</a> (<a href="https://derekahmedzai.com/" target="_blank">Derek Ahmedzai</a>, who has coded quite a few Letterboxd-related bots and sites) 
                        to write a frontend to interact with this .go script and then render the data it obtains in a creative manner. As a big film nerd, Letterboxd
                        is a service that I use frequently and even have paid for in the past, so this ended up being a mini-passion project of mine. Having said that,
                        at the end of the day, this is just a <b>resume project</b> that I have no intentions of sharing on social media, "film twitter", or whatever.
                    </p>

                    <p>
                        <b>Breaking it down:</b><br/><ul>
                        <li>The <u>backend</u> was written in <b>Go (Golang)</b> with the assistance of <b>Colly</b> (Go framework for building web crawlers) for all that is related to data scraping.</li><br/>
                        <li>The <u>frontend</u> was written using <b>React</b> with <b>TypeScript</b> (<i>another language I used this project as an excuse to familiarize with</i>) by way of <b>Vite</b> with <b>standard CSS</b> for styling.</li></ul>
                        For more a comprehensive breakdown of all the technologies used, visit my <a href="https://github.com/timan-z/Letterboxd-Taste-Comparator" target="_blank">public GitHub repo</a> (see: README).<br/><br/>
                        As of this moment, I am hosting my frontend on <b>Netlify</b> and my backend on <b>Railway</b> (although I intend to switch the latter to <b>Fly.io</b> at some point).
                    </p>
                </div>

                {/* About Page <div> #2 - "ETHICAL CONCERNS AND CONSIDERATIONS": */}
                <div className="aboutPageDiv">
                    <h1 style={{color:"red"}} >ETHICAL CONCERNS AND CONSIDERATIONS</h1>
                    <h2>After all — this is a site structured around a web scraper (or crawler) application</h2>

                    <p>This is <b>very important</b> to highlight because this is a web scraper (or crawler) project. Many websites are sensitive 
                    about allowing web crawler bots to operate on their domains, particularly in the age of artificial intelligence.
                    (For instance, a similar site RateYourMusic has a firewall set up to automatically block all web scraping and crawling bots).</p>
                    
                    <p>As of 7/25/2025, Letterboxd does <b>not</b> have any official policy regarding web crawling or web scraping in its <a href="https://letterboxd.com/legal/terms-of-use/" target="_blank">Terms of Use</a> documentation. 
                    However, it does expose its <a href="https://letterboxd.com/robots.txt" target="_blank">robots.txt</a> which <b>does</b> offer explicit indication about what is and is not accepted.</p>

                    <p>This project was built with respect to Letterboxd's robots.txt file 
                    (in its current form as of 7/25/2025 — <a href="https://github.com/timan-z/Letterboxd-Taste-Comparator/blob/main/robots-7-25-2025.txt" target="_blank">
                    a copy of which is saved in my GitHub repo</a>). In my project, only two routes are ever scraped:</p>
                    
                    <ol className="aboutPageList">
                        <li><code style={{fontSize:"16px"}}>/&lt;user&gt;/films/rated/.5-5/</code></li>
                        <li><code style={{fontSize:"16px"}}>/film/&lt;slug&gt;/</code></li>
                    </ol>

                    <p style={{color:"red"}}>Neither of these routes are disallowed. No user reviews, friend pages, genre filters, or AI training is involved.</p>
                    <p>
                        Crawling is human-triggered only (not automated), with <b>heavy throttling</b> built-in (for <i>instance</i>):
                    </p>

                    <pre style={{padding:"10px", fontSize:"14px", boxShadow: "-5px -5px 10px 0px rgba(0, 0, 0, 0.5)"}} ><code>{`
                    // Disabling Async when declaring the Colly to reduce traffic load (ethics!)
                    c := colly.NewCollector(colly.AllowedDomains("www.letterboxd.com", ...), colly.Async(false))
                    c.Limit(&colly.LimitRule{
                        DomainGlob:  "*letterboxd./*", // domains that will be affected here.
                        Parallelism: 1,                // (1 so I'm disabling concurrency here).
                        Delay:       10 * time.Second, // Set a 10s delay between requests to these domains.
                        RandomDelay: 10 * time.Second, // Addtional random delay!!! (to be extra good netizen!)
                    })`}</code></pre>
                 
                    <p>
                        You will notice that the scraping may take long depending on the rated-film count of the profiles involved. 
                        This is because I have done as much as I can to make the web crawling mimic human-like behavior as opposed to that of a bot. 
                        I have taken all precautionary steps to be a good netizen and prevent my GO web crawler from overloading or causing 
                        disruption to Letterboxd's site traffic. Further details of which can be seen in the project README.
                    </p>
                </div>

                {/* About Page <div> #3 - "CONTACT INFORMATION": */}
                <div className="aboutPageDiv">
                    <h1>CONTACT INFORMATION</h1>
                    <h2>If Letterboxd TOS (+ robots.txt) is updated such that my project is no longer TOS compliant.</h2>

                    <div className="apTableOfContents">
                        <h3>Contact Me Here:</h3>
                        <ul>
                            <li><b>Email: </b>timanzproper@gmail.com</li>
                            <li><b>GitHub: </b>https://github.com/timan-z</li>
                            <li><b>LinkedIn: </b>https://www.linkedin.com/in/timan-zheng/</li>
                        </ul>
                    </div>

                    <p style={{color:"red"}}>
                        If you're Letterboxd staff with concerns about this crawler, please reach out to me via the contact email above. I am absolutely happy to shut down the backend portion of this project and/or adapt accordingly. Thank you.
                    </p>

                    <h2>If any misuse is detected originating from my Go crawler bot</h2>

                    <div className="apTableOfContents">
                        <p>
                            The web crawler backend for this project is currently hosted at:
                            <br/>
                            <b>https://letterboxd-taste-comparator.up.railway.app/</b> {/* <--NOTE:+TO-DO:+DEBUG: When I switch to Fly.io, I must change this!!! */}
                        </p>
                    </div>

                    <p>
                        If you are the Letterboxd team and observe any scraping traffic from this
                        domain or server that is abusive or misaligned with our ethics policy outlined above,{" "}
                        <b>please contact me immediately</b> via the email address listed above. I will temporarily
                        suspend the backend and investigate the issue.
                    </p>

                    <p>
                        <b>IMPORTANT NOTE:</b> If scraping is observed from another IP, domain, or server using a similar User-Agent or logic,
                        please note that this code is open-source and may have been repurposed by third parties.
                        Regardless, I am happy to collaborate on mitigation efforts.
                    </p>

                </div>
            </main>
        </div>
    )
}

export default AboutPage;
