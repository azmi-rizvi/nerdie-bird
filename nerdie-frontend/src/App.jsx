import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import SpeciesDetail from "./pages/SpeciesDetail";
import Identify from "./pages/Identify";
import Symptom from "./pages/Symptom";
import Bonding from "./pages/Bonding";
import MyBirds from "./pages/MyBirds";
import "./theme.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/species/:id" element={<SpeciesDetail />} />
        <Route path="/identify" element={<Identify />} />
        <Route path="/symptoms" element={<Symptom />} />
        <Route path="/bonding" element={<Bonding />} />
        <Route path="/my-birds" element={<MyBirds />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
