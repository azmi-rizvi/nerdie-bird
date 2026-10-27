import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo-trans.png";
import "./Navbar.css";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore Birds" },
  { to: "/identify", label: "Identify Birds" },
  { to: "/bonding", label: "Bonding Guide" },
  { to: "/symptoms", label: "Symptom Checker" },
  { to: "/my-birds", label: "My Birds" },
];

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <img src={logo} alt="Nerdie Birdie mascot" className="brand-logo" />
        <h2 className="logo">Nerdie Birdie</h2>
      </Link>
      <div className="links">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={location.pathname === link.to ? "active" : ""}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
