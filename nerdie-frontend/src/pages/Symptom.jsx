import { useState, useEffect } from "react";
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
  const [birdName, setBirdName] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

  function handleToggleSymptom(symptomName) {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomName)
        ? prev.filter((s) => s !== symptomName)
        : [...prev, symptomName]
    );
  }

  async function handleCheck(e) {
    if (e) e.preventDefault();
    if (selectedSymptoms.length === 0) {
      setError("Please select at least one symptom to evaluate.");
      return;
    }

    setChecking(true);
    setError(null);
    setResult(null);

    try {
      const data = await checkSymptoms({
        symptoms: selectedSymptoms,
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
    setBirdName("");
    setResult(null);
    setError(null);
  }

  return (
    <>
      <div className="ihero">
        <h1>Symptom Checker</h1>
        <p>Select observed symptoms to evaluate possible causes and veterinary urgency.</p>
      </div>

      <section className="symptom">
        <h2>Avian Health Check</h2>

        <form onSubmit={handleCheck}>
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
                    <span className="emergency-tag" title="Urgent medical indicator">Alert</span>
                  )}
                </label>
              );
            })}
          </div>

          {error && <div style={{ color: "#c62828", marginBottom: "14px", fontWeight: "600" }}>⚠️ {error}</div>}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={selectedSymptoms.length === 0 || checking}
              style={{ flex: 1 }}
            >
              {checking ? "Evaluating with Avian Health Database..." : `Analyze (${selectedSymptoms.length}) Symptoms`}
            </button>
            {(selectedSymptoms.length > 0 || result) && (
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

        {result && (
          <div className="result-section">
            <div className={`alert-banner ${result.vet_emergency ? "emergency" : "advisory"}`}>
              <h3>
                {result.vet_emergency ? "🚨 EMERGENCY ALERT: IMMEDIATE AVIAN VET CARE REQUIRED" : "ℹ️ HEALTH ADVISORY: HOME MONITORING"}
              </h3>
              <p><strong>Evaluation for {result.bird_name}:</strong> {result.recommendation_summary}</p>
            </div>

            <div className="causes-box">
              <h4>🩺 Possible Underlying Causes:</h4>
              <pre>{result.possible_causes}</pre>
            </div>

            <div className="care-box">
              <h4>🏡 First-Aid & Supportive Care Tips:</h4>
              <pre>{result.care_tips}</pre>
            </div>
          </div>
        )}

        <p className="disclaimer">
          ⚠️ <strong>Medical Disclaimer:</strong> FeatherCare is an educational tool and does not provide formal medical diagnoses. Birds instinctively conceal illness until advanced. In case of sudden lethargy, bleeding, or breathing difficulty, always consult a licensed avian veterinarian immediately.
        </p>
      </section>

      <section className="result">
        <h2>Common Early Warning Signs</h2>
        <div className="card">
          <div className="b">
            <h3>Not Eating</h3>
            <p>Loss of appetite or seed crumbling without swallowing can lead to hypoglycemia within 24-48 hours.</p>
          </div>
          <div className="b">
            <h3>Feather Loss</h3>
            <p>Watch for symmetrical plucking vs seasonal molting. Plucking often indicates boredom, diet, or mites.</p>
          </div>
          <div className="b">
            <h3>Tail Bobbing</h3>
            <p>Rhythmic bobbing of the tail feathers while breathing signifies acute respiratory compromise.</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default Symptom;
