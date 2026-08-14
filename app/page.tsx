"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
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
  show_costs?: boolean | null;
};

type Profile = {
  id: string;
  user_id?: string | null;
  username: string;
  points: number;
  drinks_count: number;
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
  gewicht_kg?: number | null;
  alter?: number | null;
  geschlecht?: string | null;
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
  paid_by?: string | null;
  promille_wert?: number | null;
};

type Payment = {
  id: string;
  event_id: string;
  betrag: number;
  created_at?: string | null;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string | null;
};

type Challenge = {
  id: string;
  title: string;
  description?: string | null;
  points?: number | null;
  created_at?: string | null;
  event_id?: string | null;
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
};

type ChallengeTemplate = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  default_points?: number | null;
  requires_vote?: boolean | null;
  minimum_votes?: number | null;
  is_active?: boolean | null;
};

type ChallengeVote = {
  id: string;
  challenge_id: string;
  voter_profile_id: string;
  target_profile_id?: string | null;
  vote: string;
  comment?: string | null;
};

type ChallengeParticipant = {
  id: string;
  challenge_id: string;
  profile_id: string;
  accepted?: boolean;
  completed?: boolean;
  points_awarded?: number;
};

type RankingTitle = {
  id: string;
  min_points: number;
  title: string;
  emoji?: string | null;
  description?: string | null;
};

