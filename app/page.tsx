"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  username: string | null;
  points: number | null;
  drinks_count: number | null;
  gewicht_kg: number | null;
  alter: number | null;
  geschlecht: string | null;
};

type Event = {
  id: string;
  title: string;
  invite_code: string | null;
};

type Member = {
  id: string;
  profile_id: string;
  username: string;
  points: number;
  drinks: number;
  gewicht_kg: number;
  alter: number;
  geschlecht: string;
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

type Consumption = {
  id: string;
  event_id: string;
  profile_id: string;
  drink_id: string;
  consumed_at: string;
  points: number;
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
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [selectedProfile, setSelectedProfile] = useState("");
  const [selectedDrink, setSelectedDrink] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  /*
   * =========================================================
   * START
   * =========================================================
   */

  useEffect(() => {
    loadEvents();
    loadProfiles();

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guesten-active-event",
      eventId
    );

    loadEventData();
  }, [eventId]);

  async function loadEventData() {
    await Promise.all([
      loadMembers(),
      loadDrinks(),
      loadConsumptions(),
      loadPayments(),
      loadInviteCode(),
    ]);
  }

  /*
   * =========================================================
   * EVENTS
   * =========================================================
   */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id,title,invite_code")
      .order("start_date", {
        ascending: false,
      });

    if (error) {
      setMessage("❌ Events: " + error.message);
      return;
    }

    const eventList = data || [];

    setEvents(eventList);

    if (!eventList.length) return;

    const saved = localStorage.getItem(
      "guesten-active-event"
    );

    const exists = eventList.some(
      (event) => event.id === saved
    );

    setEventId(
      saved && exists
        ? saved
        : eventList[0].id
    );
  }

  /*
   * =========================================================
   * PROFILES
   * =========================================================
   */

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,username,points,drinks_count,gewicht_kg,alter,geschlecht"
      )
      .order("username", {
        ascending: true,
      });

    if (error) {
      setMessage("❌ Profile: " + error.message);
      return;
    }

    setProfiles(data || []);
  }

  /*
   * =========================================================
   * MEMBERS
   * =========================================================
   */

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
          drinks_count,
          gewicht_kg,
          alter,
          geschlecht
        )
      `)
      .eq("event_id", eventId);

    if (error) {
      setMessage(
        "❌ Teilnehmer: " + error.message
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
          gewicht_kg: Number(
            profile?.gewicht_kg || 0
          ),
          alter: Number(
            profile?.alter || 0
          ),
          geschlecht:
            profile?.geschlecht ||
            "",
        };
      }
    );

    setMembers(result);
  }

  /*
   * =========================================================
   * DRINKS
   * =========================================================
   */

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
        preis
      `)
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "❌ Getränke: " + error.message
      );
      return;
    }

    setDrinks(data || []);
  }

  /*
   * =========================================================
   * CONSUMPTIONS
   * =========================================================
   */

  async function loadConsumptions() {
    if (!eventId) return;

    const { data, error } =
      await supabase
        .from("drink_consumptions")
        .select(
          "id,event_id,profile_id,drink_id,consumed_at,points"
        )
        .eq("event_id", eventId)
        .order("consumed_at", {
          ascending: false,
        });

    if (error) {
      setMessage(
        "❌ Trinkvorgänge: " +
          error.message
      );
      return;
    }

    setConsumptions(data || []);
  }

  /*
   * =========================================================
   * PAYMENTS
   * =========================================================
   */

  async function loadPayments() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("payments")
      .select(
        "id,event_id,profile_id,bezahlt_von,betrag,status"
      )
      .eq("event_id", eventId);

    if (error) {
      setMessage(
        "❌ Zahlungen: " + error.message
      );
      return;
    }

    setPayments(data || []);
  }

  /*
   * =========================================================
   * INVITE
   * =========================================================
   */

  async function loadInviteCode() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("events")
      .select("invite_code")
      .eq("id", eventId)
      .single();

    if (error) return;

    setInviteCode(
      data?.invite_code || ""
    );
  }

  async function createInviteCode() {
    if (!eventId) return;

    const code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const { error } = await supabase
      .from("events")
      .update({
        invite_code: code,
      })
      .eq("id", eventId);

    if (error) {
      setMessage(
        "❌ Code: " + error.message
      );
      return;
    }

    setInviteCode(code);
    setMessage(
      "✅ Einladungscode erstellt."
    );

    await loadEvents();
  }

  async function copyInviteCode() {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(
        inviteCode
      );

      setMessage(
        "✅ Einladungscode kopiert."
      );
    } catch {
      setMessage(
        "ℹ️ Code: " + inviteCode
      );
    }
  }

  /*
   * =========================================================
   * EVENT BEITRETEN
   * =========================================================
   */

  async function joinEventWithCode() {
    setMessage("");

    const code =
      joinCode.trim().toUpperCase();

    if (!code) {
      setMessage(
        "❌ Bitte Einladungscode eingeben."
      );
      return;
    }

    const { data: event } =
      await supabase
        .from("events")
        .select(
          "id,title,invite_code"
        )
        .eq("invite_code", code)
        .maybeSingle();

    if (!event) {
      setMessage(
        "❌ Einladungscode ist ungültig."
      );
      return;
    }

    const profile = profiles[0];

    if (!profile) {
      setMessage(
        "❌ Kein Profil vorhanden."
      );
      return;
    }

    const { data: existing } =
      await supabase
        .from("event_members")
        .select("id")
        .eq("event_id", event.id)
        .eq(
          "profile_id",
          profile.id
        )
        .maybeSingle();

    if (!existing) {
      const { error } =
        await supabase
          .from("event_members")
          .insert({
            event_id: event.id,
            profile_id: profile.id,
            joined_at:
              new Date().toISOString(),
            joined_via_code: code,
          });

      if (error) {
        setMessage(
          "❌ Beitreten: " +
            error.message
        );
        return;
      }
    }

    setEventId(event.id);
    setJoinCode("");

    setMessage(
      `✅ Du bist dem Event „${event.title}“ beigetreten.`
    );
  }

  /*
   * =========================================================
   * PARTICIPANTS
   * =========================================================
   */

  async function addParticipant() {
    setMessage("");

    if (!eventId) {
      setMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    if (!selectedProfile) {
      setMessage(
        "❌ Bitte Teilnehmer auswählen."
      );
      return;
    }

    if (
      members.some(
        (member) =>
          member.profile_id ===
          selectedProfile
      )
    ) {
      setMessage(
        "❌ Teilnehmer ist bereits dabei."
      );
      return;
    }

    const { error } =
      await supabase
        .from("event_members")
        .insert({
          event_id: eventId,
          profile_id: selectedProfile,
          joined_at:
            new Date().toISOString(),
        });

    if (error) {
      setMessage(
        "❌ Teilnehmer: " +
          error.message
      );
      return;
    }

    setSelectedProfile("");

    await loadMembers();

    setMessage(
      "✅ Teilnehmer hinzugefügt."
    );
  }

  async function removeParticipant(
    memberId: string
  ) {
    const { error } =
      await supabase
        .from("event_members")
        .delete()
        .eq("id", memberId);

    if (error) {
      setMessage(
        "❌ Entfernen: " +
          error.message
      );
      return;
    }

    await loadMembers();

    setMessage(
      "✅ Teilnehmer entfernt."
    );
  }

  /*
   * =========================================================
   * DRINK ANLEGEN
   * =========================================================
   */

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    if (!drinkName.trim()) {
      setMessage(
        "❌ Bitte Getränk eingeben."
      );
      return;
    }

    const { error } =
      await supabase
        .from("drinks")
        .insert({
          event_id: eventId,
          drink_name:
            drinkName.trim(),
          getraenk:
            drinkName.trim(),
          liters: Number(liters),
          menge: Number(liters),
          alcohol_percent:
            Number(alcohol),
          alkohol: Number(alcohol),
          preis: Number(price),
          quantity: 1,
        });

    if (error) {
      setMessage(
        "❌ Getränk: " +
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

  /*
   * =========================================================
   * GETRÄNK LÖSCHEN
   * =========================================================
   */

  async function deleteDrink(
    drinkId: string
  ) {
    const used =
      consumptions.some(
        (item) =>
          item.drink_id === drinkId
      );

    if (used) {
      setMessage(
        "❌ Dieses Getränk wurde bereits getrunken und kann erst nach dem Entfernen der Trinkvorgänge gelöscht werden."
      );
      return;
    }

    const drink = drinks.find(
      (item) => item.id === drinkId
    );

    if (!drink) return;

    const confirmed =
      window.confirm(
        `„${
          drink.drink_name ||
          drink.getraenk ||
          "Getränk"
        }“ wirklich löschen?`
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("drinks")
        .delete()
        .eq("id", drinkId);

    if (error) {
      setMessage(
        "❌ Löschen: " +
          error.message
      );
      return;
    }

    await loadDrinks();

    setMessage(
      "🗑️ Getränk gelöscht."
    );
  }

  /*
   * =========================================================
   * GETRÄNK TRINKEN
   * =========================================================
   */

  async function drinkForPerson(
    profileId: string,
    drinkId: string
  ) {
    setMessage(
      "⏳ Getränk wird gespeichert..."
    );

    if (!eventId) return;

    const drink = drinks.find(
      (item) => item.id === drinkId
    );

    if (!drink) {
      setMessage(
        "❌ Getränk nicht gefunden."
      );
      return;
    }

    const { error } =
      await supabase
        .from("drink_consumptions")
        .insert({
          event_id: eventId,
          profile_id: profileId,
          drink_id: drinkId,
          consumed_at:
            new Date().toISOString(),
          points: 10,
        });

    if (error) {
      setMessage(
        "❌ Trinkvorgang: " +
          error.message
      );
      return;
    }

    const profile =
      profiles.find(
        (item) =>
          item.id === profileId
      );

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          points:
            Number(
              profile.points || 0
            ) + 10,
          drinks_count:
            Number(
              profile.drinks_count ||
                0
            ) + 1,
        })
        .eq(
          "id",
          profileId
        );
    }

    await Promise.all([
      loadProfiles(),
      loadMembers(),
      loadConsumptions(),
    ]);

    const member =
      members.find(
        (item) =>
          item.profile_id ===
          profileId
      );

    setMessage(
      `🍺 ${member?.username || "Teilnehmer"} hat ${
        drink.drink_name ||
        drink.getraenk ||
        "ein Getränk"
      } getrunken. +10 Punkte`
    );
  }

  /*
   * =========================================================
   * EIGENES GETRÄNK LÖSCHEN
   * =========================================================
   */

  async function deleteConsumption(
    consumptionId: string
  ) {
    const consumption =
      consumptions.find(
        (item) =>
          item.id ===
          consumptionId
      );

    if (!consumption) return;

    const profile =
      profiles.find(
        (item) =>
          item.id ===
          consumption.profile_id
      );

    const confirmed =
      window.confirm(
        "Diesen eigenen Trinkvorgang wirklich entfernen?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("drink_consumptions")
        .delete()
        .eq(
          "id",
          consumptionId
        );

    if (error) {
      setMessage(
        "❌ Entfernen: " +
          error.message
      );
      return;
    }

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          points: Math.max(
            0,
            Number(
              profile.points || 0
            ) -
              Number(
                consumption.points ||
                  10
              )
          ),
          drinks_count:
            Math.max(
              0,
              Number(
                profile.drinks_count ||
                  0
              ) - 1
            ),
        })
        .eq(
          "id",
          consumption.profile_id
        );
    }

    await Promise.all([
      loadProfiles(),
      loadMembers(),
      loadConsumptions(),
    ]);

    setMessage(
      "↩️ Trinkvorgang entfernt."
    );
  }

  /*
   * =========================================================
   * PROMILLE
   * =========================================================
   *
   * Näherungswert:
   *
   * Alkoholgramm =
   * Liter × Alkohol% × 0.789
   *
   * Widmark:
   * Promille = Alkoholgramm /
   * (Gewicht × Verteilungsfaktor)
   *
   * Danach Abbau von ca. 0.15 ‰/Stunde.
   *
   * Dies ist eine Schätzung und kein
   * medizinisch/forensisch verwertbarer Wert.
   */

  function calculatePromille(
    profileId: string
  ) {
    const profile =
      profiles.find(
        (item) =>
          item.id === profileId
      );

    if (!profile) return 0;

    const weight =
      Number(
        profile.gewicht_kg || 0
      );

    if (weight <= 0) return 0;

    const faktor =
      profile.geschlecht
        ?.toLowerCase()
        .includes("weib")
        ? 0.55
        : 0.68;

    const personDrinks =
      consumptions.filter(
        (item) =>
          item.profile_id ===
          profileId
      );

    let promille = 0;

    for (
      const consumption of personDrinks
    ) {
      const drink =
        drinks.find(
          (item) =>
            item.id ===
            consumption.drink_id
        );

      if (!drink) continue;

      const liters =
        Number(
          drink.liters ??
            drink.menge ??
            0
        );

      const alcoholPercent =
        Number(
          drink.alcohol_percent ??
            drink.alkohol ??
            0
        );

      const alcoholGrams =
        liters *
        (alcoholPercent / 100) *
        789;

      const initial =
        alcoholGrams /
        (weight * faktor);

      const consumedAt =
        new Date(
          consumption.consumed_at
        ).getTime();

      const hoursPassed =
        Math.max(
          0,
          (now - consumedAt) /
            3600000
        );

      const remaining =
        Math.max(
          0,
          initial -
            hoursPassed * 0.15
        );

      promille += remaining;
    }

    return Math.max(
      0,
      Number(promille.toFixed(2))
    );
  }

  /*
   * =========================================================
   * MEIST GETRUNKENE GETRÄNKE
   * =========================================================
   */

  const drinkUsage = useMemo(() => {
    const usage: Record<
      string,
      number
    > = {};

    consumptions.forEach(
      (item) => {
        usage[item.drink_id] =
          (usage[item.drink_id] ||
            0) + 1;
      }
    );

    return usage;
  }, [consumptions]);

  const sortedDrinks =
    useMemo(() => {
      return [...drinks].sort(
        (a, b) => {
          const countA =
            drinkUsage[a.id] || 0;

          const countB =
            drinkUsage[b.id] || 0;

          if (countA !== countB) {
            return (
              countB - countA
            );
          }

          return 0;
        }
      );
    }, [drinks, drinkUsage]);

  /*
   * =========================================================
   * STATISTIK
   * =========================================================
   */

  const totalLiters =
    consumptions.reduce(
      (sum, consumption) => {
        const drink =
          drinks.find(
            (item) =>
              item.id ===
              consumption.drink_id
          );

        return (
          sum +
          Number(
            drink?.liters ??
              drink?.menge ??
              0
          )
        );
      },
      0
    );

  const totalCost =
    consumptions.reduce(
      (sum, consumption) => {
        const drink =
          drinks.find(
            (item) =>
              item.id ===
              consumption.drink_id
          );

        return (
          sum +
          Number(
            drink?.preis || 0
          )
        );
      },
      0
    );

  const totalPoints =
    members.reduce(
      (sum, member) =>
        sum +
        Number(
          member.points || 0
        ),
      0
    );

  const amountPerPerson =
    members.length
      ? totalCost /
        members.length
      : 0;

  const ranking =
    [...members].sort(
      (a, b) =>
        b.points - a.points
    );

  const paidCount =
    members.filter(
      (member) =>
        payments.some(
          (payment) =>
            payment.profile_id ===
              member.profile_id &&
            payment.status ===
              "bezahlt"
        )
    ).length;

  const openCount =
    members.length -
    paidCount;

  /*
   * =========================================================
   * PAYMENT
   * =========================================================
   */

  async function togglePayment(
    member: Member
  ) {
    const existing =
      payments.find(
        (payment) =>
          payment.profile_id ===
          member.profile_id
      );

    const newStatus =
      existing?.status ===
      "bezahlt"
        ? "offen"
        : "bezahlt";

    if (existing) {
      const { error } =
        await supabase
          .from("payments")
          .update({
            status: newStatus,
            betrag:
              amountPerPerson,
            bezahlt_von:
              member.profile_id,
          })
          .eq(
            "id",
            existing.id
          );

      if (error) {
        setMessage(
          "❌ Zahlung: " +
            error.message
        );
        return;
      }
    } else {
      const { error } =
        await supabase
          .from("payments")
          .insert({
            event_id: eventId,
            profile_id:
              member.profile_id,
            bezahlt_von:
              member.profile_id,
            betrag:
              amountPerPerson,
            status: newStatus,
          });

      if (error) {
        setMessage(
          "❌ Zahlung: " +
            error.message
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

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

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

        {/* EVENT */}

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

          {eventId && (
            <div className="inviteBox">
              <h3>
                🔗 Freunde einladen
              </h3>

              <p>
                Teile diesen Code:
              </p>

              <div className="codeRow">
                <strong>
                  {inviteCode ||
                    "------"}
                </strong>

                <button
                  onClick={
                    copyInviteCode
                  }
                >
                  📋 Kopieren
                </button>
              </div>

              <button
                className="newCode"
                onClick={
                  createInviteCode
                }
              >
                🔄 Neuen Code erstellen
              </button>
            </div>
          )}
        </section>

        {/* JOIN */}

        <section className="card">
          <h2>
            👥 Event beitreten
          </h2>

          <p>
            Einladungscode eingeben:
          </p>

          <div className="joinBox">
            <input
              value={joinCode}
              onChange={(e) =>
                setJoinCode(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="A7K9P2"
              maxLength={6}
            />

            <button
              onClick={
                joinEventWithCode
              }
            >
              🚀 Beitreten
            </button>
          </div>
        </section>

        {/* STATS */}

        <div className="stats">

          <div className="stat">
            <span>🍺</span>
            <strong>
              {consumptions.length}
            </strong>
            <small>
              Getrunken
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
              {members.length}
            </strong>
            <small>
              Teilnehmer
            </small>
          </div>

        </div>

        {/* PARTICIPANTS */}

        <section className="card">
          <h2>
            👥 Teilnehmer
          </h2>

          {profiles.filter(
            (profile) =>
              !members.some(
                (member) =>
                  member.profile_id ===
                  profile.id
              )
          ).length > 0 && (
            <div className="addParticipant">

              <select
                value={
                  selectedProfile
                }
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
                  .map(
                    (profile) => (
                      <option
                        key={
                          profile.id
                        }
                        value={
                          profile.id
                        }
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

          {members.map(
            (member) => {
              const promille =
                calculatePromille(
                  member.profile_id
                );

              return (
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
                      🏆{" "}
                      {member.points}
                      {" Punkte"}
                    </small>

                    <small className="promille">
                      🍷{" "}
                      {promille.toFixed(
                        2
                      )} ‰
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
              );
            }
          )}
        </section>

        {/* ADD DRINK */}

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
              value={liters}
              onChange={(e) =>
                setLiters(
                  e.target.value
                )
              }
              placeholder="Liter"
            />

            <input
              type="number"
              value={alcohol}
              onChange={(e) =>
                setAlcohol(
                  e.target.value
                )
              }
              placeholder="Alkohol %"
            />

            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
              placeholder="Preis €"
            />

          </div>

          <button
            className="save"
            onClick={
              saveDrink
            }
          >
            🍻 Getränk speichern
          </button>
        </section>

        {/* DRINK BUTTONS */}

        <section className="card">
          <h2>
            🍺 Getränke
          </h2>

          <p>
            Getränk anklicken, um es
            einem Teilnehmer zuzuordnen.
          </p>

          {members.length === 0 ? (
            <p>
              👥 Zuerst Teilnehmer
              hinzufügen.
            </p>
          ) : (
            <>
              <select
                value={
                  selectedDrink
                }
                onChange={(e) =>
                  setSelectedDrink(
                    e.target.value
                  )
                }
              >
                <option value="">
                  🍺 Getränk auswählen
                </option>

                {sortedDrinks.map(
                  (drink) => {
                    const count =
                      drinkUsage[
                        drink.id
                      ] || 0;

                    return (
                      <option
                        key={
                          drink.id
                        }
                        value={
                          drink.id
                        }
                      >
                        {count > 0
                          ? `🔥 ${count}× `
                          : ""}
                        {drink.drink_name ||
                          drink.getraenk ||
                          "Getränk"}
                        {" · "}
                        {Number(
                          drink.liters ??
                            drink.menge ??
                            0
                        ).toFixed(
                          1
                        )}
                        L
                      </option>
                    );
                  }
                )}
              </select>

              {selectedDrink && (
                <div className="participantButtons">

                  {members.map(
                    (member) => (
                      <button
                        className="drinkButton"
                        key={
                          member.id
                        }
                        onClick={() => {
                          drinkForPerson(
                            member.profile_id,
                            selectedDrink
                          );
                        }}
                      >
                        🍺{" "}
                        {
                          member.username
                        }
                        {" +1"}
                      </button>
                    )
                  )}

                </div>
              )}
            </>
          )}

          {sortedDrinks.map(
            (drink) => {
              const count =
                drinkUsage[
                  drink.id
                ] || 0;

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
                      ).toFixed(
                        1
                      )}
                      {" L · "}
                      {Number(
                        drink.alcohol_percent ??
                          drink.alkohol ??
                          0
                      ).toFixed(
                        1
                      )}
                      {" % · "}
                      {count}× getrunken
                    </small>
                  </div>

                  <button
                    className="deleteDrink"
                    onClick={() =>
                      deleteDrink(
                        drink.id
                      )
                    }
                  >
                    🗑️
                  </button>

                </div>
              );
            }
          )}
        </section>

        {/* OWN CONSUMPTIONS */}

        <section className="card">
          <h2>
            🍻 Meine Getränke
          </h2>

          <p>
            Hier kannst du eigene
            Trinkvorgänge wieder entfernen.
          </p>

          {profiles[0] &&
          consumptions.filter(
            (item) =>
              item.profile_id ===
              profiles[0].id
          ).length === 0 ? (
            <p>
              Noch keine eigenen
              Getränke.
            </p>
          ) : (
            consumptions
              .filter(
                (item) =>
                  item.profile_id ===
                  profiles[0]?.id
              )
              .map(
                (consumption) => {
                  const drink =
                    drinks.find(
                      (item) =>
                        item.id ===
                        consumption.drink_id
                    );

                  return (
                    <div
                      className="consumption"
                      key={
                        consumption.id
                      }
                    >
                      <div>
                        <strong>
                          🍺{" "}
                          {drink?.drink_name ||
                            drink?.getraenk ||
                            "Getränk"}
                        </strong>

                        <small>
                          {new Date(
                            consumption.consumed_at
                          ).toLocaleTimeString(
                            "de-DE",
                            {
                              hour:
                                "2-digit",
                              minute:
                                "2-digit",
                            }
                          )}
                        </small>
                      </div>

                      <button
                        className="undo"
                        onClick={() =>
                          deleteConsumption(
                            consumption.id
                          )
                        }
                      >
                        ↩️ Entfernen
                      </button>
                    </div>
                  );
                }
              )
          )}
        </section>

        {/* PROMILLE */}

        <section className="card promilleCard">
          <h2>
            🍷 Aktuelle Promille
          </h2>

          {members.map(
            (member) => {
              const value =
                calculatePromille(
                  member.profile_id
                );

              return (
                <div
                  className="promillePerson"
                  key={
                    member.id
                  }
                >
                  <div>
                    <strong>
                      {
                        member.username
                      }
                    </strong>

                    <small>
                      Gewicht:{" "}
                      {
                        member.gewicht_kg
                      }{" "}
                      kg
                    </small>
                  </div>

                  <strong className="promilleValue">
                    {value.toFixed(
                      2
                    )} ‰
                  </strong>
                </div>
              );
            }
          )}

          <p className="warning">
            ⚠️ Die Promilleanzeige ist
            nur eine rechnerische
            Schätzung und darf nicht
            zur Beurteilung der
            Fahrtüchtigkeit verwendet
            werden.
          </p>
        </section>

        {/* DRINKING HISTORY */}

        <section className="card">
          <h2>
            📋 Trinkverlauf
          </h2>

          {consumptions.length ===
          0 ? (
            <p>
              Noch keine
              Trinkvorgänge.
            </p>
          ) : (
            consumptions.map(
              (consumption) => {
                const member =
                  members.find(
                    (item) =>
                      item.profile_id ===
                      consumption.profile_id
                  );

                const drink =
                  drinks.find(
                    (item) =>
                      item.id ===
                      consumption.drink_id
                  );

                return (
                  <div
                    className="history"
                    key={
                      consumption.id
                    }
                  >
                    <div>
                      <strong>
                        🍺{" "}
                        {
                          member?.username ||
                          "Teilnehmer"
                        }
                      </strong>

                      <small>
                        {drink?.drink_name ||
                          drink?.getraenk ||
                          "Getränk"}
                        {" · "}
                        {new Date(
                          consumption.consumed_at
                        ).toLocaleTimeString(
                          "de-DE",
                          {
                            hour:
                              "2-digit",
                            minute:
                              "2-digit",
                          }
                        )}
                      </small>
                    </div>
                  </div>
                );
              }
            )
          )}
        </section>

        {/* PAYMENTS */}

        <section className="card">
          <h2>
            💶 Kostenaufteilung
          </h2>

          <div className="total">
            {totalCost.toFixed(
              2
            )} €
          </div>

          <p className="center">
            Gesamtkosten
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
              {amountPerPerson.toFixed(
                2
              )} €
            </strong>
          </div>

          <div className="paymentSummary">

            <div className="paymentBox paid">
              <span>✅</span>
              <strong>
                {paidCount}
              </strong>
              <small>
                Bezahlt
              </small>
            </div>

            <div className="paymentBox open">
              <span>⏳</span>
              <strong>
                {openCount}
              </strong>
              <small>
                Offen
              </small>
            </div>

          </div>

          <h3>
            💶 Zahlungen
          </h3>

          {members.map(
            (member) => {
              const payment =
                payments.find(
                  (item) =>
                    item.profile_id ===
                    member.profile_id
                );

              const isPaid =
                payment?.status ===
                "bezahlt";

              return (
                <div
                  className={
                    isPaid
                      ? "paymentPerson paidRow"
                      : "paymentPerson"
                  }
                  key={
                    member.id
                  }
                >

                  <div className="paymentAvatar">
                    {member.username
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {
                        member.username
                      }
                    </strong>

                    <small>
                      Anteil:{" "}
                      {amountPerPerson.toFixed(
                        2
                      )} €
                    </small>
                  </div>

                  <button
                    className={
                      isPaid
                        ? "paidButton"
                        : "openButton"
                    }
                    onClick={() =>
                      togglePayment(
                        member
                      )
                    }
                  >
                    {isPaid
                      ? "✅ Bezahlt"
                      : "⏳ Offen"}
                  </button>

                </div>
              );
            }
          )}
        </section>

        {/* RANKING */}

        <section className="card">
          <h2>
            🏆 Ranking
          </h2>

          {ranking.map(
            (member, index) => (
              <div
                className="ranking"
                key={
                  member.id
                }
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
                    {
                      member.username
                    }
                  </strong>

                  <small>
                    🍺{" "}
                    {
                      member.drinks
                    }
                  </small>
                </div>

                <div className="points">
                  {
                    member.points
                  }

                  <small>
                    Punkte
                  </small>
                </div>
              </div>
            )
          )}

          <div className="totalPoints">
            🏆 Gesamtpunkte:{" "}
            {totalPoints}
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

        .inviteBox {
          margin-top: 15px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(245,158,11,.08);
          border: 1px solid rgba(245,158,11,.25);
        }

        .inviteBox h3 {
          margin: 0;
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

        .newCode {
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

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .save {
          width: 100%;
        }

        .participantButtons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .drinkButton {
          background: #f59e0b;
          color: #111;
        }

        .drink {
          display: grid;
          grid-template-columns: 40px 1fr auto;
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

        .deleteDrink {
          background: #303b48;
          color: white;
          padding: 8px 10px;
        }

        .consumption,
        .history {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 12px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .undo {
          background: #334155;
          color: white;
          font-size: 12px;
        }

        .promilleCard {
          border: 1px solid rgba(245,158,11,.25);
        }

        .promillePerson {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .promille {
          color: #fbbf24;
        }

        .promilleValue {
          font-size: 25px;
          color: #fbbf24;
        }

        .warning {
          font-size: 11px;
          margin-bottom: 0;
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
        }

        .paidRow {
          border: 1px solid rgba(34,197,94,.4);
          background: rgba(34,197,94,.08);
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
            grid-template-columns: repeat(2, 1fr);
          }

          .three {
            grid-template-columns: 1fr;
          }

          .addParticipant {
            grid-template-columns: 1fr;
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

          .participantButtons {
            grid-template-columns: 1fr;
          }

          .paymentPerson {
            grid-template-columns: 40px 1fr;
          }

          .paymentPerson button {
            grid-column: 1 / -1;
            width: 100%;
          }

          .drink {
            grid-template-columns: 35px 1fr auto;
          }

          .consumption {
            align-items: flex-start;
            flex-direction: column;
          }

          .undo {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
