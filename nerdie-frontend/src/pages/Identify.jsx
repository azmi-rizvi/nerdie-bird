import { useState } from "react";
import { Link } from "react-router-dom";
import { identifyBird, getImageUrl } from "../services/api";
import "./Identify.css";

function Identify() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  }

  async function handleIdentify(e) {
    if (e) e.preventDefault();
    if (!file && !description.trim()) {
      setError("Please select an image or enter a text description to identify.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      if (file) {
        // Append both 'photo' and 'image' to satisfy multer / specs
        formData.append("photo", file);
        formData.append("image", file);
      }
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      const res = await identifyBird(formData);
      setResult(res);
    } catch (err) {
      console.error("Identification failed:", err);
      setError(err.message || "Failed to identify bird. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPreview(null);
    setDescription("");
    setResult(null);
    setError(null);
  }

  const speciesDisplayName = result ? (result.species_name || result.species) : "";

  return (
    <>
      <div className="ihero">
        <h1>Gemini AI Bird Identification</h1>
        <p>Upload a photo or describe plumage, size, and markings to identify bird species using Google Gen AI.</p>
      </div>

      <section className="identify">
        <h2>Identify a Bird</h2>

        <form onSubmit={handleIdentify} className="identify-form">
          <div className="upload-dropzone">
            <label htmlFor="bird-file-input" className="dropzone-label">
              <span className="dropzone-icon">📷</span>
              <strong>{file ? file.name : "Click to select or upload a bird photo"}</strong>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--brown-soft)" }}>
                Supports JPG, PNG, WEBP (Up to 10MB)
              </p>
            </label>
            <input
              id="bird-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {preview && <img src={preview} alt="Bird Preview" className="preview-img" />}
          </div>

          <div className="desc-input-group">
            <label htmlFor="bird-desc">Or Describe Features (Colors, Markings, Crest, Habitat):</label>
            <textarea
              id="bird-desc"
              placeholder="e.g. Small parrot with prominent yellow crest, bright orange cheek spots, and whistling habits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <div className="error-banner">⚠️ {error}</div>}

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || (!file && !description.trim())}
              style={{ flex: 1 }}
            >
              {loading ? "Analyzing with Gemini AI..." : "Identify Bird"}
            </button>
            {(file || description || result) && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="result">
        <h2>AI Analysis Results</h2>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p style={{ margin: 0, fontWeight: 600 }}>Analyzing plumage and visual markers with Gemini AI...</p>
          </div>
        )}

        {!result && !loading && (
          <p>Bird species match, confidence score, and factual care profile will appear here.</p>
        )}

        {result && (
          <div className="result-card">
            <div className="result-header">
              <h3>{speciesDisplayName}</h3>
              <span className="confidence-badge">
                Confidence: {result.confidence}
              </span>
            </div>

            {result.image_url && (
              <img
                src={getImageUrl(result.image_url)}
                alt={speciesDisplayName}
                className="result-img"
              />
            )}

            <div className="result-description-box">
              <strong>AI Physical Description & Rationale:</strong>
              <p>{result.description || result.rationale}</p>
            </div>

            {Array.isArray(result.fun_facts) && result.fun_facts.length > 0 && (
              <div className="result-facts-box">
                <h4>🪶 Fascinating Fun Facts:</h4>
                <ul>
                  {result.fun_facts.map((fact, idx) => (
                    <li key={idx}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="result-stats">
              <div className="result-stat-box">
                <span>Natural Habitat</span>
                <p>{result.habitat || "Arid and temperate woodlands"}</p>
              </div>
              <div className="result-stat-box">
                <span>Recommended Diet</span>
                <p>{result.diet || "Balanced formulated pellets & fresh greens"}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {result.species_id ? (
                <Link to={`/species/${result.species_id}`} style={{ flex: 1, minWidth: "180px" }}>
                  <button className="btn-primary" style={{ width: "100%" }}>
                    View Full Species Care Profile
                  </button>
                </Link>
              ) : null}
              <Link
                to={`/my-birds?species_name=${encodeURIComponent(speciesDisplayName)}${result.species_id ? `&species_id=${result.species_id}` : ''}`}
                style={{ flex: 1, minWidth: "180px" }}
              >
                <button className="btn-soft" style={{ width: "100%" }}>
                  + Add {speciesDisplayName} to My Birds
                </button>
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default Identify;
