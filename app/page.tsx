"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type EventItem = {
  id: string;
  title: string;
};

type DrinkItem = {
  id: string;
  event_id: string;
  drink_name: string | null;
  getraenk: string | null;
  liters: number | null;
  menge: number | null;
  alcohol_percent: number | null;
  alkohol: number | null;
  preis: number | null;
  quantity: number | null;
};

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [drinks, setDrinks] = useState<DrinkItem[]>([]);

  const [eventId, setEventId] = useState("");
  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("1.20");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setMessage("");

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("id, title")
      .order("created_at", { ascending: false });

    if (eventError) {
      setMessage("❌ Events: " + eventError.message);
      setLoading(false);
      return;
    }

    const loadedEvents = eventData || [];
    setEvents(loadedEvents);

    if (!eventId && loadedEvents.length > 0) {
      setEventId(loadedEvents[0].id);
    }

    const { data: drinkData, error: drinkError } = await supabase
      .from("drinks")
      .select(
        "id, event_id, drink_name, getraenk, liters, menge, alcohol_percent, alkohol, preis, quantity"
      )
      .order("created_at", { ascending: false });

    if (drinkError) {
      setMessage("❌ Getränke: " + drinkError.message);
      setLoading(false);
      return;
    }

    setDrinks(drinkData || []);
    setLoading(false);
  }

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage("❗ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      setMessage("❗ Bitte einen Getränkenamen eingeben.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("drinks").insert([
      {
        event_id: eventId,
        drink_name: drinkName.trim(),
        getraenk: drinkName.trim(),
        liters: Number(liters) || 0,
        menge: Number(liters) || 0,
        alcohol_percent: Number(alcohol) || 0,
        alkohol: Number(alcohol) || 0,
        preis: Number(price) || 0,
        quantity: 1,
      },
    ]);

    setSaving(false);

    if (error) {
      setMessage("❌ Speichern fehlgeschlagen: " + error.message);
      return;
    }

    setMessage("✅ Getränk erfolgreich gespeichert!");

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("1.20");

    await loadData();
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedDrinks = drinks.filter(
    (drink) => drink.event_id === eventId
  );

  const totalCost = selectedDrinks.reduce(
    (sum, drink) =>
      sum +
      Number(drink.preis || 0) *
        Number(drink.quantity || 1),
    0
  );

  const totalLiters = selectedDrinks.reduce(
    (sum, drink) =>
      sum +
      Number(drink.liters ?? drink.menge ?? 0) *
        Number(drink.quantity || 1),
    0
  );

  return (
    <main className="page">
      <div className="container">

        <header className="hero">
          <div className="logo">🍻</div>

          <div>
            <h1>Güstener Zapfhahn Zentrale</h1>
            <p>Events · Getränke · Kosten · Rankings</p>
          </div>
        </header>


        <section className="card">

          <div className="sectionTitle">
            <span>📅</span>
            <h2>Aktuelles Event</h2>
          </div>

          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >

            <option value="">
              Event auswählen
            </option>

            {events.map((event) => (
              <option
                key={event.id}
                value={event.id}
              >
                {event.title}
              </option>
            ))}

          </select>

        </section>


        <section className="stats">

          <div className="statCard">
            <span>🍺</span>
            <strong>{selectedDrinks.length}</strong>
            <small>Getränke</small>
          </div>

          <div className="statCard">
            <span>💧</span>
            <strong>{totalLiters.toFixed(1)}</strong>
            <small>Liter</small>
          </div>

          <div className="statCard">
            <span>💶</span>
            <strong>{totalCost.toFixed(2)} €</strong>
            <small>Kosten</small>
          </div>

          <div className="statCard">
            <span>👥</span>
            <strong>0</strong>
            <small>Teilnehmer</small>
          </div>

        </section>


        <section className="card">

          <div className="sectionTitle">
            <span>🍺</span>
            <h2>Getränk hinzufügen</h2>
          </div>


          <div className="form">

            <label>
              Getränk

              <input
                value={drinkName}
                onChange={(e) =>
                  setDrinkName(e.target.value)
                }
                placeholder="z. B. Pils"
              />
            </label>


            <div className="row">

              <label>
                Liter

                <input
                  type="number"
                  step="0.1"
                  value={liters}
                  onChange={(e) =>
                    setLiters(e.target.value)
                  }
                />
              </label>


              <label>
                Alkohol %

                <input
                  type="number"
                  step="0.1"
                  value={alcohol}
                  onChange={(e) =>
                    setAlcohol(e.target.value)
                  }
                />
              </label>

            </div>


            <label>
              Preis

              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
              />
            </label>


            <button
              className="primary"
              onClick={saveDrink}
              disabled={saving}
            >

              {saving
                ? "⏳ Speichert..."
                : "🍻 Getränk speichern"}

            </button>


            {message && (
              <div className="message">
                {message}
              </div>
            )}

          </div>

        </section>


        <section className="card">

          <div className="sectionTitle">
            <span>🍺</span>
            <h2>Getränke</h2>
          </div>


          {loading && (
            <p>⏳ Lade Daten...</p>
          )}


          {!loading &&
            selectedDrinks.length === 0 && (
              <div className="empty">

                <span>🍻</span>

                <p>
                  Noch keine Getränke bei diesem Event.
                </p>

              </div>
            )}


          <div className="drinkList">

            {selectedDrinks.map((drink) => {

              const name =
                drink.drink_name ||
                drink.getraenk ||
                "Getränk";

              const liter =
                drink.liters ??
                drink.menge ??
                0;

              const alcoholValue =
                drink.alcohol_percent ??
                drink.alkohol ??
                0;

              const drinkPrice =
                drink.preis ?? 0;

              return (

                <div
                  className="drink"
                  key={drink.id}
                >

                  <div className="drinkIcon">
                    🍺
                  </div>


                  <div className="drinkInfo">

                    <strong>
                      {name}
                    </strong>

                    <span>
                      {Number(liter).toFixed(1)}
                      {" "}Liter ·{" "}
                      {Number(alcoholValue).toFixed(1)}
                      {" "}%
                    </span>

                  </div>


                  <strong>
                    {Number(drinkPrice).toFixed(2)} €
                  </strong>

                </div>

              );

            })}

          </div>

        </section>


        <section className="card coming">

          <div className="sectionTitle">
            <span>🚀</span>
            <h2>Als Nächstes</h2>
          </div>


          <div className="featureGrid">

            <div>👥 Teilnehmer</div>

            <div>💶 Kostenaufteilung</div>

            <div>🏆 Ranking</div>

            <div>🎯 Punkte</div>

            <div>📸 Getränkefoto</div>

            <div>🤖 KI-Erkennung</div>

          </div>

        </section>


        <footer>
          🍻 Güstener Zapfhahn Zentrale
        </footer>

      </div>


      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top,
              #26364a 0%,
              #10151d 45%,
              #080b10 100%
            );
          color: white;
          padding: 20px 12px 50px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 850px;
          margin: auto;
        }

        .hero {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 25px 5px 30px;
        }

        .logo {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            rgba(255,255,255,0.1);
          border-radius: 20px;
          font-size: 34px;
        }

        h1 {
          margin: 0;
          font-size: 28px;
        }

        .hero p {
          margin: 7px 0 0;
          color: #aeb8c5;
        }

        .card {
          background:
            rgba(255,255,255,0.08);
          border:
            1px solid rgba(255,255,255,0.1);
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 16px;
          backdrop-filter: blur(12px);
        }

        .sectionTitle {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .sectionTitle span {
          font-size: 25px;
        }

        h2 {
          margin: 0;
          font-size: 20px;
        }

        select,
        input {
          width: 100%;
          border: 0;
          outline: none;
          border-radius: 13px;
          padding: 14px;
          background:
            rgba(255,255,255,0.12);
          color: white;
          font-size: 16px;
        }

        select option {
          color: black;
        }

        label {
          display: block;
          font-size: 13px;
          color: #b8c1cd;
        }

        label input {
          margin-top: 7px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .primary {
          border: 0;
          border-radius: 14px;
          padding: 15px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          background: #f59e0b;
          color: #111827;
        }

        .primary:disabled {
          opacity: 0.6;
        }

        .message {
          padding: 12px;
          border-radius: 12px;
          background:
            rgba(255,255,255,0.08);
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .statCard {
          text-align: center;
          background:
            rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 16px 8px;
        }

        .statCard span {
          display: block;
          font-size: 22px;
          margin-bottom: 6px;
        }

        .statCard strong {
          display: block;
          font-size: 20px;
        }

        .statCard small {
          color: #aeb8c5;
        }

        .drinkList {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .drink {
          display: flex;
          align-items: center;
          gap: 12px;
          background:
            rgba(255,255,255,0.06);
          border-radius: 15px;
          padding: 13px;
        }

        .drinkIcon {
          font-size: 28px;
        }

        .drinkInfo {
          flex: 1;
        }

        .drinkInfo strong,
        .drinkInfo span {
          display: block;
        }

        .drinkInfo span {
          color: #aeb8c5;
          font-size: 13px;
          margin-top: 4px;
        }

        .empty {
          text-align: center;
          padding: 20px;
          color: #aeb8c5;
        }

        .empty span {
          font-size: 35px;
        }

        .featureGrid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 10px;
        }

        .featureGrid div {
          padding: 13px;
          border-radius: 13px;
          background:
            rgba(255,255,255,0.06);
        }

        footer {
          text-align: center;
          color: #778392;
          padding: 20px;
        }

        @media (max-width: 600px) {

          .page {
            padding:
              10px
              10px
              40px;
          }

          h1 {
            font-size: 22px;
          }

          .hero {
            padding-top: 15px;
          }

          .stats {
            grid-template-columns:
              1fr 1fr;
          }

          .row {
            grid-template-columns:
              1fr;
          }
        }

      `}</style>

    </main>
  );
}
