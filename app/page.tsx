"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  username: string | null;
  points: number | null;
  drinks_count: number | null;
};

type Member = {
  id: string;
  profile_id: string;
  username: string;
  points: number;
  drinks: number;
  liters: number;
};

type Drink = {
  id: string;
  event_id: string;
  drink_name: string | null;
  getraenk: string | null;
  liters: number | null;
  menge: number | null;
  alcohol_percent: number | null;
  alkohol: number | null;
  preis: number | null;
};

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [selectedProfile, setSelectedProfile] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEvents();
    loadProfiles();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guesten-active-event",
      eventId
    );

    loadMembers();
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
        "❌ Events konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    setEvents(data || []);

    if (!data || data.length === 0) {
      return;
    }

    const saved =
      localStorage.getItem(
        "guesten-active-event"
      );

    const savedExists = data.some(
      (event) => event.id === saved
    );

    if (saved && savedExists) {
      setEventId(saved);
    } else {
      setEventId(data[0].id);
    }
  }

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,username,points,drinks_count"
      )
      .order("username", {
        ascending: true,
      });

    if (error) {
      setMessage(
        "❌ Profile konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    setProfiles(data || []);
  }

  async function loadMembers() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("event_members")
      .select(
        `
          id,
          event_id,
          profile_id,
          joined_at,
          profiles (
            id,
            username,
            points,
            drinks_count
          )
        `
      )
      .eq("event_id", eventId);

    if (error) {
      setMessage(
        "❌ Teilnehmer konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    const result: Member[] = (data || []).map(
      (row: any) => {
        const profile = Array.isArray(
          row.profiles
        )
          ? row.profiles[0]
          : row.profiles;

        return {
          id: row.id,
          profile_id: row.profile_id,
          username:
            profile?.username ||
            "Teilnehmer",
          points: Number(
            profile?.points || 0
          ),
          drinks: Number(
            profile?.drinks_count || 0
          ),
          liters: 0,
        };
      }
    );

    setMembers(result);
  }

  async function loadDrinks() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drinks")
      .select(
        "id,event_id,drink_name,getraenk,liters,menge,alcohol_percent,alkohol,preis"
      )
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "❌ Getränke konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    setDrinks(data || []);
  }

  async function addParticipant() {
    setMessage("");

    if (!eventId) {
      setMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!selectedProfile) {
      setMessage(
        "❌ Bitte einen Teilnehmer auswählen."
      );
      return;
    }

    const alreadyMember = members.some(
      (member) =>
        member.profile_id ===
        selectedProfile
    );

    if (alreadyMember) {
      setMessage(
        "❌ Dieser Teilnehmer ist bereits dabei."
      );
      return;
    }

    const { error } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        profile_id: selectedProfile,
        joined_at: new Date().toISOString(),
      });

    if (error) {
      setMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message
      );
      return;
    }

    const profile = profiles.find(
      (p) => p.id === selectedProfile
    );

    setSelectedProfile("");

    setMessage(
      "✅ " +
        (profile?.username ||
          "Teilnehmer") +
        " wurde hinzugefügt."
    );

    await loadMembers();
  }

  async function removeParticipant(
    memberId: string
  ) {
    const { error } = await supabase
      .from("event_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      setMessage(
        "❌ Teilnehmer konnte nicht entfernt werden: " +
          error.message
      );
      return;
    }

    await loadMembers();

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
      .insert({
        event_id: eventId,
        drink_name: drinkName.trim(),
        getraenk: drinkName.trim(),
        liters: Number(liters),
        menge: Number(liters),
        alcohol_percent: Number(alcohol),
        alkohol: Number(alcohol),
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
    profileId: string,
    drinkId: string
  ) {
    const drink = drinks.find(
      (item) => item.id === drinkId
    );

    if (!drink) return;

    const member = members.find(
      (item) =>
        item.profile_id === profileId
    );

    if (!member) return;

    const newPoints =
      Number(member.points) + 10;

    const newDrinks =
      Number(member.drinks) + 1;

    const { error } = await supabase
      .from("profiles")
      .update({
        points: newPoints,
        drinks_count: newDrinks,
      })
      .eq("id", profileId);

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    await loadProfiles();
    await loadMembers();

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
      Number(drink.preis || 0),
    0
  );

  const totalPoints = members.reduce(
    (sum, member) =>
      sum + Number(member.points || 0),
    0
  );

  const ranking = [...members].sort(
    (a, b) =>
      Number(b.points) -
      Number(a.points)
  );

  const availableProfiles =
    profiles.filter(
      (profile) =>
        !members.some(
          (member) =>
            member.profile_id ===
            profile.id
        )
    );

  return (
    <main className="page">
      <div className="container">

        <header className="header">
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
              setEventId(
                e.target.value
              )
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

          <div className="stat">
            <span>🍺</span>
            <strong>
              {drinks.length}
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
              {members.length}
            </strong>
            <small>
              Teilnehmer
            </small>
          </div>

        </div>

        <section className="card">

          <h2>
            👥 Teilnehmer
          </h2>

          <p>
            Wer ist beim Event dabei?
          </p>

          {availableProfiles.length ===
          0 ? (

            <div className="empty">
              {profiles.length === 0
                ? "👤 Noch keine Profile vorhanden."
                : "✅ Alle vorhandenen Profile sind bereits dabei."}
            </div>

          ) : (

            <div className="addParticipant">

              <select
                value={selectedProfile}
                onChange={(e) =>
                  setSelectedProfile(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Teilnehmer auswählen
                </option>

                {availableProfiles.map(
                  (profile) => (
                    <option
                      key={profile.id}
                      value={profile.id}
                    >
                      {profile.username ||
                        "Unbenannt"}
                    </option>
                  )
                )}

              </select>

              <button
                onClick={
                  addParticipant
                }
              >
                ➕ Hinzufügen
              </button>

            </div>

          )}

          <div className="memberList">

            {members.length === 0 ? (

              <div className="empty">
                <div className="big">
                  👥
                </div>

                <b>
                  Noch keine Teilnehmer
                </b>

                <p>
                  Wähle oben einen Teilnehmer
                  aus.
                </p>
              </div>

            ) : (

              members.map((member) => (

                <div
                  className="member"
                  key={member.id}
                >

                  <div className="avatar">
                    {member.username
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="memberInfo">

                    <strong>
                      {member.username}
                    </strong>

                    <small>
                      🍺 {member.drinks}
                      {" · "}
                      🏆 {member.points}
                      {" Punkte"}
                    </small>

                  </div>

                  <button
                    className="remove"
                    onClick={() =>
                      removeParticipant(
                        member.id
                      )
                    }
                  >
                    ×
                  </button>

                </div>

              ))

            )}

          </div>

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

          {members.length === 0 ? (

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

            members.map((member) => (

              <div
                className="assign"
                key={member.id}
              >

                <strong>
                  👤 {member.username}
                </strong>

                <select
                  defaultValue=""
                  onChange={(e) => {

                    const value =
                      e.target.value;

                    if (!value) return;

                    assignDrink(
                      member.profile_id,
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

                        {drink.drink_name ||
                          drink.getraenk ||
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

              <div className="drinkIcon">
                🍺
              </div>

              <div>

                <strong>
                  {drink.drink_name ||
                    drink.getraenk ||
                    "Getränk"}
                </strong>

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

              <strong className="price">
                {Number(
                  drink.preis || 0
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

            <strong>
              {members.length}
            </strong>
          </div>

          <div className="row">
            <span>
              💶 Pro Person
            </span>

            <strong>
              {members.length
                ? (
                    totalCost /
                    members.length
                  ).toFixed(2)
                : "0.00"}{" "}
              €
            </strong>
          </div>

          <div className="row">
            <span>
              🏆 Gesamtpunkte
            </span>

            <strong>
              {totalPoints}
            </strong>
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
              (member, index) => (

                <div
                  className="ranking"
                  key={member.id}
                >

                  <span className="rank">
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : index + 1}
                  </span>

                  <div>

                    <strong>
                      {member.username}
                    </strong>

                    <small>
                      🍺 {member.drinks}
                    </small>

                  </div>

                  <div className="points">
                    {member.points}
                    <small>
                      Punkte
                    </small>
                  </div>

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
          <strong>
            🍻 Güstener Zapfhahn Zentrale
          </strong>

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
          padding: 16px;
          color: white;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          background:
            radial-gradient(
              circle at top,
              #29445d 0%,
              #0a0f16 62%
            );
        }

        .container {
          max-width: 850px;
          margin: auto;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 4px 25px;
        }

        .logo {
          font-size: 38px;
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
          margin: 0 0 8px;
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

        .stat {
          text-align: center;
          padding: 14px 5px;
          border-radius: 16px;
          background:
            rgba(255,255,255,.06);
        }

        .stat span {
          font-size: 22px;
          display: block;
        }

        .stat strong {
          display: block;
          font-size: 20px;
          margin-top: 4px;
        }

        input,
        select {
          width: 100%;
          padding: 13px;
          margin-bottom: 10px;
          border-radius: 12px;
          border:
            1px solid #344252;
          background: #121a23;
          color: white;
          font-size: 15px;
        }

        button {
          padding: 13px 17px;
          border: 0;
          border-radius: 12px;
          background: #f59e0b;
          color: #111;
          font-weight: bold;
          cursor: pointer;
        }

        .addParticipant {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 8px;
        }

        .member {
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
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #334155;
          font-weight: bold;
        }

        .remove {
          padding: 6px 11px;
          background: #303b48;
          color: white;
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

        .assign {
          display: grid;
          grid-template-columns:
            1fr 1.5fr;
          gap: 10px;
          align-items: center;
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

        .price {
          margin-left: auto;
        }

        .empty {
          text-align: center;
          padding: 20px;
          color: #94a3b8;
        }

        .big {
          font-size: 30px;
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

        .rank {
          font-size: 24px;
        }

        .points {
          text-align: right;
          font-weight: bold;
          font-size: 18px;
        }

        .points small {
          font-size: 12px;
          font-weight: normal;
        }

        .message {
          padding: 14px;
          margin-bottom: 15px;
          text-align: center;
          border-radius: 13px;
          background: #172535;
          color: #fbbf24;
        }

        footer {
          padding: 25px;
          text-align: center;
          color: #64748b;
        }

        @media(max-width:650px) {

          .stats {
            grid-template-columns:
              repeat(2,1fr);
          }

          .three {
            grid-template-columns: 1fr;
          }

          .addParticipant {
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
