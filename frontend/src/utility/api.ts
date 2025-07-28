import {type User, type MutualFilm} from "../utility/types.ts";

//const API_BASE = "http://localhost:8080" // <-- This is the port where I will be hosting my Go backend server.
//const API_BASE = import.meta.env.VITE_API_BASE;

/* API_BASE will be the port where the Go backend server is hosted. That could be something like "http://localhost:8080" while
developing locally or whatever domain I've generated while working with Netlify or whatever: */
const API_BASE = import.meta.env.VITE_API_BASE.replace(/\/+$/, ""); // .replace is a safety measure getting rid of any trailing slashes (leaving them may cause problems w/ the functions below).

// My fetch('/api/mutual') that'll be called on button click in MainPage.tsx (w/ profile URLs as args):
export const getMutualData = async(profiles: string[], signal: AbortSignal) => {
    const result = await fetch(`${API_BASE}/api/mutual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({profiles}),   // Don't forget to wrap the profiles in {} braces (the array is expected as an object).
        signal,
    });
    if(!result.ok) throw new Error("ERROR: Failed to fetch mutual film data.");
    return await result.json(); // intersected Film data inside and Users info.
}

// My fetch('/api/heatmap') that'll be called on button click in MainPage.tsx (w/ the info returned from getMutualData as args):
// NOTE: I know that I can do this on the frontend too but I started this project to learn TypeScript and Golang!!!
export const getHeatMapData = async(films: MutualFilm[], users: User[]) => {
    const result = await fetch(`${API_BASE}/api/heatmap`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({films, users}),
    });
    if(!result.ok) throw new Error("ERROR: Failed to fetch HeatMap information based on current table.");
    return await result.json(); // heatmap data to plug into some framework.
}
