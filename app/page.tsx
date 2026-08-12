"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type Event = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  image?: string | null;
  invite_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;

  ranking_enabled?: boolean | null;
  show_points?: boolean | null;
  show_ranking?: boolean | null;
  show_promille?: boolean | null;
  show_statistics?: boolean | null;
  show_drink_amounts?: boolean | null;
  photo_required?: boolean | null;
  ai_recognition_enabled?: boolean | null;
  manual_entry_allowed?: boolean | null;
  cost_overview_enabled?: boolean | null;
  auto_split_costs?: boolean | null;
  team_mode?: boolean | null;
  show_photos?: boolean | null;
  show_costs?: boolean | null;
  privacy_mode?: boolean | null;
};

type Profile = {
  id: string;
  username?: string | null;
  points?: number | null;
  drinks_count?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
};

type Participant = {
  id: string;
  profile_id: string;
  name: string;
  points: number;
  drinks: number;
  liters: number;
  cost: number;
  challengePoints: number;
};

type Drink = {
  id: string;
  event_id: string;
  profile_id?: string | null;

  category?: string | null;
  drink_name?: string | null;
  brand?: string | null;
  liters?: number | null;
  alcohol_percent?: number | null;
  quantity?: number | null;

  image?: string | null;
  comment?: string | null;

  image_path?: string | null;
  ai_detected?: boolean | null;
  detected_brand?: string | null;
  detected_alcohol_percent?: number | null;

  paid_by?: string | null;
  shared_cost?: boolean | null;

  marke?: string | null;
  bezahlt_von?: string | null;
  promille_wert?: number | null;
  getraenk?: string | null;
  menge?: number | null;
  alkohol?: number | null;
  preis?: number | null;
  foto?: string | null;

  created_at?: string | null;
};

type Challenge = {
  id: string;
  event_id: string;
  title: string;
  description: string;
  target_profile_id: string;
  target_name: string;
  status: "voting" | "active" | "completed";
  difficulty: "normal" | "hard" | "legendary";
  points: number;
  winner_option?: string | null;
  created_at?: string | null;
};

type ChallengeOption = {
  id: string;
  challenge_id: string;
  text: string;
  votes: number;
};

type ChallengeVote = {
  id: string;
  challenge_id: string;
  option_id: string;
  profile_id: string;
};

type Payment = {
  id: string;
  event_id: string;
  betrag?: number | null;
  profile_id?: string | null;
  bezahlt_von?: string | null;
  status?: string | null;
};

/* =========================================================
   HELPERS
========================================================= */

function getDrinkName(drink: Drink) {
  return (
    drink.drink_name ||
    drink.getraenk ||
    drink.brand ||
    drink.marke ||
    "Getränk"
  );
}

function getDrinkLiters(drink: Drink) {
  return Number(drink.liters ?? drink.menge ?? 0);
}

function getDrinkAlcohol(drink: Drink) {
  return Number(
    drink.alcohol_percent ??
      drink.alkohol ??
      drink.detected_alcohol_percent ??
      0
  );
}

function getDrinkPrice(drink: Drink) {
  return Number(drink.preis ?? 0);
}

function getRankingTitle(
  index: number,
  person: Participant
) {
  if (index === 0) {
    return "🍻 Zapfhahn-König";
  }

  if (index === 1) {
    return "🔥 Fast schon Legende";
  }

  if (index === 2) {
    return "🥉 Stammgast in Ausbildung";
  }

  if (person.challengePoints >= 50) {
    return "🎯 Challenge-Maschine";
  }

  if (person.drinks >= 8) {
    return "🍺 Rundenmeister";
  }

  if (person.drinks >= 5) {
    return "🥴 Zapfhahn-Veteran";
  }

  if (person.drinks >= 3) {
    return "😂 Solider Durst";
  }

  if (person.drinks >= 1) {
    return "🍻 Dabei sein ist alles";
  }

  return "😇 Noch trocken hinter den Ohren";
}

