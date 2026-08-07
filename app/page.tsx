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
  liters: number;
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
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /*
   * EVENTS UND GETRÄNKE LADEN
   */
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
        "❌ Events konnten nicht geladen werden: " +
          eventError.message
      );

      setLoading(false);
      return;
    }

    const loadedEvents = eventData || [];

    setEvents(loadedEvents);

    if (
      !eventId &&
      loadedEvents.length > 0
    ) {
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
        "❌ Getränke konnten nicht geladen werden: " +
          drinkError.message
      );

      setLoading(false);
      return;
    }

    setDrinks(drinkData || []);
    setLoading(false);
  }

  /*
   * TEILNEHMER AUS DEM BROWSER LADEN
   */
  useEffect(() => {
    if (!eventId) return;

    const storageKey =
      "guester-zapfhahn-people-" +
      eventId;

    const saved =
      localStorage.getItem(
        storageKey
      );

    if (saved) {
      try {
        setPeople(
          JSON.parse(saved)
        );
      } catch {
        setPeople([]);
      }
    } else {
      setPeople([]);
    }
  }, [eventId]);

  /*
   * TEILNEHMER SPEICHERN
   */
  useEffect(() => {
    if (!eventId) return;

    const storageKey =
      "guester-zapfhahn-people-" +
      eventId;

    localStorage.setItem(
      storageKey,
      JSON.stringify(people)
    );
  }, [people, eventId]);

  /*
   * START
   */
  useEffect(() => {
    loadData();
  }, []);

  /*
   * GETRÄNK SPEICHERN
   */
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
        "❗ Bitte einen Getränkenamen eingeben."
      );
      return;
    }

    setSaving(true);

    const { error } =
      await supabase
        .from("drinks")
        .insert([
          {
            event_id: eventId,
            drink_name:
              drinkName.trim(),
            getraenk:
              drinkName.trim(),
            liters:
              Number(liters) || 0,
            menge:
              Number(liters) || 0,
            alcohol_percent:
              Number(alcohol) || 0,
            alkohol:
              Number(alcohol) || 0,
            preis:
              Number(price) || 0,
            quantity: 1,
          },
        ]);

    setSaving(false);

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setMessage(
      "✅ Getränk erfolgreich gespeichert!"
    );

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    await loadData();
  }

  /*
   * TEILNEHMER HINZUFÜGEN
   */
  function addPerson() {
    const name =
      personName.trim();

    if (!name) {
      setMessage(
        "❗ Bitte einen Namen eingeben."
      );
      return;
    }

    const exists =
      people.some(
        (person) =>
          person.name.toLowerCase() ===
          name.toLowerCase()
      );

    if (exists) {
      setMessage(
        "❗ Dieser Teilnehmer ist bereits vorhanden."
      );
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

    setPeople((current) => [
      ...current,
      newPerson,
    ]);

    setPersonName("");

    setMessage(
      "✅ " +
        name +
        " wurde hinzugefügt!"
    );
  }

  /*
   * TEILNEHMER LÖSCHEN
   */
  function removePerson(
    id: number
  ) {
    setPeople((current) =>
      current.filter(
        (person) =>
          person.id !== id
      )
    );

    setMessage(
      "👤 Teilnehmer entfernt."
    );
  }

  /*
   * GETRÄNK EINER PERSON GUTSCHREIBEN
   */
  function assignDrink(
    personId: number,
    drinkId: string
  ) {
    const drink =
      drinks.find(
        (item) =>
          item.id === drinkId
      );

    if (!drink) return;

    const litersValue =
      Number(
        drink.liters ??
          drink.menge ??
          0
      );

    const priceValue =
      Number(
        drink.preis ?? 0
      );

    setPeople((current) =>
      current.map((person) => {
        if (
          person.id !== personId
        ) {
          return person;
        }

        return {
          ...person,
          drinks:
            person.drinks + 1,
          liters:
            person.liters +
            litersValue,
          cost:
            person.cost +
            priceValue,
          points:
            person.points + 10,
        };
      })
    );

    setMessage(
      "🍺 Getränk wurde " +
        "zugeordnet! +10 Punkte"
    );
  }

  /*
   * AKTUELLE GETRÄNKE
   */
  const selectedDrinks =
    drinks.filter(
      (drink) =>
        drink.event_id === eventId
    );

  /*
   * GESAMTKOSTEN
   */
  const totalCost =
    selectedDrinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.preis || 0
        ) *
          Number(
            drink.quantity || 1
          ),
      0
    );

  /*
   * GESAMTLITER
   */
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

  /*
   * SORTIERTES RANKING
   */
  const ranking = [
    ...people,
  ].sort(
    (a, b) =>
      b.points - a.points
  );

  /*
   * GESAMTPUNKTE
   */
  const totalPoints =
    people.reduce(
      (sum, person) =>
        sum + person.points,
      0
    );

  /*
   * ZUORDNUNGEN
   */
  const assignments =
    people.reduce(
      (sum, person) =>
        sum + person.drinks,
      0
    );

  return (
    <main className="page">

      <div className="container">

        {/* HEADER */}

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


        {/* EVENT */}

        <section className="card">

          <div className="sectionHeader">

            <div className="icon">
              📅
            </div>

            <div>
              <h2>
                Aktuelles Event
              </h2>

              <p>
                Wähle dein Event
              </p>
            </div>

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


        {/* STATISTIK */}

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
              {totalLiters.toFixed(1)}
            </strong>
            <small>
              Liter
            </small>
          </div>

          <div className="stat">
            <span>💶</span>
            <strong>
              {totalCost.toFixed(2)} €
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


        {/* TEILNEHMER */}

        <section className="card">

          <div className="sectionHeader">

            <div className="icon">
              👥
            </div>

            <div>
              <h2>
                Teilnehmer
              </h2>

              <p>
                Wer ist beim Event dabei?
              </p>
            </div>

          </div>


          <div className="addRow">

            <input
              value={personName}
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
              placeholder="Name eingeben..."
            />

            <button
              onClick={addPerson}
              className="primary"
            >
              ➕ Hinzufügen
            </button>

          </div>


          {people.length === 0 ? (

            <div className="empty">

              <div>
                👥
              </div>

              <strong>
                Noch keine Teilnehmer
              </strong>

              <span>
                Füge die Personen
                deines Events hinzu.
              </span>

            </div>

          ) : (

            <div className="people">

              {people.map(
                (person) => (

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

                      <strong>
                        {person.name}
                      </strong>

                      <span>
                        🍺 {person.drinks}
                        {" · "}
                        💧{" "}
                        {person.liters.toFixed(
                          1
                        )} L
                        {" · "}
                        💶{" "}
                        {person.cost.toFixed(
                          2
                        )} €
                      </span>

                    </div>

                    <div className="pointsSmall">
                      🏆 {person.points}
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

                )
              )}

            </div>

          )}

        </section>


        {/* GETRÄNK ERSTELLEN */}

        <section className="card">

          <div className="sectionHeader">

            <div className="icon">
              🍺
            </div>

            <div>
              <h2>
                Getränk hinzufügen
              </h2>

              <p>
                Getränk für das Event erfassen
              </p>
            </div>

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


            <div className="three">

              <label>
                Liter

                <input
                  type="number"
                  min="0"
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
                  min="0"
                  step="0.1"
                  value={alcohol}
                  onChange={(e) =>
                    setAlcohol(
                      e.target.value
                    )
                  }
                />

              </label>


              <label>
                Preis €

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value
                    )
                  }
                />

              </label>

            </div>


            <button
              className="save"
              onClick={saveDrink}
              disabled={saving}
            >

              {saving
                ? "⏳ Speichert..."
                : "🍻 Getränk speichern"}

            </button>

          </div>

        </section>


        {/* ZUORDNEN */}

        <section className="card">

          <div className="sectionHeader">

            <div className="icon">
              🔗
            </div>

            <div>
              <h2>
                Getränk zuordnen
              </h2>

              <p>
                Getränk einem Teilnehmer gutschreiben
              </p>
            </div>

          </div>


          {people.length === 0 ? (

            <div className="notice">
              👥 Zuerst Teilnehmer
              hinzufügen.
            </div>

          ) : selectedDrinks.length ===
            0 ? (

            <div className="notice">
              🍺 Zuerst ein Getränk
              hinzufügen.
            </div>

          ) : (

            <div className="assignments">

              {people.map(
                (person) => (

                  <div
                    className="assignment"
                    key={person.id}
                  >

                    <div className="miniAvatar">
                      {person.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <strong>
                      {person.name}
                    </strong>

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
                        🍺 Getränk auswählen
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
                            {" · "}
                            {Number(
                              drink.preis ||
                                0
                            ).toFixed(2)}
                            €
                          </option>

                        )
                      )}

                    </select>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* GETRÄNKE */}

        <section className="card">

          <div className="sectionHeader">

            <div className="icon">
              🍺
            </div>

            <div>
              <h2>
                Getränke
              </h2>

              <p>
                Getränke dieses Events
              </p>
            </div>

          </div>


          {loading ? (

            <div className="notice">
              ⏳ Daten werden geladen...
            </div>

          ) : selectedDrinks.length ===
            0 ? (

            <div className="empty">

              <div>
                🍻
              </div>

              <strong>
                Noch keine Getränke
              </strong>

              <span>
                Füge oben ein Getränk hinzu.
              </span>

            </div>

          ) : (

            <div className="drinkList">

              {selectedDrinks.map(
                (drink) => {

                  const name =
                    drink.drink_name ||
                    drink.getraenk ||
                    "Getränk";

                  const drinkLiters =
                    Number(
                      drink.liters ??
                        drink.menge ??
                        0
                    );

                  const drinkAlcohol =
                    Number(
                      drink.alcohol_percent ??
                        drink.alkohol ??
                        0
                    );

                  const drinkPrice =
                    Number(
                      drink.preis || 0
                    );

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
                          {drinkLiters.toFixed(
                            1
                          )} Liter
                          {" · "}
                          {drinkAlcohol.toFixed(
                            1
                          )} %
                        </span>

                      </div>

                      <b>
                        {drinkPrice.toFixed(
                          2
                        )} €
                      </b>

                    </div>

                  );
                }
              )}

            </div>

          )}

        </section>


        {/* RANKING */}

        <section className="card">

          <div className="sectionHeader">

            <div className="icon">
              🏆
            </div>

            <div>
              <h2>
                Ranking
              </h2>

              <p>
                Wer führt das Event an?
              </p>
            </div>

          </div>


          {ranking.length === 0 ? (

            <div className="empty">

              <div>
                🏆
              </div>

              <strong>
                Ranking wartet
              </strong>

              <span>
                Sobald Teilnehmer Getränke
                bekommen, geht es los.
              </span>

            </div>

          ) : (

            <div className="ranking">

              {ranking.map(
                (
                  person,
                  index
                ) => (

                  <div
                    className={
                      "rank " +
                      (index === 0
                        ? "winner"
                        : "")
                    }
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

                    <div className="rankAvatar">
                      {person.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="rankInfo">

                      <strong>
                        {person.name}
                      </strong>

                      <span>
                        🍺 {person.drinks}
                        {" · "}
                        💧{" "}
                        {person.liters.toFixed(
                          1
                        )} L
                      </span>

                    </div>

                    <div className="rankPoints">
                      {person.points}
                      <small>
                        Punkte
                      </small>
                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* ÜBERSICHT */}

        <section className="card">

          <div className="sectionHeader">

            <div className="icon">
              📊
            </div>

            <div>
              <h2>
                Event-Übersicht
              </h2>

              <p>
                Aktueller Stand
              </p>
            </div>

          </div>


          <div className="summary">

            <div>
              👥
              <span>
                Teilnehmer
              </span>
              <strong>
                {people.length}
              </strong>
            </div>

            <div>
              🍺
              <span>
                Getränke
              </span>
              <strong>
                {selectedDrinks.length}
              </strong>
            </div>

            <div>
              🔗
              <span>
                Zuordnungen
              </span>
              <strong>
                {assignments}
              </strong>
            </div>

            <div>
              🏆
              <span>
                Gesamtpunkte
              </span>
              <strong>
                {totalPoints}
              </strong>
            </div>

          </div>

        </section>


        {/* MELDUNG */}

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
              circle at top left,
              #263a4f,
              #0c1118 42%,
              #05070a
            );
          color: white;
          padding: 15px 10px 50px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          max-width: 900px;
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
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          background:
            linear-gradient(
              135deg,
              rgba(245,158,11,.28),
              rgba(255,255,255,.06)
            );
          border:
            1px solid
            rgba(255,255,255,.12);
        }

        h1 {
          margin: 0;
          font-size: 27px;
        }

        .hero p {
          margin: 5px 0 0;
          color: #91a0b0;
          font-size: 13px;
        }

        .card {
          background:
            rgba(255,255,255,.055);
          border:
            1px solid
            rgba(255,255,255,.08);
          border-radius: 23px;
          padding: 20px;
          margin-bottom: 14px;
          backdrop-filter: blur(12px);
          box-shadow:
            0 10px 30px
            rgba(0,0,0,.18);
        }

        .sectionHeader {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 17px;
        }

        .sectionHeader h2 {
          margin: 0;
          font-size: 19px;
        }

        .sectionHeader p {
          margin: 4px 0 0;
          color: #7f8d9c;
          font-size: 12px;
        }

        .icon {
          width: 45px;
          height: 45px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            rgba(245,158,11,.12);
          font-size: 22px;
        }

        input,
        select {
          width: 100%;
          min-height: 49px;
          border-radius: 13px;
          border:
            1px solid
            rgba(255,255,255,.08);
          background:
            rgba(255,255,255,.065);
          color: white;
          padding: 12px;
          outline: none;
          font-size: 14px;
        }

        input:focus,
        select:focus {
          border-color:
            rgba(245,158,11,.55);
        }

        select option {
          color: black;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .stat {
          text-align: center;
          padding: 15px 5px;
          border-radius: 18px;
          background:
            rgba(255,255,255,.055);
          border:
            1px solid
            rgba(255,255,255,.07);
        }

        .stat span {
          display: block;
          font-size: 22px;
        }

        .stat strong {
          display: block;
          margin-top: 5px;
          font-size: 20px;
        }

        .stat small {
          display: block;
          color: #84909f;
          margin-top: 3px;
        }

        .addRow {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 9px;
          margin-bottom: 14px;
        }

        button {
          cursor: pointer;
        }

        .primary,
        .save {
          border: none;
          border-radius: 13px;
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #d97706
            );
          color: #111;
          font-weight: 800;
          padding: 0 18px;
          min-height: 49px;
        }

        .save {
          width: 100%;
          margin-top: 4px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        label {
          color: #aab5c1;
          font-size: 12px;
          font-weight: 700;
        }

        label input {
          margin-top: 6px;
        }

        .three {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 10px;
        }

        .people,
        .drinkList,
        .ranking,
        .assignments {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .person,
        .drink,
        .rank,
        .assignment {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px;
          border-radius: 16px;
          background:
            rgba(255,255,255,.045);
        }

        .avatar,
        .rankAvatar,
        .miniAvatar {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 50%;
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #b45309
            );
          color: #111;
          font-weight: 900;
        }

        .avatar {
          width: 44px;
          height: 44px;
        }

        .miniAvatar {
          width: 38px;
          height: 38px;
        }

        .personInfo,
        .drinkInfo,
        .rankInfo {
          flex: 1;
        }

        .personInfo strong,
        .drinkInfo strong,
        .rankInfo strong {
          display: block;
        }

        .personInfo span,
        .drinkInfo span,
        .rankInfo span {
          display: block;
          margin-top: 4px;
          color: #8592a1;
          font-size: 11px;
        }

        .pointsSmall {
          font-size: 12px;
          font-weight: 800;
        }

        .delete {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 9px;
          background:
            rgba(255,255,255,.06);
          color: #aab4bf;
          font-size: 20px;
        }

        .drinkIcon {
          width: 47px;
          height: 47px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            rgba(245,158,11,.1);
          font-size: 24px;
        }

        .assignment {
          display: grid;
          grid-template-columns:
            auto 1fr 1.4fr;
        }

        .rank.winner {
          background:
            linear-gradient(
              90deg,
              rgba(245,158,11,.16),
              rgba(255,255,255,.04)
            );
          border:
            1px solid
            rgba(245,158,11,.18);
        }

        .place {
          width: 32px;
          text-align: center;
          font-size: 20px;
        }

        .rankAvatar {
          width: 42px;
          height: 42px;
        }

        .rankPoints {
          font-size: 17px;
          font-weight: 900;
          text-align: right;
        }

        .rankPoints small {
          display: block;
          color: #82909e;
          font-size: 9px;
          font-weight: 400;
        }

        .summary {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 9px;
        }

        .summary div {
          padding: 14px;
          border-radius: 15px;
          background:
            rgba(255,255,255,.045);
        }

        .summary span {
          display: block;
          color: #8592a1;
          font-size: 11px;
          margin-top: 5px;
        }

        .summary strong {
          display: block;
          font-size: 20px;
          margin-top: 5px;
        }

        .empty {
          text-align: center;
          padding: 25px 10px;
          color: #84909e;
        }

        .empty div {
          font-size: 35px;
          margin-bottom: 7px;
        }

        .empty strong {
          display: block;
          color: #c0c9d3;
        }

        .empty span {
          display: block;
          margin-top: 5px;
          font-size: 12px;
        }

        .notice,
        .message {
          padding: 13px;
          border-radius: 13px;
          background:
            rgba(255,255,255,.045);
          color: #aab5c1;
        }

        .message {
          margin-bottom: 15px;
          color: #fbbf24;
        }

        footer {
          text-align: center;
          padding: 22px;
          color: #657281;
          font-size: 13px;
        }

        footer small {
          display: block;
          margin-top: 5px;
          color: #4c5865;
        }

        @media(max-width:700px) {

          .page {
            padding:
              8px
              7px
              40px;
          }

          h1 {
            font-size: 21px;
          }

          .hero p {
            font-size: 11px;
          }

          .stats {
            grid-template-columns:
              1fr 1fr;
          }

          .addRow {
            grid-template-columns:
              1fr;
          }

          .primary {
            width: 100%;
          }

          .three {
            grid-template-columns:
              1fr;
          }

          .assignment {
            grid-template-columns:
              auto 1fr;
          }

          .assignment select {
            grid-column:
              1 / -1;
          }

          .summary {
            grid-template-columns:
              1fr 1fr;
          }

        }

      `}</style>

    </main>
  );
}
