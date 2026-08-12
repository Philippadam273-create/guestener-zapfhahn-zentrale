"use client";

import { useEffect, useMemo, useState } from "react";
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

type Event = {
  id: string;
  title: string;
  invite_code: string | null;
};

type Tab =
  | "home"
  | "drinks"
  | "members"
  | "money"
  | "ranking";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
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
  const [joinCode, setJoinCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const [loading, setLoading] = useState(false);

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
    loadInviteCode();
  }, [eventId]);

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id,title,invite_code")
      .order("start_date", { ascending: false });

    if (error) {
      setMessage("❌ Events: " + error.message);
      return;
    }

    const result = (data || []) as Event[];

    setEvents(result);

    if (result.length === 0) return;

    const saved = localStorage.getItem("guesten-active-event");
    const exists = result.some((event) => event.id === saved);

    setEventId(saved && exists ? saved : result[0].id);
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

    const result: Member[] = (data || []).map((row: any) => {
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

  async function loadInviteCode() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("events")
      .select("invite_code")
      .eq("id", eventId)
      .single();

    if (error) {
      setMessage("❌ Einladungscode: " + error.message);
      return;
    }

    setInviteCode(data?.invite_code || "");
  }

  async function createInviteCode() {
    if (!eventId) return;

    setLoading(true);

    const code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const { error } = await supabase
      .from("events")
      .update({ invite_code: code })
      .eq("id", eventId);

    setLoading(false);

    if (error) {
      setMessage("❌ Code: " + error.message);
      return;
    }

    setInviteCode(code);
    setMessage("✅ Einladungscode erstellt.");
    await loadEvents();
  }

  async function copyInviteCode() {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setMessage("✅ Einladungscode kopiert.");
    } catch {
      setMessage("ℹ️ Code: " + inviteCode);
    }
  }

  async function joinEventWithCode() {
    setMessage("");

    const code = joinCode.trim().toUpperCase();

    if (!code) {
      setMessage("❌ Bitte Einladungscode eingeben.");
      return;
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id,title,invite_code")
      .eq("invite_code", code)
      .single();

    if (eventError || !event) {
      setMessage("❌ Einladungscode ist ungültig.");
      return;
    }

    const profile = profiles[0];

    if (!profile) {
      setMessage("❌ Kein Profil vorhanden.");
      return;
    }

    const { data: existing } = await supabase
      .from("event_members")
      .select("id")
      .eq("event_id", event.id)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (existing) {
      setEventId(event.id);
      setJoinCode("");
      setMessage("ℹ️ Du bist bereits Teilnehmer dieses Events.");
      return;
    }

    const { error: joinError } = await supabase
      .from("event_members")
      .insert({
        event_id: event.id,
        profile_id: profile.id,
        joined_at: new Date().toISOString(),
        joined_via_code: code,
      });

    if (joinError) {
      setMessage("❌ Beitreten: " + joinError.message);
      return;
    }

    setEventId(event.id);
    setJoinCode("");
    setActiveTab("home");

    await loadMembers();

    setMessage(
      `✅ Du bist dem Event „${event.title}“ beigetreten.`
    );
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
        (member) => member.profile_id === selectedProfile
      )
    ) {
      setMessage("❌ Teilnehmer ist bereits dabei.");
      return;
    }

    const { error: participantError } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        profile_id: selectedProfile,
        joined_at: new Date().toISOString(),
      });

    if (participantError) {
      setMessage("❌ Teilnehmer: " + participantError.message);
      return;
    }

    setSelectedProfile("");

    await loadMembers();

    setMessage("✅ Teilnehmer hinzugefügt.");
  }

  async function removeParticipant(memberId: string) {
    const { error: removeError } = await supabase
      .from("event_members")
      .delete()
      .eq("id", memberId);

    if (removeError) {
      setMessage("❌ Entfernen: " + removeError.message);
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

    const { error: drinkError } = await supabase
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

    if (drinkError) {
      setMessage("❌ Getränk: " + drinkError.message);
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
      setMessage("❌ Dieses Getränk ist bereits zugeordnet.");
      return;
    }

    const { error: assignmentError } = await supabase
      .from("drinks")
      .update({ profile_id: profileId })
      .eq("id", drinkId);

    if (assignmentError) {
      setMessage("❌ Zuordnung: " + assignmentError.message);
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
          points: Number(profile.points || 0) + 10,
          drinks_count:
            Number(profile.drinks_count || 0) + 1,
        })
        .eq("id", profileId);
    }

    await loadProfiles();
    await loadMembers();
    await loadDrinks();

    const member = members.find(
      (item) => item.profile_id === profileId
    );

    setMessage(
      `🍺 Getränk zugeordnet! ${
        member?.username || "Teilnehmer"
      } +10 Punkte`
    );
  }

  async function togglePayment(member: Member) {
    setMessage("⏳ Zahlung wird gespeichert...");

    const totalCost = drinks.reduce(
      (sum, drink) =>
        sum + Number(drink.preis || 0),
      0
    );

    const amount =
      members.length > 0
        ? totalCost / members.length
        : 0;

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
      const { error: paymentUpdateError } =
        await supabase
          .from("payments")
          .update({
            status: newStatus,
            betrag: amount,
            bezahlt_von: member.profile_id,
            profile_id: member.profile_id,
          })
          .eq("id", existing.id);

      if (paymentUpdateError) {
        setMessage(
          "❌ Zahlung: " +
            paymentUpdateError.message
        );
        return;
      }
    } else {
      const { error: paymentInsertError } =
        await supabase
          .from("payments")
          .insert({
            event_id: eventId,
            profile_id: member.profile_id,
            bezahlt_von: member.profile_id,
            betrag: amount,
            status: newStatus,
          });

      if (paymentInsertError) {
        setMessage(
          "❌ Zahlung: " +
            paymentInsertError.message
        );
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

  const totalLiters = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(
            drink.liters ??
              drink.menge ??
              0
          ),
        0
      ),
    [drinks]
  );

  const totalCost = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum + Number(drink.preis || 0),
        0
      ),
    [drinks]
  );

  const totalPoints = useMemo(
    () =>
      members.reduce(
        (sum, member) =>
          sum + Number(member.points || 0),
        0
      ),
    [members]
  );

  const amountPerPerson =
    members.length > 0
      ? totalCost / members.length
      : 0;

  const ranking = useMemo(
    () =>
      [...members].sort(
        (a, b) =>
          Number(b.points) -
          Number(a.points)
      ),
    [members]
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

  const currentEvent = events.find(
    (event) => event.id === eventId
  );

  const availableProfiles = profiles.filter(
    (profile) =>
      !members.some(
        (member) =>
          member.profile_id === profile.id
      )
  );

  function goTo(tab: Tab) {
    setActiveTab(tab);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="page">
      <div className="container">

        <header className="header">
          <div className="logo">🍻</div>

          <div className="headerText">
            <h1>Güstener Zapfhahn Zentrale</h1>
            <p>
              Dein Event. Deine Getränke. Deine Runde.
            </p>
          </div>
        </header>

        <section className="eventBar">

          <div>
            <span className="eventLabel">
              AKTUELLES EVENT
            </span>

            <strong>
              {currentEvent?.title ||
                "Kein Event ausgewählt"}
            </strong>
          </div>

          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setActiveTab("home");
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

        <nav className="navigation">

          <button
            className={
              activeTab === "home"
                ? "navButton active"
                : "navButton"
            }
            onClick={() => goTo("home")}
          >
            <span>🏠</span>
            <small>Übersicht</small>
          </button>

          <button
            className={
              activeTab === "drinks"
                ? "navButton active"
                : "navButton"
            }
            onClick={() => goTo("drinks")}
          >
            <span>🍺</span>
            <small>Getränke</small>
          </button>

          <button
            className={
              activeTab === "members"
                ? "navButton active"
                : "navButton"
            }
            onClick={() => goTo("members")}
          >
            <span>👥</span>
            <small>Teilnehmer</small>
          </button>

          <button
            className={
              activeTab === "money"
                ? "navButton active"
                : "navButton"
            }
            onClick={() => goTo("money")}
          >
            <span>💶</span>
            <small>Kosten</small>
          </button>

          <button
            className={
              activeTab === "ranking"
                ? "navButton active"
                : "navButton"
            }
            onClick={() => goTo("ranking")}
          >
            <span>🏆</span>
            <small>Ranking</small>
          </button>

        </nav>

        {activeTab === "home" && (
          <>
            <section className="heroCard">

              <div>
                <span className="heroSmall">
                  🍻 WILLKOMMEN
                </span>

                <h2>
                  {currentEvent?.title ||
                    "Dein Event"}
                </h2>

                <p>
                  Behalte Getränke, Teilnehmer,
                  Kosten und Punkte im Blick.
                </p>
              </div>

              <div className="heroBeer">
                🍺
              </div>

            </section>

            <div className="stats">

              <div className="stat">
                <span>🍺</span>
                <strong>
                  {drinks.length}
                </strong>
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
                <strong>
                  {members.length}
                </strong>
                <small>Teilnehmer</small>
              </div>

            </div>

            <section className="card">

              <h2>🔗 Freunde einladen</h2>

              <p>
                Teile den Einladungscode mit
                deinen Freunden.
              </p>

              <div className="codeRow">

                <strong>
                  {inviteCode || "------"}
                </strong>

                <button
                  onClick={copyInviteCode}
                >
                  📋 Kopieren
                </button>

              </div>

              <button
                className="secondaryButton"
                onClick={createInviteCode}
                disabled={loading}
              >
                🔄 Neuen Code erstellen
              </button>

            </section>

            <section className="card">

              <h2>🚀 Event beitreten</h2>

              <p>
                Gib einen Einladungscode ein.
              </p>

              <div className="joinBox">

                <input
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="z.B. A7K9P2"
                  maxLength={6}
                />

                <button
                  onClick={joinEventWithCode}
                >
                  Event beitreten
                </button>

              </div>

            </section>

            <section className="quickGrid">

              <button
                onClick={() => goTo("drinks")}
              >
                <span>🍺</span>
                <strong>Getränke</strong>
                <small>
                  Getränke verwalten
                </small>
              </button>

              <button
                onClick={() => goTo("members")}
              >
                <span>👥</span>
                <strong>Teilnehmer</strong>
                <small>
                  Teilnehmer verwalten
                </small>
              </button>

              <button
                onClick={() => goTo("money")}
              >
                <span>💶</span>
                <strong>Kosten</strong>
                <small>
                  Zahlungen verwalten
                </small>
              </button>

              <button
                onClick={() => goTo("ranking")}
              >
                <span>🏆</span>
                <strong>Ranking</strong>
                <small>
                  Punkte ansehen
                </small>
              </button>

            </section>
          </>
        )}

        {activeTab === "members" && (
          <section className="card">

            <h2>👥 Teilnehmer</h2>

            <p>
              Wer ist beim Event dabei?
            </p>

            {availableProfiles.length > 0 ? (
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
        )}

        {activeTab === "drinks" && (
          <>
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
                  step="0.1"
                  value={liters}
                  placeholder="Liter"
                  onChange={(e) =>
                    setLiters(e.target.value)
                  }
                />

                <input
                  type="number"
                  value={alcohol}
                  placeholder="% Alkohol"
                  onChange={(e) =>
                    setAlcohol(e.target.value)
                  }
                />

                <input
                  type="number"
                  step="0.01"
                  value={price}
                  placeholder="Preis"
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
                        const selected =
                          e.target.value;

                        if (!selected) return;

                        assignDrink(
                          member.profile_id,
                          selected
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

              {drinks.length === 0 ? (
                <div className="empty">
                  🍺 Noch keine Getränke.
                </div>
              ) : (
                drinks.map((drink) => {

                  const member =
                    members.find(
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

                      <div className="drinkInfo">

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
                })
              )}

            </section>
          </>
        )}

        {activeTab === "money" && (
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
        )}

        {activeTab === "ranking" && (
          <section className="card">

            <h2>🏆 Ranking</h2>

            <p>
              Wer hat beim Event die meisten Punkte?
            </p>

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
                      <small>Punkte</small>
                    </div>

                  </div>
                )
              )
            )}

            <div className="totalPoints">
              🏆 Gesamtpunkte: {totalPoints}
            </div>

          </section>
        )}

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
            Dein Event. Deine Getränke. Deine Runde.
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
          padding-bottom: 30px;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 4px 18px;
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
          line-height: 1.5;
        }

        small {
          display: block;
          color: #94a3b8;
          margin-top: 5px;
        }

        .eventBar {
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 15px;
          align-items: center;
          padding: 15px;
          margin-bottom: 12px;
          border-radius: 18px;
          background: rgba(245,158,11,.08);
          border: 1px solid rgba(245,158,11,.2);
        }

        .eventBar strong {
          display: block;
          font-size: 17px;
          margin-top: 3px;
        }

        .eventBar select {
          margin: 0;
        }

        .eventLabel {
          font-size: 10px;
          color: #fbbf24;
          font-weight: bold;
          letter-spacing: 1.5px;
        }

        .navigation {
          position: sticky;
          top: 8px;
          z-index: 20;
          display: grid;
          grid-template-columns: repeat(5,1fr);
          gap: 6px;
          padding: 7px;
          margin-bottom: 15px;
          border-radius: 18px;
          background: rgba(15,23,42,.94);
          border: 1px solid rgba(255,255,255,.1);
          backdrop-filter: blur(15px);
        }

        .navButton {
          padding: 9px 4px;
          border-radius: 13px;
          background: transparent;
          color: #94a3b8;
        }

        .navButton span {
          display: block;
          font-size: 20px;
        }

        .navButton small {
          margin-top: 3px;
          font-size: 10px;
          color: inherit;
        }

        .navButton.active {
          background: #f59e0b;
          color: #111;
        }

        .navButton.active small {
          color: #111;
        }

        .heroCard {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px;
          margin-bottom: 15px;
          border-radius: 22px;
          background:
            linear-gradient(
              135deg,
              rgba(245,158,11,.18),
              rgba(255,255,255,.05)
            );
          border: 1px solid rgba(245,158,11,.2);
        }

        .heroCard h2 {
          font-size: 27px;
          margin-top: 5px;
        }

        .heroCard p {
          margin-bottom: 0;
        }

        .heroSmall {
          color: #fbbf24;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .heroBeer {
          font-size: 65px;
          padding: 12px;
        }

        .card {
          padding: 18px;
          margin-bottom: 15px;
          border-radius: 20px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.08);
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

        button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .codeRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .codeRow strong {
          padding: 14px;
          border-radius: 12px;
          text-align: center;
          font-size: 26px;
          letter-spacing: 6px;
          background: #111923;
          color: #fbbf24;
        }

        .secondaryButton {
          margin-top: 10px;
          background: #334155;
          color: white;
        }

        .joinBox {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .joinBox input {
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 3px;
        }

        .quickGrid {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .quickGrid button {
          text-align: left;
          padding: 18px;
          background: rgba(255,255,255,.06);
          color: white;
          border: 1px solid rgba(255,255,255,.08);
        }

        .quickGrid span {
          display: block;
          font-size: 27px;
          margin-bottom: 8px;
        }

        .quickGrid strong {
          display: block;
        }

        .quickGrid small {
          color: #94a3b8;
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

        .drinkInfo {
          min-width: 0;
        }

        .price {
          margin-left: auto;
          white-space: nowrap;
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

        .empty {
          padding: 20px;
          text-align: center;
          border-radius: 14px;
          background: rgba(255,255,255,.04);
          color: #94a3b8;
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

        .totalPoints {
          margin-top: 15px;
          padding: 15px;
          text-align: center;
          border-radius: 14px;
          background: rgba(245,158,11,.1);
          color: #fbbf24;
          font-weight: bold;
        }

        .message {
          position: fixed;
          left: 50%;
          bottom: 20px;
          transform: translateX(-50%);
          z-index: 100;
          width: min(90%, 600px);
          padding: 14px;
          text-align: center;
          border-radius: 13px;
          background: #172535;
          color: #fbbf24;
          border: 1px solid rgba(245,158,11,.3);
          box-shadow: 0 10px 40px rgba(0,0,0,.4);
        }

        footer {
          padding: 25px;
          text-align: center;
          color: #64748b;
        }

        footer strong {
          display: block;
        }

        @media(max-width:650px) {

          .page {
            padding: 10px;
          }

          h1 {
            font-size: 20px;
          }

          .eventBar {
            grid-template-columns: 1fr;
          }

          .navigation {
            gap: 3px;
          }

          .navButton {
            padding: 8px 2px;
          }

          .navButton span {
            font-size: 18px;
          }

          .navButton small {
            font-size: 9px;
          }

          .stats {
            grid-template-columns: repeat(2,1fr);
          }

          .heroCard {
            padding: 18px;
          }

          .heroBeer {
            font-size: 45px;
          }

          .quickGrid {
            grid-template-columns: 1fr 1fr;
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

          .joinBox {
            grid-template-columns: 1fr;
          }

          .codeRow {
            grid-template-columns: 1fr;
          }

          .codeRow strong {
            font-size: 22px;
          }

          .drink {
            align-items: flex-start;
          }

          .price {
            font-size: 14px;
          }

        }

      `}</style>
    </main>
  );
}
