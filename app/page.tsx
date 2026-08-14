"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url?: string | null;
  is_global_admin?: boolean | null;
};

type Event = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  invite_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  created_by?: string | null;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string | null;
  role?: string | null;
  profile?: Profile | null;
};

type EventSettings = {
  id?: string;
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
  reference_id?: string | null;
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
  required_votes?: number | null;
  duration_minutes?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  completed_at?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type ChallengeParticipant = {
  id: string;
  challenge_id: string;
  profile_id: string;
  joined_at?: string | null;
  accepted?: boolean | null;
  completed?: boolean | null;
  points_awarded?: number | null;
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
  consumed_at?: string | null;
};

type View =
  | "dashboard"
  | "participants"
  | "drinks"
  | "history"
  | "payments"
  | "ranking"
  | "challenges"
  | "settings";

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

export default function Home() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [crateDonations, setCrateDonations] = useState<CrateDonation[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeParticipants, setChallengeParticipants] =
    useState<ChallengeParticipant[]>([]);
  const [drinkHistory, setDrinkHistory] = useState<DrinkHistory[]>([]);
  const [settings, setSettings] =
    useState<EventSettings>(DEFAULT_SETTINGS);

  const [view, setView] = useState<View>("dashboard");
  const [selectedProfileId, setSelectedProfileId] = useState("");

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showJoinEvent, setShowJoinEvent] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");
  const [drinkPerson, setDrinkPerson] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPerson, setPaymentPerson] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePoints, setChallengePoints] = useState("20");

  const [showProfile, setShowProfile] = useState(false);
  const [showCrateModal, setShowCrateModal] = useState(false);
  const [showBeerModal, setShowBeerModal] = useState(false);
  const [crateCount, setCrateCount] = useState("1");

  const currentEvent = useMemo(
    () => events.find((event) => event.id === eventId) ?? null,
    [events, eventId]
  );

  const isGlobalAdmin = Boolean(profile?.is_global_admin);

  const currentMember = useMemo(
    () =>
      members.find(
        (member) => member.profile_id === profile?.id
      ),
    [members, profile?.id]
  );

  const isEventAdmin =
    isGlobalAdmin ||
    currentEvent?.created_by === profile?.id ||
    currentMember?.role === "admin";

  const totalLiters = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(
            drink.liters ??
              drink.menge ??
              0
          ),
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

  const totalOpen = Math.max(
    totalDrinkCost - totalPaid,
    0
  );

  const pointsByProfile = useMemo(() => {
    const result: Record<string, number> = {};

    for (const member of members) {
      result[member.profile_id] = 0;
    }

    for (const item of pointHistory) {
      result[item.profile_id] =
        (result[item.profile_id] ?? 0) +
        Number(item.points ?? 0);
    }

    return result;
  }, [members, pointHistory]);

  const drinksByProfile = useMemo(() => {
    const result: Record<string, number> = {};

    for (const drink of drinks) {
      if (!drink.profile_id) continue;

      result[drink.profile_id] =
        (result[drink.profile_id] ?? 0) +
        Number(drink.quantity ?? 1);
    }

    for (const item of drinkHistory) {
      result[item.profile_id] =
        result[item.profile_id] ?? 0;
    }

    return result;
  }, [drinks, drinkHistory]);

  const litersByProfile = useMemo(() => {
    const result: Record<string, number> = {};

    for (const item of drinkHistory) {
      result[item.profile_id] =
        (result[item.profile_id] ?? 0) +
        Number(item.liters ?? 0);
    }

    return result;
  }, [drinkHistory]);

  const paidByProfile = useMemo(() => {
    const result: Record<string, number> = {};

    for (const payment of payments) {
      const id =
        payment.bezahlt_von ??
        payment.profile_id;

      if (!id) continue;

      result[id] =
        (result[id] ?? 0) +
        Number(payment.betrag ?? 0);
    }

    return result;
  }, [payments]);

  const ranking = useMemo(() => {
    return [...members]
      .map((member) => ({
        ...member,
        points:
          pointsByProfile[member.profile_id] ?? 0,
      }))
      .sort((a, b) => b.points - a.points);
  }, [members, pointsByProfile]);

  function profileName(id?: string | null) {
    if (!id) return "Unbekannt";

    const member = members.find(
      (item) => item.profile_id === id
    );

    if (member?.profile?.name) {
      return member.profile.name;
    }

    if (id === profile?.id) {
      return profile?.name || "Ich";
    }

    return "Teilnehmer";
  }

  function notify(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 5000);
  }

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      notify("❌ Profil konnte nicht geladen werden.");
      return;
    }

    setProfile(data as Profile | null);
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      notify(
        "❌ Events konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    const list = (data ?? []) as Event[];

    setEvents(list);

    if (
      !eventId ||
      !list.some((event) => event.id === eventId)
    ) {
      if (list.length > 0) {
        setEventId(list[0].id);
      }
    }
  }

  async function loadEventData(id: string) {
    if (!id) return;

    setBusy(true);

    try {
      const [
        membersResult,
        drinksResult,
        paymentsResult,
        pointsResult,
        beerResult,
        cratesResult,
        challengesResult,
        challengeParticipantsResult,
        historyResult,
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
              avatar_url,
              is_global_admin
            )
          `)
          .eq("event_id", id),

        supabase
          .from("drinks")
          .select("*")
          .eq("event_id", id)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("payments")
          .select("*")
          .eq("event_id", id)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("points_history")
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
          .from("crate_donations")
          .select("*")
          .eq("event_id", id)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("challenges")
          .select("*")
          .eq("event_id", id)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("challenge_participants")
          .select("*"),

        supabase
          .from("drink_history")
          .select("*")
          .eq("event_id", id)
          .order("consumed_at", {
            ascending: false,
          }),

        supabase
          .from("event_settings")
          .select("*")
          .eq("event_id", id)
          .maybeSingle(),
      ]);

      if (membersResult.error) {
        notify(
          "❌ Teilnehmer konnten nicht geladen werden: " +
            membersResult.error.message
        );
      } else {
        const normalized = (
          membersResult.data ?? []
        ).map((item: any) => ({
          ...item,
          profile: Array.isArray(item.profile)
            ? item.profile[0] ?? null
            : item.profile ?? null,
        }));

        setMembers(normalized as EventMember[]);
      }

      if (drinksResult.error) {
        notify(
          "❌ Getränke konnten nicht geladen werden: " +
            drinksResult.error.message
        );
      } else {
        setDrinks(
          (drinksResult.data ?? []) as Drink[]
        );
      }

      if (paymentsResult.error) {
        notify(
          "❌ Zahlungen konnten nicht geladen werden: " +
            paymentsResult.error.message
        );
      } else {
        setPayments(
          (paymentsResult.data ?? []) as Payment[]
        );
      }

      if (pointsResult.error) {
        setPointHistory([]);
      } else {
        setPointHistory(
          (pointsResult.data ?? []) as PointHistory[]
        );
      }

      if (beerResult.error) {
        setBeerRequests([]);
      } else {
        setBeerRequests(
          (beerResult.data ?? []) as BeerRequest[]
        );
      }

      if (cratesResult.error) {
        setCrateDonations([]);
      } else {
        setCrateDonations(
          (cratesResult.data ?? []) as CrateDonation[]
        );
      }

      if (challengesResult.error) {
        setChallenges([]);
      } else {
        setChallenges(
          (challengesResult.data ?? []) as Challenge[]
        );
      }

      if (challengeParticipantsResult.error) {
        setChallengeParticipants([]);
      } else {
        setChallengeParticipants(
          (challengeParticipantsResult.data ?? []) as ChallengeParticipant[]
        );
      }

      if (historyResult.error) {
        setDrinkHistory([]);
      } else {
        setDrinkHistory(
          (historyResult.data ?? []) as DrinkHistory[]
        );
      }

      if (settingsResult.error) {
        setSettings({
          ...DEFAULT_SETTINGS,
          event_id: id,
        });
      } else if (settingsResult.data) {
        setSettings(
          settingsResult.data as EventSettings
        );
      } else {
        setSettings({
          ...DEFAULT_SETTINGS,
          event_id: id,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }

      setSessionLoading(false);
    }

    init();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setEvents([]);
          setEventId("");
        }

        setSessionLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    loadEvents();
  }, [user?.id]);

  useEffect(() => {
    if (!eventId) return;
    loadEventData(eventId);
  }, [eventId]);

  async function login() {
    setBusy(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    setBusy(false);

    if (error) {
      notify(
        "❌ Anmeldung fehlgeschlagen: " +
          error.message
      );
      return;
    }

    notify("✅ Erfolgreich angemeldet.");
  }

  async function register() {
    if (!email.trim() || !password) {
      notify(
        "❌ Bitte E-Mail und Passwort eingeben."
      );
      return;
    }

    if (password.length < 6) {
      notify(
        "❌ Das Passwort muss mindestens 6 Zeichen haben."
      );
      return;
    }

    setBusy(true);

    const { data, error } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name:
              name.trim() ||
              email.split("@")[0],
          },
        },
      });

    setBusy(false);

    if (error) {
      notify(
        "❌ Registrierung fehlgeschlagen: " +
          error.message
      );
      return;
    }

    if (data.user) {
      notify(
        "✅ Benutzer erstellt. Falls E-Mail-Bestätigung aktiviert ist, bitte E-Mail bestätigen."
      );
    }
  }

  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setEvents([]);
    setEventId("");
    setMembers([]);
    setDrinks([]);
    setPayments([]);
    setPointHistory([]);
    setBeerRequests([]);
    setCrateDonations([]);
    setChallenges([]);
    setDrinkHistory([]);
  }

  async function createEvent() {
    if (!eventTitle.trim()) {
      notify("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    setBusy(true);

    const { data, error } =
      await supabase.rpc("create_event", {
        p_title: eventTitle.trim(),
        p_description:
          eventDescription.trim() || null,
        p_location:
          eventLocation.trim() || null,
      });

    setBusy(false);

    if (error) {
      notify(
        "❌ Event konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    const newId = data as string;

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setShowCreateEvent(false);

    await loadEvents();

    if (newId) {
      setEventId(newId);
    }

    notify("✅ Event erfolgreich erstellt.");
  }

  async function joinEvent() {
    if (!inviteCodeInput.trim()) {
      notify(
        "❌ Bitte Einladungscode eingeben."
      );
      return;
    }

    setBusy(true);

    const { data, error } =
      await supabase.rpc("join_event", {
        p_invite_code:
          inviteCodeInput.trim(),
      });

    setBusy(false);

    if (error) {
      notify(
        "❌ Beitreten fehlgeschlagen: " +
          error.message
      );
      return;
    }

    const joinedId = data as string;

    setInviteCodeInput("");
    setShowJoinEvent(false);

    await loadEvents();

    if (joinedId) {
      setEventId(joinedId);
    }

    notify("✅ Du bist dem Event beigetreten.");
  }

  async function deleteEvent() {
    if (!currentEvent) return;

    if (!isEventAdmin) {
      notify(
        "❌ Du bist kein Administrator dieses Events."
      );
      return;
    }

    if (
      !window.confirm(
        `Event "${currentEvent.title}" wirklich löschen?`
      )
    ) {
      return;
    }

    setBusy(true);

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", currentEvent.id);

    setBusy(false);

    if (error) {
      notify(
        "❌ Event konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    setEventId("");
    await loadEvents();

    notify("✅ Event gelöscht.");
  }

  async function addDrink() {
    if (!currentEvent) return;

    if (!drinkName.trim()) {
      notify(
        "❌ Bitte ein Getränk eingeben."
      );
      return;
    }

    setBusy(true);

    const liters = Number(drinkLiters) || 0;
    const alcohol = Number(drinkAlcohol) || 0;
    const price = Number(drinkPrice) || 0;

    const payload = {
      event_id: currentEvent.id,
      profile_id:
        drinkPerson || null,
      category: "drink",
      drink_name: drinkName.trim(),
      brand:
        drinkBrand.trim() || null,
      liters,
      alcohol_percent: alcohol,
      quantity: 1,
      getraenk: drinkName.trim(),
      menge: liters,
      alkohol: alcohol,
      preis: price,
    };

    const { data, error } =
      await supabase
        .from("drinks")
        .insert(payload)
        .select("*")
        .single();

    if (error) {
      setBusy(false);
      notify(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    if (drinkPerson && data) {
      await addDrinkHistory(
        drinkPerson,
        data as Drink,
        price
      );

      await addPoints(
        drinkPerson,
        10,
        "🍺 Getränk getrunken",
        "drink",
        data.id
      );
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");
    setDrinkPerson("");

    setBusy(false);

    await loadEventData(currentEvent.id);

    notify("✅ Getränk gespeichert.");
  }

  async function addDrinkHistory(
    profileId: string,
    drink: Drink,
    price: number
  ) {
    if (!currentEvent) return;

    await supabase
      .from("drink_history")
      .insert({
        event_id: currentEvent.id,
        profile_id: profileId,
        drink_id: drink.id,
        drink_name:
          drink.drink_name ??
          drink.getraenk ??
          "Getränk",
        liters:
          Number(
            drink.liters ??
              drink.menge ??
              0
          ),
        alcohol_percent:
          Number(
            drink.alcohol_percent ??
              drink.alkohol ??
              0
          ),
        price,
        consumed_at: new Date().toISOString(),
      });
  }

  async function addPoints(
    profileId: string,
    points: number,
    reason: string,
    referenceType?: string,
    referenceId?: string
  ) {
    if (!currentEvent) return;

    await supabase
      .from("points_history")
      .insert({
        event_id: currentEvent.id,
        profile_id: profileId,
        points,
        reason,
        reference_type:
          referenceType ?? null,
        reference_id:
          referenceId ?? null,
      });
  }

  async function savePayment() {
    if (!currentEvent) return;

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      notify(
        "❌ Bitte einen gültigen Betrag eingeben."
      );
      return;
    }

    if (!paymentPerson) {
      notify(
        "❌ Bitte auswählen, wer bezahlt hat."
      );
      return;
    }

    setBusy(true);

    const { error } =
      await supabase
        .from("payments")
        .insert({
          event_id: currentEvent.id,
          betrag: amount,
          bezahlt_von: paymentPerson,
          profile_id: paymentPerson,
          status: "paid",
        });

    setBusy(false);

    if (error) {
      notify(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setPaymentAmount("");
    setPaymentPerson("");

    await loadEventData(currentEvent.id);

    notify("✅ Zahlung gespeichert.");
  }

  async function sendBeerRequest() {
    if (!currentEvent || !profile) return;

    setBusy(true);

    const targets = members.filter(
      (member) =>
        member.profile_id !== profile.id
    );

    if (targets.length === 0) {
      setBusy(false);
      notify(
        "👥 Es sind keine anderen Teilnehmer im Event."
      );
      return;
    }

    const rows = targets.map((member) => ({
      event_id: currentEvent.id,
      requester_profile_id: profile.id,
      target_profile_id:
        member.profile_id,
      status: "pending",
      message:
        `${profile.name ?? "Jemand"} möchte ein Bier mit dir trinken 🍺`,
    }));

    const { error } =
      await supabase
        .from("beer_requests")
        .insert(rows);

    setBusy(false);

    if (error) {
      notify(
        "❌ Bier-Anfrage konnte nicht gesendet werden: " +
          error.message
      );
      return;
    }

    setShowBeerModal(false);

    await loadEventData(currentEvent.id);

    notify(
      "🍺 Bier-Anfrage an alle Teilnehmer gesendet."
    );
  }

  async function answerBeerRequest(
    request: BeerRequest,
    status: "accepted" | "declined"
  ) {
    setBusy(true);

    const { error } =
      await supabase
        .from("beer_requests")
        .update({
          status,
          responded_at:
            new Date().toISOString(),
        })
        .eq("id", request.id);

    setBusy(false);

    if (error) {
      notify(
        "❌ Anfrage konnte nicht beantwortet werden: " +
          error.message
      );
      return;
    }

    if (
      status === "accepted" &&
      profile
    ) {
      await addPoints(
        profile.id,
        5,
        "🍺 Bier-Anfrage angenommen",
        "beer_request",
        request.id
      );
    }

    await loadEventData(currentEvent?.id ?? "");

    notify(
      status === "accepted"
        ? "🍺 Bier-Anfrage angenommen."
        : "❌ Bier-Anfrage abgelehnt."
    );
  }

  async function donateCrate() {
    if (!currentEvent || !profile) return;

    const crates =
      Math.max(
        1,
        Number(crateCount) || 1
      );

    const points = crates * 20;

    setBusy(true);

    const { error } =
      await supabase
        .from("crate_donations")
        .insert({
          event_id: currentEvent.id,
          profile_id: profile.id,
          crates,
          points_awarded: points,
        });

    if (error) {
      setBusy(false);
      notify(
        "❌ Kiste konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    await addPoints(
      profile.id,
      points,
      `🍻 ${crates} Kiste(n) Bier spendiert`,
      "crate",
      undefined
    );

    setBusy(false);
    setShowCrateModal(false);
    setCrateCount("1");

    await loadEventData(currentEvent.id);

    notify(
      `🍻 Kiste gespeichert! +${points} Punkte`
    );
  }

  async function createChallenge() {
    if (!currentEvent || !profile) return;

    if (!challengeTitle.trim()) {
      notify(
        "❌ Bitte einen Challenge-Titel eingeben."
      );
      return;
    }

    setBusy(true);

    const { error } =
      await supabase
        .from("challenges")
        .insert({
          event_id: currentEvent.id,
          title:
            challengeTitle.trim(),
          description:
            challengeDescription.trim() ||
            null,
          points:
            Number(challengePoints) || 20,
          category: "fun",
          status: "open",
          created_by_profile_id:
            profile.id,
          is_active: true,
        });

    setBusy(false);

    if (error) {
      notify(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("20");

    await loadEventData(currentEvent.id);

    notify("🏆 Challenge erstellt.");
  }

  async function joinChallenge(
    challenge: Challenge
  ) {
    if (!profile) return;

    const already =
      challengeParticipants.some(
        (item) =>
          item.challenge_id ===
            challenge.id &&
          item.profile_id ===
            profile.id
      );

    if (already) {
      notify(
        "ℹ️ Du bist bereits dabei."
      );
      return;
    }

    const { error } =
      await supabase
        .from("challenge_participants")
        .insert({
          challenge_id:
            challenge.id,
          profile_id: profile.id,
          accepted: true,
          completed: false,
          points_awarded: 0,
        });

    if (error) {
      notify(
        "❌ Teilnahme konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    await loadEventData(currentEvent?.id ?? "");

    notify(
      "🏆 Du nimmst an der Challenge teil."
    );
  }

  async function updateSettings(
    patch: Partial<EventSettings>
  ) {
    if (!currentEvent || !isEventAdmin) return;

    const next = {
      ...settings,
      ...patch,
      event_id: currentEvent.id,
    };

    setSettings(next);

    const { error } =
      await supabase
        .from("event_settings")
        .upsert(
          next,
          {
            onConflict: "event_id",
          }
        );

    if (error) {
      notify(
        "❌ Einstellungen konnten nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    notify("✅ Einstellung gespeichert.");
  }

  function openProfile(id: string) {
    setSelectedProfileId(id);
    setShowProfile(true);
  }

  function formatDate(value?: string | null) {
    if (!value) return "-";

    return new Date(value).toLocaleString(
      "de-DE",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function formatMoney(value: number) {
    return `${value.toFixed(2)} €`;
  }

  function canSee(key: keyof EventSettings) {
    return Boolean(settings[key]);
  }

  if (sessionLoading) {
    return (
      <main className="page">
        <div className="loadingScreen">
          <div className="loadingLogo">🍻</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <div className="spinner" />
          <p>App wird geladen...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="authWrap">
          <div className="authCard">
            <div className="authLogo">
              🍻
            </div>

            <h1>
              Güstener
              <br />
              Zapfhahn Zentrale
            </h1>

            <p className="authSubtitle">
              Events · Getränke · Punkte · Challenges
            </p>

            <div className="authTabs">
              <button
                className={
                  authMode === "login"
                    ? "tab active"
                    : "tab"
                }
                onClick={() =>
                  setAuthMode("login")
                }
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

            {authMode === "register" && (
              <input
                className="input"
                placeholder="Dein Name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            )}

            <input
              className="input"
              type="email"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              className="input"
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  authMode === "login"
                    ? login()
                    : register();
                }
              }}
            />

            <button
              className="primaryButton full"
              onClick={
                authMode === "login"
                  ? login
                  : register
              }
              disabled={busy}
            >
              {busy
                ? "Bitte warten..."
                : authMode === "login"
                ? "🔐 ANMELDEN"
                : "👤 ACCOUNT ERSTELLEN"}
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

  const selectedProfile =
    members.find(
      (member) =>
        member.profile_id ===
        selectedProfileId
    )?.profile ?? null;

  const selectedProfilePoints =
    selectedProfileId
      ? pointsByProfile[
          selectedProfileId
        ] ?? 0
      : 0;

  const selectedProfileHistory =
    pointHistory.filter(
      (item) =>
        item.profile_id ===
        selectedProfileId
    );

  const selectedProfileDrinks =
    drinkHistory.filter(
      (item) =>
        item.profile_id ===
        selectedProfileId
    );

  const selectedProfilePaid =
    paidByProfile[
      selectedProfileId
    ] ?? 0;

  const selectedProfileLiters =
    litersByProfile[
      selectedProfileId
    ] ?? 0;

  const selectedProfileDrinkCount =
    drinksByProfile[
      selectedProfileId
    ] ?? 0;

  const incomingBeerRequests =
    beerRequests.filter(
      (request) =>
        request.target_profile_id ===
          profile?.id &&
        request.status === "pending"
    );

  const outgoingBeerRequests =
    beerRequests.filter(
      (request) =>
        request.requester_profile_id ===
          profile?.id
    );

  return (
    <main className="page">
      <div className="appShell">

        <header className="topbar">
          <div
            className="brand"
            onClick={() => setView("dashboard")}
          >
            <div className="brandIcon">
              🍻
            </div>

            <div>
              <strong>
                Güstener Zapfhahn Zentrale
              </strong>
              <span>
                Events · Getränke · Punkte · Challenges
              </span>
            </div>
          </div>

          <div className="topActions">
            {isGlobalAdmin && (
              <span className="adminBadge">
                👑 GLOBAL ADMIN
              </span>
            )}

            <button
              className="profileButton"
              onClick={() =>
                setShowProfile(true)
              }
            >
              👤{" "}
              {profile?.name ??
                user.email}
            </button>

            <button
              className="logoutButton"
              onClick={logout}
            >
              Abmelden
            </button>
          </div>
        </header>

        {message && (
          <div className="toast">
            {message}
          </div>
        )}

        <section className="eventBar">
          <div>
            <small>AKTUELLES EVENT</small>

            <select
              className="eventSelect"
              value={eventId}
              onChange={(e) => {
                setEventId(
                  e.target.value
                );
                setView("dashboard");
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
          </div>

          <div className="eventActions">
            <button
              className="secondaryButton"
              onClick={() =>
                setShowCreateEvent(true)
              }
            >
              ➕ Neues Event
            </button>

            <button
              className="secondaryButton"
              onClick={() =>
                setShowJoinEvent(true)
              }
            >
              🔑 Beitreten
            </button>

            {currentEvent && (
              <button
                className="dangerButton"
                onClick={deleteEvent}
              >
                🗑️
              </button>
            )}
          </div>
        </section>

        {!currentEvent ? (
          <section className="emptyState">
            <div className="emptyIcon">
              🍻
            </div>

            <h2>
              Willkommen in der
              <br />
              Güstener Zapfhahn Zentrale
            </h2>

            <p>
              Erstelle dein erstes Event
              oder tritt einem Event mit
              einem Einladungscode bei.
            </p>

            <div className="emptyActions">
              <button
                className="primaryButton"
                onClick={() =>
                  setShowCreateEvent(true)
                }
              >
                ➕ EVENT ERSTELLEN
              </button>

              <button
                className="secondaryButton large"
                onClick={() =>
                  setShowJoinEvent(true)
                }
              >
                🔑 EINLADUNGSCODE EINGEBEN
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="eventHero">
              <div>
                <div className="eventTitleRow">
                  <h1>
                    {currentEvent.title}
                  </h1>

                  {isEventAdmin && (
                    <span className="adminSmall">
                      ADMIN
                    </span>
                  )}
                </div>

                {currentEvent.description && (
                  <p>
                    {currentEvent.description}
                  </p>
                )}

                {currentEvent.location && (
                  <span className="location">
                    📍{" "}
                    {currentEvent.location}
                  </span>
                )}

                <div className="inviteBox">
                  <span>
                    🔑 Einladungscode
                  </span>

                  <strong>
                    {currentEvent.invite_code ??
                      "-"}
                  </strong>
                </div>
              </div>

              <div className="heroStats">
                <div>
                  <b>
                    {members.length}
                  </b>
                  <span>Teilnehmer</span>
                </div>

                <div>
                  <b>
                    {drinks.length}
                  </b>
                  <span>Getränke</span>
                </div>

                <div>
                  <b>
                    {totalLiters.toFixed(1)}
                  </b>
                  <span>Liter</span>
                </div>

                <div>
                  <b>
                    {formatMoney(
                      totalDrinkCost
                    )}
                  </b>
                  <span>Kosten</span>
                </div>
              </div>
            </section>

            <nav className="navigation">
              <button
                className={
                  view === "dashboard"
                    ? "navButton active"
                    : "navButton"
                }
                onClick={() =>
                  setView("dashboard")
                }
              >
                🏠
                <span>Übersicht</span>
              </button>

              {canSee(
                "show_participants"
              ) && (
                <button
                  className={
                    view === "participants"
                      ? "navButton active"
                      : "navButton"
                  }
                  onClick={() =>
                    setView(
                      "participants"
                    )
                  }
                >
                  👥
                  <span>Teilnehmer</span>
                </button>
              )}

              {canSee("show_drinks") && (
                <button
                  className={
                    view === "drinks"
                      ? "navButton active"
                      : "navButton"
                  }
                  onClick={() =>
                    setView("drinks")
                  }
                >
                  🍺
                  <span>Getränke</span>
                </button>
              )}

              {canSee(
                "show_drink_history"
              ) && (
                <button
                  className={
                    view === "history"
                      ? "navButton active"
                      : "navButton"
                  }
                  onClick={() =>
                    setView("history")
                  }
                >
                  📜
                  <span>Verlauf</span>
                </button>
              )}

              {canSee("show_payments") && (
                <button
                  className={
                    view === "payments"
                      ? "navButton active"
                      : "navButton"
                  }
                  onClick={() =>
                    setView("payments")
                  }
                >
                  💶
                  <span>Zahlungen</span>
                </button>
              )}

              {canSee("show_ranking") && (
                <button
                  className={
                    view === "ranking"
                      ? "navButton active"
                      : "navButton"
                  }
                  onClick={() =>
                    setView("ranking")
                  }
                >
                  🏆
                  <span>Rangliste</span>
                </button>
              )}

              {canSee(
                "show_challenges"
              ) && (
                <button
                  className={
                    view === "challenges"
                      ? "navButton active"
                      : "navButton"
                  }
                  onClick={() =>
                    setView(
                      "challenges"
                    )
                  }
                >
                  🎯
                  <span>Challenges</span>
                </button>
              )}

              {isEventAdmin && (
                <button
                  className={
                    view === "settings"
                      ? "navButton active"
                      : "navButton"
                  }
                  onClick={() =>
                    setView("settings")
                  }
                >
                  ⚙️
                  <span>Einstellungen</span>
                </button>
              )}
            </nav>

            {view === "dashboard" && (
              <div className="content">

                <section className="actionGrid">

                  {canSee(
                    "show_beer_button"
                  ) && (
                    <button
                      className="beerButton"
                      onClick={() =>
                        setShowBeerModal(true)
                      }
                    >
                      <span className="beerIcon">
                        🍺
                      </span>

                      <strong>
                        BIER
                      </strong>

                      <small>
                        Wer trinkt ein Bier
                        mit mir?
                      </small>
                    </button>
                  )}

                  {canSee(
                    "show_crate_button"
                  ) && (
                    <button
                      className="crateButton"
                      onClick={() =>
                        setShowCrateModal(true)
                      }
                    >
                      <span>
                        🍻
                      </span>

                      <strong>
                        KISTE SPENDIEREN
                      </strong>

                      <small>
                        +20 Punkte pro Kiste
                      </small>
                    </button>
                  )}

                  {canSee(
                    "show_drinks"
                  ) && (
                    <button
                      className="actionCard"
                      onClick={() =>
                        setView("drinks")
                      }
                    >
                      <span>🍺</span>
                      <strong>
                        GETRÄNK
                      </strong>
                      <small>
                        Getränk erfassen
                      </small>
                    </button>
                  )}

                  {canSee(
                    "show_payments"
                  ) && (
                    <button
                      className="actionCard"
                      onClick={() =>
                        setView("payments")
                      }
                    >
                      <span>💶</span>
                      <strong>
                        ZAHLUNG
                      </strong>
                      <small>
                        Zahlung erfassen
                      </small>
                    </button>
                  )}

                  {canSee(
                    "show_challenges"
                  ) && (
                    <button
                      className="actionCard"
                      onClick={() =>
                        setView(
                          "challenges"
                        )
                      }
                    >
                      <span>🎯</span>
                      <strong>
                        CHALLENGES
                      </strong>
                      <small>
                        Challenges ansehen
                      </small>
                    </button>
                  )}
                </section>

                {incomingBeerRequests.length >
                  0 &&
                  canSee(
                    "show_beer_requests"
                  ) && (
                    <section className="card highlight">
                      <div className="sectionHeader">
                        <div>
                          <h2>
                            🔔 Bier-Anfragen
                          </h2>

                          <p>
                            Jemand möchte mit
                            dir ein Bier
                            trinken.
                          </p>
                        </div>

                        <span className="countBadge">
                          {
                            incomingBeerRequests.length
                          }
                        </span>
                      </div>

                      {incomingBeerRequests.map(
                        (request) => (
                          <div
                            className="request"
                            key={request.id}
                          >
                            <div className="requestAvatar">
                              🍺
                            </div>

                            <div className="requestText">
                              <strong>
                                {profileName(
                                  request.requester_profile_id
                                )}
                              </strong>

                              <span>
                                möchte ein Bier
                                mit dir trinken.
                              </span>
                            </div>

                            <div className="requestButtons">
                              <button
                                className="acceptButton"
                                onClick={() =>
                                  answerBeerRequest(
                                    request,
                                    "accepted"
                                  )
                                }
                              >
                                ✅
                              </button>

                              <button
                                className="declineButton"
                                onClick={() =>
                                  answerBeerRequest(
                                    request,
                                    "declined"
                                  )
                                }
                              >
                                ❌
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </section>
                  )}

                <div className="dashboardGrid">

                  {canSee(
                    "show_participants"
                  ) && (
                    <section className="card">
                      <div className="sectionHeader">
                        <div>
                          <h2>
                            👥 Teilnehmer
                          </h2>
                          <p>
                            {members.length} Personen
                          </p>
                        </div>

                        <button
                          className="miniButton"
                          onClick={() =>
                            setView(
                              "participants"
                            )
                          }
                        >
                          Alle
                        </button>
                      </div>

                      <div className="memberList">
                        {members
                          .slice(0, 6)
                          .map(
                            (member) => (
                              <button
                                className="memberRow"
                                key={
                                  member.id
                                }
                                onClick={() =>
                                  openProfile(
                                    member.profile_id
                                  )
                                }
                              >
                                <div className="avatar">
                                  👤
                                </div>

                                <div className="memberInfo">
                                  <strong>
                                    {
                                      member
                                        .profile
                                        ?.name ??
                                      "Teilnehmer"
                                    }
                                  </strong>

                                  <span>
                                    🍺{" "}
                                    {
                                      drinksByProfile[
                                        member.profile_id
                                      ]
                                    }{" "}
                                    · 🏆{" "}
                                    {
                                      pointsByProfile[
                                        member.profile_id
                                      ]
                                    }
                                  </span>
                                </div>

                                <span>
                                  →
                                </span>
                              </button>
                            )
                          )}
                      </div>
                    </section>
                  )}

                  {canSee(
                    "show_payments"
                  ) && (
                    <section className="card">
                      <div className="sectionHeader">
                        <div>
                          <h2>
                            💶 Kosten
                          </h2>

                          <p>
                            Zahlungen &
                            offener Betrag
                          </p>
                        </div>
                      </div>

                      <div className="moneyStats">
                        <div>
                          <span>
                            Gesamtkosten
                          </span>
                          <strong>
                            {formatMoney(
                              totalDrinkCost
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Bezahlt
                          </span>
                          <strong className="green">
                            {formatMoney(
                              totalPaid
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Offen
                          </span>
                          <strong className="red">
                            {formatMoney(
                              totalOpen
                            )}
                          </strong>
                        </div>
                      </div>

                      <button
                        className="secondaryButton full"
                        onClick={() =>
                          setView(
                            "payments"
                          )
                        }
                      >
                        💶 Zahlungen verwalten
                      </button>
                    </section>
                  )}

                </div>

                {canSee(
                  "show_ranking"
                ) && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>
                          🏆 Rangliste
                        </h2>

                        <p>
                          Tippe auf eine
                          Person für die
                          Punkte-Historie.
                        </p>
                      </div>

                      <button
                        className="miniButton"
                        onClick={() =>
                          setView(
                            "ranking"
                          )
                        }
                      >
                        Vollständig
                      </button>
                    </div>

                    <div className="rankingList">
                      {ranking
                        .slice(0, 5)
                        .map(
                          (
                            member,
                            index
                          ) => (
                            <button
                              className="rankRow"
                              key={
                                member.id
                              }
                              onClick={() =>
                                openProfile(
                                  member.profile_id
                                )
                              }
                            >
                              <strong className="rankNumber">
                                {index ===
                                0
                                  ? "🥇"
                                  : index ===
                                    1
                                  ? "🥈"
                                  : index ===
                                    2
                                  ? "🥉"
                                  : `${
                                      index +
                                      1
                                    }.`}
                              </strong>

                              <span className="rankName">
                                {
                                  member
                                    .profile
                                    ?.name
                                }
                              </span>

                              <b>
                                {
                                  member.points
                                }{" "}
                                Punkte
                              </b>
                            </button>
                          )
                        )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {view === "participants" && (
              <section className="content">
                <div className="pageHeading">
                  <div>
                    <h2>
                      👥 Teilnehmer
                    </h2>
                    <p>
                      Alle Personen im Event
                    </p>
                  </div>
                </div>

                <section className="card">
                  <div className="memberList largeList">
                    {members.map(
                      (member) => (
                        <button
                          className="memberRow"
                          key={member.id}
                          onClick={() =>
                            openProfile(
                              member.profile_id
                            )
                          }
                        >
                          <div className="avatar big">
                            👤
                          </div>

                          <div className="memberInfo">
                            <strong>
                              {
                                member
                                  .profile
                                  ?.name
                              }
                            </strong>

                            <span>
                              {member.role ===
                                "admin" &&
                                "👑 Admin · "}
                              🍺{" "}
                              {
                                drinksByProfile[
                                  member.profile_id
                                ]
                              }{" "}
                              Getränke · 🏆{" "}
                              {
                                pointsByProfile[
                                  member.profile_id
                                ]
                              }{" "}
                              Punkte
                            </span>
                          </div>

                          <span>
                            →
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </section>
              </section>
            )}

            {view === "drinks" && (
              <section className="content">
                <div className="pageHeading">
                  <div>
                    <h2>
                      🍺 Getränke
                    </h2>
                    <p>
                      Getränke erfassen und
                      Personen zuordnen
                    </p>
                  </div>
                </div>

                <section className="card">
                  <h2>
                    🍺 Getränk hinzufügen
                  </h2>

                  <div className="formGrid">
                    <input
                      className="input"
                      placeholder="Getränk"
                      value={drinkName}
                      onChange={(e) =>
                        setDrinkName(
                          e.target.value
                        )
                      }
                    />

                    <input
                      className="input"
                      placeholder="Marke"
                      value={drinkBrand}
                      onChange={(e) =>
                        setDrinkBrand(
                          e.target.value
                        )
                      }
                    />

                    <input
                      className="input"
                      type="number"
                      min="0"
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
                      className="input"
                      type="number"
                      min="0"
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
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Preis €"
                      value={drinkPrice}
                      onChange={(e) =>
                        setDrinkPrice(
                          e.target.value
                        )
                      }
                    />

                    <select
                      className="input"
                      value={drinkPerson}
                      onChange={(e) =>
                        setDrinkPerson(
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Person auswählen
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
                              member
                                .profile
                                ?.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <button
                    className="primaryButton"
                    onClick={addDrink}
                    disabled={busy}
                  >
                    🍻 GETRÄNK SPEICHERN
                  </button>
                </section>

                <section className="card">
                  <div className="sectionHeader">
                    <div>
                      <h2>
                        🍺 Gespeicherte Getränke
                      </h2>
                      <p>
                        {drinks.length} Getränke
                      </p>
                    </div>
                  </div>

                  <div className="drinkList">
                    {drinks.length ===
                    0 ? (
                      <div className="emptyMini">
                        Noch keine Getränke.
                      </div>
                    ) : (
                      drinks.map(
                        (drink) => (
                          <div
                            className="drinkRow"
                            key={drink.id}
                          >
                            <div className="drinkIcon">
                              🍺
                            </div>

                            <div className="drinkInfo">
                              <strong>
                                {drink.drink_name ??
                                  drink.getraenk ??
                                  "Getränk"}
                              </strong>

                              <span>
                                {drink.brand ??
                                  drink.marke ??
                                  ""}
                                {" · "}
                                {Number(
                                  drink.liters ??
                                    drink.menge ??
                                    0
                                ).toFixed(
                                  1
                                )}{" "}
                                L ·{" "}
                                {Number(
                                  drink.alcohol_percent ??
                                    drink.alkohol ??
                                    0
                                ).toFixed(
                                  1
                                )}{" "}
                                %
                              </span>

                              <small>
                                {drink.profile_id
                                  ? `Getrunken von ${profileName(
                                      drink.profile_id
                                    )}`
                                  : "Noch keiner Person zugeordnet"}
                              </small>
                            </div>

                            <strong>
                              {formatMoney(
                                Number(
                                  drink.preis ??
                                    0
                                )
                              )}
                            </strong>
                          </div>
                        )
                      )
                    )}
                  </div>
                </section>
              </section>
            )}

            {view === "history" && (
              <section className="content">
                <div className="pageHeading">
                  <div>
                    <h2>
                      📜 Getränkeverlauf
                    </h2>
                    <p>
                      Wer hat wann was
                      getrunken?
                    </p>
                  </div>
                </div>

                <section className="card">
                  {drinkHistory.length ===
                  0 ? (
                    <div className="emptyMini">
                      Noch kein
                      Getränkeverlauf
                      vorhanden.
                    </div>
                  ) : (
                    <div className="historyList">
                      {drinkHistory.map(
                        (item) => (
                          <div
                            className="historyRow"
                            key={item.id}
                          >
                            <div className="historyTime">
                              {formatDate(
                                item.consumed_at
                              )}
                            </div>

                            <div className="historyIcon">
                              🍺
                            </div>

                            <div className="historyInfo">
                              <strong>
                                {
                                  item.drink_name
                                }
                              </strong>

                              <span>
                                {
                                  profileName(
                                    item.profile_id
                                  )
                                }
                              </span>
                            </div>

                            <div className="historyMeta">
                              {Number(
                                item.liters
                              ).toFixed(
                                1
                              )}{" "}
                              L
                              <br />
                              {Number(
                                item.alcohol_percent
                              ).toFixed(
                                1
                              )}{" "}
                              %
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>
              </section>
            )}

            {view === "payments" && (
              <section className="content">
                <div className="pageHeading">
                  <div>
                    <h2>
                      💶 Zahlungen
                    </h2>
                    <p>
                      Wer hat bezahlt und
                      wer muss noch zahlen?
                    </p>
                  </div>
                </div>

                <div className="moneyStats bigMoney">
                  <div>
                    <span>
                      Gesamtkosten
                    </span>
                    <strong>
                      {formatMoney(
                        totalDrinkCost
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Bezahlt
                    </span>
                    <strong className="green">
                      {formatMoney(
                        totalPaid
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Noch offen
                    </span>
                    <strong className="red">
                      {formatMoney(
                        totalOpen
                      )}
                    </strong>
                  </div>
                </div>

                <section className="card">
                  <h2>
                    💶 Zahlung erfassen
                  </h2>

                  <div className="formGrid">
                    <input
                      className="input"
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
                      className="input"
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
                              member
                                .profile
                                ?.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <button
                    className="primaryButton"
                    onClick={savePayment}
                    disabled={busy}
                  >
                    💶 ZAHLUNG SPEICHERN
                  </button>
                </section>

                {canSee(
                  "show_who_paid"
                ) && (
                  <section className="card">
                    <h2>
                      💰 Wer hat bezahlt?
                    </h2>

                    <div className="paymentPeople">
                      {members.map(
                        (member) => (
                          <div
                            className="paymentPerson"
                            key={
                              member.id
                            }
                          >
                            <div>
                              <strong>
                                {
                                  member
                                    .profile
                                    ?.name
                                }
                              </strong>

                              <span>
                                Bezahlt
                              </span>
                            </div>

                            <b>
                              {formatMoney(
                                paidByProfile[
                                  member.profile_id
                                ] ?? 0
                              )}
                            </b>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )}

                <section className="card">
                  <h2>
                    💶 Zahlungsverlauf
                  </h2>

                  {payments.length ===
                  0 ? (
                    <div className="emptyMini">
                      Noch keine Zahlungen.
                    </div>
                  ) : (
                    <div className="paymentList">
                      {payments.map(
                        (payment) => (
                          <div
                            className="paymentRow"
                            key={payment.id}
                          >
                            <div>
                              <strong>
                                {payment.bezahlt_von ||
                                payment.profile_id
                                  ? profileName(
                                      payment.bezahlt_von ??
                                        payment.profile_id
                                    )
                                  : "Unbekannt"}
                              </strong>

                              <span>
                                {formatDate(
                                  payment.created_at
                                )}
                              </span>
                            </div>

                            <b className="green">
                              +
                              {formatMoney(
                                Number(
                                  payment.betrag ??
                                    0
                                )
                              )}
                            </b>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>
              </section>
            )}

            {view === "ranking" && (
              <section className="content">
                <div className="pageHeading">
                  <div>
                    <h2>
                      🏆 Rangliste
                    </h2>
                    <p>
                      Punkte und
                      Punkte-Historie
                    </p>
                  </div>
                </div>

                <section className="card">
                  <div className="rankingList fullRanking">
                    {ranking.map(
                      (
                        member,
                        index
                      ) => (
                        <button
                          className="rankRow bigRank"
                          key={
                            member.id
                          }
                          onClick={() =>
                            openProfile(
                              member.profile_id
                            )
                          }
                        >
                          <strong className="rankNumber">
                            {index ===
                            0
                              ? "🥇"
                              : index ===
                                1
                              ? "🥈"
                              : index ===
                                2
                              ? "🥉"
                              : `${
                                  index +
                                  1
                                }.`}
                          </strong>

                          <div className="rankName">
                            <strong>
                              {
                                member
                                  .profile
                                  ?.name
                              }
                            </strong>

                            <span>
                              🍺{" "}
                              {
                                drinksByProfile[
                                  member.profile_id
                                ]
                              }{" "}
                              Getränke
                            </span>
                          </div>

                          <b>
                            {
                              member.points
                            }{" "}
                            Punkte
                          </b>
                        </button>
                      )
                    )}
                  </div>
                </section>
              </section>
            )}

            {view === "challenges" && (
              <section className="content">
                <div className="pageHeading">
                  <div>
                    <h2>
                      🎯 Challenges
                    </h2>
                    <p>
                      Aufgaben, Wettbewerbe
                      und Punkte
                    </p>
                  </div>
                </div>

                {isEventAdmin && (
                  <section className="card">
                    <h2>
                      ➕ Challenge erstellen
                    </h2>

                    <div className="formGrid">
                      <input
                        className="input"
                        placeholder="Titel"
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
                        className="input"
                        placeholder="Punkte"
                        type="number"
                        value={
                          challengePoints
                        }
                        onChange={(e) =>
                          setChallengePoints(
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <textarea
                      className="input textarea"
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

                    <button
                      className="primaryButton"
                      onClick={
                        createChallenge
                      }
                      disabled={busy}
                    >
                      🎯 CHALLENGE ERSTELLEN
                    </button>
                  </section>
                )}

                <div className="challengeList">
                  {challenges.length ===
                  0 ? (
                    <section className="card emptyMini">
                      Noch keine Challenges
                      vorhanden.
                    </section>
                  ) : (
                    challenges.map(
                      (challenge) => {
                        const joined =
                          profile &&
                          challengeParticipants.some(
                            (item) =>
                              item.challenge_id ===
                                challenge.id &&
                              item.profile_id ===
                                profile.id
                          );

                        const participantCount =
                          challengeParticipants.filter(
                            (item) =>
                              item.challenge_id ===
                              challenge.id
                          ).length;

                        return (
                          <section
                            className="challengeCard"
                            key={
                              challenge.id
                            }
                          >
                            <div className="challengeTop">
                              <div className="challengeIcon">
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
                              </div>

                              <strong className="challengePoints">
                                +
                                {
                                  challenge.points
                                }
                              </strong>
                            </div>

                            <div className="challengeBottom">
                              <span>
                                👥{" "}
                                {
                                  participantCount
                                }{" "}
                                Teilnehmer
                              </span>

                              <span>
                                {
                                  challenge.status ??
                                  "open"
                                }
                              </span>

                              <button
                                className={
                                  joined
                                    ? "secondaryButton"
                                    : "primaryButton"
                                }
                                onClick={() =>
                                  joinChallenge(
                                    challenge
                                  )
                                }
                                disabled={
                                  Boolean(
                                    joined
                                  )
                                }
                              >
                                {joined
                                  ? "✅ Dabei"
                                  : "🏆 Teilnehmen"}
                              </button>
                            </div>
                          </section>
                        );
                      }
                    )
                  )}
                </div>
              </section>
            )}

            {view === "settings" &&
              isEventAdmin && (
                <section className="content">
                  <div className="pageHeading">
                    <div>
                      <h2>
                        ⚙️ Event-Einstellungen
                      </h2>

                      <p>
                        Du entscheidest,
                        was die Teilnehmer
                        sehen können.
                      </p>
                    </div>
                  </div>

                  <section className="card">
                    <h2>
                      👁️ Sichtbarkeit
                    </h2>

                    <SettingRow
                      label="Teilnehmer"
                      value={
                        settings.show_participants
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_participants:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="Getränke"
                      value={
                        settings.show_drinks
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_drinks:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="Getränkeverlauf"
                      value={
                        settings.show_drink_history
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_drink_history:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="Zahlungen"
                      value={
                        settings.show_payments
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_payments:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="Kosten"
                      value={
                        settings.show_costs
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_costs:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="Rangliste"
                      value={
                        settings.show_ranking
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_ranking:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="Punkte"
                      value={
                        settings.show_points
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_points:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="Promille"
                      value={
                        settings.show_promille
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_promille:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="Statistiken"
                      value={
                        settings.show_statistics
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_statistics:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="Challenges"
                      value={
                        settings.show_challenges
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_challenges:
                            value,
                        })
                      }
                    />
                  </section>

                  <section className="card">
                    <h2>
                      🎮 Buttons
                    </h2>

                    <SettingRow
                      label="🍺 Bier-Button"
                      value={
                        settings.show_beer_button
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_beer_button:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="🔔 Bier-Anfragen"
                      value={
                        settings.show_beer_requests
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_beer_requests:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="🍻 Kiste spendieren"
                      value={
                        settings.show_crate_button
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_crate_button:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="👤 Profile"
                      value={
                        settings.show_profiles
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_profiles:
                            value,
                        })
                      }
                    />
                  </section>

                  <section className="card">
                    <h2>
                      💶 Zahlungen
                    </h2>

                    <SettingRow
                      label="Wer hat bezahlt?"
                      value={
                        settings.show_who_paid
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_who_paid:
                            value,
                        })
                      }
                    />

                    <SettingRow
                      label="Wer muss noch zahlen?"
                      value={
                        settings.show_who_owes
                      }
                      onChange={(value) =>
                        updateSettings({
                          show_who_owes:
                            value,
                        })
                      }
                    />
                  </section>
                </section>
              )}
          </>
        )}

        <footer className="footer">
          <strong>
            🍻 Güstener Zapfhahn Zentrale
          </strong>

          <span>
            Dein Event. Deine Getränke.
            Deine Runde.
          </span>
        </footer>
      </div>

      {showCreateEvent && (
        <div
          className="modalBackdrop"
          onClick={() =>
            setShowCreateEvent(false)
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modalClose"
              onClick={() =>
                setShowCreateEvent(false)
              }
            >
              ×
            </button>

            <h2>
              ➕ Neues Event
            </h2>

            <input
              className="input"
              placeholder="Eventname"
              value={eventTitle}
              onChange={(e) =>
                setEventTitle(
                  e.target.value
                )
              }
            />

            <input
              className="input"
              placeholder="Ort"
              value={eventLocation}
              onChange={(e) =>
                setEventLocation(
                  e.target.value
                )
              }
            />

            <textarea
              className="input textarea"
              placeholder="Beschreibung"
              value={eventDescription}
              onChange={(e) =>
                setEventDescription(
                  e.target.value
                )
              }
            />

            <button
              className="primaryButton full"
              onClick={createEvent}
              disabled={busy}
            >
              {busy
                ? "Erstelle..."
                : "🍻 EVENT ERSTELLEN"}
            </button>
          </div>
        </div>
      )}

      {showJoinEvent && (
        <div
          className="modalBackdrop"
          onClick={() =>
            setShowJoinEvent(false)
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modalClose"
              onClick={() =>
                setShowJoinEvent(false)
              }
            >
              ×
            </button>

            <h2>
              🔑 Event beitreten
            </h2>

            <p>
              Gib den Einladungscode des
              Events ein.
            </p>

            <input
              className="input inviteInput"
              placeholder="XXXX-XXXX"
              value={inviteCodeInput}
              onChange={(e) =>
                setInviteCodeInput(
                  e.target.value.toUpperCase()
                )
              }
            />

            <button
              className="primaryButton full"
              onClick={joinEvent}
              disabled={busy}
            >
              🔑 BEITRETEN
            </button>
          </div>
        </div>
      )}

      {showBeerModal && (
        <div
          className="modalBackdrop"
          onClick={() =>
            setShowBeerModal(false)
          }
        >
          <div
            className="beerModal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="beerAnimation">
              🍺
            </div>

            <h2>
              BIER?
            </h2>

            <p>
              Alle anderen Teilnehmer
              erhalten:
            </p>

            <div className="beerMessage">
              „
              {profile?.name ??
                "Jemand"}{" "}
              möchte ein Bier mit dir
              trinken 🍺“
            </div>

            <div className="modalActions">
              <button
                className="secondaryButton"
                onClick={() =>
                  setShowBeerModal(false)
                }
              >
                Abbrechen
              </button>

              <button
                className="beerConfirm"
                onClick={sendBeerRequest}
                disabled={busy}
              >
                🍺 LOS GEHT'S
              </button>
            </div>
          </div>
        </div>
      )}

      {showCrateModal && (
        <div
          className="modalBackdrop"
          onClick={() =>
            setShowCrateModal(false)
          }
        >
          <div
            className="modal crateModal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modalClose"
              onClick={() =>
                setShowCrateModal(false)
              }
            >
              ×
            </button>

            <div className="crateAnimation">
              🍻
            </div>

            <h2>
              Kiste Bier spendieren
            </h2>

            <p>
              Dafür bekommst du
              <strong> 20 Punkte</strong>
              pro Kiste.
            </p>

            <input
              className="input"
              type="number"
              min="1"
              value={crateCount}
              onChange={(e) =>
                setCrateCount(
                  e.target.value
                )
              }
            />

            <button
              className="crateConfirm"
              onClick={donateCrate}
              disabled={busy}
            >
              🍻 KISTE SPENDIEREN
            </button>
          </div>
        </div>
      )}

      {showProfile && (
        <div
          className="modalBackdrop"
          onClick={() =>
            setShowProfile(false)
          }
        >
          <div
            className="profileModal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modalClose"
              onClick={() =>
                setShowProfile(false)
              }
            >
              ×
            </button>

            <div className="profileHero">
              <div className="profileAvatar">
                👤
              </div>

              <h2>
                {selectedProfile
                  ? selectedProfile.name
                  : profile?.name}
              </h2>

              <span>
                {selectedProfile
                  ? selectedProfile.email
                  : profile?.email}
              </span>
            </div>

            {selectedProfile ? (
              <>
                <div className="profileStats">
                  <div>
                    <b>
                      {
                        selectedProfileDrinkCount
                      }
                    </b>
                    <span>Getränke</span>
                  </div>

                  <div>
                    <b>
                      {selectedProfileLiters.toFixed(
                        1
                      )}
                    </b>
                    <span>Liter</span>
                  </div>

                  <div>
                    <b>
                      {
                        selectedProfilePoints
                      }
                    </b>
                    <span>Punkte</span>
                  </div>

                  <div>
                    <b>
                      {formatMoney(
                        selectedProfilePaid
                      )}
                    </b>
                    <span>Bezahlt</span>
                  </div>
                </div>

                <h3>
                  🏆 Punkte-Historie
                </h3>

                <div className="pointHistory">
                  {selectedProfileHistory.length ===
                  0 ? (
                    <div className="emptyMini">
                      Noch keine
                      Punkte-Historie.
                    </div>
                  ) : (
                    selectedProfileHistory.map(
                      (item) => (
                        <div
                          className="pointRow"
                          key={item.id}
                        >
                          <div>
                            <strong>
                              {
                                item.reason
                              }
                            </strong>

                            <span>
                              {formatDate(
                                item.created_at
                              )}
                            </span>
                          </div>

                          <b>
                            +
                            {
                              item.points
                            }
                          </b>
                        </div>
                      )
                    )
                  )}
                </div>

                <h3>
                  🍺 Getränkeverlauf
                </h3>

                <div className="pointHistory">
                  {selectedProfileDrinks.length ===
                  0 ? (
                    <div className="emptyMini">
                      Noch keine Getränke.
                    </div>
                  ) : (
                    selectedProfileDrinks.map(
                      (item) => (
                        <div
                          className="pointRow"
                          key={item.id}
                        >
                          <div>
                            <strong>
                              🍺{" "}
                              {
                                item.drink_name
                              }
                            </strong>

                            <span>
                              {formatDate(
                                item.consumed_at
                              )}
                            </span>
                          </div>

                          <b>
                            {Number(
                              item.liters
                            ).toFixed(
                              1
                            )}{" "}
                            L
                          </b>
                        </div>
                      )
                    )
                  )}
                </div>
              </>
            ) : (
              <p>
                Wähle eine Person aus,
                um deren Details zu sehen.
              </p>
            )}
          </div>
        </div>
      )}

      <style jsx>{styles}</style>
    </main>
  );
}

function SettingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className="settingRow"
      onClick={() =>
        onChange(!value)
      }
    >
      <span>{label}</span>

      <span
        className={
          value
            ? "toggle on"
            : "toggle"
        }
      >
        <span />
      </span>
    </button>
  );
}

const styles = `
* {
  box-sizing: border-box;
}

:global(html),
:global(body) {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: #080b10;
}

:global(body) {
  overflow-x: hidden;
}

.page {
  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(
      circle at 50% -10%,
      rgba(245, 158, 11, .18),
      transparent 35%
    ),
    radial-gradient(
      circle at 100% 40%,
      rgba(220, 38, 38, .08),
      transparent 30%
    ),
    #080b10;
  color: #fff;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
  padding: 0;
  margin: 0;
}

.appShell {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 18px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
  cursor: pointer;
}

.brandIcon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 17px;
  background:
    linear-gradient(
      145deg,
      #27313d,
      #111720
    );
  border: 1px solid rgba(255,255,255,.08);
  font-size: 28px;
  box-shadow:
    0 12px 35px rgba(0,0,0,.25);
}

.brand strong {
  display: block;
  font-size: 20px;
}

.brand span {
  display: block;
  color: #8995a3;
  margin-top: 4px;
  font-size: 12px;
}

.topActions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.adminBadge {
  background: rgba(245,158,11,.12);
  border: 1px solid rgba(245,158,11,.3);
  color: #fbbf24;
  padding: 8px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.profileButton,
.logoutButton {
  border: 1px solid #293442;
  background: #141b24;
  color: white;
  border-radius: 11px;
  padding: 10px 13px;
  cursor: pointer;
}

.logoutButton {
  color: #aab4bf;
}

.profileButton:hover,
.logoutButton:hover {
  background: #1b2430;
}

.toast {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: #151d27;
  border: 1px solid #394654;
  color: #fbbf24;
  padding: 12px 17px;
  border-radius: 13px;
  box-shadow: 0 15px 45px rgba(0,0,0,.4);
  max-width: min(90vw, 650px);
  text-align: center;
}

.eventBar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 15px;
  padding: 15px;
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 18px;
  margin-bottom: 14px;
}

.eventBar small {
  display: block;
  color: #718091;
  font-size: 10px;
  font-weight: 800;
  margin-bottom: 6px;
  letter-spacing: .08em;
}

.eventSelect {
  min-width: 280px;
  border: 1px solid #303b47;
  background: #111820;
  color: white;
  padding: 12px 13px;
  border-radius: 11px;
  outline: none;
}

.eventActions {
  display: flex;
  gap: 8px;
}

.primaryButton,
.secondaryButton,
.dangerButton,
.acceptButton,
.declineButton,
.miniButton,
.beerConfirm,
.crateConfirm {
  border: 0;
  cursor: pointer;
  font-weight: 800;
  border-radius: 12px;
  transition:
    transform .15s ease,
    opacity .15s ease,
    background .15s ease;
}

.primaryButton:hover,
.secondaryButton:hover,
.dangerButton:hover,
.beerConfirm:hover,
.crateConfirm:hover {
  transform: translateY(-1px);
}

.primaryButton {
  background: linear-gradient(
    135deg,
    #fbbf24,
    #f59e0b
  );
  color: #15100a;
  padding: 12px 17px;
}

.primaryButton:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.secondaryButton {
  background: #1a232d;
  border: 1px solid #303b47;
  color: #fff;
  padding: 11px 14px;
}

.secondaryButton.large {
  padding: 13px 18px;
}

.secondaryButton.full,
.primaryButton.full {
  width: 100%;
}

.dangerButton {
  background: #351a1e;
  color: #ff8b8b;
  padding: 11px 13px;
  border: 1px solid #5c282d;
}

.eventHero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  padding: 25px;
  border-radius: 22px;
  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,.075),
      rgba(255,255,255,.025)
    );
  border: 1px solid rgba(255,255,255,.08);
  margin-bottom: 14px;
  overflow: hidden;
}

