"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type EventRow = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  invite_code?: string | null;
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
  username: string | null;
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

type Person = {
  id: string;
  name: string;
  profile_id?: string;
  drinks: number;
  liters: number;
  cost: number;
  points: number;
  promille: number;
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
  preis?: number | null;
  menge?: number | null;
  alkohol?: number | null;
  getraenk?: string | null;
  marke?: string | null;
  promille_wert?: number | null;
  created_at?: string;
};

type Challenge = {
  id: string;
  title: string | null;
  description: string | null;
  points: number | null;
  category: string | null;
  status: string | null;
  assigned_profile_id: string | null;
  winner_profile_id: string | null;
  required_votes: number | null;
  duration_minutes: number | null;
  starts_at: string | null;
  ends_at: string | null;
  completed_at: string | null;
  is_active: boolean | null;
};

type ChallengeTemplate = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  default_points: number | null;
  requires_vote: boolean | null;
  minimum_votes: number | null;
  is_active: boolean | null;
};

type ChallengeVote = {
  id: string;
  challenge_id: string;
  voter_profile_id: string;
  target_profile_id: string | null;
  vote: string;
  comment: string | null;
};

type Payment = {
  id: string;
  event_id: string;
  betrag: number;
  bezahlt_von: string | null;
  profile_id: string | null;
  status: string | null;
  created_at?: string;
};

type RankingTitle = {
  id: string;
  min_points: number;
  title: string;
  emoji: string | null;
  description: string | null;
};

type AnimationType =
  | "toast"
  | "prost"
  | "money"
  | "points"
  | "challenge";

type AnimationState = {
  type: AnimationType;
  text?: string;
  points?: number;
};

