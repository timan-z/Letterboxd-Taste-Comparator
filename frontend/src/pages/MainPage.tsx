import React, {useState, useEffect} from "react";
import ProfileInputList from "../components/ProfileInputList";
import {getMutualData} from "../utility/api.ts";  // fetch call
import testData from "../assets/testData.json";

/* As a reference, following the HTML page structure of: https://letterboxd-besties.cheersderek.com/ */

function MainPage() {

    type User = {
        username: string;
        displayname: string;
        avatarLink: string;
    }
    type MutualFilm = {
        title: string;
        filmUrl: string;
        filmYear: string;
        filmDir: string;
        filmPoster: string;
        ratings: Record<string, number>;
        avgRating: number;
        variance: number;
    }

    const [profileUrls, setProfileUrls] = useState(["", ""]);
    const [loading, setLoading] = useState(false);  // state var for when (TO-DO: pair with loading animation? -- that temp freezes webpage?)
    
    // These state variables below are for containing the data extracted from the fetch call.
    const [results, setResults] = useState(null);
    const [usersData, setUsersData] = useState <User[] | null>(null);
    const [mutualFilms, setMutualFilms] = useState <MutualFilm[] | null>(null);

    // DEBUG: Catches when changes are made to {loading} and displays it - [That's all for now]:
    useEffect(() => {
        if(loading) {
            console.log("RAAAH: This UseEffect hook best be triggered DURING the getMutualFilmData function call!!!");
            console.log("[loading]: ", loading) // <-- should just be a boolean value.
        }
    }, [loading]);

    // DEBUG: Catches when changes are made to {results} and displays them - [That's all for now]:
    useEffect(() => {
        if(results) {
            console.log("RAAAH: This UseEffect hook best be triggered AFTER the getMutualFilmData function call!!!");
            console.log("[results]: ", results);

            /* And I guess, since results will have numerous values, I should extract its two "sections" out into different state variables...
            And I guess, when those variables are set -- and maybe I can have some flag var -- they will trigger the generation of the
            Table display of the mutual films -- and that'll be where the main action happens! */

            setUsersData(results["users"]);
            setMutualFilms(results["mutualFilms"]);
        }
    }, [results]);

    // DEBUG: Catches when changes are made to {usersData} and displays them - [That's all for now]:
    useEffect(() => {
        if(usersData) {
            console.log("[usersData]: ", usersData);
        }
    }, [usersData]);

    // DEBUG: Catches when changes are made to {mutualFilms} and displays them - [That's all for now]:
    useEffect(() => {
        if(mutualFilms) {
            console.log("[mutualFilms]: ", mutualFilms);
        }
    }, [mutualFilms]);

    useEffect(() => {
        if(mutualFilms && usersData) {
            console.log("When both [mutualFilms] and [usersData] are retrieved, I should set some flag here to generate the Table.");
            /* NOTE: ^ Will this cause race conditions with the other UseEffect hooks? Should I instead turn this current UseEffect hook
            into a function that can optionally be invoked by either of the UseEffect hooks above when they're entered (and checking to see
            if both of the conditions are met)? */
        }
    }, [mutualFilms, usersData]);

    // Function to trigger the fetch('/api/mutual') call on button click and retrieve intersected film data:
    const getMutualFilmData = async() => {

        console.log("DEBUG: Function getMutualFilmData was entered!!!");

        const cleanInput = profileUrls.map(p => p.trim()).filter(Boolean);  // This line here will trim out any empty input boxes (for usernames).
        if(cleanInput.length < 2) {
            alert("MUST HAVE MINIMUM 2 INPUTS -- TO-DO: Okay I want that temp form pop-up (don't leave empty!) I had in my prior project to show up here...");
            // DEBUG: ^ Basically if there's less than 2 fields filled, I'll have the pop-up that lasts 1-2 seconds that goes "Must have minimum of 2 fields filled".
            return;
        }
        setLoading(true); // <-- DEBUG:+TO-DO: UseEffect(()=>{...}) hook to trigger a loading animation here? (that turns off when it's set back to false ofc).
        try {
            const res = await getMutualData(cleanInput);
            setResults(res); // <--DEBUG:+TO-DO: UseEffect hook to catch when its value changes to display for now?
        } catch(err) {
            console.error("ERROR: The \"getMutualFilmData\" API call FAILED because => ", err);
            alert("THE API CALL FAILED!!! RAHHH"); // <--DEBUG:+TO-DO: I should have a HTML pop-up here for this.
        } finally {
            setLoading(false);
        }
    }

    // DEBUG: Test function for loading in test data from testData.json:
    const getTestData = () => {
        setUsersData(testData.users);
        setMutualFilms(testData.mutualFilms);
    }

    return(
        <div className="wrapper">
            <header>
                <h1 className="mpTitle">Letterboxd Taste Comparator</h1>
                <p>Compare your mutual film ratings with other Letterboxd profiles!</p>
            </header>
            
            <main>
                <h1>React Version: {React.version}</h1>

                {/* [1] - This first <div> will be for the form where the user types and inputs their profile URLs, is able to 
                add more and subtract profile input boxes (contingent on the current amount, min of 2 and max of 6), etc. */}
                <div>
                    <ProfileInputList profileUrls={profileUrls} setProfileUrls={setProfileUrls}/> {/* NOTE: changes to profileUrls will be "lifted" up to here. */}
                    <div>
                        <button onClick={()=>getMutualFilmData()}>Find Mutual Ratings</button>

                    </div>
                </div>
                
                <div>TEST - USE .JSON VALUES FOR GENERATING TANSTACK TABLE:<br/>
                    <button onClick={()=>getTestData()}>[Use testData.json values!!!]</button>
                </div>
                
            </main>            
        </div>
    )
}

