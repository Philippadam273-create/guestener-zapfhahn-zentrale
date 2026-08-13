"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

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
  created_by_profile_id?: string | null;
};

type Profile = {
  id: string;
  username?: string | null;
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

type Member = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string;
  gender_factor?: number | null;
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
  created_at?: string;
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
  title?: string | null;
  description?: string | null;
  points?: number | null;
  created_at?: string;
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

type Vote = {
  id: string;
  challenge_id: string;
  voter_profile_id: string;
  target_profile_id?: string | null;
  vote: string;
  comment?: string | null;
  created_at?: string;
};

type ChallengeParticipant = {
  id: string;
  challenge_id: string;
  profile_id: string;
  joined_at?: string;
  accepted?: boolean;
  completed?: boolean;
  points_awarded?: number;
};

const defaultEventSettings = {
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
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [currentProfile, setCurrentProfile] =
    useState<Profile | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [templates, setTemplates] = useState<ChallengeTemplate[]>([]);
  const [rankingTitles, setRankingTitles] =
    useState<RankingTitle[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [challengeParticipants, setChallengeParticipants] =
    useState<ChallengeParticipant[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] =
    useState<"overview" | "drinks" | "challenges" | "ranking">(
      "overview"
    );

  const [showEventForm, setShowEventForm] = useState(false);
  const [showDrinkForm, setShowDrinkForm] = useState(false);
  const [showChallengeForm, setShowChallengeForm] =
    useState(false);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] = useState("Bier");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");
  const [drinkQuantity, setDrinkQuantity] = useState("1");

  const [personName, setPersonName] = useState("");
  const [personWeight, setPersonWeight] = useState("");
  const [personHeight, setPersonHeight] = useState("");
  const [personAge, setPersonAge] = useState("");
  const [personGender, setPersonGender] = useState("männlich");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] =
    useState("");
  const [challengeCategory, setChallengeCategory] =
    useState("Quatsch");
  const [challengePoints, setChallengePoints] = useState("10");
  const [challengeRequiredVotes, setChallengeRequiredVotes] =
    useState("1");
  const [challengeTarget, setChallengeTarget] = useState("");

  const [selectedDrinkPerson, setSelectedDrinkPerson] =
    useState<Record<string, string>>({});

  const [selectedChallengeTarget, setSelectedChallengeTarget] =
    useState<Record<string, string>>({});

  const [selectedVote, setSelectedVote] =
    useState<Record<string, string>>({});

  function notify(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      notify("❌ Events konnten nicht geladen werden.");
      console.error(error);
      return;
    }

    setEvents(data || []);

    if (!eventId && data && data.length > 0) {
      setEventId(data[0].id);
    }
  }

  async function loadCurrentProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCurrentProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setCurrentProfile(data);
    }
  }

  async function loadMembers() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("event_members")
      .select("*")
      .eq("event_id", eventId)
      .order("joined_at", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      return;
    }

    const memberRows = data || [];

    const profileIds = memberRows
      .map((m) => m.profile_id)
      .filter(Boolean);

    if (profileIds.length === 0) {
      setMembers([]);
      setProfiles([]);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .in("id", profileIds);

    const profileRows = profileData || [];

    const combined = memberRows.map((member) => ({
      ...member,
      profile:
        profileRows.find(
          (profile) => profile.id === member.profile_id
        ) || null,
    }));

    setMembers(combined);
    setProfiles(profileRows);
  }

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
      console.error(error);
      notify("❌ Getränke konnten nicht geladen werden.");
      return;
    }

    setDrinks(data || []);
  }

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
      console.error(error);
      return;
    }

    setChallenges(data || []);

    const challengeIds = (data || []).map((x) => x.id);

    if (challengeIds.length > 0) {
      const { data: voteData } = await supabase
        .from("challenge_votes")
        .select("*")
        .in("challenge_id", challengeIds);

      setVotes(voteData || []);

      const { data: participantData } = await supabase
        .from("challenge_participants")
        .select("*")
        .in("challenge_id", challengeIds);

      setChallengeParticipants(participantData || []);
    } else {
      setVotes([]);
      setChallengeParticipants([]);
    }
  }

  async function loadTemplates() {
    const { data, error } = await supabase
      .from("challenge_templates")
      .select("*")
      .eq("is_active", true)
      .order("title");

    if (!error) {
      setTemplates(data || []);
    }
  }

  async function loadRankingTitles() {
    const { data, error } = await supabase
      .from("ranking_titles")
      .select("*")
      .order("min_points", {
        ascending: true,
      });

    if (!error) {
      setRankingTitles(data || []);
    }
  }

  async function reloadEverything() {
    setLoading(true);

    await Promise.all([
      loadEvents(),
      loadCurrentProfile(),
      loadTemplates(),
      loadRankingTitles(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    reloadEverything();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    async function loadEventData() {
      setLoading(true);

      await Promise.all([
        loadMembers(),
        loadDrinks(),
        loadChallenges(),
      ]);

      setLoading(false);
    }

    loadEventData();
  }, [eventId]);

  const currentEvent = useMemo(
    () =>
      events.find((event) => event.id === eventId) ||
      null,
    [events, eventId]
  );

  const eventSettings = useMemo(
    () => ({
      ...defaultEventSettings,
      ...(currentEvent || {}),
    }),
    [currentEvent]
  );

  const eventMembers = useMemo(() => {
    return members.filter((m) => m.profile);
  }, [members]);

  const totalLiters = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        Number(drink.liters ?? drink.menge ?? 0) *
          Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const totalCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        Number(drink.preis ?? 0) *
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

  function getMemberDrinks(profileId: string) {
    return drinks.filter(
      (drink) => drink.profile_id === profileId
    );
  }

  function getPersonStats(profileId: string) {
    const personDrinks = getMemberDrinks(profileId);

    const count = personDrinks.reduce(
      (sum, drink) =>
        sum + Number(drink.quantity ?? 1),
      0
    );

    const liters = personDrinks.reduce(
      (sum, drink) =>
        sum +
        Number(drink.liters ?? drink.menge ?? 0) *
          Number(drink.quantity ?? 1),
      0
    );

    const cost = personDrinks.reduce(
      (sum, drink) =>
        sum +
        Number(drink.preis ?? 0) *
          Number(drink.quantity ?? 1),
      0
    );

    const alcoholGrams = personDrinks.reduce(
      (sum, drink) => {
        const litersValue = Number(
          drink.liters ?? drink.menge ?? 0
        );

        const alcoholPercent = Number(
          drink.alcohol_percent ??
            drink.alkohol ??
            0
        );

        const quantity = Number(
          drink.quantity ?? 1
        );

        const grams =
          litersValue *
          quantity *
          (alcoholPercent / 100) *
          789;

        return sum + grams;
      },
      0
    );

    return {
      count,
      liters,
      cost,
      alcoholGrams,
    };
  }

  function calculatePromille(profile: Profile) {
    const stats = getPersonStats(profile.id);

    const weight =
      Number(
        profile.weight_kg ??
          profile.gewicht_kg ??
          0
      ) || 0;

    const gender =
      String(
        profile.gender ??
          profile.geschlecht ??
          ""
      ).toLowerCase();

    if (!weight || !stats.alcoholGrams) {
      return 0;
    }

    const factor =
      gender.includes("w") ||
      gender.includes("frau")
        ? 0.55
        : 0.68;

    const promille =
      stats.alcoholGrams /
      (weight * factor);

    return Math.max(0, promille);
  }

  function getRankingTitle(points: number) {
    if (rankingTitles.length === 0) {
      if (points >= 100) {
        return {
          emoji: "👑",
          title: "Legende der Nacht",
        };
      }

      if (points >= 50) {
        return {
          emoji: "🔥",
          title: "Abriss-Profi",
        };
      }

      if (points >= 25) {
        return {
          emoji: "🍻",
          title: "Zapfhahn-Held",
        };
      }

      return {
        emoji: "😎",
        title: "Anwärter auf Ruhm",
      };
    }

    const available = rankingTitles
      .filter((item) => points >= item.min_points)
      .sort(
        (a, b) => b.min_points - a.min_points
      );

    return (
      available[0] || {
        emoji: "😎",
        title: "Anwärter auf Ruhm",
      }
    );
  }

  const ranking = useMemo(() => {
    return eventMembers
      .map((member) => {
        const profile = member.profile!;

        const stats = getPersonStats(
          profile.id
        );

        const challengePoints =
          challenges.reduce(
            (sum, challenge) => {
              if (
                challenge.winner_profile_id ===
                profile.id
              ) {
                return (
                  sum +
                  Number(
                    challenge.points ?? 0
                  )
                );
              }

              return sum;
            },
            0
          );

        const profilePoints =
          Number(profile.points ?? 0);

        return {
          member,
          profile,
          stats,
          points:
            profilePoints +
            challengePoints,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [
    eventMembers,
    drinks,
    challenges,
  ]);

  const totalPoints = ranking.reduce(
    (sum, item) => sum + item.points,
    0
  );

  async function createEvent() {
    if (!eventTitle.trim()) {
      notify("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    setSaving(true);

    const insertData = {
      title: eventTitle.trim(),
      description:
        eventDescription.trim() || null,
      location:
        eventLocation.trim() || null,
      start_date:
        eventStart || null,
      end_date:
        eventEnd || null,
      is_active: true,
      ...defaultEventSettings,
      created_by_profile_id:
        currentProfile?.id || null,
    };

    const { data, error } = await supabase
      .from("events")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      console.error(error);
      notify(
        "❌ Event konnte nicht erstellt werden: " +
          error.message
      );
      setSaving(false);
      return;
    }

    if (data) {
      setEvents((previous) => [
        data,
        ...previous,
      ]);

      setEventId(data.id);
    }

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setEventStart("");
    setEventEnd("");

    setShowEventForm(false);
    setSaving(false);

    notify("🎉 Event erfolgreich erstellt!");
  }

  async function deleteEvent() {
    if (!currentEvent) return;

    const confirmed = window.confirm(
      `Soll das Event "${currentEvent.title}" wirklich gelöscht werden?\n\nDabei werden die zugehörigen Getränke, Teilnehmer und Challenges gelöscht.`
    );

    if (!confirmed) return;

    setSaving(true);

    const id = currentEvent.id;

    const challengeIds = challenges.map(
      (challenge) => challenge.id
    );

    if (challengeIds.length > 0) {
      await supabase
        .from("challenge_votes")
        .delete()
        .in(
          "challenge_id",
          challengeIds
        );

      await supabase
        .from("challenge_results")
        .delete()
        .in(
          "challenge_id",
          challengeIds
        );

      await supabase
        .from("challenge_participants")
        .delete()
        .in(
          "challenge_id",
          challengeIds
        );

      await supabase
        .from("challenges")
        .delete()
        .eq("event_id", id);
    }

    await supabase
      .from("drinks")
      .delete()
      .eq("event_id", id);

    await supabase
      .from("event_members")
      .delete()
      .eq("event_id", id);

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);

      notify(
        "❌ Event konnte nicht gelöscht werden: " +
          error.message
      );

      setSaving(false);
      return;
    }

    const remaining = events.filter(
      (event) => event.id !== id
    );

    setEvents(remaining);

    if (remaining.length > 0) {
      setEventId(remaining[0].id);
    } else {
      setEventId("");
    }

    setMembers([]);
    setDrinks([]);
    setChallenges([]);

    setSaving(false);

    notify("🗑️ Event wurde gelöscht.");
  }

  async function addParticipant() {
    if (!eventId) {
      notify("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!personName.trim()) {
      notify("❌ Bitte einen Namen eingeben.");
      return;
    }

    const existing = eventMembers.find(
      (member) =>
        String(
          member.profile?.username || ""
        ).toLowerCase() ===
        personName.trim().toLowerCase()
    );

    if (existing) {
      notify("❌ Teilnehmer ist bereits dabei.");
      return;
    }

    setSaving(true);

    const {
      data: existingProfile,
    } = await supabase
      .from("profiles")
      .select("*")
      .ilike(
        "username",
        personName.trim()
      )
      .maybeSingle();

    let profile = existingProfile as Profile | null;

    if (!profile) {
      const { data: createdProfile, error } =
        await supabase
          .from("profiles")
          .insert({
            username: personName.trim(),
            points: 0,
            drinks_count: 0,
            weight_kg:
              Number(personWeight) || null,
            height_cm:
              Number(personHeight) || null,
            age:
              Number(personAge) || null,
            gender:
              personGender || null,
            gewicht_kg:
              Number(personWeight) || null,
            alter:
              Number(personAge) || null,
            geschlecht:
              personGender || null,
            role: "member",
          })
          .select("*")
          .single();

      if (error) {
        console.error(error);
        notify(
          "❌ Teilnehmer konnte nicht erstellt werden: " +
            error.message
        );
        setSaving(false);
        return;
      }

      profile = createdProfile;
    } else {
      const updates: Record<string, unknown> = {};

      if (personWeight) {
        updates.weight_kg =
          Number(personWeight);
        updates.gewicht_kg =
          Number(personWeight);
      }

      if (personHeight) {
        updates.height_cm =
          Number(personHeight);
      }

      if (personAge) {
        updates.age = Number(personAge);
        updates.alter = Number(personAge);
      }

      if (personGender) {
        updates.gender = personGender;
        updates.geschlecht = personGender;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("profiles")
          .update(updates)
          .eq("id", profile.id);
      }
    }

    if (!profile) {
      setSaving(false);
      return;
    }

    const { error: memberError } =
      await supabase
        .from("event_members")
        .insert({
          event_id: eventId,
          profile_id: profile.id,
          joined_via_code:
            currentEvent?.invite_code || null,
        });

    if (memberError) {
      console.error(memberError);

      notify(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          memberError.message
      );

      setSaving(false);
      return;
    }

    setPersonName("");
    setPersonWeight("");
    setPersonHeight("");
    setPersonAge("");

    await loadMembers();

    setSaving(false);

    notify(
      "👥 " +
        profile.username +
        " wurde hinzugefügt!"
    );
  }

  async function removeParticipant(
    member: Member
  ) {
    const name =
      member.profile?.username ||
      "Teilnehmer";

    if (
      !window.confirm(
        `${name} wirklich aus dem Event entfernen?`
      )
    ) {
      return;
    }

    setSaving(true);

    await supabase
      .from("drinks")
      .delete()
      .eq("event_id", eventId)
      .eq("profile_id", member.profile_id);

    await supabase
      .from("event_members")
      .delete()
      .eq("id", member.id);

    await loadMembers();
    await loadDrinks();

    setSaving(false);

    notify("🗑️ Teilnehmer entfernt.");
  }

  async function saveDrink() {
    if (!eventId) {
      notify("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      notify("❌ Bitte ein Getränk eingeben.");
      return;
    }

    setSaving(true);

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
        drink_name: drinkName.trim(),
        getraenk: drinkName.trim(),
        brand:
          drinkBrand.trim() || null,
        marke:
          drinkBrand.trim() || null,
        category: drinkCategory,
        liters,
        menge: liters,
        alcohol_percent: alcohol,
        alkohol: alcohol,
        preis: price,
        quantity,
        shared_cost: false,
        ai_detected: false,
      });

    if (error) {
      console.error(error);

      notify(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );

      setSaving(false);
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");
    setDrinkQuantity("1");

    await loadDrinks();

    setShowDrinkForm(false);
    setSaving(false);

    notify("🍺 Getränk gespeichert!");
  }

  async function assignDrink(
    drinkId: string,
    profileId: string
  ) {
    if (!profileId) return;

    const drink = drinks.find(
      (item) => item.id === drinkId
    );

    if (!drink) return;

    setSaving(true);

    const quantity =
      Number(drink.quantity ?? 1);

    const currentProfileId =
      drink.profile_id;

    if (
      currentProfileId &&
      currentProfileId !== profileId
    ) {
      notify(
        "⚠️ Dieses Getränk ist bereits jemandem zugeordnet."
      );

      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .update({
        profile_id: profileId,
      })
      .eq("id", drinkId);

    if (error) {
      console.error(error);

      notify(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );

      setSaving(false);
      return;
    }

    await loadDrinks();

    setSelectedDrinkPerson(
      (previous) => ({
        ...previous,
        [drinkId]: "",
      })
    );

    setSaving(false);

    notify(
      `🍺 Getränk zugeordnet! +${quantity * 10} mögliche Punkte`
    );
  }

  async function createChallengeFromTemplate(
    template: ChallengeTemplate
  ) {
    setChallengeTitle(template.title);
    setChallengeDescription(
      template.description || ""
    );
    setChallengeCategory(
      template.category || "Quatsch"
    );
    setChallengePoints(
      String(template.default_points ?? 10)
    );
    setChallengeRequiredVotes(
      String(template.minimum_votes ?? 1)
    );

    setShowChallengeForm(true);
  }

  async function createChallenge() {
    if (!eventId) {
      notify("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!challengeTitle.trim()) {
      notify("❌ Bitte einen Challenge-Titel eingeben.");
      return;
    }

    setSaving(true);

    const points =
      Number(challengePoints) || 10;

    const requiredVotes =
      Number(challengeRequiredVotes) || 1;

    const { data, error } = await supabase
      .from("challenges")
      .insert({
        event_id: eventId,
        title: challengeTitle.trim(),
        description:
          challengeDescription.trim() ||
          null,
        points,
        category:
          challengeCategory || "Quatsch",
        status: "open",
        created_by_profile_id:
          currentProfile?.id || null,
        assigned_profile_id:
          challengeTarget || null,
        required_votes: requiredVotes,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      console.error(error);

      notify(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );

      setSaving(false);
      return;
    }

    if (data) {
      setChallenges((previous) => [
        data,
        ...previous,
      ]);

      if (challengeTarget) {
        await supabase
          .from("challenge_participants")
          .insert({
            challenge_id: data.id,
            profile_id: challengeTarget,
            accepted: true,
            completed: false,
            points_awarded: 0,
          });
      }
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengeCategory("Quatsch");
    setChallengePoints("10");
    setChallengeRequiredVotes("1");
    setChallengeTarget("");

    setShowChallengeForm(false);

    await loadChallenges();

    setSaving(false);

    notify("🎯 Challenge erstellt!");
  }

  async function joinChallenge(
    challenge: Challenge
  ) {
    if (!currentProfile?.id) {
      notify(
        "❌ Kein eingeloggtes Profil gefunden."
      );
      return;
    }

    const alreadyJoined =
      challengeParticipants.some(
        (item) =>
          item.challenge_id === challenge.id &&
          item.profile_id ===
            currentProfile.id
      );

    if (alreadyJoined) {
      notify("ℹ️ Du bist bereits dabei.");
      return;
    }

    const { error } = await supabase
      .from("challenge_participants")
      .insert({
        challenge_id: challenge.id,
        profile_id: currentProfile.id,
        accepted: true,
        completed: false,
        points_awarded: 0,
      });

    if (error) {
      notify(
        "❌ Teilnahme nicht möglich: " +
          error.message
      );
      return;
    }

    await loadChallenges();

    notify("🎯 Du bist bei der Challenge dabei!");
  }

  async function completeChallenge(
    challenge: Challenge,
    profileId: string
  ) {
    const points =
      Number(challenge.points ?? 0);

    const { error } = await supabase
      .from("challenge_results")
      .insert({
        challenge_id: challenge.id,
        profile_id: profileId,
        place: 1,
        points,
        result_type: "winner",
      });

    if (error) {
      console.error(error);

      notify(
        "❌ Ergebnis konnte nicht gespeichert werden: " +
          error.message
      );

      return;
    }

    await supabase
      .from("challenges")
      .update({
        status: "completed",
        winner_profile_id: profileId,
        completed_at:
          new Date().toISOString(),
        is_active: false,
      })
      .eq("id", challenge.id);

    const winnerProfile =
      profiles.find(
        (profile) =>
          profile.id === profileId
      );

    if (winnerProfile) {
      await supabase
        .from("profiles")
        .update({
          points:
            Number(
              winnerProfile.points ?? 0
            ) + points,
        })
        .eq("id", profileId);
    }

    await loadChallenges();
    await loadMembers();

    notify(
      `🏆 Challenge gewonnen! +${points} Punkte`
    );
  }

  async function voteForChallenge(
    challenge: Challenge,
    targetProfileId: string
  ) {
    if (!currentProfile?.id) {
      notify(
        "❌ Kein eingeloggtes Profil gefunden."
      );
      return;
    }

    if (
      currentProfile.id ===
      targetProfileId
    ) {
      notify(
        "😜 Du kannst nicht für dich selbst abstimmen."
      );
      return;
    }

    const existingVote =
      votes.find(
        (vote) =>
          vote.challenge_id ===
            challenge.id &&
          vote.voter_profile_id ===
            currentProfile.id
      );

    if (existingVote) {
      notify(
        "🗳️ Du hast bereits abgestimmt."
      );
      return;
    }

    const { error } = await supabase
      .from("challenge_votes")
      .insert({
        challenge_id: challenge.id,
        voter_profile_id:
          currentProfile.id,
        target_profile_id:
          targetProfileId,
        vote: "yes",
      });

    if (error) {
      console.error(error);

      notify(
        "❌ Abstimmung fehlgeschlagen: " +
          error.message
      );

      return;
    }

    await loadChallenges();

    notify("🗳️ Stimme abgegeben!");
  }

  async function deleteChallenge(
    challenge: Challenge
  ) {
    if (
      !window.confirm(
        `Challenge "${challenge.title}" wirklich löschen?`
      )
    ) {
      return;
    }

    await supabase
      .from("challenge_votes")
      .delete()
      .eq(
        "challenge_id",
        challenge.id
      );

    await supabase
      .from("challenge_results")
      .delete()
      .eq(
        "challenge_id",
        challenge.id
      );

    await supabase
      .from("challenge_participants")
      .delete()
      .eq(
        "challenge_id",
        challenge.id
      );

    const { error } = await supabase
      .from("challenges")
      .delete()
      .eq("id", challenge.id);

    if (error) {
      notify(
        "❌ Challenge konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    await loadChallenges();

    notify("🗑️ Challenge gelöscht.");
  }

  function formatDate(date?: string | null) {
    if (!date) return "";

    return new Date(
      date + "T00:00:00"
    ).toLocaleDateString(
      "de-DE",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  function challengeEmoji(category?: string | null) {
    const value =
      String(category || "")
        .toLowerCase();

    if (value.includes("abstimm"))
      return "🗳️";

    if (value.includes("duell"))
      return "⚔️";

    if (value.includes("geschick"))
      return "🎯";

    if (value.includes("kreat"))
      return "🎨";

    if (value.includes("mut"))
      return "😈";

    if (value.includes("party"))
      return "🎉";

    if (value.includes("trink"))
      return "🍺";

    if (value.includes("wissen"))
      return "🧠";

    if (value.includes("team"))
      return "👥";

    if (value.includes("zufall"))
      return "🎲";

    if (value.includes("schnell"))
      return "⚡";

    return "🤪";
  }

  function votesForChallenge(
    challengeId: string
  ) {
    return votes.filter(
      (vote) =>
        vote.challenge_id ===
        challengeId
    );
  }

  function getProfileName(
    profileId?: string | null
  ) {
    if (!profileId) return "Niemand";

    return (
      profiles.find(
        (profile) =>
          profile.id === profileId
      )?.username ||
      "Teilnehmer"
    );
  }

  if (loading && events.length === 0) {
    return (
      <main className="page">
        <div className="loading">
          <div className="loadingEmoji">
            🍻
          </div>
          <h1>
            Güstener Zapfhahn Zentrale
          </h1>
          <p>
            Wir machen die Party startklar...
          </p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="backgroundBubble bubble1" />
      <div className="backgroundBubble bubble2" />
      <div className="backgroundBubble bubble3" />

      <div className="container">

        <header className="hero">
          <div className="heroLogo">
            🍻
          </div>

          <div className="heroText">
            <div className="eyebrow">
              🍺 DIE OFFIZIELLE PARTY-ZENTRALE
            </div>

            <h1>
              Güstener
              <br />
              <span>
                Zapfhahn Zentrale
              </span>
            </h1>

            <p>
              Getränke. Challenges.
              Punkte. Chaos.
            </p>
          </div>

          <button
            className="refreshButton"
            onClick={reloadEverything}
            title="Aktualisieren"
          >
            🔄
          </button>
        </header>

        <section className="eventBar">

          <div className="eventSelector">
            <span className="eventIcon">
              📅
            </span>

            <div>
              <small>
                AKTUELLES EVENT
              </small>

              <select
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
            </div>
          </div>

          <div className="eventActions">
            <button
              className="smallButton primary"
              onClick={() =>
                setShowEventForm(
                  !showEventForm
                )
              }
            >
              ➕ Neues Event
            </button>

            {currentEvent && (
              <button
                className="smallButton danger"
                onClick={deleteEvent}
                disabled={saving}
              >
                🗑️ Löschen
              </button>
            )}
          </div>
        </section>

        {showEventForm && (
          <section className="card eventCreate">
            <div className="sectionHeader">
              <div>
                <span className="sectionEmoji">
                  🎉
                </span>
                <div>
                  <h2>
                    Neues Event
                  </h2>
                  <p>
                    Wo geht die nächste
                    Eskalation los?
                  </p>
                </div>
              </div>
            </div>

            <div className="formGrid">
              <div className="full">
                <label>
                  Eventname
                </label>

                <input
                  value={eventTitle}
                  onChange={(e) =>
                    setEventTitle(
                      e.target.value
                    )
                  }
                  placeholder="z. B. Güstener Sommerparty"
                />
              </div>

              <div>
                <label>
                  Ort
                </label>

                <input
                  value={eventLocation}
                  onChange={(e) =>
                    setEventLocation(
                      e.target.value
                    )
                  }
                  placeholder="Güsten"
                />
              </div>

              <div>
                <label>
                  Start
                </label>

                <input
                  type="date"
                  value={eventStart}
                  onChange={(e) =>
                    setEventStart(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  Ende
                </label>

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

              <div className="full">
                <label>
                  Beschreibung
                </label>

                <textarea
                  value={eventDescription}
                  onChange={(e) =>
                    setEventDescription(
                      e.target.value
                    )
                  }
                  placeholder="Was wird heute angestellt?"
                  rows={3}
                />
              </div>
            </div>

            <button
              className="bigAction"
              onClick={createEvent}
              disabled={saving}
            >
              {saving
                ? "⏳ Wird erstellt..."
                : "🚀 Event erstellen"}
            </button>
          </section>
        )}

        {!currentEvent ? (
          <section className="emptyState">
            <div>
              🍻
            </div>

            <h2>
              Noch kein Event am Start
            </h2>

            <p>
              Erstelle dein erstes Event
              und lass den Wahnsinn
              beginnen.
            </p>

            <button
              className="bigAction"
              onClick={() =>
                setShowEventForm(true)
              }
            >
              🎉 Erstes Event erstellen
            </button>
          </section>
        ) : (
          <>
            <section className="eventInfo">

              <div>
                <span className="liveDot" />
                <b>
                  {currentEvent.title}
                </b>

                {currentEvent.location && (
                  <span>
                    📍{" "}
                    {currentEvent.location}
                  </span>
                )}

                {currentEvent.start_date && (
                  <span>
                    📅{" "}
                    {formatDate(
                      currentEvent.start_date
                    )}
                  </span>
                )}
              </div>

              <div className="inviteCode">
                🎟️{" "}
                <b>
                  {currentEvent.invite_code ||
                    "Kein Code"}
                </b>
              </div>
            </section>

            <section className="statsGrid">

              <div className="statCard orange">
                <span>
                  🍺
                </span>
                <strong>
                  {totalDrinks}
                </strong>
                <small>
                  GETRÄNKE
                </small>
              </div>

              <div className="statCard blue">
                <span>
                  💧
                </span>
                <strong>
                  {totalLiters.toFixed(1)}
                </strong>
                <small>
                  LITER
                </small>
              </div>

              <div className="statCard green">
                <span>
                  💶
                </span>
                <strong>
                  {totalCost.toFixed(2)} €
                </strong>
                <small>
                  KOSTEN
                </small>
              </div>

              <div className="statCard purple">
                <span>
                  👥
                </span>
                <strong>
                  {eventMembers.length}
                </strong>
                <small>
                  TEILNEHMER
                </small>
              </div>

            </section>

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

            {activeTab ===
              "overview" && (
              <>
                <section className="card">
                  <div className="sectionHeader">
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

                  <div className="participantForm">
                    <input
                      placeholder="Name"
                      value={personName}
                      onChange={(e) =>
                        setPersonName(
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      placeholder="Gewicht kg"
                      value={personWeight}
                      onChange={(e) =>
                        setPersonWeight(
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      placeholder="Größe cm"
                      value={personHeight}
                      onChange={(e) =>
                        setPersonHeight(
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
                      <option value="männlich">
                        👨 Männlich
                      </option>

                      <option value="weiblich">
                        👩 Weiblich
                      </option>
                    </select>

                    <button
                      onClick={
                        addParticipant
                      }
                      disabled={saving}
                    >
                      ➕ Hinzufügen
                    </button>
                  </div>

                  <div className="peopleGrid">

                    {eventMembers.length ===
                    0 ? (
                      <div className="emptyMini">
                        👥 Noch niemand
                        dabei.
                      </div>
                    ) : (
                      eventMembers.map(
                        (member) => {
                          const profile =
                            member.profile!;

                          const stats =
                            getPersonStats(
                              profile.id
                            );

                          const promille =
                            calculatePromille(
                              profile
                            );

                          const points =
                            ranking.find(
                              (item) =>
                                item.profile
                                  .id ===
                                profile.id
                            )?.points || 0;

                          const title =
                            getRankingTitle(
                              points
                            );

                          return (
                            <div
                              className="personCard"
                              key={
                                member.id
                              }
                            >
                              <div className="personTop">
                                <div className="avatar">
                                  {profile.username
                                    ?.charAt(
                                      0
                                    )
                                    .toUpperCase() ||
                                    "👤"}
                                </div>

                                <div className="personName">
                                  <b>
                                    {
                                      profile.username
                                    }
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

                                <button
                                  className="iconDelete"
                                  onClick={() =>
                                    removeParticipant(
                                      member
                                    )
                                  }
                                >
                                  ×
                                </button>
                              </div>

                              <div className="personStats">
                                <span>
                                  🍺{" "}
                                  {
                                    stats.count
                                  }
                                </span>

                                <span>
                                  💧{" "}
                                  {stats.liters.toFixed(
                                    1
                                  )}{" "}
                                  L
                                </span>

                                {eventSettings.show_points && (
                                  <span>
                                    🏆{" "}
                                    {
                                      points
                                    }
                                  </span>
                                )}

                                {eventSettings.show_promille && (
                                  <span className="promille">
                                    🥴{" "}
                                    {promille.toFixed(
                                      2
                                    )}‰
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )
                    )}

                  </div>
                </section>

                <section className="card challengeTeaser">

                  <div className="challengeTeaserText">
                    <span>
                      🎯
                    </span>

                    <div>
                      <h2>
                        Zeit für Quatsch?
                      </h2>

                      <p>
                        Challenges bringen
                        Punkte und Ruhm.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setActiveTab(
                        "challenges"
                      )
                    }
                  >
                    🚀 Los geht's
                  </button>
                </section>

                {eventSettings.cost_overview_enabled && (
                  <section className="card costCard">
                    <div className="sectionHeader">
                      <div>
                        <span className="sectionEmoji">
                          💶
                        </span>

                        <div>
                          <h2>
                            Kosten
                          </h2>

                          <p>
                            Wer zahlt
                            den Spaß?
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="costBig">
                      {totalCost.toFixed(
                        2
                      )}{" "}
                      €
                    </div>

                    <div className="costRows">

                      <div>
                        <span>
                          👥 Teilnehmer
                        </span>

                        <b>
                          {
                            eventMembers.length
                          }
                        </b>
                      </div>

                      <div>
                        <span>
                          💶 Pro Person
                        </span>

                        <b>
                          {eventMembers.length >
                          0
                            ? (
                                totalCost /
                                eventMembers.length
                              ).toFixed(
                                2
                              )
                            : "0.00"}{" "}
                          €
                        </b>
                      </div>

                      <div>
                        <span>
                          🏆 Punkte
                        </span>

                        <b>
                          {totalPoints}
                        </b>
                      </div>

                    </div>
                  </section>
                )}
              </>
            )}

            {activeTab ===
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
                          Was läuft
                          heute durch
                          den Zapfhahn?
                        </p>
                      </div>
                    </div>

                    <button
                      className="smallButton primary"
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
                    <div className="drinkForm">

                      <input
                        placeholder="Getränk"
                        value={
                          drinkName
                        }
                        onChange={(e) =>
                          setDrinkName(
                            e.target
                              .value
                          )
                        }
                      />

                      <div className="formGrid">

                        <div>
                          <label>
                            Marke
                          </label>

                          <input
                            value={
                              drinkBrand
                            }
                            onChange={(e) =>
                              setDrinkBrand(
                                e.target
                                  .value
                              )
                            }
                            placeholder="Krombacher"
                          />
                        </div>

                        <div>
                          <label>
                            Kategorie
                          </label>

                          <select
                            value={
                              drinkCategory
                            }
                            onChange={(e) =>
                              setDrinkCategory(
                                e.target
                                  .value
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
                              Schnaps
                            </option>

                            <option>
                              Alkoholfrei
                            </option>

                            <option>
                              Sonstiges
                            </option>
                          </select>
                        </div>

                        <div>
                          <label>
                            Liter
                          </label>

                          <input
                            type="number"
                            step="0.01"
                            value={
                              drinkLiters
                            }
                            onChange={(e) =>
                              setDrinkLiters(
                                e.target
                                  .value
                              )
                            }
                          />
                        </div>

                        <div>
                          <label>
                            Alkohol %
                          </label>

                          <input
                            type="number"
                            step="0.1"
                            value={
                              drinkAlcohol
                            }
                            onChange={(e) =>
                              setDrinkAlcohol(
                                e.target
                                  .value
                              )
                            }
                          />
                        </div>

                        <div>
                          <label>
                            Preis €
                          </label>

                          <input
                            type="number"
                            step="0.01"
                            value={
                              drinkPrice
                            }
                            onChange={(e) =>
                              setDrinkPrice(
                                e.target
                                  .value
                              )
                            }
                          />
                        </div>

                        <div>
                          <label>
                            Anzahl
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={
                              drinkQuantity
                            }
                            onChange={(e) =>
                              setDrinkQuantity(
                                e.target
                                  .value
                              )
                            }
                          />
                        </div>

                      </div>

                      <button
                        className="bigAction"
                        onClick={
                          saveDrink
                        }
                        disabled={saving}
                      >
                        🍻 Getränk
                        speichern
                      </button>

                    </div>
                  )}

                  <div className="drinkList">

                    {drinks.length ===
                    0 ? (
                      <div className="emptyMini">
                        🍺 Noch keine
                        Getränke.
                      </div>
                    ) : (
                      drinks.map(
                        (drink) => {
                          const assigned =
                            drink.profile_id
                              ? getProfileName(
                                  drink.profile_id
                                )
                              : null;

                          return (
                            <div
                              className="drinkItem"
                              key={
                                drink.id
                              }
                            >
                              <div className="drinkIcon">
                                {drinkCategory ===
                                "Wein"
                                  ? "🍷"
                                  : drinkCategory ===
                                    "Schnaps"
                                  ? "🥃"
                                  : drinkCategory ===
                                    "Sekt"
                                  ? "🥂"
                                  : "🍺"}
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
                                    2
                                  )}{" "}
                                  L

                                  {" · "}

                                  {Number(
                                    drink.alcohol_percent ??
                                      drink.alkohol ??
                                      0
                                  ).toFixed(
                                    1
                                  )}
                                  %

                                  {" · "}

                                  {Number(
                                    drink.preis ??
                                      0
                                  ).toFixed(
                                    2
                                  )}{" "}
                                  €
                                </small>

                                <small className="assigned">
                                  {assigned
                                    ? `👤 ${assigned}`
                                    : "🔗 Noch niemandem zugeordnet"}
                                </small>
                              </div>

                              <select
                                value={
                                  selectedDrinkPerson[
                                    drink.id
                                  ] || ""
                                }
                                onChange={(
                                  e
                                ) => {
                                  const value =
                                    e
                                      .target
                                      .value;

                                  setSelectedDrinkPerson(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      [drink.id]:
                                        value,
                                    })
                                  );

                                  if (
                                    value
                                  ) {
                                    assignDrink(
                                      drink.id,
                                      value
                                    );
                                  }
                                }}
                              >
                                <option value="">
                                  👤 Zuordnen
                                </option>

                                {eventMembers.map(
                                  (
                                    member
                                  ) => (
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
                                          ?.username
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          );
                        }
                      )
                    )}

                  </div>
                </section>
              </>
            )}

            {activeTab ===
              "challenges" && (
              <>
                <section className="card challengeHero">

                  <div>
                    <span className="bigChallengeEmoji">
                      🎯
                    </span>

                    <h2>
                      Challenge-Zentrale
                    </h2>

                    <p>
                      Aufgaben erfüllen,
                      abstimmen, gewinnen
                      und Punkte kassieren.
                    </p>
                  </div>

                  <button
                    className="bigAction"
                    onClick={() =>
                      setShowChallengeForm(
                        !showChallengeForm
                      )
                    }
                  >
                    ➕ Neue Challenge
                  </button>

                </section>

                {templates.length >
                  0 && (
                  <section className="card">

                    <div className="sectionHeader">
                      <div>
                        <span className="sectionEmoji">
                          💡
                        </span>

                        <div>
                          <h2>
                            Ideen
                          </h2>

                          <p>
                            Mit einem Klick
                            eine Challenge
                            vorbereiten.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="templateGrid">
                      {templates
                        .slice(
                          0,
                          12
                        )
                        .map(
                          (
                            template
                          ) => (
                            <button
                              className="templateCard"
                              key={
                                template.id
                              }
                              onClick={() =>
                                createChallengeFromTemplate(
                                  template
                                )
                              }
                            >
                              <span>
                                {challengeEmoji(
                                  template.category
                                )}
                              </span>

                              <b>
                                {
                                  template.title
                                }
                              </b>

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
                )}

                {showChallengeForm && (
                  <section className="card">

                    <div className="sectionHeader">
                      <div>
                        <span className="sectionEmoji">
                          🚀
                        </span>

                        <div>
                          <h2>
                            Challenge
                            erstellen
                          </h2>

                          <p>
                            Wer muss
                            heute was
                            machen?
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="formGrid">

                      <div className="full">
                        <label>
                          Titel
                        </label>

                        <input
                          value={
                            challengeTitle
                          }
                          onChange={(e) =>
                            setChallengeTitle(
                              e.target
                                .value
                            )
                          }
                          placeholder="z. B. Singe einen Schlager"
                        />
                      </div>

                      <div className="full">
                        <label>
                          Aufgabe
                        </label>

                        <textarea
                          value={
                            challengeDescription
                          }
                          onChange={(e) =>
                            setChallengeDescription(
                              e.target
                                .value
                            )
                          }
                          rows={3}
                          placeholder="Was muss gemacht werden?"
                        />
                      </div>

                      <div>
                        <label>
                          Kategorie
                        </label>

                        <select
                          value={
                            challengeCategory
                          }
                          onChange={(e) =>
                            setChallengeCategory(
                              e.target
                                .value
                            )
                          }
                        >
                          <option>
                            Quatsch
                          </option>

                          <option>
                            Lustig
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
                            Mutprobe
                          </option>

                          <option>
                            Party
                          </option>

                          <option>
                            Trinken
                          </option>

                          <option>
                            Team
                          </option>

                          <option>
                            Wissen
                          </option>

                          <option>
                            Zufall
                          </option>
                        </select>
                      </div>

                      <div>
                        <label>
                          Punkte
                        </label>

                        <input
                          type="number"
                          value={
                            challengePoints
                          }
                          onChange={(e) =>
                            setChallengePoints(
                              e.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label>
                          Muss jemand
                          machen?
                        </label>

                        <select
                          value={
                            challengeTarget
                          }
                          onChange={(e) =>
                            setChallengeTarget(
                              e.target
                                .value
                            )
                          }
                        >
                          <option value="">
                            🎲 Noch offen
                          </option>

                          {eventMembers.map(
                            (
                              member
                            ) => (
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
                                    ?.username
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label>
                          Stimmen
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            challengeRequiredVotes
                          }
                          onChange={(e) =>
                            setChallengeRequiredVotes(
                              e.target
                                .value
                            )
                          }
                        />
                      </div>

                    </div>

                    <button
                      className="bigAction"
                      onClick={
                        createChallenge
                      }
                      disabled={saving}
                    >
                      🎯 Challenge
                      starten
                    </button>

                  </section>
                )}

                <section className="challengeList">

                  {challenges.length ===
                  0 ? (
                    <div className="emptyState">
                      <div>
                        🤪
                      </div>

                      <h2>
                        Noch kein
                        Quatsch!
                      </h2>

                      <p>
                        Erstelle die erste
                        Challenge.
                      </p>
                    </div>
                  ) : (
                    challenges.map(
                      (
                        challenge
                      ) => {
                        const challengeVotes =
                          votesForChallenge(
                            challenge.id
                          );

                        const completed =
                          challenge.status ===
                          "completed";

                        const myVote =
                          challengeVotes.find(
                            (vote) =>
                              vote.voter_profile_id ===
                              currentProfile?.id
                          );

                        return (
                          <div
                            className={
                              completed
                                ? "challengeCard completed"
                                : "challengeCard"
                            }
                            key={
                              challenge.id
                            }
                          >

                            <div className="challengeTop">

                              <div className="challengeCategory">
                                {challengeEmoji(
                                  challenge.category
                                )}{" "}
                                {
                                  challenge.category
                                }
                              </div>

                              <button
                                className="challengeDelete"
                                onClick={() =>
                                  deleteChallenge(
                                    challenge
                                  )
                                }
                              >
                                ×
                              </button>

                            </div>

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

                            <div className="challengeMeta">

                              <span>
                                🏆 +
                                {
                                  challenge.points
                                }{" "}
                                Punkte
                              </span>

                              <span>
                                🗳️{" "}
                                {
                                  challengeVotes.length
                                }{" "}
                                Stimmen
                              </span>

                              {challenge.assigned_profile_id && (
                                <span>
                                  👤{" "}
                                  {getProfileName(
                                    challenge.assigned_profile_id
                                  )}
                                </span>
                              )}

                            </div>

                            {!completed &&
                              eventMembers.length >
                                0 && (
                                <div className="voteArea">

                                  <strong>
                                    🗳️ Wer
                                    soll
                                    dran
                                    glauben?
                                  </strong>

                                  <div className="voteButtons">

                                    {eventMembers.map(
                                      (
                                        member
                                      ) => {
                                        const targetId =
                                          member.profile_id;

                                        const isMe =
                                          targetId ===
                                          currentProfile?.id;

                                        const alreadyVoted =
                                          !!myVote;

                                        return (
                                          <button
                                            key={
                                              targetId
                                            }
                                            disabled={
                                              isMe ||
                                              alreadyVoted
                                            }
                                            onClick={() =>
                                              voteForChallenge(
                                                challenge,
                                                targetId
                                              )
                                            }
                                          >
                                            👤{" "}
                                            {
                                              member
                                                .profile
                                                ?.username
                                            }
                                          </button>
                                        );
                                      }
                                    )}

                                  </div>

                                  {myVote && (
                                    <small className="voted">
                                      ✅ Du hast
                                      bereits
                                      abgestimmt.
                                    </small>
                                  )}

                                </div>
                              )}

                            {!completed && (
                              <div className="challengeActions">

                                {currentProfile?.id && (
                                  <button
                                    className="secondaryAction"
                                    onClick={() =>
                                      joinChallenge(
                                        challenge
                                      )
                                    }
                                  >
                                    🙋 Ich bin
                                    dabei
                                  </button>
                                )}

                                {eventMembers.map(
                                  (
                                    member
                                  ) => (
                                    <button
                                      key={
                                        member.profile_id
                                      }
                                      className="winnerAction"
                                      onClick={() =>
                                        completeChallenge(
                                          challenge,
                                          member.profile_id
                                        )
                                      }
                                    >
                                      🏆{" "}
                                      {
                                        member
                                          .profile
                                          ?.username
                                      } gewinnt
                                    </button>
                                  )
                                )}

                              </div>
                            )}

                            {completed && (
                              <div className="winnerBox">
                                🏆 GEWONNEN VON{" "}
                                <b>
                                  {getProfileName(
                                    challenge.winner_profile_id
                                  )}
                                </b>
                                {" · "}
                                +
                                {
                                  challenge.points
                                }{" "}
                                Punkte
                              </div>
                            )}

                          </div>
                        );
                      }
                    )
                  )}

                </section>
              </>
            )}

            {activeTab ===
              "ranking" && (
              <>
                <section className="rankingHero">
                  <span>
                    🏆
                  </span>

                  <h2>
                    Hall of Fame
                  </h2>

                  <p>
                    Wer ist die Legende
                    des Abends?
                  </p>
                </section>

                <section className="card">

                  {ranking.length ===
                  0 ? (
                    <div className="emptyState">
                      <div>
                        🏆
                      </div>

                      <h2>
                        Noch keine
                        Rangliste
                      </h2>
                    </div>
                  ) : (
                    <div className="fullRanking">

                      {ranking.map(
                        (
                          item,
                          index
                        ) => {
                          const title =
                            getRankingTitle(
                              item.points
                            );

                          const promille =
                            calculatePromille(
                              item.profile
                            );

                          return (
                            <div
                              className={
                                index ===
                                0
                                  ? "rankingRow first"
                                  : "rankingRow"
                              }
                              key={
                                item.profile
                                  .id
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

                              <div className="rankAvatar">
                                {item.profile.username
                                  ?.charAt(
                                    0
                                  )
                                  .toUpperCase() ||
                                  "👤"}
                              </div>

                              <div className="rankInfo">
                                <b>
                                  {
                                    item
                                      .profile
                                      .username
                                  }
                                </b>

                                <span>
                                  {
                                    title.emoji
                                  }{" "}
                                  {
                                    title.title
                                  }
                                </span>

                                <small>
                                  🍺{" "}
                                  {
                                    item
                                      .stats
                                      .count
                                  }{" "}
                                  · 💧{" "}
                                  {item.stats.liters.toFixed(
                                    1
                                  )}{" "}
                                  L

                                  {eventSettings.show_promille &&
                                    ` · 🥴 ${promille.toFixed(
                                      2
                                    )}‰`}
                                </small>
                              </div>

                              <div className="rankPoints">
                                <strong>
                                  {
                                    item.points
                                  }
                                </strong>

                                <small>
                                  PUNKTE
                                </small>
                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

                </section>

                <section className="card funnyTitles">

                  <h2>
                    😂 Die Titel des
                    Abends
                  </h2>

                  <p>
                    Weil normale
                    Ranglisten langweilig
                    sind.
                  </p>

                  <div className="titleGrid">

                    {[
                      [
                        "🧠",
                        "Der Philosoph",
                      ],
                      [
                        "🍺",
                        "Zapfhahn-Zerstörer",
                      ],
                      [
                        "🥴",
                        "Promille-Pilot",
                      ],
                      [
                        "🎯",
                        "Challenge-Monster",
                      ],
                      [
                        "🤪",
                        "Komplett Durch",
                      ],
                      [
                        "👑",
                        "Legende der Nacht",
                      ],
                    ].map(
                      (item) => (
                        <div
                          className="funnyTitle"
                          key={
                            item[1]
                          }
                        >
                          <span>
                            {
                              item[0]
                            }
                          </span>

                          <b>
                            {
                              item[1]
                            }
                          </b>
                        </div>
                      )
                    )}

                  </div>
                </section>
              </>
            )}

            {message && (
              <div className="message">
                {message}
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
                Dein Chaos.
              </small>
            </footer>
          </>
        )}

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
}

.page {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background:
    radial-gradient(
      circle at 10% 0%,
      rgba(245,158,11,.18),
      transparent 32%
    ),
    radial-gradient(
      circle at 90% 15%,
      rgba(139,92,246,.16),
      transparent 30%
    ),
    linear-gradient(
      145deg,
      #070a0f 0%,
      #0b1119 48%,
      #080c12 100%
    );
  color: #f8fafc;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

.container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px;
  position: relative;
  z-index: 2;
}

.backgroundBubble {
  position: fixed;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: .16;
  pointer-events: none;
}

.bubble1 {
  background: #f59e0b;
  top: 20%;
  left: -160px;
}

.bubble2 {
  background: #8b5cf6;
  top: 50%;
  right: -180px;
}

.bubble3 {
  background: #10b981;
  bottom: -150px;
  left: 40%;
}

.hero {
  min-height: 170px;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px 5px 30px;
}

.heroLogo {
  width: 85px;
  height: 85px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 26px;
  font-size: 47px;
  background:
    linear-gradient(
      145deg,
      #f59e0b,
      #d97706
    );
  box-shadow:
    0 15px 45px
    rgba(245,158,11,.25);
  transform: rotate(-4deg);
}

.heroText {
  flex: 1;
}

.eyebrow {
  color: #fbbf24;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.hero h1 {
  margin: 0;
  font-size: clamp(30px,5vw,48px);
  line-height: .95;
  letter-spacing: -2px;
}

.hero h1 span {
  background:
    linear-gradient(
      90deg,
      #fbbf24,
      #fb923c
    );
  -webkit-background-clip: text;
  color: transparent;
}

.hero p {
  margin: 12px 0 0;
  color: #94a3b8;
  font-size: 15px;
}

.refreshButton {
  width: 45px;
  height: 45px;
  border-radius: 15px;
  border: 1px solid #293443;
  background: #111923;
  color: white;
  font-size: 19px;
  cursor: pointer;
}

.eventBar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 14px;
  border: 1px solid #263342;
  border-radius: 20px;
  background:
    rgba(17,25,35,.82);
  backdrop-filter: blur(15px);
  margin-bottom: 14px;
}

.eventSelector {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.eventIcon {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #202b38;
  border-radius: 14px;
  font-size: 22px;
}

.eventSelector small {
  display: block;
  color: #64748b;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1px;
}

.eventSelector select {
  margin: 2px 0 0;
  border: 0;
  padding: 0;
  background: transparent;
  font-size: 17px;
  font-weight: 800;
  color: white;
  width: auto;
  min-width: 220px;
}

.eventActions {
  display: flex;
  gap: 8px;
}

.smallButton {
  border: 0;
  padding: 11px 15px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
}

.primary {
  background: #f59e0b;
  color: #111827;
}

.danger {
  background: #2a171c;
  color: #fb7185;
  border: 1px solid #54212b;
}

.card {
  background:
    linear-gradient(
      145deg,
      rgba(20,29,40,.94),
      rgba(12,18,26,.94)
    );
  border: 1px solid #263342;
  border-radius: 23px;
  padding: 21px;
  margin-bottom: 15px;
  box-shadow:
    0 12px 35px
    rgba(0,0,0,.12);
}

.eventCreate {
  border-color: #805d14;
}

.sectionHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 18px;
}

.sectionHeader > div {
  display: flex;
  align-items: center;
  gap: 13px;
}

.sectionEmoji {
  width: 45px;
  height: 45px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #202b38;
  font-size: 23px;
}

h2 {
  margin: 0;
  font-size: 21px;
}

.card p {
  margin: 5px 0 0;
  color: #7f8da0;
  font-size: 13px;
}

label {
  display: block;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
  margin: 0 0 6px;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #303d4c;
  background: #0d151e;
  color: white;
  border-radius: 13px;
  padding: 13px;
  outline: none;
  font-size: 14px;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #f59e0b;
}

textarea {
  resize: vertical;
}

.formGrid {
  display: grid;
  grid-template-columns:
    repeat(2,minmax(0,1fr));
  gap: 12px;
}

.formGrid .full {
  grid-column: 1 / -1;
}

.bigAction {
  width: 100%;
  margin-top: 14px;
  border: 0;
  padding: 15px;
  border-radius: 14px;
  background:
    linear-gradient(
      90deg,
      #f59e0b,
      #fb923c
    );
  color: #111827;
  font-weight: 1000;
  font-size: 15px;
  cursor: pointer;
  box-shadow:
    0 8px 25px
    rgba(245,158,11,.16);
}

.bigAction:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.statsGrid {
  display: grid;
  grid-template-columns:
    repeat(4,minmax(0,1fr));
  gap: 11px;
  margin-bottom: 15px;
}

.statCard {
  border: 1px solid #263342;
  border-radius: 19px;
  padding: 17px;
  background: #101822;
}

.statCard span {
  display: block;
  font-size: 23px;
}

.statCard strong {
  display: block;
  font-size: 23px;
  margin-top: 7px;
}

.statCard small {
  color: #718096;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1px;
}

.orange {
  border-color: #5a4217;
}

.blue {
  border-color: #203f61;
}

.green {
  border-color: #174c3c;
}

.purple {
  border-color: #3e2a61;
}

.eventInfo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 0 5px;
  color: #94a3b8;
  font-size: 12px;
}

.eventInfo > div:first-child {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.eventInfo b {
  color: white;
  font-size: 14px;
}

.liveDot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow:
    0 0 12px #22c55e;
}

.inviteCode {
  padding: 8px 12px;
  border-radius: 10px;
  background: #121c27;
  border: 1px solid #293747;
}

.inviteCode b {
  color: #fbbf24;
}

.tabs {
  display: grid;
  grid-template-columns:
    repeat(4,1fr);
  gap: 6px;
  padding: 5px;
  background: #0d141d;
  border: 1px solid #263342;
  border-radius: 16px;
  margin-bottom: 15px;
}

.tabs button {
  border: 0;
  padding: 12px 7px;
  border-radius: 11px;
  background: transparent;
  color: #718096;
  font-weight: 800;
  cursor: pointer;
}

.tabs button.active {
  color: #111827;
  background: #f59e0b;
}

.participantForm {
  display: grid;
  grid-template-columns:
    1.5fr
    1fr
    1fr
    1fr
    auto;
  gap: 8px;
  margin-bottom: 15px;
}

.participantForm input,
.participantForm select {
  margin: 0;
}

.participantForm button {
  border: 0;
  border-radius: 12px;
  background: #f59e0b;
  color: #111827;
  font-weight: 900;
  padding: 0 16px;
  cursor: pointer;
}

.peopleGrid {
  display: grid;
  grid-template-columns:
    repeat(2,minmax(0,1fr));
  gap: 9px;
}

.personCard {
  padding: 13px;
  border-radius: 16px;
  background: #111b26;
  border: 1px solid #263442;
}

.personTop {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar,
.rankAvatar {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background:
    linear-gradient(
      145deg,
      #334155,
      #1e293b
    );
  font-weight: 1000;
}

.personName {
  flex: 1;
}

.personName b {
  display: block;
}

.personName small {
  display: block;
  margin-top: 3px;
  color: #fbbf24;
}

.iconDelete,
.challengeDelete {
  border: 0;
  background: #252f3a;
  color: #94a3b8;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  font-size: 18px;
  cursor: pointer;
}

.personStats {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.personStats span {
  padding: 6px 8px;
  border-radius: 8px;
  background: #0b121a;
  color: #94a3b8;
  font-size: 11px;
}

.personStats .promille {
  color: #fb7185;
}

.challengeTeaser {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  background:
    linear-gradient(
      120deg,
      rgba(88,28,135,.32),
      rgba(30,41,59,.85)
    );
}

.challengeTeaserText {
  display: flex;
  align-items: center;
  gap: 14px;
}

.challengeTeaserText > span {
  font-size: 40px;
}

.challengeTeaser button,
.challengeHero button {
  border: 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: #a855f7;
  color: white;
  font-weight: 900;
  cursor: pointer;
}

.costCard {
  text-align: center;
}

.costBig {
  font-size: 42px;
  font-weight: 1000;
  color: #fbbf24;
  margin: 15px 0;
}

.costRows {
  display: grid;
  gap: 8px;
}

.costRows > div {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #0d151e;
  border-radius: 11px;
  color: #94a3b8;
}

.costRows b {
  color: white;
}

.drinkForm {
  padding: 15px;
  border-radius: 17px;
  background: #0c141d;
  border: 1px solid #263442;
  margin-bottom: 15px;
}

.drinkList {
  display: grid;
  gap: 8px;
}

.drinkItem {
  display: grid;
  grid-template-columns:
    48px
    1fr
    180px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 15px;
  background: #101a25;
  border: 1px solid #253443;
}

.drinkIcon {
  width: 45px;
  height: 45px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #222e3c;
  font-size: 22px;
}

.drinkInfo b {
  display: block;
}

.drinkInfo small {
  display: block;
  color: #8190a3;
  margin-top: 4px;
  font-size: 11px;
}

.drinkInfo .assigned {
  color: #fbbf24;
}

.drinkItem select {
  margin: 0;
}

.challengeHero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background:
    radial-gradient(
      circle at 10% 50%,
      rgba(168,85,247,.2),
      transparent 40%
    ),
    #111923;
}

.bigChallengeEmoji {
  font-size: 44px;
}

.challengeHero h2 {
  margin-top: 5px;
  font-size: 28px;
}

.challengeHero .bigAction {
  width: auto;
  min-width: 190px;
  margin: 0;
}

.templateGrid {
  display: grid;
  grid-template-columns:
    repeat(4,minmax(0,1fr));
  gap: 8px;
}

.templateCard {
  border: 1px solid #2a3745;
  background: #101a24;
  color: white;
  border-radius: 14px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.templateCard:hover {
  border-color: #a855f7;
  transform: translateY(-1px);
}

.templateCard span {
  display: block;
  font-size: 22px;
  margin-bottom: 6px;
}

.templateCard b {
  display: block;
  font-size: 12px;
}

.templateCard small {
  display: block;
  color: #a855f7;
  margin-top: 5px;
}

.challengeList {
  display: grid;
  gap: 12px;
}

.challengeCard {
  background:
    linear-gradient(
      145deg,
      #151e29,
      #0d151e
    );
  border: 1px solid #2a3847;
  border-radius: 20px;
  padding: 18px;
}

.challengeCard.completed {
  border-color: #166534;
}

.challengeTop {
  display: flex;
  justify-content: space-between;
}

.challengeCategory {
  color: #c084fc;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.challengeCard h3 {
  font-size: 22px;
  margin: 12px 0 5px;
}

.challengeCard > p {
  color: #8b99aa;
}

.challengeMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 14px 0;
}

.challengeMeta span {
  padding: 7px 9px;
  background: #0a1118;
  border-radius: 9px;
  color: #aeb8c5;
  font-size: 11px;
}

.voteArea {
  padding: 13px;
  border-radius: 14px;
  background: #0b131c;
  border: 1px solid #293746;
}

.voteButtons {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 9px;
}

.voteButtons button,
.secondaryAction,
.winnerAction {
  border: 0;
  border-radius: 10px;
  padding: 9px 11px;
  font-weight: 800;
  cursor: pointer;
}

.voteButtons button {
  background: #1e2937;
  color: white;
}

.voteButtons button:disabled {
  opacity: .35;
  cursor: not-allowed;
}

.voted {
  display: block;
  color: #22c55e;
  margin-top: 9px;
}

.challengeActions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.secondaryAction {
  background: #334155;
  color: white;
}

.winnerAction {
  background: #166534;
  color: white;
}

.winnerBox {
  margin-top: 13px;
  padding: 13px;
  border-radius: 12px;
  background: #12351f;
  color: #86efac;
  text-align: center;
}

.rankingHero {
  text-align: center;
  padding: 35px 20px;
}

.rankingHero > span {
  font-size: 65px;
  display: block;
}

.rankingHero h2 {
  font-size: 32px;
  margin-top: 8px;
}

.rankingHero p {
  color: #7f8da0;
}

.fullRanking {
  display: grid;
  gap: 8px;
}

.rankingRow {
  display: grid;
  grid-template-columns:
    48px
    48px
    1fr
    auto;
  align-items: center;
  gap: 11px;
  padding: 13px;
  border-radius: 15px;
  background: #101a25;
  border: 1px solid #263443;
}

.rankingRow.first {
  border-color: #8a6518;
  background:
    linear-gradient(
      100deg,
      rgba(245,158,11,.14),
      #101a25
    );
}

.rankNumber {
  text-align: center;
  font-size: 24px;
  font-weight: 1000;
}

.rankInfo b {
  display: block;
  font-size: 16px;
}

.rankInfo span {
  display: block;
  color: #fbbf24;
  font-size: 11px;
  margin-top: 3px;
}

.rankInfo small {
  display: block;
  color: #718096;
  margin-top: 4px;
  font-size: 10px;
}

.rankPoints {
  text-align: right;
}

.rankPoints strong {
  display: block;
  font-size: 25px;
  color: #fbbf24;
}

.rankPoints small {
  color: #64748b;
  font-size: 8px;
  font-weight: 900;
}

.titleGrid {
  display: grid;
  grid-template-columns:
    repeat(3,1fr);
  gap: 8px;
  margin-top: 15px;
}

.funnyTitle {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px;
  background: #101a24;
  border: 1px solid #263443;
  border-radius: 13px;
}

.funnyTitle span {
  font-size: 22px;
}

.funnyTitle b {
  font-size: 11px;
}

.emptyState {
  text-align: center;
  padding: 65px 20px;
  border: 1px dashed #334155;
  border-radius: 22px;
  background: rgba(15,23,32,.65);
}

.emptyState > div {
  font-size: 65px;
}

.emptyState h2 {
  margin-top: 12px;
}

.emptyState p {
  color: #7f8da0;
  max-width: 420px;
  margin: 8px auto;
}

.emptyState .bigAction {
  max-width: 350px;
}

.emptyMini {
  text-align: center;
  padding: 25px;
  color: #718096;
  background: #0d151e;
  border-radius: 14px;
  grid-column: 1 / -1;
}

.message {
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 100;
  max-width: calc(100% - 30px);
  padding: 13px 17px;
  border-radius: 14px;
  background: #17212d;
  border: 1px solid #405064;
  color: #fbbf24;
  box-shadow:
    0 15px 40px
    rgba(0,0,0,.35);
  font-weight: 800;
  text-align: center;
}

.loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.loadingEmoji {
  font-size: 70px;
  animation: bounce 1.1s infinite;
}

.loading h1 {
  margin: 20px 0 5px;
}

.loading p {
  color: #7f8da0;
}

@keyframes bounce {
  0%,100% {
    transform: translateY(0)
      rotate(-4deg);
  }

  50% {
    transform: translateY(-12px)
      rotate(4deg);
  }
}

footer {
  text-align: center;
  padding: 35px 10px 20px;
  color: #475569;
}

footer > div {
  font-size: 25px;
  margin-bottom: 5px;
}

footer b {
  display: block;
  color: #64748b;
}

footer small {
  display: block;
  margin-top: 4px;
}

@media(max-width:850px) {

  .statsGrid {
    grid-template-columns:
      repeat(2,1fr);
  }

  .participantForm {
    grid-template-columns:
      repeat(2,1fr);
  }

  .participantForm button {
    padding: 13px;
  }

  .templateGrid {
    grid-template-columns:
      repeat(3,1fr);
  }

  .drinkItem {
    grid-template-columns:
      45px 1fr;
  }

  .drinkItem select {
    grid-column: 1 / -1;
  }

}

@media(max-width:650px) {

  .container {
    padding: 10px;
  }

  .hero {
    padding-top: 15px;
    gap: 12px;
  }

  .heroLogo {
    width: 60px;
    height: 60px;
    border-radius: 18px;
    font-size: 31px;
  }

  .hero h1 {
    font-size: 29px;
    letter-spacing: -1px;
  }

  .eyebrow {
    font-size: 8px;
    letter-spacing: 1px;
  }

  .hero p {
    font-size: 12px;
  }

  .eventBar {
    flex-direction: column;
    align-items: stretch;
  }

  .eventActions {
    display: grid;
    grid-template-columns:
      1fr 1fr;
  }

  .eventSelector select {
    width: 100%;
    min-width: 0;
  }

  .statsGrid {
    gap: 7px;
  }

  .statCard {
    padding: 13px;
  }

  .statCard strong {
    font-size: 19px;
  }

  .tabs {
    position: sticky;
    top: 5px;
    z-index: 20;
  }

  .tabs button {
    font-size: 11px;
    padding: 10px 3px;
  }

  .formGrid {
    grid-template-columns: 1fr;
  }

  .formGrid .full {
    grid-column: auto;
  }

  .participantForm {
    grid-template-columns: 1fr;
  }

  .peopleGrid {
    grid-template-columns: 1fr;
  }

  .challengeTeaser {
    flex-direction: column;
    align-items: stretch;
  }

  .challengeTeaser button {
    width: 100%;
  }

  .challengeHero {
    flex-direction: column;
    align-items: stretch;
  }

  .challengeHero .bigAction {
    width: 100%;
  }

  .templateGrid {
    grid-template-columns:
      repeat(2,1fr);
  }

  .titleGrid {
    grid-template-columns:
      repeat(2,1fr);
  }

  .rankingRow {
    grid-template-columns:
      38px
      42px
      1fr
      auto;
    gap: 7px;
  }

  .rankPoints strong {
    font-size: 20px;
  }

  .rankInfo b {
    font-size: 13px;
  }

  .rankAvatar {
    width: 38px;
    height: 38px;
  }

  .costBig {
    font-size: 34px;
  }

  .sectionHeader {
    align-items: flex-start;
  }

  .sectionHeader .smallButton {
    white-space: nowrap;
  }

}

@media(max-width:420px) {

  .hero {
    align-items: flex-start;
  }

  .refreshButton {
    display: none;
  }

  .statsGrid {
    grid-template-columns:
      repeat(2,1fr);
  }

  .templateGrid {
    grid-template-columns: 1fr 1fr;
  }

  .titleGrid {
    grid-template-columns: 1fr;
  }

  .rankingRow {
    grid-template-columns:
      30px 38px 1fr;
  }

  .rankPoints {
    grid-column: 3;
    text-align: left;
  }

}
`;