.eventTitleRow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.eventHero h1 {
  font-size: 30px;
  margin: 0;
}

.eventHero p {
  color: #98a4b1;
  margin: 9px 0;
}

.location {
  color: #8995a3;
  font-size: 13px;
}

.adminSmall {
  color: #fbbf24;
  background: rgba(245,158,11,.12);
  border: 1px solid rgba(245,158,11,.25);
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 900;
}

.inviteBox {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 15px;
  padding: 10px 13px;
  border-radius: 12px;
  background: #101720;
  border: 1px solid #27323e;
}

.inviteBox span {
  color: #7e8b99;
  font-size: 11px;
}

.inviteBox strong {
  color: #fbbf24;
  letter-spacing: .08em;
}

.heroStats {
  display: grid;
  grid-template-columns: repeat(2, minmax(110px,1fr));
  gap: 9px;
  align-content: center;
}

.heroStats div {
  min-width: 120px;
  text-align: center;
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 14px;
  padding: 13px;
}

.heroStats b {
  display: block;
  font-size: 20px;
}

.heroStats span {
  color: #788594;
  font-size: 10px;
  display: block;
  margin-top: 4px;
}

.navigation {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 10px;
  margin-bottom: 5px;
}

.navigation::-webkit-scrollbar {
  display: none;
}

