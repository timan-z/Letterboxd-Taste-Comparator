import React, {useState} from "react";
import ProfileInputList from "../components/ProfileInputList";

/* As a reference, following the HTML page structure of: https://letterboxd-besties.cheersderek.com/ */

function MainPage() {
    const [profileUrls, setProfileUrls] = useState(["", ""]);

    return(
        <div className="wrapper">
            <header>
                <h1 className="mpTitle">Letterboxd Taste Comparator</h1>
                <p>Compare your mutual film ratings with other Letterboxd profiles!</p>
            </header>
            
            <main>
                {/* [1] - This first <div> will be for the form where the user types and inputs their profile URLs, is able to 
                add more and subtract profile input boxes (contingent on the current amount, min of 2 and max of 6), etc. */}
                <div>
                    <ProfileInputList profileUrls={profileUrls} setProfileUrls={setProfileUrls}/>
                    <div>
                        <button>Find Mutual Ratings</button>    
                        {/* ^ DEBUG: Don't worry about handling this yet... (obviously the button that will
                        send the scraping request to my Go backend etc etc). */}
                    </div>
                </div>
                
                {/* [2] - This second <div> will basically be an expandable "informative box" about dummy values that
                you can use. It'll just be a button that says "Use Dummy Info" and when you click it, it expands a box with
                the profile URL links for my six Cahiers du Cinéma archival accounts.
                
                This should be moved to the "About Me Page" after, but these dummy accounts will be a preventative feature
                for the scenario where the official Letterboxd page HTML DOM is radically transformed, and my Go-based scraping
                logic fails. My counter-measure would be using these Dummy Letterboxd accounts (**my own** accounts) and manually
                storing their rating data within the project directory somewhere, then -- and I'll need to adjust my Go code for this --
                when their specific URLs are encountered, instead of any scraping, that dummy data is used instead. */}
                <div>
                    INSERT BUTTON-TO-EXPANDABLE BOX W/ INFO ABOUT DUMMY PROFILE VALUES.
                </div>

                {/* [3] - The third <div> will be the "Output Area" table and I guess I'll need to think more about how I'll have everything work.

                So it'll be a table that displays a vertically scrollable list of all the mutual films rated by the input list of users.
                - Each row will be for a film (w/ film title, poster, rating from each user, official avg rating, input avg rating, and variance. Also link to LB page ofc).
                
                I obviously want it so that this table is interactable. I want a search-bar that lets you dynamically filter the table in
                real-time and view films based on string search (keep it simple, just limit this to the title displayed on LB itself).
                - Then I obv want (dropdown?) buttons (and sliders?) for the Sorting/Filtering features of the site.
                - You can sort by [1] Average Rating (input) [2] Variance [3] Title [4] User Rating (DEBUG: maybe also official rating? We'll see).
                - You can filter by [1] Threshold above [2] Threshold below [3] USer-specific filters
                */}
                <div>
                    THIS IS WHERE THE OUTPUT TABLE WILL GO. (Only appears when values are fetched?)
                </div>
                
                {/* [4] I've left out the Heatmap but below the output table, maybe have a "Generate Heatmap" button
                and I can have it generate in the <div> below. (Look for some framework out there that can make a heatmap on the fly). */}
                <div>
                    HEAT MAP MAYBE???
                </div>
            </main>            
        </div>
    )
}

export default MainPage;