export default MainPage;

{/* PLANNING STUFF TO CONSIDER LATER BELOW */}
{/************************************************************************************************************/}
{/* [2] - This second <div> will basically be an expandable "informative box" about dummy values that
you can use. It'll just be a button that says "Use Dummy Info" and when you click it, it expands a box with
the profile URL links for my six Cahiers du Cinéma archival accounts.

This should be moved to the "About Me Page" after, but these dummy accounts will be a preventative feature
for the scenario where the official Letterboxd page HTML DOM is radically transformed, and my Go-based scraping
logic fails. My counter-measure would be using these Dummy Letterboxd accounts (**my own** accounts) and manually
storing their rating data within the project directory somewhere, then -- and I'll need to adjust my Go code for this --
when their specific URLs are encountered, instead of any scraping, that dummy data is used instead. 
<div>
    INSERT BUTTON-TO-EXPANDABLE BOX W/ INFO ABOUT DUMMY PROFILE VALUES.
</div> */} {/* <-- Worry about this later, let's just focus on the Table and HeatMap for now. */}

{/* [3] - The third <div> will be the "Output Area" table and I guess I'll need to think more about how I'll have everything work.

So it'll be a table that displays a vertically scrollable list of all the mutual films rated by the input list of users.
- Each row will be for a film (w/ film title, poster, rating from each user, official avg rating, input avg rating, and variance. Also link to LB page ofc).

I obviously want it so that this table is interactable. I want a search-bar that lets you dynamically filter the table in
real-time and view films based on string search (keep it simple, just limit this to the title displayed on LB itself).
- Then I obv want (dropdown?) buttons (and sliders?) for the Sorting/Filtering features of the site.
- You can sort by [1] Average Rating (input) [2] Variance [3] Title [4] User Rating (DEBUG: maybe also official rating? We'll see).
- You can filter by [1] Threshold above [2] Threshold below [3] USer-specific filters
*/}

{/* [4] I've left out the Heatmap but below the output table, maybe have a "Generate Heatmap" button
and I can have it generate in the <div> below. (Look for some framework out there that can make a heatmap on the fly). */}