.navButton {
  flex: 0 0 auto;
  border: 1px solid #252f3a;
  background: #10161d;
  color: #84909e;
  border-radius: 12px;
  padding: 10px 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 700;
}

.navButton.active {
  color: #111;
  background: #fbbf24;
  border-color: #fbbf24;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.actionGrid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.actionCard,
.beerButton,
.crateButton {
  min-height: 145px;
  border-radius: 18px;
  cursor: pointer;
  color: white;
  border: 1px solid rgba(255,255,255,.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px;
  text-align: center;
  transition:
    transform .18s ease,
    box-shadow .18s ease;
}

.actionCard:hover,
.beerButton:hover,
.crateButton:hover {
  transform: translateY(-3px);
}

.actionCard {
  background:
    linear-gradient(
      145deg,
      #18212b,
      #10161d
    );
}

.actionCard span {
  font-size: 30px;
  margin-bottom: 8px;
}

.actionCard strong,
.beerButton strong,
.crateButton strong {
  font-size: 13px;
}

.actionCard small,
.beerButton small,
.crateButton small {
  color: #85919e;
  margin-top: 5px;
  font-size: 10px;
}

.beerButton {
  background:
    radial-gradient(
      circle at 50% 25%,
      rgba(255,255,255,.12),
      transparent 35%
    ),
    linear-gradient(
      145deg,
      #8e1017,
      #4d090d
    );
  border-color: #a41c25;
  box-shadow:
    0 12px 35px rgba(180,20,30,.15);
  animation: beerPulse 2.8s infinite;
}

.beerIcon {
  font-size: 42px;
  margin-bottom: 3px;
}

.crateButton {
  background:
    linear-gradient(
      145deg,
      #63350e,
      #2f1b0b
    );
  border-color: #85531c;
}

.crateButton > span {
  font-size: 38px;
  margin-bottom: 4px;
}

@keyframes beerPulse {
  0%, 100% {
    box-shadow:
      0 0 0 0 rgba(220,38,38,.12);
  }

  50% {
    box-shadow:
      0 0 0 8px rgba(220,38,38,0);
  }
}

.card {
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.055),
      rgba(255,255,255,.025)
    );
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 19px;
  padding: 19px;
}

