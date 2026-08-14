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
  created_at?: string;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  role: string;
  joined_at?: string;
  profile?: Profile | Profile[] | null;
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
  drink_name?: string | null;
  getraenk?: string | null;
  brand?: string | null;
  liters?: number | null;
  menge?: number | null;
  alcohol_percent?: number | null;
  alkohol?: number | null;
  quantity?: number | null;
  preis?: number | null;
  paid_by?: string | null;
  bezahlt_von?: string | null;
  created_at?: string;
};

type Payment = {
  id: string;
  event_id: string;
  betrag: number;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string | null;
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
};

type PointsHistory = {
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
  created_at?: string;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  target_profile_id?: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at?: string | null;
};

type CrateDonation = {
  id: string;
  event_id: string;
  profile_id: string;
  crates: number;
  points_awarded: number;
  created_at: string;
};

const PHILIPP_ID = "74dd2871-ddad-4725-a5c2-230879d0a55c";

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

function getProfileObject(
  value: Profile | Profile[] | null | undefined
): Profile | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function money(value: number) {
  return Number(value || 0).toFixed(2) + " €";
}

function liters(value: number) {
  return Number(value || 0).toFixed(1) + " L";
}

function dateTime(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [members, setMembers] = useState<EventMember[]>([]);
  const [settings, setSettings] =
    useState<EventSettings>(defaultSettings);

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [history, setHistory] = useState<DrinkHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pointsHistory, setPointsHistory] =
    useState<PointsHistory[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [beerRequests, setBeerRequests] =
    useState<BeerRequest[]>([]);
  const [crateDonations, setCrateDonations] =
    useState<CrateDonation[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "ranking" | "history" | "challenges" | "settings"
  >("dashboard");

  const [showEventForm, setShowEventForm] = useState(false);
  const [showDrinkForm, setShowDrinkForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showChallengeForm, setShowChallengeForm] =
    useState(false);

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPerson, setPaymentPerson] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] =
    useState("");
  const [challengePoints, setChallengePoints] =
    useState("10");

  const [selectedPerson, setSelectedPerson] =
    useState<Profile | null>(null);

  async function loadUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setSessionUserId(null);
      setProfile(null);
      setIsGlobalAdmin(false);
      return;
    }

    const user = data.user;

    setSessionUserId(user.id);

    if (user.id === PHILIPP_ID) {
      setIsGlobalAdmin(true);
    } else {
      const { data: adminData } = await supabase
        .from("global_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsGlobalAdmin(!!adminData);
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as Profile);
    } else {
      setProfile({
        id: user.id,
        name:
          user.user_metadata?.name ||
          user.email ||
          "Benutzer",
        email: user.email,
      });
    }
  }

  async function loadEvents() {
    if (!sessionUserId) return;

    let query = supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isGlobalAdmin) {
      const { data: memberRows } = await supabase
        .from("event_members")
        .select("event_id")
        .eq("profile_id", sessionUserId);

      const ids =
        memberRows?.map((row) => row.event_id) ?? [];

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

    const eventList = (data ?? []) as Event[];

    setEvents(eventList);

    if (
      eventList.length > 0 &&
      !eventList.some((event) => event.id === eventId)
    ) {
      setEventId(eventList[0].id);
    }
  }

  async function loadEventData() {
    if (!eventId) return;

    const [
      membersResult,
      settingsResult,
      drinksResult,
      historyResult,
      paymentsResult,
      pointsResult,
      challengesResult,
      beerResult,
      crateResult,
    ] = await Promise.all([
      supabase
        .from("event_members")
        .select(
          `
          id,
          event_id,
          profile_id,
          role,
          joined_at,
          profile:profiles (
            id,
            name,
            email,
            avatar_url
          )
        `
        )
        .eq("event_id", eventId),

      supabase
        .from("event_settings")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle(),

      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false }),

      supabase
        .from("drink_history")
        .select("*")
        .eq("event_id", eventId)
        .order("consumed_at", { ascending: false }),

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
        .from("challenges")
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
    ]);

    if (membersResult.error) {
      setMessage(
        "❌ Teilnehmer konnten nicht geladen werden: " +
          membersResult.error.message
      );
    }

    setMembers(
      ((membersResult.data ?? []) as unknown) as EventMember[]
    );

    if (settingsResult.data) {
      setSettings(settingsResult.data as EventSettings);
    } else {
      setSettings({
        ...defaultSettings,
        event_id: eventId,
      });
    }

    setDrinks((drinksResult.data ?? []) as Drink[]);
    setHistory((historyResult.data ?? []) as DrinkHistory[]);
    setPayments((paymentsResult.data ?? []) as Payment[]);
    setPointsHistory(
      (pointsResult.data ?? []) as PointsHistory[]
    );
    setChallenges(
      (challengesResult.data ?? []) as Challenge[]
    );
    setBeerRequests(
      (beerResult.data ?? []) as BeerRequest[]
    );
    setCrateDonations(
      (crateResult.data ?? []) as CrateDonation[]
    );
  }

  useEffect(() => {
    async function start() {
      setLoading(true);

      await loadUser();

      setLoading(false);
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (sessionUserId) {
      loadEvents();
    }
  }, [sessionUserId, isGlobalAdmin]);

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const currentEvent = useMemo(
    () => events.find((event) => event.id === eventId),
    [events, eventId]
  );

  const memberProfiles = useMemo(() => {
    return members
      .map((member) =>
        getProfileObject(member.profile)
      )
      .filter(Boolean) as Profile[];
  }, [members]);

  const memberById = useMemo(() => {
    const map: Record<string, Profile> = {};

    memberProfiles.forEach((person) => {
      map[person.id] = person;
    });

    if (profile && !map[profile.id]) {
      map[profile.id] = profile;
    }

    return map;
  }, [memberProfiles, profile]);

  const totalLiters = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.liters ??
            drink.menge ??
            0
        ) *
          Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const totalDrinkCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        Number(drink.preis ?? 0) *
          Number(drink.quantity ?? 1),
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

  const participantStats = useMemo(() => {
    return memberProfiles.map((person) => {
      const personDrinks = drinks.filter(
        (drink) =>
          drink.profile_id === person.id
      );

      const personHistory = history.filter(
        (item) => item.profile_id === person.id
      );

      const personPoints = pointsHistory
        .filter(
          (item) => item.profile_id === person.id
        )
        .reduce(
          (sum, item) => sum + Number(item.points || 0),
          0
        );

      const cratePoints = crateDonations
        .filter(
          (item) => item.profile_id === person.id
        )
        .reduce(
          (sum, item) =>
            sum + Number(item.points_awarded || 0),
          0
        );

      const consumedLiters =
        personHistory.reduce(
          (sum, item) =>
            sum + Number(item.liters || 0),
          0
        ) ||
        personDrinks.reduce(
          (sum, drink) =>
            sum + Number(drink.liters || drink.menge || 0),
          0
        );

      const paid = payments
        .filter(
          (payment) =>
            payment.bezahlt_von === person.id ||
            payment.profile_id === person.id
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.betrag || 0),
          0
        );

      const alcohol =
        personHistory.reduce(
          (sum, item) =>
            sum +
            Number(item.liters || 0) *
              (Number(item.alcohol_percent || 0) / 100),
          0
        ) ||
        personDrinks.reduce(
          (sum, drink) =>
            sum +
            Number(drink.liters || drink.menge || 0) *
              (Number(
                drink.alcohol_percent ??
                  drink.alkohol ??
                  0
              ) /
                100),
          0
        );

      const approximatePromille =
        consumedLiters > 0
          ? Math.max(
              0,
              alcohol * 7.89
            )
          : 0;

      return {
        person,
        drinks:
          personHistory.length ||
          personDrinks.reduce(
            (sum, drink) =>
              sum + Number(drink.quantity || 1),
            0
          ),
        liters: consumedLiters,
        points: personPoints + cratePoints,
        paid,
        promille: approximatePromille,
      };
    });
  }, [
    memberProfiles,
    drinks,
    history,
    pointsHistory,
    payments,
    crateDonations,
  ]);

  const ranking = useMemo(() => {
    return [...participantStats].sort(
      (a, b) => b.points - a.points
    );
  }, [participantStats]);

  const eventAdmin = useMemo(() => {
    if (isGlobalAdmin) return true;

    const currentMember = members.find(
      (member) =>
        member.profile_id === sessionUserId
    );

    return currentMember?.role === "admin";
  }, [isGlobalAdmin, members, sessionUserId]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function createEvent() {
    if (!eventTitle.trim()) {
      setMessage("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

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

    if (error) {
      setMessage(
        "❌ Event konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setShowEventForm(false);

    setMessage("✅ Event erfolgreich erstellt.");

    await loadEvents();

    if (data) {
      setEventId(data);
    }
  }

  async function deleteEvent() {
    if (!eventId) return;

    const ok = window.confirm(
      `Event "${currentEvent?.title}" wirklich löschen?`
    );

    if (!ok) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      setMessage(
        "❌ Event konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    setEventId("");
    setMessage("✅ Event gelöscht.");
    await loadEvents();
  }

  async function addDrink() {
    if (!eventId) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    if (!drinkName.trim()) {
      setMessage("❌ Bitte Getränkenamen eingeben.");
      return;
    }

    const payload = {
      event_id: eventId,
      profile_id: sessionUserId,
      drink_name: drinkName.trim(),
      getraenk: drinkName.trim(),
      brand: drinkBrand.trim() || null,
      marke: drinkBrand.trim() || null,
      liters: Number(drinkLiters),
      menge: Number(drinkLiters),
      alcohol_percent: Number(drinkAlcohol),
      alkohol: Number(drinkAlcohol),
      preis: Number(drinkPrice),
      quantity: 1,
    };

    const { error } = await supabase
      .from("drinks")
      .insert(payload);

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");
    setShowDrinkForm(false);

    setMessage("🍺 Getränk gespeichert.");

    await loadEventData();
  }

  async function consumeDrink(
    drink: Drink,
    personId: string
  ) {
    const drinkNameValue =
      drink.drink_name ||
      drink.getraenk ||
      "Getränk";

    const drinkLitersValue = Number(
      drink.liters ?? drink.menge ?? 0
    );

    const alcoholValue = Number(
      drink.alcohol_percent ??
        drink.alkohol ??
        0
    );

    const priceValue = Number(
      drink.preis ?? 0
    );

    const { error } = await supabase
      .from("drink_history")
      .insert({
        event_id: eventId,
        profile_id: personId,
        drink_id: drink.id,
        drink_name: drinkNameValue,
        liters: drinkLitersValue,
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

    const { error: pointError } =
      await supabase
        .from("points_history")
        .insert({
          event_id: eventId,
          profile_id: personId,
          points: 10,
          reason: `Getränk: ${drinkNameValue}`,
          reference_type: "drink",
          reference_id: drink.id,
        });

    if (pointError) {
      setMessage(
        "⚠️ Getränk gespeichert, aber Punkte konnten nicht gespeichert werden: " +
          pointError.message
      );
    } else {
      setMessage(
        `🍺 ${memberById[personId]?.name || "Teilnehmer"} hat ${drinkNameValue} getrunken. +10 Punkte`
      );
    }

    await loadEventData();
  }

  async function addPayment() {
    if (!eventId) return;

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      setMessage("❌ Bitte einen gültigen Betrag eingeben.");
      return;
    }

    if (!paymentPerson) {
      setMessage("❌ Bitte auswählen, wer bezahlt hat.");
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
      setMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setPaymentAmount("");
    setPaymentPerson("");
    setShowPaymentForm(false);

    setMessage(
      `💶 ${memberById[paymentPerson]?.name || "Teilnehmer"} hat ${money(amount)} bezahlt.`
    );

    await loadEventData();
  }

  async function donateCrate() {
    if (!sessionUserId || !eventId) return;

    const { error } = await supabase
      .from("crate_donations")
      .insert({
        event_id: eventId,
        profile_id: sessionUserId,
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
        profile_id: sessionUserId,
        points: 20,
        reason: "🍺 Kiste Bier spendiert",
        reference_type: "crate",
      });

    setMessage(
      "🍺🍺🍺 Kiste Bier spendiert! +20 Punkte"
    );

    await loadEventData();
  }

  async function requestBeer() {
    if (!sessionUserId || !eventId) return;

    const targets = members
      .filter(
        (member) =>
          member.profile_id !== sessionUserId
      )
      .map(
        (member) => member.profile_id
      );

    if (targets.length === 0) {
      setMessage(
        "👥 Keine weiteren Teilnehmer im Event."
      );
      return;
    }

    let success = 0;

    for (const target of targets) {
      const { error } = await supabase
        .from("beer_requests")
        .insert({
          event_id: eventId,
          requester_profile_id:
            sessionUserId,
          target_profile_id: target,
          status: "pending",
        });

      if (!error) success++;
    }

    setMessage(
      `🍺 Bier-Anfrage an ${success} Teilnehmer gesendet.`
    );

    await loadEventData();
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
      setMessage(
        "❌ Antwort konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setMessage(
      status === "accepted"
        ? "🍺 Bier-Anfrage angenommen!"
        : "❌ Bier-Anfrage abgelehnt."
    );

    await loadEventData();
  }

  async function createChallenge() {
    if (!eventId || !challengeTitle.trim()) {
      setMessage(
        "❌ Bitte einen Titel eingeben."
      );
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
        created_by_profile_id: sessionUserId,
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

    setMessage("🏆 Challenge erstellt.");

    await loadEventData();
  }

  async function updateSettings(
    key: keyof EventSettings,
    value: boolean
  ) {
    if (!eventId || !eventAdmin) return;

    const next = {
      ...settings,
      [key]: value,
    };

    setSettings(next);

    const { error } = await supabase
      .from("event_settings")
      .upsert(
        {
          ...next,
          event_id: eventId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "event_id",
        }
      );

    if (error) {
      setMessage(
        "❌ Einstellung konnte nicht gespeichert werden: " +
          error.message
      );

      await loadEventData();
      return;
    }

    setMessage("✅ Einstellung gespeichert.");
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          <div className="loadingLogo">🍻</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>App wird geladen...</p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!sessionUserId) {
    return (
      <main className="page">
        <div className="loginCard">
          <div className="bigBeer">🍻</div>

          <h1>Güstener Zapfhahn Zentrale</h1>

          <p>
            Du bist nicht angemeldet.
          </p>

          <button
            className="primaryButton"
            onClick={() =>
              (window.location.href =
                "/login")
            }
          >
            🔐 Zur Anmeldung
          </button>

          <small>
            Bitte zuerst über Supabase Auth
            anmelden.
          </small>
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
            <div className="brandLogo">🍻</div>

            <div>
              <h1>
                Güstener Zapfhahn Zentrale
              </h1>

              <p>
                Events · Getränke · Punkte · Challenges
              </p>
            </div>
          </div>

          <div className="userArea">
            <div className="userBadge">
              👤{" "}
              {profile?.name ||
                profile?.email ||
                "Benutzer"}

              {isGlobalAdmin && (
                <span className="adminBadge">
                  GLOBAL ADMIN
                </span>
              )}
            </div>

            <button
              className="logoutButton"
              onClick={signOut}
            >
              Abmelden
            </button>
          </div>
        </header>

        <section className="card eventCard">
          <div className="sectionHeader">
            <div>
              <h2>📅 Aktuelles Event</h2>

              {currentEvent && (
                <p>
                  {currentEvent.location ||
                    "Event"}
                </p>
              )}
            </div>

            {isGlobalAdmin && (
              <button
                className="secondaryButton"
                onClick={() =>
                  setShowEventForm(
                    !showEventForm
                  )
                }
              >
                ➕ Neues Event
              </button>
            )}
          </div>

          {showEventForm && (
            <div className="formBox">
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
                className="primaryButton"
                onClick={createEvent}
              >
                🍻 Event erstellen
              </button>
            </div>
          )}

          {events.length === 0 ? (
            <div className="empty">
              <div>📅</div>
              <b>Noch keine Events</b>
              <p>
                Erstelle ein neues Event oder
                tritt einem Event per
                Einladungscode bei.
              </p>
            </div>
          ) : (
            <>
              <select
                className="eventSelect"
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
                    {isGlobalAdmin
                      ? " 👑"
                      : ""}
                  </option>
                ))}
              </select>

              {currentEvent?.invite_code && (
                <div className="inviteBox">
                  <div>
                    <small>
                      EINLADUNGSCODE
                    </small>

                    <strong>
                      {currentEvent.invite_code}
                    </strong>
                  </div>

                  <button
                    className="copyButton"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        currentEvent.invite_code ||
                          ""
                      );

                      setMessage(
                        "📋 Einladungscode kopiert."
                      );
                    }}
                  >
                    📋 Kopieren
                  </button>
                </div>
              )}

              {isGlobalAdmin && eventId && (
                <button
                  className="dangerButton"
                  onClick={deleteEvent}
                >
                  🗑️ Event löschen
                </button>
              )}
            </>
          )}
        </section>

        {eventId && (
          <>
            <section className="statsGrid">

              <div className="statCard">
                <span>🍺</span>
                <strong>
                  {drinks.length}
                </strong>
                <small>Getränke</small>
              </div>

              <div className="statCard">
                <span>💧</span>
                <strong>
                  {totalLiters.toFixed(1)}
                </strong>
                <small>Liter</small>
              </div>

              <div className="statCard">
                <span>💶</span>
                <strong>
                  {money(totalDrinkCost)}
                </strong>
                <small>Getränke</small>
              </div>

              <div className="statCard">
                <span>👥</span>
                <strong>
                  {members.length}
                </strong>
                <small>Teilnehmer</small>
              </div>

            </section>

            {settings.show_beer_button && (
              <section className="beerSection">
                <button
                  className="beerButton"
                  onClick={requestBeer}
                >
                  <span className="beerAnimation">
                    🍺
                  </span>

                  <span>
                    <b>BIER</b>
                    <small>
                      Wer trinkt ein Bier mit mir?
                    </small>
                  </span>
                </button>
              </section>
            )}

            {settings.show_crate_button && (
              <section className="crateSection">
                <button
                  className="crateButton"
                  onClick={donateCrate}
                >
                  <span className="crateAnimation">
                    🍺🍺🍺
                  </span>

                  <span>
                    <b>KISTE BIER SPENDIEREN</b>
                    <small>
                      +20 Punkte
                    </small>
                  </span>
                </button>
              </section>
            )}

            {settings.show_beer_requests &&
              beerRequests.filter(
                (request) =>
                  request.target_profile_id ===
                    sessionUserId &&
                  request.status === "pending"
              ).length > 0 && (
                <section className="card notificationCard">
                  <h2>
                    🔔 Bier-Anfragen
                  </h2>

                  {beerRequests
                    .filter(
                      (request) =>
                        request.target_profile_id ===
                          sessionUserId &&
                        request.status === "pending"
                    )
                    .map((request) => (
                      <div
                        className="request"
                        key={request.id}
                      >
                        <div>
                          <b>
                            🍻{" "}
                            {memberById[
                              request.requester_profile_id
                            ]?.name ||
                              "Jemand"}{" "}
                            möchte ein Bier
                            mit dir trinken.
                          </b>

                          <small>
                            {dateTime(
                              request.created_at
                            )}
                          </small>
                        </div>

                        <div className="requestButtons">
                          <button
                            className="acceptButton"
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
                            className="declineButton"
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
                    ))}
                </section>
              )}

            <nav className="tabs">
              <button
                className={
                  activeTab === "dashboard"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("dashboard")
                }
              >
                🏠 Übersicht
              </button>

              {settings.show_ranking && (
                <button
                  className={
                    activeTab === "ranking"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveTab("ranking")
                  }
                >
                  🏆 Rangliste
                </button>
              )}

              {settings.show_drink_history && (
                <button
                  className={
                    activeTab === "history"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveTab("history")
                  }
                >
                  🕒 Verlauf
                </button>
              )}

              {settings.show_challenges && (
                <button
                  className={
                    activeTab === "challenges"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveTab("challenges")
                  }
                >
                  🎯 Challenges
                </button>
              )}

              {eventAdmin && (
                <button
                  className={
                    activeTab === "settings"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveTab("settings")
                  }
                >
                  ⚙️ Einstellungen
                </button>
              )}
            </nav>

            {activeTab === "dashboard" && (
              <>
                {settings.show_participants && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>
                          🍻 Teilnehmer
                        </h2>

                        <p>
                          {members.length} Personen
                        </p>
                      </div>
                    </div>

                    {members.map((member) => {
                      const person =
                        getProfileObject(
                          member.profile
                        );

                      if (!person) return null;

                      const stats =
                        participantStats.find(
                          (item) =>
                            item.person.id ===
                            person.id
                        );

                      return (
                        <button
                          className="personRow"
                          key={member.id}
                          onClick={() =>
                            setSelectedPerson(
                              person
                            )
                          }
                        >
                          <div className="avatar">
                            👤
                          </div>

                          <div className="personInfo">
                            <b>
                              {person.name ||
                                "Unbekannt"}
                            </b>

                            <small>
                              {member.role ===
                              "admin"
                                ? "👑 Admin"
                                : "Teilnehmer"}
                              {" · "}
                              🍺{" "}
                              {stats?.drinks || 0}
                              {" · "}
                              💧{" "}
                              {(
                                stats?.liters ||
                                0
                              ).toFixed(1)}
                              L
                            </small>
                          </div>

                          {settings.show_points && (
                            <strong className="points">
                              🏆{" "}
                              {stats?.points ||
                                0}
                            </strong>
                          )}
                        </button>
                      );
                    })}
                  </section>
                )}

                {settings.show_drinks && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>
                          🍺 Getränke
                        </h2>
                      </div>

                      <button
                        className="secondaryButton"
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

                        <div className="three">
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
                          className="primaryButton"
                          onClick={addDrink}
                        >
                          🍻 Getränk speichern
                        </button>
                      </div>
                    )}

                    {drinks.length === 0 ? (
                      <div className="empty">
                        🍺
                        <p>
                          Noch keine Getränke.
                        </p>
                      </div>
                    ) : (
                      drinks.map((drink) => (
                        <div
                          className="drinkRow"
                          key={drink.id}
                        >
                          <div className="drinkIcon">
                            🍺
                          </div>

                          <div className="drinkInfo">
                            <b>
                              {drink.drink_name ||
                                drink.getraenk ||
                                "Getränk"}
                            </b>

                            <small>
                              {drink.brand ||
                                drink.marke ||
                                ""}
                              {" · "}
                              {Number(
                                drink.liters ??
                                  drink.menge ??
                                  0
                              ).toFixed(1)}
                              L
                              {" · "}
                              {Number(
                                drink.alcohol_percent ??
                                  drink.alkohol ??
                                  0
                              ).toFixed(1)}
                              %
                            </small>
                          </div>

                          <div className="drinkRight">
                            <b>
                              {money(
                                Number(
                                  drink.preis ||
                                    0
                                )
                              )}
                            </b>

                            {members.length >
                              0 && (
                              <select
                                className="consumeSelect"
                                value=""
                                onChange={(e) => {
                                  if (
                                    e.target
                                      .value
                                  ) {
                                    consumeDrink(
                                      drink,
                                      e.target
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
                                      🍺{" "}
                                      {memberById[
                                        member
                                          .profile_id
                                      ]?.name ||
                                        "Teilnehmer"}
                                    </option>
                                  )
                                )}
                              </select>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </section>
                )}

                {settings.show_payments && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>
                          💶 Zahlungen
                        </h2>

                        <p>
                          Wer hat was bezahlt?
                        </p>
                      </div>

                      <button
                        className="secondaryButton"
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
                                {
                                  memberById[
                                    member
                                      .profile_id
                                  ]?.name
                                }
                              </option>
                            )
                          )}
                        </select>

                        <button
                          className="primaryButton"
                          onClick={addPayment}
                        >
                          💶 Zahlung speichern
                        </button>
                      </div>
                    )}

                    <div className="paymentTotal">
                      <span>
                        💰 Gesamt bezahlt
                      </span>

                      <strong>
                        {money(totalPaid)}
                      </strong>
                    </div>

                    {payments.map((payment) => (
                      <div
                        className="paymentRow"
                        key={payment.id}
                      >
                        <div>
                          <b>
                            💶{" "}
                            {memberById[
                              payment
                                .bezahlt_von ||
                                payment.profile_id ||
                                ""
                            ]?.name ||
                              "Unbekannt"}
                          </b>

                          <small>
                            {dateTime(
                              payment.created_at
                            )}
                            {" · "}
                            {payment.status ||
                              "Bezahlt"}
                          </small>
                        </div>

                        <strong>
                          {money(
                            Number(
                              payment.betrag
                            )
                          )}
                        </strong>
                      </div>
                    ))}

                    {settings.show_who_owes && (
                      <div className="owesBox">
                        <h3>
                          💳 Wer muss noch
                          bezahlen?
                        </h3>

                        {participantStats.map(
                          (item) => {
                            const share =
                              members.length >
                              0
                                ? totalPaid /
                                  members.length
                                : 0;

                            const difference =
                              share -
                              item.paid;

                            return (
                              <div
                                className="costRow"
                                key={
                                  item.person.id
                                }
                              >
                                <span>
                                  {
                                    item.person
                                      .name
                                  }
                                </span>

                                <b
                                  className={
                                    difference >
                                    0.01
                                      ? "owe"
                                      : "paid"
                                  }
                                >
                                  {difference >
                                  0.01
                                    ? `noch ${money(
                                        difference
                                      )}`
                                    : "✓ bezahlt"}
                                </b>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </section>
                )}

                {settings.show_challenges && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>
                          🎯 Challenges
                        </h2>
                        <p>
                          Aufgaben und
                          Punkte
                        </p>
                      </div>

                      {eventAdmin && (
                        <button
                          className="secondaryButton"
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

                    {challenges.length === 0 ? (
                      <div className="empty">
                        🎯
                        <p>
                          Noch keine Challenges.
                        </p>
                      </div>
                    ) : (
                      challenges.map(
                        (challenge) => (
                          <div
                            className="challengeRow"
                            key={
                              challenge.id
                            }
                          >
                            <div className="challengeIcon">
                              🎯
                            </div>

                            <div>
                              <b>
                                {
                                  challenge.title
                                }
                              </b>

                              <small>
                                {
                                  challenge
                                    .description
                                }
                              </small>
                            </div>

                            {settings.show_challenge_points && (
                              <strong>
                                +{" "}
                                {
                                  challenge.points
                                }
                              </strong>
                            )}
                          </div>
                        )
                      )
                    )}
                  </section>
                )}
              </>
            )}

            {activeTab === "ranking" &&
              settings.show_ranking && (
                <section className="card">
                  <h2>
                    🏆 Rangliste
                  </h2>

                  <p>
                    Tippe auf eine Person, um
                    zu sehen, wofür sie Punkte
                    bekommen hat.
                  </p>

                  {ranking.map(
                    (item, index) => (
                      <button
                        className="rankingRow"
                        key={
                          item.person.id
                        }
                        onClick={() =>
                          setSelectedPerson(
                            item.person
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

                        <div>
                          <b>
                            {item.person.name}
                          </b>

                          <small>
                            🍺 {item.drinks}
                            {" · "}
                            💧{" "}
                            {item.liters.toFixed(
                              1
                            )}{" "}
                            L
                          </small>
                        </div>

                        {settings.show_points && (
                          <strong className="rankingPoints">
                            {item.points}
                            {" "}
                            Punkte
                          </strong>
                        )}
                      </button>
                    )
                  )}
                </section>
              )}

            {activeTab === "history" &&
              settings.show_drink_history && (
                <section className="card">
                  <h2>
                    🕒 Getränkeverlauf
                  </h2>

                  <p>
                    Wer wann welches Getränk
                    getrunken hat.
                  </p>

                  {history.length === 0 ? (
                    <div className="empty">
                      🕒
                      <p>
                        Noch kein
                        Getränkeverlauf.
                      </p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div
                        className="historyRow"
                        key={item.id}
                      >
                        <div className="historyIcon">
                          🍺
                        </div>

                        <div>
                          <b>
                            {memberById[
                              item.profile_id
                            ]?.name ||
                              "Unbekannt"}
                          </b>

                          <small>
                            hat{" "}
                            {
                              item.drink_name
                            }{" "}
                            getrunken
                            {" · "}
                            {Number(
                              item.liters
                            ).toFixed(1)}
                            L
                            {" · "}
                            {Number(
                              item.alcohol_percent
                            ).toFixed(1)}
                            %
                          </small>

                          <small>
                            {dateTime(
                              item.consumed_at
                            )}
                          </small>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              )}

            {activeTab === "challenges" &&
              settings.show_challenges && (
                <section className="card">
                  <h2>
                    🎯 Challenges
                  </h2>

                  {challenges.map(
                    (challenge) => (
                      <div
                        className="challengeBig"
                        key={
                          challenge.id
                        }
                      >
                        <div className="challengeIconBig">
                          🎯
                        </div>

                        <div>
                          <h3>
                            {
                              challenge.title
                            }
                          </h3>

                          <p>
                            {
                              challenge.description
                            }
                          </p>

                          {settings.show_challenge_points && (
                            <strong>
                              🏆{" "}
                              {
                                challenge.points
                              }{" "}
                              Punkte
                            </strong>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {challenges.length === 0 && (
                    <div className="empty">
                      🎯
                      <p>
                        Noch keine
                        Challenges.
                      </p>
                    </div>
                  )}
                </section>
              )}

            {activeTab === "settings" &&
              eventAdmin && (
                <section className="card">
                  <h2>
                    ⚙️ Event-Einstellungen
                  </h2>

                  <p>
                    Als Event-Ersteller kannst
                    du festlegen, welche
                    Bereiche sichtbar sind.
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
                          "💳 Kosten",
                        ],
                        [
                          "show_ranking",
                          "🏆 Rangliste",
                        ],
                        [
                          "show_points",
                          "🏆 Punkte",
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
                          "💶 Wer bezahlt hat",
                        ],
                        [
                          "show_who_owes",
                          "💳 Wer noch bezahlen muss",
                        ],
                      ] as [
                        keyof EventSettings,
                        string
                      ][]
                    ).map(
                      ([key, label]) => (
                        <label
                          className="settingRow"
                          key={key}
                        >
                          <span>
                            {label}
                          </span>

                          <input
                            type="checkbox"
                            checked={
                              Boolean(
                                settings[key]
                              )
                            }
                            onChange={(e) =>
                              updateSettings(
                                key,
                                e.target
                                  .checked
                              )
                            }
                          />

                          <i />
                        </label>
                      )
                    )}
                  </div>
                </section>
              )}
          </>
        )}

        {selectedPerson && (
          <div className="modalBackdrop">
            <div className="personModal">
              <button
                className="closeButton"
                onClick={() =>
                  setSelectedPerson(null)
                }
              >
                ×
              </button>

              <div className="modalAvatar">
                👤
              </div>

              <h2>
                {selectedPerson.name}
              </h2>

              {(() => {
                const stats =
                  participantStats.find(
                    (item) =>
                      item.person.id ===
                      selectedPerson.id
                  );

                const personPoints =
                  pointsHistory.filter(
                    (item) =>
                      item.profile_id ===
                      selectedPerson.id
                  );

                const personCrates =
                  crateDonations.filter(
                    (item) =>
                      item.profile_id ===
                      selectedPerson.id
                  );

                return (
                  <>
                    <div className="modalStats">
                      <div>
                        🍺
                        <b>
                          {stats?.drinks ||
                            0}
                        </b>
                        <small>
                          Getränke
                        </small>
                      </div>

                      <div>
                        💧
                        <b>
                          {(
                            stats?.liters ||
                            0
                          ).toFixed(1)}
                        </b>
                        <small>
                          Liter
                        </small>
                      </div>

                      <div>
                        🏆
                        <b>
                          {stats?.points ||
                            0}
                        </b>
                        <small>
                          Punkte
                        </small>
                      </div>
                    </div>

                    {settings.show_promille && (
                      <div className="promilleBox">
                        🍺
                        <strong>
                          {(
                            stats?.promille ||
                            0
                          ).toFixed(2)}
                          ‰
                        </strong>
                        <small>
                          ungefährer Wert
                        </small>
                      </div>
                    )}

                    <h3>
                      🏆 Punkte-Historie
                    </h3>

                    {personPoints.length ===
                      0 &&
                      personCrates.length ===
                        0 && (
                        <p className="muted">
                          Noch keine
                          Punkte-Historie.
                        </p>
                      )}

                    {personPoints.map(
                      (item) => (
                        <div
                          className="pointHistoryRow"
                          key={item.id}
                        >
                          <span>
                            {item.points >=
                            0
                              ? "➕"
                              : "➖"}
                          </span>

                          <div>
                            <b>
                              {
                                item.reason
                              }
                            </b>

                            <small>
                              {dateTime(
                                item.created_at
                              )}
                            </small>
                          </div>

                          <strong>
                            {item.points > 0
                              ? "+"
                              : ""}
                            {
                              item.points
                            }
                          </strong>
                        </div>
                      )
                    )}

                    {personCrates.map(
                      (crate) => (
                        <div
                          className="pointHistoryRow"
                          key={
                            crate.id
                          }
                        >
                          <span>
                            🍺
                          </span>

                          <div>
                            <b>
                              Kiste Bier
                              spendiert
                            </b>

                            <small>
                              {dateTime(
                                crate.created_at
                              )}
                            </small>
                          </div>

                          <strong>
                            +{crate.points_awarded}
                          </strong>
                        </div>
                      )
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {message && (
          <div className="toast">
            {message}

            <button
              onClick={() =>
                setMessage("")
              }
            >
              ×
            </button>
          </div>
        )}

        <footer>
          <div>
            🍻
          </div>

          <b>
            Güstener Zapfhahn Zentrale
          </b>

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

.page {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  background:
    radial-gradient(
      circle at 50% -10%,
      #263b50 0%,
      #101923 35%,
      #070b10 75%
    );
  color: #fff;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

.container {
  width: 100%;
  max-width: 1050px;
  margin: 0 auto;
  padding: 18px;
}

.topHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 12px 0 25px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brandLogo {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background:
    linear-gradient(
      145deg,
      #fbbf24,
      #f59e0b
    );
  font-size: 34px;
  box-shadow:
    0 12px 35px rgba(245,158,11,.22);
}

h1 {
  margin: 0;
  font-size: 25px;
}

h2 {
  margin: 0;
  font-size: 20px;
}

h3 {
  margin-top: 20px;
}

p {
  color: #91a0ae;
  margin: 6px 0 0;
}

small {
  color: #91a0ae;
}

.userArea {
  display: flex;
  align-items: center;
  gap: 10px;
}

.userBadge {
  padding: 10px 13px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  font-size: 13px;
}

.adminBadge {
  margin-left: 7px;
  padding: 4px 7px;
  border-radius: 7px;
  background: #f59e0b;
  color: #111;
  font-size: 9px;
  font-weight: 900;
}

.logoutButton,
.secondaryButton,
.primaryButton,
.dangerButton,
.copyButton {
  border: 0;
  border-radius: 12px;
  padding: 11px 15px;
  font-weight: 800;
  cursor: pointer;
}

.logoutButton {
  background: #222d38;
  color: white;
}

.primaryButton {
  background: linear-gradient(
    135deg,
    #fbbf24,
    #f59e0b
  );
  color: #111;
  width: 100%;
}

.secondaryButton {
  background: #24313e;
  color: #fff;
  border: 1px solid #344454;
}

.dangerButton {
  background: #6f1d25;
  color: #fff;
  margin-top: 10px;
}

.copyButton {
  background: #344454;
  color: white;
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
  padding: 19px;
  margin-bottom: 15px;
  box-shadow:
    0 12px 35px rgba(0,0,0,.14);
}

.sectionHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.eventSelect,
input,
select {
  width: 100%;
  padding: 13px;
  background: #111a23;
  color: white;
  border: 1px solid #2b3947;
  border-radius: 12px;
  outline: none;
  margin-bottom: 9px;
}

input:focus,
select:focus {
  border-color: #f59e0b;
}

.formBox {
  padding: 15px;
  background: rgba(0,0,0,.18);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 15px;
  margin-bottom: 14px;
}

.inviteBox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px;
  margin-top: 4px;
  background: rgba(245,158,11,.09);
  border: 1px solid rgba(245,158,11,.25);
  border-radius: 14px;
}

.inviteBox small {
  display: block;
  font-size: 9px;
  letter-spacing: 1px;
}

.inviteBox strong {
  display: block;
  font-size: 21px;
  letter-spacing: 2px;
  color: #fbbf24;
  margin-top: 3px;
}

.statsGrid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.statCard {
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 18px;
  padding: 14px;
  text-align: center;
}

.statCard span {
  font-size: 22px;
}

.statCard strong {
  display: block;
  font-size: 20px;
  margin: 4px 0;
}

.statCard small {
  display: block;
  font-size: 10px;
}

.beerSection {
  margin-bottom: 12px;
}

.beerButton {
  width: 100%;
  border: 0;
  border-radius: 24px;
  padding: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  background:
    linear-gradient(
      135deg,
      #a5161e,
      #e02d35,
      #7f1118
    );
  color: white;
  cursor: pointer;
  box-shadow:
    0 15px 40px rgba(210,30,40,.25);
  animation: beerPulse 2s infinite;
}

.beerButton b,
.crateButton b {
  display: block;
  font-size: 25px;
}

.beerButton small,
.crateButton small {
  display: block;
  color: rgba(255,255,255,.78);
  margin-top: 3px;
}

.beerAnimation {
  font-size: 48px;
  animation: beerTilt 1.4s infinite;
}

.crateSection {
  margin-bottom: 15px;
}

.crateButton {
  width: 100%;
  border: 1px solid rgba(245,158,11,.35);
  border-radius: 22px;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background:
    linear-gradient(
      135deg,
      #47300b,
      #7a4b0a
    );
  color: white;
  cursor: pointer;
}

.crateAnimation {
  font-size: 34px;
  animation: crateBounce 1.5s infinite;
}

@keyframes beerPulse {
  0%,100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.015);
  }
}

@keyframes beerTilt {
  0%,100% {
    transform: rotate(-7deg);
  }

  50% {
    transform: rotate(7deg);
  }
}

@keyframes crateBounce {
  0%,100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

.notificationCard {
  border-color: rgba(245,158,11,.4);
}

.request {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  align-items: center;
  padding: 14px;
  background: rgba(255,255,255,.05);
  border-radius: 14px;
  margin-top: 9px;
}

.request small {
  display: block;
  margin-top: 5px;
}

.requestButtons {
  display: flex;
  gap: 7px;
}

.acceptButton,
.declineButton {
  border: 0;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  font-weight: 800;
}

.acceptButton {
  background: #176b43;
  color: white;
}

.declineButton {
  background: #4a252b;
  color: white;
}

.tabs {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding: 3px 0 13px;
  scrollbar-width: none;
}

.tabs button {
  flex: 0 0 auto;
  border: 1px solid #2b3947;
  background: #111a23;
  color: #9eabb7;
  padding: 11px 14px;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
}

.tabs button.active {
  background: #f59e0b;
  color: #111;
  border-color: #f59e0b;
}

.personRow,
.rankingRow {
  width: 100%;
  border: 0;
  display: grid;
  grid-template-columns: 42px 1fr auto;
  align-items: center;
  gap: 11px;
  padding: 12px;
  margin-top: 7px;
  background: rgba(255,255,255,.045);
  border-radius: 14px;
  color: white;
  text-align: left;
  cursor: pointer;
}

.personRow:hover,
.rankingRow:hover {
  background: rgba(255,255,255,.08);
}

.avatar {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #253342;
  border-radius: 50%;
}

.personInfo b,
.personInfo small {
  display: block;
}

.personInfo small {
  margin-top: 4px;
}

.points,
.rankingPoints {
  color: #fbbf24;
}

.drinkRow,
.paymentRow,
.historyRow,
.challengeRow,
.pointHistoryRow,
.costRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-top: 7px;
  background: rgba(255,255,255,.045);
  border-radius: 14px;
}

.drinkIcon,
.historyIcon,
.challengeIcon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #273544;
  border-radius: 12px;
  font-size: 22px;
}

.drinkInfo,
.paymentRow > div,
.historyRow > div:not(.historyIcon),
.challengeRow > div:not(.challengeIcon) {
  flex: 1;
}

.drinkInfo b,
.drinkInfo small,
.paymentRow small,
.historyRow small,
.challengeRow small {
  display: block;
}

.drinkInfo small,
.paymentRow small,
.historyRow small,
.challengeRow small {
  margin-top: 4px;
}

.drinkRight {
  text-align: right;
}

.consumeSelect {
  width: 125px;
  margin: 5px 0 0;
  padding: 8px;
}

.paymentTotal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(245,158,11,.08);
  border-radius: 14px;
  margin-bottom: 8px;
}

.paymentTotal strong {
  color: #fbbf24;
  font-size: 20px;
}

.owesBox {
  margin-top: 14px;
  padding: 14px;
  background: rgba(0,0,0,.18);
  border-radius: 14px;
}

.owesBox h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.costRow {
  justify-content: space-between;
}

.owe {
  color: #ff6b6b;
}

.paid {
  color: #55d98a;
}

.rankingRow {
  grid-template-columns:
    45px 1fr auto;
}

.rankPlace {
  font-size: 24px;
}

.rankingRow small {
  display: block;
  margin-top: 4px;
}

.challengeRow {
  display: grid;
  grid-template-columns: 42px 1fr auto;
}

.challengeRow b,
.challengeRow small {
  display: block;
}

.challengeRow strong {
  color: #fbbf24;
}

.challengeBig {
  display: flex;
  gap: 15px;
  padding: 17px;
  background: rgba(255,255,255,.045);
  border-radius: 17px;
  margin-top: 9px;
}

.challengeIconBig {
  font-size: 36px;
}

.challengeBig h3 {
  margin: 0;
}

.challengeBig p {
  margin: 5px 0;
}

.challengeBig strong {
  color: #fbbf24;
}

.settingsGrid {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 8px;
}

.settingRow {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px;
  background: rgba(255,255,255,.045);
  border-radius: 13px;
  cursor: pointer;
}

.settingRow input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.settingRow i {
  width: 44px;
  height: 24px;
  border-radius: 20px;
  background: #293541;
  position: relative;
}

.settingRow i:after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #8b98a5;
  transition: .2s;
}

.settingRow input:checked + i {
  background: #f59e0b;
}

.settingRow input:checked + i:after {
  transform: translateX(20px);
  background: #111;
}

.empty {
  text-align: center;
  padding: 30px 15px;
  color: #91a0ae;
}

.empty > div {
  font-size: 35px;
  margin-bottom: 8px;
}

.modalBackdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  background: rgba(0,0,0,.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.personModal {
  position: relative;
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  overflow-y: auto;
  background: #111a23;
  border: 1px solid #344454;
  border-radius: 24px;
  padding: 25px;
}

.closeButton {
  position: absolute;
  right: 15px;
  top: 15px;
  width: 35px;
  height: 35px;
  border: 0;
  border-radius: 50%;
  background: #273544;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.modalAvatar {
  width: 65px;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #273544;
  font-size: 32px;
}

.modalStats {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 8px;
  margin: 15px 0;
}

.modalStats > div {
  text-align: center;
  background: rgba(255,255,255,.05);
  padding: 12px;
  border-radius: 13px;
}

.modalStats b,
.modalStats small {
  display: block;
}

.promilleBox {
  text-align: center;
  padding: 17px;
  background: rgba(245,158,11,.08);
  border-radius: 14px;
  margin: 10px 0;
}

.promilleBox strong {
  display: block;
  color: #fbbf24;
  font-size: 32px;
  margin: 5px 0;
}

.pointHistoryRow {
  display: grid;
  grid-template-columns: 30px 1fr auto;
}

.pointHistoryRow b,
.pointHistoryRow small {
  display: block;
}

.pointHistoryRow small {
  margin-top: 3px;
}

.pointHistoryRow strong {
  color: #fbbf24;
  font-size: 20px;
}

.muted {
  color: #697888;
}

.toast {
  position: fixed;
  z-index: 2000;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  width: min(92%, 600px);
  padding: 14px 16px;
  background: #172330;
  border: 1px solid #344454;
  border-radius: 14px;
  box-shadow: 0 15px 40px rgba(0,0,0,.35);
  color: #fbbf24;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.toast button {
  border: 0;
  background: transparent;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

.loading,
.loginCard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 25px;
}

.loadingLogo,
.bigBeer {
  font-size: 65px;
  margin-bottom: 15px;
}

.loginCard {
  width: 100%;
  max-width: 500px;
  margin: auto;
}

.loginCard small {
  margin-top: 12px;
}

footer {
  text-align: center;
  padding: 35px 10px 15px;
  color: #627080;
}

footer > div {
  font-size: 30px;
}

footer b {
  display: block;
  margin-top: 5px;
}

footer small {
  display: block;
  margin-top: 5px;
}

.three {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 8px;
}

@media (max-width: 700px) {
  .container {
    padding: 12px;
  }

  .topHeader {
    align-items: flex-start;
    flex-direction: column;
  }

  .userArea {
    width: 100%;
    justify-content: space-between;
  }

  .statsGrid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .settingsGrid {
    grid-template-columns: 1fr;
  }

  .three {
    grid-template-columns: 1fr;
  }

  .request {
    flex-direction: column;
    align-items: stretch;
  }

  .requestButtons {
    width: 100%;
  }

  .requestButtons button {
    flex: 1;
  }

  .drinkRow {
    align-items: flex-start;
  }

  .drinkRight {
    min-width: 120px;
  }

  .consumeSelect {
    width: 120px;
  }
}

@media (max-width: 450px) {
  .brandLogo {
    width: 54px;
    height: 54px;
    font-size: 28px;
  }

  h1 {
    font-size: 20px;
  }

  .userArea {
    flex-direction: column;
    align-items: stretch;
  }

  .beerButton b,
  .crateButton b {
    font-size: 20px;
  }

  .personRow,
  .rankingRow {
    grid-template-columns:
      38px 1fr auto;
  }

  .drinkRow {
    flex-wrap: wrap;
  }

  .drinkRight {
    width: 100%;
    text-align: left;
  }
}
`;
