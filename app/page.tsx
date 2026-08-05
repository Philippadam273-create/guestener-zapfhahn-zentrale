"use client";

import { useState } from "react";

export default function Home() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main>
      <h1>🍻 Güstener Zapfhahn Zentrale</h1>

      <p>
        Deine Zentrale für Events, Getränke, Kosten und Rankings.
      </p>

      <h2>📅 Aktuelles Event</h2>

      {!showForm && (
        <button onClick={() => setShowForm(true)}>
          ➕ Neues Event erstellen
        </button>
      )}

      {showForm && (
        <div>
          <h3>Neues Event</h3>

          <input placeholder="Name des Events" />
          <br />

          <input placeholder="Ort" />
          <br />

          <input type="date" />
          <br />

          <textarea placeholder="Beschreibung" />
          <br />

          <button>
            💾 Event speichern
          </button>
        </div>
      )}

      <h2>🏆 Statistik</h2>
      <p>🍺 Getränke: 0</p>
      <p>👥 Teilnehmer: 0</p>
      <p>💶 Kosten: 0 €</p>
    </main>
  );
}