.card h2 {
  margin: 0;
  font-size: 18px;
}

.card p {
  color: #8995a3;
  font-size: 13px;
}

.dashboardGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.sectionHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
}

.sectionHeader p {
  margin: 5px 0 0;
}

.miniButton {
  background: #1b2530;
  color: #c5ced7;
  border: 1px solid #303b47;
  padding: 7px 10px;
}

.countBadge {
  background: #c21d26;
  color: white;
  border-radius: 999px;
  min-width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 900;
}

.highlight {
  border-color: rgba(239,68,68,.35);
  background:
    linear-gradient(
      145deg,
      rgba(127,29,29,.22),
      rgba(255,255,255,.025)
    );
}

.request {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255,255,255,.04);
  margin-top: 8px;
}

.requestAvatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  background: #28161a;
  border-radius: 12px;
  font-size: 22px;
}

.requestText {
  flex: 1;
}

.requestText strong,
.requestText span {
  display: block;
}

.requestText span {
  color: #8793a0;
  font-size: 12px;
  margin-top: 3px;
}

.requestButtons {
  display: flex;
  gap: 6px;
}

.acceptButton,
.declineButton {
  width: 38px;
  height: 38px;
  padding: 0;
  font-size: 17px;
}

.acceptButton {
  background: #143522;
}

