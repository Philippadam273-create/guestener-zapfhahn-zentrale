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
        "❗ Bitte einen Getränkenamen eingeben."
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
      "✅ Getränk erfolgreich gespeichert!"
    );

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("1.20");

    await loadData();
  }

  function addPerson() {
    const cleanName =
      personName.trim();

    if (!cleanName) {
      setMessage(
        "❗ Bitte einen Namen eingeben."
      );
      return;
    }

    const alreadyExists =
      people.some(
        (person) =>
          person.name.toLowerCase() ===
          cleanName.toLowerCase()
      );

    if (alreadyExists) {
      setMessage(
        "❗ Dieser Teilnehmer ist bereits vorhanden."
      );
      return;
    }

    setPeople((current) => [
      ...current,
      {
        id: Date.now(),
        name: cleanName,
        drinks: 0,
        liters: 0,
        cost: 0,
        points: 0,
      },
    ]);

    setPersonName("");

    setMessage(
      "👤 Teilnehmer hinzugefügt!"
    );
  }

  function removePerson(
    personId: number
  ) {
    setPeople((current) =>
      current.filter(
        (person) =>
          person.id !== personId
      )
    );
  }

  function assignDrink(
    personId: number,
    drinkId: string
  ) {
    const drink =
      drinks.find(
        (item) =>
          item.id === drinkId
      );

    if (!drink) {
      return;
    }

    const drinkLiters =
      Number(
        drink.liters ??
          drink.menge ??
          0
      );

    const drinkPrice =
      Number(
        drink.preis || 0
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
            drinkLiters,
          cost:
            person.cost +
            drinkPrice,
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
        Number(
          drink.preis || 0
        ) *
          Number(
            drink.quantity || 1
          ),
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

  const assignedDrinks =
    people.reduce(
      (sum, person) =>
        sum + person.drinks,
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
              Deine Zentrale für
              Events, Getränke,
              Kosten & Rankings
            </p>
          </div>

        </header>


        <section className="card eventCard">

          <div className="sectionHeader">

            <div className="iconBox">
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


        <section className="stats">

          <div className="statCard">

            <div className="statIcon">
              🍺
            </div>

            <strong>
              {selectedDrinks.length}
            </strong>

            <span>
              Getränke
            </span>

          </div>


          <div className="statCard">

            <div className="statIcon">
              💧
            </div>

            <strong>
              {totalLiters.toFixed(
                1
              )}
            </strong>

            <span>
              Liter
            </span>

          </div>


          <div className="statCard">

            <div className="statIcon">
              💶
            </div>

            <strong>
              {totalCost.toFixed(
                2
              )} €
            </strong>

            <span>
              Kosten
            </span>

          </div>


          <div className="statCard">

            <div className="statIcon">
              👥
            </div>

            <strong>
              {people.length}
            </strong>

            <span>
              Teilnehmer
            </span>

          </div>

        </section>


        <section className="card">

          <div className="sectionHeader">

            <div className="iconBox">
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


          <div className="addPerson">

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
              className="primaryButton"
              onClick={
                addPerson
              }
            >
              ➕ Hinzufügen
            </button>

          </div>


          {people.length ===
            0 && (

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

          )}


          <div className="peopleList">

            {people.map(
              (person) => (

                <div
                  className="personCard"
                  key={person.id}
                >

                  <div className="avatar">
                    {person.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>


                  <div className="personDetails">

                    <strong>
                      {person.name}
                    </strong>

                    <span>
                      🍺{" "}
                      {person.drinks}
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


                  <div className="personPoints">
                    🏆{" "}
                    {person.points}
                  </div>


                  <button
                    className="deleteButton"
                    onClick={() =>
                      removePerson(
                        person.id
                      )
                    }
                    title="Teilnehmer entfernen"
                  >
                    ×
                  </button>

                </div>

              )
            )}

          </div>

        </section>


        <section className="card">

          <div className="sectionHeader">

            <div className="iconBox">
              🍺
            </div>

            <div>
              <h2>
                Getränk hinzufügen
              </h2>

              <p>
                Getränk für das Event
                erfassen
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
                placeholder="z. B. Pils, Radler, Cola..."
              />
            </label>


            <div className="formRow">

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
              className="saveButton"
              onClick={
                saveDrink
              }
              disabled={saving}
            >

              {saving
                ? "⏳ Wird gespeichert..."
                : "🍻 Getränk speichern"}

            </button>

          </div>

        </section>


        <section className="card">

          <div className="sectionHeader">

            <div className="iconBox">
              🔗
            </div>

            <div>
              <h2>
                Getränk zuordnen
              </h2>

              <p>
                Getränk einem Teilnehmer
                gutschreiben
              </p>
            </div>

          </div>


          {people.length ===
            0 ? (

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

            <div className="assignmentList">

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
                            ).toFixed(
                              2
                            )} €
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


        <section className="card">

          <div className="sectionHeader">

            <div className="iconBox">
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


          {loading && (
            <div className="loading">
              ⏳ Daten werden geladen...
            </div>
          )}


          {!loading &&
            selectedDrinks.length ===
              0 && (

              <div className="empty">

                <div>
                  🍻
                </div>

                <strong>
                  Noch keine Getränke
                </strong>

                <span>
                  Füge oben das erste
                  Getränk hinzu.
                </span>

              </div>

            )}


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
                    className="drinkCard"
                    key={drink.id}
                  >

                    <div className="drinkBigIcon">
                      🍺
                    </div>


                    <div className="drinkDetails">

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


                    <div className="drinkPrice">
                      {drinkPrice.toFixed(
                        2
                      )} €
                    </div>

                  </div>

                );

              }
            )}

          </div>

        </section>


        <section className="card rankingCard">

          <div className="sectionHeader">

            <div className="iconBox">
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


          {sortedPeople.length ===
            0 ? (

            <div className="empty">

              <div>
                🏆
              </div>

              <strong>
                Ranking wartet
              </strong>

              <span>
                Sobald Teilnehmer
                Getränke bekommen,
                geht es los.
              </span>

            </div>

          ) : (

            <div className="rankingList">

              {sortedPeople.map(
                (
                  person,
                  index
                ) => (

                  <div
                    className={
                      "rankingRow " +
                      (index === 0
                        ? "first"
                        : "")
                    }
                    key={person.id}
                  >

                    <div className="rankPlace">

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


                    <div className="rankPerson">

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


                    <div className="points">
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


        <section className="card summaryCard">

          <div className="sectionHeader">

            <div className="iconBox">
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


          <div className="summaryGrid">

            <div>
              <span>
                👥 Teilnehmer
              </span>

              <strong>
                {people.length}
              </strong>
            </div>


            <div>
              <span>
                🍺 Getränke
              </span>

              <strong>
                {selectedDrinks.length}
              </strong>
            </div>


            <div>
              <span>
                🔗 Zuordnungen
              </span>

              <strong>
                {assignedDrinks}
              </strong>
            </div>


            <div>
              <span>
                🏆 Gesamtpunkte
              </span>

              <strong>
                {people.reduce(
                  (sum, person) =>
                    sum +
                    person.points,
                  0
                )}
              </strong>
            </div>

          </div>

        </section>


        {message && (

          <div className="message">
            {message}
          </div>

        )}


        <footer>
          🍻 Güstener Zapfhahn Zentrale
          <br />
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
              circle at 10% 0%,
              #273b50 0%,
              #111923 35%,
              #070a0f 100%
            );
          color: #fff;
          padding: 15px 12px 60px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 900px;
          margin: auto;
        }

        .hero {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px 4px 28px;
        }

        .logo {
          width: 66px;
          height: 66px;
          border-radius: 22px;
          background:
            linear-gradient(
              145deg,
              rgba(245,158,11,.25),
              rgba(255,255,255,.08)
            );
          border:
            1px solid
            rgba(255,255,255,.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 35px;
          box-shadow:
            0 12px 30px
            rgba(0,0,0,.25);
        }

        h1 {
          margin: 0;
          font-size: 28px;
          letter-spacing: -.5px;
        }

        .hero p {
          margin: 7px 0 0;
          color: #aeb9c7;
          font-size: 14px;
        }

        .card {
          background:
            rgba(255,255,255,.065);
          border:
            1px solid
            rgba(255,255,255,.09);
          border-radius: 24px;
          padding: 21px;
          margin-bottom: 15px;
          box-shadow:
            0 12px 35px
            rgba(0,0,0,.16);
          backdrop-filter:
            blur(14px);
        }

        .eventCard {
          border-color:
            rgba(245,158,11,.18);
        }

        .sectionHeader {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .sectionHeader h2 {
          margin: 0;
          font-size: 20px;
        }

        .sectionHeader p {
          margin: 4px 0 0;
          color: #8794a3;
          font-size: 13px;
        }

        .iconBox {
          width: 45px;
          height: 45px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            rgba(245,158,11,.13);
          font-size: 23px;
          flex-shrink: 0;
        }

        select,
        input {
          width: 100%;
          min-height: 50px;
          border: 1px solid
            rgba(255,255,255,.08);
          outline: none;
          border-radius: 14px;
          padding: 13px 14px;
          background:
            rgba(255,255,255,.075);
          color: #fff;
          font-size: 15px;
          transition: .2s;
        }

        input:focus,
        select:focus {
          border-color:
            rgba(245,158,11,.6);
          background:
            rgba(255,255,255,.1);
        }

        select option {
          color: #111;
        }

        label {
          color: #aeb9c7;
          font-size: 12px;
          font-weight: 600;
        }

        label input {
          margin-top: 7px;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 11px;
          margin-bottom: 15px;
        }

        .statCard {
          padding: 17px 8px;
          text-align: center;
          border-radius: 20px;
          background:
            rgba(255,255,255,.065);
          border:
            1px solid
            rgba(255,255,255,.07);
        }

        .statIcon {
          font-size: 23px;
          margin-bottom: 6px;
        }

        .statCard strong {
          display: block;
          font-size: 21px;
        }

        .statCard span {
          display: block;
          color: #8491a0;
          font-size: 12px;
          margin-top: 4px;
        }

        .addPerson {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 10px;
          margin-bottom: 15px;
        }

        .primaryButton,
        .saveButton {
          border: 0;
          border-radius: 14px;
          padding: 0 18px;
          min-height: 50px;
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #d97706
            );
          color: #151515;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          box-shadow:
            0 8px 20px
            rgba(245,158,11,.18);
        }

        .saveButton {
          width: 100%;
          margin-top: 4px;
          padding: 15px;
        }

        .primaryButton:disabled,
        .saveButton:disabled {
          opacity: .6;
          cursor: default;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .formRow {
          display: grid;
          grid-template-columns:
            1fr 1fr 1fr;
          gap: 11px;
        }

        .peopleList {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .personCard {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px;
          border-radius: 17px;
          background:
            rgba(255,255,255,.055);
        }

        .avatar,
        .miniAvatar,
        .rankAvatar {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: 800;
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #b45309
            );
          color: #111;
        }

        .avatar {
          width: 45px;
          height: 45px;
        }

        .personDetails {
          flex: 1;
          min-width: 0;
        }

        .personDetails strong {
          display: block;
          font-size: 15px;
        }

        .personDetails span {
          display: block;
          margin-top: 4px;
          color: #8d9aaa;
          font-size: 12px;
        }

        .personPoints {
          font-size: 13px;
          font-weight: 700;
        }

        .deleteButton {
          width: 31px;
          height: 31px;
          border: 0;
          border-radius: 10px;
          background:
            rgba(255,255,255,.06);
          color: #9ca8b6;
          font-size: 21px;
          cursor: pointer;
        }

        .assignmentList {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .assignment {
          display: grid;
          grid-template-columns:
            auto 1fr 1.4fr;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 16px;
          background:
            rgba(255,255,255,.045);
        }

        .miniAvatar {
          width: 38px;
          height: 38px;
          font-size: 13px;
        }

        .assignment strong {
          font-size: 14px;
        }

        .drinkList {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .drinkCard {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px;
          border-radius: 17px;
          background:
            rgba(255,255,255,.055);
        }

        .drinkBigIcon {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background:
            rgba(245,158,11,.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
        }

        .drinkDetails {
          flex: 1;
        }

        .drinkDetails strong {
          display: block;
          font-size: 15px;
        }

        .drinkDetails span {
          display: block;
          color: #8996a5;
          font-size: 12px;
          margin-top: 4px;
        }

        .drinkPrice {
          font-weight: 800;
        }

        .rankingList {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rankingRow {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px;
          border-radius: 18px;
          background:
            rgba(255,255,255,.045);
        }

        .rankingRow.first {
          background:
            linear-gradient(
              90deg,
              rgba(245,158,11,.16),
              rgba(255,255,255,.045)
            );
          border:
            1px solid
            rgba(245,158,11,.18);
        }

        .rankPlace {
          width: 35px;
          text-align: center;
          font-size: 20px;
        }

        .rankAvatar {
          width: 42px;
          height: 42px;
        }

        .rankPerson {
          flex: 1;
        }

        .rankPerson strong {
          display: block;
        }

        .rankPerson span {
          display: block;
          color: #8996a5;
          font-size: 12px;
          margin-top: 4px;
        }

        .points {
          font-weight: 800;
          text-align: right;
        }

        .points small {
          display: block;
          color: #8996a5;
          font-size: 10px;
          font-weight: 400;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
        }

        .summaryGrid div {
          padding: 14px;
          border-radius: 16px;
          background:
            rgba(255,255,255,.045);
        }

        .summaryGrid span {
          display: block;
          color: #8c99a8;
          font-size: 11px;
        }

        .summaryGrid strong {
          display: block;
          margin-top: 6px;
          font-size: 21px;
        }

        .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 25px 15px;
          color: #7f8c9a;
        }

        .empty div {
          font-size: 38px;
          margin-bottom: 8px;
        }

        .empty strong {
          color: #c0c9d3;
          font-size: 14px;
        }

        .empty span {
          margin-top: 5px;
          font-size: 12px;
        }

        .notice,
        .loading,
        .message {
          padding: 14px;
          border-radius: 14px;
          background:
            rgba(255,255,255,.055);
          color: #aeb9c7;
        }

        .message {
          margin-bottom: 15px;
          color: #fbbf24;
        }

        footer {
          text-align: center;
          color: #687585;
          padding: 20px;
          font-size: 13px;
        }

        footer small {
          display: block;
          margin-top: 5px;
          color: #4f5c6b;
        }

        @media(max-width:700px) {

          .page {
            padding:
              8px
              8px
              45px;
          }

          .hero {
            padding:
              18px
              3px
              23px;
          }

          h1 {
            font-size: 22px;
          }

          .hero p {
            font-size: 12px;
          }

          .stats {
            grid-template-columns:
              1fr 1fr;
          }

          .formRow {
            grid-template-columns:
              1fr;
          }

          .addPerson {
            grid-template-columns:
              1fr;
          }

          .primaryButton {
            width: 100%;
          }

          .assignment {
            grid-template-columns:
              auto 1fr;
          }

          .assignment select {
            grid-column:
              1 / -1;
          }

          .summaryGrid {
            grid-template-columns:
              1fr 1fr;
          }

          .personCard {
            flex-wrap: wrap;
          }

          .personDetails {
            min-width: 120px;
          }

        }

      `}</style>

    </main>
  );
}
