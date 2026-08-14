"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

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
  cost_overview_enabled?: boolean | null;
  auto_split_costs?: boolean | null;
  team_mode?: boolean | null;
  show_photos?: boolean | null;
  show_costs?: boolean | null;
};

type Profile = {
  id: string;
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
  email?: string | null;
  avatar_url?: string | null;
  is_global_admin?: boolean | null;
};

type Member = {
  id: string;
  event_id: string;
  profile_id: string;
  role?: string | null;
  profile?: Profile | null;
};

type Drink = {
  id: string;
  event_id: string;
  profile_id?: string | null;
  category?: string | null;
  drink_name?: string | null;
  getraenk?: string | null;
  marke?: string | null;
  brand?: string | null;
  liters?: number | null;
  menge?: number | null;
  alcohol_percent?: number | null;
  alkohol?: number | null;
  quantity?: number | null;
  preis?: number | null;
  price?: number | null;
  image?: string | null;
  photo_url?: string | null;
  created_at?: string | null;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status: string;
  message?: string | null;
  created_at?: string | null;
};

type BeerResponse = {
  id: string;
  request_id: string;
  profile_id: string;
  response: string;
};

type Challenge = {
  id: string;
  event_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  points?: number | null;
  status?: string | null;
  required_votes?: number | null;
  participant_count?: number | null;
  vote_count?: number | null;
  positive_vote_count?: number | null;
};