.declineButton {
  background: #38191d;
}

.memberList {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.memberRow {
  width: 100%;
  border: 0;
  background: rgba(255,255,255,.04);
  color: white;
  border-radius: 13px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 11px;
  cursor: pointer;
  text-align: left;
}

.memberRow:hover {
  background: rgba(255,255,255,.075);
}

.avatar {
  width: 39px;
  height: 39px;
  border-radius: 11px;
  background: #202b36;
  display: grid;
  place-items: center;
}

.avatar.big {
  width: 48px;
  height: 48px;
}

.memberInfo {
  flex: 1;
}

.memberInfo strong,
.memberInfo span {
  display: block;
}

.memberInfo span {
  color: #7f8c9a;
  font-size: 11px;
  margin-top: 3px;
}

.moneyStats {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 8px;
  margin-bottom: 13px;
}

.moneyStats div {
  padding: 13px;
  border-radius: 13px;
  background: rgba(255,255,255,.045);
  text-align: center;
}

.moneyStats span {
  display: block;
  color: #7d8996;
  font-size: 10px;
}

.moneyStats strong {
  display: block;
  margin-top: 5px;
  font-size: 17px;
}

.green {
  color: #58d68d !important;
}

.red {
  color: #ff7474 !important;
}

.rankingList {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.rankRow {
  border: 0;
  width: 100%;
  display: grid;
  grid-template-columns: 45px 1fr auto;
  align-items: center;
  gap: 9px;
  background: rgba(255,255,255,.045);
  color: white;
  padding: 12px;
  border-radius: 13px;
  cursor: pointer;
  text-align: left;
}

.rankRow:hover {
  background: rgba(255,255,255,.075);
}

.rankNumber {
  font-size: 22px;
  text-align: center;
}

.rankName strong,
.rankName span {
  display: block;
}

.rankName span {
  color: #7f8b98;
  font-size: 10px;
  margin-top: 3px;
}

.pageHeading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 2px;
}

.pageHeading h2 {
  margin: 0;
  font-size: 25px;
}

.pageHeading p {
  margin: 5px 0 0;
  color: #7f8c99;
}

.formGrid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 9px;
  margin: 13px 0;
}

