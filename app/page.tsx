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

type Person = {
  id: number;
  name: string;
  drinks: number;
  cost: number;
  points: number;
};

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [drinks, setDrinks] = useState<DrinkItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [eventId, setEventId] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("1.20");

  const [personName, setPersonName] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);

    const { data: eventData, error: eventError } =
      await supabase
        .from("events")
        .select("id, title")
        .order("created_at", {
          ascending: false,
        });

    if (eventError) {
      setMessage(
        "❌ Events: " + eventError.message
      );
      setLoading(false);
      return;
    }

    const loadedEvents = eventData || [];

    setEvents(loadedEvents);

    if (!eventId && loadedEvents.length > 0) {
      setEventId(loadedEvents[0].id);
    }

    const { data: drinkData, error: drinkError } =
      await supabase
        .from("drinks")
        .select(
          "id, event_id, drink_name, getraenk, liters, menge, alcohol_percent, alkohol, preis, quantity"
        )
        .order("created_at", {
          ascending: false,
        });

    if (drinkError) {
      setMessage(
        "❌ Getränke: " +
          drinkError.message
      );
      setLoading(false);
      return;
    }

    setDrinks(drinkData || []);

    setLoading(false);
  }

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage(
        "❗ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!drinkName.trim()) {
      setMessage(
        "❗ Bitte Getränkenamen eingeben."
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("drinks")
      .insert([
        {
          event_id: eventId,
          drink_name: drinkName.trim(),
          getraenk: drinkName.trim(),
          liters: Number(liters) || 0,
          menge: Number(liters) || 0,
          alcohol_percent:
            Number(alcohol) || 0,
          alkohol: Number(alcohol) || 0,
          preis: Number(price) || 0,
          quantity: 1,
        },
      ]);

    setSaving(false);

    if (error) {
      setMessage(
        "❌ Speichern fehlgeschlagen: " +
          error.message
      );
      return;
    }

    setMessage(
      "✅ Getränk gespeichert!"
    );

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("1.20");

    await loadData();
  }

  function addPerson() {
    if (!personName.trim()) {
      setMessage(
        "❗ Bitte Namen eingeben."
      );
      return;
    }

    const newPerson: Person = {
      id: Date.now(),
      name: personName.trim(),
      drinks: 0,
      cost: 0,
      points: 0,
    };

    setPeople((current) => [
      ...current,
      newPerson,
    ]);

    setPersonName("");

    setMessage(
      "👤 Teilnehmer hinzugefügt!"
    );
  }

  function addDrinkToPerson(
    personId: number,
    drink: DrinkItem
  ) {
    const drinkPrice =
      Number(drink.preis || 0);

    setPeople((current) =>
      current.map((person) => {
        if (person.id !== personId) {
          return person;
        }

        return {
          ...person,
          drinks: person.drinks + 1,
          cost:
            person.cost + drinkPrice,
          points:
            person.points + 10,
        };
      })
    );

    setMessage(
      "🍺 Getränk zugeordnet!"
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedDrinks =
    drinks.filter(
      (drink) =>
        drink.event_id === eventId
    );

  const totalCost =
    selectedDrinks.reduce(
      (sum, drink) =>
        sum +
        Number(drink.preis || 0) *
          Number(drink.quantity || 1),
      0
    );

  const totalLiters =
    selectedDrinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.liters ??
            drink.menge ??
            0
        ) *
          Number(
            drink.quantity || 1
          ),
      0
    );

  const sortedPeople = [
    ...people,
  ].sort(
    (a, b) =>
      b.points - a.points
  );

  return (
    <main className="page">

      <div className="container">

        <header className="hero">

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

          <div className="title">
            <span>📅</span>
            <h2>
              Aktuelles Event
            </h2>
          </div>

          <select
            value={eventId}
            onChange={(e) =>
              setEventId(
                e.target.value
              )
            }
          >

            <option value="">
              Event auswählen
            </option>

            {events.map(
              (event) => (
                <option
                  key={event.id}
                  value={event.id}
                >
                  {event.title}
                </option>
              )
            )}

          </select>

        </section>


        <section className="stats">

          <div className="stat">
            <span>🍺</span>
            <strong>
              {selectedDrinks.length}
            </strong>
            <small>
              Getränke
            </small>
          </div>

          <div className="stat">
            <span>💧</span>
            <strong>
              {totalLiters.toFixed(
                1
              )}
            </strong>
            <small>
              Liter
            </small>
          </div>

          <div className="stat">
            <span>💶</span>
            <strong>
              {totalCost.toFixed(
                2
              )} €
            </strong>
            <small>
              Kosten
            </small>
          </div>

          <div className="stat">
            <span>👥</span>
            <strong>
              {people.length}
            </strong>
            <small>
              Teilnehmer
            </small>
          </div>

        </section>


        <section className="card">

          <div className="title">
            <span>🍺</span>
            <h2>
              Getränk hinzufügen
            </h2>
          </div>


          <div className="form">

            <label>
              Getränk

              <input
                value={drinkName}
                onChange={(e) =>
                  setDrinkName(
                    e.target.value
                  )
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
                    setLiters(
                      e.target.value
                    )
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
                    setAlcohol(
                      e.target.value
                    )
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
                  setPrice(
                    e.target.value
                  )
                }
              />
            </label>


            <button
              className="primary"
              onClick={
                saveDrink
              }
              disabled={saving}
            >
              {saving
                ? "⏳ Speichert..."
                : "🍻 Getränk speichern"}
            </button>

          </div>

        </section>


        <section className="card">

          <div className="title">
            <span>👥</span>
            <h2>
              Teilnehmer
            </h2>
          </div>


          <div className="addPerson">

            <input
              value={personName}
              onChange={(e) =>
                setPersonName(
                  e.target.value
                )
              }
              placeholder="Name eingeben"
            />

            <button
              className="primary"
              onClick={
                addPerson
              }
            >
              ➕ Hinzufügen
            </button>

          </div>


          {people.length === 0 && (
            <div className="empty">
              <span>👥</span>
              <p>
                Noch keine Teilnehmer.
              </p>
            </div>
          )}


          {people.map(
            (person) => (

              <div
                className="person"
                key={person.id}
              >

                <div className="personInfo">

                  <strong>
                    {person.name}
                  </strong>

                  <span>
                    🍺 {person.drinks}
                    {" · "}
                    💶{" "}
                    {person.cost.toFixed(
                      2
                    )} €
                    {" · "}
                    🏆{" "}
                    {person.points}
                    Punkte
                  </span>

                </div>


                {selectedDrinks.length >
                  0 && (

                  <select
                    defaultValue=""
                    onChange={(e) => {

                      const drink =
                        selectedDrinks.find(
                          (item) =>
                            item.id ===
                            e.target.value
                        );

                      if (drink) {
                        addDrinkToPerson(
                          person.id,
                          drink
                        );
                      }

                      e.target.value =
                        "";
                    }}
                  >

                    <option value="">
                      🍺 Getränk
                    </option>

                    {selectedDrinks.map(
                      (drink) => (

                        <option
                          key={drink.id}
                          value={drink.id}
                        >
                          {drink.drink_name ||
                            drink.getraenk ||
                            "Getränk"}
                        </option>

                      )
                    )}

                  </select>

                )}

              </div>

            )
          )}

        </section>


        <section className="card">

          <div className="title">
            <span>🍺</span>
            <h2>
              Getränke
            </h2>
          </div>


          {loading && (
            <p>
              ⏳ Lade Daten...
            </p>
          )}


          {!loading &&
            selectedDrinks.length ===
              0 && (

              <div className="empty">

                <span>
                  🍻
                </span>

                <p>
                  Noch keine Getränke.
                </p>

              </div>

            )}


          {selectedDrinks.map(
            (drink) => {

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
                      {Number(
                        liter
                      ).toFixed(
                        1
                      )}{" "}
                      Liter ·{" "}
                      {Number(
                        alcoholValue
                      ).toFixed(
                        1
                      )} %
                    </span>

                  </div>

                  <strong>
                    {Number(
                      drink.preis ||
                        0
                    ).toFixed(
                      2
                    )} €
                  </strong>

                </div>

              );
            }
          )}

        </section>


        <section className="card">

          <div className="title">
            <span>🏆</span>
            <h2>
              Ranking
            </h2>
          </div>


          {sortedPeople.length ===
            0 && (

            <div className="empty">

              <span>
                🏆
              </span>

              <p>
                Noch keine Teilnehmer.
              </p>

            </div>

          )}


          {sortedPeople.map(
            (
              person,
              index
            ) => (

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
                    : `${index + 1}.`}

                </div>


                <div className="rankName">

                  <strong>
                    {person.name}
                  </strong>

                  <span>
                    🍺{" "}
                    {person.drinks}
                    {" · "}
                    💶{" "}
                    {person.cost.toFixed(
                      2
                    )} €
                  </span>

                </div>


                <strong>
                  {person.points}
                  {" "}P
                </strong>

              </div>

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
              #26364a,
              #10151d 50%,
              #080b10
            );
          color: white;
          padding: 15px 10px 50px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          max-width: 850px;
          margin: auto;
        }

        .hero {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px 5px 25px;
        }

        .logo {
          width: 62px;
          height: 62px;
          border-radius: 20px;
          background:
            rgba(255,255,255,.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
        }

        h1 {
          margin: 0;
          font-size: 27px;
        }

        .hero p {
          margin: 6px 0 0;
          color: #aeb8c5;
        }

        .card {
          background:
            rgba(255,255,255,.08);
          border:
            1px solid
            rgba(255,255,255,.1);
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 15px;
          backdrop-filter:
            blur(12px);
        }

        .title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .title span {
          font-size: 25px;
        }

        h2 {
          margin: 0;
          font-size: 20px;
        }

        select,
        input {
          width: 100%;
          border: none;
          outline: none;
          border-radius: 13px;
          padding: 14px;
          background:
            rgba(255,255,255,.12);
          color: white;
          font-size: 16px;
        }

        select option {
          color: black;
        }

        label {
          color: #b8c1cd;
          font-size: 13px;
        }

        label input {
          margin-top: 7px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .row {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 12px;
        }

        .primary {
          border: none;
          border-radius: 14px;
          padding: 15px;
          font-size: 16px;
          font-weight: bold;
          background: #f59e0b;
          color: #111827;
          cursor: pointer;
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
          background:
            rgba(255,255,255,.08);
          border-radius: 17px;
          padding: 15px 5px;
        }

        .stat span {
          display: block;
          font-size: 22px;
        }

        .stat strong {
          display: block;
          font-size: 20px;
          margin-top: 4px;
        }

        .stat small {
          color: #aeb8c5;
        }

        .addPerson {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 10px;
          margin-bottom: 15px;
        }

        .person,
        .drink,
        .ranking {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          margin-top: 10px;
          border-radius: 15px;
          background:
            rgba(255,255,255,.06);
        }

        .personInfo,
        .drinkInfo,
        .rankName {
          flex: 1;
        }

        .personInfo strong,
        .personInfo span,
        .drinkInfo strong,
        .drinkInfo span,
        .rankName strong,
        .rankName span {
          display: block;
        }

        .personInfo span,
        .drinkInfo span,
        .rankName span {
          color: #aeb8c5;
          font-size: 13px;
          margin-top: 4px;
        }

        .drinkIcon {
          font-size: 28px;
        }

        .place {
          width: 40px;
          text-align: center;
          font-size: 22px;
        }

        .empty {
          text-align: center;
          color: #aeb8c5;
          padding: 20px;
        }

        .empty span {
          font-size: 35px;
        }

        .message {
          padding: 15px;
          border-radius: 15px;
          background:
            rgba(245,158,11,.15);
          margin-bottom: 15px;
        }

        footer {
          text-align: center;
          color: #6f7b89;
          padding: 20px;
        }

        @media(max-width:600px) {

          h1 {
            font-size: 22px;
          }

          .stats {
            grid-template-columns:
              1fr 1fr;
          }

          .row {
            grid-template-columns:
              1fr;
          }

          .addPerson {
            grid-template-columns:
              1fr;
          }

          .person {
            align-items: flex-start;
            flex-direction: column;
          }

        }

      `}</style>

    </main>
  );
}
