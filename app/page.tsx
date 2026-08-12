"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  invite_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  ranking_enabled?: boolean;
  show_points?: boolean;
  show_ranking?: boolean;
  show_promille?: boolean;
  show_statistics?: boolean;
  show_drink_amounts?: boolean;
  photo_required?: boolean;
  ai_recognition_enabled?: boolean;
  manual_entry_allowed?: boolean;
  cost_overview_enabled?: boolean;
  auto_split_costs?: boolean;
  team_mode?: boolean;
  show_photos?: boolean;
  show_costs?: boolean;
  privacy_mode?: boolean;
};

type Profile = {
  id: string;
  username: string;
  points: number;
  drinks_count: number;
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string;
  joined_via_code?: string | null;
  profile?: Profile | null;
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
  created_at?: string;
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
};

type Challenge = {
  id: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  points?: number | null;
  status?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  target_profile_id?: string | null;
  event_id?: string | null;
};

type ChallengeTemplate = {
  id: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  points?: number | null;
};

type RankingTitle = {
  id: string;
  title?: string | null;
  min_points?: number | null;
  max_points?: number | null;
};

type ChallengeVote = {
  id: string;
  challenge_id?: string | null;
  voter_profile_id?: string | null;
  target_profile_id?: string | null;
  vote?: string | null;
  created_at?: string | null;
};