type Toast = {
  text: string;
  type: "success" | "error" | "info";
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Abstimmung: "🗳️",
  Duell: "⚔️",
  Geschicklichkeit: "🎯",
  Kreativ: "🎨",
  Lustig: "😂",
  Mutprobe: "😈",
  Party: "🎉",
  Quatsch: "🤪",
  "Schnell & Einfach": "⚡",
  Team: "👥",
  Trinken: "🍺",
  Wissen: "🧠",
  Zufall: "🎲",
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [templates, setTemplates] = useState<ChallengeTemplate[]>([]);
  const [rankingTitles, setRankingTitles] = useState<RankingTitle[]>([]);
  const [challengeParticipants, setChallengeParticipants] =
    useState<ChallengeParticipant[]>([]);
  const [challengeVotes, setChallengeVotes] =
    useState<ChallengeVote[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeSection, setActiveSection] = useState<
    "home" | "drinks" | "challenges" | "ranking"
  >("home");

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddDrink, setShowAddDrink] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);

  const [animation, setAnimation] = useState<
    "none" | "prost" | "money"
  >("none");

  /* ============================================================
     EVENT FORM
     ============================================================ */

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");

  /* ============================================================
     PERSON FORM
     ============================================================ */

  const [personName, setPersonName] = useState("");
  const [personWeight, setPersonWeight] = useState("");
  const [personHeight, setPersonHeight] = useState("");
  const [personAge, setPersonAge] = useState("");
  const [personGender, setPersonGender] = useState("m");

  /* ============================================================
     DRINK FORM
     ============================================================ */

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] = useState("Bier");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  /* ============================================================
     PAYMENT FORM
     ============================================================ */

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPerson, setPaymentPerson] = useState("");

  /* ============================================================
     CHALLENGE FORM
     ============================================================ */

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeCategory, setChallengeCategory] =
    useState("Quatsch");
  const [challengePoints, setChallengePoints] = useState("10");
  const [challengeAssigned, setChallengeAssigned] = useState("");
  const [challengeRequiresVote, setChallengeRequiresVote] =
    useState(false);
  const [challengeRequiredVotes, setChallengeRequiredVotes] =
    useState("1");

  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    loadEverything();
  }, []);

  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (animation === "none") return;

    const timer = setTimeout(() => {
      setAnimation("none");
    }, 2500);

    return () => clearTimeout(timer);
  }, [animation]);

  /* ============================================================
     HELPERS
     ============================================================ */

  function notify(
    text: string,
    type: Toast["type"] = "success"
  ) {
    setToast({ text, type });
  }

  function triggerProst() {
    setAnimation("prost");
  }

  function triggerMoney() {
    setAnimation("money");
  }

  function getDrinkName(drink: Drink) {
    return (
      drink.drink_name ||
      drink.getraenk ||
      "Getränk"
    );
  }

  function getDrinkLiters(drink: Drink) {
    return Number(
      drink.liters ??
        drink.menge ??
        0
    );
  }

  function getDrinkAlcohol(drink: Drink) {
    return Number(
      drink.alcohol_percent ??
        drink.alkohol ??
        0
    );
  }

  function getDrinkPrice(drink: Drink) {
    return Number(
      drink.preis ??
        0
    );
  }

  function getProfileName(profileId?: string | null) {
    if (!profileId) return "Unbekannt";

    const profile = profiles.find(
      (p) => p.id === profileId
    );

    return profile?.username || "Unbekannt";
  }

  function getRankingTitle(points: number) {
    if (rankingTitles.length === 0) {
      if (points >= 100) {
        return {
          title: "🍻 Zapfhahn-Legende",
          description: "Du bist offiziell nicht mehr aufzuhalten.",
        };
      }

      if (points >= 50) {
        return {
          title: "🔥 Party-Profi",
          description: "Du bist gefährlich gut dabei.",
        };
      }

      if (points >= 25) {
        return {
          title: "😎 Feierbiest",
          description: "Die Party läuft bei dir.",
        };
      }

      if (points >= 10) {
        return {
          title: "🍺 Zapfhahn-Lehrling",
          description: "Der Anfang einer großen Karriere.",
        };
      }

      return {
        title: "🐣 Frischling",
        description: "Noch ist alles möglich.",
      };
    }

    const sorted = [...rankingTitles].sort(
      (a, b) => b.min_points - a.min_points
    );

    const title =
      sorted.find(
        (item) => points >= item.min_points
      ) || sorted[sorted.length - 1];

    return {
      title: `${title.emoji || "🏆"} ${title.title}`,
      description:
        title.description ||
        "Weiter so!",
    };
  }

  /* ============================================================
     LOAD EVERYTHING
     ============================================================ */

  async function loadEverything() {
    setLoading(true);

    try {
      await Promise.all([
        loadEvents(),
        loadTemplates(),
        loadRankingTitles(),
      ]);
    } finally {
      setLoading(false);
    }
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
        "Events konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    const eventData = data || [];

    setEvents(eventData);

    if (
      !eventId &&
      eventData.length > 0
    ) {
      setEventId(eventData[0].id);
    }
  }

  async function loadEventData(id: string) {
    setLoading(true);

    try {
      await Promise.all([
        loadProfiles(id),
        loadDrinks(id),
        loadPayments(id),
        loadChallenges(id),
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfiles(id: string) {
    const { data, error } = await supabase
      .from("event_members")
      .select(`
        profile_id,
        profiles (
          id,
          user_id,
          username,
          points,
          drinks_count,
          weight_kg,
          height_cm,
          age,
          gender,
          gewicht_kg,
          alter,
          geschlecht
        )
      `)
      .eq("event_id", id);

    if (error) {
      /*
       * Fallback, falls die Relation nicht automatisch
       * aufgelöst werden kann.
       */

      const { data: directProfiles } =
        await supabase
          .from("profiles")
          .select("*")
          .order("username");

      if (!error && directProfiles) {
        setProfiles(directProfiles);
      }

      return;
    }

    const result: Profile[] = [];

    for (const row of data || []) {
      const profileData = row.profiles;

      if (
        profileData &&
        !Array.isArray(profileData)
      ) {
        result.push(profileData as Profile);
      }
    }

    setProfiles(result);
  }

  async function loadDrinks(id: string) {
    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      notify(
        "Getränke konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    setDrinks(data || []);
  }

  async function loadPayments(id: string) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      notify(
        "Zahlungen konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    setPayments(data || []);
  }

  async function loadChallenges(id: string) {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      notify(
        "Challenges konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    const challengeData = data || [];

    setChallenges(challengeData);

    if (challengeData.length === 0) {
      setChallengeParticipants([]);
      setChallengeVotes([]);
      return;
    }

    const challengeIds =
      challengeData.map(
        (challenge) => challenge.id
      );

    const [
      participantResult,
      voteResult,
    ] = await Promise.all([
      supabase
        .from("challenge_participants")
        .select("*")
        .in(
          "challenge_id",
          challengeIds
        ),

      supabase
        .from("challenge_votes")
        .select("*")
        .in(
          "challenge_id",
          challengeIds
        ),
    ]);

    if (
      !participantResult.error
    ) {
      setChallengeParticipants(
        participantResult.data || []
      );
    }

    if (!voteResult.error) {
      setChallengeVotes(
        voteResult.data || []
      );
    }
  }

  async function loadTemplates() {
    const { data } = await supabase
      .from("challenge_templates")
      .select("*")
      .eq("is_active", true)
      .order("title");

    setTemplates(data || []);
  }

  async function loadRankingTitles() {
    const { data } = await supabase
      .from("ranking_titles")
      .select("*")
      .order("min_points");

    setRankingTitles(data || []);
  }

  /* ============================================================
     CREATE EVENT
     ============================================================ */

  async function createEvent() {
    if (!eventTitle.trim()) {
      notify(
        "Bitte einen Eventnamen eingeben.",
        "error"
      );
      return;
    }

    const inviteCode =
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const { data, error } =
      await supabase
        .from("events")
        .insert({
          title: eventTitle.trim(),
          description:
            eventDescription.trim() || null,
          location:
            eventLocation.trim() || null,
          invite_code: inviteCode,
          start_date:
            eventStart || null,
          end_date:
            eventEnd || null,
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
          team_mode: false,
          show_photos: true,
          show_costs: true,
          privacy_mode: false,
        })
        .select()
        .single();

    if (error) {
      notify(
        "Event konnte nicht erstellt werden: " +
          error.message,
        "error"
      );
      return;
    }

    if (data) {
      setEvents((old) => [
        data,
        ...old,
      ]);

      setEventId(data.id);
    }

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setEventStart("");
    setEventEnd("");

    setShowCreateEvent(false);

    notify(
      "🎉 Event erfolgreich erstellt!"
    );
  }

  /* ============================================================
     DELETE EVENT
     ============================================================ */

  async function deleteEvent() {
    if (!eventId) return;

    const event = events.find(
      (item) => item.id === eventId
    );

    if (!event) return;

    const confirmed =
      window.confirm(
        `Event "${event.title}" wirklich löschen?`
      );

    if (!confirmed) return;

    const { error } =
      await supabase
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

    const remaining =
      events.filter(
        (item) => item.id !== eventId
      );

    setEvents(remaining);

    if (remaining.length > 0) {
      setEventId(remaining[0].id);
    } else {
      setEventId("");
      setProfiles([]);
      setDrinks([]);
      setPayments([]);
      setChallenges([]);
    }

    notify(
      "🗑️ Event gelöscht."
    );
  }

  /* ============================================================
     ADD PERSON
     ============================================================ */

  async function addPerson() {
    if (!eventId) {
      notify(
        "Bitte zuerst ein Event auswählen.",
        "error"
      );
      return;
    }

    if (!personName.trim()) {
      notify(
        "Bitte einen Namen eingeben.",
        "error"
      );
      return;
    }

    const duplicate =
      profiles.some(
        (profile) =>
          profile.username
            .toLowerCase()
            ===
          personName
            .trim()
            .toLowerCase()
      );

    if (duplicate) {
      notify(
        "Teilnehmer ist bereits vorhanden.",
        "error"
      );
      return;
    }

    const { data: profile, error } =
      await supabase
        .from("profiles")
        .insert({
          username:
            personName.trim(),
          points: 0,
          drinks_count: 0,
          weight_kg:
            personWeight
              ? Number(personWeight)
              : null,
          height_cm:
            personHeight
              ? Number(personHeight)
              : null,
          age:
            personAge
              ? Number(personAge)
              : null,
          gender:
            personGender,
        })
        .select()
        .single();

    if (error) {
      notify(
        "Teilnehmer konnte nicht erstellt werden: " +
          error.message,
        "error"
      );
      return;
    }

    if (!profile) {
      notify(
        "Teilnehmer konnte nicht erstellt werden.",
        "error"
      );
      return;
    }

    const {
      error: memberError,
    } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        profile_id: profile.id,
        joined_at: new Date().toISOString(),
        gender_factor:
          personGender === "w"
            ? 0.55
            : 0.68,
        joined_via_code:
          null,
      });

    if (memberError) {
      notify(
        "Teilnehmer konnte nicht hinzugefügt werden: " +
          memberError.message,
        "error"
      );

      await supabase
        .from("profiles")
        .delete()
        .eq("id", profile.id);

      return;
    }

    setProfiles((old) => [
      ...old,
      profile,
    ]);

    setPersonName("");
    setPersonWeight("");
    setPersonHeight("");
    setPersonAge("");
    setPersonGender("m");

    setShowAddPerson(false);

    notify(
      `👤 ${profile.username} wurde hinzugefügt.`
    );
  }

  /* ============================================================
     DELETE PERSON
     ============================================================ */

  async function removePerson(
    profileId: string
  ) {
    if (!eventId) return;

    const profile =
      profiles.find(
        (item) => item.id === profileId
      );

    if (!profile) return;

    const confirmed =
      window.confirm(
        `${profile.username} wirklich aus dem Event entfernen?`
      );

    if (!confirmed) return;

    const {
      error: memberError,
    } = await supabase
      .from("event_members")
      .delete()
      .eq("event_id", eventId)
      .eq("profile_id", profileId);

    if (memberError) {
      notify(
        "Teilnehmer konnte nicht entfernt werden: " +
          memberError.message,
        "error"
      );
      return;
    }

    setProfiles((old) =>
      old.filter(
        (item) => item.id !== profileId
      )
    );

    notify(
      "👋 Teilnehmer entfernt."
    );
  }

  /* ============================================================
     ADD DRINK
     ============================================================ */

  async function saveDrink() {
    if (!eventId) {
      notify(
        "Bitte zuerst ein Event auswählen.",
        "error"
      );
      return;
    }

    if (!drinkName.trim()) {
      notify(
        "Bitte ein Getränk eingeben.",
        "error"
      );
      return;
    }

    const liters =
      Number(drinkLiters) || 0;

    const alcohol =
      Number(drinkAlcohol) || 0;

    const price =
      Number(drinkPrice) || 0;

    const { data, error } =
      await supabase
        .from("drinks")
        .insert({
          event_id: eventId,
          category: drinkCategory,
          drink_name:
            drinkName.trim(),
          brand:
            drinkBrand.trim() || null,
          liters,
          alcohol_percent:
            alcohol,
          quantity: 1,
          marke:
            drinkBrand.trim() || null,
          getraenk:
            drinkName.trim(),
          menge: liters,
          alkohol: alcohol,
          preis: price,
          promille_wert: 0,
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

    if (data) {
      setDrinks((old) => [
        data,
        ...old,
      ]);
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkCategory("Bier");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");

    setShowAddDrink(false);

    triggerProst();

    notify(
      "🍺 Getränk gespeichert – PROST!"
    );
  }

  /* ============================================================
     ASSIGN DRINK
     ============================================================ */

  async function assignDrink(
    drink: Drink,
    profileId: string
  ) {
    const profile =
      profiles.find(
        (item) => item.id === profileId
      );

    if (!profile) return;

    const liters =
      getDrinkLiters(drink);

    const alcohol =
      getDrinkAlcohol(drink);

    const weight =
      Number(
        profile.weight_kg ??
          profile.gewicht_kg ??
          80
      ) || 80;

    const gender =
      profile.gender ??
      profile.geschlecht ??
      "m";

    const factor =
      gender === "w"
        ? 0.55
        : 0.68;

    /*
     * Vereinfachte Widmark-Schätzung.
     * Nicht als medizinisch/verkehrsrechtlich
     * verbindlicher Wert verwenden.
     */

    const alcoholGrams =
      liters *
      (alcohol / 100) *
      789;

    const estimatedPromille =
      alcoholGrams /
      (weight * factor);

    const newPromille =
      Math.max(
        0,
        estimatedPromille
      );

    const { error: drinkError } =
      await supabase
        .from("drinks")
        .update({
          profile_id: profileId,
          promille_wert:
            newPromille,
        })
        .eq("id", drink.id);

    if (drinkError) {
      notify(
        "Getränk konnte nicht zugeordnet werden: " +
          drinkError.message,
        "error"
      );
      return;
    }

    const newPoints =
      Number(profile.points || 0) +
      10;

    const newDrinkCount =
      Number(
        profile.drinks_count || 0
      ) + 1;

    const { data: updatedProfile } =
      await supabase
        .from("profiles")
        .update({
          points: newPoints,
          drinks_count:
            newDrinkCount,
        })
        .eq("id", profileId)
        .select()
        .single();

    if (updatedProfile) {
      setProfiles((old) =>
        old.map((item) =>
          item.id === profileId
            ? updatedProfile
            : item
        )
      );
    }

    setDrinks((old) =>
      old.map((item) =>
        item.id === drink.id
          ? {
              ...item,
              profile_id:
                profileId,
              promille_wert:
                newPromille,
            }
          : item
      )
    );

    triggerProst();

    notify(
      `🍻 ${profile.username} trinkt ${getDrinkName(
        drink
      )}! +10 Punkte`
    );
  }

  /* ============================================================
     PAYMENT
     ============================================================ */

  async function savePayment() {
    if (!eventId) {
      notify(
        "Bitte zuerst ein Event auswählen.",
        "error"
      );
      return;
    }

    const amount =
      Number(paymentAmount);

    if (
      !amount ||
      amount <= 0
    ) {
      notify(
        "Bitte einen gültigen Betrag eingeben.",
        "error"
      );
      return;
    }

    const { data, error } =
      await supabase
        .from("payments")
        .insert({
          event_id: eventId,
          betrag: amount,
          profile_id:
            paymentPerson || null,
          bezahlt_von:
            paymentPerson || null,
          status: "paid",
        })
        .select()
        .single();

    if (error) {
      notify(
        "Zahlung konnte nicht gespeichert werden: " +
          error.message,
        "error"
      );
      return;
    }

    if (data) {
      setPayments((old) => [
        data,
        ...old,
      ]);
    }

    setPaymentAmount("");
    setPaymentPerson("");
    setShowPayment(false);

    triggerMoney();

    notify(
      `💸 ${amount.toFixed(
        2
      )} € bezahlt! Geldregen!`
    );
  }

  /* ============================================================
     CREATE CHALLENGE
     ============================================================ */

  async function createChallenge() {
    if (!eventId) {
      notify(
        "Bitte zuerst ein Event auswählen.",
        "error"
      );
      return;
    }

    if (!challengeTitle.trim()) {
      notify(
        "Bitte einen Challenge-Titel eingeben.",
        "error"
      );
      return;
    }

    const points =
      Number(challengePoints) || 10;

    const requiredVotes =
      Number(
        challengeRequiredVotes
      ) || 1;

    const { data, error } =
      await supabase
        .from("challenges")
        .insert({
          event_id: eventId,
          title:
            challengeTitle.trim(),
          description:
            challengeDescription.trim() ||
            null,
          points,
          category:
            challengeCategory,
          status:
            "open",
          assigned_profile_id:
            challengeAssigned || null,
          required_votes:
            requiredVotes,
          is_active: true,
        })
        .select()
        .single();

    if (error) {
      notify(
        "Challenge konnte nicht erstellt werden: " +
          error.message,
        "error"
      );
      return;
    }

    if (!data) return;

    setChallenges((old) => [
      data,
      ...old,
    ]);

    /*
     * Wenn direkt ein Teilnehmer ausgewählt wurde,
     * wird er automatisch Teilnehmer der Challenge.
     */

    if (challengeAssigned) {
      await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: data.id,
          profile_id:
            challengeAssigned,
          accepted: true,
          completed: false,
          points_awarded: 0,
        });
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengeCategory("Quatsch");
    setChallengePoints("10");
    setChallengeAssigned("");
    setChallengeRequiresVote(false);
    setChallengeRequiredVotes("1");

    setShowChallenge(false);

    notify(
      "🎯 Challenge erstellt!"
    );
  }

  /* ============================================================
     JOIN CHALLENGE
     ============================================================ */

  async function joinChallenge(
    challenge: Challenge,
    profileId: string
  ) {
    const exists =
      challengeParticipants.some(
        (item) =>
          item.challenge_id ===
            challenge.id &&
          item.profile_id ===
            profileId
      );

    if (exists) {
      notify(
        "Teilnehmer ist bereits dabei.",
        "info"
      );
      return;
    }

    const { data, error } =
      await supabase
        .from("challenge_participants")
        .insert({
          challenge_id:
            challenge.id,
          profile_id:
            profileId,
          accepted: true,
          completed: false,
          points_awarded: 0,
        })
        .select()
        .single();

    if (error) {
      notify(
        "Teilnehmer konnte der Challenge nicht beitreten: " +
          error.message,
        "error"
      );
      return;
    }

    if (data) {
      setChallengeParticipants(
        (old) => [
          ...old,
          data,
        ]
      );
    }

    notify(
      `🎯 ${getProfileName(
        profileId
      )} ist dabei!`
    );
  }

  /* ============================================================
     VOTE
     ============================================================ */

  async function voteForChallenge(
    challenge: Challenge,
    voterProfileId: string,
    targetProfileId: string,
    vote: "yes" | "no"
  ) {
    const existing =
      challengeVotes.find(
        (item) =>
          item.challenge_id ===
            challenge.id &&
          item.voter_profile_id ===
            voterProfileId
      );

    if (existing) {
      notify(
        "Du hast bereits abgestimmt.",
        "info"
      );
      return;
    }

    const { data, error } =
      await supabase
        .from("challenge_votes")
        .insert({
          challenge_id:
            challenge.id,
          voter_profile_id:
            voterProfileId,
          target_profile_id:
            targetProfileId,
          vote,
          comment: null,
        })
        .select()
        .single();

    if (error) {
      notify(
        "Abstimmung konnte nicht gespeichert werden: " +
          error.message,
        "error"
      );
      return;
    }

    if (data) {
      setChallengeVotes((old) => [
        ...old,
        data,
      ]);
    }

    notify(
      vote === "yes"
        ? "🗳️ JA! Abstimmung gespeichert."
        : "🗳️ NEIN! Abstimmung gespeichert."
    );
  }

  /* ============================================================
     COMPLETE CHALLENGE
     ============================================================ */

  async function completeChallenge(
    challenge: Challenge,
    winnerProfileId: string
  ) {
    const points =
      Number(
        challenge.points || 0
      );

    const { error: challengeError } =
      await supabase
        .from("challenges")
        .update({
          status:
            "completed",
          winner_profile_id:
            winnerProfileId,
          completed_at:
            new Date().toISOString(),
          is_active: false,
        })
        .eq("id", challenge.id);

    if (challengeError) {
      notify(
        "Challenge konnte nicht abgeschlossen werden: " +
          challengeError.message,
        "error"
      );
      return;
    }

    const { error: resultError } =
      await supabase
        .from("challenge_results")
        .insert({
          challenge_id:
            challenge.id,
          profile_id:
            winnerProfileId,
          place: 1,
          points,
          result_type:
            "winner",
        });

    if (resultError) {
      notify(
        "Challenge-Ergebnis konnte nicht gespeichert werden: " +
          resultError.message,
        "error"
      );
      return;
    }

    /*
     * Punkte zum Teilnehmerprofil addieren.
     */

    const winner =
      profiles.find(
        (item) =>
          item.id ===
          winnerProfileId
      );

    if (winner) {
      const newPoints =
        Number(winner.points || 0) +
        points;

      const { data: updated } =
        await supabase
          .from("profiles")
          .update({
            points:
              newPoints,
          })
          .eq(
            "id",
            winnerProfileId
          )
          .select()
          .single();

      if (updated) {
        setProfiles((old) =>
          old.map((item) =>
            item.id ===
            winnerProfileId
              ? updated
              : item
          )
        );
      }
    }

    setChallenges((old) =>
      old.map((item) =>
        item.id === challenge.id
          ? {
              ...item,
              status:
                "completed",
              winner_profile_id:
                winnerProfileId,
              completed_at:
                new Date().toISOString(),
              is_active: false,
            }
          : item
      )
    );

    notify(
      `🏆 ${getProfileName(
        winnerProfileId
      )} gewinnt +${points} Punkte!`
    );
  }

  /* ============================================================
     DELETE CHALLENGE
     ============================================================ */

  async function deleteChallenge(
    challengeId: string
  ) {
    const confirmed =
      window.confirm(
        "Challenge wirklich löschen?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("challenges")
        .delete()
        .eq(
          "id",
          challengeId
        );

    if (error) {
      notify(
        "Challenge konnte nicht gelöscht werden: " +
          error.message,
        "error"
      );
      return;
    }

    setChallenges((old) =>
      old.filter(
        (item) =>
          item.id !== challengeId
      )
    );

    notify(
      "🗑️ Challenge gelöscht."
    );
  }

  /* ============================================================
     TEMPLATE
     ============================================================ */

  function useTemplate(
    template: ChallengeTemplate
  ) {
    setChallengeTitle(
      template.title
    );

    setChallengeDescription(
      template.description ||
        ""
    );

    setChallengeCategory(
      template.category ||
        "Quatsch"
    );

    setChallengePoints(
      String(
        template.default_points ||
          10
      )
    );

    setChallengeRequiresVote(
      Boolean(
        template.requires_vote
      )
    );

    setChallengeRequiredVotes(
      String(
        template.minimum_votes ||
          1
      )
    );

    setShowChallenge(true);
  }

  /* ============================================================
     CALCULATIONS
     ============================================================ */

  const totalLiters =
    drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkLiters(
          drink
        ) *
          Number(
            drink.quantity || 1
          ),
      0
    );

  const totalDrinkCost =
    drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkPrice(
          drink
        ) *
          Number(
            drink.quantity || 1
          ),
      0
    );

  const totalPayments =
    payments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.betrag || 0
        ),
      0
    );

  const totalPoints =
    profiles.reduce(
      (sum, profile) =>
        sum +
        Number(
          profile.points || 0
        ),
      0
    );

  const costPerPerson =
    profiles.length > 0
      ? totalDrinkCost /
        profiles.length
      : 0;

  const ranking =
    [...profiles].sort(
      (a, b) =>
        Number(b.points || 0) -
        Number(a.points || 0)
    );

  const selectedEvent =
    events.find(
      (event) =>
        event.id === eventId
    );

  const activeChallenges =
    challenges.filter(
      (challenge) =>
        challenge.status !==
        "completed"
    );

  const completedChallenges =
    challenges.filter(
      (challenge) =>
        challenge.status ===
        "completed"
    );

  /* ============================================================
     RENDER
     ============================================================ */

  if (loading && events.length === 0) {
    return (
      <main className="page loadingPage">
        <div className="loader">
          🍻
        </div>

        <h1>
          Güstener Zapfhahn Zentrale
        </h1>

        <p>
          Die Party wird vorbereitet...
        </p>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      {/* ========================================================
          ANIMATIONS
          ======================================================== */}

      {animation === "prost" && (
        <div className="animationOverlay">
          <div className="beerAnimation">
            <div className="beerGlass left">
              🍺
            </div>

            <div className="clink">
              ✨
            </div>

            <div className="beerGlass right">
              🍺
            </div>
          </div>

          <div className="prostText">
            PROST!
          </div>

          <div className="confetti">
            🍻 🎉 🍺 ✨ 🥳 🍻 🎉
          </div>
        </div>
      )}

      {animation === "money" && (
        <div className="animationOverlay moneyOverlay">
          <div className="moneyText">
            💸 ZAHLUNG!
          </div>

          <div className="moneyRain">
            {Array.from(
              { length: 28 }
            ).map(
              (_, index) => (
                <span
                  key={index}
                  style={{
                    left:
                      `${(
                        Math.random() *
                        100
                      ).toFixed(0)}%`,
                    animationDelay:
                      `${(
                        Math.random() *
                        1.2
                      ).toFixed(2)}s`,
                  }}
                >
                  💶
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          HEADER
          ======================================================== */}

      <header className="header">
        <div className="brandIcon">
          🍻
        </div>

        <div className="brandText">
          <h1>
            Güstener
            <span>
              Zapfhahn
            </span>
            Zentrale
          </h1>

          <p>
            Dein Event. Deine Runde.
            Dein Wahnsinn.
          </p>
        </div>
      </header>

      {/* ========================================================
          EVENT SELECT
          ======================================================== */}

      <section className="eventHero">
        <div>
          <span className="eyebrow">
            📅 AKTUELLES EVENT
          </span>

          <h2>
            {selectedEvent?.title ||
              "Noch kein Event"}
          </h2>

          {selectedEvent?.location && (
            <p>
              📍{" "}
              {selectedEvent.location}
            </p>
          )}
        </div>

        <div className="eventActions">
          <button
            className="primaryButton"
            onClick={() =>
              setShowCreateEvent(true)
            }
          >
            ➕ Event
          </button>

          {eventId && (
            <button
              className="dangerButton"
              onClick={deleteEvent}
            >
              🗑️
            </button>
          )}
        </div>

        <select
          className="eventSelect"
          value={eventId}
          onChange={(e) =>
            setEventId(
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
      </section>

      {/* ========================================================
          NAVIGATION
          ======================================================== */}

      <nav className="nav">
        <button
          className={
            activeSection === "home"
              ? "navActive"
              : ""
          }
          onClick={() =>
            setActiveSection("home")
          }
        >
          🏠
          <span>
            Übersicht
          </span>
        </button>

        <button
          className={
            activeSection ===
            "drinks"
              ? "navActive"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "drinks"
            )
          }
        >
          🍺
          <span>
            Getränke
          </span>
        </button>

        <button
          className={
            activeSection ===
            "challenges"
              ? "navActive"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "challenges"
            )
          }
        >
          🎯
          <span>
            Challenges
          </span>
        </button>

        <button
          className={
            activeSection ===
            "ranking"
              ? "navActive"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "ranking"
            )
          }
        >
          🏆
          <span>
            Ranking
          </span>
        </button>
      </nav>

      {/* ========================================================
          STATS
          ======================================================== */}

      <section className="statsGrid">
        <div className="statCard">
          <span>🍺</span>
          <strong>
            {drinks.length}
          </strong>
          <small>
            Getränke
          </small>
        </div>

        <div className="statCard">
          <span>💧</span>
          <strong>
            {totalLiters.toFixed(1)}
          </strong>
          <small>
            Liter
          </small>
        </div>

        <div className="statCard">
          <span>👥</span>
          <strong>
            {profiles.length}
          </strong>
          <small>
            Teilnehmer
          </small>
        </div>

        <div className="statCard">
          <span>🏆</span>
          <strong>
            {totalPoints}
          </strong>
          <small>
            Punkte
          </small>
        </div>
      </section>

      {/* ========================================================
          HOME
          ======================================================== */}

      {activeSection === "home" && (
        <>
          {/* PARTICIPANTS */}

          <section className="card">
            <div className="sectionHeader">
              <div>
                <span className="sectionEmoji">
                  👥
                </span>

                <div>
                  <h2>
                    Unsere Runde
                  </h2>

                  <p>
                    Wer ist heute dabei?
                  </p>
                </div>
              </div>

              <button
                className="primaryButton"
                onClick={() =>
                  setShowAddPerson(
                    true
                  )
                }
              >
                ➕
              </button>
            </div>

            {profiles.length ===
            0 ? (
              <div className="empty">
                <div>
                  👻
                </div>

                <strong>
                  Noch niemand da
                </strong>

                <span>
                  Füge die ersten
                  Teilnehmer hinzu.
                </span>
              </div>
            ) : (
              <div className="peopleGrid">
                {profiles.map(
                  (
                    profile,
                    index
                  ) => {
                    const title =
                      getRankingTitle(
                        Number(
                          profile.points ||
                            0
                        )
                      );

                    return (
                      <div
                        className="personCard"
                        key={
                          profile.id
                        }
                      >
                        <div className="personTop">
                          <div className="avatar">
                            {index ===
                            0
                              ? "👑"
                              : "👤"}
                          </div>

                          <button
                            className="miniDelete"
                            onClick={() =>
                              removePerson(
                                profile.id
                              )
                            }
                          >
                            ×
                          </button>
                        </div>

                        <h3>
                          {
                            profile.username
                          }
                        </h3>

                        <div className="rankTitle">
                          {
                            title.title
                          }
                        </div>

                        <div className="personStats">
                          <span>
                            🏆{" "}
                            {
                              profile.points
                            }
                          </span>

                          <span>
                            🍺{" "}
                            {
                              profile.drinks_count
                            }
                          </span>
                        </div>

                        <small className="rankDescription">
                          {
                            title.description
                          }
                        </small>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* QUICK ACTIONS */}

          <section className="quickGrid">
            <button
              className="quickButton beerQuick"
              onClick={() =>
                setShowAddDrink(
                  true
                )
              }
            >
              <span>
                🍺
              </span>

              <strong>
                Getränk
              </strong>

              <small>
                hinzufügen
              </small>
            </button>

            <button
              className="quickButton challengeQuick"
              onClick={() =>
                setShowChallenge(
                  true
                )
              }
            >
              <span>
                🎯
              </span>

              <strong>
                Challenge
              </strong>

              <small>
                starten
              </small>
            </button>

            <button
              className="quickButton moneyQuick"
              onClick={() =>
                setShowPayment(
                  true
                )
              }
            >
              <span>
                💶
              </span>

              <strong>
                Zahlung
              </strong>

              <small>
                eintragen
              </small>
            </button>
          </section>

          {/* COST */}

          <section className="card costCard">
            <div className="sectionHeader">
              <div>
                <span className="sectionEmoji">
                  💶
                </span>

                <div>
                  <h2>
                    Kassenstand
                  </h2>

                  <p>
                    Wer hat was bezahlt?
                  </p>
                </div>
              </div>
            </div>

            <div className="moneyBig">
              {totalDrinkCost.toFixed(
                2
              )} €
            </div>

            <div className="costRows">
              <div>
                <span>
                  Getränke
                </span>

                <strong>
                  {totalDrinkCost.toFixed(
                    2
                  )} €
                </strong>
              </div>

              <div>
                <span>
                  Zahlungen
                </span>

                <strong>
                  {totalPayments.toFixed(
                    2
                  )} €
                </strong>
              </div>

              <div>
                <span>
                  Pro Person
                </span>

                <strong>
                  {costPerPerson.toFixed(
                    2
                  )} €
                </strong>
              </div>
            </div>
          </section>

          {/* CHALLENGE PREVIEW */}

          <section className="card">
            <div className="sectionHeader">
              <div>
                <span className="sectionEmoji">
                  🎯
                </span>

                <div>
                  <h2>
                    Aktuelle Challenges
                  </h2>

                  <p>
                    Wer traut sich?
                  </p>
                </div>
              </div>

              <button
                className="secondaryButton"
                onClick={() =>
                  setActiveSection(
                    "challenges"
                  )
                }
              >
                Alle
              </button>
            </div>

            {activeChallenges
              .slice(0, 3)
              .map(
                (challenge) => (
                  <div
                    className="challengeMini"
                    key={
                      challenge.id
                    }
                  >
                    <div className="challengeIcon">
                      {CATEGORY_EMOJIS[
                        challenge.category ||
                          ""
                      ] ||
                        "🎯"}
                    </div>

                    <div>
                      <strong>
                        {
                          challenge.title
                        }
                      </strong>

                      <small>
                        +
                        {
                          challenge.points
                        }{" "}
                        Punkte
                      </small>
                    </div>
                  </div>
                )
              )}

            {activeChallenges.length ===
              0 && (
              <div className="emptySmall">
                🎯 Noch keine
                Challenge.
              </div>
            )}
          </section>
        </>
      )}

      {/* ========================================================
          DRINKS
          ======================================================== */}

      {activeSection ===
        "drinks" && (
        <>
          <section className="card">
            <div className="sectionHeader">
              <div>
                <span className="sectionEmoji">
                  🍺
                </span>

                <div>
                  <h2>
                    Getränke
                  </h2>

                  <p>
                    Alles was heute
                    getrunken wurde.
                  </p>
                </div>
              </div>

              <button
                className="primaryButton"
                onClick={() =>
                  setShowAddDrink(
                    true
                  )
                }
              >
                ➕
              </button>
            </div>

            {drinks.length ===
            0 ? (
              <div className="empty">
                🍺
                <strong>
                  Noch nichts
                  getrunken?
                </strong>
                <span>
                  Das können wir ändern.
                </span>
              </div>
            ) : (
              <div className="drinkList">
                {drinks.map(
                  (drink) => (
                    <div
                      className="drinkItem"
                      key={
                        drink.id
                      }
                    >
                      <div className="drinkIcon">
                        🍺
                      </div>

                      <div className="drinkInfo">
                        <strong>
                          {
                            getDrinkName(
                              drink
                            )
                          }
                        </strong>

                        <small>
                          {drink.brand ||
                            drink.marke ||
                            "Standard"}
                          {" · "}
                          {getDrinkLiters(
                            drink
                          ).toFixed(
                            1
                          )}{" "}
                          L ·{" "}
                          {getDrinkAlcohol(
                            drink
                          ).toFixed(
                            1
                          )} %
                        </small>

                        {drink.profile_id && (
                          <small className="assigned">
                            👤{" "}
                            {getProfileName(
                              drink.profile_id
                            )}
                          </small>
                        )}
                      </div>

                      <div className="drinkRight">
                        <strong>
                          {getDrinkPrice(
                            drink
                          ).toFixed(
                            2
                          )} €
                        </strong>

                        <select
                          value={
                            drink.profile_id ||
                            ""
                          }
                          onChange={(
                            e
                          ) => {
                            if (
                              e
                                .target
                                .value
                            ) {
                              assignDrink(
                                drink,
                                e
                                  .target
                                  .value
                              );
                            }
                          }}
                        >
                          <option value="">
                            Zuordnen
                          </option>

                          {profiles.map(
                            (
                              profile
                            ) => (
                              <option
                                key={
                                  profile.id
                                }
                                value={
                                  profile.id
                                }
                              >
                                {
                                  profile.username
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          <section className="card">
            <h2>
              📊 Getränke-Statistik
            </h2>

            <div className="statsLarge">
              <div>
                <strong>
                  {drinks.length}
                </strong>
                <span>
                  Getränke
                </span>
              </div>

              <div>
                <strong>
                  {totalLiters.toFixed(
                    1
                  )}
                </strong>
                <span>
                  Liter
                </span>
              </div>

              <div>
                <strong>
                  {totalDrinkCost.toFixed(
                    2
                  )} €
                </strong>
                <span>
                  Kosten
                </span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ========================================================
          CHALLENGES
          ======================================================== */}

      {activeSection ===
        "challenges" && (
        <>
          <section className="challengeHero">
            <div>
              <span>
                🎯 PARTY-MODUS
              </span>

              <h2>
                Wer macht's?
              </h2>

              <p>
                Herausforderungen,
                Abstimmungen und
                Punkte.
              </p>
            </div>

            <button
              className="primaryButton"
              onClick={() =>
                setShowChallenge(
                  true
                )
              }
            >
              ➕ Challenge
            </button>
          </section>

          {/* TEMPLATES */}

          <section className="card">
            <div className="sectionHeader">
              <div>
                <span className="sectionEmoji">
                  🎲
                </span>

                <div>
                  <h2>
                    Ideen
                  </h2>

                  <p>
                    Eine Aufgabe
                    aussuchen.
                  </p>
                </div>
              </div>
            </div>

            <div className="templateGrid">
              {templates
                .slice(0, 12)
                .map(
                  (template) => (
                    <button
                      className="template"
                      key={
                        template.id
                      }
                      onClick={() =>
                        useTemplate(
                          template
                        )
                      }
                    >
                      <span>
                        {CATEGORY_EMOJIS[
                          template.category ||
                            ""
                        ] ||
                          "🎯"}
                      </span>

                      <strong>
                        {
                          template.title
                        }
                      </strong>

                      <small>
                        +
                        {
                          template.default_points
                        }{" "}
                        Punkte
                      </small>
                    </button>
                  )
                )}
            </div>
          </section>

          {/* ACTIVE */}

          <section className="card">
            <div className="sectionHeader">
              <div>
                <span className="sectionEmoji">
                  🔥
                </span>

                <div>
                  <h2>
                    Laufende
                    Challenges
                  </h2>

                  <p>
                    Jetzt wird's
                    interessant.
                  </p>
                </div>
              </div>
            </div>

            {activeChallenges.length ===
            0 ? (
              <div className="empty">
                🎯
                <strong>
                  Keine laufenden
                  Challenges
                </strong>
                <span>
                  Starte eine!
                </span>
              </div>
            ) : (
              <div className="challengeList">
                {activeChallenges.map(
                  (challenge) => {
                    const participants =
                      challengeParticipants.filter(
                        (item) =>
                          item.challenge_id ===
                          challenge.id
                      );

                    const votes =
                      challengeVotes.filter(
                        (item) =>
                          item.challenge_id ===
                          challenge.id
                      );

                    return (
                      <div
                        className="challengeCard"
                        key={
                          challenge.id
                        }
                      >
                        <div className="challengeCardTop">
                          <div className="bigChallengeEmoji">
                            {CATEGORY_EMOJIS[
                              challenge.category ||
                                ""
                            ] ||
                              "🎯"}
                          </div>

                          <div>
                            <span className="categoryBadge">
                              {
                                challenge.category
                              }
                            </span>

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

                          <button
                            className="miniDelete"
                            onClick={() =>
                              deleteChallenge(
                                challenge.id
                              )
                            }
                          >
                            ×
                          </button>
                        </div>

                        <div className="challengePoints">
                          🏆{" "}
                          <strong>
                            +
                            {
                              challenge.points
                            }
                          </strong>{" "}
                          Punkte
                        </div>

                        {/* PARTICIPANTS */}

                        <div className="challengeSection">
                          <strong>
                            👥 Teilnehmer
                          </strong>

                          <div className="challengePeople">
                            {profiles.map(
                              (
                                profile
                              ) => {
                                const joined =
                                  participants.some(
                                    (
                                      participant
                                    ) =>
                                      participant.profile_id ===
                                      profile.id
                                  );

                                return (
                                  <button
                                    key={
                                      profile.id
                                    }
                                    className={
                                      joined
                                        ? "challengePerson joined"
                                        : "challengePerson"
                                    }
                                    onClick={() =>
                                      joinChallenge(
                                        challenge,
                                        profile.id
                                      )
                                    }
                                  >
                                    {joined
                                      ? "✅"
                                      : "➕"}{" "}
                                    {
                                      profile.username
                                    }
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {/* VOTING */}

                        {participants.length >
                          0 && (
                          <div className="challengeSection">
                            <strong>
                              🗳️ Abstimmung
                            </strong>

                            <div className="voteInfo">
                              {
                                votes.length
                              }{" "}
                              /{" "}
                              {
                                challenge.required_votes
                              }{" "}
                              Stimmen
                            </div>

                            <div className="voteGrid">
                              {participants.map(
                                (
                                  participant
                                ) => {
                                  const alreadyVoted =
                                    challengeVotes.some(
                                      (
                                        vote
                                      ) =>
                                        vote.challenge_id ===
                                          challenge.id &&
                                        vote.voter_profile_id ===
                                          participant.profile_id
                                    );

                                  return (
                                    <div
                                      className="voteRow"
                                      key={
                                        participant.id
                                      }
                                    >
                                      <span>
                                        {
                                          getProfileName(
                                            participant.profile_id
                                          )
                                        }
                                      </span>

                                      {!alreadyVoted &&
                                        profiles.length >
                                          1 && (
                                          <div className="voteButtons">
                                            {profiles
                                              .filter(
                                                (
                                                  target
                                                ) =>
                                                  target.id !==
                                                  participant.profile_id
                                              )
                                              .map(
                                                (
                                                  target
                                                ) => (
                                                  <button
                                                    key={
                                                      target.id
                                                    }
                                                    onClick={() =>
                                                      voteForChallenge(
                                                        challenge,
                                                        participant.profile_id,
                                                        target.id,
                                                        "yes"
                                                      )
                                                    }
                                                  >
                                                    👍{" "}
                                                    {
                                                      target.username
                                                    }
                                                  </button>
                                                )
                                              )}
                                          </div>
                                        )}

                                      {alreadyVoted && (
                                        <span className="voted">
                                          ✅ abgestimmt
                                        </span>
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                        {/* WINNER */}

                        {participants.length >
                          0 && (
                          <div className="challengeSection">
                            <strong>
                              🏆 Gewinner
                            </strong>

                            <select
                              onChange={(
                                e
                              ) => {
                                if (
                                  e
                                    .target
                                    .value
                                ) {
                                  completeChallenge(
                                    challenge,
                                    e
                                      .target
                                      .value
                                  );
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="">
                                Gewinner auswählen
                              </option>

                              {participants.map(
                                (
                                  participant
                                ) => (
                                  <option
                                    key={
                                      participant.profile_id
                                    }
                                    value={
                                      participant.profile_id
                                    }
                                  >
                                    {
                                      getProfileName(
                                        participant.profile_id
                                      )
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* COMPLETED */}

          {completedChallenges.length >
            0 && (
            <section className="card">
              <h2>
                🏆 Erledigte
                Challenges
              </h2>

              {completedChallenges.map(
                (challenge) => (
                  <div
                    className="completedChallenge"
                    key={
                      challenge.id
                    }
                  >
                    <span>
                      🏆
                    </span>

                    <div>
                      <strong>
                        {
                          challenge.title
                        }
                      </strong>

                      <small>
                        Gewinner:{" "}
                        {
                          getProfileName(
                            challenge.winner_profile_id
                          )
                        }
                      </small>
                    </div>

                    <b>
                      +
                      {
                        challenge.points
                      }
                    </b>
                  </div>
                )
              )}
            </section>
          )}
        </>
      )}

      {/* ========================================================
          RANKING
          ======================================================== */}

      {activeSection ===
        "ranking" && (
        <>
          <section className="rankingHero">
            <span>
              🏆
            </span>

            <h2>
              Die Besten der
              Runde
            </h2>

            <p>
              Ruhm. Ehre. Punkte.
              Und ein bisschen
              Quatsch.
            </p>
          </section>

          <section className="card">
            {ranking.length ===
            0 ? (
              <div className="empty">
                🏆
                <strong>
                  Noch kein Ranking
                </strong>
                <span>
                  Erst Teilnehmer
                  hinzufügen.
                </span>
              </div>
            ) : (
              <div className="rankingList">
                {ranking.map(
                  (
                    profile,
                    index
                  ) => {
                    const title =
                      getRankingTitle(
                        Number(
                          profile.points ||
                            0
                        )
                      );

                    return (
                      <div
                        className={
                          index ===
                          0
                            ? "rankItem first"
                            : "rankItem"
                        }
                        key={
                          profile.id
                        }
                      >
                        <div className="rankNumber">
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
                        </div>

                        <div className="rankAvatar">
                          👤
                        </div>

                        <div className="rankPerson">
                          <strong>
                            {
                              profile.username
                            }
                          </strong>

                          <span>
                            {
                              title.title
                            }
                          </span>
                        </div>

                        <div className="rankPoints">
                          <strong>
                            {
                              profile.points
                            }
                          </strong>

                          <small>
                            Punkte
                          </small>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* ========================================================
          FOOTER
          ======================================================== */}

      <footer>
        <div>
          🍻
        </div>

        <strong>
          Güstener Zapfhahn
          Zentrale
        </strong>

        <small>
          Dein Event. Deine
          Getränke. Deine Runde.
        </small>
      </footer>

      {/* ========================================================
          CREATE EVENT MODAL
          ======================================================== */}

      {showCreateEvent && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="modalClose"
              onClick={() =>
                setShowCreateEvent(
                  false
                )
              }
            >
              ×
            </button>

            <div className="modalEmoji">
              📅
            </div>

            <h2>
              Neues Event
            </h2>

            <p>
              Wie heißt die nächste
              Eskalation?
            </p>

            <input
              placeholder="Eventname"
              value={eventTitle}
              onChange={(e) =>
                setEventTitle(
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

            <textarea
              placeholder="Beschreibung"
              value={
                eventDescription
              }
              onChange={(e) =>
                setEventDescription(
                  e.target.value
                )
              }
            />

            <div className="twoInputs">
              <input
                type="date"
                value={eventStart}
                onChange={(e) =>
                  setEventStart(
                    e.target.value
                  )
                }
              />

              <input
                type="date"
                value={eventEnd}
                onChange={(e) =>
                  setEventEnd(
                    e.target.value
                  )
                }
              />
            </div>

            <button
              className="modalPrimary"
              onClick={createEvent}
            >
              🎉 Event erstellen
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD PERSON MODAL
          ======================================================== */}

      {showAddPerson && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="modalClose"
              onClick={() =>
                setShowAddPerson(
                  false
                )
              }
            >
              ×
            </button>

            <div className="modalEmoji">
              👤
            </div>

            <h2>
              Teilnehmer
              hinzufügen
            </h2>

            <p>
              Damit wir wissen, wer
              heute dabei ist.
            </p>

            <input
              placeholder="Name"
              value={personName}
              onChange={(e) =>
                setPersonName(
                  e.target.value
                )
              }
            />

            <div className="twoInputs">
              <input
                type="number"
                placeholder="Gewicht kg"
                value={
                  personWeight
                }
                onChange={(e) =>
                  setPersonWeight(
                    e.target.value
                  )
                }
              />

              <input
                type="number"
                placeholder="Größe cm"
                value={
                  personHeight
                }
                onChange={(e) =>
                  setPersonHeight(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="twoInputs">
              <input
                type="number"
                placeholder="Alter"
                value={
                  personAge
                }
                onChange={(e) =>
                  setPersonAge(
                    e.target.value
                  )
                }
              />

              <select
                value={
                  personGender
                }
                onChange={(e) =>
                  setPersonGender(
                    e.target.value
                  )
                }
              >
                <option value="m">
                  👨 Männlich
                </option>

                <option value="w">
                  👩 Weiblich
                </option>
              </select>
            </div>

            <button
              className="modalPrimary"
              onClick={addPerson}
            >
              ➕ Teilnehmer
              hinzufügen
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD DRINK MODAL
          ======================================================== */}

      {showAddDrink && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="modalClose"
              onClick={() =>
                setShowAddDrink(
                  false
                )
              }
            >
              ×
            </button>

            <div className="modalEmoji">
              🍺
            </div>

            <h2>
              Getränk hinzufügen
            </h2>

            <p>
              Und jetzt wird
              angestoßen.
            </p>

            <input
              placeholder="Getränk"
              value={
                drinkName
              }
              onChange={(e) =>
                setDrinkName(
                  e.target.value
                )
              }
            />

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

            <select
              value={
                drinkCategory
              }
              onChange={(e) =>
                setDrinkCategory(
                  e.target.value
                )
              }
            >
              <option>
                Bier
              </option>

              <option>
                Wein
              </option>

              <option>
                Sekt
              </option>

              <option>
                Longdrink
              </option>

              <option>
                Shot
              </option>

              <option>
                Cocktail
              </option>

              <option>
                Alkoholfrei
              </option>

              <option>
                Sonstiges
              </option>
            </select>

            <div className="threeInputs">
              <input
                type="number"
                step="0.1"
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
                step="0.1"
                placeholder="%"
                value={
                  drinkAlcohol
                }
                onChange={(e) =>
                  setDrinkAlcohol(
                    e.target.value
                  )
                }
              />

              <input
                type="number"
                step="0.01"
                placeholder="€"
                value={
                  drinkPrice
                }
                onChange={(e) =>
                  setDrinkPrice(
                    e.target.value
                  )
                }
              />
            </div>

            <button
              className="modalPrimary"
              onClick={saveDrink}
            >
              🍻 Speichern &
              PROST!
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PAYMENT MODAL
          ======================================================== */}

      {showPayment && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="modalClose"
              onClick={() =>
                setShowPayment(
                  false
                )
              }
            >
              ×
            </button>

            <div className="modalEmoji">
              💶
            </div>

            <h2>
              Zahlung
            </h2>

            <p>
              Wer hat die Rechnung
              bezahlt?
            </p>

            <input
              type="number"
              step="0.01"
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
                Person auswählen
              </option>

              {profiles.map(
                (profile) => (
                  <option
                    key={
                      profile.id
                    }
                    value={
                      profile.id
                    }
                  >
                    {
                      profile.username
                    }
                  </option>
                )
              )}
            </select>

            <button
              className="modalPrimary"
              onClick={
                savePayment
              }
            >
              💸 Zahlung speichern
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          CHALLENGE MODAL
          ======================================================== */}

      {showChallenge && (
        <div className="modalBackdrop">
          <div className="modal challengeModal">
            <button
              className="modalClose"
              onClick={() =>
                setShowChallenge(
                  false
                )
              }
            >
              ×
            </button>

            <div className="modalEmoji">
              🎯
            </div>

            <h2>
              Neue Challenge
            </h2>

            <p>
              Wer wird heute zur
              Legende?
            </p>

            <input
              placeholder="Titel der Challenge"
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
              placeholder="Was muss gemacht werden?"
              value={
                challengeDescription
              }
              onChange={(e) =>
                setChallengeDescription(
                  e.target.value
                )
              }
            />

            <select
              value={
                challengeCategory
              }
              onChange={(e) =>
                setChallengeCategory(
                  e.target.value
                )
              }
            >
              {Object.keys(
                CATEGORY_EMOJIS
              ).map(
                (category) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {
                      CATEGORY_EMOJIS[
                        category
                      ]
                    }{" "}
                    {category}
                  </option>
                )
              )}
            </select>

            <div className="twoInputs">
              <input
                type="number"
                min="1"
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

              <input
                type="number"
                min="1"
                placeholder="Stimmen"
                value={
                  challengeRequiredVotes
                }
                onChange={(e) =>
                  setChallengeRequiredVotes(
                    e.target.value
                  )
                }
              />
            </div>

            <select
              value={
                challengeAssigned
              }
              onChange={(e) =>
                setChallengeAssigned(
                  e.target.value
                )
              }
            >
              <option value="">
                👥 Jeder kann mitmachen
              </option>

              {profiles.map(
                (profile) => (
                  <option
                    key={
                      profile.id
                    }
                    value={
                      profile.id
                    }
                  >
                    {
                      profile.username
                    }
                  </option>
                )
              )}
            </select>

            <label className="checkboxRow">
              <input
                type="checkbox"
                checked={
                  challengeRequiresVote
                }
                onChange={(e) =>
                  setChallengeRequiresVote(
                    e.target.checked
                  )
                }
              />

              <span>
                🗳️ Gruppe muss
                abstimmen
              </span>
            </label>

            <button
              className="modalPrimary"
              onClick={
                createChallenge
              }
            >
              🚀 Challenge
              starten
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TOAST
          ======================================================== */}

      {toast && (
        <div
          className={`toast ${toast.type}`}
        >
          {toast.text}
        </div>
      )}

      <style jsx>{styles}</style>
    </main>
  );
}

/* ================================================================
   STYLES
   ================================================================ */

const styles = `
  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #080b12;
  }

  body {
    overflow-x: hidden;
  }

  .page {
    min-height: 100vh;
    width: 100%;
    margin: 0;
    padding: 18px;
    color: #ffffff;
    background:
      radial-gradient(
        circle at 50% -10%,
        #344c68 0%,
        #151c27 30%,
        #080b12 70%
      );
    font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .loadingPage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .loader {
    font-size: 70px;
    animation: bounce 1s infinite;
  }

  .container {
    width: 100%;
  }

  .header {
    width: 100%;
    max-width: 1050px;
    margin: 0 auto 18px;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .brandIcon {
    width: 62px;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: linear-gradient(
      145deg,
      #fbbf24,
      #f97316
    );
    font-size: 34px;
    box-shadow:
      0 12px 35px
      rgba(245, 158, 11, .25);
    transform: rotate(-5deg);
  }

  .brandText h1 {
    margin: 0;
    font-size: clamp(
      22px,
      4vw,
      34px
    );
    line-height: 1;
    font-weight: 900;
    letter-spacing: -1.5px;
  }

  .brandText h1 span {
    color: #fbbf24;
    margin-left: 6px;
  }

  .brandText p {
    margin: 7px 0 0;
    color: #8e9bad;
    font-size: 13px;
  }

  .eventHero {
    position: relative;
    max-width: 1050px;
    margin: 0 auto 16px;
    padding: 22px;
    border-radius: 25px;
    border: 1px solid rgba(
      255,
      255,
      255,
      .08
    );
    background:
      linear-gradient(
        135deg,
        rgba(255,255,255,.08),
        rgba(255,255,255,.025)
      );
    backdrop-filter: blur(18px);
    box-shadow:
      0 20px 50px
      rgba(0,0,0,.25);
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1.5px;
    color: #fbbf24;
  }

  .eventHero h2 {
    margin: 6px 0 4px;
    font-size: clamp(
      24px,
      5vw,
      36px
    );
  }

  .eventHero p {
    margin: 0;
    color: #9aa6b5;
  }

  .eventActions {
    position: absolute;
    right: 20px;
    top: 20px;
    display: flex;
    gap: 7px;
  }

  .eventSelect {
    margin-top: 18px;
  }

  .nav {
    max-width: 1050px;
    margin: 0 auto 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 7px;
    border-radius: 19px;
    background: rgba(
      255,
      255,
      255,
      .045
    );
    border: 1px solid rgba(
      255,
      255,
      255,
      .07
    );
  }

  .nav button {
    border: 0;
    border-radius: 14px;
    padding: 10px 6px;
    background: transparent;
    color: #8e9bad;
    cursor: pointer;
    font-size: 20px;
    transition: .2s;
  }

  .nav button span {
    display: block;
    margin-top: 2px;
    font-size: 10px;
    font-weight: 800;
  }

  .nav button:hover,
  .nav .navActive {
    color: white;
    background: rgba(
      255,
      255,
      255,
      .09
    );
    transform: translateY(-1px);
  }

  .statsGrid {
    max-width: 1050px;
    margin: 0 auto 16px;
    display: grid;
    grid-template-columns: repeat(
      4,
      1fr
    );
    gap: 10px;
  }

  .statCard {
    padding: 16px 10px;
    border-radius: 19px;
    text-align: center;
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.075),
        rgba(255,255,255,.035)
      );
    border: 1px solid rgba(
      255,
      255,
      255,
      .06
    );
  }

  .statCard span {
    display: block;
    font-size: 23px;
  }

  .statCard strong {
    display: block;
    margin-top: 3px;
    font-size: 23px;
    font-weight: 900;
  }

  .statCard small {
    display: block;
    color: #7e8998;
    margin-top: 3px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .5px;
  }

  .card {
    max-width: 1050px;
    margin: 0 auto 16px;
    padding: 21px;
    border-radius: 24px;
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.07),
        rgba(255,255,255,.035)
      );
    border: 1px solid rgba(
      255,
      255,
      255,
      .075
    );
    backdrop-filter: blur(15px);
    box-shadow:
      0 18px 45px
      rgba(0,0,0,.18);
  }

  .sectionHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .sectionHeader > div:first-child {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sectionEmoji {
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 15px;
    background: rgba(
      251,
      191,
      36,
      .12
    );
    font-size: 24px;
  }

  h2 {
    margin: 0;
    font-size: 21px;
    font-weight: 900;
  }

  .sectionHeader p {
    margin: 3px 0 0;
    color: #8490a0;
    font-size: 12px;
  }

  .primaryButton,
  .secondaryButton,
  .dangerButton,
  button {
    font-family: inherit;
  }

  .primaryButton {
    border: 0;
    border-radius: 13px;
    padding: 11px 15px;
    background: linear-gradient(
      135deg,
      #fbbf24,
      #f97316
    );
    color: #11151c;
    font-weight: 900;
    cursor: pointer;
    box-shadow:
      0 8px 20px
      rgba(245,158,11,.18);
  }

  .secondaryButton {
    border: 1px solid rgba(
      255,
      255,
      255,
      .09
    );
    background: rgba(
      255,
      255,
      255,
      .06
    );
    color: white;
    padding: 9px 13px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 800;
  }

  .dangerButton {
    border: 0;
    background: rgba(
      239,
      68,
      68,
      .15
    );
    color: #ff8d8d;
    border-radius: 12px;
    padding: 11px;
    cursor: pointer;
  }

  .peopleGrid {
    display: grid;
    grid-template-columns: repeat(
      auto-fit,
      minmax(180px, 1fr)
    );
    gap: 10px;
  }

  .personCard {
    padding: 15px;
    border-radius: 18px;
    background: rgba(
      255,
      255,
      255,
      .045
    );
    border: 1px solid rgba(
      255,
      255,
      255,
      .06
    );
  }

  .personTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .avatar {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 13px;
    background: rgba(
      251,
      191,
      36,
      .13
    );
    font-size: 22px;
  }

  .personCard h3 {
    margin: 11px 0 5px;
    font-size: 17px;
  }

  .rankTitle {
    color: #fbbf24;
    font-size: 11px;
    font-weight: 900;
  }

  .personStats {
    display: flex;
    gap: 7px;
    margin-top: 11px;
  }

  .personStats span {
    padding: 5px 8px;
    border-radius: 9px;
    background: rgba(
      255,
      255,
      255,
      .05
    );
    color: #bdc6d2;
    font-size: 11px;
  }

  .rankDescription {
    display: block;
    margin-top: 8px;
    color: #6f7c8d;
    font-size: 10px;
  }

  .miniDelete {
    border: 0;
    background: transparent;
    color: #657181;
    font-size: 21px;
    cursor: pointer;
    padding: 2px 5px;
  }

  .quickGrid {
    max-width: 1050px;
    margin: 0 auto 16px;
    display: grid;
    grid-template-columns: repeat(
      3,
      1fr
    );
    gap: 10px;
  }

  .quickButton {
    border: 1px solid rgba(
      255,
      255,
      255,
      .08
    );
    border-radius: 20px;
    padding: 18px 12px;
    color: white;
    cursor: pointer;
    text-align: center;
    transition: .2s;
  }

  .quickButton:hover {
    transform: translateY(-3px);
  }

  .quickButton span {
    display: block;
    font-size: 31px;
    margin-bottom: 5px;
  }

  .quickButton strong {
    display: block;
    font-size: 14px;
  }

  .quickButton small {
    display: block;
    margin-top: 3px;
    color: #8995a5;
    font-size: 10px;
  }

  .beerQuick {
    background:
      linear-gradient(
        135deg,
        rgba(245,158,11,.15),
        rgba(245,158,11,.035)
      );
  }

  .challengeQuick {
    background:
      linear-gradient(
        135deg,
        rgba(168,85,247,.15),
        rgba(168,85,247,.035)
      );
  }

  .moneyQuick {
    background:
      linear-gradient(
        135deg,
        rgba(34,197,94,.13),
        rgba(34,197,94,.035)
      );
  }

  .costCard {
    text-align: center;
  }

  .moneyBig {
    margin: 8px 0 15px;
    font-size: 42px;
    font-weight: 950;
    color: #fbbf24;
  }

  .costRows {
    display: grid;
    gap: 7px;
  }

  .costRows div {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    border-radius: 12px;
    background: rgba(
      255,
      255,
      255,
      .045
    );
  }

  .costRows span {
    color: #8995a4;
  }

  .costRows strong {
    color: white;
  }

  .challengeMini {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    margin-top: 8px;
    border-radius: 14px;
    background: rgba(
      255,
      255,
      255,
      .045
    );
  }

  .challengeIcon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(
      168,
      85,
      247,
      .14
    );
    font-size: 21px;
  }

  .challengeMini strong,
  .challengeMini small {
    display: block;
  }

  .challengeMini small {
    margin-top: 3px;
    color: #fbbf24;
    font-size: 10px;
  }

  .empty {
    min-height: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    color: #718095;
    text-align: center;
  }

  .empty > div,
  .empty > svg {
    font-size: 45px;
    margin-bottom: 4px;
  }

  .empty strong {
    color: #c4ccd6;
  }

  .empty span {
    font-size: 11px;
  }

  .emptySmall {
    padding: 20px;
    text-align: center;
    color: #778496;
  }

  .drinkList {
    display: grid;
    gap: 8px;
  }

  .drinkItem {
    display: grid;
    grid-template-columns: 48px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 13px;
    border-radius: 16px;
    background: rgba(
      255,
      255,
      255,
      .045
    );
  }

  .drinkIcon {
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 13px;
    background: rgba(
      251,
      191,
      36,
      .12
    );
    font-size: 24px;
  }

  .drinkInfo strong,
  .drinkInfo small {
    display: block;
  }

  .drinkInfo small {
    margin-top: 4px;
    color: #808c9c;
    font-size: 10px;
  }

  .drinkInfo .assigned {
    color: #fbbf24;
  }

  .drinkRight {
    text-align: right;
  }

  .drinkRight > strong {
    display: block;
    color: #fbbf24;
  }

  .drinkRight select {
    margin-top: 5px;
    width: 125px;
    padding: 6px;
    font-size: 10px;
  }

  .statsLarge {
    display: grid;
    grid-template-columns: repeat(
      3,
      1fr
    );
    gap: 10px;
  }

  .statsLarge div {
    padding: 18px 10px;
    border-radius: 15px;
    background: rgba(
      255,
      255,
      255,
      .045
    );
    text-align: center;
  }

  .statsLarge strong,
  .statsLarge span {
    display: block;
  }

  .statsLarge strong {
    font-size: 24px;
    color: #fbbf24;
  }

  .statsLarge span {
    margin-top: 4px;
    color: #7e8a99;
    font-size: 10px;
  }

  .challengeHero {
    max-width: 1050px;
    margin: 0 auto 16px;
    padding: 25px;
    border-radius: 25px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    background:
      radial-gradient(
        circle at 90% 20%,
        rgba(168,85,247,.25),
        transparent 45%
      ),
      linear-gradient(
        135deg,
        #252036,
        #171823
      );
    border: 1px solid rgba(
      168,
      85,
      247,
      .2
    );
  }

  .challengeHero > div > span {
    color: #c084fc;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1px;
  }

  .challengeHero h2 {
    margin: 5px 0;
    font-size: 31px;
  }

  .challengeHero p {
    margin: 0;
    color: #9090a1;
    font-size: 12px;
  }

  .templateGrid {
    display: grid;
    grid-template-columns: repeat(
      auto-fit,
      minmax(145px, 1fr)
    );
    gap: 8px;
  }

  .template {
    border: 1px solid rgba(
      255,
      255,
      255,
      .07
    );
    background: rgba(
      255,
      255,
      255,
      .035
    );
    color: white;
    border-radius: 15px;
    padding: 13px 9px;
    cursor: pointer;
    text-align: left;
  }

  .template:hover {
    background: rgba(
      255,
      255,
      255,
      .08
    );
  }

  .template span,
  .template strong,
  .template small {
    display: block;
  }

  .template span {
    font-size: 24px;
  }

  .template strong {
    margin-top: 7px;
    font-size: 12px;
  }

  .template small {
    margin-top: 4px;
    color: #fbbf24;
    font-size: 9px;
  }

  .challengeList {
    display: grid;
    gap: 12px;
  }

  .challengeCard {
    padding: 17px;
    border-radius: 19px;
    background: rgba(
      255,
      255,
      255,
      .045
    );
    border: 1px solid rgba(
      255,
      255,
      255,
      .065
    );
  }

  .challengeCardTop {
    display: grid;
    grid-template-columns: 48px 1fr auto;
    gap: 11px;
    align-items: start;
  }

  .bigChallengeEmoji {
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 13px;
    background: rgba(
      168,
      85,
      247,
      .14
    );
    font-size: 24px;
  }

  .categoryBadge {
    display: inline-block;
    padding: 4px 7px;
    border-radius: 7px;
    background: rgba(
      168,
      85,
      247,
      .12
    );
    color: #c084fc;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .challengeCard h3 {
    margin: 5px 0;
    font-size: 17px;
  }

  .challengeCard p {
    margin: 0;
    color: #8c97a6;
    font-size: 11px;
  }

  .challengePoints {
    margin: 13px 0;
    padding: 9px;
    border-radius: 10px;
    background: rgba(
      251,
      191,
      36,
      .08
    );
    color: #fbbf24;
    text-align: center;
    font-size: 11px;
  }

  .challengePoints strong {
    font-size: 16px;
  }

  .challengeSection {
    margin-top: 13px;
    padding-top: 13px;
    border-top: 1px solid rgba(
      255,
      255,
      255,
      .06
    );
  }

  .challengeSection > strong {
    display: block;
    margin-bottom: 8px;
    font-size: 11px;
  }

  .challengePeople {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .challengePerson {
    border: 1px solid rgba(
      255,
      255,
      255,
      .08
    );
    background: rgba(
      255,
      255,
      255,
      .04
    );
    color: white;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 10px;
  }

  .challengePerson.joined {
    background: rgba(
      34,
      197,
      94,
      .13
    );
    border-color: rgba(
      34,
      197,
      94,
      .25
    );
  }

  .voteInfo {
    margin-bottom: 8px;
    color: #fbbf24;
    font-size: 10px;
  }

  .voteGrid {
    display: grid;
    gap: 6px;
  }

  .voteRow {
    padding: 8px;
    border-radius: 10px;
    background: rgba(
      255,
      255,
      255,
      .035
    );
  }

  .voteRow > span:first-child {
    display: block;
    margin-bottom: 5px;
    font-weight: 800;
    font-size: 11px;
  }

  .voteButtons {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .voteButtons button {
    border: 0;
    border-radius: 8px;
    padding: 6px 8px;
    background: rgba(
      34,
      197,
      94,
      .13
    );
    color: #b9f7c9;
    font-size: 9px;
    cursor: pointer;
  }

  .voted {
    color: #5ee685;
    font-size: 9px;
  }

  .completedChallenge {
    display: grid;
    grid-template-columns: 40px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 11px;
    margin-top: 7px;
    border-radius: 12px;
    background: rgba(
      255,
      255,
      255,
      .04
    );
  }

  .completedChallenge > span {
    font-size: 22px;
  }

  .completedChallenge strong,
  .completedChallenge small {
    display: block;
  }

  .completedChallenge small {
    margin-top: 3px;
    color: #7f8b9b;
    font-size: 9px;
  }

  .completedChallenge b {
    color: #fbbf24;
  }

  .rankingHero {
    max-width: 1050px;
    margin: 0 auto 16px;
    padding: 30px;
    text-align: center;
    border-radius: 25px;
    background:
      radial-gradient(
        circle at 50% 20%,
        rgba(251,191,36,.22),
        transparent 50%
      ),
      linear-gradient(
        145deg,
        #272219,
        #171713
      );
    border: 1px solid rgba(
      251,
      191,
      36,
      .12
    );
  }

  .rankingHero > span {
    font-size: 50px;
  }

  .rankingHero h2 {
    margin: 5px 0;
    font-size: 29px;
  }

  .rankingHero p {
    margin: 0;
    color: #888778;
    font-size: 11px;
  }

  .rankingList {
    display: grid;
    gap: 8px;
  }

  .rankItem {
    display: grid;
    grid-template-columns: 42px 45px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 13px;
    border-radius: 15px;
    background: rgba(
      255,
      255,
      255,
      .045
    );
  }

  .rankItem.first {
    background:
      linear-gradient(
        135deg,
        rgba(251,191,36,.13),
        rgba(255,255,255,.04)
      );
    border: 1px solid rgba(
      251,
      191,
      36,
      .13
    );
  }

  .rankNumber {
    font-size: 20px;
    text-align: center;
  }

  .rankAvatar {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(
      255,
      255,
      255,
      .06
    );
  }

  .rankPerson strong,
  .rankPerson span {
    display: block;
  }

  .rankPerson span {
    margin-top: 3px;
    color: #fbbf24;
    font-size: 9px;
  }

  .rankPoints {
    text-align: right;
  }

  .rankPoints strong,
  .rankPoints small {
    display: block;
  }

  .rankPoints strong {
    color: #fbbf24;
    font-size: 20px;
  }

  .rankPoints small {
    color: #778392;
    font-size: 8px;
  }

  footer {
    max-width: 1050px;
    margin: 35px auto 0;
    padding: 30px 10px;
    text-align: center;
    color: #5c6878;
  }

  footer div {
    font-size: 30px;
  }

  footer strong {
    display: block;
    margin-top: 5px;
    color: #707d8d;
  }

  footer small {
    display: block;
    margin-top: 4px;
    font-size: 9px;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid rgba(
      255,
      255,
      255,
      .09
    );
    border-radius: 12px;
    background: #121821;
    color: white;
    padding: 12px 13px;
    outline: none;
    font-family: inherit;
    margin-bottom: 8px;
  }

  input:focus,
  select:focus,
  textarea:focus {
    border-color: rgba(
      251,
      191,
      36,
      .55
    );
  }

  textarea {
    min-height: 80px;
    resize: vertical;
  }

  option {
    background: #121821;
    color: white;
  }

  .modalBackdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    background: rgba(
      0,
      0,
      0,
      .75
    );
    backdrop-filter: blur(9px);
  }

  .modal {
    position: relative;
    width: 100%;
    max-width: 480px;
    max-height: 92vh;
    overflow-y: auto;
    padding: 25px;
    border-radius: 25px;
    background:
      linear-gradient(
        145deg,
        #202936,
        #11161f
      );
    border: 1px solid rgba(
      255,
      255,
      255,
      .1
    );
    box-shadow:
      0 30px 80px
      rgba(0,0,0,.5);
  }

  .modalClose {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 35px;
    height: 35px;
    border: 0;
    border-radius: 10px;
    background: rgba(
      255,
      255,
      255,
      .06
    );
    color: #9aa5b5;
    font-size: 24px;
    cursor: pointer;
  }

  .modalEmoji {
    width: 55px;
    height: 55px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 17px;
    background: rgba(
      251,
      191,
      36,
      .12
    );
    font-size: 29px;
    margin-bottom: 12px;
  }

  .modal h2 {
    font-size: 25px;
  }

  .modal p {
    margin: 5px 0 18px;
    color: #8793a3;
    font-size: 11px;
  }

  .twoInputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .threeInputs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }

  .modalPrimary {
    width: 100%;
    margin-top: 5px;
    border: 0;
    border-radius: 13px;
    padding: 14px;
    background:
      linear-gradient(
        135deg,
        #fbbf24,
        #f97316
      );
    color: #111;
    font-weight: 950;
    cursor: pointer;
  }

  .checkboxRow {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px;
    margin-bottom: 7px;
    border-radius: 11px;
    background: rgba(
      255,
      255,
      255,
      .04
    );
    color: #bfc8d4;
    font-size: 11px;
    cursor: pointer;
  }

  .checkboxRow input {
    width: auto;
    margin: 0;
  }

  .toast {
    position: fixed;
    z-index: 2000;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    width: min(
      calc(100% - 30px),
      500px
    );
    padding: 14px 17px;
    border-radius: 15px;
    background: #18212c;
    border: 1px solid rgba(
      255,
      255,
      255,
      .1
    );
    box-shadow:
      0 20px 50px
      rgba(0,0,0,.35);
    text-align: center;
    font-size: 12px;
    font-weight: 800;
    animation:
      toastIn .3s ease-out;
  }

  .toast.success {
    color: #fbbf24;
  }

  .toast.error {
    color: #ff8888;
  }

  .toast.info {
    color: #9bc7ff;
  }

  /* ============================================================
     ANIMATIONS
     ============================================================ */

  .animationOverlay {
    position: fixed;
    inset: 0;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background: rgba(
      0,
      0,
      0,
      .42
    );
    backdrop-filter: blur(4px);
    animation:
      overlayIn .25s ease-out;
  }

  .beerAnimation {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .beerGlass {
    font-size: 90px;
    filter:
      drop-shadow(
        0 15px 25px
        rgba(0,0,0,.5)
      );
  }

  .beerGlass.left {
    animation:
      beerLeft
      1.1s
      ease-in-out
      infinite
      alternate;
  }

  .beerGlass.right {
    animation:
      beerRight
      1.1s
      ease-in-out
      infinite
      alternate;
  }

  .clink {
    font-size: 35px;
    animation:
      clink
      .55s
      infinite
      alternate;
  }

  .prostText {
    margin-top: 5px;
    font-size: clamp(
      50px,
      15vw,
      110px
    );
    font-weight: 1000;
    letter-spacing: -4px;
    color: #fbbf24;
    text-shadow:
      0 5px 0 #b45309,
      0 15px 40px
      rgba(251,191,36,.4);
    animation:
      prostText
      .8s
      ease-out
      both;
  }

  .confetti {
    margin-top: 10px;
    font-size: 27px;
    letter-spacing: 8px;
    animation:
      confetti
      1.2s
      infinite
      alternate;
  }

  .moneyText {
    position: relative;
    z-index: 3;
    font-size: clamp(
      45px,
      12vw,
      90px
    );
    font-weight: 1000;
    color: #5ee685;
    text-shadow:
      0 5px 0 #166534,
      0 15px 50px
      rgba(34,197,94,.45);
    animation:
      moneyPop
      .7s
      ease-out
      both;
  }

  .moneyRain {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .moneyRain span {
    position: absolute;
    top: -80px;
    font-size: 40px;
    animation:
      moneyFall
      2.3s
      linear
      forwards;
  }

  @keyframes bounce {
    0%,
    100% {
      transform:
        translateY(0)
        rotate(-5deg);
    }

    50% {
      transform:
        translateY(-14px)
        rotate(5deg);
    }
  }

  @keyframes overlayIn {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes beerLeft {
    from {
      transform:
        translateX(-28px)
        rotate(-18deg);
    }

    to {
      transform:
        translateX(15px)
        rotate(12deg);
    }
  }

  @keyframes beerRight {
    from {
      transform:
        translateX(28px)
        rotate(18deg);
    }

    to {
      transform:
        translateX(-15px)
        rotate(-12deg);
    }
  }

  @keyframes clink {
    from {
      transform:
        scale(.8)
        rotate(-10deg);
    }

    to {
      transform:
        scale(1.25)
        rotate(10deg);
    }
  }

  @keyframes prostText {
    from {
      opacity: 0;
      transform:
        scale(.4)
        rotate(-8deg);
    }

    60% {
      transform:
        scale(1.15)
        rotate(3deg);
    }

    to {
      opacity: 1;
      transform:
        scale(1)
        rotate(0);
    }
  }

  @keyframes confetti {
    from {
      transform:
        translateY(-5px)
        scale(.9);
      opacity: .5;
    }

    to {
      transform:
        translateY(8px)
        scale(1.1);
      opacity: 1;
    }
  }

  @keyframes moneyPop {
    from {
      opacity: 0;
      transform:
        scale(.3)
        rotate(-8deg);
    }

    70% {
      transform:
        scale(1.12)
        rotate(3deg);
    }

    to {
      opacity: 1;
      transform:
        scale(1)
        rotate(0);
    }
  }

  @keyframes moneyFall {
    0% {
      transform:
        translateY(-100px)
        rotate(0deg);
      opacity: 0;
    }

    10% {
      opacity: 1;
    }

    100% {
      transform:
        translateY(110vh)
        rotate(
          720deg
        );
      opacity: .9;
    }
  }

  @keyframes toastIn {
    from {
      opacity: 0;
      transform:
        translate(
          -50%,
          20px
        )
        scale(.95);
    }

    to {
      opacity: 1;
      transform:
        translate(
          -50%,
          0
        )
        scale(1);
    }
  }

  @media (max-width: 700px) {
    .page {
      padding: 11px;
    }

    .header {
      margin-bottom: 12px;
    }

    .brandIcon {
      width: 50px;
      height: 50px;
      font-size: 27px;
      border-radius: 16px;
    }

    .brandText h1 {
      font-size: 20px;
      letter-spacing: -1px;
    }

    .brandText h1 span {
      display: inline;
    }

    .brandText p {
      font-size: 10px;
    }

    .eventHero {
      padding: 17px;
      border-radius: 20px;
    }

    .eventHero h2 {
      font-size: 24px;
      padding-right: 70px;
    }

    .eventActions {
      right: 14px;
      top: 14px;
    }

    .nav {
      border-radius: 15px;
    }

    .nav button {
      font-size: 18px;
    }

    .statsGrid {
      grid-template-columns:
        repeat(2, 1fr);
    }

    .statCard {
      padding: 12px 8px;
    }

    .card {
      padding: 16px;
      border-radius: 20px;
    }

    .quickGrid {
      grid-template-columns:
        repeat(3, 1fr);
    }

    .quickButton {
      padding: 13px 5px;
      border-radius: 16px;
    }

    .quickButton span {
      font-size: 25px;
    }

    .quickButton strong {
      font-size: 11px;
    }

    .quickButton small {
      font-size: 8px;
    }

    .peopleGrid {
      grid-template-columns:
        repeat(2, 1fr);
    }

    .drinkItem {
      grid-template-columns:
        42px 1fr;
    }

    .drinkRight {
      grid-column:
        2 / 3;
      text-align: left;
    }

    .statsLarge {
      grid-template-columns:
        1fr;
    }

    .challengeHero {
      padding: 19px;
      border-radius: 20px;
    }

    .challengeHero h2 {
      font-size: 25px;
    }

    .challengeCardTop {
      grid-template-columns:
        43px 1fr auto;
    }

    .beerGlass {
      font-size: 65px;
    }

    .prostText {
      letter-spacing: -2px;
    }

    .rankItem {
      grid-template-columns:
        35px 38px 1fr auto;
      gap: 7px;
    }

    .rankAvatar {
      width: 36px;
      height: 36px;
    }
  }

  @media (max-width: 430px) {
    .peopleGrid {
      grid-template-columns:
        1fr 1fr;
    }

    .threeInputs {
      grid-template-columns:
        1fr;
    }

    .twoInputs {
      grid-template-columns:
        1fr;
    }

    .moneyBig {
      font-size: 34px;
    }

    .challengeHero {
      flex-direction: column;
      align-items: stretch;
    }

    .challengeHero .primaryButton {
      width: 100%;
    }
  }
`;
