import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getSpecies, getSpeciesTypes, getImageUrl } from "../services/api";
import "./Explore.css";

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [query, setQuery] = useState(initialSearch);
  const [filter, setFilter] = useState("All");
  const [types, setTypes] = useState(["All"]);
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState(null);

  // Load available types on mount
  useEffect(() => {
    async function loadTypes() {
      try {
        const fetchedTypes = await getSpeciesTypes();
        setTypes(fetchedTypes);
      } catch (err) {
        console.warn("Could not load dynamic types, using defaults:", err);
        setTypes(["All", "Parrots", "Finches", "Wild Birds"]);
      }
    }
    loadTypes();
  }, []);

  // Sync state if URL query changes
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setQuery(urlSearch);
  }, [searchParams]);

  // Fetch species whenever query or filter changes
  useEffect(() => {
    let isCancelled = false;
    async function fetchSpeciesData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSpecies({ search: query, type: filter });
        if (!isCancelled) {
          setSpeciesList(data);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || "Failed to load species");
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      fetchSpeciesData();
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, filter]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (val) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  }

  function handleFilterClick(t) {
    setFilter(t);
  }

  return (
    <>
      <div className="head">
        <h1>Explore Birds</h1>
        <p>Discover different bird species, dietary habits, and care setups.</p>
      </div>

      <div className="esearch">
        <input
          type="text"
          placeholder="Search species (e.g. Cockatiel, Conure, Owl)..."
          value={query}
          onChange={handleSearchChange}
        />
        <div className="filters">
          {types.map((t) => (
            <button
              key={t}
              className={filter === t ? "btn-primary" : "btn-soft"}
              onClick={() => handleFilterClick(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="loading-state">Loading bird species from database...</p>}
      {error && (
        <div className="error-state">
          <p>⚠️ Error connecting to database: {error}</p>
          <button className="btn-secondary" onClick={() => setQuery(query)}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="birds">
          {speciesList.map((b) => (
            <div className="bird" key={b.id || b.name}>
              <span className="bird-tag">{b.type}</span>
              {b.image_url && (
                <img
                  src={getImageUrl(b.image_url)}
                  alt={b.name}
                  className="bird-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div className="bird-content">
                <h2>{b.name}</h2>
                <p><strong>Lifespan:</strong> {b.lifespan || "Varies"}</p>
                <p className="fun-fact">🪶 {b.fun_facts ? b.fun_facts.substring(0, 95) + "..." : "Gentle companion."}</p>
                <div className="bird-btn-row">
                  <button
                    className="btn-soft"
                    onClick={() => setSelectedSpecies(b)}
                    style={{ flex: 1 }}
                  >
                    Quick View
                  </button>
                  <Link to={`/species/${b.id}`} style={{ flex: 1 }}>
                    <button className="btn-primary" style={{ width: "100%" }}>
                      Full Profile
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {speciesList.length === 0 && (
            <p className="no-results">No birds match your search criteria. Try a different term or filter.</p>
          )}
        </div>
      )}

      {/* Species Detail Modal */}
      {selectedSpecies && (
        <div className="modal-overlay" onClick={() => setSelectedSpecies(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedSpecies(null)}>×</button>
            {selectedSpecies.image_url && (
              <img
                src={getImageUrl(selectedSpecies.image_url)}
                alt={selectedSpecies.name}
                className="modal-header-img"
              />
            )}
            <div className="modal-body">
              <div className="modal-title-row">
                <h2>{selectedSpecies.name}</h2>
                <span className="modal-tag">{selectedSpecies.type}</span>
              </div>

              <div className="modal-grid">
                <div className="modal-field">
                  <label>Lifespan</label>
                  <p>{selectedSpecies.lifespan || "N/A"}</p>
                </div>
                <div className="modal-field">
                  <label>Social Needs</label>
                  <p>{selectedSpecies.social_needs || "N/A"}</p>
                </div>
                <div className="modal-field full">
                  <label>Habitat & Origin</label>
                  <p>{selectedSpecies.habitat || "N/A"}</p>
                </div>
                <div className="modal-field full">
                  <label>Recommended Diet</label>
                  <p>{selectedSpecies.diet || "N/A"}</p>
                </div>
                <div className="modal-field full">
                  <label>Cage & Housing Setup</label>
                  <p>{selectedSpecies.cage_setup || "N/A"}</p>
                </div>
                <div className="modal-field full">
                  <label>Fun Fact</label>
                  <p>🪶 {selectedSpecies.fun_facts || "N/A"}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <Link to={`/species/${selectedSpecies.id}`} style={{ flex: 1 }}>
                  <button className="btn-primary" style={{ width: "100%" }}>
                    Open Dedicated Page
                  </button>
                </Link>
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedSpecies(null)}
                  style={{ flex: 1 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Explore;
