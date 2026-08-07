"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Person = {
  id: string;
  name: string;
  points: number;
  drinks: number;
  liters: number;
};

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [drinks, setDrinks] = useState<any[]>([]);

  const [personName, setPersonName] = useState("");
  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    loadPeople();
    loadDrinks();
  }, [eventId]);

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id,title")
      .order("start_date", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "❌ Events konnten nicht geladen werden."
      );
      return;
    }

    if (!data || data.length === 0) {
      setMessage("❌ Keine Events vorhanden.");
      return;
    }

    setEvents(data);

    const saved =
      localStorage.getItem(
        "guesten-active-event"
      );

    const exists = data.some(
      (event) => event.id === saved
    );

    if (saved && exists) {
      setEventId(saved);
    } else {
      setEventId(data[0].id);
    }
  }

  async function loadPeople() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("event_members")
      .select("*")
      .eq("event_id", eventId);

    if (error) {
      setMessage(
        "❌ Teilnehmer konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    if (!data) {
      setPeople([]);
      return;
    }

    setPeople(
      data.map((member: any) => ({
        id: member.id,
        name:
          member.name ||
          member.username ||
          member.display_name ||
          "Teilnehmer",
        points: Number(
          member.points || 0
        ),
        drinks: Number(
          member.drinks_count || 0
        ),
        liters: Number(
          member.liters || 0
        ),
      }))
    );
  }

  async function loadDrinks() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "❌ Getränke konnten nicht geladen werden."
      );
      return;
    }

    setDrinks(data || []);
  }

  async function addPerson() {
    setMessage("");

    const name = personName.trim();

    if (!name) {
      setMessage(
        "❌ Bitte einen Namen eingeben."
      );
      return;
    }

    if (!eventId) {
      setMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    const existing = people.some(
      (person) =>
        person.name.toLowerCase() ===
        name.toLowerCase()
    );

    if (existing) {
      setMessage(
        "❌ Diese Person ist bereits dabei."
      );
      return;
    }

    const { data, error } = await supabase
      .from("event_members")
      .insert([
        {
          event_id: eventId,
          name: name,
          points: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      setMessage(
        "❌ Teilnehmer konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setPersonName("");

    setMessage(
      "✅ Teilnehmer gespeichert."
    );

    await loadPeople();
  }

  async function removePerson(
    personId: string
  ) {
    const { error } = await supabase
      .from("event_members")
      .delete()
      .eq("id", personId);

    if (error) {
      setMessage(
        "❌ Teilnehmer konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    await loadPeople();

    setMessage(
      "✅ Teilnehmer entfernt."
    );
  }

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!drinkName.trim()) {
      setMessage(
        "❌ Bitte ein Getränk eingeben."
      );
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .insert([
        {
          event_id: eventId,
          getraenk: drinkName.trim(),
          drink_name: drinkName.trim(),
          menge: Number(liters),
          liters: Number(liters),
          alkohol: Number(alcohol),
          alcohol_percent: Number(alcohol),
          preis: Number(price),
          quantity: 1,
        },
      ]);

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    await loadDrinks();

    setMessage(
      "✅ Getränk gespeichert."
    );
  }

  async function assignDrink(
    personId: string,
    drinkId: string
  ) {
    const drink = drinks.find(
      (item) => item.id === drinkId
    );

    if (!drink) return;

    const person = people.find(
      (item) => item.id === personId
    );

    if (!person) return;

    const litersValue = Number(
      drink.liters ??
        drink.menge ??
        0
    );

    const newPoints =
      Number(person.points || 0) + 10;

    const newDrinks =
      Number(person.drinks || 0) + 1;

    const newLiters =
      Number(person.liters || 0) +
      litersValue;

    const { error } = await supabase
      .from("event_members")
      .update({
        points: newPoints,
        drinks_count: newDrinks,
        liters: newLiters,
      })
      .eq("id", personId);

    if (error) {
      setMessage(
        "❌ Zuordnung fehlgeschlagen: " +
          error.message
      );
      return;
    }

    await loadPeople();

    setMessage(
      "🍺 Getränk zugeordnet! +10 Punkte"
    );
  }

  const totalLiters = drinks.reduce(
    (sum, drink) =>
      sum +
      Number(
        drink.liters ??
          drink.menge ??
          0
      ),
    0
  );

  const totalCost = drinks.reduce(
    (sum, drink) =>
      sum +
      Number(drink.preis ?? 0),
    0
  );

  const ranking = [...people].sort(
    (a, b) => b.points - a.points
  );

  const totalPoints = people.reduce(
    (sum, person) =>
      sum + Number(person.points || 0),
    0
  );

  return (
    <main className="page">
      <div className="container">

        <header>
          <div className="logo">
            🍻
          </div>

          <div>
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Events · Getränke · Kosten · Rankings
            </p>
          </div>
        </header>

        <section className="card">
          <h2>
            📅 Aktuelles Event
          </h2>

          <select
            value={eventId}
            onChange={(e) =>
              setEventId(e.target.value)
            }
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

        <div className="stats">

          <div>
            🍺
            <b>{drinks.length}</b>
            <small>Getränke</small>
          </div>

          <div>
            💧
            <b>
              {totalLiters.toFixed(1)}
            </b>
            <small>Liter</small>
          </div>

          <div>
            💶
            <b>
              {totalCost.toFixed(2)} €
            </b>
            <small>Kosten</small>
          </div>

          <div>
            👥
            <b>{people.length}</b>
            <small>Teilnehmer</small>
          </div>

        </div>

        <section className="card">

          <h2>
            👥 Teilnehmer
          </h2>

          <div className="addRow">

            <input
              placeholder="Name eingeben"
              value={personName}
              onChange={(e) =>
                setPersonName(
                  e.target.value
                )
              }
            />

            <button
              onClick={addPerson}
            >
              ➕ Hinzufügen
            </button>

          </div>

          {people.length === 0 ? (
            <div className="empty">
              👥
              <b>
                Noch keine Teilnehmer
              </b>

              <p>
                Füge die Personen deines
                Events hinzu.
              </p>
            </div>
          ) : (
            people.map((person) => (
              <div
                className="person"
                key={person.id}
              >

                <div className="avatar">
                  {person.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <b>
                    {person.name}
                  </b>

                  <small>
                    🍺 {person.drinks}
                    {" · "}
                    💧{" "}
                    {person.liters.toFixed(
                      1
                    )} L
                    {" · "}
                    🏆 {person.points}
                  </small>
                </div>

                <button
                  className="delete"
                  onClick={() =>
                    removePerson(
                      person.id
                    )
                  }
                >
                  ×
                </button>

              </div>
            ))
          )}

        </section>

        <section className="card">

          <h2>
            🍺 Getränk hinzufügen
          </h2>

          <input
            placeholder="Getränk"
            value={drinkName}
            onChange={(e) =>
              setDrinkName(
                e.target.value
              )
            }
          />

          <div className="three">

            <input
              type="number"
              step="0.1"
              placeholder="Liter"
              value={liters}
              onChange={(e) =>
                setLiters(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Alkohol %"
              value={alcohol}
              onChange={(e) =>
                setAlcohol(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              step="0.01"
              placeholder="Preis €"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
            />

          </div>

          <button
            className="save"
            onClick={saveDrink}
          >
            🍻 Getränk speichern
          </button>

        </section>

        <section className="card">

          <h2>
            🔗 Getränk zuordnen
          </h2>

          {people.length === 0 ? (
            <p>
              👥 Zuerst Teilnehmer
              hinzufügen.
            </p>
          ) : drinks.length === 0 ? (
            <p>
              🍺 Zuerst ein Getränk
              speichern.
            </p>
          ) : (
            people.map((person) => (
              <div
                className="assign"
                key={person.id}
              >

                <b>
                  👤 {person.name}
                </b>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (
                      e.target.value
                    ) {
                      assignDrink(
                        person.id,
                        e.target.value
                      );

                      e.target.value =
                        "";
                    }
                  }}
                >

                  <option value="">
                    Getränk auswählen
                  </option>

                  {drinks.map(
                    (drink) => (
                      <option
                        key={drink.id}
                        value={drink.id}
                      >
                        {drink.getraenk ||
                          drink.drink_name ||
                          "Getränk"}
                        {" · "}
                        {Number(
                          drink.liters ??
                            drink.menge ??
                            0
                        ).toFixed(1)}
                        L
                      </option>
                    )
                  )}

                </select>

              </div>
            ))
          )}

        </section>

        <section className="card">

          <h2>
            🍺 Getränke
          </h2>

          {drinks.map((drink) => (
            <div
              className="drink"
              key={drink.id}
            >

              <span>
                🍺
              </span>

              <div>
                <b>
                  {drink.getraenk ||
                    drink.drink_name ||
                    "Getränk"}
                </b>

                <small>
                  {Number(
                    drink.liters ??
                      drink.menge ??
                      0
                  ).toFixed(1)}
                  {" Liter · "}
                  {Number(
                    drink.alcohol_percent ??
                      drink.alkohol ??
                      0
                  ).toFixed(1)}
                  %
                </small>
              </div>

              <strong>
                {Number(
                  drink.preis ?? 0
                ).toFixed(2)}
                €
              </strong>

            </div>
          ))}

        </section>

        <section className="card">

          <h2>
            💶 Kostenaufteilung
          </h2>

          <div className="money">
            {totalCost.toFixed(2)} €
          </div>

          <p className="center">
            Gesamtkosten des Events
          </p>

          <div className="costRow">
            <span>
              👥 Teilnehmer
            </span>

            <b>
              {people.length}
            </b>
          </div>

          <div className="costRow">
            <span>
              💶 Pro Person
            </span>

            <b>
              {people.length
                ? (
                    totalCost /
                    people.length
                  ).toFixed(2)
                : "0.00"}{" "}
              €
            </b>
          </div>

          <div className="costRow">
            <span>
              🏆 Gesamtpunkte
            </span>

            <b>
              {totalPoints}
            </b>
          </div>

        </section>

        <section className="card">

          <h2>
            🏆 Ranking
          </h2>

          {ranking.length === 0 ? (
            <div className="empty">
              🏆 Noch keine Teilnehmer.
            </div>
          ) : (
            ranking.map(
              (person, index) => (
                <div
                  className="ranking"
                  key={person.id}
                >

                  <span>
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : index + 1}
                  </span>

                  <div>
                    <b>
                      {person.name}
                    </b>

                    <small>
                      🍺{" "}
                      {person.drinks}
                      {" · "}
                      💧{" "}
                      {person.liters.toFixed(
                        1
                      )} L
                    </small>
                  </div>

                  <strong>
                    {person.points}
                    <small>
                      Punkte
                    </small>
                  </strong>

                </div>
              )
            )
          )}

        </section>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <footer>
          🍻 Güstener Zapfhahn Zentrale
          <small>
            Dein Event. Deine Getränke.
            Deine Runde.
          </small>
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
              #263b50,
              #080c12 60%
            );
          color: white;
          padding: 15px;
          font-family: Arial, sans-serif;
        }

        .container {
          max-width: 850px;
          margin: auto;
        }

        header {
          display: flex;
          gap: 14px;
          align-items: center;
          padding: 10px 5px 25px;
        }

        .logo {
          font-size: 38px;
          background: #1d2935;
          padding: 12px;
          border-radius: 18px;
        }

        h1 {
          margin: 0;
          font-size: 25px;
        }

        h2 {
          margin-top: 0;
        }

        p,
        small {
          color: #94a3b8;
        }

        .card {
          background:
            rgba(255,255,255,.06);
          border:
            1px solid
            rgba(255,255,255,.08);
          border-radius: 20px;
          padding: 18px;
          margin-bottom: 15px;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stats > div {
          text-align: center;
          padding: 14px 5px;
          border-radius: 16px;
          background:
            rgba(255,255,255,.06);
        }

        .stats b,
        .stats small {
          display: block;
        }

        .stats b {
          font-size: 20px;
          margin: 5px;
        }

        input,
        select {
          width: 100%;
          padding: 13px;
          background: #121a23;
          color: white;
          border: 1px solid #344252;
          border-radius: 12px;
          margin-bottom: 10px;
          font-size: 15px;
        }

        button {
          border: 0;
          border-radius: 12px;
          padding: 13px 16px;
          background: #f59e0b;
          color: #111;
          font-weight: bold;
          cursor: pointer;
        }

        .addRow {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 8px;
        }

        .three {
          display: grid;
          grid-template-columns:
            repeat(3,1fr);
          gap: 8px;
        }

        .save {
          width: 100%;
        }

        .person {
          display: grid;
          grid-template-columns:
            40px 1fr auto;
          gap: 10px;
          align-items: center;
          background:
            rgba(255,255,255,.05);
          padding: 11px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .delete {
          background: #303b48;
          color: white;
          padding: 6px 11px;
        }

        .assign {
          display: grid;
          grid-template-columns:
            1fr 1.5fr;
          gap: 10px;
          align-items: center;
        }

        .drink {
          display: flex;
          gap: 12px;
          align-items: center;
          background:
            rgba(255,255,255,.05);
          padding: 12px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .drink > strong {
          margin-left: auto;
        }

        .empty {
          text-align: center;
          padding: 20px;
          color: #94a3b8;
        }

        .money {
          text-align: center;
          font-size: 40px;
          font-weight: bold;
          color: #fbbf24;
        }

        .center {
          text-align: center;
        }

        .costRow {
          display: flex;
          justify-content: space-between;
          padding: 13px;
          margin-top: 8px;
          background:
            rgba(255,255,255,.05);
          border-radius: 12px;
        }

        .ranking {
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 13px;
          margin-top: 8px;
          background:
            rgba(255,255,255,.05);
          border-radius: 14px;
        }

        .ranking > span {
          font-size: 24px;
        }

        .message {
          padding: 14px;
          border-radius: 13px;
          background: #172535;
          color: #fbbf24;
          text-align: center;
          margin-bottom: 15px;
        }

        footer {
          text-align: center;
          padding: 25px;
          color: #667586;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        @media(max-width:650px) {

          .stats {
            grid-template-columns:
              repeat(2,1fr);
          }

          .three {
            grid-template-columns: 1fr;
          }

          .addRow {
            grid-template-columns: 1fr;
          }

          .assign {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </main>
  );
}
