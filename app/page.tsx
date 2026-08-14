"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type EventRow = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  invite_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_by?: string | null;
  is_active?: boolean;
};

type Profile = {
  id: string;
  name: string;
  email?: string | null;
};

type Drink = {
  id: string;
  event_id: string;
  getraenk?: string | null;
  drink_name?: string | null;
  menge?: number | null;
  liters?: number | null;
  alkohol?: number | null;
  alcohol_percent?: number | null;
  preis?: number | null;
  quantity?: number | null;
  created_at?: string;
};

type HistoryEntry = {
  id: string;
  profile_id: string;
  drink_name: string;
  liters: number;
  alcohol_percent: number;
  price: number;
  consumed_at: string;
};

type Payment = {
  id: string;
  event_id: string;
  betrag: number;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status: string;
  created_at: string;
};

type PointEntry = {
  id: string;
  profile_id: string;
  points: number;
  reason: string;
  reference_type?: string | null;
  created_at: string;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  target_profile_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

type CrateDonation = {
  id: string;
  event_id: string;
  profile_id: string;
  crates: number;
  points_awarded: number;
  created_at: string;
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
  winner_profile_id?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
};

type EventSettings = {
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

const DEFAULT_SETTINGS: EventSettings = {
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

export default function Home() {
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointEntry[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [crateDonations, setCrateDonations] = useState<CrateDonation[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [settings, setSettings] =
    useState<EventSettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error" | "info">("info");

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [selectedPerson, setSelectedPerson] =
    useState<Profile | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const [personName, setPersonName] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPerson, setPaymentPerson] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] =
    useState("");
  const [challengePoints, setChallengePoints] = useState("10");

  const [crateAnimation, setCrateAnimation] = useState(false);
  const [beerAnimation, setBeerAnimation] = useState(false);
  const [prostAnimation, setProstAnimation] = useState(false);

  function notify(
    text: string,
    type: "success" | "error" | "info" = "info"
  ) {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  async function loadUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setLoading(false);
      return;
    }

    setUserId(data.user.id);
    setUserEmail(data.user.email ?? "");
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      notify("Events konnten nicht geladen werden: " + error.message, "error");
      return;
    }

    setEvents(data ?? []);

    if (!eventId && data && data.length > 0) {
      setEventId(data[0].id);
    }
  }

  async function ensureProfile() {
    if (!userId) return;

    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (existing) return;

    await supabase.from("profiles").insert({
      id: userId,
      name: userEmail.split("@")[0] || "Benutzer",
      email: userEmail,
    });
  }

  async function loadProfiles() {
    if (!eventId) return;

    const { data: members } = await supabase
      .from("event_members")
      .select("profile_id")
      .eq("event_id", eventId);

    if (!members || members.length === 0) {
      setProfiles([]);
      return;
    }

    const ids = members.map((m) => m.profile_id);

    const { data } = await supabase
      .from("profiles")
      .select("id,name,email")
      .in("id", ids);

    setProfiles(data ?? []);
  }

  async function loadDrinks() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      notify("Getränke konnten nicht geladen werden: " + error.message, "error");
      return;
    }

    setDrinks(data ?? []);
  }

  async function loadHistory() {
    if (!eventId) return;

    const { data } = await supabase
      .from("drink_history")
      .select("*")
      .eq("event_id", eventId)
      .order("consumed_at", { ascending: false });

    setHistory(data ?? []);
  }

  async function loadPayments() {
    if (!eventId) return;

    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    setPayments(data ?? []);
  }

  async function loadPoints() {
    if (!eventId) return;

    const { data } = await supabase
      .from("points_history")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    setPointsHistory(data ?? []);
  }

  async function loadBeerRequests() {
    if (!eventId) return;

    const { data } = await supabase
      .from("beer_requests")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    setBeerRequests(data ?? []);
  }

  async function loadCrates() {
    if (!eventId) return;

    const { data } = await supabase
      .from("crate_donations")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    setCrateDonations(data ?? []);
  }

  async function loadChallenges() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      notify("Challenges konnten nicht geladen werden: " + error.message, "error");
      return;
    }

    setChallenges(data ?? []);
  }

  async function loadSettings() {
    if (!eventId) return;

    const { data } = await supabase
      .from("event_settings")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    if (data) {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...data,
      });
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }

  async function loadAll() {
    await Promise.all([
      loadProfiles(),
      loadDrinks(),
      loadHistory(),
      loadPayments(),
      loadPoints(),
      loadBeerRequests(),
      loadCrates(),
      loadChallenges(),
      loadSettings(),
    ]);
  }

  useEffect(() => {
    async function start() {
      setLoading(true);

      await loadUser();
      await loadEvents();

      setLoading(false);
    }

    start();
  }, []);

  useEffect(() => {
    if (!userId) return;

    ensureProfile();
  }, [userId]);

  useEffect(() => {
    if (!eventId) return;

    loadAll();
  }, [eventId]);

  const currentEvent = useMemo(
    () => events.find((event) => event.id === eventId),
    [events, eventId]
  );

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

  const totalDrinkCost = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(drink.preis ?? 0) *
            Number(drink.quantity ?? 1),
        0
      ),
    [drinks]
  );

  const totalPaid = useMemo(
    () =>
      payments.reduce(
        (sum, payment) =>
          sum + Number(payment.betrag ?? 0),
        0
      ),
    [payments]
  );

  const totalPoints = useMemo(
    () =>
      pointsHistory.reduce(
        (sum, entry) => sum + Number(entry.points ?? 0),
        0
      ),
    [pointsHistory]
  );

  const personStats = useMemo(() => {
    return profiles.map((profile) => {
      const personHistory = history.filter(
        (entry) => entry.profile_id === profile.id
      );

      const personPoints = pointsHistory
        .filter((entry) => entry.profile_id === profile.id)
        .reduce(
          (sum, entry) => sum + Number(entry.points ?? 0),
          0
        );

      const personPayments = payments
        .filter(
          (payment) =>
            payment.bezahlt_von === profile.id ||
            payment.profile_id === profile.id
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.betrag ?? 0),
          0
        );

      const personLiters = personHistory.reduce(
        (sum, entry) => sum + Number(entry.liters ?? 0),
        0
      );

      const drinksCount = personHistory.length;

      return {
        profile,
        history: personHistory,
        points: personPoints,
        payments: personPayments,
        liters: personLiters,
        drinks: drinksCount,
      };
    });
  }, [profiles, history, pointsHistory, payments]);

  const ranking = useMemo(
    () =>
      [...personStats].sort(
        (a, b) => b.points - a.points
      ),
    [personStats]
  );

  const currentUserProfile = profiles.find(
    (profile) => profile.id === userId
  );

  async function createEvent() {
    if (!eventTitle.trim()) {
      notify("Bitte einen Eventnamen eingeben.", "error");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase.rpc(
      "create_event",
      {
        p_title: eventTitle.trim(),
        p_description:
          eventDescription.trim() || null,
        p_location:
          eventLocation.trim() || null,
      }
    );

    setSaving(false);

    if (error) {
      notify(
        "Event konnte nicht erstellt werden: " +
          error.message,
        "error"
      );
      return;
    }

    const newId = data as string;

    notify("🎉 Event erfolgreich erstellt!", "success");

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setShowCreateEvent(false);

    await loadEvents();

    if (newId) {
      setEventId(newId);
    }
  }

  async function deleteEvent() {
    if (!eventId) return;

    if (
      !window.confirm(
        "Dieses Event wirklich löschen?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      notify(
        "Event konnte nicht gelöscht werden: " +
          error.message,
        "error"
      );
      return;
    }

    notify("🗑️ Event gelöscht.", "success");

    setEventId("");
    await loadEvents();
  }

  async function addParticipant() {
    if (!eventId) return;

    if (!personName.trim()) {
      notify("Bitte einen Namen eingeben.", "error");
      return;
    }

    const name = personName.trim();

    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .ilike("name", name)
      .maybeSingle();

    let profileId = existing?.id;

    if (!profileId) {
      profileId = crypto.randomUUID();

      const { error } = await supabase
        .from("profiles")
        .insert({
          id: profileId,
          name,
        });

      if (error) {
        notify(
          "Teilnehmer konnte nicht erstellt werden: " +
            error.message,
          "error"
        );
        return;
      }
    }

    const { error } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        profile_id: profileId,
        role: "member",
      });

    if (error && !error.message.includes("duplicate")) {
      notify(
        "Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message,
        "error"
      );
      return;
    }

    setPersonName("");

    notify("👤 Teilnehmer hinzugefügt.", "success");

    await loadProfiles();
  }

  async function saveDrink() {
    if (!eventId) return;

    if (!drinkName.trim()) {
      notify("Bitte ein Getränk eingeben.", "error");
      return;
    }

    const liters = Number(drinkLiters);
    const alcohol = Number(drinkAlcohol);
    const price = Number(drinkPrice);

    const { data, error } = await supabase
      .from("drinks")
      .insert({
        event_id: eventId,
        getraenk: drinkName.trim(),
        drink_name: drinkName.trim(),
        menge: liters,
        liters,
        alkohol: alcohol,
        alcohol_percent: alcohol,
        preis: price,
        quantity: 1,
      })
      .select()
      .single();

    if (error) {
      notify(
        "Getränk konnte nicht gespeichert werden: " +
          error.message,
        "error"
      );
      return;
    }

    setDrinkName("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");

    notify("🍺 Getränk gespeichert.", "success");

    await loadDrinks();

    if (data) {
      setProstAnimation(true);

      window.setTimeout(() => {
        setProstAnimation(false);
      }, 2200);
    }
  }

  async function assignDrink(
    profileId: string,
    drink: Drink
  ) {
    if (!eventId || !userId) return;

    const name =
      drink.getraenk ||
      drink.drink_name ||
      "Getränk";

    const liters = Number(
      drink.liters ?? drink.menge ?? 0
    );

    const alcohol = Number(
      drink.alcohol_percent ??
        drink.alkohol ??
        0
    );

    const price = Number(drink.preis ?? 0);

    const { error } = await supabase
      .from("drink_history")
      .insert({
        event_id: eventId,
        profile_id: profileId,
        drink_id: drink.id,
        drink_name: name,
        liters,
        alcohol_percent: alcohol,
        price,
      });

    if (error) {
      notify(
        "Getränk konnte nicht zugeordnet werden: " +
          error.message,
        "error"
      );
      return;
    }

    await supabase
      .from("points_history")
      .insert({
        event_id: eventId,
        profile_id: profileId,
        points: 10,
        reason: `Getränk: ${name}`,
        reference_type: "drink",
        reference_id: drink.id,
      });

    setProstAnimation(true);

    window.setTimeout(() => {
      setProstAnimation(false);
    }, 2500);

    notify(
      `🍻 ${name} wurde zugeordnet! +10 Punkte`,
      "success"
    );

    await loadHistory();
    await loadPoints();
  }

  async function savePayment() {
    if (!eventId) return;

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      notify("Bitte einen gültigen Betrag eingeben.", "error");
      return;
    }

    if (!paymentPerson) {
      notify("Bitte auswählen, wer bezahlt hat.", "error");
      return;
    }

    const { error } = await supabase
      .from("payments")
      .insert({
        event_id: eventId,
        betrag: amount,
        bezahlt_von: paymentPerson,
        profile_id: paymentPerson,
        status: "paid",
      });

    if (error) {
      notify(
        "Zahlung konnte nicht gespeichert werden: " +
          error.message,
        "error"
      );
      return;
    }

    await supabase
      .from("points_history")
      .insert({
        event_id: eventId,
        profile_id: paymentPerson,
        points: Math.round(amount),
        reason: `Zahlung ${amount.toFixed(2)} €`,
        reference_type: "payment",
      });

    setPaymentAmount("");
    setPaymentPerson("");

    setCrateAnimation(true);

    window.setTimeout(() => {
      setCrateAnimation(false);
    }, 2200);

    notify("💶 Zahlung gespeichert.", "success");

    await loadPayments();
    await loadPoints();
  }

  async function donateCrate() {
    if (!eventId || !userId) return;

    const { error } = await supabase
      .from("crate_donations")
      .insert({
        event_id: eventId,
        profile_id: userId,
        crates: 1,
        points_awarded: 20,
      });

    if (error) {
      notify(
        "Kiste konnte nicht gespeichert werden: " +
          error.message,
        "error"
      );
      return;
    }

    const { error: pointError } = await supabase
      .from("points_history")
      .insert({
        event_id: eventId,
        profile_id: userId,
        points: 20,
        reason: "🍺 Kiste Bier spendiert",
        reference_type: "crate",
      });

    if (pointError) {
      notify(
        "Kiste gespeichert, Punkte konnten aber nicht gespeichert werden.",
        "error"
      );
    } else {
      notify(
        "🍺 Kiste Bier spendiert! +20 Punkte",
        "success"
      );
    }

    setCrateAnimation(true);

    window.setTimeout(() => {
      setCrateAnimation(false);
    }, 3000);

    await loadCrates();
    await loadPoints();
  }

  async function requestBeer() {
    if (!eventId || !userId) return;

    setBeerAnimation(true);

    window.setTimeout(() => {
      setBeerAnimation(false);
    }, 2800);

    const targets = profiles.filter(
      (profile) => profile.id !== userId
    );

    if (targets.length === 0) {
      notify(
        "Keine anderen Teilnehmer im Event.",
        "info"
      );
      return;
    }

    const rows = targets.map((profile) => ({
      event_id: eventId,
      requester_profile_id: userId,
      target_profile_id: profile.id,
      status: "pending",
    }));

    const { error } = await supabase
      .from("beer_requests")
      .insert(rows);

    if (error) {
      notify(
        "Bier-Anfrage konnte nicht gesendet werden: " +
          error.message,
        "error"
      );
      return;
    }

    notify(
      "🍺 Alle Teilnehmer wurden benachrichtigt!",
      "success"
    );

    await loadBeerRequests();
  }

  async function respondBeer(
    requestId: string,
    status: "accepted" | "declined"
  ) {
    const { error } = await supabase
      .from("beer_requests")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      notify(
        "Antwort konnte nicht gespeichert werden: " +
          error.message,
        "error"
      );
      return;
    }

    notify(
      status === "accepted"
        ? "🍺 Du hast zugesagt!"
        : "❌ Anfrage abgelehnt.",
      status === "accepted"
        ? "success"
        : "info"
    );

    await loadBeerRequests();
  }

  async function createChallenge() {
    if (!eventId || !userId) return;

    if (!challengeTitle.trim()) {
      notify("Bitte einen Challenge-Namen eingeben.", "error");
      return;
    }

    const { error } = await supabase
      .from("challenges")
      .insert({
        event_id: eventId,
        title: challengeTitle.trim(),
        description:
          challengeDescription.trim() || null,
        points: Number(challengePoints) || 10,
        category: "fun",
        status: "open",
        created_by_profile_id: userId,
        is_active: true,
      });

    if (error) {
      notify(
        "Challenge konnte nicht erstellt werden: " +
          error.message,
        "error"
      );
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");

    notify("🎯 Challenge erstellt!", "success");

    await loadChallenges();
  }

  async function saveSettings() {
    if (!eventId) return;

    setSaving(true);

    const { error } = await supabase.rpc(
      "update_event_settings",
      {
        p_event_id: eventId,
        p_show_participants: settings.show_participants,
        p_show_drinks: settings.show_drinks,
        p_show_drink_history: settings.show_drink_history,
        p_show_payments: settings.show_payments,
        p_show_costs: settings.show_costs,
        p_show_ranking: settings.show_ranking,
        p_show_points: settings.show_points,
        p_show_promille: settings.show_promille,
        p_show_statistics: settings.show_statistics,
        p_show_challenges: settings.show_challenges,
        p_show_challenge_points:
          settings.show_challenge_points,
        p_show_beer_button:
          settings.show_beer_button,
        p_show_beer_requests:
          settings.show_beer_requests,
        p_show_crate_button:
          settings.show_crate_button,
        p_show_profiles: settings.show_profiles,
        p_show_photos: settings.show_photos,
        p_show_who_paid:
          settings.show_who_paid,
        p_show_who_owes:
          settings.show_who_owes,
      }
    );

    setSaving(false);

    if (error) {
      notify(
        "Einstellungen konnten nicht gespeichert werden: " +
          error.message,
        "error"
      );
      return;
    }

    notify(
      "⚙️ Event-Einstellungen gespeichert.",
      "success"
    );

    setShowSettings(false);

    await loadSettings();
  }

  function getProfileName(id?: string | null) {
    if (!id) return "Unbekannt";

    return (
      profiles.find((profile) => profile.id === id)
        ?.name || "Unbekannt"
    );
  }

  function getPromille(profileId: string) {
    const personHistory = history.filter(
      (entry) => entry.profile_id === profileId
    );

    const alcoholGrams = personHistory.reduce(
      (sum, entry) => {
        const liters = Number(entry.liters || 0);
        const percent = Number(
          entry.alcohol_percent || 0
        );

        return (
          sum +
          liters *
            (percent / 100) *
            0.789 *
            1000
        );
      },
      0
    );

    /*
      Vereinfachte Anzeige.
      Für eine echte Promilleberechnung müssen
      Gewicht, Geschlecht, Körpergröße und Zeitraum
      des Konsums berücksichtigt werden.
    */

    if (alcoholGrams <= 0) return "0.00";

    const estimated =
      alcoholGrams / (82 * 0.68);

    return Math.max(0, estimated).toFixed(2);
  }

  if (loading) {
    return (
      <main className="page loadingPage">
        <div className="loader">
          🍻
        </div>

        <h1>
          Güstener Zapfhahn Zentrale
        </h1>

        <p>
          Lade deine Zentrale...
        </p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="page">
        <div className="loginCard">
          <div className="bigLogo">
            🍻
          </div>

          <h1>
            Güstener Zapfhahn Zentrale
          </h1>

          <p>
            Du bist nicht angemeldet.
          </p>

          <p className="hint">
            Bitte zuerst über Supabase Auth anmelden.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="backgroundBeer beer1">
        🍺
      </div>

      <div className="backgroundBeer beer2">
        🍻
      </div>

      <div className="container">
        <header className="header">
          <div className="logoBox">
            🍻
          </div>

          <div className="headerText">
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Events · Getränke · Punkte · Challenges
            </p>
          </div>

          <div className="adminBadge">
            👑 ADMIN
          </div>
        </header>

        <section className="card eventCard">
          <div className="sectionTitle">
            <div>
              <h2>
                📅 Aktuelles Event
              </h2>

              {currentEvent && (
                <p>
                  {currentEvent.location ||
                    "Güsten"}
                </p>
              )}
            </div>

            <div className="eventActions">
              <button
                className="secondary"
                onClick={() =>
                  setShowCreateEvent(true)
                }
              >
                ➕ Neues Event
              </button>

              {eventId && (
                <button
                  className="danger"
                  onClick={deleteEvent}
                >
                  🗑️ Löschen
                </button>
              )}
            </div>
          </div>

          <select
            value={eventId}
            onChange={(e) =>
              setEventId(e.target.value)
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

          {currentEvent?.invite_code && (
            <div className="inviteBox">
              <span>
                🔑 Einladungscode
              </span>

              <strong>
                {currentEvent.invite_code}
              </strong>

              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    currentEvent.invite_code || ""
                  )
                }
              >
                📋 Kopieren
              </button>
            </div>
          )}
        </section>

        {eventId && (
          <>
            <section className="stats">
              <div className="stat">
                <span>🍺</span>
                <strong>
                  {drinks.length}
                </strong>
                <small>
                  Getränke
                </small>
              </div>

              <div className="stat">
                <span>💧</span>
                <strong>
                  {totalLiters.toFixed(1)}
                </strong>
                <small>
                  Liter
                </small>
              </div>

              <div className="stat">
                <span>💶</span>
                <strong>
                  {totalDrinkCost.toFixed(2)} €
                </strong>
                <small>
                  Getränke
                </small>
              </div>

              <div className="stat">
                <span>👥</span>
                <strong>
                  {profiles.length}
                </strong>
                <small>
                  Teilnehmer
                </small>
              </div>
            </section>

            <section className="actionGrid">
              {settings.show_beer_button && (
                <button
                  className="beerButton"
                  onClick={requestBeer}
                >
                  <span className="beerEmoji">
                    🍺
                  </span>

                  <strong>
                    BIER
                  </strong>

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
                  <span>
                    🍺📦
                  </span>

                  <strong>
                    KISTE BIER
                  </strong>

                  <small>
                    Kiste spendieren · +20 Punkte
                  </small>
                </button>
              )}
            </section>

            {settings.show_beer_requests &&
              beerRequests.length > 0 && (
                <section className="card">
                  <h2>
                    🔔 Bier-Anfragen
                  </h2>

                  {beerRequests
                    .filter(
                      (request) =>
                        request.target_profile_id ===
                          userId &&
                        request.status === "pending"
                    )
                    .map((request) => (
                      <div
                        className="beerRequest"
                        key={request.id}
                      >
                        <div>
                          <strong>
                            🍻{" "}
                            {getProfileName(
                              request.requester_profile_id
                            )}
                          </strong>

                          <p>
                            möchte ein Bier mit dir
                            trinken.
                          </p>
                        </div>

                        <div className="requestButtons">
                          <button
                            className="accept"
                            onClick={() =>
                              respondBeer(
                                request.id,
                                "accepted"
                              )
                            }
                          >
                            ✅ Zusagen
                          </button>

                          <button
                            className="decline"
                            onClick={() =>
                              respondBeer(
                                request.id,
                                "declined"
                              )
                            }
                          >
                            ❌ Ablehnen
                          </button>
                        </div>
                      </div>
                    ))}
                </section>
              )}

            {settings.show_participants && (
              <section className="card">
                <div className="sectionTitle">
                  <h2>
                    🍻 Teilnehmer
                  </h2>
                </div>

                <div className="addRow">
                  <input
                    placeholder="Name"
                    value={personName}
                    onChange={(e) =>
                      setPersonName(e.target.value)
                    }
                  />

                  <button
                    className="primary"
                    onClick={addParticipant}
                  >
                    ➕ Hinzufügen
                  </button>
                </div>

                <div className="peopleGrid">
                  {personStats.map((person) => (
                    <button
                      className="personCard"
                      key={person.profile.id}
                      onClick={() =>
                        setSelectedPerson(
                          person.profile
                        )
                      }
                    >
                      <div className="personAvatar">
                        👤
                      </div>

                      <div className="personInfo">
                        <strong>
                          {person.profile.name}
                        </strong>

                        <small>
                          🍺 {person.drinks}
                          {" · "}
                          💧{" "}
                          {person.liters.toFixed(1)} L
                        </small>

                        {settings.show_points && (
                          <small>
                            🏆 {person.points} Punkte
                          </small>
                        )}

                        {settings.show_promille && (
                          <small>
                            🍺{" "}
                            {getPromille(
                              person.profile.id
                            )} ‰
                          </small>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {settings.show_drinks && (
              <section className="card">
                <h2>
                  🍺 Getränk hinzufügen
                </h2>

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
                    value={drinkLiters}
                    onChange={(e) =>
                      setDrinkLiters(
                        e.target.value
                      )
                    }
                    placeholder="Liter"
                  />

                  <input
                    type="number"
                    value={drinkAlcohol}
                    onChange={(e) =>
                      setDrinkAlcohol(
                        e.target.value
                      )
                    }
                    placeholder="Alkohol %"
                  />

                  <input
                    type="number"
                    step="0.01"
                    value={drinkPrice}
                    onChange={(e) =>
                      setDrinkPrice(
                        e.target.value
                      )
                    }
                    placeholder="Preis €"
                  />
                </div>

                <button
                  className="saveButton"
                  onClick={saveDrink}
                >
                  🍻 Getränk speichern
                </button>
              </section>
            )}

            {settings.show_drinks && (
              <section className="card">
                <h2>
                  🔗 Getränk zuordnen
                </h2>

                {profiles.map((profile) => (
                  <div
                    className="assignment"
                    key={profile.id}
                  >
                    <strong>
                      👤 {profile.name}
                    </strong>

                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const drink =
                          drinks.find(
                            (d) =>
                              d.id ===
                              e.target.value
                          );

                        if (drink) {
                          assignDrink(
                            profile.id,
                            drink
                          );

                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">
                        🍺 Getränk auswählen
                      </option>

                      {drinks.map((drink) => (
                        <option
                          key={drink.id}
                          value={drink.id}
                        >
                          {drink.getraenk ||
                            drink.drink_name ||
                            "Getränk"}{" "}
                          ·{" "}
                          {Number(
                            drink.preis || 0
                          ).toFixed(2)}
                          €
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </section>
            )}

            {settings.show_drinks && (
              <section className="card">
                <h2>
                  🍺 Getränke
                </h2>

                {drinks.length === 0 ? (
                  <p className="empty">
                    Noch keine Getränke.
                  </p>
                ) : (
                  drinks.map((drink) => (
                    <div
                      className="drinkItem"
                      key={drink.id}
                    >
                      <div>
                        <strong>
                          🍺{" "}
                          {drink.getraenk ||
                            drink.drink_name}
                        </strong>

                        <small>
                          {Number(
                            drink.liters ??
                              drink.menge ??
                              0
                          ).toFixed(1)}{" "}
                          Liter ·{" "}
                          {Number(
                            drink.alcohol_percent ??
                              drink.alkohol ??
                              0
                          ).toFixed(1)} %
                        </small>
                      </div>

                      <strong>
                        {Number(
                          drink.preis || 0
                        ).toFixed(2)} €
                      </strong>
                    </div>
                  ))
                )}
              </section>
            )}

            {settings.show_drink_history && (
              <section className="card">
                <div className="sectionTitle">
                  <h2>
                    🕐 Getränkeverlauf
                  </h2>

                  <button
                    className="secondary"
                    onClick={() =>
                      setShowHistory(
                        !showHistory
                      )
                    }
                  >
                    {showHistory
                      ? "Ausblenden"
                      : "Anzeigen"}
                  </button>
                </div>

                {showHistory && (
                  <div className="history">
                    {history.length === 0 ? (
                      <p className="empty">
                        Noch kein Getränkeverlauf.
                      </p>
                    ) : (
                      history.map((entry) => (
                        <div
                          className="historyItem"
                          key={entry.id}
                        >
                          <div>
                            <strong>
                              🍺{" "}
                              {entry.drink_name}
                            </strong>

                            <small>
                              👤{" "}
                              {getProfileName(
                                entry.profile_id
                              )}
                            </small>
                          </div>

                          <div className="historyRight">
                            <strong>
                              {Number(
                                entry.liters
                              ).toFixed(1)}{" "}
                              L
                            </strong>

                            <small>
                              {new Date(
                                entry.consumed_at
                              ).toLocaleString(
                                "de-DE"
                              )}
                            </small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            )}

            {settings.show_payments && (
              <section className="card">
                <div className="sectionTitle">
                  <h2>
                    💶 Zahlungen
                  </h2>

                  <button
                    className="secondary"
                    onClick={() =>
                      setShowPayments(
                        !showPayments
                      )
                    }
                  >
                    {showPayments
                      ? "Ausblenden"
                      : "Anzeigen"}
                  </button>
                </div>

                {showPayments && (
                  <>
                    <div className="paymentForm">
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

                        {profiles.map(
                          (profile) => (
                            <option
                              key={profile.id}
                              value={profile.id}
                            >
                              {profile.name}
                            </option>
                          )
                        )}
                      </select>

                      <button
                        className="saveButton"
                        onClick={savePayment}
                      >
                        💶 Zahlung speichern
                      </button>
                    </div>

                    <div className="paymentTotal">
                      <span>
                        💰 Gesamt bezahlt
                      </span>

                      <strong>
                        {totalPaid.toFixed(2)} €
                      </strong>
                    </div>

                    {payments.map(
                      (payment) => (
                        <div
                          className="paymentItem"
                          key={payment.id}
                        >
                          <div>
                            <strong>
                              💶{" "}
                              {settings.show_who_paid
                                ? getProfileName(
                                    payment.bezahlt_von
                                  )
                                : "Zahlung"}
                            </strong>

                            <small>
                              {new Date(
                                payment.created_at
                              ).toLocaleString(
                                "de-DE"
                              )}
                            </small>
                          </div>

                          <strong>
                            {Number(
                              payment.betrag
                            ).toFixed(2)}{" "}
                            €
                          </strong>
                        </div>
                      )
                    )}

                    {settings.show_who_owes && (
                      <div className="owesBox">
                        <h3>
                          💳 Wer muss noch bezahlen?
                        </h3>

                        {profiles.map(
                          (profile) => {
                            const paid =
                              payments
                                .filter(
                                  (payment) =>
                                    payment.bezahlt_von ===
                                      profile.id ||
                                    payment.profile_id ===
                                      profile.id
                                )
                                .reduce(
                                  (
                                    sum,
                                    payment
                                  ) =>
                                    sum +
                                    Number(
                                      payment.betrag ||
                                        0
                                    ),
                                  0
                                );

                            const fairShare =
                              profiles.length > 0
                                ? totalDrinkCost /
                                  profiles.length
                                : 0;

                            const difference =
                              fairShare - paid;

                            return (
                              <div
                                className="oweRow"
                                key={profile.id}
                              >
                                <span>
                                  👤{" "}
                                  {profile.name}
                                </span>

                                <strong
                                  className={
                                    difference >
                                    0.009
                                      ? "owe"
                                      : "paid"
                                  }
                                >
                                  {difference >
                                  0.009
                                    ? `noch ${difference.toFixed(
                                        2
                                      )} €`
                                    : "✅ bezahlt"}
                                </strong>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {settings.show_crate_button &&
              crateDonations.length > 0 && (
                <section className="card">
                  <h2>
                    🍺 Kisten
                  </h2>

                  {crateDonations.map(
                    (crate) => (
                      <div
                        className="crateItem"
                        key={crate.id}
                      >
                        <span>
                          🍺📦{" "}
                          {getProfileName(
                            crate.profile_id
                          )}
                        </span>

                        <strong>
                          +{crate.points_awarded} Punkte
                        </strong>
                      </div>
                    )
                  )}
                </section>
              )}

            {settings.show_challenges && (
              <section className="card">
                <div className="sectionTitle">
                  <h2>
                    🎯 Challenges
                  </h2>

                  <button
                    className="secondary"
                    onClick={() =>
                      setShowChallenges(
                        !showChallenges
                      )
                    }
                  >
                    {showChallenges
                      ? "Ausblenden"
                      : "Anzeigen"}
                  </button>
                </div>

                {showChallenges && (
                  <>
                    <input
                      placeholder="Challenge"
                      value={challengeTitle}
                      onChange={(e) =>
                        setChallengeTitle(
                          e.target.value
                        )
                      }
                    />

                    <input
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
                      className="saveButton"
                      onClick={createChallenge}
                    >
                      🎯 Challenge erstellen
                    </button>

                    <div className="challengeList">
                      {challenges.length === 0 ? (
                        <p className="empty">
                          Noch keine Challenges.
                        </p>
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
                                  {
                                    challenge.title
                                  }
                                </strong>

                                <p>
                                  {
                                    challenge.description
                                  }
                                </p>
                              </div>

                              {settings.show_challenge_points && (
                                <strong className="challengePoints">
                                  +
                                  {
                                    challenge.points
                                  }
                                </strong>
                              )}
                            </div>
                          )
                        )
                      )}
                    </div>
                  </>
                )}
              </section>
            )}

            {settings.show_ranking && (
              <section className="card">
                <h2>
                  🏆 Rangliste
                </h2>

                <p className="hint">
                  Tippe auf eine Person, um zu
                  sehen, wofür sie Punkte bekommen
                  hat.
                </p>

                <div className="ranking">
                  {ranking.map(
                    (person, index) => (
                      <button
                        className="rankItem"
                        key={person.profile.id}
                        onClick={() =>
                          setSelectedPerson(
                            person.profile
                          )
                        }
                      >
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
                          {person.profile.name}
                        </span>

                        <b>
                          {person.points} Punkte
                        </b>
                      </button>
                    )
                  )}
                </div>
              </section>
            )}

            <section className="card settingsCard">
              <div className="sectionTitle">
                <div>
                  <h2>
                    ⚙️ Event-Einstellungen
                  </h2>

                  <p>
                    Du bist als angemeldeter
                    Benutzer Admin.
                  </p>
                </div>

                <button
                  className="secondary"
                  onClick={() =>
                    setShowSettings(
                      !showSettings
                    )
                  }
                >
                  {showSettings
                    ? "Schließen"
                    : "Bearbeiten"}
                </button>
              </div>

              {showSettings && (
                <div className="settingsGrid">
                  {(
                    Object.keys(
                      settings
                    ) as Array<
                      keyof EventSettings
                    >
                  ).map((key) => (
                    <label
                      className="toggle"
                      key={key}
                    >
                      <span>
                        {key
                          .replaceAll(
                            "_",
                            " "
                          )
                          .replace(
                            "show ",
                            ""
                          )}
                      </span>

                      <input
                        type="checkbox"
                        checked={
                          settings[key]
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            [key]:
                              e.target.checked,
                          })
                        }
                      />

                      <i />
                    </label>
                  ))}

                  <button
                    className="saveButton"
                    onClick={saveSettings}
                    disabled={saving}
                  >
                    {saving
                      ? "Speichert..."
                      : "💾 Einstellungen speichern"}
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        <footer>
          <div>
            🍻 Güstener Zapfhahn Zentrale
          </div>

          <small>
            Dein Event · Deine Getränke · Deine
            Runde
          </small>
        </footer>
      </div>

      {showCreateEvent && (
        <div className="modalOverlay">
          <div className="modal">
            <button
              className="modalClose"
              onClick={() =>
                setShowCreateEvent(false)
              }
            >
              ×
            </button>

            <div className="modalIcon">
              📅
            </div>

            <h2>
              Neues Event
            </h2>

            <input
              placeholder="Eventname"
              value={eventTitle}
              onChange={(e) =>
                setEventTitle(e.target.value)
              }
            />

            <input
              placeholder="Beschreibung"
              value={eventDescription}
              onChange={(e) =>
                setEventDescription(
                  e.target.value
                )
              }
            />

            <input
              placeholder="Ort"
              value={eventLocation}
              onChange={(e) =>
                setEventLocation(
                  e.target.value
                )
              }
            />

            <button
              className="saveButton"
              onClick={createEvent}
              disabled={saving}
            >
              {saving
                ? "Erstelle..."
                : "🎉 Event erstellen"}
            </button>
          </div>
        </div>
      )}

      {selectedPerson && (
        <div className="modalOverlay">
          <div className="modal personModal">
            <button
              className="modalClose"
              onClick={() =>
                setSelectedPerson(null)
              }
            >
              ×
            </button>

            <div className="modalIcon">
              👤
            </div>

            <h2>
              {selectedPerson.name}
            </h2>

            {(() => {
              const person =
                personStats.find(
                  (p) =>
                    p.profile.id ===
                    selectedPerson.id
                );

              if (!person) return null;

              const personPoints =
                pointsHistory.filter(
                  (entry) =>
                    entry.profile_id ===
                    selectedPerson.id
                );

              return (
                <>
                  <div className="personBigStats">
                    <div>
                      <strong>
                        {person.points}
                      </strong>
                      <small>
                        Punkte
                      </small>
                    </div>

                    <div>
                      <strong>
                        {person.drinks}
                      </strong>
                      <small>
                        Getränke
                      </small>
                    </div>

                    <div>
                      <strong>
                        {person.liters.toFixed(
                          1
                        )}
                      </strong>
                      <small>
                        Liter
                      </small>
                    </div>
                  </div>

                  <div className="pointHistory">
                    <h3>
                      🏆 Punkte erhalten für
                    </h3>

                    {personPoints.length ===
                    0 ? (
                      <p className="empty">
                        Noch keine Punkte.
                      </p>
                    ) : (
                      personPoints.map(
                        (entry) => (
                          <div
                            className="pointRow"
                            key={entry.id}
                          >
                            <span>
                              {entry.reason}
                            </span>

                            <strong>
                              +{entry.points}
                            </strong>
                          </div>
                        )
                      )
                    )}
                  </div>

                  {person.history.length >
                    0 && (
                    <div className="pointHistory">
                      <h3>
                        🍺 Getränke
                      </h3>

                      {person.history.map(
                        (entry) => (
                          <div
                            className="pointRow"
                            key={entry.id}
                          >
                            <span>
                              {entry.drink_name}
                            </span>

                            <small>
                              {new Date(
                                entry.consumed_at
                              ).toLocaleString(
                                "de-DE"
                              )}
                            </small>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {message && (
        <div
          className={`toast ${messageType}`}
        >
          {message}
        </div>
      )}

      {prostAnimation && (
        <div className="animationOverlay prostOverlay">
          <div className="glass leftGlass">
            🍺
          </div>

          <div className="prostText">
            PROST! 🍻
          </div>

          <div className="glass rightGlass">
            🍺
          </div>
        </div>
      )}

      {beerAnimation && (
        <div className="animationOverlay beerOverlay">
          <div className="flyingBeer">
            🍺
          </div>

          <div className="beerCallText">
            🍻 BIER-ALARM!
          </div>
        </div>
      )}

      {crateAnimation && (
        <div className="moneyRain">
          {Array.from({
            length: 24,
          }).map((_, index) => (
            <span
              key={index}
              style={{
                left: `${(
                  Math.random() * 100
                ).toFixed(0)}%`,
                animationDelay: `${(
                  Math.random() * 1.5
                ).toFixed(2)}s`,
              }}
            >
              {index % 2 === 0
                ? "💶"
                : "🍺"}
            </span>
          ))}
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
          overflow-x: hidden;
          background:
            radial-gradient(
              circle at 50% -10%,
              #263d52 0%,
              #111a24 35%,
              #070b10 75%
            );
          color: white;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          padding: 18px;
        }

        .container {
          width: 100%;
          max-width: 920px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .loadingPage {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .loader {
          font-size: 70px;
          animation: bounce 1s infinite;
        }

        .loginCard {
          max-width: 500px;
          margin: 100px auto;
          text-align: center;
          padding: 40px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 28px;
          backdrop-filter: blur(20px);
        }

        .bigLogo {
          font-size: 70px;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px 0 25px;
        }

        .logoBox {
          width: 66px;
          height: 66px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            linear-gradient(
              145deg,
              #26384a,
              #111923
            );
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 20px;
          font-size: 35px;
          box-shadow:
            0 15px 40px rgba(0,0,0,.3);
        }

        .headerText {
          flex: 1;
        }

        h1 {
          margin: 0;
          font-size: clamp(22px, 4vw, 31px);
        }

        h2 {
          margin: 0 0 8px;
          font-size: 21px;
        }

        h3 {
          margin-top: 0;
        }

        p {
          color: #99a7b5;
        }

        .headerText p {
          margin: 5px 0 0;
          font-size: 14px;
        }

        .adminBadge {
          background: linear-gradient(
            135deg,
            #f59e0b,
            #fbbf24
          );
          color: #16100a;
          padding: 8px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
        }

        .card {
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.075),
              rgba(255,255,255,.035)
            );
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 15px;
          box-shadow:
            0 15px 45px rgba(0,0,0,.18);
          backdrop-filter: blur(16px);
        }

        .eventCard {
          border-color: rgba(245,158,11,.25);
        }

        .sectionTitle {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .sectionTitle p {
          margin: 0;
        }

        .eventActions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          text-align: center;
          padding: 16px 8px;
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 18px;
        }

        .stat span {
          display: block;
          font-size: 24px;
        }

        .stat strong {
          display: block;
          font-size: 20px;
          margin-top: 5px;
        }

        .stat small {
          display: block;
          color: #7f8b98;
          margin-top: 4px;
        }

        .actionGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 15px;
        }

        .beerButton,
        .crateButton {
          min-height: 145px;
          border-radius: 25px;
          border: none;
          cursor: pointer;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition:
            transform .15s,
            box-shadow .15s;
        }

        .beerButton:hover,
        .crateButton:hover {
          transform: translateY(-3px);
        }

        .beerButton {
          background:
            linear-gradient(
              145deg,
              #b91c1c,
              #7f1d1d
            );
          box-shadow:
            0 12px 35px rgba(185,28,28,.3);
        }

        .crateButton {
          background:
            linear-gradient(
              145deg,
              #d97706,
              #92400e
            );
          box-shadow:
            0 12px 35px rgba(217,119,6,.3);
        }

        .beerEmoji {
          font-size: 46px;
        }

        .beerButton strong,
        .crateButton strong {
          font-size: 21px;
          margin-top: 5px;
        }

        .beerButton small,
        .crateButton small {
          margin-top: 5px;
          opacity: .75;
        }

        input,
        select {
          width: 100%;
          padding: 13px 14px;
          margin-bottom: 10px;
          border-radius: 13px;
          border: 1px solid #33404e;
          background: #111923;
          color: white;
          outline: none;
          font-size: 15px;
        }

        input:focus,
        select:focus {
          border-color: #f59e0b;
          box-shadow:
            0 0 0 3px rgba(245,158,11,.1);
        }

        button {
          font-family: inherit;
        }

        button:not(.personCard):not(.rankItem) {
          border: none;
          cursor: pointer;
        }

        .primary,
        .saveButton {
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #fbbf24
            );
          color: #17120a;
          font-weight: 900;
        }

        .primary,
        .saveButton,
        .secondary,
        .danger {
          padding: 13px 16px;
          border-radius: 13px;
          font-weight: 800;
        }

        .secondary {
          background: #25313d;
          color: white;
        }

        .danger {
          background: #541b20;
          color: #ffb7bd;
        }

        .saveButton {
          width: 100%;
        }

        .addRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .addRow input {
          margin: 0;
        }

        .peopleGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 12px;
        }

        .personCard {
          text-align: left;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.045);
          color: white;
          cursor: pointer;
        }

        .personAvatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #25313e;
          font-size: 22px;
        }

        .personInfo {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .personInfo small {
          color: #8e9baa;
        }

        .three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .assignment {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 10px;
          align-items: center;
          margin-bottom: 8px;
          padding: 8px;
          border-radius: 12px;
          background: rgba(255,255,255,.035);
        }

        .assignment select {
          margin: 0;
        }

        .drinkItem,
        .paymentItem,
        .historyItem,
        .crateItem,
        .challenge,
        .pointRow,
        .oweRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.045);
        }

        .drinkItem small,
        .paymentItem small,
        .historyItem small {
          display: block;
          margin-top: 4px;
          color: #84909e;
        }

        .inviteBox {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border-radius: 15px;
          background: rgba(245,158,11,.08);
          border: 1px solid rgba(245,158,11,.2);
        }

        .inviteBox span {
          color: #aab4bf;
        }

        .inviteBox strong {
          color: #fbbf24;
          font-size: 18px;
          letter-spacing: 2px;
          flex: 1;
        }

        .inviteBox button {
          background: #273441;
          color: white;
          padding: 9px 12px;
          border-radius: 10px;
        }

        .beerRequest {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 15px;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              rgba(185,28,28,.18),
              rgba(255,255,255,.04)
            );
          margin-top: 9px;
        }

        .beerRequest p {
          margin: 4px 0 0;
        }

        .requestButtons {
          display: flex;
          gap: 7px;
        }

        .accept,
        .decline {
          border: none;
          border-radius: 10px;
          padding: 10px 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .accept {
          background: #166534;
          color: #dcfce7;
        }

        .decline {
          background: #3f2930;
          color: #fecdd3;
        }

        .paymentForm {
          margin-bottom: 12px;
        }

        .paymentTotal {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          border-radius: 15px;
          background: rgba(245,158,11,.08);
          color: #cbd5df;
        }

        .paymentTotal strong {
          color: #fbbf24;
          font-size: 21px;
        }

        .owesBox {
          margin-top: 14px;
          padding: 15px;
          border-radius: 17px;
          background: rgba(255,255,255,.035);
        }

        .owe {
          color: #fca5a5;
        }

        .paid {
          color: #86efac;
        }

        .challengePoints {
          color: #fbbf24;
          font-size: 19px;
        }

        .ranking {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rankItem {
          display: grid;
          grid-template-columns: 45px 1fr auto;
          align-items: center;
          gap: 10px;
          width: 100%;
          text-align: left;
          padding: 14px;
          border-radius: 15px;
          border: 1px solid rgba(255,255,255,.05);
          background: rgba(255,255,255,.045);
          color: white;
          cursor: pointer;
        }

        .rankItem:hover {
          background: rgba(245,158,11,.09);
        }

        .rankPlace {
          font-size: 22px;
        }

        .settingsCard {
          border-color: rgba(96,165,250,.15);
        }

        .settingsGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px;
          border-radius: 13px;
          background: rgba(255,255,255,.045);
          color: #d7dee5;
          text-transform: capitalize;
        }

        .toggle input {
          display: none;
        }

        .toggle i {
          width: 44px;
          height: 24px;
          background: #374151;
          border-radius: 99px;
          position: relative;
          transition: .2s;
        }

        .toggle i::after {
          content: "";
          position: absolute;
          width: 18px;
          height: 18px;
          top: 3px;
          left: 3px;
          border-radius: 50%;
          background: white;
          transition: .2s;
        }

        .toggle input:checked + i {
          background: #d97706;
        }

        .toggle input:checked + i::after {
          transform: translateX(20px);
        }

        .settingsGrid .saveButton {
          grid-column: 1 / -1;
          margin-top: 5px;
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0,0,0,.72);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .modal {
          position: relative;
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
          background:
            linear-gradient(
              145deg,
              #1b2733,
              #0d141c
            );
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 25px;
          padding: 25px;
          box-shadow:
            0 30px 100px rgba(0,0,0,.6);
        }

        .modalClose {
          position: absolute;
          right: 15px;
          top: 12px;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #303b47;
          color: white;
          border: none;
          font-size: 24px;
          cursor: pointer;
        }

        .modalIcon {
          font-size: 50px;
          margin-bottom: 8px;
        }

        .personBigStats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 15px 0;
        }

        .personBigStats div {
          text-align: center;
          padding: 13px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .personBigStats strong {
          display: block;
          font-size: 21px;
          color: #fbbf24;
        }

        .personBigStats small {
          color: #8793a0;
        }

        .toast {
          position: fixed;
          z-index: 300;
          left: 50%;
          bottom: 25px;
          transform: translateX(-50%);
          max-width: calc(100vw - 30px);
          padding: 14px 18px;
          border-radius: 14px;
          background: #182330;
          border: 1px solid #354454;
          box-shadow:
            0 15px 50px rgba(0,0,0,.4);
          color: #fbbf24;
          font-weight: 700;
          text-align: center;
        }

        .toast.error {
          color: #fca5a5;
          border-color: #7f1d1d;
        }

        .toast.success {
          color: #86efac;
          border-color: #166534;
        }

        .animationOverlay {
          position: fixed;
          z-index: 250;
          inset: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .prostOverlay {
          background: rgba(0,0,0,.25);
          animation: fadeOut 2.5s forwards;
        }

        .glass {
          position: absolute;
          font-size: 85px;
          filter:
            drop-shadow(
              0 15px 25px
              rgba(0,0,0,.4)
            );
        }

        .leftGlass {
          left: 22%;
          animation: glassLeft 1.8s forwards;
        }

        .rightGlass {
          right: 22%;
          animation: glassRight 1.8s forwards;
        }

        .prostText {
          font-size: clamp(40px, 10vw, 80px);
          font-weight: 1000;
          color: #fbbf24;
          text-shadow:
            0 8px 30px rgba(0,0,0,.7);
          animation: prost 2s forwards;
        }

        .beerOverlay {
          background: rgba(127,29,29,.18);
        }

        .flyingBeer {
          font-size: 110px;
          animation: flyBeer 2.2s forwards;
        }

        .beerCallText {
          position: absolute;
          bottom: 28%;
          font-size: 38px;
          font-weight: 1000;
          color: #fff;
          text-shadow:
            0 5px 25px rgba(0,0,0,.8);
          animation: pop .8s .3s both;
        }

        .moneyRain {
          position: fixed;
          inset: 0;
          z-index: 240;
          pointer-events: none;
          overflow: hidden;
        }

        .moneyRain span {
          position: absolute;
          top: -60px;
          font-size: 32px;
          animation:
            moneyFall 3s linear forwards;
        }

        .backgroundBeer {
          position: fixed;
          opacity: .025;
          pointer-events: none;
          font-size: 200px;
          z-index: 0;
        }

        .beer1 {
          top: 20%;
          left: -50px;
          transform: rotate(-20deg);
        }

        .beer2 {
          bottom: 10%;
          right: -60px;
          transform: rotate(20deg);
        }

        .empty {
          color: #687584;
          text-align: center;
        }

        .hint {
          font-size: 13px;
        }

        footer {
          text-align: center;
          color: #5f6d7a;
          padding: 30px 10px;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        @keyframes bounce {
          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes glassLeft {
          0% {
            transform:
              translateX(-100vw)
              rotate(-25deg);
          }
          65% {
            transform:
              translateX(25px)
              rotate(10deg);
          }
          100% {
            transform:
              translateX(0)
              rotate(0);
          }
        }

        @keyframes glassRight {
          0% {
            transform:
              translateX(100vw)
              rotate(25deg);
          }
          65% {
            transform:
              translateX(-25px)
              rotate(-10deg);
          }
          100% {
            transform:
              translateX(0)
              rotate(0);
          }
        }

        @keyframes prost {
          0% {
            opacity: 0;
            transform: scale(.3);
          }
          35% {
            opacity: 1;
            transform: scale(1.15);
          }
          65% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.4);
          }
        }

        @keyframes fadeOut {
          0% {
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes flyBeer {
          0% {
            transform:
              translateY(100vh)
              scale(.4)
              rotate(-30deg);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          75% {
            transform:
              translateY(-20px)
              scale(1.25)
              rotate(20deg);
          }
          100% {
            transform:
              translateY(-120vh)
              scale(.5)
              rotate(50deg);
            opacity: 0;
          }
        }

        @keyframes pop {
          from {
            opacity: 0;
            transform: scale(.3);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes moneyFall {
          to {
            top: 110vh;
            transform:
              rotate(720deg)
              translateX(80px);
          }
        }

        @media (max-width: 700px) {
          .page {
            padding: 10px;
          }

          .header {
            align-items: flex-start;
          }

          .adminBadge {
            display: none;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .actionGrid {
            grid-template-columns: 1fr;
          }

          .peopleGrid {
            grid-template-columns: 1fr;
          }

          .three {
            grid-template-columns: 1fr;
          }

          .addRow {
            grid-template-columns: 1fr;
          }

          .addRow input {
            margin-bottom: 8px;
          }

          .assignment {
            grid-template-columns: 1fr;
          }

          .beerRequest {
            flex-direction: column;
            align-items: stretch;
          }

          .requestButtons {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .settingsGrid {
            grid-template-columns: 1fr;
          }

          .sectionTitle {
            flex-direction: column;
          }

          .eventActions {
            width: 100%;
            justify-content: stretch;
          }

          .eventActions button {
            flex: 1;
          }

          .inviteBox {
            flex-wrap: wrap;
          }

          .inviteBox strong {
            flex-basis: 100%;
          }

          .rankItem {
            grid-template-columns: 38px 1fr auto;
          }

          .glass {
            font-size: 65px;
          }

          .leftGlass {
            left: 10%;
          }

          .rightGlass {
            right: 10%;
          }
        }

        @media (max-width: 430px) {
          h1 {
            font-size: 20px;
          }

          .logoBox {
            width: 54px;
            height: 54px;
            font-size: 28px;
          }

          .card {
            padding: 15px;
            border-radius: 18px;
          }

          .stat {
            padding: 12px 5px;
          }

          .stat strong {
            font-size: 17px;
          }

          .stat small {
            font-size: 10px;
          }

          .personBigStats {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
      `}</style>
    </main>
  );
}
