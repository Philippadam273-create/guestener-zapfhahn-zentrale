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
};

type Profile = {
  id: string;
  username: string;
  points: number;
  drinks_count: number;
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
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
  foto?: string | null;

  promille_wert?: number | null;
};

type ChallengeCategory = {
  id: string;
  name: string;
  emoji?: string | null;
  description?: string | null;
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

type ChallengeVote = {
  id: string;
  challenge_id: string;
  voter_profile_id: string;
  target_profile_id?: string | null;
  vote: string;
  comment?: string | null;
  created_at?: string | null;
};

type RankingTitle = {
  title: string;
  emoji?: string | null;
  description?: string | null;
};

type ChallengeParticipant = {
  id: string;
  challenge_id: string;
  profile_id: string;
  joined_at?: string;
  accepted: boolean;
  completed: boolean;
  points_awarded: number;
};

type MessageType = "success" | "error" | "info";

type Message = {
  type: MessageType;
  text: string;
};


/* ============================================================
   HAUPTKOMPONENTE
============================================================ */

export default function Home() {
  /* ----------------------------------------------------------
     EVENTS
  ---------------------------------------------------------- */

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  /* ----------------------------------------------------------
     PROFILE / TEILNEHMER
  ---------------------------------------------------------- */

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");

  const [newProfileName, setNewProfileName] = useState("");

  /* ----------------------------------------------------------
     GETRÄNKE
  ---------------------------------------------------------- */

  const [drinks, setDrinks] = useState<Drink[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] = useState("Bier");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");
  const [drinkQuantity, setDrinkQuantity] = useState("1");

  /* ----------------------------------------------------------
     CHALLENGE
  ---------------------------------------------------------- */

  const [challengeCategories, setChallengeCategories] = useState<
    ChallengeCategory[]
  >([]);

  const [challengeTemplates, setChallengeTemplates] = useState<
    ChallengeTemplate[]
  >([]);

  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [challengeParticipants, setChallengeParticipants] = useState<
    ChallengeParticipant[]
  >([]);

  const [challengeVotes, setChallengeVotes] = useState<ChallengeVote[]>([]);

  const [selectedChallengeCategory, setSelectedChallengeCategory] =
    useState("");

  const [selectedChallengeTemplate, setSelectedChallengeTemplate] =
    useState("");

  const [customChallengeTitle, setCustomChallengeTitle] = useState("");

  const [customChallengeDescription, setCustomChallengeDescription] =
    useState("");

  const [customChallengePoints, setCustomChallengePoints] =
    useState("10");

  const [selectedChallengeId, setSelectedChallengeId] = useState("");

  const [challengeTargetProfile, setChallengeTargetProfile] = useState("");

  const [challengeVote, setChallengeVote] = useState("");

  const [challengeVoteComment, setChallengeVoteComment] = useState("");

  /* ----------------------------------------------------------
     UI
  ---------------------------------------------------------- */

  const [activeTab, setActiveTab] = useState<
    "overview" | "drinks" | "challenges" | "ranking"
  >("overview");

  const [showCreateChallenge, setShowCreateChallenge] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<Message | null>(null);


  /* ==========================================================
     HILFSFUNKTIONEN
  ========================================================== */

  function showMessage(
    text: string,
    type: MessageType = "info"
  ) {
    setMessage({
      text,
      type,
    });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
  }


  function formatEuro(value: number) {
    return `${value.toFixed(2)} €`;
  }


  function getDrinkName(drink: Drink) {
    return (
      drink.drink_name ||
      drink.getraenk ||
      "Unbekanntes Getränk"
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
    if (!profileId) {
      return "Niemand";
    }

    const profile = profiles.find(
      (p) => p.id === profileId
    );

    return profile?.username || "Unbekannt";
  }


  function getChallengeCategoryEmoji(
    category?: string | null
  ) {
    const found = challengeCategories.find(
      (c) => c.name === category
    );

    return found?.emoji || "🎯";
  }


  function getChallengePoints(
    challenge: Challenge
  ) {
    return Number(
      challenge.points || 0
    );
  }


  /* ==========================================================
     EVENTS LADEN
  ========================================================== */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      showMessage(
        "Events konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    if (data) {
      setEvents(data);

      if (
        !eventId &&
        data.length > 0
      ) {
        setEventId(data[0].id);
      }
    }
  }


  /* ==========================================================
     PROFILE LADEN
  ========================================================== */

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,username,points,drinks_count,weight_kg,height_cm,age,gender"
      )
      .order(
        "points",
        {
          ascending: false,
        }
      );

    if (error) {
      showMessage(
        "Teilnehmer konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    setProfiles(
      data || []
    );

    if (
      !selectedProfileId &&
      data &&
      data.length > 0
    ) {
      setSelectedProfileId(
        data[0].id
      );
    }
  }


  /* ==========================================================
     GETRÄNKE LADEN
  ========================================================== */

  async function loadDrinks() {
    if (!eventId) {
      setDrinks([]);
      return;
    }

    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq(
        "event_id",
        eventId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      showMessage(
        "Getränke konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    setDrinks(
      data || []
    );
  }


  /* ==========================================================
     CHALLENGE-KATEGORIEN LADEN
  ========================================================== */

  async function loadChallengeCategories() {
    const { data, error } = await supabase
      .from("challenge_categories")
      .select(
        "id,name,emoji,description"
      )
      .order(
        "name",
        {
          ascending: true,
        }
      );

    if (error) {
      showMessage(
        "Challenge-Kategorien konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    setChallengeCategories(
      data || []
    );
  }


  /* ==========================================================
     CHALLENGE-VORLAGEN LADEN
  ========================================================== */

  async function loadChallengeTemplates() {
    const { data, error } = await supabase
      .from("challenge_templates")
      .select("*")
      .eq(
        "is_active",
        true
      )
      .order(
        "title",
        {
          ascending: true,
        }
      );

    if (error) {
      showMessage(
        "Challenge-Vorlagen konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    setChallengeTemplates(
      data || []
    );
  }


  /* ==========================================================
     CHALLENGES LADEN
  ========================================================== */

  async function loadChallenges() {
    if (!eventId) {
      setChallenges([]);
      return;
    }

    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq(
        "event_id",
        eventId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      showMessage(
        "Challenges konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    setChallenges(
      data || []
    );
  }


  /* ==========================================================
     CHALLENGE-TEILNEHMER LADEN
  ========================================================== */

  async function loadChallengeParticipants() {
    if (
      challenges.length === 0
    ) {
      setChallengeParticipants([]);
      return;
    }

    const ids =
      challenges.map(
        (c) => c.id
      );

    const { data, error } = await supabase
      .from("challenge_participants")
      .select("*")
      .in(
        "challenge_id",
        ids
      );

    if (error) {
      showMessage(
        "Challenge-Teilnehmer konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    setChallengeParticipants(
      data || []
    );
  }


  /* ==========================================================
     VOTES LADEN
  ========================================================== */

  async function loadChallengeVotes() {
    if (
      challenges.length === 0
    ) {
      setChallengeVotes([]);
      return;
    }

    const ids =
      challenges.map(
        (c) => c.id
      );

    const { data, error } = await supabase
      .from("challenge_votes")
      .select("*")
      .in(
        "challenge_id",
        ids
      );

    if (error) {
      showMessage(
        "Abstimmungen konnten nicht geladen werden: " +
          error.message,
        "error"
      );
      return;
    }

    setChallengeVotes(
      data || []
    );
  }


  /* ==========================================================
     ALLES LADEN
  ========================================================== */

  async function loadAll() {
    setLoading(true);

    await loadEvents();
    await loadProfiles();
    await loadChallengeCategories();
    await loadChallengeTemplates();

    setLoading(false);
  }


  /* ==========================================================
     INITIALISIERUNG
  ========================================================== */

  useEffect(() => {
    loadAll();
  }, []);


  /* ==========================================================
     EVENT-WECHSEL
  ========================================================== */

  useEffect(() => {
    if (!eventId) {
      return;
    }

    loadDrinks();
    loadChallenges();
  }, [eventId]);


  /* ==========================================================
     CHALLENGE-DATEN NACH CHALLENGE-LADEN
  ========================================================== */

  useEffect(() => {
    loadChallengeParticipants();
    loadChallengeVotes();
  }, [challenges]);


  /* ==========================================================
     GETRÄNK SPEICHERN
  ========================================================== */

  async function saveDrink() {
    if (!eventId) {
      showMessage(
        "Bitte zuerst ein Event auswählen.",
        "error"
      );
      return;
    }

    if (!drinkName.trim()) {
      showMessage(
        "Bitte ein Getränk eingeben.",
        "error"
      );
      return;
    }

    setLoading(true);

    const quantity =
      Math.max(
        1,
        Number(drinkQuantity) || 1
      );

    const liters =
      Number(drinkLiters) || 0;

    const alcohol =
      Number(drinkAlcohol) || 0;

    const price =
      Number(drinkPrice) || 0;

    const { error } = await supabase
      .from("drinks")
      .insert({
        event_id: eventId,
        profile_id:
          selectedProfileId || null,

        category:
          drinkCategory,

        drink_name:
          drinkName.trim(),

        brand:
          drinkBrand.trim() || null,

        liters,

        alcohol_percent:
          alcohol,

        quantity,

        comment:
          null,

        getraenk:
          drinkName.trim(),

        menge:
          liters,

        alkohol:
          alcohol,

        preis:
          price,

        marke:
          drinkBrand.trim() || null,
      });

    setLoading(false);

    if (error) {
      showMessage(
        "Getränk konnte nicht gespeichert werden: " +
          error.message,
        "error"
      );
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");
    setDrinkQuantity("1");

    await loadDrinks();

    showMessage(
      "🍻 Getränk erfolgreich gespeichert!",
      "success"
    );
  }


  /* ==========================================================
     TEILNEHMER ERSTELLEN
  ========================================================== */

  async function createProfile() {
    const username =
      newProfileName.trim();

    if (!username) {
      showMessage(
        "Bitte einen Namen eingeben.",
        "error"
      );
      return;
    }

    const alreadyExists =
      profiles.some(
        (profile) =>
          profile.username.toLowerCase() ===
          username.toLowerCase()
      );

    if (alreadyExists) {
      showMessage(
        "Dieser Teilnehmer existiert bereits.",
        "error"
      );
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        username,
        points: 0,
        drinks_count: 0,
        role: "member",
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      showMessage(
        "Teilnehmer konnte nicht erstellt werden: " +
          error.message,
        "error"
      );
      return;
    }

    if (data) {
      setProfiles(
        (current) => [
          ...current,
          data,
        ]
      );

      setSelectedProfileId(
        data.id
      );
    }

    setNewProfileName("");

    showMessage(
      "👤 Teilnehmer hinzugefügt!",
      "success"
    );
  }


  /* ==========================================================
     CHALLENGE ERSTELLEN
  ========================================================== */

  async function createChallenge() {
    if (!eventId) {
      showMessage(
        "Bitte zuerst ein Event auswählen.",
        "error"
      );
      return;
    }

    let title =
      customChallengeTitle.trim();

    let description =
      customChallengeDescription.trim();

    let category =
      "Quatsch";

    let points =
      Number(customChallengePoints) || 10;

    let requiresVote =
      false;

    let requiredVotes =
      1;

    /* --------------------------------------------------------
       Vorlage verwenden
    -------------------------------------------------------- */

    if (
      selectedChallengeTemplate
    ) {
      const template =
        challengeTemplates.find(
          (item) =>
            item.id ===
            selectedChallengeTemplate
        );

      if (template) {
        title =
          template.title;

        description =
          template.description || "";

        category =
          template.category ||
          "Quatsch";

        points =
          Number(
            template.default_points || 10
          );

        requiresVote =
          Boolean(
            template.requires_vote
          );

        requiredVotes =
          Number(
            template.minimum_votes || 1
          );
      }
    }

    /* --------------------------------------------------------
       Kategorie verwenden
    -------------------------------------------------------- */

    if (
      selectedChallengeCategory
    ) {
      const categoryRecord =
        challengeCategories.find(
          (item) =>
            item.id ===
            selectedChallengeCategory
        );

      if (categoryRecord) {
        category =
          categoryRecord.name;
      }
    }

    if (!title) {
      showMessage(
        "Bitte einen Challenge-Titel eingeben oder eine Vorlage auswählen.",
        "error"
      );
      return;
    }

    if (
      points <= 0
    ) {
      points = 10;
    }

    /* --------------------------------------------------------
       Abstimmungskategorie
    -------------------------------------------------------- */

    if (
      category === "Abstimmung"
    ) {
      requiresVote = true;

      if (
        requiredVotes < 2
      ) {
        requiredVotes = 2;
      }
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("challenges")
      .insert({
        event_id:
          eventId,

        title,

        description:
          description || null,

        points,

        category,

        status:
          "open",

        created_by_profile_id:
          selectedProfileId ||
          null,

        required_votes:
          requiresVote
            ? requiredVotes
            : 1,

        is_active:
          true,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      showMessage(
        "Challenge konnte nicht erstellt werden: " +
          error.message,
        "error"
      );
      return;
    }

    /* --------------------------------------------------------
       Zielperson direkt hinzufügen
    -------------------------------------------------------- */

    if (
      data &&
      challengeTargetProfile
    ) {
      await supabase
        .from(
          "challenge_participants"
        )
        .insert({
          challenge_id:
            data.id,

          profile_id:
            challengeTargetProfile,

          accepted:
            true,

          completed:
            false,

          points_awarded:
            0,
        });
    }

    setCustomChallengeTitle("");
    setCustomChallengeDescription("");
    setCustomChallengePoints("10");
    setSelectedChallengeTemplate("");
    setChallengeTargetProfile("");

    await loadChallenges();

    setShowCreateChallenge(false);

    showMessage(
      "🎯 Challenge erstellt!",
      "success"
    );
  }


  /* ==========================================================
     TEILNEHMER ZU CHALLENGE HINZUFÜGEN
  ========================================================== */

  async function addChallengeParticipant(
    challengeId: string,
    profileId: string
  ) {
    if (!profileId) {
      return;
    }

    const alreadyExists =
      challengeParticipants.some(
        (item) =>
          item.challenge_id ===
            challengeId &&
          item.profile_id ===
            profileId
      );

    if (alreadyExists) {
      showMessage(
        "Dieser Teilnehmer ist bereits bei der Challenge.",
        "error"
      );
      return;
    }

    const { error } = await supabase
      .from(
        "challenge_participants"
      )
      .insert({
        challenge_id:
          challengeId,

        profile_id:
          profileId,

        accepted:
          true,

        completed:
          false,

        points_awarded:
          0,
      });

    if (error) {
      showMessage(
        "Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message,
        "error"
      );
      return;
    }

    await loadChallengeParticipants();

    showMessage(
      "👥 Teilnehmer zur Challenge hinzugefügt.",
      "success"
    );
  }


  /* ==========================================================
     ABSTIMMEN
  ========================================================== */

  async function submitChallengeVote(
    challenge: Challenge
  ) {
    if (!selectedProfileId) {
      showMessage(
        "Bitte zuerst deinen Teilnehmer auswählen.",
        "error"
      );
      return;
    }

    if (!challengeVote) {
      showMessage(
        "Bitte eine Stimme auswählen.",
        "error"
      );
      return;
    }

    /* --------------------------------------------------------
       Prüfen ob schon abgestimmt
    -------------------------------------------------------- */

    const existingVote =
      challengeVotes.find(
        (vote) =>
          vote.challenge_id ===
            challenge.id &&
          vote.voter_profile_id ===
            selectedProfileId
      );

    if (existingVote) {
      showMessage(
        "Du hast bei dieser Challenge bereits abgestimmt.",
        "error"
      );
      return;
    }

    const { error } = await supabase
      .from(
        "challenge_votes"
      )
      .insert({
        challenge_id:
          challenge.id,

        voter_profile_id:
          selectedProfileId,

        target_profile_id:
          challengeTargetProfile ||
          null,

        vote:
          challengeVote,

        comment:
          challengeVoteComment.trim() ||
          null,
      });

    if (error) {
      showMessage(
        "Abstimmung konnte nicht gespeichert werden: " +
          error.message,
        "error"
      );
      return;
    }

    setChallengeVote("");
    setChallengeVoteComment("");

    await loadChallengeVotes();

    showMessage(
      "🗳️ Deine Stimme wurde gespeichert!",
      "success"
    );
  }


  /* ==========================================================
     CHALLENGE ABSCHLIESSEN
  ========================================================== */

  async function completeChallenge(
    challenge: Challenge
  ) {
    if (!selectedProfileId) {
      showMessage(
        "Bitte zuerst deinen Teilnehmer auswählen.",
        "error"
      );
      return;
    }

    setLoading(true);

    const { data, error } =
      await supabase.rpc(
        "complete_challenge",
        {
          input_challenge_id:
            challenge.id,

          input_profile_id:
            selectedProfileId,
        }
      );

    setLoading(false);

    if (error) {
      showMessage(
        "Challenge konnte nicht abgeschlossen werden: " +
          error.message,
        "error"
      );
      return;
    }

    if (
      data &&
      data.length > 0
    ) {
      const result =
        data[0];

      if (
        result.success
      ) {
        showMessage(
          `🏆 ${result.message} +${result.points_awarded} Punkte!`,
          "success"
        );
      } else {
        showMessage(
          result.message ||
            "Challenge konnte nicht abgeschlossen werden.",
          "info"
        );
      }
    }

    await loadProfiles();
    await loadChallenges();
    await loadChallengeParticipants();
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

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("challenge_votes")
      .delete()
      .eq(
        "challenge_id",
        challengeId
      );

    if (error) {
      showMessage(
        "Abstimmungen konnten nicht gelöscht werden: " +
          error.message,
        "error"
      );
      return;
    }

    await supabase
      .from(
        "challenge_participants"
      )
      .delete()
      .eq(
        "challenge_id",
        challengeId
      );

    const result =
      await supabase
        .from("challenges")
        .delete()
        .eq(
          "id",
          challengeId
        );

    if (result.error) {
      showMessage(
        "Challenge konnte nicht gelöscht werden: " +
          result.error.message,
        "error"
      );
      return;
    }

    await loadChallenges();

    showMessage(
      "Challenge gelöscht.",
      "success"
    );
  }


  /* ==========================================================
     BERECHNUNGEN
  ========================================================== */

  const currentEvent =
    events.find(
      (event) =>
        event.id === eventId
    );

  const totalLiters =
    drinks.reduce(
      (
        total,
        drink
      ) =>
        total +
        getDrinkLiters(drink) *
          Number(
            drink.quantity || 1
          ),
      0
    );

  const totalCost =
    drinks.reduce(
      (
        total,
        drink
      ) =>
        total +
        getDrinkPrice(drink) *
          Number(
            drink.quantity || 1
          ),
      0
    );

  const totalDrinks =
    drinks.reduce(
      (
        total,
        drink
      ) =>
        total +
        Number(
          drink.quantity || 1
        ),
      0
    );

  const costPerPerson =
    profiles.length > 0
      ? totalCost /
        profiles.length
      : 0;

  const totalPoints =
    profiles.reduce(
      (
        total,
        profile
      ) =>
        total +
        Number(
          profile.points || 0
        ),
      0
    );

  const ranking =
    useMemo(
      () =>
        [...profiles].sort(
          (
            a,
            b
          ) =>
            Number(
              b.points || 0
            ) -
            Number(
              a.points || 0
            )
        ),
      [profiles]
    );

  const activeChallenges =
    challenges.filter(
      (challenge) =>
        challenge.status !==
          "completed" &&
        challenge.is_active !==
          false
    );

  const completedChallenges =
    challenges.filter(
      (challenge) =>
        challenge.status ===
        "completed"
    );


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="app">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="topbar">

        <div className="brand">

          <div className="brandIcon">
            🍻
          </div>

          <div>
            <h1>
              Güstener
              <span>
                Zapfhahn
              </span>
              Zentrale
            </h1>

            <p>
              Getränke · Challenges · Chaos · Punkte
            </p>
          </div>

        </div>

        <button
          className="refreshButton"
          onClick={loadAll}
        >
          🔄
        </button>

      </header>


      {/* =====================================================
          EVENT AUSWAHL
      ===================================================== */}

      <section className="eventBar">

        <div>

          <span className="miniLabel">
            AKTUELLES EVENT
          </span>

          <select
            value={eventId}
            onChange={(event) =>
              setEventId(
                event.target.value
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

        </div>

        {currentEvent && (
          <div className="eventInfo">

            {currentEvent.location && (
              <span>
                📍{" "}
                {currentEvent.location}
              </span>
            )}

            {currentEvent.invite_code && (
              <span>
                🔑{" "}
                {currentEvent.invite_code}
              </span>
            )}

          </div>
        )}

      </section>


      {/* =====================================================
          AKTIVER TEILNEHMER
      ===================================================== */}

      <section className="playerBar">

        <div>
          <span className="miniLabel">
            DU BIST
          </span>

          <select
            value={
              selectedProfileId
            }
            onChange={(event) =>
              setSelectedProfileId(
                event.target.value
              )
            }
          >

            <option value="">
              Teilnehmer auswählen
            </option>

            {profiles.map(
              (profile) => (
                <option
                  key={profile.id}
                  value={profile.id}
                >
                  {profile.username}
                </option>
              )
            )}

          </select>
        </div>

        <div className="playerPoints">

          <span>
            🏆 Punkte
          </span>

          <strong>
            {
              profiles.find(
                (profile) =>
                  profile.id ===
                  selectedProfileId
              )?.points || 0
            }
          </strong>

        </div>

      </section>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

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
          🏠
          <span>
            Start
          </span>
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
          🍺
          <span>
            Getränke
          </span>
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
          🎯
          <span>
            Challenges
          </span>

          {activeChallenges.length >
            0 && (
            <b className="tabBadge">
              {activeChallenges.length}
            </b>
          )}

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
          🏆
          <span>
            Ranking
          </span>
        </button>

      </nav>


      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message && (
        <div
          className={
            "message " +
            message.type
          }
        >
          {message.type ===
            "success" && "✅ "}

          {message.type ===
            "error" && "❌ "}

          {message.type ===
            "info" && "ℹ️ "}

          {message.text}
        </div>
      )}


      {/* =====================================================
          OVERVIEW
      ===================================================== */}

      {activeTab ===
        "overview" && (
        <>

          <section className="hero">

            <div className="heroEmoji">
              🍻
            </div>

            <div>

              <h2>
                Bereit für
                den Abriss?
              </h2>

              <p>
                Getränke sammeln,
                Challenges gewinnen
                und im Ranking nach
                ganz oben klettern.
              </p>

            </div>

          </section>


          {/* STATS */}

          <section className="statsGrid">

            <div className="statCard">

              <span>
                🍺
              </span>

              <strong>
                {totalDrinks}
              </strong>

              <small>
                Getränke
              </small>

            </div>

            <div className="statCard">

              <span>
                💧
              </span>

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

              <span>
                💶
              </span>

              <strong>
                {formatEuro(
                  totalCost
                )}
              </strong>

              <small>
                Kosten
              </small>

            </div>

            <div className="statCard">

              <span>
                👥
              </span>

              <strong>
                {profiles.length}
              </strong>

              <small>
                Teilnehmer
              </small>

            </div>

          </section>


          {/* TEILNEHMER */}

          <section className="card">

            <div className="sectionHeader">

              <div>
                <h2>
                  👥 Teilnehmer
                </h2>

                <p>
                  Wer ist heute dabei?
                </p>
              </div>

            </div>

            <div className="addPlayer">

              <input
                value={
                  newProfileName
                }
                onChange={(event) =>
                  setNewProfileName(
                    event.target.value
                  )
                }
                placeholder="Name eingeben..."
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    createProfile();
                  }
                }}
              />

              <button
                onClick={
                  createProfile
                }
              >
                ➕ Hinzufügen
              </button>

            </div>

            <div className="playerList">

              {ranking.map(
                (
                  profile,
                  index
                ) => (

                  <div
                    className="playerRow"
                    key={
                      profile.id
                    }
                  >

                    <div className="rankNumber">

                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `${index + 1}.`}

                    </div>

                    <div className="playerAvatar">
                      👤
                    </div>

                    <div className="playerName">

                      <strong>
                        {
                          profile.username
                        }
                      </strong>

                      <small>
                        🍺{" "}
                        {
                          profile.drinks_count ||
                          0
                        }{" "}
                        Getränke
                      </small>

                    </div>

                    <div className="points">
                      🏆{" "}
                      {
                        profile.points ||
                        0
                      }
                    </div>

                  </div>

                )
              )}

              {profiles.length ===
                0 && (
                <div className="empty">
                  👥 Noch keine
                  Teilnehmer.
                </div>
              )}

            </div>

          </section>


          {/* CHALLENGE TEASER */}

          <section className="challengeHero">

            <div>

              <span className="challengeEyebrow">
                🎯 NEUE CHALLENGE
              </span>

              <h2>
                Wer traut sich?
              </h2>

              <p>
                Lustige Aufgaben,
                Duelle und
                Abstimmungen.
              </p>

            </div>

            <button
              onClick={() => {
                setActiveTab(
                  "challenges"
                );
                setShowCreateChallenge(
                  true
                );
              }}
            >
              Challenge starten 🚀
            </button>

          </section>


          {/* KOSTEN */}

          <section className="card">

            <div className="sectionHeader">

              <div>
                <h2>
                  💶 Kosten
                </h2>

                <p>
                  Überblick über den
                  Abend.
                </p>
              </div>

              <strong className="bigMoney">
                {formatEuro(
                  totalCost
                )}
              </strong>

            </div>

            <div className="costRow">

              <span>
                👥 Teilnehmer
              </span>

              <strong>
                {profiles.length}
              </strong>

            </div>

            <div className="costRow">

              <span>
                💶 Pro Person
              </span>

              <strong>
                {formatEuro(
                  costPerPerson
                )}
              </strong>

            </div>

            <div className="costRow">

              <span>
                🏆 Gesamtpunkte
              </span>

              <strong>
                {totalPoints}
              </strong>

            </div>

          </section>

        </>
      )}


      {/* =====================================================
          GETRÄNKE
      ===================================================== */}

      {activeTab ===
        "drinks" && (
        <>

          <section className="card">

            <div className="sectionHeader">

              <div>
                <h2>
                  🍺 Getränk
                  hinzufügen
                </h2>

                <p>
                  Was wurde gerade
                  vernichtet?
                </p>
              </div>

            </div>

            <input
              value={drinkName}
              onChange={(event) =>
                setDrinkName(
                  event.target.value
                )
              }
              placeholder="Getränk, z.B. Pils"
            />

            <div className="formGrid">

              <input
                value={drinkBrand}
                onChange={(event) =>
                  setDrinkBrand(
                    event.target.value
                  )
                }
                placeholder="Marke"
              />

              <select
                value={
                  drinkCategory
                }
                onChange={(event) =>
                  setDrinkCategory(
                    event.target.value
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
                  Cocktail
                </option>

                <option>
                  Longdrink
                </option>

                <option>
                  Schnaps
                </option>

                <option>
                  Softdrink
                </option>

                <option>
                  Sonstiges
                </option>

              </select>

            </div>

            <div className="formGrid four">

              <input
                type="number"
                step="0.1"
                value={
                  drinkLiters
                }
                onChange={(event) =>
                  setDrinkLiters(
                    event.target.value
                  )
                }
                placeholder="Liter"
              />

              <input
                type="number"
                step="0.1"
                value={
                  drinkAlcohol
                }
                onChange={(event) =>
                  setDrinkAlcohol(
                    event.target.value
                  )
                }
                placeholder="% Alkohol"
              />

              <input
                type="number"
                step="0.01"
                value={
                  drinkPrice
                }
                onChange={(event) =>
                  setDrinkPrice(
                    event.target.value
                  )
                }
                placeholder="Preis €"
              />

              <input
                type="number"
                min="1"
                value={
                  drinkQuantity
                }
                onChange={(event) =>
                  setDrinkQuantity(
                    event.target.value
                  )
                }
                placeholder="Anzahl"
              />

            </div>

            <button
              className="primaryButton full"
              onClick={
                saveDrink
              }
              disabled={loading}
            >
              🍻 Getränk speichern
            </button>

          </section>


          <section className="card">

            <div className="sectionHeader">

              <div>
                <h2>
                  🍺 Getränke
                </h2>

                <p>
                  Alles, was heute
                  vernichtet wurde.
                </p>
              </div>

              <strong>
                {totalDrinks}
              </strong>

            </div>

            <div className="drinkList">

              {drinks.map(
                (drink) => (

                  <div
                    className="drinkRow"
                    key={
                      drink.id
                    }
                  >

                    <div className="drinkIcon">
                      {drinkCategoryEmoji(
                        drink.category
                      )}
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
                          ""}

                        {" · "}

                        {getDrinkLiters(
                          drink
                        ).toFixed(
                          1
                        )}{" "}
                        L

                        {" · "}

                        {getDrinkAlcohol(
                          drink
                        ).toFixed(
                          1
                        )}
                        %

                      </small>

                    </div>

                    <strong>
                      {formatEuro(
                        getDrinkPrice(
                          drink
                        )
                      )}
                    </strong>

                  </div>

                )
              )}

              {drinks.length ===
                0 && (
                <div className="empty">
                  🍺 Noch keine
                  Getränke eingetragen.
                </div>
              )}

            </div>

          </section>

        </>
      )}


      {/* =====================================================
          CHALLENGES
      ===================================================== */}

      {activeTab ===
        "challenges" && (
        <>

          <section className="challengeHeader">

            <div>

              <span>
                🎯 PARTY-MODUS
              </span>

              <h2>
                Challenges
              </h2>

              <p>
                Aufgaben, Duelle,
                Abstimmungen und
                komplette Eskalation.
              </p>

            </div>

            <button
              className="primaryButton"
              onClick={() =>
                setShowCreateChallenge(
                  !showCreateChallenge
                )
              }
            >
              {showCreateChallenge
                ? "✕ Schließen"
                : "➕ Neue Challenge"}
            </button>

          </section>


          {/* CHALLENGE ERSTELLEN */}

          {showCreateChallenge && (
            <section className="card challengeCreate">

              <h2>
                🎯 Challenge erstellen
              </h2>

              <p>
                Vorlage auswählen oder
                selbst etwas völlig
                Verrücktes erfinden.
              </p>


              <label>
                Vorlage
              </label>

              <select
                value={
                  selectedChallengeTemplate
                }
                onChange={(event) =>
                  setSelectedChallengeTemplate(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Eigene Challenge
                </option>

                {challengeTemplates.map(
                  (
                    template
                  ) => (

                    <option
                      key={
                        template.id
                      }
                      value={
                        template.id
                      }
                    >
                      {template.title}
                      {" · "}
                      {
                        template.default_points ||
                        10
                      }{" "}
                      Punkte
                    </option>

                  )
                )}

              </select>


              <label>
                Kategorie
              </label>

              <div className="categoryGrid">

                {challengeCategories.map(
                  (
                    category
                  ) => (

                    <button
                      key={
                        category.id
                      }
                      className={
                        selectedChallengeCategory ===
                        category.id
                          ? "categoryButton selected"
                          : "categoryButton"
                      }
                      onClick={() =>
                        setSelectedChallengeCategory(
                          category.id
                        )
                      }
                    >

                      <span>
                        {
                          category.emoji ||
                          "🎯"
                        }
                      </span>

                      <strong>
                        {
                          category.name
                        }
                      </strong>

                    </button>

                  )
                )}

              </div>


              <label>
                Eigener Titel
              </label>

              <input
                value={
                  customChallengeTitle
                }
                onChange={(event) =>
                  setCustomChallengeTitle(
                    event.target.value
                  )
                }
                placeholder="z.B. Singe einen Schlager..."
              />


              <label>
                Beschreibung
              </label>

              <textarea
                value={
                  customChallengeDescription
                }
                onChange={(event) =>
                  setCustomChallengeDescription(
                    event.target.value
                  )
                }
                placeholder="Was muss gemacht werden?"
                rows={4}
              />


              <label>
                Punkte
              </label>

              <div className="pointsSelector">

                {[5, 10, 20, 30, 50].map(
                  (
                    point
                  ) => (

                    <button
                      key={
                        point
                      }
                      className={
                        Number(
                          customChallengePoints
                        ) ===
                        point
                          ? "selectedPoint"
                          : ""
                      }
                      onClick={() =>
                        setCustomChallengePoints(
                          String(
                            point
                          )
                        )
                      }
                    >
                      🏆{" "}
                      {point}
                    </button>

                  )
                )}

              </div>


              <label>
                Zielperson
              </label>

              <select
                value={
                  challengeTargetProfile
                }
                onChange={(event) =>
                  setChallengeTargetProfile(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Niemand festlegen
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


              <button
                className="primaryButton full"
                onClick={
                  createChallenge
                }
                disabled={
                  loading
                }
              >
                🚀 Challenge starten
              </button>

            </section>
          )}


          {/* AKTIVE CHALLENGES */}

          <section className="challengeList">

            {activeChallenges.map(
              (
                challenge
              ) => {

                const categoryEmoji =
                  getChallengeCategoryEmoji(
                    challenge.category
                  );

                const participants =
                  challengeParticipants.filter(
                    (
                      participant
                    ) =>
                      participant.challenge_id ===
                      challenge.id
                  );

                const votes =
                  challengeVotes.filter(
                    (
                      vote
                    ) =>
                      vote.challenge_id ===
                      challenge.id
                  );

                const requiredVotes =
                  Math.max(
                    1,
                    Number(
                      challenge.required_votes ||
                        1
                    )
                  );

                const votesRemaining =
                  Math.max(
                    0,
                    requiredVotes -
                      votes.length
                  );

                return (

                  <article
                    className="challengeCard"
                    key={
                      challenge.id
                    }
                  >

                    <div className="challengeTop">

                      <div className="challengeEmoji">
                        {
                          categoryEmoji
                        }
                      </div>

                      <div className="challengeMain">

                        <span className="challengeCategory">
                          {
                            challenge.category ||
                            "Challenge"
                          }
                        </span>

                        <h3>
                          {
                            challenge.title
                          }
                        </h3>

                        {challenge.description && (
                          <p>
                            {
                              challenge.description
                            }
                          </p>
                        )}

                      </div>

                      <div className="challengePoints">
                        <strong>
                          +
                          {
                            getChallengePoints(
                              challenge
                            )
                          }
                        </strong>

                        <small>
                          Punkte
                        </small>
                      </div>

                    </div>


                    {/* ZIEL */}

                    {challenge.assigned_profile_id && (
                      <div className="challengeTarget">

                        🎯 Aufgabe für:

                        <strong>
                          {" "}
                          {
                            getProfileName(
                              challenge.assigned_profile_id
                            )
                          }
                        </strong>

                      </div>
                    )}


                    {/* TEILNEHMER */}

                    <div className="challengeParticipants">

                      <strong>
                        👥 Teilnehmer
                      </strong>

                      {participants.map(
                        (
                          participant
                        ) => (

                          <div
                            className="participantMini"
                            key={
                              participant.id
                            }
                          >

                            <span>
                              👤{" "}
                              {
                                getProfileName(
                                  participant.profile_id
                                )
                              }
                            </span>

                            {participant.completed && (
                              <b>
                                ✅ +
                                {
                                  participant.points_awarded
                                }
                              </b>
                            )}

                          </div>

                        )
                      )}

                      <select
                        value=""
                        onChange={(
                          event
                        ) => {

                          if (
                            event.target.value
                          ) {

                            addChallengeParticipant(
                              challenge.id,
                              event.target.value
                            );

                            event.target.value =
                              "";

                          }

                        }}
                      >

                        <option value="">
                          ➕ Teilnehmer hinzufügen
                        </option>

                        {profiles
                          .filter(
                            (
                              profile
                            ) =>
                              !participants.some(
                                (
                                  participant
                                ) =>
                                  participant.profile_id ===
                                  profile.id
                              )
                          )
                          .map(
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


                    {/* ABSTIMMUNG */}

                    {challenge.category ===
                      "Abstimmung" && (

                      <div className="voteBox">

                        <div className="voteHeader">

                          <strong>
                            🗳️ Abstimmung
                          </strong>

                          <span>
                            {votes.length}
                            {" / "}
                            {
                              requiredVotes
                            }{" "}
                            Stimmen
                          </span>

                        </div>

                        <div className="voteProgress">

                          <div
                            style={{
                              width:
                                `${Math.min(
                                  100,
                                  (
                                    votes.length /
                                    requiredVotes
                                  ) *
                                    100
                                )}%`,
                            }}
                          />

                        </div>

                        <p>
                          {votesRemaining >
                          0
                            ? `Noch ${votesRemaining} Stimme${
                                votesRemaining ===
                                1
                                  ? ""
                                  : "n"
                              } benötigt.`
                            : "Abstimmung vollständig!"}
                        </p>


                        <select
                          value={
                            challengeTargetProfile
                          }
                          onChange={(
                            event
                          ) =>
                            setChallengeTargetProfile(
                              event.target.value
                            )
                          }
                        >

                          <option value="">
                            Person auswählen
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


                        <div className="voteButtons">

                          <button
                            className="voteYes"
                            onClick={() => {
                              setChallengeVote(
                                "yes"
                              );

                              setSelectedChallengeId(
                                challenge.id
                              );
                            }}
                          >
                            👍 Ja
                          </button>

                          <button
                            className="voteNo"
                            onClick={() => {
                              setChallengeVote(
                                "no"
                              );

                              setSelectedChallengeId(
                                challenge.id
                              );
                            }}
                          >
                            👎 Nein
                          </button>

                        </div>


                        {selectedChallengeId ===
                          challenge.id &&
                          challengeVote && (
                            <>

                              <input
                                value={
                                  challengeVoteComment
                                }
                                onChange={(
                                  event
                                ) =>
                                  setChallengeVoteComment(
                                    event.target.value
                                  )
                                }
                                placeholder="Kommentar (optional)"
                              />

                              <button
                                className="primaryButton full"
                                onClick={() =>
                                  submitChallengeVote(
                                    challenge
                                  )
                                }
                              >
                                🗳️ Stimme abgeben
                              </button>

                            </>
                          )}

                      </div>

                    )}


                    {/* AKTIONEN */}

                    <div className="challengeActions">

                      <button
                        className="completeButton"
                        onClick={() =>
                          completeChallenge(
                            challenge
                          )
                        }
                      >
                        🏆 Challenge geschafft
                      </button>

                      <button
                        className="deleteChallenge"
                        onClick={() =>
                          deleteChallenge(
                            challenge.id
                          )
                        }
                      >
                        🗑️
                      </button>

                    </div>

                  </article>

                );

              }
            )}

            {activeChallenges.length ===
              0 && (
              <div className="emptyChallenge">

                <div>
                  🎯
                </div>

                <h3>
                  Keine aktive Challenge
                </h3>

                <p>
                  Das ist deine Chance,
                  etwas völlig
                  Unnötiges zu starten.
                </p>

                <button
                  className="primaryButton"
                  onClick={() =>
                    setShowCreateChallenge(
                      true
                    )
                  }
                >
                  🚀 Challenge starten
                </button>

              </div>
            )}

          </section>


          {/* ABGESCHLOSSENE */}

          {completedChallenges.length >
            0 && (

            <section className="card">

              <h2>
                🏆 Erledigt
              </h2>

              {completedChallenges.map(
                (
                  challenge
                ) => (

                  <div
                    className="completedChallenge"
                    key={
                      challenge.id
                    }
                  >

                    <span>
                      ✅
                    </span>

                    <div>

                      <strong>
                        {
                          challenge.title
                        }
                      </strong>

                      <small>
                        {
                          getProfileName(
                            challenge.winner_profile_id
                          )
                        }{" "}
                        · +
                        {
                          challenge.points
                        }{" "}
                        Punkte
                      </small>

                    </div>

                  </div>

                )
              )}

            </section>

          )}

        </>
      )}


      {/* =====================================================
          RANKING
      ===================================================== */}

      {activeTab ===
        "ranking" && (
        <>

          <section className="rankingHero">

            <span>
              🏆
            </span>

            <h2>
              Das offizielle
              Zapfhahn-Ranking
            </h2>

            <p>
              Wer ist heute
              unschlagbar?
            </p>

          </section>


          <section className="rankingList">

            {ranking.map(
              (
                profile,
                index
              ) => (

                <div
                  className={
                    index === 0
                      ? "rankingRow first"
                      : "rankingRow"
                  }
                  key={
                    profile.id
                  }
                >

                  <div className="rankingPlace">

                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : index + 1}

                  </div>

                  <div className="rankingAvatar">
                    👤
                  </div>

                  <div className="rankingPerson">

                    <strong>
                      {
                        profile.username
                      }
                    </strong>

                    <small>
                      🍺{" "}
                      {
                        profile.drinks_count ||
                        0
                      }{" "}
                      Getränke
                    </small>

                  </div>

                  <div className="rankingPoints">

                    <strong>
                      {
                        profile.points ||
                        0
                      }
                    </strong>

                    <small>
                      Punkte
                    </small>

                  </div>

                </div>

              )
            )}

            {ranking.length ===
              0 && (
              <div className="empty">
                🏆 Noch keine
                Ranking-Daten.
              </div>
            )}

          </section>


          {/* RANKING-TITEL */}

          <section className="card">

            <h2>
              👑 Titel
            </h2>

            <p>
              Deine Punkte bestimmen,
              wie lächerlich wichtig dein
              Titel wird.
            </p>

            {ranking.map(
              (
                profile
              ) => (

                <RankingTitle
                  key={
                    profile.id
                  }
                  points={
                    profile.points ||
                    0
                  }
                  name={
                    profile.username
                  }
                />

              )
            )}

          </section>

        </>
      )}


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer>

        <div>
          🍻
        </div>

        <strong>
          Güstener
          Zapfhahn Zentrale
        </strong>

        <small>
          Dein Event.
          Deine Getränke.
          Deine Challenges.
          Dein Chaos.
        </small>

      </footer>


      {/* =====================================================
          GLOBAL CSS
      ===================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          min-height: 100%;
          background: #08090d;
        }

        body {
          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;
          color: #ffffff;
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
              rgba(
                245,
                158,
                11,
                .18
              ),
              transparent 35%
            ),
            linear-gradient(
              180deg,
              #11151d 0%,
              #08090d 100%
            );

          padding:
            20px
            20px
            50px;
        }

        .topbar,
        .eventBar,
        .playerBar,
        .tabs,
        .message,
        .hero,
        .statsGrid,
        .card,
        .challengeHero,
        .challengeHeader,
        .challengeList,
        .rankingHero,
        .rankingList,
        footer {
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }


        /* HEADER */

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding:
            12px
            0
            24px;
        }

        .brand {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .brandIcon {
          width: 58px;
          height: 58px;
          border-radius: 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 31px;

          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #f97316
            );

          box-shadow:
            0 10px 30px
            rgba(
              245,
              158,
              11,
              .25
            );
        }

        h1 {
          margin: 0;
          font-size: 23px;
          line-height: 1.1;
          letter-spacing: -.5px;
        }

        h1 span {
          color: #fbbf24;
          margin-left: 5px;
        }

        .brand p {
          margin: 5px 0 0;
          color: #88909d;
          font-size: 12px;
        }

        .refreshButton {
          width: 44px;
          height: 44px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              .08
            );
          border-radius: 14px;
          background: #171b23;
          color: white;
          font-size: 20px;
        }


        /* EVENT */

        .eventBar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;

          padding: 15px;

          border-radius: 18px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );

          border: 1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          margin-bottom: 10px;
        }

        .eventBar select,
        .playerBar select {
          min-width: 230px;
          margin: 4px 0 0;
        }

        .miniLabel {
          display: block;
          color: #777f8c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .eventInfo {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          color: #a6adba;
          font-size: 12px;
        }


        /* PLAYER */

        .playerBar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;

          padding:
            12px
            15px;

          background:
            rgba(
              245,
              158,
              11,
              .08
            );

          border: 1px solid
            rgba(
              245,
              158,
              11,
              .15
            );

          border-radius: 18px;

          margin-bottom: 12px;
        }

        .playerPoints {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #aab1bd;
        }

        .playerPoints strong {
          color: #fbbf24;
          font-size: 22px;
        }


        /* TABS */

        .tabs {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);

          gap: 7px;

          padding: 7px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );

          border: 1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          border-radius: 18px;

          margin-bottom: 14px;
        }

        .tabs button {
          position: relative;

          border: 0;
          border-radius: 13px;

          background: transparent;
          color: #838b98;

          padding:
            12px
            7px;

          font-size: 19px;
        }

        .tabs button span {
          display: block;
          font-size: 10px;
          margin-top: 3px;
        }

        .tabs button.active {
          background:
            rgba(
              245,
              158,
              11,
              .15
            );

          color: #fbbf24;
        }

        .tabBadge {
          position: absolute;
          top: 5px;
          right: 20%;
          background: #ef4444;
          color: white;
          font-size: 9px;
          min-width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }


        /* MESSAGE */

        .message {
          padding: 14px 16px;
          border-radius: 14px;
          margin-bottom: 14px;
          font-size: 13px;
          border: 1px solid;
        }

        .message.success {
          background:
            rgba(
              34,
              197,
              94,
              .12
            );
          border-color:
            rgba(
              34,
              197,
              94,
              .25
            );
          color: #86efac;
        }

        .message.error {
          background:
            rgba(
              239,
              68,
              68,
              .12
            );
          border-color:
            rgba(
              239,
              68,
              68,
              .25
            );
          color: #fca5a5;
        }

        .message.info {
          background:
            rgba(
              59,
              130,
              246,
              .12
            );
          border-color:
            rgba(
              59,
              130,
              246,
              .25
            );
          color: #93c5fd;
        }


        /* HERO */

        .hero {
          display: flex;
          gap: 18px;
          align-items: center;

          padding: 24px;

          border-radius: 22px;

          background:
            linear-gradient(
              135deg,
              rgba(
                245,
                158,
                11,
                .15
              ),
              rgba(
                239,
                68,
                68,
                .08
              )
            );

          border: 1px solid
            rgba(
              245,
              158,
              11,
              .16
            );

          margin-bottom: 14px;
        }

        .heroEmoji {
          font-size: 48px;
        }

        .hero h2 {
          margin: 0;
          font-size: 28px;
        }

        .hero p {
          margin:
            7px
            0
            0;
          color: #9ca4b1;
          line-height: 1.5;
        }


        /* STATS */

        .statsGrid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .statCard {
          padding: 17px;
          border-radius: 18px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );

          border: 1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          text-align: center;
        }

        .statCard span {
          font-size: 22px;
        }

        .statCard strong {
          display: block;
          margin: 5px 0;
          font-size: 20px;
        }

        .statCard small {
          color: #777f8c;
          font-size: 10px;
        }


        /* CARD */

        .card {
          padding: 19px;
          border-radius: 20px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );

          border: 1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          margin-bottom: 14px;
        }

        .sectionHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 15px;
        }

        .sectionHeader h2 {
          margin: 0;
          font-size: 19px;
        }

        .sectionHeader p {
          margin: 4px 0 0;
          color: #777f8c;
          font-size: 12px;
        }


        /* INPUTS */

        input,
        select,
        textarea {
          width: 100%;

          padding:
            13px
            14px;

          border-radius: 12px;

          border: 1px solid
            #292f39;

          background:
            #11151c;

          color: white;

          outline: none;

          margin-bottom: 10px;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color:
            rgba(
              245,
              158,
              11,
              .6
            );
        }

        textarea {
          resize: vertical;
        }

        label {
          display: block;
          color: #8c95a2;
          font-size: 11px;
          font-weight: 700;
          margin:
            10px
            0
            7px;
        }


        /* BUTTONS */

        .primaryButton {
          border: 0;
          border-radius: 13px;

          padding:
            13px
            17px;

          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #f97316
            );

          color: #17100a;

          font-weight: 900;

          box-shadow:
            0 8px 20px
            rgba(
              245,
              158,
              11,
              .16
            );
        }

        .primaryButton:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .primaryButton.full {
          width: 100%;
        }


        /* PLAYERS */

        .addPlayer {
          display: grid;
          grid-template-columns:
            1fr
            auto;
          gap: 8px;
        }

        .addPlayer input {
          margin: 0;
        }

        .playerList {
          margin-top: 10px;
        }

        .playerRow {
          display: grid;
          grid-template-columns:
            35px
            40px
            1fr
            auto;

          align-items: center;

          gap: 10px;

          padding: 11px;

          margin-top: 7px;

          border-radius: 14px;

          background:
            rgba(
              255,
              255,
              255,
              .035
            );
        }

        .rankNumber {
          text-align: center;
        }

        .playerAvatar,
        .rankingAvatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #202630;
        }

        .playerName strong {
          display: block;
        }

        .playerName small {
          display: block;
          color: #707986;
          margin-top: 3px;
          font-size: 10px;
        }

        .points {
          color: #fbbf24;
          font-weight: 900;
        }


        /* CHALLENGE HERO */

        .challengeHero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;

          padding: 23px;

          border-radius: 22px;

          margin-bottom: 14px;

          background:
            linear-gradient(
              135deg,
              rgba(
                139,
                92,
                246,
                .18
              ),
              rgba(
                236,
                72,
                153,
                .09
              )
            );

          border:
            1px solid
            rgba(
              139,
              92,
              246,
              .18
            );
        }

        .challengeEyebrow {
          color: #c4b5fd;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .challengeHero h2 {
          margin:
            5px
            0;
          font-size: 25px;
        }

        .challengeHero p {
          margin: 0;
          color: #a5a0b3;
        }


        /* COST */

        .bigMoney {
          color: #fbbf24;
          font-size: 23px;
        }

        .costRow {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          border-radius: 12px;
          margin-top: 7px;
          background:
            rgba(
              255,
              255,
              255,
              .035
            );
          color: #9aa2af;
        }

        .costRow strong {
          color: white;
        }


        /* DRINKS */

        .formGrid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 8px;
        }

        .formGrid.four {
          grid-template-columns:
            repeat(4, 1fr);
        }

        .drinkList {
          display: grid;
          gap: 7px;
        }

        .drinkRow {
          display: grid;
          grid-template-columns:
            45px
            1fr
            auto;

          gap: 10px;

          align-items: center;

          padding: 11px;

          border-radius: 14px;

          background:
            rgba(
              255,
              255,
              255,
              .035
            );
        }

        .drinkIcon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #202630;
          border-radius: 13px;
          font-size: 20px;
        }

        .drinkInfo strong {
          display: block;
        }

        .drinkInfo small {
          display: block;
          margin-top: 4px;
          color: #737c88;
          font-size: 10px;
        }


        /* CHALLENGES */

        .challengeHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;

          padding:
            5px
            0
            17px;
        }

        .challengeHeader span {
          color: #fbbf24;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .challengeHeader h2 {
          margin:
            4px
            0;
          font-size: 29px;
        }

        .challengeHeader p {
          margin: 0;
          color: #7f8793;
          font-size: 12px;
        }

        .challengeCreate {
          border-color:
            rgba(
              245,
              158,
              11,
              .18
            );
        }

        .categoryGrid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(
                110px,
                1fr
              )
            );

          gap: 7px;

          margin-bottom: 12px;
        }

        .categoryButton {
          border: 1px solid
            #292f39;

          border-radius: 13px;

          background:
            #11151c;

          color: #9ca3af;

          padding:
            10px
            7px;

          display: flex;
          flex-direction: column;
          gap: 5px;
          align-items: center;

          font-size: 11px;
        }

        .categoryButton span {
          font-size: 20px;
        }

        .categoryButton.selected {
          border-color:
            #f59e0b;

          background:
            rgba(
              245,
              158,
              11,
              .12
            );

          color: #fbbf24;
        }

        .pointsSelector {
          display: grid;
          grid-template-columns:
            repeat(
              5,
              1fr
            );

          gap: 7px;

          margin-bottom: 10px;
        }

        .pointsSelector button {
          border: 1px solid
            #292f39;

          border-radius: 12px;

          background:
            #11151c;

          color: #9ca3af;

          padding: 10px;
        }

        .pointsSelector button.selectedPoint {
          border-color:
            #f59e0b;

          background:
            rgba(
              245,
              158,
              11,
              .15
            );

          color: #fbbf24;
        }

        .challengeCard {
          padding: 18px;
          border-radius: 20px;

          margin-bottom: 12px;

          background:
            linear-gradient(
              145deg,
              rgba(
                255,
                255,
                255,
                .055
              ),
              rgba(
                255,
                255,
                255,
                .025
              )
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );
        }

        .challengeTop {
          display: grid;
          grid-template-columns:
            50px
            1fr
            auto;

          gap: 12px;

          align-items: start;
        }

        .challengeEmoji {
          width: 50px;
          height: 50px;

          border-radius: 16px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            rgba(
              245,
              158,
              11,
              .12
            );

          font-size: 25px;
        }

        .challengeCategory {
          color: #fbbf24;
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .challengeMain h3 {
          margin:
            4px
            0;

          font-size: 19px;
        }

        .challengeMain p {
          color: #8a929e;
          font-size: 12px;
          line-height: 1.5;
          margin:
            6px
            0
            0;
        }

        .challengePoints {
          text-align: right;
        }

        .challengePoints strong {
          display: block;
          color: #fbbf24;
          font-size: 20px;
        }

        .challengePoints small {
          color: #717985;
          font-size: 9px;
        }

        .challengeTarget {
          margin-top: 13px;
          padding: 11px;
          border-radius: 12px;
          background:
            rgba(
              139,
              92,
              246,
              .1
            );

          color: #b8a7dc;
          font-size: 12px;
        }

        .challengeTarget strong {
          color: #ddd6fe;
        }

        .challengeParticipants {
          margin-top: 14px;
          padding: 12px;
          border-radius: 14px;
          background:
            rgba(
              0,
              0,
              0,
              .15
            );
        }

        .challengeParticipants > strong {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .participantMini {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border-radius: 9px;
          margin-top: 5px;
          background:
            rgba(
              255,
              255,
              255,
              .035
            );
          font-size: 12px;
        }

        .participantMini b {
          color: #86efac;
        }

        .voteBox {
          margin-top: 14px;
          padding: 14px;
          border-radius: 16px;

          background:
            rgba(
              59,
              130,
              246,
              .07
            );

          border:
            1px solid
            rgba(
              59,
              130,
              246,
              .13
            );
        }

        .voteHeader {
          display: flex;
          justify-content: space-between;
          margin-bottom: 9px;
        }

        .voteHeader span {
          color: #8fa2bc;
          font-size: 11px;
        }

        .voteProgress {
          height: 7px;
          border-radius: 20px;
          overflow: hidden;
          background: #202632;
        }

        .voteProgress div {
          height: 100%;
          background:
            linear-gradient(
              90deg,
              #3b82f6,
              #8b5cf6
            );
          border-radius: inherit;
        }

        .voteBox p {
          color: #7e8794;
          font-size: 11px;
        }

        .voteButtons {
          display: grid;
          grid-template-columns:
            1fr
            1fr;
          gap: 8px;
        }

        .voteYes,
        .voteNo {
          border: 0;
          border-radius: 12px;
          padding: 12px;
          font-weight: 800;
        }

        .voteYes {
          background:
            rgba(
              34,
              197,
              94,
              .15
            );
          color: #86efac;
        }

        .voteNo {
          background:
            rgba(
              239,
              68,
              68,
              .15
            );
          color: #fca5a5;
        }

        .challengeActions {
          display: grid;
          grid-template-columns:
            1fr
            45px;

          gap: 8px;

          margin-top: 14px;
        }

        .completeButton {
          border: 0;
          border-radius: 13px;
          padding: 13px;
          background:
            linear-gradient(
              135deg,
              #22c55e,
              #16a34a
            );
          color: white;
          font-weight: 900;
        }

        .deleteChallenge {
          border: 1px solid
            rgba(
              239,
              68,
              68,
              .2
            );

          background:
            rgba(
              239,
              68,
              68,
              .08
            );

          color: #fca5a5;

          border-radius: 13px;
        }

        .emptyChallenge {
          text-align: center;
          padding: 45px 20px;
          border-radius: 20px;
          background:
            rgba(
              255,
              255,
              255,
              .035
            );
          border: 1px dashed
            #303640;
        }

        .emptyChallenge > div {
          font-size: 45px;
        }

        .emptyChallenge h3 {
          margin:
            10px
            0
            5px;
        }

        .emptyChallenge p {
          color: #737c88;
          font-size: 12px;
        }

        .completedChallenge {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 11px;
          border-radius: 12px;
          background:
            rgba(
              255,
              255,
              255,
              .035
            );
          margin-top: 7px;
        }

        .completedChallenge > span {
          font-size: 20px;
        }

        .completedChallenge strong,
        .completedChallenge small {
          display: block;
        }

        .completedChallenge small {
          color: #777f8c;
          margin-top: 3px;
          font-size: 10px;
        }


        /* RANKING */

        .rankingHero {
          text-align: center;
          padding:
            20px
            0
            24px;
        }

        .rankingHero > span {
          font-size: 55px;
        }

        .rankingHero h2 {
          font-size: 27px;
          margin:
            8px
            0
            5px;
        }

        .rankingHero p {
          margin: 0;
          color: #777f8c;
        }

        .rankingRow {
          display: grid;

          grid-template-columns:
            45px
            45px
            1fr
            auto;

          align-items: center;

          gap: 11px;

          padding: 14px;

          margin-bottom: 7px;

          border-radius: 16px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );
        }

        .rankingRow.first {
          border-color:
            rgba(
              245,
              158,
              11,
              .3
            );

          background:
            linear-gradient(
              135deg,
              rgba(
                245,
                158,
                11,
                .13
              ),
              rgba(
                255,
                255,
                255,
                .04
              )
            );
        }

        .rankingPlace {
          text-align: center;
          font-size: 20px;
        }

        .rankingPerson strong,
        .rankingPerson small {
          display: block;
        }

        .rankingPerson small {
          color: #737c88;
          margin-top: 3px;
          font-size: 10px;
        }

        .rankingPoints {
          text-align: right;
        }

        .rankingPoints strong {
          display: block;
          color: #fbbf24;
          font-size: 21px;
        }

        .rankingPoints small {
          display: block;
          color: #6f7783;
          font-size: 9px;
        }


        /* EMPTY */

        .empty {
          text-align: center;
          padding: 30px;
          color: #707985;
          font-size: 13px;
        }


        /* FOOTER */

        footer {
          text-align: center;
          padding:
            35px
            10px
            10px;

          color: #555e6a;
        }

        footer div {
          font-size: 30px;
          margin-bottom: 7px;
        }

        footer strong {
          display: block;
          color: #747d89;
        }

        footer small {
          display: block;
          margin-top: 4px;
          font-size: 10px;
        }


        /* MOBILE */

        @media (
          max-width: 650px
        ) {

          .app {
            padding:
              10px
              10px
              35px;
          }

          h1 {
            font-size: 19px;
          }

          .brandIcon {
            width: 48px;
            height: 48px;
            font-size: 25px;
          }

          .eventBar,
          .playerBar,
          .challengeHero,
          .challengeHeader {
            align-items: stretch;
            flex-direction: column;
          }

          .eventBar select,
          .playerBar select {
            min-width: 0;
          }

          .statsGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .formGrid,
          .formGrid.four {
            grid-template-columns:
              1fr;
          }

          .addPlayer {
            grid-template-columns:
              1fr;
          }

          .addPlayer button {
            width: 100%;
          }

          .challengeTop {
            grid-template-columns:
              45px
              1fr;
          }

          .challengePoints {
            grid-column:
              2;
            text-align: left;
          }

          .rankingRow {
            grid-template-columns:
              35px
              40px
              1fr
              auto;
          }

          .pointsSelector {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

          .hero {
            align-items: flex-start;
          }

          .heroEmoji {
            font-size: 35px;
          }

          .hero h2 {
            font-size: 23px;
          }

        }

      `}</style>

    </main>
  );
}


/* ============================================================
   GETRÄNKE-EMOJIS
============================================================ */

function drinkCategoryEmoji(
  category?: string | null
) {
  switch (
    String(
      category || ""
    ).toLowerCase()
  ) {

    case "bier":
      return "🍺";

    case "wein":
      return "🍷";

    case "sekt":
      return "🥂";

    case "cocktail":
      return "🍹";

    case "longdrink":
      return "🍸";

    case "schnaps":
      return "🥃";

    case "softdrink":
      return "🥤";

    default:
      return "🍻";
  }
}


/* ============================================================
   RANKING TITEL
============================================================ */

function RankingTitle({
  points,
  name,
}: {
  points: number;
  name: string;
}) {
  let title =
    "Frischling";

  let emoji =
    "🍺";

  let description =
    "Gerade erst dabei.";

  if (points >= 500) {
    title =
      "Güsten-Gott";
    emoji =
      "⚡";
    description =
      "Absolute Endstufe.";
  } else if (points >= 350) {
    title =
      "Abriss-König";
    emoji =
      "🔥";
    description =
      "Der Abend kennt kein Zurück mehr.";
  } else if (points >= 200) {
    title =
      "Zapfhahn-Legende";
    emoji =
      "👑";
    description =
      "Eine echte Legende.";
  } else if (points >= 100) {
    title =
      "Party-Maschine";
    emoji =
      "🎉";
    description =
      "Jetzt wird es ernst.";
  } else if (points >= 50) {
    title =
      "Theken-Profi";
    emoji =
      "😎";
    description =
      "Du weißt, wie der Abend läuft.";
  } else if (points >= 25) {
    title =
      "Zapfhahn-Lehrling";
    emoji =
      "🍻";
    description =
      "Die ersten Punkte sind gesammelt.";
  }

  return (
    <div className="costRow">

      <span>
        {emoji}{" "}
        <strong>
          {name}
        </strong>
      </span>

      <span>
        {title}
      </span>

    </div>
  );
}
