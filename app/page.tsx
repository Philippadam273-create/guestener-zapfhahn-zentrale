"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  user_id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  points: number | null;
  drinks_count: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  is_global_admin: boolean | null;
};

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  image: string | null;
  invite_code: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  ranking_enabled: boolean | null;
  show_points: boolean | null;
  show_ranking: boolean | null;
  show_promille: boolean | null;
  show_statistics: boolean | null;
  show_drink_amounts: boolean | null;
  photo_required: boolean | null;
  ai_recognition_enabled: boolean | null;
  manual_entry_allowed: boolean | null;
  cost_overview_enabled: boolean | null;
  auto_split_costs: boolean | null;
  team_mode: boolean | null;
  show_photos: boolean | null;
  show_costs: boolean | null;
  privacy_mode: boolean | null;
};

type Drink = {
  id: string;
  event_id: string;
  profile_id: string | null;
  category: string | null;
  drink_name: string | null;
  brand: string | null;
  marke: string | null;
  liters: number | null;
  menge: number | null;
  alcohol_percent: number | null;
  alkohol: number | null;
  quantity: number | null;
  preis: number | null;
  price: number | null;
  getraenk: string | null;
};

type Member = {
  id: string;
  event_id: string;
  profile_id: string;
  role: string | null;
  joined_via_code: string | null;
  profile?: Profile;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status: string;
  message: string | null;
  created_at: string;
  requester?: Profile;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");
  const [event, setEvent] = useState<Event | null>(null);

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [eventCreateOpen, setEventCreateOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const [drinkOpen, setDrinkOpen] = useState(false);
  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  const [activeTab, setActiveTab] = useState("overview");

  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setUser(session?.user ?? null);
      setAuthChecking(false);

      if (session?.user) {
        await loadProfile(session.user.id);
        await loadEvents();
      } else {
        setEvents([]);
      }

      setLoading(false);
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
        await loadEvents();
      } else {
        setProfile(null);
        setEvents([]);
        setEvent(null);
        setDrinks([]);
        setMembers([]);
        setBeerRequests([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
    }
  }, [eventId]);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("❌ Events konnten nicht geladen werden.");
      return;
    }

    const list = data ?? [];

    setEvents(list);

    if (!eventId && list.length > 0) {
      setEventId(list[0].id);
    }
  }

  async function loadEventData(id: string) {
    const selected = events.find((e) => e.id === id);

    if (selected) {
      setEvent(selected);
    } else {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) setEvent(data);
    }

    await Promise.all([
      loadDrinks(id),
      loadMembers(id),
      loadBeerRequests(id),
    ]);
  }

  async function loadDrinks(id: string) {
    const { data } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    setDrinks(data ?? []);
  }

  async function loadMembers(id: string) {
    const { data, error } = await supabase
      .from("event_members")
      .select(
        `
        id,
        event_id,
        profile_id,
        role,
        joined_via_code,
        profiles (
          id,
          user_id,
          username,
          name,
          email,
          points,
          drinks_count,
          weight_kg,
          height_cm,
          age,
          gender,
          is_global_admin
        )
      `
      )
      .eq("event_id", id);

    if (error) {
      setMembers([]);
      return;
    }

    setMembers((data ?? []) as unknown as Member[]);
  }

  async function loadBeerRequests(id: string) {
    const { data, error } = await supabase
      .from("beer_requests")
      .select(
        `
        id,
        event_id,
        requester_profile_id,
        status,
        message,
        created_at,
        profiles:requester_profile_id (
          id,
          user_id,
          username,
          name,
          email,
          points,
          drinks_count,
          weight_kg,
          height_cm,
          age,
          gender,
          is_global_admin
        )
      `
      )
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      setBeerRequests([]);
      return;
    }

    setBeerRequests(data ?? []);
  }

  function requireLogin(action?: string) {
    if (user) return true;

    setMessage(
      action
        ? `🔐 Bitte zuerst anmelden, um ${action} zu können.`
        : "🔐 Bitte zuerst anmelden."
    );

    setAuthMode("login");
    setAuthOpen(true);

    return false;
  }

  async function login() {
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("❌ E-Mail und Passwort eingeben.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setAuthOpen(false);
    setPassword("");
    setMessage("✅ Erfolgreich angemeldet.");
  }

  async function register() {
    setMessage("");

    if (!email.trim() || !password || !username.trim()) {
      setMessage("❌ Name, E-Mail und Passwort eingeben.");
      return;
    }

    if (password.length < 6) {
      setMessage("❌ Das Passwort muss mindestens 6 Zeichen haben.");
      return;
    }

    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    if (data.user) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          user_id: data.user.id,
          username: username.trim(),
          name: username.trim(),
          email: email.trim(),
          points: 0,
          drinks_count: 0,
        });
      }
    }

    setAuthOpen(false);
    setMessage(
      "✅ Registrierung erfolgreich. Falls E-Mail-Bestätigung aktiviert ist, bitte die E-Mail bestätigen."
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    setMessage("👋 Du wurdest abgemeldet.");
  }

  async function createEvent() {
    if (!requireLogin("ein Event zu erstellen")) return;

    if (!eventTitle.trim()) {
      setMessage("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    if (!profile) {
      setMessage(
        "❌ Dein Profil wurde noch nicht geladen. Bitte kurz neu anmelden."
      );
      return;
    }

    const code =
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        location: eventLocation.trim() || null,
        invite_code: code,
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
        created_by: profile.user_id,
      })
      .select()
      .single();

    if (error) {
      setMessage("❌ Event konnte nicht erstellt werden: " + error.message);
      return;
    }

    await supabase.from("event_members").insert({
      event_id: data.id,
      profile_id: profile.id,
      role: "admin",
      joined_via_code: "OWNER",
    });

    setEvents([data, ...events]);
    setEventId(data.id);
    setEvent(data);
    setEventCreateOpen(false);

    setEventTitle("");
    setEventLocation("");
    setEventDescription("");

    setMessage("✅ Event erfolgreich erstellt.");
  }

  async function joinEvent() {
    if (!requireLogin("einem Event beizutreten")) return;

    if (!joinCode.trim()) {
      setMessage("❌ Bitte Einladungscode eingeben.");
      return;
    }

    if (!profile) {
      setMessage("❌ Dein Profil wurde noch nicht geladen.");
      return;
    }

    const { data: foundEvent, error } = await supabase
      .from("events")
      .select("*")
      .eq("invite_code", joinCode.trim().toUpperCase())
      .maybeSingle();

    if (error || !foundEvent) {
      setMessage("❌ Einladungscode nicht gefunden.");
      return;
    }

    const { data: existing } = await supabase
      .from("event_members")
      .select("id")
      .eq("event_id", foundEvent.id)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!existing) {
      const { error: memberError } = await supabase
        .from("event_members")
        .insert({
          event_id: foundEvent.id,
          profile_id: profile.id,
          role: "member",
          joined_via_code: joinCode.trim().toUpperCase(),
        });

      if (memberError) {
        setMessage("❌ Beitritt fehlgeschlagen: " + memberError.message);
        return;
      }
    }

    setEvents([foundEvent, ...events.filter((e) => e.id !== foundEvent.id)]);
    setEventId(foundEvent.id);
    setEvent(foundEvent);
    setJoinOpen(false);
    setJoinCode("");

    setMessage("✅ Du bist dem Event beigetreten.");
  }

  async function saveDrink() {
    if (!requireLogin("ein Getränk hinzuzufügen")) return;

    if (!event) {
      setMessage("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      setMessage("❌ Bitte ein Getränk eingeben.");
      return;
    }

    if (!profile) {
      setMessage("❌ Profil nicht gefunden.");
      return;
    }

    const liters = Number(drinkLiters);
    const alcohol = Number(drinkAlcohol);
    const price = Number(drinkPrice);

    const { error } = await supabase.from("drinks").insert({
      event_id: event.id,
      profile_id: profile.id,

      category: "Bier",
      drink_name: drinkName.trim(),
      brand: drinkBrand.trim() || null,
      marke: drinkBrand.trim() || null,

      liters,
      menge: liters,

      alcohol_percent: alcohol,
      alkohol: alcohol,

      quantity: 1,

      preis: price,
      price,

      getraenk: drinkName.trim(),
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

    setDrinkOpen(false);

    await loadDrinks(event.id);

    setMessage("✅ Getränk gespeichert.");
  }

  async function requestBeer() {
    if (!requireLogin("ein Bier anzufordern")) return;

    if (!event || !profile) {
      setMessage("❌ Event oder Profil fehlt.");
      return;
    }

    const alreadyOpen = beerRequests.some(
      (r) =>
        r.requester_profile_id === profile.id &&
        ["pending", "approved"].includes(r.status)
    );

    if (alreadyOpen) {
      setMessage("🍺 Du hast bereits eine offene Bier-Anfrage.");
      return;
    }

    const { error } = await supabase.from("beer_requests").insert({
      event_id: event.id,
      requester_profile_id: profile.id,
      status: "pending",
      message: `${profile.name || profile.username || "Ein Teilnehmer"} möchte gerne ein Bier trinken.`,
    });

    if (error) {
      setMessage("❌ Bier-Anfrage konnte nicht erstellt werden: " + error.message);
      return;
    }

    await loadBeerRequests(event.id);

    setMessage(
      "🍺 Bier-Anfrage gesendet. Die anderen Teilnehmer können jetzt zustimmen oder ablehnen."
    );
  }

  async function respondBeerRequest(
    request: BeerRequest,
    response: "approved" | "rejected"
  ) {
    if (!profile) return;

    const { error } = await supabase.from("beer_request_responses").insert({
      request_id: request.id,
      profile_id: profile.id,
      response,
    });

    if (error) {
      setMessage("❌ Antwort konnte nicht gespeichert werden.");
      return;
    }

    const { data: responses } = await supabase
      .from("beer_request_responses")
      .select("response")
      .eq("request_id", request.id);

    const totalMembers = Math.max(members.length - 1, 1);
    const approvals =
      responses?.filter((r) => r.response === "approved").length ?? 0;

    const rejections =
      responses?.filter((r) => r.response === "rejected").length ?? 0;

    if (rejections > totalMembers / 2) {
      await supabase
        .from("beer_requests")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", request.id);
    } else if (approvals > totalMembers / 2) {
      await supabase
        .from("beer_requests")
        .update({
          status: "approved",
          responded_at: new Date().toISOString(),
        })
        .eq("id", request.id);
    }

    if (event) {
      await loadBeerRequests(event.id);
    }

    setMessage(
      response === "approved"
        ? "👍 Zustimmung gespeichert."
        : "👎 Ablehnung gespeichert."
    );
  }

  async function giveBeerCrate() {
    if (!requireLogin("eine Bierkiste auszugeben")) return;

    if (!event || !profile) {
      setMessage("❌ Event oder Profil fehlt.");
      return;
    }

    const { error } = await supabase
      .from("beer_crate_sponsorships")
      .insert({
        event_id: event.id,
        profile_id: profile.id,
        crates: 1,
        points_awarded: 50,
        description: "Bierkiste für die Runde ausgegeben",
      });

    if (error) {
      setMessage("❌ Bierkiste konnte nicht eingetragen werden: " + error.message);
      return;
    }

    await supabase
      .from("profiles")
      .update({
        points: (profile.points ?? 0) + 50,
      })
      .eq("id", profile.id);

    setProfile({
      ...profile,
      points: (profile.points ?? 0) + 50,
    });

    setMessage("🍻 Bierkiste ausgegeben! +50 Punkte.");
  }

  async function copyInviteCode() {
    if (!event?.invite_code) return;

    await navigator.clipboard.writeText(event.invite_code);

    setMessage("📋 Einladungscode kopiert.");
  }

  const totalLiters = drinks.reduce(
    (sum, drink) =>
      sum +
      Number(drink.liters ?? drink.menge ?? 0) *
        Number(drink.quantity ?? 1),
    0
  );

  const totalCost = drinks.reduce(
    (sum, drink) =>
      sum +
      Number(drink.preis ?? drink.price ?? 0) *
        Number(drink.quantity ?? 1),
    0
  );

  const pendingRequests = beerRequests.filter(
    (r) => r.status === "pending"
  );

  const ranking = [...members].sort(
    (a, b) =>
      Number(b.profile?.points ?? 0) -
      Number(a.profile?.points ?? 0)
  );

  if (authChecking || loading) {
    return (
      <main className="page">
        <div className="loading">
          <div className="crate">🍺🍺</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>Wird geladen …</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="app">

        <header className="topbar">
          <div className="brand">
            <div className="crateLogo">
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
            </div>

            <div>
              <h1>Güstener Zapfhahn Zentrale</h1>
              <p>Events · Getränke · Kosten · Rankings</p>
            </div>
          </div>

          <div className="account">
            {user ? (
              <>
                <span>
                  👤{" "}
                  {profile?.name ||
                    profile?.username ||
                    user.email}
                </span>

                <button
                  className="smallButton"
                  onClick={logout}
                >
                  Abmelden
                </button>
              </>
            ) : (
              <button
                className="loginButton"
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                🔐 Anmelden
              </button>
            )}
          </div>
        </header>

        <div className="mainActions">
          <button
            className="primary"
            onClick={() => {
              if (!requireLogin("ein Event zu erstellen")) return;
              setEventCreateOpen(true);
            }}
          >
            ➕ Event erstellen
          </button>

          <button
            className="secondary"
            onClick={() => {
              if (!requireLogin("einem Event beizutreten")) return;
              setJoinOpen(true);
            }}
          >
            🔑 Event beitreten
          </button>
        </div>

        {message && (
          <div className="message">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {!user && (
          <section className="loginHint">
            <div>
              <strong>🔐 Noch nicht angemeldet?</strong>
              <span>
                Melde dich an, um Events zu erstellen, beizutreten und Punkte
                zu sammeln.
              </span>
            </div>

            <button
              onClick={() => {
                setAuthMode("login");
                setAuthOpen(true);
              }}
            >
              Jetzt anmelden
            </button>
          </section>
        )}

        {events.length > 0 && (
          <section className="eventSelector card">
            <div>
              <label>AKTUELLES EVENT</label>

              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            {event?.location && (
              <div className="location">
                📍 {event.location}
              </div>
            )}
          </section>
        )}

        {events.length === 0 ? (
          <section className="empty card">
            <div className="emptyIcon">🍻</div>
            <h2>Noch kein Event</h2>
            <p>
              Erstelle dein erstes Event oder tritt mit einem Einladungscode
              einem bestehenden Event bei.
            </p>

            <div className="emptyButtons">
              <button
                className="primary"
                onClick={() => {
                  if (!requireLogin("ein Event zu erstellen")) return;
                  setEventCreateOpen(true);
                }}
              >
                ➕ Event erstellen
              </button>

              <button
                className="secondary"
                onClick={() => {
                  if (!requireLogin("einem Event beizutreten")) return;
                  setJoinOpen(true);
                }}
              >
                🔑 Einladungscode
              </button>
            </div>
          </section>
        ) : (
          <>
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
                className={activeTab === "members" ? "active" : ""}
                onClick={() => setActiveTab("members")}
              >
                👥 Teilnehmer
              </button>

              <button
                className={activeTab === "requests" ? "active" : ""}
                onClick={() => setActiveTab("requests")}
              >
                🍻 Bier-Anfragen
                {pendingRequests.length > 0 && (
                  <b className="badge">{pendingRequests.length}</b>
                )}
              </button>

              <button
                className={activeTab === "ranking" ? "active" : ""}
                onClick={() => setActiveTab("ranking")}
              >
                🏆 Ranking
              </button>

              <button
                className={activeTab === "statistics" ? "active" : ""}
                onClick={() => setActiveTab("statistics")}
              >
                📊 Statistik
              </button>
            </nav>

            {activeTab === "overview" && (
              <>
                <section className="stats">
                  <div className="stat">
                    <span>🍺</span>
                    <strong>{drinks.length}</strong>
                    <small>Getränke</small>
                  </div>

                  <div className="stat">
                    <span>💧</span>
                    <strong>{totalLiters.toFixed(1)}</strong>
                    <small>Liter</small>
                  </div>

                  <div className="stat">
                    <span>👥</span>
                    <strong>{members.length}</strong>
                    <small>Teilnehmer</small>
                  </div>

                  <div className="stat">
                    <span>🏆</span>
                    <strong>{profile?.points ?? 0}</strong>
                    <small>Meine Punkte</small>
                  </div>
                </section>

                <section className="beerActions">
                  <div className="actionCard beerRequest">
                    <div className="bigBeer">🍺</div>

                    <h2>Ich möchte ein Bier</h2>

                    <p>
                      Alle Teilnehmer bekommen eine Anfrage und können
                      zustimmen oder ablehnen.
                    </p>

                    <button onClick={requestBeer}>
                      🍺 Bier anfragen
                    </button>
                  </div>

                  <div className="actionCard crateAction">
                    <div className="crateLarge">
                      🍺 🍺
                      <br />
                      🍺 🍺
                    </div>

                    <h2>Bierkiste ausgeben</h2>

                    <p>
                      Du gibst eine Kiste Bier für die Runde aus und bekommst
                      dafür Punkte.
                    </p>

                    <button onClick={giveBeerCrate}>
                      🍻 Kiste ausgeben
                    </button>
                  </div>
                </section>

                <section className="card invite">
                  <div>
                    <h2>🔑 Einladungscode</h2>

                    <p>
                      Diesen Code können Freunde verwenden, um dem Event
                      beizutreten.
                    </p>
                  </div>

                  <div className="inviteCode">
                    <strong>{event?.invite_code || "------"}</strong>

                    <button onClick={copyInviteCode}>
                      📋 Kopieren
                    </button>
                  </div>
                </section>

                <section className="card promille">
                  <h2>🧪 Mein Promillewert</h2>

                  {event?.show_promille ? (
                    <div className="promilleValue">
                      <strong>0.00 ‰</strong>
                      <span>
                        Der aktuelle Wert wird anhand deiner eingetragenen
                        Getränke berechnet.
                      </span>
                    </div>
                  ) : (
                    <p>Promille-Anzeige für dieses Event deaktiviert.</p>
                  )}
                </section>

                <section className="card">
                  <h2>⚡ Schnellaktionen</h2>

                  <div className="quickActions">
                    <button onClick={() => setDrinkOpen(true)}>
                      ➕ Getränk hinzufügen
                    </button>

                    <button
                      onClick={() => setActiveTab("requests")}
                    >
                      🍻 Bier-Anfragen
                      {pendingRequests.length > 0 &&
                        ` (${pendingRequests.length})`}
                    </button>

                    <button onClick={() => setActiveTab("ranking")}>
                      🏆 Ranking
                    </button>

                    <button onClick={() => setActiveTab("statistics")}>
                      📊 Statistik
                    </button>
                  </div>
                </section>
              </>
            )}

            {activeTab === "drinks" && (
              <section className="card">
                <div className="sectionHeader">
                  <h2>🍺 Getränke</h2>

                  <button onClick={() => setDrinkOpen(true)}>
                    ➕ Getränk
                  </button>
                </div>

                {drinks.length === 0 ? (
                  <div className="emptySmall">
                    Noch keine Getränke eingetragen.
                  </div>
                ) : (
                  drinks.map((drink) => (
                    <div className="drinkRow" key={drink.id}>
                      <div className="drinkIcon">🍺</div>

                      <div className="drinkInfo">
                        <strong>
                          {drink.drink_name ||
                            drink.getraenk ||
                            "Getränk"}
                        </strong>

                        <span>
                          {drink.brand ||
                            drink.marke ||
                            "Bier"}
                        </span>

                        <small>
                          {Number(
                            drink.liters ?? drink.menge ?? 0
                          ).toFixed(1)}{" "}
                          L ·{" "}
                          {Number(
                            drink.alcohol_percent ??
                              drink.alkohol ??
                              0
                          ).toFixed(1)}{" "}
                          %
                        </small>
                      </div>

                      <strong>
                        {Number(
                          drink.preis ?? drink.price ?? 0
                        ).toFixed(2)}{" "}
                        €
                      </strong>
                    </div>
                  ))
                )}
              </section>
            )}

            {activeTab === "members" && (
              <section className="card">
                <h2>👥 Teilnehmer</h2>

                {members.length === 0 ? (
                  <div className="emptySmall">
                    Noch keine Teilnehmer.
                  </div>
                ) : (
                  members.map((member, index) => (
                    <div className="memberRow" key={member.id}>
                      <div className="avatar">
                        {(member.profile?.name ||
                          member.profile?.username ||
                          "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="memberInfo">
                        <strong>
                          {member.profile?.name ||
                            member.profile?.username ||
                            "Teilnehmer"}
                        </strong>

                        <small>
                          {member.role === "admin"
                            ? "👑 Administrator"
                            : "Teilnehmer"}
                        </small>
                      </div>

                      <strong>
                        🏆 {member.profile?.points ?? 0}
                      </strong>
                    </div>
                  ))
                )}
              </section>
            )}

            {activeTab === "requests" && (
              <section className="card">
                <div className="sectionHeader">
                  <h2>🍻 Bier-Anfragen</h2>

                  <button onClick={requestBeer}>
                    🍺 Bier anfragen
                  </button>
                </div>

                {beerRequests.length === 0 ? (
                  <div className="emptySmall">
                    Noch keine Bier-Anfragen.
                  </div>
                ) : (
                  beerRequests.map((request) => {
                    const own =
                      request.requester_profile_id === profile?.id;

                    return (
                      <div className="requestCard" key={request.id}>
                        <div className="requestTop">
                          <div className="requestAvatar">
                            🍺
                          </div>

                          <div>
                            <strong>
                              {request.requester?.name ||
                                request.requester?.username ||
                                "Teilnehmer"}
                            </strong>

                            <small>
                              {new Date(
                                request.created_at
                              ).toLocaleString("de-DE")}
                            </small>
                          </div>

                          <span
                            className={`status ${request.status}`}
                          >
                            {request.status === "pending"
                              ? "Offen"
                              : request.status === "approved"
                              ? "Angenommen"
                              : "Abgelehnt"}
                          </span>
                        </div>

                        <p>{request.message}</p>

                        {!own &&
                          request.status === "pending" && (
                            <div className="responseButtons">
                              <button
                                className="approve"
                                onClick={() =>
                                  respondBeerRequest(
                                    request,
                                    "approved"
                                  )
                                }
                              >
                                👍 Zustimmen
                              </button>

                              <button
                                className="reject"
                                onClick={() =>
                                  respondBeerRequest(
                                    request,
                                    "rejected"
                                  )
                                }
                              >
                                👎 Ablehnen
                              </button>
                            </div>
                          )}
                      </div>
                    );
                  })
                )}
              </section>
            )}

            {activeTab === "ranking" && (
              <section className="card">
                <h2>🏆 Ranking</h2>

                {ranking.length === 0 ? (
                  <div className="emptySmall">
                    Noch keine Teilnehmer.
                  </div>
                ) : (
                  ranking.map((member, index) => (
                    <div className="rankRow" key={member.id}>
                      <strong className="rankPlace">
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

                      <strong>
                        {member.profile?.points ?? 0} Punkte
                      </strong>
                    </div>
                  ))
                )}
              </section>
            )}

            {activeTab === "statistics" && (
              <section className="card">
                <h2>📊 Statistik</h2>

                <div className="statisticsGrid">
                  <div>
                    <span>🍺</span>
                    <strong>{drinks.length}</strong>
                    <small>Getränke</small>
                  </div>

                  <div>
                    <span>💧</span>
                    <strong>{totalLiters.toFixed(1)} L</strong>
                    <small>Getrunkene Menge</small>
                  </div>

                  <div>
                    <span>💶</span>
                    <strong>
                      {totalCost.toFixed(2)} €
                    </strong>
                    <small>Gesamtkosten</small>
                  </div>

                  <div>
                    <span>👥</span>
                    <strong>{members.length}</strong>
                    <small>Teilnehmer</small>
                  </div>
                </div>

                {event?.auto_split_costs &&
                  members.length > 0 && (
                    <div className="costBox">
                      <span>💶 Kosten pro Person</span>

                      <strong>
                        {(totalCost / members.length).toFixed(2)} €
                      </strong>
                    </div>
                  )}
              </section>
            )}
          </>
        )}

        <footer>
          🍻 Güstener Zapfhahn Zentrale
          <small>
            Dein Event. Deine Getränke. Deine Runde.
          </small>
        </footer>
      </div>

      {authOpen && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="close"
              onClick={() => setAuthOpen(false)}
            >
              ×
            </button>

            <div className="modalIcon">🔐</div>

            <h2>
              {authMode === "login"
                ? "Willkommen zurück"
                : "Konto erstellen"}
            </h2>

            <p>
              {authMode === "login"
                ? "Melde dich an, um deine Events zu verwalten."
                : "Erstelle kostenlos dein Konto für die Zapfhahn Zentrale."}
            </p>

            {authMode === "register" && (
              <input
                placeholder="Dein Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}

            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="primary full"
              onClick={
                authMode === "login"
                  ? login
                  : register
              }
            >
              {authMode === "login"
                ? "🔐 Anmelden"
                : "🚀 Konto erstellen"}
            </button>

            <button
              className="switchAuth"
              onClick={() =>
                setAuthMode(
                  authMode === "login"
                    ? "register"
                    : "login"
                )
              }
            >
              {authMode === "login"
                ? "Noch kein Konto? Jetzt registrieren"
                : "Schon ein Konto? Jetzt anmelden"}
            </button>
          </div>
        </div>
      )}

      {eventCreateOpen && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="close"
              onClick={() => setEventCreateOpen(false)}
            >
              ×
            </button>

            <div className="modalIcon">🍻</div>

            <h2>Event erstellen</h2>

            <p>
              Erstelle eine neue Runde und teile anschließend den
              Einladungscode mit deinen Freunden.
            </p>

            <input
              placeholder="Eventname *"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />

            <input
              placeholder="Ort"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
            />

            <textarea
              placeholder="Beschreibung"
              value={eventDescription}
              onChange={(e) =>
                setEventDescription(e.target.value)
              }
            />

            <button
              className="primary full"
              onClick={createEvent}
            >
              🍻 Event erstellen
            </button>
          </div>
        </div>
      )}

      {joinOpen && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="close"
              onClick={() => setJoinOpen(false)}
            >
              ×
            </button>

            <div className="modalIcon">🔑</div>

            <h2>Event beitreten</h2>

            <p>
              Gib den Einladungscode ein, den du vom
              Veranstalter bekommen hast.
            </p>

            <input
              placeholder="z.B. FBD1-A687"
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.toUpperCase())
              }
            />

            <button
              className="primary full"
              onClick={joinEvent}
            >
              🔑 Event beitreten
            </button>
          </div>
        </div>
      )}

      {drinkOpen && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="close"
              onClick={() => setDrinkOpen(false)}
            >
              ×
            </button>

            <div className="modalIcon">🍺</div>

            <h2>Getränk hinzufügen</h2>

            <input
              placeholder="Getränk *"
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

            <div className="threeInputs">
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
              className="primary full"
              onClick={saveDrink}
            >
              🍻 Getränk speichern
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

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          background:
            radial-gradient(
              circle at top,
              #243445 0%,
              #0b1118 35%,
              #06090d 100%
            );
          color: #fff;
          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;
        }

        .app {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
          padding: 20px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 15px 0 25px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .crateLogo {
          width: 70px;
          height: 70px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
          padding: 9px;
          border-radius: 16px;
          background: #7b431d;
          border: 3px solid #9b5a29;
          box-shadow:
            inset 0 0 0 2px #4d2814,
            0 8px 20px rgba(0, 0, 0, 0.35);
          overflow: hidden;
        }

        .crateLogo span {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          line-height: 1;
        }

        h1 {
          margin: 0;
          font-size: clamp(22px, 4vw, 31px);
          letter-spacing: -0.5px;
        }

        .brand p {
          margin: 5px 0 0;
          color: #9ca9b7;
        }

        .account {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #c8d1da;
        }

        button {
          font-family: inherit;
          cursor: pointer;
          border: 0;
        }

        .primary,
        .loginButton {
          background: linear-gradient(
            135deg,
            #fbbf24,
            #f59e0b
          );
          color: #111;
          font-weight: 800;
          border-radius: 13px;
          padding: 13px 18px;
        }

        .secondary,
        .smallButton {
          background: #202c38;
          color: #fff;
          border: 1px solid #344454;
          border-radius: 13px;
          padding: 12px 17px;
          font-weight: 700;
        }

        .mainActions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 15px;
        }

        .message {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 13px 16px;
          border-radius: 13px;
          background: #182431;
          border: 1px solid #334555;
          color: #fbbf24;
          margin-bottom: 15px;
        }

        .message button {
          background: transparent;
          color: #fff;
          font-size: 22px;
        }

        .loginHint {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 17px;
          margin-bottom: 15px;
          border-radius: 17px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        .loginHint div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .loginHint span {
          color: #9ca9b7;
          font-size: 14px;
        }

        .loginHint button {
          white-space: nowrap;
          background: #f59e0b;
          color: #111;
          padding: 11px 15px;
          border-radius: 11px;
          font-weight: 800;
        }

        .card {
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.085);
          border-radius: 20px;
          padding: 19px;
          margin-bottom: 15px;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.15);
        }

        .eventSelector {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
        }

        .eventSelector label {
          display: block;
          color: #778594;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 7px;
          letter-spacing: 1px;
        }

        select,
        input,
        textarea {
          width: 100%;
          border: 1px solid #344454;
          background: #121a23;
          color: #fff;
          border-radius: 12px;
          padding: 13px;
          font-size: 15px;
          outline: none;
        }

        textarea {
          min-height: 100px;
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #f59e0b;
        }

        .eventSelector select {
          min-width: 280px;
          margin: 0;
        }

        .location {
          color: #aeb9c4;
          padding-bottom: 13px;
        }

        .tabs {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding: 5px 0 15px;
          scrollbar-width: thin;
        }

        .tabs button {
          white-space: nowrap;
          padding: 11px 13px;
          border-radius: 12px;
          background: #111a23;
          border: 1px solid #263442;
          color: #9eabb8;
          font-weight: 700;
        }

        .tabs button.active {
          background: #f59e0b;
          color: #111;
          border-color: #f59e0b;
        }

        .badge {
          margin-left: 6px;
          background: #ef4444;
          color: white;
          border-radius: 20px;
          padding: 2px 6px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 11px;
          margin-bottom: 15px;
        }

        .stat {
          padding: 17px;
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }

        .stat span,
        .stat strong,
        .stat small {
          display: block;
        }

        .stat span {
          font-size: 22px;
        }

        .stat strong {
          font-size: 22px;
          margin: 5px 0;
        }

        .stat small {
          color: #82909e;
        }

        .beerActions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .actionCard {
          border-radius: 20px;
          padding: 25px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.055);
        }

        .actionCard h2 {
          margin: 8px 0;
        }

        .actionCard p {
          color: #9ba8b5;
          line-height: 1.5;
          min-height: 45px;
        }

        .actionCard button {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: #f59e0b;
          color: #111;
          font-weight: 900;
        }

        .bigBeer {
          font-size: 48px;
        }

        .crateLarge {
          display: inline-block;
          padding: 10px;
          border-radius: 13px;
          background: #754018;
          border: 3px solid #9a5725;
          font-size: 27px;
          line-height: 1.25;
        }

        .invite {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .invite h2 {
          margin-top: 0;
        }

        .invite p {
          color: #8997a5;
        }

        .inviteCode {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .inviteCode strong {
          font-size: 24px;
          letter-spacing: 2px;
          color: #fbbf24;
        }

        .inviteCode button {
          background: #263442;
          color: #fff;
          padding: 11px 14px;
          border-radius: 11px;
        }

        .promilleValue {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .promilleValue strong {
          font-size: 38px;
          color: #fbbf24;
        }

        .promilleValue span,
        .promille p {
          color: #8f9ca9;
        }

        .quickActions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 9px;
        }

        .quickActions button {
          padding: 13px;
          border-radius: 12px;
          background: #1b2733;
          color: #fff;
          border: 1px solid #2d3d4d;
          font-weight: 700;
        }

        .sectionHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 12px;
        }

        .sectionHeader h2 {
          margin: 0;
        }

        .sectionHeader button {
          background: #f59e0b;
          color: #111;
          border-radius: 11px;
          padding: 10px 14px;
          font-weight: 800;
        }

        .drinkRow,
        .memberRow,
        .rankRow {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.045);
        }

        .drinkIcon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #273442;
          font-size: 22px;
        }

        .drinkInfo,
        .memberInfo {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .drinkInfo span,
        .drinkInfo small,
        .memberInfo small {
          color: #84929f;
        }

        .avatar,
        .requestAvatar {
          width: 43px;
          height: 43px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #263442;
          font-weight: 900;
        }

        .empty {
          text-align: center;
          padding: 55px 20px;
        }

        .emptyIcon {
          font-size: 65px;
        }

        .empty p {
          max-width: 550px;
          margin: 10px auto 20px;
          color: #8997a5;
          line-height: 1.6;
        }

        .emptyButtons {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .emptySmall {
          padding: 25px;
          text-align: center;
          color: #8997a5;
        }

        .requestCard {
          padding: 15px;
          margin-top: 10px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .requestTop {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .requestTop > div:nth-child(2) {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .requestTop small {
          color: #7f8c99;
        }

        .status {
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
        }

        .status.pending {
          background: #3d3217;
          color: #fbbf24;
        }

        .status.approved {
          background: #123722;
          color: #4ade80;
        }

        .status.rejected {
          background: #3a1717;
          color: #f87171;
        }

        .requestCard p {
          color: #a7b2bd;
        }

        .responseButtons {
          display: flex;
          gap: 8px;
        }

        .responseButtons button {
          padding: 10px 13px;
          border-radius: 10px;
          font-weight: 800;
        }

        .approve {
          background: #166534;
          color: #fff;
        }

        .reject {
          background: #7f1d1d;
          color: #fff;
        }

        .rankPlace {
          width: 40px;
          text-align: center;
          font-size: 21px;
        }

        .rankRow span {
          flex: 1;
        }

        .statisticsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .statisticsGrid > div {
          padding: 18px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.045);
          text-align: center;
        }

        .statisticsGrid span,
        .statisticsGrid strong,
        .statisticsGrid small {
          display: block;
        }

        .statisticsGrid span {
          font-size: 27px;
        }

        .statisticsGrid strong {
          font-size: 22px;
          margin: 5px 0;
        }

        .statisticsGrid small {
          color: #85929f;
        }

        .costBox {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          margin-top: 12px;
          border-radius: 13px;
          background: #1b2733;
        }

        footer {
          text-align: center;
          padding: 30px 10px;
          color: #677482;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        .modalBackdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
        }

        .modal {
          width: 100%;
          max-width: 470px;
          position: relative;
          padding: 28px;
          border-radius: 23px;
          background: #101820;
          border: 1px solid #344454;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
        }

        .modal h2 {
          margin: 8px 0;
        }

        .modal p {
          color: #8d9aa7;
          line-height: 1.5;
          margin-bottom: 18px;
        }

        .modal input,
        .modal textarea {
          margin-bottom: 10px;
        }

        .modalIcon {
          font-size: 42px;
        }

        .close {
          position: absolute;
          top: 12px;
          right: 14px;
          background: transparent;
          color: #8997a5;
          font-size: 29px;
        }

        .full {
          width: 100%;
          margin-top: 5px;
        }

        .switchAuth {
          width: 100%;
          margin-top: 12px;
          background: transparent;
          color: #fbbf24;
          padding: 8px;
        }

        .threeInputs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .crate {
          font-size: 45px;
          margin-bottom: 10px;
        }

        @media (max-width: 800px) {
          .stats,
          .statisticsGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .quickActions {
            grid-template-columns: repeat(2, 1fr);
          }

          .beerActions {
            grid-template-columns: 1fr;
          }

          .invite {
            align-items: flex-start;
            flex-direction: column;
          }

          .eventSelector {
            align-items: stretch;
            flex-direction: column;
          }

          .eventSelector select {
            min-width: 0;
          }
        }

        @media (max-width: 600px) {
          .app {
            padding: 12px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .account {
            width: 100%;
          }

          .account button {
            flex: 1;
          }

          .brand {
            align-items: flex-start;
          }

          .crateLogo {
            width: 60px;
            height: 60px;
          }

          .mainActions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .stats {
            gap: 8px;
          }

          .stat {
            padding: 13px 8px;
          }

          .stat strong {
            font-size: 18px;
          }

          .loginHint {
            align-items: stretch;
            flex-direction: column;
          }

          .loginHint button {
            width: 100%;
          }

          .quickActions {
            grid-template-columns: 1fr;
          }

          .inviteCode {
            width: 100%;
            justify-content: space-between;
          }

          .inviteCode strong {
            font-size: 19px;
          }

          .threeInputs {
            grid-template-columns: 1fr;
          }

          .modal {
            padding: 22px;
          }
        }
      `}</style>
    </main>
  );
}
