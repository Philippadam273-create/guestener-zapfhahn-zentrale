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
    const { data } = await supabase
      .from("events")
      .select("id,title")
      .order("created_at", { ascending: false });

    if (data) {
      setEvents(data);

      if (!eventId && data.length > 0) {
        setEventId(data[0].id);
      }
    }
  }

  async function loadDrinks() {
    if (!eventId) return;

    const { data } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (data) {
      setDrinks(data);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadDrinks();

    if (!eventId) return;

    const saved = localStorage.getItem(
      "guester-people-" + eventId
    );

    setPeople(saved ? JSON.parse(saved) : []);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guester-people-" + eventId,
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
          getraenk: drinkName,
          drink_name: drinkName,
          menge: Number(liters),
          liters: Number(liters),
          alkohol: Number(alcohol),
          alcohol_percent: Number(alcohol),
          preis: Number(price),
          quantity: 1,
        },
      ]);

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setMessage("✅ Getränk gespeichert.");

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    await loadDrinks();
  }

  function addPerson() {
    const name = personName.trim();

    if (!name) {
      setMessage("❌ Bitte einen Namen eingeben.");
      return;
    }

    if (
      people.some(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setMessage("❌ Teilnehmer bereits vorhanden.");
      return;
    }

    setPeople([
      ...people,
      {
        id: Date.now(),
        name,
        drinks: 0,
        liters: 0,
        cost: 0,
        points: 0,
      },
    ]);

    setPersonName("");
    setMessage("✅ Teilnehmer hinzugefügt.");
  }

  function assignDrink(
    personId: number,
    drinkId: string
  ) {
    const drink = drinks.find(
      (d) => d.id === drinkId
    );

    if (!drink) return;

    const drinkLiters = Number(
      drink.liters ?? drink.menge ?? 0
    );

    const drinkPrice = Number(
      drink.preis ?? 0
    );

    setPeople(
      people.map((person) =>
        person.id !== personId
          ? person
          : {
              ...person,
              drinks: person.drinks + 1,
              liters:
                person.liters + drinkLiters,
              cost:
                person.cost + drinkPrice,
              points:
                person.points + 10,
            }
      )
    );

    setMessage(
      "🍺 Getränk zugeordnet! +10 Punkte"
    );
  }

  function removePerson(id: number) {
    setPeople(
      people.filter(
        (person) => person.id !== id
      )
    );
  }

  const totalCost = drinks.reduce(
    (sum, drink) =>
      sum + Number(drink.preis || 0),
    0
  );

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

  return (
    <main className="page">
      <div className="container">

        {/* =========================
            HEADER
        ========================== */}

        <header>
          <div className="crateLogo">

            {/* Holz-Bierkiste als echtes SVG.
                Transparenter Hintergrund.
                KEIN weißer Rand.
            */}
            <svg
              viewBox="0 0 180 145"
              className="crateSvg"
              aria-label="Bierkiste"
            >
              {/* Flaschen hinten */}
              <g>
                <rect
                  x="22"
                  y="18"
                  width="25"
                  height="75"
                  rx="8"
                  fill="#d99b32"
                  stroke="#6f3c0d"
                  strokeWidth="4"
                />
                <rect
                  x="77"
                  y="18"
                  width="25"
                  height="75"
                  rx="8"
                  fill="#d99b32"
                  stroke="#6f3c0d"
                  strokeWidth="4"
                />
                <rect
                  x="132"
                  y="18"
                  width="25"
                  height="75"
                  rx="8"
                  fill="#d99b32"
                  stroke="#6f3c0d"
                  strokeWidth="4"
                />

                <rect
                  x="27"
                  y="8"
                  width="15"
                  height="18"
                  rx="3"
                  fill="#d99b32"
                  stroke="#6f3c0d"
                  strokeWidth="4"
                />

                <rect
                  x="82"
                  y="8"
                  width="15"
                  height="18"
                  rx="3"
                  fill="#d99b32"
                  stroke="#6f3c0d"
                  strokeWidth="4"
                />

                <rect
                  x="137"
                  y="8"
                  width="15"
                  height="18"
                  rx="3"
                  fill="#d99b32"
                  stroke="#6f3c0d"
                  strokeWidth="4"
                />
              </g>

              {/* Bierkiste */}
              <rect
                x="8"
                y="68"
                width="164"
                height="68"
                rx="10"
                fill="#8b4a17"
                stroke="#4c2609"
                strokeWidth="5"
              />

              {/* obere Holzleiste */}
              <rect
                x="8"
                y="68"
                width="164"
                height="18"
                rx="5"
                fill="#a86122"
              />

              {/* untere Holzleiste */}
              <rect
                x="8"
                y="119"
                width="164"
                height="17"
                rx="5"
                fill="#67350e"
              />

              {/* Kisten-Fächer */}
              <path
                d="M48 86V119
                   M89 86V119
                   M130 86V119"
                stroke="#4c2609"
                strokeWidth="6"
              />

              {/* kleines Bier-Symbol */}
              <text
                x="90"
                y="108"
                textAnchor="middle"
                fontSize="22"
              >
                🍺
              </text>
            </svg>
          </div>

          <div>
            <h1>Güstener Zapfhahn Zentrale</h1>
            <p>
              Events · Getränke · Kosten · Rankings
            </p>
          </div>
        </header>

        {/* =========================
            EVENT
        ========================== */}

        <section className="card">
          <h2>📅 Aktuelles Event</h2>

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

        {/* =========================
            STATS
        ========================== */}

        <div className="stats">

          <div className="stat">
            <span>🍺</span>
            <b>{drinks.length}</b>
            <small>Getränke</small>
          </div>

          <div className="stat">
            <span>💧</span>
            <b>{totalLiters.toFixed(1)}</b>
            <small>Liter</small>
          </div>

          <div className="stat">
            <span>💶</span>
            <b>{totalCost.toFixed(2)} €</b>
            <small>Kosten</small>
          </div>

          <div className="stat">
            <span>👥</span>
            <b>{people.length}</b>
            <small>Teilnehmer</small>
          </div>

        </div>

        {/* =========================
            TEILNEHMER
        ========================== */}

        <section className="card">
          <h2>👥 Teilnehmer</h2>

          <div className="row">
            <input
              placeholder="Name"
              value={personName}
              onChange={(e) =>
                setPersonName(e.target.value)
              }
            />

            <button onClick={addPerson}>
              ➕ Hinzufügen
            </button>
          </div>

          {people.map((person) => (
            <div
              className="item"
              key={person.id}
            >
              <div>
                <b>👤 {person.name}</b>

                <small>
                  🍺 {person.drinks}
                  {" · "}
                  💧 {person.liters.toFixed(1)} L
                  {" · "}
                  🏆 {person.points}
                </small>
              </div>

              <button
                className="delete"
                onClick={() =>
                  removePerson(person.id)
                }
              >
                ×
              </button>
            </div>
          ))}
        </section>

        {/* =========================
            GETRÄNK HINZUFÜGEN
        ========================== */}

        <section className="card">
          <h2>🍺 Getränk hinzufügen</h2>

          <input
            placeholder="Getränk"
            value={drinkName}
            onChange={(e) =>
              setDrinkName(e.target.value)
            }
          />

          <div className="three">

            <input
              type="number"
              value={liters}
              onChange={(e) =>
                setLiters(e.target.value)
              }
              placeholder="Liter"
            />

            <input
              type="number"
              value={alcohol}
              onChange={(e) =>
                setAlcohol(e.target.value)
              }
              placeholder="Alkohol %"
            />

            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              placeholder="Preis €"
            />

          </div>

          <button
            className="save"
            onClick={saveDrink}
          >
            🍻 Getränk speichern
          </button>
        </section>

        {/* =========================
            ZUORDNUNG
        ========================== */}

        <section className="card">
          <h2>🔗 Getränk zuordnen</h2>

          {people.length === 0 ? (
            <p>
              👥 Zuerst Teilnehmer hinzufügen.
            </p>
          ) : (
            people.map((person) => (
              <div
                className="assignment"
                key={person.id}
              >
                <b>{person.name}</b>

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
                        drink.preis || 0
                      ).toFixed(2)}
                      €
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </section>

        {/* =========================
            GETRÄNKE
        ========================== */}

        <section className="card">
          <h2>🍺 Getränke</h2>

          {drinks.map((drink) => (
            <div
              className="item"
              key={drink.id}
            >
              <div>
                <b>
                  🍺{" "}
                  {drink.getraenk ||
                    drink.drink_name}
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

              <b>
                {Number(
                  drink.preis || 0
                ).toFixed(2)} €
              </b>
            </div>
          ))}
        </section>

        {/* =========================
            KOSTEN
        ========================== */}

        <section className="card cost">
          <h2>💶 Kostenaufteilung</h2>

          <div className="costBig">
            {totalCost.toFixed(2)} €
          </div>

          <p>
            Gesamtkosten des Events
          </p>

          <div className="costLine">
            <span>👥 Teilnehmer</span>
            <b>{people.length}</b>
          </div>

          <div className="costLine">
            <span>💶 Pro Person</span>
            <b>
              {costPerPerson.toFixed(2)} €
            </b>
          </div>

          <div className="costLine">
            <span>🏆 Gesamtpunkte</span>
            <b>{totalPoints}</b>
          </div>

          <p className="hint">
            Die Kosten werden automatisch
            gleichmäßig auf alle Teilnehmer
            verteilt.
          </p>
        </section>

        {/* =========================
            RANKING
        ========================== */}

        <section className="card">
          <h2>🏆 Ranking</h2>

          {ranking.length === 0 ? (
            <p>
              Noch keine Teilnehmer.
            </p>
          ) : (
            ranking.map(
              (person, index) => (
                <div
                  className="rank"
                  key={person.id}
                >
                  <strong>
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : `${index + 1}.`}
                  </strong>

                  <span>
                    {person.name}
                  </span>

                  <b>
                    {person.points} Punkte
                  </b>
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

        /* ==================================
           GRUNDLAYOUT
        ================================== */

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #080c11;
        }

        body {
          overflow-x: hidden;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          background:
            radial-gradient(
              circle at top,
              #26384b 0%,
              #111820 35%,
              #080c11 72%
            );
          color: white;
          padding: 15px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 850px;
          margin: 0 auto;
        }

        /* ==================================
           HEADER
        ================================== */

        header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 4px 25px;
        }

        /*
          WICHTIG:

          Der Logo-Container hat:
          - keinen weißen Hintergrund
          - keinen weißen Rand
          - keinen Border
          - keine Outline
        */

        .crateLogo {
          width: 82px;
          height: 82px;
          flex: 0 0 82px;
          background: transparent;
          border: 0;
          outline: 0;
          box-shadow: none;
          padding: 0;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .crateSvg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }

        h1 {
          font-size: 25px;
          line-height: 1.15;
          margin: 0;
        }

        h2 {
          margin-top: 0;
        }

        p {
          color: #9ca8b5;
        }

        /* ==================================
           CARDS
        ================================== */

        .card {
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 20px;
          padding: 18px;
          margin-bottom: 14px;
        }

        /* ==================================
           STATISTIK
        ================================== */

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .stat {
          background: rgba(255,255,255,.055);
          border: 0;
          border-radius: 16px;
          padding: 14px;
          text-align: center;
          font-size: 22px;
        }

        .stat span {
          display: block;
          font-size: 22px;
        }

        .stat b,
        .stat small {
          display: block;
        }

        .stat b {
          font-size: 20px;
          margin: 5px 0;
        }

        .stat small {
          color: #8995a3;
          font-size: 11px;
        }

        /* ==================================
           INPUTS
        ================================== */

        input,
        select {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid #303b47;
          background: #151d26;
          color: white;
          margin-bottom: 10px;
          font-size: 15px;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: #f59e0b;
        }

        button {
          border: 0;
          border-radius: 12px;
          padding: 13px 17px;
          background: #f59e0b;
          color: #111;
          font-weight: bold;
          cursor: pointer;
        }

        button:active {
          transform: scale(.98);
        }

        .row {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 8px;
        }

        .three {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .save {
          width: 100%;
          margin-top: 4px;
        }

        /* ==================================
           EINTRÄGE
        ================================== */

        .item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,.05);
          padding: 12px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .item small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
        }

        .delete {
          background: #303944;
          color: white;
          padding: 7px 12px;
        }

        /* ==================================
           ZUORDNUNG
        ================================== */

        .assignment {
          display: grid;
          grid-template-columns:
            1fr 1.5fr;
          gap: 10px;
          align-items: center;
          margin-bottom: 8px;
        }

        .assignment select {
          margin: 0;
        }

        /* ==================================
           KOSTEN
        ================================== */

        .cost {
          text-align: center;
        }

        .costBig {
          font-size: 38px;
          font-weight: bold;
          color: #fbbf24;
        }

        .costLine {
          display: flex;
          justify-content: space-between;
          background: rgba(255,255,255,.05);
          padding: 13px;
          border-radius: 12px;
          margin-top: 8px;
        }

        .hint {
          font-size: 12px;
        }

        /* ==================================
           RANKING
        ================================== */

        .rank {
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          gap: 10px;
          align-items: center;
          background: rgba(255,255,255,.05);
          padding: 13px;
          border-radius: 13px;
          margin-top: 8px;
        }

        /* ==================================
           MELDUNG
        ================================== */

        .message {
          background: #172230;
          border: 1px solid #344454;
          border-radius: 12px;
          padding: 13px;
          margin-bottom: 15px;
          color: #fbbf24;
        }

        /* ==================================
           FOOTER
        ================================== */

        footer {
          text-align: center;
          color: #687686;
          padding: 25px;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        /* ==================================
           MOBILE
        ================================== */

        @media (max-width: 650px) {

          .page {
            padding: 12px;
          }

          header {
            gap: 12px;
            padding-bottom: 22px;
          }

          .crateLogo {
            width: 68px;
            height: 68px;
            flex-basis: 68px;
          }

          h1 {
            font-size: 20px;
          }

          header p {
            font-size: 13px;
            margin-bottom: 0;
          }

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .three {
            grid-template-columns: 1fr;
          }

          .row {
            grid-template-columns: 1fr;
          }

          .assignment {
            grid-template-columns: 1fr;
          }

          .rank {
            grid-template-columns:
              40px 1fr auto;
          }
        }

      `}</style>
    </main>
  );
}
