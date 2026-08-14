"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
};

type Event = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  invite_code: string;
  start_date?: string | null;
  end_date?: string | null;
  created_by?: string | null;
  is_active?: boolean;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  role: string;
  joined_at?: string;
  profile: Profile;
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

type Payment = {
  id: string;
  event_id: string;
  betrag: number;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status: string;
  created_at?: string;
  payer?: Profile | null;
};

type DrinkHistory = {
  id: string;
  event_id: string;
  profile_id: string;
  drink_id?: string | null;
  drink_name: string;
  liters: number;
  alcohol_percent: number;
  price: number;
  consumed_at: string;
  profile?: Profile | null;
};

type PointHistory = {
  id: string;
  event_id: string;
  profile_id: string;
  points: number;
  reason: string;
  reference_type?: string | null;
  created_at: string;
};

type Challenge = {
  id: string;
  event_id: string;
  title: string;
  description?: string | null;
  points: number;
  category?: string | null;
  status?: string | null;
  created_by_profile_id?: string | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  is_active?: boolean;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  target_profile_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  requester?: Profile | null;
  target?: Profile | null;
};

type CrateDonation = {
  id: string;
  event_id: string;
  profile_id: string;
  crates: number;
  points_awarded: number;
  created_at: string;
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

const defaultSettings: EventSettings = {
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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [history, setHistory] = useState<DrinkHistory[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointHistory[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [crateDonations, setCrateDonations] = useState<CrateDonation[]>([]);
  const [settings, setSettings] =
    useState<EventSettings>(defaultSettings);

  const [message, setMessage] = useState("");

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showJoinEvent, setShowJoinEvent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [selectedPerson, setSelectedPerson] =
    useState<Profile | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("2");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPerson, setPaymentPerson] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] =
    useState("");
  const [challengePoints, setChallengePoints] = useState("10");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerMode, setRegisterMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [promilleWeight, setPromilleWeight] = useState("82");
  const [promilleHeight, setPromilleHeight] = useState("182");

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
    }
  }, [eventId]);

  async function checkUser() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUser(session?.user ?? null);

    if (session?.user) {
      await loadProfile(session.user.id);
      await loadEvents();
    }

    setLoading(false);
  }

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id,name,email,avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
    }
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEvents(data as Event[]);

      if (!eventId && data.length > 0) {
        setEventId(data[0].id);
      }
    }
  }

  async function loadEventData(id: string) {
    await Promise.all([
      loadMembers(id),
      loadDrinks(id),
      loadPayments(id),
      loadHistory(id),
      loadPointsHistory(id),
      loadChallenges(id),
      loadBeerRequests(id),
      loadCrates(id),
      loadSettings(id),
    ]);
  }

  async function loadMembers(id: string) {
    const { data } = await supabase
      .from("event_members")
      .select(
        `
        id,
        event_id,
        profile_id,
        role,
        joined_at,
        profile:profiles!event_members_profile_id_fkey(
          id,
          name,
          email,
          avatar_url
        )
      `
      )
      .eq("event_id", id);

    if (data) {
      const normalized: EventMember[] = data.map((row: any) => ({
        id: row.id,
        event_id: row.event_id,
        profile_id: row.profile_id,
        role: row.role,
        joined_at: row.joined_at,
        profile: Array.isArray(row.profile)
          ? row.profile[0] ?? {
              id: row.profile_id,
              name: "Unbekannt",
            }
          : row.profile ?? {
              id: row.profile_id,
              name: "Unbekannt",
            },
      }));

      setMembers(normalized);
    }
  }

  async function loadDrinks(id: string) {
    const { data } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (data) setDrinks(data as Drink[]);
  }

  async function loadPayments(id: string) {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (!data) return;

    const profileIds = [
      ...new Set(
        data
          .map((p: any) => p.bezahlt_von || p.profile_id)
          .filter(Boolean)
      ),
    ];

    let profiles: Profile[] = [];

    if (profileIds.length) {
      const result = await supabase
        .from("profiles")
        .select("id,name,email,avatar_url")
        .in("id", profileIds);

      profiles = (result.data ?? []) as Profile[];
    }

    const result: Payment[] = data.map((p: any) => ({
      ...p,
      payer:
        profiles.find(
          (person) =>
            person.id === (p.bezahlt_von || p.profile_id)
        ) ?? null,
    }));

    setPayments(result);
  }

  async function loadHistory(id: string) {
    const { data } = await supabase
      .from("drink_history")
      .select("*")
      .eq("event_id", id)
      .order("consumed_at", { ascending: false });

    if (!data) return;

    const ids = [
      ...new Set(data.map((x: any) => x.profile_id)),
    ];

    let profiles: Profile[] = [];

    if (ids.length) {
      const result = await supabase
        .from("profiles")
        .select("id,name,email,avatar_url")
        .in("id", ids);

      profiles = (result.data ?? []) as Profile[];
    }

    setHistory(
      data.map((x: any) => ({
        ...x,
        profile:
          profiles.find((p) => p.id === x.profile_id) ?? null,
      }))
    );
  }

  async function loadPointsHistory(id: string) {
    const { data } = await supabase
      .from("points_history")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (data) setPointsHistory(data as PointHistory[]);
  }

  async function loadChallenges(id: string) {
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (data) setChallenges((data ?? []) as Challenge[]);
  }

  async function loadBeerRequests(id: string) {
    const { data } = await supabase
      .from("beer_requests")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (!data) return;

    const ids = [
      ...new Set(
        data.flatMap((x: any) => [
          x.requester_profile_id,
          x.target_profile_id,
        ])
      ),
    ];

    const result = await supabase
      .from("profiles")
      .select("id,name,email,avatar_url")
      .in("id", ids);

    const profiles = (result.data ?? []) as Profile[];

    setBeerRequests(
      data.map((x: any) => ({
        ...x,
        requester:
          profiles.find(
            (p) => p.id === x.requester_profile_id
          ) ?? null,
        target:
          profiles.find(
            (p) => p.id === x.target_profile_id
          ) ?? null,
      }))
    );
  }

  async function loadCrates(id: string) {
    const { data } = await supabase
      .from("crate_donations")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (data) setCrateDonations(data as CrateDonation[]);
  }

  async function loadSettings(id: string) {
    const { data } = await supabase
      .from("event_settings")
      .select("*")
      .eq("event_id", id)
      .maybeSingle();

    if (data) {
      setSettings({
        ...defaultSettings,
        ...(data as EventSettings),
      });
    } else {
      setSettings(defaultSettings);
    }
  }

  async function register() {
    setMessage("");

    if (!loginEmail || !loginPassword) {
      setMessage("❌ E-Mail und Passwort eingeben.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: loginEmail,
      password: loginPassword,
      options: {
        data: {
          name: loginEmail.split("@")[0],
        },
      },
    });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setMessage(
      "✅ Registrierung erfolgreich. Bitte E-Mail bestätigen, falls erforderlich."
    );
  }

  async function login() {
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setMessage("✅ Erfolgreich angemeldet.");
  }

  async function logout() {
    await supabase.auth.signOut();
    setEvents([]);
    setEventId("");
    setProfile(null);
    setUser(null);
  }

  async function createEvent() {
    if (!eventTitle.trim()) {
      setMessage("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    const { data, error } = await supabase.rpc("create_event", {
      p_title: eventTitle.trim(),
      p_description: eventDescription || null,
      p_location: eventLocation || null,
    });

    if (error) {
      setMessage("❌ Event konnte nicht erstellt werden: " + error.message);
      return;
    }

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setShowCreateEvent(false);

    await loadEvents();

    if (data) setEventId(data);

    setMessage("✅ Event erfolgreich erstellt.");
  }

  async function joinEvent() {
    if (!inviteCodeInput.trim()) {
      setMessage("❌ Einladungscode eingeben.");
      return;
    }

    const { data, error } = await supabase.rpc("join_event", {
      p_invite_code: inviteCodeInput.trim(),
    });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    await loadEvents();

    if (data) setEventId(data);

    setInviteCodeInput("");
    setShowJoinEvent(false);

    setMessage("✅ Event erfolgreich beigetreten.");
  }

  async function deleteEvent() {
    if (!eventId) return;

    if (
      !window.confirm(
        "Dieses Event wirklich löschen? Alle Eventdaten werden gelöscht."
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setEventId("");
    await loadEvents();
    setMessage("✅ Event gelöscht.");
  }

  async function saveDrink() {
    if (!eventId || !drinkName.trim()) {
      setMessage("❌ Getränk und Event auswählen.");
      return;
    }

    const l = Number(liters) || 0;
    const a = Number(alcohol) || 0;
    const p = Number(price) || 0;

    const { data, error } = await supabase
      .from("drinks")
      .insert({
        event_id: eventId,
        getraenk: drinkName.trim(),
        drink_name: drinkName.trim(),
        menge: l,
        liters: l,
        alkohol: a,
        alcohol_percent: a,
        preis: p,
        quantity: 1,
      })
      .select()
      .single();

    if (error) {
      setMessage("❌ Getränk konnte nicht gespeichert werden: " + error.message);
      return;
    }

    setDrinks([data as Drink, ...drinks]);

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("2");

    setMessage("✅ Getränk gespeichert.");
  }

  async function assignDrink(member: EventMember, drink: Drink) {
    if (!profile) return;

    const litersValue =
      Number(drink.liters ?? drink.menge ?? 0) || 0;

    const alcoholValue =
      Number(
        drink.alcohol_percent ?? drink.alkohol ?? 0
      ) || 0;

    const priceValue =
      Number(drink.preis ?? 0) || 0;

    const { error } = await supabase
      .from("drink_history")
      .insert({
        event_id: eventId,
        profile_id: member.profile_id,
        drink_id: drink.id,
        drink_name:
          drink.getraenk ||
          drink.drink_name ||
          "Getränk",
        liters: litersValue,
        alcohol_percent: alcoholValue,
        price: priceValue,
      });

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    const points = 10;

    await supabase.from("points_history").insert({
      event_id: eventId,
      profile_id: member.profile_id,
      points,
      reason: `Getränk: ${
        drink.getraenk || drink.drink_name || "Getränk"
      }`,
      reference_type: "drink",
      reference_id: drink.id,
    });

    await loadHistory(eventId);
    await loadPointsHistory(eventId);

    setMessage(
      `🍺 ${drink.getraenk || drink.drink_name} wurde ${member.profile.name} zugeordnet. +${points} Punkte`
    );
  }

  async function savePayment() {
    if (!paymentAmount || !paymentPerson) {
      setMessage("❌ Betrag und Person auswählen.");
      return;
    }

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      setMessage("❌ Ungültiger Betrag.");
      return;
    }

    const { error } = await supabase.from("payments").insert({
      event_id: eventId,
      betrag: amount,
      bezahlt_von: paymentPerson,
      profile_id: paymentPerson,
      status: "paid",
    });

    if (error) {
      setMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setPaymentAmount("");
    setPaymentPerson("");
    setShowPaymentForm(false);

    await loadPayments(eventId);

    setMessage("✅ Zahlung gespeichert.");
  }

  async function createChallenge() {
    if (!challengeTitle.trim()) {
      setMessage("❌ Challenge-Titel eingeben.");
      return;
    }

    if (!profile) return;

    const { error } = await supabase.from("challenges").insert({
      event_id: eventId,
      title: challengeTitle.trim(),
      description: challengeDescription.trim(),
      points: Number(challengePoints) || 0,
      category: "fun",
      status: "open",
      created_by_profile_id: profile.id,
      is_active: true,
    });

    if (error) {
      setMessage(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");
    setShowChallengeForm(false);

    await loadChallenges(eventId);

    setMessage("🏆 Challenge erstellt.");
  }

  async function sendBeerRequest() {
    if (!profile || !eventId) return;

    const targets = members.filter(
      (m) => m.profile_id !== profile.id
    );

    if (!targets.length) {
      setMessage("❌ Keine weiteren Teilnehmer im Event.");
      return;
    }

    for (const member of targets) {
      await supabase.from("beer_requests").insert({
        event_id: eventId,
        requester_profile_id: profile.id,
        target_profile_id: member.profile_id,
        status: "pending",
      });
    }

    await loadBeerRequests(eventId);

    setMessage(
      `🍺 ${targets.length} Teilnehmer wurden benachrichtigt.`
    );
  }

  async function respondBeerRequest(
    request: BeerRequest,
    status: "accepted" | "declined"
  ) {
    const { error } = await supabase
      .from("beer_requests")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    await loadBeerRequests(eventId);

    if (status === "accepted") {
      setMessage("🍺 Bier angenommen!");
    } else {
      setMessage("❌ Bier-Anfrage abgelehnt.");
    }
  }

  async function donateCrate() {
    if (!profile) return;

    const { error } = await supabase
      .from("crate_donations")
      .insert({
        event_id: eventId,
        profile_id: profile.id,
        crates: 1,
        points_awarded: 20,
      });

    if (error) {
      setMessage(
        "❌ Kiste konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    await supabase.from("points_history").insert({
      event_id: eventId,
      profile_id: profile.id,
      points: 20,
      reason: "🍺 Kiste Bier spendiert",
      reference_type: "crate",
    });

    await loadCrates(eventId);
    await loadPointsHistory(eventId);

    setMessage("🍺🍺🍺 Kiste Bier spendiert! +20 Punkte");
  }

  async function saveSettings() {
    if (!eventId) return;

    const values = Object.values(settings);

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
        p_show_challenge_points: settings.show_challenge_points,
        p_show_beer_button: settings.show_beer_button,
        p_show_beer_requests: settings.show_beer_requests,
        p_show_crate_button: settings.show_crate_button,
        p_show_profiles: settings.show_profiles,
        p_show_photos: settings.show_photos,
        p_show_who_paid: settings.show_who_paid,
        p_show_who_owes: settings.show_who_owes,
      }
    );

    if (error) {
      setMessage("❌ Einstellungen konnten nicht gespeichert werden: " + error.message);
      return;
    }

    setShowSettings(false);
    setMessage("✅ Event-Einstellungen gespeichert.");
  }

  const currentEvent = events.find((e) => e.id === eventId);

  const isAdmin =
    !!profile &&
    !!currentEvent &&
    (
      currentEvent.created_by === profile.id ||
      members.some(
        (m) =>
          m.profile_id === profile.id &&
          m.role === "admin"
      )
    );

  const totalLiters = history.reduce(
    (sum, h) => sum + Number(h.liters || 0),
    0
  );

  const totalCost = drinks.reduce(
    (sum, d) =>
      sum + Number(d.preis || 0) * Number(d.quantity || 1),
    0
  );

  const totalPaid = payments.reduce(
    (sum, p) => sum + Number(p.betrag || 0),
    0
  );

  const memberCosts = useMemo(() => {
    const result: Record<string, number> = {};

    members.forEach((member) => {
      result[member.profile_id] = 0;
    });

    history.forEach((h) => {
      result[h.profile_id] =
        (result[h.profile_id] || 0) +
        Number(h.price || 0);
    });

    return result;
  }, [members, history]);

  const ranking = useMemo(() => {
    return members
      .map((member) => {
        const points = pointsHistory
          .filter(
            (p) => p.profile_id === member.profile_id
          )
          .reduce(
            (sum, p) => sum + Number(p.points || 0),
            0
          );

        return {
          ...member,
          points,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [members, pointsHistory]);

  const incomingBeerRequests = beerRequests.filter(
    (r) =>
      r.target_profile_id === profile?.id &&
      r.status === "pending"
  );

  const outgoingBeerRequests = beerRequests.filter(
    (r) =>
      r.requester_profile_id === profile?.id
  );

  const pendingOwed = Math.max(totalCost - totalPaid, 0);

  const userPaid = profile
    ? payments
        .filter(
          (p) =>
            (p.bezahlt_von || p.profile_id) ===
            profile.id
        )
        .reduce(
          (sum, p) => sum + Number(p.betrag || 0),
          0
        )
    : 0;

  const userCost =
    profile && memberCosts[profile.id]
      ? memberCosts[profile.id]
      : 0;

  const userOwes = Math.max(userCost - userPaid, 0);

  const calculatePromille = (memberId: string) => {
    const personHistory = history.filter(
      (h) => h.profile_id === memberId
    );

    const gramsAlcohol = personHistory.reduce(
      (sum, h) =>
        sum +
        Number(h.liters || 0) *
          (Number(h.alcohol_percent || 0) / 100) *
          789,
      0
    );

    const weight =
      Number(promilleWeight) > 0
        ? Number(promilleWeight)
        : 82;

    const promille =
      gramsAlcohol /
      (weight * 0.68);

    return Math.max(promille, 0);
  };

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          🍻
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>Wird geladen...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="authCard">
          <div className="bigBeer">🍻</div>

          <h1>Güstener Zapfhahn Zentrale</h1>

          <p>
            Melde dich an, um Events zu erstellen,
            Einladungen zu erhalten und mit deinen
            Freunden Punkte zu sammeln.
          </p>

          <input
            type="email"
            placeholder="E-Mail"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Passwort"
            value={loginPassword}
            onChange={(e) =>
              setLoginPassword(e.target.value)
            }
          />

          <button
            className="primary full"
            onClick={registerMode ? register : login}
          >
            {registerMode
              ? "👤 Konto erstellen"
              : "🔐 Anmelden"}
          </button>

          <button
            className="secondary full"
            onClick={() =>
              setRegisterMode(!registerMode)
            }
          >
            {registerMode
              ? "Bereits registriert? Anmelden"
              : "Noch kein Konto? Registrieren"}
          </button>

          {message && (
            <div className="message">
              {message}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">

        <header className="header">
          <div className="logo">🍻</div>

          <div className="headerText">
            <h1>Güstener Zapfhahn Zentrale</h1>
            <p>
              Events · Getränke · Punkte · Challenges
            </p>
          </div>

          <button
            className="logout"
            onClick={logout}
          >
            Abmelden
          </button>
        </header>

        <section className="card account">
          <div>
            <small>Angemeldet als</small>
            <strong>
              👤 {profile?.name || user.email}
            </strong>
          </div>

          <div className="adminBadge">
            👑 ADMIN
          </div>
        </section>

        <section className="card">
          <div className="sectionTop">
            <div>
              <h2>📅 Aktuelles Event</h2>
              <p>
                {currentEvent?.location ||
                  "Wähle ein Event"}
              </p>
            </div>

            <div className="topActions">
              <button
                className="secondary"
                onClick={() =>
                  setShowCreateEvent(!showCreateEvent)
                }
              >
                ➕ Neues Event
              </button>

              <button
                className="secondary"
                onClick={() =>
                  setShowJoinEvent(!showJoinEvent)
                }
              >
                🔑 Beitreten
              </button>

              {isAdmin && (
                <button
                  className="secondary"
                  onClick={() =>
                    setShowSettings(!showSettings)
                  }
                >
                  ⚙️ Einstellungen
                </button>
              )}

              {isAdmin && currentEvent && (
                <button
                  className="danger"
                  onClick={deleteEvent}
                >
                  🗑️ Löschen
                </button>
              )}
            </div>
          </div>

          {events.length > 0 ? (
            <select
              value={eventId}
              onChange={(e) =>
                setEventId(e.target.value)
              }
            >
              {events.map((event) => (
                <option
                  key={event.id}
                  value={event.id}
                >
                  {event.title}
                  {event.created_by === profile?.id
                    ? " 👑"
                    : ""}
                </option>
              ))}
            </select>
          ) : (
            <p>Noch keine Events vorhanden.</p>
          )}

          {currentEvent && (
            <div className="invite">
              <span>🔑 Einladungscode</span>
              <strong>
                {currentEvent.invite_code}
              </strong>
            </div>
          )}

          {showCreateEvent && (
            <div className="formBox">
              <h3>➕ Neues Event erstellen</h3>

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
                  setEventDescription(e.target.value)
                }
              />

              <input
                placeholder="Ort"
                value={eventLocation}
                onChange={(e) =>
                  setEventLocation(e.target.value)
                }
              />

              <button
                className="primary"
                onClick={createEvent}
              >
                🍻 Event erstellen
              </button>
            </div>
          )}

          {showJoinEvent && (
            <div className="formBox">
              <h3>🔑 Event beitreten</h3>

              <input
                placeholder="XXXX-XXXX"
                value={inviteCodeInput}
                onChange={(e) =>
                  setInviteCodeInput(
                    e.target.value.toUpperCase()
                  )
                }
              />

              <button
                className="primary"
                onClick={joinEvent}
              >
                🚪 Event beitreten
              </button>
            </div>
          )}
        </section>

        {isAdmin && showSettings && (
          <section className="card settingsCard">
            <h2>⚙️ Event-Einstellungen</h2>
            <p>
              Als Event-Admin bestimmst du, welche
              Bereiche und Buttons sichtbar sind.
            </p>

            <div className="settingsGrid">
              {(
                Object.keys(settings) as Array<
                  keyof EventSettings
                >
              ).map((key) => (
                <label
                  className="setting"
                  key={key}
                >
                  <span>
                    {key
                      .replaceAll("_", " ")
                      .replace("show ", "")
                      .replace(
                        "show ",
                        ""
                      )}
                  </span>

                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        [key]: e.target.checked,
                      })
                    }
                  />
                </label>
              ))}
            </div>

            <button
              className="primary full"
              onClick={saveSettings}
            >
              💾 Einstellungen speichern
            </button>
          </section>
        )}

        {settings.show_statistics && (
          <div className="stats">
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
              <small>Getränkekosten</small>
            </div>

            <div className="stat">
              <span>👥</span>
              <b>{members.length}</b>
              <small>Teilnehmer</small>
            </div>
          </div>
        )}

        {(settings.show_beer_button ||
          settings.show_crate_button) && (
          <section className="actionsCard">

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
                <span>🍺🍺🍺</span>
                <strong>KISTE BIER SPENDIEREN</strong>
                <small>
                  +20 Punkte für dich
                </small>
              </button>
            )}
          </section>
        )}

        {settings.show_beer_requests && (
          <section className="card">
            <div className="sectionTop">
              <h2>🔔 Bier-Anfragen</h2>

              {incomingBeerRequests.length > 0 && (
                <span className="notification">
                  {incomingBeerRequests.length}
                </span>
              )}
            </div>

            {incomingBeerRequests.length === 0 ? (
              <p>
                Keine neuen Bier-Anfragen.
              </p>
            ) : (
              incomingBeerRequests.map((request) => (
                <div
                  className="beerRequest"
                  key={request.id}
                >
                  <div>
                    <strong>
                      🍺{" "}
                      {request.requester?.name ||
                        "Jemand"}
                    </strong>
                    <span>
                      möchte ein Bier mit dir trinken.
                    </span>
                  </div>

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
                      ✅ Zugesagt
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
                </div>
              ))
            )}

            {outgoingBeerRequests.length > 0 && (
              <div className="requestList">
                {outgoingBeerRequests.map((r) => (
                  <div
                    className="miniRequest"
                    key={r.id}
                  >
                    🍺 {r.target?.name || "Teilnehmer"}
                    {" · "}
                    {r.status === "pending"
                      ? "⏳ wartet"
                      : r.status === "accepted"
                      ? "✅ zugesagt"
                      : "❌ abgelehnt"}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {settings.show_participants && (
          <section className="card">
            <h2>🍻 Teilnehmer</h2>

            {members.map((member) => {
              const points =
                ranking.find(
                  (r) =>
                    r.profile_id ===
                    member.profile_id
                )?.points || 0;

              const drinksCount =
                history.filter(
                  (h) =>
                    h.profile_id ===
                    member.profile_id
                ).length;

              const liters =
                history
                  .filter(
                    (h) =>
                      h.profile_id ===
                      member.profile_id
                  )
                  .reduce(
                    (sum, h) =>
                      sum +
                      Number(h.liters || 0),
                    0
                  );

              return (
                <div
                  className="personCard"
                  key={member.id}
                  onClick={() =>
                    setSelectedPerson(member.profile)
                  }
                >
                  <div className="avatar">
                    👤
                  </div>

                  <div className="personMain">
                    <strong>
                      {member.profile.name}
                    </strong>

                    <small>
                      🍺 {drinksCount}
                      {" · "}
                      💧 {liters.toFixed(1)} L
                      {" · "}
                      🏆 {points}
                    </small>
                  </div>

                  <div className="personArrow">
                    →
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {settings.show_profiles &&
          selectedPerson && (
            <section className="card profileDetail">
              <div className="sectionTop">
                <h2>
                  👤 {selectedPerson.name}
                </h2>

                <button
                  className="secondary"
                  onClick={() =>
                    setSelectedPerson(null)
                  }
                >
                  Schließen
                </button>
              </div>

              <div className="detailStats">
                <div>
                  <b>
                    {
                      ranking.find(
                        (r) =>
                          r.profile_id ===
                          selectedPerson.id
                      )?.points || 0
                    }
                  </b>
                  <small>Punkte</small>
                </div>

                <div>
                  <b>
                    {
                      history.filter(
                        (h) =>
                          h.profile_id ===
                          selectedPerson.id
                      ).length
                    }
                  </b>
                  <small>Getränke</small>
                </div>

                <div>
                  <b>
                    {calculatePromille(
                      selectedPerson.id
                    ).toFixed(2)}
                  </b>
                  <small>‰</small>
                </div>
              </div>

              <h3>🏆 Punkte-Historie</h3>

              {pointsHistory.filter(
                (p) =>
                  p.profile_id ===
                  selectedPerson.id
              ).length === 0 ? (
                <p>Noch keine Punkte.</p>
              ) : (
                pointsHistory
                  .filter(
                    (p) =>
                      p.profile_id ===
                      selectedPerson.id
                  )
                  .map((p) => (
                    <div
                      className="historyRow"
                      key={p.id}
                    >
                      <span>{p.reason}</span>
                      <strong>
                        +{p.points}
                      </strong>
                    </div>
                  ))
              )}

              <h3>🍺 Getränke</h3>

              {history
                .filter(
                  (h) =>
                    h.profile_id ===
                    selectedPerson.id
                )
                .map((h) => (
                  <div
                    className="historyRow"
                    key={h.id}
                  >
                    <span>
                      🍺 {h.drink_name}
                      <small>
                        {" "}
                        ·{" "}
                        {new Date(
                          h.consumed_at
                        ).toLocaleString("de-DE")}
                      </small>
                    </span>

                    <strong>
                      {Number(h.liters).toFixed(1)} L
                    </strong>
                  </div>
                ))}
            </section>
          )}

        {settings.show_drinks && (
          <section className="card">
            <h2>🍺 Getränk hinzufügen</h2>

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
                value={liters}
                onChange={(e) =>
                  setLiters(e.target.value)
                }
                placeholder="Liter"
              />

              <input
                type="number"
                value={alcohol}
                onChange={(e) =>
                  setAlcohol(e.target.value)
                }
                placeholder="Alkohol %"
              />

              <input
                type="number"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
                placeholder="Preis €"
              />
            </div>

            <button
              className="primary full"
              onClick={saveDrink}
            >
              🍻 Getränk speichern
            </button>
          </section>
        )}

        {settings.show_drinks && (
          <section className="card">
            <h2>🔗 Getränk zuordnen</h2>

            {members.map((member) => (
              <div
                className="assignment"
                key={member.id}
              >
                <strong>
                  {member.profile.name}
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
                        member,
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
                        "Getränk"}
                      {" · "}
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
            <h2>🍺 Getränke</h2>

            {drinks.map((drink) => (
              <div
                className="drinkRow"
                key={drink.id}
              >
                <div>
                  <strong>
                    🍺{" "}
                    {drink.getraenk ||
                      drink.drink_name ||
                      "Getränk"}
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
            ))}
          </section>
        )}

        {settings.show_drink_history && (
          <section className="card">
            <div className="sectionTop">
              <h2>🕒 Getränkeverlauf</h2>

              <button
                className="secondary"
                onClick={() =>
                  setShowHistory(!showHistory)
                }
              >
                {showHistory
                  ? "Ausblenden"
                  : "Anzeigen"}
              </button>
            </div>

            {showHistory && (
              <>
                {history.length === 0 ? (
                  <p>
                    Noch kein Getränk zugeordnet.
                  </p>
                ) : (
                  history.map((item) => (
                    <div
                      className="historyRow"
                      key={item.id}
                    >
                      <div>
                        <strong>
                          🍺 {item.drink_name}
                        </strong>

                        <small>
                          {item.profile?.name ||
                            "Unbekannt"}
                          {" · "}
                          {new Date(
                            item.consumed_at
                          ).toLocaleString(
                            "de-DE"
                          )}
                        </small>
                      </div>

                      <strong>
                        {Number(
                          item.liters
                        ).toFixed(1)}{" "}
                        L
                      </strong>
                    </div>
                  ))
                )}
              </>
            )}
          </section>
        )}

        {settings.show_payments && (
          <section className="card">
            <div className="sectionTop">
              <h2>💶 Zahlungen</h2>

              <button
                className="secondary"
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
                      key={member.profile_id}
                      value={
                        member.profile_id
                      }
                    >
                      {member.profile.name}
                    </option>
                  ))}
                </select>

                <button
                  className="primary"
                  onClick={savePayment}
                >
                  💶 Zahlung speichern
                </button>
              </div>
            )}

            <div className="paymentSummary">
              <div>
                <span>💰 Gesamt bezahlt</span>
                <strong>
                  {totalPaid.toFixed(2)} €
                </strong>
              </div>

              <div>
                <span>⚠️ Noch offen</span>
                <strong>
                  {pendingOwed.toFixed(2)} €
                </strong>
              </div>
            </div>

            {payments.map((payment) => (
              <div
                className="paymentRow"
                key={payment.id}
              >
                <div>
                  <strong>
                    💶{" "}
                    {settings.show_who_paid
                      ? payment.payer?.name ||
                        "Unbekannt"
                      : "Zahlung"}
                  </strong>

                  <small>
                    {payment.status === "paid"
                      ? "Bezahlt"
                      : payment.status}
                    {" · "}
                    {new Date(
                      payment.created_at ||
                        Date.now()
                    ).toLocaleString(
                      "de-DE"
                    )}
                  </small>
                </div>

                <strong>
                  {Number(
                    payment.betrag
                  ).toFixed(2)} €
                </strong>
              </div>
            ))}

            {settings.show_who_owes && (
              <div className="debtBox">
                <h3>💳 Wer muss noch bezahlen?</h3>

                {members.map((member) => {
                  const paid = payments
                    .filter(
                      (p) =>
                        (p.bezahlt_von ||
                          p.profile_id) ===
                        member.profile_id
                    )
                    .reduce(
                      (sum, p) =>
                        sum +
                        Number(
                          p.betrag || 0
                        ),
                      0
                    );

                  const cost =
                    memberCosts[
                      member.profile_id
                    ] || 0;

                  const owes = Math.max(
                    cost - paid,
                    0
                  );

                  return (
                    <div
                      className="debtRow"
                      key={member.profile_id}
                    >
                      <span>
                        👤 {member.profile.name}
                      </span>

                      <strong
                        className={
                          owes > 0
                            ? "redText"
                            : "greenText"
                        }
                      >
                        {owes > 0
                          ? `${owes.toFixed(
                              2
                            )} € offen`
                          : "✅ ausgeglichen"}
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {settings.show_challenges && (
          <section className="card">
            <div className="sectionTop">
              <h2>🏆 Challenges</h2>

              <button
                className="secondary"
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
                  className="primary"
                  onClick={createChallenge}
                >
                  🏆 Challenge erstellen
                </button>
              </div>
            )}

            {challenges.length === 0 ? (
              <p>
                Noch keine Challenges vorhanden.
              </p>
            ) : (
              challenges.map((challenge) => (
                <div
                  className="challenge"
                  key={challenge.id}
                >
                  <div className="challengeIcon">
                    🏆
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

                  {settings.show_challenge_points && (
                    <b>
                      +{challenge.points}
                    </b>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {settings.show_ranking && (
          <section className="card">
            <h2>🏆 Rangliste</h2>

            <p>
              Tippe auf eine Person, um zu sehen,
              wofür sie Punkte bekommen hat.
            </p>

            {ranking.map((member, index) => (
              <div
                className="rank"
                key={member.profile_id}
                onClick={() =>
                  setSelectedPerson(
                    member.profile
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
                  {member.profile.name}
                </span>

                <b>
                  {member.points} Punkte
                </b>
              </div>
            ))}
          </section>
        )}

        {settings.show_promille && (
          <section className="card promilleCard">
            <h2>🍺 Promille-Anzeige</h2>

            <div className="three">
              <input
                type="number"
                value={promilleWeight}
                onChange={(e) =>
                  setPromilleWeight(
                    e.target.value
                  )
                }
                placeholder="Gewicht kg"
              />

              <input
                type="number"
                value={promilleHeight}
                onChange={(e) =>
                  setPromilleHeight(
                    e.target.value
                  )
                }
                placeholder="Größe cm"
              />
            </div>

            {members.map((member) => (
              <div
                className="promilleRow"
                key={member.profile_id}
              >
                <span>
                  👤 {member.profile.name}
                </span>

                <strong>
                  {calculatePromille(
                    member.profile_id
                  ).toFixed(2)}{" "}
                  ‰
                </strong>
              </div>
            ))}

            <small>
              Die Anzeige ist nur eine grobe
              rechnerische Schätzung und kein
              verlässlicher Wert für Fahrtüchtigkeit.
            </small>
          </section>
        )}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <footer>
          🍻 Güstener Zapfhahn Zentrale
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
          padding: 18px;
          background:
            radial-gradient(
              circle at 50% -10%,
              #30475d 0%,
              #101923 35%,
              #070b10 75%
            );
          color: white;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          overflow-x: hidden;
        }

        .container {
          width: 100%;
          max-width: 950px;
          margin: 0 auto;
        }

        .loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .authCard {
          width: 100%;
          max-width: 460px;
          margin: 7vh auto;
          padding: 30px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 28px;
          box-shadow:
            0 25px 70px rgba(0,0,0,.4);
          text-align: center;
        }

        .bigBeer {
          font-size: 70px;
          margin-bottom: 10px;
        }

        h1 {
          margin: 0;
          font-size: 27px;
        }

        h2 {
          margin: 0 0 8px;
        }

        h3 {
          margin-top: 20px;
        }

        p {
          color: #aab6c3;
          line-height: 1.5;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 0 22px;
        }

        .logo {
          font-size: 42px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 20px;
          padding: 10px 14px;
          box-shadow: 0 12px 35px rgba(0,0,0,.25);
        }

        .headerText {
          flex: 1;
        }

        .headerText p {
          margin: 5px 0 0;
        }

        .card,
        .actionsCard {
          width: 100%;
          background: rgba(255,255,255,.065);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 15px;
          box-shadow:
            0 14px 35px rgba(0,0,0,.18);
          backdrop-filter: blur(10px);
        }

        .account {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .account strong,
        .account small {
          display: block;
        }

        .account small {
          color: #8493a3;
          margin-bottom: 4px;
        }

        .adminBadge {
          background: #f59e0b;
          color: #111;
          font-weight: 900;
          padding: 8px 12px;
          border-radius: 12px;
        }

        .sectionTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .topActions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          justify-content: flex-end;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          padding: 17px 10px;
          border-radius: 18px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.07);
          text-align: center;
        }

        .stat span {
          font-size: 25px;
        }

        .stat b,
        .stat small {
          display: block;
        }

        .stat b {
          font-size: 21px;
          margin: 5px 0;
        }

        .stat small {
          color: #8795a4;
        }

        input,
        select {
          width: 100%;
          padding: 14px;
          margin-bottom: 10px;
          border-radius: 13px;
          border: 1px solid #34414f;
          background: #131c25;
          color: white;
          outline: none;
        }

        input:focus,
        select:focus {
          border-color: #f59e0b;
        }

        button {
          border: 0;
          border-radius: 13px;
          padding: 13px 16px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform .15s ease,
            filter .15s ease;
        }

        button:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        .primary {
          background: #f59e0b;
          color: #111;
        }

        .secondary {
          background: #293542;
          color: white;
        }

        .danger {
          background: #7f1d1d;
          color: white;
        }

        .logout {
          background: #202a35;
          color: #cbd5df;
        }

        .full {
          width: 100%;
        }

        .invite {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 13px;
          margin-top: 5px;
          background: rgba(245,158,11,.1);
          border: 1px solid rgba(245,158,11,.25);
          border-radius: 14px;
        }

        .invite strong {
          font-size: 18px;
          letter-spacing: 2px;
          color: #fbbf24;
        }

        .formBox {
          padding: 15px;
          margin-top: 15px;
          background: rgba(0,0,0,.16);
          border-radius: 16px;
        }

        .settingsGrid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 8px;
          margin: 15px 0;
        }

        .setting {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px;
          border-radius: 13px;
          background: rgba(255,255,255,.05);
        }

        .setting input {
          width: 20px;
          height: 20px;
          margin: 0;
          accent-color: #f59e0b;
        }

        .actionsCard {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 14px;
        }

        .beerButton,
        .crateButton {
          min-height: 145px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          color: white;
        }

        .beerButton {
          background:
            linear-gradient(
              145deg,
              #ef4444,
              #991b1b
            );
          box-shadow:
            0 15px 35px rgba(220,38,38,.25);
          animation: beerPulse 2.2s infinite;
        }

        .beerIcon {
          font-size: 48px;
        }

        .beerButton strong {
          font-size: 26px;
        }

        .crateButton {
          background:
            linear-gradient(
              145deg,
              #f59e0b,
              #b45309
            );
          color: #111;
        }

        .crateButton span {
          font-size: 35px;
        }

        .crateButton strong {
          font-size: 17px;
        }

        @keyframes beerPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.025);
          }
        }

        .beerRequest {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: rgba(255,255,255,.05);
          border-radius: 15px;
          margin-top: 9px;
        }

        .beerRequest strong,
        .beerRequest span {
          display: block;
        }

        .beerRequest span {
          color: #9da9b6;
          margin-top: 4px;
        }

        .requestActions {
          display: flex;
          gap: 7px;
        }

        .accept {
          background: #166534;
          color: white;
        }

        .decline {
          background: #7f1d1d;
          color: white;
        }

        .notification {
          background: #ef4444;
          padding: 6px 10px;
          border-radius: 20px;
          font-weight: bold;
        }

        .miniRequest,
        .historyRow,
        .paymentRow,
        .drinkRow,
        .debtRow,
        .promilleRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 12px;
          margin-top: 8px;
          border-radius: 13px;
          background: rgba(255,255,255,.045);
        }

        .historyRow small,
        .drinkRow small,
        .paymentRow small {
          display: block;
          color: #8997a6;
          margin-top: 4px;
        }

        .personCard {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 15px;
          background: rgba(255,255,255,.05);
          cursor: pointer;
        }

        .personCard:hover {
          background: rgba(255,255,255,.09);
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #253241;
          font-size: 23px;
        }

        .personMain {
          flex: 1;
        }

        .personMain strong,
        .personMain small {
          display: block;
        }

        .personMain small {
          color: #8d9aaa;
          margin-top: 4px;
        }

        .personArrow {
          color: #738293;
          font-size: 24px;
        }

        .assignment {
          display: grid;
          grid-template-columns:
            1fr 2fr;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
        }

        .assignment select {
          margin: 0;
        }

        .paymentSummary {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 10px;
          margin: 12px 0;
        }

        .paymentSummary div {
          padding: 14px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .paymentSummary span,
        .paymentSummary strong {
          display: block;
        }

        .paymentSummary strong {
          font-size: 21px;
          margin-top: 5px;
        }

        .debtBox {
          margin-top: 15px;
          padding: 13px;
          background: rgba(0,0,0,.12);
          border-radius: 15px;
        }

        .redText {
          color: #f87171;
        }

        .greenText {
          color: #4ade80;
        }

        .challenge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          margin-top: 8px;
          border-radius: 15px;
          background: rgba(255,255,255,.05);
        }

        .challengeIcon {
          font-size: 28px;
        }

        .challenge div:nth-child(2) {
          flex: 1;
        }

        .challenge small {
          display: block;
          color: #8997a6;
          margin-top: 4px;
        }

        .rank {
          display: grid;
          grid-template-columns:
            50px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 14px;
          margin-top: 8px;
          border-radius: 15px;
          background: rgba(255,255,255,.05);
          cursor: pointer;
        }

        .rank:hover {
          background: rgba(255,255,255,.09);
        }

        .rank strong:first-child {
          font-size: 25px;
        }

        .detailStats {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 10px;
        }

        .detailStats div {
          padding: 15px;
          text-align: center;
          background: rgba(255,255,255,.05);
          border-radius: 14px;
        }

        .detailStats b,
        .detailStats small {
          display: block;
        }

        .detailStats b {
          font-size: 22px;
        }

        .promilleCard {
          border-color: rgba(245,158,11,.2);
        }

        .message {
          padding: 14px;
          margin-bottom: 15px;
          border-radius: 14px;
          background: #182532;
          border: 1px solid #334454;
          color: #fbbf24;
        }

        footer {
          text-align: center;
          padding: 30px 10px;
          color: #667585;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        @media (max-width: 720px) {
          .page {
            padding: 10px;
          }

          .header {
            align-items: flex-start;
          }

          .headerText h1 {
            font-size: 21px;
          }

          .logout {
            font-size: 11px;
            padding: 9px;
          }

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .actionsCard {
            grid-template-columns: 1fr;
          }

          .settingsGrid {
            grid-template-columns: 1fr;
          }

          .topActions {
            width: 100%;
            justify-content: flex-start;
          }

          .sectionTop {
            align-items: flex-start;
            flex-direction: column;
          }

          .beerRequest {
            flex-direction: column;
            align-items: flex-start;
          }

          .requestActions {
            width: 100%;
          }

          .requestActions button {
            flex: 1;
          }

          .assignment {
            grid-template-columns: 1fr;
          }

          .detailStats {
            grid-template-columns:
              repeat(3, 1fr);
          }

          .account {
            align-items: flex-start;
          }
        }

        @media (max-width: 480px) {
          .stats {
            gap: 7px;
          }

          .stat {
            padding: 12px 5px;
          }

          .stat b {
            font-size: 17px;
          }

          .invite {
            flex-direction: column;
            align-items: flex-start;
          }

          .topActions button {
            flex: 1;
          }

          .paymentSummary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
