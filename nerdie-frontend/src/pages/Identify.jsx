import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { identifyBird, getImageUrl, getSpeciesImageUrl } from "../services/api";
import mascot from "../assets/mascot-trans.png";
import "./Identify.css";

function Identify() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  // Smooth auto-scroll to loader or results
  useEffect(() => {
    if (loading && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError("Unsupported image type. Please choose a JPEG, PNG, or WEBP image.");
        e.target.value = "";
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError("Image is too large. Please choose an image no larger than 10 MB.");
        e.target.value = "";
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  }

  function handleRemoveFile(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
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
      setError(err.message || "Failed to identify bird. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    handleRemoveFile();
    setDescription("");
    setResult(null);
    setError(null);
  }

  const speciesDisplayName = result ? (result.species_name || result.species) : "";
  const rawReturnedImg = result ? (result.web_image_url || result.image_url || result.gemini_image_url || result.local_image_url) : null;
  const resultDisplayImg = rawReturnedImg
    ? (getSpeciesImageUrl(speciesDisplayName, rawReturnedImg) || rawReturnedImg)
    : (result ? getSpeciesImageUrl(speciesDisplayName) : mascot);

  return (
    <>
      <div className="ihero">
        <h1>Gemini AI Bird Identification</h1>
        <p>Upload a photo or describe plumage, size, and markings to identify bird species using Google Gen AI.</p>
      </div>

      <section className="identify">
        <h2>Identify a Bird</h2>

        <form onSubmit={handleIdentify} className="identify-form">
          <div
            className={`upload-dropzone ${file ? "has-file" : ""}`}
            onClick={() => {
              if (!file && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              id="bird-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />

            {!file ? (
              <label htmlFor="bird-file-input" className="dropzone-label">
                <span className="dropzone-icon">📷</span>
                <strong>Click to select or upload a bird photo</strong>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--brown-soft)" }}>
                  Supports JPG, PNG, WEBP (Up to 10MB)
                </p>
              </label>
            ) : (
              <div className="preview-container" onClick={(e) => e.stopPropagation()}>
                <div className="preview-header-bar">
                  <span className="preview-filename">📷 {file.name}</span>
                  <button
                    type="button"
                    className="btn-cross-remove"
                    onClick={handleRemoveFile}
                    title="Remove uploaded image"
                    aria-label="Remove uploaded image"
                  >
                    ✕
                  </button>
                </div>

                {preview && (
                  <div className="preview-img-wrapper">
                    <img src={preview} alt="Bird Preview" className="preview-img" />
                    <button
                      type="button"
                      className="preview-img-close-btn"
                      onClick={handleRemoveFile}
                      title="Remove uploaded image"
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="preview-action-row">
                  <button
                    type="button"
                    className="btn-change-photo"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    🔄 Change Photo
                  </button>
                  <button
                    type="button"
                    className="btn-remove-photo-text"
                    onClick={handleRemoveFile}
                  >
                    ✕ Remove Image
                  </button>
                </div>
              </div>
            )}
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

        {/* AI Loading Feedback Card */}
        {loading && (
          <div className="ai-loading-card" ref={resultRef}>
            <div className="ai-spinner"></div>
            <div className="ai-loading-text">
              <h3>Analyzing with Gemini AI...</h3>
              <p>Examining plumage patterns, beak geometry, and physical markers to identify the species. Please wait a moment.</p>
            </div>
          </div>
        )}

        {!result && !loading && (
          <p>Bird species match, confidence score, and factual care profile will appear here.</p>
        )}

        {result && (
          <div className="result-card" ref={resultRef}>
            <div className="result-header">
              <div>
                <h3>{speciesDisplayName}</h3>
                {result.scientific_name && (
                  <div style={{ color: "#0d9488", fontStyle: "italic", fontWeight: 600, fontSize: "0.95rem", marginTop: "2px" }}>
                    {result.scientific_name}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "6px" }}>
                  {result.type && <span className="modal-tag">{result.type}</span>}
                  {result.auto_saved_to_db && (
                    <span className="discover-badge-pill">
                      ✨ Auto-Added to Species Catalog (#{result.species_id})
                    </span>
                  )}
                </div>
              </div>
              <span className="confidence-badge">
                Confidence: {result.confidence}
              </span>
            </div>

            {/* Feature: Prominent Bird Image Display with ambient framed showcase */}
            <div className="result-img-frame">
              {resultDisplayImg && (
                <div
                  className="result-img-backdrop"
                  style={{ backgroundImage: `url("${resultDisplayImg}")` }}
                />
              )}
              <img
                src={resultDisplayImg || mascot}
                alt={speciesDisplayName}
                className="result-img"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                loading="eager"
                onError={(e) => {
                  console.warn("Primary image load failed for:", e.target.src);
                  const candidateFallback = result?.local_image_url || result?.gemini_image_url || getSpeciesImageUrl(speciesDisplayName);
                  if (candidateFallback && e.target.src !== candidateFallback && !e.target.src.endsWith(candidateFallback)) {
                    e.target.src = candidateFallback;
                  } else if (!e.target.src.endsWith(mascot)) {
                    e.target.src = mascot;
                  }
                }}
              />
            </div>

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
                <p>{result.habitat || "Not provided"}</p>
              </div>
              <div className="result-stat-box">
                <span>Recommended Diet</span>
                <p>{result.diet || "Not provided"}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
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
