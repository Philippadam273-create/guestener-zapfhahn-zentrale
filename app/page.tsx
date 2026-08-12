"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type EventItem = {
  id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  invite_code: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("events")
      .select(
        "id,title,description,location,invite_code,start_date,end_date,is_active"
      )
      .order("start_date", { ascending: false });

    if (error) {
      setMessage("❌ Events: " + error.message);
      setLoading(false);
      return;
    }

    setEvents(data || []);
    setLoading(false);
  }

  function createInviteCode() {
    return Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
  }

  async function createEvent() {
    setMessage("");

    if (!title.trim()) {
      setMessage("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    setSaving(true);

    const inviteCode = createInviteCode();

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        invite_code: inviteCode,
        start_date: startDate
          ? new Date(startDate).toISOString()
          : new Date().toISOString(),
        end_date: endDate
          ? new Date(endDate).toISOString()
          : null,
        is_active: true,
      })
      .select(
        "id,title,description,location,invite_code,start_date,end_date,is_active"
      )
      .single();

    if (error) {
      setMessage("❌ Event konnte nicht erstellt werden: " + error.message);
      setSaving(false);
      return;
    }

    if (data) {
      localStorage.setItem("guesten-active-event", data.id);
      localStorage.setItem("guesten-active-event-id", data.id);
    }

    setTitle("");
    setDescription("");
    setLocation("");
    setStartDate("");
    setEndDate("");

    await loadEvents();

    setSaving(false);
    setMessage(
      `✅ Event „${data?.title || "Event"}“ wurde erstellt. Einladungscode: ${
        data?.invite_code || inviteCode
      }`
    );
  }

  async function selectEvent(eventId: string) {
    localStorage.setItem("guesten-active-event", eventId);
    localStorage.setItem("guesten-active-event-id", eventId);

    const event = events.find((item) => item.id === eventId);

    setMessage(
      `✅ Event „${event?.title || "Event"}“ ausgewählt.`
    );

    window.location.href = "/";
  }

  async function toggleEvent(event: EventItem) {
    const newValue = !event.is_active;

    const { error } = await supabase
      .from("events")
      .update({
        is_active: newValue,
      })
      .eq("id", event.id);

    if (error) {
      setMessage("❌ Status: " + error.message);
      return;
    }

    await loadEvents();

    setMessage(
      newValue
        ? "✅ Event aktiviert."
        : "⏸️ Event pausiert."
    );
  }

  async function deleteEvent(event: EventItem) {
    const confirmed = window.confirm(
      `Soll das Event „${event.title || "Event"}“ wirklich gelöscht werden?\n\nAlle zugehörigen Daten können ebenfalls betroffen sein.`
    );

    if (!confirmed) return;

    setMessage("⏳ Event wird gelöscht...");

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", event.id);

    if (error) {
      setMessage("❌ Löschen: " + error.message);
      return;
    }

    const activeEvent =
      localStorage.getItem("guesten-active-event");

    if (activeEvent === event.id) {
      localStorage.removeItem("guesten-active-event");
      localStorage.removeItem("guesten-active-event-id");
    }

    await loadEvents();

    setMessage("✅ Event gelöscht.");
  }

  function formatDate(date: string | null) {
    if (!date) return "Kein Datum";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Kein Datum";
    }

    return parsed.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateTime(date: string | null) {
    if (!date) return "Kein Datum";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Kein Datum";
    }

    return parsed.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="page">
      <div className="container">

        <header className="header">
          <button
            className="backButton"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            ←
          </button>

          <div className="logo">
            🍻
          </div>

          <div>
            <h1>Events</h1>
            <p>
              Güstener Zapfhahn Zentrale
            </p>
          </div>
        </header>

        <section className="card createCard">

          <div className="sectionTitle">
            <div className="sectionIcon">
              ➕
            </div>

            <div>
              <h2>Neues Event erstellen</h2>
              <p>
                Starte eine neue Runde mit deinen Freunden.
              </p>
            </div>
          </div>

          <label>
            Eventname
          </label>

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="z.B. Testabend Güsten"
          />

          <label>
            Beschreibung
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="z.B. Gemeinsamer Abend im Vereinsheim..."
            rows={3}
          />

          <label>
            📍 Ort
          </label>

          <input
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
            placeholder="z.B. Güsten"
          />

          <div className="dateGrid">

            <div>
              <label>
                📅 Beginn
              </label>

              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
              />
            </div>

            <div>
              <label>
                📅 Ende
              </label>

              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
              />
            </div>

          </div>

          <button
            className="createButton"
            onClick={createEvent}
            disabled={saving}
          >
            {saving
              ? "⏳ Wird erstellt..."
              : "🍻 Event erstellen"}
          </button>

        </section>

        <section className="card">

          <div className="sectionTitle">
            <div className="sectionIcon">
              📅
            </div>

            <div>
              <h2>Meine Events</h2>
              <p>
                Wähle ein Event aus, um es zu öffnen.
              </p>
            </div>
          </div>

          {loading ? (

            <div className="loading">
              ⏳ Events werden geladen...
            </div>

          ) : events.length === 0 ? (

            <div className="empty">
              <div className="emptyIcon">
                🍺
              </div>

              <strong>
                Noch keine Events vorhanden
              </strong>

              <small>
                Erstelle oben dein erstes Event.
              </small>
            </div>

          ) : (

            <div className="eventList">

              {events.map((event) => (

                <div
                  className={
                    event.is_active
                      ? "event active"
                      : "event inactive"
                  }
                  key={event.id}
                >

                  <div className="eventTop">

                    <div className="eventIcon">
                      🍻
                    </div>

                    <div className="eventMain">

                      <div className="eventTitleRow">

                        <h3>
                          {event.title ||
                            "Unbenanntes Event"}
                        </h3>

                        <span
                          className={
                            event.is_active
                              ? "status activeStatus"
                              : "status inactiveStatus"
                          }
                        >
                          {event.is_active
                            ? "Aktiv"
                            : "Pausiert"}
                        </span>

                      </div>

                      {event.description && (
                        <p>
                          {event.description}
                        </p>
                      )}

                      <div className="meta">

                        <span>
                          📅{" "}
                          {formatDate(
                            event.start_date
                          )}
                        </span>

                        {event.location && (
                          <span>
                            📍 {event.location}
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                  <div className="invite">

                    <span>
                      🔗 Einladungscode
                    </span>

                    <strong>
                      {event.invite_code ||
                        "------"}
                    </strong>

                  </div>

                  <div className="eventActions">

                    <button
                      className="openButton"
                      onClick={() =>
                        selectEvent(event.id)
                      }
                    >
                      🚀 Event öffnen
                    </button>

                    <button
                      className="pauseButton"
                      onClick={() =>
                        toggleEvent(event)
                      }
                    >
                      {event.is_active
                        ? "⏸️ Pausieren"
                        : "▶️ Aktivieren"}
                    </button>

                    <button
                      className="deleteButton"
                      onClick={() =>
                        deleteEvent(event)
                      }
                    >
                      🗑️
                    </button>

                  </div>

                  <div className="details">

                    <span>
                      Start:{" "}
                      {formatDateTime(
                        event.start_date
                      )}
                    </span>

                    {event.end_date && (
                      <span>
                        Ende:{" "}
                        {formatDateTime(
                          event.end_date
                        )}
                      </span>
                    )}

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <footer>
          <strong>
            🍻 Güstener Zapfhahn Zentrale
          </strong>

          <small>
            Dein Event. Deine Getränke. Deine Runde.
          </small>
        </footer>

      </div>

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          padding: 16px;
          color: white;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          background:
            radial-gradient(
              circle at top,
              #29445d 0%,
              #0a0f16 62%
            );
        }

        .container {
          width: 100%;
          max-width: 850px;
          margin: auto;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 2px 25px;
        }

        .backButton {
          width: 44px;
          height: 44px;
          padding: 0;
          border-radius: 14px;
          background:
            rgba(255,255,255,.08);
          color: white;
          font-size: 24px;
        }

        .logo {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background:
            rgba(255,255,255,.07);
          font-size: 27px;
        }

        h1 {
          margin: 0;
          font-size: 25px;
        }

        h2 {
          margin: 0;
          font-size: 20px;
        }

        h3 {
          margin: 0;
          font-size: 17px;
        }

        p {
          margin: 5px 0 0;
          color: #94a3b8;
          line-height: 1.45;
        }

        small {
          color: #94a3b8;
        }

        .card {
          padding: 18px;
          margin-bottom: 15px;
          border-radius: 20px;
          background:
            rgba(255,255,255,.06);
          border:
            1px solid rgba(255,255,255,.08);
        }

        .createCard {
          border-color:
            rgba(245,158,11,.18);
        }

        .sectionTitle {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 20px;
        }

        .sectionIcon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background:
            rgba(245,158,11,.12);
          font-size: 21px;
        }

        label {
          display: block;
          margin: 12px 0 7px;
          color: #cbd5e1;
          font-size: 14px;
          font-weight: bold;
        }

        input,
        textarea {
          width: 100%;
          padding: 13px;
          border:
            1px solid #344252;
          border-radius: 12px;
          outline: none;
          background: #121a23;
          color: white;
          font-size: 15px;
        }

        textarea {
          resize: vertical;
          min-height: 90px;
          font-family: inherit;
        }

        input:focus,
        textarea:focus {
          border-color: #f59e0b;
        }

        .dateGrid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 10px;
        }

        button {
          border: 0;
          border-radius: 12px;
          padding: 12px 15px;
          font-weight: bold;
          cursor: pointer;
        }

        button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .createButton {
          width: 100%;
          margin-top: 18px;
          padding: 15px;
          background: #f59e0b;
          color: #111;
          font-size: 16px;
        }

        .loading,
        .empty {
          padding: 30px 15px;
          text-align: center;
          border-radius: 15px;
          background:
            rgba(255,255,255,.04);
        }

        .emptyIcon {
          font-size: 42px;
          margin-bottom: 10px;
        }

        .empty strong {
          display: block;
          font-size: 17px;
        }

        .empty small {
          display: block;
          margin-top: 7px;
        }

        .eventList {
          display: grid;
          gap: 12px;
        }

        .event {
          padding: 15px;
          border-radius: 17px;
          background:
            rgba(255,255,255,.045);
          border:
            1px solid rgba(255,255,255,.07);
        }

        .event.active {
          border-color:
            rgba(34,197,94,.25);
        }

        .event.inactive {
          opacity: .7;
        }

        .eventTop {
          display: flex;
          gap: 12px;
        }

        .eventIcon {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background:
            rgba(245,158,11,.12);
          font-size: 24px;
        }

        .eventMain {
          flex: 1;
          min-width: 0;
        }

        .eventTitleRow {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .status {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
        }

        .activeStatus {
          color: #4ade80;
          background:
            rgba(34,197,94,.12);
        }

        .inactiveStatus {
          color: #94a3b8;
          background:
            rgba(148,163,184,.12);
        }

        .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 10px;
          color: #94a3b8;
          font-size: 13px;
        }

        .invite {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 14px;
          padding: 11px 13px;
          border-radius: 12px;
          background: #111923;
        }

        .invite span {
          color: #94a3b8;
          font-size: 13px;
        }

        .invite strong {
          color: #fbbf24;
          font-size: 19px;
          letter-spacing: 3px;
        }

        .eventActions {
          display: grid;
          grid-template-columns:
            1fr auto auto;
          gap: 8px;
          margin-top: 10px;
        }

        .openButton {
          background: #f59e0b;
          color: #111;
        }

        .pauseButton {
          background: #334155;
          color: white;
        }

        .deleteButton {
          background: #3b2528;
          color: #fca5a5;
          min-width: 48px;
        }

        .details {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 11px;
          padding-top: 10px;
          border-top:
            1px solid
            rgba(255,255,255,.06);
          color: #64748b;
          font-size: 11px;
        }

        .message {
          position: sticky;
          bottom: 12px;
          z-index: 10;
          padding: 14px;
          margin-bottom: 15px;
          text-align: center;
          border-radius: 13px;
          background: #172535;
          border:
            1px solid
            rgba(245,158,11,.2);
          color: #fbbf24;
          box-shadow:
            0 8px 30px
            rgba(0,0,0,.25);
        }

        footer {
          padding: 25px;
          text-align: center;
          color: #64748b;
        }

        footer strong {
          display: block;
        }

        footer small {
          display: block;
          margin-top: 6px;
        }

        @media(max-width:650px) {

          .page {
            padding: 10px;
          }

          .dateGrid {
            grid-template-columns: 1fr;
          }

          .eventActions {
            grid-template-columns: 1fr 1fr;
          }

          .openButton {
            grid-column: 1 / -1;
          }

          .deleteButton {
            min-width: 0;
          }

          .invite {
            align-items: flex-start;
            flex-direction: column;
          }

          .invite strong {
            width: 100%;
            text-align: center;
            padding: 8px;
            border-radius: 8px;
            background: #0b1118;
          }

        }

      `}</style>

    </main>
  );
}