type Tab =
  | "overview"
  | "drinks"
  | "members"
  | "requests"
  | "challenges"
  | "ranking"
  | "stats";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");
  const [event, setEvent] = useState<Event | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [requests, setRequests] = useState<BeerRequest[]>([]);
  const [responses, setResponses] = useState<BeerResponse[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [message, setMessage] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [brand, setBrand] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("1");

  const [inviteCode, setInviteCode] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePoints, setChallengePoints] = useState("10");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4000);
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      notify("❌ Events konnten nicht geladen werden.");
      return;
    }

    const list = (data ?? []) as Event[];
    setEvents(list);

    if (!eventId && list.length > 0) {
      setEventId(list[0].id);
    }
  }

  async function loadProfile() {
    const {
      data: { user },
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
  }

  async function loadEventData() {
    if (!eventId) return;

    setLoading(true);

    const selected = events.find((item) => item.id === eventId) ?? null;
    setEvent(selected);

    const membersResult = await supabase
      .from("event_members")
      .select("*")
      .eq("event_id", eventId);

    const memberRows = (membersResult.data ?? []) as Member[];

    if (memberRows.length > 0) {
      const profileIds = memberRows.map((member) => member.profile_id);

      const profilesResult = await supabase
        .from("profiles")
        .select("*")
        .in("id", profileIds);

      const profileRows = (profilesResult.data ?? []) as Profile[];

      setMembers(
        memberRows.map((member) => ({
          ...member,
          profile:
            profileRows.find(
              (profileRow) => profileRow.id === member.profile_id
            ) ?? null,
        }))
      );
    } else {
      setMembers([]);
    }

    const drinksResult = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    setDrinks((drinksResult.data ?? []) as Drink[]);

    const requestResult = await supabase
      .from("beer_requests")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    setRequests((requestResult.data ?? []) as BeerRequest[]);

    const requestIds = (requestResult.data ?? []).map(
      (request) => request.id
    );

    if (requestIds.length > 0) {
      const responseResult = await supabase
        .from("beer_request_responses")
        .select("*")
        .in("request_id", requestIds);

      setResponses((responseResult.data ?? []) as BeerResponse[]);
    } else {
      setResponses([]);
    }

    const challengeResult = await supabase
      .from("challenge_dashboard")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    setChallenges((challengeResult.data ?? []) as Challenge[]);

    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
    loadProfile();
  }, []);

  useEffect(() => {
    loadEventData();
  }, [eventId, events.length]);

  const currentMember = useMemo(() => {
    if (!profile) return null;

    return (
      members.find((member) => member.profile_id === profile.id) ?? null
    );
  }, [members, profile]);

  const myPoints = Number(profile?.points ?? 0);

  const totalLiters = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(drink.liters ?? drink.menge ?? 0) *
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
          Number(drink.preis ?? drink.price ?? 0) *
            Number(drink.quantity ?? 1),
        0
      ),
    [drinks]
  );

  const totalDrinks = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) => sum + Number(drink.quantity ?? 1),
        0
      ),
    [drinks]
  );

  const ranking = useMemo(() => {
    return [...members].sort(
      (a, b) =>
        Number(b.profile?.points ?? 0) -
        Number(a.profile?.points ?? 0)
    );
  }, [members]);

  const pendingRequests = requests.filter(
    (request) =>
      request.status === "pending" &&
      request.requester_profile_id !== profile?.id
  );

  const myPendingRequests = requests.filter(
    (request) =>
      request.status === "pending" &&
      request.requester_profile_id === profile?.id
  );

  function displayName(member: Member) {
    return (
      member.profile?.name ||
      member.profile?.username ||
      "Teilnehmer"
    );
  }

  function displayDrinkName(drink: Drink) {
    return drink.drink_name || drink.getraenk || "Getränk";
  }

  function displayBrand(drink: Drink) {
    return drink.marke || drink.brand || "";
  }

  async function saveDrink() {
    if (!eventId) {
      notify("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      notify("❌ Bitte ein Getränk eingeben.");
      return;
    }

    setSaving(true);

    const amount = Number(liters);
    const alcoholValue = Number(alcohol);
    const priceValue = Number(price);
    const quantityValue = Math.max(1, Number(quantity));

    const { error } = await supabase.from("drinks").insert({
      event_id: eventId,
      profile_id: profile?.id ?? null,
      drink_name: drinkName.trim(),
      getraenk: drinkName.trim(),
      brand: brand.trim() || null,
      marke: brand.trim() || null,
      liters: amount,
      menge: amount,
      alcohol_percent: alcoholValue,
      alkohol: alcoholValue,
      quantity: quantityValue,
      preis: priceValue,
      price: priceValue,
    });

    setSaving(false);

    if (error) {
      notify("❌ " + error.message);
      return;
    }

    setDrinkName("");
    setBrand("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");
    setQuantity("1");

    notify("✅ Getränk gespeichert.");
    await loadEventData();
  }

  async function requestBeer() {
    if (!eventId || !profile?.id) {
      notify("❌ Du musst einem Event beigetreten sein.");
      return;
    }

    const existing = requests.find(
      (request) =>
        request.requester_profile_id === profile.id &&
        request.status === "pending"
    );

    if (existing) {
      notify("🍺 Du hast bereits eine offene Bier-Anfrage.");
      return;
    }

    const { error } = await supabase.from("beer_requests").insert({
      event_id: eventId,
      requester_profile_id: profile.id,
      status: "pending",
      message: "Ich möchte gerne ein Bier.",
    });

    if (error) {
      notify("❌ Bier-Anfrage konnte nicht erstellt werden.");
      return;
    }

    notify("🍺 Bier-Anfrage wurde an alle Teilnehmer gesendet.");
    await loadEventData();
  }

  async function answerBeerRequest(
    requestId: string,
    response: "accepted" | "rejected"
  ) {
    if (!profile?.id) return;

    const { error } = await supabase
      .from("beer_request_responses")
      .upsert(
        {
          request_id: requestId,
          profile_id: profile.id,
          response,
        },
        {
          onConflict: "request_id,profile_id",
        }
      );

    if (error) {
      notify("❌ Antwort konnte nicht gespeichert werden.");
      return;
    }

    notify(
      response === "accepted"
        ? "👍 Du hast zugestimmt."
        : "👎 Du hast abgelehnt."
    );

    await loadEventData();
  }

  async function giveBeerCrate() {
    if (!eventId || !profile?.id) return;

    const { error } = await supabase
      .from("beer_crate_sponsorships")
      .insert({
        event_id: eventId,
        profile_id: profile.id,
        crates: 1,
        points_awarded: 25,
        description: "Bierkiste für die Runde ausgegeben",
      });

    if (error) {
      notify("❌ Bierkiste konnte nicht gespeichert werden.");
      return;
    }

    await supabase
      .from("profiles")
      .update({
        points: myPoints + 25,
      })
      .eq("id", profile.id);

    if (profile) {
      setProfile({
        ...profile,
        points: myPoints + 25,
      });
    }

    notify("🍺🍺🍺 Bierkiste ausgegeben! +25 Punkte");
    await loadEventData();
  }

  async function joinEvent() {
    const code = inviteCode.trim().toUpperCase();

    if (!code) {
      notify("❌ Einladungscode eingeben.");
      return;
    }

    if (!profile?.id) {
      notify("❌ Bitte zuerst anmelden.");
      return;
    }

    const { data: foundEvent, error } = await supabase
      .from("events")
      .select("*")
      .eq("invite_code", code)
      .maybeSingle();

    if (error || !foundEvent) {
      notify("❌ Einladungscode nicht gefunden.");
      return;
    }

    const { error: memberError } = await supabase
      .from("event_members")
      .upsert(
        {
          event_id: foundEvent.id,
          profile_id: profile.id,
          joined_via_code: code,
          role: "member",
        },
        {
          onConflict: "event_id,profile_id",
        }
      );

    if (memberError) {
      notify("❌ Event konnte nicht beigetreten werden.");
      return;
    }

    setEventId(foundEvent.id);
    setEvents((old) => {
      const exists = old.some((item) => item.id === foundEvent.id);
      return exists ? old : [foundEvent as Event, ...old];
    });

    setInviteCode("");
    notify("✅ Event erfolgreich beigetreten.");
  }

  async function createChallenge() {
    if (!eventId || !challengeTitle.trim()) {
      notify("❌ Bitte einen Challenge-Titel eingeben.");
      return;
    }

    const { error } = await supabase.from("challenges").insert({
      event_id: eventId,
      title: challengeTitle.trim(),
      description: challengeDescription.trim(),
      points: Number(challengePoints),
      status: "open",
    });

    if (error) {
      notify(
        "❌ Challenge konnte nicht erstellt werden. Falls deine Datenbank keine challenges-Tabelle besitzt, überspringe diese Funktion."
      );
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");

    notify("🔥 Challenge erstellt.");
    await loadEventData();
  }

  async function copyInviteCode() {
    if (!event?.invite_code) return;

    await navigator.clipboard.writeText(event.invite_code);
    notify("📋 Einladungscode kopiert.");
  }

  function calculatePromille(): number {
    if (!profile) return 0;

    const weight = Number(
      profile.weight_kg ?? profile.gewicht_kg ?? 0
    );

    const height = Number(profile.height_cm ?? 0);
    const age = Number(profile.age ?? profile.alter ?? 0);

    if (weight <= 0) return 0;

    const grams = drinks.reduce((sum, drink) => {
      const volume =
        Number(drink.liters ?? drink.menge ?? 0) *
        Number(drink.quantity ?? 1);

      const percent = Number(
        drink.alcohol_percent ?? drink.alkohol ?? 0
      );

      return sum + volume * 1000 * (percent / 100) * 0.789;
    }, 0);

    let factor = 0.68;

    const gender = String(
      profile.gender ??
        profile.geschlecht ??
        ""
    ).toLowerCase();

    if (
      gender.includes("weib") ||
      gender === "female" ||
      gender === "f"
    ) {
      factor = 0.55;
    }

    const heightFactor =
      height > 0 ? Math.max(0.9, Math.min(1.1, height / 180)) : 1;

    const ageFactor =
      age >= 50 ? 0.95 : age > 0 && age < 25 ? 1.03 : 1;

    return Math.max(
      0,
      grams / (weight * factor * heightFactor * ageFactor)
    );
  }

  const promille = calculatePromille();

  return (
    <main className="app">
      <div className="shell">
        <header className="topbar">
          <div className="brandArea">
            <div className="crateLogo" aria-label="Bierkiste">
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
              <b>KISTE</b>
            </div>

            <div>
              <h1>Güstener Zapfhahn Zentrale</h1>
              <p>Events · Getränke · Kosten · Rankings</p>
            </div>
          </div>

          <button
            className="joinButton"
            onClick={() =>
              document
                .getElementById("join")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            🔑 Event beitreten
          </button>
        </header>

        {event && (
          <section className="eventHero">
            <div>
              <span className="eyebrow">AKTUELLES EVENT</span>
              <h2>{event.title}</h2>
              {event.location && <p>📍 {event.location}</p>}
              {event.description && (
                <p className="muted">{event.description}</p>
              )}
            </div>

            <div className="eventDates">
              {event.start_date && <span>📅 {event.start_date}</span>}
              {event.end_date && <span>→ {event.end_date}</span>}
            </div>
          </section>
        )}

        <nav className="tabs">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          >
            🏠 Übersicht
          </TabButton>

          <TabButton
            active={activeTab === "drinks"}
            onClick={() => setActiveTab("drinks")}
          >
            🍺 Getränke
          </TabButton>

          <TabButton
            active={activeTab === "members"}
            onClick={() => setActiveTab("members")}
          >
            👥 Teilnehmer
          </TabButton>

          <TabButton
            active={activeTab === "requests"}
            onClick={() => setActiveTab("requests")}
          >
            🍻 Bier-Anfragen
            {pendingRequests.length > 0 && (
              <span className="badge">{pendingRequests.length}</span>
            )}
          </TabButton>

          <TabButton
            active={activeTab === "challenges"}
            onClick={() => setActiveTab("challenges")}
          >
            🔥 Challenges
          </TabButton>

          <TabButton
            active={activeTab === "ranking"}
            onClick={() => setActiveTab("ranking")}
          >
            🏆 Ranking
          </TabButton>

          <TabButton
            active={activeTab === "stats"}
            onClick={() => setActiveTab("stats")}
          >
            📊 Statistik
          </TabButton>
        </nav>

        <section className="statsGrid">
          <Stat icon="🍺" value={String(totalDrinks)} label="Getränke" />
          <Stat
            icon="💧"
            value={totalLiters.toFixed(1)}
            label="Liter"
          />
          <Stat
            icon="👥"
            value={String(members.length)}
            label="Teilnehmer"
          />
          <Stat
            icon="🏆"
            value={String(myPoints)}
            label="Meine Punkte"
          />
        </section>

        {activeTab === "overview" && (
          <>
            <section className="featureGrid">
              <div className="featureCard beerRequestCard">
                <div className="featureIcon">🍺</div>
                <h3>Ich möchte ein Bier</h3>
                <p>
                  Alle Teilnehmer bekommen eine Anfrage und können
                  zustimmen oder ablehnen.
                </p>

                <button
                  className="primaryButton"
                  onClick={requestBeer}
                  disabled={myPendingRequests.length > 0}
                >
                  🍺{" "}
                  {myPendingRequests.length > 0
                    ? "Anfrage läuft..."
                    : "Bier anfragen"}
                </button>
              </div>

              <div className="featureCard crateCard">
                <div className="crateBig">🍺🍺🍺</div>
                <h3>Bierkiste ausgeben</h3>
                <p>
                  Du gibst eine Kiste Bier für die Runde aus und bekommst
                  dafür Punkte.
                </p>

                <button
                  className="crateButton"
                  onClick={giveBeerCrate}
                >
                  🍻 Kiste ausgeben
                </button>
              </div>
            </section>

            <section className="twoColumn">
              <div className="card" id="join">
                <h3>🔑 Einladungscode</h3>

                {event?.invite_code ? (
                  <>
                    <div className="inviteCode">
                      {event.invite_code}
                    </div>

                    <button
                      className="secondaryButton"
                      onClick={copyInviteCode}
                    >
                      📋 Kopieren
                    </button>

                    <p className="hint">
                      Diesen Code können Freunde verwenden, um dem Event
                      beizutreten.
                    </p>
                  </>
                ) : (
                  <p className="muted">
                    Für dieses Event ist kein Einladungscode hinterlegt.
                  </p>
                )}

                <div className="joinBox">
                  <input
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(e.target.value.toUpperCase())
                    }
                    placeholder="z.B. FBD1-A687"
                  />

                  <button
                    className="primaryButton"
                    onClick={joinEvent}
                  >
                    🔑 Beitreten
                  </button>
                </div>
              </div>

              <div className="card">
                <h3>🧪 Mein Promillewert</h3>

                {event?.show_promille ? (
                  <div className="promille">
                    <strong>{promille.toFixed(2)} ‰</strong>
                    <span>berechneter Event-Wert</span>
                  </div>
                ) : (
                  <div className="disabledBox">
                    Promille-Anzeige für dieses Event deaktiviert.
                  </div>
                )}

                <p className="warning">
                  ⚠️ Der Wert ist nur eine grobe Schätzung und kein
                  zuverlässiger Wert für Fahrtüchtigkeit.
                </p>
              </div>
            </section>

            <section className="card">
              <h3>⚡ Schnellaktionen</h3>

              <div className="quickActions">
                <button
                  onClick={() => setActiveTab("drinks")}
                  className="quickButton"
                >
                  ➕ Getränk hinzufügen
                </button>

                <button
                  onClick={() => setActiveTab("requests")}
                  className="quickButton"
                >
                  🍻 Bier-Anfragen
                  {pendingRequests.length > 0 && (
                    <span className="badge">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("challenges")}
                  className="quickButton"
                >
                  🔥 Challenges
                </button>

                <button
                  onClick={() => setActiveTab("ranking")}
                  className="quickButton"
                >
                  🏆 Ranking
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === "drinks" && (
          <section className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">EVENT</span>
                <h2>🍺 Getränke</h2>
              </div>
              <strong>{totalDrinks} Getränke</strong>
            </div>

            <div className="formGrid">
              <input
                value={drinkName}
                onChange={(e) => setDrinkName(e.target.value)}
                placeholder="Getränk"
              />

              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Marke"
              />

              <input
                type="number"
                min="0"
                step="0.1"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                placeholder="Liter"
              />

              <input
                type="number"
                min="0"
                step="0.1"
                value={alcohol}
                onChange={(e) => setAlcohol(e.target.value)}
                placeholder="Alkohol %"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Preis €"
              />

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Menge"
              />
            </div>

            <button
              className="primaryButton full"
              onClick={saveDrink}
              disabled={saving}
            >
              {saving ? "Speichere..." : "🍻 Getränk speichern"}
            </button>

            <div className="list">
              {drinks.length === 0 ? (
                <Empty text="Noch keine Getränke." />
              ) : (
                drinks.map((drink) => (
                  <div className="drinkRow" key={drink.id}>
                    <div className="drinkIcon">🍺</div>

                    <div className="drinkInfo">
                      <strong>{displayDrinkName(drink)}</strong>

                      {displayBrand(drink) && (
                        <span>{displayBrand(drink)}</span>
                      )}

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
                        {" · "}
                        ×{Number(drink.quantity ?? 1)}
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
            </div>
          </section>
        )}

        {activeTab === "members" && (
          <section className="card">
            <div className="sectionHeader">
              <h2>👥 Teilnehmer</h2>
              <strong>{members.length}</strong>
            </div>

            {members.length === 0 ? (
              <Empty text="Noch keine Teilnehmer." />
            ) : (
              <div className="memberGrid">
                {members.map((member) => (
                  <div className="memberCard" key={member.id}>
                    <div className="avatar">
                      {displayName(member).charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <strong>{displayName(member)}</strong>
                      <small>
                        🏆 {Number(member.profile?.points ?? 0)} Punkte
                      </small>
                    </div>

                    <span className="memberStatus">● dabei</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "requests" && (
          <section className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">RUNDE</span>
                <h2>🍻 Bier-Anfragen</h2>
              </div>

              <span className="badgeLarge">
                {requests.filter((r) => r.status === "pending").length}
              </span>
            </div>

            {requests.length === 0 ? (
              <Empty text="Noch keine Bier-Anfragen." />
            ) : (
              <div className="requestList">
                {requests.map((request) => {
                  const requester = members.find(
                    (member) =>
                      member.profile_id === request.requester_profile_id
                  );

                  const myResponse = responses.find(
                    (response) =>
                      response.request_id === request.id &&
                      response.profile_id === profile?.id
                  );

                  const responseCount = responses.filter(
                    (response) => response.request_id === request.id
                  );

                  return (
                    <div className="requestCard" key={request.id}>
                      <div className="requestIcon">🍺</div>

                      <div className="requestContent">
                        <strong>
                          {requester
                            ? displayName(requester)
                            : "Teilnehmer"}{" "}
                          möchte ein Bier
                        </strong>

                        <p>
                          {request.message ||
                            "Ich möchte gerne ein Bier."}
                        </p>

                        <small>
                          👍{" "}
                          {
                            responseCount.filter(
                              (response) =>
                                response.response === "accepted"
                            ).length
                          }{" "}
                          Zustimmung · 👎{" "}
                          {
                            responseCount.filter(
                              (response) =>
                                response.response === "rejected"
                            ).length
                          }{" "}
                          Ablehnung
                        </small>
                      </div>

                      {request.status === "pending" &&
                        request.requester_profile_id !==
                          profile?.id &&
                        !myResponse && (
                          <div className="requestButtons">
                            <button
                              className="accept"
                              onClick={() =>
                                answerBeerRequest(
                                  request.id,
                                  "accepted"
                                )
                              }
                            >
                              👍 Ja
                            </button>

                            <button
                              className="reject"
                              onClick={() =>
                                answerBeerRequest(
                                  request.id,
                                  "rejected"
                                )
                              }
                            >
                              👎 Nein
                            </button>
                          </div>
                        )}

                      {myResponse && (
                        <span className="responseLabel">
                          {myResponse.response === "accepted"
                            ? "👍 Zugestimmt"
                            : "👎 Abgelehnt"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === "challenges" && (
          <section className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">SPIEL</span>
                <h2>🔥 Challenges</h2>
              </div>
            </div>

            <div className="challengeCreator">
              <input
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                placeholder="Challenge"
              />

              <input
                value={challengeDescription}
                onChange={(e) =>
                  setChallengeDescription(e.target.value)
                }
                placeholder="Beschreibung"
              />

              <input
                type="number"
                min="1"
                value={challengePoints}
                onChange={(e) =>
                  setChallengePoints(e.target.value)
                }
                placeholder="Punkte"
              />

              <button
                className="primaryButton"
                onClick={createChallenge}
              >
                🔥 Challenge erstellen
              </button>
            </div>

            {challenges.length === 0 ? (
              <Empty text="Noch keine Challenges vorhanden." />
            ) : (
              <div className="challengeList">
                {challenges.map((challenge) => (
                  <div className="challengeCard" key={challenge.id}>
                    <div className="challengeEmoji">🔥</div>

                    <div>
                      <strong>{challenge.title}</strong>

                      <p>{challenge.description}</p>

                      <small>
                        {challenge.category || "Challenge"} ·{" "}
                        {Number(challenge.points ?? 0)} Punkte
                      </small>
                    </div>

                    <span className="challengeStatus">
                      {challenge.status || "open"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "ranking" && (
          <section className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">PUNKTE</span>
                <h2>🏆 Ranking</h2>
              </div>
            </div>

            {ranking.length === 0 ? (
              <Empty text="Noch keine Teilnehmer." />
            ) : (
              <div className="rankingList">
                {ranking.map((member, index) => (
                  <div
                    className={
                      "rankingRow " +
                      (member.profile_id === profile?.id
                        ? "me"
                        : "")
                    }
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
                      {displayName(member)
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="rankName">
                      <strong>{displayName(member)}</strong>

                      {member.profile_id === profile?.id && (
                        <small>Du</small>
                      )}
                    </div>

                    <strong className="rankPoints">
                      {Number(member.profile?.points ?? 0)} Punkte
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "stats" && (
          <section className="statsPage">
            <div className="card">
              <h2>📊 Event-Statistik</h2>

              <div className="bigStats">
                <div>
                  <span>🍺</span>
                  <strong>{totalDrinks}</strong>
                  <small>Getränke</small>
                </div>

                <div>
                  <span>💧</span>
                  <strong>{totalLiters.toFixed(1)} L</strong>
                  <small>Getränkemenge</small>
                </div>

                <div>
                  <span>💶</span>
                  <strong>{totalCost.toFixed(2)} €</strong>
                  <small>Gesamtkosten</small>
                </div>

                <div>
                  <span>👥</span>
                  <strong>{members.length}</strong>
                  <small>Teilnehmer</small>
                </div>
              </div>
            </div>

            <div className="card">
              <h2>💶 Kostenaufteilung</h2>

              <div className="costBig">
                {totalCost.toFixed(2)} €
              </div>

              <p>Gesamtkosten des Events</p>

              <div className="costLine">
                <span>👥 Teilnehmer</span>
                <strong>{members.length}</strong>
              </div>

              <div className="costLine">
                <span>💶 Pro Person</span>
                <strong>
                  {members.length > 0
                    ? (totalCost / members.length).toFixed(2)
                    : "0.00"}{" "}
                  €
                </strong>
              </div>

              <div className="costLine">
                <span>🏆 Punkte</span>
                <strong>
                  {members.reduce(
                    (sum, member) =>
                      sum + Number(member.profile?.points ?? 0),
                    0
                  )}
                </strong>
              </div>

              <p className="hint">
                Die Kosten werden bei aktivierter Einstellung
                automatisch auf die Teilnehmer verteilt.
              </p>
            </div>
          </section>
        )}

        {message && <div className="toast">{message}</div>}

        {loading && (
          <div className="loading">
            Daten werden geladen...
          </div>
        )}

        <footer>
          <strong>🍺🍺🍺 Güstener Zapfhahn Zentrale</strong>
          <span>Dein Event. Deine Getränke. Deine Runde.</span>
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
          background: #070a0d;
        }

        .app {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          background:
            radial-gradient(
              circle at 50% -20%,
              rgba(245, 158, 11, 0.16),
              transparent 38%
            ),
            #070a0d;
          color: #f8fafc;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 22px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .brandArea {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .crateLogo {
          position: relative;
          width: 78px;
          height: 70px;
          border-radius: 12px;
          border: 3px solid #7c4616;
          background:
            linear-gradient(
              90deg,
              rgba(0, 0, 0, 0.16) 1px,
              transparent 1px
            ),
            linear-gradient(
              rgba(0, 0, 0, 0.13) 1px,
              transparent 1px
            ),
            #b56b22;
          background-size: 13px 13px;
          box-shadow:
            inset 0 0 0 3px rgba(255, 255, 255, 0.08),
            0 10px 30px rgba(0, 0, 0, 0.35);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: center;
          justify-items: center;
          padding: 8px 5px 18px;
          overflow: hidden;
        }

        .crateLogo span {
          font-size: 20px;
          filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.35));
        }

        .crateLogo b {
          position: absolute;
          bottom: 2px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8px;
          color: #3d2008;
          letter-spacing: 1px;
        }

        h1 {
          margin: 0;
          font-size: clamp(21px, 3vw, 32px);
          letter-spacing: -0.7px;
        }

        .brandArea p {
          margin: 5px 0 0;
          color: #94a3b8;
        }

        .joinButton,
        .primaryButton,
        .secondaryButton,
        .crateButton,
        .quickButton,
        .accept,
        .reject {
          border: 0;
          border-radius: 12px;
          padding: 12px 16px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.18s ease;
        }

        button:hover {
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .joinButton,
        .primaryButton {
          background: #f59e0b;
          color: #18100a;
        }

        .secondaryButton {
          background: #202a35;
          color: white;
        }

        .crateButton {
          background: linear-gradient(
            135deg,
            #f59e0b,
            #d97706
          );
          color: #1c1105;
          width: 100%;
        }

        .eventHero {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 22px;
          border: 1px solid #26313d;
          border-radius: 20px;
          background:
            linear-gradient(
              135deg,
              rgba(245, 158, 11, 0.08),
              rgba(255, 255, 255, 0.025)
            );
          margin-bottom: 15px;
        }

        .eventHero h2 {
          margin: 4px 0;
          font-size: 27px;
        }

        .eventHero p {
          margin: 4px 0;
          color: #a9b5c2;
        }

        .eventDates {
          display: flex;
          flex-direction: column;
          gap: 5px;
          color: #a9b5c2;
          text-align: right;
        }

        .eyebrow {
          color: #fbbf24;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 5px;
          margin-bottom: 15px;
          background: #10151b;
          border: 1px solid #202a35;
          border-radius: 15px;
          scrollbar-width: none;
        }

        .tabs::-webkit-scrollbar {
          display: none;
        }

        .tab {
          flex: 0 0 auto;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #94a3b8;
          padding: 11px 13px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .tab.active {
          background: #f59e0b;
          color: #17100a;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          margin-left: 6px;
          padding: 0 6px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          font-size: 11px;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          border: 1px solid #202a35;
          border-radius: 17px;
          background: #10151b;
          padding: 17px;
          text-align: center;
        }

        .statIcon {
          font-size: 23px;
        }

        .statValue {
          display: block;
          margin-top: 4px;
          font-size: 24px;
          font-weight: 900;
        }

        .statLabel {
          display: block;
          margin-top: 3px;
          color: #8492a3;
          font-size: 11px;
        }

        .featureGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .featureCard {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          border: 1px solid #27313d;
          padding: 24px;
          background: #10151b;
        }

        .featureCard p {
          color: #94a3b8;
          line-height: 1.55;
        }

        .featureIcon {
          font-size: 40px;
        }

        .crateBig {
          font-size: 34px;
          letter-spacing: -7px;
        }

        .featureCard h3 {
          margin: 8px 0;
          font-size: 21px;
        }

        .twoColumn {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .card {
          border: 1px solid #202a35;
          border-radius: 20px;
          background: #10151b;
          padding: 20px;
          margin-bottom: 15px;
        }

        .card h2,
        .card h3 {
          margin-top: 0;
        }

        .inviteCode {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 4px;
          color: #fbbf24;
          margin: 15px 0;
        }

        .hint,
        .muted {
          color: #7f8c9b;
          line-height: 1.5;
        }

        .joinBox {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        input,
        select {
          width: 100%;
          border: 1px solid #303b47;
          border-radius: 12px;
          background: #0a0f14;
          color: white;
          padding: 13px;
          outline: none;
        }

        input:focus,
        select:focus {
          border-color: #f59e0b;
        }

        .promille {
          border-radius: 16px;
          background: #0a0f14;
          border: 1px solid #303b47;
          padding: 20px;
          text-align: center;
        }

        .promille strong {
          display: block;
          font-size: 42px;
          color: #fbbf24;
        }

        .promille span {
          color: #8492a3;
        }

        .disabledBox {
          padding: 18px;
          border-radius: 14px;
          background: #0a0f14;
          color: #7f8c9b;
        }

        .warning {
          font-size: 11px;
          color: #9a7b4f;
          line-height: 1.5;
        }

        .quickActions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .quickButton {
          background: #19212b;
          color: white;
          border: 1px solid #2a3542;
        }

        .sectionHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 10px;
        }

        .full {
          width: 100%;
        }

        .list,
        .memberGrid,
        .requestList,
        .challengeList,
        .rankingList {
          margin-top: 18px;
        }

        .drinkRow {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border-radius: 14px;
          background: #151c24;
          border: 1px solid #202a35;
          margin-bottom: 8px;
        }

        .drinkIcon {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #202a35;
          font-size: 22px;
        }

        .drinkInfo {
          flex: 1;
        }

        .drinkInfo strong,
        .drinkInfo span,
        .drinkInfo small {
          display: block;
        }

        .drinkInfo span {
          color: #d3a14d;
          font-size: 12px;
        }

        .drinkInfo small {
          color: #7f8c9b;
          margin-top: 4px;
        }

        .memberGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .memberCard {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border-radius: 14px;
          background: #151c24;
        }

        .avatar,
        .rankAvatar {
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #f59e0b;
          color: #17100a;
          font-weight: 900;
        }

        .avatar {
          width: 44px;
          height: 44px;
        }

        .memberCard div:nth-child(2) {
          flex: 1;
        }

        .memberCard small {
          display: block;
          color: #8492a3;
          margin-top: 4px;
        }

        .memberStatus {
          color: #4ade80;
          font-size: 11px;
        }

        .badgeLarge {
          display: grid;
          place-items: center;
          min-width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #ef4444;
          font-weight: 900;
        }

        .requestCard {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 15px;
          background: #151c24;
          border: 1px solid #26313d;
          margin-bottom: 9px;
        }

        .requestIcon {
          font-size: 28px;
        }

        .requestContent {
          flex: 1;
        }

        .requestContent p {
          margin: 4px 0;
          color: #94a3b8;
        }

        .requestContent small {
          color: #748294;
        }

        .requestButtons {
          display: flex;
          gap: 7px;
        }

        .accept {
          background: #22c55e;
          color: #07140b;
        }

        .reject {
          background: #ef4444;
          color: white;
        }

        .responseLabel {
          color: #fbbf24;
          font-weight: 800;
        }

        .challengeCreator {
          display: grid;
          grid-template-columns: 1fr 1.5fr 120px auto;
          gap: 8px;
          margin-bottom: 18px;
        }

        .challengeCard {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px;
          background: #151c24;
          border-radius: 15px;
          margin-bottom: 9px;
        }

        .challengeEmoji {
          font-size: 30px;
        }

        .challengeCard div:nth-child(2) {
          flex: 1;
        }

        .challengeCard p {
          margin: 4px 0;
          color: #94a3b8;
        }

        .challengeCard small {
          color: #748294;
        }

        .challengeStatus {
          padding: 6px 10px;
          border-radius: 999px;
          background: #26351f;
          color: #86efac;
          font-size: 11px;
          font-weight: 800;
        }

        .rankingRow {
          display: grid;
          grid-template-columns: 45px 45px 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border-radius: 15px;
          background: #151c24;
          margin-bottom: 8px;
        }

        .rankingRow.me {
          border: 1px solid #d97706;
          background: #211a0f;
        }

        .rankPosition {
          text-align: center;
          font-size: 20px;
          font-weight: 900;
        }

        .rankAvatar {
          width: 40px;
          height: 40px;
        }

        .rankName small {
          display: block;
          color: #fbbf24;
          font-size: 11px;
          margin-top: 2px;
        }

        .rankPoints {
          color: #fbbf24;
        }

        .bigStats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .bigStats div {
          padding: 20px;
          text-align: center;
          border-radius: 15px;
          background: #151c24;
        }

        .bigStats span,
        .bigStats strong,
        .bigStats small {
          display: block;
        }

        .bigStats span {
          font-size: 25px;
        }

        .bigStats strong {
          font-size: 26px;
          margin: 6px 0;
        }

        .bigStats small {
          color: #7f8c9b;
        }

        .cost {
          text-align: center;
        }

        .costBig {
          font-size: 45px;
          font-weight: 900;
          color: #fbbf24;
        }

        .costLine {
          display: flex;
          justify-content: space-between;
          padding: 13px;
          background: #151c24;
          border-radius: 12px;
          margin-top: 8px;
        }

        .empty {
          padding: 35px;
          text-align: center;
          color: #748294;
          border-radius: 15px;
          background: #0c1117;
        }

        .toast {
          position: fixed;
          right: 20px;
          bottom: 20px;
          max-width: 420px;
          padding: 15px 18px;
          border: 1px solid #394655;
          border-radius: 14px;
          background: #111923;
          color: #fbbf24;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.45);
          z-index: 50;
        }

        .loading {
          text-align: center;
          color: #718096;
          padding: 15px;
        }

        footer {
          text-align: center;
          padding: 30px 10px 10px;
          color: #657384;
        }

        footer strong,
        footer span {
          display: block;
        }

        footer span {
          margin-top: 5px;
          font-size: 12px;
        }

        @media (max-width: 850px) {
          .shell {
            padding: 14px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .joinButton {
            width: 100%;
          }

          .statsGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .featureGrid,
          .twoColumn {
            grid-template-columns: 1fr;
          }

          .quickActions {
            grid-template-columns: repeat(2, 1fr);
          }

          .formGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .challengeCreator {
            grid-template-columns: 1fr 1fr;
          }

          .bigStats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 560px) {
          .shell {
            padding: 10px;
          }

          .brandArea {
            align-items: flex-start;
          }

          .crateLogo {
            flex: 0 0 70px;
            width: 70px;
            height: 63px;
          }

          h1 {
            font-size: 20px;
          }

          .eventHero {
            flex-direction: column;
          }

          .eventDates {
            text-align: left;
          }

          .statsGrid {
            gap: 7px;
          }

          .stat {
            padding: 12px 7px;
          }

          .statValue {
            font-size: 20px;
          }

          .featureCard {
            padding: 18px;
          }

          .formGrid,
          .memberGrid,
          .challengeCreator {
            grid-template-columns: 1fr;
          }

          .quickActions {
            grid-template-columns: 1fr;
          }

          .joinBox {
            flex-direction: column;
          }

          .requestCard {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .requestButtons {
            width: 100%;
          }

          .requestButtons button {
            flex: 1;
          }

          .rankingRow {
            grid-template-columns: 35px 40px 1fr;
          }

          .rankPoints {
            grid-column: 3;
          }

          .bigStats {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={"tab " + (active ? "active" : "")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div className="stat">
      <span className="statIcon">{icon}</span>
      <strong className="statValue">{value}</strong>
      <small className="statLabel">{label}</small>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}
