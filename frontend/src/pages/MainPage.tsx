import React, {useState} from "react";

/* As a reference, following the HTML page structure of: https://letterboxd-besties.cheersderek.com/ */

function MainPage() {
    const [userUrls, setUserUrls] = useState(["", ""]);

    return(
        <div className="wrapper">
            <header>
                <h1 className="mpTitle">Letterboxd Taste Comparator</h1>
                <p>Compare your mutual film ratings with other Letterboxd profiles!</p>
            </header>
            
            <main>
                {/* This first <div> will be for the form where the user types and inputs their profile URLs, is able to 
                add more and subtract profile input boxes (contingent on the current amount, min of 2 and max of 6), etc. */}
                <div>

                </div>
                


                
                {/*The second <div> will be for the 
                <div>
                </div> */}
            </main>
            
        </div>
    )
}

export default MainPage;
