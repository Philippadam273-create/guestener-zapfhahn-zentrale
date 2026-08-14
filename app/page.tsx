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

    if (saved) {
      try {
        setPeople(JSON.parse(saved));
      } catch {
        setPeople([]);
      }
    } else {
      setPeople([]);
    }
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
        (p) =>
          p.name.toLowerCase() === name.toLowerCase()
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
      (d) => String(d.id) === String(drinkId)
    );

    if (!drink) return;

    const drinkLiters = Number(
      drink.liters ?? drink.menge ?? 0
    );

    const drinkPrice = Number(
      drink.preis ?? drink.price ?? 0
    );

    setPeople((currentPeople) =>
      currentPeople.map((person) => {
        if (person.id !== personId) {
          return person;
        }

        return {
          ...person,
          drinks: person.drinks + 1,
          liters: person.liters + drinkLiters,
          cost: person.cost + drinkPrice,
          points: person.points + 10,
        };
      })
    );

    setMessage("🍺 Getränk zugeordnet! +10 Punkte");
  }

  function removePerson(id: number) {
    setPeople((currentPeople) =>
      currentPeople.filter(
        (person) => person.id !== id
      )
    );
  }

  const totalCost = drinks.reduce(
    (sum, drink) =>
      sum +
      Number(
        drink.preis ??
          drink.price ??
          0
      ),
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
    <>
      <main className="page">
        <div className="container">

          {/* =====================================================
              HEADER
              Bierkisten-Button:
              KEIN weißer Rand.
              ===================================================== */}

          <header className="header">
            <button
              className="beer-crate-button"
              type="button"
              aria-label="Bierkiste"
            >
              <span className="beer-crate">
                <span className="crate-top">
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                </span>

                <span className="crate-middle">
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                </span>

                <span className="crate-bottom">
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                </span>

                <span className="crate-label">
                  BIER
                </span>
              </span>
            </button>

            <div>
              <h1>Güstener Zapfhahn Zentrale</h1>

              <p>
                Events · Getränke · Kosten · Rankings
              </p>
            </div>
          </header>

          {/* EVENT */}

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

          {/* STATS */}

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

          {/* TEILNEHMER */}

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

          {/* GETRÄNK */}

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

          {/* ZUORDNEN */}

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
                          drink.preis ??
                            drink.price ??
                            0
                        ).toFixed(2)}

                        €

                      </option>

                    ))}

                  </select>

                </div>

              ))

            )}

          </section>

          {/* GETRÄNKE */}

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
                      drink.drink_name ||
                      "Getränk"}
                  </b>

                  <small>

                    {Number(
                      drink.liters ??
                        drink.menge ??
                        0
                    ).toFixed(1)}

                    {" "}Liter ·{" "}

                    {Number(
                      drink.alcohol_percent ??
                        drink.alkohol ??
                        0
                    ).toFixed(1)}

                    {" "}%

                  </small>

                </div>

                <b>

                  {Number(
                    drink.preis ??
                      drink.price ??
                      0
                  ).toFixed(2)}

                  {" "}€

                </b>

              </div>

            ))}

          </section>

          {/* KOSTEN */}

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

          {/* RANKING */}

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
      </main>

      <style jsx global>{`

        /* =========================================================
           WICHTIG:
           DER WEISSE RAND WIRD HIER VOLLSTÄNDIG ENTFERNT.
           ========================================================= */

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          min-height: 100%;
          background: #080c11 !important;
        }

        body {
          overflow-x: hidden;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        #__next {
          min-height: 100vh;
          margin: 0;
          padding: 0;
          background: #080c11;
        }

        /* =========================================================
           APP
           ========================================================= */

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 15px;

          background:
            radial-gradient(
              circle at top,
              #26384b 0%,
              #111923 35%,
              #080c11 75%
            );

          color: white;

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

        /* =========================================================
           HEADER
           ========================================================= */

        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px 5px 25px;
        }

        .header h1 {
          font-size: 25px;
          margin: 0;
        }

        .header p {
          color: #9ca8b5;
          margin: 6px 0 0;
        }

        /* =========================================================
           BIERKISTEN-BUTTON
           ========================================================= */

        .beer-crate-button {
          width: 82px;
          height: 82px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 0;

          border: 0 !important;
          outline: 0 !important;

          background: transparent !important;

          box-shadow: none !important;

          cursor: pointer;

          flex-shrink: 0;
        }

        .beer-crate {
          position: relative;

          width: 76px;
          height: 70px;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          padding: 7px 5px;

          border-radius: 7px;

          background:
            linear-gradient(
              180deg,
              #b76e25 0%,
              #8c4e19 45%,
              #63350f 100%
            );

          border: 3px solid #4a270c;

          box-shadow:
            inset 0 3px 0 rgba(255,255,255,.12),
            inset 0 -5px 0 rgba(0,0,0,.18),
            0 5px 12px rgba(0,0,0,.45);
        }

        .beer-crate::before,
        .beer-crate::after {
          content: "";

          position: absolute;

          left: 5px;
          right: 5px;

          height: 4px;

          border-radius: 3px;

          background: rgba(48,24,7,.75);
        }

        .beer-crate::before {
          top: 5px;
        }

        .beer-crate::after {
          bottom: 5px;
        }

        .crate-top,
        .crate-middle,
        .crate-bottom {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 100%;

          gap: 1px;

          position: relative;
          z-index: 2;
        }

        .bottle {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          width: 19px;
          height: 19px;

          font-size: 16px;

          filter:
            drop-shadow(
              0 1px 1px
              rgba(0,0,0,.55)
            );
        }

        .crate-label {
          position: absolute;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%, -50%);

          z-index: 4;

          padding: 2px 7px;

          border-radius: 3px;

          background: #d99a42;

          border: 1px solid #6b3b11;

          color: #3a2008;

          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;

          box-shadow:
            0 1px 2px
            rgba(0,0,0,.35);
        }

        /* =========================================================
           CARDS
           ========================================================= */

        .card {
          background:
            rgba(255,255,255,.06);

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 20px;

          padding: 18px;

          margin-bottom: 14px;

          backdrop-filter: blur(8px);
        }

        h2 {
          margin-top: 0;
        }

        p {
          color: #9ca8b5;
        }

        /* =========================================================
           STATS
           ========================================================= */

        .stats {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 10px;

          margin-bottom: 14px;
        }

        .stat {
          background:
            rgba(255,255,255,.06);

          border-radius: 16px;

          padding: 14px;

          text-align: center;

          font-size: 22px;
        }

        .stat span,
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

        /* =========================================================
           INPUTS
           ========================================================= */

        input,
        select {
          width: 100%;

          padding: 13px;

          border-radius: 12px;

          border:
            1px solid #303b47;

          background: #151d26;

          color: white;

          margin-bottom: 10px;

          font-size: 15px;
        }

        input:focus,
        select:focus {
          outline: none;

          border-color: #f59e0b;

          box-shadow:
            0 0 0 2px
            rgba(245,158,11,.15);
        }

        /* =========================================================
           BUTTONS
           ========================================================= */

        button {
          border: none;

          border-radius: 12px;

          padding: 13px 17px;

          background: #f59e0b;

          color: #111;

          font-weight: bold;

          cursor: pointer;
        }

        button:hover {
          filter: brightness(1.08);
        }

        /* =========================================================
           FORM ROWS
           ========================================================= */

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

        /* =========================================================
           ITEMS
           ========================================================= */

        .item {
          display: flex;

          justify-content: space-between;

          align-items: center;

          background:
            rgba(255,255,255,.05);

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

        /* =========================================================
           ASSIGNMENT
           ========================================================= */

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

        /* =========================================================
           COST
           ========================================================= */

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

          background:
            rgba(255,255,255,.05);

          padding: 13px;

          border-radius: 12px;

          margin-top: 8px;
        }

        .hint {
          font-size: 12px;
        }

        /* =========================================================
           RANKING
           ========================================================= */

        .rank {
          display: grid;

          grid-template-columns:
            45px 1fr auto;

          gap: 10px;

          align-items: center;

          background:
            rgba(255,255,255,.05);

          padding: 13px;

          border-radius: 13px;

          margin-top: 8px;
        }

        /* =========================================================
           MESSAGE
           ========================================================= */

        .message {
          background: #172230;

          border:
            1px solid #344454;

          border-radius: 12px;

          padding: 13px;

          margin-bottom: 15px;

          color: #fbbf24;
        }

        /* =========================================================
           FOOTER
           ========================================================= */

        footer {
          text-align: center;

          color: #687686;

          padding: 25px;
        }

        footer small {
          display: block;

          margin-top: 5px;
        }

        /* =========================================================
           MOBILE
           ========================================================= */

        @media (max-width: 650px) {

          .page {
            padding: 10px;
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

          .header h1 {
            font-size: 21px;
          }

          .beer-crate-button {
            width: 70px;
            height: 70px;
          }

          .beer-crate {
            transform: scale(.9);
          }

        }

      `}</style>
    </>
  );
}
