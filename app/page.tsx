"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type EventRow = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  invite_code?: string | null;
  created_by?: string | null;
  is_active?: boolean;
  created_at?: string;
};

type Profile = {
  id: string;
  name: string;
  email?: string | null;
};

type EventMember = {
  id?: string;
  event_id: string;
  profile_id: string;
  role: "admin" | "member";
  profile?: Profile;
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
  profile?: Profile;
};

type Payment = {
  id: string;
  event_id: string;
  betrag: number;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status: string;
  created_at: string;
  payer?: Profile;
};

type PointHistory = {
  id: string;
  event_id: string;
  profile_id: string;
  points: number;
  reason: string;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at: string;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  target_profile_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at?: string | null;
  requester?: Profile;
  target?: Profile;
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
  title: string;
  description?: string | null;
  points: number;
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
  is_active?: boolean;
  created_at?: string;
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

function money(value: unknown) {
  return Number(value || 0).toFixed(2);
}

function liters(value: unknown) {
  return Number(value || 0).toFixed(2);
}

function drinkTitle(drink: Drink) {
  return drink.getraenk || drink.drink_name || "Getränk";
}

function drinkLiters(drink: Drink) {
  return Number(drink.liters ?? drink.menge ?? 0);
}

function drinkAlcohol(drink: Drink) {
  return Number(drink.alcohol_percent ?? drink.alkohol ?? 0);
}

function drinkPrice(drink: Drink) {
  return Number(drink.preis ?? 0);
}

export default function Home() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventId, setEventId] = useState("");

  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [history, setHistory] = useState<DrinkHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointHistory[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [crateDonations, setCrateDonations] = useState<CrateDonation[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [settings, setSettings] =
    useState<EventSettings>(DEFAULT_SETTINGS);

  const [message, setMessage] = useState("");

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showJoinEvent, setShowJoinEvent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);

  const [selectedPerson, setSelectedPerson] =
    useState<Profile | null>(null);

  const [animation, setAnimation] = useState<
    "beer" | "money" | "crate" | null
  >(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authMode, setAuthMode] =
    useState<"login" | "register">("login");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const [inviteCode, setInviteCode] = useState("");

  const [personName, setPersonName] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkLitersValue, setDrinkLitersValue] = useState("0.5");
  const [drinkAlcoholValue, setDrinkAlcoholValue] = useState("5");
  const [drinkPriceValue, setDrinkPriceValue] = useState("2");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPersonId, setPaymentPersonId] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] =
    useState("");
  const [challengePoints, setChallengePoints] = useState("20");

  const currentEvent = events.find((event) => event.id === eventId);

  const isAdmin =
    !!currentEvent &&
    !!userId &&
    currentEvent.created_by === userId;

  const currentMember = members.find(
    (member) => member.profile_id === userId
  );

  const isEventAdmin =
    isAdmin || currentMember?.role === "admin";

  const totalLiters = drinks.reduce(
    (sum, drink) => sum + drinkLiters(drink),
    0
  );

  const totalDrinkCost = drinks.reduce(
    (sum, drink) => sum + drinkPrice(drink),
    0
  );

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.betrag || 0),
    0
  );

  const totalPoints = pointsHistory.reduce(
    (sum, item) => sum + Number(item.points || 0),
    0
  );

  const ranking = useMemo(() => {
    const result = members.map((member) => {
      const points = pointsHistory
        .filter((item) => item.profile_id === member.profile_id)
        .reduce(
          (sum, item) => sum + Number(item.points || 0),
          0
        );

      const personHistory = history.filter(
        (item) => item.profile_id === member.profile_id
      );

      const personLiters = personHistory.reduce(
        (sum, item) => sum + Number(item.liters || 0),
        0
      );

      return {
        profile:
          member.profile ||
          ({
            id: member.profile_id,
            name: "Unbekannt",
          } as Profile),
        points,
        drinks: personHistory.length,
        liters: personLiters,
      };
    });

    return result.sort((a, b) => b.points - a.points);
  }, [members, pointsHistory, history]);

  const selectedPersonPoints = selectedPerson
    ? pointsHistory
        .filter((item) => item.profile_id === selectedPerson.id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
    : [];

  const selectedPersonHistory = selectedPerson
    ? history
        .filter((item) => item.profile_id === selectedPerson.id)
        .sort(
          (a, b) =>
            new Date(b.consumed_at).getTime() -
            new Date(a.consumed_at).getTime()
        )
    : [];

  const myIncomingBeerRequests = beerRequests.filter(
    (request) =>
      request.target_profile_id === userId &&
      request.status === "pending"
  );

  const outgoingBeerRequests = beerRequests.filter(
    (request) =>
      request.requester_profile_id === userId &&
      request.status === "pending"
  );

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
    }
  }, [eventId]);

  async function initialize() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);

    await ensureProfile(user.id);
    await loadProfile(user.id);
    await loadEvents(user.id);
  }

  async function ensureProfile(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("profiles").upsert(
      {
        id,
        name:
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Benutzer",
        email: user.email,
      },
      {
        onConflict: "id",
      }
    );
  }

  async function loadProfile(id: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (data) setProfile(data);
  }

  async function loadEvents(id: string) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage("❌ Events konnten nicht geladen werden: " + error.message);
      return;
    }

    const visibleEvents = (data || []).filter(
      (event) =>
        event.created_by === id ||
        event.is_active !== false
    );

    setEvents(visibleEvents);

    if (!eventId && visibleEvents.length > 0) {
      setEventId(visibleEvents[0].id);
    }
  }

  async function loadEventData(id: string) {
    await Promise.all([
      loadMembers(id),
      loadDrinks(id),
      loadHistory(id),
      loadPayments(id),
      loadPoints(id),
      loadBeerRequests(id),
      loadCrates(id),
      loadChallenges(id),
      loadSettings(id),
    ]);
  }

  async function loadMembers(id: string) {
    const { data, error } = await supabase
      .from("event_members")
      .select(
        `
        *,
        profile:profiles!event_members_profile_id_fkey(
          id,
          name,
          email
        )
      `
      )
      .eq("event_id", id);

    if (error) {
      const fallback = await supabase
        .from("event_members")
        .select("*")
        .eq("event_id", id);

      setMembers(fallback.data || []);
      return;
    }

    setMembers(data || []);
  }

  async function loadDrinks(id: string) {
    const { data } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    setDrinks(data || []);
  }

  async function loadHistory(id: string) {
    const { data } = await supabase
      .from("drink_history")
      .select(
        `
        *,
        profile:profiles!drink_history_profile_id_fkey(
          id,
          name,
          email
        )
      `
      )
      .eq("event_id", id)
      .order("consumed_at", {
        ascending: false,
      });

    setHistory(data || []);
  }

  async function loadPayments(id: string) {
    const { data } = await supabase
      .from("payments")
      .select(
        `
        *,
        payer:profiles!payments_bezahlt_von_fkey(
          id,
          name,
          email
        )
      `
      )
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    setPayments(data || []);
  }

  async function loadPoints(id: string) {
    const { data } = await supabase
      .from("points_history")
      .select("*")
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    setPointsHistory(data || []);
  }

  async function loadBeerRequests(id: string) {
    const { data } = await supabase
      .from("beer_requests")
      .select("*")
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    setBeerRequests(data || []);
  }

  async function loadCrates(id: string) {
    const { data } = await supabase
      .from("crate_donations")
      .select("*")
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    setCrateDonations(data || []);
  }

  async function loadChallenges(id: string) {
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    setChallenges(data || []);
  }

  async function loadSettings(id: string) {
    const { data } = await supabase
      .from("event_settings")
      .select("*")
      .eq("event_id", id)
      .maybeSingle();

    if (data) {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...data,
      });
    } else {
      setSettings({
        ...DEFAULT_SETTINGS,
        event_id: id,
      });
    }
  }

  async function loginOrRegister() {
    setMessage("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setMessage("❌ E-Mail und Passwort eingeben.");
      return;
    }

    if (authMode === "login") {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });

      if (error) {
        setMessage("❌ " + error.message);
        return;
      }

      setMessage("✅ Erfolgreich angemeldet.");
      await initialize();
      return;
    }

    const name = loginEmail
      .split("@")[0]
      .trim();

    const { error } = await supabase.auth.signUp({
      email: loginEmail.trim(),
      password: loginPassword,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setMessage(
      "✅ Registrierung erfolgreich. Falls aktiviert, bestätige bitte deine E-Mail."
    );
  }

  async function logout() {
    await supabase.auth.signOut();

    setUserId("");
    setProfile(null);
    setEvents([]);
    setEventId("");
    setMembers([]);
    setDrinks([]);
    setHistory([]);
    setPayments([]);
    setPointsHistory([]);
    setBeerRequests([]);
    setCrateDonations([]);
    setChallenges([]);
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

    setMessage("🎉 Event erfolgreich erstellt!");

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setShowCreateEvent(false);

    await loadEvents(userId);

    if (data) {
      setEventId(data);
    }
  }

  async function deleteEvent() {
    if (!currentEvent || !isEventAdmin) return;

    const confirmed = window.confirm(
      `Event "${currentEvent.title}" wirklich löschen?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", currentEvent.id);

    if (error) {
      setMessage(
        "❌ Event konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    setMessage("🗑️ Event gelöscht.");

    setEventId("");
    await loadEvents(userId);
  }

  async function joinEvent() {
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
        "❌ Beitritt fehlgeschlagen: " +
          error.message
      );
      return;
    }

    setMessage("🎉 Du bist dem Event beigetreten!");
    setInviteCode("");
    setShowJoinEvent(false);

    await loadEvents(userId);

    if (data) setEventId(data);
  }

  async function addPerson() {
    if (!eventId) return;

    if (!personName.trim()) {
      setMessage("❌ Bitte einen Namen eingeben.");
      return;
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .ilike("name", personName.trim());

    let person = existing?.[0];

    if (!person) {
      const generatedId = crypto.randomUUID();

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: generatedId,
          name: personName.trim(),
        })
        .select()
        .single();

      if (error) {
        setMessage(
          "❌ Teilnehmer konnte nicht erstellt werden: " +
            error.message
        );
        return;
      }

      person = data;
    }

    const { error } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        profile_id: person.id,
        role: "member",
      });

    if (error) {
      if (error.code === "23505") {
        setMessage("ℹ️ Teilnehmer ist bereits im Event.");
      } else {
        setMessage(
          "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
            error.message
        );
      }

      return;
    }

    setPersonName("");
    setMessage("✅ Teilnehmer hinzugefügt.");
    await loadMembers(eventId);
  }

  async function saveDrink() {
    if (!eventId) return;

    if (!drinkName.trim()) {
      setMessage("❌ Getränk eingeben.");
      return;
    }

    const amount = Number(drinkLitersValue);
    const alcohol = Number(drinkAlcoholValue);
    const price = Number(drinkPriceValue);

    const { error } = await supabase
      .from("drinks")
      .insert({
        event_id: eventId,
        getraenk: drinkName.trim(),
        drink_name: drinkName.trim(),
        menge: amount,
        liters: amount,
        alkohol: alcohol,
        alcohol_percent: alcohol,
        preis: price,
        quantity: 1,
      });

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setDrinkName("");
    setDrinkLitersValue("0.5");
    setDrinkAlcoholValue("5");
    setDrinkPriceValue("2");

    setMessage("🍺 Getränk gespeichert.");
    await loadDrinks(eventId);
  }

  async function assignDrink(
    targetProfileId: string,
    drink: Drink
  ) {
    if (!eventId) return;

    const amount = drinkLiters(drink);
    const alcohol = drinkAlcohol(drink);
    const price = drinkPrice(drink);

    const { error } = await supabase
      .from("drink_history")
      .insert({
        event_id: eventId,
        profile_id: targetProfileId,
        drink_id: drink.id,
        drink_name: drinkTitle(drink),
        liters: amount,
        alcohol_percent: alcohol,
        price,
      });

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    await addPoints(
      targetProfileId,
      10,
      `🍺 ${drinkTitle(drink)} getrunken`
    );

    setAnimation("beer");

    window.setTimeout(() => {
      setAnimation(null);
    }, 1800);

    setMessage("🍻 Prost! +10 Punkte");

    await loadHistory(eventId);
    await loadPoints(eventId);
  }

  async function addPoints(
    profileId: string,
    points: number,
    reason: string,
    referenceType?: string,
    referenceId?: string
  ) {
    await supabase.from("points_history").insert({
      event_id: eventId,
      profile_id: profileId,
      points,
      reason,
      reference_type: referenceType || null,
      reference_id: referenceId || null,
    });
  }

  async function savePayment() {
    if (!eventId) return;

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      setMessage("❌ Betrag eingeben.");
      return;
    }

    const payer =
      paymentPersonId || userId;

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

    await addPoints(
      payer,
      5,
      `💶 Zahlung ${amount.toFixed(2)} €`
    );

    setAnimation("money");

    window.setTimeout(() => {
      setAnimation(null);
    }, 2200);

    setPaymentAmount("");
    setPaymentPersonId("");

    setMessage("💶 Zahlung gespeichert!");
    await loadPayments(eventId);
    await loadPoints(eventId);
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
      setMessage(
        "❌ Kiste konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    await addPoints(
      userId,
      20,
      "🍺 Kiste Bier spendiert",
      "crate",
      undefined
    );

    setAnimation("crate");

    window.setTimeout(() => {
      setAnimation(null);
    }, 2400);

    setMessage(
      "🍺 Kiste Bier spendiert! +20 Punkte"
    );

    await loadCrates(eventId);
    await loadPoints(eventId);
  }

  async function requestBeer(targetId: string) {
    if (!eventId || !userId || targetId === userId) return;

    const { error } = await supabase
      .from("beer_requests")
      .insert({
        event_id: eventId,
        requester_profile_id: userId,
        target_profile_id: targetId,
        status: "pending",
      });

    if (error) {
      setMessage(
        "❌ Bier-Anfrage konnte nicht gesendet werden: " +
          error.message
      );
      return;
    }

    setMessage("🍻 Bier-Anfrage gesendet!");
    await loadBeerRequests(eventId);
  }

  async function answerBeerRequest(
    request: BeerRequest,
    accepted: boolean
  ) {
    const { error } = await supabase
      .from("beer_requests")
      .update({
        status: accepted
          ? "accepted"
          : "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (error) {
      setMessage(
        "❌ Anfrage konnte nicht beantwortet werden: " +
          error.message
      );
      return;
    }

    if (accepted) {
      await addPoints(
        request.requester_profile_id,
        5,
        "🍻 Bier-Anfrage angenommen"
      );

      await addPoints(
        request.target_profile_id,
        5,
        "🍻 Bier-Anfrage angenommen"
      );

      setAnimation("beer");

      window.setTimeout(() => {
        setAnimation(null);
      }, 1800);
    }

    setMessage(
      accepted
        ? "🍻 Prost! Anfrage angenommen."
        : "❌ Anfrage abgelehnt."
    );

    await loadBeerRequests(eventId);
    await loadPoints(eventId);
  }

  async function createChallenge() {
    if (!eventId || !userId) return;

    if (!challengeTitle.trim()) {
      setMessage("❌ Challenge-Titel eingeben.");
      return;
    }

    const { error } = await supabase
      .from("challenges")
      .insert({
        event_id: eventId,
        title: challengeTitle.trim(),
        description:
          challengeDescription.trim() || null,
        points: Number(challengePoints) || 20,
        category: "fun",
        status: "open",
        created_by_profile_id: userId,
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
    setChallengePoints("20");

    setMessage("🎯 Challenge erstellt.");
    await loadChallenges(eventId);
  }

  async function completeChallenge(
    challenge: Challenge
  ) {
    if (!userId) return;

    const { error } = await supabase
      .from("challenges")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        winner_profile_id: userId,
      })
      .eq("id", challenge.id);

    if (error) {
      setMessage(
        "❌ Challenge konnte nicht abgeschlossen werden: " +
          error.message
      );
      return;
    }

    await addPoints(
      userId,
      Number(challenge.points || 0),
      `🎯 Challenge: ${challenge.title}`,
      "challenge",
      challenge.id
    );

    setMessage(
      `🏆 Challenge abgeschlossen! +${challenge.points} Punkte`
    );

    await loadChallenges(eventId);
    await loadPoints(eventId);
  }

  async function saveSettings() {
    if (!eventId || !isEventAdmin) return;

    const payload = {
      event_id: eventId,
      show_participants: settings.show_participants,
      show_drinks: settings.show_drinks,
      show_drink_history:
        settings.show_drink_history,
      show_payments: settings.show_payments,
      show_costs: settings.show_costs,
      show_ranking: settings.show_ranking,
      show_points: settings.show_points,
      show_promille: settings.show_promille,
      show_statistics: settings.show_statistics,
      show_challenges: settings.show_challenges,
      show_challenge_points:
        settings.show_challenge_points,
      show_beer_button:
        settings.show_beer_button,
      show_beer_requests:
        settings.show_beer_requests,
      show_crate_button:
        settings.show_crate_button,
      show_profiles: settings.show_profiles,
      show_photos: settings.show_photos,
      show_who_paid: settings.show_who_paid,
      show_who_owes: settings.show_who_owes,
    };

    const { error } = await supabase
      .from("event_settings")
      .upsert(payload, {
        onConflict: "event_id",
      });

    if (error) {
      setMessage(
        "❌ Einstellungen konnten nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setMessage("⚙️ Einstellungen gespeichert.");
    setShowSettings(false);
  }

  async function copyInviteCode() {
    if (!currentEvent?.invite_code) return;

    await navigator.clipboard.writeText(
      currentEvent.invite_code
    );

    setMessage("🔑 Einladungscode kopiert.");
  }

  if (!userId) {
    return (
      <main className="page">
        <div className="authShell">
          <div className="authLogo">🍻</div>

          <h1>Güstener Zapfhahn Zentrale</h1>

          <p>
            Events · Getränke · Punkte · Challenges
          </p>

          <div className="authCard">
            <div className="tabs">
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
                🔐 Anmelden
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
                👤 Registrieren
              </button>
            </div>

            <input
              type="email"
              placeholder="E-Mail"
              value={loginEmail}
              onChange={(e) =>
                setLoginEmail(e.target.value)
              }
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
              className="primary bigButton"
              onClick={loginOrRegister}
            >
              {authMode === "login"
                ? "🔐 Anmelden"
                : "🚀 Konto erstellen"}
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
      {animation && (
        <div className={`animation ${animation}`}>
          {animation === "beer" && (
            <>
              <div className="clink">
                🍺 🍺
              </div>
              <div className="prost">
                PROST!
              </div>
            </>
          )}

          {animation === "money" && (
            <div className="moneyRain">
              💶 💵 💶 💵 💶 💵
              <br />
              💵 💶 💵 💶 💵 💶
              <br />
              💶 💵 💶 💵 💶 💵
            </div>
          )}

          {animation === "crate" && (
            <>
              <div className="crateAnimation">
                🍺🍺🍺
              </div>

              <div className="prost">
                KISTE SPENDIERT!
              </div>
            </>
          )}
        </div>
      )}

      <div className="container">
        <header className="header">
          <div className="brandIcon">🍻</div>

          <div className="brandText">
            <h1>Güstener Zapfhahn Zentrale</h1>
            <p>
              Events · Getränke · Punkte · Challenges
            </p>
          </div>

          <button
            className="logout"
            onClick={logout}
          >
            ↪
          </button>
        </header>

        <section className="card eventCard">
          <div className="sectionTitle">
            <div>
              <span className="eyebrow">
                EVENT
              </span>

              <h2>
                📅 Aktuelles Event
              </h2>
            </div>

            <div className="eventActions">
              {isEventAdmin && (
                <>
                  <button
                    className="secondary"
                    onClick={() =>
                      setShowSettings(
                        !showSettings
                      )
                    }
                  >
                    ⚙️
                  </button>

                  <button
                    className="danger"
                    onClick={deleteEvent}
                  >
                    🗑️
                  </button>
                </>
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

          <div className="eventButtons">
            <button
              className="primary"
              onClick={() =>
                setShowCreateEvent(true)
              }
            >
              ➕ Neues Event
            </button>

            <button
              className="secondary"
              onClick={() =>
                setShowJoinEvent(true)
              }
            >
              🔑 Event beitreten
            </button>
          </div>

          {currentEvent?.invite_code && (
            <div className="inviteBox">
              <span>🔑 Einladungscode</span>

              <strong>
                {currentEvent.invite_code}
              </strong>

              <button
                className="copyButton"
                onClick={copyInviteCode}
              >
                📋
              </button>
            </div>
          )}
        </section>

        {showSettings && isEventAdmin && (
          <section className="card settingsCard">
            <div className="sectionTitle">
              <div>
                <span className="eyebrow">
                  ADMIN
                </span>
                <h2>⚙️ Event-Einstellungen</h2>
              </div>
            </div>

            <p className="muted">
              Du entscheidest, welche Bereiche
              die Teilnehmer sehen können.
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
                    "🕐 Getränkeverlauf",
                  ],
                  ["show_payments", "💶 Zahlungen"],
                  ["show_costs", "💰 Kosten"],
                  ["show_ranking", "🏆 Rangliste"],
                  ["show_points", "⭐ Punkte"],
                  ["show_promille", "🍺 Promille"],
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
                  ["show_profiles", "👤 Profile"],
                  ["show_photos", "📷 Fotos"],
                  [
                    "show_who_paid",
                    "💶 Wer bezahlt hat",
                  ],
                  [
                    "show_who_owes",
                    "💸 Wer noch bezahlen muss",
                  ],
                ] as const
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
                      setSettings({
                        ...settings,
                        [key]: e.target.checked,
                      })
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
          </section>
        )}

        <div className="stats">
          <div className="stat">
            <span>🍺</span>
            <b>{history.length}</b>
            <small>Getränke</small>
          </div>

          <div className="stat">
            <span>💧</span>
            <b>{liters(totalLiters)}</b>
            <small>Liter</small>
          </div>

          <div className="stat">
            <span>💶</span>
            <b>{money(totalDrinkCost)} €</b>
            <small>Getränkekosten</small>
          </div>

          <div className="stat">
            <span>👥</span>
            <b>{members.length}</b>
            <small>Teilnehmer</small>
          </div>
        </div>

        {settings.show_beer_button && (
          <section className="beerHero">
            <button
              className="beerButton"
              onClick={() => {
                const target = members.find(
                  (member) =>
                    member.profile_id !== userId
                );

                if (target) {
                  requestBeer(
                    target.profile_id
                  );
                } else {
                  setMessage(
                    "👥 Es ist noch niemand da, mit dem du ein Bier trinken kannst."
                  );
                }
              }}
            >
              <span className="beerButtonIcon">
                🍺
              </span>

              <span>
                <strong>BIER</strong>
                <small>
                  Wer trinkt ein Bier mit mir?
                </small>
              </span>
            </button>
          </section>
        )}

        {settings.show_beer_requests &&
          (myIncomingBeerRequests.length >
            0 ||
            outgoingBeerRequests.length >
              0) && (
            <section className="card">
              <div className="sectionTitle">
                <h2>🔔 Bier-Anfragen</h2>
              </div>

              {myIncomingBeerRequests.map(
                (request) => (
                  <div
                    className="request"
                    key={request.id}
                  >
                    <div>
                      <strong>
                        🍻
                        {request.requester
                          ?.name ||
                          members.find(
                            (m) =>
                              m.profile_id ===
                              request.requester_profile_id
                          )?.profile?.name ||
                          "Jemand"}{" "}
                        möchte ein Bier mit dir
                        trinken.
                      </strong>
                    </div>

                    <div className="requestButtons">
                      <button
                        className="accept"
                        onClick={() =>
                          answerBeerRequest(
                            request,
                            true
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
                            false
                          )
                        }
                      >
                        ❌ Ablehnen
                      </button>
                    </div>
                  </div>
                )
              )}

              {outgoingBeerRequests.map(
                (request) => (
                  <div
                    className="request pending"
                    key={request.id}
                  >
                    ⏳ Bier-Anfrage wartet auf
                    Antwort.
                  </div>
                )
              )}
            </section>
          )}

        {settings.show_participants && (
          <section className="card">
            <div className="sectionTitle">
              <div>
                <span className="eyebrow">
                  EVENT
                </span>
                <h2>🍻 Teilnehmer</h2>
              </div>
            </div>

            <div className="row">
              <input
                placeholder="Name"
                value={personName}
                onChange={(e) =>
                  setPersonName(e.target.value)
                }
              />

              <button
                className="primary"
                onClick={addPerson}
              >
                ➕ Hinzufügen
              </button>
            </div>

            <div className="peopleList">
              {members.map((member) => {
                const person =
                  member.profile ||
                  ({
                    id: member.profile_id,
                    name: "Unbekannt",
                  } as Profile);

                const personPoints =
                  pointsHistory
                    .filter(
                      (item) =>
                        item.profile_id ===
                        person.id
                    )
                    .reduce(
                      (sum, item) =>
                        sum +
                        Number(item.points || 0),
                      0
                    );

                const personDrinks =
                  history.filter(
                    (item) =>
                      item.profile_id ===
                      person.id
                  );

                return (
                  <div
                    className="person"
                    key={member.id || person.id}
                  >
                    <button
                      className="personMain"
                      onClick={() =>
                        setSelectedPerson(
                          person
                        )
                      }
                    >
                      <span className="avatar">
                        👤
                      </span>

                      <span className="personInfo">
                        <strong>
                          {person.name}
                        </strong>

                        <small>
                          🍺{" "}
                          {
                            personDrinks.length
                          }{" "}
                          · 💧{" "}
                          {liters(
                            personDrinks.reduce(
                              (sum, item) =>
                                sum +
                                Number(
                                  item.liters ||
                                    0
                                ),
                              0
                            )
                          )}{" "}
                          L
                        </small>
                      </span>

                      <span className="points">
                        🏆 {personPoints}
                      </span>
                    </button>

                    {settings.show_beer_button &&
                      person.id !== userId && (
                        <button
                          className="miniBeer"
                          onClick={() =>
                            requestBeer(
                              person.id
                            )
                          }
                        >
                          🍺
                        </button>
                      )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {settings.show_drinks && (
          <section className="card">
            <div className="sectionTitle">
              <h2>🍺 Getränk hinzufügen</h2>
            </div>

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
                placeholder="Liter"
                value={drinkLitersValue}
                onChange={(e) =>
                  setDrinkLitersValue(
                    e.target.value
                  )
                }
              />

              <input
                type="number"
                step="0.1"
                placeholder="Alkohol %"
                value={drinkAlcoholValue}
                onChange={(e) =>
                  setDrinkAlcoholValue(
                    e.target.value
                  )
                }
              />

              <input
                type="number"
                step="0.01"
                placeholder="Preis €"
                value={drinkPriceValue}
                onChange={(e) =>
                  setDrinkPriceValue(
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
          </section>
        )}

        {settings.show_drinks && (
          <section className="card">
            <div className="sectionTitle">
              <h2>🔗 Getränk zuordnen</h2>
            </div>

            {members.map((member) => {
              const person =
                member.profile ||
                ({
                  id: member.profile_id,
                  name: "Unbekannt",
                } as Profile);

              return (
                <div
                  className="assignment"
                  key={member.id || person.id}
                >
                  <strong>{person.name}</strong>

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
                          person.id,
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
                        {drinkTitle(drink)} ·{" "}
                        {money(
                          drinkPrice(drink)
                        )} €
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </section>
        )}

        {settings.show_drinks && (
          <section className="card">
            <div className="sectionTitle">
              <h2>🍺 Getränke</h2>
            </div>

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
                      {drinkTitle(drink)}
                    </strong>

                    <small>
                      {liters(
                        drinkLiters(drink)
                      )}{" "}
                      L ·{" "}
                      {drinkAlcohol(drink).toFixed(
                        1
                      )}{" "}
                      %
                    </small>
                  </div>

                  <b>
                    {money(
                      drinkPrice(drink)
                    )}{" "}
                    €
                  </b>
                </div>
              ))
            )}
          </section>
        )}

        {settings.show_drink_history && (
          <section className="card">
            <button
              className="sectionButton"
              onClick={() =>
                setShowHistory(!showHistory)
              }
            >
              <span>
                🕐 Getränkeverlauf
              </span>
              <span>
                {showHistory ? "▲" : "▼"}
              </span>
            </button>

            {showHistory && (
              <div className="timeline">
                {history.length === 0 ? (
                  <p className="muted">
                    Noch kein Getränkeverlauf.
                  </p>
                ) : (
                  history.map((item) => {
                    const name =
                      item.profile?.name ||
                      members.find(
                        (member) =>
                          member.profile_id ===
                          item.profile_id
                      )?.profile?.name ||
                      "Unbekannt";

                    return (
                      <div
                        className="timelineItem"
                        key={item.id}
                      >
                        <span className="timelineDot">
                          🍺
                        </span>

                        <div>
                          <strong>
                            {name}
                          </strong>

                          <p>
                            hat{" "}
                            <b>
                              {item.drink_name}
                            </b>{" "}
                            getrunken.
                          </p>

                          <small>
                            {liters(
                              item.liters
                            )}{" "}
                            L ·{" "}
                            {Number(
                              item.alcohol_percent
                            ).toFixed(1)}{" "}
                            % ·{" "}
                            {new Date(
                              item.consumed_at
                            ).toLocaleString(
                              "de-DE"
                            )}
                          </small>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>
        )}

        {settings.show_crate_button && (
          <section className="card crateCard">
            <div className="crateIcon">
              🍺
            </div>

            <div>
              <h2>🍺 Kiste Bier spendieren</h2>

              <p>
                Eine Kiste spendieren und
                <strong> +20 Punkte</strong>
                erhalten.
              </p>
            </div>

            <button
              className="crateButton"
              onClick={donateCrate}
            >
              🍺 KISTE SPENDIEREN
            </button>
          </section>
        )}

        {settings.show_payments && (
          <section className="card">
            <div className="sectionTitle">
              <h2>💶 Zahlungen</h2>
            </div>

            <div className="three paymentInputs">
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
                value={paymentPersonId}
                onChange={(e) =>
                  setPaymentPersonId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  👤 Wer bezahlt?
                </option>

                {members.map((member) => (
                  <option
                    key={member.profile_id}
                    value={member.profile_id}
                  >
                    {member.profile?.name ||
                      "Unbekannt"}
                  </option>
                ))}
              </select>

              <button
                className="primary"
                onClick={savePayment}
              >
                💶 Zahlen
              </button>
            </div>

            <div className="paymentSummary">
              <div>
                <span>
                  💰 Gesamt bezahlt
                </span>
                <strong>
                  {money(totalPaid)} €
                </strong>
              </div>

              <div>
                <span>
                  💶 Getränkekosten
                </span>
                <strong>
                  {money(totalDrinkCost)} €
                </strong>
              </div>

              <div>
                <span>💸 Offen</span>
                <strong>
                  {money(
                    Math.max(
                      totalDrinkCost -
                        totalPaid,
                      0
                    )
                  )}{" "}
                  €
                </strong>
              </div>
            </div>

            {settings.show_who_paid && (
              <div className="paymentList">
                <h3>💶 Wer hat bezahlt?</h3>

                {payments.length === 0 ? (
                  <p className="muted">
                    Noch keine Zahlungen.
                  </p>
                ) : (
                  payments.map((payment) => (
                    <div
                      className="paymentItem"
                      key={payment.id}
                    >
                      <span>
                        👤{" "}
                        {payment.payer?.name ||
                          members.find(
                            (member) =>
                              member.profile_id ===
                              payment.bezahlt_von
                          )?.profile?.name ||
                          "Unbekannt"}
                      </span>

                      <strong>
                        +{money(payment.betrag)} €
                      </strong>
                    </div>
                  ))
                )}
              </div>
            )}

            {settings.show_who_owes && (
              <div className="paymentList">
                <h3>
                  💸 Wer muss noch bezahlen?
                </h3>

                {members.map((member) => {
                  const paid = payments
                    .filter(
                      (payment) =>
                        payment.bezahlt_von ===
                        member.profile_id
                    )
                    .reduce(
                      (sum, payment) =>
                        sum +
                        Number(
                          payment.betrag || 0
                        ),
                      0
                    );

                  const fairShare =
                    members.length > 0
                      ? totalDrinkCost /
                        members.length
                      : 0;

                  const remaining =
                    Math.max(
                      fairShare - paid,
                      0
                    );

                  return (
                    <div
                      className="paymentItem"
                      key={member.profile_id}
                    >
                      <span>
                        👤{" "}
                        {member.profile?.name ||
                          "Unbekannt"}
                      </span>

                      <strong
                        className={
                          remaining > 0
                            ? "owe"
                            : "paid"
                        }
                      >
                        {remaining > 0
                          ? `${money(
                              remaining
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
            <button
              className="sectionButton"
              onClick={() =>
                setShowChallenges(
                  !showChallenges
                )
              }
            >
              <span>🎯 Challenges</span>
              <span>
                {showChallenges ? "▲" : "▼"}
              </span>
            </button>

            {showChallenges && (
              <>
                <div className="challengeCreate">
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
                    className="primary full"
                    onClick={createChallenge}
                  >
                    🎯 Challenge erstellen
                  </button>
                </div>

                {challenges.map(
                  (challenge) => (
                    <div
                      className="challenge"
                      key={challenge.id}
                    >
                      <div>
                        <span className="challengeBadge">
                          🎯
                        </span>

                        <div>
                          <strong>
                            {challenge.title}
                          </strong>

                          {challenge.description && (
                            <p>
                              {
                                challenge.description
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="challengeRight">
                        <b>
                          +{challenge.points}
                        </b>

                        {challenge.status !==
                          "completed" && (
                          <button
                            className="accept"
                            onClick={() =>
                              completeChallenge(
                                challenge
                              )
                            }
                          >
                            🏆 Erledigt
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}
              </>
            )}
          </section>
        )}

        {settings.show_ranking && (
          <section className="card">
            <button
              className="sectionButton"
              onClick={() =>
                setShowRanking(!showRanking)
              }
            >
              <span>🏆 Rangliste</span>
              <span>
                {showRanking ? "▲" : "▼"}
              </span>
            </button>

            <p className="muted">
              Tippe auf eine Person, um zu
              sehen, wofür sie Punkte bekommen
              hat.
            </p>

            {showRanking &&
              ranking.map((entry, index) => (
                <button
                  className="rank"
                  key={entry.profile.id}
                  onClick={() =>
                    setSelectedPerson(
                      entry.profile
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
                    {entry.profile.name}
                  </span>

                  <b>
                    {entry.points} Punkte
                  </b>
                </button>
              ))}
          </section>
        )}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <footer>
          <strong>
            🍻 Güstener Zapfhahn Zentrale
          </strong>

          <small>
            Dein Event. Deine Getränke.
            Deine Runde.
          </small>
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
              className="close"
              onClick={() =>
                setShowCreateEvent(false)
              }
            >
              ×
            </button>

            <h2>➕ Neues Event</h2>

            <input
              placeholder="Eventname"
              value={eventTitle}
              onChange={(e) =>
                setEventTitle(e.target.value)
              }
            />

            <input
              placeholder="Ort"
              value={eventLocation}
              onChange={(e) =>
                setEventLocation(e.target.value)
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

            <button
              className="primary full"
              onClick={createEvent}
            >
              🎉 Event erstellen
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
              className="close"
              onClick={() =>
                setShowJoinEvent(false)
              }
            >
              ×
            </button>

            <h2>🔑 Event beitreten</h2>

            <p className="muted">
              Gib den Einladungscode des
              Events ein.
            </p>

            <input
              placeholder="XXXX-XXXX"
              value={inviteCode}
              onChange={(e) =>
                setInviteCode(
                  e.target.value.toUpperCase()
                )
              }
            />

            <button
              className="primary full"
              onClick={joinEvent}
            >
              🚀 Beitreten
            </button>
          </div>
        </div>
      )}

      {selectedPerson && (
        <div
          className="modalBackdrop"
          onClick={() =>
            setSelectedPerson(null)
          }
        >
          <div
            className="modal personModal"
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

            <div className="profileHero">
              <div className="largeAvatar">
                👤
              </div>

              <h2>
                {selectedPerson.name}
              </h2>
            </div>

            <div className="personStats">
              <div>
                🏆
                <b>
                  {selectedPersonPoints.reduce(
                    (sum, item) =>
                      sum +
                      Number(item.points),
                    0
                  )}
                </b>
                <small>Punkte</small>
              </div>

              <div>
                🍺
                <b>
                  {selectedPersonHistory.length}
                </b>
                <small>Getränke</small>
              </div>

              <div>
                💧
                <b>
                  {liters(
                    selectedPersonHistory.reduce(
                      (sum, item) =>
                        sum +
                        Number(
                          item.liters || 0
                        ),
                      0
                    )
                  )}
                </b>
                <small>Liter</small>
              </div>
            </div>

            <h3>⭐ Punkte-Historie</h3>

            {selectedPersonPoints.length ===
            0 ? (
              <p className="muted">
                Noch keine Punkte.
              </p>
            ) : (
              selectedPersonPoints.map(
                (item) => (
                  <div
                    className="pointItem"
                    key={item.id}
                  >
                    <span>
                      {item.reason}
                    </span>

                    <strong>
                      +{item.points}
                    </strong>
                  </div>
                )
              )
            )}

            <h3>🍺 Getränke</h3>

            {selectedPersonHistory.length ===
            0 ? (
              <p className="muted">
                Noch keine Getränke.
              </p>
            ) : (
              selectedPersonHistory.map(
                (item) => (
                  <div
                    className="pointItem"
                    key={item.id}
                  >
                    <span>
                      🍺 {item.drink_name}
                      <small>
                        {new Date(
                          item.consumed_at
                        ).toLocaleString(
                          "de-DE"
                        )}
                      </small>
                    </span>

                    <strong>
                      {liters(
                        item.liters
                      )}{" "}
                      L
                    </strong>
                  </div>
                )
              )
            )}
          </div>
        </div>
      )}

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
  overflow-x: hidden;
}

.page {
  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(
      circle at top left,
      rgba(245,158,11,.15),
      transparent 35%
    ),
    radial-gradient(
      circle at top right,
      rgba(30,64,175,.12),
      transparent 35%
    ),
    linear-gradient(
      180deg,
      #101821 0%,
      #070b10 100%
    );
  color: #fff;
  padding: 16px;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

.container {
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0 20px;
}

.brandIcon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background:
    linear-gradient(
      145deg,
      #fbbf24,
      #d97706
    );
  font-size: 31px;
  box-shadow:
    0 10px 35px
    rgba(245,158,11,.18);
}

.brandText {
  flex: 1;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  font-size: 24px;
  margin-bottom: 4px;
}

h2 {
  font-size: 20px;
  margin-bottom: 12px;
}

h3 {
  margin-top: 20px;
}

.header p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.logout {
  border: 1px solid #263341;
  background: #151e28;
  color: white;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  cursor: pointer;
}

.card {
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.075),
      rgba(255,255,255,.035)
    );
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 22px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow:
    0 15px 45px
    rgba(0,0,0,.16);
  backdrop-filter: blur(10px);
}

.eventCard {
  border-color:
    rgba(245,158,11,.18);
}

.sectionTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.sectionTitle h2 {
  margin-bottom: 0;
}

.eyebrow {
  color: #fbbf24;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  display: block;
  margin-bottom: 4px;
}

.eventActions {
  display: flex;
  gap: 7px;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  border: none;
}

input,
select,
textarea {
  width: 100%;
  padding: 13px 14px;
  border-radius: 13px;
  border: 1px solid #2b3948;
  background: #111923;
  color: white;
  outline: none;
  margin-bottom: 9px;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #f59e0b;
  box-shadow:
    0 0 0 3px
    rgba(245,158,11,.09);
}

.primary,
.secondary,
.danger,
.accept,
.decline {
  border-radius: 13px;
  padding: 12px 15px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform .15s,
    opacity .15s;
}

.primary {
  background:
    linear-gradient(
      135deg,
      #fbbf24,
      #f59e0b
    );
  color: #111;
}

.secondary {
  background: #17212c;
  color: #fff;
  border: 1px solid #304050;
}

.danger {
  background: #451820;
  color: #fecaca;
}

.accept {
  background: #173d2a;
  color: #86efac;
}

.decline {
  background: #451820;
  color: #fca5a5;
}

button:active {
  transform: scale(.96);
}

.full {
  width: 100%;
}

.eventButtons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.inviteBox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 13px;
  background: rgba(245,158,11,.08);
  border: 1px solid rgba(245,158,11,.18);
  border-radius: 15px;
}

.inviteBox span {
  color: #aab6c3;
  font-size: 12px;
}

.inviteBox strong {
  margin-left: auto;
  color: #fbbf24;
  letter-spacing: 2px;
}

.copyButton {
  background: #263341;
  color: white;
  padding: 8px 10px;
  border-radius: 9px;
  cursor: pointer;
}

.stats {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.stat {
  background:
    rgba(255,255,255,.055);
  border:
    1px solid rgba(255,255,255,.06);
  border-radius: 17px;
  padding: 14px 9px;
  text-align: center;
}

.stat span {
  font-size: 21px;
}

.stat b {
  display: block;
  font-size: 20px;
  margin: 4px 0;
}

.stat small {
  color: #8391a1;
  font-size: 10px;
}

.beerHero {
  margin-bottom: 14px;
}

.beerButton {
  width: 100%;
  min-height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border-radius: 24px;
  cursor: pointer;
  color: white;
  background:
    linear-gradient(
      135deg,
      #991b1b,
      #dc2626,
      #991b1b
    );
  border:
    2px solid
    rgba(248,113,113,.45);
  box-shadow:
    0 12px 45px
    rgba(220,38,38,.22);
  animation:
    beerPulse 2.2s infinite;
}

.beerButtonIcon {
  font-size: 48px;
}

.beerButton strong {
  display: block;
  font-size: 30px;
  letter-spacing: 3px;
}

.beerButton small {
  display: block;
  margin-top: 3px;
  color: #fecaca;
}

@keyframes beerPulse {
  0%,100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.015);
  }
}

.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.row input {
  margin-bottom: 0;
}

.three {
  display: grid;
  grid-template-columns:
    repeat(3,1fr);
  gap: 8px;
}

.settingsGrid {
  display: grid;
  grid-template-columns:
    repeat(2,1fr);
  gap: 8px;
  margin: 14px 0;
}

.toggle {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 13px;
  border-radius: 13px;
  background: rgba(255,255,255,.045);
}

.toggle input {
  display: none;
}

.toggle i {
  width: 44px;
  height: 25px;
  border-radius: 30px;
  background: #334155;
  position: relative;
  flex-shrink: 0;
}

.toggle i::after {
  content: "";
  position: absolute;
  width: 19px;
  height: 19px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: .2s;
}

.toggle input:checked + i {
  background: #f59e0b;
}

.toggle input:checked + i::after {
  transform: translateX(19px);
}

.peopleList {
  display: grid;
  gap: 8px;
}

.person {
  display: flex;
  gap: 8px;
}

.personMain {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 13px;
  border-radius: 15px;
  color: white;
  background: rgba(255,255,255,.045);
  cursor: pointer;
  text-align: left;
}

.avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: #263341;
  border-radius: 12px;
}

.personInfo {
  flex: 1;
}

.personInfo strong,
.personInfo small {
  display: block;
}

.personInfo small {
  color: #8c99a8;
  margin-top: 4px;
}

.points {
  color: #fbbf24;
  font-weight: 900;
}

.miniBeer {
  width: 52px;
  border-radius: 15px;
  background: #451820;
  color: white;
  cursor: pointer;
}

.assignment {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.assignment select {
  margin: 0;
}

.drinkItem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 15px;
  background: rgba(255,255,255,.045);
  margin-top: 8px;
}

.drinkIcon {
  font-size: 27px;
}

.drinkInfo {
  flex: 1;
}

.drinkInfo strong,
.drinkInfo small {
  display: block;
}

.drinkInfo small {
  color: #8996a5;
  margin-top: 3px;
}

.sectionButton {
  width: 100%;
  display: flex;
  justify-content: space-between;
  background: transparent;
  color: white;
  font-size: 19px;
  font-weight: 900;
  padding: 0;
  cursor: pointer;
}

.timeline {
  margin-top: 18px;
}

.timelineItem {
  display: flex;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid #202c38;
}

.timelineDot {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: #1d2935;
  border-radius: 12px;
}

.timelineItem p {
  margin: 5px 0;
  color: #b6c0cb;
}

.timelineItem small {
  color: #718091;
}

.crateCard {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: center;
  border-color:
    rgba(251,191,36,.2);
}

.crateIcon {
  font-size: 46px;
}

.crateCard p {
  color: #94a3b8;
  margin: 0;
}

.crateCard p strong {
  color: #fbbf24;
}

.crateButton {
  grid-column: 1 / -1;
  width: 100%;
  padding: 15px;
  border-radius: 15px;
  background:
    linear-gradient(
      135deg,
      #fbbf24,
      #d97706
    );
  color: #111;
  font-weight: 900;
  cursor: pointer;
  box-shadow:
    0 10px 30px
    rgba(245,158,11,.18);
}

.paymentSummary {
  display: grid;
  grid-template-columns:
    repeat(3,1fr);
  gap: 8px;
  margin-top: 12px;
}

.paymentSummary div {
  padding: 13px;
  border-radius: 14px;
  background: rgba(255,255,255,.045);
}

.paymentSummary span,
.paymentSummary strong {
  display: block;
}

.paymentSummary span {
  color: #8794a3;
  font-size: 11px;
}

.paymentSummary strong {
  margin-top: 5px;
  font-size: 18px;
}

.paymentList {
  margin-top: 18px;
}

.paymentItem {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  background: rgba(255,255,255,.045);
  border-radius: 13px;
  margin-top: 7px;
}

.paymentItem strong {
  color: #86efac;
}

.paymentItem .owe {
  color: #fca5a5;
}

.paymentItem .paid {
  color: #86efac;
}

.challengeCreate {
  margin-top: 16px;
  padding-bottom: 10px;
}

.challenge {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 13px;
  border-radius: 15px;
  background: rgba(255,255,255,.045);
  margin-top: 8px;
}

.challenge > div:first-child {
  display: flex;
  gap: 10px;
  align-items: center;
}

.challengeBadge {
  font-size: 28px;
}

.challenge p {
  color: #8996a5;
  margin: 5px 0 0;
}

.challengeRight {
  text-align: right;
}

.challengeRight b {
  display: block;
  color: #fbbf24;
  margin-bottom: 6px;
}

.rank {
  width: 100%;
  display: grid;
  grid-template-columns:
    42px 1fr auto;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(255,255,255,.045);
  color: white;
  text-align: left;
  cursor: pointer;
}

.rank b {
  color: #fbbf24;
}

.request {
  padding: 14px;
  border-radius: 15px;
  background: rgba(245,158,11,.08);
  border: 1px solid rgba(245,158,11,.12);
  margin-top: 8px;
}

.request.pending {
  color: #fbbf24;
}

.requestButtons {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.message {
  position: sticky;
  bottom: 15px;
  z-index: 20;
  padding: 14px;
  background: #151f2b;
  border: 1px solid #344454;
  border-radius: 14px;
  color: #fbbf24;
  box-shadow:
    0 15px 40px
    rgba(0,0,0,.25);
}

.muted {
  color: #8b98a8;
}

footer {
  text-align: center;
  padding: 30px 10px;
  color: #687686;
}

footer strong,
footer small {
  display: block;
}

footer small {
  margin-top: 5px;
}

.modalBackdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background:
    rgba(0,0,0,.75);
  display: grid;
  place-items: center;
  padding: 18px;
  backdrop-filter: blur(8px);
}

.modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
  position: relative;
  background: #101821;
  border: 1px solid #2d3b49;
  border-radius: 24px;
  padding: 22px;
  box-shadow:
    0 25px 100px
    rgba(0,0,0,.5);
}

.close {
  position: absolute;
  top: 13px;
  right: 13px;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #222d39;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.profileHero {
  text-align: center;
  padding: 10px 0 20px;
}

.largeAvatar {
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  margin: 0 auto 10px;
  border-radius: 23px;
  background:
    linear-gradient(
      145deg,
      #fbbf24,
      #d97706
    );
  font-size: 38px;
}

.personStats {
  display: grid;
  grid-template-columns:
    repeat(3,1fr);
  gap: 8px;
  margin-bottom: 18px;
}

.personStats div {
  padding: 12px;
  border-radius: 13px;
  background: rgba(255,255,255,.05);
  text-align: center;
}

.personStats b,
.personStats small {
  display: block;
}

.personStats b {
  font-size: 18px;
  margin: 4px 0;
}

.personStats small {
  color: #8290a0;
}

.pointItem {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 11px;
  background: rgba(255,255,255,.045);
  border-radius: 12px;
  margin-top: 7px;
}

.pointItem strong {
  color: #fbbf24;
}

.pointItem small {
  display: block;
  color: #718091;
  margin-top: 3px;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 15px;
}

.tab {
  padding: 12px;
  border-radius: 12px;
  background: #18232e;
  color: #94a3b8;
  cursor: pointer;
}

.tab.active {
  background: #f59e0b;
  color: #111;
  font-weight: 900;
}

.authShell {
  width: 100%;
  max-width: 470px;
  margin: 0 auto;
  padding-top: 8vh;
  text-align: center;
}

.authLogo {
  width: 85px;
  height: 85px;
  display: grid;
  place-items: center;
  margin: 0 auto 20px;
  border-radius: 27px;
  background:
    linear-gradient(
      145deg,
      #fbbf24,
      #d97706
    );
  font-size: 45px;
  box-shadow:
    0 20px 60px
    rgba(245,158,11,.2);
}

.authShell h1 {
  font-size: 27px;
}

.authShell > p {
  color: #8b98a8;
}

.authCard {
  margin-top: 25px;
  padding: 20px;
  border-radius: 23px;
  background:
    rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  text-align: left;
}

.bigButton {
  min-height: 52px;
  font-size: 16px;
}

.animation {
  position: fixed;
  inset: 0;
  z-index: 999;
  pointer-events: none;
  display: grid;
  place-items: center;
  background:
    rgba(0,0,0,.28);
  backdrop-filter: blur(3px);
}

.clink {
  font-size: 90px;
  animation:
    clink 1.5s ease-out;
}

.prost {
  position: absolute;
  font-size: 48px;
  font-weight: 1000;
  letter-spacing: 5px;
  color: #fbbf24;
  text-shadow:
    0 5px 25px
    rgba(0,0,0,.7);
  animation:
    prost 1.8s ease-out;
}

@keyframes clink {
  0% {
    transform:
      scale(.2)
      rotate(-25deg);
    opacity: 0;
  }

  45% {
    transform:
      scale(1.15)
      rotate(8deg);
    opacity: 1;
  }

  70% {
    transform:
      scale(.95)
      rotate(-5deg);
  }

  100% {
    transform:
      scale(1)
      rotate(0);
    opacity: 0;
  }
}

@keyframes prost {
  0% {
    transform:
      translateY(70px)
      scale(.5);
    opacity: 0;
  }

  30% {
    transform:
      translateY(0)
      scale(1.15);
    opacity: 1;
  }

  75% {
    transform:
      translateY(-10px)
      scale(1);
    opacity: 1;
  }

  100% {
    transform:
      translateY(-80px)
      scale(1.15);
    opacity: 0;
  }
}

.moneyRain {
  width: 100%;
  text-align: center;
  font-size: 55px;
  line-height: 1.6;
  animation:
    money 2.2s ease-out;
}

@keyframes money {
  0% {
    transform:
      translateY(-45vh)
      rotate(-10deg);
    opacity: 0;
  }

  25% {
    opacity: 1;
  }

  100% {
    transform:
      translateY(45vh)
      rotate(10deg);
    opacity: 0;
  }
}

.crateAnimation {
  font-size: 100px;
  animation:
    crate 2.2s ease-out;
}

@keyframes crate {
  0% {
    transform:
      scale(.2)
      rotate(-20deg);
    opacity: 0;
  }

  35% {
    transform:
      scale(1.2)
      rotate(10deg);
    opacity: 1;
  }

  100% {
    transform:
      scale(.8)
      rotate(0);
    opacity: 0;
  }
}

@media(max-width:650px) {
  .page {
    padding:
      10px;
  }

  .header {
    padding-top: 4px;
  }

  h1 {
    font-size: 19px;
  }

  .brandIcon {
    width: 48px;
    height: 48px;
    border-radius: 15px;
    font-size: 25px;
  }

  .stats {
    grid-template-columns:
      repeat(2,1fr);
  }

  .eventButtons {
    grid-template-columns: 1fr;
  }

  .row,
  .three {
    grid-template-columns: 1fr;
  }

  .row input {
    margin-bottom: 0;
  }

  .assignment {
    grid-template-columns: 1fr;
  }

  .settingsGrid {
    grid-template-columns: 1fr;
  }

  .paymentSummary {
    grid-template-columns: 1fr;
  }

  .crateCard {
    grid-template-columns:
      auto 1fr;
  }

  .beerButtonIcon {
    font-size: 38px;
  }

  .beerButton strong {
    font-size: 25px;
  }

  .beerButton small {
    font-size: 11px;
  }

  .prost {
    font-size: 34px;
  }
}
`;
