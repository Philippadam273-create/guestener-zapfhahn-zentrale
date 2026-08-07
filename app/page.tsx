"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EventItem = {
  id: string;
  title: string;
  location: string | null;
  start_date: string | null;
  description: string | null;
};

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [eventName, setEventName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadEvents() {
    const { data } = await supabase
      .from("events")
      .select("id, title, location, start_date, description")
      .order("start_date", { ascending: true });

    if (data) {
      setEvents(data);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function saveEvent() {
    if (!eventName.trim()) {
      setMessage("Bitte einen Eventnamen eingeben.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("events").insert({
      title: eventName,
      location: location || null,
      start_date: date || null,
      description: description || null,
      is_active: true,
    });

    if (error) {
      setMessage("Fehler beim Speichern: " + error.message);
      setSaving(false);
      return;
    }

    setEventName("");
    setLocation("");
    setDate("");
    setDescription("");
    setShowForm(false);
    setMessage("🍻 Event erfolgreich erstellt!");
    setSaving(false);

    loadEvents();
  }

  return (
    <main>
      <h1>🍻 Güstener Zapfhahn Zentrale</h1>

      <p>Deine Zentrale für Events, Getränke, Kosten und Rankings.</p>

      <h2>📅 Aktuelle Events</h2>

      {!showForm && (
        <button onClick={() => setShowForm(true)}>
          ➕ Neues Event erstellen
        </button>
      )}

      {showForm && (
        <div>
          <h3>Neues Event</h3>

          <input
            placeholder="Name des Events"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />

          <br />

          <input
            placeholder="Ort"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <br />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <br />

          <textarea
            placeholder="Beschreibung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <br />

          <button onClick={saveEvent} disabled={saving}>
            {saving ? "⏳ Speichert..." : "💾 Event speichern"}
          </button>

          <button onClick={() => setShowForm(false)}>
            Abbrechen
          </button>
        </div>
      )}

      {message && <p>{message}</p>}

      {events.length === 0 ? (
        <p>Noch keine Events vorhanden</p>
      ) : (
        events.map((event) => (
          <div key={event.id}>
            <h3>🍺 {event.title}</h3>

            {event.location && <p>📍 {event.location}</p>}

            {event.start_date && (
              <p>📅 {event.start_date}</p>
            )}

            {event.description && <p>{event.description}</p>}
          </div>
        ))
      )}

      <h2>🏆 Statistik</h2>

      <p>🍺 Getränke: 0</p>
      <p>👥 Teilnehmer: 0</p>
      <p>💶 Kosten: 0 €</p>
    </main>
  );
}
