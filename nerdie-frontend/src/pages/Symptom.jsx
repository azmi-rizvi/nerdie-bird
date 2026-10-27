import { useState } from "react";
import "./Symptom.css";

const SYMPTOMS = [
  "Not eating",
  "Feather loss",
  "Low activity",
  "Breathing problem",
  "Unusual stool",
  "Excessive scratching",
];

function Symptom() {
  const [birdName, setBirdName] = useState("");
  const [symptom, setSymptom] = useState("");
  const [checking, setChecking] = useState(false);
  const [advice, setAdvice] = useState(null);

  function handleCheck() {
    if (!symptom) return;
    setChecking(true);
    // TODO (Unit 5): replace with fetch("/api/symptom-check", { method: "POST", body: JSON.stringify({ birdName, symptom }) })
    setTimeout(() => {
      setAdvice(`Possible causes for "${symptom}" will appear here once the AI endpoint is connected.`);
      setChecking(false);
    }, 1000);
  }

  return (
    <>
      <div className="ihero">
        <h1>Symptom Checker</h1>
        <p>Select a symptom to get possible causes.</p>
      </div>

      <section className="symptom">
        <h2>Check Symptoms</h2>
        <input
          type="text"
          placeholder="Enter bird name"
          value={birdName}
          onChange={(e) => setBirdName(e.target.value)}
        />
        <select value={symptom} onChange={(e) => setSymptom(e.target.value)}>
          <option value="">Select symptom</option>
          {SYMPTOMS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={handleCheck} disabled={!symptom || checking}>
          {checking ? "Checking..." : "Check"}
        </button>

        {advice && <p className="advice">{advice}</p>}
        <p className="disclaimer">
          ⚠️ This tool gives general information only and is not a substitute for veterinary advice.
        </p>
      </section>

      <section className="result">
        <h2>Common Symptoms</h2>
        <div className="card">
          <div className="b"><h3>Not Eating</h3><p>Watch your bird and check for other changes.</p></div>
          <div className="b"><h3>Feather Loss</h3><p>Keep an eye on unusual feather loss.</p></div>
          <div className="b"><h3>Low Activity</h3><p>Your bird may need rest or attention.</p></div>
        </div>
      </section>
    </>
  );
}

export default Symptom;