.input {
  width: 100%;
  padding: 13px;
  border-radius: 11px;
  border: 1px solid #2d3945;
  background: #10171f;
  color: white;
  outline: none;
  margin-bottom: 9px;
}

.input:focus {
  border-color: #d69b1d;
}

.textarea {
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
}

.drinkList,
.paymentList,
.historyList,
.pointHistory {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.drinkRow,
.paymentRow,
.historyRow,
.pointRow {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px;
  border-radius: 13px;
  background: rgba(255,255,255,.04);
}

.drinkIcon,
.historyIcon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #302516;
  font-size: 21px;
}

.drinkInfo,
.historyInfo {
  flex: 1;
}

.drinkInfo strong,
.drinkInfo span,
.drinkInfo small,
.historyInfo strong,
.historyInfo span,
.paymentRow span,
.pointRow span {
  display: block;
}

.drinkInfo span,
.historyInfo span {
  color: #8995a2;
  font-size: 11px;
  margin-top: 3px;
}

.drinkInfo small {
  color: #63707e;
  margin-top: 4px;
  font-size: 10px;
}

.historyTime {
  color: #697786;
  width: 105px;
  font-size: 10px;
}

.historyMeta {
  text-align: right;
  color: #aeb8c2;
  font-size: 11px;
}

.paymentPerson {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255,255,255,.04);
  border-radius: 12px;
  margin-top: 7px;
}

