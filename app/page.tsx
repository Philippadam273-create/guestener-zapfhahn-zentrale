"use client";

import { useState } from "react";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  function saveEvent() {
    if (!name.trim()) {
      setMessage("❗ Bitte einen Eventnamen eingeben.");
      return;
    }

    setMessage("🍻 Event wurde erstellt: " + name);
  }

  return (
    <main>
      <h1>🍻 Güstener Zapfhahn Zentrale</h1>

      <p>Deine Zentrale für Events, Getränke, Kosten und Rankings.</p>

      <h2>📅 Aktuelles Event</h2>

      {!showForm && (
        <button onClick={() => setShowForm(true)}>
          ➕ Neues Event erstellen
        </button>
      )}

      {showForm && (
        <div>
          <h2>Neues Event</h2>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name des Events"
          />

          <br /><br />

          <button onClick={saveEvent}>
            💾 Event speichern
          </button>

          {message && <p>{message}</p>}
        </div>
      )}

      <h2>🏆 Statistik</h2>

      <p>🍺 Getränke: 0</p>
      <p>👥 Teilnehmer: 0</p>
      <p>💶 Kosten: 0 €</p>
    </main>
  );
}
