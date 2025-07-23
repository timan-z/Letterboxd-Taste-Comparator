import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import AboutPage from "./pages/AboutPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Mapping the default Home Page to the "Main Page" (where the core func is): */}
        <Route path="/" element={<Navigate to="/main" replace/>} />

        {/* Site will use a simple two-page layout structure:
        1 - Main page,
        2 - About Me page (for project info, contact info, and so on):*/}
        <Route path="/main" element={<MainPage/>} />
        <Route path="/about" element={<AboutPage/>} />

      </Routes>
    </Router>
  )
}

export default App;