type ChallengeResult = {
  id: string;
  challenge_id?: string | null;
  profile_id?: string | null;
  points?: number | null;
  result?: string | null;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeTemplates, setChallengeTemplates] = useState<
    ChallengeTemplate[]
  >([]);
  const [rankingTitles, setRankingTitles] = useState<RankingTitle[]>([]);
  const [challengeVotes, setChallengeVotes] = useState<ChallengeVote[]>([]);
  const [challengeResults, setChallengeResults] = useState<ChallengeResult[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] = useState("Bier");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  const [personName, setPersonName] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePoints, setChallengePoints] = useState("10");
  const [challengeCategory, setChallengeCategory] = useState("Lustig");

  const [showDrinkForm, setShowDrinkForm] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [showPeopleForm, setShowPeopleForm] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "overview" | "drinks" | "people" | "challenges" | "ranking"
  >("overview");

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("❌ Events konnten nicht geladen werden: " + error.message);
      return;
    }

    if (data) {
      setEvents(data);

      if (!eventId && data.length > 0) {
        setEventId(data[0].id);
      }
    }
  }

  async function loadProfiles() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("username", { ascending: true });

    if (data) {
      setProfiles(data);
    }
  }

  async function loadMembers() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("event_members")
      .select("*")
      .eq("event_id", eventId)
      .order("joined_at", { ascending: true });

    if (error) {
      setMessage("❌ Teilnehmer konnten nicht geladen werden.");
      return;
    }

    if (data) {
      setMembers(data);
    }
  }

  async function loadDrinks() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("❌ Getränke konnten nicht geladen werden.");
      return;
    }

    if (data) {
      setDrinks(data);
    }
  }

  async function loadChallenges() {
    if (!eventId) return;

    /*
      Wichtig:
      Die Challenge-Hilfstabellen werden hier NICHT
      pauschal nach event_id gefiltert.
      Dadurch vermeiden wir den bisherigen Fehler:
      "column event_id does not exist".
    */

    const { data: challengeData } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });

    if (challengeData) {
      const filtered = challengeData.filter(
        (challenge: Challenge) =>
          !challenge.event_id || challenge.event_id === eventId
      );

      setChallenges(filtered);
    }

    const { data: templateData } = await supabase
      .from("challenge_templates")
      .select("*")
      .order("title", { ascending: true });

    if (templateData) {
      setChallengeTemplates(templateData);
    }

    const { data: titleData } = await supabase
      .from("ranking_titles")
      .select("*")
      .order("min_points", { ascending: true });

    if (titleData) {
      setRankingTitles(titleData);
    }

    const { data: voteData } = await supabase
      .from("challenge_votes")
      .select("*")
      .order("created_at", { ascending: false });

    if (voteData) {
      setChallengeVotes(voteData);
    }

    const { data: resultData } = await supabase
      .from("challenge_results")
      .select("*");

    if (resultData) {
      setChallengeResults(resultData);
    }
  }

  async function loadAll() {
    setLoading(true);

    await Promise.all([
      loadEvents(),
      loadProfiles(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    async function loadEventData() {
      await Promise.all([
        loadMembers(),
        loadDrinks(),
        loadChallenges(),
      ]);
    }

    loadEventData();
  }, [eventId]);

  const currentEvent = useMemo(
    () => events.find((event) => event.id === eventId),
    [events, eventId]
  );

  const eventProfiles = useMemo(() => {
    return members
      .map((member) => {
        const profile =
          member.profile ||
          profiles.find((p) => p.id === member.profile_id);

        return profile
          ? {
              ...profile,
              memberId: member.id,
            }
          : null;
      })
      .filter(Boolean) as (Profile & { memberId: string })[];
  }, [members, profiles]);

  const totalLiters = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        Number(drink.liters ?? drink.menge ?? 0) *
          Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const totalCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum + Number(drink.preis ?? 0) * Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const totalPoints = useMemo(() => {
    return eventProfiles.reduce(
      (sum, profile) => sum + Number(profile.points ?? 0),
      0
    );
  }, [eventProfiles]);

  const costPerPerson =
    eventProfiles.length > 0 ? totalCost / eventProfiles.length : 0;

  const ranking = useMemo(() => {
    return [...eventProfiles].sort(
      (a, b) => Number(b.points ?? 0) - Number(a.points ?? 0)
    );
  }, [eventProfiles]);

  function getRankingTitle(points: number) {
    const matching = rankingTitles
      .filter((title) => {
        const min = Number(title.min_points ?? 0);
        const max =
          title.max_points === null ||
          title.max_points === undefined
            ? Infinity
            : Number(title.max_points);

        return points >= min && points <= max;
      })
      .sort(
        (a, b) =>
          Number(b.min_points ?? 0) - Number(a.min_points ?? 0)
      );

    if (matching.length > 0) {
      return matching[0].title || "Legende";
    }

    if (points >= 100) return "🍻 Zapfhahn-Legende";
    if (points >= 50) return "🔥 Feierabend-Profi";
    if (points >= 25) return "🍺 Bierkenner";
    if (points >= 10) return "😎 Stimmungsmacher";
    return "🌱 Anfänger";
  }

  function getMedal(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  }

  function clearMessageLater() {
    setTimeout(() => {
      setMessage("");
    }, 3500);
  }

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

    const liters = Number(drinkLiters);
    const alcohol = Number(drinkAlcohol);
    const price = Number(drinkPrice);

    const { error } = await supabase.from("drinks").insert({
      event_id: eventId,
      drink_name: drinkName.trim(),
      getraenk: drinkName.trim(),
      brand: drinkBrand.trim() || null,
      marke: drinkBrand.trim() || null,
      category: drinkCategory,
      liters,
      menge: liters,
      alcohol_percent: alcohol,
      alkohol: alcohol,
      preis: price,
      quantity: 1,
      shared_cost: true,
    });

    if (error) {
      setMessage("❌ Getränk konnte nicht gespeichert werden: " + error.message);
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");

    await loadDrinks();

    setMessage("🍺 Getränk gespeichert!");
    clearMessageLater();
  }

  async function addPerson() {
    setMessage("");

    if (!personName.trim()) {
      setMessage("❌ Bitte einen Namen eingeben.");
      return;
    }

    const existing = profiles.find(
      (profile) =>
        profile.username.toLowerCase() ===
        personName.trim().toLowerCase()
    );

    let profileId = existing?.id;

    if (!profileId) {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          username: personName.trim(),
          points: 0,
          drinks_count: 0,
          role: "member",
        })
        .select()
        .single();

      if (error) {
        setMessage(
          "❌ Teilnehmer konnte nicht erstellt werden: " +
            error.message
        );
        return;
      }

      profileId = data.id;

      await loadProfiles();
    }

    const alreadyMember = members.some(
      (member) => member.profile_id === profileId
    );

    if (alreadyMember) {
      setMessage("❌ Dieser Teilnehmer ist bereits dabei.");
      return;
    }

    const { error } = await supabase.from("event_members").insert({
      event_id: eventId,
      profile_id: profileId,
      joined_via_code: currentEvent?.invite_code || null,
    });

    if (error) {
      setMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message
      );
      return;
    }

    setPersonName("");

    await loadMembers();

    setMessage("👤 Teilnehmer hinzugefügt!");
    clearMessageLater();
  }

  async function removePerson(memberId: string) {
    if (!confirm("Teilnehmer wirklich aus diesem Event entfernen?")) {
      return;
    }

    const { error } = await supabase
      .from("event_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      setMessage("❌ Teilnehmer konnte nicht entfernt werden.");
      return;
    }

    await loadMembers();

    setMessage("👋 Teilnehmer entfernt.");
    clearMessageLater();
  }

  async function createChallenge() {
    if (!eventId) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    if (!challengeTitle.trim()) {
      setMessage("❌ Bitte eine Challenge eingeben.");
      return;
    }

    /*
      Wir versuchen nur Felder zu verwenden,
      die für die Challenge-Tabelle sinnvoll sind.
      event_id wird nur gesetzt, wenn die Tabelle dieses Feld besitzt.
    */

    const payload: Record<string, unknown> = {
      title: challengeTitle.trim(),
      description: challengeDescription.trim() || null,
      category: challengeCategory,
      points: Number(challengePoints),
      status: "open",
    };

    const { data, error } = await supabase
      .from("challenges")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setMessage(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    if (data) {
      setChallenges((old) => [data, ...old]);
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");
    setChallengeCategory("Lustig");
    setShowChallengeForm(false);

    setMessage("🎯 Challenge erstellt!");
    clearMessageLater();
  }

  async function createChallengeFromTemplate(
    template: ChallengeTemplate
  ) {
    const payload: Record<string, unknown> = {
      title: template.title || "Neue Challenge",
      description: template.description || null,
      category: template.category || "Lustig",
      points: Number(template.points ?? 10),
      status: "open",
    };

    const { data, error } = await supabase
      .from("challenges")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setMessage(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    if (data) {
      setChallenges((old) => [data, ...old]);
    }

    setMessage("🎯 Challenge aus Vorlage erstellt!");
    clearMessageLater();
  }

  async function voteForChallenge(
    challengeId: string,
    targetProfileId: string,
    vote: string
  ) {
    /*
      Abstimmung:
      Eine Stimme wird in challenge_votes gespeichert.
      Die Tabelle wird bewusst NICHT mit event_id angesprochen.
    */

    const { error } = await supabase
      .from("challenge_votes")
      .insert({
        challenge_id: challengeId,
        target_profile_id: targetProfileId,
        vote,
      });

    if (error) {
      setMessage(
        "❌ Abstimmung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    const { data } = await supabase
      .from("challenge_votes")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setChallengeVotes(data);
    }

    setMessage("🗳️ Stimme abgegeben!");
    clearMessageLater();
  }

  async function completeChallenge(
    challenge: Challenge,
    profileId: string
  ) {
    const points = Number(challenge.points ?? 10);

    const { error } = await supabase.from("challenge_results").insert({
      challenge_id: challenge.id,
      profile_id: profileId,
      points,
      result: "completed",
    });

    if (error) {
      setMessage(
        "❌ Challenge-Ergebnis konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    const profile = profiles.find((p) => p.id === profileId);

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          points: Number(profile.points ?? 0) + points,
        })
        .eq("id", profileId);
    }

    await loadProfiles();

    setMessage(`🏆 Challenge geschafft! +${points} Punkte`);
    clearMessageLater();
  }

  async function createEvent() {
    const title = prompt("Name des neuen Events:");

    if (!title?.trim()) return;

    const inviteCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: title.trim(),
        invite_code: inviteCode,
        is_active: true,
        ranking_enabled: true,
        show_points: true,
        show_ranking: true,
        show_promille: false,
        show_statistics: true,
        show_drink_amounts: true,
        manual_entry_allowed: true,
        cost_overview_enabled: true,
        auto_split_costs: true,
        team_mode: false,
        show_photos: true,
        show_costs: true,
        privacy_mode: false,
      })
      .select()
      .single();

    if (error) {
      setMessage("❌ Event konnte nicht erstellt werden: " + error.message);
      return;
    }

    if (data) {
      setEvents((old) => [data, ...old]);
      setEventId(data.id);
    }

    setMessage("📅 Neues Event erstellt!");
    clearMessageLater();
  }

  const currentMemberCount = eventProfiles.length;

  return (
    <main className="page">
      <div className="backgroundGlow glowOne" />
      <div className="backgroundGlow glowTwo" />

      <div className="app">

        <header className="hero">
          <div className="heroLogo">🍻</div>

          <div className="heroText">
            <div className="eyebrow">
              DEINE EVENT-ZENTRALE
            </div>

            <h1>
              Güstener
              <br />
              <span>Zapfhahn Zentrale</span>
            </h1>

            <p>
              Getränke. Challenges. Punkte.
              <br />
              Und natürlich jede Menge Quatsch.
            </p>
          </div>

          <button
            className="newEventButton"
            onClick={createEvent}
          >
            ＋ Event
          </button>
        </header>

        <section className="eventSelector">
          <div>
            <label>AKTUELLES EVENT</label>

            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="">
                Event auswählen
              </option>

              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          {currentEvent?.invite_code && (
            <div className="inviteCode">
              <small>CODE</small>
              <strong>{currentEvent.invite_code}</strong>
            </div>
          )}
        </section>

        {loading ? (
          <div className="loading">
            <div className="spinner">🍺</div>
            <p>Zapfhahn wird gestartet...</p>
          </div>
        ) : (
          <>
            <section className="statsGrid">
              <div className="statCard">
                <span>🍺</span>
                <strong>{drinks.length}</strong>
                <small>GETRÄNKE</small>
              </div>

              <div className="statCard">
                <span>💧</span>
                <strong>{totalLiters.toFixed(1)}</strong>
                <small>LITER</small>
              </div>

              <div className="statCard">
                <span>👥</span>
                <strong>{currentMemberCount}</strong>
                <small>TEILNEHMER</small>
              </div>

              <div className="statCard">
                <span>🏆</span>
                <strong>{totalPoints}</strong>
                <small>PUNKTE</small>
              </div>
            </section>

            <nav className="tabs">
              <button
                className={activeTab === "overview" ? "active" : ""}
                onClick={() => setActiveTab("overview")}
              >
                🏠 Übersicht
              </button>

              <button
                className={activeTab === "drinks" ? "active" : ""}
                onClick={() => setActiveTab("drinks")}
              >
                🍺 Getränke
              </button>

              <button
                className={activeTab === "people" ? "active" : ""}
                onClick={() => setActiveTab("people")}
              >
                👥 Leute
              </button>

              <button
                className={activeTab === "challenges" ? "active" : ""}
                onClick={() => setActiveTab("challenges")}
              >
                🎯 Challenges
              </button>

              <button
                className={activeTab === "ranking" ? "active" : ""}
                onClick={() => setActiveTab("ranking")}
              >
                🏆 Ranking
              </button>
            </nav>

            {activeTab === "overview" && (
              <div className="content">

                <section className="welcomeCard">
                  <div>
                    <span className="miniLabel">
                      HEUTE WIRD NICHT GEZÄHLT
                    </span>

                    <h2>
                      {currentEvent?.title ||
                        "Willkommen im Zapfhahn"}
                    </h2>

                    <p>
                      Hier läuft alles zusammen:
                      Getränke, Teilnehmer, Challenges
                      und das völlig unnötig wichtige Ranking.
                    </p>
                  </div>

                  <div className="bigBeer">
                    🍺
                  </div>
                </section>

                <div className="quickGrid">

                  <button
                    className="quickCard"
                    onClick={() => {
                      setActiveTab("people");
                      setShowPeopleForm(true);
                    }}
                  >
                    <span>👥</span>
                    <strong>Leute hinzufügen</strong>
                    <small>
                      Wer ist heute dabei?
                    </small>
                  </button>

                  <button
                    className="quickCard"
                    onClick={() => {
                      setActiveTab("drinks");
                      setShowDrinkForm(true);
                    }}
                  >
                    <span>🍺</span>
                    <strong>Getränk eintragen</strong>
                    <small>
                      Bier, Schnaps oder was auch immer
                    </small>
                  </button>

                  <button
                    className="quickCard"
                    onClick={() => {
                      setActiveTab("challenges");
                      setShowChallengeForm(true);
                    }}
                  >
                    <span>🎯</span>
                    <strong>Challenge starten</strong>
                    <small>
                      Punkte sammeln
                    </small>
                  </button>

                  <button
                    className="quickCard"
                    onClick={() => setActiveTab("ranking")}
                  >
                    <span>🏆</span>
                    <strong>Ranking ansehen</strong>
                    <small>
                      Wer führt?
                    </small>
                  </button>

                </div>

                <section className="card">
                  <div className="sectionHeader">
                    <div>
                      <span className="miniLabel">
                        AKTUELLER STAND
                      </span>
                      <h2>🍻 Was geht gerade ab?</h2>
                    </div>
                  </div>

                  {ranking.length === 0 ? (
                    <div className="empty">
                      <span>🍺</span>
                      <p>
                        Noch ist hier niemand unterwegs.
                        <br />
                        Das können wir ändern.
                      </p>
                    </div>
                  ) : (
                    <div className="miniRanking">
                      {ranking.slice(0, 5).map((person, index) => (
                        <div
                          className="miniRank"
                          key={person.id}
                        >
                          <strong>
                            {getMedal(index)}
                          </strong>

                          <span>
                            {person.username}
                          </span>

                          <small>
                            {getRankingTitle(
                              Number(person.points ?? 0)
                            )}
                          </small>

                          <b>
                            {Number(person.points ?? 0)}
                          </b>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="card">
                  <div className="sectionHeader">
                    <div>
                      <span className="miniLabel">
                        KOSTEN
                      </span>
                      <h2>💶 Die Rechnung</h2>
                    </div>
                  </div>

                  <div className="moneyBox">
                    <strong>
                      {totalCost.toFixed(2)} €
                    </strong>

                    <span>
                      Gesamtkosten
                    </span>
                  </div>

                  <div className="costRows">
                    <div>
                      <span>👥 Teilnehmer</span>
                      <b>{currentMemberCount}</b>
                    </div>

                    <div>
                      <span>💶 Pro Person</span>
                      <b>
                        {costPerPerson.toFixed(2)} €
                      </b>
                    </div>

                    <div>
                      <span>💧 Gesamtmenge</span>
                      <b>
                        {totalLiters.toFixed(1)} L
                      </b>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "drinks" && (
              <div className="content">

                <section className="card">

                  <div className="sectionHeader">
                    <div>
                      <span className="miniLabel">
                        GETRÄNKE
                      </span>
                      <h2>🍺 Was wurde vernichtet?</h2>
                    </div>

                    <button
                      className="primaryButton"
                      onClick={() =>
                        setShowDrinkForm(!showDrinkForm)
                      }
                    >
                      ＋ Getränk
                    </button>
                  </div>

                  {showDrinkForm && (
                    <div className="formBox">

                      <input
                        placeholder="Getränk, z.B. Krombacher"
                        value={drinkName}
                        onChange={(e) =>
                          setDrinkName(e.target.value)
                        }
                      />

                      <input
                        placeholder="Marke (optional)"
                        value={drinkBrand}
                        onChange={(e) =>
                          setDrinkBrand(e.target.value)
                        }
                      />

                      <select
                        value={drinkCategory}
                        onChange={(e) =>
                          setDrinkCategory(e.target.value)
                        }
                      >
                        <option>Bier</option>
                        <option>Wein</option>
                        <option>Sekt</option>
                        <option>Schnaps</option>
                        <option>Longdrink</option>
                        <option>Softdrink</option>
                        <option>Shot</option>
                        <option>Sonstiges</option>
                      </select>

                      <div className="formGrid3">

                        <input
                          type="number"
                          step="0.1"
                          placeholder="Liter"
                          value={drinkLiters}
                          onChange={(e) =>
                            setDrinkLiters(e.target.value)
                          }
                        />

                        <input
                          type="number"
                          step="0.1"
                          placeholder="Alkohol %"
                          value={drinkAlcohol}
                          onChange={(e) =>
                            setDrinkAlcohol(e.target.value)
                          }
                        />

                        <input
                          type="number"
                          step="0.01"
                          placeholder="Preis €"
                          value={drinkPrice}
                          onChange={(e) =>
                            setDrinkPrice(e.target.value)
                          }
                        />

                      </div>

                      <button
                        className="saveButton"
                        onClick={saveDrink}
                      >
                        🍻 Getränk speichern
                      </button>
                    </div>
                  )}

                  {drinks.length === 0 ? (
                    <div className="empty">
                      <span>🍺</span>
                      <p>
                        Noch keine Getränke.
                      </p>
                    </div>
                  ) : (
                    <div className="drinkList">

                      {drinks.map((drink) => {

                        const name =
                          drink.drink_name ||
                          drink.getraenk ||
                          "Getränk";

                        const liters =
                          Number(
                            drink.liters ??
                              drink.menge ??
                              0
                          );

                        const alcohol =
                          Number(
                            drink.alcohol_percent ??
                              drink.alkohol ??
                              0
                          );

                        const price =
                          Number(
                            drink.preis ?? 0
                          );

                        return (
                          <div
                            className="drinkRow"
                            key={drink.id}
                          >
                            <div className="drinkIcon">
                              🍺
                            </div>

                            <div className="drinkInfo">
                              <strong>
                                {name}
                              </strong>

                              <small>
                                {drink.brand ||
                                  drink.marke ||
                                  drink.category ||
                                  "Getränk"}
                                {" · "}
                                {liters.toFixed(1)} L
                                {" · "}
                                {alcohol.toFixed(1)} %
                              </small>
                            </div>

                            <strong className="price">
                              {price.toFixed(2)} €
                            </strong>
                          </div>
                        );
                      })}

                    </div>
                  )}

                </section>
              </div>
            )}

            {activeTab === "people" && (
              <div className="content">

                <section className="card">

                  <div className="sectionHeader">
                    <div>
                      <span className="miniLabel">
                        TEILNEHMER
                      </span>
                      <h2>👥 Wer ist dabei?</h2>
                    </div>

                    <button
                      className="primaryButton"
                      onClick={() =>
                        setShowPeopleForm(!showPeopleForm)
                      }
                    >
                      ＋ Person
                    </button>
                  </div>

                  {showPeopleForm && (
                    <div className="formBox">

                      <input
                        placeholder="Name"
                        value={personName}
                        onChange={(e) =>
                          setPersonName(e.target.value)
                        }
                      />

                      <button
                        className="saveButton"
                        onClick={addPerson}
                      >
                        👤 Teilnehmer hinzufügen
                      </button>

                    </div>
                  )}

                  {eventProfiles.length === 0 ? (
                    <div className="empty">
                      <span>👥</span>
                      <p>
                        Noch niemand dabei.
                      </p>
                    </div>
                  ) : (
                    <div className="peopleList">

                      {eventProfiles.map((person) => (
                        <div
                          className="personRow"
                          key={person.id}
                        >

                          <div className="avatar">
                            {person.username
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="personInfo">
                            <strong>
                              {person.username}
                            </strong>

                            <small>
                              {getRankingTitle(
                                Number(person.points ?? 0)
                              )}
                            </small>
                          </div>

                          <div className="personPoints">
                            <b>
                              {Number(
                                person.points ?? 0
                              )}
                            </b>

                            <small>
                              Punkte
                            </small>
                          </div>

                          <button
                            className="deleteButton"
                            onClick={() =>
                              removePerson(person.memberId)
                            }
                          >
                            ×
                          </button>

                        </div>
                      ))}

                    </div>
                  )}

                </section>
              </div>
            )}

            {activeTab === "challenges" && (
              <div className="content">

                <section className="challengeHero">
                  <div>
                    <span className="miniLabel">
                      CHAOS-MODUS
                    </span>

                    <h2>
                      🎯 Zeit für eine Challenge
                    </h2>

                    <p>
                      Andere bestimmen.
                      Einer muss es machen.
                      Alle bekommen Punkte.
                    </p>
                  </div>

                  <div className="challengeEmoji">
                    🤪
                  </div>
                </section>

                <section className="card">

                  <div className="sectionHeader">
                    <div>
                      <span className="miniLabel">
                        CHALLENGES
                      </span>

                      <h2>
                        🎯 Aktuelle Aufgaben
                      </h2>
                    </div>

                    <button
                      className="primaryButton"
                      onClick={() =>
                        setShowChallengeForm(
                          !showChallengeForm
                        )
                      }
                    >
                      ＋ Challenge
                    </button>
                  </div>

                  {showChallengeForm && (
                    <div className="formBox">

                      <input
                        placeholder="Challenge"
                        value={challengeTitle}
                        onChange={(e) =>
                          setChallengeTitle(
                            e.target.value
                          )
                        }
                      />

                      <textarea
                        placeholder="Was muss gemacht werden?"
                        value={challengeDescription}
                        onChange={(e) =>
                          setChallengeDescription(
                            e.target.value
                          )
                        }
                      />

                      <div className="formGrid2">

                        <select
                          value={challengeCategory}
                          onChange={(e) =>
                            setChallengeCategory(
                              e.target.value
                            )
                          }
                        >
                          <option>Lustig</option>
                          <option>Mutprobe</option>
                          <option>Geschicklichkeit</option>
                          <option>Trinken</option>
                          <option>Peinlich</option>
                          <option>Team</option>
                          <option>Sonstiges</option>
                        </select>

                        <input
                          type="number"
                          min="1"
                          value={challengePoints}
                          onChange={(e) =>
                            setChallengePoints(
                              e.target.value
                            )
                          }
                          placeholder="Punkte"
                        />

                      </div>

                      <button
                        className="saveButton"
                        onClick={createChallenge}
                      >
                        🎯 Challenge erstellen
                      </button>

                    </div>
                  )}

                  {challengeTemplates.length > 0 && (
                    <div className="templates">

                      <h3>
                        ⚡ Schnellstart
                      </h3>

                      <div className="templateGrid">

                        {challengeTemplates
                          .slice(0, 6)
                          .map((template) => (
                            <button
                              key={template.id}
                              className="template"
                              onClick={() =>
                                createChallengeFromTemplate(
                                  template
                                )
                              }
                            >
                              <strong>
                                {template.title}
                              </strong>

                              <small>
                                +
                                {Number(
                                  template.points ?? 10
                                )} Punkte
                              </small>
                            </button>
                          ))}

                      </div>
                    </div>
                  )}

                  {challenges.length === 0 ? (
                    <div className="empty">
                      <span>🎯</span>
                      <p>
                        Noch keine Challenge.
                        <br />
                        Sei nicht langweilig.
                      </p>
                    </div>
                  ) : (
                    <div className="challengeList">

                      {challenges.map((challenge) => {

                        const points =
                          Number(
                            challenge.points ?? 10
                          );

                        const votesForChallenge =
                          challengeVotes.filter(
                            (vote) =>
                              vote.challenge_id ===
                              challenge.id
                          );

                        return (
                          <div
                            className="challengeCard"
                            key={challenge.id}
                          >

                            <div className="challengeTop">

                              <div className="challengeBadge">
                                🎯
                              </div>

                              <div>
                                <strong>
                                  {challenge.title ||
                                    "Challenge"}
                                </strong>

                                <small>
                                  {challenge.category ||
                                    "Lustig"}
                                  {" · "}
                                  +{points} Punkte
                                </small>
                              </div>

                            </div>

                            <p>
                              {challenge.description ||
                                "Diese Challenge wartet auf ein Opfer."}
                            </p>

                            {eventProfiles.length > 0 && (
                              <div className="voteBox">

                                <strong>
                                  🗳️ Wer soll ran?
                                </strong>

                                <div className="voteGrid">

                                  {eventProfiles.map(
                                    (person) => (
                                      <button
                                        key={
                                          person.id
                                        }
                                        onClick={() =>
                                          voteForChallenge(
                                            challenge.id,
                                            person.id,
                                            "dafür"
                                          )
                                        }
                                      >
                                        👉{" "}
                                        {
                                          person.username
                                        }
                                      </button>
                                    )
                                  )}

                                </div>

                                {votesForChallenge
                                  .length > 0 && (
                                  <small>
                                    {
                                      votesForChallenge.length
                                    }{" "}
                                    Stimme(n)
                                    abgegeben
                                  </small>
                                )}

                              </div>
                            )}

                            {eventProfiles.length > 0 && (
                              <div className="completeBox">

                                <strong>
                                  🏆 Challenge geschafft?
                                </strong>

                                <div className="voteGrid">

                                  {eventProfiles.map(
                                    (person) => (
                                      <button
                                        key={
                                          "complete-" +
                                          person.id
                                        }
                                        onClick={() =>
                                          completeChallenge(
                                            challenge,
                                            person.id
                                          )
                                        }
                                      >
                                        ✅{" "}
                                        {
                                          person.username
                                        }
                                      </button>
                                    )
                                  )}

                                </div>

                              </div>
                            )}

                          </div>
                        );
                      })}

                    </div>
                  )}

                </section>
              </div>
            )}

            {activeTab === "ranking" && (
              <div className="content">

                <section className="rankingHero">

                  <span>
                    🏆
                  </span>

                  <div>
                    <small>
                      DIE UNNÖTIGSTE
                      WICHTIGE LISTE DES ABENDS
                    </small>

                    <h2>
                      Wer ist die Legende?
                    </h2>
                  </div>

                </section>

                <section className="card">

                  {ranking.length === 0 ? (
                    <div className="empty">
                      <span>🏆</span>
                      <p>
                        Das Podium wartet noch.
                      </p>
                    </div>
                  ) : (
                    <div className="rankingList">

                      {ranking.map((person, index) => (

                        <div
                          className={
                            "rankingRow " +
                            (index < 3
                              ? "topRank"
                              : "")
                          }
                          key={person.id}
                        >

                          <div className="rankNumber">
                            {getMedal(index)}
                          </div>

                          <div className="rankAvatar">
                            {person.username
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="rankInfo">
                            <strong>
                              {person.username}
                            </strong>

                            <small>
                              {getRankingTitle(
                                Number(
                                  person.points ?? 0
                                )
                              )}
                            </small>
                          </div>

                          <div className="rankPoints">
                            <b>
                              {Number(
                                person.points ?? 0
                              )}
                            </b>

                            <small>
                              Punkte
                            </small>
                          </div>

                        </div>

                      ))}

                    </div>
                  )}

                </section>

                <section className="card">

                  <div className="sectionHeader">
                    <div>
                      <span className="miniLabel">
                        TITEL
                      </span>

                      <h2>
                        😎 Wer bist du heute?
                      </h2>
                    </div>
                  </div>

                  <div className="titleGrid">

                    {[
                      "🌱 Anfänger",
                      "😎 Stimmungsmacher",
                      "🍺 Bierkenner",
                      "🔥 Feierabend-Profi",
                      "👑 Zapfhahn-König",
                      "🍻 Zapfhahn-Legende",
                    ].map((title) => (
                      <div
                        className="funTitle"
                        key={title}
                      >
                        {title}
                      </div>
                    ))}

                  </div>

                </section>
              </div>
            )}
          </>
        )}

        {message && (
          <div className="toast">
            {message}
          </div>
        )}

        <footer>
          <strong>
            🍻 Güstener Zapfhahn Zentrale
          </strong>

          <small>
            Dein Event. Deine Getränke.
            Dein Chaos.
          </small>
        </footer>

      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #07090d;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          background:
            radial-gradient(
              circle at 20% 0%,
              rgba(245, 158, 11, 0.13),
              transparent 35%
            ),
            radial-gradient(
              circle at 90% 20%,
              rgba(34, 197, 94, 0.08),
              transparent 30%
            ),
            #07090d;
          color: #fff;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          overflow-x: hidden;
        }

        .backgroundGlow {
          position: fixed;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          opacity: 0.12;
        }

        .glowOne {
          background: #f59e0b;
          top: -150px;
          left: -100px;
        }

        .glowTwo {
          background: #22c55e;
          right: -150px;
          top: 40%;
        }

        .app {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          padding: 20px;
          position: relative;
          z-index: 1;
        }

        .hero {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 0 28px;
        }

        .heroLogo {
          width: 76px;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          background:
            linear-gradient(
              145deg,
              #fbbf24,
              #f59e0b
            );
          font-size: 42px;
          box-shadow:
            0 12px 40px
              rgba(245, 158, 11, 0.22);
          flex-shrink: 0;
        }

        .heroText {
          flex: 1;
        }

        .eyebrow,
        .miniLabel {
          color: #fbbf24;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.8px;
        }

        h1 {
          margin: 3px 0 7px;
          font-size: clamp(28px, 5vw, 46px);
          line-height: 0.98;
          letter-spacing: -1.5px;
        }

        h1 span {
          color: #fbbf24;
        }

        .hero p {
          margin: 0;
          color: #8d98a6;
          line-height: 1.5;
        }

        .newEventButton {
          background: #fff;
          color: #111;
          border: none;
          border-radius: 14px;
          padding: 12px 16px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s;
        }

        .newEventButton:hover,
        .primaryButton:hover,
        .saveButton:hover,
        .quickCard:hover,
        .template:hover {
          transform: translateY(-2px);
        }

        .eventSelector {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 15px;
          padding: 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 14px;
        }

        .eventSelector > div:first-child {
          flex: 1;
        }

        label {
          display: block;
          color: #7f8996;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.4px;
          margin-bottom: 7px;
        }

        select,
        input,
        textarea {
          width: 100%;
          border: 1px solid #29313b;
          background: #10151c;
          color: white;
          border-radius: 13px;
          padding: 13px 14px;
          outline: none;
          font-size: 14px;
        }

        textarea {
          min-height: 90px;
          resize: vertical;
        }

        select:focus,
        input:focus,
        textarea:focus {
          border-color: #f59e0b;
        }

        .eventSelector select {
          margin: 0;
        }

        .inviteCode {
          text-align: center;
          min-width: 90px;
          padding: 10px 14px;
          border-radius: 13px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .inviteCode small,
        .inviteCode strong {
          display: block;
        }

        .inviteCode small {
          color: #8e99a5;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .inviteCode strong {
          color: #fbbf24;
          margin-top: 3px;
          letter-spacing: 2px;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .statCard {
          text-align: center;
          padding: 15px 10px;
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .statCard span {
          font-size: 22px;
        }

        .statCard strong,
        .statCard small {
          display: block;
        }

        .statCard strong {
          margin-top: 3px;
          font-size: 21px;
        }

        .statCard small {
          color: #778290;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .tabs {
          display: flex;
          gap: 6px;
          padding: 6px;
          background: #0d1117;
          border: 1px solid #1d242d;
          border-radius: 16px;
          margin-bottom: 14px;
          overflow-x: auto;
        }

        .tabs button {
          border: none;
          background: transparent;
          color: #7f8995;
          padding: 11px 13px;
          border-radius: 11px;
          font-weight: 800;
          white-space: nowrap;
          cursor: pointer;
        }

        .tabs button.active {
          background: #f59e0b;
          color: #111;
        }

        .content {
          display: grid;
          gap: 14px;
        }

        .welcomeCard,
        .challengeHero,
        .rankingHero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px;
          border-radius: 22px;
          background:
            linear-gradient(
              135deg,
              rgba(245, 158, 11, 0.16),
              rgba(255, 255, 255, 0.04)
            );
          border: 1px solid rgba(245, 158, 11, 0.18);
        }

        .welcomeCard h2,
        .challengeHero h2,
        .rankingHero h2 {
          margin: 5px 0;
          font-size: 27px;
        }

        .welcomeCard p,
        .challengeHero p {
          margin: 0;
          color: #9ba5b1;
          line-height: 1.5;
        }

        .bigBeer,
        .challengeEmoji {
          font-size: 70px;
          filter: drop-shadow(
            0 15px 25px rgba(0, 0, 0, 0.25)
          );
        }

        .quickGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .quickCard {
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.045);
          color: white;
          border-radius: 18px;
          padding: 18px;
          text-align: left;
          cursor: pointer;
          transition: 0.2s;
        }

        .quickCard span {
          display: block;
          font-size: 28px;
          margin-bottom: 12px;
        }

        .quickCard strong,
        .quickCard small {
          display: block;
        }

        .quickCard strong {
          font-size: 14px;
        }

        .quickCard small {
          color: #7f8996;
          margin-top: 5px;
          line-height: 1.4;
        }

        .card {
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.075);
          border-radius: 21px;
          padding: 20px;
        }

        .sectionHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 15px;
        }

        .sectionHeader h2 {
          margin: 4px 0 0;
          font-size: 22px;
        }

        .primaryButton {
          border: none;
          background: #f59e0b;
          color: #111;
          border-radius: 12px;
          padding: 11px 14px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s;
          white-space: nowrap;
        }

        .formBox {
          display: grid;
          gap: 9px;
          background: rgba(0, 0, 0, 0.18);
          padding: 15px;
          border-radius: 16px;
          margin-bottom: 15px;
        }

        .formGrid3,
        .formGrid2 {
          display: grid;
          gap: 9px;
        }

        .formGrid3 {
          grid-template-columns: repeat(3, 1fr);
        }

        .formGrid2 {
          grid-template-columns: 1fr 1fr;
        }

        .saveButton {
          border: none;
          background: #fbbf24;
          color: #111;
          border-radius: 13px;
          padding: 13px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s;
        }

        .drinkList,
        .peopleList,
        .rankingList,
        .challengeList {
          display: grid;
          gap: 8px;
        }

        .drinkRow {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.035);
          border-radius: 14px;
        }

        .drinkIcon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #181f27;
          border-radius: 12px;
          font-size: 21px;
        }

        .drinkInfo {
          flex: 1;
        }

        .drinkInfo strong,
        .drinkInfo small {
          display: block;
        }

        .drinkInfo small {
          color: #7e8996;
          margin-top: 4px;
          font-size: 12px;
        }

        .price {
          color: #fbbf24;
          white-space: nowrap;
        }

        .peopleList {
          gap: 7px;
        }

        .personRow {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.035);
        }

        .avatar,
        .rankAvatar {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #fbbf24
            );
          color: #111;
          font-weight: 1000;
        }

        .personInfo {
          flex: 1;
        }

        .personInfo strong,
        .personInfo small {
          display: block;
        }

        .personInfo small {
          color: #7f8996;
          margin-top: 3px;
        }

        .personPoints {
          text-align: right;
        }

        .personPoints b,
        .personPoints small {
          display: block;
        }

        .personPoints b {
          color: #fbbf24;
          font-size: 18px;
        }

        .personPoints small {
          color: #6f7a87;
          font-size: 9px;
        }

        .deleteButton {
          border: none;
          background: #202832;
          color: #9ba5b0;
          border-radius: 9px;
          width: 31px;
          height: 31px;
          cursor: pointer;
          font-size: 18px;
        }

        .moneyBox {
          text-align: center;
          padding: 20px;
          border-radius: 17px;
          background: rgba(245, 158, 11, 0.08);
        }

        .moneyBox strong,
        .moneyBox span {
          display: block;
        }

        .moneyBox strong {
          color: #fbbf24;
          font-size: 34px;
        }

        .moneyBox span {
          color: #7f8996;
          font-size: 12px;
          margin-top: 3px;
        }

        .costRows {
          display: grid;
          gap: 7px;
          margin-top: 10px;
        }

        .costRows div {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: rgba(255, 255, 255, 0.035);
          border-radius: 11px;
        }

        .costRows span {
          color: #8b96a2;
        }

        .miniRanking {
          display: grid;
          gap: 7px;
        }

        .miniRank {
          display: grid;
          grid-template-columns: 35px 1fr auto 50px;
          align-items: center;
          gap: 8px;
          padding: 11px;
          background: rgba(255, 255, 255, 0.035);
          border-radius: 12px;
        }

        .miniRank small {
          color: #7e8996;
          text-align: right;
        }

        .miniRank b {
          color: #fbbf24;
          text-align: right;
        }

        .challengeCard {
          padding: 16px;
          border-radius: 17px;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.045),
              rgba(255, 255, 255, 0.02)
            );
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .challengeTop {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .challengeBadge {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 13px;
          font-size: 22px;
        }

        .challengeTop strong,
        .challengeTop small {
          display: block;
        }

        .challengeTop small {
          color: #fbbf24;
          margin-top: 4px;
          font-size: 11px;
        }

        .challengeCard > p {
          color: #9ba5b0;
          line-height: 1.5;
          margin: 14px 0;
        }

        .voteBox,
        .completeBox {
          margin-top: 10px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.18);
          border-radius: 13px;
        }

        .voteBox > strong,
        .completeBox > strong {
          display: block;
          margin-bottom: 9px;
          font-size: 12px;
        }

        .voteGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7px;
        }

        .voteGrid button {
          border: 1px solid #303945;
          background: #151b22;
          color: #dce1e7;
          border-radius: 10px;
          padding: 9px;
          cursor: pointer;
          font-weight: 700;
        }

        .voteGrid button:hover {
          border-color: #f59e0b;
          color: #fbbf24;
        }

        .voteBox > small {
          display: block;
          color: #687481;
          margin-top: 8px;
        }

        .templates {
          margin-bottom: 18px;
        }

        .templates h3 {
          margin: 0 0 9px;
          font-size: 13px;
          color: #909ba7;
        }

        .templateGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .template {
          border: 1px solid #29313a;
          background: #11161c;
          color: white;
          border-radius: 12px;
          padding: 11px;
          text-align: left;
          cursor: pointer;
          transition: 0.2s;
        }

        .template strong,
        .template small {
          display: block;
        }

        .template strong {
          font-size: 12px;
        }

        .template small {
          color: #fbbf24;
          margin-top: 4px;
        }

        .rankingHero {
          background:
            linear-gradient(
              135deg,
              rgba(251, 191, 36, 0.18),
              rgba(245, 158, 11, 0.04)
            );
        }

        .rankingHero > span {
          font-size: 65px;
        }

        .rankingHero small {
          color: #fbbf24;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .rankingRow {
          display: grid;
          grid-template-columns: 40px 44px 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 13px;
          background: rgba(255, 255, 255, 0.035);
          border-radius: 14px;
        }

        .rankingRow.topRank {
          background:
            linear-gradient(
              90deg,
              rgba(245, 158, 11, 0.1),
              rgba(255, 255, 255, 0.035)
            );
        }

        .rankNumber {
          font-size: 20px;
          text-align: center;
        }

        .rankInfo strong,
        .rankInfo small {
          display: block;
        }

        .rankInfo small {
          color: #7e8996;
          margin-top: 3px;
        }

        .rankPoints {
          text-align: right;
        }

        .rankPoints b,
        .rankPoints small {
          display: block;
        }

        .rankPoints b {
          color: #fbbf24;
          font-size: 21px;
        }

        .rankPoints small {
          color: #687481;
          font-size: 9px;
        }

        .titleGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .funTitle {
          padding: 14px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-weight: 800;
        }

        .empty {
          text-align: center;
          padding: 35px 15px;
          color: #707b88;
        }

        .empty span {
          display: block;
          font-size: 40px;
          margin-bottom: 8px;
        }

        .empty p {
          margin: 0;
          line-height: 1.5;
        }

        .loading {
          text-align: center;
          padding: 90px 20px;
          color: #8994a0;
        }

        .spinner {
          font-size: 45px;
          animation: bounce 0.9s infinite alternate;
        }

        @keyframes bounce {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-10px) rotate(-8deg);
          }
        }

        .toast {
          position: fixed;
          left: 50%;
          bottom: 22px;
          transform: translateX(-50%);
          z-index: 50;
          max-width: calc(100% - 30px);
          padding: 13px 17px;
          border-radius: 14px;
          background: #161d25;
          border: 1px solid #343e49;
          color: #fbbf24;
          box-shadow:
            0 15px 40px
              rgba(0, 0, 0, 0.35);
          font-weight: 800;
        }

        footer {
          text-align: center;
          padding: 35px 10px 20px;
          color: #4f5a66;
        }

        footer strong,
        footer small {
          display: block;
        }

        footer small {
          margin-top: 5px;
        }

        @media (max-width: 760px) {

          .app {
            padding: 14px;
          }

          .hero {
            align-items: flex-start;
          }

          .heroLogo {
            width: 58px;
            height: 58px;
            font-size: 30px;
            border-radius: 18px;
          }

          .heroText h1 {
            font-size: 29px;
          }

          .newEventButton {
            padding: 9px 11px;
            font-size: 11px;
          }

          .statsGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .quickGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .templateGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .eventSelector {
            align-items: stretch;
            flex-direction: column;
          }

          .inviteCode {
            width: 100%;
          }
        }

        @media (max-width: 520px) {

          .hero {
            flex-wrap: wrap;
          }

          .heroText {
            min-width: calc(100% - 78px);
          }

          .newEventButton {
            width: 100%;
          }

          .quickGrid {
            grid-template-columns: 1fr 1fr;
          }

          .formGrid3,
          .formGrid2 {
            grid-template-columns: 1fr;
          }

          .miniRank {
            grid-template-columns: 30px 1fr 45px;
          }

          .miniRank small {
            display: none;
          }

          .rankingRow {
            grid-template-columns: 32px 40px 1fr auto;
          }

          .rankingHero {
            padding: 18px;
          }

          .rankingHero > span {
            font-size: 48px;
          }

          .challengeEmoji {
            font-size: 48px;
          }

          .voteGrid {
            grid-template-columns: 1fr;
          }

          .titleGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
