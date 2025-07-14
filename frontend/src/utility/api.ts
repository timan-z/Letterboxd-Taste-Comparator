
const API_BASE = "http://localhost:8080" // <-- This is the port where I will be hosting my Go backend server.

// My fetch('/api/mutual') that'll be called on button click (w/ profile URLs):
export const getMutualData = async(profiles: string[]) => {
    const result = await fetch(`${API_BASE}/api/mutual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({profiles}),   // Don't forget to wrap the profiles in {} braces (the array is expected as an object).
    });
    if(!result.ok) throw new Error("ERROR: Failed to fetch mutual film data");
    return await result.json();
}
