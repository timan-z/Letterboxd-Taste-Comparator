import {useState, useEffect} from "react";
import ProfileInputList from "../components/ProfileInputList";
import {getMutualData, getHeatMapData} from "../utility/api.ts";  // fetch call
import MainTable from "../components/MainTable.tsx";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import {type ColumnDef} from "@tanstack/react-table";
import {type User, type MutualFilm, type HeatMapRow} from "../utility/types.ts";
import NewtonsCradleLB from "../components/NewtonsCradleLB/NewtonsCradleLB.tsx";

// Test Data imports:
import testData1 from "../assets/sampleData/testData1.json";
import testData2 from "../assets/sampleData/testData2.json";
import testData3 from "../assets/sampleData/testData3.json";
import testData4 from "../assets/sampleData/testData4.json";
import testData5 from "../assets/sampleData/testData5.json";
import testData6 from "../assets/sampleData/testData6.json";
import testData7 from "../assets/sampleData/testData7.json";
import testData8 from "../assets/sampleData/testData8.json";
import testData9 from "../assets/sampleData/testData9.json";
import testData10 from "../assets/sampleData/testData10.json";

//const API_BASE_URL = import.meta.env.VITE_API_BASE;

function MainPage() {
    const [profileUrls, setProfileUrls] = useState(["", ""]);
    const [loading, setLoading] = useState(false);  // state var for when (TO-DO: pair with loading animation? -- that temp freezes webpage?)
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    // These state variables below are for containing the data extracted from the fetch call.
    const [results, setResults] = useState(null);
    //const [usersData, setUsersData] = useState <User[] | null>(null);
    const [usersData, setUsersData] = useState <User[]>([]);
    //const [mutualFilms, setMutualFilms] = useState <MutualFilm[] | null>(null);
    const [mutualFilms, setMutualFilms] = useState <MutualFilm[]>([]);
    // Generate Table flag:
    const [genTable, setGenTable] = useState(false);
    // Generate HeatMap stuff:
    const [heatMapBtn, setHeatMapBtn] = useState(false);
    const [heatMapData, setHeatMapData] = useState<HeatMapRow[]>([]); // data for populating nivo heatmap.
    const [heatMapWidth, setHeatMapWidth] = useState(0);
    const [showHeatMap, setShowHeatMap] = useState(true);

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

        console.log("DEBUG: The value of mutualFilms.length => ", mutualFilms.length);
        console.log("DEBUG: The value of usersData.length => ", usersData.length);

        if(mutualFilms.length > 0 && usersData.length > 1) {
            console.log("When both [mutualFilms] and [usersData] are retrieved, I should set some flag here to generate the Table.");
            /* NOTE: ^ Will this cause race conditions with the other UseEffect hooks? Should I instead turn this current UseEffect hook
            into a function that can optionally be invoked by either of the UseEffect hooks above when they're entered (and checking to see
            if both of the conditions are met)? */
            setGenTable(true);
            setHeatMapBtn(true);
        } else {
            // When I generate an invalid table, I should make it so that this and setGenTable are set to false!:

            console.log("DEBUG: Is this entered at any point???");

            setGenTable(false);
            setHeatMapBtn(false);
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
            cell: (info) => <a 
                href={`https://letterboxd.com/film/${info.row.original.filmUrl}/`} 
                target="_blank"
                title="Click to open the Letterboxd page for this film (in a new tab)."
                style={{textDecoration:"none", color:"#40bcf4"}}>
                    {info.row.original.title}
            </a>,
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
        
        const controller = new AbortController();
        setAbortController(controller);
        setLoading(true);
        
        try {
            const res = await getMutualData(cleanInput, controller.signal);
            setResults(res); // <--DEBUG:+TO-DO: UseEffect hook to catch when its value changes to display for now?
        } catch(err: any) {
            if(err.name === "AbortError") {
                console.warn("Fetch aborted by the user.");
            } else {
                console.error("ERROR: The \"goGetMutualData\" API call FAILED because => ", err);
                alert("THE API CALL FAILED!!! RAHHH"); // <--DEBUG:+TO-DO: I should have a HTML pop-up here for this.
            }
        } finally {
            setLoading(false);
            setAbortController(null);
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
            setShowHeatMap(true)
        } catch(err) {
            console.error("ERROR: The \"goGetMutualData\" API call FAILED because => ", err);
            alert("THE API CALL FAILED!!! RAHHH"); // <--DEBUG:+TO-DO: I should have a HTML pop-up here for this.
        } finally {
            setLoading(false);
        }
    }

    // DEBUG: Test function for loading in test data from testData.json:
    const getTestData = (whichOne: number) => {
        if(whichOne == 1) {
            setUsersData(testData1.users);
            setMutualFilms(testData1.mutualFilms);
        } else if (whichOne == 2) {
            setUsersData(testData2.users);
            setMutualFilms(testData2.mutualFilms);
        } else if (whichOne == 3) {
            setUsersData(testData3.users);
            setMutualFilms(testData3.mutualFilms);
        } else if (whichOne == 4) {
            setUsersData(testData4.users);
            setMutualFilms(testData4.mutualFilms);
        } else if (whichOne == 5) {
            setUsersData(testData5.users);
            setMutualFilms(testData5.mutualFilms);
        } else if (whichOne == 6) {
            setUsersData(testData6.users);
            setMutualFilms([]);
        } else if (whichOne == 7) {
            setUsersData(testData7.users);
            setMutualFilms(testData7.mutualFilms);
        } else if (whichOne == 8) {
            setUsersData(testData8.users);
            setMutualFilms(testData8.mutualFilms);
        } else if (whichOne == 9) {
            setUsersData(testData9.users);
            setMutualFilms(testData9.mutualFilms);
        } else {
            setUsersData(testData10.users);
            setMutualFilms(testData10.mutualFilms);
        }
    }

    const toggleHeatMapView = () => {
        const testValue = Math.round(window.innerHeight / 100);

        if(heatMapWidth > testValue) {
            setHeatMapWidth(Math.round(window.innerHeight / 100));
        } else {
            const minWidth = 100 + mutualFilms.length * 75;
            setHeatMapWidth(minWidth);
        }
    }

    const turnOffHeatMap = () => {
        setShowHeatMap(false);
    }

    const cancelRatingsReq = () => {
        setLoading(false)
        abortController?.abort()
    }


    const toggleLoadAnim = () => {
        setLoading(true);
    }


    return(
        <div id="mpWrapper" className="wrapper">

            {/* When the user clicks the "Find Mutual Ratings" button and initiates the fetch request to the backend, 
            I'm going to have the [1] - screen "greyed out" with the contents of the Main Page being unclickable. There's going to be
            a [2] - loading animation that resembles Newton's Cradle but with three balls (orange, green, and blue in reference to the LB logo).
            Beneath that, a button that says [3] - "Click to Cancel the Mutual Ratings Search" that does just that. (Mimicking "Ctrl + C" on cmd-line). */}
            {loading && (
                /* [1] - The "Greyed Out" screen overlay: */
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.73)',
                        zIndex: 99999,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <h1 style={{fontFamily:"monospace", color:"#d1dad9"}} >LOADING...</h1>

                    {/* [2] - The Newton's Cradle loading animation: */}
                    <NewtonsCradleLB/>

                    {/* [3] - The "Click to Cancel the Mutual Ratings Search" button: */}
                    <button style={{
                        fontFamily: 'monospace',
                        marginTop: '20px', // space below the spinner
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                    }} onClick={()=>cancelRatingsReq()} >Click to Cancel the Mutual Ratings Search</button>
                </div>
            )}

            <div className="navBar">
                <nav>
                    {" "}<a href="/main" style={{textDecoration:"none"}}>Main Page</a> {" "}<a href="/about" style={{textDecoration:"none"}}>About Page</a>
                </nav>
            </div>
            
            <header id="pageTitle">
                <h1 className="headerEl">
                    <img style={{width:"50px"}} src="./src/assets/images/straub.png" alt="Picture of old-man Jean-Marie Straub" title="This was originally supposed to be the Letterboxd icon but after reviewing their TOS, might be best to avoid doing that! Instead here's a picture of grumpy old-man Jean-Marie Straub."/>
                    Letterboxd Taste Comparator
                </h1>
                <p id="pageUndertext">Compare your mutual film ratings with other Letterboxd profiles!</p>
            </header>

            <main>
                {/* [1] - This first <div> will be for the area where the user types and inputs their profile URLs, is able to add more 
                and subtract profile input boxes (contingent on the current amount, min of 2 and max of 6), then submit them for backend, etc. */}
                <div id="profileInputWrapper">
                    <ProfileInputList profileUrls={profileUrls} setProfileUrls={setProfileUrls}/> {/* NOTE: changes to profileUrls will be "lifted" up to here. */}
                    <div id="profileInputBtnWrapper">
                        <button id="profileInputBtn" type="submit" onClick={()=>goGetMutualData()}>Find Mutual Ratings</button>
                    </div>
                </div>

                {/* [2] - This second <div> where the Table goes. (It will appear as an empty template until its contents are populated w/ data). */}
                {genTable && (<div>
                    <MainTable data={mutualFilms} userData={usersData} columns={columns}/>;
                </div>)}
                
                {/* [3] - The third <div> where the Testing ("Bypass Scraping") Data is accessible. (This is the data that you would use in the event
                that the Letterboxd DOM radically changes, and my web crawling is essentially rendered obselete). */}
                <div id="testDataContainer">
                    <div id="testDataHeader">
                        <h1>TABLE TEST VALUES</h1>
                        <h2>(SKIP THE SCRAPING)</h2>
                    </div>

                    <div id="testDataSelectionWrapper">
                        <h2>THE TEST DATA:</h2>
                        <ul>
                            <li><button onClick={()=>getTestData(1)}>[André Bazin, François Truffaut]</button></li>
                            <li><button onClick={()=>getTestData(2)}>[Jacques Rivette, Jean-Luc Godard]</button></li>
                            <li><button onClick={()=>getTestData(3)}>[Jacques Rivette, Éric Rohmer]</button></li>
                            <li><button onClick={()=>getTestData(4)}>[Jacques Rivette, Luc Moullet]</button></li>
                            <li><button onClick={()=>getTestData(5)}>[Jean-Luc Godard, Luc Moullet]</button></li>
                            <li><button onClick={()=>getTestData(6)}>[Jean-Luc Godard François Truffaut] <b>(No Mutual Films)</b></button></li>
                            <li><button onClick={()=>getTestData(7)}>[André Bazin, Éric Rohmer, François Truffaut]</button></li>
                            <li><button onClick={()=>getTestData(8)}>[Jacques Rivette, Jean-Luc Godard, Éric Rohmer]</button></li>
                            <li><button onClick={()=>getTestData(9)}>[Jacques Rivette, Jean-Luc Godard, Éric Rohmer, Luc Moullet]</button></li>
                            <li><button onClick={()=>getTestData(10)}>[André Bazin, Jacques Rivette, Jean-Luc Godard, Éric Rohmer]</button></li>
                        </ul>
                    </div>

                    <p style={{fontSize:"18px"}}>
                        Here is some test data that you can populate the table above with (if you wish to bypass the web scraping process entirely, 
                        which — and this is intentional, for reasons that are elaborated upon in the About Page — may <b>take very long</b> variable 
                        on the rated-film count of the Letterboxd profiles provided. Also this data is invaluable for showcasing the interactive table features 
                        in the event that my scraping logic is rendered obsolete with any future firewalls, drastic Letterboxd DOM overhauls, and so on).
                        <br/><br/>
                        This test data comprises six archival accounts — that I created — for the French film critics of 50s-60s Cahiers du Cinéma 
                        (e.g., Jean-Luc Godard and François Truffaut, names that a cultured eye may recognize for their subsequent affluential filmmaking careers). 
                        <br/><br/>
                        Here are the usernames for those profiles, if you would like to scrape them:{" "}
                        [<b>jeanluc_godard</b>], [<b>franco_truffaut</b>], [<b>jacquesrivette_</b>], [<b>ericrohmer_</b>], [<b>andre_bazin_</b>], and lastly [<b>luc_moullet</b>].
                    </p>
                </div>

                {/* NOTE: Going to have the "Generate HeatMap" button remain on the default-state Main Page but be disabled until
                there's valid content in the TanStack Table (better to appear but be "grayed out" so the User can see it and acknowledge
                its existence rather than potentially miss it if it were to appear dynamically after the table generates). */}
                <div id="heatMapBtnWrapper">
                    <button id="heatMapBtn" disabled={!heatMapBtn} onClick={()=>goGetHeatMapData()}>Generate Heatmap</button><br/>
                    <p style={{fontFamily:"monospace", color:"white"}}>
                        Note that the backend is required to generate the values required for hydrating the HeatMap.
                        You may think: You can just do all that on the frontend? You're right! But I built this with the intention
                        of learning Go and using it wherever I possibly could.
                    </p>
                </div>

                {/* [4] - The fourth <div> where the HeatMap will be generated!: */}
                {heatMapData.length > 0 && showHeatMap && (

                    <div id="heatMapScrollWrapper">
                        <div id="heatMapContainer" style={{ minWidth: `${heatMapWidth}px`, height: "100vh" }} >
                            <ResponsiveHeatMap
                                data={heatMapData}
                                margin={{ top: 140, right: 30, bottom: 60, left: 100 }}
                                valueFormat=".1f"
                                axisTop={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: -90, // rotates film titles
                                    legend: 'Films',
                                    legendOffset: -120,
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
                                theme={{
                                    axis: {
                                        ticks: {
                                            text: {
                                                fill: '#caeff8', // light blue text.
                                                fontSize: 12,
                                            },
                                        },
                                        legend: {
                                            text: {
                                                fill: '#caeff8',
                                                fontSize: 14,
                                                fontWeight: 600,    // heavier for the axis legends.
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>

                        {/* When the HeatMap is generated, I'm also going to have an extra section here allowing the User to interact with it 
                        (mainly toggling its view mode from expanded to condensed and vice-versa) but also to optionally close the HeatMap! */}
                        <div id="hmExtraControls">
                            <button id="hmToggleBtn" onClick={()=>toggleHeatMapView()}>[TOGGLE HEATMAP VIEW]</button>
                            <button id="hmCloseBtn" onClick={()=>turnOffHeatMap()}>[TURN OFF HEATMAP]</button>
                        </div>
                    </div>
                )}

                {/* Super last minute addition. In the event that my scraping logic is rendered obsolete from any future firewalls (changes to robots.txt),
                drastic overhauls of the Letterboxd DOM, or so on, I want to keep the work I did for the loading animation still viewable: */}
                <div style={{display:"flex", flexDirection:"column", alignItems:"center", width:"500px" }}>
                    <button onClick={()=>toggleLoadAnim()} style={{height:"35px", width:"275px", fontFamily:"monospace", cursor:"pointer", border:"none", borderRadius:"20px", boxShadow:"-5px -5px 10px 0px rgba(0, 0, 0, 0.5)"}}>View Loading Animation & Controls</button>
                    <p style={{color:"white", fontFamily:"monospace"}}>
                        In the event that the Letterboxd DOM is drastically overhauled or any firewalls or policies are put in place such that my scraping backend
                        is rendered obsolete or has to be taken down in accordance with TOS updates — I still want the work I put into the loading animation to be visible lol.
                        (Mainly the LB-themed "Newton's Cradle" animation as well as the "greyed out" overlay that blocks out interactivity).
                    </p>
                </div>
            </main>

        </div>
    )
}

export default MainPage;
