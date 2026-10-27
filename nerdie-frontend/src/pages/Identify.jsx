import { useState } from "react";
import "./Identify.css";

function Identify() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
    setResult(null);
  }

  async function handleIdentify() {
    if (!preview) return;
    setLoading(true);
    // TODO (Unit 5): replace this with a real call to your Express backend,
    // e.g. fetch("/api/identify", { method: "POST", body: formData })
    // which then calls the Gemini API and returns the species + facts.
    setTimeout(() => {
      setResult({
        species: "Budgerigar (example result)",
        fact: "This is placeholder data — wire this up once your backend/AI endpoint is ready.",
      });
      setLoading(false);
    }, 1200);
  }

  return (
    <>
      <div className="ihero">
        <h1>Identify a Bird</h1>
        <p>Upload a bird image and let Nerdie Birdie take a guess.</p>
      </div>

      <section className="identify">
        <h2>Upload Image</h2>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {preview && <img src={preview} alt="Preview" className="preview-img" />}
        <br />
        <button className="btn-primary" onClick={handleIdentify} disabled={!preview || loading}>
          {loading ? "Identifying..." : "Identify"}
        </button>
      </section>

      <section className="result">
        <h2>Result</h2>
        {!result && !loading && <p>Bird information will appear here.</p>}
        {loading && <p>Analyzing feathers and features...</p>}
        {result && (
          <div className="result-card">
            <h3>{result.species}</h3>
            <p>{result.fact}</p>
          </div>
        )}
      </section>
    </>
  );
}

export default Identify;
