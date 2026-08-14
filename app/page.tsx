"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  user_id: string | null;
  username: string | null;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  points: number | null;
  drinks_count: number | null;
  is_global_admin: boolean | null;
};

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
  created_at: string | null;
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
  created_by_profile_id: string | null;
  created_by: string | null;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at: string | null;
  gender_factor: number | null;
  joined_via_code: string | null;
  role: string | null;
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
  marke: string | null;
  getraenk: string | null;
  menge: number | null;
  alkohol: number | null;
  preis: number | null;
  promille_wert: number | null;
};

type EventSettings = {
  id: string;
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

type Challenge = {
  id: string;
  event_id: string | null;
  title: string | null;
  description: string | null;
  points: number | null;
  category: string | null;
  status: string | null;
  assigned_profile_id: string | null;
  winner_profile_id: string | null;
  created_at: string | null;
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

const defaultSettings: EventSettings = {
  id: "",
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
  const [sessionUserId, setSessionUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [settings, setSettings] =
    useState<EventSettings>(defaultSettings);

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [beerRequests, setBeerRequests] =
    useState<BeerRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [showCreateEvent, setShowCreateEvent] =
    useState(false);

  const [showJoinEvent, setShowJoinEvent] =
    useState(false);

  const [showSettings, setShowSettings] =
    useState(false);

  const [showProfile, setShowProfile] =
    useState(false);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] =
    useState("");
  const [eventLocation, setEventLocation] =
    useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");

  const [inviteCode, setInviteCode] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkLiters, setDrinkLiters] =
    useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] =
    useState("5");
  const [drinkPrice, setDrinkPrice] =
    useState("0");

  const [newChallenge, setNewChallenge] =
    useState("");

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ??
    null;

  const isGlobalAdmin =
    profile?.is_global_admin === true ||
    profile?.role === "global_admin" ||
    profile?.role === "admin";

  const currentMember = members.find(
    (member) => member.profile_id === sessionUserId
  );

  const isEventAdmin =
    isGlobalAdmin ||
    currentMember?.role === "admin" ||
    selectedEvent?.created_by === sessionUserId ||
    selectedEvent?.created_by_profile_id ===
      profile?.id;

  const totalLiters = useMemo(() => {
    return drinks.reduce((sum, drink) => {
      return (
        sum +
        Number(
          drink.liters ??
            drink.menge ??
            0
        ) *
          Number(drink.quantity ?? 1)
      );
    }, 0);
  }, [drinks]);

  const totalCost = useMemo(() => {
    return drinks.reduce((sum, drink) => {
      return (
        sum +
        Number(drink.preis ?? 0) *
          Number(drink.quantity ?? 1)
      );
    }, 0);
  }, [drinks]);

  const totalPoints = members.reduce(
    (sum, member) =>
      sum +
      Number(member.profile?.points ?? 0),
    0
  );

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,user_id,username,name,email,avatar_url,role,points,drinks_count,is_global_admin"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setMessage(
        "Profil konnte nicht geladen werden: " +
          error.message
      );
      return null;
    }

    if (data) {
      setProfile(data as Profile);
      return data as Profile;
    }

    const { data: fallback } = await supabase
      .from("profiles")
      .select(
        "id,user_id,username,name,email,avatar_url,role,points,drinks_count,is_global_admin"
      )
      .eq("id", userId)
      .maybeSingle();

    if (fallback) {
      setProfile(fallback as Profile);
      return fallback as Profile;
    }

    return null;
  }

  async function loadEvents() {
    if (!sessionUserId) return;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "Events konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    const loadedEvents =
      (data ?? []) as Event[];

    setEvents(loadedEvents);

    if (
      loadedEvents.length > 0 &&
      !loadedEvents.some(
        (event) => event.id === selectedEventId
      )
    ) {
      setSelectedEventId(
        loadedEvents[0].id
      );
    }
  }

  async function loadEventData(eventId: string) {
    if (!eventId) return;

    setBusy(true);

    const [
      membersResult,
      drinksResult,
      settingsResult,
      challengesResult,
      requestsResult,
    ] = await Promise.all([
      supabase
        .from("event_members")
        .select(`
          id,
          event_id,
          profile_id,
          joined_at,
          gender_factor,
          joined_via_code,
          role,
          profile:profiles(
            id,
            user_id,
            username,
            name,
            email,
            avatar_url,
            role,
            points,
            drinks_count,
            is_global_admin
          )
        `)
        .eq("event_id", eventId),

      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("event_settings")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle(),

      supabase
        .from("challenges")
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
    ]);

    if (membersResult.error) {
      setMessage(
        "Teilnehmer konnten nicht geladen werden: " +
          membersResult.error.message
      );
    } else {
      const normalizedMembers: EventMember[] =
        (membersResult.data ?? []).map(
          (item: any) => ({
            id: item.id,
            event_id: item.event_id,
            profile_id: item.profile_id,
            joined_at: item.joined_at,
            gender_factor:
              item.gender_factor,
            joined_via_code:
              item.joined_via_code,
            role: item.role,
            profile: Array.isArray(item.profile)
              ? item.profile[0] ?? null
              : item.profile ?? null,
          })
        );

      setMembers(normalizedMembers);
    }

    if (drinksResult.error) {
      setMessage(
        "Getränke konnten nicht geladen werden: " +
          drinksResult.error.message
      );
    } else {
      setDrinks(
        (drinksResult.data ?? []) as Drink[]
      );
    }

    if (settingsResult.error) {
      setMessage(
        "Event-Einstellungen konnten nicht geladen werden: " +
          settingsResult.error.message
      );
    } else if (settingsResult.data) {
      setSettings(
        settingsResult.data as EventSettings
      );
    } else {
      setSettings({
        ...defaultSettings,
        event_id: eventId,
      });
    }

    if (!challengesResult.error) {
      setChallenges(
        (challengesResult.data ??
          []) as Challenge[]
      );
    }

    if (!requestsResult.error) {
      setBeerRequests(
        (requestsResult.data ??
          []) as BeerRequest[]
      );
    }

    setBusy(false);
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setSessionUserId("");
        setProfile(null);
        setEvents([]);
        setLoading(false);
        return;
      }

      setSessionUserId(session.user.id);

      await loadProfile(session.user.id);

      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setSessionUserId("");
          setProfile(null);
          setEvents([]);
          setSelectedEventId("");
          return;
        }

        setSessionUserId(session.user.id);
        await loadProfile(session.user.id);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (sessionUserId) {
      loadEvents();
    }
  }, [sessionUserId]);

  useEffect(() => {
    if (selectedEventId) {
      loadEventData(selectedEventId);
    }
  }, [selectedEventId]);

  async function createEvent() {
    if (!sessionUserId) {
      setMessage("Bitte zuerst anmelden.");
      return;
    }

    if (!eventTitle.trim()) {
      setMessage(
        "Bitte einen Eventnamen eingeben."
      );
      return;
    }

    setBusy(true);
    setMessage("");

    const code =
      crypto.randomUUID()
        .replaceAll("-", "")
        .substring(0, 8)
        .toUpperCase();

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: eventTitle.trim(),
        description:
          eventDescription.trim() || null,
        location:
          eventLocation.trim() || null,
        invite_code: code,
        start_date:
          eventStart || null,
        end_date:
          eventEnd || null,
        is_active: true,
        created_by: sessionUserId,
        created_by_profile_id:
          profile?.id ?? null,
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
      .select("*")
      .single();

    if (error) {
      setMessage(
        "Event konnte nicht erstellt werden: " +
          error.message
      );
      setBusy(false);
      return;
    }

    const newEvent = data as Event;

    await supabase
      .from("event_members")
      .insert({
        event_id: newEvent.id,
        profile_id:
          profile?.id ?? sessionUserId,
        role: "admin",
        joined_via_code: null,
      });

    await supabase
      .from("event_settings")
      .insert({
        event_id: newEvent.id,
        ...defaultSettings,
      });

    setEvents((old) => [
      newEvent,
      ...old,
    ]);

    setSelectedEventId(newEvent.id);

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setEventStart("");
    setEventEnd("");

    setShowCreateEvent(false);

    setMessage(
      `✅ Event erstellt! Einladungscode: ${code}`
    );

    setBusy(false);
  }

  async function joinEvent() {
    if (!sessionUserId) {
      setMessage("Bitte zuerst anmelden.");
      return;
    }

    const cleanCode =
      inviteCode.trim().toUpperCase();

    if (!cleanCode) {
      setMessage(
        "Bitte einen Einladungscode eingeben."
      );
      return;
    }

    setBusy(true);

    const { data: event, error } =
      await supabase
        .from("events")
        .select("*")
        .eq("invite_code", cleanCode)
        .eq("is_active", true)
        .maybeSingle();

    if (error || !event) {
      setMessage(
        "❌ Einladungscode nicht gefunden."
      );
      setBusy(false);
      return;
    }

    const profileId =
      profile?.id ?? sessionUserId;

    const { error: memberError } =
      await supabase
        .from("event_members")
        .upsert(
          {
            event_id: event.id,
            profile_id: profileId,
            role: "member",
            joined_via_code: cleanCode,
          },
          {
            onConflict:
              "event_id,profile_id",
          }
        );

    if (memberError) {
      setMessage(
        "Event-Beitritt fehlgeschlagen: " +
          memberError.message
      );
      setBusy(false);
      return;
    }

    setMessage(
      `✅ Du bist dem Event „${event.title}“ beigetreten.`
    );

    setInviteCode("");
    setShowJoinEvent(false);

    await loadEvents();

    setSelectedEventId(event.id);

    setBusy(false);
  }

  async function saveSettings() {
    if (!selectedEventId) return;

    if (!isEventAdmin) {
      setMessage(
        "❌ Nur der Event-Ersteller bzw. Global Admin darf Einstellungen ändern."
      );
      return;
    }

    setBusy(true);

    const payload = {
      event_id: selectedEventId,
      show_participants:
        settings.show_participants,
      show_drinks:
        settings.show_drinks,
      show_drink_history:
        settings.show_drink_history,
      show_payments:
        settings.show_payments,
      show_costs:
        settings.show_costs,
      show_ranking:
        settings.show_ranking,
      show_points:
        settings.show_points,
      show_promille:
        settings.show_promille,
      show_statistics:
        settings.show_statistics,
      show_challenges:
        settings.show_challenges,
      show_challenge_points:
        settings.show_challenge_points,
      show_beer_button:
        settings.show_beer_button,
      show_beer_requests:
        settings.show_beer_requests,
      show_crate_button:
        settings.show_crate_button,
      show_profiles:
        settings.show_profiles,
      show_photos:
        settings.show_photos,
      show_who_paid:
        settings.show_who_paid,
      show_who_owes:
        settings.show_who_owes,
    };

    const { error } = await supabase
      .from("event_settings")
      .upsert(payload, {
        onConflict: "event_id",
      });

    if (error) {
      setMessage(
        "Einstellungen konnten nicht gespeichert werden: " +
          error.message
      );
    } else {
      setMessage(
        "✅ Event-Einstellungen gespeichert."
      );
      setShowSettings(false);
    }

    setBusy(false);
  }

  async function saveDrink() {
    if (!selectedEventId) return;

    if (
      !settings.show_drinks &&
      !isGlobalAdmin
    ) {
      setMessage(
        "Getränke sind für dieses Event deaktiviert."
      );
      return;
    }

    if (!drinkName.trim()) {
      setMessage(
        "Bitte ein Getränk eingeben."
      );
      return;
    }

    setBusy(true);

    const { error } = await supabase
      .from("drinks")
      .insert({
        event_id: selectedEventId,
        profile_id:
          profile?.id ?? sessionUserId,
        drink_name: drinkName.trim(),
        getraenk: drinkName.trim(),
        brand:
          drinkBrand.trim() || null,
        marke:
          drinkBrand.trim() || null,
        liters: Number(drinkLiters) || 0,
        menge: Number(drinkLiters) || 0,
        alcohol_percent:
          Number(drinkAlcohol) || 0,
        alkohol:
          Number(drinkAlcohol) || 0,
        preis: Number(drinkPrice) || 0,
        quantity: 1,
      });

    if (error) {
      setMessage(
        "Getränk konnte nicht gespeichert werden: " +
          error.message
      );
    } else {
      setMessage(
        "🍺 Getränk gespeichert."
      );

      setDrinkName("");
      setDrinkBrand("");
      setDrinkLiters("0.5");
      setDrinkAlcohol("5");
      setDrinkPrice("0");

      await loadEventData(
        selectedEventId
      );
    }

    setBusy(false);
  }

  async function createChallenge() {
    if (!selectedEventId) return;

    if (!newChallenge.trim()) {
      setMessage(
        "Bitte einen Challenge-Namen eingeben."
      );
      return;
    }

    const { error } = await supabase
      .from("challenges")
      .insert({
        event_id: selectedEventId,
        title: newChallenge.trim(),
        description: null,
        points: 10,
        category: "fun",
        status: "open",
        created_by_profile_id:
          profile?.id ?? null,
        is_active: true,
      });

    if (error) {
      setMessage(
        "Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setNewChallenge("");

    await loadEventData(
      selectedEventId
    );

    setMessage(
      "🎯 Challenge erstellt."
    );
  }

  async function logout() {
    await supabase.auth.signOut();

    setSessionUserId("");
    setProfile(null);
    setEvents([]);
    setSelectedEventId("");
  }

  function updateSetting(
    key: keyof EventSettings,
    value: boolean
  ) {
    setSettings((old) => ({
      ...old,
      [key]: value,
    }));
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          🍻
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>Wird geladen...</p>
        </div>
      </main>
    );
  }

  if (!sessionUserId) {
    return (
      <main className="page">
        <div className="loginCard">
          <div className="bigLogo">🍻</div>

          <h1>
            Güstener Zapfhahn Zentrale
          </h1>

          <p>
            Du bist nicht angemeldet.
          </p>

          <p className="muted">
            Bitte über Supabase Auth anmelden.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">

        <header className="header">
          <div className="brand">
            <div className="logo">🍻</div>

            <div>
              <h1>
                Güstener Zapfhahn Zentrale
              </h1>

              <p>
                Dein Event. Deine Getränke.
                Deine Runde.
              </p>
            </div>
          </div>

          <div className="headerActions">
            {isGlobalAdmin && (
              <span className="adminBadge">
                👑 GLOBAL ADMIN
              </span>
            )}

            <button
              className="secondary"
              onClick={() =>
                setShowProfile(
                  !showProfile
                )
              }
            >
              👤{" "}
              {profile?.username ||
                profile?.name ||
                "Profil"}
            </button>

            <button
              className="danger"
              onClick={logout}
            >
              Abmelden
            </button>
          </div>
        </header>

        {showProfile && (
          <section className="card profileCard">
            <h2>👤 Mein Profil</h2>

            <div className="profileInfo">
              <div className="avatar">
                {(
                  profile?.name ||
                  profile?.username ||
                  "P"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h3>
                  {profile?.name ||
                    profile?.username ||
                    "Philipp"}
                </h3>

                <p>
                  {profile?.email}
                </p>

                <p>
                  ⭐{" "}
                  {profile?.points ?? 0} Punkte
                  {" · "}
                  🍺{" "}
                  {profile?.drinks_count ?? 0}
                  Getränke
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="hero card">
          <div>
            <span className="eyebrow">
              🍻 EVENT-ZENTRALE
            </span>

            <h2>
              Willkommen{" "}
              {profile?.name ||
                profile?.username ||
                "Philipp"}!
            </h2>

            <p>
              Erstelle dein eigenes Event
              oder tritt mit einem
              Einladungscode bei.
            </p>
          </div>

          <div className="heroButtons">
            <button
              onClick={() =>
                setShowCreateEvent(true)
              }
            >
              ➕ Event erstellen
            </button>

            <button
              className="secondary"
              onClick={() =>
                setShowJoinEvent(true)
              }
            >
              🔑 Einladungscode
            </button>
          </div>
        </section>

        <section className="card">
          <div className="sectionHeader">
            <div>
              <h2>📅 Meine Events</h2>
              <p>
                {events.length} Event
                {events.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            {events.length > 0 && (
              <select
                value={selectedEventId}
                onChange={(e) =>
                  setSelectedEventId(
                    e.target.value
                  )
                }
              >
                {events.map((event) => (
                  <option
                    key={event.id}
                    value={event.id}
                  >
                    {event.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {events.length === 0 ? (
            <div className="empty">
              <div>📅</div>
              <h3>Noch keine Events</h3>
              <p>
                Erstelle dein erstes Event
                oder tritt einem Event bei.
              </p>
            </div>
          ) : selectedEvent ? (
            <div className="eventHero">
              <div>
                <h2>
                  🍻 {selectedEvent.title}
                </h2>

                {selectedEvent.description && (
                  <p>
                    {
                      selectedEvent.description
                    }
                  </p>
                )}

                {selectedEvent.location && (
                  <p>
                    📍{" "}
                    {selectedEvent.location}
                  </p>
                )}

                <div className="code">
                  🔑{" "}
                  <strong>
                    {selectedEvent.invite_code ||
                      "—"}
                  </strong>
                </div>
              </div>

              <div className="eventActions">
                {isEventAdmin && (
                  <button
                    className="secondary"
                    onClick={() =>
                      setShowSettings(
                        !showSettings
                      )
                    }
                  >
                    ⚙️ Einstellungen
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </section>

        {showSettings &&
          selectedEvent &&
          isEventAdmin && (
            <section className="card settingsCard">
              <div className="sectionHeader">
                <div>
                  <h2>
                    ⚙️ Event-Einstellungen
                  </h2>
                  <p>
                    Du entscheidest, welche
                    Bereiche die Teilnehmer
                    sehen und benutzen können.
                  </p>
                </div>

                <button
                  onClick={saveSettings}
                  disabled={busy}
                >
                  💾 Speichern
                </button>
              </div>

              <div className="settingsGrid">
                <Setting
                  label="Teilnehmer anzeigen"
                  value={
                    settings.show_participants
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_participants",
                      v
                    )
                  }
                />

                <Setting
                  label="Getränke anzeigen"
                  value={
                    settings.show_drinks
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_drinks",
                      v
                    )
                  }
                />

                <Setting
                  label="Getränkeverlauf"
                  value={
                    settings.show_drink_history
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_drink_history",
                      v
                    )
                  }
                />

                <Setting
                  label="Zahlungen"
                  value={
                    settings.show_payments
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_payments",
                      v
                    )
                  }
                />

                <Setting
                  label="Kosten"
                  value={
                    settings.show_costs
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_costs",
                      v
                    )
                  }
                />

                <Setting
                  label="Ranking"
                  value={
                    settings.show_ranking
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_ranking",
                      v
                    )
                  }
                />

                <Setting
                  label="Punkte"
                  value={
                    settings.show_points
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_points",
                      v
                    )
                  }
                />

                <Setting
                  label="Promille"
                  value={
                    settings.show_promille
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_promille",
                      v
                    )
                  }
                />

                <Setting
                  label="Statistiken"
                  value={
                    settings.show_statistics
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_statistics",
                      v
                    )
                  }
                />

                <Setting
                  label="Challenges"
                  value={
                    settings.show_challenges
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_challenges",
                      v
                    )
                  }
                />

                <Setting
                  label="Challenge-Punkte"
                  value={
                    settings.show_challenge_points
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_challenge_points",
                      v
                    )
                  }
                />

                <Setting
                  label="🍺 Bier-Button"
                  value={
                    settings.show_beer_button
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_beer_button",
                      v
                    )
                  }
                />

                <Setting
                  label="🍻 Bier-Anfragen"
                  value={
                    settings.show_beer_requests
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_beer_requests",
                      v
                    )
                  }
                />

                <Setting
                  label="📦 Bierkisten"
                  value={
                    settings.show_crate_button
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_crate_button",
                      v
                    )
                  }
                />

                <Setting
                  label="Profile"
                  value={
                    settings.show_profiles
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_profiles",
                      v
                    )
                  }
                />

                <Setting
                  label="Fotos"
                  value={
                    settings.show_photos
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_photos",
                      v
                    )
                  }
                />

                <Setting
                  label="Wer hat bezahlt"
                  value={
                    settings.show_who_paid
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_who_paid",
                      v
                    )
                  }
                />

                <Setting
                  label="Wer schuldet wem"
                  value={
                    settings.show_who_owes
                  }
                  onChange={(v) =>
                    updateSetting(
                      "show_who_owes",
                      v
                    )
                  }
                />
              </div>
            </section>
          )}

        {selectedEvent && (
          <>
            <section className="stats">
              <Stat
                icon="👥"
                value={
                  members.length
                }
                label="Teilnehmer"
              />

              <Stat
                icon="🍺"
                value={
                  drinks.length
                }
                label="Getränke"
              />

              <Stat
                icon="💧"
                value={`${totalLiters.toFixed(
                  1
                )} L`}
                label="Liter"
              />

              <Stat
                icon="💶"
                value={`${totalCost.toFixed(
                  2
                )} €`}
                label="Kosten"
              />
            </section>

            {settings.show_participants && (
              <section className="card">
                <h2>👥 Teilnehmer</h2>

                {members.length === 0 ? (
                  <p className="muted">
                    Noch keine Teilnehmer.
                  </p>
                ) : (
                  <div className="list">
                    {members.map(
                      (member) => (
                        <div
                          className="listItem"
                          key={member.id}
                        >
                          <div className="person">
                            <div className="miniAvatar">
                              {(
                                member.profile
                                  ?.name ||
                                member.profile
                                  ?.username ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {member
                                  .profile
                                  ?.name ||
                                  member
                                    .profile
                                    ?.username ||
                                  "Unbekannt"}
                              </strong>

                              <small>
                                ⭐{" "}
                                {member
                                  .profile
                                  ?.points ??
                                  0}{" "}
                                Punkte
                                {" · "}
                                🍺{" "}
                                {member
                                  .profile
                                  ?.drinks_count ??
                                  0}
                              </small>
                            </div>
                          </div>

                          {member.role ===
                            "admin" && (
                            <span className="adminSmall">
                              👑 Admin
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            )}

            {settings.show_drinks && (
              <section className="card">
                <div className="sectionHeader">
                  <div>
                    <h2>
                      🍺 Getränke
                    </h2>

                    <p>
                      Getränke zum Event
                      hinzufügen
                    </p>
                  </div>
                </div>

                {settings.show_drinks && (
                  <div className="drinkForm">
                    <input
                      placeholder="Getränk"
                      value={drinkName}
                      onChange={(e) =>
                        setDrinkName(
                          e.target.value
                        )
                      }
                    />

                    <input
                      placeholder="Marke"
                      value={drinkBrand}
                      onChange={(e) =>
                        setDrinkBrand(
                          e.target.value
                        )
                      }
                    />

                    <div className="three">
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
                        placeholder="Alkohol %"
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
                    </div>

                    <button
                      onClick={saveDrink}
                      disabled={busy}
                    >
                      🍻 Getränk speichern
                    </button>
                  </div>
                )}

                <div className="list">
                  {drinks.map((drink) => (
                    <div
                      className="listItem"
                      key={drink.id}
                    >
                      <div>
                        <strong>
                          🍺{" "}
                          {drink.drink_name ||
                            drink.getraenk ||
                            "Getränk"}
                        </strong>

                        <small>
                          {drink.brand ||
                            drink.marke ||
                            ""}
                          {" · "}
                          {Number(
                            drink.liters ??
                              drink.menge ??
                              0
                          ).toFixed(1)}
                          L
                          {" · "}
                          {Number(
                            drink.alcohol_percent ??
                              drink.alkohol ??
                              0
                          ).toFixed(1)}
                          %
                        </small>
                      </div>

                      <strong>
                        {Number(
                          drink.preis ?? 0
                        ).toFixed(2)}{" "}
                        €
                      </strong>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {settings.show_statistics && (
              <section className="card">
                <h2>📊 Statistik</h2>

                <div className="bigStats">
                  <div>
                    <strong>
                      {members.length}
                    </strong>
                    <span>
                      Teilnehmer
                    </span>
                  </div>

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
                    <span>Liter</span>
                  </div>

                  <div>
                    <strong>
                      {totalPoints}
                    </strong>
                    <span>Punkte</span>
                  </div>
                </div>
              </section>
            )}

            {settings.show_ranking && (
              <section className="card">
                <h2>🏆 Ranking</h2>

                {members
                  .slice()
                  .sort(
                    (a, b) =>
                      Number(
                        b.profile?.points ??
                          0
                      ) -
                      Number(
                        a.profile?.points ??
                          0
                      )
                  )
                  .map(
                    (member, index) => (
                      <div
                        className="ranking"
                        key={member.id}
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
                          {member.profile
                            ?.name ||
                            member.profile
                              ?.username ||
                            "Unbekannt"}
                        </span>

                        {settings.show_points && (
                          <b>
                            {member.profile
                              ?.points ??
                              0}{" "}
                            Punkte
                          </b>
                        )}
                      </div>
                    )
                  )}
              </section>
            )}

            {settings.show_challenges && (
              <section className="card">
                <h2>🎯 Challenges</h2>

                {isEventAdmin && (
                  <div className="row">
                    <input
                      placeholder="Neue Challenge"
                      value={
                        newChallenge
                      }
                      onChange={(e) =>
                        setNewChallenge(
                          e.target.value
                        )
                      }
                    />

                    <button
                      onClick={
                        createChallenge
                      }
                    >
                      ➕ Erstellen
                    </button>
                  </div>
                )}

                {challenges.map(
                  (challenge) => (
                    <div
                      className="listItem"
                      key={challenge.id}
                    >
                      <div>
                        <strong>
                          🎯{" "}
                          {challenge.title}
                        </strong>

                        <small>
                          {challenge.category ||
                            "Fun"}
                          {" · "}
                          ⭐{" "}
                          {challenge.points ??
                            0}{" "}
                          Punkte
                        </small>
                      </div>

                      <span>
                        {challenge.status ||
                          "open"}
                      </span>
                    </div>
                  )
                )}
              </section>
            )}

            {settings.show_beer_requests && (
              <section className="card">
                <h2>
                  🍻 Bier-Anfragen
                </h2>

                {beerRequests.length ===
                0 ? (
                  <p className="muted">
                    Keine offenen
                    Bier-Anfragen.
                  </p>
                ) : (
                  beerRequests.map(
                    (request) => (
                      <div
                        className="listItem"
                        key={request.id}
                      >
                        <span>
                          🍺 Anfrage
                        </span>

                        <b>
                          {request.status}
                        </b>
                      </div>
                    )
                  )
                )}
              </section>
            )}

            {settings.show_costs && (
              <section className="card costCard">
                <h2>
                  💶 Kostenübersicht
                </h2>

                <div className="costBig">
                  {totalCost.toFixed(
                    2
                  )}{" "}
                  €
                </div>

                <p>
                  Gesamtkosten der
                  erfassten Getränke
                </p>

                {settings.show_who_owes &&
                  members.length > 0 && (
                    <div className="costLine">
                      <span>
                        👥 Pro Teilnehmer
                      </span>

                      <b>
                        {(
                          totalCost /
                          members.length
                        ).toFixed(
                          2
                        )}{" "}
                        €
                      </b>
                    </div>
                  )}
              </section>
            )}
          </>
        )}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <footer>
          🍻 Güstener Zapfhahn Zentrale
          <small>
            Deine Events. Deine Runde.
            Deine Regeln.
          </small>
        </footer>
      </div>

      {showCreateEvent && (
        <Modal
          title="➕ Event erstellen"
          onClose={() =>
            setShowCreateEvent(false)
          }
        >
          <input
            placeholder="Eventname"
            value={eventTitle}
            onChange={(e) =>
              setEventTitle(
                e.target.value
              )
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

          <input
            placeholder="Ort"
            value={eventLocation}
            onChange={(e) =>
              setEventLocation(
                e.target.value
              )
            }
          />

          <div className="two">
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
            onClick={createEvent}
            disabled={busy}
          >
            🍻 Event erstellen
          </button>
        </Modal>
      )}

      {showJoinEvent && (
        <Modal
          title="🔑 Event beitreten"
          onClose={() =>
            setShowJoinEvent(false)
          }
        >
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
            onClick={joinEvent}
            disabled={busy}
          >
            🚀 Event beitreten
          </button>
        </Modal>
      )}
    </main>
  );
}

function Setting({
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
      type="button"
      className={
        "setting " +
        (value ? "enabled" : "disabled")
      }
      onClick={() => onChange(!value)}
    >
      <span>{label}</span>

      <strong>
        {value ? "AN" : "AUS"}
      </strong>
    </button>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string | number;
  label: string;
}) {
  return (
    <div className="stat">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modalHeader">
          <h2>{title}</h2>

          <button
            className="close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modalBody">
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = `
* {
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at top,
      #26384b 0%,
      #0b1016 48%,
      #06090d 100%
    );
  color: #fff;
  padding: 18px;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

.container {
  width: 100%;
  max-width: 1050px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 18px;
  font-size: 34px;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 4px;
  font-size: 25px;
}

h2 {
  margin-bottom: 8px;
}

p {
  color: #9ba8b7;
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.card {
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  backdrop-filter: blur(14px);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.eyebrow {
  color: #fbbf24;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.hero h2 {
  font-size: 30px;
  margin-top: 8px;
}

.heroButtons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 12px 16px;
  background: #f59e0b;
  color: #111;
  font-weight: 800;
  cursor: pointer;
}

button:hover {
  filter: brightness(1.08);
}

button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.secondary {
  background: #253241;
  color: #fff;
}

.danger {
  background: #3b2226;
  color: #ffb4b4;
}

.adminBadge {
  background: #f59e0b;
  color: #111;
  padding: 8px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
}

.sectionHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.sectionHeader p {
  margin-bottom: 0;
  font-size: 13px;
}

select,
input,
textarea {
  width: 100%;
  border: 1px solid #354251;
  border-radius: 12px;
  background: #131b24;
  color: #fff;
  padding: 13px;
  outline: none;
  margin-bottom: 10px;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

select:focus,
input:focus,
textarea:focus {
  border-color: #f59e0b;
}

.eventHero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  background: rgba(255,255,255,.04);
  padding: 18px;
  border-radius: 16px;
}

.code {
  display: inline-block;
  margin-top: 10px;
  padding: 10px 14px;
  background: #111820;
  border: 1px dashed #f59e0b;
  border-radius: 10px;
  color: #fbbf24;
  letter-spacing: 1px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat {
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 17px;
  padding: 18px;
  text-align: center;
}

.stat span {
  display: block;
  font-size: 25px;
}

.stat strong {
  display: block;
  font-size: 23px;
  margin: 5px 0;
}

.stat small {
  color: #8794a3;
}

.list {
  display: grid;
  gap: 8px;
}

.listItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 13px;
  background: rgba(255,255,255,.045);
  border-radius: 13px;
}

.listItem small {
  display: block;
  color: #8794a3;
  margin-top: 4px;
}

.person {
  display: flex;
  align-items: center;
  gap: 10px;
}

.miniAvatar,
.avatar {
  border-radius: 50%;
  background: #263443;
  display: grid;
  place-items: center;
  font-weight: 900;
}

.miniAvatar {
  width: 42px;
  height: 42px;
}

.avatar {
  width: 65px;
  height: 65px;
  font-size: 25px;
}

.adminSmall {
  color: #fbbf24;
  font-size: 12px;
  font-weight: 800;
}

.drinkForm {
  background: rgba(255,255,255,.035);
  padding: 15px;
  border-radius: 15px;
  margin-bottom: 15px;
}

.three,
.two {
  display: grid;
  gap: 10px;
}

.three {
  grid-template-columns: repeat(3,1fr);
}

.two {
  grid-template-columns: repeat(2,1fr);
}

.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.row input {
  margin-bottom: 0;
}

.ranking {
  display: grid;
  grid-template-columns: 45px 1fr auto;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,.045);
  border-radius: 13px;
  padding: 13px;
  margin-top: 8px;
}

.ranking strong:first-child {
  font-size: 20px;
}

.costCard {
  text-align: center;
}

.costBig {
  font-size: 42px;
  font-weight: 900;
  color: #fbbf24;
}

.costLine {
  display: flex;
  justify-content: space-between;
  padding: 13px;
  background: rgba(255,255,255,.045);
  border-radius: 12px;
  margin-top: 10px;
}

.bigStats {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 10px;
}

.bigStats div {
  text-align: center;
  padding: 15px;
  background: rgba(255,255,255,.04);
  border-radius: 14px;
}

.bigStats strong {
  display: block;
  font-size: 28px;
  color: #fbbf24;
}

.bigStats span {
  color: #8794a3;
  font-size: 12px;
}

.settingsGrid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 10px;
}

.setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  background: #202a35;
  color: #fff;
  border: 1px solid #334150;
}

.setting.enabled {
  border-color: #f59e0b;
}

.setting.disabled {
  opacity: .65;
}

.setting strong {
  font-size: 11px;
}

.profileInfo {
  display: flex;
  align-items: center;
  gap: 15px;
}

.empty {
  text-align: center;
  padding: 35px 15px;
}

.empty div {
  font-size: 45px;
}

.muted {
  color: #7f8b98;
}

.message {
  position: sticky;
  bottom: 15px;
  z-index: 20;
  padding: 14px;
  border-radius: 13px;
  background: #17212c;
  border: 1px solid #344454;
  color: #fbbf24;
  margin-bottom: 15px;
}

.loading,
.loginCard {
  max-width: 600px;
  margin: 15vh auto;
  text-align: center;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 24px;
  padding: 40px 25px;
}

.bigLogo {
  font-size: 65px;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(8px);
}

.modal {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow: auto;
  background: #111820;
  border: 1px solid #354251;
  border-radius: 22px;
  box-shadow: 0 25px 80px rgba(0,0,0,.5);
}

.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid #293542;
}

.modalHeader h2 {
  margin: 0;
}

.modalBody {
  padding: 18px;
}

.close {
  width: 40px;
  height: 40px;
  padding: 0;
  background: #27323e;
  color: #fff;
  font-size: 24px;
}

footer {
  text-align: center;
  color: #667484;
  padding: 30px 10px;
}

footer small {
  display: block;
  margin-top: 5px;
}

@media(max-width:750px) {
  .header,
  .hero,
  .eventHero {
    flex-direction: column;
    align-items: stretch;
  }

  .headerActions {
    justify-content: flex-start;
  }

  .stats,
  .bigStats {
    grid-template-columns: repeat(2,1fr);
  }
}

@media(max-width:600px) {
  .page {
    padding: 10px;
  }

  .card {
    padding: 15px;
    border-radius: 17px;
  }

  .three,
  .two,
  .settingsGrid {
    grid-template-columns: 1fr;
  }

  .row {
    grid-template-columns: 1fr;
  }

  .row input {
    margin-bottom: 10px;
  }

  .stats {
    gap: 8px;
  }

  .stat {
    padding: 13px 8px;
  }

  .stat strong {
    font-size: 19px;
  }

  .ranking {
    grid-template-columns: 40px 1fr;
  }

  .ranking b {
    grid-column: 2;
  }
}
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "zapfhahn-page-styles"
  )
) {
  const style =
    document.createElement("style");

  style.id =
    "zapfhahn-page-styles";

  style.innerHTML = styles;

  document.head.appendChild(style);
}
