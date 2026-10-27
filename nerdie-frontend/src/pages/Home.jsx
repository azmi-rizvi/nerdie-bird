import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import mascot from "../assets/mascot-trans.png";
import "./Home.css";

const FEATURES = [
  { title: "Explore Birds", desc: "Discover different bird species with care requirements.", to: "/explore", cta: "Explore" },
  { title: "Bird Identification", desc: "Identify a bird using a photo or description.", to: "/identify", cta: "Identify" },
  { title: "Bonding Guide", desc: "Learn your bird's instincts and how to bond better.", to: "/bonding", cta: "Learn More" },
  { title: "Symptom Checker", desc: "Spot possible health concerns early & check emergency alerts.", to: "/symptoms", cta: "Check Symptoms" },
  { title: "My Birds Log", desc: "Manage personal bird profiles, health logs, and notes.", to: "/my-birds", cta: "My Birds" },
];

function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/explore");
    }
  }

  return (
    <>
      <section className="hero">
        <img src={mascot} alt="FeatherCare mascot" className="hero-mascot" />
        <div className="hero-text">
          <h1>Understand Your Bird Better</h1>
          <p>
            Learn about your bird, explore different species, and understand
            their behaviour better — with a little help from AI.
          </p>
          <div className="hero-buttons">
            <Link to="/explore"><button className="btn-primary">Explore Birds</button></Link>
            <Link to="/identify"><button className="btn-secondary">Identify a Bird</button></Link>
          </div>
        </div>
      </section>

      <section className="search">
        <h2>Find Your Bird</h2>
        <form onSubmit={handleSearch} className="srcbird">
          <input
            type="text"
            placeholder="Search species (e.g. Cockatiel, Budgie, Finch...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </section>

      <section className="explore-sec">
        <h2>Explore FeatherCare</h2>
        <div className="card-grid">
          {FEATURES.map((f) => (
            <div className="card" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <Link to={f.to}><button className="btn-soft">{f.cta}</button></Link>
            </div>
          ))}
        </div>
      </section>

      <section className="about">
        <h2>About FeatherCare</h2>
        <p>
          FeatherCare helps you understand your bird better by providing
          authoritative information about avian species, behaviour, and health care —
          with AI-assisted species identification, personalized bonding tips, an
          early symptom checker, and personal flock logs, all in one place.
        </p>
      </section>
    </>
  );
}

export default Home;
