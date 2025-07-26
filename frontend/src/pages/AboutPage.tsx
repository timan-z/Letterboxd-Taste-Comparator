
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
                <p id="pageUndertext">(Obviously a fan-project not affiliated with the official Letterboxd team in any way)</p>
            </header>




            <main>



            </main>


        </div>
    )
}

export default AboutPage;
