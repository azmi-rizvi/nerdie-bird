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
        formData.append("photo", file);
      }
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      const res = await identifyBird(formData);
      setResult(res);
    } catch (err) {
      console.error("Identification failed:", err);
      setError(err.message || "Failed to identify bird. Please ensure the backend is running.");
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

  return (
    <>
      <div className="ihero">
        <h1>Bird Identification</h1>
        <p>Upload a photo or describe plumage, size, and markings to find an AI match.</p>
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
            <label htmlFor="bird-desc">Or Describe Features (Optional if photo provided):</label>
            <textarea
              id="bird-desc"
              placeholder="e.g. Small yellow bird with crest, orange cheek patches, whistling sounds..."
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
              {loading ? "Analyzing features..." : "Identify Bird"}
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
        <h2>Analysis Result</h2>
        {!result && !loading && <p>Bird species match and rationale will appear here.</p>}
        {loading && <p>Connecting to AI identification service & analyzing characteristics...</p>}

        {result && (
          <div className="result-card">
            <div className="result-header">
              <h3>{result.species}</h3>
              <span className="confidence-badge">{result.confidence}% Match Confidence</span>
            </div>

            {result.image_url && (
              <img
                src={getImageUrl(result.image_url)}
                alt={result.species}
                className="result-img"
              />
            )}

            <div className="result-rationale">
              <strong>Identification Rationale:</strong>
              <p>{result.rationale}</p>
            </div>

            <div className="result-stats">
              <div className="result-stat-box">
                <span>Family / Type</span>
                <strong>{result.type}</strong>
              </div>
              <div className="result-stat-box">
                <span>Typical Lifespan</span>
                <strong>{result.lifespan || "Varies"}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {result.species_id && (
                <Link to={`/species/${result.species_id}`} style={{ flex: 1 }}>
                  <button className="btn-primary" style={{ width: "100%" }}>
                    View Full Species Care Profile
                  </button>
                </Link>
              )}
              <Link
                to={`/my-birds?species_id=${result.species_id}&species_name=${encodeURIComponent(result.species)}`}
                style={{ flex: 1 }}
              >
                <button className="btn-soft" style={{ width: "100%" }}>
                  Save to My Birds
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
