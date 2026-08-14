"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  user_id?: string;
  username?: string;
  name?: string;
  points?: number;
  drinks_count?: number;
  weight_kg?: number;
  height_cm?: number;
  age?: number;
  gender?: string;
  is_global_admin?: boolean;
};

type Event = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  invite_code?: string;
  start_date?: string;
  end_date?: string;
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

type Drink = {
  id: string;
  event_id?: string;
  profile_id?: string;
  category?: string;
  drink_name?: string;
  getraenk?: string;
  brand?: string;
  marke?: string;
  liters?: number;
  menge?: number;
  alcohol_percent?: number;
  alkohol?: number;
  quantity?: number;
  price?: number;
  preis?: number;
  image?: string;
  photo_url?: string;
  foto?: string;
  promille_wert?: number;
  created_at?: string;
};

type Member = {
  id: string;
  event_id: string;
  profile_id: string;
  role?: string;
  joined_via_code?: string;
  profile?: Profile;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status: string;
  message?: string;
  created_at: string;
};

type BeerResponse = {
  id: string;
  request_id: string;
  profile_id: string;
  response: string;
};

type Challenge = {
  id: string;
  event_id?: string;
  title: string;
  description?: string;
  category?: string;
  points?: number;
  status?: string;
};

type Tab =
  | "home"
  | "drinks"
  | "members"
  | "requests"
  | "challenges"
  | "ranking"
  | "stats";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [showLogin, setShowLogin] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [authMessage, setAuthMessage] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [event, setEvent] = useState<Event | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [requests, setRequests] = useState<BeerRequest[]>([]);
  const [responses, setResponses] = useState<BeerResponse[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [tab, setTab] = useState<Tab>("home");

  const [message, setMessage] = useState("");

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showJoinEvent, setShowJoinEvent] = useState(false);

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("Güsten");
  const [newEventDescription, setNewEventDescription] = useState("");

  const [inviteCode, setInviteCode] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  const [showDrinkForm, setShowDrinkForm] = useState(false);

  const [creating, setCreating] = useState(false);

  /* =========================================================
     AUTHENTIFIZIERUNG
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setAuthLoading(false);

      if (session?.user) {
        await loadProfile(session.user.id);
      }
    }

    loadAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setAuthLoading(false);

      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setProfile(data);
    }
  }

  async function login() {
    setAuthMessage("");

    if (!email.trim() || !password) {
      setAuthMessage("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setShowLogin(false);
    setMessage("✅ Erfolgreich angemeldet.");
  }

  async function register() {
    setAuthMessage("");

    if (!email.trim() || !password) {
      setAuthMessage("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    if (password.length < 6) {
      setAuthMessage("Das Passwort muss mindestens 6 Zeichen haben.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    if (data.user) {
      const name = username.trim() || email.split("@")[0];

      await supabase.from("profiles").upsert(
        {
          user_id: data.user.id,
          username: name,
          name,
          points: 0,
          drinks_count: 0,
        },
        {
          onConflict: "user_id",
        }
      );
    }

    setAuthMessage(
      "✅ Registrierung erfolgreich. Falls E-Mail-Bestätigung aktiviert ist, bitte zuerst die E-Mail bestätigen."
    );
  }

  async function logout() {
    await supabase.auth.signOut();

    setSession(null);
    setProfile(null);
    setEvent(null);
    setMembers([]);
    setDrinks([]);
    setRequests([]);
    setResponses([]);

    setMessage("Du wurdest abgemeldet.");
  }

  /* =========================================================
     EVENTS
     ========================================================= */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setEvents(data || []);

    if (!event && data && data.length > 0) {
      setEvent(data[0]);
    }
  }

  async function createEvent() {
    if (!session?.user || !profile) {
      setShowLogin(true);
      setAuthMessage("Bitte zuerst anmelden.");
      return;
    }

    if (!newEventTitle.trim()) {
      setMessage("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    setCreating(true);
    setMessage("");

    const generatedCode =
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: newEventTitle.trim(),
        description: newEventDescription.trim(),
        location: newEventLocation.trim(),
        invite_code: generatedCode,
        is_active: true,

        ranking_enabled: true,
        show_points: true,
        show_ranking: true,
        show_promille: true,
        show_statistics: true,
        show_drink_amounts: true,
        photo_required: false,
        ai_recognition_enabled: false,
        manual_entry_allowed: true,
        cost_overview_enabled: true,
        auto_split_costs: true,
        team_mode: false,
        show_photos: true,
        show_costs: true,
        privacy_mode: false,

        created_by_profile_id: profile.id,
        created_by: session.user.id,
      })
      .select("*")
      .single();

    setCreating(false);

    if (error) {
      console.error(error);
      setMessage("❌ Event konnte nicht erstellt werden: " + error.message);
      return;
    }

    if (!data) return;

    await supabase.from("event_members").insert({
      event_id: data.id,
      profile_id: profile.id,
      role: "admin",
    });

    setEvent(data);
    setEvents((prev) => [data, ...prev]);

    setShowCreateEvent(false);
    setNewEventTitle("");
    setNewEventDescription("");

    setMessage("✅ Event erfolgreich erstellt.");
  }

  async function joinEvent() {
    if (!session?.user || !profile) {
      setShowLogin(true);
      setAuthMessage("Bitte zuerst anmelden.");
      return;
    }

    if (!inviteCode.trim()) {
      setMessage("❌ Bitte Einladungscode eingeben.");
      return;
    }

    const { data: foundEvent, error } = await supabase
      .from("events")
      .select("*")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    if (!foundEvent) {
      setMessage("❌ Einladungscode nicht gefunden.");
      return;
    }

    const { error: memberError } = await supabase
      .from("event_members")
      .upsert(
        {
          event_id: foundEvent.id,
          profile_id: profile.id,
          joined_via_code: inviteCode.trim().toUpperCase(),
          role: "member",
        },
        {
          onConflict: "event_id,profile_id",
        }
      );

    if (memberError) {
      setMessage("❌ Beitritt fehlgeschlagen: " + memberError.message);
      return;
    }

    setEvent(foundEvent);
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === foundEvent.id);
      return exists ? prev : [foundEvent, ...prev];
    });

    setShowJoinEvent(false);
    setInviteCode("");

    setMessage("✅ Du bist dem Event beigetreten.");
  }

  /* =========================================================
     EVENT DATA
     ========================================================= */

  useEffect(() => {
    if (!session?.user || !profile) return;

    loadEvents();
  }, [session?.user?.id, profile?.id]);

  useEffect(() => {
    if (!event) return;

    loadEventData(event.id);

    const channel = supabase
      .channel("event-live-" + event.id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "beer_requests",
          filter: `event_id=eq.${event.id}`,
        },
        () => loadBeerRequests(event.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event?.id]);

  async function loadEventData(eventId: string) {
    await Promise.all([
      loadMembers(eventId),
      loadDrinks(eventId),
      loadBeerRequests(eventId),
      loadChallenges(eventId),
    ]);
  }

  async function loadMembers(eventId: string) {
    const { data, error } = await supabase
      .from("event_members")
      .select(
        `
        *,
        profile:profiles(*)
        `
      )
      .eq("event_id", eventId);

    if (!error) {
      setMembers(data || []);
    }
  }

  async function loadDrinks(eventId: string) {
    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (!error) {
      setDrinks(data || []);
    }
  }

  async function loadBeerRequests(eventId: string) {
    const { data, error } = await supabase
      .from("beer_requests")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (!error) {
      setRequests(data || []);

      if (data && data.length > 0) {
        const ids = data.map((r) => r.id);

        const { data: responseData } = await supabase
          .from("beer_request_responses")
          .select("*")
          .in("request_id", ids);

        setResponses(responseData || []);
      }
    }
  }

  async function loadChallenges(eventId: string) {
    const { data, error } = await supabase
      .from("challenge_dashboard")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (!error) {
      setChallenges(data || []);
    }
  }

  /* =========================================================
     GETRÄNKE
     ========================================================= */

  async function addDrink() {
    if (!session?.user || !profile) {
      setShowLogin(true);
      setAuthMessage("Bitte zuerst anmelden.");
      return;
    }

    if (!event) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    if (!drinkName.trim()) {
      setMessage("❌ Bitte Getränk eingeben.");
      return;
    }

    const liters = Number(drinkLiters) || 0;
    const alcohol = Number(drinkAlcohol) || 0;
    const price = Number(drinkPrice) || 0;

    const { error } = await supabase.from("drinks").insert({
      event_id: event.id,
      profile_id: profile.id,

      category: "Bier",
      drink_name: drinkName.trim(),
      getraenk: drinkName.trim(),

      brand: drinkBrand.trim(),
      marke: drinkBrand.trim(),

      liters,
      menge: liters,

      alcohol_percent: alcohol,
      alkohol: alcohol,

      quantity: 1,

      price,
      preis: price,

      promille_wert: 0,
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

    setShowDrinkForm(false);

    await loadDrinks(event.id);

    setMessage("✅ Getränk gespeichert.");
  }

  /* =========================================================
     BIER ANFRAGE
     ========================================================= */

  async function requestBeer() {
    if (!session?.user || !profile) {
      setShowLogin(true);
      setAuthMessage("Bitte zuerst anmelden.");
      return;
    }

    if (!event) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    const { error } = await supabase.from("beer_requests").insert({
      event_id: event.id,
      requester_profile_id: profile.id,
      status: "pending",
      message: `${profile.name || profile.username || "Jemand"} möchte ein Bier trinken.`,
    });

    if (error) {
      setMessage("❌ Bier-Anfrage konnte nicht erstellt werden: " + error.message);
      return;
    }

    await loadBeerRequests(event.id);

    setMessage(
      "🍺 Bier-Anfrage gesendet. Alle Teilnehmer können jetzt zustimmen oder ablehnen."
    );
  }

  async function answerBeerRequest(
    request: BeerRequest,
    answer: "accepted" | "declined"
  ) {
    if (!profile || !event) return;

    const alreadyAnswered = responses.some(
      (r) =>
        r.request_id === request.id &&
        r.profile_id === profile.id
    );

    if (alreadyAnswered) return;

    const { error } = await supabase
      .from("beer_request_responses")
      .insert({
        request_id: request.id,
        profile_id: profile.id,
        response: answer,
      });

    if (error) {
      setMessage("❌ Antwort konnte nicht gespeichert werden.");
      return;
    }

    await loadBeerRequests(event.id);

    setMessage(
      answer === "accepted"
        ? "✅ Du hast zugestimmt."
        : "❌ Du hast abgelehnt."
    );
  }

  /* =========================================================
     BIERKISTE
     ========================================================= */

  async function giveBeerCrate() {
    if (!session?.user || !profile) {
      setShowLogin(true);
      setAuthMessage("Bitte zuerst anmelden.");
      return;
    }

    if (!event) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    const points = 50;

    const { error } = await supabase
      .from("beer_crate_sponsorships")
      .insert({
        event_id: event.id,
        profile_id: profile.id,
        crates: 1,
        points_awarded: points,
        description: "Bierkiste für die Runde ausgegeben",
      });

    if (error) {
      setMessage("❌ Bierkiste konnte nicht gespeichert werden: " + error.message);
      return;
    }

    const newPoints = Number(profile.points || 0) + points;

    await supabase
      .from("profiles")
      .update({
        points: newPoints,
      })
      .eq("id", profile.id);

    setProfile({
      ...profile,
      points: newPoints,
    });

    setMessage(`🍻 Bierkiste ausgegeben! +${points} Punkte`);
  }

  /* =========================================================
     STATISTIK
     ========================================================= */

  const totalLiters = drinks.reduce(
    (sum, d) =>
      sum +
      Number(d.liters ?? d.menge ?? 0) *
        Number(d.quantity ?? 1),
    0
  );

  const totalCost = drinks.reduce(
    (sum, d) =>
      sum +
      Number(d.price ?? d.preis ?? 0) *
        Number(d.quantity ?? 1),
    0
  );

  const totalDrinks = drinks.reduce(
    (sum, d) => sum + Number(d.quantity ?? 1),
    0
  );

  const costPerPerson =
    members.length > 0
      ? totalCost / members.length
      : 0;

  const ranking = [...members].sort(
    (a, b) =>
      Number(b.profile?.points || 0) -
      Number(a.profile?.points || 0)
  );

  const myPoints = Number(profile?.points || 0);

  /* =========================================================
     LOGIN SCREEN
     ========================================================= */

  if (authLoading) {
    return (
      <main className="loading">
        <div className="loadingBox">
          <div className="crateIcon">🍺🍺</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>App wird geladen...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app">
      <div className="appShell">

        {/* HEADER */}

        <header className="header">
          <div className="brand">

            <button
              className="crateLogo"
              onClick={() => setTab("home")}
              aria-label="Startseite"
            >
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
            </button>

            <div>
              <h1>Güstener Zapfhahn Zentrale</h1>
              <p>Events · Getränke · Kosten · Rankings</p>
            </div>
          </div>

          <div className="headerActions">

            {session ? (
              <>
                <span className="userBadge">
                  👤{" "}
                  {profile?.name ||
                    profile?.username ||
                    session.user.email}
                </span>

                <button
                  className="secondary"
                  onClick={logout}
                >
                  Abmelden
                </button>
              </>
            ) : (
              <button
                className="primary"
                onClick={() => {
                  setRegisterMode(false);
                  setShowLogin(true);
                }}
              >
                🔐 Anmelden
              </button>
            )}

          </div>
        </header>

        {/* AUTH BANNER */}

        {!session && (
          <section className="loginBanner">
            <div>
              <strong>🔐 Noch nicht angemeldet</strong>
              <p>
                Melde dich an, um Events zu erstellen,
                beizutreten und an Bier-Anfragen teilzunehmen.
              </p>
            </div>

            <button
              className="primary"
              onClick={() => {
                setRegisterMode(false);
                setShowLogin(true);
              }}
            >
              Anmelden
            </button>
          </section>
        )}

        {/* EVENT HEADER */}

        {event ? (
          <>
            <section className="eventHero">

              <div>
                <span className="eyebrow">
                  AKTUELLES EVENT
                </span>

                <h2>{event.title}</h2>

                {event.location && (
                  <p>📍 {event.location}</p>
                )}

                {event.description && (
                  <p>{event.description}</p>
                )}
              </div>

              <div className="eventButtons">

                <button
                  className="secondary"
                  onClick={() => setShowJoinEvent(true)}
                >
                  🔑 Event beitreten
                </button>

                <button
                  className="primary"
                  onClick={() => {
                    if (!session) {
                      setShowLogin(true);
                      setAuthMessage("Bitte zuerst anmelden.");
                      return;
                    }

                    setShowCreateEvent(true);
                  }}
                >
                  ➕ Event erstellen
                </button>

              </div>

            </section>

            {/* NAV */}

            <nav className="tabs">

              <button
                className={tab === "home" ? "active" : ""}
                onClick={() => setTab("home")}
              >
                🏠 Übersicht
              </button>

              <button
                className={tab === "drinks" ? "active" : ""}
                onClick={() => setTab("drinks")}
              >
                🍺 Getränke
              </button>

              <button
                className={tab === "members" ? "active" : ""}
                onClick={() => setTab("members")}
              >
                👥 Teilnehmer
              </button>

              <button
                className={tab === "requests" ? "active" : ""}
                onClick={() => setTab("requests")}
              >
                🍻 Bier-Anfragen
              </button>

              <button
                className={tab === "challenges" ? "active" : ""}
                onClick={() => setTab("challenges")}
              >
                🔥 Challenges
              </button>

              <button
                className={tab === "ranking" ? "active" : ""}
                onClick={() => setTab("ranking")}
              >
                🏆 Ranking
              </button>

              <button
                className={tab === "stats" ? "active" : ""}
                onClick={() => setTab("stats")}
              >
                📊 Statistik
              </button>

            </nav>

            {/* STATS */}

            <section className="stats">

              <div>
                <span>🍺</span>
                <strong>{totalDrinks}</strong>
                <small>Getränke</small>
              </div>

              <div>
                <span>💧</span>
                <strong>{totalLiters.toFixed(1)}</strong>
                <small>Liter</small>
              </div>

              <div>
                <span>👥</span>
                <strong>{members.length}</strong>
                <small>Teilnehmer</small>
              </div>

              <div>
                <span>🏆</span>
                <strong>{myPoints}</strong>
                <small>Meine Punkte</small>
              </div>

            </section>

            {/* HOME */}

            {tab === "home" && (
              <>

                <section className="grid2">

                  {/* BIER ANFRAGEN */}

                  <div className="card beerRequestCard">

                    <div className="bigEmoji">🍺</div>

                    <h2>Ich möchte ein Bier</h2>

                    <p>
                      Alle Teilnehmer bekommen eine Anfrage
                      und können zustimmen oder ablehnen.
                    </p>

                    <button
                      className="primary full"
                      onClick={requestBeer}
                    >
                      🍺 Bier anfragen
                    </button>

                  </div>

                  {/* BIERKISTE */}

                  <div className="card crateCard">

                    <div className="crateVisual">
                      <span>🍺</span>
                      <span>🍺</span>
                      <span>🍺</span>
                      <b>BIERKISTE</b>
                    </div>

                    <h2>Bierkiste ausgeben</h2>

                    <p>
                      Du gibst eine Kiste Bier für die Runde
                      aus und bekommst dafür Punkte.
                    </p>

                    <button
                      className="primary full"
                      onClick={giveBeerCrate}
                    >
                      🍻 Kiste ausgeben
                    </button>

                  </div>

                </section>

                {/* INVITE */}

                <section className="card inviteCard">

                  <div>
                    <span className="eyebrow">
                      🔑 EINLADUNGSCODE
                    </span>

                    <div className="inviteCode">
                      {event.invite_code || "—"}
                    </div>

                    <p>
                      Diesen Code können Freunde verwenden,
                      um dem Event beizutreten.
                    </p>
                  </div>

                  <button
                    className="secondary"
                    onClick={async () => {
                      if (!event.invite_code) return;

                      await navigator.clipboard.writeText(
                        event.invite_code
                      );

                      setMessage("📋 Einladungscode kopiert.");
                    }}
                  >
                    📋 Kopieren
                  </button>

                </section>

                {/* PROMILLE */}

                <section className="card">

                  <h2>🧪 Mein Promillewert</h2>

                  {event.show_promille === false ? (
                    <p>
                      Promille-Anzeige für dieses Event
                      deaktiviert.
                    </p>
                  ) : (
                    <div className="promille">
                      <strong>0.00 ‰</strong>
                      <small>
                        Berechnung wird mit den
                        persönlichen Daten und Getränken
                        durchgeführt.
                      </small>
                    </div>
                  )}

                </section>

                {/* QUICK ACTIONS */}

                <section className="card">

                  <h2>⚡ Schnellaktionen</h2>

                  <div className="quickActions">

                    <button
                      onClick={() => {
                        setTab("drinks");
                        setShowDrinkForm(true);
                      }}
                    >
                      ➕ Getränk hinzufügen
                    </button>

                    <button
                      onClick={() => setTab("requests")}
                    >
                      🍻 Bier-Anfragen
                      {requests.length > 0 &&
                        ` (${requests.length})`}
                    </button>

                    <button
                      onClick={() => setTab("challenges")}
                    >
                      🔥 Challenges
                    </button>

                    <button
                      onClick={() => setTab("ranking")}
                    >
                      🏆 Ranking
                    </button>

                  </div>

                </section>

              </>
            )}

            {/* DRINKS */}

            {tab === "drinks" && (
              <section className="card">

                <div className="sectionHeader">
                  <div>
                    <h2>🍺 Getränke</h2>
                    <p>
                      Alle Getränke des Events
                    </p>
                  </div>

                  <button
                    className="primary"
                    onClick={() =>
                      setShowDrinkForm(!showDrinkForm)
                    }
                  >
                    ➕ Getränk
                  </button>
                </div>

                {showDrinkForm && (
                  <div className="formBox">

                    <input
                      placeholder="Getränk"
                      value={drinkName}
                      onChange={(e) =>
                        setDrinkName(e.target.value)
                      }
                    />

                    <input
                      placeholder="Marke"
                      value={drinkBrand}
                      onChange={(e) =>
                        setDrinkBrand(e.target.value)
                      }
                    />

                    <div className="three">

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
                      className="primary full"
                      onClick={addDrink}
                    >
                      🍻 Getränk speichern
                    </button>

                  </div>
                )}

                {drinks.length === 0 ? (
                  <div className="empty">
                    🍺 Noch keine Getränke.
                  </div>
                ) : (
                  drinks.map((drink) => (
                    <div
                      className="listItem"
                      key={drink.id}
                    >

                      <div className="drinkIcon">
                        🍺
                      </div>

                      <div className="listMain">

                        <strong>
                          {drink.drink_name ||
                            drink.getraenk ||
                            "Getränk"}
                        </strong>

                        <small>
                          {drink.marke ||
                            drink.brand ||
                            "Keine Marke"}
                          {" · "}
                          {Number(
                            drink.liters ??
                              drink.menge ??
                              0
                          ).toFixed(1)}
                          {" L · "}
                          {Number(
                            drink.alcohol_percent ??
                              drink.alkohol ??
                              0
                          ).toFixed(1)}
                          {" %"}
                        </small>

                      </div>

                      <strong>
                        {Number(
                          drink.price ??
                            drink.preis ??
                            0
                        ).toFixed(2)}
                        €
                      </strong>

                    </div>
                  ))
                )}

              </section>
            )}

            {/* MEMBERS */}

            {tab === "members" && (
              <section className="card">

                <h2>👥 Teilnehmer</h2>

                {members.length === 0 ? (
                  <div className="empty">
                    Noch keine Teilnehmer.
                  </div>
                ) : (
                  members.map((member) => (
                    <div
                      className="member"
                      key={member.id}
                    >

                      <div className="avatar">
                        👤
                      </div>

                      <div>
                        <strong>
                          {member.profile?.name ||
                            member.profile?.username ||
                            "Teilnehmer"}
                        </strong>

                        <small>
                          {member.role === "admin"
                            ? "Administrator"
                            : "Teilnehmer"}
                        </small>
                      </div>

                      <strong>
                        {member.profile?.points || 0} Punkte
                      </strong>

                    </div>
                  ))
                )}

              </section>
            )}

            {/* REQUESTS */}

            {tab === "requests" && (
              <section className="card">

                <h2>🍻 Bier-Anfragen</h2>

                {requests.length === 0 ? (
                  <div className="empty">
                    Keine Bier-Anfragen.
                  </div>
                ) : (
                  requests.map((request) => {

                    const requester =
                      members.find(
                        (m) =>
                          m.profile_id ===
                          request.requester_profile_id
                      );

                    const myResponse =
                      responses.find(
                        (r) =>
                          r.request_id === request.id &&
                          r.profile_id === profile?.id
                      );

                    return (
                      <div
                        className="request"
                        key={request.id}
                      >

                        <div className="bigEmoji">
                          🍺
                        </div>

                        <div className="requestMain">

                          <strong>
                            {requester?.profile?.name ||
                              requester?.profile?.username ||
                              "Teilnehmer"}
                            {" möchte ein Bier trinken."}
                          </strong>

                          <small>
                            {new Date(
                              request.created_at
                            ).toLocaleString("de-DE")}
                          </small>

                          {myResponse ? (
                            <span className="response">
                              Deine Antwort:{" "}
                              {myResponse.response ===
                              "accepted"
                                ? "✅ Zustimmung"
                                : "❌ Ablehnung"}
                            </span>
                          ) : request.requester_profile_id ===
                            profile?.id ? (
                            <span className="response">
                              Deine Anfrage
                            </span>
                          ) : (
                            <div className="requestButtons">

                              <button
                                className="accept"
                                onClick={() =>
                                  answerBeerRequest(
                                    request,
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
                                    request,
                                    "declined"
                                  )
                                }
                              >
                                ❌ Ablehnen
                              </button>

                            </div>
                          )}

                        </div>

                      </div>
                    );
                  })
                )}

              </section>
            )}

            {/* CHALLENGES */}

            {tab === "challenges" && (
              <section className="card">

                <h2>🔥 Challenges</h2>

                {challenges.length === 0 ? (
                  <div className="empty">
                    🔥 Noch keine Challenges vorhanden.
                  </div>
                ) : (
                  challenges.map((challenge) => (
                    <div
                      className="challenge"
                      key={challenge.id}
                    >

                      <div className="challengeIcon">
                        🔥
                      </div>

                      <div>
                        <strong>
                          {challenge.title}
                        </strong>

                        <small>
                          {challenge.description ||
                            "Challenge"}
                        </small>
                      </div>

                      <b>
                        +{challenge.points || 0}
                      </b>

                    </div>
                  ))
                )}

              </section>
            )}

            {/* RANKING */}

            {tab === "ranking" && (
              <section className="card">

                <h2>🏆 Ranking</h2>

                {ranking.length === 0 ? (
                  <div className="empty">
                    Noch keine Teilnehmer.
                  </div>
                ) : (
                  ranking.map((member, index) => (
                    <div
                      className="rankingRow"
                      key={member.id}
                    >

                      <strong className="rankNumber">
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : `${index + 1}.`}
                      </strong>

                      <span>
                        {member.profile?.name ||
                          member.profile?.username ||
                          "Teilnehmer"}
                      </span>

                      <b>
                        {member.profile?.points || 0} Punkte
                      </b>

                    </div>
                  ))
                )}

              </section>
            )}

            {/* STATISTICS */}

            {tab === "stats" && (
              <section className="grid2">

                <div className="card statisticCard">

                  <span>🍺</span>

                  <strong>
                    {totalDrinks}
                  </strong>

                  <small>
                    Getränke
                  </small>

                </div>

                <div className="card statisticCard">

                  <span>💧</span>

                  <strong>
                    {totalLiters.toFixed(1)} L
                  </strong>

                  <small>
                    Gesamtmenge
                  </small>

                </div>

                <div className="card statisticCard">

                  <span>💶</span>

                  <strong>
                    {totalCost.toFixed(2)} €
                  </strong>

                  <small>
                    Gesamtkosten
                  </small>

                </div>

                <div className="card statisticCard">

                  <span>👤</span>

                  <strong>
                    {costPerPerson.toFixed(2)} €
                  </strong>

                  <small>
                    Pro Person
                  </small>

                </div>

              </section>
            )}

          </>
        ) : (
          <section className="emptyEvent">

            <div className="crateBig">
              🍺🍺🍺
            </div>

            <h2>Noch kein Event ausgewählt</h2>

            <p>
              Erstelle ein neues Event oder tritt einem
              bestehenden Event mit Einladungscode bei.
            </p>

            <div className="emptyButtons">

              <button
                className="primary"
                onClick={() => {
                  if (!session) {
                    setShowLogin(true);
                    setAuthMessage(
                      "Bitte zuerst anmelden, um ein Event zu erstellen."
                    );
                    return;
                  }

                  setShowCreateEvent(true);
                }}
              >
                ➕ Event erstellen
              </button>

              <button
                className="secondary"
                onClick={() => setShowJoinEvent(true)}
              >
                🔑 Event beitreten
              </button>

            </div>

          </section>
        )}

        {/* MESSAGE */}

        {message && (
          <div className="message">
            {message}
            <button
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}

        {/* FOOTER */}

        <footer>
          🍻 Güstener Zapfhahn Zentrale
          <small>
            Dein Event. Deine Getränke. Deine Runde.
          </small>
        </footer>

      </div>

      {/* LOGIN MODAL */}

      {showLogin && (
        <div className="modalBackdrop">

          <div className="modal">

            <button
              className="close"
              onClick={() => setShowLogin(false)}
            >
              ×
            </button>

            <div className="modalIcon">
              🔐
            </div>

            <h2>
              {registerMode
                ? "Konto erstellen"
                : "Anmelden"}
            </h2>

            <p>
              {registerMode
                ? "Erstelle dein Konto für die Güstener Zapfhahn Zentrale."
                : "Melde dich an, um Events zu erstellen und beizutreten."}
            </p>

            {registerMode && (
              <input
                placeholder="Name / Benutzername"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
              />
            )}

            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  registerMode ? register() : login();
                }
              }}
            />

            {authMessage && (
              <div className="authMessage">
                {authMessage}
              </div>
            )}

            <button
              className="primary full"
              onClick={
                registerMode
                  ? register
                  : login
              }
            >
              {registerMode
                ? "👤 Konto erstellen"
                : "🔐 Anmelden"}
            </button>

            <button
              className="linkButton"
              onClick={() => {
                setRegisterMode(!registerMode);
                setAuthMessage("");
              }}
            >
              {registerMode
                ? "Ich habe bereits ein Konto"
                : "Noch kein Konto? Jetzt registrieren"}
            </button>

          </div>

        </div>
      )}

      {/* CREATE EVENT MODAL */}

      {showCreateEvent && (
        <div className="modalBackdrop">

          <div className="modal">

            <button
              className="close"
              onClick={() => setShowCreateEvent(false)}
            >
              ×
            </button>

            <div className="modalIcon">
              📅
            </div>

            <h2>Event erstellen</h2>

            <input
              placeholder="Eventname"
              value={newEventTitle}
              onChange={(e) =>
                setNewEventTitle(e.target.value)
              }
            />

            <input
              placeholder="Ort"
              value={newEventLocation}
              onChange={(e) =>
                setNewEventLocation(e.target.value)
              }
            />

            <textarea
              placeholder="Beschreibung"
              value={newEventDescription}
              onChange={(e) =>
                setNewEventDescription(e.target.value)
              }
            />

            <button
              className="primary full"
              disabled={creating}
              onClick={createEvent}
            >
              {creating
                ? "⏳ Wird erstellt..."
                : "🍻 Event erstellen"}
            </button>

          </div>

        </div>
      )}

      {/* JOIN EVENT MODAL */}

      {showJoinEvent && (
        <div className="modalBackdrop">

          <div className="modal">

            <button
              className="close"
              onClick={() => setShowJoinEvent(false)}
            >
              ×
            </button>

            <div className="modalIcon">
              🔑
            </div>

            <h2>Event beitreten</h2>

            <p>
              Gib den Einladungscode des Events ein.
            </p>

            <input
              placeholder="z.B. FBD1-A687"
              value={inviteCode}
              onChange={(e) =>
                setInviteCode(
                  e.target.value.toUpperCase()
                )
              }
            />

            {!session && (
              <div className="authMessage">
                🔐 Bitte zuerst anmelden.
              </div>
            )}

            <button
              className="primary full"
              onClick={() => {
                if (!session) {
                  setShowJoinEvent(false);
                  setShowLogin(true);
                  setAuthMessage(
                    "Bitte zuerst anmelden, um einem Event beizutreten."
                  );
                  return;
                }

                joinEvent();
              }}
            >
              🔑 Event beitreten
            </button>

          </div>

        </div>
      )}

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

        body {
          overflow-x: hidden;
        }

        .app {
          min-height: 100vh;
          width: 100%;
          background:
            radial-gradient(
              circle at 50% -20%,
              #24374a 0%,
              #0d141c 38%,
              #070b10 75%
            );
          color: #f8fafc;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          padding: 0;
        }

        .appShell {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 18px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 10px 0 24px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .crateLogo {
          width: 72px;
          height: 72px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: center;
          justify-items: center;
          padding: 10px;
          border: 2px solid #9a5a13;
          border-radius: 14px;
          background:
            linear-gradient(
              145deg,
              #c77820,
              #82430e
            );
          box-shadow:
            inset 0 0 0 3px rgba(255,255,255,.08),
            0 8px 25px rgba(0,0,0,.35);
          font-size: 22px;
          cursor: pointer;
        }

        .crateLogo span {
          transform: translateY(-1px);
        }

        h1 {
          font-size: 26px;
          margin: 0 0 4px;
        }

        h2 {
          margin: 0 0 8px;
        }

        p {
          color: #9aa7b5;
          line-height: 1.5;
        }

        .headerActions,
        .eventButtons {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        button {
          border: 0;
          cursor: pointer;
          font: inherit;
          font-weight: 700;
          border-radius: 12px;
          transition:
            transform .15s ease,
            opacity .15s ease;
        }

        button:hover {
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .primary {
          background: #f59e0b;
          color: #111827;
          padding: 12px 17px;
        }

        .secondary {
          background: #202c39;
          color: #f8fafc;
          border: 1px solid #344252;
          padding: 11px 16px;
        }

        .full {
          width: 100%;
        }

        .userBadge {
          background: #16222f;
          border: 1px solid #2d3a49;
          border-radius: 999px;
          padding: 9px 13px;
          font-size: 13px;
        }

        .loginBanner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          background: rgba(245,158,11,.08);
          border: 1px solid rgba(245,158,11,.25);
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 14px;
        }

        .loginBanner p {
          margin-bottom: 0;
        }

        .eventHero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.08),
              rgba(255,255,255,.035)
            );
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 22px;
          padding: 22px;
          margin-bottom: 14px;
        }

        .eyebrow {
          color: #fbbf24;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .tabs {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding: 4px 0 12px;
          scrollbar-width: none;
        }

        .tabs::-webkit-scrollbar {
          display: none;
        }

        .tabs button {
          flex: 0 0 auto;
          padding: 10px 13px;
          background: #111a24;
          border: 1px solid #273443;
          color: #aab5c0;
        }

        .tabs button.active {
          background: #f59e0b;
          color: #111827;
          border-color: #f59e0b;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .stats > div {
          min-height: 105px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 17px;
        }

        .stats span {
          font-size: 23px;
        }

        .stats strong {
          font-size: 22px;
          margin-top: 4px;
        }

        .stats small {
          color: #83909e;
          margin-top: 3px;
        }

        .grid2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .card {
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.085);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 14px;
        }

        .beerRequestCard,
        .crateCard {
          text-align: center;
        }

        .bigEmoji {
          font-size: 42px;
          margin-bottom: 10px;
        }

        .crateVisual {
          width: 190px;
          margin: 0 auto 15px;
          padding: 15px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
          border-radius: 13px;
          background:
            linear-gradient(
              145deg,
              #c97820,
              #743908
            );
          border: 3px solid #a85b14;
          box-shadow:
            inset 0 0 0 3px rgba(255,255,255,.08),
            0 10px 25px rgba(0,0,0,.3);
        }

        .crateVisual span {
          font-size: 27px;
        }

        .crateVisual b {
          grid-column: 1 / -1;
          font-size: 11px;
          letter-spacing: .1em;
          margin-top: 3px;
        }

        .inviteCard {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .inviteCode {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: .12em;
          margin-top: 8px;
          color: #fbbf24;
        }

        .promille {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          border-radius: 16px;
          background: rgba(255,255,255,.045);
        }

        .promille strong {
          font-size: 38px;
          color: #fbbf24;
        }

        .quickActions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .quickActions button {
          padding: 13px;
          background: #182330;
          border: 1px solid #2c3b4a;
          color: #f8fafc;
        }

        .sectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        input,
        textarea {
          width: 100%;
          border: 1px solid #344252;
          border-radius: 12px;
          padding: 13px;
          margin-bottom: 10px;
          background: #101923;
          color: white;
          outline: none;
        }

        textarea {
          min-height: 100px;
          resize: vertical;
        }

        input:focus,
        textarea:focus {
          border-color: #f59e0b;
        }

        .three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .formBox {
          background: rgba(0,0,0,.16);
          padding: 15px;
          border-radius: 15px;
          margin-bottom: 15px;
        }

        .listItem,
        .member,
        .challenge,
        .rankingRow,
        .request {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 14px;
          padding: 13px;
          margin-top: 8px;
        }

        .drinkIcon,
        .avatar,
        .challengeIcon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #182330;
          font-size: 22px;
        }

        .listMain,
        .requestMain {
          flex: 1;
        }

        .listMain small,
        .member small,
        .challenge small,
        .requestMain small {
          display: block;
          color: #8996a5;
          margin-top: 4px;
        }

        .requestButtons {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .accept {
          background: #22c55e;
          color: #07130a;
          padding: 9px 12px;
        }

        .decline {
          background: #ef4444;
          color: white;
          padding: 9px 12px;
        }

        .response {
          display: inline-block;
          margin-top: 8px;
          color: #fbbf24;
        }

        .rankNumber {
          width: 45px;
          text-align: center;
          font-size: 20px;
        }

        .rankingRow span {
          flex: 1;
        }

        .statisticCard {
          text-align: center;
        }

        .statisticCard span {
          font-size: 35px;
        }

        .statisticCard strong {
          display: block;
          font-size: 32px;
          margin: 10px 0 4px;
          color: #fbbf24;
        }

        .statisticCard small {
          color: #8c98a6;
        }

        .empty,
        .emptyEvent {
          text-align: center;
          color: #8f9baa;
          padding: 35px 15px;
        }

        .emptyEvent {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 22px;
          margin-top: 15px;
        }

        .crateBig {
          font-size: 45px;
          margin-bottom: 10px;
        }

        .emptyButtons {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .message {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: min(560px, calc(100% - 30px));
          background: #172230;
          border: 1px solid #394a5c;
          color: #fbbf24;
          border-radius: 14px;
          padding: 13px 15px;
          box-shadow: 0 15px 40px rgba(0,0,0,.4);
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .message button {
          background: transparent;
          color: white;
          font-size: 20px;
        }

        footer {
          text-align: center;
          color: #667484;
          padding: 30px 10px;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        .modalBackdrop {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,.72);
          backdrop-filter: blur(7px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
        }

        .modal {
          position: relative;
          width: min(440px, 100%);
          background: #101923;
          border: 1px solid #344252;
          border-radius: 22px;
          padding: 25px;
          box-shadow: 0 30px 80px rgba(0,0,0,.6);
        }

        .close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 34px;
          height: 34px;
          background: #202c39;
          color: white;
          font-size: 22px;
        }

        .modalIcon {
          font-size: 40px;
          margin-bottom: 10px;
        }

        .authMessage {
          background: rgba(245,158,11,.1);
          border: 1px solid rgba(245,158,11,.25);
          border-radius: 11px;
          padding: 10px;
          margin-bottom: 10px;
          color: #fbbf24;
          font-size: 13px;
        }

        .linkButton {
          background: transparent;
          color: #fbbf24;
          padding: 13px;
          width: 100%;
          margin-top: 4px;
        }

        .loading {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #070b10;
          color: white;
          font-family: Arial, sans-serif;
        }

        .loadingBox {
          text-align: center;
        }

        .loadingBox .crateIcon {
          font-size: 45px;
        }

        @media (max-width: 800px) {

          .header,
          .eventHero,
          .inviteCard {
            align-items: flex-start;
            flex-direction: column;
          }

          .headerActions,
          .eventButtons {
            width: 100%;
          }

          .headerActions button,
          .eventButtons button {
            flex: 1;
          }

          .quickActions {
            grid-template-columns: repeat(2, 1fr);
          }

        }

        @media (max-width: 600px) {

          .appShell {
            padding: 12px;
          }

          h1 {
            font-size: 20px;
          }

          .crateLogo {
            width: 58px;
            height: 58px;
            font-size: 17px;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .grid2 {
            grid-template-columns: 1fr;
          }

          .three {
            grid-template-columns: 1fr;
          }

          .quickActions {
            grid-template-columns: 1fr;
          }

          .tabs button {
            font-size: 12px;
          }

          .inviteCode {
            font-size: 24px;
          }

          .request {
            align-items: flex-start;
          }

        }

      `}</style>
    </main>
  );
}
