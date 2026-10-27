import { Link } from "react-router-dom";
import mascot from "../assets/mascot-trans.png";
import "./Home.css";

const FEATURES = [
  { title: "Explore Birds", desc: "Discover different bird species.", to: "/explore", cta: "Explore" },
  { title: "Bird Identification", desc: "Identify a bird using a photo or description.", to: "/identify", cta: "Identify" },
  { title: "Bonding Guide", desc: "Learn your bird's instincts and how to bond better.", to: "/bonding", cta: "Learn More" },
  { title: "Symptom Checker", desc: "Spot possible health concerns early.", to: "/symptoms", cta: "Check Symptoms" },
];

function Home() {
  return (
    <>
      <section className="hero">
        <img src={mascot} alt="Nerdie Birdie mascot" className="hero-mascot" />
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
        <div className="srcbird">
          <input type="text" placeholder="Search up a bird" />
          <button className="btn-primary">Search</button>
        </div>
      </section>

      <section className="explore-sec">
        <h2>Explore Nerdie Birdie</h2>
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
        <h2>About Nerdie Birdie</h2>
        <p>
          Nerdie Birdie helps you understand your bird better by providing
          simple information about birds, their species, behaviour, and care —
          with AI-powered identification, personalized bonding tips, and an
          early symptom checker, all in one place.
        </p>
      </section>
    </>
  );
}

export default Home;
