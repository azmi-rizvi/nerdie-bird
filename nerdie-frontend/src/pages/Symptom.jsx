import { useState, useEffect, useRef } from "react";
import { getSymptoms, checkSymptoms } from "../services/api";
import "./Symptom.css";

const FALLBACK_SYMPTOMS = [
  { id: 1, symptom: "Not eating", vet_emergency: 1 },
  { id: 2, symptom: "Feather loss", vet_emergency: 0 },
  { id: 3, symptom: "Low activity", vet_emergency: 1 },
  { id: 4, symptom: "Breathing problem", vet_emergency: 1 },
  { id: 5, symptom: "Unusual stool", vet_emergency: 1 },
  { id: 6, symptom: "Excessive scratching", vet_emergency: 0 },
  { id: 7, symptom: "Tail bobbing", vet_emergency: 1 },
  { id: 8, symptom: "Bleeding / Broken Blood Feather", vet_emergency: 1 }
];

function Symptom() {
  const [symptomsList, setSymptomsList] = useState(FALLBACK_SYMPTOMS);
  const [birdSpecies, setBirdSpecies] = useState("");
  const [birdName, setBirdName] = useState("");
  const [customSymptom, setCustomSymptom] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const resultRef = useRef(null);

  useEffect(() => {
    async function loadSymptoms() {
      try {
        const data = await getSymptoms();
        if (Array.isArray(data) && data.length > 0) {
          setSymptomsList(data);
        }
      } catch (err) {
        console.warn("Using fallback symptoms list:", err);
      }
    }
    loadSymptoms();
  }, []);

  // Smooth auto-scroll to loader or results
  useEffect(() => {
    if (checking && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [checking]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  function handleToggleSymptom(symptomName) {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomName)
        ? prev.filter((s) => s !== symptomName)
        : [...prev, symptomName]
    );
  }

  async function handleCheck(e) {
    if (e) e.preventDefault();

    const allSymptoms = [...selectedSymptoms];
    if (customSymptom.trim() && !allSymptoms.includes(customSymptom.trim())) {
      allSymptoms.push(customSymptom.trim());
    }

    if (allSymptoms.length === 0) {
      setError("Please select or type at least one symptom to evaluate.");
      return;
    }

    setChecking(true);
    setError(null);
    setResult(null);

    try {
      const data = await checkSymptoms({
        symptoms: allSymptoms,
        species: birdSpecies.trim() || undefined,
        birdName: birdName.trim() || undefined
      });
      setResult(data);
    } catch (err) {
      console.error("Symptom check error:", err);
      setError(err.message || "Failed to analyze symptoms. Ensure backend is running.");
    } finally {
      setChecking(false);
    }
  }

  function handleReset() {
    setSelectedSymptoms([]);
    setCustomSymptom("");
    setBirdSpecies("");
    setBirdName("");
    setResult(null);
    setError(null);
  }

  // Normalize causes and tips to arrays if returned as string
  const causes = result
    ? (Array.isArray(result.possible_causes) ? result.possible_causes : [result.possible_causes].filter(Boolean))
    : [];
  const tips = result
    ? (Array.isArray(result.care_tips) ? result.care_tips : [result.care_tips].filter(Boolean))
    : [];
  const isEmergency = result ? Boolean(result.vet_emergency_flag || result.vet_emergency) : false;

  return (
    <>
      <div className="ihero">
        <h1>Gemini AI Symptom Checker</h1>
        <p>Analyze observed avian health symptoms using Google Gen AI clinical evaluation.</p>
        <p><strong>This is general information, not veterinary advice or a diagnosis. Seek an avian veterinarian for medical concerns; breathing trouble, collapse, or active bleeding needs emergency care.</strong></p>
      </div>

      <section className="symptom">
        <h2>Avian Health Check</h2>

        <form onSubmit={handleCheck}>
          <div className="symptom-form-row">
            <div className="symptom-input-group">
              <label htmlFor="bird-species-input">Bird Species / Type (e.g. Budgie, Cockatiel):</label>
              <input
                id="bird-species-input"
                type="text"
                placeholder="e.g. Budgie, African Grey, Canary..."
                value={birdSpecies}
                onChange={(e) => setBirdSpecies(e.target.value)}
              />
            </div>

            <div className="symptom-input-group">
              <label htmlFor="bird-name-input">Bird's Name (Optional):</label>
              <input
                id="bird-name-input"
                type="text"
                placeholder="e.g. Sunny, Pip, Kiwi..."
                value={birdName}
                onChange={(e) => setBirdName(e.target.value)}
              />
            </div>
          </div>

          <label className="checkboxes-label">Select Observed Symptoms (Check all that apply):</label>
          <div className="symptom-checkbox-grid">
            {symptomsList.map((item) => {
              const isChecked = selectedSymptoms.includes(item.symptom);
              return (
                <label
                  key={item.id || item.symptom}
                  className={`checkbox-item ${isChecked ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleSymptom(item.symptom)}
                  />
                  <span>{item.symptom}</span>
                  {item.vet_emergency === 1 && (
                    <span className="emergency-tag" title="Critical symptom">Urgent</span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="symptom-input-group">
            <label htmlFor="custom-symptom-input">Or Type Additional Observed Symptoms:</label>
            <input
              id="custom-symptom-input"
              type="text"
              placeholder="e.g. sneezing with discharge, clicking sounds while breathing, clicking beak..."
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
            />
          </div>

          {error && <div style={{ color: "#c62828", marginBottom: "14px", fontWeight: "600" }}>⚠️ {error}</div>}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={(selectedSymptoms.length === 0 && !customSymptom.trim()) || checking}
              style={{ flex: 1 }}
            >
              {checking ? "Analyzing with Gemini AI..." : "Analyze Symptoms with AI"}
            </button>
            {(selectedSymptoms.length > 0 || customSymptom || result) && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                disabled={checking}
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* AI Loading Feedback Card */}
        {checking && (
          <div className="ai-loading-card" ref={resultRef}>
            <div className="ai-spinner"></div>
            <div className="ai-loading-text">
              <h3>Consulting Gemini AI Avian Health Assistant...</h3>
              <p>Analyzing reported symptoms in the context of avian anatomy, evaluating urgency levels, and generating safe supportive advice. Please wait a moment.</p>
            </div>
          </div>
        )}

        {/* AI Evaluation Result Section */}
        {result && (
          <div className="result-section" ref={resultRef}>
            <div className={`alert-banner ${isEmergency ? "emergency" : "advisory"}`}>
              <h3>
                {isEmergency
                  ? "🚨 CRITICAL: IMMEDIATE AVIAN VET MEDICAL ATTENTION REQUIRED"
                  : "ℹ️ AVIAN HEALTH ADVISORY: HOME MONITORING"}
              </h3>
              <p>
                <strong>Evaluation for {result.bird_name || birdSpecies || "your bird"}:</strong>{" "}
                {result.recommendation_summary}
              </p>
            </div>

            <div className="causes-box">
              <h4>🩺 AI Possible Causes & Clinical Explanations:</h4>
              <ul>
                {causes.map((cause, idx) => (
                  <li key={idx}>{cause}</li>
                ))}
              </ul>
            </div>

            <div className="care-box">
              <h4>🏡 Supportive Care & Home First-Aid Considerations:</h4>
              <ul>
                {tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="prominent-disclaimer">
              <strong>⚠️ VETERINARY MEDICAL DISCLAIMER</strong>
              {result.disclaimer || "This tool provides general information only; it is not veterinary advice or a diagnosis. Contact a licensed avian veterinarian for medical concerns."}
            </div>
          </div>
        )}
      </section>

      {/* Common Avian Warning Signs - Responsive Left-to-Right Grid */}
      <section className="result">
        <h2>Common Avian Warning Signs</h2>
        <div className="warning-signs-grid">
          <div className="warning-card">
            <h3>Not Eating</h3>
            <p>Rapid avian metabolism means going 24 hours without eating can cause hepatic lipidosis and hypoglycemia.</p>
          </div>
          <div className="warning-card">
            <h3>Tail Bobbing</h3>
            <p>Rhythmic bobbing of the tail feathers with breath cycles indicates acute respiratory compromise.</p>
          </div>
          <div className="warning-card">
            <h3>Fluffed on Cage Floor</h3>
            <p>Sitting puffed at the bottom of the cage signifies hypothermia and severe illness.</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default Symptom;
