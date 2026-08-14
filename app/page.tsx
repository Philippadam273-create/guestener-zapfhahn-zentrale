"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type AnyRow = Record<string, any>;

type EventRow = {
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
};

type Profile = {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  points?: number | null;
  drinks_count?: number | null;
  promille?: number | null;
  role?: string | null;
  avatar_url?: string | null;
  [key: string]: any;
};

type Member = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string;
  role?: string;
  gender_factor?: number;
  profile?: Profile | Profile[] | null;
};

type Drink = {
  id: string;
  event_id: string;
  profile_id?: string | null;
  drink_name?: string | null;
  getraenk?: string | null;
  brand?: string | null;
  marke?: string | null;
  liters?: number | null;
  menge?: number | null;
  alcohol_percent?: number | null;
  alkohol?: number | null;
  quantity?: number | null;
  preis?: number | null;
  paid_by?: string | null;
  bezahlt_von?: string | null;
  promille_wert?: number | null;
  comment?: string | null;
  created_at?: string | null;
};

type Payment = {
  id: string;
  event_id?: string | null;
  betrag?: number | null;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type Challenge = {
  id: string;
  event_id?: string | null;
  title?: string | null;
  description?: string | null;
  points?: number | null;
  category?: string | null;
  status?: string | null;
  created_by_profile_id?: string | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  required_votes?: number | null;
  duration_minutes?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  completed_at?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
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

type PointHistory = {
  id: string;
  event_id: string;
  profile_id: string;
  points: number;
  reason: string;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at?: string | null;
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

const DEFAULT_SETTINGS: EventSettings = {
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

function profileName(profile?: Profile | null) {
  if (!profile) return "Unbekannt";

  return (
    profile.name ||
    profile.username ||
    profile.email ||
    "Unbekannt"
  );
}

function memberProfile(member?: Member | null): Profile | null {
  if (!member?.profile) return null;

  if (Array.isArray(member.profile)) {
    return member.profile[0] || null;
  }

  return member.profile;
}

function money(value: number) {
  return `${Number(value || 0).toFixed(2)} €`;
}

function liters(value: number) {
  return `${Number(value || 0).toFixed(1)} L`;
}

function drinkName(drink: Drink) {
  return (
    drink.drink_name ||
    drink.getraenk ||
    drink.brand ||
    drink.marke ||
    "Getränk"
  );
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loginMode, setLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerName, setRegisterName] = useState("");

  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointHistory[]>([]);
  const [drinkHistory, setDrinkHistory] = useState<DrinkHistory[]>([]);
  const [crateDonations, setCrateDonations] = useState<CrateDonation[]>([]);

  const [settings, setSettings] =
    useState<EventSettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showDrinkForm, setShowDrinkForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [selectedRankingProfile, setSelectedRankingProfile] =
    useState<string | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventInviteCode, setEventInviteCode] = useState("");

  const [drinkNameInput, setDrinkNameInput] = useState("");
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

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) || null;

  const currentUserId = session?.user?.id || "";

  const currentMember = members.find(
    (member) => member.profile_id === currentUserId
  );

  const isEventAdmin =
    isGlobalAdmin ||
    currentMember?.role === "admin";

  const totalLiters = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.liters ??
            drink.menge ??
            0
        ),
      0
    );
  }, [drinks]);

  const totalDrinkCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        Number(drink.preis || 0) *
          Number(drink.quantity || 1),
      0
    );
  }, [drinks]);

  const totalPaid = useMemo(() => {
    return payments.reduce(
      (sum, payment) =>
        sum + Number(payment.betrag || 0),
      0
    );
  }, [payments]);

  const costPerPerson =
    members.length > 0
      ? totalDrinkCost / members.length
      : 0;

  const totalPoints = useMemo(() => {
    return members.reduce((sum, member) => {
      const p = memberProfile(member);

      return (
        sum +
        Number(
          p?.points ||
            0
        )
      );
    }, 0);
  }, [members]);

  const ranking = useMemo(() => {
    return [...members].sort((a, b) => {
      const pa = Number(memberProfile(a)?.points || 0);
      const pb = Number(memberProfile(b)?.points || 0);

      return pb - pa;
    });
  }, [members]);

  function flash(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 4500);
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setAuthLoading(false);
    }

    initialize();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      setIsGlobalAdmin(false);
      return;
    }

    loadUser();
  }, [session?.user?.id]);

  async function loadUser() {
    const userId = session.user.id;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as Profile);
    }

    const { data: adminData } = await supabase
      .from("global_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    setIsGlobalAdmin(!!adminData);

    await loadEvents();
  }

  async function loadEvents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    setLoading(false);

    if (error) {
      flash("❌ Events konnten nicht geladen werden: " + error.message);
      return;
    }

    const eventRows =
      (data || []) as EventRow[];

    setEvents(eventRows);

    if (
      eventRows.length > 0 &&
      !eventRows.some(
        (event) => event.id === selectedEventId
      )
    ) {
      setSelectedEventId(eventRows[0].id);
    }
  }

  useEffect(() => {
    if (!selectedEventId) return;

    loadEventData(selectedEventId);
  }, [selectedEventId]);

  async function loadEventData(eventId: string) {
    setLoading(true);

    const [
      membersResult,
      drinksResult,
      paymentsResult,
      challengesResult,
      beerResult,
      pointsResult,
      historyResult,
      cratesResult,
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
          gender_factor,
          profiles (
            id,
            name,
            username,
            email,
            points,
            drinks_count,
            promille,
            role,
            avatar_url
          )
        `)
        .eq("event_id", eventId),

      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("payments")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("challenges")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("beer_requests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("points_history")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("drink_history")
        .select("*")
        .eq("event_id", eventId)
        .order("consumed_at", {
          ascending: false,
        }),

      supabase
        .from("crate_donations")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("event_settings")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle(),
    ]);

    setLoading(false);

    if (!membersResult.error) {
      setMembers(
        (membersResult.data || []) as Member[]
      );
    }

    if (!drinksResult.error) {
      setDrinks(
        (drinksResult.data || []) as Drink[]
      );
    }

    if (!paymentsResult.error) {
      setPayments(
        (paymentsResult.data || []) as Payment[]
      );
    }

    if (!challengesResult.error) {
      setChallenges(
        (challengesResult.data || []) as Challenge[]
      );
    }

    if (!beerResult.error) {
      setBeerRequests(
        (beerResult.data || []) as BeerRequest[]
      );
    }

    if (!pointsResult.error) {
      setPointsHistory(
        (pointsResult.data || []) as PointHistory[]
      );
    }

    if (!historyResult.error) {
      setDrinkHistory(
        (historyResult.data || []) as DrinkHistory[]
      );
    }

    if (!cratesResult.error) {
      setCrateDonations(
        (cratesResult.data || []) as CrateDonation[]
      );
    }

    if (settingsResult.data) {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...settingsResult.data,
      });
    } else {
      setSettings({
        ...DEFAULT_SETTINGS,
        event_id: eventId,
      });
    }
  }

  async function login() {
    setMessage("");

    if (!email || !password) {
      flash("❌ E-Mail und Passwort eingeben.");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    setLoading(false);

    if (error) {
      flash("❌ " + error.message);
      return;
    }

    flash("✅ Erfolgreich angemeldet.");
  }

  async function register() {
    setMessage("");

    if (!email || !password) {
      flash("❌ E-Mail und Passwort eingeben.");
      return;
    }

    if (password.length < 6) {
      flash(
        "❌ Das Passwort muss mindestens 6 Zeichen haben."
      );
      return;
    }

    setLoading(true);

    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name:
            registerName.trim() ||
            email.split("@")[0],
        },
      },
    });

    setLoading(false);

    if (error) {
      flash("❌ " + error.message);
      return;
    }

    if (data.session) {
      flash("✅ Konto erstellt.");
    } else {
      flash(
        "✅ Konto erstellt. Bitte E-Mail bestätigen."
      );
    }
  }

  async function logout() {
    await supabase.auth.signOut();

    setSession(null);
    setEvents([]);
    setSelectedEventId("");
    setMembers([]);
    setDrinks([]);
    setPayments([]);
    setChallenges([]);
    setBeerRequests([]);
    setPointsHistory([]);
    setDrinkHistory([]);
    setCrateDonations([]);
  }

  async function createEvent() {
    if (!session?.user?.id) {
      flash("❌ Bitte zuerst anmelden.");
      return;
    }

    if (!eventTitle.trim()) {
      flash("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    const inviteCode =
      eventInviteCode.trim() ||
      Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();

    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: eventTitle.trim(),
        description:
          eventDescription.trim() || null,
        location:
          eventLocation.trim() || null,
        invite_code: inviteCode,
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
      })
      .select("*")
      .single();

    setLoading(false);

    if (error) {
      flash(
        "❌ Event konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    if (!data) {
      flash("❌ Event wurde nicht zurückgegeben.");
      return;
    }

    const event = data as EventRow;

    const { error: memberError } =
      await supabase
        .from("event_members")
        .insert({
          event_id: event.id,
          profile_id: session.user.id,
          role: "admin",
        });

    if (memberError) {
      flash(
        "⚠️ Event erstellt, aber Admin konnte nicht hinzugefügt werden: " +
          memberError.message
      );
    }

    await supabase
      .from("event_settings")
      .upsert(
        {
          ...DEFAULT_SETTINGS,
          event_id: event.id,
        },
        {
          onConflict: "event_id",
        }
      );

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setEventInviteCode("");
    setShowEventForm(false);

    await loadEvents();

    setSelectedEventId(event.id);

    flash(
      "✅ Event erstellt. Einladungscode: " +
        inviteCode
    );
  }

  async function joinEvent() {
    if (!eventInviteCode.trim()) {
      flash("❌ Einladungscode eingeben.");
      return;
    }

    setLoading(true);

    const { data, error } =
      await supabase.rpc("join_event", {
        p_invite_code:
          eventInviteCode.trim(),
      });

    setLoading(false);

    if (error) {
      flash(
        "❌ Event konnte nicht beigetreten werden: " +
          error.message
      );
      return;
    }

    if (data) {
      setSelectedEventId(data);
    }

    setEventInviteCode("");

    await loadEvents();

    flash("✅ Event erfolgreich beigetreten.");
  }

  async function addDrink() {
    if (!selectedEventId) {
      flash("❌ Event auswählen.");
      return;
    }

    if (!drinkNameInput.trim()) {
      flash("❌ Getränkenamen eingeben.");
      return;
    }

    const row = {
      event_id: selectedEventId,
      profile_id: currentUserId,
      drink_name:
        drinkNameInput.trim(),
      getraenk:
        drinkNameInput.trim(),
      brand:
        drinkBrand.trim() || null,
      marke:
        drinkBrand.trim() || null,
      liters: Number(drinkLiters) || 0,
      menge: Number(drinkLiters) || 0,
      alcohol_percent:
        Number(drinkAlcohol) || 0,
      alkohol:
        Number(drinkAlcohol) || 0,
      quantity: 1,
      preis: Number(drinkPrice) || 0,
      bezahlt_von: null,
      paid_by: null,
      promille_wert: 0,
    };

    setLoading(true);

    const { error } =
      await supabase
        .from("drinks")
        .insert(row);

    setLoading(false);

    if (error) {
      flash(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setDrinkNameInput("");
    setDrinkBrand("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");
    setShowDrinkForm(false);

    await loadEventData(selectedEventId);

    flash("🍺 Getränk gespeichert.");
  }

  async function assignDrink(
    drink: Drink,
    personId: string
  ) {
    const amount =
      Number(drink.liters ?? drink.menge ?? 0);

    const price =
      Number(drink.preis || 0);

    const name = drinkName(drink);

    setLoading(true);

    const {
      error: drinkError,
    } = await supabase
      .from("drinks")
      .update({
        profile_id: personId,
      })
      .eq("id", drink.id);

    if (drinkError) {
      setLoading(false);

      flash(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          drinkError.message
      );

      return;
    }

    await supabase
      .from("drink_history")
      .insert({
        event_id: selectedEventId,
        profile_id: personId,
        drink_id: drink.id,
        drink_name: name,
        liters: amount,
        alcohol_percent:
          Number(
            drink.alcohol_percent ??
              drink.alkohol ??
              0
          ),
        price,
        consumed_at:
          new Date().toISOString(),
      });

    await supabase
      .from("points_history")
      .insert({
        event_id: selectedEventId,
        profile_id: personId,
        points: 10,
        reason:
          `Getränk getrunken: ${name}`,
        reference_type: "drink",
        reference_id: drink.id,
      });

    setLoading(false);

    await loadEventData(selectedEventId);

    flash(
      `🍺 ${name} wurde zugeordnet. +10 Punkte`
    );
  }

  async function savePayment() {
    if (!selectedEventId) return;

    const amount =
      Number(paymentAmount);

    if (!amount || amount <= 0) {
      flash("❌ Betrag eingeben.");
      return;
    }

    if (!paymentPerson) {
      flash("❌ Bitte auswählen, wer bezahlt hat.");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase
        .from("payments")
        .insert({
          event_id: selectedEventId,
          betrag: amount,
          bezahlt_von: paymentPerson,
          profile_id: paymentPerson,
          status: "paid",
        });

    setLoading(false);

    if (error) {
      flash(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setPaymentAmount("");
    setPaymentPerson("");
    setShowPaymentForm(false);

    await loadEventData(selectedEventId);

    flash("💶 Zahlung gespeichert.");
  }

  async function createChallenge() {
    if (!challengeTitle.trim()) {
      flash("❌ Challenge-Titel eingeben.");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase
        .from("challenges")
        .insert({
          event_id: selectedEventId,
          title: challengeTitle.trim(),
          description:
            challengeDescription.trim() ||
            null,
          points:
            Number(challengePoints) || 10,
          category: "fun",
          status: "open",
          created_by_profile_id:
            currentUserId,
          is_active: true,
        });

    setLoading(false);

    if (error) {
      flash(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");
    setShowChallengeForm(false);

    await loadEventData(selectedEventId);

    flash("🎯 Challenge erstellt.");
  }

  async function donateCrate() {
    if (!selectedEventId) return;

    const confirmed =
      window.confirm(
        "Möchtest du eine Kiste Bier spendieren und dafür 20 Punkte erhalten?"
      );

    if (!confirmed) return;

    setLoading(true);

    const {
      error: crateError,
    } = await supabase
      .from("crate_donations")
      .insert({
        event_id: selectedEventId,
        profile_id: currentUserId,
        crates: 1,
        points_awarded: 20,
      });

    if (crateError) {
      setLoading(false);

      flash(
        "❌ Kiste konnte nicht gespeichert werden: " +
          crateError.message
      );

      return;
    }

    await supabase
      .from("points_history")
      .insert({
        event_id: selectedEventId,
        profile_id: currentUserId,
        points: 20,
        reason: "🍺 Kiste Bier spendiert",
        reference_type:
          "crate_donation",
      });

    setLoading(false);

    await loadEventData(selectedEventId);

    flash(
      "🍺 Kiste Bier spendiert! +20 Punkte"
    );
  }

  async function sendBeerRequest() {
    if (!selectedEventId) return;

    if (members.length <= 1) {
      flash(
        "👥 Es sind keine anderen Teilnehmer im Event."
      );
      return;
    }

    setLoading(true);

    let sent = 0;

    for (const member of members) {
      if (
        member.profile_id ===
        currentUserId
      ) {
        continue;
      }

      const { error } =
        await supabase
          .from("beer_requests")
          .insert({
            event_id: selectedEventId,
            requester_profile_id:
              currentUserId,
            target_profile_id:
              member.profile_id,
            status: "pending",
            message:
              `${profileName(
                profile
              )} möchte ein Bier mit dir trinken.`,
          });

      if (!error) {
        sent++;
      }
    }

    setLoading(false);

    flash(
      sent > 0
        ? `🍺 Bier-Anfrage an ${sent} Teilnehmer gesendet.`
        : "❌ Bier-Anfragen konnten nicht gesendet werden."
    );

    await loadEventData(selectedEventId);
  }

  async function answerBeerRequest(
    request: BeerRequest,
    status: "accepted" | "declined"
  ) {
    const { error } =
      await supabase
        .from("beer_requests")
        .update({
          status,
          responded_at:
            new Date().toISOString(),
        })
        .eq("id", request.id);

    if (error) {
      flash(
        "❌ Antwort konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    await loadEventData(selectedEventId);

    flash(
      status === "accepted"
        ? "🍺 Bier-Anfrage angenommen."
        : "❌ Bier-Anfrage abgelehnt."
    );
  }

  async function saveSettings() {
    if (!isEventAdmin) {
      flash(
        "❌ Nur der Event-Admin darf Einstellungen ändern."
      );
      return;
    }

    const { error } =
      await supabase
        .from("event_settings")
        .upsert(
          {
            ...settings,
            event_id:
              selectedEventId,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "event_id",
          }
        );

    if (error) {
      flash(
        "❌ Einstellungen konnten nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setShowSettings(false);

    flash("⚙️ Einstellungen gespeichert.");

    await loadEventData(selectedEventId);
  }

  function setting(
    key: keyof EventSettings
  ) {
    return (
      settings[key] !== false
    );
  }

  function personPaid(
    personId: string
  ) {
    return payments.reduce(
      (sum, payment) => {
        const payer =
          payment.bezahlt_von ||
          payment.profile_id;

        if (payer !== personId) {
          return sum;
        }

        return (
          sum +
          Number(payment.betrag || 0)
        );
      },
      0
    );
  }

  function personOwes(
    personId: string
  ) {
    return Math.max(
      0,
      costPerPerson -
        personPaid(personId)
    );
  }

  function rankingHistory(
    profileId: string
  ) {
    return pointsHistory.filter(
      (item) =>
        item.profile_id === profileId
    );
  }

  if (authLoading) {
    return (
      <main className="page">
        <div className="loadingScreen">
          <div className="loadingLogo">
            🍻
          </div>
          <h1>
            Güstener Zapfhahn Zentrale
          </h1>
          <p>
            Anmeldung wird geprüft …
          </p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page">
        <div className="authPage">
          <div className="authCard">
            <div className="authLogo">
              🍻
            </div>

            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Events · Getränke · Punkte ·
              Challenges
            </p>

            {!loginMode && (
              <input
                placeholder="Dein Name"
                value={registerName}
                onChange={(e) =>
                  setRegisterName(
                    e.target.value
                  )
                }
              />
            )}

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
                setPassword(
                  e.target.value
                )
              }
            />

            <button
              className="primaryButton"
              onClick={
                loginMode
                  ? login
                  : register
              }
              disabled={loading}
            >
              {loading
                ? "⏳ Bitte warten …"
                : loginMode
                ? "🔐 Anmelden"
                : "📝 Konto erstellen"}
            </button>

            <button
              className="secondaryButton"
              onClick={() =>
                setLoginMode(
                  !loginMode
                )
              }
            >
              {loginMode
                ? "Noch kein Konto? Registrieren"
                : "Bereits registriert? Anmelden"}
            </button>

            {message && (
              <div className="message">
                {message}
              </div>
            )}
          </div>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">

        <header className="topHeader">
          <div className="brand">
            <div className="brandIcon">
              🍻
            </div>

            <div>
              <h1>
                Güstener Zapfhahn Zentrale
              </h1>

              <p>
                Events · Getränke · Punkte ·
                Challenges
              </p>
            </div>
          </div>

          <div className="userArea">
            {isGlobalAdmin && (
              <span className="adminBadge">
                👑 GLOBAL ADMIN
              </span>
            )}

            <span className="userEmail">
              {session.user.email}
            </span>

            <button
              className="logoutButton"
              onClick={logout}
            >
              🚪
            </button>
          </div>
        </header>

        <section className="eventBar">
          <div>
            <label>
              📅 Aktuelles Event
            </label>

            <select
              value={selectedEventId}
              onChange={(e) =>
                setSelectedEventId(
                  e.target.value
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
          </div>

          <div className="eventActions">
            <button
              onClick={() =>
                setShowEventForm(
                  !showEventForm
                )
              }
            >
              ➕ Neues Event
            </button>

            <input
              placeholder="Einladungscode"
              value={eventInviteCode}
              onChange={(e) =>
                setEventInviteCode(
                  e.target.value
                )
              }
            />

            <button
              className="secondaryButtonSmall"
              onClick={joinEvent}
            >
              🔗 Beitreten
            </button>
          </div>
        </section>

        {showEventForm && (
          <section className="card eventCreate">
            <h2>
              ➕ Neues Event erstellen
            </h2>

            <input
              placeholder="Eventname"
              value={eventTitle}
              onChange={(e) =>
                setEventTitle(
                  e.target.value
                )
              }
            />

            <textarea
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

            <input
              placeholder="Eigener Einladungscode (optional)"
              value={eventInviteCode}
              onChange={(e) =>
                setEventInviteCode(
                  e.target.value
                )
              }
            />

            <button
              className="primaryButton"
              onClick={createEvent}
              disabled={loading}
            >
              🍻 Event erstellen
            </button>
          </section>
        )}

        {!selectedEvent ? (
          <section className="emptyState">
            <div>
              📅
            </div>

            <h2>
              Noch kein Event ausgewählt
            </h2>

            <p>
              Erstelle ein neues Event oder
              trete einem Event mit einem
              Einladungscode bei.
            </p>
          </section>
        ) : (
          <>
            <section className="hero">
              <div>
                <div className="heroTitle">
                  {selectedEvent.title}
                </div>

                {selectedEvent.location && (
                  <div className="heroSub">
                    📍{" "}
                    {selectedEvent.location}
                  </div>
                )}

                {selectedEvent.invite_code && (
                  <div className="inviteCode">
                    🔗 Einladungscode:
                    <strong>
                      {
                        selectedEvent.invite_code
                      }
                    </strong>
                  </div>
                )}
              </div>

              <div className="heroActions">
                {isEventAdmin && (
                  <button
                    className="settingsButton"
                    onClick={() =>
                      setShowSettings(
                        !showSettings
                      )
                    }
                  >
                    ⚙️ Einstellungen
                  </button>
                )}
              </div>
            </section>

            {showSettings &&
              isEventAdmin && (
                <section className="card settings">
                  <h2>
                    ⚙️ Event-Einstellungen
                  </h2>

                  <p className="hint">
                    Der Event-Admin entscheidet,
                    welche Bereiche und Buttons
                    für dieses Event sichtbar sind.
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
                          "🎯 Challenge-Punkte",
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
                          "💶 Wer hat bezahlt",
                        ],
                        [
                          "show_who_owes",
                          "💸 Wer muss noch bezahlen",
                        ],
                      ] as [
                        keyof EventSettings,
                        string
                      ][]
                    ).map(
                      ([key, label]) => (
                        <label
                          className="toggle"
                          key={key}
                        >
                          <input
                            type="checkbox"
                            checked={
                              !!settings[key]
                            }
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                [key]:
                                  e.target
                                    .checked,
                              })
                            }
                          />

                          <span>
                            {label}
                          </span>
                        </label>
                      )
                    )}
                  </div>

                  <button
                    className="primaryButton"
                    onClick={saveSettings}
                  >
                    💾 Einstellungen speichern
                  </button>
                </section>
              )}

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
                  {money(totalDrinkCost)}
                </strong>
                <small>
                  Getränke
                </small>
              </div>

              <div className="stat">
                <span>👥</span>
                <strong>
                  {members.length}
                </strong>
                <small>
                  Teilnehmer
                </small>
              </div>
            </section>

            {setting(
              "show_beer_button"
            ) && (
              <section className="beerArea">
                <button
                  className="beerButton"
                  onClick={
                    sendBeerRequest
                  }
                  disabled={loading}
                >
                  <span className="beerEmoji">
                    🍺
                  </span>

                  <span>
                    <strong>
                      BIER
                    </strong>

                    <small>
                      Wer trinkt ein Bier
                      mit mir?
                    </small>
                  </span>
                </button>
              </section>
            )}

            {setting(
              "show_crate_button"
            ) && (
              <section className="crateArea">
                <button
                  className="crateButton"
                  onClick={
                    donateCrate
                  }
                >
                  <span className="crateEmoji">
                    🍺🍺
                  </span>

                  <span>
                    <strong>
                      KISTE BIER SPENDIEREN
                    </strong>

                    <small>
                      +20 Punkte
                    </small>
                  </span>
                </button>
              </section>
            )}

            {setting(
              "show_beer_requests"
            ) &&
              beerRequests.length >
                0 && (
                <section className="card">
                  <h2>
                    🔔 Bier-Anfragen
                  </h2>

                  {beerRequests.map(
                    (request) => {
                      const requester =
                        members.find(
                          (m) =>
                            m.profile_id ===
                            request.requester_profile_id
                        );

                      const isTarget =
                        request.requester_profile_id !==
                        currentUserId;

                      return (
                        <div
                          className="request"
                          key={request.id}
                        >
                          <div>
                            <strong>
                              🍺{" "}
                              {profileName(
                                memberProfile(
                                  requester
                                )
                              )}
                            </strong>

                            <p>
                              {request.message ||
                                "möchte ein Bier mit dir trinken."}
                            </p>

                            <small>
                              {request.status ===
                              "pending"
                                ? "⏳ Ausstehend"
                                : request.status ===
                                  "accepted"
                                ? "✅ Zugesagt"
                                : "❌ Abgelehnt"}
                            </small>
                          </div>

                          {isTarget &&
                            request.status ===
                              "pending" && (
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
                                  ✅ Zusagen
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
                      );
                    }
                  )}
                </section>
              )}

            {setting(
              "show_participants"
            ) && (
              <section className="card">
                <div className="sectionHeader">
                  <h2>
                    👥 Teilnehmer
                  </h2>

                  <span className="count">
                    {members.length}
                  </span>
                </div>

                {members.map(
                  (member) => {
                    const p =
                      memberProfile(
                        member
                      );

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
                            {profileName(p)}
                          </strong>

                          <small>
                            {Number(
                              p?.drinks_count ||
                                0
                            )}{" "}
                            Getränke
                            {" · "}
                            ⭐{" "}
                            {Number(
                              p?.points ||
                                0
                            )}{" "}
                            Punkte
                          </small>

                          {setting(
                            "show_promille"
                          ) && (
                            <small className="promille">
                              🍺{" "}
                              {Number(
                                p?.promille ||
                                  0
                              ).toFixed(
                                2
                              )}{" "}
                              ‰
                            </small>
                          )}
                        </div>

                        {member.role ===
                          "admin" && (
                          <span className="adminSmall">
                            👑 Admin
                          </span>
                        )}
                      </div>
                    );
                  }
                )}
              </section>
            )}

            {setting(
              "show_drinks"
            ) && (
              <section className="card">
                <div className="sectionHeader">
                  <h2>
                    🍺 Getränke
                  </h2>

                  <button
                    onClick={() =>
                      setShowDrinkForm(
                        !showDrinkForm
                      )
                    }
                  >
                    ➕ Hinzufügen
                  </button>
                </div>

                {showDrinkForm && (
                  <div className="formBox">
                    <input
                      placeholder="Getränk"
                      value={
                        drinkNameInput
                      }
                      onChange={(e) =>
                        setDrinkNameInput(
                          e.target.value
                        )
                      }
                    />

                    <div className="three">
                      <input
                        placeholder="Marke"
                        value={
                          drinkBrand
                        }
                        onChange={(e) =>
                          setDrinkBrand(
                            e.target.value
                          )
                        }
                      />

                      <input
                        type="number"
                        placeholder="Liter"
                        value={
                          drinkLiters
                        }
                        onChange={(e) =>
                          setDrinkLiters(
                            e.target.value
                          )
                        }
                      />

                      <input
                        type="number"
                        placeholder="Alkohol %"
                        value={
                          drinkAlcohol
                        }
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
                      value={
                        drinkPrice
                      }
                      onChange={(e) =>
                        setDrinkPrice(
                          e.target.value
                        )
                      }
                    />

                    <button
                      className="primaryButton"
                      onClick={addDrink}
                    >
                      🍻 Getränk speichern
                    </button>
                  </div>
                )}

                {drinks.map(
                  (drink) => (
                    <div
                      className="drink"
                      key={drink.id}
                    >
                      <div className="drinkIcon">
                        🍺
                      </div>

                      <div className="drinkInfo">
                        <strong>
                          {drinkName(
                            drink
                          )}
                        </strong>

                        <small>
                          {Number(
                            drink.liters ??
                              drink.menge ??
                              0
                          ).toFixed(
                            1
                          )}{" "}
                          Liter
                          {" · "}
                          {Number(
                            drink.alcohol_percent ??
                              drink.alkohol ??
                              0
                          ).toFixed(
                            1
                          )}
                          %
                        </small>

                        {drink.profile_id && (
                          <small>
                            👤{" "}
                            {profileName(
                              memberProfile(
                                members.find(
                                  (
                                    m
                                  ) =>
                                    m.profile_id ===
                                    drink.profile_id
                                )
                              )
                            )}
                          </small>
                        )}
                      </div>

                      <div className="drinkRight">
                        <strong>
                          {money(
                            Number(
                              drink.preis ||
                                0
                            )
                          )}
                        </strong>

                        <select
                          defaultValue=""
                          onChange={(
                            e
                          ) => {
                            if (
                              e.target
                                .value
                            ) {
                              assignDrink(
                                drink,
                                e.target
                                  .value
                              );

                              e.target.value =
                                "";
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
                                {profileName(
                                  memberProfile(
                                    member
                                  )
                                )}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  )
                )}
              </section>
            )}

            {setting(
              "show_payments"
            ) && (
              <section className="card">
                <div className="sectionHeader">
                  <h2>
                    💶 Zahlungen
                  </h2>

                  <button
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
                      placeholder="Betrag €"
                      value={
                        paymentAmount
                      }
                      onChange={(e) =>
                        setPaymentAmount(
                          e.target.value
                        )
                      }
                    />

                    <select
                      value={
                        paymentPerson
                      }
                      onChange={(e) =>
                        setPaymentPerson(
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Wer hat bezahlt?
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
                            {profileName(
                              memberProfile(
                                member
                              )
                            )}
                          </option>
                        )
                      )}
                    </select>

                    <button
                      className="primaryButton"
                      onClick={
                        savePayment
                      }
                    >
                      💶 Zahlung speichern
                    </button>
                  </div>
                )}

                {setting(
                  "show_who_paid"
                ) && (
                  <>
                    <h3>
                      Wer hat bezahlt?
                    </h3>

                    {payments.map(
                      (payment) => {
                        const payerId =
                          payment.bezahlt_von ||
                          payment.profile_id;

                        const payer =
                          members.find(
                            (m) =>
                              m.profile_id ===
                              payerId
                          );

                        return (
                          <div
                            className="payment"
                            key={
                              payment.id
                            }
                          >
                            <span>
                              💶{" "}
                              <strong>
                                {profileName(
                                  memberProfile(
                                    payer
                                  )
                                )}
                              </strong>
                            </span>

                            <strong>
                              {money(
                                Number(
                                  payment.betrag ||
                                    0
                                )
                              )}
                            </strong>
                          </div>
                        );
                      }
                    )}
                  </>
                )}

                {setting(
                  "show_who_owes"
                ) && (
                  <>
                    <h3>
                      Wer muss noch bezahlen?
                    </h3>

                    <div className="paymentSummary">
                      <div>
                        <span>
                          Gesamtkosten
                        </span>
                        <strong>
                          {money(
                            totalDrinkCost
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Bereits bezahlt
                        </span>
                        <strong>
                          {money(
                            totalPaid
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Offen
                        </span>
                        <strong className="openMoney">
                          {money(
                            Math.max(
                              0,
                              totalDrinkCost -
                                totalPaid
                            )
                          )}
                        </strong>
                      </div>
                    </div>

                    {members.map(
                      (member) => {
                        const p =
                          memberProfile(
                            member
                          );

                        return (
                          <div
                            className="paymentPerson"
                            key={
                              member.profile_id
                            }
                          >
                            <span>
                              👤{" "}
                              {profileName(
                                p
                              )}
                            </span>

                            <span>
                              Bezahlt:{" "}
                              <strong>
                                {money(
                                  personPaid(
                                    member.profile_id
                                  )
                                )}
                              </strong>
                            </span>

                            <strong
                              className={
                                personOwes(
                                  member.profile_id
                                ) > 0
                                  ? "owes"
                                  : "paidFull"
                              }
                            >
                              {personOwes(
                                member.profile_id
                              ) > 0
                                ? `Noch ${money(
                                    personOwes(
                                      member.profile_id
                                    )
                                  )}`
                                : "✅ Bezahlt"}
                            </strong>
                          </div>
                        );
                      }
                    )}
                  </>
                )}
              </section>
            )}

            {setting(
              "show_drink_history"
            ) && (
              <section className="card">
                <div className="sectionHeader">
                  <h2>
                    📜 Getränkeverlauf
                  </h2>

                  <button
                    onClick={() =>
                      setShowHistory(
                        !showHistory
                      )
                    }
                  >
                    {showHistory
                      ? "▲ Einklappen"
                      : "▼ Anzeigen"}
                  </button>
                </div>

                {showHistory && (
                  <>
                    {drinkHistory.length ===
                    0 ? (
                      <p className="hint">
                        Noch kein
                        Getränkeverlauf vorhanden.
                      </p>
                    ) : (
                      drinkHistory.map(
                        (item) => {
                          const member =
                            members.find(
                              (m) =>
                                m.profile_id ===
                                item.profile_id
                            );

                          return (
                            <div
                              className="historyItem"
                              key={
                                item.id
                              }
                            >
                              <div>
                                <strong>
                                  🍺{" "}
                                  {
                                    item.drink_name
                                  }
                                </strong>

                                <small>
                                  👤{" "}
                                  {profileName(
                                    memberProfile(
                                      member
                                    )
                                  )}
                                </small>

                                <small>
                                  🕐{" "}
                                  {new Date(
                                    item.consumed_at
                                  ).toLocaleString(
                                    "de-DE"
                                  )}
                                </small>
                              </div>

                              <div>
                                <strong>
                                  {liters(
                                    item.liters
                                  )}
                                </strong>

                                <small>
                                  {Number(
                                    item.alcohol_percent
                                  ).toFixed(
                                    1
                                  )}
                                  %
                                </small>
                              </div>
                            </div>
                          );
                        }
                      )
                    )}
                  </>
                )}
              </section>
            )}

            {setting(
              "show_challenges"
            ) && (
              <section className="card">
                <div className="sectionHeader">
                  <h2>
                    🎯 Challenges
                  </h2>

                  {isEventAdmin && (
                    <button
                      onClick={() =>
                        setShowChallengeForm(
                          !showChallengeForm
                        )
                      }
                    >
                      ➕ Challenge
                    </button>
                  )}
                </div>

                {showChallengeForm && (
                  <div className="formBox">
                    <input
                      placeholder="Challenge"
                      value={
                        challengeTitle
                      }
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
                      value={
                        challengePoints
                      }
                      onChange={(e) =>
                        setChallengePoints(
                          e.target.value
                        )
                      }
                    />

                    <button
                      className="primaryButton"
                      onClick={
                        createChallenge
                      }
                    >
                      🎯 Challenge erstellen
                    </button>
                  </div>
                )}

                {challenges.length ===
                0 ? (
                  <p className="hint">
                    Noch keine Challenges.
                  </p>
                ) : (
                  challenges.map(
                    (challenge) => (
                      <div
                        className="challenge"
                        key={
                          challenge.id
                        }
                      >
                        <div className="challengeIcon">
                          🎯
                        </div>

                        <div>
                          <strong>
                            {
                              challenge.title
                            }
                          </strong>

                          <p>
                            {
                              challenge.description
                            }
                          </p>

                          <small>
                            {challenge.status ||
                              "open"}
                          </small>
                        </div>

                        {setting(
                          "show_challenge_points"
                        ) && (
                          <strong className="challengePoints">
                            +
                            {Number(
                              challenge.points ||
                                0
                            )}
                          </strong>
                        )}
                      </div>
                    )
                  )
                )}
              </section>
            )}

            {setting(
              "show_ranking"
            ) && (
              <section className="card">
                <div className="sectionHeader">
                  <h2>
                    🏆 Rangliste
                  </h2>

                  <span>
                    ⭐ {totalPoints}
                  </span>
                </div>

                <p className="hint">
                  Tippe auf eine Person, um zu
                  sehen, wofür sie die Punkte
                  bekommen hat.
                </p>

                {ranking.map(
                  (member, index) => {
                    const p =
                      memberProfile(
                        member
                      );

                    const selected =
                      selectedRankingProfile ===
                      member.profile_id;

                    return (
                      <div
                        key={
                          member.profile_id
                        }
                      >
                        <button
                          className="ranking"
                          onClick={() =>
                            setSelectedRankingProfile(
                              selected
                                ? null
                                : member.profile_id
                            )
                          }
                        >
                          <strong className="place">
                            {index ===
                            0
                              ? "🥇"
                              : index ===
                                1
                              ? "🥈"
                              : index ===
                                2
                              ? "🥉"
                              : `${index + 1}.`}
                          </strong>

                          <span>
                            {
                              profileName(
                                p
                              )
                            }
                          </span>

                          <strong>
                            {Number(
                              p?.points ||
                                0
                            )}{" "}
                            Punkte
                          </strong>
                        </button>

                        {selected && (
                          <div className="pointsHistory">
                            <h4>
                              ⭐ Punkte-Historie
                            </h4>

                            {rankingHistory(
                              member.profile_id
                            ).length ===
                            0 ? (
                              <p>
                                Noch keine
                                Punkte-Historie.
                              </p>
                            ) : (
                              rankingHistory(
                                member.profile_id
                              ).map(
                                (
                                  item
                                ) => (
                                  <div
                                    className="pointRow"
                                    key={
                                      item.id
                                    }
                                  >
                                    <span>
                                      {item.reason}
                                    </span>

                                    <strong>
                                      +
                                      {
                                        item.points
                                      }
                                    </strong>
                                  </div>
                                )
                              )
                            )}

                            {crateDonations
                              .filter(
                                (
                                  crate
                                ) =>
                                  crate.profile_id ===
                                  member.profile_id
                              )
                              .map(
                                (
                                  crate
                                ) => (
                                  <div
                                    className="pointRow"
                                    key={
                                      crate.id
                                    }
                                  >
                                    <span>
                                      🍺 Kiste Bier
                                      spendiert
                                    </span>

                                    <strong>
                                      +
                                      {
                                        crate.points_awarded
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

            {setting(
              "show_costs"
            ) && (
              <section className="card costCard">
                <h2>
                  💰 Kostenübersicht
                </h2>

                <div className="bigMoney">
                  {money(
                    totalDrinkCost
                  )}
                </div>

                <p>
                  Gesamtkosten der Getränke
                </p>

                <div className="costLine">
                  <span>
                    👥 Teilnehmer
                  </span>

                  <strong>
                    {members.length}
                  </strong>
                </div>

                <div className="costLine">
                  <span>
                    💶 Pro Person
                  </span>

                  <strong>
                    {money(
                      costPerPerson
                    )}
                  </strong>
                </div>

                <div className="costLine">
                  <span>
                    💶 Bezahlt
                  </span>

                  <strong>
                    {money(totalPaid)}
                  </strong>
                </div>

                <div className="costLine">
                  <span>
                    💸 Offen
                  </span>

                  <strong className="owes">
                    {money(
                      Math.max(
                        0,
                        totalDrinkCost -
                          totalPaid
                      )
                    )}
                  </strong>
                </div>
              </section>
            )}
          </>
        )}

        {message && (
          <div className="toast">
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

      <style jsx>{styles}</style>
    </main>
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

.page {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  background:
    radial-gradient(
      circle at top,
      #263c50 0%,
      #101923 30%,
      #070b10 72%
    );
  color: #fff;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

.container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 18px;
}

.topHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brandIcon,
.authLogo,
.loadingLogo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background:
    linear-gradient(
      145deg,
      #26384a,
      #121a23
    );
  border: 1px solid
    rgba(255,255,255,.1);
  font-size: 34px;
  box-shadow:
    0 10px 30px
    rgba(0,0,0,.3);
}

h1,
h2,
h3,
h4,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 5px;
  font-size: 25px;
}

h2 {
  font-size: 20px;
}

p,
.hint {
  color: #9ba9b7;
}

.brand p {
  margin: 0;
  font-size: 13px;
}

.userArea {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.userEmail {
  color: #8997a6;
  font-size: 12px;
}

.adminBadge {
  background:
    linear-gradient(
      135deg,
      #f59e0b,
      #facc15
    );
  color: #171717;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
}

.logoutButton {
  width: 42px;
  height: 42px;
  padding: 0;
  background: #202b36;
  color: #fff;
}

button {
  border: 0;
  border-radius: 13px;
  padding: 12px 15px;
  font-weight: 800;
  cursor: pointer;
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

button:disabled {
  opacity: .55;
  cursor: wait;
}

.primaryButton {
  width: 100%;
  margin-top: 8px;
  background:
    linear-gradient(
      135deg,
      #f59e0b,
      #fbbf24
    );
  color: #171717;
}

.secondaryButton {
  width: 100%;
  margin-top: 10px;
  background: #202b36;
  color: #fff;
}

.secondaryButtonSmall {
  background: #263441;
  color: #fff;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid
    rgba(255,255,255,.1);
  background: #111923;
  color: #fff;
  border-radius: 12px;
  padding: 13px;
  margin-bottom: 9px;
  outline: none;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #f59e0b;
}

textarea {
  min-height: 90px;
  resize: vertical;
}

.eventBar {
  display: grid;
  grid-template-columns:
    minmax(220px, 1fr)
    minmax(300px, 1.4fr);
  gap: 12px;
  padding: 15px;
  margin-bottom: 14px;
  background:
    rgba(255,255,255,.055);
  border: 1px solid
    rgba(255,255,255,.08);
  border-radius: 20px;
}

.eventBar label {
  display: block;
  color: #9ba9b7;
  font-size: 12px;
  margin-bottom: 6px;
}

.eventActions {
  display: grid;
  grid-template-columns:
    auto 1fr auto;
  gap: 7px;
  align-items: center;
}

.eventActions input {
  margin: 0;
}

.eventCreate {
  margin-bottom: 14px;
}

.card {
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.065),
      rgba(255,255,255,.035)
    );
  border: 1px solid
    rgba(255,255,255,.085);
  border-radius: 20px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow:
    0 12px 30px
    rgba(0,0,0,.15);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 20px;
  margin-bottom: 14px;
  border-radius: 22px;
  background:
    linear-gradient(
      135deg,
      #1c3548,
      #111923
    );
  border: 1px solid
    rgba(255,255,255,.1);
}

.heroTitle {
  font-size: 28px;
  font-weight: 900;
}

.heroSub {
  color: #aebbc7;
  margin-top: 6px;
}

.inviteCode {
  margin-top: 12px;
  color: #9eacba;
  font-size: 13px;
}

.inviteCode strong {
  color: #fbbf24;
  margin-left: 7px;
  letter-spacing: 1px;
}

.settingsButton {
  background: #263442;
  color: #fff;
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
  padding: 15px;
  border-radius: 17px;
  background:
    rgba(255,255,255,.055);
  border: 1px solid
    rgba(255,255,255,.06);
}

.stat span {
  display: block;
  font-size: 25px;
}

.stat strong {
  display: block;
  font-size: 21px;
  margin: 5px 0;
}

.stat small {
  color: #8795a3;
}

.beerArea,
.crateArea {
  margin-bottom: 14px;
}

.beerButton,
.crateButton {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  text-align: left;
  border-radius: 22px;
  color: #fff;
}

.beerButton {
  min-height: 110px;
  background:
    linear-gradient(
      135deg,
      #9f1239,
      #dc2626,
      #7f1d1d
    );
  box-shadow:
    0 0 30px
    rgba(220,38,38,.22);
  animation:
    beerPulse 2.2s
    infinite;
}

.crateButton {
  min-height: 82px;
  background:
    linear-gradient(
      135deg,
      #92400e,
      #d97706,
      #78350f
    );
  box-shadow:
    0 0 25px
    rgba(245,158,11,.18);
}

.beerEmoji,
.crateEmoji {
  font-size: 42px;
}

.beerButton strong,
.crateButton strong {
  display: block;
  font-size: 22px;
}

.beerButton small,
.crateButton small {
  display: block;
  margin-top: 4px;
  color: #ffe4e6;
}

.crateButton small {
  color: #fef3c7;
}

@keyframes beerPulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.015);
  }

  100% {
    transform: scale(1);
  }
}

.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.sectionHeader h2 {
  margin: 0;
}

.count {
  background: #263442;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 800;
}

.member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  margin-top: 8px;
  background:
    rgba(255,255,255,.045);
  border-radius: 14px;
}

.avatar {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #253240;
  border-radius: 13px;
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
  color: #8d9ba9;
}

.promille {
  color: #fbbf24 !important;
}

.adminSmall {
  font-size: 11px;
  color: #fbbf24;
}

.formBox {
  padding: 14px;
  margin: 10px 0;
  border-radius: 15px;
  background:
    rgba(0,0,0,.18);
}

.three {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 8px;
}

.drink {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  margin-top: 8px;
  border-radius: 15px;
  background:
    rgba(255,255,255,.045);
}

.drinkIcon {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #263442;
  border-radius: 13px;
  font-size: 23px;
}

.drinkInfo {
  flex: 1;
}

.drinkInfo strong,
.drinkInfo small {
  display: block;
}

.drinkInfo small {
  color: #8e9aa7;
  margin-top: 4px;
}

.drinkRight {
  text-align: right;
}

.drinkRight select {
  width: 150px;
  margin-top: 6px;
  margin-bottom: 0;
  padding: 8px;
}

.payment,
.paymentPerson,
.costLine {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 13px;
  margin-top: 8px;
  border-radius: 13px;
  background:
    rgba(255,255,255,.045);
}

.paymentSummary {
  margin-bottom: 15px;
}

.openMoney,
.owes {
  color: #fb7185;
}

.paidFull {
  color: #4ade80;
}

.paymentPerson {
  display: grid;
  grid-template-columns:
    1fr auto auto;
}

.historyItem {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 13px;
  margin-top: 8px;
  border-radius: 14px;
  background:
    rgba(255,255,255,.045);
}

.historyItem strong,
.historyItem small {
  display: block;
}

.historyItem small {
  color: #8997a5;
  margin-top: 4px;
}

.challenge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-top: 8px;
  border-radius: 15px;
  background:
    rgba(255,255,255,.045);
}

.challengeIcon {
  font-size: 27px;
}

.challenge p {
  margin: 4px 0;
}

.challenge small {
  color: #8795a3;
}

.challengePoints {
  margin-left: auto;
  color: #fbbf24;
  font-size: 19px;
}

.ranking {
  width: 100%;
  display: grid;
  grid-template-columns:
    45px 1fr auto;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  text-align: left;
  background:
    rgba(255,255,255,.055);
  color: #fff;
}

.place {
  font-size: 21px;
}

.pointsHistory {
  margin: 0 8px 8px;
  padding: 13px;
  background:
    #0d141c;
  border-radius: 0 0 14px 14px;
}

.pointsHistory h4 {
  margin-bottom: 8px;
}

.pointRow {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 9px;
  border-bottom: 1px solid
    rgba(255,255,255,.06);
}

.pointRow strong {
  color: #fbbf24;
}

.costCard {
  text-align: center;
}

.bigMoney {
  font-size: 42px;
  font-weight: 900;
  color: #fbbf24;
}

.costCard .costLine {
  text-align: left;
}

.request {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  align-items: center;
  padding: 14px;
  margin-top: 8px;
  border-radius: 15px;
  background:
    rgba(255,255,255,.045);
}

.request p {
  margin: 5px 0;
}

.request small {
  color: #8997a5;
}

.requestButtons {
  display: flex;
  gap: 7px;
}

.accept {
  background: #166534;
  color: #fff;
}

.decline {
  background: #7f1d1d;
  color: #fff;
}

.settingsGrid {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 15px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background:
    rgba(255,255,255,.045);
  border-radius: 12px;
  cursor: pointer;
}

.toggle input {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: #f59e0b;
}

.emptyState {
  text-align: center;
  padding: 80px 20px;
  border-radius: 25px;
  background:
    rgba(255,255,255,.045);
}

.emptyState > div {
  font-size: 55px;
}

.toast,
.message {
  padding: 13px;
  margin: 12px 0;
  border-radius: 13px;
  background:
    #172432;
  border: 1px solid
    #344454;
  color: #fbbf24;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  width: min(90%, 650px);
  z-index: 100;
  box-shadow:
    0 15px 35px
    rgba(0,0,0,.4);
}

footer {
  text-align: center;
  color: #687686;
  padding: 30px 10px;
}

footer small {
  display: block;
  margin-top: 5px;
}

.authPage,
.loadingScreen {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.authCard {
  width: min(100%, 430px);
  padding: 30px;
  border-radius: 25px;
  background:
    rgba(255,255,255,.06);
  border: 1px solid
    rgba(255,255,255,.09);
  box-shadow:
    0 20px 60px
    rgba(0,0,0,.4);
}

.authCard h1 {
  margin-top: 18px;
}

.authCard p {
  margin-bottom: 22px;
}

.authLogo {
  width: 75px;
  height: 75px;
}

.loadingScreen {
  flex-direction: column;
  text-align: center;
}

.loadingLogo {
  margin-bottom: 20px;
}

@media(max-width: 760px) {
  .container {
    padding: 12px;
  }

  .topHeader {
    align-items: flex-start;
    flex-direction: column;
  }

  .userArea {
    width: 100%;
    justify-content: flex-start;
  }

  .eventBar {
    grid-template-columns: 1fr;
  }

  .eventActions {
    grid-template-columns: 1fr;
  }

  .stats {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .three {
    grid-template-columns: 1fr;
  }

  .settingsGrid {
    grid-template-columns: 1fr;
  }

  .paymentPerson {
    grid-template-columns: 1fr;
  }

  .request {
    flex-direction: column;
    align-items: flex-start;
  }

  .requestButtons {
    width: 100%;
  }

  .requestButtons button {
    flex: 1;
  }

  .drink {
    align-items: flex-start;
  }

  .drinkRight {
    display: flex;
    flex-direction: column;
  }

  .drinkRight select {
    width: 120px;
  }
}

@media(max-width: 450px) {
  .stats {
    gap: 7px;
  }

  .stat {
    padding: 11px 5px;
  }

  .stat strong {
    font-size: 17px;
  }

  .heroTitle {
    font-size: 23px;
  }

  .beerButton strong,
  .crateButton strong {
    font-size: 17px;
  }

  .beerEmoji,
  .crateEmoji {
    font-size: 32px;
  }

  .ranking {
    grid-template-columns:
      35px 1fr auto;
    padding: 10px;
  }
}
`;
