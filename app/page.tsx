"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/* ============================================================
   TYPEN
   ============================================================ */

type Event = {
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
  team_mode?: boolean | null;
  show_photos?: boolean | null;
  show_costs?: boolean | null;
  privacy_mode?: boolean | null;

  created_by_profile_id?: string | null;
};

type Profile = {
  id: string;
  user_id?: string | null;
  username?: string | null;
  role?: string | null;
  points?: number | null;
  drinks_count?: number | null;
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
  event_id?: string | null;
  profile_id?: string | null;

  category?: string | null;
  drink_name?: string | null;
  brand?: string | null;
  liters?: number | null;
  alcohol_percent?: number | null;
  quantity?: number | null;

  image?: string | null;
  comment?: string | null;

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
  foto?: string | null;

  created_at?: string | null;
};

type Payment = {
  id: string;
  event_id?: string | null;
  betrag?: number | null;
  created_at?: string | null;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string | null;
};

type Challenge = {
  id: string;
  title?: string | null;
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

type RankingTitle = {
  id: string;
  min_points: number;
  title: string;
  emoji?: string | null;
  description?: string | null;
};


/* ============================================================
   HAUPTKOMPONENTE
   ============================================================ */

export default function Home() {
  /* ==========================================================
     EVENTS
     ========================================================== */

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventStart, setNewEventStart] = useState("");
  const [newEventEnd, setNewEventEnd] = useState("");

  /* ==========================================================
     PROFILE
     ========================================================== */

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(
    null
  );

  /* ==========================================================
     DRINKS
     ========================================================== */

  const [drinks, setDrinks] = useState<Drink[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] = useState("Bier");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  /* ==========================================================
     PARTICIPANTS
     ========================================================== */

  const [participants, setParticipants] = useState<Profile[]>([]);
  const [personName, setPersonName] = useState("");

  /* ==========================================================
     PAYMENTS
     ========================================================== */

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentProfileId, setPaymentProfileId] = useState("");

  /* ==========================================================
     CHALLENGES
     ========================================================== */

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeTemplates, setChallengeTemplates] = useState<
    ChallengeTemplate[]
  >([]);

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePoints, setChallengePoints] = useState("10");
  const [challengeCategory, setChallengeCategory] = useState("Quatsch");
  const [challengeTarget, setChallengeTarget] = useState("");
  const [requiredVotes, setRequiredVotes] = useState("1");

  /* ==========================================================
     RANKING
     ========================================================== */

  const [rankingTitles, setRankingTitles] = useState<RankingTitle[]>([]);

  /* ==========================================================
     UI
     ========================================================== */

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [animation, setAnimation] = useState<
    "none" | "prost" | "money"
  >("none");

  const [activeTab, setActiveTab] = useState<
    "overview" | "drinks" | "challenges" | "ranking"
  >("overview");

  /* ==========================================================
     EVENT
     ========================================================== */

  const selectedEvent = useMemo(() => {
    return events.find((event) => event.id === eventId) || null;
  }, [events, eventId]);

  /* ==========================================================
     HILFSFUNKTIONEN
     ========================================================== */

  function showMessage(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 4500);
  }

  function playAnimation(type: "prost" | "money") {
    setAnimation(type);

    window.setTimeout(() => {
      setAnimation("none");
    }, 2300);
  }

  function getProfileWeight(profile: Profile) {
    return Number(
      profile.weight_kg ??
        profile.gewicht_kg ??
        82
    );
  }

  function getProfileHeight(profile: Profile) {
    return Number(
      profile.height_cm ??
        profile.height_cm ??
        182
    );
  }

  function getProfileAge(profile: Profile) {
    return Number(
      profile.age ??
        profile.alter ??
        33
    );
  }

  function getProfileGender(profile: Profile) {
    return String(
      profile.gender ??
        profile.geschlecht ??
        "m"
    ).toLowerCase();
  }

  /*
   * Einfache Näherung für die Promilleanzeige.
   * Sie ersetzt keine medizinische Berechnung.
   */

  function calculateDrinkPromille(
    drink: Drink,
    profile: Profile
  ) {
    const volume = Number(
      drink.liters ??
        drink.menge ??
        0
    );

    const percent = Number(
      drink.alcohol_percent ??
        drink.alkohol ??
        0
    );

    const weight = getProfileWeight(profile);

    if (
      volume <= 0 ||
      percent <= 0 ||
      weight <= 0
    ) {
      return 0;
    }

    const alcoholGrams =
      volume *
      1000 *
      (percent / 100) *
      0.789;

    const gender = getProfileGender(profile);

    const factor =
      gender.startsWith("w") ||
      gender === "f"
        ? 0.55
        : 0.68;

    const raw =
      alcoholGrams /
      (weight * factor);

    return Math.max(
      0,
      raw * 0.85
    );
  }

  function getRankingTitle(points: number) {
    if (rankingTitles.length === 0) {
      if (points >= 200) {
        return {
          emoji: "👑",
          title: "Zapfhahn-Legende",
        };
      }

      if (points >= 100) {
        return {
          emoji: "🍻",
          title: "Bier-Baron",
        };
      }

      if (points >= 50) {
        return {
          emoji: "🔥",
          title: "Party-Profi",
        };
      }

      if (points >= 20) {
        return {
          emoji: "😎",
          title: "Stimmungsmacher",
        };
      }

      return {
        emoji: "🍺",
        title: "Zapfhahn-Lehrling",
      };
    }

    const sorted = [...rankingTitles]
      .sort(
        (a, b) =>
          Number(b.min_points) -
          Number(a.min_points)
      );

    return (
      sorted.find(
        (item) =>
          points >=
          Number(item.min_points)
      ) || {
        emoji: "🍺",
        title: "Zapfhahn-Lehrling",
      }
    );
  }

  /* ==========================================================
     EVENTS LADEN
     ========================================================== */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        "❌ Events: " + error.message
      );
      return;
    }

    const loadedEvents =
      (data || []) as Event[];

    setEvents(loadedEvents);

    if (
      !eventId &&
      loadedEvents.length > 0
    ) {
      setEventId(
        loadedEvents[0].id
      );
    }
  }

  /* ==========================================================
     PROFILE LADEN
     ========================================================== */

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("username", {
        ascending: true,
      });

    if (error) {
      showMessage(
        "❌ Profile: " + error.message
      );
      return;
    }

    const loaded =
      (data || []) as Profile[];

    setProfiles(loaded);

    if (loaded.length > 0) {
      setCurrentProfile(
        loaded[0]
      );
    }
  }

  /* ==========================================================
     EVENT-DATEN LADEN
     ========================================================== */

  async function loadEventData() {
    if (!eventId) {
      setDrinks([]);
      setParticipants([]);
      setPayments([]);
      setChallenges([]);
      return;
    }

    setLoading(true);

    await Promise.all([
      loadDrinks(),
      loadParticipants(),
      loadPayments(),
      loadChallenges(),
    ]);

    setLoading(false);
  }

  /* ==========================================================
     DRINKS LADEN
     ========================================================== */

  async function loadDrinks() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        "❌ Getränke: " +
          error.message
      );
      return;
    }

    setDrinks(
      (data || []) as Drink[]
    );
  }

  /* ==========================================================
     TEILNEHMER LADEN
     ========================================================== */

  async function loadParticipants() {
    if (!eventId) return;

    const { data, error } =
      await supabase
        .from("event_members")
        .select(
          `
          profile_id,
          profiles (*)
        `
        )
        .eq(
          "event_id",
          eventId
        );

    if (error) {
      /*
       * Falls event_members wegen
       * RLS nicht lesbar ist,
       * verwenden wir alternativ
       * vorhandene Profile.
       */

      setParticipants(
        profiles
      );

      return;
    }

    const loaded =
      (data || [])
        .map(
          (item: any) =>
            item.profiles
        )
        .filter(Boolean) as Profile[];

    setParticipants(
      loaded
    );
  }

  /* ==========================================================
     ZAHLUNGEN LADEN
     ========================================================== */

  async function loadPayments() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        "❌ Zahlungen: " +
          error.message
      );
      return;
    }

    setPayments(
      (data || []) as Payment[]
    );
  }

  /* ==========================================================
     CHALLENGES LADEN
     ========================================================== */

  async function loadChallenges() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        "❌ Challenges: " +
          error.message
      );
      return;
    }

    setChallenges(
      (data || []) as Challenge[]
    );
  }

  /* ==========================================================
     CHALLENGE-VORLAGEN
     ========================================================== */

  async function loadChallengeTemplates() {
    const { data, error } =
      await supabase
        .from("challenge_templates")
        .select("*")
        .eq("is_active", true)
        .order("title");

    if (error) {
      return;
    }

    setChallengeTemplates(
      (data || []) as ChallengeTemplate[]
    );
  }

  /* ==========================================================
     RANKING-TITEL
     ========================================================== */

  async function loadRankingTitles() {
    const { data } =
      await supabase
        .from("ranking_titles")
        .select("*")
        .order("min_points", {
          ascending: true,
        });

    setRankingTitles(
      (data || []) as RankingTitle[]
    );
  }

  /* ==========================================================
     INITIAL LADEN
     ========================================================== */

  useEffect(() => {
    loadEvents();
    loadProfiles();
    loadChallengeTemplates();
    loadRankingTitles();
  }, []);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    if (
      profiles.length > 0 &&
      !currentProfile
    ) {
      setCurrentProfile(
        profiles[0]
      );
    }
  }, [profiles]);

  /* ==========================================================
     EVENT ERSTELLEN
     ========================================================== */

  async function createEvent() {
    if (
      !newEventTitle.trim()
    ) {
      showMessage(
        "❌ Bitte einen Eventnamen eingeben."
      );
      return;
    }

    setLoading(true);

    let creatorId =
      currentProfile?.id ||
      profiles[0]?.id ||
      null;

    const insertData: any = {
      title:
        newEventTitle.trim(),

      description:
        newEventDescription.trim() ||
        null,

      location:
        newEventLocation.trim() ||
        null,

      start_date:
        newEventStart || null,

      end_date:
        newEventEnd || null,

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

      created_by_profile_id:
        creatorId,
    };

    const { data, error } =
      await supabase
        .from("events")
        .insert(insertData)
        .select()
        .single();

    setLoading(false);

    if (error) {
      showMessage(
        "❌ Event konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    const newEvent =
      data as Event;

    setEvents((old) => [
      newEvent,
      ...old,
    ]);

    setEventId(
      newEvent.id
    );

    setNewEventTitle("");
    setNewEventDescription("");
    setNewEventLocation("");
    setNewEventStart("");
    setNewEventEnd("");

    setShowEventForm(false);

    showMessage(
      "🎉 Event erfolgreich erstellt!"
    );
  }

  /* ==========================================================
     EVENT LÖSCHEN
     ========================================================== */

  async function deleteEvent() {
    if (!selectedEvent) {
      showMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Event "${selectedEvent.title}" wirklich löschen?`
      );

    if (!confirmed) return;

    setLoading(true);

    /*
     * abhängige Daten zuerst entfernen
     */

    await supabase
      .from("challenge_votes")
      .delete()
      .in(
        "challenge_id",
        challenges.map(
          (challenge) =>
            challenge.id
        )
      );

    await supabase
      .from("challenge_results")
      .delete()
      .in(
        "challenge_id",
        challenges.map(
          (challenge) =>
            challenge.id
        )
      );

    await supabase
      .from("challenge_participants")
      .delete()
      .in(
        "challenge_id",
        challenges.map(
          (challenge) =>
            challenge.id
        )
      );

    await supabase
      .from("challenges")
      .delete()
      .eq(
        "event_id",
        eventId
      );

    await supabase
      .from("payments")
      .delete()
      .eq(
        "event_id",
        eventId
      );

    await supabase
      .from("drinks")
      .delete()
      .eq(
        "event_id",
        eventId
      );

    await supabase
      .from("event_members")
      .delete()
      .eq(
        "event_id",
        eventId
      );

    const { error } =
      await supabase
        .from("events")
        .delete()
        .eq(
          "id",
          eventId
        );

    setLoading(false);

    if (error) {
      showMessage(
        "❌ Event konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    const remaining =
      events.filter(
        (event) =>
          event.id !== eventId
      );

    setEvents(
      remaining
    );

    setEventId(
      remaining[0]?.id || ""
    );

    showMessage(
      "🗑️ Event gelöscht."
    );
  }

  /* ==========================================================
     TEILNEHMER HINZUFÜGEN
     ========================================================== */

  async function addParticipant() {
    if (
      !eventId
    ) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (
      !personName.trim()
    ) {
      showMessage(
        "❌ Bitte einen Namen eingeben."
      );
      return;
    }

    /*
     * Existierendes Profil suchen
     */

    let profile =
      profiles.find(
        (item) =>
          String(
            item.username
          ).toLowerCase() ===
          personName
            .trim()
            .toLowerCase()
      ) || null;

    /*
     * Wenn kein Profil existiert,
     * versuchen wir es anzulegen.
     */

    if (!profile) {
      const { data, error } =
        await supabase
          .from("profiles")
          .insert({
            username:
              personName.trim(),
            role: "member",
            points: 0,
            drinks_count: 0,
          })
          .select()
          .single();

      if (error) {
        showMessage(
          "❌ Teilnehmer konnte nicht erstellt werden: " +
            error.message
        );
        return;
      }

      profile =
        data as Profile;

      setProfiles((old) => [
        ...old,
        profile!,
      ]);
    }

    /*
     * Prüfen, ob schon Mitglied
     */

    const already =
      participants.some(
        (item) =>
          item.id ===
          profile!.id
      );

    if (already) {
      showMessage(
        "❌ Teilnehmer ist bereits im Event."
      );
      return;
    }

    const { error } =
      await supabase
        .from("event_members")
        .insert({
          event_id:
            eventId,
          profile_id:
            profile.id,
          joined_via_code:
            null,
          gender_factor:
            getProfileGender(
              profile
            ).startsWith("w")
              ? 0.55
              : 0.68,
        });

    if (error) {
      showMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message
      );
      return;
    }

    setParticipants(
      (old) => [
        ...old,
        profile!,
      ]
    );

    setPersonName("");

    showMessage(
      `👋 ${profile.username || personName} ist dabei!`
    );
  }

  /* ==========================================================
     TEILNEHMER ENTFERNEN
     ========================================================== */

  async function removeParticipant(
    profileId: string
  ) {
    if (!eventId) return;

    const { error } =
      await supabase
        .from("event_members")
        .delete()
        .eq(
          "event_id",
          eventId
        )
        .eq(
          "profile_id",
          profileId
        );

    if (error) {
      showMessage(
        "❌ Teilnehmer konnte nicht entfernt werden: " +
          error.message
      );
      return;
    }

    setParticipants(
      (old) =>
        old.filter(
          (item) =>
            item.id !==
            profileId
        )
    );

    showMessage(
      "👋 Teilnehmer entfernt."
    );
  }

  /* ==========================================================
     GETRÄNK SPEICHERN
     ========================================================== */

  async function saveDrink() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (
      !drinkName.trim()
    ) {
      showMessage(
        "❌ Bitte ein Getränk eingeben."
      );
      return;
    }

    const drinkLiters =
      Number(liters);

    const drinkAlcohol =
      Number(alcohol);

    const drinkPrice =
      Number(price);

    const { data, error } =
      await supabase
        .from("drinks")
        .insert({
          event_id:
            eventId,

          profile_id:
            null,

          category:
            drinkCategory,

          drink_name:
            drinkName.trim(),

          brand:
            drinkBrand.trim() ||
            null,

          liters:
            drinkLiters,

          alcohol_percent:
            drinkAlcohol,

          quantity: 1,

          marke:
            drinkBrand.trim() ||
            null,

          getraenk:
            drinkName.trim(),

          menge:
            drinkLiters,

          alkohol:
            drinkAlcohol,

          preis:
            drinkPrice,

          shared_cost:
            true,
        })
        .select()
        .single();

    if (error) {
      showMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setDrinks((old) => [
      data as Drink,
      ...old,
    ]);

    setDrinkName("");
    setDrinkBrand("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    showMessage(
      "🍺 Getränk gespeichert!"
    );
  }

  /* ==========================================================
     GETRÄNK TRINKEN / ZUORDNEN
     ========================================================== */

  async function drinkForPerson(
    profile: Profile,
    drink: Drink
  ) {
    if (!eventId) return;

    const promille =
      calculateDrinkPromille(
        drink,
        profile
      );

    const drinkLiters =
      Number(
        drink.liters ??
          drink.menge ??
          0
      );

    const drinkAlcohol =
      Number(
        drink.alcohol_percent ??
          drink.alkohol ??
          0
      );

    /*
     * Getränk mit Teilnehmer verknüpfen
     */

    const { error } =
      await supabase
        .from("drinks")
        .update({
          profile_id:
            profile.id,
          promille_wert:
            promille,
        })
        .eq(
          "id",
          drink.id
        );

    if (error) {
      showMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    /*
     * Punkte aktualisieren
     */

    const oldPoints =
      Number(
        profile.points || 0
      );

    const newPoints =
      oldPoints + 10;

    await supabase
      .from("profiles")
      .update({
        points:
          newPoints,
        drinks_count:
          Number(
            profile.drinks_count ||
              0
          ) + 1,
      })
      .eq(
        "id",
        profile.id
      );

    /*
     * Lokalen Zustand aktualisieren
     */

    setProfiles((old) =>
      old.map((item) =>
        item.id ===
        profile.id
          ? {
              ...item,
              points:
                newPoints,
              drinks_count:
                Number(
                  item.drinks_count ||
                    0
                ) + 1,
            }
          : item
      )
    );

    setParticipants(
      (old) =>
        old.map((item) =>
          item.id ===
          profile.id
            ? {
                ...item,
                points:
                  newPoints,
                drinks_count:
                  Number(
                    item.drinks_count ||
                      0
                  ) + 1,
              }
            : item
        )
    );

    setDrinks((old) =>
      old.map((item) =>
        item.id ===
        drink.id
          ? {
              ...item,
              profile_id:
                profile.id,
              promille_wert:
                promille,
            }
          : item
      )
    );

    playAnimation(
      "prost"
    );

    showMessage(
      `🍻 ${profile.username || "Teilnehmer"} bekommt ${drinkLiters.toFixed(
        1
      )} L · ${drinkAlcohol.toFixed(
        1
      )}% · +10 Punkte`
    );
  }

  /* ==========================================================
     ZAHLUNG SPEICHERN
     ========================================================== */

  async function savePayment() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    const amount =
      Number(
        paymentAmount
      );

    if (
      !amount ||
      amount <= 0
    ) {
      showMessage(
        "❌ Bitte einen gültigen Betrag eingeben."
      );
      return;
    }

    const payer =
      paymentProfileId ||
      currentProfile?.id ||
      participants[0]?.id ||
      profiles[0]?.id ||
      null;

    const { data, error } =
      await supabase
        .from("payments")
        .insert({
          event_id:
            eventId,

          betrag:
            amount,

          bezahlt_von:
            payer,

          profile_id:
            payer,

          status:
            "paid",
        })
        .select()
        .single();

    if (error) {
      showMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setPayments((old) => [
      data as Payment,
      ...old,
    ]);

    setPaymentAmount("");

    playAnimation(
      "money"
    );

    showMessage(
      `💶 ${amount.toFixed(
        2
      )} € bezahlt!`
    );
  }

  /* ==========================================================
     CHALLENGE ERSTELLEN
     ========================================================== */

  async function createChallenge() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (
      !challengeTitle.trim()
    ) {
      showMessage(
        "❌ Bitte einen Challenge-Titel eingeben."
      );
      return;
    }

    const points =
      Math.max(
        1,
        Number(
          challengePoints
        ) || 10
      );

    const votes =
      Math.max(
        1,
        Number(
          requiredVotes
        ) || 1
      );

    const creator =
      currentProfile?.id ||
      profiles[0]?.id ||
      null;

    const { data, error } =
      await supabase
        .from("challenges")
        .insert({
          event_id:
            eventId,

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

          created_by_profile_id:
            creator,

          assigned_profile_id:
            challengeTarget ||
            null,

          required_votes:
            votes,

          is_active:
            true,
        })
        .select()
        .single();

    if (error) {
      showMessage(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setChallenges(
      (old) => [
        data as Challenge,
        ...old,
      ]
    );

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");
    setChallengeTarget("");
    setRequiredVotes("1");

    showMessage(
      "🎯 Challenge erstellt!"
    );
  }

  /* ==========================================================
     VORLAGE ÜBERNEHMEN
     ========================================================== */

  function useChallengeTemplate(
    template: ChallengeTemplate
  ) {
    setChallengeTitle(
      template.title
    );

    setChallengeDescription(
      template.description ||
        ""
    );

    setChallengePoints(
      String(
        template.default_points ||
          10
      )
    );

    setChallengeCategory(
      template.category ||
        "Quatsch"
    );

    setRequiredVotes(
      String(
        template.minimum_votes ||
          1
      )
    );
  }

  /* ==========================================================
     CHALLENGE ABSCHLIESSEN
     ========================================================== */

  async function completeChallenge(
    challenge: Challenge,
    winnerId?: string
  ) {
    const winner =
      winnerId ||
      challenge.assigned_profile_id ||
      null;

    const points =
      Number(
        challenge.points || 0
      );

    /*
     * Challenge aktualisieren
     */

    const { error } =
      await supabase
        .from("challenges")
        .update({
          status:
            "completed",

          winner_profile_id:
            winner,

          completed_at:
            new Date().toISOString(),

          is_active:
            false,
        })
        .eq(
          "id",
          challenge.id
        );

    if (error) {
      showMessage(
        "❌ Challenge konnte nicht abgeschlossen werden: " +
          error.message
      );
      return;
    }

    /*
     * Gewinner bekommt Punkte
     */

    if (winner) {
      const winnerProfile =
        profiles.find(
          (profile) =>
            profile.id ===
            winner
        );

      if (winnerProfile) {
        const newPoints =
          Number(
            winnerProfile.points ||
              0
          ) + points;

        await supabase
          .from("profiles")
          .update({
            points:
              newPoints,
          })
          .eq(
            "id",
            winner
          );

        setProfiles(
          (old) =>
            old.map(
              (profile) =>
                profile.id ===
                winner
                  ? {
                      ...profile,
                      points:
                        newPoints,
                    }
                  : profile
            )
        );

        setParticipants(
          (old) =>
            old.map(
              (profile) =>
                profile.id ===
                winner
                  ? {
                      ...profile,
                      points:
                        newPoints,
                    }
                  : profile
            )
        );

        await supabase
          .from(
            "challenge_results"
          )
          .insert({
            challenge_id:
              challenge.id,
            profile_id:
              winner,
            place: 1,
            points,
            result_type:
              "winner",
          });
      }
    }

    setChallenges(
      (old) =>
        old.map(
          (item) =>
            item.id ===
            challenge.id
              ? {
                  ...item,
                  status:
                    "completed",
                  winner_profile_id:
                    winner,
                  completed_at:
                    new Date().toISOString(),
                  is_active:
                    false,
                }
              : item
        )
    );

    showMessage(
      `🏆 Challenge abgeschlossen! +${points} Punkte`
    );
  }

  /* ==========================================================
     CHALLENGE LÖSCHEN
     ========================================================== */

  async function deleteChallenge(
    challengeId: string
  ) {
    const confirmed =
      window.confirm(
        "Challenge wirklich löschen?"
      );

    if (!confirmed) return;

    await supabase
      .from("challenge_votes")
      .delete()
      .eq(
        "challenge_id",
        challengeId
      );

    await supabase
      .from(
        "challenge_participants"
      )
      .delete()
      .eq(
        "challenge_id",
        challengeId
      );

    await supabase
      .from(
        "challenge_results"
      )
      .delete()
      .eq(
        "challenge_id",
        challengeId
      );

    const { error } =
      await supabase
        .from("challenges")
        .delete()
        .eq(
          "id",
          challengeId
        );

    if (error) {
      showMessage(
        "❌ Challenge konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    setChallenges(
      (old) =>
        old.filter(
          (item) =>
            item.id !==
            challengeId
        )
    );

    showMessage(
      "🗑️ Challenge gelöscht."
    );
  }

  /* ==========================================================
     BERECHNUNGEN
     ========================================================== */

  const totalLiters =
    drinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.liters ??
            drink.menge ??
            0
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
        Number(
          drink.preis || 0
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

  const remainingCost =
    Math.max(
      0,
      totalDrinkCost -
        totalPayments
    );

  const costPerPerson =
    participants.length > 0
      ? totalDrinkCost /
        participants.length
      : 0;

  const totalPoints =
    profiles.reduce(
      (sum, profile) =>
        sum +
        Number(
          profile.points || 0
        ),
      0
    );

  const ranking =
    [...profiles]
      .sort(
        (a, b) =>
          Number(
            b.points || 0
          ) -
          Number(
            a.points || 0
          )
      )
      .slice(0, 20);

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <main className="app">
      {/* ======================================================
          ANIMATION
          ====================================================== */}

      {animation ===
        "prost" && (
        <div className="animationOverlay">
          <div className="beerClash">
            <div className="beer beerLeft">
              🍺
            </div>

            <div className="prostText">
              PROST! 🍻
            </div>

            <div className="beer beerRight">
              🍺
            </div>
          </div>

          <div className="spark spark1">
            ✨
          </div>
          <div className="spark spark2">
            ✨
          </div>
          <div className="spark spark3">
            ✨
          </div>
        </div>
      )}

      {animation ===
        "money" && (
        <div className="moneyOverlay">
          {Array.from({
            length: 30,
          }).map(
            (_, index) => (
              <span
                key={index}
                className="money"
                style={{
                  left:
                    `${(index * 37) % 100}%`,
                  animationDelay:
                    `${(index % 10) * 0.08}s`,
                }}
              >
                💶
              </span>
            )
          )}

          <div className="moneyText">
            💸 BEZAHLT! 💸
          </div>
        </div>
      )}

      <div className="container">

        {/* ==================================================
            HEADER
            ================================================== */}

        <header className="hero">
          <div className="heroLogo">
            🍻
          </div>

          <div className="heroText">
            <div className="eyebrow">
              GÜSTEN · PARTY · CHAOS
            </div>

            <h1>
              Güstener
              <br />
              Zapfhahn Zentrale
            </h1>

            <p>
              Dein Event.
              Deine Getränke.
              Deine Challenges.
              Dein Chaos.
            </p>
          </div>
        </header>

        {/* ==================================================
            EVENT
            ================================================== */}

        <section className="glassCard eventCard">

          <div className="sectionTop">
            <div>
              <span className="sectionEmoji">
                📅
              </span>

              <div>
                <h2>
                  Aktuelles Event
                </h2>

                <p>
                  Wo gerade das
                  Chaos stattfindet
                </p>
              </div>
            </div>

            <button
              className="smallButton"
              onClick={() =>
                setShowEventForm(
                  !showEventForm
                )
              }
            >
              ➕ Event
            </button>
          </div>

          <select
            className="bigSelect"
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

            {events.map(
              (event) => (
                <option
                  key={event.id}
                  value={event.id}
                >
                  {event.title}
                </option>
              )
            )}
          </select>

          {selectedEvent && (
            <div className="eventInfo">
              <div>
                <b>
                  {selectedEvent.title}
                </b>

                {selectedEvent.location && (
                  <span>
                    📍{" "}
                    {
                      selectedEvent.location
                    }
                  </span>
                )}
              </div>

              <button
                className="dangerButton"
                onClick={
                  deleteEvent
                }
              >
                🗑️ Löschen
              </button>
            </div>
          )}

          {showEventForm && (
            <div className="formBox">
              <h3>
                🎉 Neues Event
              </h3>

              <input
                placeholder="Eventname"
                value={
                  newEventTitle
                }
                onChange={(e) =>
                  setNewEventTitle(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Beschreibung"
                value={
                  newEventDescription
                }
                onChange={(e) =>
                  setNewEventDescription(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Ort"
                value={
                  newEventLocation
                }
                onChange={(e) =>
                  setNewEventLocation(
                    e.target.value
                  )
                }
              />

              <div className="two">
                <input
                  type="date"
                  value={
                    newEventStart
                  }
                  onChange={(e) =>
                    setNewEventStart(
                      e.target.value
                    )
                  }
                />

                <input
                  type="date"
                  value={
                    newEventEnd
                  }
                  onChange={(e) =>
                    setNewEventEnd(
                      e.target.value
                    )
                  }
                />
              </div>

              <button
                className="primaryButton"
                onClick={
                  createEvent
                }
                disabled={
                  loading
                }
              >
                🚀 Event erstellen
              </button>
            </div>
          )}
        </section>

        {/* ==================================================
            STATISTIK
            ================================================== */}

        <div className="statsGrid">

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
              {totalLiters.toFixed(
                1
              )}
            </strong>
            <small>
              Liter
            </small>
          </div>

          <div className="statCard">
            <span>💶</span>
            <strong>
              {totalDrinkCost.toFixed(
                2
              )} €
            </strong>
            <small>
              Kosten
            </small>
          </div>

          <div className="statCard">
            <span>👥</span>
            <strong>
              {participants.length}
            </strong>
            <small>
              Teilnehmer
            </small>
          </div>

        </div>

        {/* ==================================================
            NAVIGATION
            ================================================== */}

        <nav className="tabs">

          <button
            className={
              activeTab ===
              "overview"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "overview"
              )
            }
          >
            🏠 Übersicht
          </button>

          <button
            className={
              activeTab ===
              "drinks"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "drinks"
              )
            }
          >
            🍺 Getränke
          </button>

          <button
            className={
              activeTab ===
              "challenges"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "challenges"
              )
            }
          >
            🎯 Challenges
          </button>

          <button
            className={
              activeTab ===
              "ranking"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "ranking"
              )
            }
          >
            🏆 Ranking
          </button>

        </nav>

        {/* ==================================================
            ÜBERSICHT
            ================================================== */}

        {activeTab ===
          "overview" && (
          <>
            {/* TEILNEHMER */}

            <section className="glassCard">

              <div className="sectionTop">
                <div>
                  <span className="sectionEmoji">
                    👥
                  </span>

                  <div>
                    <h2>
                      Teilnehmer
                    </h2>

                    <p>
                      Wer ist heute
                      dabei?
                    </p>
                  </div>
                </div>
              </div>

              <div className="inputRow">
                <input
                  placeholder="Name eingeben..."
                  value={
                    personName
                  }
                  onChange={(e) =>
                    setPersonName(
                      e.target.value
                    )
                  }
                />

                <button
                  className="primaryButton"
                  onClick={
                    addParticipant
                  }
                >
                  ➕
                </button>
              </div>

              <div className="peopleList">

                {participants.length ===
                  0 && (
                  <div className="empty">
                    👻 Noch niemand
                    dabei.
                  </div>
                )}

                {participants.map(
                  (
                    person,
                    index
                  ) => {
                    const title =
                      getRankingTitle(
                        Number(
                          person.points ||
                            0
                        )
                      );

                    return (
                      <div
                        className="person"
                        key={
                          person.id
                        }
                      >

                        <div className="personAvatar">
                          {index ===
                          0
                            ? "👑"
                            : "👤"}
                        </div>

                        <div className="personMain">

                          <b>
                            {person.username ||
                              "Teilnehmer"}
                          </b>

                          <small>
                            {title.emoji}{" "}
                            {
                              title.title
                            }
                          </small>

                        </div>

                        <div className="personPoints">
                          <strong>
                            {Number(
                              person.points ||
                                0
                            )}
                          </strong>

                          <small>
                            Punkte
                          </small>
                        </div>

                        <button
                          className="iconButton"
                          onClick={() =>
                            removeParticipant(
                              person.id
                            )
                          }
                        >
                          ×
                        </button>

                      </div>
                    );
                  }
                )}

              </div>
            </section>

            {/* ZAHLUNG */}

            <section className="glassCard">

              <div className="sectionTop">
                <div>
                  <span className="sectionEmoji">
                    💶
                  </span>

                  <div>
                    <h2>
                      Zahlung
                    </h2>

                    <p>
                      Wer hat die
                      Rechnung bezahlt?
                    </p>
                  </div>
                </div>
              </div>

              <div className="two">

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
                    paymentProfileId
                  }
                  onChange={(e) =>
                    setPaymentProfileId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Person auswählen
                  </option>

                  {participants.map(
                    (person) => (
                      <option
                        key={
                          person.id
                        }
                        value={
                          person.id
                        }
                      >
                        {person.username}
                      </option>
                    )
                  )}
                </select>

              </div>

              <button
                className="moneyButton"
                onClick={
                  savePayment
                }
              >
                💸 Zahlung speichern
              </button>

              <div className="paymentSummary">

                <div>
                  <span>
                    Gesamtkosten
                  </span>

                  <b>
                    {totalDrinkCost.toFixed(
                      2
                    )} €
                  </b>
                </div>

                <div>
                  <span>
                    Bezahlt
                  </span>

                  <b>
                    {totalPayments.toFixed(
                      2
                    )} €
                  </b>
                </div>

                <div>
                  <span>
                    Offen
                  </span>

                  <b className="orange">
                    {remainingCost.toFixed(
                      2
                    )} €
                  </b>
                </div>

              </div>

            </section>

            {/* PROMILLE */}

            <section className="glassCard">

              <div className="sectionTop">
                <div>
                  <span className="sectionEmoji">
                    🥴
                  </span>

                  <div>
                    <h2>
                      Promille
                    </h2>

                    <p>
                      Nur als
                      Party-Schätzung
                    </p>
                  </div>
                </div>
              </div>

              {participants.map(
                (person) => {

                  const personDrinks =
                    drinks.filter(
                      (drink) =>
                        drink.profile_id ===
                        person.id
                    );

                  const promille =
                    personDrinks.reduce(
                      (
                        sum,
                        drink
                      ) =>
                        sum +
                        calculateDrinkPromille(
                          drink,
                          person
                        ),
                      0
                    );

                  return (
                    <div
                      className="promilleRow"
                      key={
                        person.id
                      }
                    >

                      <div>
                        <b>
                          {person.username}
                        </b>

                        <small>
                          {personDrinks.length}{" "}
                          Getränke
                        </small>
                      </div>

                      <strong>
                        {promille.toFixed(
                          2
                        )} ‰
                      </strong>

                    </div>
                  );
                }
              )}

              <p className="disclaimer">
                ⚠️ Die Anzeige ist
                nur eine grobe
                Party-Schätzung und
                darf niemals zur
                Beurteilung der
                Fahrtüchtigkeit
                verwendet werden.
              </p>

            </section>
          </>
        )}

        {/* ==================================================
            GETRÄNKE
            ================================================== */}

        {activeTab ===
          "drinks" && (
          <>

            <section className="glassCard">

              <div className="sectionTop">
                <div>
                  <span className="sectionEmoji">
                    🍺
                  </span>

                  <div>
                    <h2>
                      Getränk
                      hinzufügen
                    </h2>

                    <p>
                      Alles was
                      getrunken wird
                    </p>
                  </div>
                </div>
              </div>

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

              <div className="two">

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
                    Radler
                  </option>
                  <option>
                    Wein
                  </option>
                  <option>
                    Sekt
                  </option>
                  <option>
                    Schnaps
                  </option>
                  <option>
                    Cocktail
                  </option>
                  <option>
                    Softdrink
                  </option>
                  <option>
                    Sonstiges
                  </option>
                </select>

              </div>

              <div className="three">

                <input
                  type="number"
                  step="0.05"
                  placeholder="Liter"
                  value={
                    liters
                  }
                  onChange={(e) =>
                    setLiters(
                      e.target.value
                    )
                  }
                />

                <input
                  type="number"
                  step="0.1"
                  placeholder="Alkohol %"
                  value={
                    alcohol
                  }
                  onChange={(e) =>
                    setAlcohol(
                      e.target.value
                    )
                  }
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Preis €"
                  value={
                    price
                  }
                  onChange={(e) =>
                    setPrice(
                      e.target.value
                    )
                  }
                />

              </div>

              <button
                className="primaryButton full"
                onClick={
                  saveDrink
                }
              >
                🍻 Getränk speichern
              </button>

            </section>

            {/* GETRÄNKE */}

            <section className="glassCard">

              <h2>
                🍺 Getränkeliste
              </h2>

              {drinks.length ===
                0 && (
                <div className="empty">
                  🍺 Noch keine
                  Getränke.
                </div>
              )}

              {drinks.map(
                (drink) => (
                  <div
                    className="drinkCard"
                    key={
                      drink.id
                    }
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
                        ).toFixed(
                          1
                        )}{" "}
                        L
                        {" · "}
                        {Number(
                          drink.alcohol_percent ??
                            drink.alkohol ??
                            0
                        ).toFixed(
                          1
                        )}%
                      </small>

                    </div>

                    <strong>
                      {Number(
                        drink.preis ||
                          0
                      ).toFixed(
                        2
                      )} €
                    </strong>

                  </div>
                )
              )}

            </section>

            {/* TRINKEN */}

            <section className="glassCard">

              <h2>
                🍻 Getränk zuordnen
              </h2>

              <p>
                Wer hat gerade
                einen getrunken?
              </p>

              {participants.map(
                (person) => (
                  <div
                    className="assignment"
                    key={
                      person.id
                    }
                  >

                    <b>
                      {person.username}
                    </b>

                    <select
                      defaultValue=""
                      onChange={(e) => {

                        const drink =
                          drinks.find(
                            (item) =>
                              item.id ===
                              e.target
                                .value
                          );

                        if (
                          drink
                        ) {
                          drinkForPerson(
                            person,
                            drink
                          );

                          e.target.value =
                            "";
                        }

                      }}
                    >

                      <option value="">
                        🍺 Getränk
                        auswählen
                      </option>

                      {drinks.map(
                        (drink) => (
                          <option
                            key={
                              drink.id
                            }
                            value={
                              drink.id
                            }
                          >
                            {drink.drink_name ||
                              drink.getraenk ||
                              "Getränk"}
                            {" · "}
                            {Number(
                              drink.preis ||
                                0
                            ).toFixed(
                              2
                            )}{" "}
                            €
                          </option>
                        )
                      )}

                    </select>

                  </div>
                )
              )}

            </section>

          </>
        )}

        {/* ==================================================
            CHALLENGES
            ================================================== */}

        {activeTab ===
          "challenges" && (
          <>

            <section className="glassCard challengeHero">

              <div className="challengeBig">
                🎯
              </div>

              <div>
                <h2>
                  Challenge-Zentrale
                </h2>

                <p>
                  Aufgaben machen.
                  Abstimmen.
                  Punkte kassieren.
                </p>
              </div>

            </section>

            {/* CHALLENGE ERSTELLEN */}

            <section className="glassCard">

              <h2>
                🚀 Neue Challenge
              </h2>

              <input
                placeholder="Was soll passieren?"
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

              <div className="two">

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
                  <option>
                    Quatsch
                  </option>
                  <option>
                    Abstimmung
                  </option>
                  <option>
                    Duell
                  </option>
                  <option>
                    Geschicklichkeit
                  </option>
                  <option>
                    Kreativ
                  </option>
                  <option>
                    Lustig
                  </option>
                  <option>
                    Mutprobe
                  </option>
                  <option>
                    Party
                  </option>
                  <option>
                    Team
                  </option>
                  <option>
                    Trinken
                  </option>
                  <option>
                    Wissen
                  </option>
                  <option>
                    Zufall
                  </option>
                </select>

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

              </div>

              <div className="two">

                <select
                  value={
                    challengeTarget
                  }
                  onChange={(e) =>
                    setChallengeTarget(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Zielperson
                    auswählen
                  </option>

                  {participants.map(
                    (person) => (
                      <option
                        key={
                          person.id
                        }
                        value={
                          person.id
                        }
                      >
                        {person.username}
                      </option>
                    )
                  )}
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Benötigte Stimmen"
                  value={
                    requiredVotes
                  }
                  onChange={(e) =>
                    setRequiredVotes(
                      e.target.value
                    )
                  }
                />

              </div>

              <button
                className="primaryButton full"
                onClick={
                  createChallenge
                }
              >
                🎯 Challenge starten
              </button>

            </section>

            {/* VORLAGEN */}

            <section className="glassCard">

              <h2>
                🎲 Schnelle Challenges
              </h2>

              <div className="templateGrid">

                {challengeTemplates
                  .slice(
                    0,
                    20
                  )
                  .map(
                    (
                      template
                    ) => (
                      <button
                        className="template"
                        key={
                          template.id
                        }
                        onClick={() =>
                          useChallengeTemplate(
                            template
                          )
                        }
                      >

                        <span>
                          🎯
                        </span>

                        <b>
                          {
                            template.title
                          }
                        </b>

                        <small>
                          +
                          {
                            template.default_points ||
                              10
                          }{" "}
                          Punkte
                        </small>

                      </button>
                    )
                  )}

              </div>

            </section>

            {/* AKTIVE CHALLENGES */}

            <section className="glassCard">

              <h2>
                🔥 Challenges
              </h2>

              {challenges.length ===
                0 && (
                <div className="empty">
                  😴 Noch keine
                  Challenges.
                </div>
              )}

              {challenges.map(
                (
                  challenge
                ) => (
                  <div
                    className="challengeCard"
                    key={
                      challenge.id
                    }
                  >

                    <div className="challengeIcon">
                      🎯
                    </div>

                    <div className="challengeContent">

                      <div className="challengeHeader">

                        <b>
                          {
                            challenge.title
                          }
                        </b>

                        <span className="pointsBadge">
                          +
                          {
                            challenge.points ||
                              0
                          }
                        </span>

                      </div>

                      <p>
                        {
                          challenge.description ||
                          "Aufgabe starten!"
                        }
                      </p>

                      <small>
                        🏷️{" "}
                        {
                          challenge.category
                        }
                        {" · "}
                        🗳️{" "}
                        {
                          challenge.required_votes ||
                            1
                        }{" "}
                        Stimme(n)
                      </small>

                      {challenge.status !==
                        "completed" && (
                        <div className="challengeActions">

                          <select
                            defaultValue=""
                            onChange={(
                              e
                            ) => {

                              if (
                                e.target
                                  .value
                              ) {
                                completeChallenge(
                                  challenge,
                                  e.target
                                    .value
                                );

                                e.target.value =
                                  "";
                              }

                            }}
                          >

                            <option value="">
                              🏆 Gewinner
                              auswählen
                            </option>

                            {participants.map(
                              (
                                person
                              ) => (
                                <option
                                  key={
                                    person.id
                                  }
                                  value={
                                    person.id
                                  }
                                >
                                  {
                                    person.username
                                  }
                                </option>
                              )
                            )}

                          </select>

                          <button
                            className="deleteSmall"
                            onClick={() =>
                              deleteChallenge(
                                challenge.id
                              )
                            }
                          >
                            🗑️
                          </button>

                        </div>
                      )}

                      {challenge.status ===
                        "completed" && (
                        <div className="completed">
                          ✅ Challenge
                          abgeschlossen
                          {challenge.winner_profile_id &&
                            " · 🏆 Gewinner festgelegt"}
                        </div>
                      )}

                    </div>

                  </div>
                )
              )}

            </section>

          </>
        )}

        {/* ==================================================
            RANKING
            ================================================== */}

        {activeTab ===
          "ranking" && (
          <>

            <section className="rankingHero">

              <div className="trophy">
                🏆
              </div>

              <h2>
                Die Hall of Fame
              </h2>

              <p>
                Wer ist die absolute
                Zapfhahn-Legende?
              </p>

            </section>

            <section className="glassCard">

              {ranking.length ===
                0 && (
                <div className="empty">
                  👻 Noch keine
                  Punkte.
                </div>
              )}

              {ranking.map(
                (
                  person,
                  index
                ) => {

                  const title =
                    getRankingTitle(
                      Number(
                        person.points ||
                          0
                      )
                    );

                  return (
                    <div
                      className={
                        "rankingItem " +
                        (index <
                        3
                          ? "podium"
                          : "")
                      }
                      key={
                        person.id
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
                          : index +
                            1}

                      </div>

                      <div className="rankPerson">

                        <b>
                          {person.username ||
                            "Teilnehmer"}
                        </b>

                        <small>
                          {
                            title.emoji
                          }{" "}
                          {
                            title.title
                          }
                        </small>

                      </div>

                      <div className="rankPoints">

                        <strong>
                          {Number(
                            person.points ||
                              0
                          )}
                        </strong>

                        <small>
                          Punkte
                        </small>

                      </div>

                    </div>
                  );
                }
              )}

            </section>

            <section className="glassCard">

              <h2>
                😂 Die Titel
              </h2>

              <div className="titleGrid">

                {[
                  [
                    "🍺",
                    "Zapfhahn-Lehrling",
                  ],
                  [
                    "😎",
                    "Stimmungsmacher",
                  ],
                  [
                    "🔥",
                    "Party-Profi",
                  ],
                  [
                    "🍻",
                    "Bier-Baron",
                  ],
                  [
                    "👑",
                    "Zapfhahn-Legende",
                  ],
                ].map(
                  (
                    item
                  ) => (
                    <div
                      className="titleCard"
                      key={
                        item[1]
                      }
                    >
                      <span>
                        {item[0]}
                      </span>

                      <b>
                        {item[1]}
                      </b>
                    </div>
                  )
                )}

              </div>

            </section>

          </>
        )}

        {/* ==================================================
            STATUS
            ================================================== */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {loading && (
          <div className="loading">
            ⏳ Einen Moment...
          </div>
        )}

        {/* ==================================================
            FOOTER
            ================================================== */}

        <footer>
          <div>
            🍻
          </div>

          <b>
            Güstener Zapfhahn
            Zentrale
          </b>

          <small>
            Dein Event.
            Deine Getränke.
            Dein Chaos.
          </small>
        </footer>

      </div>

      {/* ======================================================
          STYLES
          ====================================================== */}

      <style jsx global>{`

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

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .app {
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(245,158,11,.20),
              transparent 35%
            ),
            radial-gradient(
              circle at 0% 30%,
              rgba(59,130,246,.10),
              transparent 30%
            ),
            linear-gradient(
              180deg,
              #0b1118 0%,
              #070b10 100%
            );
          color: white;
          padding: 20px 14px 50px;
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

        .hero {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 15px 5px 30px;
        }

        .heroLogo {
          width: 75px;
          height: 75px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          border-radius: 24px;
          background:
            linear-gradient(
              145deg,
              #f59e0b,
              #f97316
            );
          box-shadow:
            0 15px 35px
            rgba(245,158,11,.25);
          transform: rotate(-4deg);
        }

        .eyebrow {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #fbbf24;
          margin-bottom: 5px;
        }

        h1 {
          margin: 0;
          font-size: clamp(
            27px,
            6vw,
            48px
          );
          line-height: .95;
          letter-spacing: -1.5px;
        }

        .hero p {
          margin: 12px 0 0;
          color: #9ca8b5;
          font-size: 14px;
        }

        h2 {
          margin: 0;
          font-size: 20px;
        }

        h3 {
          margin-top: 0;
        }

        p {
          color: #929daa;
          line-height: 1.5;
        }

        .glassCard {
          position: relative;
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.075),
              rgba(255,255,255,.035)
            );
          border: 1px solid
            rgba(255,255,255,.09);
          border-radius: 24px;
          padding: 20px;
          margin-bottom: 15px;
          box-shadow:
            0 15px 50px
            rgba(0,0,0,.20);
          backdrop-filter:
            blur(14px);
        }

        .sectionTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .sectionTop > div:first-child {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sectionEmoji {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background:
            rgba(245,158,11,.12);
          font-size: 25px;
        }

        .sectionTop p {
          margin: 3px 0 0;
          font-size: 12px;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid
            rgba(255,255,255,.10);
          border-radius: 14px;
          background: #111922;
          color: white;
          padding: 13px 14px;
          outline: none;
          margin-bottom: 9px;
        }

        textarea {
          min-height: 90px;
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #f59e0b;
          box-shadow:
            0 0 0 3px
            rgba(245,158,11,.08);
        }

        option {
          background: #111922;
          color: white;
        }

        .bigSelect {
          font-size: 16px;
          padding: 15px;
        }

        .two {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 9px;
        }

        .three {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 9px;
        }

        .inputRow {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 9px;
        }

        .inputRow input {
          margin: 0;
        }

        button {
          border: none;
          transition:
            transform .15s ease,
            filter .15s ease;
        }

        button:hover {
          filter: brightness(1.08);
        }

        button:active {
          transform:
            scale(.96);
        }

        .primaryButton {
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #f97316
            );
          color: #111;
          font-weight: 900;
          padding: 13px 17px;
          border-radius: 14px;
          box-shadow:
            0 8px 20px
            rgba(245,158,11,.18);
        }

        .primaryButton.full {
          width: 100%;
          margin-top: 3px;
        }

        .smallButton {
          background: #f59e0b;
          color: #111;
          border-radius: 12px;
          padding: 9px 12px;
          font-weight: 900;
        }

        .dangerButton {
          background:
            rgba(239,68,68,.12);
          color: #fca5a5;
          border: 1px solid
            rgba(239,68,68,.20);
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 800;
        }

        .eventInfo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          background:
            rgba(255,255,255,.045);
          border-radius: 14px;
          padding: 12px;
        }

        .eventInfo b {
          display: block;
        }

        .eventInfo span {
          display: block;
          color: #8995a3;
          font-size: 12px;
          margin-top: 3px;
        }

        .formBox {
          margin-top: 12px;
          padding: 15px;
          background:
            rgba(0,0,0,.18);
          border-radius: 17px;
        }

        .statsGrid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .statCard {
          padding: 15px 8px;
          text-align: center;
          border-radius: 18px;
          background:
            rgba(255,255,255,.055);
          border: 1px solid
            rgba(255,255,255,.06);
        }

        .statCard span {
          display: block;
          font-size: 23px;
        }

        .statCard strong {
          display: block;
          font-size: 20px;
          margin: 5px 0;
        }

        .statCard small {
          color: #7e8b99;
          font-size: 10px;
        }

        .tabs {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 6px;
          padding: 5px;
          margin-bottom: 15px;
          border-radius: 17px;
          background:
            rgba(255,255,255,.045);
          border: 1px solid
            rgba(255,255,255,.06);
        }

        .tabs button {
          background: transparent;
          color: #8995a3;
          border-radius: 13px;
          padding: 11px 5px;
          font-size: 11px;
          font-weight: 900;
        }

        .tabs button.active {
          background:
            rgba(245,158,11,.16);
          color: #fbbf24;
        }

        .peopleList {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .person {
          display: grid;
          grid-template-columns:
            45px 1fr auto auto;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border-radius: 15px;
          background:
            rgba(255,255,255,.045);
        }

        .personAvatar {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background:
            rgba(245,158,11,.12);
          font-size: 20px;
        }

        .personMain b,
        .personMain small {
          display: block;
        }

        .personMain small {
          margin-top: 3px;
          color: #8995a3;
          font-size: 10px;
        }

        .personPoints {
          text-align: right;
        }

        .personPoints strong {
          display: block;
          color: #fbbf24;
        }

        .personPoints small {
          color: #707d8b;
          font-size: 9px;
        }

        .iconButton {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background:
            #252e38;
          color: #aab3bd;
          font-size: 18px;
        }

        .drinkCard {
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
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background:
            rgba(245,158,11,.10);
          font-size: 22px;
        }

        .drinkInfo {
          flex: 1;
        }

        .drinkInfo b,
        .drinkInfo small {
          display: block;
        }

        .drinkInfo small {
          color: #8995a3;
          font-size: 10px;
          margin-top: 4px;
        }

        .drinkCard > strong {
          color: #fbbf24;
        }

        .assignment {
          display: grid;
          grid-template-columns:
            .8fr 1.2fr;
          gap: 10px;
          align-items: center;
          margin-top: 8px;
          padding: 10px;
          border-radius: 13px;
          background:
            rgba(255,255,255,.045);
        }

        .assignment select {
          margin: 0;
        }

        .moneyButton {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              #22c55e,
              #16a34a
            );
          color: white;
          font-weight: 900;
        }

        .paymentSummary {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
          margin-top: 12px;
        }

        .paymentSummary div {
          padding: 12px;
          border-radius: 13px;
          background:
            rgba(255,255,255,.045);
          text-align: center;
        }

        .paymentSummary span,
        .paymentSummary b {
          display: block;
        }

        .paymentSummary span {
          color: #7d8996;
          font-size: 10px;
        }

        .paymentSummary b {
          margin-top: 5px;
        }

        .orange {
          color: #fbbf24;
        }

        .promilleRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px;
          margin-top: 8px;
          border-radius: 14px;
          background:
            rgba(255,255,255,.045);
        }

        .promilleRow b,
        .promilleRow small {
          display: block;
        }

        .promilleRow small {
          color: #7e8b99;
          margin-top: 3px;
          font-size: 10px;
        }

        .promilleRow strong {
          font-size: 21px;
          color: #fbbf24;
        }

        .disclaimer {
          margin-bottom: 0;
          font-size: 10px;
        }

        .challengeHero {
          display: flex;
          align-items: center;
          gap: 15px;
          background:
            linear-gradient(
              135deg,
              rgba(168,85,247,.18),
              rgba(245,158,11,.08)
            );
        }

        .challengeBig {
          width: 65px;
          height: 65px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background:
            rgba(168,85,247,.15);
          font-size: 35px;
        }

        .templateGrid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 8px;
        }

        .template {
          display: grid;
          grid-template-columns:
            35px 1fr;
          align-items: center;
          text-align: left;
          gap: 7px;
          padding: 11px;
          border-radius: 14px;
          background:
            rgba(255,255,255,.045);
          color: white;
        }

        .template span {
          grid-row: span 2;
          font-size: 21px;
        }

        .template b {
          font-size: 11px;
        }

        .template small {
          color: #8995a3;
          font-size: 9px;
        }

        .challengeCard {
          display: flex;
          gap: 12px;
          padding: 14px;
          margin-top: 9px;
          border-radius: 17px;
          background:
            rgba(255,255,255,.045);
          border: 1px solid
            rgba(255,255,255,.055);
        }

        .challengeIcon {
          width: 45px;
          height: 45px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background:
            rgba(168,85,247,.13);
          font-size: 22px;
        }

        .challengeContent {
          flex: 1;
          min-width: 0;
        }

        .challengeHeader {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .pointsBadge {
          color: #fbbf24;
          font-weight: 900;
          white-space: nowrap;
        }

        .challengeContent p {
          margin: 6px 0;
          font-size: 12px;
        }

        .challengeContent > small {
          color: #7e8b99;
          font-size: 9px;
        }

        .challengeActions {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 7px;
          margin-top: 10px;
        }

        .challengeActions select {
          margin: 0;
        }

        .deleteSmall {
          width: 42px;
          border-radius: 12px;
          background:
            rgba(239,68,68,.10);
          color: #fca5a5;
        }

        .completed {
          margin-top: 9px;
          padding: 9px;
          border-radius: 10px;
          background:
            rgba(34,197,94,.10);
          color: #86efac;
          font-size: 11px;
          font-weight: 800;
        }

        .rankingHero {
          text-align: center;
          padding: 30px 20px;
          margin-bottom: 15px;
          border-radius: 25px;
          background:
            radial-gradient(
              circle at center,
              rgba(245,158,11,.18),
              rgba(255,255,255,.03)
            );
          border: 1px solid
            rgba(245,158,11,.12);
        }

        .trophy {
          font-size: 65px;
          animation:
            trophyFloat 2.4s
            ease-in-out
            infinite;
        }

        .rankingHero h2 {
          font-size: 28px;
          margin-top: 5px;
        }

        .rankingHero p {
          margin-bottom: 0;
        }

        .rankingItem {
          display: grid;
          grid-template-columns:
            50px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 14px;
          margin-top: 8px;
          border-radius: 16px;
          background:
            rgba(255,255,255,.045);
        }

        .rankingItem.podium {
          background:
            linear-gradient(
              90deg,
              rgba(245,158,11,.12),
              rgba(255,255,255,.045)
            );
        }

        .rankNumber {
          font-size: 22px;
          text-align: center;
        }

        .rankPerson b,
        .rankPerson small {
          display: block;
        }

        .rankPerson small {
          color: #8995a3;
          margin-top: 3px;
          font-size: 10px;
        }

        .rankPoints {
          text-align: right;
        }

        .rankPoints strong {
          color: #fbbf24;
          font-size: 20px;
        }

        .rankPoints small {
          display: block;
          color: #737f8d;
          font-size: 9px;
        }

        .titleGrid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 8px;
        }

        .titleCard {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 12px;
          border-radius: 13px;
          background:
            rgba(255,255,255,.045);
        }

        .titleCard span {
          font-size: 23px;
        }

        .titleCard b {
          font-size: 11px;
        }

        .message {
          position: fixed;
          z-index: 1000;
          left: 50%;
          bottom: 20px;
          transform:
            translateX(-50%);
          width:
            min(
              calc(100% - 30px),
              600px
            );
          padding: 14px 17px;
          border-radius: 15px;
          background:
            rgba(17,25,34,.96);
          border: 1px solid
            rgba(245,158,11,.25);
          color: #fbbf24;
          box-shadow:
            0 20px 60px
            rgba(0,0,0,.45);
          backdrop-filter:
            blur(15px);
          text-align: center;
          font-weight: 800;
          font-size: 13px;
        }

        .loading {
          position: fixed;
          z-index: 999;
          top: 15px;
          left: 50%;
          transform:
            translateX(-50%);
          padding: 9px 14px;
          border-radius: 12px;
          background:
            rgba(17,25,34,.95);
          color: #fbbf24;
          font-size: 11px;
        }

        .empty {
          text-align: center;
          padding: 25px 10px;
          color: #687585;
          font-size: 13px;
        }

        footer {
          text-align: center;
          color: #53606e;
          padding: 30px 10px 10px;
        }

        footer div {
          font-size: 30px;
          margin-bottom: 8px;
        }

        footer b,
        footer small {
          display: block;
        }

        footer small {
          margin-top: 4px;
          font-size: 10px;
        }

        /* ====================================================
           PROST ANIMATION
           ==================================================== */

        .animationOverlay {
          position: fixed;
          inset: 0;
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          background:
            rgba(0,0,0,.18);
          animation:
            overlayFade 2.3s
            ease forwards;
        }

        .beerClash {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 35px;
          animation:
            beerClash 1.7s
            cubic-bezier(.2,.8,.2,1)
            forwards;
        }

        .beer {
          font-size: 80px;
          filter:
            drop-shadow(
              0 10px 20px
              rgba(0,0,0,.35)
            );
        }

        .beerLeft {
          transform:
            rotate(-18deg);
        }

        .beerRight {
          transform:
            rotate(18deg);
        }

        .prostText {
          position: absolute;
          top: 105px;
          left: 50%;
          transform:
            translateX(-50%)
            scale(.4);
          white-space: nowrap;
          font-size: 48px;
          font-weight: 1000;
          color: #fbbf24;
          text-shadow:
            0 4px 0 #7c4a03,
            0 10px 30px
            rgba(0,0,0,.5);
          animation:
            prostText .7s
            .55s
            ease forwards;
        }

        .spark {
          position: absolute;
          font-size: 30px;
          opacity: 0;
          animation:
            spark .9s
            .6s
            ease forwards;
        }

        .spark1 {
          left: 38%;
          top: 39%;
        }

        .spark2 {
          right: 38%;
          top: 45%;
        }

        .spark3 {
          left: 50%;
          top: 34%;
        }

        /* ====================================================
           MONEY ANIMATION
           ==================================================== */

        .moneyOverlay {
          position: fixed;
          inset: 0;
          z-index: 5000;
          overflow: hidden;
          pointer-events: none;
          background:
            rgba(0,0,0,.08);
          animation:
            overlayFade 2.3s
            ease forwards;
        }

        .money {
          position: absolute;
          top: -70px;
          font-size: 35px;
          animation:
            moneyFall 1.8s
            linear
            forwards;
        }

        .moneyText {
          position: absolute;
          left: 50%;
          top: 45%;
          transform:
            translate(-50%,-50%)
            scale(.3);
          white-space: nowrap;
          font-size: 46px;
          font-weight: 1000;
          color: #4ade80;
          text-shadow:
            0 4px 0 #166534,
            0 10px 35px
            rgba(0,0,0,.6);
          animation:
            moneyText .8s
            .35s
            ease forwards;
        }

        @keyframes beerClash {

          0% {
            transform:
              scale(.4)
              translateX(-100px);
          }

          35% {
            transform:
              scale(1.05)
              translateX(0);
          }

          55% {
            transform:
              scale(1.12);
          }

          100% {
            transform:
              scale(.95)
              translateY(-20px);
          }
        }

        @keyframes prostText {

          0% {
            opacity: 0;
            transform:
              translateX(-50%)
              scale(.3)
              rotate(-8deg);
          }

          60% {
            opacity: 1;
            transform:
              translateX(-50%)
              scale(1.15)
              rotate(2deg);
          }

          100% {
            opacity: 1;
            transform:
              translateX(-50%)
              scale(1);
          }
        }

        @keyframes spark {

          0% {
            opacity: 0;
            transform:
              scale(.2)
              rotate(0);
          }

          50% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform:
              scale(1.8)
              rotate(90deg)
              translateY(-25px);
          }
        }

        @keyframes overlayFade {

          0% {
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          80% {
            opacity: 1;
          }

          100% {
            opacity: 0;
          }
        }

        @keyframes moneyFall {

          0% {
            transform:
              translateY(-80px)
              rotate(0deg);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          100% {
            transform:
              translateY(
                115vh
              )
              rotate(
                720deg
              );
            opacity: 0;
          }
        }

        @keyframes moneyText {

          0% {
            opacity: 0;
            transform:
              translate(-50%,-50%)
              scale(.3)
              rotate(-8deg);
          }

          60% {
            opacity: 1;
            transform:
              translate(-50%,-50%)
              scale(1.12)
              rotate(2deg);
          }

          100% {
            opacity: 1;
            transform:
              translate(-50%,-50%)
              scale(1);
          }
        }

        @keyframes trophyFloat {

          0%,
          100% {
            transform:
              translateY(0)
              rotate(-3deg);
          }

          50% {
            transform:
              translateY(-9px)
              rotate(3deg);
          }
        }

        @media (
          max-width: 650px
        ) {

          .app {
            padding:
              10px
              10px
              40px;
          }

          .hero {
            padding:
              10px
              3px
              20px;
          }

          .heroLogo {
            width: 58px;
            height: 58px;
            font-size: 30px;
            border-radius: 18px;
          }

          h1 {
            font-size: 29px;
          }

          .hero p {
            font-size: 11px;
          }

          .glassCard {
            padding: 15px;
            border-radius: 20px;
          }

          .statsGrid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .tabs button {
            font-size: 9px;
            padding:
              10px
              2px;
          }

          .two,
          .three {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .inputRow {
            grid-template-columns: 1fr;
          }

          .inputRow button {
            width: 100%;
          }

          .person {
            grid-template-columns:
              40px 1fr auto;
          }

          .person .iconButton {
            grid-column: 3;
            grid-row: 1;
          }

          .personPoints {
            grid-column: 2;
            text-align: left;
          }

          .assignment {
            grid-template-columns:
              1fr;
          }

          .paymentSummary {
            grid-template-columns:
              1fr;
          }

          .templateGrid {
            grid-template-columns:
              1fr;
          }

          .titleGrid {
            grid-template-columns:
              1fr;
          }

          .beer {
            font-size: 65px;
          }

          .beerClash {
            gap: 20px;
          }

          .prostText {
            font-size: 39px;
            top: 95px;
          }

          .moneyText {
            font-size: 35px;
          }

        }

      `}</style>
    </main>
  );
}
