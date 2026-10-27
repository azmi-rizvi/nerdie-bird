import { useState } from "react";
import "./Explore.css";

const BIRDS = [
  { name: "Parrot", type: "Pet", desc: "Colourful and intelligent.", fact: "Parrots can live over 50 years!" },
  { name: "Sparrow", type: "Wild", desc: "Small, common, and social.", fact: "Sparrows are found on every continent except Antarctica." },
  { name: "Owl", type: "Wild", desc: "Nocturnal and sharp-eyed.", fact: "Owls can rotate their heads up to 270°." },
  { name: "Peacock", type: "Wild", desc: "Famous for its feather display.", fact: "Only male peafowl are called peacocks." },
  { name: "Budgerigar", type: "Pet", desc: "A small, chatty parakeet.", fact: "Budgies can learn to mimic over 100 words." },
  { name: "Cockatiel", type: "Pet", desc: "Gentle and known for whistling.", fact: "Cockatiels can whistle entire tunes." },
];

const FILTERS = ["All", "Pet", "Wild"];

function Explore() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = BIRDS.filter((b) => {
    const matchesQuery = b.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All" || b.type === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <>
      <div className="head">
        <h1>Explore Birds</h1>
        <p>Discover different birds and learn more about them.</p>
      </div>

      <div className="esearch">
        <input
          type="text"
          placeholder="Search a bird"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={filter === f ? "btn-primary" : "btn-soft"}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="birds">
        {filtered.map((b) => (
          <div className="bird" key={b.name}>
            <span className="bird-tag">{b.type}</span>
            <h2>{b.name}</h2>
            <p>{b.desc}</p>
            <p className="fun-fact">🪶 {b.fact}</p>
            <button className="btn-soft">Learn More</button>
          </div>
        ))}
        {filtered.length === 0 && <p className="no-results">No birds match your search.</p>}
      </div>
    </>
  );
}

export default Explore;
