"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type EventRow = {
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
  cost_overview_enabled?: boolean | null;
  auto_split_costs?: boolean | null;
  show_costs?: boolean | null;
};

type Profile = {
  id: string;
  user_id?: string | null;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  points?: number | null;
  drinks_count?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
  gewicht_kg?: number | null;
  alter?: number | null;
  geschlecht?: string | null;
  is_global_admin?: boolean | null;
};

type Member = {
  id: string;
  profile_id: string;
  event_id: string;
  role?: string | null;
  joined_at?: string | null;
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
  price?: number | null;
  photo_url?: string | null;
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

type BeerResponse = {
  id: string;
  request_id: string;
  profile_id: string;
  response: string;
  created_at?: string | null;
};

type Crate = {
  id: string;
  event_id: string;
  profile_id: string;
  crates: number;
  points_awarded: number;
  description?: string | null;
  created_at?: string | null;
};

type Challenge = {
  id: string;
  event_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  points?: number | null;
  status?: string | null;
  required_votes?: number | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
};

type Tab =
  | "home"
  | "drinks"
  | "members"
  | "requests"
  | "challenges"
  | "ranking"
  | "stats";

const STORAGE_PROFILE = "gz_current_profile_id";
const STORAGE_EVENT = "gz_current_event_id";

export default function Home() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [event, setEvent] = useState<EventRow | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [requests, setRequests] = useState<BeerRequest[]>([]);
  const [responses, setResponses] = useState<BeerResponse[]>([]);
  const [crates, setCrates] = useState<Crate[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("home");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");
  const [drinkQuantity, setDrinkQuantity] = useState("1");

  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const [showDrinkForm, setShowDrinkForm] = useState(false);

  const [requestBusy, setRequestBusy] = useState(false);

  const currentProfileId = profile?.id ?? null;

  function notify(text: string) {
    setMessage(text);
    setError("");

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  function notifyError(text: string) {
    setError(text);
    setMessage("");

    window.setTimeout(() => {
      setError("");
    }, 5000);
  }

  function profileName(p?: Profile | null) {
    if (!p) return "Unbekannt";

    return (
      p.name ||
      p.username ||
      p.email ||
      "Teilnehmer"
    );
  }

  function drinkTitle(drink: Drink) {
    return (
      drink.drink_name ||
      drink.getraenk ||
      drink.brand ||
      drink.marke ||
      "Getränk"
    );
  }

  function drinkBrandName(drink: Drink) {
    return (
      drink.brand ||
      drink.marke ||
      drink.detected_brand ||
      ""
    );
  }

  function drinkLitersValue(drink: Drink) {
    return Number(
      drink.liters ??
        drink.menge ??
        0
    );
  }

  function drinkAlcoholValue(drink: Drink) {
    return Number(
      drink.alcohol_percent ??
        drink.alkohol ??
        drink.detected_alcohol_percent ??
        0
    );
  }

  function drinkPriceValue(drink: Drink) {
    return Number(
      drink.price ??
        drink.preis ??
        0
    );
  }

  async function loadProfiles() {
    const storedProfileId =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_PROFILE)
        : null;

    const { data, error: profileError } =
      await supabase
        .from("profiles")
        .select("*")
        .order("created_at", {
          ascending: true,
        });

    if (profileError) {
      notifyError(
        "Profile konnten nicht geladen werden: " +
          profileError.message
      );
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    let selected =
      storedProfileId
        ? data.find(
            (p: Profile) =>
              p.id === storedProfileId
          )
        : null;

    if (!selected) {
      selected = data[0];
    }

    setProfile(selected);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_PROFILE,
        selected.id
      );
    }
  }

  async function loadEvents() {
    const { data, error: eventError } =
      await supabase
        .from("events")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (eventError) {
      notifyError(
        "Events konnten nicht geladen werden: " +
          eventError.message
      );
      return;
    }

    const rows = (data ?? []) as EventRow[];

    setEvents(rows);

    if (rows.length === 0) {
      setEvent(null);
      return;
    }

    const storedEventId =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_EVENT)
        : null;

    const selected =
      rows.find(
        (row) => row.id === storedEventId
      ) ??
      rows.find(
        (row) => row.is_active === true
      ) ??
      rows[0];

    setEvent(selected);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_EVENT,
        selected.id
      );
    }
  }

  async function loadEventData(
    eventId: string
  ) {
    setLoading(true);

    const [
      membersResult,
      drinksResult,
      requestsResult,
      cratesResult,
      challengesResult,
    ] = await Promise.all([
      supabase
        .from("event_members")
        .select("*")
        .eq("event_id", eventId)
        .order("joined_at", {
          ascending: true,
        }),

      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("beer_requests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("beer_crate_sponsorships")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("challenge_dashboard")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (membersResult.error) {
      console.error(
        "members",
        membersResult.error
      );
    }

    if (drinksResult.error) {
      console.error(
        "drinks",
        drinksResult.error
      );
    }

    if (requestsResult.error) {
      console.error(
        "requests",
        requestsResult.error
      );
    }

    if (cratesResult.error) {
      console.error(
        "crates",
        cratesResult.error
      );
    }

    if (challengesResult.error) {
      console.error(
        "challenges",
        challengesResult.error
      );
    }

    const rawMembers =
      (membersResult.data ?? []) as Member[];

    const profileIds =
      rawMembers
        .map((m) => m.profile_id)
        .filter(Boolean);

    let profileMap: Record<
      string,
      Profile
    > = {};

    if (profileIds.length > 0) {
      const { data: profilesData } =
        await supabase
          .from("profiles")
          .select("*")
          .in("id", profileIds);

      for (
        const p of (profilesData ??
          []) as Profile[]
      ) {
        profileMap[p.id] = p;
      }
    }

    const enrichedMembers =
      rawMembers.map((member) => ({
        ...member,
        profile:
          profileMap[member.profile_id] ??
          null,
      }));

    setMembers(enrichedMembers);
    setDrinks(
      (drinksResult.data ??
        []) as Drink[]
    );
    setRequests(
      (requestsResult.data ??
        []) as BeerRequest[]
    );
    setCrates(
      (cratesResult.data ??
        []) as Crate[]
    );
    setChallenges(
      (challengesResult.data ??
        []) as Challenge[]
    );

    const requestIds =
      (requestsResult.data ?? []).map(
        (r: BeerRequest) => r.id
      );

    if (requestIds.length > 0) {
      const { data: responseData } =
        await supabase
          .from("beer_request_responses")
          .select("*")
          .in("request_id", requestIds);

      setResponses(
        (responseData ??
          []) as BeerResponse[]
      );
    } else {
      setResponses([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    async function initialize() {
      setLoading(true);

      await loadProfiles();
      await loadEvents();

      setLoading(false);
    }

    initialize();
  }, []);

  useEffect(() => {
    if (!event?.id) return;

    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_EVENT,
        event.id
      );
    }

    loadEventData(event.id);
  }, [event?.id]);

  const myMember = useMemo(() => {
    if (!currentProfileId) {
      return null;
    }

    return (
      members.find(
        (member) =>
          member.profile_id ===
          currentProfileId
      ) ?? null
    );
  }, [members, currentProfileId]);

  const totalLiters = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        drinkLitersValue(drink) *
          Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const totalCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        drinkPriceValue(drink) *
          Number(drink.quantity ?? 1),
      0
    );
  }, [drinks]);

  const totalAlcoholGrams = useMemo(() => {
    return drinks.reduce(
      (sum, drink) => {
        const liters =
          drinkLitersValue(drink);

        const percent =
          drinkAlcoholValue(drink);

        const quantity =
          Number(drink.quantity ?? 1);

        return (
          sum +
          liters *
            1000 *
            (percent / 100) *
            0.789 *
            quantity
        );
      },
      0
    );
  }, [drinks]);

  const myDrinks = useMemo(() => {
    if (!currentProfileId) {
      return [];
    }

    return drinks.filter(
      (drink) =>
        drink.profile_id ===
        currentProfileId
    );
  }, [drinks, currentProfileId]);

  const myPoints = useMemo(() => {
    const base =
      Number(profile?.points ?? 0);

    const cratePoints =
      crates
        .filter(
          (crate) =>
            crate.profile_id ===
            currentProfileId
        )
        .reduce(
          (sum, crate) =>
            sum +
            Number(
              crate.points_awarded ?? 0
            ),
          0
        );

    return base + cratePoints;
  }, [
    profile,
    crates,
    currentProfileId,
  ]);

  const myPromille = useMemo(() => {
    if (
      !profile ||
      myDrinks.length === 0
    ) {
      return 0;
    }

    const weight =
      Number(
        profile.weight_kg ??
          profile.gewicht_kg ??
          80
      );

    const gender =
      String(
        profile.gender ??
          profile.geschlecht ??
          "m"
      ).toLowerCase();

    const factor =
      gender.startsWith("w")
        ? 0.55
        : 0.68;

    const alcohol =
      myDrinks.reduce(
        (sum, drink) => {
          return (
            sum +
            drinkLitersValue(
              drink
            ) *
              1000 *
              (drinkAlcoholValue(
                drink
              ) /
                100) *
              0.789
          );
        },
        0
      );

    if (!weight || !factor) {
      return 0;
    }

    return Math.max(
      0,
      alcohol / (weight * factor)
    );
  }, [profile, myDrinks]);

  const myCrates = useMemo(() => {
    return crates
      .filter(
        (crate) =>
          crate.profile_id ===
          currentProfileId
      )
      .reduce(
        (sum, crate) =>
          sum + Number(crate.crates ?? 0),
        0
      );
  }, [crates, currentProfileId]);

  const ranking = useMemo(() => {
    return members
      .map((member) => {
        const p =
          member.profile;

        const memberDrinkPoints =
          drinks.filter(
            (drink) =>
              drink.profile_id ===
              member.profile_id
          ).length * 10;

        const memberCratePoints =
          crates
            .filter(
              (crate) =>
                crate.profile_id ===
                member.profile_id
            )
            .reduce(
              (sum, crate) =>
                sum +
                Number(
                  crate.points_awarded ??
                    0
                ),
              0
            );

        return {
          member,
          name: profileName(p),
          points:
            Number(
              p?.points ?? 0
            ) +
            memberDrinkPoints +
            memberCratePoints,
          drinks:
            drinks.filter(
              (drink) =>
                drink.profile_id ===
                member.profile_id
            ).length,
          crates:
            crates
              .filter(
                (crate) =>
                  crate.profile_id ===
                  member.profile_id
              )
              .reduce(
                (sum, crate) =>
                  sum +
                  Number(
                    crate.crates ?? 0
                  ),
                0
              ),
        };
      })
      .sort(
        (a, b) =>
          b.points - a.points
      );
  }, [members, drinks, crates]);

  const openRequests = useMemo(() => {
    return requests.filter(
      (request) =>
        request.status ===
        "pending"
    );
  }, [requests]);

  const myPendingRequests =
    useMemo(() => {
      return requests.filter(
        (request) =>
          request.requester_profile_id ===
            currentProfileId &&
          request.status ===
            "pending"
      );
    }, [requests, currentProfileId]);

  async function saveDrink() {
    if (!event?.id) {
      notifyError(
        "Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!drinkName.trim()) {
      notifyError(
        "Bitte ein Getränk eingeben."
      );
      return;
    }

    setSaving(true);

    const liters =
      Number(drinkLiters);

    const alcohol =
      Number(drinkAlcohol);

    const price =
      Number(drinkPrice);

    const quantity =
      Math.max(
        1,
        Number(drinkQuantity) || 1
      );

    const payload = {
      event_id: event.id,
      profile_id:
        currentProfileId,
      category: "Getränk",
      drink_name:
        drinkName.trim(),
      brand:
        drinkBrand.trim() || null,
      liters,
      alcohol_percent:
        alcohol,
      quantity,
      marke:
        drinkBrand.trim() || null,
      getraenk:
        drinkName.trim(),
      menge:
        liters,
      alkohol:
        alcohol,
      preis:
        price,
      price,
      paid_by:
        currentProfileId,
      bezahlt_von:
        currentProfileId,
      shared_cost:
        false,
    };

    const { error: insertError } =
      await supabase
        .from("drinks")
        .insert(payload);

    if (insertError) {
      setSaving(false);

      notifyError(
        "Getränk konnte nicht gespeichert werden: " +
          insertError.message
      );
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");
    setDrinkQuantity("1");

    setSaving(false);

    notify(
      "🍺 Getränk wurde gespeichert."
    );

    if (event.id) {
      await loadEventData(event.id);
    }
  }

  async function requestBeer() {
    if (
      !event?.id ||
      !currentProfileId
    ) {
      notifyError(
        "Du musst zuerst einem Event beitreten."
      );
      return;
    }

    if (myPendingRequests.length > 0) {
      notify(
        "🍺 Du hast bereits eine offene Bier-Anfrage."
      );
      return;
    }

    setRequestBusy(true);

    const { error: requestError } =
      await supabase
        .from("beer_requests")
        .insert({
          event_id: event.id,
          requester_profile_id:
            currentProfileId,
          status: "pending",
          message:
            "🍺 Ich möchte ein Bier trinken.",
        });

    setRequestBusy(false);

    if (requestError) {
      notifyError(
        "Bier-Anfrage konnte nicht erstellt werden: " +
          requestError.message
      );
      return;
    }

    notify(
      "🍺 Bier-Anfrage wurde an alle Teilnehmer gesendet."
    );

    await loadEventData(event.id);
    setActiveTab("requests");
  }

  async function answerBeerRequest(
    request: BeerRequest,
    answer: "accepted" | "rejected"
  ) {
    if (
      !currentProfileId ||
      !event?.id
    ) {
      return;
    }

    const alreadyAnswered =
      responses.some(
        (response) =>
          response.request_id ===
            request.id &&
          response.profile_id ===
            currentProfileId
      );

    if (alreadyAnswered) {
      notify(
        "Du hast bereits abgestimmt."
      );
      return;
    }

    const { error: responseError } =
      await supabase
        .from(
          "beer_request_responses"
        )
        .insert({
          request_id:
            request.id,
          profile_id:
            currentProfileId,
          response: answer,
        });

    if (responseError) {
      notifyError(
        "Antwort konnte nicht gespeichert werden: " +
          responseError.message
      );
      return;
    }

    const eventMemberCount =
      members.length;

    const requestResponses =
      responses.filter(
        (response) =>
          response.request_id ===
          request.id
      );

    const acceptedCount =
      requestResponses.filter(
        (response) =>
          response.response ===
          "accepted"
      ).length +
      (answer === "accepted"
        ? 1
        : 0);

    const rejectedCount =
      requestResponses.filter(
        (response) =>
          response.response ===
          "rejected"
      ).length +
      (answer === "rejected"
        ? 1
        : 0);

    const totalAnswered =
      acceptedCount +
      rejectedCount;

    if (
      totalAnswered >=
      Math.max(1, eventMemberCount - 1)
    ) {
      const newStatus =
        acceptedCount >
        rejectedCount
          ? "accepted"
          : "rejected";

      await supabase
        .from("beer_requests")
        .update({
          status: newStatus,
          responded_at:
            new Date().toISOString(),
        })
        .eq("id", request.id);

      if (
        newStatus === "accepted" &&
        request.requester_profile_id
      ) {
        await awardPoints(
          request.requester_profile_id,
          5,
          event.id
        );
      }
    }

    notify(
      answer === "accepted"
        ? "✅ Du hast zugestimmt."
        : "❌ Du hast abgelehnt."
    );

    await loadEventData(event.id);
  }

  async function awardPoints(
    profileId: string,
    points: number,
    eventId: string
  ) {
    const { data: target } =
      await supabase
        .from("profiles")
        .select("points")
        .eq("id", profileId)
        .maybeSingle();

    if (!target) return;

    await supabase
      .from("profiles")
      .update({
        points:
          Number(
            target.points ?? 0
          ) + points,
      })
      .eq("id", profileId);

    if (
      profileId ===
      currentProfileId
    ) {
      setProfile((old) =>
        old
          ? {
              ...old,
              points:
                Number(
                  old.points ?? 0
                ) + points,
            }
          : old
      );
    }

    void eventId;
  }

  async function giveBeerCrate() {
    if (
      !event?.id ||
      !currentProfileId
    ) {
      notifyError(
        "Du musst zuerst einem Event beitreten."
      );
      return;
    }

    const { error: crateError } =
      await supabase
        .from(
          "beer_crate_sponsorships"
        )
        .insert({
          event_id: event.id,
          profile_id:
            currentProfileId,
          crates: 1,
          points_awarded: 20,
          description:
            "Bierkiste für die Runde ausgegeben",
        });

    if (crateError) {
      notifyError(
        "Bierkiste konnte nicht gespeichert werden: " +
          crateError.message
      );
      return;
    }

    await awardPoints(
      currentProfileId,
      20,
      event.id
    );

    notify(
      "🍺🍺🍺 Bierkiste ausgegeben! +20 Punkte"
    );

    await loadEventData(event.id);
  }

  async function joinEventByCode() {
    const code =
      joinCode.trim().toUpperCase();

    if (!code) {
      notifyError(
        "Bitte einen Einladungscode eingeben."
      );
      return;
    }

    const { data: foundEvent } =
      await supabase
        .from("events")
        .select("*")
        .eq("invite_code", code)
        .maybeSingle();

    if (!foundEvent) {
      notifyError(
        "Dieser Einladungscode wurde nicht gefunden."
      );
      return;
    }

    if (!currentProfileId) {
      notifyError(
        "Kein Profil gefunden."
      );
      return;
    }

    const { error: memberError } =
      await supabase
        .from("event_members")
        .insert({
          event_id:
            foundEvent.id,
          profile_id:
            currentProfileId,
          joined_via_code:
            code,
          role: "member",
        });

    if (memberError) {
      if (
        memberError.code ===
        "23505"
      ) {
        notify(
          "👥 Du bist bereits Teilnehmer dieses Events."
        );
      } else {
        notifyError(
          "Beitritt fehlgeschlagen: " +
            memberError.message
        );
        return;
      }
    } else {
      notify(
        "✅ Du bist dem Event beigetreten."
      );
    }

    setEvent(
      foundEvent as EventRow
    );
    setJoinCode("");
    setShowJoin(false);
  }

  async function createChallenge() {
    if (!event?.id) return;

    const title =
      window.prompt(
        "Name der Challenge:"
      );

    if (!title?.trim()) return;

    const description =
      window.prompt(
        "Beschreibung der Challenge:"
      ) ?? "";

    const pointsText =
      window.prompt(
        "Punkte:",
        "25"
      );

    const points =
      Math.max(
        1,
        Number(pointsText) || 25
      );

    const { error: challengeError } =
      await supabase
        .from("challenges")
        .insert({
          event_id:
            event.id,
          title:
            title.trim(),
          description,
          category:
            "Event",
          points,
          status:
            "open",
          required_votes:
            Math.max(
              1,
              members.length
            ),
        });

    if (challengeError) {
      notifyError(
        "Challenge konnte nicht erstellt werden. " +
          challengeError.message
      );
      return;
    }

    notify(
      "🔥 Challenge erstellt."
    );

    await loadEventData(event.id);
  }

  async function completeChallenge(
    challenge: Challenge
  ) {
    if (
      !currentProfileId ||
      !event?.id
    ) {
      return;
    }

    const points =
      Number(
        challenge.points ?? 25
      );

    const { error: updateError } =
      await supabase
        .from("challenges")
        .update({
          status:
            "completed",
          winner_profile_id:
            currentProfileId,
          completed_at:
            new Date().toISOString(),
        })
        .eq("id", challenge.id);

    if (updateError) {
      notifyError(
        "Challenge konnte nicht abgeschlossen werden: " +
          updateError.message
      );
      return;
    }

    await awardPoints(
      currentProfileId,
      points,
      event.id
    );

    notify(
      `🏆 Challenge gewonnen! +${points} Punkte`
    );

    await loadEventData(event.id);
  }

  async function copyInviteCode() {
    if (!event?.invite_code) {
      notifyError(
        "Kein Einladungscode vorhanden."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        event.invite_code
      );

      notify(
        "📋 Einladungscode kopiert."
      );
    } catch {
      notifyError(
        "Kopieren wurde vom Browser blockiert."
      );
    }
  }

  function changeEvent(
    eventId: string
  ) {
    const selected =
      events.find(
        (item) =>
          item.id === eventId
      ) ?? null;

    setEvent(selected);

    if (
      typeof window !== "undefined" &&
      selected
    ) {
      localStorage.setItem(
        STORAGE_EVENT,
        selected.id
      );
    }

    setActiveTab("home");
  }

  function memberAnswered(
    requestId: string,
    profileId: string
  ) {
    return responses.some(
      (response) =>
        response.request_id ===
          requestId &&
        response.profile_id ===
          profileId
    );
  }

  function requestAcceptedCount(
    requestId: string
  ) {
    return responses.filter(
      (response) =>
        response.request_id ===
          requestId &&
        response.response ===
          "accepted"
    ).length;
  }

  function requestRejectedCount(
    requestId: string
  ) {
    return responses.filter(
      (response) =>
        response.request_id ===
          requestId &&
        response.response ===
          "rejected"
    ).length;
  }

  function formatDate(
    date?: string | null
  ) {
    if (!date) return "";

    try {
      return new Date(
        date
      ).toLocaleDateString(
        "de-DE"
      );
    } catch {
      return date;
    }
  }

  function navigationItems(): {
    id: Tab;
    icon: string;
    label: string;
  }[] {
    return [
      {
        id: "home",
        icon: "🏠",
        label: "Übersicht",
      },
      {
        id: "drinks",
        icon: "🍺",
        label: "Getränke",
      },
      {
        id: "members",
        icon: "👥",
        label: "Teilnehmer",
      },
      {
        id: "requests",
        icon: "🍻",
        label: "Bier-Anfragen",
      },
      {
        id: "challenges",
        icon: "🔥",
        label: "Challenges",
      },
      {
        id: "ranking",
        icon: "🏆",
        label: "Ranking",
      },
      {
        id: "stats",
        icon: "📊",
        label: "Statistik",
      },
    ];
  }

  if (loading && !event) {
    return (
      <main className="app-shell">
        <div className="loading-screen">
          <div className="crate-logo large">
            <div className="crate-top">
              🍺 🍺 🍺
            </div>
            <div className="crate-body">
              BIERKISTE
            </div>
          </div>

          <h1>
            Güstener Zapfhahn Zentrale
          </h1>

          <p>
            App wird geladen ...
          </p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-background" />

      <div className="app-container">
        <header className="topbar">
          <div className="brand-area">
            <button
              className="crate-logo"
              onClick={() =>
                setActiveTab("home")
              }
              aria-label="Bierkiste"
            >
              <span className="bottle-row">
                🍺🍺🍺
              </span>
              <span className="crate-word">
                BIERKISTE
              </span>
            </button>

            <div className="brand-text">
              <h1>
                Güstener Zapfhahn Zentrale
              </h1>
              <p>
                Events · Getränke · Kosten · Rankings
              </p>
            </div>
          </div>

          <button
            className="join-button"
            onClick={() =>
              setShowJoin(true)
            }
          >
            🔑 Event beitreten
          </button>
        </header>

        {event ? (
          <>
            <section className="event-header">
              <div>
                <span className="eyebrow">
                  AKTUELLES EVENT
                </span>

                <h2>
                  {event.title}
                </h2>

                {event.location && (
                  <p>
                    📍 {event.location}
                  </p>
                )}

                {event.start_date && (
                  <small>
                    📅{" "}
                    {formatDate(
                      event.start_date
                    )}
                    {event.end_date
                      ? ` – ${formatDate(
                          event.end_date
                        )}`
                      : ""}
                  </small>
                )}
              </div>

              <select
                className="event-select"
                value={event.id}
                onChange={(e) =>
                  changeEvent(
                    e.target.value
                  )
                }
              >
                {events.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.title}
                    </option>
                  )
                )}
              </select>
            </section>

            <nav className="main-nav">
              {navigationItems().map(
                (item) => (
                  <button
                    key={item.id}
                    className={
                      activeTab ===
                      item.id
                        ? "nav-item active"
                        : "nav-item"
                    }
                    onClick={() =>
                      setActiveTab(
                        item.id
                      )
                    }
                  >
                    <span>
                      {item.icon}
                    </span>

                    <small>
                      {item.label}
                    </small>

                    {item.id ===
                      "requests" &&
                      openRequests.length >
                        0 && (
                        <b className="nav-badge">
                          {
                            openRequests.length
                          }
                        </b>
                      )}
                  </button>
                )
              )}
            </nav>

            {message && (
              <div className="toast success">
                {message}
              </div>
            )}

            {error && (
              <div className="toast error">
                {error}
              </div>
            )}

            <section className="stats-grid">
              <div className="stat-card">
                <span>🍺</span>
                <strong>
                  {drinks.length}
                </strong>
                <small>
                  Getränke
                </small>
              </div>

              <div className="stat-card">
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

              <div className="stat-card">
                <span>👥</span>
                <strong>
                  {members.length}
                </strong>
                <small>
                  Teilnehmer
                </small>
              </div>

              <div className="stat-card">
                <span>🏆</span>
                <strong>
                  {myPoints}
                </strong>
                <small>
                  Meine Punkte
                </small>
              </div>
            </section>

            {activeTab === "home" && (
              <HomeView
                event={event}
                profile={profile}
                myPromille={
                  myPromille
                }
                myCrates={
                  myCrates
                }
                openRequests={
                  openRequests
                }
                myPendingRequests={
                  myPendingRequests
                }
                requestBusy={
                  requestBusy
                }
                giveBeerCrate={
                  giveBeerCrate
                }
                requestBeer={
                  requestBeer
                }
                setActiveTab={
                  setActiveTab
                }
                copyInviteCode={
                  copyInviteCode
                }
                showJoin={() =>
                  setShowJoin(true)
                }
                totalCost={
                  totalCost
                }
                totalAlcoholGrams={
                  totalAlcoholGrams
                }
              />
            )}

            {activeTab === "drinks" && (
              <section className="content-grid">
                <div className="card wide">
                  <div className="section-title">
                    <div>
                      <span className="section-icon">
                        🍺
                      </span>
                      <div>
                        <h2>
                          Getränke
                        </h2>
                        <p>
                          Alle Getränke dieses Events
                        </p>
                      </div>
                    </div>

                    <button
                      className="primary"
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
                    <div className="drink-form">
                      <input
                        value={
                          drinkName
                        }
                        onChange={(e) =>
                          setDrinkName(
                            e.target.value
                          )
                        }
                        placeholder="Getränk, z. B. Pils"
                      />

                      <div className="form-grid">
                        <input
                          value={
                            drinkBrand
                          }
                          onChange={(e) =>
                            setDrinkBrand(
                              e.target.value
                            )
                          }
                          placeholder="Marke"
                        />

                        <input
                          type="number"
                          step="0.1"
                          value={
                            drinkLiters
                          }
                          onChange={(e) =>
                            setDrinkLiters(
                              e.target.value
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
                          value={
                            drinkPrice
                          }
                          onChange={(e) =>
                            setDrinkPrice(
                              e.target.value
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
                          onChange={(e) =>
                            setDrinkQuantity(
                              e.target.value
                            )
                          }
                          placeholder="Anzahl"
                        />
                      </div>

                      <button
                        className="primary full"
                        disabled={
                          saving
                        }
                        onClick={
                          saveDrink
                        }
                      >
                        {saving
                          ? "Speichert ..."
                          : "🍻 Getränk speichern"}
                      </button>
                    </div>
                  )}

                  {drinks.length ===
                  0 ? (
                    <EmptyState
                      icon="🍺"
                      title="Noch keine Getränke"
                      text="Füge das erste Getränk zum Event hinzu."
                    />
                  ) : (
                    <div className="drink-list">
                      {drinks.map(
                        (drink) => (
                          <div
                            className="drink-row"
                            key={
                              drink.id
                            }
                          >
                            <div className="drink-icon">
                              🍺
                            </div>

                            <div className="drink-main">
                              <strong>
                                {drinkTitle(
                                  drink
                                )}
                              </strong>

                              <span>
                                {drinkBrandName(
                                  drink
                                ) &&
                                  `${drinkBrandName(
                                    drink
                                  )} · `}
                                {drinkLitersValue(
                                  drink
                                ).toFixed(
                                  1
                                )}{" "}
                                L ·{" "}
                                {drinkAlcoholValue(
                                  drink
                                ).toFixed(
                                  1
                                )}
                                %
                              </span>
                            </div>

                            <div className="drink-price">
                              {drinkPriceValue(
                                drink
                              ).toFixed(
                                2
                              )}{" "}
                              €
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab ===
              "members" && (
              <MembersView
                members={
                  members
                }
                currentProfileId={
                  currentProfileId
                }
                myPoints={
                  myPoints
                }
                myDrinks={
                  myDrinks.length
                }
              />
            )}

            {activeTab ===
              "requests" && (
              <RequestsView
                requests={
                  requests
                }
                responses={
                  responses
                }
                members={
                  members
                }
                currentProfileId={
                  currentProfileId
                }
                requestBeer={
                  requestBeer
                }
                requestBusy={
                  requestBusy
                }
                answerBeerRequest={
                  answerBeerRequest
                }
                memberAnswered={
                  memberAnswered
                }
                requestAcceptedCount={
                  requestAcceptedCount
                }
                requestRejectedCount={
                  requestRejectedCount
                }
                profileName={
                  profileName
                }
              />
            )}

            {activeTab ===
              "challenges" && (
              <ChallengesView
                challenges={
                  challenges
                }
                currentProfileId={
                  currentProfileId
                }
                createChallenge={
                  createChallenge
                }
                completeChallenge={
                  completeChallenge
                }
              />
            )}

            {activeTab ===
              "ranking" && (
              <RankingView
                ranking={
                  ranking
                }
                currentProfileId={
                  currentProfileId
                }
              />
            )}

            {activeTab ===
              "stats" && (
              <StatsView
                totalCost={
                  totalCost
                }
                totalLiters={
                  totalLiters
                }
                totalAlcoholGrams={
                  totalAlcoholGrams
                }
                membersCount={
                  members.length
                }
                drinksCount={
                  drinks.length
                }
                myPromille={
                  myPromille
                }
                event={
                  event
                }
                crates={
                  crates
                }
              />
            )}

            <footer className="footer">
              <div className="footer-crate">
                🍺🍺🍺
              </div>

              <strong>
                Güstener Zapfhahn Zentrale
              </strong>

              <span>
                Dein Event. Deine Getränke.
                Deine Runde.
              </span>
            </footer>
          </>
        ) : (
          <section className="empty-event">
            <div className="crate-logo large">
              <div className="bottle-row">
                🍺🍺🍺
              </div>

              <div className="crate-word">
                BIERKISTE
              </div>
            </div>

            <h2>
              Noch kein Event
            </h2>

            <p>
              Erstelle oder wähle ein Event,
              um die Runde zu starten.
            </p>

            <button
              className="primary big"
              onClick={() =>
                setShowJoin(true)
              }
            >
              🔑 Mit Einladungscode beitreten
            </button>
          </section>
        )}

        {showJoin && (
          <div
            className="modal-backdrop"
            onClick={() =>
              setShowJoin(false)
            }
          >
            <div
              className="modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <button
                className="modal-close"
                onClick={() =>
                  setShowJoin(false)
                }
              >
                ×
              </button>

              <div className="modal-icon">
                🔑
              </div>

              <h2>
                Event beitreten
              </h2>

              <p>
                Gib den Einladungscode
                des Events ein.
              </p>

              <input
                autoFocus
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(
                    e.target.value
                  )
                }
                placeholder="z. B. FBD1-A687"
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    joinEventByCode();
                  }
                }}
              />

              <button
                className="primary full"
                onClick={
                  joinEventByCode
                }
              >
                👥 Event beitreten
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{styles}</style>
    </main>
  );
}

function HomeView({
  event,
  profile,
  myPromille,
  myCrates,
  openRequests,
  myPendingRequests,
  requestBusy,
  giveBeerCrate,
  requestBeer,
  setActiveTab,
  copyInviteCode,
  showJoin,
  totalCost,
}: {
  event: EventRow;
  profile: Profile | null;
  myPromille: number;
  myCrates: number;
  openRequests: BeerRequest[];
  myPendingRequests: BeerRequest[];
  requestBusy: boolean;
  giveBeerCrate: () => void;
  requestBeer: () => void;
  setActiveTab: (tab: Tab) => void;
  copyInviteCode: () => void;
  showJoin: () => void;
  totalCost: number;
  totalAlcoholGrams: number;
}) {
  return (
    <section className="home-grid">
      <div className="card hero-card">
        <div className="hero-icon">
          🍺
        </div>

        <h2>
          Ich möchte ein Bier
        </h2>

        <p>
          Alle Teilnehmer bekommen eine
          Anfrage und können zustimmen
          oder ablehnen.
        </p>

        <button
          className="
