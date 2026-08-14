"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  image: string | null;
  invite_code: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;

  ranking_enabled: boolean | null;
  show_points: boolean | null;
  show_ranking: boolean | null;
  show_promille: boolean | null;
  show_statistics: boolean | null;
  show_drink_amounts: boolean | null;
  photo_required: boolean | null;
  ai_recognition_enabled: boolean | null;
  manual_entry_allowed: boolean | null;
  cost_overview_enabled: boolean | null;
  auto_split_costs: boolean | null;
  team_mode: boolean | null;
  show_photos: boolean | null;
  show_costs: boolean | null;
  privacy_mode: boolean | null;
};

type Profile = {
  id: string;
  user_id: string | null;
  role: string | null;
  points: number | null;
  drinks_count: number | null;
  username: string | null;
  name: string | null;
  email: string | null;

  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;

  gewicht_kg: number | null;
  alter: number | null;
  geschlecht: string | null;

  avatar_url: string | null;
  is_global_admin: boolean | null;
};

type Member = {
  id: string;
  profile_id: string;
  role: string | null;
  joined_at: string | null;
  profile: Profile | null;
};

type Drink = {
  id: string;
  event_id: string;
  profile_id: string | null;

  category: string | null;
  drink_name: string | null;
  brand: string | null;

  liters: number | null;
  alcohol_percent: number | null;
  quantity: number | null;

  image: string | null;
  comment: string | null;
  created_at: string | null;

  ai_detected: boolean | null;
  detected_brand: string | null;
  detected_alcohol_percent: number | null;

  paid_by: string | null;
  shared_cost: boolean | null;

  marke: string | null;
  bezahlt_von: string | null;
  promille_wert: number | null;

  getraenk: string | null;
  menge: number | null;
  alkohol: number | null;
  preis: number | null;
  foto: string | null;

  price: number | null;
  photo_url: string | null;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status: string;
  message: string | null;
  created_at: string | null;
  responded_at: string | null;
};

type BeerResponse = {
  id: string;
  request_id: string;
  profile_id: string;
  response: string;
};

type Crate = {
  id: string;
  event_id: string;
  profile_id: string;
  crates: number;
  points_awarded: number;
  description: string | null;
};

