"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  user_id?: string | null;
  username?: string | null;
  name?: string | null;
  points?: number | null;
  drinks_count?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
  gewicht_kg?: number | null;
  alter?: number | null;
  geschlecht?: string | null;
  avatar_url?: string | null;
};

type Member = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string | null;
  gender_factor?: number | null;
  joined_via_code?: string | null;
  role?: string | null;
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
  created_at?: string | null;
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
  price?: number | null;
  photo_url?: string | null;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status: string;
  message?: string | null;
  created_at?: string | null;
  responded_at?: string | null;
  requester?: Profile | null;
  responses?: BeerResponse[];
};

type BeerResponse = {
  id: string;
  request_id: string;
  profile_id: string;
  response: string;
  created_at?: string | null;
  profile?: Profile | null;
};

type Challenge = {
  id: string;
  event_id: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  points?: number | null;
  status?: string | null;
  required_votes?: number | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  participant_count?: number | null;
  vote_count?: number | null;
  positive_vote_count?: number | null;
};

type Tab =
  | "home"
  | "drinks"
  | "requests"
  | "challenges"
  | "ranking"
  | "stats";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [tab, setTab] = useState<Tab>("home");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] = useState("Bier");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");
  const [drinkComment, setDrinkComment] = useState("");

  const [personName, setPersonName] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  const [requestMessage, setRequestMessage] = useState("");

  const currentEvent = useMemo(
    () => events.find((event) => event.id === eventId) ?? null,
    [events, eventId]
  );

  const currentMember = useMemo(
    () =>
      members.find((member) => member.profile_id === profile?.id) ?? null,
    [members, profile]
  );

  const isAdmin =
    currentMember?.role === "admin" ||
    currentMember?.role === "owner" ||
    profile?.is_global_admin === true;

  function showMessage(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  const loadEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showMessage("❌ Events konnten nicht geladen werden: " + error.message);
      return;
    }

    const eventData = (data ?? []) as Event[];
    setEvents(eventData);

    if (!eventId && eventData.length > 0) {
      setEventId(eventData[0].id);
    }
  }, [eventId]);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("event_members")
      .select("*")
      .eq("event_id", eventId)
      .order("joined_at", { ascending: true });

    if (error) {
      showMessage("❌ Teilnehmer konnten nicht geladen werden.");
      return;
    }

    const rawMembers = (data ?? []) as Member[];

    const profileIds = rawMembers.map((member) => member.profile_id);

    if (profileIds.length === 0) {
      setMembers([]);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .in("id", profileIds);

    const profiles = (profileData ?? []) as Profile[];

    const merged = rawMembers.map((member) => ({
      ...member,
      profile:
        profiles.find((item) => item.id === member.profile_id) ?? null,
    }));

    setMembers(merged);
  }, [eventId]);

  const loadDrinks = useCallback(async () => {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      showMessage("❌ Getränke konnten nicht geladen werden.");
      return;
    }

    setDrinks((data ?? []) as Drink[]);
  }, [eventId]);

  const loadBeerRequests = useCallback(async () => {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("beer_requests")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      showMessage("❌ Bier-Anfragen konnten nicht geladen werden.");
      return;
    }

    const requests = (data ?? []) as BeerRequest[];

    const requesterIds = requests.map(
      (request) => request.requester_profile_id
    );

    let profiles: Profile[] = [];

    if (requesterIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", requesterIds);

      profiles = (profileData ?? []) as Profile[];
    }

    const requestIds = requests.map((request) => request.id);

    let responses: BeerResponse[] = [];

    if (requestIds.length > 0) {
      const { data: responseData } = await supabase
        .from("beer_request_responses")
        .select("*")
        .in("request_id", requestIds);

      responses = (responseData ?? []) as BeerResponse[];
    }

    const responseProfileIds = responses.map(
      (response) => response.profile_id
    );

    let responseProfiles: Profile[] = [];

    if (responseProfileIds.length > 0) {
      const { data: responseProfileData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", responseProfileIds);

      responseProfiles = (responseProfileData ?? []) as Profile[];
    }

    const merged = requests.map((request) => ({
      ...request,
      requester:
        profiles.find(
          (item) => item.id === request.requester_profile_id
        ) ?? null,
      responses: responses
        .filter((response) => response.request_id === request.id)
        .map((response) => ({
          ...response,
          profile:
            responseProfiles.find(
              (item) => item.id === response.profile_id
            ) ?? null,
        })),
    }));

    setBeerRequests(merged);
  }, [eventId]);

  const loadChallenges = useCallback(async () => {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("challenge_dashboard")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (!error) {
      setChallenges((data ?? []) as Challenge[]);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvents();
    loadProfile();
  }, [loadEvents, loadProfile]);

  useEffect(() => {
    if (!eventId) return;

    loadMembers();
    loadDrinks();
    loadBeerRequests();
    loadChallenges();

    const timer = window.setInterval(() => {
      loadMembers();
      loadDrinks();
      loadBeerRequests();
      loadChallenges();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [
    eventId,
    loadMembers,
    loadDrinks,
    loadBeerRequests,
    loadChallenges,
  ]);

  const totalLiters = useMemo(() => {
    return drinks.reduce((sum, drink) => {
      const liters = Number(drink.liters ?? drink.menge ?? 0);
      const quantity = Number(drink.quantity ?? 1);

      return sum + liters * quantity;
    }, 0);
  }, [drinks]);

  const totalCost = useMemo(() => {
    return drinks.reduce((sum, drink) => {
      const price = Number(drink.price ?? drink.preis ?? 0);
      const quantity = Number(drink.quantity ?? 1);

      return sum + price * quantity;
    }, 0);
  }, [drinks]);

  const assignedDrinks = useMemo(() => {
    if (!profile) return [];

    return drinks.filter((drink) => drink.profile_id === profile.id);
  }, [drinks, profile]);

  const myLiters = useMemo(() => {
    return assignedDrinks.reduce((sum, drink) => {
      const liters = Number(drink.liters ?? drink.menge ?? 0);
      const quantity = Number(drink.quantity ?? 1);

      return sum + liters * quantity;
    }, 0);
  }, [assignedDrinks]);

  const myAlcoholGrams = useMemo(() => {
    return assignedDrinks.reduce((sum, drink) => {
      const liters = Number(drink.liters ?? drink.menge ?? 0);
      const alcohol = Number(
        drink.alcohol_percent ??
          drink.alkohol ??
          drink.detected_alcohol_percent ??
          0
      );
      const quantity = Number(drink.quantity ?? 1);

      return sum + liters * quantity * (alcohol / 100) * 789;
    }, 0);
  }, [assignedDrinks]);

  const myPromille = useMemo(() => {
    if (!profile) return 0;

    const weight = Number(
      profile.weight_kg ?? profile.gewicht_kg ?? 0
    );

    if (weight <= 0) return 0;

    const gender =
      String(
        profile.gender ??
          profile.geschlecht ??
          ""
      ).toLowerCase();

    const factor =
      gender.includes("frau") ||
      gender.includes("female") ||
      gender === "f"
        ? 0.55
        : 0.68;

    return myAlcoholGrams / (weight * factor);
  }, [profile, myAlcoholGrams]);

  const ranking = useMemo(() => {
    return [...members].sort(
      (a, b) =>
        Number(b.profile?.points ?? 0) -
        Number(a.profile?.points ?? 0)
    );
  }, [members]);

  const costPerPerson =
    members.length > 0 ? totalCost / members.length : 0;

  const unreadRequests = useMemo(() => {
    if (!profile) return [];

    return beerRequests.filter((request) => {
      if (request.status !== "pending") return false;

      if (request.requester_profile_id === profile.id) {
        return false;
      }

      const answered = request.responses?.some(
        (response) => response.profile_id === profile.id
      );

      return !answered;
    });
  }, [beerRequests, profile]);

  async function saveDrink() {
    if (!eventId) {
      showMessage("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      showMessage("❌ Bitte ein Getränk eingeben.");
      return;
    }

    setLoading(true);

    const liters = Number(drinkLiters);
    const alcohol = Number(drinkAlcohol);
    const price = Number(drinkPrice);

    const { error } = await supabase.from("drinks").insert({
      event_id: eventId,
      profile_id: null,

      category: drinkCategory,
      drink_name: drinkName.trim(),
      brand: drinkBrand.trim() || null,

      liters,
      alcohol_percent: alcohol,
      quantity: 1,

      comment: drinkComment.trim() || null,

      marke: drinkBrand.trim() || null,
      getraenk: drinkName.trim(),
      menge: liters,
      alkohol: alcohol,
      preis: price,
      price,

      ai_detected: false,
      shared_cost: true,
    });

    setLoading(false);

    if (error) {
      showMessage("❌ " + error.message);
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkCategory("Bier");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");
    setDrinkComment("");

    showMessage("🍺 Getränk gespeichert.");
    await loadDrinks();
  }

  async function assignDrink(
    drinkId: string,
    profileId: string
  ) {
    const { error } = await supabase
      .from("drinks")
      .update({
        profile_id: profileId,
      })
      .eq("id", drinkId)
      .eq("event_id", eventId);

    if (error) {
      showMessage("❌ Getränk konnte nicht zugeordnet werden.");
      return;
    }

    const target = members.find(
      (member) => member.profile_id === profileId
    );

    if (target?.profile) {
      await supabase
        .from("profiles")
        .update({
          points: Number(target.profile.points ?? 0) + 10,
          drinks_count:
            Number(target.profile.drinks_count ?? 0) + 1,
        })
        .eq("id", profileId);
    }

    showMessage("🍺 Getränk zugeordnet! +10 Punkte");
    await loadDrinks();
    await loadMembers();
  }

  async function createBeerRequest() {
    if (!profile || !eventId) {
      showMessage("❌ Du musst einem Event beigetreten sein.");
      return;
    }

    const { data, error } = await supabase.rpc(
      "create_beer_request",
      {
        p_event_id: eventId,
        p_requester_profile_id: profile.id,
        p_message:
          requestMessage.trim() ||
          `${profile.name ?? profile.username ?? "Jemand"} möchte gerne ein Bier trinken.`,
      }
    );

    if (error) {
      showMessage("❌ " + error.message);
      return;
    }

    if (data) {
      await supabase.rpc("notify_beer_request", {
        p_request_id: data,
        p_event_id: eventId,
      });
    }

    setRequestMessage("");
    showMessage(
      "🍺 Bier-Anfrage gesendet! Die anderen Teilnehmer werden gefragt."
    );

    await loadBeerRequests();
    setTab("requests");
  }

  async function answerBeerRequest(
    requestId: string,
    response: "accepted" | "declined"
  ) {
    if (!profile) return;

    const { error } = await supabase.rpc(
      "answer_beer_request",
      {
        p_request_id: requestId,
        p_profile_id: profile.id,
        p_response: response,
      }
    );

    if (error) {
      showMessage("❌ " + error.message);
      return;
    }

    showMessage(
      response === "accepted"
        ? "✅ Du hast zugestimmt."
        : "❌ Du hast abgelehnt."
    );

    await loadBeerRequests();
  }

  async function giveBeerCrate() {
    if (!profile || !eventId) {
      showMessage("❌ Kein Teilnehmer ausgewählt.");
      return;
    }

    const { error } = await supabase
      .from("beer_crate_sponsorships")
      .insert({
        event_id: eventId,
        profile_id: profile.id,
        crates: 1,
        points_awarded: 50,
        description: "🍺 Eine Bierkiste ausgegeben",
      });

    if (error) {
      showMessage("❌ Bierkiste konnte nicht gespeichert werden.");
      return;
    }

    const currentPoints = Number(profile.points ?? 0);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        points: currentPoints + 50,
      })
      .eq("id", profile.id);

    if (profileError) {
      showMessage("⚠️ Kiste gespeichert, Punkte konnten nicht aktualisiert werden.");
      return;
    }

    setProfile({
      ...profile,
      points: currentPoints + 50,
    });

    showMessage("🍺 Bierkiste ausgegeben! +50 Punkte");
    await loadMembers();
  }

  async function addPerson() {
    const name = personName.trim();

    if (!name) {
      showMessage("❌ Bitte einen Namen eingeben.");
      return;
    }

    if (!profile) {
      showMessage(
        "❌ Bitte zuerst einen Benutzeraccount anmelden."
      );
      return;
    }

    showMessage(
      "ℹ️ Teilnehmer werden über den Einladungscode zum Event hinzugefügt."
    );

    setPersonName("");
  }

  async function joinEventWithCode() {
    if (!profile) {
      showMessage("❌ Bitte zuerst anmelden.");
      return;
    }

    if (!inviteCodeInput.trim()) {
      showMessage("❌ Bitte Einladungscode eingeben.");
      return;
    }

    const code = inviteCodeInput.trim();

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("invite_code", code)
      .maybeSingle();

    if (error || !event) {
      showMessage("❌ Einladungscode nicht gefunden.");
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
      showMessage("✅ Du bist bereits Teilnehmer dieses Events.");
      setInviteCodeInput("");
      return;
    }

    const { error: insertError } = await supabase
      .from("event_members")
      .insert({
        event_id: event.id,
        profile_id: profile.id,
        joined_via_code: code,
        role: "member",
      });

    if (insertError) {
      showMessage("❌ " + insertError.message);
      return;
    }

    setEventId(event.id);
    setInviteCodeInput("");

    await loadMembers();

    showMessage("🎉 Du bist dem Event beigetreten!");
  }

  function drinkNameOf(drink: Drink) {
    return (
      drink.drink_name ||
      drink.getraenk ||
      drink.brand ||
      drink.marke ||
      "Getränk"
    );
  }

  function drinkLitersOf(drink: Drink) {
    return Number(drink.liters ?? drink.menge ?? 0);
  }

  function drinkAlcoholOf(drink: Drink) {
    return Number(
      drink.alcohol_percent ??
        drink.alkohol ??
        drink.detected_alcohol_percent ??
        0
    );
  }

  function drinkPriceOf(drink: Drink) {
    return Number(drink.price ?? drink.preis ?? 0);
  }

  return (
    <main className="page">
      <div className="app">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="header">

          <div className="brandBox">
            <div className="crateLogo">
              <div className="crateTop">🍺 🍺 🍺</div>
              <div className="crateBody">
                <span>🍺</span>
                <span>🍺</span>
                <span>🍺</span>
              </div>
            </div>

            <div>
              <h1>Güstener Zapfhahn Zentrale</h1>
              <p>
                Events · Getränke · Kosten · Rankings
              </p>
            </div>
          </div>

          <div className="headerActions">
            <button
              className="crateButton"
              onClick={giveBeerCrate}
            >
              <span className="crateButtonIcon">
                🍺
              </span>
              <span>
                <b>Bierkiste</b>
                <small>+50 Punkte</small>
              </span>
            </button>

            <button
              className="beerButton"
              onClick={createBeerRequest}
            >
              🍺
              <span>
                <b>Ich will ein Bier</b>
                <small>Anfrage senden</small>
              </span>
            </button>
          </div>
        </header>

        {/* =====================================================
            EVENT
        ===================================================== */}

        <section className="card eventCard">

          <div className="sectionTitle">
            <div>
              <span className="eyebrow">
                EVENT
              </span>
              <h2>📅 Aktuelles Event</h2>
            </div>

            {currentEvent?.invite_code && (
              <div className="inviteBox">
                <small>Einladungscode</small>
                <strong>
                  {currentEvent.invite_code}
                </strong>
              </div>
            )}
          </div>

          <select
            value={eventId}
            onChange={(event) =>
              setEventId(event.target.value)
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

          {currentEvent && (
            <div className="eventInfo">

              <div>
                <b>{currentEvent.title}</b>

                {currentEvent.location && (
                  <small>
                    📍 {currentEvent.location}
                  </small>
                )}
              </div>

              <div className="eventDates">
                {currentEvent.start_date && (
                  <span>
                    📅 {currentEvent.start_date}
                  </span>
                )}

                {currentEvent.end_date && (
                  <span>
                    → {currentEvent.end_date}
                  </span>
                )}
              </div>

            </div>
          )}
        </section>

        {/* =====================================================
            INVITATION
        ===================================================== */}

        <section className="card inviteCard">

          <div>
            <span className="eyebrow">
              BEITRETEN
            </span>

            <h2>🔐 Einladungscode</h2>

            <p>
              Mit einem Einladungscode einem Event
              beitreten.
            </p>
          </div>

          <div className="joinRow">

            <input
              value={inviteCodeInput}
              onChange={(event) =>
                setInviteCodeInput(
                  event.target.value
                )
              }
              placeholder="z. B. GUET-2026"
            />

            <button onClick={joinEventWithCode}>
              Beitreten
            </button>

          </div>
        </section>

        {/* =====================================================
            QUICK STATS
        ===================================================== */}

        <section className="stats">

          <div className="stat">
            <span>🍺</span>
            <b>{drinks.length}</b>
            <small>Getränke</small>
          </div>

          <div className="stat">
            <span>💧</span>
            <b>{totalLiters.toFixed(1)}</b>
            <small>Liter</small>
          </div>

          <div className="stat">
            <span>💶</span>
            <b>{totalCost.toFixed(2)} €</b>
            <small>Kosten</small>
          </div>

          <div className="stat">
            <span>👥</span>
            <b>{members.length}</b>
            <small>Teilnehmer</small>
          </div>

        </section>

        {/* =====================================================
            NAVIGATION
        ===================================================== */}

        <nav className="tabs">

          <button
            className={tab === "home" ? "active" : ""}
            onClick={() => setTab("home")}
          >
            🏠
            <span>Start</span>
          </button>

          <button
            className={tab === "drinks" ? "active" : ""}
            onClick={() => setTab("drinks")}
          >
            🍺
            <span>Getränke</span>
          </button>

          <button
            className={
              tab === "requests" ? "active" : ""
            }
            onClick={() => setTab("requests")}
          >
            🔔
            <span>Anfragen</span>

            {unreadRequests.length > 0 && (
              <em>
                {unreadRequests.length}
              </em>
            )}
          </button>

          <button
            className={
              tab === "challenges" ? "active" : ""
            }
            onClick={() => setTab("challenges")}
          >
            ⚡
            <span>Challenges</span>
          </button>

          <button
            className={
              tab === "ranking" ? "active" : ""
            }
            onClick={() => setTab("ranking")}
          >
            🏆
            <span>Ranking</span>
          </button>

          <button
            className={
              tab === "stats" ? "active" : ""
            }
            onClick={() => setTab("stats")}
          >
            📊
            <span>Statistik</span>
          </button>

        </nav>

        {/* =====================================================
            HOME
        ===================================================== */}

        {tab === "home" && (
          <>
            <section className="card heroCard">

              <div className="heroText">

                <span className="eyebrow">
                  GÜSTENER ZAPFHAHN ZENTRALE
                </span>

                <h2>
                  🍻 Deine Runde.
                  <br />
                  Deine Getränke.
                  <br />
                  Deine Punkte.
                </h2>

                <p>
                  Verwalte Getränke, Teilnehmer,
                  Bier-Anfragen, Challenges,
                  Kosten und das Ranking deines Events.
                </p>

              </div>

              <div className="heroButtons">

                <button
                  className="bigBeerButton"
                  onClick={createBeerRequest}
                >
                  🍺
                  <strong>
                    Ich möchte ein Bier
                  </strong>
                  <small>
                    Die anderen entscheiden
                  </small>
                </button>

                <button
                  className="bigCrateButton"
                  onClick={giveBeerCrate}
                >
                  <span className="bigCrate">
                    🍺🍺
                    <br />
                    🍺🍺
                  </span>

                  <strong>
                    Bierkiste ausgeben
                  </strong>

                  <small>
                    +50 Punkte
                  </small>
                </button>

              </div>

            </section>

            {/* PERSONAL CARD */}

            <section className="card">

              <div className="sectionTitle">
                <div>
                  <span className="eyebrow">
                    MEIN STATUS
                  </span>

                  <h2>
                    👤{" "}
                    {profile?.name ||
                      profile?.username ||
                      "Teilnehmer"}
                  </h2>
                </div>

                <div className="points">
                  🏆{" "}
                  {Number(
                    profile?.points ?? 0
                  )}
                </div>
              </div>

              <div className="personalGrid">

                <div>
                  <span>🍺</span>
                  <b>{assignedDrinks.length}</b>
                  <small>Getränke</small>
                </div>

                <div>
                  <span>💧</span>
                  <b>{myLiters.toFixed(1)}</b>
                  <small>Liter</small>
                </div>

                <div>
                  <span>🏆</span>
                  <b>
                    {Number(
                      profile?.points ?? 0
                    )}
                  </b>
                  <small>Punkte</small>
                </div>

                {currentEvent?.show_promille && (
                  <div>
                    <span>🧪</span>
                    <b>
                      {myPromille.toFixed(2)}‰
                    </b>
                    <small>Promille</small>
                  </div>
                )}

              </div>

              {currentEvent?.show_promille && (
                <div className="promilleBox">

                  <div className="promilleHeader">
                    <span>
                      🧪 Geschätzter Alkoholpegel
                    </span>

                    <strong>
                      {myPromille.toFixed(2)}‰
                    </strong>
                  </div>

                  <div className="promilleBar">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          myPromille * 25
                        )}%`,
                      }}
                    />
                  </div>

                  <small>
                    Nur eine grobe Schätzung –
                    nicht zur Beurteilung der
                    Fahrtüchtigkeit verwenden.
                  </small>

                </div>
              )}

            </section>

            {/* MEMBERS */}

            <section className="card">

              <div className="sectionTitle">
                <div>
                  <span className="eyebrow">
                    EVENT
                  </span>
                  <h2>👥 Teilnehmer</h2>
                </div>

                <strong>
                  {members.length}
                </strong>
              </div>

              {members.length === 0 ? (
                <p className="empty">
                  Noch keine Teilnehmer.
                </p>
              ) : (
                <div className="memberList">

                  {members.map((member) => {

                    const person =
                      member.profile;

                    return (
                      <div
                        className="member"
                        key={member.id}
                      >

                        <div className="avatar">
                          {person?.avatar_url ? (
                            <img
                              src={
                                person.avatar_url
                              }
                              alt=""
                            />
                          ) : (
                            "👤"
                          )}
                        </div>

                        <div className="memberInfo">

                          <b>
                            {person?.name ||
                              person?.username ||
                              "Teilnehmer"}
                          </b>

                          <small>
                            🍺{" "}
                            {Number(
                              person?.drinks_count ??
                                0
                            )}{" "}
                            Getränke
                            {" · "}
                            🏆{" "}
                            {Number(
                              person?.points ?? 0
                            )}{" "}
                            Punkte
                          </small>

                        </div>

                        {member.role ===
                          "admin" && (
                          <span className="role">
                            ADMIN
                          </span>
                        )}

                      </div>
                    );
                  })}

                </div>
              )}

            </section>
          </>
        )}

        {/* =====================================================
            DRINKS
        ===================================================== */}

        {tab === "drinks" && (
          <>
            <section className="card">

              <span className="eyebrow">
                VERWALTUNG
              </span>

              <h2>
                🍺 Getränk hinzufügen
              </h2>

              <input
                placeholder="Getränk"
                value={drinkName}
                onChange={(event) =>
                  setDrinkName(event.target.value)
                }
              />

              <div className="three">

                <input
                  placeholder="Marke"
                  value={drinkBrand}
                  onChange={(event) =>
                    setDrinkBrand(
                      event.target.value
                    )
                  }
                />

                <select
                  value={drinkCategory}
                  onChange={(event) =>
                    setDrinkCategory(
                      event.target.value
                    )
                  }
                >
                  <option>Bier</option>
                  <option>Radler</option>
                  <option>Wein</option>
                  <option>Sekt</option>
                  <option>Spirituose</option>
                  <option>Longdrink</option>
                  <option>Alkoholfrei</option>
                  <option>Sonstiges</option>
                </select>

                <input
                  type="number"
                  step="0.1"
                  placeholder="Liter"
                  value={drinkLiters}
                  onChange={(event) =>
                    setDrinkLiters(
                      event.target.value
                    )
                  }
                />

              </div>

              <div className="three">

                <input
                  type="number"
                  step="0.1"
                  placeholder="Alkohol %"
                  value={drinkAlcohol}
                  onChange={(event) =>
                    setDrinkAlcohol(
                      event.target.value
                    )
                  }
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Preis €"
                  value={drinkPrice}
                  onChange={(event) =>
                    setDrinkPrice(
                      event.target.value
                    )
                  }
                />

                <input
                  placeholder="Kommentar"
                  value={drinkComment}
                  onChange={(event) =>
                    setDrinkComment(
                      event.target.value
                    )
                  }
                />

              </div>

              <button
                className="saveButton"
                disabled={loading}
                onClick={saveDrink}
              >
                {loading
                  ? "Speichert..."
                  : "🍻 Getränk speichern"}
              </button>

            </section>

            <section className="card">

              <div className="sectionTitle">
                <div>
                  <span className="eyebrow">
                    EVENT
                  </span>
                  <h2>🍺 Getränke</h2>
                </div>

                <strong>
                  {drinks.length}
                </strong>
              </div>

              {drinks.length === 0 ? (
                <p className="empty">
                  Noch keine Getränke.
                </p>
              ) : (
                <div className="drinkList">

                  {drinks.map((drink) => {

                    const assigned =
                      members.find(
                        (member) =>
                          member.profile_id ===
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

                          <b>
                            {drinkNameOf(drink)}
                          </b>

                          <small>
                            {drink.brand ||
                              drink.marke ||
                              "Bier"}
                            {" · "}
                            {drinkLitersOf(
                              drink
                            ).toFixed(1)}
                            L
                            {" · "}
                            {drinkAlcoholOf(
                              drink
                            ).toFixed(1)}
                            %
                          </small>

                          {assigned && (
                            <small className="assigned">
                              👤{" "}
                              {assigned.profile
                                ?.name ||
                                assigned.profile
                                  ?.username}
                            </small>
                          )}

                        </div>

                        <div className="drinkRight">

                          <strong>
                            {drinkPriceOf(
                              drink
                            ).toFixed(2)}{" "}
                            €
                          </strong>

                          <select
                            value={
                              drink.profile_id ??
                              ""
                            }
                            onChange={(event) => {
                              if (
                                event.target
                                  .value
                              ) {
                                assignDrink(
                                  drink.id,
                                  event.target
                                    .value
                                );
                              }
                            }}
                          >
                            <option value="">
                              Zuordnen
                            </option>

                            {members.map(
                              (member) => (
                                <option
                                  key={
                                    member.profile_id
                                  }
                                  value={
                                    member.profile_id
                                  }
                                >
                                  {member.profile
                                    ?.name ||
                                    member.profile
                                      ?.username ||
                                    "Teilnehmer"}
                                </option>
                              )
                            )}

                          </select>

                        </div>

                      </div>
                    );
                  })}

                </div>
              )}

            </section>
          </>
        )}

        {/* =====================================================
            BEER REQUESTS
        ===================================================== */}

        {tab === "requests" && (
          <>
            <section className="card requestHero">

              <span className="eyebrow">
                BIER-ANFRAGE
              </span>

              <h2>
                🍺 Lust auf ein Bier?
              </h2>

              <p>
                Starte eine Anfrage. Die anderen
                Teilnehmer können zustimmen oder
                ablehnen.
              </p>

              <input
                placeholder="Nachricht optional"
                value={requestMessage}
                onChange={(event) =>
                  setRequestMessage(
                    event.target.value
                  )
                }
              />

              <button
                className="bigBeerButton"
                onClick={createBeerRequest}
              >
                🍺 Bier-Anfrage senden
              </button>

            </section>

            <section className="card">

              <div className="sectionTitle">
                <div>
                  <span className="eyebrow">
                    ANFRAGEN
                  </span>
                  <h2>
                    🔔 Bier-Anfragen
                  </h2>
                </div>

                {unreadRequests.length >
                  0 && (
                  <strong className="notificationCount">
                    {unreadRequests.length}
                  </strong>
                )}
              </div>

              {beerRequests.length === 0 ? (
                <p className="empty">
                  Noch keine Bier-Anfragen.
                </p>
              ) : (
                <div className="requestList">

                  {beerRequests.map(
                    (request) => {

                      const requester =
                        request.requester;

                      const myResponse =
                        request.responses?.find(
                          (response) =>
                            response.profile_id ===
                            profile?.id
                        );

                      const isMine =
                        request.requester_profile_id ===
                        profile?.id;

                      return (
                        <div
                          className="request"
                          key={request.id}
                        >

                          <div className="requestIcon">
                            🍺
                          </div>

                          <div className="requestContent">

                            <b>
                              {requester?.name ||
                                requester?.username ||
                                "Teilnehmer"}
                            </b>

                            <p>
                              {request.message ||
                                "Möchte gerne ein Bier trinken."}
                            </p>

                            <small>
                              {request.status ===
                                "pending" &&
                                "🟡 Wartet auf Antworten"}

                              {request.status ===
                                "accepted" &&
                                "🟢 Angenommen"}

                              {request.status ===
                                "declined" &&
                                "🔴 Abgelehnt"}
                            </small>

                            {!isMine &&
                              request.status ===
                                "pending" &&
                              !myResponse && (
                                <div className="responseButtons">

                                  <button
                                    className="accept"
                                    onClick={() =>
                                      answerBeerRequest(
                                        request.id,
                                        "accepted"
                                      )
                                    }
                                  >
                                    ✅ Zustimmen
                                  </button>

                                  <button
                                    className="decline"
                                    onClick={() =>
                                      answerBeerRequest(
                                        request.id,
                                        "declined"
                                      )
                                    }
                                  >
                                    ❌ Ablehnen
                                  </button>

                                </div>
                              )}

                            {myResponse && (
                              <span className="myResponse">
                                Deine Antwort:{" "}
                                {myResponse.response ===
                                "accepted"
                                  ? "✅ Ja"
                                  : "❌ Nein"}
                              </span>
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>
          </>
        )}

        {/* =====================================================
            CHALLENGES
        ===================================================== */}

        {tab === "challenges" && (
          <section className="card">

            <span className="eyebrow">
              EVENT-SPIEL
            </span>

            <h2>
              ⚡ Challenges
            </h2>

            <p>
              Sammle Punkte und schaffe die
              Herausforderungen des Events.
            </p>

            {challenges.length === 0 ? (
              <div className="emptyChallenge">
                <span>⚡</span>
                <b>
                  Noch keine Challenges
                </b>
                <small>
                  Sobald Challenges für dieses
                  Event vorhanden sind, erscheinen
                  sie hier.
                </small>
              </div>
            ) : (
              <div className="challengeList">

                {challenges.map(
                  (challenge) => (
                    <div
                      className="challenge"
                      key={challenge.id}
                    >

                      <div className="challengeIcon">
                        ⚡
                      </div>

                      <div className="challengeContent">

                        <b>
                          {challenge.title ||
                            "Challenge"}
                        </b>

                        <p>
                          {challenge.description ||
                            "Herausforderung"}
                        </p>

                        <div className="challengeMeta">

                          <span>
                            🏆{" "}
                            {Number(
                              challenge.points ??
                                0
                            )}{" "}
                            Punkte
                          </span>

                          <span>
                            👥{" "}
                            {Number(
                              challenge.participant_count ??
                                0
                            )}
                          </span>

                          <span>
                            {challenge.status ||
                              "offen"}
                          </span>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* =====================================================
            RANKING
        ===================================================== */}

        {tab === "ranking" && (
          <section className="card">

            <span className="eyebrow">
              PUNKTE
            </span>

            <h2>
              🏆 Ranking
            </h2>

            {ranking.length === 0 ? (
              <p className="empty">
                Noch keine Teilnehmer.
              </p>
            ) : (
              <div className="rankingList">

                {ranking.map(
                  (member, index) => {

                    const person =
                      member.profile;

                    return (
                      <div
                        className={`ranking ${
                          index < 3
                            ? "topRanking"
                            : ""
                        }`}
                        key={member.id}
                      >

                        <div className="rankPosition">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `${index + 1}.`}
                        </div>

                        <div className="rankAvatar">
                          👤
                        </div>

                        <div className="rankName">

                          <b>
                            {person?.name ||
                              person?.username ||
                              "Teilnehmer"}
                          </b>

                          <small>
                            🍺{" "}
                            {Number(
                              person?.drinks_count ??
                                0
                            )}{" "}
                            Getränke
                          </small>

                        </div>

                        <strong>
                          {Number(
                            person?.points ?? 0
                          )}{" "}
                          Punkte
                        </strong>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>
        )}

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        {tab === "stats" && (
          <>
            <section className="card">

              <span className="eyebrow">
                EVENT
              </span>

              <h2>
                📊 Event-Statistik
              </h2>

              <div className="statisticsGrid">

                <div>
                  <span>🍺</span>
                  <strong>
                    {drinks.length}
                  </strong>
                  <small>
                    Getränke
                  </small>
                </div>

                <div>
                  <span>💧</span>
                  <strong>
                    {totalLiters.toFixed(1)} L
                  </strong>
                  <small>
                    Gesamtmenge
                  </small>
                </div>

                <div>
                  <span>💶</span>
                  <strong>
                    {totalCost.toFixed(2)} €
                  </strong>
                  <small>
                    Gesamtkosten
                  </small>
                </div>

                <div>
                  <span>👥</span>
                  <strong>
                    {members.length}
                  </strong>
                  <small>
                    Teilnehmer
                  </small>
                </div>

                <div>
                  <span>🏆</span>
                  <strong>
                    {ranking.reduce(
                      (sum, member) =>
                        sum +
                        Number(
                          member.profile
                            ?.points ?? 0
                        ),
                      0
                    )}
                  </strong>
                  <small>
                    Gesamtpunkte
                  </small>
                </div>

                <div>
                  <span>💶</span>
                  <strong>
                    {costPerPerson.toFixed(2)} €
                  </strong>
                  <small>
                    Pro Person
                  </small>
                </div>

              </div>

            </section>

            <section className="card costCard">

              <h2>
                💶 Kostenaufteilung
              </h2>

              <div className="costBig">
                {totalCost.toFixed(2)} €
              </div>

              <p>
                Gesamtkosten des Events
              </p>

              <div className="costLine">
                <span>
                  👥 Teilnehmer
                </span>

                <b>
                  {members.length}
                </b>
              </div>

              <div className="costLine">
                <span>
                  💶 Pro Person
                </span>

                <b>
                  {costPerPerson.toFixed(2)} €
                </b>
              </div>

              <div className="costLine">
                <span>
                  💧 Liter
                </span>

                <b>
                  {totalLiters.toFixed(1)} L
                </b>
              </div>

              <p className="hint">
                Die Kosten werden bei aktivierter
                automatischer Aufteilung gleichmäßig
                auf die Teilnehmer verteilt.
              </p>

            </section>
          </>
        )}

        {/* =====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer>

          <div className="footerLogo">
            🍺🍺🍺
          </div>

          <b>
            🍻 Güstener Zapfhahn Zentrale
          </b>

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

        html,
        body {
          margin: 0;
          padding: 0;
          background: #070b10;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          background:
            radial-gradient(
              circle at 50% -10%,
              #263c52 0%,
              #101820 35%,
              #070b10 75%
            );
          color: #ffffff;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .app {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          padding: 18px;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 8px 0 22px;
        }

        .brandBox {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .crateLogo {
          width: 76px;
          height: 76px;
          flex-shrink: 0;
          border-radius: 17px;
          background: linear-gradient(
            145deg,
            #9a5a16,
            #5c310b
          );
          border: 3px solid #d58a2c;
          box-shadow:
            inset 0 0 0 3px #3a1c06,
            0 8px 25px rgba(0,0,0,.35);
          padding: 7px;
          position: relative;
          overflow: hidden;
        }

        .crateTop {
          font-size: 13px;
          white-space: nowrap;
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          text-align: center;
        }

        .crateBody {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 7px;
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 3px;
          font-size: 20px;
          text-align: center;
        }

        h1 {
          font-size: 27px;
          margin: 0;
          letter-spacing: -.5px;
        }

        h2 {
          margin: 3px 0 8px;
          font-size: 21px;
        }

        p {
          color: #98a7b7;
          line-height: 1.5;
        }

        .header p {
          margin: 4px 0 0;
          font-size: 13px;
        }

        .headerActions {
          display: flex;
          gap: 8px;
        }

        button {
          border: 0;
          border-radius: 13px;
          padding: 12px 16px;
          cursor: pointer;
          font-weight: 800;
          transition:
            transform .15s,
            opacity .15s;
        }

        button:hover {
          transform: translateY(-1px);
        }

        button:active {
          transform: translateY(1px);
        }

        button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .crateButton,
        .beerButton {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #111;
        }

        .crateButton {
          background: #d68b26;
        }

        .beerButton {
          background: #f7bd35;
        }

        .crateButton small,
        .beerButton small {
          display: block;
          font-size: 10px;
          opacity: .7;
          margin-top: 2px;
        }

        .crateButtonIcon {
          font-size: 25px;
        }

        .card {
          width: 100%;
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 20px;
          padding: 19px;
          margin-bottom: 14px;
          box-shadow:
            0 10px 35px rgba(0,0,0,.12);
          backdrop-filter: blur(10px);
        }

        .sectionTitle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 13px;
        }

        .sectionTitle h2 {
          margin-bottom: 0;
        }

        .eyebrow {
          color: #f7bd35;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .eventInfo {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          background: rgba(255,255,255,.04);
          border-radius: 13px;
          padding: 12px;
          margin-top: 2px;
        }

        .eventInfo b,
        .eventInfo small {
          display: block;
        }

        .eventInfo small {
          margin-top: 4px;
          color: #8998a8;
        }

        .eventDates {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ba9b7;
          font-size: 12px;
        }

        .inviteBox {
          text-align: right;
          background: rgba(247,189,53,.1);
          border: 1px solid rgba(247,189,53,.25);
          padding: 9px 13px;
          border-radius: 12px;
        }

        .inviteBox small,
        .inviteBox strong {
          display: block;
        }

        .inviteBox small {
          color: #8998a8;
          font-size: 10px;
        }

        .inviteBox strong {
          color: #f7bd35;
          letter-spacing: 2px;
          margin-top: 3px;
        }

        .joinRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        input,
        select {
          width: 100%;
          border: 1px solid #344251;
          border-radius: 12px;
          padding: 13px;
          background: #111923;
          color: #ffffff;
          outline: none;
          margin-bottom: 9px;
        }

        input:focus,
        select:focus {
          border-color: #d9942d;
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
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 17px;
          padding: 14px 8px;
        }

        .stat span {
          display: block;
          font-size: 23px;
        }

        .stat b {
          display: block;
          font-size: 20px;
          margin: 4px 0;
        }

        .stat small {
          color: #82909e;
          font-size: 10px;
        }

        .tabs {
          display: grid;
          grid-template-columns:
            repeat(6,1fr);
          gap: 6px;
          background: rgba(255,255,255,.04);
          padding: 6px;
          border-radius: 16px;
          margin-bottom: 14px;
        }

        .tabs button {
          position: relative;
          background: transparent;
          color: #8795a3;
          padding: 10px 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 12px;
        }

        .tabs button.active {
          background: #263341;
          color: #ffffff;
        }

        .tabs em {
          position: absolute;
          top: 3px;
          right: 5px;
          min-width: 17px;
          height: 17px;
          border-radius: 50%;
          background: #e0a52c;
          color: #111;
          font-size: 9px;
          font-style: normal;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .heroCard {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 20px;
          align-items: center;
          min-height: 280px;
        }

        .heroText h2 {
          font-size: 34px;
          line-height: 1.05;
          margin: 8px 0 15px;
        }

        .heroButtons {
          display: grid;
          gap: 10px;
        }

        .bigBeerButton,
        .bigCrateButton {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 17px;
          color: #111;
          text-align: left;
        }

        .bigBeerButton {
          background: linear-gradient(
            135deg,
            #ffd25a,
            #eea82c
          );
        }

        .bigCrateButton {
          background: linear-gradient(
            135deg,
            #d9902c,
            #9d5d18
          );
          color: white;
        }

        .bigBeerButton strong,
        .bigBeerButton small,
        .bigCrateButton strong,
        .bigCrateButton small {
          display: block;
        }

        .bigBeerButton strong,
        .bigCrateButton strong {
          font-size: 15px;
        }

        .bigBeerButton small,
        .bigCrateButton small {
          margin-top: 3px;
          opacity: .7;
        }

        .bigBeerButton {
          font-size: 30px;
        }

        .bigCrate {
          font-size: 24px;
          line-height: .8;
          min-width: 57px;
        }

        .points {
          background: #f4bb34;
          color: #17120a;
          padding: 8px 13px;
          border-radius: 12px;
          font-weight: 900;
        }

        .personalGrid {
          display: grid;
          grid-template-columns:
            repeat(4,1fr);
          gap: 8px;
        }

        .personalGrid > div {
          background: rgba(255,255,255,.04);
          padding: 12px;
          border-radius: 13px;
          text-align: center;
        }

        .personalGrid span,
        .personalGrid b,
        .personalGrid small {
          display: block;
        }

        .personalGrid span {
          font-size: 20px;
        }

        .personalGrid b {
          font-size: 18px;
          margin: 4px 0;
        }

        .personalGrid small {
          color: #7f8d9b;
          font-size: 10px;
        }

        .promilleBox {
          margin-top: 12px;
          padding: 13px;
          border-radius: 14px;
          background: rgba(255,255,255,.04);
        }

        .promilleHeader {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .promilleHeader strong {
          color: #f4bb34;
        }

        .promilleBar {
          height: 8px;
          background: #202b36;
          border-radius: 99px;
          overflow: hidden;
          margin: 10px 0;
        }

        .promilleBar div {
          height: 100%;
          background: #e7a92f;
          border-radius: 99px;
        }

        .promilleBox small {
          color: #7f8c99;
          font-size: 10px;
        }

        .memberList,
        .drinkList,
        .requestList,
        .challengeList,
        .rankingList {
          display: grid;
          gap: 8px;
        }

        .member {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px;
          border-radius: 14px;
          background: rgba(255,255,255,.04);
        }

        .avatar,
        .rankAvatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #202b37;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .memberInfo {
          flex: 1;
        }

        .memberInfo b,
        .memberInfo small {
          display: block;
        }

        .memberInfo small {
          color: #7f8c99;
          margin-top: 3px;
          font-size: 11px;
        }

        .role {
          font-size: 9px;
          padding: 5px 7px;
          background: #273646;
          border-radius: 7px;
          color: #f3bb39;
        }

        .drink {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px;
          background: rgba(255,255,255,.04);
          border-radius: 14px;
        }

        .drinkIcon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #242f3a;
          border-radius: 12px;
          font-size: 22px;
        }

        .drinkInfo {
          flex: 1;
          min-width: 0;
        }

        .drinkInfo b,
        .drinkInfo small {
          display: block;
        }

        .drinkInfo small {
          color: #7f8c99;
          margin-top: 3px;
          font-size: 11px;
        }

        .drinkInfo .assigned {
          color: #d9a735;
        }

        .drinkRight {
          text-align: right;
          min-width: 125px;
        }

        .drinkRight select {
          margin: 6px 0 0;
          padding: 7px;
          font-size: 11px;
        }

        .saveButton {
          width: 100%;
          background: #f0b536;
          color: #111;
          margin-top: 3px;
        }

        .requestHero {
          text-align: center;
        }

        .requestHero p {
          max-width: 600px;
          margin: 5px auto 15px;
        }

        .requestHero input {
          max-width: 600px;
          margin: 0 auto 9px;
        }

        .request {
          display: flex;
          gap: 12px;
          padding: 14px;
          border-radius: 15px;
          background: rgba(255,255,255,.045);
        }

        .requestIcon {
          font-size: 27px;
        }

        .requestContent {
          flex: 1;
        }

        .requestContent p {
          margin: 4px 0;
        }

        .requestContent small {
          color: #82909d;
        }

        .responseButtons {
          display: flex;
          gap: 7px;
          margin-top: 10px;
        }

        .accept {
          background: #35a66b;
          color: white;
        }

        .decline {
          background: #a64a4a;
          color: white;
        }

        .myResponse {
          display: inline-block;
          margin-top: 8px;
          color: #e6b339;
          font-size: 11px;
        }

        .notificationCount {
          background: #e4a72d;
          color: #111;
          min-width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .challenge {
          display: flex;
          gap: 12px;
          padding: 14px;
          background: rgba(255,255,255,.045);
          border-radius: 15px;
        }

        .challengeIcon {
          width: 45px;
          height: 45px;
          border-radius: 13px;
          background: #302816;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
        }

        .challengeContent {
          flex: 1;
        }

        .challengeContent p {
          margin: 4px 0 8px;
        }

        .challengeMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .challengeMeta span {
          padding: 5px 8px;
          background: rgba(255,255,255,.05);
          border-radius: 7px;
          color: #a0adba;
          font-size: 10px;
        }

        .emptyChallenge {
          padding: 45px 15px;
          text-align: center;
          background: rgba(255,255,255,.03);
          border-radius: 15px;
        }

        .emptyChallenge span,
        .emptyChallenge b,
        .emptyChallenge small {
          display: block;
        }

        .emptyChallenge span {
          font-size: 45px;
        }

        .emptyChallenge b {
          margin-top: 8px;
        }

        .emptyChallenge small {
          color: #7f8d9a;
          margin-top: 5px;
        }

        .ranking {
          display: grid;
          grid-template-columns:
            48px 42px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: rgba(255,255,255,.04);
          border-radius: 14px;
        }

        .topRanking {
          background: linear-gradient(
            90deg,
            rgba(235,176,48,.14),
            rgba(255,255,255,.04)
          );
        }

        .rankPosition {
          font-size: 20px;
          text-align: center;
        }

        .rankName b,
        .rankName small {
          display: block;
        }

        .rankName small {
          color: #7f8c99;
          font-size: 10px;
          margin-top: 3px;
        }

        .statisticsGrid {
          display: grid;
          grid-template-columns:
            repeat(3,1fr);
          gap: 9px;
        }

        .statisticsGrid > div {
          background: rgba(255,255,255,.045);
          padding: 15px;
          border-radius: 14px;
          text-align: center;
        }

        .statisticsGrid span,
        .statisticsGrid strong,
        .statisticsGrid small {
          display: block;
        }

        .statisticsGrid span {
          font-size: 22px;
        }

        .statisticsGrid strong {
          margin: 4px 0;
          font-size: 19px;
        }

        .statisticsGrid small {
          color: #7f8c99;
          font-size: 10px;
        }

        .costCard {
          text-align: center;
        }

        .costBig {
          font-size: 42px;
          font-weight: 900;
          color: #f5bd3a;
        }

        .costLine {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: rgba(255,255,255,.045);
          border-radius: 12px;
          margin-top: 7px;
        }

        .hint {
          font-size: 11px;
        }

        .empty {
          text-align: center;
          padding: 25px 10px;
          color: #748290;
        }

        .message {
          position: fixed;
          left: 50%;
          bottom: 20px;
          transform: translateX(-50%);
          width: min(
            calc(100% - 30px),
            600px
          );
          z-index: 100;
          padding: 14px 17px;
          border-radius: 14px;
          background: #192532;
          border: 1px solid #34485b;
          color: #f4c044;
          box-shadow:
            0 15px 40px rgba(0,0,0,.45);
          text-align: center;
          font-weight: 700;
        }

        footer {
          text-align: center;
          padding: 30px 10px 20px;
          color: #687684;
        }

        .footerLogo {
          font-size: 22px;
          margin-bottom: 7px;
        }

        footer b,
        footer small {
          display: block;
        }

        footer small {
          margin-top: 4px;
        }

        @media(max-width:800px) {

          .header {
            align-items: flex-start;
            flex-direction: column;
          }

          .headerActions {
            width: 100%;
          }

          .headerActions button {
            flex: 1;
          }

          .heroCard {
            grid-template-columns: 1fr;
          }

          .personalGrid {
            grid-template-columns:
              repeat(2,1fr);
          }

        }

        @media(max-width:650px) {

          .page {
            padding: 0;
          }

          .app {
            padding: 12px;
          }

          .brandBox {
            align-items: flex-start;
          }

          .crateLogo {
            width: 65px;
            height: 65px;
          }

          h1 {
            font-size: 20px;
          }

          .headerActions {
            flex-direction: column;
          }

          .stats {
            grid-template-columns:
              repeat(2,1fr);
          }

          .tabs {
            grid-template-columns:
              repeat(3,1fr);
          }

          .tabs button {
            font-size: 10px;
          }

          .heroText h2 {
            font-size: 28px;
          }

          .three {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0;
          }

          .eventInfo {
            flex-direction: column;
          }

          .joinRow {
            grid-template-columns: 1fr;
          }

          .drink {
            align-items: flex-start;
          }

          .drinkRight {
            min-width: 100px;
          }

          .statisticsGrid {
            grid-template-columns:
              repeat(2,1fr);
          }

          .ranking {
            grid-template-columns:
              38px 38px 1fr;
          }

          .ranking > strong {
            grid-column: 3;
            text-align: left;
          }

          .request {
            align-items: flex-start;
          }

        }

        @media(max-width:430px) {

          .crateLogo {
            width: 56px;
            height: 56px;
          }

          .crateTop {
            font-size: 9px;
          }

          .crateBody {
            font-size: 15px;
          }

          h1 {
            font-size: 18px;
          }

          .header p {
            font-size: 11px;
          }

          .tabs button span {
            display: block;
          }

          .personalGrid {
            grid-template-columns:
              repeat(2,1fr);
          }

          .statisticsGrid {
            grid-template-columns: 1fr 1fr;
          }

        }

      `}</style>
    </main>
  );
}
