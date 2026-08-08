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
    if (eventId) {
      loadPeople();
      loadDrinks();
    }
  }, [eventId]);

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id,title")
      .order("start_date", {
        ascending: false,
      });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      setMessage("❌ Kein Event vorhanden.");
      return;
    }

    setEvents(data);

    const saved = localStorage.getItem(
      "guesten-event"
    );

    if (
      saved &&
      data.some((event) => event.id === saved)
    ) {
      setEventId(saved);
    } else {
      setEventId(data[0].id);
    }
  }

  async function loadPeople() {
    /*
      Wir benutzen event_members nur zum Lesen,
      versuchen aber mehrere mögliche Spaltennamen.
    */

    const { data, error } = await supabase
      .from("event_members")
      .select("*")
      .eq("event_id", eventId);

    if (error) {
      setPeople([]);
      setMessage(
        "ℹ️ Teilnehmer müssen noch einmal angelegt werden."
      );
      return;
    }

    if (!data) {
      setPeople([]);
      return;
    }

    const formatted: Person[] = data.map(
      (row: any) => ({
        id: row.id,
        name:
          row.name ||
          row.username ||
          row.display_name ||
          "Teilnehmer",
        points: Number(row.points || 0),
        drinks: Number(
          row.drinks_count || 0
        ),
        liters: Number(
          row.liters || 0
        ),
      })
    );

    setPeople(formatted);
  }

  async function loadDrinks() {
    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "❌ Getränke: " + error.message
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
        "❌ Bitte Namen eingeben."
      );
      return;
    }

    if (!eventId) {
      setMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    if (
      people.some(
        (person) =>
          person.name.toLowerCase() ===
          name.toLowerCase()
      )
    ) {
      setMessage(
        "❌ Teilnehmer bereits vorhanden."
      );
      return;
    }

    /*
      WICHTIG:
      Wir schreiben nur die Spalten,
      die für event_members zwingend
      benötigt werden.
    */

    const { data, error } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        name: name,
      })
      .select()
      .single();

    if (error) {
      setMessage(
        "❌ Speichern fehlgeschlagen: " +
          error.message
      );
      return;
    }

    if (!data) {
      setMessage(
        "❌ Teilnehmer wurde nicht zurückgegeben."
      );
      return;
    }

    setPersonName("");

    setMessage(
      "✅ " + name + " wurde hinzugefügt."
    );

    await loadPeople();
  }

  async function deletePerson(
    personId: string
  ) {
    const { error } = await supabase
      .from("event_members")
      .delete()
      .eq("id", personId);

    if (error) {
      setMessage(
        "❌ Löschen fehlgeschlagen: " +
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
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    if (!drinkName.trim()) {
      setMessage(
        "❌ Bitte Getränk eingeben."
      );
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .insert({
        event_id: eventId,
        getraenk: drinkName.trim(),
        drink_name: drinkName.trim(),
        menge: Number(liters),
        liters: Number(liters),
        alkohol: Number(alcohol),
        alcohol_percent: Number(alcohol),
        preis: Number(price),
        quantity: 1,
      });

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

    const { error } = await supabase
      .from("event_members")
      .update({
        points:
          Number(person.points) + 10,
        drinks_count:
          Number(person.drinks) + 1,
        liters:
          Number(person.liters) +
          litersValue,
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

  const totalPoints = people.reduce(
    (sum, person) =>
      sum + person.points,
    0
  );

  const ranking = [...people].sort(
    (a, b) => b.points - a.points
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
            onChange={(e) => {
              setEventId(
                e.target.value
              );

              localStorage.setItem(
                "guesten-event",
                e.target.value
              );
            }}
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
            <span>🍺</span>
            <b>{drinks.length}</b>
            <small>Getränke</small>
          </div>

          <div>
            <span>💧</span>
            <b>
              {totalLiters.toFixed(1)}
            </b>
            <small>Liter</small>
          </div>

          <div>
            <span>💶</span>
            <b>
              {totalCost.toFixed(2)} €
            </b>
            <small>Kosten</small>
          </div>

          <div>
            <span>👥</span>
            <b>{people.length}</b>
            <small>Teilnehmer</small>
          </div>

        </div>

        <section className="card">

          <h2>
            👥 Teilnehmer
          </h2>

          <div className="add">

            <input
              value={personName}
              placeholder="Name"
              onChange={(e) =>
                setPersonName(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  addPerson();
                }
              }}
            />

            <button
              onClick={addPerson}
            >
              ➕ Hinzufügen
            </button>

          </div>

          {people.length === 0 ? (

            <div className="empty">
              <div>👥</div>
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

                <div className="personInfo">

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
                  className="remove"
                  onClick={() =>
                    deletePerson(
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

          <div className="fields">

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
              🍺 Zuerst Getränk speichern.
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

                    const value =
                      e.target.value;

                    if (!value) return;

                    assignDrink(
                      person.id,
                      value
                    );

                    e.target.value =
                      "";

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

              <span className="drinkIcon">
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

          <div className="total">
            {totalCost.toFixed(2)} €
          </div>

          <p className="center">
            Gesamtkosten des Events
          </p>

          <div className="row">
            <span>
              👥 Teilnehmer
            </span>
            <b>
              {people.length}
            </b>
          </div>

          <div className="row">
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

          <div className="row">
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
          padding: 15px;
          color: white;
          font-family:
            Arial,
            sans-serif;

          background:
            radial-gradient(
              circle at top,
              #263b50 0%,
              #080c12 65%
            );
        }

        .container {
          width: 100%;
          max-width: 850px;
          margin: auto;
        }

        header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding:
            10px 5px 25px;
        }

        .logo {
          font-size: 35px;
          padding: 12px;
          border-radius: 18px;
          background:
            rgba(255,255,255,.07);
        }

        h1 {
          margin: 0;
          font-size: 25px;
        }

        h2 {
          margin-top: 0;
          font-size: 20px;
        }

        p {
          color: #94a3b8;
        }

        small {
          display: block;
          color: #94a3b8;
          margin-top: 5px;
        }

        .card {
          padding: 18px;
          margin-bottom: 15px;
          border-radius: 20px;

          background:
            rgba(255,255,255,.06);

          border:
            1px solid
            rgba(255,255,255,.08);
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4,1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stats div {
          padding: 15px 5px;
          text-align: center;
          border-radius: 16px;

          background:
            rgba(255,255,255,.06);
        }

        .stats span {
          display: block;
          font-size: 22px;
        }

        .stats b {
          display: block;
          margin-top: 5px;
          font-size: 20px;
        }

        input,
        select {
          width: 100%;
          padding: 13px;
          margin-bottom: 10px;

          border:
            1px solid #344252;

          border-radius: 12px;

          background: #121a23;
          color: white;

          font-size: 15px;
        }

        button {
          padding:
            13px 17px;

          border: 0;
          border-radius: 12px;

          background: #f59e0b;
          color: #111;

          font-weight: bold;
          cursor: pointer;
        }

        .add {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 8px;
        }

        .fields {
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

          align-items: center;

          gap: 10px;

          padding: 11px;
          margin-top: 8px;

          border-radius: 14px;

          background:
            rgba(255,255,255,.05);
        }

        .avatar {
          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #334155;

          font-weight: bold;
        }

        .remove {
          padding: 6px 11px;
          background: #303b48;
          color: white;
        }

        .empty {
          padding: 22px;
          text-align: center;
          color: #94a3b8;
        }

        .empty div {
          font-size: 30px;
          margin-bottom: 7px;
        }

        .assign {
          display: grid;
          grid-template-columns:
            1fr 1.5fr;

          align-items: center;

          gap: 10px;
        }

        .drink {
          display: flex;
          align-items: center;

          gap: 12px;

          padding: 12px;
          margin-top: 8px;

          border-radius: 14px;

          background:
            rgba(255,255,255,.05);
        }

        .drinkIcon {
          font-size: 25px;
        }

        .drink strong {
          margin-left: auto;
        }

        .total {
          text-align: center;

          font-size: 40px;
          font-weight: bold;

          color: #fbbf24;
        }

        .center {
          text-align: center;
        }

        .row {
          display: flex;
          justify-content: space-between;

          padding: 13px;
          margin-top: 8px;

          border-radius: 12px;

          background:
            rgba(255,255,255,.05);
        }

        .ranking {
          display: grid;

          grid-template-columns:
            45px 1fr auto;

          align-items: center;

          gap: 10px;

          padding: 13px;
          margin-top: 8px;

          border-radius: 14px;

          background:
            rgba(255,255,255,.05);
        }

        .ranking > span {
          font-size: 24px;
        }

        .ranking > strong {
          text-align: right;
        }

        .message {
          padding: 14px;

          text-align: center;

          border-radius: 13px;

          background: #172535;
          color: #fbbf24;

          margin-bottom: 15px;
        }

        footer {
          padding: 25px;
          text-align: center;
          color: #667586;
        }

        footer small {
          margin-top: 5px;
        }

        @media(max-width:650px) {

          .stats {
            grid-template-columns:
              repeat(2,1fr);
          }

          .fields {
            grid-template-columns: 1fr;
          }

          .add {
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