export default function Home() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeTemplates, setChallengeTemplates] = useState<
    ChallengeTemplate[]
  >([]);
  const [votes, setVotes] = useState<ChallengeVote[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rankingTitles, setRankingTitles] = useState<RankingTitle[]>([]);

  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] = useState("Bier");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] = useState("");

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePoints, setChallengePoints] = useState("20");
  const [challengeCategory, setChallengeCategory] = useState("Quatsch");
  const [challengeVotesRequired, setChallengeVotesRequired] =
    useState("1");

  const [paymentAmount, setPaymentAmount] = useState("");

  const [message, setMessage] = useState("");

  const [animation, setAnimation] =
    useState<AnimationState | null>(null);

  const [loading, setLoading] = useState(false);

  /* ============================================================
     HILFSFUNKTIONEN
     ============================================================ */

  function showAnimation(
    type: AnimationType,
    text?: string,
    points?: number
  ) {
    setAnimation({
      type,
      text,
      points,
    });

    window.setTimeout(() => {
      setAnimation(null);
    }, 2600);
  }

  function showMessage(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  function number(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function getDrinkName(drink: Drink) {
    return (
      drink.getraenk ||
      drink.drink_name ||
      "Getränk"
    );
  }

  function getDrinkLiters(drink: Drink) {
    return number(
      drink.liters ??
        drink.menge ??
        0
    );
  }

  function getDrinkAlcohol(drink: Drink) {
    return number(
      drink.alcohol_percent ??
        drink.alkohol ??
        0
    );
  }

  function getDrinkPrice(drink: Drink) {
    return number(drink.preis);
  }

  function calculatePromille(
    person: Person,
    drink: Drink
  ) {
    const profile = profiles.find(
      (p) =>
        p.id === person.profile_id
    );

    const weight = number(
      profile?.weight_kg ??
        profile?.gewicht_kg ??
        80
    );

    const gender =
      profile?.gender ||
      profile?.geschlecht ||
      "m";

    const liters = getDrinkLiters(drink);
    const alcoholPercent =
      getDrinkAlcohol(drink);

    /*
      Vereinfachte Näherung.
      Sie ist NICHT als medizinisch genaue
      Blutalkoholberechnung gedacht.
    */

    const alcoholGrams =
      liters *
      1000 *
      (alcoholPercent / 100) *
      0.789;

    const factor =
      gender.toLowerCase().startsWith("w")
        ? 0.55
        : 0.68;

    const result =
      alcoholGrams /
      Math.max(weight * factor, 1);

    return Math.max(
      0,
      Number(result.toFixed(2))
    );
  }

  function getRankingTitle(
    points: number
  ) {
    if (rankingTitles.length === 0) {
      if (points >= 200)
        return {
          emoji: "👑",
          title: "Zapfhahn-Legende",
        };

      if (points >= 100)
        return {
          emoji: "🔥",
          title: "Party-Maschine",
        };

      if (points >= 50)
        return {
          emoji: "🍻",
          title: "Prost-Profi",
        };

      if (points >= 20)
        return {
          emoji: "😎",
          title: "Stimmungsmacher",
        };

      return {
        emoji: "🐣",
        title: "Frischling",
      };
    }

    const sorted = [...rankingTitles]
      .sort(
        (a, b) =>
          b.min_points -
          a.min_points
      );

    const found =
      sorted.find(
        (title) =>
          points >= title.min_points
      );

    return (
      found || {
        emoji: "🐣",
        title: "Frischling",
      }
    );
  }

  /* ============================================================
     EVENTS
     ============================================================ */

  async function loadEvents() {
    const { data, error } =
      await supabase
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
        "❌ Events konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    setEvents(data || []);

    if (
      !eventId &&
      data &&
      data.length > 0
    ) {
      setEventId(data[0].id);
    }
  }

  async function createEvent() {
    if (!newEventTitle.trim()) {
      showMessage(
        "❌ Bitte einen Eventnamen eingeben."
      );
      return;
    }

    setLoading(true);

    const inviteCode =
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const { data, error } =
      await supabase
        .from("events")
        .insert({
          title:
            newEventTitle.trim(),
          description:
            newEventDescription.trim(),
          location:
            newEventLocation.trim(),
          invite_code:
            inviteCode,
          is_active: true,

          ranking_enabled: true,
          show_points: true,
          show_ranking: true,
          show_promille: true,
          show_statistics: true,
          show_drink_amounts: true,
          cost_overview_enabled: true,
          auto_split_costs: true,
          show_costs: true,
        })
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

    setNewEventTitle("");
    setNewEventLocation("");
    setNewEventDescription("");

    await loadEvents();

    if (data) {
      setEventId(data.id);
    }

    showAnimation(
      "toast",
      "🎉 Event erstellt!"
    );
  }

  async function deleteEvent() {
    if (!eventId) {
      showMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    const event =
      events.find(
        (e) => e.id === eventId
      );

    if (!event) return;

    const confirmed =
      window.confirm(
        `Event "${event.title}" wirklich löschen?\n\nAlle zugehörigen Getränke, Challenges und Zahlungen werden ebenfalls entfernt.`
      );

    if (!confirmed) return;

    setLoading(true);

    /*
      Zuerst abhängige Daten löschen.
      Dadurch sind wir nicht auf CASCADE angewiesen.
    */

    await supabase
      .from("challenge_votes")
      .delete()
      .eq(
        "challenge_id",
        eventId
      );

    const {
      data: eventChallenges,
    } = await supabase
      .from("challenges")
      .select("id")
      .eq(
        "event_id",
        eventId
      );

    if (eventChallenges) {
      const ids =
        eventChallenges.map(
          (c) => c.id
        );

      if (ids.length > 0) {
        await supabase
          .from(
            "challenge_participants"
          )
          .delete()
          .in(
            "challenge_id",
            ids
          );

        await supabase
          .from(
            "challenge_results"
          )
          .delete()
          .in(
            "challenge_id",
            ids
          );

        await supabase
          .from("challenge_votes")
          .delete()
          .in(
            "challenge_id",
            ids
          );
      }
    }

    await supabase
      .from("challenges")
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
      .from("payments")
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

    setEventId("");
    setSelectedEvent(null);

    setPeople([]);
    setDrinks([]);
    setChallenges([]);
    setPayments([]);

    await loadEvents();

    showAnimation(
      "toast",
      "🗑️ Event gelöscht"
    );
  }

  /* ============================================================
     PROFILE
     ============================================================ */

  async function loadProfiles() {
    const { data } =
      await supabase
        .from("profiles")
        .select("*");

    setProfiles(data || []);
  }

  /* ============================================================
     EVENT DATA
     ============================================================ */

  async function loadEventData() {
    if (!eventId) return;

    const event =
      events.find(
        (e) => e.id === eventId
      ) || null;

    setSelectedEvent(event);

    const {
      data: drinkData,
    } = await supabase
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

    setDrinks(drinkData || []);

    const {
      data: members,
    } = await supabase
      .from("event_members")
      .select("*")
      .eq(
        "event_id",
        eventId
      );

    if (
      members &&
      profiles.length > 0
    ) {
      const mapped: Person[] =
        members.map(
          (member) => {
            const profile =
              profiles.find(
                (p) =>
                  p.id ===
                  member.profile_id
              );

            const profileDrinks =
              (drinkData || []).filter(
                (drink) =>
                  drink.profile_id ===
                  member.profile_id
              );

            const liters =
              profileDrinks.reduce(
                (sum, drink) =>
                  sum +
                  getDrinkLiters(
                    drink
                  ),
                0
              );

            const cost =
              profileDrinks.reduce(
                (sum, drink) =>
                  sum +
                  getDrinkPrice(
                    drink
                  ),
                0
              );

            const drinkPoints =
              profileDrinks.length *
              10;

            return {
              id: member.id,
              profile_id:
                member.profile_id,
              name:
                profile?.username ||
                "Teilnehmer",
              drinks:
                profileDrinks.length,
              liters,
              cost,
              points:
                number(
                  profile?.points
                ) +
                drinkPoints,
              promille: 0,
            };
          }
        );

      setPeople(mapped);
    }

    const {
      data: challengeData,
    } = await supabase
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

    setChallenges(
      challengeData || []
    );

    const {
      data: paymentData,
    } = await supabase
      .from("payments")
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

    setPayments(
      paymentData || []
    );

    const {
      data: voteData,
    } = await supabase
      .from("challenge_votes")
      .select("*");

    setVotes(
      voteData || []
    );
  }

  /* ============================================================
     DRINKS
     ============================================================ */

  async function saveDrink() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!drinkName.trim()) {
      showMessage(
        "❌ Bitte ein Getränk eingeben."
      );
      return;
    }

    setLoading(true);

    const { error } =
      await supabase
        .from("drinks")
        .insert({
          event_id: eventId,
          getraenk:
            drinkName.trim(),
          drink_name:
            drinkName.trim(),
          marke:
            drinkBrand.trim(),
          brand:
            drinkBrand.trim(),
          category:
            drinkCategory,
          menge:
            number(liters),
          liters:
            number(liters),
          alkohol:
            number(alcohol),
          alcohol_percent:
            number(alcohol),
          preis:
            number(price),
          quantity: 1,
        });

    setLoading(false);

    if (error) {
      showMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    await loadEventData();

    showAnimation(
      "prost",
      "PROST!"
    );
  }

  async function assignDrink(
    person: Person,
    drinkId: string
  ) {
    const drink =
      drinks.find(
        (d) => d.id === drinkId
      );

    if (!drink) return;

    if (!person.profile_id) {
      showMessage(
        "❌ Teilnehmer besitzt kein Profil."
      );
      return;
    }

    const {
      error,
    } = await supabase
      .from("drinks")
      .update({
        profile_id:
          person.profile_id,
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
      Punkte für Getränk
    */

    const profile =
      profiles.find(
        (p) =>
          p.id ===
          person.profile_id
      );

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          points:
            number(
              profile.points
            ) + 10,
          drinks_count:
            number(
              profile.drinks_count
            ) + 1,
        })
        .eq(
          "id",
          profile.id
        );
    }

    await loadProfiles();
    await loadEventData();

    showAnimation(
      "prost",
      "PROST!",
      10
    );
  }

  async function deleteDrink(
    drinkId: string
  ) {
    const confirmed =
      window.confirm(
        "Getränk wirklich löschen?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("drinks")
        .delete()
        .eq(
          "id",
          drinkId
        );

    if (error) {
      showMessage(
        "❌ " +
          error.message
      );
      return;
    }

    await loadEventData();

    showMessage(
      "🗑️ Getränk gelöscht."
    );
  }

  /* ============================================================
     PARTICIPANTS
     ============================================================ */

  async function addPerson() {
    if (!personName.trim()) {
      showMessage(
        "❌ Bitte einen Namen eingeben."
      );
      return;
    }

    const existing =
      profiles.find(
        (profile) =>
          profile.username
            ?.toLowerCase() ===
          personName
            .trim()
            .toLowerCase()
      );

    let profileId =
      existing?.id;

    if (!profileId) {
      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .insert({
          username:
            personName.trim(),
          points: 0,
          drinks_count: 0,
        })
        .select()
        .single();

      if (error) {
        showMessage(
          "❌ Teilnehmer konnte nicht angelegt werden: " +
            error.message
        );
        return;
      }

      profileId = data.id;

      await loadProfiles();
    }

    if (!profileId) return;

    const {
      error,
    } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        profile_id:
          profileId,
        joined_via_code:
          "manual",
      });

    if (error) {
      showMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message
      );
      return;
    }

    setPersonName("");

    await loadEventData();

    showAnimation(
      "points",
      "👥 Teilnehmer dabei!"
    );
  }

  async function removePerson(
    person: Person
  ) {
    const confirmed =
      window.confirm(
        `${person.name} wirklich aus diesem Event entfernen?`
      );

    if (!confirmed) return;

    const {
      error,
    } = await supabase
      .from("event_members")
      .delete()
      .eq(
        "id",
        person.id
      );

    if (error) {
      showMessage(
        "❌ Teilnehmer konnte nicht entfernt werden: " +
          error.message
      );
      return;
    }

    await loadEventData();

    showMessage(
      "👋 Teilnehmer entfernt."
    );
  }

  /* ============================================================
     CHALLENGES
     ============================================================ */

  async function loadChallengeTemplates() {
    const {
      data,
    } = await supabase
      .from(
        "challenge_templates"
      )
      .select("*")
      .eq(
        "is_active",
        true
      )
      .order(
        "title"
      );

    setChallengeTemplates(
      data || []
    );
  }

  async function createChallenge(
    template?: ChallengeTemplate
  ) {
    const title =
      template?.title ||
      challengeTitle;

    const description =
      template?.description ||
      challengeDescription;

    const points =
      template?.default_points ??
      number(challengePoints);

    const category =
      template?.category ||
      challengeCategory;

    if (!title.trim()) {
      showMessage(
        "❌ Bitte eine Challenge eingeben."
      );
      return;
    }

    const {
      error,
    } = await supabase
      .from("challenges")
      .insert({
        event_id:
          eventId,
        title:
          title.trim(),
        description:
          description?.trim() ||
          null,
        points,
        category,
        status:
          "open",
        required_votes:
          number(
            challengeVotesRequired
          ),
        is_active:
          true,
      });

    if (error) {
      showMessage(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");

    await loadEventData();

    showAnimation(
      "challenge",
      "🎯 CHALLENGE!"
    );
  }

  async function completeChallenge(
    challenge: Challenge,
    winner: Person
  ) {
    if (!winner.profile_id) {
      showMessage(
        "❌ Teilnehmer besitzt kein Profil."
      );
      return;
    }

    const points =
      number(
        challenge.points
      );

    const {
      error,
    } = await supabase
      .from("challenges")
      .update({
        status:
          "completed",
        winner_profile_id:
          winner.profile_id,
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

    await supabase
      .from(
        "challenge_results"
      )
      .insert({
        challenge_id:
          challenge.id,
        profile_id:
          winner.profile_id,
        place: 1,
        points,
        result_type:
          "winner",
      });

    const profile =
      profiles.find(
        (p) =>
          p.id ===
          winner.profile_id
      );

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          points:
            number(
              profile.points
            ) + points,
        })
        .eq(
          "id",
          profile.id
        );
    }

    await loadProfiles();
    await loadEventData();

    showAnimation(
      "points",
      `🏆 ${winner.name} +${points} Punkte`,
      points
    );
  }

  async function voteForChallenge(
    challenge: Challenge,
    target: Person,
    voter: Person
  ) {
    if (
      !voter.profile_id ||
      !target.profile_id
    ) {
      showMessage(
        "❌ Profil fehlt."
      );
      return;
    }

    const existing =
      votes.find(
        (vote) =>
          vote.challenge_id ===
            challenge.id &&
          vote.voter_profile_id ===
            voter.profile_id
      );

    if (existing) {
      showMessage(
        "🗳️ Du hast für diese Challenge bereits abgestimmt."
      );
      return;
    }

    const {
      error,
    } = await supabase
      .from(
        "challenge_votes"
      )
      .insert({
        challenge_id:
          challenge.id,
        voter_profile_id:
          voter.profile_id,
        target_profile_id:
          target.profile_id,
        vote:
          "yes",
      });

    if (error) {
      showMessage(
        "❌ Abstimmung fehlgeschlagen: " +
          error.message
      );
      return;
    }

    await loadEventData();

    showAnimation(
      "points",
      "🗳️ Stimme abgegeben!"
    );
  }

  /* ============================================================
     PAYMENTS
     ============================================================ */

  async function savePayment(
    person?: Person
  ) {
    const amount =
      number(paymentAmount);

    if (amount <= 0) {
      showMessage(
        "❌ Bitte einen Betrag eingeben."
      );
      return;
    }

    const {
      error,
    } = await supabase
      .from("payments")
      .insert({
        event_id:
          eventId,
        betrag:
          amount,
        profile_id:
          person?.profile_id ||
          null,
        bezahlt_von:
          person?.profile_id ||
          null,
        status:
          "paid",
      });

    if (error) {
      showMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setPaymentAmount("");

    await loadEventData();

    showAnimation(
      "money",
      `💶 ${amount.toFixed(2)} € bezahlt`
    );
  }

  /* ============================================================
     DATEN LADEN
     ============================================================ */

  useEffect(() => {
    loadEvents();
    loadProfiles();
    loadChallengeTemplates();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    loadEventData();
  }, [
    eventId,
    profiles.length,
    events.length,
  ]);

  useEffect(() => {
    const event =
      events.find(
        (e) => e.id === eventId
      ) || null;

    setSelectedEvent(event);
  }, [
    eventId,
    events,
  ]);

  /* ============================================================
     STATISTIK
     ============================================================ */

  const totalLiters =
    drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkLiters(
          drink
        ),
      0
    );

  const totalCost =
    drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkPrice(
          drink
        ),
      0
    );

  const totalPaid =
    payments.reduce(
      (sum, payment) =>
        sum +
        number(
          payment.betrag
        ),
      0
    );

  const costPerPerson =
    people.length > 0
      ? totalCost /
        people.length
      : 0;

  const totalPoints =
    people.reduce(
      (sum, person) =>
        sum +
        number(
          person.points
        ),
      0
    );

  const ranking = [
    ...people,
  ].sort(
    (a, b) =>
      b.points -
      a.points
  );

  const topPerson =
    ranking[0];

  const averageDrinkAlcohol =
    drinks.length > 0
      ? drinks.reduce(
          (sum, drink) =>
            sum +
            getDrinkAlcohol(
              drink
            ),
          0
        ) /
        drinks.length
      : 0;

  const openChallenges =
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

  const paymentBalance =
    totalPaid - totalCost;

  const currentRankingTitle =
    topPerson
      ? getRankingTitle(
          topPerson.points
        )
      : {
          emoji: "🏆",
          title: "Noch kein Champion",
        };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <main className="page">
      <div className="app">

        {/* =====================================================
            ANIMATIONEN
        ===================================================== */}

        {animation?.type ===
          "prost" && (
          <div className="animationOverlay prostOverlay">
            <div className="beerLeft">
              🍺
            </div>

            <div className="beerRight">
              🍺
            </div>

            <div className="prostText">
              PROST!
            </div>

            {animation.points &&
              animation.points > 0 && (
                <div className="animationPoints">
                  +{animation.points} Punkte
                </div>
              )}
          </div>
        )}

        {animation?.type ===
          "money" && (
          <div className="moneyOverlay">
            {Array.from({
              length: 28,
            }).map((_, i) => (
              <span
                key={i}
                className="money"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${
                    Math.random() * 0.8
                  }s`,
                }}
              >
                💶
              </span>
            ))}

            <div className="moneyText">
              💰 BEZAHLT!
            </div>
          </div>
        )}

        {animation?.type ===
          "points" && (
          <div className="pointsOverlay">
            <div className="pointsEmoji">
              🏆
            </div>

            <div className="pointsText">
              {animation.text}
            </div>
          </div>
        )}

        {animation?.type ===
          "challenge" && (
          <div className="challengeAnimation">
            <div>
              🎯
            </div>
            <strong>
              CHALLENGE!
            </strong>
            <span>
              Wer traut sich?
            </span>
          </div>
        )}

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="hero">
          <div className="heroLogo">
            🍻
          </div>

          <div className="heroText">
            <div className="eyebrow">
              DIE PARTY-ZENTRALE
            </div>

            <h1>
              Güstener
              <br />
              Zapfhahn Zentrale
            </h1>

            <p>
              Getränke · Challenges ·
              Punkte · Chaos
            </p>
          </div>
        </header>

        {/* =====================================================
            EVENT
        ===================================================== */}

        <section className="card eventCard">
          <div className="sectionTitle">
            <div>
              <span className="icon">
                📅
              </span>

              <div>
                <h2>
                  Aktuelles Event
                </h2>

                <small>
                  Wo die Legenden
                  entstehen
                </small>
              </div>
            </div>

            {selectedEvent && (
              <button
                className="dangerButton"
                onClick={
                  deleteEvent
                }
              >
                🗑️
              </button>
            )}
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
                  value={
                    event.id
                  }
                >
                  {event.title}
                </option>
              )
            )}
          </select>

          {selectedEvent && (
            <div className="eventInfo">
              <strong>
                {selectedEvent.title}
              </strong>

              {selectedEvent.location && (
                <span>
                  📍{" "}
                  {
                    selectedEvent.location
                  }
                </span>
              )}

              {selectedEvent.invite_code && (
                <span>
                  🔑 Code:{" "}
                  <b>
                    {
                      selectedEvent.invite_code
                    }
                  </b>
                </span>
              )}
            </div>
          )}

          <div className="createEventBox">
            <h3>
              ➕ Neues Event
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

            <textarea
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

            <button
              className="primaryButton"
              onClick={
                createEvent
              }
              disabled={loading}
            >
              🎉 Event erstellen
            </button>
          </div>
        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

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
              {totalCost.toFixed(
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
              {people.length}
            </strong>
            <small>
              Teilnehmer
            </small>
          </div>
        </section>

        {/* =====================================================
            TEILNEHMER
        ===================================================== */}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="icon">
                👥
              </span>

              <div>
                <h2>
                  Teilnehmer
                </h2>

                <small>
                  Wer ist heute
                  dabei?
                </small>
              </div>
            </div>

            <div className="badge">
              {people.length}
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
                addPerson
              }
            >
              ➕
            </button>
          </div>

          {people.length ===
            0 ? (
            <div className="empty">
              👻 Noch keiner
              da...
            </div>
          ) : (
            people.map(
              (person) => {
                const title =
                  getRankingTitle(
                    person.points
                  );

                return (
                  <div
                    className="personCard"
                    key={
                      person.id
                    }
                  >
                    <div className="personAvatar">
                      {title.emoji}
                    </div>

                    <div className="personMain">
                      <strong>
                        {
                          person.name
                        }
                      </strong>

                      <span>
                        {
                          title.title
                        }
                      </span>

                      <small>
                        🍺{" "}
                        {
                          person.drinks
                        }{" "}
                        · 💧{" "}
                        {person.liters.toFixed(
                          1
                        )}{" "}
                        L · 🏆{" "}
                        {
                          person.points
                        }
                      </small>
                    </div>

                    <button
                      className="smallDanger"
                      onClick={() =>
                        removePerson(
                          person
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                );
              }
            )
          )}
        </section>

        {/* =====================================================
            GETRÄNK
        ===================================================== */}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="icon">
                🍺
              </span>

              <div>
                <h2>
                  Getränk hinzufügen
                </h2>

                <small>
                  Mehr Getränke =
                  mehr Chaos
                </small>
              </div>
            </div>
          </div>

          <input
            placeholder="Getränk, z. B. Pils"
            value={
              drinkName
            }
            onChange={(e) =>
              setDrinkName(
                e.target.value
              )
            }
          />

          <div className="threeGrid">
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
                Longdrink
              </option>
              <option>
                Shot
              </option>
              <option>
                Alkoholfrei
              </option>
              <option>
                Sonstiges
              </option>
            </select>

            <input
              type="number"
              step="0.1"
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
            disabled={loading}
          >
            🍻 Getränk speichern
          </button>
        </section>

        {/* =====================================================
            GETRÄNKE ZUORDNEN
        ===================================================== */}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="icon">
                🔗
              </span>

              <div>
                <h2>
                  Wer trinkt was?
                </h2>

                <small>
                  Getränk einer
                  Person zuordnen
                </small>
              </div>
            </div>
          </div>

          {people.map(
            (person) => (
              <div
                className="assignment"
                key={
                  person.id
                }
              >
                <div>
                  <strong>
                    👤{" "}
                    {
                      person.name
                    }
                  </strong>
                </div>

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
                        person,
                        e.target
                          .value
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
                        key={
                          drink.id
                        }
                        value={
                          drink.id
                        }
                      >
                        {getDrinkName(
                          drink
                        )}{" "}
                        ·{" "}
                        {getDrinkPrice(
                          drink
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

        {/* =====================================================
            GETRÄNKE
        ===================================================== */}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="icon">
                🍺
              </span>

              <div>
                <h2>
                  Getränke
                </h2>

                <small>
                  Die komplette
                  Getränkeliste
                </small>
              </div>
            </div>
          </div>

          {drinks.length ===
          0 ? (
            <div className="empty">
              🍺 Noch keine
              Getränke.
            </div>
          ) : (
            drinks.map(
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
                    <strong>
                      {
                        getDrinkName(
                          drink
                        )
                      }
                    </strong>

                    <span>
                      {drink.marke ||
                        drink.brand ||
                        "Keine Marke"}
                    </span>

                    <small>
                      💧{" "}
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
                  </div>

                  <div className="drinkPrice">
                    {getDrinkPrice(
                      drink
                    ).toFixed(
                      2
                    )}{" "}
                    €
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
        </section>

        {/* =====================================================
            PROMILLE
        ===================================================== */}

        {selectedEvent
          ?.show_promille !==
          false && (
          <section className="card promilleCard">
            <div className="sectionTitle">
              <div>
                <span className="icon">
                  🍷
                </span>

                <div>
                  <h2>
                    Promille
                  </h2>

                  <small>
                    Näherungswert –
                    kein medizinisches
                    Messgerät
                  </small>
                </div>
              </div>
            </div>

            {ranking.map(
              (person) => {
                const personDrinks =
                  drinks.filter(
                    (drink) =>
                      drink.profile_id ===
                      person.profile_id
                  );

                const promille =
                  personDrinks.reduce(
                    (
                      sum,
                      drink
                    ) =>
                      sum +
                      calculatePromille(
                        person,
                        drink
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
                    <span>
                      {
                        person.name
                      }
                    </span>

                    <strong
                      className={
                        promille >=
                        1
                          ? "dangerPromille"
                          : promille >=
                            0.5
                          ? "warningPromille"
                          : "safePromille"
                      }
                    >
                      {promille.toFixed(
                        2
                      )} ‰
                    </strong>
                  </div>
                );
              }
            )}
          </section>
        )}

        {/* =====================================================
            CHALLENGES
        ===================================================== */}

        <section className="card challengeCard">
          <div className="sectionTitle">
            <div>
              <span className="icon">
                🎯
              </span>

              <div>
                <h2>
                  Challenges
                </h2>

                <small>
                  Wer traut sich?
                  Punkte sammeln!
                </small>
              </div>
            </div>

            <div className="badge">
              {openChallenges.length}
            </div>
          </div>

          <div className="challengeCreate">
            <input
              placeholder="Challenge-Titel"
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

            <div className="threeGrid">
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
                  Lustig
                </option>
                <option>
                  Duell
                </option>
                <option>
                  Mutprobe
                </option>
                <option>
                  Kreativ
                </option>
                <option>
                  Geschicklichkeit
                </option>
                <option>
                  Abstimmung
                </option>
                <option>
                  Team
                </option>
                <option>
                  Party
                </option>
              </select>

              <input
                type="number"
                min="1"
                placeholder="Stimmen"
                value={
                  challengeVotesRequired
                }
                onChange={(e) =>
                  setChallengeVotesRequired(
                    e.target.value
                  )
                }
              />
            </div>

            <button
              className="challengeButton"
              onClick={() =>
                createChallenge()
              }
            >
              🎯 Challenge starten
            </button>
          </div>

          {challengeTemplates.length >
            0 && (
            <div className="templates">
              <h3>
                🎲 Schnelle Challenges
              </h3>

              <div className="templateGrid">
                {challengeTemplates
                  .slice(
                    0,
                    8
                  )
                  .map(
                    (
                      template
                    ) => (
                      <button
                        key={
                          template.id
                        }
                        className="templateButton"
                        onClick={() =>
                          createChallenge(
                            template
                          )
                        }
                      >
                        <strong>
                          {
                            template.title
                          }
                        </strong>

                        <span>
                          +
                          {
                            template.default_points
                          }{" "}
                          Punkte
                        </span>
                      </button>
                    )
                  )}
              </div>
            </div>
          )}

          {openChallenges.map(
            (challenge) => (
              <div
                className="challengeItem"
                key={
                  challenge.id
                }
              >
                <div className="challengeIcon">
                  🎯
                </div>

                <div className="challengeMain">
                  <strong>
                    {
                      challenge.title
                    }
                  </strong>

                  <span>
                    {
                      challenge.description
                    }
                  </span>

                  <small>
                    🏆{" "}
                    {
                      challenge.points
                    }{" "}
                    Punkte ·{" "}
                    {
                      challenge.category
                    }
                  </small>
                </div>

                <div className="challengeActions">
                  {people.map(
                    (
                      person
                    ) => (
                      <button
                        key={
                          person.id
                        }
                        className="winnerButton"
                        onClick={() =>
                          completeChallenge(
                            challenge,
                            person
                          )
                        }
                      >
                        🏆{" "}
                        {
                          person.name
                        }
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          )}

          {completedChallenges.length >
            0 && (
            <div className="completedChallenges">
              <h3>
                ✅ Erledigt
              </h3>

              {completedChallenges.map(
                (
                  challenge
                ) => {
                  const winner =
                    people.find(
                      (person) =>
                        person.profile_id ===
                        challenge.winner_profile_id
                    );

                  return (
                    <div
                      className="completedItem"
                      key={
                        challenge.id
                      }
                    >
                      <span>
                        ✅{" "}
                        {
                          challenge.title
                        }
                      </span>

                      <strong>
                        🏆{" "}
                        {
                          winner?.name
                        }
                      </strong>

                      <b>
                        +
                        {
                          challenge.points
                        }
                      </b>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            ZAHLUNGEN
        ===================================================== */}

        <section className="card paymentCard">
          <div className="sectionTitle">
            <div>
              <span className="icon">
                💶
              </span>

              <div>
                <h2>
                  Zahlungen
                </h2>

                <small>
                  Wer hat die Rechnung
                  gerettet?
                </small>
              </div>
            </div>
          </div>

          <div className="inputRow">
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

            <button
              className="moneyButton"
              onClick={() =>
                savePayment()
              }
            >
              💶 Bezahlt
            </button>
          </div>

          <div className="paymentStats">
            <div>
              <span>
                Rechnung
              </span>
              <strong>
                {totalCost.toFixed(
                  2
                )} €
              </strong>
            </div>

            <div>
              <span>
                Bezahlt
              </span>
              <strong>
                {totalPaid.toFixed(
                  2
                )} €
              </strong>
            </div>

            <div>
              <span>
                Differenz
              </span>
              <strong
                className={
                  paymentBalance >=
                  0
                    ? "positive"
                    : "negative"
                }
              >
                {paymentBalance.toFixed(
                  2
                )} €
              </strong>
            </div>
          </div>

          {people.length >
            0 && (
            <div className="payerList">
              <h3>
                Zahlung einer
                Person zuordnen
              </h3>

              {people.map(
                (person) => (
                  <button
                    key={
                      person.id
                    }
                    className="payerButton"
                    onClick={() =>
                      savePayment(
                        person
                      )
                    }
                  >
                    💶{" "}
                    {
                      person.name
                    }{" "}
                    bezahlen lassen
                  </button>
                )
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            KOSTEN
        ===================================================== */}

        <section className="card costCard">
          <div className="sectionTitle">
            <div>
              <span className="icon">
                💰
              </span>

              <div>
                <h2>
                  Kostenübersicht
                </h2>

                <small>
                  Die Rechnung des
                  Grauens
                </small>
              </div>
            </div>
          </div>

          <div className="bigMoney">
            {totalCost.toFixed(
              2
            )} €
          </div>

          <p>
            Gesamtkosten des
            Events
          </p>

          <div className="costLine">
            <span>
              👥 Teilnehmer
            </span>

            <strong>
              {people.length}
            </strong>
          </div>

          <div className="costLine">
            <span>
              💶 Pro Person
            </span>

            <strong>
              {costPerPerson.toFixed(
                2
              )} €
            </strong>
          </div>

          <div className="costLine">
            <span>
              🏆 Gesamtpunkte
            </span>

            <strong>
              {totalPoints}
            </strong>
          </div>

          <div className="costLine">
            <span>
              🍺 Durchschnitt
            </span>

            <strong>
              {averageDrinkAlcohol.toFixed(
                1
              )} %
            </strong>
          </div>
        </section>

        {/* =====================================================
            RANKING
        ===================================================== */}

        <section className="card rankingCard">
          <div className="rankingHeader">
            <span>
              🏆
            </span>

            <div>
              <h2>
                Das große Ranking
              </h2>

              <p>
                Wer ist die
                absolute Legende?
              </p>
            </div>
          </div>

          <div className="championTitle">
            <span>
              {
                currentRankingTitle.emoji
              }
            </span>

            <div>
              <small>
                AKTUELLER TITEL
              </small>

              <strong>
                {
                  currentRankingTitle.title
                }
              </strong>
            </div>
          </div>

          {ranking.map(
            (
              person,
              index
            ) => {
              const title =
                getRankingTitle(
                  person.points
                );

              return (
                <div
                  className={
                    "rankItem " +
                    (index ===
                    0
                      ? "rankFirst"
                      : "")
                  }
                  key={
                    person.id
                  }
                >
                  <div className="rankPlace">
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

                  <div className="rankPerson">
                    <strong>
                      {
                        person.name
                      }
                    </strong>

                    <span>
                      {
                        title.emoji
                      }{" "}
                      {
                        title.title
                      }
                    </span>
                  </div>

                  <div className="rankPoints">
                    <strong>
                      {
                        person.points
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

          {ranking.length ===
            0 && (
            <div className="empty">
              🏆 Das Ranking wartet
              auf seine erste
              Legende.
            </div>
          )}
        </section>

        {/* =====================================================
            EVENT STATS
        ===================================================== */}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="icon">
                📊
              </span>

              <div>
                <h2>
                  Event-Statistik
                </h2>

                <small>
                  Die wirklich wichtigen
                  Zahlen
                </small>
              </div>
            </div>
          </div>

          <div className="funStats">
            <div>
              <span>
                🍺
              </span>
              <strong>
                {
                  drinks.length
                }
              </strong>
              <small>
                Getränke
              </small>
            </div>

            <div>
              <span>
                🎯
              </span>
              <strong>
                {
                  challenges.length
                }
              </strong>
              <small>
                Challenges
              </small>
            </div>

            <div>
              <span>
                🏆
              </span>
              <strong>
                {
                  completedChallenges.length
                }
              </strong>
              <small>
                geschafft
              </small>
            </div>

            <div>
              <span>
                💶
              </span>
              <strong>
                {
                  totalPaid.toFixed(
                    0
                  )
                }
                €
              </strong>
              <small>
                bezahlt
              </small>
            </div>
          </div>
        </section>

        {/* =====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer>
          <div>
            🍻
          </div>

          <strong>
            Güstener Zapfhahn
            Zentrale
          </strong>

          <span>
            Dein Event.
            Deine Getränke.
            Deine Runde.
          </span>
        </footer>
      </div>

      {/* =======================================================
          CSS
      ======================================================= */}

      <style jsx>{`
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
              #293d51 0%,
              #111a24 28%,
              #070b10 65%
            );
          color: white;
          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;
          overflow-x: hidden;
        }

        .app {
          width: 100%;
          max-width: 920px;
          margin: 0 auto;
          padding: 20px 16px 60px;
        }

        .hero {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 15px 5px 28px;
        }

        .heroLogo {
          width: 75px;
          height: 75px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          font-size: 42px;
          background:
            linear-gradient(
              145deg,
              #26394b,
              #121b25
            );
          box-shadow:
            0 15px 40px
              rgba(
                0,
                0,
                0,
                0.35
              ),
            inset 0 1px
              rgba(
                255,
                255,
                255,
                0.1
              );
        }

        .eyebrow {
          color: #fbbf24;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 5px;
        }

        h1 {
          margin: 0;
          font-size: 31px;
          line-height: 1.02;
          font-weight: 950;
          letter-spacing: -1.5px;
        }

        .heroText p {
          margin: 8px 0 0;
          color: #94a3b8;
          font-size: 13px;
        }

        .card {
          position: relative;
          margin-bottom: 16px;
          padding: 20px;
          border-radius: 24px;
          background:
            linear-gradient(
              145deg,
              rgba(
                255,
                255,
                255,
                0.075
              ),
              rgba(
                255,
                255,
                255,
                0.035
              )
            );
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
          box-shadow:
            0 18px 50px
              rgba(
                0,
                0,
                0,
                0.2
              );
          backdrop-filter: blur(
            14px
          );
        }

        .sectionTitle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .sectionTitle > div:first-child {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(
            255,
            255,
            255,
            0.07
          );
          font-size: 23px;
        }

        h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 900;
        }

        .sectionTitle small {
          display: block;
          margin-top: 3px;
          color: #8190a0;
          font-size: 11px;
        }

        h3 {
          margin: 0 0 12px;
          font-size: 15px;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 14px;
          margin-bottom: 10px;
          border-radius: 14px;
          border: 1px solid
            #2c3948;
          background: #111923;
          color: white;
          outline: none;
          font-size: 14px;
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
              rgba(
                245,
                158,
                11,
                0.12
              );
        }

        button {
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition:
            transform
              0.15s
              ease,
            filter
              0.15s
              ease;
        }

        button:hover {
          filter: brightness(
            1.1
          );
          transform: translateY(
            -1px
          );
        }

        button:active {
          transform: scale(
            0.97
          );
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .primaryButton {
          padding: 14px 18px;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );
          color: #111;
          font-weight: 950;
        }

        .primaryButton.full {
          width: 100%;
          margin-top: 5px;
        }

        .dangerButton,
        .smallDanger {
          background: #293442;
          color: white;
          border-radius: 11px;
        }

        .dangerButton {
          padding: 10px 13px;
        }

        .smallDanger {
          padding: 7px 11px;
        }

        .bigSelect {
          font-size: 15px;
          font-weight: 800;
        }

        .eventInfo {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(
            255,
            255,
            255,
            0.04
          );
          margin-bottom: 14px;
        }

        .eventInfo span {
          color: #aeb9c6;
          font-size: 12px;
        }

        .createEventBox {
          margin-top: 15px;
          padding-top: 16px;
          border-top: 1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          gap: 10px;
          margin-bottom: 16px;
        }

        .statCard {
          padding: 16px 10px;
          text-align: center;
          border-radius: 19px;
          background:
            linear-gradient(
              145deg,
              rgba(
                255,
                255,
                255,
                0.075
              ),
              rgba(
                255,
                255,
                255,
                0.035
              )
            );
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );
        }

        .statCard span {
          display: block;
          font-size: 23px;
        }

        .statCard strong {
          display: block;
          margin-top: 5px;
          font-size: 20px;
        }

        .statCard small {
          color: #7f8c9b;
          font-size: 10px;
        }

        .badge {
          min-width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 9px;
          border-radius: 50px;
          background: #f59e0b;
          color: #111;
          font-weight: 950;
        }

        .inputRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .inputRow input {
          margin: 0;
        }

        .personCard {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 9px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(
            255,
            255,
            255,
            0.045
          );
        }

        .personAvatar {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: #1e2b38;
          font-size: 24px;
        }

        .personMain {
          flex: 1;
          min-width: 0;
        }

        .personMain strong,
        .personMain span,
        .personMain small {
          display: block;
        }

        .personMain strong {
          font-size: 15px;
        }

        .personMain span {
          margin-top: 2px;
          color: #fbbf24;
          font-size: 11px;
          font-weight: 800;
        }

        .personMain small {
          margin-top: 4px;
          color: #7f8c9b;
          font-size: 11px;
        }

        .threeGrid {
          display: grid;
          grid-template-columns: repeat(
            3,
            1fr
          );
          gap: 8px;
        }

        .assignment {
          display: grid;
          grid-template-columns: 0.8fr 1.5fr;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
          padding: 11px;
          border-radius: 14px;
          background: rgba(
            255,
            255,
            255,
            0.04
          );
        }

        .assignment select {
          margin: 0;
        }

        .drinkCard {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 9px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(
            255,
            255,
            255,
            0.045
          );
        }

        .drinkIcon {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #1e2b38;
          font-size: 22px;
        }

        .drinkInfo {
          flex: 1;
          min-width: 0;
        }

        .drinkInfo strong,
        .drinkInfo span,
        .drinkInfo small {
          display: block;
        }

        .drinkInfo strong {
          font-size: 14px;
        }

        .drinkInfo span {
          color: #a0adbb;
          font-size: 11px;
        }

        .drinkInfo small {
          margin-top: 3px;
          color: #748292;
          font-size: 10px;
        }

        .drinkPrice {
          font-weight: 950;
          color: #fbbf24;
        }

        .promilleCard {
          background:
            linear-gradient(
              145deg,
              rgba(
                120,
                53,
                15,
                0.22
              ),
              rgba(
                255,
                255,
                255,
                0.04
              )
            );
        }

        .promilleRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px;
          margin-top: 8px;
          border-radius: 13px;
          background: rgba(
            0,
            0,
            0,
            0.18
          );
        }

        .safePromille {
          color: #4ade80;
        }

        .warningPromille {
          color: #fbbf24;
        }

        .dangerPromille {
          color: #fb7185;
        }

        .challengeCard {
          background:
            linear-gradient(
              145deg,
              rgba(
                99,
                102,
                241,
                0.13
              ),
              rgba(
                255,
                255,
                255,
                0.035
              )
            );
        }

        .challengeButton {
          width: 100%;
          padding: 15px;
          border-radius: 15px;
          background:
            linear-gradient(
              135deg,
              #8b5cf6,
              #6366f1
            );
          color: white;
          font-weight: 950;
        }

        .templates {
          margin-top: 20px;
        }

        .templateGrid {
          display: grid;
          grid-template-columns: repeat(
            2,
            1fr
          );
          gap: 8px;
        }

        .templateButton {
          text-align: left;
          padding: 12px;
          border-radius: 13px;
          background: #182331;
          color: white;
        }

        .templateButton strong,
        .templateButton span {
          display: block;
        }

        .templateButton span {
          margin-top: 4px;
          color: #fbbf24;
          font-size: 11px;
        }

        .challengeItem {
          margin-top: 12px;
          padding: 14px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          border-radius: 17px;
          background: rgba(
            255,
            255,
            255,
            0.045
          );
        }

        .challengeIcon {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #202b43;
          font-size: 23px;
        }

        .challengeMain strong,
        .challengeMain span,
        .challengeMain small {
          display: block;
        }

        .challengeMain strong {
          font-size: 15px;
        }

        .challengeMain span {
          margin-top: 4px;
          color: #aeb9c6;
          font-size: 12px;
        }

        .challengeMain small {
          margin-top: 6px;
          color: #a78bfa;
          font-size: 10px;
        }

        .challengeActions {
          grid-column: 1 / -1;
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .winnerButton {
          padding: 9px 12px;
          border-radius: 11px;
          background: #273247;
          color: white;
          font-size: 11px;
          font-weight: 800;
        }

        .completedChallenges {
          margin-top: 20px;
        }

        .completedItem {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 10px;
          align-items: center;
          padding: 11px;
          margin-top: 7px;
          border-radius: 13px;
          background: rgba(
            74,
            222,
            128,
            0.08
          );
        }

        .completedItem b {
          color: #4ade80;
        }

        .moneyButton {
          padding: 14px 17px;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              #22c55e,
              #16a34a
            );
          color: white;
          font-weight: 950;
        }

        .paymentStats {
          display: grid;
          grid-template-columns: repeat(
            3,
            1fr
          );
          gap: 8px;
          margin-top: 15px;
        }

        .paymentStats div {
          padding: 13px;
          text-align: center;
          border-radius: 13px;
          background: rgba(
            255,
            255,
            255,
            0.04
          );
        }

        .paymentStats span,
        .paymentStats strong {
          display: block;
        }

        .paymentStats span {
          color: #7f8c9b;
          font-size: 10px;
        }

        .paymentStats strong {
          margin-top: 5px;
        }

        .positive {
          color: #4ade80;
        }

        .negative {
          color: #fb7185;
        }

        .payerList {
          margin-top: 20px;
        }

        .payerButton {
          width: 100%;
          margin-top: 7px;
          padding: 11px;
          border-radius: 12px;
          background: #1b2936;
          color: white;
          font-weight: 800;
        }

        .bigMoney {
          text-align: center;
          font-size: 42px;
          font-weight: 950;
          color: #fbbf24;
        }

        .costCard {
          text-align: center;
        }

        .costCard p {
          color: #7f8c9b;
          font-size: 12px;
        }

        .costLine {
          display: flex;
          justify-content: space-between;
          padding: 13px;
          margin-top: 8px;
          border-radius: 13px;
          background: rgba(
            255,
            255,
            255,
            0.045
          );
        }

        .rankingCard {
          overflow: hidden;
        }

        .rankingHeader {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .rankingHeader > span {
          font-size: 42px;
        }

        .rankingHeader h2 {
          margin: 0;
        }

        .rankingHeader p {
          margin: 4px 0 0;
          color: #8491a0;
          font-size: 11px;
        }

        .championTitle {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 18px 0;
          padding: 14px;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              rgba(
                251,
                191,
                36,
                0.13
              ),
              rgba(
                245,
                158,
                11,
                0.04
              )
            );
          border: 1px solid
            rgba(
              251,
              191,
              36,
              0.14
            );
        }

        .championTitle > span {
          font-size: 35px;
        }

        .championTitle small,
        .championTitle strong {
          display: block;
        }

        .championTitle small {
          color: #9aa6b4;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .championTitle strong {
          margin-top: 3px;
          color: #fbbf24;
          font-size: 16px;
        }

        .rankItem {
          display: grid;
          grid-template-columns: 45px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 15px;
          background: rgba(
            255,
            255,
            255,
            0.045
          );
        }

        .rankFirst {
          background:
            linear-gradient(
              135deg,
              rgba(
                251,
                191,
                36,
                0.13
              ),
              rgba(
                255,
                255,
                255,
                0.045
              )
            );
          transform: scale(
            1.01
          );
        }

        .rankPlace {
          font-size: 22px;
          text-align: center;
        }

        .rankPerson strong,
        .rankPerson span {
          display: block;
        }

        .rankPerson span {
          color: #fbbf24;
          font-size: 10px;
          margin-top: 3px;
        }

        .rankPoints {
          text-align: right;
        }

        .rankPoints strong,
        .rankPoints small {
          display: block;
        }

        .rankPoints strong {
          font-size: 19px;
        }

        .rankPoints small {
          color: #778493;
          font-size: 9px;
        }

        .funStats {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          gap: 8px;
        }

        .funStats > div {
          padding: 14px 7px;
          text-align: center;
          border-radius: 14px;
          background: rgba(
            255,
            255,
            255,
            0.045
          );
        }

        .funStats span,
        .funStats strong,
        .funStats small {
          display: block;
        }

        .funStats span {
          font-size: 20px;
        }

        .funStats strong {
          margin-top: 4px;
          font-size: 18px;
        }

        .funStats small {
          margin-top: 2px;
          color: #788695;
          font-size: 9px;
        }

        .empty {
          padding: 25px 10px;
          text-align: center;
          color: #758392;
          font-size: 13px;
        }

        .message {
          position: fixed;
          left: 50%;
          bottom: 22px;
          z-index: 1000;
          transform: translateX(
            -50%
          );
          width: min(
            90%,
            500px
          );
          padding: 14px 17px;
          border-radius: 15px;
          background: #182331;
          border: 1px solid
            #344454;
          color: #fbbf24;
          text-align: center;
          font-weight: 800;
          box-shadow:
            0 15px 50px
              rgba(
                0,
                0,
                0,
                0.4
              );
          animation: messageIn
            0.3s ease;
        }

        footer {
          padding: 35px 10px 10px;
          text-align: center;
          color: #536170;
        }

        footer div {
          font-size: 30px;
        }

        footer strong,
        footer span {
          display: block;
        }

        footer strong {
          margin-top: 8px;
          color: #657383;
        }

        footer span {
          margin-top: 4px;
          font-size: 10px;
        }

        /* =====================================================
           PROST ANIMATION
        ===================================================== */

        .animationOverlay,
        .moneyOverlay,
        .pointsOverlay,
        .challengeAnimation {
          position: fixed;
          inset: 0;
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .prostOverlay {
          background:
            radial-gradient(
              circle,
              rgba(
                251,
                191,
                36,
                0.22
              ),
              rgba(
                0,
                0,
                0,
                0.88
              )
            );
          animation: overlayFade
            2.5s ease forwards;
        }

        .beerLeft,
        .beerRight {
          position: absolute;
          font-size: 105px;
          filter:
            drop-shadow(
              0 15px 20px
                rgba(
                  0,
                  0,
                  0,
                  0.4
                )
            );
        }

        .beerLeft {
          animation: beerLeft
            1.2s
            ease
            forwards;
        }

        .beerRight {
          animation: beerRight
            1.2s
            ease
            forwards;
        }

        .prostText {
          position: relative;
          z-index: 2;
          color: #fbbf24;
          font-size: 68px;
          font-weight: 1000;
          letter-spacing: 4px;
          text-shadow:
            0 0 20px
              rgba(
                251,
                191,
                36,
                0.8
              ),
            0 8px 30px
              rgba(
                0,
                0,
                0,
                0.7
              );
          animation: prostText
            2.3s
            ease
            forwards;
        }

        .animationPoints {
          position: absolute;
          margin-top: 150px;
          color: #4ade80;
          font-size: 22px;
          font-weight: 950;
          animation: pointsPop
            2.2s
            ease
            forwards;
        }

        @keyframes beerLeft {
          0% {
            left: -160px;
            transform: rotate(
              -25deg
            );
          }

          70% {
            left: calc(
              50% - 65px
            );
            transform: rotate(
              15deg
            );
          }

          100% {
            left: calc(
              50% - 65px
            );
            transform: rotate(
              5deg
            );
          }
        }

        @keyframes beerRight {
          0% {
            right: -160px;
            transform: rotate(
              25deg
            );
          }

          70% {
            right: calc(
              50% - 65px
            );
            transform: rotate(
              -15deg
            );
          }

          100% {
            right: calc(
              50% - 65px
            );
            transform: rotate(
              -5deg
            );
          }
        }

        @keyframes prostText {
          0% {
            opacity: 0;
            transform: scale(
              0.2
            );
          }

          45% {
            opacity: 1;
            transform: scale(
              1.15
            );
          }

          70% {
            transform: scale(
              1
            );
          }

          100% {
            opacity: 0;
            transform: scale(
              1.35
            );
          }
        }

        @keyframes overlayFade {
          0% {
            opacity: 0;
          }

          12% {
            opacity: 1;
          }

          80% {
            opacity: 1;
          }

          100% {
            opacity: 0;
          }
        }

        /* =====================================================
           GELD ANIMATION
        ===================================================== */

        .moneyOverlay {
          overflow: hidden;
          background: rgba(
            0,
            0,
            0,
            0.48
          );
          animation: overlayFade
            2.5s ease forwards;
        }

        .money {
          position: absolute;
          top: -80px;
          font-size: 32px;
          animation: moneyRain
            2s
            linear
            forwards;
        }

        .moneyText {
          position: relative;
          z-index: 2;
          padding: 20px 30px;
          border-radius: 25px;
          background: rgba(
            17,
            24,
            39,
            0.92
          );
          color: #4ade80;
          font-size: 38px;
          font-weight: 1000;
          box-shadow:
            0 20px 80px
              rgba(
                0,
                0,
                0,
                0.6
              );
          animation: moneyPop
            2.2s
            ease
            forwards;
        }

        @keyframes moneyRain {
          to {
            top: 110%;
            transform:
              rotate(
                720deg
              );
          }
        }

        @keyframes moneyPop {
          0% {
            opacity: 0;
            transform: scale(
              0.5
            )
              rotate(
                -8deg
              );
          }

          30% {
            opacity: 1;
            transform: scale(
              1.08
            )
              rotate(
                2deg
              );
          }

          70% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: scale(
              1.2
            );
          }
        }

        /* =====================================================
           POINTS ANIMATION
        ===================================================== */

        .pointsOverlay {
          flex-direction: column;
          gap: 8px;
          background:
            radial-gradient(
              circle,
              rgba(
                74,
                222,
                128,
                0.15
              ),
              rgba(
                0,
                0,
                0,
                0.8
              )
            );
          animation: overlayFade
            2.5s ease forwards;
        }

        .pointsEmoji {
          font-size: 90px;
          animation: trophyBounce
            2s
            ease
            forwards;
        }

        .pointsText {
          color: #4ade80;
          font-size: 25px;
          font-weight: 950;
          text-align: center;
          animation: pointsPop
            2.2s
            ease
            forwards;
        }

        @keyframes trophyBounce {
          0% {
            opacity: 0;
            transform: scale(
              0.2
            )
              rotate(
                -20deg
              );
          }

          35% {
            opacity: 1;
            transform: scale(
              1.25
            )
              rotate(
                8deg
              );
          }

          55% {
            transform: scale(
              0.95
            );
          }

          75% {
            transform: scale(
              1.05
            );
          }

          100% {
            opacity: 0;
            transform: scale(
              1.2
            );
          }
        }

        /* =====================================================
           CHALLENGE ANIMATION
        ===================================================== */

        .challengeAnimation {
          flex-direction: column;
          background:
            radial-gradient(
              circle,
              rgba(
                139,
                92,
                246,
                0.3
              ),
              rgba(
                0,
                0,
                0,
                0.9
              )
            );
          animation: overlayFade
            2.5s ease forwards;
        }

        .challengeAnimation div {
          font-size: 100px;
          animation: challengeBounce
            2s
            ease
            forwards;
        }

        .challengeAnimation strong {
          color: #c4b5fd;
          font-size: 50px;
          font-weight: 1000;
          animation: pointsPop
            2.2s
            ease
            forwards;
        }

        .challengeAnimation span {
          color: white;
          font-size: 15px;
        }

        @keyframes challengeBounce {
          0% {
            opacity: 0;
            transform: scale(
              0
            )
              rotate(
                -30deg
              );
          }

          40% {
            opacity: 1;
            transform: scale(
              1.25
            )
              rotate(
                10deg
              );
          }

          65% {
            transform: scale(
              0.95
            );
          }

          100% {
            opacity: 0;
            transform: scale(
              1.15
            );
          }
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform:
              translate(
                -50%,
                20px
              );
          }

          to {
            opacity: 1;
            transform:
              translate(
                -50%,
                0
              );
          }
        }

        @media (
          max-width: 700px
        ) {
          .app {
            padding: 12px 10px
              50px;
          }

          .hero {
            padding-top: 8px;
          }

          .heroLogo {
            width: 60px;
            height: 60px;
            font-size: 32px;
            border-radius: 19px;
          }

          h1 {
            font-size: 24px;
          }

          .statsGrid {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .threeGrid {
            grid-template-columns: 1fr;
          }

          .assignment {
            grid-template-columns: 1fr;
          }

          .paymentStats {
            grid-template-columns: 1fr;
          }

          .funStats {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .beerLeft,
          .beerRight {
            font-size: 80px;
          }

          .prostText {
            font-size: 52px;
          }
        }

        @media (
          max-width: 450px
        ) {
          .card {
            padding: 15px;
            border-radius: 20px;
          }

          .hero {
            gap: 11px;
          }

          h1 {
            font-size: 21px;
          }

          .heroText p {
            font-size: 11px;
          }

          .statCard {
            padding: 13px 7px;
          }

          .statCard strong {
            font-size: 17px;
          }

          .templateGrid {
            grid-template-columns: 1fr;
          }

          .rankItem {
            grid-template-columns:
              38px 1fr auto;
          }

          .bigMoney {
            font-size: 35px;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