function getDifficultyPoints(
  difficulty: Challenge["difficulty"]
) {
  if (difficulty === "legendary") {
    return 30;
  }

  if (difficulty === "hard") {
    return 20;
  }

  return 10;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Home() {
  /* -------------------------------------------------------
     BASIC STATE
  ------------------------------------------------------- */

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [participants, setParticipants] =
    useState<Participant[]>([]);

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [challenges, setChallenges] =
    useState<Challenge[]>([]);

  const [challengeOptions, setChallengeOptions] =
    useState<ChallengeOption[]>([]);

  const [challengeVotes, setChallengeVotes] =
    useState<ChallengeVote[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  /* -------------------------------------------------------
     UI STATE
  ------------------------------------------------------- */

  const [activeTab, setActiveTab] =
    useState<"home" | "drinks" | "challenges" | "ranking">(
      "home"
    );

  const [showDrinkForm, setShowDrinkForm] =
    useState(false);

  const [showChallengeForm, setShowChallengeForm] =
    useState(false);

  /* -------------------------------------------------------
     DRINK FORM
  ------------------------------------------------------- */

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] =
    useState("Bier");
  const [drinkLiters, setDrinkLiters] =
    useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] =
    useState("5");
  const [drinkPrice, setDrinkPrice] =
    useState("0");

  /* -------------------------------------------------------
     PARTICIPANT FORM
  ------------------------------------------------------- */

  const [participantName, setParticipantName] =
    useState("");

  /* -------------------------------------------------------
     CHALLENGE FORM
  ------------------------------------------------------- */

  const [challengeTarget, setChallengeTarget] =
    useState("");

  const [challengeDescription, setChallengeDescription] =
    useState("");

  const [challengeDifficulty, setChallengeDifficulty] =
    useState<Challenge["difficulty"]>("normal");

  const [challengeOption1, setChallengeOption1] =
    useState("");

  const [challengeOption2, setChallengeOption2] =
    useState("");

  const [challengeOption3, setChallengeOption3] =
    useState("");

  /* -------------------------------------------------------
     LOAD EVENTS
  ------------------------------------------------------- */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage("❌ Events konnten nicht geladen werden.");
      return;
    }

    if (data) {
      setEvents(data);

      if (!eventId && data.length > 0) {
        setEventId(data[0].id);
      }
    }
  }

  /* -------------------------------------------------------
     LOAD PROFILES
  ------------------------------------------------------- */

  async function loadProfiles() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("username", {
        ascending: true,
      });

    if (data) {
      setProfiles(data);
    }
  }

  /* -------------------------------------------------------
     LOAD EVENT MEMBERS
  ------------------------------------------------------- */

  async function loadParticipants() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("event_members")
      .select(
        `
        id,
        event_id,
        profile_id,
        joined_at,
        joined_via_code
        `
      )
      .eq("event_id", eventId)
      .order("joined_at", {
        ascending: true,
      });

    if (error) {
      setMessage(
        "❌ Teilnehmer konnten nicht geladen werden."
      );
      return;
    }

    if (!data) {
      setParticipants([]);
      return;
    }

    const result: Participant[] = data.map(
      (member: any) => {
        const profile = profiles.find(
          (p) => p.id === member.profile_id
        );

        return {
          id: member.id,
          profile_id: member.profile_id,
          name:
            profile?.username ||
            "Teilnehmer",
          points: 0,
          drinks: 0,
          liters: 0,
          cost: 0,
          challengePoints: 0,
        };
      }
    );

    setParticipants(result);
  }

  /* -------------------------------------------------------
     LOAD DRINKS
  ------------------------------------------------------- */

  async function loadDrinks() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "❌ Getränke konnten nicht geladen werden."
      );
      return;
    }

    if (data) {
      setDrinks(data);
    }
  }

  /* -------------------------------------------------------
     LOAD PAYMENTS
  ------------------------------------------------------- */

  async function loadPayments() {
    if (!eventId) return;

    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (data) {
      setPayments(data);
    }
  }

  /* -------------------------------------------------------
     LOAD CHALLENGES
  ------------------------------------------------------- */

  async function loadChallenges() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      /*
        Falls die Challenge-Tabelle noch nicht existiert,
        zeigen wir keinen kompletten Fehlerbildschirm.
      */
      return;
    }

    if (data) {
      setChallenges(data);
    }

    const challengeIds =
      (data || []).map((c: Challenge) => c.id);

    if (challengeIds.length === 0) {
      setChallengeOptions([]);
      setChallengeVotes([]);
      return;
    }

    const { data: options } = await supabase
      .from("challenge_options")
      .select("*")
      .in("challenge_id", challengeIds);

    const { data: votes } = await supabase
      .from("challenge_votes")
      .select("*")
      .in("challenge_id", challengeIds);

    if (options) {
      setChallengeOptions(options);
    }

    if (votes) {
      setChallengeVotes(votes);
    }
  }

  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */

  useEffect(() => {
    async function start() {
      setLoading(true);

      await loadEvents();
      await loadProfiles();

      setLoading(false);
    }

    start();
  }, []);

  /* -------------------------------------------------------
     LOAD EVENT DATA
  ------------------------------------------------------- */

  useEffect(() => {
    if (!eventId) return;

    async function loadEverything() {
      await loadDrinks();
      await loadPayments();
      await loadParticipants();
      await loadChallenges();
    }

    loadEverything();
  }, [eventId, profiles.length]);

  /* ========================================================
     CURRENT EVENT
  ======================================================== */

  const currentEvent = useMemo(() => {
    return events.find(
      (event) => event.id === eventId
    );
  }, [events, eventId]);

  /* ========================================================
     CALCULATIONS
  ======================================================== */

  const totalLiters = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkLiters(drink) *
          Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const totalDrinkCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkPrice(drink) *
          Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const totalPayments = useMemo(() => {
    return payments.reduce(
      (sum, payment) =>
        sum + Number(payment.betrag ?? 0),
      0
    );
  }, [payments]);

  const totalCost =
    totalDrinkCost > 0
      ? totalDrinkCost
      : totalPayments;

  const totalDrinkCount = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  /* -------------------------------------------------------
     PARTICIPANT STATISTICS
  ------------------------------------------------------- */

  const participantStats = useMemo(() => {
    const map = new Map<
      string,
      Participant
    >();

    participants.forEach((person) => {
      map.set(person.profile_id, {
        ...person,
      });
    });

    drinks.forEach((drink) => {
      if (!drink.profile_id) return;

      const person =
        map.get(drink.profile_id);

      if (!person) return;

      const quantity =
        Number(drink.quantity ?? 1);

      person.drinks += quantity;

      person.liters +=
        getDrinkLiters(drink) *
        quantity;

      person.cost +=
        getDrinkPrice(drink) *
        quantity;

      person.points +=
        10 * quantity;
    });

    challenges
      .filter(
        (challenge) =>
          challenge.status === "completed"
      )
      .forEach((challenge) => {
        const person = map.get(
          challenge.target_profile_id
        );

        if (!person) return;

        person.challengePoints +=
          Number(challenge.points ?? 0);

        person.points +=
          Number(challenge.points ?? 0);
      });

    return Array.from(map.values());
  }, [
    participants,
    drinks,
    challenges,
  ]);

  const ranking = useMemo(() => {
    return [...participantStats].sort(
      (a, b) => b.points - a.points
    );
  }, [participantStats]);

  const totalPoints = useMemo(() => {
    return participantStats.reduce(
      (sum, person) =>
        sum + person.points,
      0
    );
  }, [participantStats]);

  const completedChallenges =
    challenges.filter(
      (c) => c.status === "completed"
    ).length;

  const openChallenges =
    challenges.filter(
      (c) => c.status !== "completed"
    ).length;

  /* ========================================================
     MESSAGE
  ======================================================== */

  function showMessage(text: string) {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  /* ========================================================
     ADD PARTICIPANT
  ======================================================== */

  async function addParticipant() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!participantName.trim()) {
      showMessage(
        "❌ Bitte einen Namen eingeben."
      );
      return;
    }

    const existing = profiles.find(
      (profile) =>
        profile.username?.toLowerCase() ===
        participantName
          .trim()
          .toLowerCase()
    );

    if (!existing) {
      showMessage(
        "❌ Dieser Teilnehmer existiert noch nicht in profiles."
      );
      return;
    }

    const alreadyMember =
      participants.some(
        (person) =>
          person.profile_id ===
          existing.id
      );

    if (alreadyMember) {
      showMessage(
        "❌ Teilnehmer ist bereits dabei."
      );
      return;
    }

    const { error } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        profile_id: existing.id,
        joined_via_code: "manual",
      });

    if (error) {
      showMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message
      );
      return;
    }

    setParticipantName("");

    await loadParticipants();

    showMessage(
      "🎉 Teilnehmer ist dabei!"
    );
  }

  /* ========================================================
     ADD DRINK
  ======================================================== */

  async function saveDrink() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!drinkName.trim()) {
      showMessage(
        "❌ Bitte ein Getränk eingeben."
      );
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .insert({
        event_id: eventId,
        drink_name:
          drinkName.trim(),
        getraenk:
          drinkName.trim(),
        brand:
          drinkBrand.trim() || null,
        marke:
          drinkBrand.trim() || null,
        category:
          drinkCategory,
        liters:
          Number(drinkLiters),
        menge:
          Number(drinkLiters),
        alcohol_percent:
          Number(drinkAlcohol),
        alkohol:
          Number(drinkAlcohol),
        preis:
          Number(drinkPrice),
        quantity: 1,
        ai_detected: false,
      });

    if (error) {
      showMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkCategory("Bier");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");

    setShowDrinkForm(false);

    await loadDrinks();

    showMessage(
      "🍺 Getränk gespeichert!"
    );
  }

  /* ========================================================
     ASSIGN DRINK
  ======================================================== */

  async function assignDrink(
    drinkId: string,
    profileId: string
  ) {
    if (!profileId) return;

    const { error } = await supabase
      .from("drinks")
      .update({
        profile_id: profileId,
      })
      .eq("id", drinkId);

    if (error) {
      showMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    await loadDrinks();

    showMessage(
      "🍺 Getränk wurde zugeordnet! +10 Punkte"
    );
  }

  /* ========================================================
     CREATE CHALLENGE
  ======================================================== */

  async function createChallenge() {
    if (!eventId) {
      showMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    if (!challengeTarget) {
      showMessage(
        "❌ Wähle zuerst einen Teilnehmer."
      );
      return;
    }

    if (!challengeDescription.trim()) {
      showMessage(
        "❌ Gib eine Aufgabe ein."
      );
      return;
    }

    const optionsText = [
      challengeOption1,
      challengeOption2,
      challengeOption3,
    ].filter(
      (value) => value.trim()
    );

    if (optionsText.length < 2) {
      showMessage(
        "❌ Bitte mindestens zwei Antwortmöglichkeiten eingeben."
      );
      return;
    }

    const target =
      participantStats.find(
        (person) =>
          person.profile_id ===
          challengeTarget
      );

    if (!target) {
      showMessage(
        "❌ Teilnehmer nicht gefunden."
      );
      return;
    }

    const points =
      getDifficultyPoints(
        challengeDifficulty
      );

    const { data, error } = await supabase
      .from("challenges")
      .insert({
        event_id: eventId,
        title:
          "🎯 Was soll " +
          target.name +
          " machen?",
        description:
          challengeDescription.trim(),
        target_profile_id:
          target.profile_id,
        target_name:
          target.name,
        status: "voting",
        difficulty:
          challengeDifficulty,
        points,
      })
      .select()
      .single();

    if (error || !data) {
      showMessage(
        "❌ Challenge konnte nicht erstellt werden: " +
          (error?.message || "Unbekannter Fehler")
      );
      return;
    }

    const optionRows =
      optionsText.map((text) => ({
        challenge_id: data.id,
        text: text.trim(),
        votes: 0,
      }));

    const { error: optionError } =
      await supabase
        .from("challenge_options")
        .insert(optionRows);

    if (optionError) {
      showMessage(
        "❌ Challenge wurde erstellt, aber die Optionen konnten nicht gespeichert werden."
      );
      return;
    }

    setChallengeTarget("");
    setChallengeDescription("");
    setChallengeDifficulty("normal");
    setChallengeOption1("");
    setChallengeOption2("");
    setChallengeOption3("");

    setShowChallengeForm(false);

    await loadChallenges();

    showMessage(
      "🎯 Challenge gestartet! Jetzt darf die Gruppe abstimmen."
    );
  }

  /* ========================================================
     VOTE
  ======================================================== */

  async function voteChallenge(
    challengeId: string,
    optionId: string,
    voterProfileId: string
  ) {
    if (!voterProfileId) {
      showMessage(
        "❌ Bitte einen Teilnehmer auswählen."
      );
      return;
    }

    const alreadyVoted =
      challengeVotes.some(
        (vote) =>
          vote.challenge_id ===
            challengeId &&
          vote.profile_id ===
            voterProfileId
      );

    if (alreadyVoted) {
      showMessage(
        "🗳️ Du hast bereits abgestimmt."
      );
      return;
    }

    const { error } = await supabase
      .from("challenge_votes")
      .insert({
        challenge_id:
          challengeId,
        option_id:
          optionId,
        profile_id:
          voterProfileId,
      });

    if (error) {
      showMessage(
        "❌ Abstimmung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    const option =
      challengeOptions.find(
        (item) =>
          item.id === optionId
      );

    if (option) {
      await supabase
        .from("challenge_options")
        .update({
          votes:
            Number(option.votes ?? 0) +
            1,
        })
        .eq("id", optionId);
    }

    await loadChallenges();

    showMessage(
      "🗳️ Stimme abgegeben!"
    );
  }

  /* ========================================================
     COMPLETE CHALLENGE
  ======================================================== */

  async function completeChallenge(
    challenge: Challenge
  ) {
    const options =
      challengeOptions.filter(
        (option) =>
          option.challenge_id ===
          challenge.id
      );

    if (options.length === 0) {
      showMessage(
        "❌ Keine Abstimmungsoptionen gefunden."
      );
      return;
    }

    const sorted =
      [...options].sort(
        (a, b) =>
          Number(b.votes) -
          Number(a.votes)
      );

    const winner = sorted[0];

    const { error } = await supabase
      .from("challenges")
      .update({
        status: "completed",
        winner_option:
          winner.text,
      })
      .eq("id", challenge.id);

    if (error) {
      showMessage(
        "❌ Challenge konnte nicht beendet werden."
      );
      return;
    }

    await loadChallenges();

    showMessage(
      "🏆 Abstimmung beendet! " +
        challenge.target_name +
        " muss: " +
        winner.text
    );
  }

  /* ========================================================
     DELETE DRINK
  ======================================================== */

  async function deleteDrink(
    drinkId: string
  ) {
    const confirmed =
      window.confirm(
        "Getränk wirklich löschen?"
      );

    if (!confirmed) return;

    const { error } = await supabase
      .from("drinks")
      .delete()
      .eq("id", drinkId);

    if (error) {
      showMessage(
        "❌ Getränk konnte nicht gelöscht werden."
      );
      return;
    }

    await loadDrinks();

    showMessage(
      "🗑️ Getränk gelöscht."
    );
  }

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <main className="app">
        <div className="loading">
          <div className="loadingEmoji">
            🍻
          </div>

          <h1>
            Güstener Zapfhahn Zentrale
          </h1>

          <p>
            Zapfhahn wird geöffnet...
          </p>
        </div>
      </main>
    );
  }

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <main className="app">

      <div className="backgroundGlow glow1" />
      <div className="backgroundGlow glow2" />

      <div className="appContainer">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="header">

          <div className="brand">

            <div className="brandIcon">
              🍻
            </div>

            <div>
              <h1>
                Güstener
                <br />
                Zapfhahn Zentrale
              </h1>

              <p>
                Hier wird Geschichte
                geschrieben.
              </p>
            </div>

          </div>

          <div className="headerBadge">
            🔥 LIVE
          </div>

        </header>

        {/* =================================================
            EVENT SELECT
        ================================================= */}

        <section className="eventHero">

          <div className="eventHeroTop">

            <div>
              <span className="eyebrow">
                📅 AKTUELLES EVENT
              </span>

              <h2>
                {currentEvent?.title ||
                  "Kein Event"}
              </h2>

              {currentEvent?.location && (
                <p>
                  📍{" "}
                  {currentEvent.location}
                </p>
              )}
            </div>

            <div className="beerEmoji">
              🍺
            </div>

          </div>

          <select
            className="eventSelect"
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

        {/* =================================================
            STATS
        ================================================= */}

        <section className="statsGrid">

          <div className="statCard">
            <span>🍺</span>
            <strong>
              {totalDrinkCount}
            </strong>
            <small>
              Getränke
            </small>
          </div>

          <div className="statCard">
            <span>💧</span>
            <strong>
              {totalLiters.toFixed(1)}
            </strong>
            <small>
              Liter
            </small>
          </div>

          <div className="statCard">
            <span>👥</span>
            <strong>
              {participants.length}
            </strong>
            <small>
              Leute
            </small>
          </div>

          <div className="statCard">
            <span>🎯</span>
            <strong>
              {totalPoints}
            </strong>
            <small>
              Punkte
            </small>
          </div>

        </section>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="bottomNav">

          <button
            className={
              activeTab === "home"
                ? "navButton active"
                : "navButton"
            }
            onClick={() =>
              setActiveTab("home")
            }
          >
            <span>🏠</span>
            <small>
              Start
            </small>
          </button>

          <button
            className={
              activeTab === "drinks"
                ? "navButton active"
                : "navButton"
            }
            onClick={() =>
              setActiveTab("drinks")
            }
          >
            <span>🍺</span>
            <small>
              Getränke
            </small>
          </button>

          <button
            className={
              activeTab === "challenges"
                ? "navButton active"
                : "navButton"
            }
            onClick={() =>
              setActiveTab(
                "challenges"
              )
            }
          >
            <span>🎯</span>
            <small>
              Challenges
            </small>
          </button>

          <button
            className={
              activeTab === "ranking"
                ? "navButton active"
                : "navButton"
            }
            onClick={() =>
              setActiveTab(
                "ranking"
              )
            }
          >
            <span>🏆</span>
            <small>
              Ranking
            </small>
          </button>

        </nav>

        {/* =================================================
            HOME
        ================================================= */}

        {activeTab === "home" && (
          <>

            {/* PARTICIPANTS */}

            <section className="card">

              <div className="sectionHeader">

                <div>
                  <span className="eyebrow">
                    👥 DIE RUNDE
                  </span>

                  <h2>
                    Wer ist dabei?
                  </h2>
                </div>

                <span className="sectionEmoji">
                  🥳
                </span>

              </div>

              <div className="participantInput">

                <input
                  value={
                    participantName
                  }
                  onChange={(e) =>
                    setParticipantName(
                      e.target.value
                    )
                  }
                  placeholder="Name eingeben..."
                />

                <button
                  className="primaryButton"
                  onClick={
                    addParticipant
                  }
                >
                  ➕
                </button>

              </div>

              {participantStats.length ===
              0 ? (
                <div className="empty">
                  <span>
                    👀
                  </span>

                  <p>
                    Noch niemand da.
                  </p>

                  <small>
                    Sei der Erste!
                  </small>
                </div>
              ) : (
                <div className="peopleGrid">

                  {participantStats.map(
                    (person) => (
                      <div
                        className="personChip"
                        key={
                          person.profile_id
                        }
                      >
                        <div className="avatar">
                          {person.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {person.name}
                          </strong>

                          <small>
                            🏆{" "}
                            {person.points}
                            {" · "}
                            🍺{" "}
                            {person.drinks}
                          </small>
                        </div>
                      </div>
                    )
                  )}

                </div>
              )}

            </section>

            {/* QUICK ACTIONS */}

            <section className="card">

              <div className="sectionHeader">

                <div>
                  <span className="eyebrow">
                    ⚡ SCHNELLSTART
                  </span>

                  <h2>
                    Was geht?
                  </h2>
                </div>

              </div>

              <div className="quickGrid">

                <button
                  className="quickButton beer"
                  onClick={() => {
                    setShowDrinkForm(true);
                    setActiveTab(
                      "drinks"
                    );
                  }}
                >
                  <span>🍺</span>
                  <strong>
                    Getränk
                  </strong>
                  <small>
                    hinzufügen
                  </small>
                </button>

                <button
                  className="quickButton challenge"
                  onClick={() => {
                    setShowChallengeForm(
                      true
                    );
                    setActiveTab(
                      "challenges"
                    );
                  }}
                >
                  <span>🎯</span>
                  <strong>
                    Challenge
                  </strong>
                  <small>
                    starten
                  </small>
                </button>

                <button
                  className="quickButton ranking"
                  onClick={() =>
                    setActiveTab(
                      "ranking"
                    )
                  }
                >
                  <span>🏆</span>
                  <strong>
                    Ranking
                  </strong>
                  <small>
                    ansehen
                  </small>
                </button>

              </div>

            </section>

            {/* CHALLENGE TEASER */}

            <section className="partyBanner">

              <div>
                <span>
                  🎯 CHALLENGES
                </span>

                <strong>
                  {openChallenges}
                  {" "}
                  offene Aufgaben
                </strong>

                <small>
                  Die Gruppe entscheidet.
                </small>
              </div>

              <button
                onClick={() =>
                  setActiveTab(
                    "challenges"
                  )
                }
              >
                Los geht's →
              </button>

            </section>

          </>
        )}

        {/* =================================================
            DRINKS
        ================================================= */}

        {activeTab === "drinks" && (
          <>

            <section className="card">

              <div className="sectionHeader">

                <div>
                  <span className="eyebrow">
                    🍺 ZAPFHAHN
                  </span>

                  <h2>
                    Getränke
                  </h2>
                </div>

                <button
                  className="smallAction"
                  onClick={() =>
                    setShowDrinkForm(
                      !showDrinkForm
                    )
                  }
                >
                  {showDrinkForm
                    ? "×"
                    : "➕"}
                </button>

              </div>

              {showDrinkForm && (
                <div className="formBox">

                  <input
                    placeholder="Getränk"
                    value={
                      drinkName
                    }
                    onChange={(e) =>
                      setDrinkName(
                        e.target.value
                      )
                    }
                  />

                  <input
                    placeholder="Marke (optional)"
                    value={
                      drinkBrand
                    }
                    onChange={(e) =>
                      setDrinkBrand(
                        e.target.value
                      )
                    }
                  />

                  <select
                    value={
                      drinkCategory
                    }
                    onChange={(e) =>
                      setDrinkCategory(
                        e.target.value
                      )
                    }
                  >
                    <option>
                      Bier
                    </option>

                    <option>
                      Wein
                    </option>

                    <option>
                      Sekt
                    </option>

                    <option>
                      Longdrink
                    </option>

                    <option>
                      Shot
                    </option>

                    <option>
                      Cocktail
                    </option>

                    <option>
                      Softdrink
                    </option>

                    <option>
                      Sonstiges
                    </option>
                  </select>

                  <div className="formGrid">

                    <input
                      type="number"
                      step="0.1"
                      placeholder="Liter"
                      value={
                        drinkLiters
                      }
                      onChange={(e) =>
                        setDrinkLiters(
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      placeholder="Alkohol %"
                      value={
                        drinkAlcohol
                      }
                      onChange={(e) =>
                        setDrinkAlcohol(
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Preis €"
                      value={
                        drinkPrice
                      }
                      onChange={(e) =>
                        setDrinkPrice(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <button
                    className="fullButton"
                    onClick={
                      saveDrink
                    }
                  >
                    🍻 Getränk speichern
                  </button>

                </div>
              )}

              {drinks.length ===
              0 ? (
                <div className="empty">
                  <span>
                    🍺
                  </span>

                  <p>
                    Noch keine Getränke.
                  </p>
                </div>
              ) : (
                <div className="drinkList">

                  {drinks.map(
                    (drink) => {

                      const assigned =
                        participantStats.find(
                          (person) =>
                            person.profile_id ===
                            drink.profile_id
                        );

                      return (
                        <div
                          className="drinkItem"
                          key={
                            drink.id
                          }
                        >

                          <div className="drinkIcon">
                            🍺
                          </div>

                          <div className="drinkInfo">

                            <strong>
                              {getDrinkName(
                                drink
                              )}
                            </strong>

                            <small>
                              {drink.brand ||
                                drink.marke ||
                                "Getränk"}
                              {" · "}
                              {getDrinkLiters(
                                drink
                              ).toFixed(
                                1
                              )}
                              {" L · "}
                              {getDrinkAlcohol(
                                drink
                              ).toFixed(
                                1
                              )}
                              %
                            </small>

                            {assigned && (
                              <small className="assigned">
                                👤{" "}
                                {assigned.name}
                              </small>
                            )}

                          </div>

                          <div className="drinkRight">

                            <strong>
                              {getDrinkPrice(
                                drink
                              ).toFixed(
                                2
                              )}
                              €
                            </strong>

                            <select
                              value={
                                drink.profile_id ||
                                ""
                              }
                              onChange={(
                                e
                              ) =>
                                assignDrink(
                                  drink.id,
                                  e.target
                                    .value
                                )
                              }
                            >
                              <option value="">
                                Wem?
                              </option>

                              {participantStats.map(
                                (
                                  person
                                ) => (
                                  <option
                                    key={
                                      person.profile_id
                                    }
                                    value={
                                      person.profile_id
                                    }
                                  >
                                    {
                                      person.name
                                    }
                                  </option>
                                )
                              )}

                            </select>

                            <button
                              className="deleteButton"
                              onClick={() =>
                                deleteDrink(
                                  drink.id
                                )
                              }
                            >
                              🗑️
                            </button>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>

            {/* COST */}

            <section className="moneyCard">

              <span>
                💶 GESAMTKOSTEN
              </span>

              <strong>
                {totalCost.toFixed(2)} €
              </strong>

              <small>
                {participantStats.length >
                0
                  ? `${(
                      totalCost /
                      participantStats.length
                    ).toFixed(
                      2
                    )} € pro Person`
                  : "Noch keine Teilnehmer"}
              </small>

            </section>

          </>
        )}

        {/* =================================================
            CHALLENGES
        ================================================= */}

        {activeTab ===
          "challenges" && (
          <>

            <section className="challengeHero">

              <div>

                <span>
                  🎯 CHAOS-ZENTRALE
                </span>

                <h2>
                  Wer muss ran?
                </h2>

                <p>
                  Die Mehrheit entscheidet.
                </p>

              </div>

              <div className="bigEmoji">
                🤪
              </div>

            </section>

            <button
              className="fullButton challengeCreate"
              onClick={() =>
                setShowChallengeForm(
                  !showChallengeForm
                )
              }
            >
              {showChallengeForm
                ? "× Challenge abbrechen"
                : "🎯 Neue Challenge starten"}
            </button>

            {showChallengeForm && (
              <section className="card">

                <div className="sectionHeader">

                  <div>
                    <span className="eyebrow">
                      NEUE CHALLENGE
                    </span>

                    <h2>
                      Wer muss ran?
                    </h2>
                  </div>

                </div>

                <label>
                  Teilnehmer
                </label>

                <select
                  value={
                    challengeTarget
                  }
                  onChange={(e) =>
                    setChallengeTarget(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Teilnehmer auswählen
                  </option>

                  {participantStats.map(
                    (person) => (
                      <option
                        key={
                          person.profile_id
                        }
                        value={
                          person.profile_id
                        }
                      >
                        {person.name}
                      </option>
                    )
                  )}

                </select>

                <label>
                  Aufgabe
                </label>

                <input
                  placeholder="z.B. Einen Tanz aufführen"
                  value={
                    challengeDescription
                  }
                  onChange={(e) =>
                    setChallengeDescription(
                      e.target.value
                    )
                  }
                />

                <label>
                  Schwierigkeit
                </label>

                <select
                  value={
                    challengeDifficulty
                  }
                  onChange={(e) =>
                    setChallengeDifficulty(
                      e.target
                        .value as Challenge["difficulty"]
                    )
                  }
                >
                  <option value="normal">
                    😄 Normal · +10 Punkte
                  </option>

                  <option value="hard">
                    🔥 Schwer · +20 Punkte
                  </option>

                  <option value="legendary">
                    💀 Legendär · +30 Punkte
                  </option>
                </select>

                <label>
                  Abstimmung 1
                </label>

                <input
                  placeholder="z.B. Tanzen"
                  value={
                    challengeOption1
                  }
                  onChange={(e) =>
                    setChallengeOption1(
                      e.target.value
                    )
                  }
                />

                <label>
                  Abstimmung 2
                </label>

                <input
                  placeholder="z.B. Singen"
                  value={
                    challengeOption2
                  }
                  onChange={(e) =>
                    setChallengeOption2(
                      e.target.value
                    )
                  }
                />

                <label>
                  Abstimmung 3
                </label>

                <input
                  placeholder="z.B. Eine Runde ausgeben"
                  value={
                    challengeOption3
                  }
                  onChange={(e) =>
                    setChallengeOption3(
                      e.target.value
                    )
                  }
                />

                <button
                  className="fullButton"
                  onClick={
                    createChallenge
                  }
                >
                  🚀 Challenge starten
                </button>

              </section>
            )}

            {challenges.length ===
            0 ? (
              <div className="empty bigEmpty">

                <span>
                  🎯
                </span>

                <h3>
                  Noch kein Chaos.
                </h3>

                <p>
                  Das können wir ändern.
                </p>

              </div>
            ) : (
              challenges.map(
                (challenge) => {

                  const options =
                    challengeOptions.filter(
                      (option) =>
                        option.challenge_id ===
                        challenge.id
                    );

                  const votes =
                    challengeVotes.filter(
                      (vote) =>
                        vote.challenge_id ===
                        challenge.id
                    );

                  const totalVotes =
                    votes.length;

                  const maxVotes =
                    Math.max(
                      ...options.map(
                        (option) =>
                          Number(
                            option.votes
                          )
                      ),
                      0
                    );

                  return (
                    <section
                      className="challengeCard"
                      key={
                        challenge.id
                      }
                    >

                      <div className="challengeTop">

                        <div>

                          <span className="challengeStatus">
                            {challenge.status ===
                            "completed"
                              ? "🏆 ERLEDIGT"
                              : "🗳️ ABSTIMMUNG"}
                          </span>

                          <h3>
                            {
                              challenge.title
                            }
                          </h3>

                          <p>
                            {
                              challenge.description
                            }
                          </p>

                        </div>

                        <div className="pointsBadge">
                          +
                          {
                            challenge.points
                          }
                          <small>
                            Punkte
                          </small>
                        </div>

                      </div>

                      {challenge.status ===
                        "completed" ? (
                        <div className="winnerBox">

                          <span>
                            🏆 GEWINNER
                          </span>

                          <strong>
                            {
                              challenge.winner_option
                            }
                          </strong>

                          <p>
                            {
                              challenge.target_name
                            }{" "}
                            muss ran! 😂
                          </p>

                        </div>
                      ) : (
                        <>

                          <div className="voteInfo">
                            🗳️{" "}
                            {
                              totalVotes
                            }{" "}
                            Stimmen
                          </div>

                          <div className="optionList">

                            {options.map(
                              (
                                option
                              ) => {

                                const percentage =
                                  totalVotes >
                                  0
                                    ? Math.round(
                                        (Number(
                                          option.votes
                                        ) /
                                          totalVotes) *
                                          100
                                      )
                                    : 0;

                                const isLeader =
                                  Number(
                                    option.votes
                                  ) ===
                                    maxVotes &&
                                  maxVotes >
                                    0;

                                return (
                                  <div
                                    className={
                                      isLeader
                                        ? "voteOption leader"
                                        : "voteOption"
                                    }
                                    key={
                                      option.id
                                    }
                                  >

                                    <div className="voteOptionTop">

                                      <strong>
                                        {
                                          option.text
                                        }
                                      </strong>

                                      <span>
                                        {
                                          option.votes
                                        }
                                      </span>

                                    </div>

                                    <div className="progress">
                                      <div
                                        style={{
                                          width:
                                            `${percentage}%`,
                                        }}
                                      />
                                    </div>

                                    {participantStats.length >
                                      0 && (
                                      <select
                                        defaultValue=""
                                        onChange={(
                                          e
                                        ) => {
                                          if (
                                            e
                                              .target
                                              .value
                                          ) {
                                            voteChallenge(
                                              challenge.id,
                                              option.id,
                                              e
                                                .target
                                                .value
                                            );

                                            e.target.value =
                                              "";
                                          }
                                        }}
                                      >
                                        <option value="">
                                          Stimme abgeben...
                                        </option>

                                        {participantStats.map(
                                          (
                                            person
                                          ) => (
                                            <option
                                              key={
                                                person.profile_id
                                              }
                                              value={
                                                person.profile_id
                                              }
                                            >
                                              {
                                                person.name
                                              }
                                            </option>
                                          )
                                        )}

                                      </select>
                                    )}

                                  </div>
                                );
                              }
                            )}

                          </div>

                          <button
                            className="completeButton"
                            onClick={() =>
                              completeChallenge(
                                challenge
                              )
                            }
                          >
                            🏁 Abstimmung beenden
                          </button>

                        </>
                      )}

                    </section>
                  );
                }
              )
            )}

          </>
        )}

        {/* =================================================
            RANKING
        ================================================= */}

        {activeTab ===
          "ranking" && (
          <>

            <section className="rankingHero">

              <span>
                🏆 HALL OF FAME
              </span>

              <h2>
                Wer hat den Zapfhahn gezähmt?
              </h2>

              <p>
                Getränke + Challenges =
                Gesamtpunkte
              </p>

            </section>

            {ranking.length ===
            0 ? (
              <div className="empty bigEmpty">

                <span>
                  🏆
                </span>

                <h3>
                  Noch keine Helden.
                </h3>

                <p>
                  Erst trinken, dann
                  Punkte sammeln.
                </p>

              </div>
            ) : (
              <div className="rankingList">

                {ranking.map(
                  (
                    person,
                    index
                  ) => {

                    const title =
                      getRankingTitle(
                        index,
                        person
                      );

                    return (
                      <div
                        className={
                          index === 0
                            ? "rankCard first"
                            : "rankCard"
                        }
                        key={
                          person.profile_id
                        }
                      >

                        <div className="rankNumber">

                          {index ===
                          0
                            ? "🥇"
                            : index ===
                              1
                            ? "🥈"
                            : index ===
                              2
                            ? "🥉"
                            : index + 1}

                        </div>

                        <div className="rankAvatar">

                          {person.name
                            .charAt(
                              0
                            )
                            .toUpperCase()}

                        </div>

                        <div className="rankInfo">

                          <strong>
                            {
                              person.name
                            }
                          </strong>

                          <span>
                            {title}
                          </span>

                          <small>
                            🍺{" "}
                            {
                              person.drinks
                            }{" "}
                            Getränke
                            {" · "}
                            💧{" "}
                            {
                              person.liters
                            .toFixed(
                              1
                            )
                            }{" "}
                            L
                            {" · "}
                            🎯{" "}
                            {
                              person.challengePoints
                            }{" "}
                            Challenge-Punkte
                          </small>

                        </div>

                        <div className="rankPoints">

                          <strong>
                            {
                              person.points
                            }
                          </strong>

                          <small>
                            Punkte
                          </small>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

            <section className="pointsExplanation">

              <h3>
                ⭐ So gibt's Punkte
              </h3>

              <div>
                🍺{" "}
                <span>
                  Getränk
                </span>
                <strong>
                  +10
                </strong>
              </div>

              <div>
                😄{" "}
                <span>
                  Normale Challenge
                </span>
                <strong>
                  +10
                </strong>
              </div>

              <div>
                🔥{" "}
                <span>
                  Schwere Challenge
                </span>
                <strong>
                  +20
                </strong>
              </div>

              <div>
                💀{" "}
                <span>
                  Legendäre Challenge
                </span>
                <strong>
                  +30
                </strong>
              </div>

            </section>

          </>
        )}

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="toast">
            {message}
          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="footer">

          <div>
            🍻
          </div>

          <strong>
            Güstener Zapfhahn Zentrale
          </strong>

          <small>
            Dein Event. Deine Getränke.
            Dein Chaos.
          </small>

        </footer>

      </div>

      {/* ===================================================
          STYLES
      =================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          min-height: 100%;
          background: #070b10;
        }

        body {
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          color: #f8fafc;
        }

        button,
        input,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .app {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;

          background:
            radial-gradient(
              circle at 15% 0%,
              rgba(
                245,
                158,
                11,
                .15
              ),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 10%,
              rgba(
                249,
                115,
                22,
                .12
              ),
              transparent 28%
            ),
            #070b10;

          padding:
            18px
            18px
            40px;
        }

        .appContainer {
          position: relative;
          z-index: 2;

          width: 100%;
          max-width: 920px;

          margin: 0 auto;
        }

        .backgroundGlow {
          position: fixed;
          width: 280px;
          height: 280px;

          border-radius: 50%;

          filter: blur(100px);

          opacity: .12;

          pointer-events: none;
        }

        .glow1 {
          top: 10%;
          left: -100px;
          background: #f59e0b;
        }

        .glow2 {
          bottom: 10%;
          right: -100px;
          background: #fb7185;
        }

        /* HEADER */

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;

          padding:
            8px
            2px
            22px;
        }

        .brand {
          display: flex;
          align-items: center;

          gap: 12px;
        }

        .brandIcon {
          width: 58px;
          height: 58px;

          display: grid;
          place-items: center;

          border-radius: 18px;

          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f97316
            );

          box-shadow:
            0 12px 30px
            rgba(
              245,
              158,
              11,
              .2
            );

          font-size: 30px;
        }

        .brand h1 {
          margin: 0;

          font-size: 22px;
          line-height: 1.05;

          letter-spacing:
            -.5px;
        }

        .brand p {
          margin:
            5px
            0
            0;

          color: #94a3b8;

          font-size: 12px;
        }

        .headerBadge {
          padding:
            8px
            10px;

          border-radius: 999px;

          background:
            rgba(
              34,
              197,
              94,
              .12
            );

          border:
            1px solid
            rgba(
              34,
              197,
              94,
              .25
            );

          color: #86efac;

          font-size: 11px;
          font-weight: 800;
        }

        /* HERO */

        .eventHero {
          position: relative;

          padding: 22px;

          border-radius: 26px;

          background:
            linear-gradient(
              135deg,
              rgba(
                245,
                158,
                11,
                .19
              ),
              rgba(
                249,
                115,
                22,
                .08
              )
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          box-shadow:
            0 20px 60px
            rgba(
              0,
              0,
              0,
              .22
            );

          margin-bottom: 12px;
        }

        .eventHeroTop {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 15px;
        }

        .eyebrow {
          display: block;

          color: #fbbf24;

          font-size: 10px;
          font-weight: 900;

          letter-spacing:
            1.3px;

          margin-bottom: 7px;
        }

        .eventHero h2 {
          margin:
            0
            0
            5px;

          font-size: 28px;

          letter-spacing:
            -.8px;
        }

        .eventHero p {
          margin: 0;

          color: #cbd5e1;

          font-size: 13px;
        }

        .beerEmoji {
          font-size: 52px;

          transform:
            rotate(8deg);
        }

        .eventSelect {
          width: 100%;

          margin-top: 18px;

          padding:
            13px
            14px;

          border-radius: 14px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .1
            );

          background:
            rgba(
              0,
              0,
              0,
              .25
            );

          color: white;

          outline: none;
        }

        /* STATS */

        .statsGrid {
          display: grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );

          gap: 9px;

          margin-bottom: 12px;
        }

        .statCard {
          padding:
            14px
            10px;

          text-align: center;

          border-radius: 18px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );
        }

        .statCard span {
          display: block;

          font-size: 21px;
        }

        .statCard strong {
          display: block;

          margin:
            5px
            0
            2px;

          font-size: 19px;
        }

        .statCard small {
          color: #64748b;

          font-size: 10px;
        }

        /* NAV */

        .bottomNav {
          display: grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );

          gap: 6px;

          padding: 6px;

          margin-bottom: 12px;

          border-radius: 18px;

          background:
            rgba(
              255,
              255,
              255,
              .04
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );
        }

        .navButton {
          border: none;

          padding:
            9px
            5px;

          border-radius: 13px;

          background:
            transparent;

          color: #64748b;
        }

        .navButton span {
          display: block;

          font-size: 20px;
        }

        .navButton small {
          font-size: 10px;
        }

        .navButton.active {
          background:
            rgba(
              245,
              158,
              11,
              .15
            );

          color: #fbbf24;
        }

        /* CARDS */

        .card {
          padding: 19px;

          margin-bottom: 12px;

          border-radius: 22px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          box-shadow:
            0 15px 40px
            rgba(
              0,
              0,
              0,
              .12
            );
        }

        .sectionHeader {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          margin-bottom: 15px;
        }

        .sectionHeader h2 {
          margin: 0;

          font-size: 21px;

          letter-spacing:
            -.4px;
        }

        .sectionEmoji {
          font-size: 30px;
        }

        .smallAction {
          width: 40px;
          height: 40px;

          border: none;

          border-radius: 12px;

          background:
            #f59e0b;

          color: #111827;

          font-size: 21px;

          font-weight: 900;
        }

        /* INPUTS */

        input,
        select {
          width: 100%;

          padding:
            13px
            14px;

          border-radius: 13px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .1
            );

          background:
            #10161e;

          color: #f8fafc;

          outline: none;
        }

        input:focus,
        select:focus {
          border-color:
            rgba(
              245,
              158,
              11,
              .6
            );
        }

        .participantInput {
          display: grid;

          grid-template-columns:
            1fr
            52px;

          gap: 8px;
        }

        .primaryButton {
          border: none;

          border-radius: 13px;

          background:
            #f59e0b;

          color: #111827;

          font-size: 21px;
        }

        /* PEOPLE */

        .peopleGrid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              1fr
            );

          gap: 8px;

          margin-top: 12px;
        }

        .personChip {
          display: flex;

          align-items: center;

          gap: 9px;

          padding: 10px;

          border-radius: 15px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );
        }

        .avatar,
        .rankAvatar {
          display: grid;

          place-items: center;

          flex-shrink: 0;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f97316
            );

          color: #111827;

          font-weight: 900;
        }

        .avatar {
          width: 36px;
          height: 36px;
        }

        .personChip strong {
          display: block;

          font-size: 13px;
        }

        .personChip small {
          display: block;

          color: #64748b;

          font-size: 10px;

          margin-top: 3px;
        }

        /* QUICK */

        .quickGrid {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap: 9px;
        }

        .quickButton {
          min-height: 125px;

          display: flex;

          flex-direction:
            column;

          justify-content:
            center;

          align-items: center;

          border: none;

          border-radius: 18px;

          color: white;

          padding: 12px;
        }

        .quickButton span {
          font-size: 32px;

          margin-bottom: 7px;
        }

        .quickButton strong {
          font-size: 13px;
        }

        .quickButton small {
          margin-top: 3px;

          font-size: 10px;

          opacity: .65;
        }

        .quickButton.beer {
          background:
            linear-gradient(
              135deg,
              #b45309,
              #f59e0b
            );
        }

        .quickButton.challenge {
          background:
            linear-gradient(
              135deg,
              #be123c,
              #f43f5e
            );
        }

        .quickButton.ranking {
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #a855f7
            );
        }

        /* PARTY BANNER */

        .partyBanner {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 15px;

          padding: 18px;

          margin-bottom: 12px;

          border-radius: 21px;

          background:
            linear-gradient(
              135deg,
              rgba(
                236,
                72,
                153,
                .16
              ),
              rgba(
                124,
                58,
                237,
                .12
              )
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .07
            );
        }

        .partyBanner span {
          display: block;

          color: #f9a8d4;

          font-size: 10px;
          font-weight: 900;
        }

        .partyBanner strong {
          display: block;

          margin-top: 5px;

          font-size: 17px;
        }

        .partyBanner small {
          display: block;

          margin-top: 3px;

          color: #94a3b8;

          font-size: 11px;
        }

        .partyBanner button {
          border: none;

          padding:
            10px
            12px;

          border-radius: 12px;

          background:
            #f472b6;

          color: #111827;

          font-size: 11px;

          font-weight: 900;

          white-space: nowrap;
        }

        /* FORMS */

        .formBox {
          padding:
            14px;

          margin-bottom: 14px;

          border-radius: 17px;

          background:
            rgba(
              0,
              0,
              0,
              .2
            );
        }

        .formBox input,
        .formBox select {
          margin-bottom: 8px;
        }

        .formGrid {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap: 8px;
        }

        .fullButton {
          width: 100%;

          border: none;

          padding: 14px;

          margin-top: 5px;

          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f97316
            );

          color: #111827;

          font-weight: 900;
        }

        /* DRINKS */

        .drinkList {
          display: flex;

          flex-direction:
            column;

          gap: 8px;
        }

        .drinkItem {
          display: grid;

          grid-template-columns:
            42px
            1fr
            auto;

          gap: 10px;

          align-items: center;

          padding: 11px;

          border-radius: 16px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );
        }

        .drinkIcon {
          width: 42px;
          height: 42px;

          display: grid;

          place-items: center;

          border-radius: 13px;

          background:
            rgba(
              245,
              158,
              11,
              .13
            );

          font-size: 22px;
        }

        .drinkInfo strong {
          display: block;

          font-size: 13px;
        }

        .drinkInfo small {
          display: block;

          margin-top: 3px;

          color: #64748b;

          font-size: 10px;
        }

        .drinkInfo .assigned {
          color: #fbbf24;
        }

        .drinkRight {
          display: flex;

          flex-direction:
            column;

          align-items:
            flex-end;

          gap: 5px;
        }

        .drinkRight > strong {
          font-size: 13px;
        }

        .drinkRight select {
          width: 105px;

          padding:
            7px
            8px;

          font-size: 10px;

          margin: 0;
        }

        .deleteButton {
          border: none;

          background:
            transparent;

          padding: 3px;

          opacity: .65;
        }

        .moneyCard {
          padding: 20px;

          text-align: center;

          border-radius: 21px;

          margin-bottom: 12px;

          background:
            linear-gradient(
              135deg,
              rgba(
                34,
                197,
                94,
                .12
              ),
              rgba(
                16,
                185,
                129,
                .05
              )
            );

          border:
            1px solid
            rgba(
              34,
              197,
              94,
              .13
            );
        }

        .moneyCard span {
          display: block;

          color: #86efac;

          font-size: 10px;

          font-weight: 900;
        }

        .moneyCard strong {
          display: block;

          margin:
            5px
            0;

          font-size: 34px;
        }

        .moneyCard small {
          color: #64748b;
        }

        /* CHALLENGES */

        .challengeHero {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 15px;

          padding: 23px;

          margin-bottom: 10px;

          border-radius: 24px;

          background:
            linear-gradient(
              135deg,
              #881337,
              #be123c
            );
        }

        .challengeHero > div:first-child
        {
          flex: 1;
        }

        .challengeHero span {
          font-size: 10px;

          font-weight: 900;

          letter-spacing:
            1.2px;

          color: #fda4af;
        }

        .challengeHero h2 {
          margin:
            7px
            0
            3px;

          font-size: 27px;
        }

        .challengeHero p {
          margin: 0;

          color: #fecdd3;

          font-size: 12px;
        }

        .bigEmoji {
          font-size: 55px;
        }

        .challengeCreate {
          margin-bottom: 12px;

          background:
            linear-gradient(
              135deg,
              #f43f5e,
              #e11d48
            );

          color: white;
        }

        .formBox label,
        .card label {
          display: block;

          margin:
            5px
            0;

          color: #94a3b8;

          font-size: 11px;

          font-weight: 700;
        }

        .challengeCard {
          padding: 18px;

          margin-bottom: 11px;

          border-radius: 22px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .07
            );
        }

        .challengeTop {
          display: flex;

          justify-content:
            space-between;

          gap: 15px;
        }

        .challengeStatus {
          display: inline-block;

          margin-bottom: 7px;

          color: #fda4af;

          font-size: 9px;

          font-weight: 900;
        }

        .challengeTop h3 {
          margin: 0;

          font-size: 18px;
        }

        .challengeTop p {
          margin:
            6px
            0
            0;

          color: #94a3b8;

          font-size: 12px;
        }

        .pointsBadge {
          min-width: 60px;

          height: 60px;

          display: grid;

          place-items: center;

          align-content: center;

          border-radius: 16px;

          background:
            rgba(
              245,
              158,
              11,
              .13
            );

          color: #fbbf24;

          font-size: 18px;

          font-weight: 900;
        }

        .pointsBadge small {
          display: block;

          font-size: 8px;

          color: #94a3b8;
        }

        .voteInfo {
          margin:
            15px
            0
            8px;

          color: #94a3b8;

          font-size: 11px;
        }

        .optionList {
          display: flex;

          flex-direction:
            column;

          gap: 8px;
        }

        .voteOption {
          padding: 11px;

          border-radius: 14px;

          background:
            rgba(
              255,
              255,
              255,
              .04
            );
        }

        .voteOption.leader {
          border:
            1px solid
            rgba(
              245,
              158,
              11,
              .3
            );
        }

        .voteOptionTop {
          display: flex;

          justify-content:
            space-between;

          gap: 10px;

          font-size: 12px;
        }

        .voteOptionTop span {
          color: #fbbf24;

          font-weight: 900;
        }

        .progress {
          height: 5px;

          margin:
            8px
            0;

          overflow: hidden;

          border-radius: 99px;

          background:
            rgba(
              255,
              255,
              255,
              .06
            );
        }

        .progress div {
          height: 100%;

          border-radius: inherit;

          background:
            linear-gradient(
              90deg,
              #fbbf24,
              #f97316
            );
        }

        .voteOption select {
          margin: 0;

          padding: 8px;

          font-size: 10px;
        }

        .completeButton {
          width: 100%;

          margin-top: 12px;

          padding: 11px;

          border: none;

          border-radius: 12px;

          background:
            rgba(
              34,
              197,
              94,
              .12
            );

          color: #86efac;

          font-weight: 900;
        }

        .winnerBox {
          margin-top: 15px;

          padding: 17px;

          border-radius: 16px;

          background:
            rgba(
              34,
              197,
              94,
              .1
            );

          border:
            1px solid
            rgba(
              34,
              197,
              94,
              .18
            );

          text-align: center;
        }

        .winnerBox span {
          display: block;

          color: #86efac;

          font-size: 9px;

          font-weight: 900;
        }

        .winnerBox strong {
          display: block;

          margin:
            7px
            0;

          font-size: 20px;
        }

        .winnerBox p {
          margin: 0;

          color: #94a3b8;

          font-size: 11px;
        }

        /* RANKING */

        .rankingHero {
          padding: 25px;

          margin-bottom: 12px;

          border-radius: 24px;

          text-align: center;

          background:
            linear-gradient(
              135deg,
              #4c1d95,
              #7c3aed
            );
        }

        .rankingHero span {
          color: #ddd6fe;

          font-size: 10px;

          font-weight: 900;

          letter-spacing:
            1.4px;
        }

        .rankingHero h2 {
          margin:
            8px
            0
            5px;

          font-size: 24px;
        }

        .rankingHero p {
          margin: 0;

          color: #ddd6fe;

          font-size: 11px;
        }

        .rankingList {
          display: flex;

          flex-direction:
            column;

          gap: 8px;

          margin-bottom: 12px;
        }

        .rankCard {
          display: grid;

          grid-template-columns:
            35px
            43px
            1fr
            auto;

          gap: 9px;

          align-items: center;

          padding: 11px;

          border-radius: 17px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );
        }

        .rankCard.first {
          background:
            linear-gradient(
              135deg,
              rgba(
                245,
                158,
                11,
                .14
              ),
              rgba(
                249,
                115,
                22,
                .07
              )
            );

          border-color:
            rgba(
              245,
              158,
              11,
              .22
            );
        }

        .rankNumber {
          text-align: center;

          font-size: 19px;

          font-weight: 900;
        }

        .rankAvatar {
          width: 43px;
          height: 43px;
        }

        .rankInfo strong {
          display: block;

          font-size: 14px;
        }

        .rankInfo span {
          display: block;

          margin-top: 2px;

          color: #fbbf24;

          font-size: 10px;

          font-weight: 800;
        }

        .rankInfo small {
          display: block;

          margin-top: 4px;

          color: #64748b;

          font-size: 9px;
        }

        .rankPoints {
          text-align: right;
        }

        .rankPoints strong {
          display: block;

          color: #fbbf24;

          font-size: 20px;
        }

        .rankPoints small {
          color: #64748b;

          font-size: 8px;
        }

        .pointsExplanation {
          padding: 17px;

          border-radius: 19px;

          background:
            rgba(
              255,
              255,
              255,
              .04
            );
        }

        .pointsExplanation h3 {
          margin:
            0
            0
            10px;

          font-size: 15px;
        }

        .pointsExplanation div {
          display: flex;

          align-items: center;

          gap: 8px;

          padding: 9px 0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          font-size: 12px;
        }

        .pointsExplanation span {
          flex: 1;
        }

        .pointsExplanation strong {
          color: #fbbf24;
        }

        /* EMPTY */

        .empty {
          padding: 28px 15px;

          text-align: center;

          color: #64748b;
        }

        .empty span {
          display: block;

          font-size: 42px;

          margin-bottom: 7px;
        }

        .empty p {
          margin:
            0
            0
            3px;

          color: #94a3b8;

          font-size: 13px;
        }

        .empty small {
          font-size: 10px;
        }

        .bigEmpty {
          padding: 50px 20px;
        }

        .bigEmpty h3 {
          margin:
            0
            0
            5px;

          color: #cbd5e1;
        }

        /* LOADING */

        .loading {
          min-height: 100vh;

          display: flex;

          flex-direction:
            column;

          justify-content:
            center;

          align-items: center;

          text-align: center;

          padding: 20px;
        }

        .loadingEmoji {
          font-size: 65px;

          animation:
            pulse 1.2s
            infinite;
        }

        .loading h1 {
          margin:
            15px
            0
            5px;

          font-size: 22px;
        }

        .loading p {
          margin: 0;

          color: #64748b;
        }

        @keyframes pulse {
          0%,
          100% {
            transform:
              scale(1)
              rotate(-3deg);
          }

          50% {
            transform:
              scale(1.1)
              rotate(3deg);
          }
        }

        /* TOAST */

        .toast {
          position: fixed;

          z-index: 100;

          left: 50%;

          bottom: 20px;

          transform:
            translateX(-50%);

          width:
            min(
              calc(
                100% - 30px
              ),
              600px
            );

          padding:
            13px
            16px;

          border-radius: 15px;

          background:
            #161f2a;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .1
            );

          box-shadow:
            0 15px 40px
            rgba(
              0,
              0,
              0,
              .4
            );

          color: #fbbf24;

          text-align: center;

          font-size: 12px;

          font-weight: 700;
        }

        /* FOOTER */

        .footer {
          padding:
            30px
            10px
            10px;

          text-align: center;

          color: #475569;
        }

        .footer div {
          font-size: 25px;
        }

        .footer strong {
          display: block;

          margin-top: 5px;

          font-size: 11px;
        }

        .footer small {
          display: block;

          margin-top: 3px;

          font-size: 9px;
        }

        /* MOBILE */

        @media (
          max-width: 650px
        ) {

          .app {
            padding:
              12px
              12px
              35px;
          }

          .header {
            padding-bottom: 15px;
          }

          .brandIcon {
            width: 50px;
            height: 50px;

            font-size: 25px;
          }

          .brand h1 {
            font-size: 18px;
          }

          .brand p {
            font-size: 10px;
          }

          .headerBadge {
            font-size: 9px;
          }

          .eventHero {
            padding: 18px;
          }

          .eventHero h2 {
            font-size: 23px;
          }

          .beerEmoji {
            font-size: 42px;
          }

          .statsGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .peopleGrid {
            grid-template-columns:
              1fr;
          }

          .quickGrid {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

          .quickButton {
            min-height: 105px;
          }

          .quickButton span {
            font-size: 27px;
          }

          .quickButton strong {
            font-size: 11px;
          }

          .quickButton small {
            font-size: 9px;
          }

          .formGrid {
            grid-template-columns:
              1fr;
          }

          .drinkItem {
            grid-template-columns:
              38px
              1fr;
          }

          .drinkRight {
            grid-column:
              2;
            align-items:
              flex-start;
          }

          .drinkRight select {
            width: 100%;
          }

          .rankCard {
            grid-template-columns:
              30px
              38px
              1fr
              auto;
          }

          .rankAvatar {
            width: 38px;
            height: 38px;
          }

          .rankInfo small {
            font-size: 8px;
          }

          .challengeHero {
            padding: 19px;
          }

          .challengeHero h2 {
            font-size: 23px;
          }

          .bigEmoji {
            font-size: 45px;
          }

          .partyBanner {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .partyBanner button {
            width: 100%;
          }
        }

      `}</style>

    </main>
  );
}
