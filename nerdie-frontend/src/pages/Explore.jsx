import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  getSpecies,
  getSpeciesTypes,
  getImageUrl,
  getSpeciesImageUrl,
  discoverNewBird
} from "../services/api";
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
  const [refreshKey, setRefreshKey] = useState(0);

  // AI Discover State
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredBird, setDiscoveredBird] = useState(null);
  const [discoverError, setDiscoverError] = useState(null);
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);

  // Load available types on mount or refresh
  useEffect(() => {
    async function loadTypes() {
      try {
        const fetchedTypes = await getSpeciesTypes();
        setTypes(fetchedTypes);
      } catch (err) {
        console.warn("Could not load dynamic types, using defaults:", err);
        setTypes(["All", "Parrots", "Finches", "Wild Birds", "Raptors", "Waterfowl", "Softbills", "Pigeons & Doves"]);
      }
    }
    loadTypes();
  }, [refreshKey]);

  // Sync state if URL query changes
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setQuery(urlSearch);
  }, [searchParams]);

  // Fetch species whenever query, filter, or refreshKey changes
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
  }, [query, filter, refreshKey]);

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

  async function handleTriggerDiscover() {
    setIsDiscovering(true);
    setDiscoverError(null);
    setDiscoveredBird(null);
    setIsDiscoverModalOpen(true);

    try {
      const newBird = await discoverNewBird();
      setDiscoveredBird(newBird);
    } catch (err) {
      console.error("AI Bird Discovery Error:", err);
      setDiscoverError(err.message || "Failed to generate bird with Gemini AI. Please try again.");
    } finally {
      setIsDiscovering(false);
    }
  }

  function handleCloseDiscoverModal() {
    setIsDiscoverModalOpen(false);
    // Dynamically refresh main list so newly discovered bird instantly appears in grid
    if (discoveredBird) {
      setRefreshKey((k) => k + 1);
    }
    setDiscoveredBird(null);
    setDiscoverError(null);
  }

  return (
    <>
      <div className="head">
        <h1>Explore Birds</h1>
        <p>Discover different bird species, dietary habits, and care setups.</p>
        
        {/* Feature 1: Prominent Discover New Bird Trigger */}
        <div className="discover-banner-btn-wrap">
          <button
            className="btn-primary btn-discover"
            onClick={handleTriggerDiscover}
            disabled={isDiscovering}
          >
            {isDiscovering ? "✨ Gemini AI Discovering Bird..." : "✨ Discover New Bird"}
          </button>
        </div>
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
          <button className="btn-secondary" onClick={() => setRefreshKey((k) => k + 1)}>Retry</button>
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
                      style={{ backgroundImage: `url(${getSpeciesImageUrl(b.name, b.image_url)})` }}
                    />
                    <img
                      src={getSpeciesImageUrl(b.name, b.image_url)}
                      alt={b.name}
                      className="bird-img"
                      onError={(e) => {
                        const fallback = getSpeciesImageUrl(b.name);
                        if (fallback && !e.target.src.endsWith(fallback)) {
                          e.target.src = fallback;
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
                {b.scientific_name && (
                  <div style={{ color: "#6b7280", fontStyle: "italic", fontSize: "0.85rem", marginTop: "-4px", marginBottom: "8px" }}>
                    {b.scientific_name}
                  </div>
                )}
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

      {/* Feature 1: AI Discover New Bird Modal */}
      {isDiscoverModalOpen && (
        <div className="modal-overlay" onClick={handleCloseDiscoverModal}>
          <div className="modal-content discover-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseDiscoverModal}>×</button>

            {isDiscovering && (
              <div className="ai-loading-card" style={{ margin: "40px 20px" }}>
                <div className="ai-spinner"></div>
                <div className="ai-loading-text">
                  <h3>Generating New Species with Gemini AI...</h3>
                  <p>Consulting avian biology databases to discover a unique, scientifically recognized bird species not yet in our catalog. Auto-saving to database...</p>
                </div>
              </div>
            )}

            {discoverError && (
              <div style={{ padding: "40px 28px", textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
                <h3 style={{ color: "#c62828", margin: "0 0 10px" }}>AI Discovery Encountered an Issue</h3>
                <p style={{ color: "var(--brown-soft)", marginBottom: "20px" }}>{discoverError}</p>
                <button className="btn-primary" onClick={handleTriggerDiscover}>Try Again</button>
              </div>
            )}

            {discoveredBird && (
              <>
                {discoveredBird.image_url && (
                  <div className="modal-header-frame">
                    <div
                      className="modal-header-backdrop"
                      style={{ backgroundImage: `url(${getSpeciesImageUrl(discoveredBird.name, discoveredBird.image_url)})` }}
                    />
                    <img
                      src={getSpeciesImageUrl(discoveredBird.name, discoveredBird.image_url)}
                      alt={discoveredBird.name}
                      className="modal-header-img"
                      onError={(e) => {
                        const fallback = getSpeciesImageUrl(discoveredBird.name);
                        if (fallback && !e.target.src.endsWith(fallback)) {
                          e.target.src = fallback;
                        }
                      }}
                    />
                  </div>
                )}

                <div className="modal-body">
                  <div className="modal-title-row">
                    <div>
                      <h2>{discoveredBird.name}</h2>
                      {discoveredBird.scientific_name && (
                        <div style={{ color: "#0d9488", fontStyle: "italic", fontWeight: 600, fontSize: "0.95rem", marginBottom: "4px" }}>
                          {discoveredBird.scientific_name}
                        </div>
                      )}
                      <span className="discover-badge-pill">✨ Auto-Saved to Catalog (#{discoveredBird.id})</span>
                    </div>
                    <span className="modal-tag">{discoveredBird.type}</span>
                  </div>

                  <div className="modal-grid">
                    <div className="modal-field">
                      <label>Natural Habitat</label>
                      <p>{discoveredBird.habitat || "Information not specified"}</p>
                    </div>
                    <div className="modal-field">
                      <label>Typical Lifespan</label>
                      <p>{discoveredBird.lifespan || "Information not specified"}</p>
                    </div>
                    <div className="modal-field full">
                      <label>Recommended Nutritional Diet</label>
                      <p>{discoveredBird.diet || "Information not specified"}</p>
                    </div>
                    <div className="modal-field full">
                      <label>Cage & Environmental Setup</label>
                      <p>{discoveredBird.cage_setup || "Information not specified"}</p>
                    </div>
                    <div className="modal-field full">
                      <label>Social & Behavioral Needs</label>
                      <p>{discoveredBird.social_needs || "Information not specified"}</p>
                    </div>
                    <div className="modal-field full">
                      <label>Fascinating Fun Facts</label>
                      <p>{discoveredBird.fun_facts || "Information not specified"}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>
                    <Link to={`/species/${discoveredBird.id}`} style={{ flex: 1, minWidth: "160px" }}>
                      <button className="btn-primary" style={{ width: "100%" }}>
                        View Full Species Page
                      </button>
                    </Link>
                    <Link
                      to={`/my-birds?species_id=${discoveredBird.id}&species_name=${encodeURIComponent(discoveredBird.name)}`}
                      style={{ flex: 1, minWidth: "160px" }}
                    >
                      <button className="btn-soft" style={{ width: "100%" }}>
                        + Add to My Birds
                      </button>
                    </Link>
                    <button
                      className="btn-secondary"
                      onClick={handleCloseDiscoverModal}
                      style={{ minWidth: "140px" }}
                    >
                      Close & View in List
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Species Detail Modal (Quick View) */}
      {selectedSpecies && (
        <div className="modal-overlay" onClick={() => setSelectedSpecies(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedSpecies(null)}>×</button>
            {selectedSpecies.image_url && (
              <div className="modal-header-frame">
                <div
                  className="modal-header-backdrop"
                  style={{ backgroundImage: `url(${getSpeciesImageUrl(selectedSpecies.name, selectedSpecies.image_url)})` }}
                />
                <img
                  src={getSpeciesImageUrl(selectedSpecies.name, selectedSpecies.image_url)}
                  alt={selectedSpecies.name}
                  className="modal-header-img"
                  onError={(e) => {
                    const fallback = getSpeciesImageUrl(selectedSpecies.name);
                    if (fallback && !e.target.src.endsWith(fallback)) {
                      e.target.src = fallback;
                    }
                  }}
                />
              </div>
            )}
            <div className="modal-body">
              <div className="modal-title-row">
                <div>
                  <h2>{selectedSpecies.name}</h2>
                  {selectedSpecies.scientific_name && (
                    <div style={{ color: "#0d9488", fontStyle: "italic", fontWeight: 600, fontSize: "0.95rem" }}>
                      {selectedSpecies.scientific_name}
                    </div>
                  )}
                </div>
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
