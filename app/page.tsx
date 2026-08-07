"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Person = {
  id: number;
  name: string;
  drinks: number;
  liters: number;
  cost: number;
  points: number;
};

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");
  const [drinks, setDrinks] = useState<any[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] = useState("");
  const [message, setMessage] = useState("");

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id,title")
      .order("start_date", { ascending: false });

    if (error) {
      setMessage("❌ Events konnten nicht geladen werden.");
      return;
    }

    if (data && data.length > 0) {
      setEvents(data);

      const savedEvent =
        localStorage.getItem("guesten-active-event");

      const exists = data.some(
        (event) => event.id === savedEvent
      );

      if (savedEvent && exists) {
        setEventId(savedEvent);
      } else {
        setEventId(data[0].id);
      }
    }
  }

  async function loadDrinks(id: string) {
    if (!id) return;

    const { data } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (data) {
      setDrinks(data);
    }
  }

  function loadPeople(id: string) {
    const saved = localStorage.getItem(
      "guesten-people-" + id
    );

    if (saved) {
      try {
        setPeople(JSON.parse(saved));
      } catch {
        setPeople([]);
      }
    } else {
      setPeople([]);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guesten-active-event",
      eventId
    );

    loadDrinks(eventId);
    loadPeople(eventId);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guesten-people-" + eventId,
      JSON.stringify(people)
    );
  }, [people, eventId]);

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      setMessage("❌ Bitte ein Getränk eingeben.");
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

    setMessage("✅ Getränk gespeichert!");

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    await loadDrinks(eventId);
  }

  function addPerson() {
    const name = personName.trim();

    if (!name) {
      setMessage("❌ Bitte Namen eingeben.");
      return;
    }

    const alreadyExists = people.some(
      (person) =>
        person.name.toLowerCase() ===
        name.toLowerCase()
    );

    if (alreadyExists) {
      setMessage("❌ Diese Person ist bereits dabei.");
      return;
    }

    const newPerson: Person = {
      id: Date.now(),
      name,
      drinks: 0,
      liters: 0,
      cost: 0,
      points: 0,
    };

    setPeople([...people, newPerson]);
    setPersonName("");
    setMessage("✅ Teilnehmer hinzugefügt!");
  }

  function removePerson(id: number) {
    setPeople(
      people.filter((person) => person.id !== id)
    );
  }

  function assignDrink(
    personId: number,
    drinkId: string
  ) {
    const drink = drinks.find(
      (item) => item.id === drinkId
    );

    if (!drink) return;

    const litersValue = Number(
      drink.liters ?? drink.menge ?? 0
    );

    const priceValue = Number(
      drink.preis ?? 0
    );

    setPeople(
      people.map((person) => {
        if (person.id !== personId) {
          return person;
        }

        return {
          ...person,
          drinks: person.drinks + 1,
          liters:
            person.liters + litersValue,
          cost:
            person.cost + priceValue,
          points:
            person.points + 10,
        };
      })
    );

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

  const costPerPerson =
    people.length > 0
      ? totalCost / people.length
      : 0;

  const totalPoints = people.reduce(
    (sum, person) =>
      sum + person.points,
    0
  );

  const ranking = [...people].sort(
    (a, b) => b.points - a.points
  );

  const activeEvent = events.find(
    (event) => event.id === eventId
  );

  return (
    <main className="page">
      <div className="container">

        <header>
          <div className="logo">🍻</div>

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
          <h2>📅 Aktuelles Event</h2>

          <select
            value={eventId}
            onChange={(e) =>
              setEventId(e.target.value)
            }
          >
            <option value="">
              Wähle dein Event
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

          {activeEvent && (
            <div className="activeEvent">
              🍻 {activeEvent.title}
            </div>
          )}
        </section>

        <div className="stats">

          <div className="stat">
            <span>🍺</span>
            <b>{drinks.length}</b>
            <small>Getränke</small>
          </div>

          <div className="stat">
            <span>💧</span>
            <b>
              {totalLiters.toFixed(1)}
            </b>
            <small>Liter</small>
          </div>

          <div className="stat">
            <span>💶</span>
            <b>
              {totalCost.toFixed(2)} €
            </b>
            <small>Kosten</small>
          </div>

          <div className="stat">
            <span>👥</span>
            <b>{people.length}</b>
            <small>Teilnehmer</small>
          </div>

        </div>

        <section className="card">
          <h2>👥 Teilnehmer</h2>

          <div className="addRow">

            <input
              placeholder="Name eingeben"
              value={personName}
              onChange={(e) =>
                setPersonName(e.target.value)
              }
            />

            <button onClick={addPerson}>
              ➕ Hinzufügen
            </button>

          </div>

          {people.length === 0 ? (
            <div className="empty">
              <div>👥</div>
              <b>Noch keine Teilnehmer</b>
              <p>
                Füge die Personen deines Events hinzu.
              </p>
            </div>
          ) : (
            people.map((person) => (
              <div
                className="person"
                key={person.id}
              >
                <div className="personIcon">
                  {person.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="personInfo">
                  <b>{person.name}</b>

                  <small>
                    🍺 {person.drinks}
                    {" · "}
                    💧 {person.liters.toFixed(1)} L
                    {" · "}
                    💶 {person.cost.toFixed(2)} €
                  </small>
                </div>

                <strong>
                  🏆 {person.points}
                </strong>

                <button
                  className="remove"
                  onClick={() =>
                    removePerson(person.id)
                  }
                >
                  ×
                </button>
              </div>
            ))
          )}
        </section>

        <section className="card">

          <h2>🍺 Getränk hinzufügen</h2>

          <input
            placeholder="Getränk"
            value={drinkName}
            onChange={(e) =>
              setDrinkName(e.target.value)
            }
          />

          <div className="inputs">

            <input
              type="number"
              step="0.1"
              placeholder="Liter"
              value={liters}
              onChange={(e) =>
                setLiters(e.target.value)
              }
            />

            <input
              type="number"
              step="0.1"
              placeholder="Alkohol %"
              value={alcohol}
              onChange={(e) =>
                setAlcohol(e.target.value)
              }
            />

            <input
              type="number"
              step="0.01"
              placeholder="Preis €"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
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

          <h2>🔗 Getränk zuordnen</h2>

          {people.length === 0 ? (
            <div className="empty">
              👥 Zuerst Teilnehmer hinzufügen.
            </div>
          ) : drinks.length === 0 ? (
            <div className="empty">
              🍺 Zuerst ein Getränk speichern.
            </div>
          ) : (
            people.map((person) => (
              <div
                className="assignment"
                key={person.id}
              >
                <b>
                  👤 {person.name}
                </b>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      assignDrink(
                        person.id,
                        e.target.value
                      );

                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">
                    🍺 Getränk auswählen
                  </option>

                  {drinks.map((drink) => (
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
                      ).toFixed(1)}{" "}
                      L
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}

        </section>

        <section className="card">

          <h2>🍺 Getränke</h2>

          {drinks.length === 0 ? (
            <div className="empty">
              🍺 Noch keine Getränke.
            </div>
          ) : (
            drinks.map((drink) => (
              <div
                className="drink"
                key={drink.id}
              >
                <div className="drinkIcon">
                  🍺
                </div>

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
                    ).toFixed(1)}{" "}
                    Liter ·{" "}
                    {Number(
                      drink.alcohol_percent ??
                        drink.alkohol ??
                        0
                    ).toFixed(1)} %
                  </small>
                </div>

                <strong>
                  {Number(
                    drink.preis ?? 0
                  ).toFixed(2)} €
                </strong>
              </div>
            ))
          )}

        </section>

        <section className="card">

          <h2>💶 Kostenaufteilung</h2>

          <div className="bigMoney">
            {totalCost.toFixed(2)} €
          </div>

          <p className="center">
            Gesamtkosten des Events
          </p>

          <div className="costRow">
            <span>👥 Teilnehmer</span>
            <b>{people.length}</b>
          </div>

          <div className="costRow">
            <span>💶 Pro Person</span>
            <b>
              {costPerPerson.toFixed(2)} €
            </b>
          </div>

          <div className="costRow">
            <span>🏆 Gesamtpunkte</span>
            <b>{totalPoints}</b>
          </div>

        </section>

        <section className="card">

          <h2>🏆 Ranking</h2>

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
                  <div className="place">
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : index + 1}
                  </div>

                  <div>
                    <b>{person.name}</b>

                    <small>
                      🍺 {person.drinks}
                      {" · "}
                      💧 {person.liters.toFixed(1)} L
                    </small>
                  </div>

                  <strong>
                    {person.points}
                    <small>Punkte</small>
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
          padding: 16px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          max-width: 850px;
          margin: auto;
        }

        header {
          display: flex;
          gap: 15px;
          align-items: center;
          padding: 10px 4px 25px;
        }

        .logo {
          font-size: 38px;
          background: #1b2734;
          padding: 12px;
          border-radius: 18px;
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
          color: #98a6b5;
        }

        .card {
          background: rgba(255,255,255,.065);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 20px;
          padding: 18px;
          margin-bottom: 15px;
          box-shadow:
            0 10px 30px
            rgba(0,0,0,.15);
        }

        .activeEvent {
          margin-top: 5px;
          background: #172535;
          padding: 12px;
          border-radius: 12px;
          color: #fbbf24;
          font-weight: bold;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          text-align: center;
          background: rgba(255,255,255,.06);
          border-radius: 17px;
          padding: 14px 5px;
        }

        .stat span {
          font-size: 22px;
          display: block;
        }

        .stat b {
          display: block;
          font-size: 20px;
          margin: 5px 0;
        }

        .stat small {
          color: #8997a6;
          font-size: 11px;
        }

        input,
        select {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid #344252;
          background: #131b24;
          color: white;
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
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .inputs {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .save {
          width: 100%;
        }

        .person {
          display: grid;
          grid-template-columns:
            42px 1fr auto auto;
          gap: 10px;
          align-items: center;
          background: rgba(255,255,255,.05);
          padding: 10px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .personIcon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #334155;
          font-weight: bold;
          font-size: 18px;
        }

        .personInfo small,
        .drink small,
        .ranking small {
          display: block;
          color: #8d9aaa;
          margin-top: 4px;
        }

        .remove {
          background: #303b48;
          color: white;
          padding: 6px 11px;
        }

        .assignment {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 10px;
          align-items: center;
        }

        .drink {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,.05);
          padding: 12px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .drinkIcon {
          font-size: 25px;
        }

        .drink > strong {
          margin-left: auto;
        }

        .empty {
          text-align: center;
          padding: 20px;
          color: #8d9aaa;
        }

        .empty div {
          font-size: 28px;
        }

        .bigMoney {
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
          background: rgba(255,255,255,.05);
          padding: 13px;
          border-radius: 12px;
          margin-top: 8px;
        }

        .ranking {
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          gap: 10px;
          align-items: center;
          background: rgba(255,255,255,.05);
          padding: 13px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .place {
          font-size: 24px;
          text-align: center;
        }

        .ranking > strong {
          text-align: right;
        }

        .message {
          padding: 14px;
          border-radius: 13px;
          background: #172535;
          color: #fbbf24;
          margin-bottom: 15px;
          text-align: center;
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
              repeat(2, 1fr);
          }

          .inputs {
            grid-template-columns: 1fr;
          }

          .addRow {
            grid-template-columns: 1fr;
          }

          .assignment {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </main>
  );
}
