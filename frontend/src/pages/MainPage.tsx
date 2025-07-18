import React, {useState, useEffect} from "react";
import ProfileInputList from "../components/ProfileInputList";
import {getMutualData, getHeatMapData} from "../utility/api.ts";  // fetch call
import testData from "../assets/testData.json";
import testData2 from "../assets/testData2.json";
import MainTable from "../components/MainTable.tsx";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import {type ColumnDef} from "@tanstack/react-table";
import {type User, type MutualFilm, type HeatMapRow} from "../utility/types.ts";

//import { interpolateYlOrRd } from "d3-scale-chromatic"; // RANDOM COLOUR SCHEME FOR THE HEATMAP!!!
/* As a reference, following the HTML page structure of: https://letterboxd-besties.cheersderek.com/ */

function MainPage() {
    const [profileUrls, setProfileUrls] = useState(["", ""]);
    const [loading, setLoading] = useState(false);  // state var for when (TO-DO: pair with loading animation? -- that temp freezes webpage?)
    
    // These state variables below are for containing the data extracted from the fetch call.
    const [results, setResults] = useState(null);
    //const [usersData, setUsersData] = useState <User[] | null>(null);
    const [usersData, setUsersData] = useState <User[]>([]);
    //const [mutualFilms, setMutualFilms] = useState <MutualFilm[] | null>(null);
    const [mutualFilms, setMutualFilms] = useState <MutualFilm[]>([]);
    // Generate Table flag:
    const [genTable, setGenTable] = useState(false);
    // Generate HeatMap stuff:
    const [heatMapData, setHeatMapData] = useState<HeatMapRow[]>([]); // data for populating nivo heatmap.
    //const [heatMapKeys, setHeatMapKeys] = useState<string[]>([]); // just film titles (and that'll be the keys for the nivo heatmap).

    // DEBUG: Catches when changes are made to {loading} and displays it - [That's all for now]:
    useEffect(() => {
        if(loading) {
            console.log("RAAAH: This UseEffect hook best be triggered DURING the goGetMutualData function call!!!");
            console.log("[loading]: ", loading) // <-- should just be a boolean value.
        }
    }, [loading]);

    // DEBUG: Catches when changes are made to {results} and displays them - [That's all for now]:
    useEffect(() => {
        if(results) {
            console.log("RAAAH: This UseEffect hook best be triggered AFTER the goGetMutualData function call!!!");
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
            setGenTable(true);
        }
    }, [mutualFilms, usersData]);

    useEffect(() => {
        if(heatMapData.length > 0) {
            console.log("Yeah dude");
            console.log("Okay so the values of heatMapData are => ", heatMapData);
        }
    }, [heatMapData]);

    // DEBUG: Just testing out a basic structure for the TanStack table:
    const columns: ColumnDef<MutualFilm>[] = [
        {
            accessorKey: "title",
            header: "Film Title",
            cell: (info) => <a href={`https://letterboxd.com/film/${info.row.original.filmUrl}/`}>{info.row.original.title}</a>, //  + " (" + info.row.original.filmYear + ", " + info.row.original.filmDir + ")"
        },
        {
            accessorKey: "filmYear",
            header: "Release Year",
            cell: (info) => <div>{info.row.original.filmYear}</div>,
        },
        {
            accessorKey: "filmDir",
            header: "Directed By",
            cell: (info) => <div>{info.row.original.filmDir}</div>,
        },
        {
            accessorKey: "avgRating",
            header: "Average Rating",
        },
        {
            accessorKey: "variance",
            header: "Variance",
        },
        
    ];

    // Function to trigger the fetch('/api/mutual') call on button click and retrieve intersected film data:
    const goGetMutualData = async() => {
        console.log("DEBUG: Function goGetMutualData was entered!!!");

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
            console.error("ERROR: The \"goGetMutualData\" API call FAILED because => ", err);
            alert("THE API CALL FAILED!!! RAHHH"); // <--DEBUG:+TO-DO: I should have a HTML pop-up here for this.
        } finally {
            setLoading(false);
        }
    }

    // Function to trigger the fetch('/api/heatmap') call on button click and retrieve heatmap data:
    const goGetHeatMapData = async() => {
        console.log("DEBUG: function getHeatMapData was entered!!!");

        // DEBUG: (Below) Temporary debugging guard for now -- afterwards, button shouldn't be accessible otherwise:
        if(!mutualFilms || !usersData) {
            console.log("Debug: Temporary guard at the top of getHeatMapData was entered...");
            return;
        }

        setLoading(true); // <-- DEBUG: I guess I should have it load during this too.
        try {
            //const res = await getHeatMapData()
            const res = await getHeatMapData(mutualFilms, usersData);
            console.log("ALRIGHTY - THE RESULTS OF CALLING \"getHeatMapData\" ARE AS FOLLOWS: ", res);

            setHeatMapData(res) // DEBUG: Remember that state var "heatMapData" won't update until the next re-render so maybe catch it with a UseEffect?
        } catch(err) {
            console.error("ERROR: The \"goGetMutualData\" API call FAILED because => ", err);
            alert("THE API CALL FAILED!!! RAHHH"); // <--DEBUG:+TO-DO: I should have a HTML pop-up here for this.
        } finally {
            setLoading(false);
        }
    }

    // DEBUG: Test function for loading in test data from testData.json:
    const getTestData = () => {
        setUsersData(testData2.users);
        setMutualFilms(testData2.mutualFilms);
    }

    // NOTE:+DEBUG: All style={{border:"..."}} stylings are for debugging and web design purposes...
    return(
        <div className="wrapper" style={{border:"2px solid blue"}} >
            <header id="mpTitle" style={{border:"2px solid black"}} >
                <h1>Letterboxd Taste Comparator</h1>
                <p id="mpUndertext">Compare your mutual film ratings with other Letterboxd profiles!</p>
            </header>
            
            <main>
                {/* [1] - This first <div> will be for the area where the user types and inputs their profile URLs, is able to add more 
                and subtract profile input boxes (contingent on the current amount, min of 2 and max of 6), then submit them for backend, etc. */}
                <div id="profileInputWrapper" style={{border:"2px solid red"}}>
                    <ProfileInputList profileUrls={profileUrls} setProfileUrls={setProfileUrls}/> {/* NOTE: changes to profileUrls will be "lifted" up to here. */}
                    <div id="profileInputBtnWrapper">
                        <button id="profileInputBtn" type="submit" onClick={()=>goGetMutualData()}>Find Mutual Ratings</button>
                    </div>
                </div>
                
                {/* [1.5] - DEBUG: This is just a debug section for testing the TanStack table and Nivo HeatMap (w/o needing to scrape each time). */}
                <div style={{border:"2px solid blue"}} >DEBUG: TEST AREA - USE .JSON VALUES FOR GENERATING TANSTACK TABLE:<br/>
                    <button onClick={()=>getTestData()}>[Use testData.json values!!!]</button>
                </div>

                {/* [2] - This second <div> where the Table goes... */}
                {genTable && (<div style={{border:"2px solid red", width:"100%"}}>
                    <MainTable data={mutualFilms} userData={usersData} columns={columns}/>;
                </div>)}

                <div>
                    [THIS IS WHERE THE HEATMAP WILL BE GENERATED!!!]<br/>
                    <button onClick={()=>goGetHeatMapData()}>Generate Heatmap</button><br/>
                    {/* HeatMap will be generated below... */}
                    {heatMapData.length > 0 && (
                        <div style={{height: "500px"}}>
                            
                            <ResponsiveHeatMap
                                data={heatMapData}
                                margin={{ top: 100, right: 30, bottom: 60, left: 100 }}
                                valueFormat=".1f"
                                axisTop={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: -90, // rotates film titles
                                    legend: 'Films',
                                    legendOffset: 60,
                                }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    legend: 'Users',
                                    legendOffset: -80,
                                }}
                                colors={{
                                    type: 'sequential',
                                    scheme: 'blues',
                                    minValue: 0,
                                    maxValue: 5,
                                }}
                                emptyColor="#eeeeee"
                                labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                                animate={true}
                                motionConfig="gentle"
                            />
                        </div>
                    )}
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
