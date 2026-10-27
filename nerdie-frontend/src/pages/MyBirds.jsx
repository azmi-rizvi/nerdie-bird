import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getMyBirds,
  createMyBird,
  updateMyBird,
  deleteMyBird,
  getSpecies,
  getImageUrl
} from "../services/api";
import mascot from "../assets/mascot-trans.png";
import "./MyBirds.css";

function MyBirds() {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillSpeciesId = searchParams.get("species_id");

  const [birds, setBirds] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBird, setEditingBird] = useState(null); // null = creating new

  // Form State
  const [formName, setFormName] = useState("");
  const [formSpeciesId, setFormSpeciesId] = useState(prefillSpeciesId || "");
  const [formAge, setFormAge] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Load birds & species on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // If prefilled from Explore page, automatically open the modal
  useEffect(() => {
    if (prefillSpeciesId && speciesList.length > 0) {
      setFormSpeciesId(prefillSpeciesId);
      setIsModalOpen(true);
    }
  }, [prefillSpeciesId, speciesList]);

  async function loadAllData() {
    setLoading(true);
    setError(null);
    try {
      const [fetchedBirds, fetchedSpecies] = await Promise.all([
        getMyBirds(),
        getSpecies()
      ]);
      setBirds(fetchedBirds);
      setSpeciesList(fetchedSpecies);
    } catch (err) {
      console.error("Failed to load user birds:", err);
      setError(err.message || "Failed to connect to database");
    } finally {
      setLoading(false);
    }
  }

  function showToastMessage(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleOpenCreate() {
    setEditingBird(null);
    setFormName("");
    setFormSpeciesId(prefillSpeciesId || (speciesList[0] ? speciesList[0].id : ""));
    setFormAge("");
    setFormNotes("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(bird) {
    setEditingBird(bird);
    setFormName(bird.name);
    setFormSpeciesId(bird.species_id || "");
    setFormAge(bird.age || "");
    setFormNotes(bird.notes || "");
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingBird(null);
    if (prefillSpeciesId) {
      setSearchParams({});
    }
  }

  async function handleSaveBird(e) {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Please provide a name for your bird.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        species_id: formSpeciesId ? parseInt(formSpeciesId, 10) : null,
        age: formAge.trim(),
        notes: formNotes.trim()
      };

      if (editingBird) {
        // Update existing bird
        const updated = await updateMyBird(editingBird.id, payload);
        setBirds((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        showToastMessage(`Successfully updated profile for ${updated.name}!`);
      } else {
        // Create new bird
        const created = await createMyBird(payload);
        setBirds((prev) => [created, ...prev]);
        showToastMessage(`Successfully added ${created.name} to your flock!`);
      }
      handleCloseModal();
    } catch (err) {
      alert(`Error saving bird: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBird(id, name) {
    const confirmed = window.confirm(`Are you sure you want to delete ${name}'s profile? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteMyBird(id);
      setBirds((prev) => prev.filter((b) => b.id !== id));
      showToastMessage(`Removed profile for ${name}.`);
    } catch (err) {
      alert(`Error deleting bird: ${err.message}`);
    }
  }

  return (
    <>
      <div className="ihero">
        <h1>My Birds</h1>
        <p>Save and manage personal bird profiles, behavioral logs, and health notes.</p>
      </div>

      <div className="my-birds-container">
        {toast && <div className="status-toast">{toast}</div>}

        <div className="my-birds-header-row">
          <div>
            <h2>My Feathered Flock ({birds.length})</h2>
            <p style={{ margin: "4px 0 0", color: "var(--brown-soft)", fontSize: "14px" }}>
              Keep track of age, individual species requirements, and daily care observations.
            </p>
          </div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            + Add New Bird
          </button>
        </div>

        {loading && <p style={{ textAlign: "center", padding: "40px" }}>Loading your birds from database...</p>}

        {error && (
          <div style={{ background: "#ffebee", padding: "20px", borderRadius: "12px", textAlign: "center", color: "#c62828" }}>
            <p>⚠️ {error}</p>
            <button className="btn-secondary" onClick={loadAllData}>Retry Connection</button>
          </div>
        )}

        {!loading && !error && birds.length === 0 && (
          <div className="empty-state">
            <img src={mascot} alt="Mascot" style={{ width: "90px", height: "auto", marginBottom: "16px" }} />
            <h3>No birds logged yet</h3>
            <p>Add your companion bird to track their milestones, diet logs, and health notes over time.</p>
            <button className="btn-primary" onClick={handleOpenCreate}>
              Log Your First Bird
            </button>
          </div>
        )}

        {!loading && !error && birds.length > 0 && (
          <div className="birds-grid">
            {birds.map((bird) => {
              const displayImage = bird.species_image ? getImageUrl(bird.species_image) : mascot;
              return (
                <div className="user-bird-card" key={bird.id}>
                  <img
                    src={displayImage}
                    alt={bird.name}
                    className="user-bird-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = mascot;
                    }}
                  />
                  <div className="user-bird-body">
                    <div className="user-bird-title-row">
                      <h3>{bird.name}</h3>
                      <span className="species-badge">{bird.species_name || "Custom Species"}</span>
                    </div>

                    <p className="user-bird-age">
                      Age: {bird.age || "Not specified"}
                    </p>

                    <div className="user-bird-notes">
                      <strong>Care & Behavioral Notes</strong>
                      <p style={{ margin: 0 }}>{bird.notes || "No notes logged yet."}</p>
                    </div>

                    <div className="user-bird-meta">
                      Logged on: {bird.created_at ? new Date(bird.created_at).toLocaleDateString() : "Recently"}
                    </div>

                    <div className="user-bird-actions">
                      <button
                        className="btn-soft"
                        onClick={() => handleOpenEdit(bird)}
                        style={{ flex: 1 }}
                      >
                        Edit Notes
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteBird(bird.id, bird.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Bird Modal */}
      {isModalOpen && (
        <div className="crud-modal-overlay" onClick={handleCloseModal}>
          <div className="crud-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crud-modal-header">
              <h2>{editingBird ? `Edit ${editingBird.name}'s Profile` : "Add a New Bird"}</h2>
              <button
                onClick={handleCloseModal}
                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--brown)" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBird}>
              <div className="crud-form-group">
                <label htmlFor="b-name">Bird's Name *</label>
                <input
                  id="b-name"
                  type="text"
                  placeholder="e.g. Sunny, Pip, Charlie..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="crud-form-group">
                <label htmlFor="b-species">Species *</label>
                <select
                  id="b-species"
                  value={formSpeciesId}
                  onChange={(e) => setFormSpeciesId(e.target.value)}
                >
                  <option value="">-- Select Species --</option>
                  {speciesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="crud-form-group">
                <label htmlFor="b-age">Age / Life Stage</label>
                <input
                  id="b-age"
                  type="text"
                  placeholder="e.g. 1 year, 6 months, juvenile..."
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value)}
                />
              </div>

              <div className="crud-form-group">
                <label htmlFor="b-notes">Health, Dietary & Behavioral Notes</label>
                <textarea
                  id="b-notes"
                  placeholder="Notes on favorite foods, vocal habits, molting schedules, veterinary history..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="crud-btn-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving to Database..." : (editingBird ? "Save Changes" : "Create Profile")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default MyBirds;
