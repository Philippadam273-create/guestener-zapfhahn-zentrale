"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/* ============================================================
   TYPES
   ============================================================ */

type EventRow = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  invite_code?: string | null;

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
  team_mode?: boolean;
  show_photos?: boolean;
  show_costs?: boolean;
  privacy_mode?: boolean;
};

type Profile = {
  id: string;
  username: string | null;
  points: number | null;
  drinks_count: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
  gewicht_kg?: number | null;
  alter?: number | null;
  geschlecht?: string | null;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string;
  joined_via_code?: string | null;
  profile?: Profile | null;
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
  foto?: string | null;
};

type Challenge = {
  id: string;
  event_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  points: number;
  status: string;
  created_by_profile_id?: string | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  required_votes: number;
  duration_minutes?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
  completed_at?: string | null;
  is_active?: boolean;
};

type ChallengeTemplate = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  default_points: number;
  requires_vote: boolean;
  minimum_votes: number;
};

type ChallengeVote = {
  id: string;
  challenge_id: string;
  voter_profile_id: string;
  target_profile_id?: string | null;
  vote: string;
  comment?: string | null;
  created_at?: string;
};

type RankingTitle = {
  min_points: number;
  title: string;
  emoji?: string | null;
  description?: string | null;
};

type MessageType = "success" | "error" | "info";

/* ============================================================
   HELPERS
   ============================================================ */

function money(value: number) {
  return `${value.toFixed(2)} €`;
}

function liters(value: number) {
  return `${value.toFixed(2)} L`;
}

function getDrinkName(drink: Drink) {
  return (
    drink.drink_name ||
    drink.getraenk ||
    drink.brand ||
    drink.marke ||
    "Getränk"
  );
}

function getDrinkLiters(drink: Drink) {
  return Number(drink.liters ?? drink.menge ?? 0);
}

function getDrinkAlcohol(drink: Drink) {
  return Number(
    drink.alcohol_percent ??
      drink.alkohol ??
      drink.detected_alcohol_percent ??
      0
  );
}

function getDrinkPrice(drink: Drink) {
  return Number(drink.preis ?? 0);
}

/* ============================================================
   MAIN
   ============================================================ */

