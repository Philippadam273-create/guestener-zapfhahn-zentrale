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
  profile_id: string | null;
};

type Payment = {
  id: string;
  event_id: string;
  profile_id: string | null;
  bezahlt_von: string | null;
  betrag: number | null;
  status: "offen" | "bezahlt";
};

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [selectedProfile, setSelectedProfile] = useState("");
  const [message, setMessage] = useState("");

  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStart, setNewEventStart] = useState("");
  const [newEventEnd, setNewEventEnd] = useState("");

  useEffect(() => {
    loadEvents();
    loadProfiles();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem("guesten-active-event", eventId);

    loadMembers();
    loadDrinks();
    loadPayments();
  }, [eventId]);

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id,title,start_date,end_date,is_active")
      .order("start_date", { ascending: false });

    if (error) {
      setMessage("❌ Events: " + error.message);
      return;
    }

    setEvents(data || []);

    if (!data || data.length === 0) return;

    const saved = localStorage.getItem("guesten-active-event");

    const exists = data.some((event) => event.id === saved);

    setEventId(
      saved && exists
        ? saved
        : data[0].id
    );
  }

  async function createEvent() {
    setMessage("");

    if (!newEventTitle.trim()) {
      setMessage("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: newEventTitle.trim(),
        start_date: newEventStart
          ? new Date(newEventStart).toISOString()
          : new Date().toISOString(),
        end_date: newEventEnd
          ? new Date(newEventEnd).toISOString()
          : null,
        is_active: true,
      })
      .select("id,title,start_date,end_date,is_active")
      .single();

    if (error) {
      setMessage("❌ Event: " + error.message);
      return;
    }

    if (!data) {
      setMessage("❌ Event wurde nicht erstellt.");
      return;
    }

    setEvents((old) => [data, ...old]);
    setEventId(data.id);

    setNewEventTitle("");
    setNewEventStart("");
    setNewEventEnd("");
    setShowNewEvent(false);

    setMessage(
      `✅ Event „${data.title}“ wurde erstellt.`
    );
  }

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,points,drinks_count")
      .order("username", { ascending: true });

    if (error) {
      setMessage("❌ Profile: " + error.message);
      return;
    }

    setProfiles(data || []);
  }

  async function loadMembers() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("event_members")
      .select(`
        id,
        profile_id,
        profiles (
          id,
          username,
          points,
          drinks_count
        )
      `)
      .eq("event_id", eventId);

    if (error) {
      setMessage("❌ Teilnehmer: " + error.message);
      return;
    }

    const result: Member[] =
      (data || []).map((row: any) => {
        const profile = Array.isArray(row.profiles)
          ? row.profiles[0]
          : row.profiles;

        return {
          id: row.id,
          profile_id: row.profile_id,
          username: profile?.username || "Teilnehmer",
          points: Number(profile?.points || 0),
          drinks: Number(profile?.drinks_count || 0),
        };
      });

    setMembers(result);
  }

  async function loadDrinks() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drinks")
      .select(`
        id,
        event_id,
        drink_name,
        getraenk,
        liters,
        menge,
        alcohol_percent,
        alkohol,
        preis,
        profile_id
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("❌ Getränke: " + error.message);
      return;
    }

    setDrinks(data || []);
  }

  async function loadPayments() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("payments")
      .select(
        "id,event_id,profile_id,bezahlt_von,betrag,status"
      )
      .eq("event_id", eventId);

    if (error) {
      setMessage("❌ Zahlungen: " + error.message);
      return;
    }

    setPayments(data || []);
  }

  async function addParticipant() {
    setMessage("");

    if (!eventId) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    if (!selectedProfile) {
      setMessage("❌ Bitte Teilnehmer auswählen.");
      return;
    }

    if (
      members.some(
        (member) =>
          member.profile_id === selectedProfile
      )
    ) {
      setMessage("❌ Teilnehmer ist bereits dabei.");
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
      setMessage("❌ Teilnehmer: " + error.message);
      return;
    }

    setSelectedProfile("");

    await loadMembers();

    setMessage("✅ Teilnehmer hinzugefügt.");
  }

  async function removeParticipant(memberId: string) {
    const { error } = await supabase
      .from("event_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      setMessage("❌ Entfernen: " + error.message);
      return;
    }

    await loadMembers();

    setMessage("✅ Teilnehmer entfernt.");
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
      setMessage("❌ Getränk: " + error.message);
      return;
    }

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    await loadDrinks();

    setMessage("✅ Getränk gespeichert.");
  }

  async function assignDrink(
    profileId: string,
    drinkId: string
  ) {
    setMessage("⏳ Getränk wird zugeordnet...");

    const drink = drinks.find(
      (item) => item.id === drinkId
    );

    if (!drink) {
      setMessage("❌ Getränk nicht gefunden.");
      return;
    }

    if (drink.profile_id) {
      setMessage(
        "❌ Dieses Getränk ist bereits zugeordnet."
      );
      return;
    }

    const { error: drinkError } = await supabase
      .from("drinks")
      .update({
        profile_id: profileId,
      })
      .eq("id", drinkId);

    if (drinkError) {
      setMessage(
        "❌ Zuordnung: " +
        drinkError.message
      );
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("points,drinks_count")
      .eq("id", profileId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          points:
            Number(profile.points || 0) + 10,
          drinks_count:
            Number(profile.drinks_count || 0) + 1,
        })
        .eq("id", profileId);
    }

    await loadProfiles();
    await loadMembers();
    await loadDrinks();

    const member = members.find(
      (item) =>
        item.profile_id === profileId
    );

    setMessage(
      `🍺 Getränk zugeordnet! ${
        member?.username || "Teilnehmer"
      } +10 Punkte`
    );
  }

  async function togglePayment(member: Member) {
    setMessage("⏳ Zahlung wird gespeichert...");

    const existing = payments.find(
      (payment) =>
        payment.event_id === eventId &&
        payment.profile_id === member.profile_id
    );

    const newStatus =
      existing?.status === "bezahlt"
        ? "offen"
        : "bezahlt";

    if (existing) {
      const { error } = await supabase
        .from("payments")
        .update({
          status: newStatus,
          betrag: amountPerPerson,
          bezahlt_von: member.profile_id,
          profile_id: member.profile_id,
        })
        .eq("id", existing.id);

      if (error) {
        setMessage("❌ Zahlung: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("payments")
        .insert({
          event_id: eventId,
          profile_id: member.profile_id,
          bezahlt_von: member.profile_id,
          betrag: amountPerPerson,
          status: newStatus,
        });

      if (error) {
        setMessage("❌ Zahlung: " + error.message);
        return;
      }
    }

    await loadPayments();

    setMessage(
      newStatus === "bezahlt"
        ? `✅ ${member.username} hat bezahlt.`
        : `↩️ ${member.username} wieder auf offen gesetzt.`
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
      sum + Number(drink.preis || 0),
    0
  );

  const totalPoints = members.reduce(
    (sum, member) =>
      sum + Number(member.points || 0),
    0
  );

  const amountPerPerson =
    members.length > 0
      ? totalCost / members.length
      : 0;

  const ranking = [...members].sort(
    (a, b) =>
      Number(b.points) -
      Number(a.points)
  );

  const paidCount = members.filter(
    (member) =>
      payments.some(
        (payment) =>
          payment.event_id === eventId &&
          payment.profile_id ===
            member.profile_id &&
          payment.status === "bezahlt"
      )
  ).length;

  const openCount =
    members.length - paidCount;

  return (
    <main className="page">
      <div className="container">

        <header className="header">
          <div className="logo">🍻</div>

          <div>
            <h1>Güstener Zapfhahn Zentrale</h1>
            <p>
              Events · Getränke · Kosten · Rankings
            </p>
          </div>
        </header>

        <section className="card">
          <div className="eventHeader">
            <div>
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
            </div>

            <button
              className="newEventButton"
              onClick={() =>
                setShowNewEvent(!showNewEvent)
              }
            >
              ➕ Neues Event
            </button>
          </div>

          {showNewEvent && (
            <div className="newEventBox">
              <h3>➕ Neues Event erstellen</h3>

              <input
                placeholder="Name des Events"
                value={newEventTitle}
                onChange={(e) =>
                  setNewEventTitle(e.target.value)
                }
              />

              <label>Start</label>

              <input
                type="datetime-local"
                value={newEventStart}
                onChange={(e) =>
                  setNewEventStart(e.target.value)
                }
              />

              <label>Ende</label>

              <input
                type="datetime-local"
                value={newEventEnd}
                onChange={(e) =>
                  setNewEventEnd(e.target.value)
                }
              />

              <div className="newEventButtons">
                <button
                  className="save"
                  onClick={createEvent}
                >
                  ✅ Event erstellen
                </button>

                <button
                  className="cancel"
                  onClick={() =>
                    setShowNewEvent(false)
                  }
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="stats">
          <div className="stat">
            <span>🍺</span>
            <strong>{drinks.length}</strong>
            <small>Getränke</small>
          </div>

          <div className="stat">
            <span>💧</span>
            <strong>
              {totalLiters.toFixed(1)}
            </strong>
            <small>Liter</small>
          </div>

          <div className="stat">
            <span>💶</span>
            <strong>
              {totalCost.toFixed(2)} €
            </strong>
            <small>Kosten</small>
          </div>

          <div className="stat">
            <span>👥</span>
            <strong>{members.length}</strong>
            <small>Teilnehmer</small>
          </div>
        </div>

        <section className="card">
          <h2>👥 Teilnehmer</h2>
          <p>Wer ist beim Event dabei?</p>

          {profiles.filter(
            (profile) =>
              !members.some(
                (member) =>
                  member.profile_id === profile.id
              )
          ).length > 0 ? (
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

                {profiles
                  .filter(
                    (profile) =>
                      !members.some(
                        (member) =>
                          member.profile_id ===
                          profile.id
                      )
                  )
                  .map((profile) => (
                    <option
                      key={profile.id}
                      value={profile.id}
                    >
                      {profile.username ||
                        "Unbenannt"}
                    </option>
                  ))}
              </select>

              <button
                onClick={addParticipant}
              >
                ➕ Hinzufügen
              </button>
            </div>
          ) : (
            <div className="successBox">
              ✅ Alle vorhandenen Profile
              sind bereits dabei.
            </div>
          )}

          {members.map((member) => (
            <div
              className="member"
              key={member.id}
            >
              <div className="avatar">
                {member.username
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {member.username}
                </strong>

                <small>
                  🍺 {member.drinks}
                  {" · "}
                  🏆 {member.points} Punkte
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
          ))}
        </section>

        <section className="card">
          <h2>🍺 Getränk hinzufügen</h2>
          <p>Getränk für das Event erfassen</p>

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
              step="0.1"
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
              step="0.01"
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

        <section className="card">
          <h2>🔗 Getränk zuordnen</h2>

          {members.length === 0 ? (
            <p>
              👥 Zuerst Teilnehmer hinzufügen.
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
                    if (!e.target.value) return;

                    assignDrink(
                      member.profile_id,
                      e.target.value
                    );

                    e.target.value = "";
                  }}
                >
                  <option value="">
                    🍺 Getränk auswählen
                  </option>

                  {drinks.map((drink) => (
                    <option
                      key={drink.id}
                      value={drink.id}
                      disabled={
                        !!drink.profile_id
                      }
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
                      {drink.profile_id
                        ? " ✓"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </section>

        <section className="card">
          <h2>🍺 Getränke</h2>

          {drinks.map((drink) => {
            const member = members.find(
              (item) =>
                item.profile_id ===
                drink.profile_id
            );

            return (
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

                  {member && (
                    <small className="assigned">
                      👤 {member.username}
                    </small>
                  )}
                </div>

                <strong className="price">
                  {Number(
                    drink.preis || 0
                  ).toFixed(2)}
                  €
                </strong>
              </div>
            );
          })}
        </section>

        <section className="card">
          <h2>💶 Kostenaufteilung</h2>

          <div className="total">
            {totalCost.toFixed(2)} €
          </div>

          <p className="center">
            Gesamtkosten des Events
          </p>

          <div className="row">
            <span>👥 Teilnehmer</span>
            <strong>
              {members.length}
            </strong>
          </div>

          <div className="row">
            <span>💶 Pro Person</span>
            <strong>
              {amountPerPerson.toFixed(2)} €
            </strong>
          </div>

          <div className="paymentSummary">
            <div className="paymentBox paid">
              <span>✅</span>
              <strong>{paidCount}</strong>
              <small>Bezahlt</small>
            </div>

            <div className="paymentBox open">
              <span>⏳</span>
              <strong>{openCount}</strong>
              <small>Offen</small>
            </div>
          </div>

          <h3>💶 Zahlungen</h3>

          {members.map((member) => {
            const payment =
              payments.find(
                (item) =>
                  item.event_id === eventId &&
                  item.profile_id ===
                    member.profile_id
              );

            const isPaid =
              payment?.status === "bezahlt";

            return (
              <div
                className={
                  isPaid
                    ? "paymentPerson paidRow"
                    : "paymentPerson"
                }
                key={member.id}
              >
                <div className="paymentAvatar">
                  {member.username
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="paymentInfo">
                  <strong>
                    {member.username}
                  </strong>

                  <small>
                    Anteil:{" "}
                    {amountPerPerson.toFixed(2)} €
                  </small>
                </div>

                <button
                  className={
                    isPaid
                      ? "paidButton"
                      : "openButton"
                  }
                  onClick={() =>
                    togglePayment(member)
                  }
                >
                  {isPaid
                    ? "✅ Bezahlt"
                    : "⏳ Offen"}
                </button>
              </div>
            );
          })}
        </section>

        <section className="card">
          <h2>🏆 Ranking</h2>

          {ranking.map(
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
                  <small>Punkte</small>
                </div>
              </div>
            )
          )}

          <div className="rankingTotal">
            🏆 Gesamtpunkte: {totalPoints}
          </div>
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
          font-family: Arial, Helvetica, sans-serif;
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
          background: rgba(255,255,255,.07);
        }

        h1 {
          margin: 0;
          font-size: 25px;
        }

        h2 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        h3 {
          margin: 20px 0 10px;
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
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.08);
        }

        .eventHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .eventHeader > div {
          flex: 1;
        }

        .newEventButton {
          white-space: nowrap;
          background: #22c55e;
          color: white;
        }

        .newEventBox {
          margin-top: 15px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(0,0,0,.18);
          border: 1px solid rgba(255,255,255,.08);
        }

        .newEventBox label {
          display: block;
          margin: 8px 0 5px;
          color: #94a3b8;
          font-size: 13px;
        }

        .newEventButtons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
        }

        .cancel {
          background: #475569;
          color: white;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          text-align: center;
          padding: 14px 5px;
          border-radius: 16px;
          background: rgba(255,255,255,.06);
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
          border: 1px solid #344252;
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
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .member {
          display: grid;
          grid-template-columns: 40px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 11px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .avatar,
        .paymentAvatar {
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
          grid-template-columns: repeat(3,1fr);
          gap: 8px;
        }

        .save {
          width: 100%;
          background: #f59e0b;
          color: #111;
        }

        .assign {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 12px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .drink {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .drinkIcon {
          font-size: 25px;
        }

        .price {
          margin-left: auto;
        }

        .assigned {
          color: #4ade80;
        }

        .successBox {
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 12px;
          background: rgba(34,197,94,.10);
          color: #4ade80;
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
          background: rgba(255,255,255,.05);
        }

        .paymentSummary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 15px;
        }

        .paymentBox {
          text-align: center;
          padding: 15px;
          border-radius: 15px;
          background: rgba(255,255,255,.05);
        }

        .paymentBox span {
          display: block;
          font-size: 24px;
        }

        .paymentBox strong {
          display: block;
          font-size: 25px;
          margin-top: 4px;
        }

        .paymentBox.paid {
          border: 1px solid rgba(34,197,94,.35);
        }

        .paymentBox.open {
          border: 1px solid rgba(245,158,11,.35);
        }

        .paymentPerson {
          display: grid;
          grid-template-columns: 40px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 12px;
          margin-top: 8px;
          border-radius: 15px;
          background: rgba(255,255,255,.05);
          border: 1px solid transparent;
        }

        .paidRow {
          border-color: rgba(34,197,94,.4);
          background: rgba(34,197,94,.08);
        }

        .paymentInfo {
          min-width: 0;
        }

        .paidButton {
          background: #22c55e;
          color: white;
        }

        .openButton {
          background: #f59e0b;
          color: #111;
        }

        .ranking {
          display: grid;
          grid-template-columns: 45px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
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

        .rankingTotal {
          margin-top: 15px;
          padding: 14px;
          text-align: center;
          border-radius: 14px;
          background: rgba(245,158,11,.10);
          color: #fbbf24;
          font-weight: bold;
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
          .eventHeader {
            display: block;
          }

          .newEventButton {
            width: 100%;
            margin-top: 5px;
          }

          .stats {
            grid-template-columns: repeat(2,1fr);
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

          .paymentPerson {
            grid-template-columns: 40px 1fr;
          }

          .paymentPerson button {
            grid-column: 1 / -1;
            width: 100%;
          }

          .newEventButtons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