type Challenge = {
  id: string;
  event_id: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  points: number | null;
  status: string | null;
  required_votes: number | null;
  assigned_profile_id: string | null;
  winner_profile_id: string | null;
  created_at: string | null;
  completed_at: string | null;
  participant_count: number | null;
  vote_count: number | null;
  positive_vote_count: number | null;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

const FALLBACK_EVENT_SETTINGS = {
  ranking_enabled: true,
  show_points: true,
  show_ranking: true,
  show_promille: true,
  show_statistics: true,
  show_drink_amounts: true,
  photo_required: false,
  ai_recognition_enabled: true,
  manual_entry_allowed: true,
  cost_overview_enabled: true,
  auto_split_costs: true,
  team_mode: false,
  show_photos: true,
  show_costs: true,
  privacy_mode: false,
};

function getProfileName(profile: Profile | null) {
  if (!profile) return "Unbekannt";

  return (
    profile.name ||
    profile.username ||
    profile.email ||
    "Teilnehmer"
  );
}

function getDrinkName(drink: Drink) {
  return (
    drink.drink_name ||
    drink.getraenk ||
    drink.marke ||
    drink.brand ||
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
  return Number(drink.price ?? drink.preis ?? 0);
}

function getDrinkQuantity(drink: Drink) {
  return Number(drink.quantity ?? 1);
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [currentProfile, setCurrentProfile] =
    useState<Profile | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [beerRequests, setBeerRequests] =
    useState<BeerRequest[]>([]);
  const [beerResponses, setBeerResponses] =
    useState<BeerResponse[]>([]);
  const [crates, setCrates] = useState<Crate[]>([]);
  const [challenges, setChallenges] =
    useState<Challenge[]>([]);
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] =
    useState<"home" | "drinks" | "people" | "challenges" | "admin">(
      "home"
    );

  const [showDrinkForm, setShowDrinkForm] =
    useState(false);

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] =
    useState("Bier");
  const [drinkLiters, setDrinkLiters] =
    useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] =
    useState("5");
  const [drinkPrice, setDrinkPrice] =
    useState("0");
  const [drinkQuantity, setDrinkQuantity] =
    useState("1");
  const [drinkComment, setDrinkComment] =
    useState("");

  const [joinCode, setJoinCode] = useState("");

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");

  const [challengeTitle, setChallengeTitle] =
    useState("");
  const [challengeDescription, setChallengeDescription] =
    useState("");
  const [challengePoints, setChallengePoints] =
    useState("10");

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId) ?? null,
    [events, eventId]
  );

  const eventSettings = selectedEvent
    ? selectedEvent
    : ({
        ...FALLBACK_EVENT_SETTINGS,
      } as Event);

  const totalLiters = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkLiters(drink) *
          getDrinkQuantity(drink),
      0
    );
  }, [drinks]);

  const totalCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkPrice(drink) *
          getDrinkQuantity(drink),
      0
    );
  }, [drinks]);

  const totalAlcoholGrams = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkLiters(drink) *
          getDrinkQuantity(drink) *
          (getDrinkAlcohol(drink) / 100) *
          789,
      0
    );
  }, [drinks]);

  const costPerPerson =
    members.length > 0
      ? totalCost / members.length
      : 0;

  const totalPoints = members.reduce(
    (sum, member) =>
      sum + Number(member.profile?.points ?? 0),
    0
  );

  const ranking = [...members].sort(
    (a, b) =>
      Number(b.profile?.points ?? 0) -
      Number(a.profile?.points ?? 0)
  );

  const pendingBeerRequests =
    beerRequests.filter(
      (request) =>
        request.status === "pending"
    );

  const myPendingBeerRequest =
    beerRequests.find(
      (request) =>
        request.requester_profile_id ===
          currentProfile?.id &&
        request.status === "pending"
    );

  const unreadNotifications =
    notifications.filter(
      (notification) => !notification.read
    ).length;

  function flash(text: string) {
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
      flash("❌ Events konnten nicht geladen werden.");
      return;
    }

    setEvents((data ?? []) as Event[]);

    if (!eventId && data && data.length > 0) {
      setEventId(data[0].id);
    }
  }

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setCurrentProfile(data as Profile);

      setWeight(
        String(
          data.weight_kg ??
            data.gewicht_kg ??
            ""
        )
      );

      setHeight(
        String(data.height_cm ?? "")
      );

      setAge(
        String(data.age ?? data.alter ?? "")
      );

      setGender(
        data.gender ??
          data.geschlecht ??
          "male"
      );
    }
  }

  async function loadMembers() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("event_members")
      .select(`
        id,
        profile_id,
        role,
        joined_at,
        profiles (*)
      `)
      .eq("event_id", eventId)
      .order("joined_at", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      setMembers([]);
      return;
    }

    const mapped = (data ?? []).map(
      (row: any) => ({
        id: row.id,
        profile_id: row.profile_id,
        role: row.role,
        joined_at: row.joined_at,
        profile: row.profiles,
      })
    );

    setMembers(mapped);
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
      setDrinks([]);
      return;
    }

    setDrinks((data ?? []) as Drink[]);
  }

  async function loadBeerRequests() {
    if (!eventId) return;

    const { data } = await supabase
      .from("beer_requests")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    setBeerRequests(
      (data ?? []) as BeerRequest[]
    );
  }

  async function loadBeerResponses() {
    if (!eventId) return;

    const requestIds =
      beerRequests.map((request) => request.id);

    if (requestIds.length === 0) {
      setBeerResponses([]);
      return;
    }

    const { data } = await supabase
      .from("beer_request_responses")
      .select("*")
      .in("request_id", requestIds);

    setBeerResponses(
      (data ?? []) as BeerResponse[]
    );
  }

  async function loadCrates() {
    if (!eventId) return;

    const { data } = await supabase
      .from("beer_crate_sponsorships")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    setCrates((data ?? []) as Crate[]);
  }

  async function loadChallenges() {
    if (!eventId) return;

    const { data } = await supabase
      .from("challenge_dashboard")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    setChallenges(
      (data ?? []) as Challenge[]
    );
  }

  async function loadNotifications() {
    if (!currentProfile?.id) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("profile_id", currentProfile.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(30);

    if (data) {
      setNotifications(
        data as Notification[]
      );
    }
  }

  async function loadEverything() {
    setLoading(true);

    await loadProfile();
    await loadEvents();

    setLoading(false);
  }

  useEffect(() => {
    loadEverything();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    Promise.all([
      loadMembers(),
      loadDrinks(),
      loadBeerRequests(),
      loadCrates(),
      loadChallenges(),
    ]);
  }, [eventId]);

  useEffect(() => {
    loadBeerResponses();
  }, [beerRequests]);

  useEffect(() => {
    loadNotifications();
  }, [currentProfile?.id]);

  async function refresh() {
    await Promise.all([
      loadMembers(),
      loadDrinks(),
      loadBeerRequests(),
      loadCrates(),
      loadChallenges(),
      loadNotifications(),
    ]);
  }

  async function saveProfileData() {
    if (!currentProfile) {
      flash("❌ Kein Profil gefunden.");
      return;
    }

    const parsedWeight =
      Number(weight) || null;
    const parsedHeight =
      Number(height) || null;
    const parsedAge =
      Number(age) || null;

    const { error } = await supabase
      .from("profiles")
      .update({
        weight_kg: parsedWeight,
        height_cm: parsedHeight,
        age: parsedAge,
        gender,
        gewicht_kg: parsedWeight,
        alter: parsedAge,
        geschlecht: gender,
      })
      .eq("id", currentProfile.id);

    if (error) {
      flash("❌ Profil konnte nicht gespeichert werden.");
      return;
    }

    setCurrentProfile({
      ...currentProfile,
      weight_kg: parsedWeight,
      height_cm: parsedHeight,
      age: parsedAge,
      gender,
      gewicht_kg: parsedWeight,
      alter: parsedAge,
      geschlecht: gender,
    });

    flash("✅ Profil gespeichert.");
  }

  async function joinEvent() {
    const code = joinCode.trim();

    if (!code) {
      flash("❌ Bitte Einladungscode eingeben.");
      return;
    }

    if (!currentProfile) {
      flash("❌ Du musst angemeldet sein.");
      return;
    }

    const { data: event } = await supabase
      .from("events")
      .select("id,title")
      .eq("invite_code", code)
      .maybeSingle();

    if (!event) {
      flash("❌ Einladungscode nicht gefunden.");
      return;
    }

    const { error } = await supabase
      .from("event_members")
      .upsert(
        {
          event_id: event.id,
          profile_id: currentProfile.id,
          role: "member",
          joined_via_code: code,
        },
        {
          onConflict:
            "event_id,profile_id",
        }
      );

    if (error) {
      flash(
        "❌ Beitritt fehlgeschlagen: " +
          error.message
      );
      return;
    }

    setEventId(event.id);
    setJoinCode("");

    await loadEvents();
    await refresh();

    flash(
      `✅ Du bist jetzt bei „${event.title}“ dabei.`
    );
  }

  async function addDrink() {
    if (!eventId) {
      flash("❌ Kein Event ausgewählt.");
      return;
    }

    if (!drinkName.trim()) {
      flash("❌ Bitte Getränkenamen eingeben.");
      return;
    }

    setSaving(true);

    const liters = Number(drinkLiters) || 0;
    const alcohol = Number(drinkAlcohol) || 0;
    const price = Number(drinkPrice) || 0;
    const quantity =
      Math.max(1, Number(drinkQuantity) || 1);

    const insertData = {
      event_id: eventId,
      profile_id: currentProfile?.id ?? null,

      category: drinkCategory,
      drink_name: drinkName.trim(),
      brand: drinkBrand.trim() || null,

      liters,
      alcohol_percent: alcohol,
      quantity,

      comment:
        drinkComment.trim() || null,

      marke:
        drinkBrand.trim() || null,

      getraenk: drinkName.trim(),
      menge: liters,
      alkohol: alcohol,
      preis: price,

      price,
      shared_cost: true,
    };

    const { error } = await supabase
      .from("drinks")
      .insert(insertData);

    setSaving(false);

    if (error) {
      flash(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkCategory("Bier");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");
    setDrinkQuantity("1");
    setDrinkComment("");

    setShowDrinkForm(false);

    await loadDrinks();

    flash("🍺 Getränk gespeichert.");
  }

  async function requestBeer() {
    if (!eventId || !currentProfile) {
      flash(
        "❌ Du musst einem Event beigetreten sein."
      );
      return;
    }

    if (myPendingBeerRequest) {
      flash(
        "🍺 Deine Bier-Anfrage läuft bereits."
      );
      return;
    }

    const { error } = await supabase
      .from("beer_requests")
      .insert({
        event_id: eventId,
        requester_profile_id:
          currentProfile.id,
        status: "pending",
        message:
          "🍺 Ich möchte gerne ein Bier trinken!",
      });

    if (error) {
      flash(
        "❌ Bier-Anfrage konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    await loadBeerRequests();

    flash(
      "🍺 Bier-Anfrage wurde an die Teilnehmer geschickt."
    );
  }

  async function respondToBeerRequest(
    request: BeerRequest,
    response: "accepted" | "rejected"
  ) {
    if (!currentProfile) return;

    const existing =
      beerResponses.find(
        (item) =>
          item.request_id === request.id &&
          item.profile_id ===
            currentProfile.id
      );

    if (existing) {
      flash("Du hast bereits abgestimmt.");
      return;
    }

    const { error } = await supabase
      .from("beer_request_responses")
      .insert({
        request_id: request.id,
        profile_id: currentProfile.id,
        response,
      });

    if (error) {
      flash(
        "❌ Antwort konnte nicht gespeichert werden."
      );
      return;
    }

    const expected =
      Math.max(0, members.length - 1);

    const { count } = await supabase
      .from("beer_request_responses")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("request_id", request.id);

    const totalResponses =
      Number(count ?? 0);

    if (
      totalResponses >= expected &&
      expected > 0
    ) {
      const { data: responses } =
        await supabase
          .from(
            "beer_request_responses"
          )
          .select("response")
          .eq("request_id", request.id);

      const accepted =
        (responses ?? []).filter(
          (item: any) =>
            item.response === "accepted"
        ).length;

      const rejected =
        (responses ?? []).filter(
          (item: any) =>
            item.response === "rejected"
        ).length;

      let status = "pending";

      if (accepted > rejected) {
        status = "accepted";
      }

      if (rejected > accepted) {
        status = "rejected";
      }

      if (accepted === rejected) {
        status = "tie";
      }

      await supabase
        .from("beer_requests")
        .update({
          status,
          responded_at:
            new Date().toISOString(),
        })
        .eq("id", request.id);
    }

    await loadBeerRequests();
    await loadBeerResponses();

    flash(
      response === "accepted"
        ? "👍 Zustimmung gespeichert."
        : "❌ Ablehnung gespeichert."
    );
  }

  async function sponsorBeerCrate() {
    if (!eventId || !currentProfile) {
      flash("❌ Kein Event/Profil vorhanden.");
      return;
    }

    const points = 50;

    const { error } = await supabase
      .from("beer_crate_sponsorships")
      .insert({
        event_id: eventId,
        profile_id: currentProfile.id,
        crates: 1,
        points_awarded: points,
        description:
          "🍺 Eine Kiste Bier ausgegeben",
      });

    if (error) {
      flash(
        "❌ Bierkiste konnte nicht eingetragen werden: " +
          error.message
      );
      return;
    }

    await supabase
      .from("profiles")
      .update({
        points:
          Number(currentProfile.points ?? 0) +
          points,
      })
      .eq("id", currentProfile.id);

    setCurrentProfile({
      ...currentProfile,
      points:
        Number(currentProfile.points ?? 0) +
        points,
    });

    await refresh();

    flash(
      "🍺 Kiste Bier ausgegeben – +50 Punkte!"
    );
  }

  async function createChallenge() {
    if (!eventId) return;

    if (!challengeTitle.trim()) {
      flash("❌ Challenge-Titel fehlt.");
      return;
    }

    const { error } = await supabase
      .from("challenges")
      .insert({
        event_id: eventId,
        title: challengeTitle.trim(),
        description:
          challengeDescription.trim() ||
          null,
        points:
          Number(challengePoints) || 10,
        status: "open",
        required_votes: members.length,
      });

    if (error) {
      flash(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");

    await loadChallenges();

    flash("🎯 Challenge erstellt.");
  }

  async function deleteDrink(id: string) {
    const { error } = await supabase
      .from("drinks")
      .delete()
      .eq("id", id);

    if (error) {
      flash(
        "❌ Getränk konnte nicht gelöscht werden."
      );
      return;
    }

    await loadDrinks();
    flash("🗑️ Getränk gelöscht.");
  }

  async function markNotificationRead(
    notificationId: string
  ) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    await loadNotifications();
  }

  function calculatePromille(
    profile: Profile | null
  ) {
    if (!profile) return 0;

    const bodyWeight =
      Number(
        profile.weight_kg ??
          profile.gewicht_kg
      ) || 0;

    if (!bodyWeight) return 0;

    const genderValue =
      profile.gender ??
      profile.geschlecht ??
      "male";

    const factor =
      genderValue === "female"
        ? 0.55
        : 0.68;

    const alcohol =
      totalAlcoholGrams;

    if (!alcohol) return 0;

    return (
      alcohol /
      (bodyWeight * factor)
    );
  }

  const currentPromille =
    calculatePromille(currentProfile);

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          <div className="beer-loader">🍺</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>App wird geladen …</p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="app">

        <header className="hero">
          <div className="heroLogo">
            <span className="crateLogo">
              🍺🍺
              <br />
              🍺🍺
            </span>
          </div>

          <div className="heroText">
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>
            <p>
              Events · Getränke · Kosten · Rankings
            </p>
          </div>

          <button
            className="refreshButton"
            onClick={refresh}
            title="Aktualisieren"
          >
            ↻
          </button>
        </header>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <section className="eventCard">
          <div>
            <span className="eyebrow">
              AKTUELLES EVENT
            </span>

            <select
              value={eventId}
              onChange={(event) =>
                setEventId(event.target.value)
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

          {selectedEvent && (
            <div className="eventInfo">
              <strong>
                {selectedEvent.title}
              </strong>

              {selectedEvent.location && (
                <span>
                  📍 {selectedEvent.location}
                </span>
              )}

              <span>
                🔑 Code:{" "}
                <b>
                  {selectedEvent.invite_code ||
                    "—"}
                </b>
              </span>
            </div>
          )}
        </section>

        <section className="joinCard">
          <div>
            <b>🔑 Event beitreten</b>
            <small>
              Einladungscode eingeben
            </small>
          </div>

          <div className="joinRow">
            <input
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value)
              }
              placeholder="Einladungscode"
            />

            <button
              onClick={joinEvent}
              className="primary"
            >
              Beitreten
            </button>
          </div>
        </section>

        <nav className="tabs">
          <button
            className={
              activeTab === "home"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("home")
            }
          >
            🏠
            <span>Übersicht</span>
          </button>

          <button
            className={
              activeTab === "drinks"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("drinks")
            }
          >
            🍺
            <span>Getränke</span>
          </button>

          <button
            className={
              activeTab === "people"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("people")
            }
          >
            👥
            <span>Teilnehmer</span>
          </button>

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
            🎯
            <span>Challenges</span>
          </button>

          {(currentProfile?.role ===
            "admin" ||
            currentProfile?.role ===
              "owner" ||
            currentProfile?.is_global_admin) && (
            <button
              className={
                activeTab === "admin"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab("admin")
              }
            >
              👑
              <span>Admin</span>
            </button>
          )}
        </nav>

        {activeTab === "home" && (
          <>
            <section className="statsGrid">
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
                <small>Kosten</small>
              </div>

              <div className="stat">
                <span>👥</span>
                <strong>
                  {members.length}
                </strong>
                <small>Teilnehmer</small>
              </div>
            </section>

            <section className="actionGrid">
              <button
                className="beerAction"
                onClick={requestBeer}
                disabled={
                  Boolean(myPendingBeerRequest)
                }
              >
                <span className="actionIcon">
                  🍺
                </span>

                <strong>
                  {myPendingBeerRequest
                    ? "Anfrage läuft …"
                    : "Ich möchte ein Bier"}
                </strong>

                <small>
                  Alle Teilnehmer stimmen ab
                </small>
              </button>

              <button
                className="crateAction"
                onClick={sponsorBeerCrate}
              >
                <span className="crateVisual">
                  🍺🍺
                  <br />
                  🍺🍺
                </span>

                <strong>
                  Bierkiste ausgeben
                </strong>

                <small>
                  +50 Punkte
                </small>
              </button>
            </section>

            {pendingBeerRequests.length >
              0 && (
              <section className="card">
                <div className="sectionHeader">
                  <div>
                    <span className="eyebrow">
                      BIER-ANFRAGEN
                    </span>
                    <h2>
                      🍺 Wer möchte ein Bier?
                    </h2>
                  </div>

                  <span className="badge">
                    {pendingBeerRequests.length}
                  </span>
                </div>

                {pendingBeerRequests.map(
                  (request) => {
                    const requester =
                      members.find(
                        (member) =>
                          member.profile_id ===
                          request.requester_profile_id
                      );

                    const myResponse =
                      beerResponses.find(
                        (response) =>
                          response.request_id ===
                            request.id &&
                          response.profile_id ===
                            currentProfile?.id
                      );

                    const isMine =
                      request.requester_profile_id ===
                      currentProfile?.id;

                    return (
                      <div
                        className="request"
                        key={request.id}
                      >
                        <div>
                          <strong>
                            🍺{" "}
                            {isMine
                              ? "Du"
                              : getProfileName(
                                  requester?.profile ??
                                    null
                                )}
                          </strong>

                          <small>
                            möchte gerne ein Bier
                            trinken.
                          </small>
                        </div>

                        {!isMine &&
                          !myResponse && (
                            <div className="requestButtons">
                              <button
                                className="accept"
                                onClick={() =>
                                  respondToBeerRequest(
                                    request,
                                    "accepted"
                                  )
                                }
                              >
                                👍 Ja
                              </button>

                              <button
                                className="reject"
                                onClick={() =>
                                  respondToBeerRequest(
                                    request,
                                    "rejected"
                                  )
                                }
                              >
                                ❌ Nein
                              </button>
                            </div>
                          )}

                        {myResponse && (
                          <span className="answered">
                            {myResponse.response ===
                            "accepted"
                              ? "👍 Zugestimmt"
                              : "❌ Abgelehnt"}
                          </span>
                        )}
                      </div>
                    );
                  }
                )}
              </section>
            )}

            <section className="card">
              <div className="sectionHeader">
                <div>
                  <span className="eyebrow">
                    MEIN PROFIL
                  </span>
                  <h2>
                    👤 Promille & Daten
                  </h2>
                </div>
              </div>

              <div className="profileGrid">
                <input
                  type="number"
                  placeholder="Gewicht kg"
                  value={weight}
                  onChange={(e) =>
                    setWeight(e.target.value)
                  }
                />

                <input
                  type="number"
                  placeholder="Größe cm"
                  value={height}
                  onChange={(e) =>
                    setHeight(e.target.value)
                  }
                />

                <input
                  type="number"
                  placeholder="Alter"
                  value={age}
                  onChange={(e) =>
                    setAge(e.target.value)
                  }
                />

                <select
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value)
                  }
                >
                  <option value="male">
                    Männlich
                  </option>
                  <option value="female">
                    Weiblich
                  </option>
                </select>
              </div>

              <button
                className="secondary"
                onClick={saveProfileData}
              >
                💾 Profildaten speichern
              </button>

              {eventSettings.show_promille !==
                false && (
                <div className="promilleBox">
                  <div>
                    <small>
                      AKTUELLER SCHÄTZWERT
                    </small>
                    <strong>
                      {currentPromille.toFixed(
                        2
                      )} ‰
                    </strong>
                  </div>

                  <span>
                    Berechnung anhand der
                    hinterlegten Körperdaten und
                    erfassten Getränke.
                  </span>
                </div>
              )}
            </section>

            {eventSettings.show_ranking !==
              false && (
              <section className="card">
                <div className="sectionHeader">
                  <div>
                    <span className="eyebrow">
                      LEADERBOARD
                    </span>
                    <h2>
                      🏆 Ranking
                    </h2>
                  </div>

                  <b>
                    {totalPoints} Pkt.
                  </b>
                </div>

                {ranking.length === 0 ? (
                  <div className="empty">
                    Noch keine Teilnehmer.
                  </div>
                ) : (
                  ranking.map(
                    (member, index) => (
                      <div
                        className="rankingRow"
                        key={member.id}
                      >
                        <strong className="place">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `${index + 1}.`}
                        </strong>

                        <div className="rankingName">
                          <b>
                            {getProfileName(
                              member.profile
                            )}
                          </b>
                          <small>
                            🍺{" "}
                            {member.profile
                              ?.drinks_count ??
                              0}{" "}
                            Getränke
                          </small>
                        </div>

                        <strong>
                          {member.profile
                            ?.points ?? 0}{" "}
                          Punkte
                        </strong>
                      </div>
                    )
                  )
                )}
              </section>
            )}

            {eventSettings.cost_overview_enabled !==
              false && (
              <section className="card costCard">
                <span className="eyebrow">
                  KOSTEN
                </span>

                <h2>
                  💶 Kostenaufteilung
                </h2>

                <div className="bigMoney">
                  {totalCost.toFixed(2)} €
                </div>

                <p>
                  Gesamtkosten des Events
                </p>

                <div className="costRow">
                  <span>
                    👥 Teilnehmer
                  </span>
                  <b>{members.length}</b>
                </div>

                <div className="costRow">
                  <span>
                    💶 Pro Person
                  </span>
                  <b>
                    {costPerPerson.toFixed(2)} €
                  </b>
                </div>

                <div className="costRow">
                  <span>
                    🍺 Liter
                  </span>
                  <b>
                    {totalLiters.toFixed(1)} L
                  </b>
                </div>
              </section>
            )}

            {unreadNotifications > 0 && (
              <section className="card">
                <div className="sectionHeader">
                  <h2>
                    🔔 Benachrichtigungen
                  </h2>

                  <span className="badge">
                    {unreadNotifications}
                  </span>
                </div>

                {notifications
                  .filter(
                    (notification) =>
                      !notification.read
                  )
                  .map((notification) => (
                    <div
                      className="notification"
                      key={notification.id}
                      onClick={() =>
                        markNotificationRead(
                          notification.id
                        )
                      }
                    >
                      <strong>
                        {notification.title}
                      </strong>
                      <p>
                        {notification.message}
                      </p>
                    </div>
                  ))}
              </section>
            )}
          </>
        )}

        {activeTab === "drinks" && (
          <>
            <section className="card">
              <div className="sectionHeader">
                <div>
                  <span className="eyebrow">
                    GETRÄNKE
                  </span>
                  <h2>
                    🍺 Getränkeverwaltung
                  </h2>
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
                <div className="formCard">
                  <input
                    placeholder="Getränk"
                    value={drinkName}
                    onChange={(e) =>
                      setDrinkName(
                        e.target.value
                      )
                    }
                  />

                  <div className="twoGrid">
                    <input
                      placeholder="Marke"
                      value={drinkBrand}
                      onChange={(e) =>
                        setDrinkBrand(
                          e.target.value
                        )
                      }
                    />

                    <select
                      value={drinkCategory}
                      onChange={(e) =>
                        setDrinkCategory(
                          e.target.value
                        )
                      }
                    >
                      <option>Bier</option>
                      <option>Wein</option>
                      <option>Sekt</option>
                      <option>Longdrink</option>
                      <option>Shot</option>
                      <option>Softdrink</option>
                      <option>Wasser</option>
                      <option>Sonstiges</option>
                    </select>
                  </div>

                  <div className="fourGrid">
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
                      placeholder="%"
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

                    <input
                      type="number"
                      min="1"
                      placeholder="Anzahl"
                      value={drinkQuantity}
                      onChange={(e) =>
                        setDrinkQuantity(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <textarea
                    placeholder="Kommentar"
                    value={drinkComment}
                    onChange={(e) =>
                      setDrinkComment(
                        e.target.value
                      )
                    }
                  />

                  <button
                    className="primary full"
                    onClick={addDrink}
                    disabled={saving}
                  >
                    {saving
                      ? "Speichere …"
                      : "🍻 Getränk speichern"}
                  </button>
                </div>
              )}

              {drinks.length === 0 ? (
                <div className="empty">
                  Noch keine Getränke.
                </div>
              ) : (
                <div className="drinkList">
                  {drinks.map((drink) => (
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
                          {drink.brand ||
                            drink.marke ||
                            "—"}
                          {" · "}
                          {getDrinkLiters(
                            drink
                          ).toFixed(1)}{" "}
                          L
                          {" · "}
                          {getDrinkAlcohol(
                            drink
                          ).toFixed(1)}
                          %
                        </small>
                      </div>

                      <div className="drinkPrice">
                        <b>
                          {getDrinkPrice(
                            drink
                          ).toFixed(2)}{" "}
                          €
                        </b>

                        <button
                          className="tinyDelete"
                          onClick={() =>
                            deleteDrink(
                              drink.id
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "people" && (
          <>
            <section className="card">
              <div className="sectionHeader">
                <div>
                  <span className="eyebrow">
                    EVENT
                  </span>
                  <h2>
                    👥 Teilnehmer
                  </h2>
                </div>

                <strong>
                  {members.length}
                </strong>
              </div>

              {members.map((member) => (
                <div
                  className="personRow"
                  key={member.id}
                >
                  <div className="avatar">
                    {getProfileName(
                      member.profile
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {getProfileName(
                        member.profile
                      )}
                    </strong>

                    <small>
                      {member.role ||
                        "member"}
                    </small>
                  </div>

                  <div className="personStats">
                    <b>
                      {member.profile
                        ?.points ?? 0}
                    </b>
                    <small>Punkte</small>
                  </div>
                </div>
              ))}
            </section>

            <section className="card">
              <span className="eyebrow">
                BIERKISTEN
              </span>

              <h2>
                🍺 Ausgegebene Kisten
              </h2>

              {crates.length === 0 ? (
                <div className="empty">
                  Noch keine Kisten.
                </div>
              ) : (
                crates.map((crate) => {
                  const member =
                    members.find(
                      (item) =>
                        item.profile_id ===
                        crate.profile_id
                    );

                  return (
                    <div
                      className="crateRow"
                      key={crate.id}
                    >
                      <span className="crateEmoji">
                        🍺🍺
                      </span>

                      <div>
                        <strong>
                          {getProfileName(
                            member?.profile ??
                              null
                          )}
                        </strong>

                        <small>
                          {crate.crates} Kiste
                          {crate.crates !== 1
                            ? "n"
                            : ""}{" "}
                          · +
                          {
                            crate.points_awarded
                          }{" "}
                          Punkte
                        </small>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </>
        )}

        {activeTab === "challenges" && (
          <>
            <section className="card">
              <span className="eyebrow">
                COMMUNITY
              </span>

              <h2>
                🎯 Challenges
              </h2>

              {(currentProfile?.role ===
                "admin" ||
                currentProfile?.role ===
                  "owner" ||
                currentProfile
                  ?.is_global_admin) && (
                <div className="formCard">
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
                    value={
                      challengePoints
                    }
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
                <div className="empty">
                  Noch keine Challenges.
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
                          {challenge.title ||
                            "Challenge"}
                        </strong>

                        <p>
                          {challenge.description ||
                            "Keine Beschreibung"}
                        </p>

                        <small>
                          {challenge.category ||
                            "Community"}
                          {" · "}
                          {
                            challenge.points
                          }{" "}
                          Punkte
                        </small>
                      </div>

                      <span
                        className={
                          challenge.status ===
                          "completed"
                            ? "status done"
                            : "status"
                        }
                      >
                        {challenge.status ===
                        "completed"
                          ? "Erledigt"
                          : "Offen"}
                      </span>
                    </div>
                  )
                )
              )}
            </section>
          </>
        )}

        {activeTab === "admin" && (
          <>
            <section className="card adminCard">
              <span className="eyebrow">
                ADMIN
              </span>

              <h2>
                👑 Event-Verwaltung
              </h2>

              {selectedEvent && (
                <div className="adminInfo">
                  <div>
                    <span>Event</span>
                    <strong>
                      {selectedEvent.title}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Einladungscode
                    </span>
                    <strong>
                      {selectedEvent.invite_code ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Teilnehmer</span>
                    <strong>
                      {members.length}
                    </strong>
                  </div>

                  <div>
                    <span>Getränke</span>
                    <strong>
                      {drinks.length}
                    </strong>
                  </div>

                  <div>
                    <span>Liter</span>
                    <strong>
                      {totalLiters.toFixed(
                        1
                      )}{" "}
                      L
                    </strong>
                  </div>

                  <div>
                    <span>Punkte</span>
                    <strong>
                      {totalPoints}
                    </strong>
                  </div>
                </div>
              )}
            </section>

            <section className="card">
              <h2>
                ⚙️ Event-Funktionen
              </h2>

              <div className="settingsList">
                {[
                  [
                    "ranking_enabled",
                    "🏆 Ranking",
                  ],
                  [
                    "show_points",
                    "⭐ Punkte anzeigen",
                  ],
                  [
                    "show_ranking",
                    "🏆 Rangliste anzeigen",
                  ],
                  [
                    "show_promille",
                    "🍷 Promille anzeigen",
                  ],
                  [
                    "show_statistics",
                    "📊 Statistiken",
                  ],
                  [
                    "show_drink_amounts",
                    "🍺 Getränkemengen",
                  ],
                  [
                    "photo_required",
                    "📸 Fotos erforderlich",
                  ],
                  [
                    "ai_recognition_enabled",
                    "🤖 KI-Erkennung",
                  ],
                  [
                    "manual_entry_allowed",
                    "✍️ Manuelle Eingabe",
                  ],
                  [
                    "cost_overview_enabled",
                    "💶 Kostenübersicht",
                  ],
                  [
                    "auto_split_costs",
                    "💶 Kosten automatisch teilen",
                  ],
                  [
                    "team_mode",
                    "👥 Team-Modus",
                  ],
                  [
                    "show_photos",
                    "📸 Fotos anzeigen",
                  ],
                  [
                    "show_costs",
                    "💶 Kosten anzeigen",
                  ],
                  [
                    "privacy_mode",
                    "🔒 Datenschutzmodus",
                  ],
                ].map(
                  ([key, label]) => {
                    const enabled =
                      Boolean(
                        selectedEvent?.[
                          key as keyof Event
                        ]
                      );

                    return (
                      <div
                        className="settingRow"
                        key={key}
                      >
                        <span>{label}</span>
                        <span
                          className={
                            enabled
                              ? "toggle on"
                              : "toggle"
                          }
                        >
                          {enabled
                            ? "AN"
                            : "AUS"}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              <p className="hint">
                Die vorhandenen Event-Einstellungen
                aus Supabase werden hier
                berücksichtigt.
              </p>
            </section>
          </>
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

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  button {
    border: 0;
  }

  .page {
    min-height: 100vh;
    width: 100%;
    margin: 0;
    padding: 0;
    background:
      radial-gradient(
        circle at 50% -10%,
        #293b4e 0%,
        #101821 34%,
        #070b10 72%
      );
    color: #fff;
  }

  .app {
    width: 100%;
    max-width: 1050px;
    margin: 0 auto;
    padding: 20px;
  }

  .hero {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 0 24px;
  }

  .heroLogo {
    width: 76px;
    height: 76px;
    flex: 0 0 76px;
    border-radius: 22px;
    background: linear-gradient(
      145deg,
      #f59e0b,
      #b45309
    );
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 14px 35px rgba(0,0,0,.35);
  }

  .crateLogo,
  .crateVisual {
    display: block;
    line-height: .82;
    font-size: 22px;
    letter-spacing: -4px;
    transform: rotate(-2deg);
  }

  .heroText {
    flex: 1;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 5px;
    font-size: clamp(
      24px,
      4vw,
      38px
    );
    letter-spacing: -.7px;
  }

  h2 {
    margin-bottom: 12px;
    font-size: 23px;
  }

  .heroText p {
    margin: 0;
    color: #94a3b8;
  }

  .refreshButton {
    width: 45px;
    height: 45px;
    border-radius: 14px;
    background: #18222d;
    color: #fff;
    font-size: 26px;
    cursor: pointer;
  }

  .message {
    position: sticky;
    top: 10px;
    z-index: 20;
    padding: 14px 16px;
    margin-bottom: 14px;
    border: 1px solid #3b4a59;
    border-radius: 14px;
    background: #111b25;
    color: #fbbf24;
    box-shadow: 0 12px 30px rgba(0,0,0,.25);
  }

  .eventCard,
  .joinCard,
  .card {
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(17,25,34,.88);
    border-radius: 22px;
    padding: 20px;
    margin-bottom: 15px;
    box-shadow:
      0 12px 35px rgba(0,0,0,.18);
  }

  .eventCard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    align-items: center;
  }

  .eyebrow {
    display: block;
    color: #fbbf24;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.4px;
    margin-bottom: 7px;
  }

  .eventInfo {
    display: flex;
    flex-direction: column;
    gap: 7px;
    color: #94a3b8;
  }

  .eventInfo strong {
    color: #fff;
    font-size: 18px;
  }

  .eventInfo b {
    color: #fbbf24;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid #2b3948;
    border-radius: 13px;
    padding: 13px 14px;
    background: #0d151e;
    color: #fff;
    outline: none;
  }

  input:focus,
  select:focus,
  textarea:focus {
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245,158,11,.1);
  }

  textarea {
    min-height: 90px;
    resize: vertical;
  }

  .joinCard {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 20px;
    align-items: center;
  }

  .joinCard small {
    display: block;
    margin-top: 4px;
    color: #7f8da0;
  }

  .joinRow {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .tabs {
    display: flex;
    gap: 7px;
    margin: 4px 0 15px;
    padding: 6px;
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 18px;
    background: #0d141c;
    overflow-x: auto;
  }

  .tabs button {
    flex: 1;
    min-width: 100px;
    padding: 11px 12px;
    border-radius: 13px;
    background: transparent;
    color: #8391a1;
    cursor: pointer;
    white-space: nowrap;
  }

  .tabs button.active {
    background: #f59e0b;
    color: #111;
    font-weight: 800;
  }

  .tabs span {
    margin-left: 5px;
  }

  .statsGrid {
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 10px;
    margin-bottom: 15px;
  }

  .stat {
    min-height: 125px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 19px;
    background: #111a23;
    text-align: center;
  }

  .stat span {
    font-size: 24px;
  }

  .stat strong {
    margin-top: 5px;
    font-size: 24px;
  }

  .stat small {
    color: #7f8da0;
  }

  .actionGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 13px;
    margin-bottom: 15px;
  }

  .beerAction,
  .crateAction {
    min-height: 145px;
    border-radius: 21px;
    padding: 18px;
    text-align: left;
    cursor: pointer;
    transition: transform .15s ease;
  }

  .beerAction:hover,
  .crateAction:hover {
    transform: translateY(-2px);
  }

  .beerAction {
    background: linear-gradient(
      135deg,
      #f59e0b,
      #d97706
    );
    color: #111;
  }

  .crateAction {
    background: linear-gradient(
      135deg,
      #26384a,
      #15222e
    );
    color: #fff;
    border: 1px solid #3b4d60;
  }

  .beerAction:disabled {
    opacity: .55;
    cursor: default;
  }

  .actionIcon {
    display: block;
    font-size: 34px;
    margin-bottom: 8px;
  }

  .crateVisual {
    font-size: 24px;
    margin-bottom: 8px;
    letter-spacing: -4px;
  }

  .beerAction strong,
  .crateAction strong {
    display: block;
    font-size: 18px;
  }

  .beerAction small,
  .crateAction small {
    display: block;
    margin-top: 5px;
    opacity: .72;
  }

  .sectionHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 15px;
  }

  .sectionHeader h2 {
    margin: 0;
  }

  .badge {
    display: inline-flex;
    min-width: 28px;
    height: 28px;
    padding: 0 9px;
    align-items: center;
    justify-content: center;
    border-radius: 99px;
    background: #f59e0b;
    color: #111;
    font-weight: 900;
  }

  .request {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 13px;
    margin-top: 8px;
    border-radius: 15px;
    background: #151f29;
  }

  .request small {
    display: block;
    color: #8290a0;
    margin-top: 4px;
  }

  .requestButtons {
    display: flex;
    gap: 7px;
  }

  .accept,
  .reject {
    padding: 10px 13px;
    border-radius: 11px;
    cursor: pointer;
    font-weight: 800;
  }

  .accept {
    background: #22c55e;
    color: #07100a;
  }

  .reject {
    background: #ef4444;
    color: #fff;
  }

  .answered {
    color: #94a3b8;
    font-size: 13px;
  }

  .profileGrid,
  .twoGrid {
    display: grid;
    grid-template-columns: repeat(2,1fr);
    gap: 9px;
    margin-bottom: 10px;
  }

  .fourGrid {
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 9px;
    margin-bottom: 10px;
  }

  .secondary,
  .primary {
    padding: 13px 16px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 800;
  }

  .primary {
    background: #f59e0b;
    color: #111;
  }

  .secondary {
    background: #263442;
    color: #fff;
  }

  .full {
    width: 100%;
  }

  .promilleBox {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
    margin-top: 15px;
    padding: 18px;
    border: 1px solid #614b1b;
    border-radius: 17px;
    background: #1e1a10;
  }

  .promilleBox small {
    display: block;
    color: #b89a52;
  }

  .promilleBox strong {
    display: block;
    margin-top: 5px;
    font-size: 36px;
    color: #fbbf24;
  }

  .promilleBox span {
    max-width: 420px;
    color: #a79b80;
    font-size: 12px;
  }

  .rankingRow,
  .personRow,
  .crateRow,
  .drinkRow,
  .challenge,
  .notification {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px;
    margin-top: 8px;
    border-radius: 15px;
    background: #141e28;
  }

  .place {
    width: 40px;
    text-align: center;
    font-size: 20px;
  }

  .rankingName,
  .drinkInfo,
  .challengeInfo {
    flex: 1;
  }

  .rankingName small,
  .drinkInfo small,
  .personRow small,
  .crateRow small,
  .challengeInfo small {
    display: block;
    color: #7f8da0;
    margin-top: 4px;
  }

  .costCard {
    text-align: center;
  }

  .bigMoney {
    color: #fbbf24;
    font-size: 42px;
    font-weight: 900;
  }

  .costCard p {
    color: #7f8da0;
  }

  .costRow {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    margin-top: 7px;
    border-radius: 12px;
    background: #141e28;
  }

  .empty {
    padding: 25px;
    text-align: center;
    color: #748296;
  }

  .formCard {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-bottom: 15px;
    padding: 15px;
    border-radius: 16px;
    background: #0c141c;
  }

  .drinkIcon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 13px;
    background: #283744;
    font-size: 22px;
  }

  .drinkPrice {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .tinyDelete {
    width: 29px;
    height: 29px;
    border-radius: 9px;
    background: #303c49;
    color: #fff;
    cursor: pointer;
  }

  .avatar {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f59e0b;
    color: #111;
    font-weight: 900;
    font-size: 19px;
  }

  .personStats {
    margin-left: auto;
    text-align: right;
  }

  .personStats small {
    display: block;
  }

  .crateEmoji {
    font-size: 22px;
    letter-spacing: -4px;
  }

  .challengeIcon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: #263442;
    font-size: 24px;
  }

  .challengeInfo p {
    margin: 5px 0;
    color: #95a2b1;
  }

  .status {
    padding: 6px 9px;
    border-radius: 9px;
    background: #263442;
    color: #fbbf24;
    font-size: 11px;
    font-weight: 800;
  }

  .status.done {
    background: #14532d;
    color: #86efac;
  }

  .adminInfo {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 9px;
  }

  .adminInfo > div {
    padding: 14px;
    border-radius: 13px;
    background: #141e28;
  }

  .adminInfo span {
    display: block;
    color: #7f8da0;
    font-size: 11px;
  }

  .adminInfo strong {
    display: block;
    margin-top: 5px;
  }

  .settingsList {
    display: grid;
    grid-template-columns: repeat(2,1fr);
    gap: 7px;
  }

  .settingRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 11px 13px;
    border-radius: 12px;
    background: #141e28;
  }

  .toggle {
    padding: 4px 8px;
    border-radius: 8px;
    background: #29343f;
    color: #7f8da0;
    font-size: 10px;
    font-weight: 900;
  }

  .toggle.on {
    background: #14532d;
    color: #86efac;
  }

  .notification {
    display: block;
    cursor: pointer;
  }

  .notification p {
    margin: 5px 0 0;
    color: #8c9aaa;
  }

  .hint {
    color: #718096;
    font-size: 12px;
  }

  footer {
    padding: 35px 10px 15px;
    text-align: center;
    color: #5f6d7d;
  }

  footer strong {
    display: block;
    color: #8996a5;
  }

  footer small {
    display: block;
    margin-top: 5px;
  }

  .loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .beer-loader {
    font-size: 60px;
    animation: pulse 1s infinite alternate;
  }

  @keyframes pulse {
    from {
      transform: scale(.9);
    }
    to {
      transform: scale(1.08);
    }
  }

  @media (max-width: 750px) {
    .app {
      padding: 12px;
    }

    .hero {
      padding-top: 8px;
    }

    .heroLogo {
      width: 62px;
      height: 62px;
      flex-basis: 62px;
    }

    .eventCard,
    .joinCard {
      grid-template-columns: 1fr;
    }

    .statsGrid {
      grid-template-columns: repeat(2,1fr);
    }

    .actionGrid {
      grid-template-columns: 1fr;
    }

    .fourGrid {
      grid-template-columns: repeat(2,1fr);
    }

    .adminInfo {
      grid-template-columns: repeat(2,1fr);
    }

    .settingsList {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 500px) {
    .heroText p {
      font-size: 12px;
    }

    .heroText h1 {
      font-size: 21px;
    }

    .profileGrid,
    .twoGrid,
    .fourGrid {
      grid-template-columns: 1fr;
    }

    .promilleBox {
      flex-direction: column;
      align-items: flex-start;
    }

    .request {
      align-items: flex-start;
      flex-direction: column;
    }

    .requestButtons {
      width: 100%;
    }

    .requestButtons button {
      flex: 1;
    }

    .adminInfo {
      grid-template-columns: 1fr;
    }

    .tabs button {
      min-width: 84px;
    }

    .tabs span {
      display: block;
      margin: 2px 0 0;
      font-size: 10px;
    }
  }
`;