export default function Home() {
  /* ----------------------------------------------------------
     EVENTS
     ---------------------------------------------------------- */

  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventId, setEventId] = useState("");

  /* ----------------------------------------------------------
     PROFILES / MEMBERS
     ---------------------------------------------------------- */

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState("");

  const [personName, setPersonName] = useState("");

  /* ----------------------------------------------------------
     DRINKS
     ---------------------------------------------------------- */

  const [drinks, setDrinks] = useState<Drink[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] = useState("Bier");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  /* ----------------------------------------------------------
     CHALLENGES
     ---------------------------------------------------------- */

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeTemplates, setChallengeTemplates] = useState<
    ChallengeTemplate[]
  >([]);

  const [selectedChallengeTemplate, setSelectedChallengeTemplate] =
    useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] =
    useState("");
  const [challengeCategory, setChallengeCategory] =
    useState("Quatsch");
  const [challengePoints, setChallengePoints] =
    useState("10");
  const [requiredVotes, setRequiredVotes] =
    useState("2");

  const [selectedChallengeId, setSelectedChallengeId] =
    useState("");

  const [challengeTargetProfile, setChallengeTargetProfile] =
    useState("");

  /* ----------------------------------------------------------
     UI
     ---------------------------------------------------------- */

  const [activeTab, setActiveTab] = useState<
    "home" | "drinks" | "challenges" | "ranking"
  >("home");

  const [showAddDrink, setShowAddDrink] = useState(false);
  const [showAddChallenge, setShowAddChallenge] =
    useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<MessageType>("info");

  const [loading, setLoading] = useState(false);

  /* ============================================================
     MESSAGE
     ============================================================ */

  function showMessage(
    text: string,
    type: MessageType = "info"
  ) {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  /* ============================================================
     LOAD EVENTS
     ============================================================ */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        `Events konnten nicht geladen werden: ${error.message}`,
        "error"
      );
      return;
    }

    const rows = (data || []) as EventRow[];

    setEvents(rows);

    if (!eventId && rows.length > 0) {
      setEventId(rows[0].id);
    }
  }

  /* ============================================================
     LOAD PROFILES
     ============================================================ */

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("username", {
        ascending: true,
      });

    if (error) {
      showMessage(
        `Profile konnten nicht geladen werden: ${error.message}`,
        "error"
      );
      return;
    }

    const rows = (data || []) as Profile[];

    setProfiles(rows);

    if (!currentProfileId && rows.length > 0) {
      setCurrentProfileId(rows[0].id);
    }
  }

  /* ============================================================
     LOAD EVENT MEMBERS
     ============================================================ */

  async function loadMembers() {
    if (!eventId) {
      setMembers([]);
      return;
    }

    const { data, error } = await supabase
      .from("event_members")
      .select("*")
      .eq("event_id", eventId)
      .order("joined_at", {
        ascending: true,
      });

    if (error) {
      showMessage(
        `Teilnehmer konnten nicht geladen werden: ${error.message}`,
        "error"
      );
      return;
    }

    const raw = (data || []) as EventMember[];

    const enriched = raw.map((member) => ({
      ...member,
      profile:
        profiles.find(
          (profile) => profile.id === member.profile_id
        ) || null,
    }));

    setMembers(enriched);
  }

  /* ============================================================
     LOAD DRINKS
     ============================================================ */

  async function loadDrinks() {
    if (!eventId) {
      setDrinks([]);
      return;
    }

    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        `Getränke konnten nicht geladen werden: ${error.message}`,
        "error"
      );
      return;
    }

    setDrinks((data || []) as Drink[]);
  }

  /* ============================================================
     LOAD CHALLENGES
     ============================================================ */

  async function loadChallenges() {
    if (!eventId) {
      setChallenges([]);
      return;
    }

    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        `Challenges konnten nicht geladen werden: ${error.message}`,
        "error"
      );
      return;
    }

    setChallenges((data || []) as Challenge[]);
  }

  /* ============================================================
     LOAD CHALLENGE TEMPLATES
     ============================================================ */

  async function loadChallengeTemplates() {
    const { data, error } = await supabase
      .from("challenge_templates")
      .select("*")
      .eq("is_active", true)
      .order("title", {
        ascending: true,
      });

    if (error) {
      showMessage(
        `Challenge-Vorlagen konnten nicht geladen werden: ${error.message}`,
        "error"
      );
      return;
    }

    setChallengeTemplates(
      (data || []) as ChallengeTemplate[]
    );
  }

  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    loadEvents();
    loadProfiles();
    loadChallengeTemplates();
  }, []);

  /* ============================================================
     EVENT CHANGE
     ============================================================ */

  useEffect(() => {
    if (!eventId) return;

    loadDrinks();
    loadChallenges();
    loadMembers();
  }, [eventId, profiles.length]);

  /* ============================================================
     CURRENT EVENT
     ============================================================ */

  const currentEvent = useMemo(() => {
    return events.find((event) => event.id === eventId);
  }, [events, eventId]);

  /* ============================================================
     MEMBERS WITH PROFILE
     ============================================================ */

  const memberProfiles = useMemo(() => {
    return members
      .map((member) => {
        const profile =
          profiles.find(
            (p) => p.id === member.profile_id
          ) || member.profile;

        return {
          member,
          profile,
        };
      })
      .filter(
        (
          item
        ): item is {
          member: EventMember;
          profile: Profile;
        } => Boolean(item.profile)
      );
  }, [members, profiles]);

  /* ============================================================
     TOTALS
     ============================================================ */

  const totalLiters = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkLiters(drink) *
          Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const totalCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkPrice(drink) *
          Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const totalDrinks = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum + Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const averageCost = useMemo(() => {
    if (memberProfiles.length === 0) {
      return 0;
    }

    return totalCost / memberProfiles.length;
  }, [totalCost, memberProfiles.length]);

  /* ============================================================
     RANKING TITLE
     ============================================================ */

  const getLocalRankingTitle = (
    points: number
  ): RankingTitle => {
    if (points >= 2000) {
      return {
        min_points: 2000,
        title: "Endgegner der Theke",
        emoji: "💀",
        description: "Die absolute Endstufe.",
      };
    }

    if (points >= 1200) {
      return {
        min_points: 1200,
        title: "Güstener Trinklegende",
        emoji: "🔥",
        description: "Eine lebende Legende.",
      };
    }

    if (points >= 850) {
      return {
        min_points: 850,
        title: "Hopfen-Herrscher",
        emoji: "🍺",
        description: "Der Zapfhahn gehorcht.",
      };
    }

    if (points >= 600) {
      return {
        min_points: 600,
        title: "Kneipen-König",
        emoji: "👑",
        description: "Die Krone sitzt.",
      };
    }

    if (points >= 400) {
      return {
        min_points: 400,
        title: "Promille-Pilot",
        emoji: "✈️",
        description: "Bitte anschnallen.",
      };
    }

    if (points >= 250) {
      return {
        min_points: 250,
        title: "Zapfhahn-Meister",
        emoji: "🏆",
        description: "Kaum noch aufzuhalten.",
      };
    }

    if (points >= 150) {
      return {
        min_points: 150,
        title: "Bier-Baron",
        emoji: "👑",
        description: "Respekt an der Theke.",
      };
    }

    if (points >= 100) {
      return {
        min_points: 100,
        title: "Hopfen-Held",
        emoji: "🦸",
        description: "Ein echter Kämpfer.",
      };
    }

    if (points >= 50) {
      return {
        min_points: 50,
        title: "Zapfhahn-Lehrling",
        emoji: "🍺",
        description: "Die Ausbildung läuft.",
      };
    }

    if (points >= 25) {
      return {
        min_points: 25,
        title: "Bierpraktikant",
        emoji: "🍻",
        description: "Erste Erfahrungen gesammelt.",
      };
    }

    return {
      min_points: 0,
      title: "Anfänger der gepflegten Eskalation",
      emoji: "🍺",
      description: "Noch ist alles unter Kontrolle.",
    };
  };

  /* ============================================================
     RANKING
     ============================================================ */

  const ranking = useMemo(() => {
    return memberProfiles
      .map(({ profile }) => {
        const challengePoints = challenges
          .filter(
            (challenge) =>
              challenge.winner_profile_id ===
              profile.id
          )
          .reduce(
            (sum, challenge) =>
              sum + Number(challenge.points || 0),
            0
          );

        const basePoints = Number(
          profile.points || 0
        );

        const totalPoints =
          basePoints + challengePoints;

        return {
          profile,
          points: totalPoints,
          title: getLocalRankingTitle(
            totalPoints
          ),
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [memberProfiles, challenges]);

  /* ============================================================
     ADD PARTICIPANT
     ============================================================ */

  async function addParticipant() {
    const name = personName.trim();

    if (!name) {
      showMessage(
        "Bitte zuerst einen Namen eingeben.",
        "error"
      );
      return;
    }

    if (!eventId) {
      showMessage(
        "Bitte zuerst ein Event auswählen.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      let profile = profiles.find(
        (p) =>
          p.username?.toLowerCase() ===
          name.toLowerCase()
      );

      /* --------------------------------------------------------
         EXISTIERENDES PROFIL
         -------------------------------------------------------- */

      if (!profile) {
        const { data, error } = await supabase
          .from("profiles")
          .insert({
            username: name,
            role: "member",
            points: 0,
            drinks_count: 0,
          })
          .select("*")
          .single();

        if (error) {
          showMessage(
            `Teilnehmer konnte nicht angelegt werden: ${error.message}`,
            "error"
          );
          return;
        }

        profile = data as Profile;

        setProfiles((old) => [
          ...old,
          profile!,
        ]);
      }

      /* --------------------------------------------------------
         PRÜFEN OB SCHON IM EVENT
         -------------------------------------------------------- */

      const alreadyMember = members.some(
        (member) =>
          member.profile_id === profile!.id
      );

      if (alreadyMember) {
        showMessage(
          "Diese Person ist bereits im Event.",
          "error"
        );
        return;
      }

      /* --------------------------------------------------------
         EVENT_MEMBER
         -------------------------------------------------------- */

      const { error: memberError } =
        await supabase
          .from("event_members")
          .insert({
            event_id: eventId,
            profile_id: profile.id,
          });

      if (memberError) {
        showMessage(
          `Teilnehmer konnte nicht hinzugefügt werden: ${memberError.message}`,
          "error"
        );
        return;
      }

      setPersonName("");

      showMessage(
        `${name} wurde dem Event hinzugefügt.`,
        "success"
      );

      await loadMembers();
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     REMOVE PARTICIPANT
     ============================================================ */

  async function removeParticipant(
    memberId: string
  ) {
    const { error } = await supabase
      .from("event_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      showMessage(
        `Teilnehmer konnte nicht entfernt werden: ${error.message}`,
        "error"
      );
      return;
    }

    showMessage(
      "Teilnehmer entfernt.",
      "success"
    );

    await loadMembers();
  }

  /* ============================================================
     SAVE DRINK
     ============================================================ */

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

    try {
      const { error } = await supabase
        .from("drinks")
        .insert({
          event_id: eventId,

          drink_name:
            drinkName.trim(),

          getraenk:
            drinkName.trim(),

          brand:
            drinkBrand.trim() || null,

          marke:
            drinkBrand.trim() || null,

          category:
            drinkCategory,

          liters:
            Number(drinkLiters) || 0,

          menge:
            Number(drinkLiters) || 0,

          alcohol_percent:
            Number(drinkAlcohol) || 0,

          alkohol:
            Number(drinkAlcohol) || 0,

          preis:
            Number(drinkPrice) || 0,

          quantity: 1,
        });

      if (error) {
        showMessage(
          `Getränk konnte nicht gespeichert werden: ${error.message}`,
          "error"
        );
        return;
      }

      setDrinkName("");
      setDrinkBrand("");
      setDrinkLiters("0.5");
      setDrinkAlcohol("5");
      setDrinkPrice("0");

      setShowAddDrink(false);

      showMessage(
        "🍺 Getränk gespeichert!",
        "success"
      );

      await loadDrinks();
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     ASSIGN DRINK
     ============================================================ */

  async function assignDrink(
    drink: Drink,
    profileId: string
  ) {
    const { error } = await supabase
      .from("drinks")
      .update({
        profile_id: profileId,
      })
      .eq("id", drink.id);

    if (error) {
      showMessage(
        `Getränk konnte nicht zugeordnet werden: ${error.message}`,
        "error"
      );
      return;
    }

    showMessage(
      "🍺 Getränk wurde zugeordnet!",
      "success"
    );

    await loadDrinks();
  }

  /* ============================================================
     CREATE CHALLENGE
     ============================================================ */

  async function createChallenge() {
    if (!eventId) {
      showMessage(
        "Bitte zuerst ein Event auswählen.",
        "error"
      );
      return;
    }

    if (!challengeTitle.trim()) {
      showMessage(
        "Bitte einen Challenge-Titel eingeben.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
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

            category:
              challengeCategory,

            points:
              Number(challengePoints) || 10,

            required_votes:
              Math.max(
                1,
                Number(requiredVotes) || 1
              ),

            status: "open",

            created_by_profile_id:
              currentProfileId || null,

            is_active: true,
          })
          .select("*")
          .single();

      if (error) {
        showMessage(
          `Challenge konnte nicht erstellt werden: ${error.message}`,
          "error"
        );
        return;
      }

      if (data) {
        setChallenges((old) => [
          data as Challenge,
          ...old,
        ]);
      }

      setChallengeTitle("");
      setChallengeDescription("");
      setChallengeCategory("Quatsch");
      setChallengePoints("10");
      setRequiredVotes("2");
      setSelectedChallengeTemplate("");

      setShowAddChallenge(false);

      showMessage(
        "🎯 Challenge erstellt!",
        "success"
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     CREATE CHALLENGE FROM TEMPLATE
     ============================================================ */

  async function createFromTemplate() {
    const template =
      challengeTemplates.find(
        (item) =>
          item.id ===
          selectedChallengeTemplate
      );

    if (!template) {
      showMessage(
        "Bitte eine Challenge-Vorlage auswählen.",
        "error"
      );
      return;
    }

    setChallengeTitle(template.title);
    setChallengeDescription(
      template.description || ""
    );
    setChallengeCategory(
      template.category || "Quatsch"
    );
    setChallengePoints(
      String(template.default_points)
    );
    setRequiredVotes(
      String(
        template.requires_vote
          ? template.minimum_votes
          : 1
      )
    );

    setShowAddChallenge(true);
  }

  /* ============================================================
     RANDOM ASSIGNMENT
     ============================================================ */

  async function assignRandomChallenge(
    challenge: Challenge
  ) {
    const available =
      memberProfiles.map(
        ({ profile }) => profile
      );

    if (available.length === 0) {
      showMessage(
        "Es gibt noch keine Teilnehmer.",
        "error"
      );
      return;
    }

    const random =
      available[
        Math.floor(
          Math.random() *
            available.length
        )
      ];

    const { error } = await supabase
      .from("challenges")
      .update({
        assigned_profile_id:
          random.id,
      })
      .eq("id", challenge.id);

    if (error) {
      showMessage(
        `Challenge konnte nicht vergeben werden: ${error.message}`,
        "error"
      );
      return;
    }

    await supabase
      .from("challenge_participants")
      .upsert(
        {
          challenge_id:
            challenge.id,
          profile_id:
            random.id,
        },
        {
          onConflict:
            "challenge_id,profile_id",
        }
      );

    showMessage(
      `🎲 Challenge geht an ${random.username || "Teilnehmer"}!`,
      "success"
    );

    await loadChallenges();
  }

  /* ============================================================
     ADD CHALLENGE PARTICIPANT
     ============================================================ */

  async function addChallengeParticipant(
    challengeId: string,
    profileId: string
  ) {
    if (!profileId) return;

    const { error } = await supabase
      .from("challenge_participants")
      .upsert(
        {
          challenge_id: challengeId,
          profile_id: profileId,
          accepted: true,
        },
        {
          onConflict:
            "challenge_id,profile_id",
        }
      );

    if (error) {
      showMessage(
        `Teilnehmer konnte nicht zur Challenge hinzugefügt werden: ${error.message}`,
        "error"
      );
      return;
    }

    showMessage(
      "Teilnehmer für Challenge hinzugefügt.",
      "success"
    );
  }

  /* ============================================================
     LOAD VOTES
     ============================================================ */

  async function getVotes(
    challengeId: string
  ) {
    const { data, error } = await supabase
      .from("challenge_votes")
      .select("*")
      .eq(
        "challenge_id",
        challengeId
      );

    if (error) {
      showMessage(
        `Abstimmungen konnten nicht geladen werden: ${error.message}`,
        "error"
      );
      return [];
    }

    return (data || []) as ChallengeVote[];
  }

  /* ============================================================
     CAST VOTE
     ============================================================ */

  async function castVote(
    challenge: Challenge,
    targetProfileId: string,
    vote: "winner" | "loser"
  ) {
    if (!currentProfileId) {
      showMessage(
        "Bitte zuerst einen eigenen Teilnehmer auswählen.",
        "error"
      );
      return;
    }

    if (!targetProfileId) {
      showMessage(
        "Bitte eine Person auswählen.",
        "error"
      );
      return;
    }

    const { error } = await supabase
      .from("challenge_votes")
      .upsert(
        {
          challenge_id:
            challenge.id,

          voter_profile_id:
            currentProfileId,

          target_profile_id:
            targetProfileId,

          vote,

          comment: null,
        },
        {
          onConflict:
            "challenge_id,voter_profile_id",
        }
      );

    if (error) {
      showMessage(
        `Abstimmung konnte nicht gespeichert werden: ${error.message}`,
        "error"
      );
      return;
    }

    showMessage(
      vote === "winner"
        ? "🗳️ Stimme für die Person abgegeben!"
        : "🗳️ Stimme gegen die Person abgegeben!",
      "success"
    );
  }

  /* ============================================================
     COMPLETE CHALLENGE
     ============================================================ */

  async function completeChallenge(
    challenge: Challenge,
    winnerProfileId: string
  ) {
    if (!winnerProfileId) {
      showMessage(
        "Bitte zuerst einen Gewinner auswählen.",
        "error"
      );
      return;
    }

    const { error } = await supabase.rpc(
      "complete_challenge",
      {
        p_challenge_id:
          challenge.id,

        p_winner_profile_id:
          winnerProfileId,
      }
    );

    if (error) {
      showMessage(
        `Challenge konnte nicht abgeschlossen werden: ${error.message}`,
        "error"
      );
      return;
    }

    showMessage(
      "🏆 Challenge abgeschlossen und Punkte vergeben!",
      "success"
    );

    await loadChallenges();
    await loadProfiles();
  }

  /* ============================================================
     CANCEL CHALLENGE
     ============================================================ */

  async function cancelChallenge(
    challengeId: string
  ) {
    const { error } = await supabase
      .from("challenges")
      .update({
        status: "cancelled",
        is_active: false,
      })
      .eq("id", challengeId);

    if (error) {
      showMessage(
        `Challenge konnte nicht beendet werden: ${error.message}`,
        "error"
      );
      return;
    }

    showMessage(
      "Challenge beendet.",
      "success"
    );

    await loadChallenges();
  }

  /* ============================================================
     DELETE DRINK
     ============================================================ */

  async function deleteDrink(
    drinkId: string
  ) {
    const { error } = await supabase
      .from("drinks")
      .delete()
      .eq("id", drinkId);

    if (error) {
      showMessage(
        `Getränk konnte nicht gelöscht werden: ${error.message}`,
        "error"
      );
      return;
    }

    showMessage(
      "Getränk gelöscht.",
      "success"
    );

    await loadDrinks();
  }

  /* ============================================================
     CHALLENGE STATUS LABEL
     ============================================================ */

  function challengeStatus(
    status: string
  ) {
    switch (status) {
      case "completed":
        return "🏆 Abgeschlossen";

      case "cancelled":
        return "❌ Beendet";

      case "open":
      default:
        return "🔥 Aktiv";
    }
  }

  /* ============================================================
     PERSON NAME
     ============================================================ */

  function profileName(
    profileId?: string | null
  ) {
    if (!profileId) {
      return "Niemand";
    }

    return (
      profiles.find(
        (profile) =>
          profile.id === profileId
      )?.username ||
      "Unbekannt"
    );
  }

  /* ============================================================
     PAGE
     ============================================================ */

  return (
    <main className="page">
      <div className="app">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="hero">

          <div className="heroIcon">
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
              Dein Event. Deine Getränke.
              Deine Challenges.
            </p>
          </div>

        </header>


        {/* ====================================================
            EVENT SELECT
        ==================================================== */}

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
                  Wähle deine Party aus.
                </p>
              </div>
            </div>

          </div>

          <select
            className="bigSelect"
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

          {currentEvent && (
            <div className="eventInfo">

              <strong>
                🎉 {currentEvent.title}
              </strong>

              {currentEvent.location && (
                <span>
                  📍 {currentEvent.location}
                </span>
              )}

            </div>
          )}

        </section>


        {/* ====================================================
            STATS
        ==================================================== */}

        <section className="statsGrid">

          <div className="stat">
            <span>🍺</span>
            <strong>
              {totalDrinks}
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
              {totalCost.toFixed(0)} €
            </strong>
            <small>
              Kosten
            </small>
          </div>

          <div className="stat">
            <span>👥</span>
            <strong>
              {memberProfiles.length}
            </strong>
            <small>
              Teilnehmer
            </small>
          </div>

        </section>


        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <nav className="bottomNav">

          <button
            className={
              activeTab === "home"
                ? "navButton active"
                : "navButton"
            }
            onClick={() =>
              setActiveTab("home")
            }
          >
            <span>🏠</span>
            Home
          </button>

          <button
            className={
              activeTab === "drinks"
                ? "navButton active"
                : "navButton"
            }
            onClick={() =>
              setActiveTab("drinks")
            }
          >
            <span>🍺</span>
            Getränke
          </button>

          <button
            className={
              activeTab === "challenges"
                ? "navButton active"
                : "navButton"
            }
            onClick={() =>
              setActiveTab("challenges")
            }
          >
            <span>🎯</span>
            Challenges
          </button>

          <button
            className={
              activeTab === "ranking"
                ? "navButton active"
                : "navButton"
            }
            onClick={() =>
              setActiveTab("ranking")
            }
          >
            <span>🏆</span>
            Ranking
          </button>

        </nav>


        {/* ====================================================
            HOME
        ==================================================== */}

        {activeTab === "home" && (
          <>

            {/* PARTICIPANTS */}

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
                      Wer ist heute dabei?
                    </p>
                  </div>
                </div>

              </div>


              <div className="inputRow">

                <input
                  value={personName}
                  onChange={(e) =>
                    setPersonName(
                      e.target.value
                    )
                  }
                  placeholder="Name eingeben..."
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter"
                    ) {
                      addParticipant();
                    }
                  }}
                />

                <button
                  className="primaryButton"
                  onClick={
                    addParticipant
                  }
                  disabled={loading}
                >
                  ➕
                  <span>
                    Hinzufügen
                  </span>
                </button>

              </div>


              <div className="peopleList">

                {memberProfiles.length ===
                0 ? (
                  <div className="empty">
                    <span>
                      👻
                    </span>

                    <strong>
                      Noch niemand da
                    </strong>

                    <small>
                      Trag den ersten
                      Teilnehmer ein.
                    </small>
                  </div>
                ) : (
                  memberProfiles.map(
                    ({
                      member,
                      profile,
                    }) => (
                      <div
                        className="personRow"
                        key={member.id}
                      >

                        <div className="avatar">
                          {(
                            profile.username ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="personInfo">

                          <strong>
                            {profile.username}
                          </strong>

                          <small>
                            ⭐{" "}
                            {profile.points ||
                              0}{" "}
                            Punkte
                          </small>

                        </div>

                        <button
                          className="smallDanger"
                          onClick={() =>
                            removeParticipant(
                              member.id
                            )
                          }
                        >
                          ×
                        </button>

                      </div>
                    )
                  )
                )}

              </div>

            </section>


            {/* COST */}

            {memberProfiles.length >
              0 && (
              <section className="glassCard">

                <div className="sectionTop">

                  <div>
                    <span className="sectionEmoji">
                      💶
                    </span>

                    <div>
                      <h2>
                        Kosten
                      </h2>

                      <p>
                        Die Runde auf
                        einen Blick.
                      </p>
                    </div>
                  </div>

                </div>

                <div className="costHero">
                  {money(totalCost)}
                </div>

                <div className="costRows">

                  <div>
                    <span>
                      👥 Teilnehmer
                    </span>

                    <strong>
                      {
                        memberProfiles.length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      💶 Pro Person
                    </span>

                    <strong>
                      {money(
                        averageCost
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      🍺 Getränke
                    </span>

                    <strong>
                      {totalDrinks}
                    </strong>
                  </div>

                </div>

              </section>
            )}


            {/* QUICK CHALLENGE */}

            <section className="challengeHero">

              <div>

                <span className="challengeHeroEmoji">
                  🎯
                </span>

                <h2>
                  Zeit für eine
                  Challenge?
                </h2>

                <p>
                  Macht die Party
                  interessanter.
                </p>

              </div>

              <button
                onClick={() => {
                  setActiveTab(
                    "challenges"
                  );
                  setShowAddChallenge(
                    true
                  );
                }}
              >
                Los geht's 🚀
              </button>

            </section>

          </>
        )}


        {/* ====================================================
            DRINKS
        ==================================================== */}

        {activeTab === "drinks" && (
          <>

            <section className="glassCard">

              <div className="sectionTop">

                <div>
                  <span className="sectionEmoji">
                    🍺
                  </span>

                  <div>
                    <h2>
                      Getränke
                    </h2>

                    <p>
                      Alles, was heute
                      vernichtet wird.
                    </p>
                  </div>
                </div>

                <button
                  className="iconButton"
                  onClick={() =>
                    setShowAddDrink(
                      !showAddDrink
                    )
                  }
                >
                  {showAddDrink
                    ? "×"
                    : "＋"}
                </button>

              </div>


              {showAddDrink && (
                <div className="formBox">

                  <input
                    value={drinkName}
                    onChange={(e) =>
                      setDrinkName(
                        e.target.value
                      )
                    }
                    placeholder="Getränk..."
                  />

                  <input
                    value={drinkBrand}
                    onChange={(e) =>
                      setDrinkBrand(
                        e.target.value
                      )
                    }
                    placeholder="Marke (optional)..."
                  />

                  <div className="formGrid">

                    <input
                      type="number"
                      step="0.1"
                      value={drinkLiters}
                      onChange={(e) =>
                        setDrinkLiters(
                          e.target.value
                        )
                      }
                      placeholder="Liter"
                    />

                    <input
                      type="number"
                      value={
                        drinkAlcohol
                      }
                      onChange={(e) =>
                        setDrinkAlcohol(
                          e.target.value
                        )
                      }
                      placeholder="Alkohol %"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={drinkPrice}
                      onChange={(e) =>
                        setDrinkPrice(
                          e.target.value
                        )
                      }
                      placeholder="Preis €"
                    />

                  </div>

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

                  <button
                    className="primaryButton full"
                    onClick={
                      saveDrink
                    }
                    disabled={loading}
                  >
                    🍻 Getränk speichern
                  </button>

                </div>
              )}


              <div className="drinkList">

                {drinks.length === 0 ? (
                  <div className="empty">
                    <span>
                      🍺
                    </span>

                    <strong>
                      Noch keine Getränke
                    </strong>

                    <small>
                      Zeit, den Zapfhahn
                      anzuschmeißen.
                    </small>
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
                            {getDrinkName(
                              drink
                            )}
                          </strong>

                          <small>
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
                            )}
                            %
                            {drink.brand
                              ? ` · ${drink.brand}`
                              : ""}
                          </small>

                        </div>

                        <div className="drinkPrice">
                          {money(
                            getDrinkPrice(
                              drink
                            )
                          )}
                        </div>

                        <button
                          className="smallDanger"
                          onClick={() =>
                            deleteDrink(
                              drink.id
                            )
                          }
                        >
                          ×
                        </button>

                      </div>
                    )
                  )
                )}

              </div>

            </section>


            {/* ASSIGN DRINKS */}

            {drinks.length > 0 &&
              memberProfiles.length >
                0 && (
                <section className="glassCard">

                  <div className="sectionTop">

                    <div>
                      <span className="sectionEmoji">
                        🔗
                      </span>

                      <div>
                        <h2>
                          Getränk
                          zuordnen
                        </h2>

                        <p>
                          Wer hatte was?
                        </p>
                      </div>
                    </div>

                  </div>

                  {drinks.map(
                    (drink) => (
                      <div
                        className="assignmentRow"
                        key={
                          drink.id
                        }
                      >

                        <div>
                          <strong>
                            🍺{" "}
                            {getDrinkName(
                              drink
                            )}
                          </strong>

                          <small>
                            {getDrinkLiters(
                              drink
                            ).toFixed(
                              1
                            )}{" "}
                            L
                          </small>
                        </div>

                        <select
                          value={
                            drink.profile_id ||
                            ""
                          }
                          onChange={(e) =>
                            assignDrink(
                              drink,
                              e.target
                                .value
                            )
                          }
                        >
                          <option value="">
                            Person auswählen
                          </option>

                          {memberProfiles.map(
                            ({
                              profile,
                            }) => (
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
                    )
                  )}

                </section>
              )}

          </>
        )}


        {/* ====================================================
            CHALLENGES
        ==================================================== */}

        {activeTab ===
          "challenges" && (
          <>

            {/* CURRENT PROFILE */}

            <section className="glassCard">

              <div className="sectionTop">

                <div>
                  <span className="sectionEmoji">
                    👤
                  </span>

                  <div>
                    <h2>
                      Du bist...
                    </h2>

                    <p>
                      Wichtig für
                      Abstimmungen.
                    </p>
                  </div>
                </div>

              </div>

              <select
                value={
                  currentProfileId
                }
                onChange={(e) =>
                  setCurrentProfileId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Teilnehmer auswählen
                </option>

                {memberProfiles.map(
                  ({ profile }) => (
                    <option
                      key={
                        profile.id
                      }
                      value={
                        profile.id
                      }
                    >
                      {profile.username}
                    </option>
                  )
                )}

              </select>

            </section>


            {/* CHALLENGE CREATE */}

            <section className="glassCard">

              <div className="sectionTop">

                <div>
                  <span className="sectionEmoji">
                    🎯
                  </span>

                  <div>
                    <h2>
                      Challenge
                    </h2>

                    <p>
                      Wer traut sich?
                    </p>
                  </div>
                </div>

                <button
                  className="iconButton"
                  onClick={() =>
                    setShowAddChallenge(
                      !showAddChallenge
                    )
                  }
                >
                  {showAddChallenge
                    ? "×"
                    : "＋"}
                </button>

              </div>


              {challengeTemplates.length >
                0 && (
                <div className="templateBox">

                  <label>
                    🎲 Schnelle
                    Challenge
                  </label>

                  <select
                    value={
                      selectedChallengeTemplate
                    }
                    onChange={(e) =>
                      setSelectedChallengeTemplate(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Vorlage auswählen...
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
                          {template.title}{" "}
                          ·{" "}
                          {
                            template.default_points
                          }{" "}
                          Punkte
                        </option>
                      )
                    )}
                  </select>

                  <button
                    className="secondaryButton full"
                    onClick={
                      createFromTemplate
                    }
                  >
                    Vorlage verwenden
                  </button>

                </div>
              )}


              {showAddChallenge && (
                <div className="formBox">

                  <input
                    value={
                      challengeTitle
                    }
                    onChange={(e) =>
                      setChallengeTitle(
                        e.target.value
                      )
                    }
                    placeholder="Challenge-Titel..."
                  />

                  <textarea
                    value={
                      challengeDescription
                    }
                    onChange={(e) =>
                      setChallengeDescription(
                        e.target.value
                      )
                    }
                    placeholder="Was muss gemacht werden?"
                    rows={4}
                  />

                  <div className="formGrid">

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
                        Trinken
                      </option>

                      <option>
                        Mutprobe
                      </option>

                      <option>
                        Geschicklichkeit
                      </option>

                      <option>
                        Wissen
                      </option>

                      <option>
                        Party
                      </option>

                      <option>
                        Team
                      </option>

                      <option>
                        Abstimmung
                      </option>

                      <option>
                        Zufall
                      </option>
                    </select>

                    <input
                      type="number"
                      value={
                        challengePoints
                      }
                      onChange={(e) =>
                        setChallengePoints(
                          e.target.value
                        )
                      }
                      placeholder="Punkte"
                    />

                    <input
                      type="number"
                      min="1"
                      value={
                        requiredVotes
                      }
                      onChange={(e) =>
                        setRequiredVotes(
                          e.target.value
                        )
                      }
                      placeholder="Stimmen"
                    />

                  </div>

                  <button
                    className="primaryButton full"
                    onClick={
                      createChallenge
                    }
                    disabled={loading}
                  >
                    🚀 Challenge starten
                  </button>

                </div>
              )}

            </section>


            {/* CHALLENGE LIST */}

            <section className="challengeList">

              {challenges.length ===
              0 ? (
                <div className="glassCard empty">

                  <span>
                    🎯
                  </span>

                  <strong>
                    Noch keine
                    Challenges
                  </strong>

                  <small>
                    Starte die erste
                    Eskalation.
                  </small>

                </div>
              ) : (
                challenges.map(
                  (challenge) => (
                    <ChallengeCard
                      key={
                        challenge.id
                      }
                      challenge={
                        challenge
                      }
                      profiles={
                        memberProfiles.map(
                          ({
                            profile,
                          }) =>
                            profile
                        )
                      }
                      currentProfileId={
                        currentProfileId
                      }
                      targetProfile={
                        challengeTargetProfile
                      }
                      onTargetChange={
                        setChallengeTargetProfile
                      }
                      onVote={
                        castVote
                      }
                      onRandom={
                        assignRandomChallenge
                      }
                      onComplete={
                        completeChallenge
                      }
                      onCancel={
                        cancelChallenge
                      }
                      onParticipant={
                        addChallengeParticipant
                      }
                      profileName={
                        profileName
                      }
                    />
                  )
                )
              )}

            </section>

          </>
        )}


        {/* ====================================================
            RANKING
        ==================================================== */}

        {activeTab ===
          "ranking" && (
          <>

            <section className="rankingHero">

              <div>
                <span>
                  🏆
                </span>

                <h2>
                  Hall of Fame
                </h2>

                <p>
                  Wer beherrscht
                  die Theke?
                </p>
              </div>

            </section>


            <section className="glassCard">

              {ranking.length ===
              0 ? (
                <div className="empty">

                  <span>
                    👻
                  </span>

                  <strong>
                    Noch kein Ranking
                  </strong>

                  <small>
                    Erstmal Leute
                    hinzufügen.
                  </small>

                </div>
              ) : (
                ranking.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      className={
                        index === 0
                          ? "rankRow first"
                          : "rankRow"
                      }
                      key={
                        item.profile.id
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

                      <div className="rankAvatar">

                        {(
                          item.profile
                            .username ||
                          "?"
                        )
                          .charAt(0)
                          .toUpperCase()}

                      </div>

                      <div className="rankInfo">

                        <strong>
                          {
                            item
                              .profile
                              .username
                          }
                        </strong>

                        <span>
                          {
                            item.title
                              .emoji
                          }{" "}
                          {
                            item.title
                              .title
                          }
                        </span>

                      </div>

                      <div className="rankPoints">

                        <strong>
                          {
                            item.points
                          }
                        </strong>

                        <small>
                          Punkte
                        </small>

                      </div>

                    </div>
                  )
                )
              )}

            </section>

          </>
        )}


        {/* ====================================================
            MESSAGE
        ==================================================== */}

        {message && (
          <div
            className={`message ${messageType}`}
          >
            {message}
          </div>
        )}


        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer>

          <div>
            🍻
          </div>

          <strong>
            Güstener
            Zapfhahn Zentrale
          </strong>

          <small>
            Dein Event. Deine
            Getränke. Deine Runde.
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
          min-height: 100%;
          background: #07090d;
        }

        body {
          overflow-x: hidden;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color:
            transparent;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          background:
            radial-gradient(
              circle at 15% 0%,
              rgba(245, 158, 11, .18),
              transparent 32%
            ),
            radial-gradient(
              circle at 90% 15%,
              rgba(239, 68, 68, .14),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              #07090d 0%,
              #10151d 48%,
              #07090d 100%
            );
          color: #fff;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .app {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding:
            20px
            18px
            80px;
        }

        .hero {
          display: flex;
          align-items: center;
          gap: 18px;
          padding:
            10px
            0
            25px;
        }

        .heroIcon {
          width: 72px;
          height: 72px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background:
            linear-gradient(
              145deg,
              #fbbf24,
              #f59e0b
            );
          font-size: 38px;
          box-shadow:
            0 15px 35px
            rgba(245, 158, 11, .25);
          transform:
            rotate(-4deg);
        }

        .eyebrow {
          color: #fbbf24;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 5px;
        }

        h1 {
          margin: 0;
          font-size:
            clamp(
              27px,
              7vw,
              44px
            );
          line-height: .95;
          letter-spacing: -1.5px;
        }

        .hero p {
          margin:
            9px
            0
            0;
          color: #8f9aaa;
          font-size: 14px;
        }

        .glassCard {
          position: relative;
          overflow: hidden;
          margin-bottom: 14px;
          padding: 18px;
          border:
            1px solid
            rgba(255,255,255,.08);
          border-radius: 22px;
          background:
            rgba(255,255,255,.045);
          box-shadow:
            0 15px 45px
            rgba(0,0,0,.18);
          backdrop-filter:
            blur(16px);
        }

        .glassCard::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.045),
              transparent 40%
            );
        }

        .sectionTop {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .sectionTop > div {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sectionEmoji {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 14px;
          background:
            rgba(245,158,11,.12);
          font-size: 23px;
        }

        h2 {
          margin: 0;
          font-size: 20px;
        }

        .sectionTop p {
          margin:
            3px
            0
            0;
          color: #7f8a99;
          font-size: 12px;
        }

        input,
        select,
        textarea {
          width: 100%;
          border:
            1px solid
            #29313d;
          outline: none;
          border-radius: 13px;
          padding:
            13px
            14px;
          background:
            #10151c;
          color: #fff;
          transition:
            border-color .2s,
            box-shadow .2s;
        }

        textarea {
          resize: vertical;
          min-height: 100px;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color:
            #f59e0b;
          box-shadow:
            0 0 0 3px
            rgba(245,158,11,.10);
        }

        input::placeholder,
        textarea::placeholder {
          color: #596473;
        }

        .bigSelect {
          position: relative;
          z-index: 1;
          font-size: 15px;
        }

        .eventInfo {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
          color: #8d98a7;
          font-size: 12px;
        }

        .eventInfo strong {
          color: #fbbf24;
        }

        .statsGrid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .stat {
          min-width: 0;
          padding: 15px 8px;
          text-align: center;
          border:
            1px solid
            rgba(255,255,255,.06);
          border-radius: 18px;
          background:
            rgba(255,255,255,.04);
        }

        .stat span {
          display: block;
          font-size: 20px;
        }

        .stat strong {
          display: block;
          margin-top: 4px;
          font-size: 19px;
        }

        .stat small {
          display: block;
          margin-top: 2px;
          color: #727d8b;
          font-size: 10px;
        }

        .inputRow {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns:
            1fr
            auto;
          gap: 8px;
        }

        .primaryButton,
        .secondaryButton {
          border: none;
          border-radius: 13px;
          padding:
            12px
            16px;
          cursor: pointer;
          font-weight: 900;
          transition:
            transform .15s,
            opacity .15s;
        }

        .primaryButton {
          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );
          color: #111;
        }

        .secondaryButton {
          background:
            #252e3a;
          color: #fff;
        }

        .primaryButton:hover,
        .secondaryButton:hover,
        .challengeHero button:hover {
          transform:
            translateY(-1px);
        }

        .primaryButton:disabled {
          opacity: .5;
          cursor: wait;
        }

        .full {
          width: 100%;
        }

        .iconButton {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 12px;
          background:
            #222b37;
          color: #fff;
          font-size: 22px;
          cursor: pointer;
        }

        .peopleList,
        .drinkList {
          position: relative;
          z-index: 1;
        }

        .personRow {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px;
          margin-top: 8px;
          border-radius: 15px;
          background:
            rgba(255,255,255,.045);
        }

        .avatar,
        .rankAvatar {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-weight: 900;
          background:
            linear-gradient(
              145deg,
              #374151,
              #1f2937
            );
        }

        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 13px;
        }

        .personInfo {
          flex: 1;
          min-width: 0;
        }

        .personInfo strong {
          display: block;
        }

        .personInfo small {
          display: block;
          margin-top: 3px;
          color: #7d8998;
          font-size: 11px;
        }

        .smallDanger {
          border: none;
          width: 31px;
          height: 31px;
          border-radius: 10px;
          background:
            #242d38;
          color: #a8b1bd;
          cursor: pointer;
          font-weight: 900;
        }

        .smallDanger:hover {
          background:
            #7f1d1d;
          color: #fff;
        }

        .costHero {
          position: relative;
          z-index: 1;
          margin:
            5px
            0
            15px;
          color: #fbbf24;
          font-size: 40px;
          font-weight: 900;
          text-align: center;
        }

        .costRows {
          position: relative;
          z-index: 1;
        }

        .costRows > div {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          margin-top: 7px;
          border-radius: 12px;
          background:
            rgba(255,255,255,.04);
          color: #9ca7b5;
          font-size: 13px;
        }

        .costRows strong {
          color: #fff;
        }

        .challengeHero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 14px;
          padding: 22px;
          border-radius: 23px;
          background:
            linear-gradient(
              135deg,
              rgba(245,158,11,.20),
              rgba(239,68,68,.12)
            );
          border:
            1px solid
            rgba(245,158,11,.20);
        }

        .challengeHeroEmoji {
          font-size: 30px;
        }

        .challengeHero h2 {
          margin:
            4px
            0;
          font-size: 22px;
        }

        .challengeHero p {
          margin: 0;
          color: #8d98a7;
          font-size: 12px;
        }

        .challengeHero button {
          flex-shrink: 0;
          border: none;
          border-radius: 13px;
          padding:
            12px
            15px;
          background:
            #fbbf24;
          color: #111;
          font-weight: 900;
          cursor: pointer;
        }

        .bottomNav {
          position: sticky;
          z-index: 20;
          bottom: 12px;
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 5px;
          margin:
            0
            0
            14px;
          padding: 6px;
          border:
            1px solid
            rgba(255,255,255,.08);
          border-radius: 18px;
          background:
            rgba(12,16,22,.92);
          backdrop-filter:
            blur(18px);
          box-shadow:
            0 12px 40px
            rgba(0,0,0,.4);
        }

        .navButton {
          border: none;
          border-radius: 13px;
          padding:
            8px
            4px;
          background:
            transparent;
          color: #687384;
          font-size: 10px;
          cursor: pointer;
        }

        .navButton span {
          display: block;
          margin-bottom: 2px;
          font-size: 18px;
        }

        .navButton.active {
          background:
            rgba(245,158,11,.14);
          color: #fbbf24;
        }

        .formBox {
          position: relative;
          z-index: 1;
          padding: 13px;
          margin-bottom: 13px;
          border-radius: 16px;
          background:
            rgba(0,0,0,.16);
        }

        .formGrid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .formBox input,
        .formBox select,
        .formBox textarea {
          margin-bottom: 8px;
        }

        .drinkRow {
          display: grid;
          grid-template-columns:
            42px
            1fr
            auto
            31px;
          gap: 10px;
          align-items: center;
          padding: 11px;
          margin-top: 8px;
          border-radius: 15px;
          background:
            rgba(255,255,255,.045);
        }

        .drinkIcon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background:
            rgba(245,158,11,.12);
          font-size: 21px;
        }

        .drinkInfo {
          min-width: 0;
        }

        .drinkInfo strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .drinkInfo small {
          display: block;
          margin-top: 3px;
          color: #7d8998;
          font-size: 10px;
        }

        .drinkPrice {
          color: #fbbf24;
          font-weight: 900;
          white-space: nowrap;
          font-size: 13px;
        }

        .assignmentRow {
          display: grid;
          grid-template-columns:
            1fr
            1.2fr;
          gap: 10px;
          align-items: center;
          padding: 10px;
          margin-top: 8px;
          border-radius: 14px;
          background:
            rgba(255,255,255,.04);
        }

        .assignmentRow strong {
          display: block;
        }

        .assignmentRow small {
          display: block;
          margin-top: 3px;
          color: #778291;
          font-size: 10px;
        }

        .assignmentRow select {
          margin: 0;
        }

        .templateBox {
          position: relative;
          z-index: 1;
          margin-bottom: 10px;
          padding: 12px;
          border-radius: 15px;
          background:
            rgba(245,158,11,.06);
          border:
            1px solid
            rgba(245,158,11,.10);
        }

        .templateBox label {
          display: block;
          margin-bottom: 7px;
          color: #fbbf24;
          font-size: 12px;
          font-weight: 900;
        }

        .templateBox select {
          margin-bottom: 8px;
        }

        .challengeList {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .challengeCard {
          position: relative;
          overflow: hidden;
          padding: 18px;
          border:
            1px solid
            rgba(255,255,255,.08);
          border-radius: 22px;
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.065),
              rgba(255,255,255,.025)
            );
        }

        .challengeCard.completed {
          opacity: .8;
        }

        .challengeCardHeader {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .challengeCategory {
          display: inline-block;
          margin-bottom: 7px;
          padding:
            5px
            9px;
          border-radius: 20px;
          background:
            rgba(245,158,11,.12);
          color: #fbbf24;
          font-size: 10px;
          font-weight: 900;
        }

        .challengeCard h3 {
          margin: 0;
          font-size: 20px;
        }

        .challengeCard p {
          margin:
            7px
            0;
          color: #8c97a5;
          font-size: 13px;
          line-height: 1.4;
        }

        .pointsBadge {
          flex-shrink: 0;
          height: fit-content;
          padding:
            7px
            9px;
          border-radius: 10px;
          background:
            rgba(251,191,36,.13);
          color: #fbbf24;
          font-weight: 900;
          font-size: 11px;
        }

        .challengeStatus {
          margin-top: 9px;
          color: #8893a1;
          font-size: 11px;
        }

        .challengeAssigned {
          margin-top: 9px;
          padding: 10px;
          border-radius: 12px;
          background:
            rgba(255,255,255,.04);
          font-size: 12px;
        }

        .challengeActions {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 7px;
          margin-top: 12px;
        }

        .challengeActions button {
          border: none;
          border-radius: 11px;
          padding: 11px;
          background:
            #222b37;
          color: #fff;
          cursor: pointer;
          font-weight: 800;
          font-size: 11px;
        }

        .challengeActions button:hover {
          background:
            #303b49;
        }

        .voteBox {
          margin-top: 13px;
          padding: 13px;
          border-radius: 15px;
          background:
            rgba(0,0,0,.15);
        }

        .voteBox label {
          display: block;
          margin-bottom: 7px;
          color: #8e99a7;
          font-size: 11px;
        }

        .voteButtons {
          display: grid;
          grid-template-columns:
            1fr
            1fr;
          gap: 8px;
          margin-top: 8px;
        }

        .voteButtons button {
          border: none;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          font-weight: 900;
        }

        .voteWinner {
          background:
            #166534 !important;
          color: #fff;
        }

        .voteLoser {
          background:
            #7f1d1d !important;
          color: #fff;
        }

        .completeButton {
          width: 100%;
          margin-top: 9px;
          border: none;
          border-radius: 12px;
          padding: 12px;
          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );
          color: #111;
          cursor: pointer;
          font-weight: 900;
        }

        .cancelButton {
          width: 100%;
          margin-top: 8px;
          border: none;
          border-radius: 12px;
          padding: 10px;
          background:
            #242c36;
          color: #a6afbb;
          cursor: pointer;
          font-size: 11px;
        }

        .rankingHero {
          margin-bottom: 14px;
          padding: 28px 20px;
          text-align: center;
          border-radius: 24px;
          background:
            linear-gradient(
              145deg,
              rgba(251,191,36,.18),
              rgba(245,158,11,.06)
            );
          border:
            1px solid
            rgba(251,191,36,.15);
        }

        .rankingHero span {
          font-size: 45px;
        }

        .rankingHero h2 {
          margin:
            6px
            0
            3px;
          font-size: 28px;
        }

        .rankingHero p {
          margin: 0;
          color: #8893a1;
          font-size: 12px;
        }

        .rankRow {
          display: grid;
          grid-template-columns:
            38px
            44px
            1fr
            auto;
          gap: 10px;
          align-items: center;
          padding: 12px;
          margin-top: 8px;
          border-radius: 16px;
          background:
            rgba(255,255,255,.045);
        }

        .rankRow.first {
          background:
            linear-gradient(
              135deg,
              rgba(251,191,36,.15),
              rgba(255,255,255,.04)
            );
          border:
            1px solid
            rgba(251,191,36,.18);
        }

        .rankNumber {
          text-align: center;
          font-size: 18px;
          font-weight: 900;
        }

        .rankAvatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
        }

        .rankInfo {
          min-width: 0;
        }

        .rankInfo strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rankInfo span {
          display: block;
          margin-top: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #8b96a4;
          font-size: 10px;
        }

        .rankPoints {
          text-align: right;
        }

        .rankPoints strong {
          display: block;
          color: #fbbf24;
          font-size: 18px;
        }

        .rankPoints small {
          color: #737e8c;
          font-size: 9px;
        }

        .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 28px 10px;
          text-align: center;
          color: #8994a3;
        }

        .empty span {
          margin-bottom: 8px;
          font-size: 35px;
        }

        .empty strong {
          color: #dbe0e7;
          font-size: 14px;
        }

        .empty small {
          margin-top: 4px;
          font-size: 11px;
        }

        .message {
          position: fixed;
          z-index: 100;
          left: 50%;
          bottom: 20px;
          width:
            min(
              calc(100% - 30px),
              600px
            );
          transform:
            translateX(-50%);
          padding:
            13px
            16px;
          border-radius: 15px;
          text-align: center;
          font-weight: 800;
          font-size: 12px;
          box-shadow:
            0 15px 45px
            rgba(0,0,0,.4);
          backdrop-filter:
            blur(15px);
        }

        .message.success {
          background:
            rgba(22,101,52,.94);
          border:
            1px solid
            rgba(74,222,128,.25);
        }

        .message.error {
          background:
            rgba(127,29,29,.96);
          border:
            1px solid
            rgba(248,113,113,.25);
        }

        .message.info {
          background:
            rgba(31,41,55,.96);
          border:
            1px solid
            rgba(255,255,255,.10);
        }

        footer {
          padding:
            35px
            10px
            10px;
          text-align: center;
          color: #4f5a68;
        }

        footer div {
          margin-bottom: 5px;
          font-size: 24px;
        }

        footer strong {
          display: block;
          color: #697585;
          font-size: 12px;
        }

        footer small {
          display: block;
          margin-top: 4px;
          font-size: 9px;
        }

        @media(max-width: 650px) {

          .app {
            padding:
              14px
              12px
              70px;
          }

          .hero {
            gap: 12px;
          }

          .heroIcon {
            width: 58px;
            height: 58px;
            border-radius: 17px;
            font-size: 30px;
          }

          .statsGrid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .inputRow {
            grid-template-columns:
              1fr;
          }

          .inputRow .primaryButton {
            width: 100%;
          }

          .formGrid {
            grid-template-columns:
              1fr;
          }

          .assignmentRow {
            grid-template-columns:
              1fr;
          }

          .drinkRow {
            grid-template-columns:
              39px
              1fr
              auto;
          }

          .drinkRow .smallDanger {
            grid-column: 3;
            grid-row: 1;
          }

          .drinkPrice {
            grid-column: 2;
            grid-row: 2;
            text-align: left;
          }

          .challengeHero {
            align-items: flex-start;
            flex-direction: column;
          }

          .challengeHero button {
            width: 100%;
          }

          .rankRow {
            grid-template-columns:
              32px
              40px
              1fr
              auto;
            gap: 7px;
          }

          .rankAvatar {
            width: 40px;
            height: 40px;
          }

          .rankInfo strong {
            font-size: 13px;
          }

          .rankPoints strong {
            font-size: 15px;
          }

        }

      `}</style>
    </main>
  );
}


/* ============================================================
   CHALLENGE CARD
   ============================================================ */

type ChallengeCardProps = {
  challenge: Challenge;
  profiles: Profile[];
  currentProfileId: string;
  targetProfile: string;
  onTargetChange: (
    value: string
  ) => void;
  onVote: (
    challenge: Challenge,
    targetProfileId: string,
    vote: "winner" | "loser"
  ) => void;
  onRandom: (
    challenge: Challenge
  ) => void;
  onComplete: (
    challenge: Challenge,
    winnerProfileId: string
  ) => void;
  onCancel: (
    challengeId: string
  ) => void;
  onParticipant: (
    challengeId: string,
    profileId: string
  ) => void;
  profileName: (
    profileId?: string | null
  ) => string;
};

function ChallengeCard({
  challenge,
  profiles,
  currentProfileId,
  targetProfile,
  onTargetChange,
  onVote,
  onRandom,
  onComplete,
  onCancel,
  onParticipant,
  profileName,
}: ChallengeCardProps) {
  const [winner, setWinner] =
    useState(
      challenge.winner_profile_id ||
        ""
    );

  const [participant, setParticipant] =
    useState(
      challenge.assigned_profile_id ||
        ""
    );

  const [showVoting, setShowVoting] =
    useState(false);

  return (
    <article
      className={
        challenge.status ===
        "completed"
          ? "challengeCard completed"
          : "challengeCard"
      }
    >

      <div className="challengeCardHeader">

        <div>

          <span className="challengeCategory">
            {challenge.category ||
              "Quatsch"}
          </span>

          <h3>
            {challenge.title}
          </h3>

          {challenge.description && (
            <p>
              {
                challenge.description
              }
            </p>
          )}

        </div>

        <div className="pointsBadge">
          +{challenge.points}
        </div>

      </div>


      <div className="challengeStatus">
        {challenge.status ===
        "completed"
          ? "🏆 Abgeschlossen"
          : challenge.status ===
            "cancelled"
          ? "❌ Beendet"
          : "🔥 Aktiv"}
      </div>


      {challenge.assigned_profile_id && (
        <div className="challengeAssigned">
          🎯 Aufgabe für:{" "}
          <strong>
            {profileName(
              challenge.assigned_profile_id
            )}
          </strong>
        </div>
      )}


      {challenge.status ===
        "open" && (
        <>

          <div className="challengeActions">

            <button
              onClick={() =>
                onRandom(
                  challenge
                )
              }
            >
              🎲 Zufällig
              vergeben
            </button>

            <button
              onClick={() =>
                setShowVoting(
                  !showVoting
                )
              }
            >
              🗳️ Abstimmen
            </button>

          </div>


          <div className="voteBox">

            <label>
              👤 Challenge-Teilnehmer
            </label>

            <select
              value={participant}
              onChange={(e) => {
                setParticipant(
                  e.target.value
                );

                onParticipant(
                  challenge.id,
                  e.target.value
                );
              }}
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

          </div>


          {showVoting && (
            <div className="voteBox">

              <label>
                🗳️ Wen soll die
                Gruppe bestimmen?
              </label>

              <select
                value={
                  targetProfile
                }
                onChange={(e) =>
                  onTargetChange(
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


              <div className="voteButtons">

                <button
                  className="voteWinner"
                  onClick={() =>
                    onVote(
                      challenge,
                      targetProfile,
                      "winner"
                    )
                  }
                  disabled={
                    !currentProfileId ||
                    !targetProfile
                  }
                >
                  👍 Dafür
                </button>

                <button
                  className="voteLoser"
                  onClick={() =>
                    onVote(
                      challenge,
                      targetProfile,
                      "loser"
                    )
                  }
                  disabled={
                    !currentProfileId ||
                    !targetProfile
                  }
                >
                  👎 Dagegen
                </button>

              </div>

            </div>
          )}


          <div className="voteBox">

            <label>
              🏆 Gewinner festlegen
            </label>

            <select
              value={winner}
              onChange={(e) =>
                setWinner(
                  e.target.value
                )
              }
            >
              <option value="">
                Gewinner auswählen
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
              className="completeButton"
              onClick={() =>
                onComplete(
                  challenge,
                  winner
                )
              }
              disabled={!winner}
            >
              🏆 Challenge
              abschließen · +
              {challenge.points}
              Punkte
            </button>

          </div>


          <button
            className="cancelButton"
            onClick={() =>
              onCancel(
                challenge.id
              )
            }
          >
            Challenge beenden
          </button>

        </>
      )}

    </article>
  );
}