.paymentPerson strong,
.paymentPerson span {
  display: block;
}

.paymentPerson span {
  color: #7b8794;
  font-size: 10px;
  margin-top: 3px;
}

.paymentRow {
  justify-content: space-between;
}

.paymentRow div:first-child {
  flex: 1;
}

.paymentRow span {
  color: #788594;
  font-size: 10px;
  margin-top: 3px;
}

.bigMoney {
  margin: 0;
}

.bigMoney div {
  padding: 20px 12px;
}

.bigMoney strong {
  font-size: 24px;
}

.fullRanking .bigRank {
  padding: 17px;
}

.challengeList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.challengeCard {
  border-radius: 17px;
  padding: 17px;
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.06),
      rgba(255,255,255,.025)
    );
  border: 1px solid rgba(255,255,255,.07);
}

.challengeTop {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.challengeIcon {
  width: 45px;
  height: 45px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: #252033;
  font-size: 23px;
}

.challengeTop h3 {
  margin: 2px 0 5px;
}

.challengeTop p {
  margin: 0;
  color: #7e8a98;
  font-size: 12px;
}

.challengePoints {
  margin-left: auto;
  color: #fbbf24;
  white-space: nowrap;
}

.challengeBottom {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  color: #788593;
  font-size: 11px;
}

.challengeBottom .primaryButton,
.challengeBottom .secondaryButton {
  margin-left: auto;
}

.settingRow {
  width: 100%;
  border: 0;
  background: rgba(255,255,255,.04);
  color: white;
  padding: 13px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 7px;
  cursor: pointer;
  text-align: left;
}

.toggle {
  width: 45px;
  height: 25px;
  border-radius: 999px;
  background: #303944;
  padding: 3px;
  transition: background .2s ease;
}

.toggle span {
  display: block;
  width: 19px;
  height: 19px;
  background: #7b8793;
  border-radius: 50%;
  transition: transform .2s ease;
}

.toggle.on {
  background: #d99513;
}

.toggle.on span {
  background: #fff;
  transform: translateX(20px);
}

.emptyState {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  padding: 40px 20px;
}

.emptyIcon {
  font-size: 65px;
  margin-bottom: 15px;
}

.emptyState h2 {
  font-size: 27px;
  margin: 0;
}

.emptyState p {
  color: #7f8b99;
  max-width: 500px;
  line-height: 1.6;
}

.emptyActions {
  display: flex;
  gap: 9px;
  margin-top: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.emptyMini {
  color: #697684;
  text-align: center;
  padding: 25px;
}

.footer {
  text-align: center;
  padding: 35px 10px 15px;
  color: #4e5b68;
}

.footer strong,
.footer span {
  display: block;
}

.footer span {
  font-size: 11px;
  margin-top: 5px;
}

.modalBackdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.modal,
.profileModal,
.beerModal {
  position: relative;
  width: min(100%, 520px);
  max-height: 90vh;
  overflow-y: auto;
  background:
    linear-gradient(
      145deg,
      #18212b,
      #0d131a
    );
  border: 1px solid #303b47;
  border-radius: 22px;
  padding: 24px;
  box-shadow:
    0 30px 100px rgba(0,0,0,.55);
}

.modalClose {
  position: absolute;
  right: 13px;
  top: 10px;
  border: 0;
  background: transparent;
  color: #8995a3;
  font-size: 29px;
  cursor: pointer;
}

.modal h2,
.profileModal h2 {
  margin-top: 0;
}

.inviteInput {
  text-align: center;
  font-size: 20px;
  letter-spacing: .15em;
}

.beerModal {
  text-align: center;
  border-color: #702229;
}

.beerAnimation {
  font-size: 80px;
  animation:
    beerBounce .8s ease-in-out infinite alternate;
}

@keyframes beerBounce {
  from {
    transform: rotate(-8deg) scale(.96);
  }

  to {
    transform: rotate(8deg) scale(1.04);
  }
}

.beerModal h2 {
  font-size: 34px;
  margin: 5px 0;
}

.beerMessage {
  margin: 15px 0;
  padding: 15px;
  border-radius: 14px;
  background: rgba(255,255,255,.05);
  color: #f4c95d;
}

.modalActions {
  display: flex;
  gap: 8px;
}

.modalActions > * {
  flex: 1;
}

.beerConfirm {
  background: #bd2029;
  color: white;
  padding: 13px;
}

.crateModal {
  text-align: center;
}

.crateAnimation {
  font-size: 70px;
  animation:
    cratePulse 1s infinite alternate;
}

@keyframes cratePulse {
  from {
    transform: scale(.95);
  }

  to {
    transform: scale(1.05);
  }
}

.crateConfirm {
  width: 100%;
  background: #d8890b;
  color: #161006;
  padding: 14px;
}

.profileHero {
  text-align: center;
  padding-bottom: 15px;
}

.profileAvatar {
  width: 75px;
  height: 75px;
  margin: 0 auto 10px;
  border-radius: 23px;
  display: grid;
  place-items: center;
  background: #202b36;
  font-size: 38px;
}

.profileHero h2 {
  margin-bottom: 4px;
}

.profileHero > span {
  color: #758291;
  font-size: 12px;
}

.profileStats {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 7px;
  margin: 12px 0 20px;
}

.profileStats div {
  background: rgba(255,255,255,.045);
  border-radius: 12px;
  padding: 11px 5px;
  text-align: center;
}

.profileStats b,
.profileStats span {
  display: block;
}

.profileStats b {
  font-size: 16px;
}

.profileStats span {
  color: #788592;
  font-size: 9px;
  margin-top: 4px;
}

.pointRow {
  justify-content: space-between;
}

.pointRow div {
  flex: 1;
}

.pointRow span {
  color: #71808e;
  font-size: 9px;
  margin-top: 3px;
}

.pointRow b {
  color: #fbbf24;
}

.loadingScreen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loadingLogo {
  font-size: 65px;
  animation:
    beerBounce .8s infinite alternate;
}

.loadingScreen h1 {
  font-size: 24px;
}

.loadingScreen p {
  color: #758290;
}

.spinner {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid #303944;
  border-top-color: #fbbf24;
  animation: spin .7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.authWrap {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.authCard {
  width: min(100%, 430px);
  padding: 32px;
  border-radius: 25px;
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.07),
      rgba(255,255,255,.025)
    );
  border: 1px solid rgba(255,255,255,.09);
  box-shadow:
    0 30px 90px rgba(0,0,0,.4);
}

.authLogo {
  width: 72px;
  height: 72px;
  border-radius: 23px;
  background: #202b36;
  display: grid;
  place-items: center;
  font-size: 40px;
  margin-bottom: 18px;
}

.authCard h1 {
  font-size: 28px;
  line-height: 1.1;
  margin: 0;
}

.authSubtitle {
  color: #7f8c99;
  margin: 8px 0 20px;
  font-size: 12px;
}

.authTabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  background: #0d1319;
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 14px;
}

.tab {
  border: 0;
  background: transparent;
  color: #778492;
  padding: 10px;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 800;
}

.tab.active {
  background: #fbbf24;
  color: #171109;
}

.message {
  margin-top: 12px;
  padding: 11px;
  border-radius: 11px;
  background: #17212b;
  border: 1px solid #344352;
  color: #fbbf24;
  font-size: 12px;
  text-align: center;
}

@media (max-width: 900px) {
  .actionGrid {
    grid-template-columns: repeat(3,1fr);
  }

  .eventHero {
    grid-template-columns: 1fr;
  }

  .heroStats {
    grid-template-columns: repeat(4,1fr);
  }
}

@media (max-width: 700px) {
  .appShell {
    padding: 10px;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .topActions {
    width: 100%;
    justify-content: flex-start;
  }

  .eventBar {
    align-items: stretch;
    flex-direction: column;
  }

  .eventSelect {
    width: 100%;
    min-width: 0;
  }

  .eventActions {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
  }

  .actionGrid {
    grid-template-columns: repeat(2,1fr);
  }

  .dashboardGrid {
    grid-template-columns: 1fr;
  }

  .heroStats {
    grid-template-columns: repeat(2,1fr);
  }

  .formGrid {
    grid-template-columns: 1fr;
  }

  .profileStats {
    grid-template-columns: repeat(2,1fr);
  }
}

@media (max-width: 480px) {
  .brand strong {
    font-size: 16px;
  }

  .brand span {
    font-size: 10px;
  }

  .eventHero {
    padding: 18px;
  }

  .eventHero h1 {
    font-size: 23px;
  }

  .actionGrid {
    grid-template-columns: 1fr 1fr;
  }

  .actionCard,
  .beerButton,
  .crateButton {
    min-height: 125px;
  }

  .beerIcon {
    font-size: 34px;
  }

  .heroStats b {
    font-size: 17px;
  }

  .moneyStats {
    grid-template-columns: 1fr;
  }

  .request {
    flex-wrap: wrap;
  }

  .requestButtons {
    width: 100%;
  }

  .requestButtons button {
    flex: 1;
  }

  .historyTime {
    width: 80px;
    font-size: 9px;
  }

  .authCard {
    padding: 24px 18px;
  }
}
`;
