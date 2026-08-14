"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  name: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type Event = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  invite_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string | null;
  role?: string | null;
  profile?: Profile | Profile[] | null;
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
  marke?: string | null;
  getraenk?: string | null;
  menge?: number | null;
  alkohol?: number | null;
  preis?: number | null;
  bezahlt_von?: string | null;
  promille_wert?: number | null;
};

type Payment = {
  id: string;
  event_id: string;
  betrag?: number | null;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type PointHistory = {
  id: string;
  event_id: string;
  profile_id: string;
  points: number;
  reason: string;
  reference_type?: string | null;
  created_at?: string | null;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status: "pending" | "accepted" | "declined";
  message?: string | null;
  created_at?: string | null;
  responded_at?: string | null;
};

type CrateDonation = {
  id: string;
  event_id: string;
  profile_id: string;
  crates: number;
  points_awarded: number;
  created_at?: string | null;
};

type Challenge = {
  id: string;
  event_id: string;
  title?: string | null;
  description?: string | null;
  points?: number | null;
  category?: string | null;
  status?: string | null;
  created_by_profile_id?: string | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  is_active?: boolean;
  created_at?: string | null;
};

type EventSettings = {
  event_id: string;
  show_participants: boolean;
  show_drinks: boolean;
  show_drink_history: boolean;
  show_payments: boolean;
  show_costs: boolean;
  show_ranking: boolean;
  show_points: boolean;
  show_promille: boolean;
  show_statistics: boolean;
  show_challenges: boolean;
  show_challenge_points: boolean;
  show_beer_button: boolean;
  show_beer_requests: boolean;
  show_crate_button: boolean;
  show_profiles: boolean;
  show_photos: boolean;
  show_who_paid: boolean;
  show_who_owes: boolean;
};

type Tab =
  | "home"
  | "participants"
  | "drinks"
  | "payments"
  | "ranking"
  | "challenges"
  | "settings";

const defaultSettings: EventSettings = {
  event_id: "",
  show_participants: true,
  show_drinks: true,
  show_drink_history: true,
  show_payments: true,
  show_costs: true,
  show_ranking: true,
  show_points: true,
  show_promille: true,
  show_statistics: true,
  show_challenges: true,
  show_challenge_points: true,
  show_beer_button: true,
  show_beer_requests: true,
  show_crate_button: true,
  show_profiles: true,
  show_photos: true,
  show_who_paid: true,
  show_who_owes: true,
};

function getProfileFromMember(member: EventMember): Profile | null {
  if (!member.profile) return null;
  return Array.isArray(member.profile)
    ? member.profile[0] ?? null
    : member.profile;
}

function getDrinkName(drink: Drink) {
  return (
    drink.drink_name ||
    drink.getraenk ||
    drink.marke ||
    "Getränk"
  );
}

function getDrinkLiters(drink: Drink) {
  return Number(drink.liters ?? drink.menge ?? 0);
}

function getDrinkAlcohol(drink: Drink) {
  return Number(drink.alcohol_percent ?? drink.alkohol ?? 0);
}

function getDrinkPrice(drink: Drink) {
  return Number(drink.preis ?? 0);
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointHistory[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [crateDonations, setCrateDonations] = useState<CrateDonation[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [settings, setSettings] =
    useState<EventSettings>(defaultSettings);

  const [tab, setTab] = useState<Tab>("home");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showEventForm, setShowEventForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showDrinkForm, setShowDrinkForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");
  const [drinkCategory, setDrinkCategory] = useState("Bier");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPerson, setPaymentPerson] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePoints, setChallengePoints] = useState("10");

  const [selectedRankingPerson, setSelectedRankingPerson] =
    useState<string | null>(null);

  async function loadUser() {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    setUser(currentUser);

    if (!currentUser) {
      setProfile(null);
      setIsGlobalAdmin(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    setProfile(profileData ?? null);

    const { data: adminData } = await supabase.rpc("is_global_admin");

    if (typeof adminData === "boolean") {
      setIsGlobalAdmin(adminData);
    } else if (Array.isArray(adminData)) {
      setIsGlobalAdmin(Boolean(adminData[0]?.is_global_admin));
    } else {
      setIsGlobalAdmin(false);
    }
  }

  async function loadEvents() {
    if (!user) return;

    setError("");

    const { data, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (eventsError) {
      setError("Events konnten nicht geladen werden: " + eventsError.message);
      return;
    }

    const loadedEvents = (data ?? []) as Event[];

    setEvents(loadedEvents);

    if (!eventId && loadedEvents.length > 0) {
      setEventId(loadedEvents[0].id);
    }
  }

  async function loadEventData() {
    if (!eventId || !user) return;

    setError("");

    const [
      membersResult,
      drinksResult,
      paymentsResult,
      pointsResult,
      requestsResult,
      cratesResult,
      challengesResult,
      settingsResult,
    ] = await Promise.all([
      supabase
        .from("event_members")
        .select(`
          id,
          event_id,
          profile_id,
          joined_at,
          role,
          profile:profiles(
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq("event_id", eventId),

      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),

      supabase
        .from("payments")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),

      supabase
        .from("points_history")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),

      supabase
        .from("beer_requests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),

      supabase
        .from("crate_donations")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),

      supabase
        .from("challenges")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),

      supabase
        .from("event_settings")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle(),
    ]);

    if (membersResult.error) {
      setError(
        "Teilnehmer konnten nicht geladen werden: " +
          membersResult.error.message
      );
    }

    setMembers((membersResult.data ?? []) as EventMember[]);
    setDrinks((drinksResult.data ?? []) as Drink[]);
    setPayments((paymentsResult.data ?? []) as Payment[]);
    setPointsHistory((pointsResult.data ?? []) as PointHistory[]);
    setBeerRequests((requestsResult.data ?? []) as BeerRequest[]);
    setCrateDonations((cratesResult.data ?? []) as CrateDonation[]);
    setChallenges((challengesResult.data ?? []) as Challenge[]);

    if (settingsResult.data) {
      setSettings(settingsResult.data as EventSettings);
    } else {
      setSettings({
        ...defaultSettings,
        event_id: eventId,
      });
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadUser();
      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  useEffect(() => {
    if (eventId && user) {
      loadEventData();
    }
  }, [eventId, user]);

  const currentEvent = useMemo(
    () => events.find((event) => event.id === eventId) ?? null,
    [events, eventId]
  );

  const totalCost = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum + getDrinkPrice(drink) * Number(drink.quantity ?? 1),
        0
      ),
    [drinks]
  );

  const totalLiters = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum + getDrinkLiters(drink) * Number(drink.quantity ?? 1),
        0
      ),
    [drinks]
  );

  const totalPaid = useMemo(
    () =>
      payments.reduce(
        (sum, payment) => sum + Number(payment.betrag ?? 0),
        0
      ),
    [payments]
  );

  const totalOutstanding = Math.max(totalCost - totalPaid, 0);

  const pointsByPerson = useMemo(() => {
    const map: Record<string, number> = {};

    members.forEach((member) => {
      map[member.profile_id] = 0;
    });

    pointsHistory.forEach((entry) => {
      map[entry.profile_id] =
        (map[entry.profile_id] ?? 0) + Number(entry.points ?? 0);
    });

    return map;
  }, [members, pointsHistory]);

  const ranking = useMemo(() => {
    return [...members].sort(
      (a, b) =>
        (pointsByPerson[b.profile_id] ?? 0) -
        (pointsByPerson[a.profile_id] ?? 0)
    );
  }, [members, pointsByPerson]);

  function personName(profileId?: string | null) {
    if (!profileId) return "Unbekannt";

    const member = members.find(
      (item) => item.profile_id === profileId
    );

    const person = member ? getProfileFromMember(member) : null;

    return person?.name || "Unbekannt";
  }

  function showMessage(text: string) {
    setMessage(text);
    setError("");

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  async function createEvent() {
    if (!newEventTitle.trim()) {
      setError("Bitte einen Eventnamen eingeben.");
      return;
    }

    setSaving(true);
    setError("");

    const { data, error: createError } = await supabase.rpc(
      "create_event",
      {
        p_title: newEventTitle.trim(),
        p_description:
          newEventDescription.trim() || null,
        p_location:
          newEventLocation.trim() || null,
      }
    );

    setSaving(false);

    if (createError) {
      setError(
        "Event konnte nicht erstellt werden: " +
          createError.message
      );
      return;
    }

    const createdId = data as string;

    setNewEventTitle("");
    setNewEventDescription("");
    setNewEventLocation("");
    setShowEventForm(false);

    await loadEvents();
    setEventId(createdId);

    showMessage("🎉 Event erfolgreich erstellt!");
  }

  async function joinEvent() {
    if (!joinCode.trim()) {
      setError("Bitte Einladungscode eingeben.");
      return;
    }

    setSaving(true);

    const { data, error: joinError } = await supabase.rpc(
      "join_event",
      {
        p_invite_code: joinCode.trim(),
      }
    );

    setSaving(false);

    if (joinError) {
      setError(
        "Event konnte nicht beigetreten werden: " +
          joinError.message
      );
      return;
    }

    setJoinCode("");
    setShowJoinForm(false);

    await loadEvents();

    if (data) {
      setEventId(data as string);
    }

    showMessage("✅ Event erfolgreich beigetreten!");
  }

  async function deleteEvent() {
    if (!currentEvent) return;

    if (
      !window.confirm(
        `Event "${currentEvent.title}" wirklich löschen?`
      )
    ) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", currentEvent.id);

    if (deleteError) {
      setError(
        "Event konnte nicht gelöscht werden: " +
          deleteError.message
      );
      return;
    }

    setEventId("");
    await loadEvents();

    showMessage("🗑️ Event gelöscht.");
  }

  async function saveDrink() {
    if (!eventId) {
      setError("Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      setError("Bitte Getränk eingeben.");
      return;
    }

    setSaving(true);

    const payload = {
      event_id: eventId,
      profile_id: user?.id,
      category: drinkCategory,
      drink_name: drinkName.trim(),
      brand: drinkBrand.trim() || null,
      liters: Number(drinkLiters) || 0,
      alcohol_percent: Number(drinkAlcohol) || 0,
      quantity: 1,
      getraenk: drinkName.trim(),
      marke: drinkBrand.trim() || null,
      menge: Number(drinkLiters) || 0,
      alkohol: Number(drinkAlcohol) || 0,
      preis: Number(drinkPrice) || 0,
    };

    const { error: drinkError } = await supabase
      .from("drinks")
      .insert(payload);

    setSaving(false);

    if (drinkError) {
      setError(
        "Getränk konnte nicht gespeichert werden: " +
          drinkError.message
      );
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");
    setShowDrinkForm(false);

    await loadEventData();

    showMessage("🍺 Getränk gespeichert.");
  }

  async function assignDrink(drink: Drink, profileId: string) {
    if (!profileId) return;

    setSaving(true);

    const { error: updateError } = await supabase
      .from("drinks")
      .update({
        profile_id: profileId,
      })
      .eq("id", drink.id);

    if (updateError) {
      setSaving(false);
      setError(
        "Getränk konnte nicht zugeordnet werden: " +
          updateError.message
      );
      return;
    }

    const { error: historyError } = await supabase
      .from("drink_history")
      .insert({
        event_id: eventId,
        profile_id: profileId,
        drink_id: drink.id,
        drink_name: getDrinkName(drink),
        liters: getDrinkLiters(drink),
        alcohol_percent: getDrinkAlcohol(drink),
        price: getDrinkPrice(drink),
      });

    if (historyError) {
      console.warn(
        "Getränkeverlauf konnte nicht gespeichert werden:",
        historyError.message
      );
    }

    await supabase.from("points_history").insert({
      event_id: eventId,
      profile_id: profileId,
      points: 10,
      reason: `Getränk: ${getDrinkName(drink)}`,
      reference_type: "drink",
      reference_id: drink.id,
    });

    setSaving(false);

    await loadEventData();

    showMessage(
      `🍺 ${personName(profileId)} erhält +10 Punkte!`
    );
  }

  async function savePayment() {
    if (!eventId) return;

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      setError("Bitte einen gültigen Betrag eingeben.");
      return;
    }

    if (!paymentPerson) {
      setError("Bitte auswählen, wer bezahlt hat.");
      return;
    }

    setSaving(true);

    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        event_id: eventId,
        betrag: amount,
        bezahlt_von: paymentPerson,
        profile_id: paymentPerson,
        status: "paid",
      });

    setSaving(false);

    if (paymentError) {
      setError(
        "Zahlung konnte nicht gespeichert werden: " +
          paymentError.message
      );
      return;
    }

    setPaymentAmount("");
    setPaymentPerson("");
    setShowPaymentForm(false);

    await loadEventData();

    showMessage(
      `💶 Zahlung von ${personName(paymentPerson)} gespeichert.`
    );
  }

  async function sendBeerRequest() {
    if (!eventId || !user) return;

    const { error: requestError } = await supabase
      .from("beer_requests")
      .insert({
        event_id: eventId,
        requester_profile_id: user.id,
        status: "pending",
        message: `${profile?.name || "Jemand"} möchte ein Bier mit dir trinken.`,
      });

    if (requestError) {
      setError(
        "Bier-Anfrage konnte nicht gesendet werden: " +
          requestError.message
      );
      return;
    }

    await loadEventData();

    showMessage("🍺 Bier-Anfrage an das Event gesendet!");
  }

  async function respondBeerRequest(
    request: BeerRequest,
    status: "accepted" | "declined"
  ) {
    const { error: updateError } = await supabase
      .from("beer_requests")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (updateError) {
      setError(
        "Bier-Anfrage konnte nicht beantwortet werden: " +
          updateError.message
      );
      return;
    }

    if (status === "accepted") {
      await supabase.from("points_history").insert({
        event_id: eventId,
        profile_id: request.requester_profile_id,
        points: 5,
        reason: "Bier-Anfrage angenommen",
        reference_type: "beer_request",
        reference_id: request.id,
      });
    }

    await loadEventData();

    showMessage(
      status === "accepted"
        ? "🍺 Bier-Anfrage angenommen!"
        : "Bier-Anfrage abgelehnt."
    );
  }

  async function donateCrate() {
    if (!eventId || !user) return;

    if (
      !window.confirm(
        "Möchtest du eine Kiste Bier spendieren? Dafür gibt es 20 Punkte."
      )
    ) {
      return;
    }

    setSaving(true);

    const { error: crateError } = await supabase
      .from("crate_donations")
      .insert({
        event_id: eventId,
        profile_id: user.id,
        crates: 1,
        points_awarded: 20,
      });

    if (crateError) {
      setSaving(false);
      setError(
        "Kiste konnte nicht gespeichert werden: " +
          crateError.message
      );
      return;
    }

    await supabase.from("points_history").insert({
      event_id: eventId,
      profile_id: user.id,
      points: 20,
      reason: "Kiste Bier spendiert",
      reference_type: "crate",
    });

    setSaving(false);

    await loadEventData();

    showMessage("🍺 Kiste spendiert! +20 Punkte");
  }

  async function createChallenge() {
    if (!challengeTitle.trim()) {
      setError("Bitte einen Titel für die Challenge eingeben.");
      return;
    }

    setSaving(true);

    const { error: challengeError } = await supabase
      .from("challenges")
      .insert({
        event_id: eventId,
        title: challengeTitle.trim(),
        description:
          challengeDescription.trim() || null,
        points: Number(challengePoints) || 0,
        category: "fun",
        status: "open",
        created_by_profile_id: user?.id,
        is_active: true,
      });

    setSaving(false);

    if (challengeError) {
      setError(
        "Challenge konnte nicht erstellt werden: " +
          challengeError.message
      );
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");
    setShowChallengeForm(false);

    await loadEventData();

    showMessage("🏆 Challenge erstellt!");
  }

  async function updateSettings(
    key: keyof Omit<EventSettings, "event_id">
  ) {
    if (!eventId) return;

    const nextSettings = {
      ...settings,
      [key]: !settings[key],
    };

    setSettings(nextSettings);

    const { error: settingsError } = await supabase
      .from("event_settings")
      .upsert(
        {
          ...nextSettings,
          event_id: eventId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "event_id",
        }
      );

    if (settingsError) {
      setError(
        "Einstellungen konnten nicht gespeichert werden: " +
          settingsError.message
      );
      return;
    }

    showMessage("⚙️ Einstellung gespeichert.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setEvents([]);
    setEventId("");
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          <div className="logo">🍻</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>App wird geladen...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="loginCard">
          <div className="bigLogo">🍻</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>
            Du bist nicht angemeldet.
            <br />
            Bitte zuerst über Supabase Auth anmelden.
          </p>
        </div>
      </main>
    );
  }

  const myRequests = beerRequests.filter(
    (request) =>
      request.requester_profile_id === user.id ||
      request.status === "pending"
  );

  return (
    <main className="page">
      <div className="container">

        <header className="header">
          <div className="brand">
            <div className="logo">🍻</div>

            <div>
              <h1>Güstener Zapfhahn Zentrale</h1>
              <p>
                Events · Getränke · Punkte · Challenges
              </p>
            </div>
          </div>

          <div className="userBox">
            <span>👤</span>
            <div>
              <strong>
                {profile?.name || user.email || "Benutzer"}
              </strong>

              {isGlobalAdmin && (
                <small>👑 Global Admin</small>
              )}
            </div>

            <button
              className="logout"
              onClick={signOut}
            >
              Abmelden
            </button>
          </div>
        </header>

        {message && (
          <div className="message success">
            {message}
          </div>
        )}

        {error && (
          <div className="message error">
            ❌ {error}
          </div>
        )}

        <section className="card eventSelector">
          <div className="sectionHeader">
            <div>
              <h2>📅 Aktuelles Event</h2>

              {currentEvent && (
                <p>
                  {currentEvent.location ||
                    "Event ohne Standort"}
                </p>
              )}
            </div>

            <div className="actions">
              <button
                className="secondary"
                onClick={() =>
                  setShowEventForm(!showEventForm)
                }
              >
                ➕ Neues Event
              </button>

              <button
                className="secondary"
                onClick={() =>
                  setShowJoinForm(!showJoinForm)
                }
              >
                🔑 Beitreten
              </button>

              {currentEvent &&
                (isGlobalAdmin ||
                  members.some(
                    (member) =>
                      member.profile_id === user.id &&
                      member.role === "admin"
                  )) && (
                  <button
                    className="danger"
                    onClick={deleteEvent}
                  >
                    🗑️ Event löschen
                  </button>
                )}
            </div>
          </div>

          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setTab("home");
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

          {currentEvent?.invite_code && (
            <div className="inviteBox">
              <div>
                <small>Einladungscode</small>
                <strong>
                  {currentEvent.invite_code}
                </strong>
              </div>

              <button
                className="secondary"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    currentEvent.invite_code || ""
                  )
                }
              >
                📋 Kopieren
              </button>
            </div>
          )}

          {showEventForm && (
            <div className="formBox">
              <h3>🎉 Neues Event</h3>

              <input
                placeholder="Eventname"
                value={newEventTitle}
                onChange={(e) =>
                  setNewEventTitle(e.target.value)
                }
              />

              <input
                placeholder="Beschreibung"
                value={newEventDescription}
                onChange={(e) =>
                  setNewEventDescription(e.target.value)
                }
              />

              <input
                placeholder="Ort"
                value={newEventLocation}
                onChange={(e) =>
                  setNewEventLocation(e.target.value)
                }
              />

              <button
                className="primary full"
                disabled={saving}
                onClick={createEvent}
              >
                {saving
                  ? "Wird erstellt..."
                  : "🍻 Event erstellen"}
              </button>
            </div>
          )}

          {showJoinForm && (
            <div className="formBox">
              <h3>🔑 Event beitreten</h3>

              <input
                placeholder="z.B. AB12-CD34"
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.toUpperCase())
                }
              />

              <button
                className="primary full"
                onClick={joinEvent}
              >
                🚀 Event beitreten
              </button>
            </div>
          )}
        </section>

        {currentEvent && (
          <>
            <nav className="tabs">
              <button
                className={tab === "home" ? "active" : ""}
                onClick={() => setTab("home")}
              >
                🏠 Übersicht
              </button>

              {settings.show_participants && (
                <button
                  className={
                    tab === "participants" ? "active" : ""
                  }
                  onClick={() => setTab("participants")}
                >
                  👥 Teilnehmer
                </button>
              )}

              {settings.show_drinks && (
                <button
                  className={tab === "drinks" ? "active" : ""}
                  onClick={() => setTab("drinks")}
                >
                  🍺 Getränke
                </button>
              )}

              {settings.show_payments && (
                <button
                  className={
                    tab === "payments" ? "active" : ""
                  }
                  onClick={() => setTab("payments")}
                >
                  💶 Zahlungen
                </button>
              )}

              {settings.show_ranking && (
                <button
                  className={
                    tab === "ranking" ? "active" : ""
                  }
                  onClick={() => setTab("ranking")}
                >
                  🏆 Rangliste
                </button>
              )}

              {settings.show_challenges && (
                <button
                  className={
                    tab === "challenges" ? "active" : ""
                  }
                  onClick={() => setTab("challenges")}
                >
                  🎯 Challenges
                </button>
              )}

              {isGlobalAdmin && (
                <button
                  className={
                    tab === "settings" ? "active" : ""
                  }
                  onClick={() => setTab("settings")}
                >
                  ⚙️ Einstellungen
                </button>
              )}
            </nav>

            {tab === "home" && (
              <>
                <section className="stats">
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
                    <small>Getränkekosten</small>
                  </div>

                  <div className="stat">
                    <span>👥</span>
                    <strong>{members.length}</strong>
                    <small>Teilnehmer</small>
                  </div>
                </section>

                <section className="beerHero">
                  {settings.show_beer_button && (
                    <button
                      className="beerButton"
                      onClick={sendBeerRequest}
                    >
                      <span className="beerIcon">🍺</span>
                      <strong>BIER</strong>
                      <small>
                        Wer trinkt ein Bier mit mir?
                      </small>
                    </button>
                  )}

                  {settings.show_crate_button && (
                    <button
                      className="crateButton"
                      onClick={donateCrate}
                    >
                      🍺
                      <span>
                        <strong>Kiste Bier spendieren</strong>
                        <small>+20 Punkte</small>
                      </span>
                    </button>
                  )}
                </section>

                {settings.show_beer_requests &&
                  myRequests.length > 0 && (
                    <section className="card">
                      <div className="sectionHeader">
                        <h2>🔔 Bier-Anfragen</h2>
                      </div>

                      {myRequests.map((request) => {
                        const requester = personName(
                          request.requester_profile_id
                        );

                        return (
                          <div
                            className="request"
                            key={request.id}
                          >
                            <div>
                              <strong>
                                🍻 {requester}
                              </strong>

                              <p>
                                {request.message ||
                                  `${requester} möchte ein Bier mit dir trinken.`}
                              </p>

                              <small>
                                {request.status ===
                                  "pending"
                                  ? "⏳ Wartet auf Antwort"
                                  : request.status ===
                                    "accepted"
                                  ? "✅ Zugesagt"
                                  : "❌ Abgelehnt"}
                              </small>
                            </div>

                            {request.status ===
                              "pending" &&
                              request.requester_profile_id !==
                                user.id && (
                                <div className="requestActions">
                                  <button
                                    className="accept"
                                    onClick={() =>
                                      respondBeerRequest(
                                        request,
                                        "accepted"
                                      )
                                    }
                                  >
                                    ✅ Zusagen
                                  </button>

                                  <button
                                    className="decline"
                                    onClick={() =>
                                      respondBeerRequest(
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
                        );
                      })}
                    </section>
                  )}

                {settings.show_ranking && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>🏆 Rangliste</h2>
                        <p>
                          Tippe auf eine Person, um die
                          Punkte-Historie zu sehen.
                        </p>
                      </div>
                    </div>

                    {ranking.map((member, index) => {
                      const selected =
                        selectedRankingPerson ===
                        member.profile_id;

                      return (
                        <div key={member.id}>
                          <button
                            className="rankRow"
                            onClick={() =>
                              setSelectedRankingPerson(
                                selected
                                  ? null
                                  : member.profile_id
                              )
                            }
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
                              {personName(
                                member.profile_id
                              )}
                            </span>

                            <b>
                              {pointsByPerson[
                                member.profile_id
                              ] ?? 0}{" "}
                              Punkte
                            </b>
                          </button>

                          {selected && (
                            <div className="pointsHistory">
                              <h4>
                                📜 Punkte-Historie
                              </h4>

                              {pointsHistory.filter(
                                (entry) =>
                                  entry.profile_id ===
                                  member.profile_id
                              ).length === 0 ? (
                                <p>
                                  Noch keine Punkte.
                                </p>
                              ) : (
                                pointsHistory
                                  .filter(
                                    (entry) =>
                                      entry.profile_id ===
                                      member.profile_id
                                  )
                                  .map((entry) => (
                                    <div
                                      className="historyRow"
                                      key={entry.id}
                                    >
                                      <span>
                                        {entry.reason}
                                      </span>

                                      <b>
                                        +
                                        {entry.points}
                                      </b>
                                    </div>
                                  ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </section>
                )}

                {settings.show_payments && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>💶 Zahlungen</h2>
                        <p>
                          Bezahlt:{" "}
                          <strong>
                            {totalPaid.toFixed(2)} €
                          </strong>
                        </p>
                      </div>

                      <button
                        className="primary"
                        onClick={() =>
                          setShowPaymentForm(
                            !showPaymentForm
                          )
                        }
                      >
                        💶 Zahlung
                      </button>
                    </div>

                    {showPaymentForm && (
                      <div className="formBox">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Betrag €"
                          value={paymentAmount}
                          onChange={(e) =>
                            setPaymentAmount(
                              e.target.value
                            )
                          }
                        />

                        <select
                          value={paymentPerson}
                          onChange={(e) =>
                            setPaymentPerson(
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            Wer hat bezahlt?
                          </option>

                          {members.map((member) => (
                            <option
                              key={member.id}
                              value={member.profile_id}
                            >
                              {personName(
                                member.profile_id
                              )}
                            </option>
                          ))}
                        </select>

                        <button
                          className="primary full"
                          onClick={savePayment}
                        >
                          💶 Zahlung speichern
                        </button>
                      </div>
                    )}

                    {payments.map((payment) => (
                      <div
                        className="paymentRow"
                        key={payment.id}
                      >
                        <div>
                          <strong>
                            💶{" "}
                            {settings.show_who_paid
                              ? personName(
                                  payment.bezahlt_von ||
                                    payment.profile_id
                                )
                              : "Zahlung"}
                          </strong>

                          <small>
                            {payment.status ||
                              "Bezahlt"}
                          </small>
                        </div>

                        <b>
                          {Number(
                            payment.betrag ?? 0
                          ).toFixed(2)}{" "}
                          €
                        </b>
                      </div>
                    ))}

                    {settings.show_who_owes && (
                      <div className="oweBox">
                        <span>
                          💰 Noch offen
                        </span>

                        <strong>
                          {totalOutstanding.toFixed(2)} €
                        </strong>
                      </div>
                    )}

                    {settings.show_costs &&
                      members.length > 0 && (
                        <div className="costPerPerson">
                          <span>
                            👥 Rechnerisch pro Person
                          </span>

                          <strong>
                            {(
                              totalCost /
                              members.length
                            ).toFixed(2)}{" "}
                            €
                          </strong>
                        </div>
                      )}
                  </section>
                )}
              </>
            )}

            {tab === "participants" &&
              settings.show_participants && (
                <section className="card">
                  <div className="sectionHeader">
                    <div>
                      <h2>👥 Teilnehmer</h2>
                      <p>
                        {members.length} Personen im
                        Event
                      </p>
                    </div>
                  </div>

                  {members.map((member) => {
                    const memberDrinks =
                      drinks.filter(
                        (drink) =>
                          drink.profile_id ===
                          member.profile_id
                      );

                    const liters =
                      memberDrinks.reduce(
                        (sum, drink) =>
                          sum +
                          getDrinkLiters(drink),
                        0
                      );

                    return (
                      <div
                        className="participantRow"
                        key={member.id}
                      >
                        <div className="avatar">
                          👤
                        </div>

                        <div className="participantInfo">
                          <strong>
                            {personName(
                              member.profile_id
                            )}
                          </strong>

                          <small>
                            🍺{" "}
                            {memberDrinks.length} · 💧{" "}
                            {liters.toFixed(1)} L
                          </small>
                        </div>

                        <div className="participantPoints">
                          🏆{" "}
                          {pointsByPerson[
                            member.profile_id
                          ] ?? 0}
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}

            {tab === "drinks" &&
              settings.show_drinks && (
                <section className="card">
                  <div className="sectionHeader">
                    <div>
                      <h2>🍺 Getränke</h2>
                      <p>
                        {drinks.length} Getränke im
                        Event
                      </p>
                    </div>

                    <button
                      className="primary"
                      onClick={() =>
                        setShowDrinkForm(
                          !showDrinkForm
                        )
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
                          setDrinkName(
                            e.target.value
                          )
                        }
                      />

                      <input
                        placeholder="Marke"
                        value={drinkBrand}
                        onChange={(e) =>
                          setDrinkBrand(
                            e.target.value
                          )
                        }
                      />

                      <select
                        value={drinkCategory}
                        onChange={(e) =>
                          setDrinkCategory(
                            e.target.value
                          )
                        }
                      >
                        <option>Bier</option>
                        <option>Wein</option>
                        <option>Spirituose</option>
                        <option>Softdrink</option>
                        <option>Wasser</option>
                        <option>Sonstiges</option>
                      </select>

                      <div className="grid3">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Liter"
                          value={drinkLiters}
                          onChange={(e) =>
                            setDrinkLiters(
                              e.target.value
                            )
                          }
                        />

                        <input
                          type="number"
                          step="0.1"
                          placeholder="Alkohol %"
                          value={drinkAlcohol}
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
                          value={drinkPrice}
                          onChange={(e) =>
                            setDrinkPrice(
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <button
                        className="primary full"
                        disabled={saving}
                        onClick={saveDrink}
                      >
                        🍻 Getränk speichern
                      </button>
                    </div>
                  )}

                  {drinks.map((drink) => (
                    <div
                      className="drinkRow"
                      key={drink.id}
                    >
                      <div>
                        <strong>
                          🍺 {getDrinkName(drink)}
                        </strong>

                        <small>
                          {getDrinkLiters(
                            drink
                          ).toFixed(1)}{" "}
                          Liter ·{" "}
                          {getDrinkAlcohol(
                            drink
                          ).toFixed(1)} %
                          {drink.brand
                            ? ` · ${drink.brand}`
                            : ""}
                        </small>

                        <small>
                          👤{" "}
                          {drink.profile_id
                            ? personName(
                                drink.profile_id
                              )
                            : "Noch niemand zugeordnet"}
                        </small>
                      </div>

                      <div className="drinkRight">
                        <strong>
                          {getDrinkPrice(
                            drink
                          ).toFixed(2)}{" "}
                          €
                        </strong>

                        <select
                          value={
                            drink.profile_id || ""
                          }
                          onChange={(e) => {
                            if (
                              e.target.value
                            ) {
                              assignDrink(
                                drink,
                                e.target.value
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
                                  member.id
                                }
                                value={
                                  member.profile_id
                                }
                              >
                                {personName(
                                  member.profile_id
                                )}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  ))}
                </section>
              )}

            {tab === "payments" &&
              settings.show_payments && (
                <section className="card">
                  <div className="sectionHeader">
                    <div>
                      <h2>💶 Zahlungen</h2>
                      <p>
                        Gesamt bezahlt:{" "}
                        {totalPaid.toFixed(2)} €
                      </p>
                    </div>

                    <button
                      className="primary"
                      onClick={() =>
                        setShowPaymentForm(
                          !showPaymentForm
                        )
                      }
                    >
                      ➕ Zahlung
                    </button>
                  </div>

                  {showPaymentForm && (
                    <div className="formBox">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Betrag €"
                        value={paymentAmount}
                        onChange={(e) =>
                          setPaymentAmount(
                            e.target.value
                          )
                        }
                      />

                      <select
                        value={paymentPerson}
                        onChange={(e) =>
                          setPaymentPerson(
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          Wer hat bezahlt?
                        </option>

                        {members.map((member) => (
                          <option
                            key={member.id}
                            value={
                              member.profile_id
                            }
                          >
                            {personName(
                              member.profile_id
                            )}
                          </option>
                        ))}
                      </select>

                      <button
                        className="primary full"
                        onClick={savePayment}
                      >
                        💶 Zahlung speichern
                      </button>
                    </div>
                  )}

                  {payments.map((payment) => (
                    <div
                      className="paymentRow"
                      key={payment.id}
                    >
                      <div>
                        <strong>
                          💶{" "}
                          {settings.show_who_paid
                            ? personName(
                                payment.bezahlt_von ||
                                  payment.profile_id
                              )
                            : "Zahlung"}
                        </strong>

                        <small>
                          {new Date(
                            payment.created_at ||
                              Date.now()
                          ).toLocaleString(
                            "de-DE"
                          )}
                        </small>
                      </div>

                      <b>
                        {Number(
                          payment.betrag ?? 0
                        ).toFixed(2)}{" "}
                        €
                      </b>
                    </div>
                  ))}

                  <div className="summaryGrid">
                    <div>
                      <small>
                        Gesamtkosten
                      </small>
                      <strong>
                        {totalCost.toFixed(2)} €
                      </strong>
                    </div>

                    <div>
                      <small>
                        Bezahlt
                      </small>
                      <strong>
                        {totalPaid.toFixed(2)} €
                      </strong>
                    </div>

                    <div>
                      <small>
                        Offen
                      </small>
                      <strong>
                        {totalOutstanding.toFixed(
                          2
                        )} €
                      </strong>
                    </div>
                  </div>
                </section>
              )}

            {tab === "ranking" &&
              settings.show_ranking && (
                <section className="card">
                  <h2>🏆 Rangliste</h2>

                  <p>
                    Tippe auf eine Person für die
                    Punkte-Historie.
                  </p>

                  {ranking.map(
                    (member, index) => {
                      const selected =
                        selectedRankingPerson ===
                        member.profile_id;

                      return (
                        <div
                          key={member.id}
                          className="rankingBlock"
                        >
                          <button
                            className="rankRow"
                            onClick={() =>
                              setSelectedRankingPerson(
                                selected
                                  ? null
                                  : member.profile_id
                              )
                            }
                          >
                            <strong>
                              {index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : `${index + 1}.`}
                            </strong>

                            <span>
                              {personName(
                                member.profile_id
                              )}
                            </span>

                            <b>
                              {pointsByPerson[
                                member.profile_id
                              ] ?? 0}{" "}
                              Punkte
                            </b>
                          </button>

                          {selected && (
                            <div className="history">
                              {pointsHistory
                                .filter(
                                  (entry) =>
                                    entry.profile_id ===
                                    member.profile_id
                                )
                                .map(
                                  (entry) => (
                                    <div
                                      className="historyRow"
                                      key={
                                        entry.id
                                      }
                                    >
                                      <span>
                                        🎯{" "}
                                        {
                                          entry.reason
                                        }
                                      </span>

                                      <strong>
                                        +
                                        {
                                          entry.points
                                        }
                                      </strong>
                                    </div>
                                  )
                                )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </section>
              )}

            {tab === "challenges" &&
              settings.show_challenges && (
                <section className="card">
                  <div className="sectionHeader">
                    <div>
                      <h2>🎯 Challenges</h2>
                      <p>
                        Gemeinsame Aufgaben für das
                        Event.
                      </p>
                    </div>

                    <button
                      className="primary"
                      onClick={() =>
                        setShowChallengeForm(
                          !showChallengeForm
                        )
                      }
                    >
                      ➕ Challenge
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
                        placeholder="Beschreibung"
                        value={
                          challengeDescription
                        }
                        onChange={(e) =>
                          setChallengeDescription(
                            e.target.value
                          )
                        }
                      />

                      <input
                        type="number"
                        placeholder="Punkte"
                        value={challengePoints}
                        onChange={(e) =>
                          setChallengePoints(
                            e.target.value
                          )
                        }
                      />

                      <button
                        className="primary full"
                        onClick={
                          createChallenge
                        }
                      >
                        🎯 Challenge erstellen
                      </button>
                    </div>
                  )}

                  {challenges.length === 0 ? (
                    <div className="empty">
                      🎯 Noch keine Challenges.
                    </div>
                  ) : (
                    challenges.map(
                      (challenge) => (
                        <div
                          className="challenge"
                          key={challenge.id}
                        >
                          <div>
                            <strong>
                              🎯{" "}
                              {challenge.title ||
                                "Challenge"}
                            </strong>

                            <p>
                              {
                                challenge.description
                              }
                            </p>
                          </div>

                          {settings.show_challenge_points && (
                            <b>
                              +
                              {
                                challenge.points
                              }{" "}
                              Punkte
                            </b>
                          )}
                        </div>
                      )
                    )
                  )}
                </section>
              )}

            {tab === "settings" &&
              isGlobalAdmin && (
                <section className="card">
                  <h2>⚙️ Event-Einstellungen</h2>

                  <p>
                    Hier bestimmst du, welche
                    Bereiche die Teilnehmer dieses
                    Events sehen.
                  </p>

                  <div className="settingsGrid">
                    {(
                      [
                        [
                          "show_participants",
                          "👥 Teilnehmer",
                        ],
                        [
                          "show_drinks",
                          "🍺 Getränke",
                        ],
                        [
                          "show_drink_history",
                          "📜 Getränkeverlauf",
                        ],
                        [
                          "show_payments",
                          "💶 Zahlungen",
                        ],
                        [
                          "show_costs",
                          "💰 Kosten",
                        ],
                        [
                          "show_ranking",
                          "🏆 Rangliste",
                        ],
                        [
                          "show_points",
                          "⭐ Punkte",
                        ],
                        [
                          "show_promille",
                          "🍺 Promille",
                        ],
                        [
                          "show_statistics",
                          "📊 Statistiken",
                        ],
                        [
                          "show_challenges",
                          "🎯 Challenges",
                        ],
                        [
                          "show_challenge_points",
                          "🏆 Challenge-Punkte",
                        ],
                        [
                          "show_beer_button",
                          "🍺 Bier-Button",
                        ],
                        [
                          "show_beer_requests",
                          "🔔 Bier-Anfragen",
                        ],
                        [
                          "show_crate_button",
                          "🍺 Kiste-Button",
                        ],
                        [
                          "show_profiles",
                          "👤 Profile",
                        ],
                        [
                          "show_photos",
                          "📷 Fotos",
                        ],
                        [
                          "show_who_paid",
                          "💶 Wer bezahlt hat",
                        ],
                        [
                          "show_who_owes",
                          "💰 Wer noch zahlen muss",
                        ],
                      ] as [
                        keyof Omit<
                          EventSettings,
                          "event_id"
                        >,
                        string
                      ][]
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        className={
                          settings[key]
                            ? "setting on"
                            : "setting off"
                        }
                        onClick={() =>
                          updateSettings(key)
                        }
                      >
                        <span>
                          {settings[key]
                            ? "✅"
                            : "⭕"}
                        </span>

                        <strong>
                          {label}
                        </strong>
                      </button>
                    ))}
                  </div>
                </section>
              )}

            {settings.show_drink_history &&
              tab === "home" &&
              drinks.some(
                (drink) => drink.profile_id
              ) && (
                <section className="card">
                  <h2>📜 Getränkeverlauf</h2>

                  {drinks
                    .filter(
                      (drink) =>
                        drink.profile_id
                    )
                    .slice(0, 20)
                    .map((drink) => (
                      <div
                        className="historyRow"
                        key={drink.id}
                      >
                        <span>
                          🍺{" "}
                          {personName(
                            drink.profile_id
                          )}{" "}
                          hat{" "}
                          <strong>
                            {getDrinkName(
                              drink
                            )}
                          </strong>{" "}
                          getrunken.
                        </span>

                        <small>
                          {new Date(
                            drink.created_at ||
                              Date.now()
                          ).toLocaleTimeString(
                            "de-DE",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </small>
                      </div>
                    ))}
                </section>
              )}
          </>
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
          padding: 20px;
          color: #f8fafc;
          background:
            radial-gradient(
              circle at top,
              #263b50 0%,
              #101923 35%,
              #070b10 75%
            );
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
        }

        .loading,
        .loginCard {
          width: min(100%, 600px);
          margin: 100px auto;
          padding: 40px 25px;
          text-align: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          backdrop-filter: blur(20px);
        }

        .bigLogo {
          font-size: 70px;
          margin-bottom: 15px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          font-size: 35px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        h1 {
          margin: 0;
          font-size: clamp(22px, 4vw, 32px);
        }

        h2 {
          margin: 0 0 5px;
          font-size: 21px;
        }

        h3 {
          margin-top: 0;
        }

        h4 {
          margin-top: 0;
        }

        p {
          margin: 5px 0;
          color: #9ca8b5;
        }

        small {
          color: #9ca8b5;
        }

        .userBox {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
        }

        .userBox strong,
        .userBox small {
          display: block;
        }

        .userBox small {
          color: #fbbf24;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          border: 0;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            opacity 0.15s ease,
            background 0.15s ease;
        }

        button:hover {
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid #334252;
          border-radius: 13px;
          padding: 13px;
          margin-bottom: 10px;
          background: #111923;
          color: white;
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

        .primary {
          background: #f59e0b;
          color: #111;
          font-weight: 800;
          padding: 12px 16px;
          border-radius: 12px;
        }

        .secondary {
          background: #273442;
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 700;
        }

        .danger {
          background: #7f1d1d;
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 700;
        }

        .logout {
          background: transparent;
          color: #9ca8b5;
          font-size: 12px;
          padding: 5px;
        }

        .full {
          width: 100%;
        }

        .message {
          padding: 13px 16px;
          border-radius: 14px;
          margin-bottom: 14px;
          border: 1px solid;
        }

        .success {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.35);
          color: #86efac;
        }

        .error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        .card {
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 15px;
          backdrop-filter: blur(18px);
        }

        .sectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 14px;
        }

        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .eventSelector select {
          margin-bottom: 0;
        }

        .inviteBox {
          margin-top: 12px;
          padding: 15px;
          border-radius: 16px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .inviteBox strong {
          display: block;
          font-size: 22px;
          letter-spacing: 3px;
          color: #fbbf24;
        }

        .formBox {
          margin-top: 15px;
          padding: 17px;
          border-radius: 17px;
          background: rgba(0, 0, 0, 0.18);
        }

        .tabs {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding: 4px;
          margin-bottom: 15px;
        }

        .tabs button {
          flex: 0 0 auto;
          padding: 11px 14px;
          border-radius: 12px;
          background: #151e28;
          color: #aeb9c5;
        }

        .tabs button.active {
          background: #f59e0b;
          color: #111;
          font-weight: 800;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          text-align: center;
          padding: 17px 10px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stat span {
          display: block;
          font-size: 25px;
        }

        .stat strong {
          display: block;
          font-size: 23px;
          margin: 4px 0;
        }

        .stat small {
          display: block;
          font-size: 11px;
        }

        .beerHero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
          margin-bottom: 15px;
        }

        .beerButton {
          min-height: 170px;
          border-radius: 28px;
          background:
            radial-gradient(
              circle at 50% 0%,
              #ef4444,
              #991b1b
            );
          color: white;
          box-shadow:
            0 15px 35px rgba(239, 68, 68, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .beerButton:hover {
          animation: beerPulse 0.6s ease;
        }

        .beerIcon {
          font-size: 55px;
          animation: beerFloat 2s infinite ease-in-out;
        }

        .beerButton strong {
          font-size: 30px;
          letter-spacing: 4px;
        }

        .beerButton small {
          color: #fee2e2;
        }

        .crateButton {
          min-height: 170px;
          border-radius: 28px;
          background:
            linear-gradient(
              135deg,
              #92400e,
              #451a03
            );
          color: white;
          padding: 25px;
          display: flex;
          gap: 15px;
          align-items: center;
          justify-content: center;
          font-size: 55px;
          border: 1px solid rgba(251, 191, 36, 0.25);
        }

        .crateButton span {
          text-align: left;
        }

        .crateButton strong {
          display: block;
          font-size: 21px;
        }

        .crateButton small {
          display: block;
          margin-top: 5px;
          color: #fbbf24;
        }

        .request {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border-radius: 15px;
          margin-top: 9px;
          background: rgba(255, 255, 255, 0.05);
        }

        .requestActions {
          display: flex;
          gap: 7px;
        }

        .accept,
        .decline {
          padding: 10px 12px;
          border-radius: 10px;
          font-weight: 700;
        }

        .accept {
          background: #166534;
          color: white;
        }

        .decline {
          background: #7f1d1d;
          color: white;
        }

        .rankRow {
          width: 100%;
          display: grid;
          grid-template-columns: 50px 1fr auto;
          align-items: center;
          gap: 10px;
          text-align: left;
          color: white;
          background: rgba(255, 255, 255, 0.05);
          padding: 14px;
          margin-top: 8px;
          border-radius: 15px;
        }

        .rankRow:hover {
          background: rgba(255, 255, 255, 0.09);
        }

        .pointsHistory,
        .history {
          margin: 0 8px 8px;
          padding: 13px;
          border-radius: 13px;
          background: rgba(0, 0, 0, 0.2);
        }

        .historyRow {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .historyRow:last-child {
          border-bottom: 0;
        }

        .historyRow strong {
          color: #fbbf24;
        }

        .paymentRow,
        .drinkRow,
        .participantRow,
        .challenge {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.045);
          margin-top: 8px;
        }

        .paymentRow strong,
        .paymentRow small,
        .drinkRow strong,
        .drinkRow small,
        .participantInfo strong,
        .participantInfo small {
          display: block;
        }

        .paymentRow small,
        .drinkRow small,
        .participantInfo small {
          margin-top: 4px;
        }

        .paymentRow > b {
          color: #fbbf24;
          font-size: 18px;
        }

        .drinkRight {
          min-width: 150px;
          text-align: right;
        }

        .drinkRight select {
          margin: 7px 0 0;
          padding: 8px;
        }

        .oweBox,
        .costPerPerson {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          border-radius: 14px;
          margin-top: 10px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.18);
        }

        .oweBox strong,
        .costPerPerson strong {
          color: #fbbf24;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 12px;
        }

        .summaryGrid > div {
          padding: 15px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
          text-align: center;
        }

        .summaryGrid small,
        .summaryGrid strong {
          display: block;
        }

        .summaryGrid strong {
          font-size: 20px;
          margin-top: 5px;
        }

        .grid3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #273442;
          font-size: 22px;
        }

        .participantInfo {
          flex: 1;
        }

        .participantPoints {
          color: #fbbf24;
          font-weight: 800;
        }

        .challenge p {
          font-size: 13px;
        }

        .challenge > b {
          color: #fbbf24;
          white-space: nowrap;
        }

        .settingsGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 9px;
        }

        .setting {
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          padding: 14px;
          border-radius: 14px;
          color: white;
        }

        .setting.on {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.25);
        }

        .setting.off {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: #8995a3;
        }

        .empty {
          padding: 30px;
          text-align: center;
          color: #8995a3;
        }

        footer {
          text-align: center;
          padding: 35px 10px;
          color: #64748b;
        }

        footer strong,
        footer small {
          display: block;
        }

        footer small {
          margin-top: 5px;
        }

        @keyframes beerPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes beerFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-2deg);
          }
          50% {
            transform: translateY(-6px) rotate(2deg);
          }
        }

        @media (max-width: 800px) {
          .header {
            align-items: flex-start;
            flex-direction: column;
          }

          .userBox {
            width: 100%;
          }

          .beerHero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .page {
            padding: 10px;
          }

          .card {
            padding: 15px;
            border-radius: 18px;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .sectionHeader {
            align-items: flex-start;
            flex-direction: column;
          }

          .actions {
            width: 100%;
            justify-content: stretch;
          }

          .actions button {
            flex: 1;
          }

          .grid3,
          .summaryGrid,
          .settingsGrid {
            grid-template-columns: 1fr;
          }

          .paymentRow,
          .drinkRow,
          .participantRow,
          .challenge,
          .request {
            align-items: flex-start;
          }

          .drinkRight {
            min-width: 110px;
          }

          .rankRow {
            grid-template-columns: 40px 1fr auto;
          }

          .tabs {
            margin-left: -5px;
            margin-right: -5px;
          }

          .userBox {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 430px) {
          .brand {
            align-items: flex-start;
          }

          .logo {
            width: 50px;
            height: 50px;
            font-size: 27px;
          }

          h1 {
            font-size: 20px;
          }

          .stat strong {
            font-size: 19px;
          }

          .beerButton {
            min-height: 150px;
          }

          .crateButton {
            min-height: 130px;
          }
        }
      `}</style>
    </main>
  );
}
