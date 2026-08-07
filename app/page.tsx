"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Person = {
  id: number;
  name: string;
  drinks: number;
  liters: number;
  points: number;
};

type Payment = {
  id: number;
  personId: number;
  amount: number;
};

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");
  const [drinks, setDrinks] = useState<any[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [personName, setPersonName] = useState("");
  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [paymentPerson, setPaymentPerson] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [message, setMessage] = useState("");

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
    loadPayments(eventId);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guesten-people-" + eventId,
      JSON.stringify(people)
    );
  }, [people, eventId]);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guesten-payments-" + eventId,
      JSON.stringify(payments)
    );
  }, [payments, eventId]);

  async function loadEvents() {
    const { data } = await supabase
      .from("events")
      .select("id,title")
      .order("start_date", {
        ascending: false,
      });

    if (!data || data.length === 0) return;

    setEvents(data);

    const saved =
      localStorage.getItem(
        "guesten-active-event"
      );

    const exists = data.some(
      (event) => event.id === saved
    );

    setEventId(
      exists ? saved : data[0].id
    );
  }

  async function loadDrinks(id: string) {
    const { data } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (data) setDrinks(data);
  }

  function loadPeople(id: string) {
    const saved = localStorage.getItem(
      "guesten-people-" + id
    );

    if (!saved) {
      setPeople([]);
      return;
    }

    try {
      setPeople(JSON.parse(saved));
    } catch {
      setPeople([]);
    }
  }

  function loadPayments(id: string) {
    const saved = localStorage.getItem(
      "guesten-payments-" + id
    );

    if (!saved) {
      setPayments([]);
      return;
    }

    try {
      setPayments(JSON.parse(saved));
    } catch {
      setPayments([]);
    }
  }

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    if (!drinkName.trim()) {
      setMessage("❌ Bitte Getränk eingeben.");
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
      setMessage("❌ " + error.message);
      return;
    }

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    await loadDrinks(eventId);

    setMessage("✅ Getränk gespeichert.");
  }

  function addPerson() {
    const name = personName.trim();

    if (!name) return;

    if (
      people.some(
        (p) =>
          p.name.toLowerCase() ===
          name.toLowerCase()
      )
    ) {
      setMessage(
        "❌ Teilnehmer bereits vorhanden."
      );
      return;
    }

    setPeople([
      ...people,
      {
        id: Date.now(),
        name,
        drinks: 0,
        liters: 0,
        points: 0,
      },
    ]);

    setPersonName("");

    setMessage(
      "✅ Teilnehmer hinzugefügt."
    );
  }

  function removePerson(id: number) {
    setPeople(
      people.filter(
        (person) => person.id !== id
      )
    );

    setPayments(
      payments.filter(
        (payment) =>
          payment.personId !== id
      )
    );
  }

  function assignDrink(
    personId: number,
    drinkId: string
  ) {
    const drink = drinks.find(
      (d) => d.id === drinkId
    );

    if (!drink) return;

    const litersValue = Number(
      drink.liters ??
        drink.menge ??
        0
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
            person.liters +
            litersValue,
          points:
            person.points + 10,
        };
      })
    );

    setMessage(
      "🍺 Getränk zugeordnet! +10 Punkte"
    );
  }

  function addPayment() {
    if (!paymentPerson) {
      setMessage(
        "❌ Bitte Person auswählen."
      );
      return;
    }

    const amount =
      Number(paymentAmount);

    if (!amount || amount <= 0) {
      setMessage(
        "❌ Bitte Betrag eingeben."
      );
      return;
    }

    setPayments([
      ...payments,
      {
        id: Date.now(),
        personId:
          Number(paymentPerson),
        amount,
      },
    ]);

    setPaymentPerson("");
    setPaymentAmount("");

    setMessage(
      "✅ Zahlung gespeichert."
    );
  }

  function removePayment(id: number) {
    setPayments(
      payments.filter(
        (payment) =>
          payment.id !== id
      )
    );
  }

  const totalCost = drinks.reduce(
    (sum, drink) =>
      sum +
      Number(drink.preis ?? 0),
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

  const totalPaid = payments.reduce(
    (sum, payment) =>
      sum + payment.amount,
    0
  );

  const costPerPerson =
    people.length > 0
      ? totalCost / people.length
      : 0;

  const ranking = [...people].sort(
    (a, b) => b.points - a.points
  );

  const getPaid = (personId: number) =>
    payments
      .filter(
        (payment) =>
          payment.personId === personId
      )
      .reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

  const balances = people.map(
    (person) => {
      const paid = getPaid(person.id);

      return {
        ...person,
        paid,
        balance:
          paid - costPerPerson,
      };
    }
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
              placeholder="Name"
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

          {people.map((person) => (
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
                <b>{person.name}</b>

                <small>
                  🍺 {person.drinks}
                  {" · "}
                  💧{" "}
                  {person.liters.toFixed(1)}
                  L
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
          ))}

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
          ) : (
            people.map((person) => (
              <div
                className="assign"
                key={person.id}
              >

                <b>
                  {person.name}
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
                          drink.drink_name}
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

              <span>🍺</span>

              <div>
                <b>
                  {drink.getraenk ||
                    drink.drink_name}
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

        <section className="card payment">

          <h2>
            💳 Wer hat bezahlt?
          </h2>

          <div className="three">

            <select
              value={paymentPerson}
              onChange={(e) =>
                setPaymentPerson(
                  e.target.value
                )
              }
            >
              <option value="">
                Person auswählen
              </option>

              {people.map(
                (person) => (
                  <option
                    key={person.id}
                    value={person.id}
                  >
                    {person.name}
                  </option>
                )
              )}
            </select>

            <input
              type="number"
              step="0.01"
              placeholder="Betrag €"
              value={paymentAmount}
              onChange={(e) =>
                setPaymentAmount(
                  e.target.value
                )
              }
            />

            <button
              onClick={addPayment}
            >
              💶 Zahlung speichern
            </button>

          </div>

          {payments.map(
            (payment) => {
              const person =
                people.find(
                  (p) =>
                    p.id ===
                    payment.personId
                );

              return (
                <div
                  className="paymentRow"
                  key={payment.id}
                >
                  <span>
                    💳{" "}
                    {person?.name ||
                      "Unbekannt"}
                  </span>

                  <b>
                    {payment.amount.toFixed(
                      2
                    )} €
                  </b>

                  <button
                    className="delete"
                    onClick={() =>
                      removePayment(
                        payment.id
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              );
            }
          )}

        </section>

        <section className="card">

          <h2>
            💶 Kostenaufteilung
          </h2>

          <div className="money">
            {totalCost.toFixed(2)} €
          </div>

          <p className="center">
            Gesamtkosten
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
              💶 Anteil pro Person
            </span>

            <b>
              {costPerPerson.toFixed(
                2
              )} €
            </b>
          </div>

          <div className="costRow">
            <span>
              💳 Bereits bezahlt
            </span>

            <b>
              {totalPaid.toFixed(2)} €
            </b>
          </div>

          <h3>
            📊 Abrechnung
          </h3>

          {balances.map(
            (person) => (
              <div
                className="balance"
                key={person.id}
              >

                <div>
                  <b>
                    {person.name}
                  </b>

                  <small>
                    Bezahlt:{" "}
                    {person.paid.toFixed(
                      2
                    )} €
                  </small>
                </div>

                <strong
                  className={
                    person.balance >= 0
                      ? "plus"
                      : "minus"
                  }
                >
                  {person.balance >= 0
                    ? "+"
                    : ""}
                  {person.balance.toFixed(
                    2
                  )} €
                </strong>

              </div>
            )
          )}

        </section>

        <section className="card">

          <h2>
            🏆 Ranking
          </h2>

          {ranking.map(
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
                    🍺 {person.drinks}
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
            repeat(4,1fr);
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

        .person small,
        .drink small,
        .ranking small,
        .balance small {
          display: block;
          margin-top: 4px;
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

        .payment {
          border-color:
            rgba(245,158,11,.25);
        }

        .paymentRow {
          display: grid;
          grid-template-columns:
            1fr auto auto;
          gap: 10px;
          align-items: center;
          padding: 10px;
          background:
            rgba(255,255,255,.05);
          border-radius: 12px;
          margin-top: 8px;
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

        .balance {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px;
          margin-top: 8px;
          background:
            rgba(255,255,255,.05);
          border-radius: 12px;
        }

        .plus {
          color: #4ade80;
        }

        .minus {
          color: #fb7185;
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

        .ranking > strong {
          text-align: right;
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
