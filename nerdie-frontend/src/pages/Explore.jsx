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
              <div className="bird-left">
                <span className="bird-tag">{b.type}</span>
                {b.image_url && (
                  <>
                    <div
                      className="bird-backdrop"
                      style={{ backgroundImage: `url(${getImageUrl(b.image_url)})` }}
                    />
                    <img
                      src={getImageUrl(b.image_url)}
                      alt={b.name}
                      className="bird-img"
                      onError={(e) => {
                        const filename = b.image_url ? b.image_url.split('/').pop() : '';
                        if (filename && !e.target.src.endsWith('/species/' + filename)) {
                          e.target.src = `/species/${filename}`;
                        } else {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                  </>
                )}
              </div>
              <div className="bird-content">
                <div className="bird-header-row">
                  <h2>{b.name}</h2>
                </div>
                <div className="bird-quick-stats">
                  <span className="stat-pill">⏳ <strong>Lifespan:</strong> {b.lifespan || "Varies"}</span>
                  {b.habitat && (
                    <span className="stat-pill">🌿 <strong>Habitat:</strong> {b.habitat.length > 40 ? b.habitat.substring(0, 40) + "..." : b.habitat}</span>
                  )}
                </div>
                <p className="fun-fact">🪶 {b.fun_facts ? (b.fun_facts.length > 120 ? b.fun_facts.substring(0, 120) + "..." : b.fun_facts) : "Gentle companion bird."}</p>
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
              <div className="modal-header-frame">
                <div
                  className="modal-header-backdrop"
                  style={{ backgroundImage: `url(${getImageUrl(selectedSpecies.image_url)})` }}
                />
                <img
                  src={getImageUrl(selectedSpecies.image_url)}
                  alt={selectedSpecies.name}
                  className="modal-header-img"
                  onError={(e) => {
                    const filename = selectedSpecies.image_url ? selectedSpecies.image_url.split('/').pop() : '';
                    if (filename && !e.target.src.endsWith('/species/' + filename)) {
                      e.target.src = `/species/${filename}`;
                    }
                  }}
                />
              </div>
            )}
            <div className="modal-body">
              <div className="modal-title-row">
                <h2>{selectedSpecies.name}</h2>
                <span className="modal-tag">{selectedSpecies.type}</span>
              </div>

              <div className="modal-grid">
                <div className="modal-field">
                  <label>Natural Habitat</label>
                  <p>{selectedSpecies.habitat || "Information not specified"}</p>
                </div>
                <div className="modal-field">
                  <label>Typical Lifespan</label>
                  <p>{selectedSpecies.lifespan || "Information not specified"}</p>
                </div>
                <div className="modal-field full">
                  <label>Recommended Nutritional Diet</label>
                  <p>{selectedSpecies.diet || "Information not specified"}</p>
                </div>
                <div className="modal-field full">
                  <label>Cage & Environmental Setup</label>
                  <p>{selectedSpecies.cage_setup || "Information not specified"}</p>
                </div>
                <div className="modal-field full">
                  <label>Social & Behavioral Needs</label>
                  <p>{selectedSpecies.social_needs || "Information not specified"}</p>
                </div>
                <div className="modal-field full">
                  <label>Fascinating Fun Facts</label>
                  <p>{selectedSpecies.fun_facts || "Information not specified"}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <Link to={`/species/${selectedSpecies.id}`} style={{ flex: 1 }}>
                  <button className="btn-primary" style={{ width: "100%" }}>
                    View Dedicated Profile Page
                  </button>
                </Link>
                <Link
                  to={`/my-birds?species_id=${selectedSpecies.id}&species_name=${encodeURIComponent(selectedSpecies.name)}`}
                  style={{ flex: 1 }}
                >
                  <button className="btn-soft" style={{ width: "100%" }}>
                    Add to My Birds
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Explore;
