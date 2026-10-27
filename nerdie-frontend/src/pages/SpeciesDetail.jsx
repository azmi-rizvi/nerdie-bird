import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getSpeciesById, getImageUrl } from "../services/api";
import "./SpeciesDetail.css";

function SpeciesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSpeciesById(id);
        setSpecies(data);
      } catch (err) {
        setError(err.message || "Failed to load species details");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="species-detail-container">
        <p style={{ textAlign: "center", padding: "60px 0" }}>Loading species profile from database...</p>
      </div>
    );
  }

  if (error || !species) {
    return (
      <div className="species-detail-container">
        <Link to="/explore" className="species-back-btn">← Back to Explore</Link>
        <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "16px" }}>
          <h2>Species Not Found</h2>
          <p style={{ color: "var(--brown-soft)", margin: "16px 0" }}>{error || "Could not locate this species in the database."}</p>
          <button className="btn-primary" onClick={() => navigate("/explore")}>Return to Explore</button>
        </div>
      </div>
    );
  }

  return (
    <div className="species-detail-container">
      <Link to="/explore" className="species-back-btn">← Back to Species List</Link>

      <div className="species-card">
        {species.image_url && (
          <img
            src={getImageUrl(species.image_url)}
            alt={species.name}
            className="species-banner-img"
          />
        )}

        <div className="species-content">
          <div className="species-header">
            <div>
              <h1>{species.name}</h1>
              <p style={{ margin: "6px 0 0", color: "var(--brown-soft)" }}>Species ID: #{species.id}</p>
            </div>
            <span className="species-type-pill">{species.type}</span>
          </div>

          <div className="species-sections">
            <div className="species-section-item">
              <h3>⏳ Typical Lifespan</h3>
              <p>{species.lifespan || "Information not specified"}</p>
            </div>

            <div className="species-section-item">
              <h3>💬 Social Needs & Behavior</h3>
              <p>{species.social_needs || "Information not specified"}</p>
            </div>

            <div className="species-section-item full-width">
              <h3>🌿 Natural Habitat & Geography</h3>
              <p>{species.habitat || "Information not specified"}</p>
            </div>

            <div className="species-section-item full-width">
              <h3>🥗 Recommended Nutritional Diet</h3>
              <p>{species.diet || "Information not specified"}</p>
            </div>

            <div className="species-section-item full-width">
              <h3>🏠 Ideal Cage & Environmental Setup</h3>
              <p>{species.cage_setup || "Information not specified"}</p>
            </div>

            <div className="species-section-item full-width">
              <h3>🪶 Fascinating Fun Facts</h3>
              <p>{species.fun_facts || "Information not specified"}</p>
            </div>
          </div>

          <div className="species-actions">
            <Link to={`/my-birds?species_id=${species.id}&species_name=${encodeURIComponent(species.name)}`}>
              <button className="btn-primary">
                + Add {species.name} to My Birds
              </button>
            </Link>
            <Link to="/symptoms">
              <button className="btn-soft">
                Check Symptoms for this Bird
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpeciesDetail;
