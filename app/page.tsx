"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  user_id?: string | null;
  username?: string | null;
  name?: string | null;
  email?: string | null;
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
  is_global_admin?: boolean | null;
};

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

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string | null;
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
};

type Challenge = {
  id: string;
  event_id?: string | null;
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
  | "people"
  | "requests"
  | "challenges"
  | "ranking"
  | "stats";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [requests, setRequests] = useState<BeerRequest[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showAddDrink, setShowAddDrink] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const [drinkName, setDrinkName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Bier");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [joinCode, setJoinCode] = useState("");
  const [beerMessage, setBeerMessage] = useState("");

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");

  const currentEvent = useMemo(
    () => events.find((event) => event.id === eventId) ?? null,
    [events, eventId]
  );

  const currentMember = useMemo(
    () =>
      members.find(
        (member) => member.profile_id === profile?.id
      ) ?? null,
    [members, profile]
  );

  const currentName =
    profile?.name ||
    profile?.username ||
    "Teilnehmer";

  const totalLiters = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(
            drink.liters ??
              drink.menge ??
              0
          ) *
            Number(drink.quantity ?? 1),
        0
      ),
    [drinks]
  );

  const totalCost = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(
            drink.price ??
              drink.preis ??
              0
          ) *
            Number(drink.quantity ?? 1),
        0
      ),
    [drinks]
  );

  const participantCount = members.length;

  const costPerPerson =
    participantCount > 0
      ? totalCost / participantCount
      : 0;

  const totalPoints = members.reduce(
    (sum, member) =>
      sum +
      Number(member.profile?.points ?? 0),
    0
  );

  const sortedMembers = [...members].sort(
    (a, b) =>
      Number(b.profile?.points ?? 0) -
      Number(a.profile?.points ?? 0)
  );

  const myDrinks = profile
    ? drinks.filter(
        (drink) => drink.profile_id === profile.id
      )
    : [];

  const myPoints = Number(profile?.points ?? 0);

  const beerRequestsPending = requests.filter(
    (request) => request.status === "pending"
  );

  const calculatePromille = () => {
    const kg = Number(
      weight ||
        profile?.weight_kg ||
        profile?.gewicht_kg ||
        0
    );

    const cm = Number(
      height ||
        profile?.height_cm ||
        0
    );

    const years = Number(
      age ||
        profile?.age ||
        profile?.alter ||
        0
    );

    if (!kg || !cm || !years || myDrinks.length === 0) {
      return 0;
    }

    let alcoholGrams = 0;

    myDrinks.forEach((drink) => {
      const l =
        Number(
          drink.liters ??
            drink.menge ??
            0
        ) *
        Number(drink.quantity ?? 1);

      const percent = Number(
        drink.alcohol_percent ??
          drink.alkohol ??
          0
      );

      alcoholGrams +=
        l *
        1000 *
        (percent / 100) *
        0.789;
    });

    const factor =
      gender === "female"
        ? 0.55
        : 0.68;

    const promille =
      alcoholGrams /
      (kg * factor);

    return Math.max(
      0,
      Number(promille.toFixed(2))
    );
  };

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(
      () => setMessage(""),
      4000
    );
  };

  async function loadProfile() {
    try {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
      }
    } catch {
      setProfile(null);
    }
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        "❌ Events konnten nicht geladen werden."
      );
      return;
    }

    const list = (data ?? []) as Event[];

    setEvents(list);

    if (!eventId && list.length > 0) {
      setEventId(list[0].id);
    }
  }

  async function loadEventData(id: string) {
    if (!id) return;

    setLoading(true);

    const [
      membersResult,
      drinksResult,
      requestsResult,
      challengesResult,
    ] = await Promise.all([
      supabase
        .from("event_members")
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq("event_id", id)
        .order("joined_at", {
          ascending: true,
        }),

      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", id)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("beer_requests")
        .select("*")
        .eq("event_id", id)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("challenge_dashboard")
        .select("*")
        .eq("event_id", id)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    setMembers(
      (membersResult.data ??
        []) as EventMember[]
    );

    setDrinks(
      (drinksResult.data ??
        []) as Drink[]
    );

    setRequests(
      (requestsResult.data ??
        []) as BeerRequest[]
    );

    setChallenges(
      (challengesResult.data ??
        []) as Challenge[]
    );

    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      await loadProfile();
      await loadEvents();
    }

    init();
  }, []);

  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
    }
  }, [eventId]);

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

    const litersNumber =
      Number(liters) || 0.5;

    const alcoholNumber =
      Number(alcohol) || 0;

    const priceNumber =
      Number(price) || 0;

    const { error } = await supabase
      .from("drinks")
      .insert({
        event_id: eventId,
        profile_id:
          profile?.id ?? null,

        category,
        drink_name:
          drinkName.trim(),

        brand:
          brand.trim() || null,

        marke:
          brand.trim() || null,

        getraenk:
          drinkName.trim(),

        liters: litersNumber,
        menge: litersNumber,

        alcohol_percent:
          alcoholNumber,

        alkohol:
          alcoholNumber,

        quantity: 1,

        price: priceNumber,
        preis: priceNumber,

        ai_detected: false,
      });

    if (error) {
      showMessage(
        "❌ " + error.message
      );
      return;
    }

    setDrinkName("");
    setBrand("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");
    setShowAddDrink(false);

    await loadEventData(eventId);

    showMessage(
      "🍺 Getränk erfolgreich gespeichert."
    );
  }

  async function assignDrink(
    drink: Drink
  ) {
    if (!profile) {
      showMessage(
        "❌ Kein Benutzerprofil gefunden."
      );
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .update({
        profile_id: profile.id,
      })
      .eq("id", drink.id);

    if (error) {
      showMessage(
        "❌ " + error.message
      );
      return;
    }

    await supabase
      .from("profiles")
      .update({
        drinks_count:
          Number(
            profile.drinks_count ?? 0
          ) + 1,

        points:
          Number(
            profile.points ?? 0
          ) + 10,
      })
      .eq("id", profile.id);

    await loadProfile();
    await loadEventData(eventId);

    showMessage(
      "🍺 Getränk zugeordnet – +10 Punkte!"
    );
  }

  async function joinEvent() {
    if (!joinCode.trim()) {
      showMessage(
        "❌ Bitte Einladungscode eingeben."
      );
      return;
    }

    if (!profile) {
      showMessage(
        "❌ Du musst angemeldet sein."
      );
      return;
    }

    const {
      data: event,
      error,
    } = await supabase
      .from("events")
      .select("id,title,invite_code")
      .eq(
        "invite_code",
        joinCode.trim()
      )
      .maybeSingle();

    if (error || !event) {
      showMessage(
        "❌ Einladungscode nicht gefunden."
      );
      return;
    }

    const { error: memberError } =
      await supabase
        .from("event_members")
        .insert({
          event_id: event.id,
          profile_id: profile.id,
          joined_via_code:
            joinCode.trim(),
          role: "member",
        });

    if (
      memberError &&
      !memberError.message
        .toLowerCase()
        .includes("duplicate")
    ) {
      showMessage(
        "❌ " +
          memberError.message
      );
      return;
    }

    setEventId(event.id);
    setJoinCode("");
    setShowJoin(false);

    await loadEvents();
    await loadEventData(event.id);

    showMessage(
      "🎉 Event erfolgreich beigetreten!"
    );
  }

  async function requestBeer() {
    if (!profile || !eventId) {
      showMessage(
        "❌ Du musst einem Event beitreten."
      );
      return;
    }

    const { error } = await supabase
      .from("beer_requests")
      .insert({
        event_id: eventId,
        requester_profile_id:
          profile.id,
        status: "pending",
        message:
          beerMessage.trim() ||
          `${currentName} möchte gerne ein Bier trinken.`,
      });

    if (error) {
      showMessage(
        "❌ " + error.message
      );
      return;
    }

    setBeerMessage("");

    await loadEventData(eventId);

    showMessage(
      "🍺 Bier-Anfrage wurde an alle Teilnehmer gesendet!"
    );
  }

  async function answerBeerRequest(
    request: BeerRequest,
    answer: "accepted" | "declined"
  ) {
    if (!profile) return;

    const { error } = await supabase
      .from("beer_request_responses")
      .insert({
        request_id: request.id,
        profile_id: profile.id,
        response: answer,
      });

    if (error) {
      showMessage(
        "❌ " + error.message
      );
      return;
    }

    if (answer === "declined") {
      await supabase
        .from("beer_requests")
        .update({
          status: "declined",
          responded_at:
            new Date().toISOString(),
        })
        .eq("id", request.id);
    }

    if (answer === "accepted") {
      await supabase
        .from("beer_requests")
        .update({
          status: "accepted",
          responded_at:
            new Date().toISOString(),
        })
        .eq("id", request.id);
    }

    await loadEventData(eventId);

    showMessage(
      answer === "accepted"
        ? "🍺 Anfrage angenommen!"
        : "❌ Anfrage abgelehnt."
    );
  }

  async function sponsorBeerCrate() {
    if (!profile || !eventId) {
      showMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    const { error } = await supabase
      .from("beer_crate_sponsorships")
      .insert({
        event_id: eventId,
        profile_id: profile.id,
        crates: 1,
        points_awarded: 50,
        description:
          `${currentName} gibt eine Kiste Bier aus.`,
      });

    if (error) {
      showMessage(
        "❌ " + error.message
      );
      return;
    }

    await supabase
      .from("profiles")
      .update({
        points:
          Number(
            profile.points ?? 0
          ) + 50,
      })
      .eq("id", profile.id);

    await loadProfile();
    await loadEventData(eventId);

    showMessage(
      "🍻 Bierkiste ausgegeben! +50 Punkte!"
    );
  }

  async function savePersonalData() {
    if (!profile) return;

    const update = {
      weight_kg:
        Number(weight) ||
        profile.weight_kg ||
        null,

      height_cm:
        Number(height) ||
        profile.height_cm ||
        null,

      age:
        Number(age) ||
        profile.age ||
        null,

      gender:
        gender || profile.gender || "male",

      gewicht_kg:
        Number(weight) ||
        profile.gewicht_kg ||
        null,

      alter:
        Number(age) ||
        profile.alter ||
        null,

      geschlecht:
        gender || profile.geschlecht || "male",
    };

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", profile.id);

    if (error) {
      showMessage(
        "❌ " + error.message
      );
      return;
    }

    await loadProfile();

    showMessage(
      "✅ Persönliche Daten gespeichert."
    );
  }

  function copyInviteCode() {
    if (!currentEvent?.invite_code) {
      showMessage(
        "❌ Kein Einladungscode vorhanden."
      );
      return;
    }

    navigator.clipboard.writeText(
      currentEvent.invite_code
    );

    showMessage(
      "📋 Einladungscode kopiert!"
    );
  }

  const promille = calculatePromille();

  if (loading && events.length === 0) {
    return (
      <main className="app">
        <div className="loading">
          <div className="crateIcon">
            🍺
          </div>
          <h1>
            Güstener Zapfhahn Zentrale
          </h1>
          <p>
            Lade deine Zapfhahn-Zentrale …
          </p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="app">
      <div className="shell">

        <header className="topbar">
          <div className="brand">
            <div className="crateButton">
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
              <small>BIERKISTE</small>
            </div>

            <div>
              <h1>
                Güstener Zapfhahn Zentrale
              </h1>
              <p>
                Events · Getränke · Kosten · Rankings
              </p>
            </div>
          </div>

          <button
            className="joinTop"
            onClick={() =>
              setShowJoin(true)
            }
          >
            🔑 Event beitreten
          </button>
        </header>

        <section className="eventHero">
          <div>
            <span className="eyebrow">
              AKTUELLES EVENT
            </span>

            <h2>
              {currentEvent?.title ||
                "Kein Event ausgewählt"}
            </h2>

            {currentEvent?.location && (
              <p>
                📍 {currentEvent.location}
              </p>
            )}

            {currentEvent?.start_date && (
              <p>
                📅{" "}
                {currentEvent.start_date}
                {currentEvent.end_date
                  ? ` – ${currentEvent.end_date}`
                  : ""}
              </p>
            )}
          </div>

          <select
            value={eventId}
            onChange={(event) =>
              setEventId(
                event.target.value
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

        <nav className="tabs">
          {[
            ["home", "🏠", "Übersicht"],
            ["drinks", "🍺", "Getränke"],
            ["people", "👥", "Teilnehmer"],
            ["requests", "🍻", "Bier-Anfragen"],
            ["challenges", "🔥", "Challenges"],
            ["ranking", "🏆", "Ranking"],
            ["stats", "📊", "Statistik"],
          ].map(
            ([id, icon, label]) => (
              <button
                key={id}
                className={
                  activeTab === id
                    ? "tab active"
                    : "tab"
                }
                onClick={() =>
                  setActiveTab(id as Tab)
                }
              >
                <span>{icon}</span>
                {label}
              </button>
            )
          )}
        </nav>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {activeTab === "home" && (
          <>
            <section className="statsGrid">
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
                <span>👥</span>
                <strong>
                  {participantCount}
                </strong>
                <small>Teilnehmer</small>
              </div>

              <div className="stat">
                <span>🏆</span>
                <strong>
                  {myPoints}
                </strong>
                <small>Meine Punkte</small>
              </div>
            </section>

            <section className="heroActions">
              <div className="actionCard beer">
                <div className="bigEmoji">
                  🍺
                </div>

                <div>
                  <h3>
                    Ich möchte ein Bier
                  </h3>

                  <p>
                    Alle Teilnehmer bekommen
                    eine Anfrage und können
                    zustimmen oder ablehnen.
                  </p>
                </div>

                <button
                  onClick={requestBeer}
                >
                  🍺 Bier anfragen
                </button>
              </div>

              <div className="actionCard crate">
                <div className="crateLarge">
                  🍺
                  <br />
                  🍺 🍺
                </div>

                <div>
                  <h3>
                    Bierkiste ausgeben
                  </h3>

                  <p>
                    Du gibst eine Kiste Bier
                    für die Runde aus und
                    bekommst dafür Punkte.
                  </p>
                </div>

                <button
                  onClick={
                    sponsorBeerCrate
                  }
                >
                  🍻 Kiste ausgeben
                </button>
              </div>
            </section>

            <section className="grid2">
              <div className="card">
                <div className="cardHeader">
                  <h2>
                    🔑 Einladungscode
                  </h2>

                  <button
                    className="smallButton"
                    onClick={
                      copyInviteCode
                    }
                  >
                    📋 Kopieren
                  </button>
                </div>

                <div className="inviteCode">
                  {currentEvent?.invite_code ||
                    "—"}
                </div>

                <p>
                  Diesen Code können Freunde
                  verwenden, um dem Event
                  beizutreten.
                </p>
              </div>

              <div className="card promilleCard">
                <h2>
                  🧪 Mein Promillewert
                </h2>

                {currentEvent?.show_promille ===
                false ? (
                  <p>
                    Promille-Anzeige für
                    dieses Event deaktiviert.
                  </p>
                ) : (
                  <>
                    <div className="promille">
                      {promille.toFixed(2)}
                      ‰
                    </div>

                    <p>
                      Geschätzter aktueller
                      Wert anhand deiner
                      hinterlegten Daten.
                    </p>

                    <button
                      className="secondary"
                      onClick={() =>
                        setActiveTab(
                          "stats"
                        )
                      }
                    >
                      Daten bearbeiten
                    </button>
                  </>
                )}
              </div>
            </section>

            <section className="card">
              <h2>
                ⚡ Schnellaktionen
              </h2>

              <div className="quickGrid">
                <button
                  onClick={() =>
                    setShowAddDrink(true)
                  }
                >
                  ➕ Getränk hinzufügen
                </button>

                <button
                  onClick={() =>
                    setActiveTab(
                      "requests"
                    )
                  }
                >
                  🍻 Bier-Anfragen
                  {beerRequestsPending.length >
                    0 && (
                    <b>
                      {" "}
                      (
                      {
                        beerRequestsPending.length
                      }
                      )
                    </b>
                  )}
                </button>

                <button
                  onClick={() =>
                    setActiveTab(
                      "challenges"
                    )
                  }
                >
                  🔥 Challenges
                </button>

                <button
                  onClick={() =>
                    setActiveTab(
                      "ranking"
                    )
                  }
                >
                  🏆 Ranking
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === "drinks" && (
          <section className="card">
            <div className="cardHeader">
              <div>
                <h2>🍺 Getränke</h2>
                <p>
                  Alle Getränke des aktuellen
                  Events.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddDrink(true)
                }
              >
                ➕ Getränk
              </button>
            </div>

            <div className="drinkList">
              {drinks.length === 0 ? (
                <Empty
                  text="Noch keine Getränke."
                />
              ) : (
                drinks.map(
                  (drink) => {
                    const name =
                      drink.drink_name ||
                      drink.getraenk ||
                      "Getränk";

                    const drinkBrand =
                      drink.brand ||
                      drink.marke ||
                      drink.detected_brand ||
                      "";

                    const drinkLiters =
                      Number(
                        drink.liters ??
                          drink.menge ??
                          0
                      );

                    const drinkAlcohol =
                      Number(
                        drink.alcohol_percent ??
                          drink.alkohol ??
                          drink.detected_alcohol_percent ??
                          0
                      );

                    const drinkPrice =
                      Number(
                        drink.price ??
                          drink.preis ??
                          0
                      );

                    const owner =
                      members.find(
                        (member) =>
                          member.profile_id ===
                          drink.profile_id
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

                          {drinkBrand && (
                            <small>
                              {drinkBrand}
                            </small>
                          )}

                          <span>
                            {drinkLiters.toFixed(
                              1
                            )}{" "}
                            Liter ·{" "}
                            {drinkAlcohol.toFixed(
                              1
                            )}{" "}
                            %
                          </span>

                          {owner && (
                            <em>
                              👤{" "}
                              {owner.profile
                                ?.name ||
                                owner.profile
                                  ?.username ||
                                "Teilnehmer"}
                            </em>
                          )}
                        </div>

                        <div className="drinkRight">
                          <strong>
                            {drinkPrice.toFixed(
                              2
                            )} €
                          </strong>

                          {!drink.profile_id &&
                            profile && (
                              <button
                                className="miniAction"
                                onClick={() =>
                                  assignDrink(
                                    drink
                                  )
                                }
                              >
                                Mir zuordnen
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </section>
        )}

        {activeTab === "people" && (
          <section className="card">
            <div className="cardHeader">
              <div>
                <h2>
                  👥 Teilnehmer
                </h2>
                <p>
                  {participantCount} Personen
                  im Event.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowJoin(true)
                }
              >
                🔑 Beitreten
              </button>
            </div>

            <div className="peopleList">
              {members.length === 0 ? (
                <Empty
                  text="Noch keine Teilnehmer."
                />
              ) : (
                members.map(
                  (member, index) => (
                    <div
                      className="personRow"
                      key={member.id}
                    >
                      <div className="rankBadge">
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : index + 1}
                      </div>

                      <div className="avatar">
                        {(
                          member.profile
                            ?.name ||
                          member.profile
                            ?.username ||
                          "?"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="personInfo">
                        <strong>
                          {member.profile
                            ?.name ||
                            member.profile
                              ?.username ||
                            "Teilnehmer"}
                        </strong>

                        <span>
                          🍺{" "}
                          {member.profile
                            ?.drinks_count ??
                            0}{" "}
                          Getränke
                        </span>
                      </div>

                      <strong className="points">
                        {Number(
                          member.profile
                            ?.points ?? 0
                        )}{" "}
                        Punkte
                      </strong>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        )}

        {activeTab === "requests" && (
          <>
            <section className="card beerRequestHero">
              <div className="requestEmoji">
                🍺
              </div>

              <div>
                <h2>
                  Bier-Anfrage
                </h2>

                <p>
                  Du möchtest ein Bier?
                  Schicke eine Anfrage an
                  die gesamte Runde.
                </p>

                <textarea
                  placeholder="Nachricht optional …"
                  value={beerMessage}
                  onChange={(event) =>
                    setBeerMessage(
                      event.target.value
                    )
                  }
                />

                <button
                  onClick={requestBeer}
                >
                  🍺 Anfrage senden
                </button>
              </div>
            </section>

            <section className="card">
              <h2>
                🔔 Aktuelle Anfragen
              </h2>

              {requests.length === 0 ? (
                <Empty
                  text="Noch keine Bier-Anfragen."
                />
              ) : (
                <div className="requestList">
                  {requests.map(
                    (request) => {
                      const requester =
                        members.find(
                          (member) =>
                            member.profile_id ===
                            request.requester_profile_id
                        );

                      const name =
                        requester?.profile
                          ?.name ||
                        requester?.profile
                          ?.username ||
                        "Teilnehmer";

                      const isOwn =
                        request.requester_profile_id ===
                        profile?.id;

                      return (
                        <div
                          className="requestRow"
                          key={request.id}
                        >
                          <div className="requestIcon">
                            🍺
                          </div>

                          <div className="requestInfo">
                            <strong>
                              {name}
                            </strong>

                            <span>
                              {request.message ||
                                "Möchte gerne ein Bier trinken."}
                            </span>

                            <small>
                              Status:{" "}
                              {request.status ===
                              "pending"
                                ? "⏳ offen"
                                : request.status ===
                                  "accepted"
                                ? "✅ angenommen"
                                : "❌ abgelehnt"}
                            </small>
                          </div>

                          {!isOwn &&
                            request.status ===
                              "pending" && (
                              <div className="requestActions">
                                <button
                                  className="accept"
                                  onClick={() =>
                                    answerBeerRequest(
                                      request,
                                      "accepted"
                                    )
                                  }
                                >
                                  👍 Ja
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
                                  👎 Nein
                                </button>
                              </div>
                            )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "challenges" && (
          <section className="card">
            <div className="cardHeader">
              <div>
                <h2>
                  🔥 Challenges
                </h2>
                <p>
                  Aufgaben, Abstimmungen und
                  Bonuspunkte.
                </p>
              </div>
            </div>

            {challenges.length === 0 ? (
              <Empty
                text="Noch keine Challenges für dieses Event."
              />
            ) : (
              <div className="challengeGrid">
                {challenges.map(
                  (challenge) => (
                    <div
                      className="challenge"
                      key={challenge.id}
                    >
                      <div className="challengeTop">
                        <span>
                          🔥{" "}
                          {challenge.category ||
                            "Challenge"}
                        </span>

                        <b>
                          +
                          {challenge.points ??
                            0}
                        </b>
                      </div>

                      <h3>
                        {challenge.title ||
                          "Challenge"}
                      </h3>

                      <p>
                        {challenge.description ||
                          "Keine Beschreibung."}
                      </p>

                      <div className="challengeStats">
                        <span>
                          👥{" "}
                          {challenge.participant_count ??
                            0}
                        </span>

                        <span>
                          👍{" "}
                          {challenge.positive_vote_count ??
                            0}
                        </span>

                        <span>
                          📊{" "}
                          {challenge.vote_count ??
                            0}{" "}
                          Stimmen
                        </span>
                      </div>

                      <span
                        className={
                          challenge.status ===
                          "completed"
                            ? "status done"
                            : "status"
                        }
                      >
                        {challenge.status ===
                        "completed"
                          ? "✅ Abgeschlossen"
                          : "🔥 Aktiv"}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === "ranking" && (
          <section className="card">
            <div className="rankingHero">
              <div className="trophy">
                🏆
              </div>

              <h2>
                Güstener Zapfhahn Ranking
              </h2>

              <p>
                Wer sammelt die meisten
                Punkte?
              </p>
            </div>

            <div className="rankingList">
              {sortedMembers.map(
                (member, index) => (
                  <div
                    className={
                      index < 3
                        ? "rankingRow top"
                        : "rankingRow"
                    }
                    key={member.id}
                  >
                    <strong className="place">
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `${index + 1}.`}
                    </strong>

                    <div className="avatar">
                      {(
                        member.profile
                          ?.name ||
                        member.profile
                          ?.username ||
                        "?"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <span>
                      {member.profile
                        ?.name ||
                        member.profile
                          ?.username ||
                        "Teilnehmer"}
                    </span>

                    <b>
                      {Number(
                        member.profile
                          ?.points ?? 0
                      )}{" "}
                      Punkte
                    </b>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {activeTab === "stats" && (
          <>
            <section className="card">
              <h2>
                📊 Event-Statistik
              </h2>

              <div className="statsLarge">
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
                    {totalLiters.toFixed(
                      1
                    )}
                  </strong>
                  <small>
                    Liter
                  </small>
                </div>

                <div>
                  <span>💶</span>
                  <strong>
                    {totalCost.toFixed(
                      2
                    )}{" "}
                    €
                  </strong>
                  <small>
                    Gesamtkosten
                  </small>
                </div>

                <div>
                  <span>🏆</span>
                  <strong>
                    {totalPoints}
                  </strong>
                  <small>
                    Gesamtpunkte
                  </small>
                </div>
              </div>
            </section>

            <section className="card">
              <h2>
                💶 Kostenaufteilung
              </h2>

              <div className="costLine">
                <span>
                  Gesamtkosten
                </span>
                <b>
                  {totalCost.toFixed(
                    2
                  )}{" "}
                  €
                </b>
              </div>

              <div className="costLine">
                <span>
                  Teilnehmer
                </span>
                <b>
                  {participantCount}
                </b>
              </div>

              <div className="costLine highlight">
                <span>
                  Pro Person
                </span>
                <b>
                  {costPerPerson.toFixed(
                    2
                  )}{" "}
                  €
                </b>
              </div>

              <p>
                Die Kosten werden anhand
                der Event-Einstellung
                automatisch aufgeteilt.
              </p>
            </section>

            <section className="card">
              <h2>
                🧪 Meine Promille-Daten
              </h2>

              <div className="formGrid">
                <label>
                  Gewicht kg
                  <input
                    type="number"
                    value={weight}
                    placeholder={
                      String(
                        profile?.weight_kg ??
                          profile?.gewicht_kg ??
                          ""
                      )
                    }
                    onChange={(event) =>
                      setWeight(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Größe cm
                  <input
                    type="number"
                    value={height}
                    placeholder={
                      String(
                        profile?.height_cm ??
                          ""
                      )
                    }
                    onChange={(event) =>
                      setHeight(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Alter
                  <input
                    type="number"
                    value={age}
                    placeholder={
                      String(
                        profile?.age ??
                          profile?.alter ??
                          ""
                      )
                    }
                    onChange={(event) =>
                      setAge(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Geschlecht
                  <select
                    value={gender}
                    onChange={(event) =>
                      setGender(
                        event.target.value
                      )
                    }
                  >
                    <option value="male">
                      Männlich
                    </option>
                    <option value="female">
                      Weiblich
                    </option>
                  </select>
                </label>
              </div>

              <button
                onClick={
                  savePersonalData
                }
              >
                💾 Daten speichern
              </button>

              <div className="promilleBig">
                {promille.toFixed(2)}
                ‰
              </div>
            </section>
          </>
        )}

        <footer>
          <strong>
            🍻 Güstener Zapfhahn Zentrale
          </strong>

          <span>
            Dein Event. Deine Getränke.
            Deine Runde.
          </span>
        </footer>
      </div>

      {showAddDrink && (
        <div className="overlay">
          <div className="modal">
            <div className="modalHeader">
              <h2>
                🍺 Getränk hinzufügen
              </h2>

              <button
                className="close"
                onClick={() =>
                  setShowAddDrink(false)
                }
              >
                ×
              </button>
            </div>

            <label>
              Getränk
              <input
                value={drinkName}
                onChange={(event) =>
                  setDrinkName(
                    event.target.value
                  )
                }
                placeholder="z. B. Pils"
              />
            </label>

            <label>
              Marke
              <input
                value={brand}
                onChange={(event) =>
                  setBrand(
                    event.target.value
                  )
                }
                placeholder="z. B. Krombacher"
              />
            </label>

            <label>
              Kategorie
              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
              >
                <option>
                  Bier
                </option>
                <option>
                  Radler
                </option>
                <option>
                  Wein
                </option>
                <option>
                  Sekt
                </option>
                <option>
                  Spirituose
                </option>
                <option>
                  Cocktail
                </option>
                <option>
                  Alkoholfrei
                </option>
                <option>
                  Sonstiges
                </option>
              </select>
            </label>

            <div className="formGrid">
              <label>
                Liter
                <input
                  type="number"
                  step="0.1"
                  value={liters}
                  onChange={(event) =>
                    setLiters(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Alkohol %
                <input
                  type="number"
                  step="0.1"
                  value={alcohol}
                  onChange={(event) =>
                    setAlcohol(
                      event.target.value
                    )
                  }
                />
              </label>
            </div>

            <label>
              Preis €
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(event) =>
                  setPrice(
                    event.target.value
                  )
                }
              />
            </label>

            <button
              className="primary full"
              onClick={saveDrink}
            >
              🍻 Getränk speichern
            </button>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="overlay">
          <div className="modal">
            <div className="modalHeader">
              <h2>
                🔑 Event beitreten
              </h2>

              <button
                className="close"
                onClick={() =>
                  setShowJoin(false)
                }
              >
                ×
              </button>
            </div>

            <p>
              Gib den Einladungscode des
              Events ein.
            </p>

            <input
              className="inviteInput"
              value={joinCode}
              onChange={(event) =>
                setJoinCode(
                  event.target.value
                )
              }
              placeholder="z. B. ABC123"
              autoFocus
            />

            <button
              className="primary full"
              onClick={joinEvent}
            >
              🎉 Event beitreten
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="empty">
      <div>🍻</div>
      <p>{text}</p>
    </div>
  );
}

const styles = `
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
    min-height: 100vh;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  .app {
    min-height: 100vh;
    width: 100%;
    margin: 0;
    padding: 0;
    background:
      radial-gradient(
        circle at 50% -10%,
        #263b4f 0%,
        #111a24 30%,
        #070b10 70%
      );
    color: #f8fafc;
  }

  .shell {
    width: min(1180px, 100%);
    margin: 0 auto;
    padding: 22px;
  }

  .loading {
    min-height: 100vh;
    display: grid;
    place-items: center;
    align-content: center;
    text-align: center;
  }

  .crateIcon {
    font-size: 65px;
    margin-bottom: 15px;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .brand h1 {
    margin: 0;
    font-size: clamp(21px, 4vw, 31px);
    letter-spacing: -.8px;
  }

  .brand p {
    margin: 5px 0 0;
    color: #9aa8b7;
    font-size: 13px;
  }

  .crateButton {
    width: 82px;
    min-width: 82px;
    height: 76px;
    padding: 7px;
    border-radius: 16px;
    background:
      linear-gradient(
        145deg,
        #a96520,
        #6d3c12
      );
    border: 2px solid #d28a39;
    box-shadow:
      inset 0 0 0 3px rgba(0,0,0,.2),
      0 8px 25px rgba(0,0,0,.35);
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-content: center;
    justify-items: center;
    transform: perspective(250px)
      rotateX(3deg);
  }

  .crateButton span {
    font-size: 20px;
    filter: drop-shadow(
      0 2px 2px #2b1505
    );
  }

  .crateButton small {
    grid-column: 1 / -1;
    font-size: 8px;
    font-weight: 900;
    color: #ffe3ad;
    margin-top: 3px;
  }

  .joinTop,
  .primary {
    border: 0;
    background: #f59e0b;
    color: #160d02;
    font-weight: 900;
    padding: 12px 17px;
    border-radius: 13px;
  }

  .joinTop:hover,
  .primary:hover {
    background: #fbbf24;
  }

  .eventHero {
    background:
      linear-gradient(
        135deg,
        rgba(245,158,11,.16),
        rgba(255,255,255,.045)
      );
    border: 1px solid rgba(245,158,11,.25);
    border-radius: 24px;
    padding: 25px;
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
    margin-bottom: 14px;
  }

  .eventHero h2 {
    margin: 7px 0;
    font-size: 27px;
  }

  .eventHero p {
    margin: 4px 0;
    color: #aab5c2;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 2px;
    color: #fbbf24;
  }

  .eventHero select {
    width: min(300px, 100%);
  }

  select,
  input,
  textarea {
    background: #111923;
    color: #fff;
    border: 1px solid #303d4d;
    border-radius: 12px;
    padding: 12px 13px;
    outline: none;
  }

  select:focus,
  input:focus,
  textarea:focus {
    border-color: #f59e0b;
  }

  textarea {
    width: 100%;
    min-height: 80px;
    resize: vertical;
    margin: 10px 0;
  }

  label {
    display: grid;
    gap: 7px;
    color: #b9c4d0;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 13px;
  }

  .tabs {
    display: flex;
    gap: 7px;
    overflow-x: auto;
    padding: 5px 0 12px;
    scrollbar-width: thin;
  }

  .tab {
    white-space: nowrap;
    border: 1px solid #263240;
    background: #111923;
    color: #9daab8;
    border-radius: 12px;
    padding: 10px 13px;
    font-weight: 800;
  }

  .tab.active {
    background: #f59e0b;
    color: #171008;
    border-color: #f59e0b;
  }

  .message {
    position: fixed;
    z-index: 100;
    left: 50%;
    top: 20px;
    transform: translateX(-50%);
    width: min(600px, calc(100% - 30px));
    background: #172331;
    border: 1px solid #3b4d60;
    color: #fbbf24;
    padding: 13px 16px;
    border-radius: 13px;
    box-shadow: 0 15px 50px rgba(0,0,0,.45);
  }

  .statsGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 11px;
    margin: 8px 0 14px;
  }

  .stat {
    background: rgba(255,255,255,.055);
    border: 1px solid rgba(255,255,255,.075);
    border-radius: 18px;
    padding: 16px;
    text-align: center;
  }

  .stat span {
    display: block;
    font-size: 23px;
  }

  .stat strong {
    display: block;
    margin-top: 4px;
    font-size: 25px;
  }

  .stat small {
    color: #8492a2;
    font-size: 11px;
  }

  .heroActions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 14px;
  }

  .actionCard {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 15px;
    align-items: center;
    padding: 20px;
    border-radius: 21px;
    border: 1px solid;
  }

  .actionCard.beer {
    background: linear-gradient(
      135deg,
      rgba(245,158,11,.17),
      rgba(255,255,255,.04)
    );
    border-color: rgba(245,158,11,.3);
  }

  .actionCard.crate {
    background: linear-gradient(
      135deg,
      rgba(120,70,20,.3),
      rgba(255,255,255,.04)
    );
    border-color: rgba(180,110,40,.35);
  }

  .actionCard h3 {
    margin: 0 0 5px;
    font-size: 18px;
  }

  .actionCard p {
    margin: 0;
    color: #9aa7b5;
    line-height: 1.45;
    font-size: 13px;
  }

  .actionCard button {
    grid-column: 1 / -1;
    border: 0;
    border-radius: 12px;
    padding: 12px;
    background: #f59e0b;
    font-weight: 900;
  }

  .bigEmoji {
    font-size: 45px;
  }

  .crateLarge {
    width: 78px;
    text-align: center;
    font-size: 24px;
    padding: 8px;
    border-radius: 13px;
    background: #8a511b;
    border: 2px solid #b97528;
  }

  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 14px;
  }

  .card {
    background: rgba(255,255,255,.055);
    border: 1px solid rgba(255,255,255,.075);
    border-radius: 21px;
    padding: 20px;
    margin-bottom: 14px;
  }

  .card h2 {
    margin: 0 0 7px;
    font-size: 20px;
  }

  .card p {
    color: #8f9cab;
    line-height: 1.5;
  }

  .cardHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 15px;
  }

  .cardHeader h2 {
    margin: 0;
  }

  .smallButton,
  .secondary {
    border: 1px solid #344251;
    background: #17212d;
    color: #fff;
    border-radius: 10px;
    padding: 9px 12px;
    font-weight: 800;
  }

  .inviteCode {
    font-size: 30px;
    font-weight: 1000;
    letter-spacing: 7px;
    text-align: center;
    background: #0c1219;
    padding: 20px;
    border-radius: 15px;
    color: #fbbf24;
  }

  .promilleCard {
    text-align: center;
  }

  .promille {
    font-size: 48px;
    font-weight: 1000;
    color: #fbbf24;
    margin: 10px;
  }

  .quickGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 9px;
  }

  .quickGrid button {
    border: 1px solid #303d4c;
    background: #131d27;
    color: #e8edf2;
    border-radius: 13px;
    padding: 13px 8px;
    font-weight: 800;
  }

  .drinkList,
  .peopleList,
  .requestList,
  .rankingList {
    display: grid;
    gap: 8px;
  }

  .drinkRow,
  .personRow,
  .requestRow,
  .rankingRow {
    display: flex;
    align-items: center;
    gap: 13px;
    background: rgba(255,255,255,.045);
    border: 1px solid rgba(255,255,255,.055);
    border-radius: 15px;
    padding: 13px;
  }

  .drinkIcon,
  .requestIcon {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: #202b36;
    font-size: 24px;
  }

  .drinkInfo,
  .personInfo,
  .requestInfo {
    display: grid;
    gap: 3px;
    flex: 1;
  }

  .drinkInfo strong,
  .personInfo strong,
  .requestInfo strong {
    color: #fff;
  }

  .drinkInfo small {
    color: #fbbf24;
  }

  .drinkInfo span,
  .drinkInfo em,
  .personInfo span,
  .requestInfo span,
  .requestInfo small {
    color: #8795a4;
    font-size: 12px;
    font-style: normal;
  }

  .drinkRight {
    display: grid;
    justify-items: end;
    gap: 7px;
  }

  .drinkRight strong {
    color: #fbbf24;
  }

  .miniAction {
    border: 0;
    background: #273442;
    color: #fff;
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 11px;
    font-weight: 800;
  }

  .avatar {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #263544;
    color: #fbbf24;
    font-weight: 1000;
  }

  .rankBadge {
    width: 38px;
    text-align: center;
    font-weight: 900;
  }

  .points {
    color: #fbbf24;
    white-space: nowrap;
  }

  .requestActions {
    display: flex;
    gap: 7px;
  }

  .accept,
  .decline {
    border: 0;
    border-radius: 9px;
    padding: 9px 12px;
    font-weight: 900;
  }

  .accept {
    background: #22c55e;
    color: #041309;
  }

  .decline {
    background: #33404d;
    color: #fff;
  }

  .beerRequestHero {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 20px;
    align-items: start;
    background: linear-gradient(
      135deg,
      rgba(245,158,11,.15),
      rgba(255,255,255,.04)
    );
  }

  .requestEmoji {
    font-size: 60px;
    text-align: center;
  }

  .challengeGrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .challenge {
    background: #111923;
    border: 1px solid #283544;
    border-radius: 17px;
    padding: 16px;
  }

  .challengeTop,
  .challengeStats {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .challengeTop span {
    color: #fbbf24;
    font-size: 12px;
    font-weight: 900;
  }

  .challengeTop b {
    color: #22c55e;
  }

  .challenge h3 {
    margin-bottom: 6px;
  }

  .challenge p {
    font-size: 13px;
  }

  .challengeStats {
    color: #8493a3;
    font-size: 11px;
    margin: 12px 0;
  }

  .status {
    display: inline-block;
    padding: 5px 9px;
    background: #263442;
    border-radius: 8px;
    font-size: 11px;
  }

  .status.done {
    background: #14532d;
    color: #86efac;
  }

  .rankingHero {
    text-align: center;
    padding: 10px 0 20px;
  }

  .trophy {
    font-size: 65px;
  }

  .rankingHero h2 {
    font-size: 26px;
  }

  .rankingRow {
    display: grid;
    grid-template-columns: 45px 40px 1fr auto;
  }

  .rankingRow.top {
    background: linear-gradient(
      90deg,
      rgba(245,158,11,.13),
      rgba(255,255,255,.04)
    );
  }

  .place {
    text-align: center;
    font-size: 19px;
  }

  .statsLarge {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .statsLarge > div {
    background: #111923;
    border: 1px solid #273443;
    border-radius: 15px;
    text-align: center;
    padding: 18px 10px;
  }

  .statsLarge span,
  .statsLarge strong,
  .statsLarge small {
    display: block;
  }

  .statsLarge span {
    font-size: 24px;
  }

  .statsLarge strong {
    font-size: 23px;
    margin: 5px 0;
  }

  .statsLarge small {
    color: #8492a2;
  }

  .costLine {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    background: #111923;
    border-radius: 11px;
    padding: 13px;
    margin-top: 7px;
  }

  .costLine b {
    color: #fbbf24;
  }

  .costLine.highlight {
    border: 1px solid rgba(245,158,11,.3);
    background: rgba(245,158,11,.08);
  }

  .formGrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .promilleBig {
    margin-top: 20px;
    text-align: center;
    font-size: 55px;
    font-weight: 1000;
    color: #fbbf24;
  }

  .empty {
    text-align: center;
    padding: 45px 15px;
    color: #7f8c9a;
  }

  .empty div {
    font-size: 40px;
  }

  footer {
    text-align: center;
    padding: 30px 10px 15px;
    color: #637181;
  }

  footer strong,
  footer span {
    display: block;
  }

  footer span {
    margin-top: 5px;
    font-size: 12px;
  }

  .overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0,0,0,.72);
    backdrop-filter: blur(8px);
    display: grid;
    place-items: center;
    padding: 20px;
  }

  .modal {
    width: min(520px, 100%);
    background: #111923;
    border: 1px solid #334252;
    border-radius: 22px;
    padding: 22px;
    box-shadow: 0 30px 100px rgba(0,0,0,.7);
  }

  .modalHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .modalHeader h2 {
    margin: 0;
  }

  .close {
    width: 35px;
    height: 35px;
    border: 0;
    border-radius: 10px;
    background: #263340;
    color: #fff;
    font-size: 24px;
  }

  .modal input,
  .modal select {
    width: 100%;
  }

  .full {
    width: 100%;
    margin-top: 8px;
  }

  .inviteInput {
    width: 100%;
    text-align: center;
    font-size: 25px;
    letter-spacing: 5px;
    text-transform: uppercase;
    margin: 12px 0;
  }

  @media (max-width: 850px) {
    .shell {
      padding: 14px;
    }

    .topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .joinTop {
      width: 100%;
    }

    .eventHero {
      flex-direction: column;
      align-items: stretch;
    }

    .eventHero select {
      width: 100%;
    }

    .heroActions,
    .grid2 {
      grid-template-columns: 1fr;
    }

    .quickGrid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 620px) {
    .brand {
      align-items: flex-start;
    }

    .crateButton {
      width: 67px;
      min-width: 67px;
      height: 65px;
    }

    .crateButton span {
      font-size: 16px;
    }

    .brand h1 {
      font-size: 20px;
    }

    .brand p {
      font-size: 11px;
    }

    .statsGrid {
      grid-template-columns: repeat(2, 1fr);
    }

    .actionCard {
      grid-template-columns: 65px 1fr;
    }

    .bigEmoji {
      font-size: 37px;
    }

    .crateLarge {
      width: 65px;
      font-size: 20px;
    }

    .quickGrid {
      grid-template-columns: 1fr;
    }

    .challengeGrid {
      grid-template-columns: 1fr;
    }

    .statsLarge {
      grid-template-columns: repeat(2, 1fr);
    }

    .rankingRow {
      grid-template-columns: 35px 36px 1fr auto;
      gap: 7px;
    }

    .points {
      font-size: 12px;
    }

    .formGrid {
      grid-template-columns: 1fr;
    }

    .beerRequestHero {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .requestActions {
      flex-direction: column;
    }
  }
`;
