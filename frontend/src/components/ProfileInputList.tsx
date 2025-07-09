import React from "react";

interface ProfileInputListProps {
    profileUrls: string[];
    setProfileUrls: React.Dispatch<React.SetStateAction<string[]>>;
}

const MIN_PROFILES = 2; 
const MAX_PROFILES = 6;

const ProfileInputList: React.FC<ProfileInputListProps> = ({profileUrls, setProfileUrls}) => {
    const handleChange = (index: number, value: string) => {
        const updated = [...profileUrls];
        updated[index] = value;
        setProfileUrls(updated);
    };

    const handleAdd = () => {
        if(profileUrls.length < MAX_PROFILES) {
            setProfileUrls([...profileUrls, ""]);
        }
    };

    const handleRemove = (index: number) => {
        if(profileUrls.length > MIN_PROFILES) {
            setProfileUrls(profileUrls.filter((_, i) => i !== index))
        }
    };

    return(
        <div className="profile-input-list">
            {profileUrls.map((url, index) => (
                // NOTE: The way that ProfileInputList.tsx will be integrated into MainPage.tsx will ensure there's two <input> boxes on page load.
                <div key={index} className="p-input-row"> {/* <-- DEBUG: Insert styling. */}
                    <input
                        type="text"
                        placeholder="Enter a Letterboxd Profile URL (non-shortened)" // <-- DEBUG: Is there a way I can un-shorten truncated links?
                        value={url}
                        onChange={(e)=>handleChange(index, e.target.value)}
                        // DEBUG: Insert styling.
                    />
                    {/* When there's more than 2 input boxes for the minimum 2 profiles to provide, there's a delete button. */}
                    {profileUrls.length > MIN_PROFILES && (
                        <button
                            type="button"
                            onClick={()=>handleRemove(index)}
                            // DEBUG: Insert styling.
                        >
                            &minus;
                        </button>
                    )}
                </div>
            ))}
            {/* There's a maximum of 6 input boxes that can appear, and when the amount is less than that, you can add more: */}
            {profileUrls.length < MAX_PROFILES && (
                <button
                    type="button"
                    onClick={handleAdd}
                    // DEBUG: Add styling later.
                >
                    + Add Another Profile
                </button>
            )}
        </div>
    );
};

export default ProfileInputList;
