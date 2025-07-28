/* This is just a temporary DEBUG:-related Test component (to dip my toes back into getting comfy with loading animation stuff): 
TO-DO: ^ So yeah, once I'm comfortable with everything, delete this file and LoadingSpinner.css */
import "./LoadingSpinner.css";

const LoadingSpinner = () => {
    return (
        <div id="spinning-loader-id">
            <div className="loader"></div>
        </div>
    );
};

export default LoadingSpinner;
