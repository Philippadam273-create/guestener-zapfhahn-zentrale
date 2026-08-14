"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
};

type EventItem = {
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
  role?: string | null;
  joined_at?: string;
  profile?: Profile | null;
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
  status: string;
  created_at: string;
  payer?: Profile | null;
};

type PointsHistory = {
  id: string;
  event_id: string;
  profile_id: string;
  points: number;
  reason: string;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at: string;
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
  created_at?: string;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  target_profile_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at?: string | null;
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
  profile?: Profile | null;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState("");

  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [history, setHistory] = useState<DrinkHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [crateDonations, setCrateDonations] = useState<CrateDonation[]>([]);
  const [settings, setSettings] =
    useState<EventSettings>(defaultSettings);

  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "ranking" | "history" | "challenges" | "settings"
  >("dashboard");

  const [showEventForm, setShowEventForm] = useState(false);
  const [showDrinkForm, setShowDrinkForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const [inviteCodeInput, setInviteCodeInput] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPerson, setPaymentPerson] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePoints, setChallengePoints] = useState("10");

  const [selectedPerson, setSelectedPerson] = useState<Profile | null>(null);

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4000);
  }

  function getDrinkName(drink: Drink) {
    return drink.getraenk || drink.drink_name || "Getränk";
  }

  function getDrinkLiters(drink: Drink) {
    return Number(drink.liters ?? drink.menge ?? 0);
  }

  function getDrinkAlcohol(drink: Drink) {
    return Number(drink.alcohol_percent ?? drink.alkohol ?? 0);
  }

  function getProfileName(id?: string | null) {
    if (!id) return "Unbekannt";

    const member = members.find((m) => m.profile_id === id);

    if (member?.profile?.name) {
      return member.profile.name;
    }

    if (profile?.id === id) {
      return profile.name;
    }

    return "Unbekannt";
  }

  async function loadProfile(currentUserId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,email,avatar_url")
      .eq("id", currentUserId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    if (data) {
      setProfile(data as Profile);
      return data as Profile;
    }

    return null;
  }

  async function ensureProfile(currentUserId: string) {
    const { data: authData } = await supabase.auth.getUser();

    const user = authData.user;

    if (!user) return null;

    const name =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Benutzer";

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: currentUserId,
          name,
          email: user.email ?? null,
        },
        {
          onConflict: "id",
        }
      );

    if (error) {
      console.error("Profil:", error);
    }

    return loadProfile(currentUserId);
  }

  async function loadEvents(currentUserId: string) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const list = (data || []) as EventItem[];

    setEvents(list);

    if (!eventId && list.length > 0) {
      const ownEvent =
        list.find((event) => event.created_by === currentUserId) ||
        list[0];

      setEventId(ownEvent.id);
    }
  }

  async function loadEventData(id: string) {
    if (!id) return;

    setLoading(true);

    const [
      membersResult,
      drinksResult,
      historyResult,
      paymentsResult,
      pointsResult,
      challengesResult,
      requestsResult,
      cratesResult,
      settingsResult,
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
          profile:profiles(
            id,
            name,
            email,
            avatar_url
          )
        `
        )
        .eq("event_id", id),

      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("drink_history")
        .select(
          `
          *,
          profile:profiles(
            id,
            name,
            email,
            avatar_url
          )
        `
        )
        .eq("event_id", id)
        .order("consumed_at", { ascending: false }),

      supabase
        .from("payments")
        .select(
          `
          *,
          payer:profiles!payments_bezahlt_von_fkey(
            id,
            name,
            email,
            avatar_url
          )
        `
        )
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("points_history")
        .select(
          `
          *,
          profile:profiles(
            id,
            name,
            email,
            avatar_url
          )
        `
        )
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("challenges")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("beer_requests")
        .select(
          `
          *,
          requester:profiles!beer_requests_requester_profile_id_fkey(
            id,
            name,
            email,
            avatar_url
          ),
          target:profiles!beer_requests_target_profile_id_fkey(
            id,
            name,
            email,
            avatar_url
          )
        `
        )
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("crate_donations")
        .select(
          `
          *,
          profile:profiles(
            id,
            name,
            email,
            avatar_url
          )
        `
        )
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("event_settings")
        .select("*")
        .eq("event_id", id)
        .maybeSingle(),
    ]);

    if (membersResult.error) console.error("Members:", membersResult.error);
    if (drinksResult.error) console.error("Drinks:", drinksResult.error);
    if (historyResult.error) console.error("History:", historyResult.error);
    if (paymentsResult.error) console.error("Payments:", paymentsResult.error);
    if (pointsResult.error)
      console.error("Points:", pointsResult.error);
    if (challengesResult.error)
      console.error("Challenges:", challengesResult.error);
    if (requestsResult.error)
      console.error("Beer:", requestsResult.error);
    if (cratesResult.error)
      console.error("Crates:", cratesResult.error);
    if (settingsResult.error)
      console.error("Settings:", settingsResult.error);

    setMembers((membersResult.data || []) as EventMember[]);
    setDrinks((drinksResult.data || []) as Drink[]);
    setHistory((historyResult.data || []) as DrinkHistory[]);
    setPayments((paymentsResult.data || []) as Payment[]);
    setPointsHistory((pointsResult.data || []) as PointsHistory[]);
    setChallenges((challengesResult.data || []) as Challenge[]);
    setBeerRequests((requestsResult.data || []) as BeerRequest[]);
    setCrateDonations((cratesResult.data || []) as CrateDonation[]);

    if (settingsResult.data) {
      setSettings({
        ...defaultSettings,
        ...(settingsResult.data as Partial<EventSettings>),
      });
    } else {
      setSettings(defaultSettings);
    }

    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    async function start() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setUserId("");
        setProfile(null);
        setLoading(false);
        return;
      }

      const currentUserId = session.user.id;

      setUserId(currentUserId);

      await ensureProfile(currentUserId);
      await loadEvents(currentUserId);

      setLoading(false);
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUserId("");
        setProfile(null);
        setEvents([]);
        setEventId("");
        return;
      }

      const currentUserId = session.user.id;

      setUserId(currentUserId);

      await ensureProfile(currentUserId);
      await loadEvents(currentUserId);
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

  const currentEvent = useMemo(
    () => events.find((event) => event.id === eventId) || null,
    [events, eventId]
  );

  const isAdmin = useMemo(() => {
    if (!userId) return false;

    /*
      Der angemeldete Hauptadministrator hat Zugriff
      auf alle Events.
    */
    if (profile?.email && profile.email.toLowerCase().includes("philipp")) {
      return true;
    }

    if (currentEvent?.created_by === userId) {
      return true;
    }

    const member = members.find(
      (item) => item.profile_id === userId
    );

    return member?.role === "admin";
  }, [userId, profile, currentEvent, members]);

  const totalLiters = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) => sum + getDrinkLiters(drink),
        0
      ),
    [drinks]
  );

  const totalCost = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) => sum + Number(drink.preis || 0),
        0
      ),
    [drinks]
  );

  const totalPaid = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === "paid")
        .reduce(
          (sum, payment) => sum + Number(payment.betrag || 0),
          0
        ),
    [payments]
  );

  const totalOwed = Math.max(totalCost - totalPaid, 0);

  const pointsByPerson = useMemo(() => {
    const map = new Map<string, number>();

    members.forEach((member) => {
      map.set(member.profile_id, 0);
    });

    pointsHistory.forEach((item) => {
      map.set(
        item.profile_id,
        (map.get(item.profile_id) || 0) + Number(item.points || 0)
      );
    });

    return map;
  }, [members, pointsHistory]);

  const ranking = useMemo(() => {
    return [...members]
      .map((member) => ({
        member,
        points: pointsByPerson.get(member.profile_id) || 0,
      }))
      .sort((a, b) => b.points - a.points);
  }, [members, pointsByPerson]);

  async function createEvent() {
    if (!profile || !userId) {
      notify("❌ Bitte zuerst anmelden.");
      return;
    }

    if (!eventTitle.trim()) {
      notify("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase.rpc("create_event", {
      p_title: eventTitle.trim(),
      p_description: eventDescription.trim() || null,
      p_location: eventLocation.trim() || null,
    });

    if (error) {
      console.error(error);

      /*
        Fallback, falls die RPC-Funktion noch nicht
        vorhanden oder anders aufgebaut ist.
      */
      const code =
        Math.random().toString(36).substring(2, 6).toUpperCase() +
        "-" +
        Math.random().toString(36).substring(2, 6).toUpperCase();

      const { data: created, error: fallbackError } = await supabase
        .from("events")
        .insert({
          title: eventTitle.trim(),
          description: eventDescription.trim() || null,
          location: eventLocation.trim() || null,
          invite_code: code,
          created_by: userId,
          is_active: true,
        })
        .select()
        .single();

      if (fallbackError) {
        notify("❌ Event konnte nicht erstellt werden: " + fallbackError.message);
        setSaving(false);
        return;
      }

      if (created) {
        await supabase.from("event_members").insert({
          event_id: created.id,
          profile_id: userId,
          role: "admin",
        });

        await supabase.from("event_settings").insert({
          event_id: created.id,
        });

        setEvents((prev) => [created as EventItem, ...prev]);
        setEventId(created.id);
      }
    } else {
      const newEventId = String(data);

      await loadEvents(userId);

      setEventId(newEventId);
    }

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setShowEventForm(false);
    setSaving(false);

    notify("✅ Event erfolgreich erstellt.");
  }

  async function joinEvent() {
    if (!inviteCodeInput.trim()) {
      notify("❌ Einladungscode eingeben.");
      return;
    }

    if (!userId) {
      notify("❌ Bitte zuerst anmelden.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase.rpc("join_event", {
      p_invite_code: inviteCodeInput.trim(),
    });

    if (error) {
      notify("❌ " + error.message);
      setSaving(false);
      return;
    }

    const joinedEventId = String(data);

    setInviteCodeInput("");
    await loadEvents(userId);
    setEventId(joinedEventId);

    setSaving(false);

    notify("✅ Event erfolgreich beigetreten.");
  }

  async function deleteEvent() {
    if (!currentEvent) return;

    if (!isAdmin) {
      notify("❌ Nur ein Administrator kann Events löschen.");
      return;
    }

    const ok = window.confirm(
      `Event "${currentEvent.title}" wirklich löschen?`
    );

    if (!ok) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", currentEvent.id);

    if (error) {
      notify("❌ " + error.message);
      return;
    }

    setEvents((prev) =>
      prev.filter((event) => event.id !== currentEvent.id)
    );

    setEventId("");

    notify("✅ Event gelöscht.");
  }

  async function saveDrink() {
    if (!eventId || !userId) {
      notify("❌ Kein Event ausgewählt.");
      return;
    }

    if (!drinkName.trim()) {
      notify("❌ Getränkenamen eingeben.");
      return;
    }

    const liters = Number(drinkLiters);
    const alcohol = Number(drinkAlcohol);
    const price = Number(drinkPrice);

    const { error } = await supabase.from("drinks").insert({
      event_id: eventId,
      getraenk: drinkName.trim(),
      drink_name: drinkName.trim(),
      menge: liters,
      liters,
      alkohol: alcohol,
      alcohol_percent: alcohol,
      preis: price,
      quantity: 1,
    });

    if (error) {
      notify("❌ Getränk konnte nicht gespeichert werden: " + error.message);
      return;
    }

    setDrinkName("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");
    setShowDrinkForm(false);

    await loadEventData(eventId);

    notify("🍺 Getränk gespeichert.");
  }

  async function assignDrink(
    personId: string,
    drink: Drink
  ) {
    if (!eventId || !userId) return;

    const liters = getDrinkLiters(drink);
    const alcohol = getDrinkAlcohol(drink);
    const price = Number(drink.preis || 0);

    const { error } = await supabase.from("drink_history").insert({
      event_id: eventId,
      profile_id: personId,
      drink_id: drink.id,
      drink_name: getDrinkName(drink),
      liters,
      alcohol_percent: alcohol,
      price,
    });

    if (error) {
      notify("❌ Getränk konnte nicht zugeordnet werden: " + error.message);
      return;
    }

    await supabase.from("points_history").insert({
      event_id: eventId,
      profile_id: personId,
      points: 10,
      reason: `Getränk: ${getDrinkName(drink)}`,
      reference_type: "drink",
      reference_id: drink.id,
    });

    await loadEventData(eventId);

    notify("🍺 Getränk zugeordnet · +10 Punkte");
  }

  async function savePayment() {
    if (!eventId || !userId) return;

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      notify("❌ Betrag eingeben.");
      return;
    }

    const payer =
      paymentPerson ||
      userId;

    const { error } = await supabase.from("payments").insert({
      event_id: eventId,
      betrag: amount,
      bezahlt_von: payer,
      profile_id: payer,
      status: "paid",
    });

    if (error) {
      notify("❌ Zahlung konnte nicht gespeichert werden: " + error.message);
      return;
    }

    setPaymentAmount("");
    setPaymentPerson("");
    setShowPaymentForm(false);

    await loadEventData(eventId);

    notify("💶 Zahlung gespeichert.");
  }

  async function donateCrate() {
    if (!eventId || !userId) return;

    const ok = window.confirm(
      "Möchtest du eine Kiste Bier spendieren? Dafür gibt es 20 Punkte."
    );

    if (!ok) return;

    const { error } = await supabase.from("crate_donations").insert({
      event_id: eventId,
      profile_id: userId,
      crates: 1,
      points_awarded: 20,
    });

    if (error) {
      notify("❌ Kiste konnte nicht gespeichert werden: " + error.message);
      return;
    }

    await supabase.from("points_history").insert({
      event_id: eventId,
      profile_id: userId,
      points: 20,
      reason: "🍺 Kiste Bier spendiert",
      reference_type: "crate",
    });

    await loadEventData(eventId);

    notify("🍺 Kiste Bier spendiert · +20 Punkte!");
  }

  async function createChallenge() {
    if (!eventId || !userId) return;

    if (!challengeTitle.trim()) {
      notify("❌ Challenge-Titel eingeben.");
      return;
    }

    const { error } = await supabase.from("challenges").insert({
      event_id: eventId,
      title: challengeTitle.trim(),
      description: challengeDescription.trim() || null,
      points: Number(challengePoints) || 10,
      category: "fun",
      status: "open",
      created_by_profile_id: userId,
      is_active: true,
    });

    if (error) {
      notify("❌ Challenge konnte nicht erstellt werden: " + error.message);
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");
    setShowChallengeForm(false);

    await loadEventData(eventId);

    notify("🏆 Challenge erstellt.");
  }

  async function sendBeerRequest(targetId: string) {
    if (!eventId || !userId) return;

    if (targetId === userId) {
      notify("😄 Du kannst kein Bier mit dir selbst anfragen.");
      return;
    }

    const { error } = await supabase.from("beer_requests").insert({
      event_id: eventId,
      requester_profile_id: userId,
      target_profile_id: targetId,
      status: "pending",
    });

    if (error) {
      notify("❌ Bier-Anfrage konnte nicht gesendet werden: " + error.message);
      return;
    }

    await loadEventData(eventId);

    notify("🍺 Bier-Anfrage gesendet.");
  }

  async function answerBeerRequest(
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
      notify("❌ " + error.message);
      return;
    }

    if (status === "accepted") {
      notify("🍺 Bier-Anfrage angenommen!");
    } else {
      notify("Anfrage abgelehnt.");
    }

    await loadEventData(eventId);
  }

  async function saveSettings() {
    if (!eventId || !isAdmin) return;

    const { error } = await supabase.rpc("update_event_settings", {
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
    });

    if (error) {
      notify("❌ Einstellungen konnten nicht gespeichert werden: " + error.message);
      return;
    }

    notify("⚙️ Einstellungen gespeichert.");
    await loadEventData(eventId);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  function toggleSetting(key: keyof EventSettings) {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  if (!userId) {
    return (
      <main className="page">
        <div className="authBox">
          <div className="bigLogo">🍻</div>

          <h1>Güstener Zapfhahn Zentrale</h1>

          <p>
            Du bist nicht angemeldet.
          </p>

          <p className="muted">
            Bitte zuerst über Supabase Auth anmelden.
          </p>

          <button
            className="primary"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            🔐 Zur Anmeldung
          </button>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

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

          <div className="headerUser">
            <span>👤 {profile?.name || "Benutzer"}</span>

            {isAdmin && (
              <span className="adminBadge">
                👑 ADMIN
              </span>
            )}

            <button
              className="smallButton"
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
                  {currentEvent.title}
                  {currentEvent.location
                    ? ` · ${currentEvent.location}`
                    : ""}
                </p>
              )}
            </div>

            <div className="actions">
              <button
                onClick={() =>
                  setShowEventForm((value) => !value)
                }
              >
                ➕ Neues Event
              </button>

              {currentEvent && isAdmin && (
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
              setActiveTab("dashboard");
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

          {currentEvent && (
            <div className="inviteBox">
              <span>🔑 Einladungscode</span>

              <strong>
                {currentEvent.invite_code}
              </strong>

              <button
                onClick={() =>
                  navigator.clipboard?.writeText(
                    currentEvent.invite_code
                  )
                }
              >
                📋 Kopieren
              </button>
            </div>
          )}

          {showEventForm && (
            <div className="formBox">
              <h3>🍻 Neues Event</h3>

              <input
                placeholder="Eventname"
                value={eventTitle}
                onChange={(e) =>
                  setEventTitle(e.target.value)
                }
              />

              <textarea
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
                disabled={saving}
                onClick={createEvent}
              >
                {saving
                  ? "⏳ Wird erstellt..."
                  : "🍻 Event erstellen"}
              </button>
            </div>
          )}

          <div className="joinBox">
            <input
              placeholder="Einladungscode eingeben"
              value={inviteCodeInput}
              onChange={(e) =>
                setInviteCodeInput(
                  e.target.value.toUpperCase()
                )
              }
            />

            <button onClick={joinEvent}>
              🔗 Event beitreten
            </button>
          </div>
        </section>

        {!currentEvent ? (
          <section className="card empty">
            <div className="emptyIcon">🍺</div>

            <h2>Kein Event ausgewählt</h2>

            <p>
              Erstelle ein neues Event oder tritt einem
              bestehenden Event mit einem Einladungscode bei.
            </p>
          </section>
        ) : (
          <>
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
                  📜 Verlauf
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

              {isAdmin && (
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
                {settings.show_statistics && (
                  <div className="stats">
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
                      <span>💶</span>
                      <strong>
                        {totalCost.toFixed(2)} €
                      </strong>
                      <small>Getränke</small>
                    </div>

                    <div className="stat">
                      <span>👥</span>
                      <strong>
                        {members.length}
                      </strong>
                      <small>Teilnehmer</small>
                    </div>
                  </div>
                )}

                {settings.show_beer_button && (
                  <section className="beerHero">
                    <button
                      className="beerButton"
                      onClick={() => {
                        if (!userId) return;

                        const others = members.filter(
                          (member) =>
                            member.profile_id !== userId
                        );

                        if (others.length === 0) {
                          notify(
                            "👥 Keine weiteren Teilnehmer im Event."
                          );
                          return;
                        }

                        others.forEach((member) => {
                          sendBeerRequest(
                            member.profile_id
                          );
                        });
                      }}
                    >
                      <span className="beerIcon">
                        🍺
                      </span>

                      <span className="beerTitle">
                        BIER
                      </span>

                      <span className="beerSubtitle">
                        Wer trinkt ein Bier mit mir?
                      </span>
                    </button>
                  </section>
                )}

                {settings.show_crate_button && (
                  <section className="card crateCard">
                    <button
                      className="crateButton"
                      onClick={donateCrate}
                    >
                      <span>🍺</span>
                      <div>
                        <strong>
                          Kiste Bier spendieren
                        </strong>
                        <small>
                          +20 Punkte
                        </small>
                      </div>
                      <b>🏆 +20</b>
                    </button>
                  </section>
                )}

                {settings.show_beer_requests && (
                  <section className="card">
                    <div className="sectionHeader">
                      <h2>🔔 Bier-Anfragen</h2>
                    </div>

                    {beerRequests.length === 0 ? (
                      <p className="muted">
                        Keine Bier-Anfragen.
                      </p>
                    ) : (
                      beerRequests.map((request) => {
                        const isTarget =
                          request.target_profile_id ===
                          userId;

                        return (
                          <div
                            className="request"
                            key={request.id}
                          >
                            <div>
                              <strong>
                                🍻{" "}
                                {request.requester?.name ||
                                  "Jemand"}
                              </strong>

                              <span>
                                möchte ein Bier mit dir
                                trinken.
                              </span>

                              <small>
                                {new Date(
                                  request.created_at
                                ).toLocaleString(
                                  "de-DE"
                                )}
                              </small>
                            </div>

                            {request.status ===
                            "pending" &&
                            isTarget ? (
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
                                  ✅ Zugesagt
                                </button>

                                <button
                                  className="danger"
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
                            ) : (
                              <span
                                className={
                                  request.status ===
                                  "accepted"
                                    ? "statusAccepted"
                                    : request.status ===
                                      "declined"
                                    ? "statusDeclined"
                                    : "statusPending"
                                }
                              >
                                {request.status ===
                                "accepted"
                                  ? "✅ Zugesagt"
                                  : request.status ===
                                    "declined"
                                  ? "❌ Abgelehnt"
                                  : "⏳ Offen"}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </section>
                )}

                {settings.show_participants && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>🍻 Teilnehmer</h2>
                        <p>
                          {members.length} Teilnehmer
                        </p>
                      </div>
                    </div>

                    {members.map((member) => {
                      const person =
                        member.profile;

                      const points =
                        pointsByPerson.get(
                          member.profile_id
                        ) || 0;

                      const personDrinks =
                        history.filter(
                          (item) =>
                            item.profile_id ===
                            member.profile_id
                        );

                      const personLiters =
                        personDrinks.reduce(
                          (sum, item) =>
                            sum +
                            Number(
                              item.liters || 0
                            ),
                          0
                        );

                      return (
                        <div
                          className="personCard"
                          key={member.id}
                          onClick={() =>
                            person &&
                            setSelectedPerson(person)
                          }
                        >
                          <div className="avatar">
                            {person?.name
                              ?.charAt(0)
                              .toUpperCase() ||
                              "?"}
                          </div>

                          <div className="personInfo">
                            <strong>
                              👤{" "}
                              {person?.name ||
                                "Unbekannt"}
                            </strong>

                            <span>
                              🍺{" "}
                              {
                                personDrinks.length
                              }{" "}
                              · 💧{" "}
                              {personLiters.toFixed(
                                1
                              )}{" "}
                              L · 🏆{" "}
                              {points}
                            </span>
                          </div>

                          <div className="personActions">
                            {settings.show_points && (
                              <b>
                                🏆 {points}
                              </b>
                            )}

                            <span>›</span>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                )}

                {settings.show_drinks && (
                  <section className="card">
                    <div className="sectionHeader">
                      <h2>🍺 Getränke</h2>

                      <button
                        onClick={() =>
                          setShowDrinkForm(
                            (value) => !value
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
                          value={drinkName}
                          onChange={(e) =>
                            setDrinkName(
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
                          onClick={saveDrink}
                        >
                          🍻 Getränk speichern
                        </button>
                      </div>
                    )}

                    {drinks.length === 0 ? (
                      <p className="muted">
                        Noch keine Getränke.
                      </p>
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
                            <strong>
                              {getDrinkName(
                                drink
                              )}
                            </strong>

                            <small>
                              {getDrinkLiters(
                                drink
                              ).toFixed(1)}{" "}
                              Liter ·{" "}
                              {getDrinkAlcohol(
                                drink
                              ).toFixed(1)}{" "}
                              %
                            </small>
                          </div>

                          <b>
                            {Number(
                              drink.preis || 0
                            ).toFixed(2)}{" "}
                            €
                          </b>
                        </div>
                      ))
                    )}
                  </section>
                )}

                {settings.show_drinks &&
                  members.length > 0 &&
                  drinks.length > 0 && (
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
                            {member.profile
                              ?.name ||
                              "Unbekannt"}
                          </strong>

                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const drink =
                                drinks.find(
                                  (item) =>
                                    item.id ===
                                    e.target.value
                                );

                              if (drink) {
                                assignDrink(
                                  member.profile_id,
                                  drink
                                );

                                e.target.value =
                                  "";
                              }
                            }}
                          >
                            <option value="">
                              🍺 Getränk auswählen
                            </option>

                            {drinks.map(
                              (drink) => (
                                <option
                                  key={drink.id}
                                  value={
                                    drink.id
                                  }
                                >
                                  {getDrinkName(
                                    drink
                                  )}{" "}
                                  ·{" "}
                                  {Number(
                                    drink.preis ||
                                      0
                                  ).toFixed(2)}
                                  €
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      ))}
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
                            {totalPaid.toFixed(
                              2
                            )}{" "}
                            €
                          </strong>
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setShowPaymentForm(
                            (value) => !value
                          )
                        }
                      >
                        💶 Zahlung speichern
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
                                  member.profile
                                    ?.name
                                }
                              </option>
                            )
                          )}
                        </select>

                        <button
                          className="primary full"
                          onClick={savePayment}
                        >
                          💶 Zahlung speichern
                        </button>
                      </div>
                    )}

                    {payments.map(
                      (payment) => (
                        <div
                          className="paymentRow"
                          key={payment.id}
                        >
                          <div>
                            <strong>
                              💶{" "}
                              {payment.payer
                                ?.name ||
                                getProfileName(
                                  payment.bezahlt_von
                                )}
                            </strong>

                            <small>
                              {new Date(
                                payment.created_at
                              ).toLocaleString(
                                "de-DE"
                              )}
                            </small>
                          </div>

                          <div className="paymentRight">
                            <strong>
                              {Number(
                                payment.betrag
                              ).toFixed(2)}{" "}
                              €
                            </strong>

                            <span>
                              {payment.status ===
                              "paid"
                                ? "Bezahlt"
                                : payment.status}
                            </span>
                          </div>
                        </div>
                      )
                    )}

                    {settings.show_who_owes && (
                      <div className="owedBox">
                        <span>
                          💰 Noch zu bezahlen
                        </span>

                        <strong>
                          {totalOwed.toFixed(2)} €
                        </strong>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            {activeTab === "ranking" &&
              settings.show_ranking && (
                <section className="card">
                  <h2>🏆 Rangliste</h2>

                  <p className="muted">
                    Tippe auf eine Person, um zu sehen,
                    wofür sie Punkte bekommen hat.
                  </p>

                  {ranking.map(
                    (item, index) => (
                      <div
                        className="rankingRow"
                        key={
                          item.member.profile_id
                        }
                        onClick={() =>
                          item.member.profile &&
                          setSelectedPerson(
                            item.member.profile
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

                        <div className="rankName">
                          <strong>
                            {item.member.profile
                              ?.name ||
                              "Unbekannt"}
                          </strong>

                          <small>
                            {item.member.role ===
                            "admin"
                              ? "👑 Admin"
                              : "👤 Teilnehmer"}
                          </small>
                        </div>

                        <b>
                          {item.points} Punkte
                        </b>

                        <span>›</span>
                      </div>
                    )
                  )}
                </section>
              )}

            {activeTab === "history" &&
              settings.show_drink_history && (
                <section className="card">
                  <h2>📜 Getränkeverlauf</h2>

                  <p className="muted">
                    Hier siehst du genau, wer wann
                    welches Getränk getrunken hat.
                  </p>

                  {history.length === 0 ? (
                    <p>
                      Noch kein Getränkeverlauf.
                    </p>
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
                          <strong>
                            {item.profile?.name ||
                              "Unbekannt"}
                          </strong>

                          <span>
                            hat{" "}
                            <b>
                              {item.drink_name}
                            </b>{" "}
                            getrunken.
                          </span>

                          <small>
                            {Number(
                              item.liters
                            ).toFixed(1)}{" "}
                            L ·{" "}
                            {Number(
                              item.alcohol_percent
                            ).toFixed(1)}
                            % ·{" "}
                            {new Date(
                              item.consumed_at
                            ).toLocaleString(
                              "de-DE"
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
                  <div className="sectionHeader">
                    <div>
                      <h2>🎯 Challenges</h2>
                      <p>
                        Aufgaben, Punkte und Wettbewerbe
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setShowChallengeForm(
                          (value) => !value
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
                    <div className="emptySmall">
                      <span>🎯</span>
                      <p>
                        Noch keine Challenges.
                      </p>
                    </div>
                  ) : (
                    challenges.map(
                      (challenge) => (
                        <div
                          className="challenge"
                          key={challenge.id}
                        >
                          <div className="challengeIcon">
                            🎯
                          </div>

                          <div className="challengeInfo">
                            <strong>
                              {
                                challenge.title
                              }
                            </strong>

                            {challenge.description && (
                              <p>
                                {
                                  challenge.description
                                }
                              </p>
                            )}

                            <small>
                              {challenge.status ===
                              "open"
                                ? "🟢 Offen"
                                : challenge.status}
                            </small>
                          </div>

                          {settings.show_challenge_points && (
                            <b>
                              🏆{" "}
                              {
                                challenge.points
                              }
                            </b>
                          )}
                        </div>
                      )
                    )
                  )}
                </section>
              )}

            {activeTab === "settings" &&
              isAdmin && (
                <section className="card">
                  <h2>⚙️ Event-Einstellungen</h2>

                  <p className="muted">
                    Als Event-Administrator entscheidest
                    du, welche Bereiche und Buttons
                    innerhalb dieses Events sichtbar sind.
                  </p>

                  <div className="settingsGrid">
                    {(
                      [
                        [
                          "show_participants",
                          "👥 Teilnehmer",
                        ],
                        ["show_drinks", "🍺 Getränke"],
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
                          "💰 Wer noch bezahlen muss",
                        ],
                      ] as [
                        keyof EventSettings,
                        string
                      ][]
                    ).map(
                      ([key, label]) => (
                        <button
                          key={key}
                          className={
                            settings[key]
                              ? "setting on"
                              : "setting off"
                          }
                          onClick={() =>
                            toggleSetting(
                              key
                            )
                          }
                        >
                          <span>
                            {label}
                          </span>

                          <b>
                            {settings[key]
                              ? "AN"
                              : "AUS"}
                          </b>
                        </button>
                      )
                    )}
                  </div>

                  <button
                    className="primary full saveSettings"
                    onClick={saveSettings}
                  >
                    💾 Einstellungen speichern
                  </button>
                </section>
              )}
          </>
        )}

        {selectedPerson && (
          <div
            className="modalBackdrop"
            onClick={() =>
              setSelectedPerson(null)
            }
          >
            <div
              className="modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <button
                className="close"
                onClick={() =>
                  setSelectedPerson(null)
                }
              >
                ×
              </button>

              <div className="profileAvatar">
                {selectedPerson.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h2>
                {selectedPerson.name}
              </h2>

              <p className="muted">
                Punkteübersicht
              </p>

              <div className="profilePoints">
                🏆{" "}
                {pointsByPerson.get(
                  selectedPerson.id
                ) || 0}{" "}
                Punkte
              </div>

              <h3>
                ⭐ Wofür wurden die Punkte
                vergeben?
              </h3>

              <div className="pointsList">
                {pointsHistory.filter(
                  (item) =>
                    item.profile_id ===
                    selectedPerson.id
                ).length === 0 ? (
                  <p className="muted">
                    Noch keine Punkte-Historie.
                  </p>
                ) : (
                  pointsHistory
                    .filter(
                      (item) =>
                        item.profile_id ===
                        selectedPerson.id
                    )
                    .map((item) => (
                      <div
                        className="pointRow"
                        key={item.id}
                      >
                        <div>
                          <strong>
                            {item.reason}
                          </strong>

                          <small>
                            {new Date(
                              item.created_at
                            ).toLocaleString(
                              "de-DE"
                            )}
                          </small>
                        </div>

                        <b>
                          +{item.points}
                        </b>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="toast">
            {message}
          </div>
        )}

        <footer>
          🍻 Güstener Zapfhahn Zentrale
          <small>
            Dein Event · Deine Getränke · Deine Runde
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
  padding: 18px;
  color: white;
  background:
    radial-gradient(
      circle at 50% -10%,
      #243c52 0%,
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
  max-width: 980px;
  margin: 0 auto;
}

.header {
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

.logo {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  font-size: 34px;
  border-radius: 20px;
  background:
    linear-gradient(
      145deg,
      #f59e0b,
      #b45309
    );
  box-shadow:
    0 10px 30px rgba(245,158,11,.2);
}

h1 {
  margin: 0;
  font-size: clamp(22px, 4vw, 32px);
}

h2 {
  margin: 0 0 6px;
  font-size: 21px;
}

h3 {
  margin-top: 20px;
}

p {
  margin: 5px 0;
  color: #94a3b8;
}

.muted {
  color: #7f8b99;
}

.headerUser {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.adminBadge {
  background: #7c2d12;
  color: #fdba74;
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: bold;
}

.card {
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.075),
      rgba(255,255,255,.035)
    );
  border:
    1px solid rgba(255,255,255,.09);
  border-radius: 22px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow:
    0 15px 40px rgba(0,0,0,.18);
  backdrop-filter: blur(12px);
}

.eventCard {
  border-color:
    rgba(245,158,11,.18);
}

.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 12px 15px;
  background: #f59e0b;
  color: #111827;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform .15s,
    filter .15s,
    box-shadow .15s;
}

button:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

button:active {
  transform: scale(.98);
}

button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.smallButton {
  padding: 8px 11px;
  background: #273444;
  color: white;
  font-size: 12px;
}

.primary {
  background:
    linear-gradient(
      135deg,
      #fbbf24,
      #f59e0b
    );
}

.full {
  width: 100%;
}

.danger {
  background: #7f1d1d;
  color: #fecaca;
}

.accept {
  background: #166534;
  color: #dcfce7;
}

input,
select,
textarea {
  width: 100%;
  border:
    1px solid #334155;
  border-radius: 12px;
  padding: 13px;
  margin-bottom: 10px;
  background: #111923;
  color: white;
  outline: none;
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

.inviteBox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(245,158,11,.08);
  border: 1px solid rgba(245,158,11,.2);
  margin-bottom: 12px;
}

.inviteBox strong {
  font-size: 20px;
  letter-spacing: 2px;
  color: #fbbf24;
}

.formBox {
  background: rgba(0,0,0,.18);
  border: 1px solid rgba(255,255,255,.07);
  padding: 15px;
  border-radius: 16px;
  margin: 12px 0;
}

.joinBox {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.joinBox input {
  margin: 0;
}

.stats {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.stat {
  text-align: center;
  padding: 16px 10px;
  border-radius: 18px;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.06);
}

.stat span {
  display: block;
  font-size: 24px;
}

.stat strong {
  display: block;
  font-size: 22px;
  margin: 4px 0;
}

.stat small {
  color: #7f8b99;
}

.tabs {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 3px;
}

.tabs button {
  flex: 0 0 auto;
  background: #17212d;
  color: #aeb9c5;
}

.tabs button.active {
  background: #f59e0b;
  color: #111;
}

.beerHero {
  margin-bottom: 15px;
}

.beerButton {
  width: 100%;
  min-height: 145px;
  border-radius: 25px;
  color: white;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 50% 100%,
      #dc2626,
      #991b1b 45%,
      #450a0a 100%
    );
  border:
    2px solid rgba(248,113,113,.4);
  box-shadow:
    0 15px 45px rgba(220,38,38,.25);
  animation:
    pulseBeer 2.4s infinite;
}

.beerIcon {
  display: block;
  font-size: 42px;
  animation:
    beerFloat 1.8s ease-in-out infinite;
}

.beerTitle {
  display: block;
  font-size: 30px;
  letter-spacing: 5px;
  margin-top: 4px;
}

.beerSubtitle {
  display: block;
  margin-top: 5px;
  color: #fecaca;
}

@keyframes pulseBeer {
  0%,100% {
    box-shadow:
      0 15px 45px
      rgba(220,38,38,.2);
  }
  50% {
    box-shadow:
      0 15px 55px
      rgba(220,38,38,.48);
  }
}

@keyframes beerFloat {
  0%,100% {
    transform: rotate(-4deg)
      translateY(0);
  }
  50% {
    transform: rotate(4deg)
      translateY(-6px);
  }
}

.crateCard {
  padding: 12px;
}

.crateButton {
  width: 100%;
  display: grid;
  grid-template-columns:
    55px 1fr auto;
  align-items: center;
  text-align: left;
  gap: 12px;
  background:
    linear-gradient(
      135deg,
      #92400e,
      #451a03
    );
  color: #fff7ed;
  border:
    1px solid #b45309;
  padding: 15px;
}

.crateButton > span {
  font-size: 35px;
}

.crateButton div {
  display: flex;
  flex-direction: column;
}

.crateButton small {
  color: #fed7aa;
  margin-top: 3px;
}

.request {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 14px;
  border-radius: 15px;
  background: rgba(255,255,255,.045);
  margin-top: 8px;
}

.request div:first-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.request small {
  color: #64748b;
}

.requestButtons {
  display: flex;
  gap: 7px;
}

.statusAccepted {
  color: #4ade80;
  font-weight: bold;
}

.statusDeclined {
  color: #f87171;
  font-weight: bold;
}

.statusPending {
  color: #fbbf24;
  font-weight: bold;
}

.personCard {
  display: grid;
  grid-template-columns:
    45px 1fr auto;
  align-items: center;
  gap: 11px;
  padding: 12px;
  margin-top: 8px;
  border-radius: 15px;
  background: rgba(255,255,255,.045);
  cursor: pointer;
}

.personCard:hover {
  background: rgba(255,255,255,.08);
}

.avatar {
  width: 43px;
  height: 43px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #334155;
  color: #fbbf24;
  font-weight: bold;
}

.personInfo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.personInfo span {
  color: #8995a3;
  font-size: 13px;
}

.personActions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.personActions span {
  color: #64748b;
  font-size: 25px;
}

.three {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 8px;
}

.drinkRow,
.paymentRow,
.historyRow,
.challenge,
.rankingRow,
.pointRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  border-radius: 14px;
  background: rgba(255,255,255,.045);
  margin-top: 8px;
}

.drinkIcon,
.historyIcon,
.challengeIcon {
  width: 43px;
  height: 43px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: #17212d;
  font-size: 22px;
}

.drinkInfo,
.challengeInfo,
.historyRow > div:last-child {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.drinkInfo small,
.historyRow small,
.challengeInfo small,
.paymentRow small,
.rankName small,
.pointRow small {
  color: #7f8b99;
}

.assignment {
  display: grid;
  grid-template-columns:
    1fr 1.5fr;
  gap: 10px;
  align-items: center;
  margin-top: 8px;
}

.assignment select {
  margin: 0;
}

.paymentRight {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.paymentRight span {
  color: #4ade80;
  font-size: 12px;
}

.owedBox {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-top: 12px;
  border-radius: 14px;
  background: rgba(220,38,38,.1);
  border: 1px solid rgba(220,38,38,.2);
}

.owedBox strong {
  color: #f87171;
  font-size: 20px;
}

.rankingRow {
  cursor: pointer;
  display: grid;
  grid-template-columns:
    45px 1fr auto 20px;
}

.rankPlace {
  font-size: 22px;
  text-align: center;
}

.rankName {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rankingRow > span:last-child {
  color: #64748b;
  font-size: 24px;
}

.historyRow {
  align-items: flex-start;
}

.historyRow span {
  color: #a7b1bd;
}

.challenge {
  align-items: flex-start;
}

.challengeInfo p {
  color: #8995a3;
  margin: 5px 0;
}

.settingsGrid {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 8px;
  margin-top: 15px;
}

.setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #18222e;
  color: #cbd5e1;
  text-align: left;
}

.setting b {
  font-size: 11px;
}

.setting.on {
  border: 1px solid rgba(74,222,128,.25);
}

.setting.on b {
  color: #4ade80;
}

.setting.off {
  opacity: .55;
}

.setting.off b {
  color: #f87171;
}

.saveSettings {
  margin-top: 15px;
}

.empty {
  text-align: center;
  padding: 50px 20px;
}

.emptyIcon {
  font-size: 50px;
}

.emptySmall {
  text-align: center;
  padding: 30px;
  color: #64748b;
}

.emptySmall span {
  font-size: 35px;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 25px;
  transform: translateX(-50%);
  z-index: 1000;
  max-width: calc(100vw - 30px);
  padding: 14px 18px;
  border-radius: 14px;
  background: #111923;
  border: 1px solid #334155;
  color: #fbbf24;
  box-shadow:
    0 15px 40px rgba(0,0,0,.4);
  text-align: center;
}

.modalBackdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(0,0,0,.75);
  backdrop-filter: blur(8px);
}

.modal {
  width: 100%;
  max-width: 550px;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  border-radius: 24px;
  padding: 25px;
  background: #111923;
  border: 1px solid #334155;
  box-shadow:
    0 30px 80px rgba(0,0,0,.55);
}

.close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #273444;
  color: white;
  font-size: 22px;
  width: 38px;
  height: 38px;
  padding: 0;
}

.profileAvatar {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto 10px;
  background:
    linear-gradient(
      135deg,
      #f59e0b,
      #b45309
    );
  color: #111;
  font-size: 32px;
  font-weight: bold;
}

.modal h2,
.modal > p {
  text-align: center;
}

.profilePoints {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  color: #fbbf24;
  padding: 15px;
  border-radius: 15px;
  background: rgba(245,158,11,.08);
}

.pointRow {
  justify-content: space-between;
}

.pointRow > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pointRow > b {
  color: #4ade80;
}

footer {
  text-align: center;
  color: #64748b;
  padding: 30px 10px 15px;
}

footer small {
  display: block;
  margin-top: 5px;
}

.authBox {
  width: 100%;
  max-width: 500px;
  margin: 15vh auto;
  text-align: center;
  padding: 35px 25px;
  border-radius: 25px;
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.08),
      rgba(255,255,255,.035)
    );
  border: 1px solid rgba(255,255,255,.1);
}

.bigLogo {
  font-size: 70px;
  margin-bottom: 15px;
}

@media(max-width: 700px) {
  .page {
    padding: 10px;
  }

  .header {
    align-items: flex-start;
    flex-direction: column;
  }

  .headerUser {
    width: 100%;
    justify-content: flex-start;
  }

  .stats {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .three {
    grid-template-columns: 1fr;
  }

  .joinBox {
    grid-template-columns: 1fr;
  }

  .joinBox input {
    margin-bottom: 0;
  }

  .sectionHeader {
    align-items: flex-start;
    flex-direction: column;
  }

  .inviteBox {
    flex-wrap: wrap;
  }

  .request {
    align-items: flex-start;
    flex-direction: column;
  }

  .assignment {
    grid-template-columns: 1fr;
  }

  .settingsGrid {
    grid-template-columns: 1fr;
  }

  .rankingRow {
    grid-template-columns:
      40px 1fr auto 15px;
  }

  .crateButton {
    grid-template-columns:
      45px 1fr;
  }

  .crateButton > b {
    grid-column: 2;
  }

  .personCard {
    grid-template-columns:
      42px 1fr;
  }

  .personActions {
    grid-column: 2;
    justify-content: space-between;
  }
}
`;
