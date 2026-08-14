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
  image?: string | null;
  invite_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  created_at?: string;
  created_by?: string | null;

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
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string;
  gender_factor?: number | null;
  joined_via_code?: string | null;
  role?: string | null;
  profile?: Profile | null;
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

type Drink = {
  id: string;
  event_id: string;
  profile_id?: string | null;
  category?: string | null;
  drink_name?: string | null;
  brand?: string | null;
  marke?: string | null;
  getraenk?: string | null;
  liters?: number | null;
  menge?: number | null;
  alcohol_percent?: number | null;
  alkohol?: number | null;
  quantity?: number | null;
  image?: string | null;
  comment?: string | null;
  preis?: number | null;
  foto?: string | null;
  paid_by?: string | null;
  bezahlt_von?: string | null;
  promille_wert?: number | null;
  created_at?: string;
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

type Payment = {
  id: string;
  event_id: string;
  betrag: number;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string;
  created_at?: string;
  payer?: Profile | null;
};

type PointHistory = {
  id: string;
  event_id: string;
  profile_id: string;
  points: number;
  reason: string;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at?: string;
  profile?: Profile | null;
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
  required_votes?: number;
  duration_minutes?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  completed_at?: string | null;
  is_active?: boolean;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status: string;
  message?: string | null;
  created_at: string;
  responded_at?: string | null;
  requester?: Profile | null;
};

type CrateDonation = {
  id: string;
  event_id: string;
  profile_id: string;
  crates: number;
  points_awarded: number;
  created_at: string;
  profile?: Profile | null;
};

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

function getDrinkName(drink: Drink) {
  return (
    drink.drink_name ||
    drink.getraenk ||
    drink.marke ||
    drink.brand ||
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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [drinkHistory, setDrinkHistory] = useState<DrinkHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointHistory[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [crateDonations, setCrateDonations] = useState<CrateDonation[]>([]);

  const [settings, setSettings] =
    useState<EventSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showLogin, setShowLogin] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [selectedRankingProfile, setSelectedRankingProfile] =
    useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] =
    useState("");
  const [newEventLocation, setNewEventLocation] = useState("");

  const [inviteCode, setInviteCode] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPerson, setPaymentPerson] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] =
    useState("");
  const [challengePoints, setChallengePoints] = useState("10");

  const [selectedDrinkPerson, setSelectedDrinkPerson] =
    useState<Record<string, string>>({});

  const [authMode, setAuthMode] =
    useState<"login" | "register">("login");

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setUser(session.user);
      await loadProfile(session.user.id);
      await loadAdminStatus(session.user.id);
      await loadEvents(session.user.id);
    }

    setLoading(false);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
          await loadAdminStatus(session.user.id);
          await loadEvents(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setIsGlobalAdmin(false);
          setEvents([]);
          setEventId("");
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setProfile(data as Profile);
    }
  }

  async function loadAdminStatus(userId: string) {
    const { data } = await supabase.rpc("is_global_admin");

    if (typeof data === "boolean") {
      setIsGlobalAdmin(data);
      return;
    }

    const { data: adminData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const row = adminData as any;

    setIsGlobalAdmin(
      row?.is_global_admin === true ||
        row?.role === "admin" ||
        row?.role === "super_admin"
    );
  }

  async function loadEvents(userId: string) {
    let query = supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isGlobalAdmin) {
      const { data: memberships } = await supabase
        .from("event_members")
        .select("event_id")
        .eq("profile_id", userId);

      const ids =
        memberships?.map((x: any) => x.event_id) ?? [];

      if (ids.length === 0) {
        setEvents([]);
        setEventId("");
        return;
      }

      query = query.in("id", ids);
    }

    const { data, error } = await query;

    if (error) {
      setMessage(
        "❌ Events konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    const loaded = (data ?? []) as Event[];

    setEvents(loaded);

    if (
      loaded.length > 0 &&
      (!eventId || !loaded.some((e) => e.id === eventId))
    ) {
      setEventId(loaded[0].id);
    }
  }

  useEffect(() => {
    if (!eventId) return;
    loadEventData(eventId);
  }, [eventId]);

  async function loadEventData(id: string) {
    await Promise.all([
      loadMembers(id),
      loadDrinks(id),
      loadDrinkHistory(id),
      loadPayments(id),
      loadPointsHistory(id),
      loadChallenges(id),
      loadBeerRequests(id),
      loadCrates(id),
      loadSettings(id),
    ]);
  }

  async function loadMembers(id: string) {
    const { data, error } = await supabase
      .from("event_members")
      .select(`
        id,
        event_id,
        profile_id,
        joined_at,
        gender_factor,
        joined_via_code,
        role,
        profile:profiles (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq("event_id", id);

    if (error) {
      console.error(error);
      return;
    }

    const normalized = (data ?? []).map((row: any) => ({
      ...row,
      profile: Array.isArray(row.profile)
        ? row.profile[0] ?? null
        : row.profile ?? null,
    }));

    setMembers(normalized as EventMember[]);
  }

  async function loadDrinks(id: string) {
    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setDrinks((data ?? []) as Drink[]);
  }

  async function loadDrinkHistory(id: string) {
    const { data, error } = await supabase
      .from("drink_history")
      .select(`
        *,
        profile:profiles (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq("event_id", id)
      .order("consumed_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const normalized = (data ?? []).map((row: any) => ({
      ...row,
      profile: Array.isArray(row.profile)
        ? row.profile[0] ?? null
        : row.profile ?? null,
    }));

    setDrinkHistory(normalized as DrinkHistory[]);
  }

  async function loadPayments(id: string) {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        payer:profiles!payments_bezahlt_von_fkey (
          id,
          name,
          email
        )
      `)
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      const fallback = await supabase
        .from("payments")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });

      if (!fallback.error) {
        setPayments((fallback.data ?? []) as Payment[]);
      }

      return;
    }

    const normalized = (data ?? []).map((row: any) => ({
      ...row,
      payer: Array.isArray(row.payer)
        ? row.payer[0] ?? null
        : row.payer ?? null,
    }));

    setPayments(normalized as Payment[]);
  }

  async function loadPointsHistory(id: string) {
    const { data, error } = await supabase
      .from("points_history")
      .select(`
        *,
        profile:profiles (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const normalized = (data ?? []).map((row: any) => ({
      ...row,
      profile: Array.isArray(row.profile)
        ? row.profile[0] ?? null
        : row.profile ?? null,
    }));

    setPointsHistory(normalized as PointHistory[]);
  }

  async function loadChallenges(id: string) {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setChallenges((data ?? []) as Challenge[]);
  }

  async function loadBeerRequests(id: string) {
    const { data, error } = await supabase
      .from("beer_requests")
      .select(`
        *,
        requester:profiles!beer_requests_requester_profile_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      const fallback = await supabase
        .from("beer_requests")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });

      if (!fallback.error) {
        setBeerRequests(
          (fallback.data ?? []) as BeerRequest[]
        );
      }

      return;
    }

    const normalized = (data ?? []).map((row: any) => ({
      ...row,
      requester: Array.isArray(row.requester)
        ? row.requester[0] ?? null
        : row.requester ?? null,
    }));

    setBeerRequests(normalized as BeerRequest[]);
  }

  async function loadCrates(id: string) {
    const { data, error } = await supabase
      .from("crate_donations")
      .select(`
        *,
        profile:profiles (
          id,
          name
        )
      `)
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const normalized = (data ?? []).map((row: any) => ({
      ...row,
      profile: Array.isArray(row.profile)
        ? row.profile[0] ?? null
        : row.profile ?? null,
    }));

    setCrateDonations(normalized as CrateDonation[]);
  }

  async function loadSettings(id: string) {
    const { data, error } = await supabase
      .from("event_settings")
      .select("*")
      .eq("event_id", id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setSettings({
        ...defaultSettings,
        ...data,
      });
    } else {
      setSettings({
        ...defaultSettings,
        event_id: id,
      });
    }
  }

  async function login() {
    setMessage("");

    if (!email || !password) {
      setMessage("❌ Bitte E-Mail und Passwort eingeben.");
      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setMessage("✅ Erfolgreich angemeldet.");
    setShowLogin(false);
  }

  async function register() {
    setMessage("");

    if (!email || !password) {
      setMessage("❌ Bitte E-Mail und Passwort eingeben.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: email.split("@")[0],
        },
      },
    });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setMessage(
      "✅ Benutzer erstellt. Falls erforderlich, bestätige deine E-Mail-Adresse."
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setEvents([]);
    setEventId("");
  }

  async function createEvent() {
    setMessage("");

    if (!newEventTitle.trim()) {
      setMessage("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    const { data, error } = await supabase.rpc(
      "create_event",
      {
        p_title: newEventTitle.trim(),
        p_description:
          newEventDescription.trim() || null,
        p_location:
          newEventLocation.trim() || null,
      }
    );

    if (error) {
      setMessage("❌ Event konnte nicht erstellt werden: " + error.message);
      return;
    }

    setMessage("✅ Event erfolgreich erstellt.");
    setShowNewEvent(false);
    setNewEventTitle("");
    setNewEventDescription("");
    setNewEventLocation("");

    await loadEvents(user?.id);

    if (data) {
      setEventId(data);
    }
  }

  async function joinEvent() {
    setMessage("");

    if (!inviteCode.trim()) {
      setMessage("❌ Einladungscode eingeben.");
      return;
    }

    const { data, error } = await supabase.rpc(
      "join_event",
      {
        p_invite_code: inviteCode.trim(),
      }
    );

    if (error) {
      setMessage(
        "❌ Event konnte nicht beigetreten werden: " +
          error.message
      );
      return;
    }

    setMessage("✅ Event erfolgreich beigetreten.");
    setInviteCode("");

    await loadEvents(user?.id);

    if (data) {
      setEventId(data);
    }
  }

  async function deleteEvent() {
    if (!eventId) return;

    if (
      !confirm(
        "Möchtest du dieses Event wirklich löschen?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      setMessage("❌ Event konnte nicht gelöscht werden: " + error.message);
      return;
    }

    setMessage("✅ Event gelöscht.");
    setEventId("");

    await loadEvents(user?.id);
  }

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim() && !drinkBrand.trim()) {
      setMessage("❌ Bitte Getränk oder Marke eingeben.");
      return;
    }

    if (!user) {
      setMessage("❌ Bitte anmelden.");
      return;
    }

    const liters = Number(drinkLiters) || 0;
    const alcohol = Number(drinkAlcohol) || 0;
    const price = Number(drinkPrice) || 0;

    const insertData = {
      event_id: eventId,
      profile_id: user.id,
      drink_name:
        drinkName.trim() ||
        drinkBrand.trim() ||
        "Getränk",
      getraenk:
        drinkName.trim() ||
        drinkBrand.trim() ||
        "Getränk",
      brand: drinkBrand.trim() || null,
      marke: drinkBrand.trim() || null,
      liters,
      menge: liters,
      alcohol_percent: alcohol,
      alkohol: alcohol,
      quantity: 1,
      preis: price,
      bezahlt_von: user.id,
    };

    const { error } = await supabase
      .from("drinks")
      .insert(insertData);

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setMessage("✅ Getränk gespeichert.");

    setDrinkName("");
    setDrinkBrand("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");

    await loadDrinks(eventId);
  }

  async function assignDrink(
    personId: string,
    drinkId: string
  ) {
    if (!user || !eventId) return;

    const drink = drinks.find(
      (item) => item.id === drinkId
    );

    if (!drink) return;

    const name = getDrinkName(drink);
    const liters = getDrinkLiters(drink);
    const alcohol = getDrinkAlcohol(drink);
    const price = getDrinkPrice(drink);

    const { error: drinkError } = await supabase
      .from("drinks")
      .update({
        profile_id: personId,
      })
      .eq("id", drinkId);

    if (drinkError) {
      setMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          drinkError.message
      );
      return;
    }

    const { error: historyError } = await supabase
      .from("drink_history")
      .insert({
        event_id: eventId,
        profile_id: personId,
        drink_id: drink.id,
        drink_name: name,
        liters,
        alcohol_percent: alcohol,
        price,
      });

    if (historyError) {
      setMessage(
        "❌ Getränkeverlauf konnte nicht gespeichert werden: " +
          historyError.message
      );
      return;
    }

    await supabase
      .from("points_history")
      .insert({
        event_id: eventId,
        profile_id: personId,
        points: 10,
        reason: `Getränk getrunken: ${name}`,
        reference_type: "drink",
        reference_id: drink.id,
      });

    setMessage(
      "🍺 Getränk zugeordnet! +10 Punkte"
    );

    await Promise.all([
      loadDrinks(eventId),
      loadDrinkHistory(eventId),
      loadPointsHistory(eventId),
    ]);
  }

  async function savePayment() {
    if (!eventId || !user) {
      setMessage("❌ Bitte anmelden und Event auswählen.");
      return;
    }

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      setMessage("❌ Bitte einen gültigen Betrag eingeben.");
      return;
    }

    const payer =
      paymentPerson || user.id;

    const { error } = await supabase
      .from("payments")
      .insert({
        event_id: eventId,
        betrag: amount,
        bezahlt_von: payer,
        profile_id: payer,
        status: "paid",
      });

    if (error) {
      setMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setMessage("✅ Zahlung gespeichert.");
    setPaymentAmount("");
    setPaymentPerson("");

    await loadPayments(eventId);
  }

  async function createChallenge() {
    if (!eventId || !user) {
      setMessage("❌ Bitte anmelden und Event auswählen.");
      return;
    }

    if (!challengeTitle.trim()) {
      setMessage("❌ Bitte Challenge-Namen eingeben.");
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
        created_by_profile_id: user.id,
        is_active: true,
      });

    if (error) {
      setMessage(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setMessage("🏆 Challenge erstellt.");
    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");
    setShowChallengeForm(false);

    await loadChallenges(eventId);
  }

  async function sendBeerRequest() {
    if (!eventId || !user) {
      setMessage("❌ Bitte anmelden.");
      return;
    }

    const targets = members.filter(
      (member) => member.profile_id !== user.id
    );

    if (targets.length === 0) {
      setMessage("❌ Keine weiteren Teilnehmer im Event.");
      return;
    }

    const rows = targets.map((member) => ({
      event_id: eventId,
      requester_profile_id: user.id,
      target_profile_id: member.profile_id,
      status: "pending",
      message: `${profile?.name || "Jemand"} möchte ein Bier mit dir trinken.`,
    }));

    const { error } = await supabase
      .from("beer_requests")
      .insert(rows);

    if (error) {
      setMessage(
        "❌ Bier-Anfrage konnte nicht gesendet werden: " +
          error.message
      );
      return;
    }

    setMessage(
      "🍺 Bier-Anfrage an alle Teilnehmer gesendet!"
    );

    await loadBeerRequests(eventId);
  }

  async function answerBeerRequest(
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
      setMessage(
        "❌ Antwort konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setMessage(
      status === "accepted"
        ? "🍻 Bier-Anfrage angenommen!"
        : "❌ Bier-Anfrage abgelehnt."
    );

    if (eventId) {
      await loadBeerRequests(eventId);
    }
  }

  async function donateCrate() {
    if (!eventId || !user) {
      setMessage("❌ Bitte anmelden.");
      return;
    }

    const { error } = await supabase
      .from("crate_donations")
      .insert({
        event_id: eventId,
        profile_id: user.id,
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

    await supabase
      .from("points_history")
      .insert({
        event_id: eventId,
        profile_id: user.id,
        points: 20,
        reason: "Kiste Bier spendiert",
        reference_type: "crate",
      });

    setMessage(
      "🍺🍺🍺 Kiste Bier spendiert! +20 Punkte"
    );

    if (eventId) {
      await Promise.all([
        loadCrates(eventId),
        loadPointsHistory(eventId),
      ]);
    }
  }

  async function saveSettings() {
    if (!eventId) return;

    const values = {
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
      p_show_profiles:
        settings.show_profiles,
      p_show_photos:
        settings.show_photos,
      p_show_who_paid:
        settings.show_who_paid,
      p_show_who_owes:
        settings.show_who_owes,
    };

    const { error } = await supabase.rpc(
      "update_event_settings",
      values
    );

    if (error) {
      setMessage(
        "❌ Einstellungen konnten nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setMessage("✅ Event-Einstellungen gespeichert.");
    setShowSettings(false);

    await loadSettings(eventId);
  }

  const selectedEvent = events.find(
    (event) => event.id === eventId
  );

  const totalLiters = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum + getDrinkLiters(drink),
        0
      ),
    [drinks]
  );

  const totalCost = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum + getDrinkPrice(drink),
        0
      ),
    [drinks]
  );

  const totalPaid = useMemo(
    () =>
      payments.reduce(
        (sum, payment) =>
          sum + Number(payment.betrag || 0),
        0
      ),
    [payments]
  );

  const totalPointsByProfile = useMemo(() => {
    const map: Record<string, number> = {};

    members.forEach((member) => {
      map[member.profile_id] = 0;
    });

    pointsHistory.forEach((item) => {
      map[item.profile_id] =
        (map[item.profile_id] || 0) +
        Number(item.points || 0);
    });

    return map;
  }, [members, pointsHistory]);

  const ranking = useMemo(
    () =>
      [...members].sort(
        (a, b) =>
          (totalPointsByProfile[b.profile_id] || 0) -
          (totalPointsByProfile[a.profile_id] || 0)
      ),
    [members, totalPointsByProfile]
  );

  const selectedRanking =
    selectedRankingProfile
      ? pointsHistory.filter(
          (item) =>
            item.profile_id ===
            selectedRankingProfile
        )
      : [];

  const currentUserPaid = payments
    .filter(
      (payment) =>
        payment.bezahlt_von === user?.id ||
        payment.profile_id === user?.id
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.betrag || 0),
      0
    );

  const fairShare =
    members.length > 0
      ? totalCost / members.length
      : 0;

  const currentUserOwes =
    Math.max(fairShare - currentUserPaid, 0);

  const incomingBeerRequests =
    beerRequests.filter(
      (request) =>
        request.status === "pending" &&
        request.event_id === eventId
    );

  const outgoingBeerRequests =
    beerRequests.filter(
      (request) =>
        request.requester_profile_id ===
        user?.id
    );

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          🍻
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>App wird geladen...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="authCard">
          <div className="bigLogo">🍻</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>
            Events · Getränke · Punkte · Challenges
          </p>

          <div className="authTabs">
            <button
              className={
                authMode === "login"
                  ? "tab active"
                  : "tab"
              }
              onClick={() => setAuthMode("login")}
            >
              Anmelden
            </button>

            <button
              className={
                authMode === "register"
                  ? "tab active"
                  : "tab"
              }
              onClick={() =>
                setAuthMode("register")
              }
            >
              Registrieren
            </button>
          </div>

          <input
            type="email"
            placeholder="E-Mail-Adresse"
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
              : "👤 Konto erstellen"}
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

          <div className="account">
            <span>
              👤 {profile?.name || user.email}
            </span>

            {isGlobalAdmin && (
              <strong className="adminBadge">
                GLOBAL ADMIN
              </strong>
            )}

            <button
              className="smallButton"
              onClick={logout}
            >
              Abmelden
            </button>
          </div>
        </header>

        <section className="card eventCard">
          <div className="sectionTitle">
            <h2>📅 Aktuelles Event</h2>

            <div className="actions">
              <button
                className="primary"
                onClick={() =>
                  setShowNewEvent(true)
                }
              >
                ➕ Neues Event
              </button>

              {eventId && (
                <>
                  <button
                    className="secondary"
                    onClick={() =>
                      setShowSettings(true)
                    }
                  >
                    ⚙️ Einstellungen
                  </button>

                  <button
                    className="danger"
                    onClick={deleteEvent}
                  >
                    🗑️ Löschen
                  </button>
                </>
              )}
            </div>
          </div>

          {events.length === 0 ? (
            <div className="empty">
              <div className="emptyIcon">
                🍺
              </div>
              <h3>Noch keine Events</h3>
              <p>
                Erstelle dein erstes Event oder
                trete mit einem Einladungscode bei.
              </p>
            </div>
          ) : (
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
                </option>
              ))}
            </select>
          )}

          <div className="joinRow">
            <input
              placeholder="Einladungscode, z. B. ABCD-1234"
              value={inviteCode}
              onChange={(e) =>
                setInviteCode(
                  e.target.value.toUpperCase()
                )
              }
            />

            <button
              className="secondary"
              onClick={joinEvent}
            >
              🔗 Beitreten
            </button>
          </div>

          {selectedEvent?.invite_code && (
            <div className="inviteBox">
              <span>
                Einladungscode:
              </span>

              <strong>
                {selectedEvent.invite_code}
              </strong>

              <button
                onClick={() =>
                  navigator.clipboard?.writeText(
                    selectedEvent.invite_code || ""
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
                <b>{drinks.length}</b>
                <small>Getränke</small>
              </div>

              <div className="stat">
                <span>💧</span>
                <b>
                  {totalLiters.toFixed(1)}
                </b>
                <small>Liter</small>
              </div>

              <div className="stat">
                <span>💶</span>
                <b>
                  {totalCost.toFixed(2)} €
                </b>
                <small>Getränke</small>
              </div>

              <div className="stat">
                <span>👥</span>
                <b>{members.length}</b>
                <small>Teilnehmer</small>
              </div>
            </section>

            {settings.show_beer_button && (
              <section className="beerHero">
                <button
                  className="beerButton"
                  onClick={sendBeerRequest}
                >
                  <span className="beerEmoji">
                    🍺
                  </span>

                  <strong>BIER</strong>

                  <small>
                    Wer trinkt ein Bier mit mir?
                  </small>
                </button>
              </section>
            )}

            {settings.show_crate_button && (
              <section className="crateSection">
                <button
                  className="crateButton"
                  onClick={donateCrate}
                >
                  <span>🍺🍺🍺</span>
                  <strong>
                    KISTE BIER SPENDIEREN
                  </strong>
                  <small>
                    +20 Punkte
                  </small>
                </button>
              </section>
            )}

            {settings.show_beer_requests && (
              <section className="card">
                <div className="sectionTitle">
                  <h2>
                    🔔 Bier-Anfragen
                  </h2>

                  <span className="counter">
                    {incomingBeerRequests.length}
                  </span>
                </div>

                {incomingBeerRequests.length ===
                0 ? (
                  <p className="muted">
                    Keine offenen Bier-Anfragen.
                  </p>
                ) : (
                  incomingBeerRequests.map(
                    (request) => (
                      <div
                        className="request"
                        key={request.id}
                      >
                        <div>
                          <strong>
                            🍻{" "}
                            {request.requester
                              ?.name ||
                              "Teilnehmer"}
                          </strong>

                          <p>
                            möchte ein Bier
                            mit dir trinken.
                          </p>
                        </div>

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
                            ✅ Zusagen
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
                      </div>
                    )
                  )
                )}

                {outgoingBeerRequests.length >
                  0 && (
                  <div className="outgoing">
                    <h3>
                      Deine Anfragen
                    </h3>

                    {outgoingBeerRequests
                      .slice(0, 5)
                      .map((request) => (
                        <div
                          className="outgoingRow"
                          key={request.id}
                        >
                          🍺 Bier-Anfrage ·{" "}
                          <b>
                            {request.status ===
                            "accepted"
                              ? "Zugesagt"
                              : request.status ===
                                "declined"
                              ? "Abgelehnt"
                              : "Offen"}
                          </b>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            )}

            {settings.show_participants && (
              <section className="card">
                <div className="sectionTitle">
                  <h2>🍻 Teilnehmer</h2>

                  <span className="counter">
                    {members.length}
                  </span>
                </div>

                {members.length === 0 ? (
                  <p className="muted">
                    Noch keine Teilnehmer.
                  </p>
                ) : (
                  members.map((member) => {
                    const points =
                      totalPointsByProfile[
                        member.profile_id
                      ] || 0;

                    return (
                      <div
                        className="member"
                        key={member.id}
                      >
                        <div className="avatar">
                          👤
                        </div>

                        <div className="memberInfo">
                          <strong>
                            {member.profile
                              ?.name ||
                              "Teilnehmer"}
                          </strong>

                          <small>
                            {member.role ===
                              "admin" &&
                              "👑 Admin · "}
                            🏆 {points} Punkte
                          </small>
                        </div>

                        <div className="memberStats">
                          <span>
                            🍺{" "}
                            {
                              drinkHistory.filter(
                                (h) =>
                                  h.profile_id ===
                                  member.profile_id
                              ).length
                            }
                          </span>

                          <span>
                            💶{" "}
                            {payments
                              .filter(
                                (p) =>
                                  p.bezahlt_von ===
                                    member.profile_id ||
                                  p.profile_id ===
                                    member.profile_id
                              )
                              .reduce(
                                (sum, p) =>
                                  sum +
                                  Number(
                                    p.betrag || 0
                                  ),
                                0
                              )
                              .toFixed(2)}
                            €
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
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
                    setDrinkName(
                      e.target.value
                    )
                  }
                />

                <div className="three">
                  <input
                    placeholder="Marke"
                    value={drinkBrand}
                    onChange={(e) =>
                      setDrinkBrand(
                        e.target.value
                      )
                    }
                  />

                  <input
                    type="number"
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
                    placeholder="Alkohol %"
                    value={drinkAlcohol}
                    onChange={(e) =>
                      setDrinkAlcohol(
                        e.target.value
                      )
                    }
                  />
                </div>

                <input
                  type="number"
                  placeholder="Preis €"
                  value={drinkPrice}
                  onChange={(e) =>
                    setDrinkPrice(
                      e.target.value
                    )
                  }
                />

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
                <h2>
                  🔗 Getränk zuordnen
                </h2>

                {members.map((member) => (
                  <div
                    className="assignment"
                    key={member.id}
                  >
                    <strong>
                      {member.profile?.name ||
                        "Teilnehmer"}
                    </strong>

                    <select
                      value={
                        selectedDrinkPerson[
                          member.profile_id
                        ] || ""
                      }
                      onChange={(e) => {
                        const value =
                          e.target.value;

                        setSelectedDrinkPerson(
                          (old) => ({
                            ...old,
                            [member.profile_id]:
                              value,
                          })
                        );

                        if (value) {
                          assignDrink(
                            member.profile_id,
                            value
                          );
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
                          {getDrinkName(drink)} ·{" "}
                          {getDrinkLiters(
                            drink
                          ).toFixed(1)}
                          L
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

                {drinks.length === 0 ? (
                  <p className="muted">
                    Noch keine Getränke.
                  </p>
                ) : (
                  drinks.map((drink) => (
                    <div
                      className="drinkItem"
                      key={drink.id}
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
                          {drink.marke ||
                            drink.brand
                            ? `${drink.marke || drink.brand} · `
                            : ""}
                          {getDrinkLiters(
                            drink
                          ).toFixed(1)}{" "}
                          Liter ·{" "}
                          {getDrinkAlcohol(
                            drink
                          ).toFixed(1)} %
                        </small>
                      </div>

                      <strong>
                        {getDrinkPrice(
                          drink
                        ).toFixed(2)} €
                      </strong>
                    </div>
                  ))
                )}
              </section>
            )}

            {settings.show_drink_history && (
              <section className="card">
                <h2>
                  🕒 Getränkeverlauf
                </h2>

                {drinkHistory.length === 0 ? (
                  <p className="muted">
                    Noch kein Getränkeverlauf.
                  </p>
                ) : (
                  drinkHistory.map((item) => (
                    <div
                      className="historyItem"
                      key={item.id}
                    >
                      <span className="historyIcon">
                        🍺
                      </span>

                      <div>
                        <strong>
                          {item.profile?.name ||
                            "Teilnehmer"}{" "}
                          hat{" "}
                          {item.drink_name}{" "}
                          getrunken
                        </strong>

                        <small>
                          {new Date(
                            item.consumed_at
                          ).toLocaleString(
                            "de-DE"
                          )}{" "}
                          ·{" "}
                          {Number(
                            item.liters
                          ).toFixed(1)}
                          L ·{" "}
                          {Number(
                            item.alcohol_percent
                          ).toFixed(1)}
                          %
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </section>
            )}

            {settings.show_payments && (
              <section className="card">
                <h2>💶 Zahlungen</h2>

                <div className="paymentForm">
                  <input
                    type="number"
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
                      Wer bezahlt?
                    </option>

                    {members.map((member) => (
                      <option
                        key={member.profile_id}
                        value={
                          member.profile_id
                        }
                      >
                        {member.profile?.name ||
                          "Teilnehmer"}
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

                <div className="paymentTotal">
                  <span>
                    💰 Gesamt bezahlt
                  </span>
                  <strong>
                    {totalPaid.toFixed(2)} €
                  </strong>
                </div>

                {payments.map((payment) => {
                  const payer =
                    members.find(
                      (member) =>
                        member.profile_id ===
                          payment.bezahlt_von ||
                        member.profile_id ===
                          payment.profile_id
                    )?.profile?.name ||
                    payment.payer?.name ||
                    "Unbekannt";

                  return (
                    <div
                      className="paymentItem"
                      key={payment.id}
                    >
                      <span>
                        💶 <strong>{payer}</strong>
                        {" "}hat bezahlt
                      </span>

                      <strong>
                        {Number(
                          payment.betrag || 0
                        ).toFixed(2)} €
                      </strong>
                    </div>
                  );
                })}

                {settings.show_who_owes && (
                  <div className="owesBox">
                    <h3>
                      💰 Wer muss noch bezahlen?
                    </h3>

                    {members.map((member) => {
                      const paid =
                        payments
                          .filter(
                            (payment) =>
                              payment.bezahlt_von ===
                                member.profile_id ||
                              payment.profile_id ===
                                member.profile_id
                          )
                          .reduce(
                            (sum, payment) =>
                              sum +
                              Number(
                                payment.betrag ||
                                  0
                              ),
                            0
                          );

                      const owes =
                        Math.max(
                          fairShare - paid,
                          0
                        );

                      return (
                        <div
                          className="oweRow"
                          key={member.profile_id}
                        >
                          <span>
                            👤{" "}
                            {member.profile?.name ||
                              "Teilnehmer"}
                          </span>

                          <strong
                            className={
                              owes > 0
                                ? "red"
                                : "green"
                            }
                          >
                            {owes > 0
                              ? `${owes.toFixed(
                                  2
                                )} € offen`
                              : "✅ bezahlt"}
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
                <div className="sectionTitle">
                  <h2>🏆 Challenges</h2>

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
                  <div className="challengeForm">
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
                      🏆 Challenge erstellen
                    </button>
                  </div>
                )}

                {challenges.length === 0 ? (
                  <p className="muted">
                    Noch keine Challenges.
                  </p>
                ) : (
                  challenges.map(
                    (challenge) => (
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

                          <p>
                            {challenge.description ||
                              "Keine Beschreibung"}
                          </p>

                          <small>
                            +{" "}
                            {challenge.points}{" "}
                            Punkte ·{" "}
                            {challenge.status ||
                              "open"}
                          </small>
                        </div>
                      </div>
                    )
                  )
                )}
              </section>
            )}

            {settings.show_ranking && (
              <section className="card">
                <div className="sectionTitle">
                  <h2>🏆 Rangliste</h2>
                </div>

                <p className="muted">
                  Tippe auf eine Person, um zu
                  sehen, wofür sie Punkte bekommen
                  hat.
                </p>

                {ranking.map(
                  (member, index) => {
                    const points =
                      totalPointsByProfile[
                        member.profile_id
                      ] || 0;

                    return (
                      <button
                        className="rankRow"
                        key={member.profile_id}
                        onClick={() =>
                          setSelectedRankingProfile(
                            member.profile_id
                          )
                        }
                      >
                        <span className="rankPlace">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `${index + 1}.`}
                        </span>

                        <span className="rankName">
                          {member.profile?.name ||
                            "Teilnehmer"}
                        </span>

                        <strong>
                          {points} Punkte
                        </strong>
                      </button>
                    );
                  }
                )}

                {selectedRankingProfile && (
                  <div className="pointsHistory">
                    <div className="sectionTitle">
                      <h3>
                        📜 Punkte-Historie
                      </h3>

                      <button
                        className="smallButton"
                        onClick={() =>
                          setSelectedRankingProfile(
                            null
                          )
                        }
                      >
                        ×
                      </button>
                    </div>

                    {selectedRanking.length ===
                    0 ? (
                      <p className="muted">
                        Noch keine Punkte-Historie.
                      </p>
                    ) : (
                      selectedRanking.map(
                        (item) => (
                          <div
                            className="pointItem"
                            key={item.id}
                          >
                            <div>
                              <strong>
                                {item.reason}
                              </strong>

                              <small>
                                {item.created_at
                                  ? new Date(
                                      item.created_at
                                    ).toLocaleString(
                                      "de-DE"
                                    )
                                  : ""}
                              </small>
                            </div>

                            <b>
                              +{item.points}
                            </b>
                          </div>
                        )
                      )
                    )}
                  </div>
                )}
              </section>
            )}

            {settings.show_statistics && (
              <section className="card statistics">
                <h2>📊 Statistik</h2>

                <div className="statGrid">
                  <div>
                    <span>
                      🍺 Getränke
                    </span>
                    <strong>
                      {drinks.length}
                    </strong>
                  </div>

                  <div>
                    <span>
                      💧 Liter
                    </span>
                    <strong>
                      {totalLiters.toFixed(1)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      💶 Bezahlt
                    </span>
                    <strong>
                      {totalPaid.toFixed(2)} €
                    </strong>
                  </div>

                  <div>
                    <span>
                      🏆 Punkte
                    </span>
                    <strong>
                      {Object.values(
                        totalPointsByProfile
                      ).reduce(
                        (a, b) => a + b,
                        0
                      )}
                    </strong>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <footer>
          🍻 Güstener Zapfhahn Zentrale
          <small>
            Dein Event. Deine Getränke.
            Deine Runde.
          </small>
        </footer>
      </div>

      {showNewEvent && (
        <div
          className="overlay"
          onClick={() =>
            setShowNewEvent(false)
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="sectionTitle">
              <h2>➕ Neues Event</h2>

              <button
                className="smallButton"
                onClick={() =>
                  setShowNewEvent(false)
                }
              >
                ×
              </button>
            </div>

            <input
              placeholder="Eventname"
              value={newEventTitle}
              onChange={(e) =>
                setNewEventTitle(
                  e.target.value
                )
              }
            />

            <textarea
              placeholder="Beschreibung"
              value={newEventDescription}
              onChange={(e) =>
                setNewEventDescription(
                  e.target.value
                )
              }
            />

            <input
              placeholder="Ort"
              value={newEventLocation}
              onChange={(e) =>
                setNewEventLocation(
                  e.target.value
                )
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

      {showSettings && (
        <div
          className="overlay"
          onClick={() =>
            setShowSettings(false)
          }
        >
          <div
            className="modal settingsModal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="sectionTitle">
              <h2>
                ⚙️ Event-Einstellungen
              </h2>

              <button
                className="smallButton"
                onClick={() =>
                  setShowSettings(false)
                }
              >
                ×
              </button>
            </div>

            <p className="muted">
              Hier bestimmst du, welche Bereiche
              die Teilnehmer dieses Events sehen.
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
                    "🕒 Getränkeverlauf",
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
                    "📊 Statistik",
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
                    "🍺 Kiste spendieren",
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
                  keyof EventSettings,
                  string
                ][]
              ).map(([key, label]) => (
                <label
                  className="toggle"
                  key={key}
                >
                  <span>{label}</span>

                  <input
                    type="checkbox"
                    checked={
                      Boolean(settings[key])
                    }
                    onChange={(e) =>
                      setSettings(
                        (old) => ({
                          ...old,
                          [key]:
                            e.target.checked,
                        })
                      )
                    }
                  />

                  <i />
                </label>
              ))}
            </div>

            <button
              className="primary full"
              onClick={saveSettings}
            >
              💾 Einstellungen speichern
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
          width: 100%;
          min-height: 100%;
          background: #070b10;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 18px;
          background:
            radial-gradient(
              circle at top,
              #24384b 0%,
              #111923 28%,
              #070b10 70%
            );
          color: #fff;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          overflow-x: hidden;
        }

        .container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .loading,
        .authCard {
          width: min(100%, 520px);
          margin: 10vh auto;
          text-align: center;
          padding: 35px;
          border-radius: 26px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          box-shadow:
            0 25px 70px rgba(0,0,0,.4);
        }

        .bigLogo {
          font-size: 70px;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 18px;
          padding: 8px 2px 15px;
        }

        .logo {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          border-radius: 19px;
          background: linear-gradient(
            145deg,
            #243547,
            #111a23
          );
          font-size: 36px;
          box-shadow:
            0 15px 35px rgba(0,0,0,.35);
        }

        .headerText {
          flex: 1;
        }

        h1 {
          margin: 0;
          font-size: 27px;
          line-height: 1.1;
        }

        h2 {
          margin: 0 0 14px;
          font-size: 20px;
        }

        h3 {
          margin: 0 0 8px;
        }

        p {
          color: #9eabb8;
        }

        .headerText p {
          margin: 6px 0 0;
        }

        .account {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          font-size: 12px;
        }

        .adminBadge {
          padding: 5px 8px;
          border-radius: 8px;
          background: #f59e0b;
          color: #111;
          font-size: 10px;
        }

        .card {
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 22px;
          padding: 19px;
          margin-bottom: 15px;
          box-shadow:
            0 15px 45px rgba(0,0,0,.18);
          backdrop-filter: blur(12px);
        }

        .eventCard {
          border-color: rgba(245,158,11,.2);
        }

        .sectionTitle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid #334252;
          background: #121b24;
          color: white;
          border-radius: 13px;
          padding: 13px;
          outline: none;
          margin-bottom: 9px;
          font-size: 14px;
        }

        textarea {
          min-height: 90px;
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #f59e0b;
        }

        button {
          border: 0;
          border-radius: 12px;
          padding: 12px 15px;
          cursor: pointer;
          font-weight: 700;
          transition:
            transform .15s ease,
            filter .15s ease;
        }

        button:hover {
          filter: brightness(1.08);
        }

        button:active {
          transform: scale(.97);
        }

        .primary {
          background: linear-gradient(
            135deg,
            #fbbf24,
            #f59e0b
          );
          color: #111;
        }

        .secondary {
          background: #263544;
          color: #fff;
        }

        .danger {
          background: #642f36;
          color: #fff;
        }

        .smallButton {
          padding: 7px 10px;
          font-size: 11px;
          background: #273441;
          color: white;
        }

        .full {
          width: 100%;
        }

        .joinRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          margin-top: 8px;
        }

        .joinRow input {
          margin: 0;
        }

        .inviteBox {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 10px;
          padding: 12px;
          border-radius: 13px;
          background: rgba(245,158,11,.1);
          border: 1px solid rgba(245,158,11,.25);
        }

        .inviteBox strong {
          color: #fbbf24;
          font-size: 18px;
          letter-spacing: 2px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          padding: 16px 10px;
          text-align: center;
          border-radius: 18px;
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.07);
        }

        .stat span {
          display: block;
          font-size: 25px;
        }

        .stat b {
          display: block;
          margin-top: 5px;
          font-size: 20px;
        }

        .stat small {
          color: #8794a2;
        }

        .beerHero {
          margin-bottom: 15px;
        }

        .beerButton {
          width: 100%;
          min-height: 145px;
          border-radius: 25px;
          color: white;
          background:
            radial-gradient(
              circle at center,
              #9e1f28,
              #65151c 58%,
              #400d12
            );
          border: 2px solid rgba(255,100,100,.35);
          box-shadow:
            0 0 35px rgba(210,30,40,.25),
            inset 0 0 30px rgba(0,0,0,.25);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          animation: beerPulse 2s infinite;
        }

        .beerEmoji {
          font-size: 43px;
        }

        .beerButton strong {
          font-size: 32px;
          letter-spacing: 5px;
        }

        .beerButton small {
          opacity: .85;
        }

        @keyframes beerPulse {
          0%,100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.015);
          }
        }

        .crateSection {
          margin-bottom: 15px;
        }

        .crateButton {
          width: 100%;
          padding: 20px;
          border-radius: 20px;
          background:
            linear-gradient(
              135deg,
              #263d28,
              #17251a
            );
          color: white;
          border: 1px solid #466d4b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .crateButton span {
          font-size: 28px;
        }

        .crateButton strong {
          font-size: 18px;
        }

        .crateButton small {
          color: #9fdaa5;
        }

        .request {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 14px;
          margin-top: 8px;
          border-radius: 15px;
          background: rgba(255,255,255,.045);
        }

        .request p {
          margin: 4px 0 0;
        }

        .requestButtons {
          display: flex;
          gap: 7px;
        }

        .accept {
          background: #1f7a46;
          color: white;
        }

        .decline {
          background: #63323a;
          color: white;
        }

        .outgoing {
          margin-top: 15px;
        }

        .outgoingRow {
          padding: 9px;
          border-radius: 10px;
          background: rgba(255,255,255,.04);
          margin-top: 6px;
        }

        .counter {
          min-width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #f59e0b;
          color: #111;
          font-weight: 800;
        }

        .member {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          margin-top: 8px;
          border-radius: 15px;
          background: rgba(255,255,255,.045);
        }

        .avatar {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #253442;
          font-size: 21px;
        }

        .memberInfo {
          flex: 1;
        }

        .memberInfo strong,
        .memberInfo small {
          display: block;
        }

        .memberInfo small {
          margin-top: 4px;
          color: #8f9dab;
        }

        .memberStats {
          display: flex;
          gap: 8px;
          color: #d1d9e0;
          font-size: 12px;
        }

        .three {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 8px;
        }

        .assignment {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
        }

        .assignment select {
          margin: 0;
        }

        .drinkItem,
        .historyItem,
        .paymentItem,
        .pointItem,
        .challenge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 15px;
          background: rgba(255,255,255,.045);
        }

        .drinkIcon,
        .historyIcon,
        .challengeIcon {
          font-size: 25px;
        }

        .drinkInfo,
        .historyItem > div:nth-child(2),
        .pointItem > div {
          flex: 1;
        }

        .drinkInfo strong,
        .drinkInfo small,
        .historyItem strong,
        .historyItem small,
        .pointItem strong,
        .pointItem small {
          display: block;
        }

        small {
          color: #8f9dab;
        }

        .historyItem small {
          margin-top: 4px;
        }

        .paymentForm {
          display: grid;
          grid-template-columns: 1fr 1.5fr auto;
          gap: 8px;
        }

        .paymentForm input,
        .paymentForm select {
          margin: 0;
        }

        .paymentTotal {
          display: flex;
          justify-content: space-between;
          margin: 15px 0 5px;
          padding: 16px;
          border-radius: 15px;
          background: rgba(245,158,11,.1);
          color: #fbbf24;
        }

        .paymentItem {
          justify-content: space-between;
        }

        .owesBox {
          margin-top: 15px;
          padding: 15px;
          border-radius: 16px;
          background: rgba(255,255,255,.04);
        }

        .oweRow {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 0;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        .oweRow:last-child {
          border-bottom: 0;
        }

        .red {
          color: #ff7474;
        }

        .green {
          color: #6ee7a0;
        }

        .challengeForm {
          padding: 14px;
          margin-bottom: 10px;
          border-radius: 16px;
          background: rgba(255,255,255,.04);
        }

        .challenge p {
          margin: 5px 0;
        }

        .challengeIcon {
          font-size: 35px;
        }

        .rankRow {
          width: 100%;
          display: grid;
          grid-template-columns: 48px 1fr auto;
          align-items: center;
          text-align: left;
          gap: 8px;
          margin-top: 8px;
          background: rgba(255,255,255,.05);
          color: white;
        }

        .rankPlace {
          font-size: 24px;
        }

        .rankName {
          font-weight: 700;
        }

        .pointsHistory {
          margin-top: 15px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(245,158,11,.06);
          border: 1px solid rgba(245,158,11,.14);
        }

        .pointItem b {
          color: #6ee7a0;
          font-size: 18px;
        }

        .statistics {
          margin-bottom: 20px;
        }

        .statGrid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 8px;
        }

        .statGrid > div {
          padding: 14px;
          border-radius: 14px;
          background: rgba(255,255,255,.045);
        }

        .statGrid span,
        .statGrid strong {
          display: block;
        }

        .statGrid strong {
          font-size: 22px;
          margin-top: 5px;
        }

        .message {
          position: sticky;
          bottom: 15px;
          z-index: 10;
          padding: 14px;
          border-radius: 14px;
          margin: 10px 0;
          text-align: center;
          background: #172432;
          border: 1px solid #34495b;
          color: #fbbf24;
          box-shadow:
            0 15px 40px rgba(0,0,0,.3);
        }

        .muted {
          color: #8c99a7;
        }

        .empty {
          text-align: center;
          padding: 30px 10px;
        }

        .emptyIcon {
          font-size: 45px;
        }

        footer {
          padding: 25px 5px;
          text-align: center;
          color: #687787;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(0,0,0,.72);
          backdrop-filter: blur(8px);
        }

        .modal {
          width: min(100%, 560px);
          max-height: 90vh;
          overflow-y: auto;
          padding: 20px;
          border-radius: 23px;
          background: #101820;
          border: 1px solid #334252;
          box-shadow:
            0 30px 90px rgba(0,0,0,.6);
        }

        .settingsModal {
          width: min(100%, 720px);
        }

        .settingsGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 15px 0;
        }

        .toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px;
          border-radius: 13px;
          background: rgba(255,255,255,.045);
          cursor: pointer;
        }

        .toggle input {
          display: none;
        }

        .toggle i {
          position: relative;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
          border-radius: 20px;
          background: #3b4652;
        }

        .toggle i::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          transition: .2s;
        }

        .toggle input:checked + i {
          background: #f59e0b;
        }

        .toggle input:checked + i::after {
          left: 23px;
        }

        .authTabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
          margin: 20px 0;
          padding: 4px;
          border-radius: 13px;
          background: #121b24;
        }

        .tab {
          background: transparent;
          color: #8e9baa;
        }

        .tab.active {
          background: #f59e0b;
          color: #111;
        }

        @media (max-width: 700px) {
          .page {
            padding: 10px;
          }

          .header {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .headerText {
            min-width: 0;
          }

          h1 {
            font-size: 21px;
          }

          .account {
            width: 100%;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }

          .stats {
            grid-template-columns: repeat(2,1fr);
          }

          .three {
            grid-template-columns: 1fr;
          }

          .paymentForm {
            grid-template-columns: 1fr;
          }

          .paymentForm input,
          .paymentForm select {
            margin-bottom: 0;
          }

          .assignment {
            grid-template-columns: 1fr;
          }

          .request {
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

          .statGrid {
            grid-template-columns: repeat(2,1fr);
          }

          .joinRow {
            grid-template-columns: 1fr;
          }

          .inviteBox {
            flex-wrap: wrap;
          }

          .sectionTitle {
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
        }

        @media (max-width: 420px) {
          .page {
            padding: 7px;
          }

          .card {
            padding: 14px;
            border-radius: 18px;
          }

          .beerButton {
            min-height: 125px;
          }

          .beerButton strong {
            font-size: 27px;
          }

          .rankRow {
            grid-template-columns: 38px 1fr;
          }

          .rankRow strong {
            grid-column: 2;
          }
        }
      `}</style>
    </main>
  );
}
