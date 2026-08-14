"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  user_id: string | null;
  username: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  points: number | null;
  drinks_count: number | null;
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
  profile?: Profile | Profile[] | null;
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
  image_path: string | null;
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
};

type EventSettings = {
  event_id: string;
  show_participants: boolean | null;
  show_drinks: boolean | null;
  show_drink_history: boolean | null;
  show_payments: boolean | null;
  show_costs: boolean | null;
  show_ranking: boolean | null;
  show_points: boolean | null;
  show_promille: boolean | null;
  show_statistics: boolean | null;
  show_challenges: boolean | null;
  show_challenge_points: boolean | null;
  show_beer_button: boolean | null;
  show_beer_requests: boolean | null;
  show_crate_button: boolean | null;
  show_profiles: boolean | null;
  show_photos: boolean | null;
  show_who_paid: boolean | null;
  show_who_owes: boolean | null;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status: string | null;
  message: string | null;
  created_at: string | null;
  responded_at: string | null;
};

type Crate = {
  id: string;
  event_id: string;
  profile_id: string;
  crates: number;
  points_awarded: number;
  description: string | null;
  created_at: string | null;
};

type BloodAlcohol = {
  member_id: string;
  current_promille: number | null;
  estimated_sober_time: string | null;
  alcohol_grams: number | null;
};

const normalizeProfile = (
  value: Profile | Profile[] | null | undefined
): Profile | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

const money = (value: number) =>
  `${Number(value || 0).toFixed(2).replace(".", ",")} €`;

const liters = (value: number) =>
  `${Number(value || 0).toFixed(1).replace(".", ",")} L`;

export default function Home() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [requests, setRequests] = useState<BeerRequest[]>([]);
  const [crates, setCrates] = useState<Crate[]>([]);
  const [bloodAlcohol, setBloodAlcohol] = useState<BloodAlcohol[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  const [selectedDrink, setSelectedDrink] = useState("");
  const [selectedMember, setSelectedMember] = useState("");

  const [requestText, setRequestText] = useState("");
  const [crateCount, setCrateCount] = useState("1");
  const [crateMember, setCrateMember] = useState("");

  const [activeTab, setActiveTab] = useState<
    "home" | "drinks" | "beer" | "ranking" | "admin"
  >("home");

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId) ?? null,
    [events, eventId]
  );

  const isAdmin =
    profile?.is_global_admin === true ||
    profile?.role === "admin" ||
    profile?.role === "global_admin";

  const totalLiters = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(drink.liters ?? drink.menge ?? 0) *
            Number(drink.quantity ?? 1),
        0
      ),
    [drinks]
  );

  const totalCost = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(drink.preis ?? 0) * Number(drink.quantity ?? 1),
        0
      ),
    [drinks]
  );

  const totalDrinks = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) => sum + Number(drink.quantity ?? 1),
        0
      ),
    [drinks]
  );

  const ranking = useMemo(() => {
    return [...members]
      .map((member) => {
        const p = normalizeProfile(member.profile);

        const memberDrinks = drinks.filter(
          (drink) => drink.profile_id === member.profile_id
        );

        const drinkPoints = memberDrinks.reduce(
          (sum, drink) =>
            sum +
            10 *
              Number(drink.quantity ?? 1),
          0
        );

        return {
          member,
          profile: p,
          points:
            Number(p?.points ?? 0) + drinkPoints,
          drinks: memberDrinks.reduce(
            (sum, drink) =>
              sum + Number(drink.quantity ?? 1),
            0
          ),
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [members, drinks]);

  const currentPromille = useMemo(() => {
    if (!profile) return 0;

    const ownMember = members.find(
      (member) => member.profile_id === profile.id
    );

    if (!ownMember) return 0;

    const row = bloodAlcohol.find(
      (item) => item.member_id === ownMember.id
    );

    return Number(row?.current_promille ?? 0);
  }, [profile, members, bloodAlcohol]);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      setProfile(null);
      return null;
    }

    const nextProfile = data as Profile;
    setProfile(nextProfile);
    return nextProfile;
  }

  async function loadEvents(nextProfile?: Profile | null) {
    const admin =
      nextProfile?.is_global_admin === true ||
      nextProfile?.role === "admin" ||
      nextProfile?.role === "global_admin";

    let query = supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!admin && nextProfile) {
      const { data: memberRows } = await supabase
        .from("event_members")
        .select("event_id")
        .eq("profile_id", nextProfile.id);

      const ids = (memberRows ?? []).map(
        (row) => row.event_id
      );

      if (ids.length === 0) {
        setEvents([]);
        return [];
      }

      query = query.in("id", ids);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const nextEvents = (data ?? []) as Event[];
    setEvents(nextEvents);

    if (
      !eventId ||
      !nextEvents.some((event) => event.id === eventId)
    ) {
      setEventId(nextEvents[0]?.id ?? "");
    }

    return nextEvents;
  }

  async function loadEventData(id: string) {
    if (!id) {
      setMembers([]);
      setDrinks([]);
      setSettings(null);
      setRequests([]);
      setCrates([]);
      setBloodAlcohol([]);
      return;
    }

    const [
      membersResult,
      drinksResult,
      settingsResult,
      requestResult,
      crateResult,
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
            role,
            points,
            drinks_count,
            weight_kg,
            height_cm,
            age,
            gender,
            gewicht_kg,
            alter,
            geschlecht,
            avatar_url,
            is_global_admin
          )
        `)
        .eq("event_id", id),

      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("event_settings")
        .select("*")
        .eq("event_id", id)
        .maybeSingle(),

      supabase
        .from("beer_requests")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("beer_crate_sponsorships")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (membersResult.error) {
      setMessage(
        `Teilnehmer konnten nicht geladen werden: ${membersResult.error.message}`
      );
    }

    if (drinksResult.error) {
      setMessage(
        `Getränke konnten nicht geladen werden: ${drinksResult.error.message}`
      );
    }

    if (settingsResult.error) {
      setMessage(
        `Event-Einstellungen konnten nicht geladen werden: ${settingsResult.error.message}`
      );
    }

    if (requestResult.error) {
      setMessage(
        `Bier-Anfragen konnten nicht geladen werden: ${requestResult.error.message}`
      );
    }

    if (crateResult.error) {
      setMessage(
        `Kisten konnten nicht geladen werden: ${crateResult.error.message}`
      );
    }

    setMembers(
      ((membersResult.data ?? []) as EventMember[]).map(
        (member) => ({
          ...member,
          profile: normalizeProfile(member.profile),
        })
      )
    );

    setDrinks((drinksResult.data ?? []) as Drink[]);
    setSettings(
      (settingsResult.data ?? null) as EventSettings | null
    );
    setRequests(
      (requestResult.data ?? []) as BeerRequest[]
    );
    setCrates(
      (crateResult.data ?? []) as Crate[]
    );

    const { data: alcoholRows } = await supabase
      .from("blood_alcohol")
      .select(
        "member_id,current_promille,estimated_sober_time,alcohol_grams"
      )
      .eq("event_id", id);

    setBloodAlcohol(
      (alcoholRows ?? []) as BloodAlcohol[]
    );
  }

  async function initialize() {
    try {
      setLoading(true);
      setMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setSessionUserId(null);
        setProfile(null);
        setEvents([]);
        return;
      }

      setSessionUserId(session.user.id);

      const nextProfile = await loadProfile(
        session.user.id
      );

      await loadEvents(nextProfile);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setSessionUserId(null);
          setProfile(null);
          setEvents([]);
          setEventId("");
          return;
        }

        setSessionUserId(session.user.id);

        try {
          const nextProfile = await loadProfile(
            session.user.id
          );
          await loadEvents(nextProfile);
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Anmeldung konnte nicht verarbeitet werden."
          );
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    loadEventData(eventId).catch((error) => {
      setMessage(
        error instanceof Error
          ? error.message
          : "Event konnte nicht geladen werden."
      );
    });
  }, [eventId]);

  async function refresh() {
    if (!profile) return;

    setBusy(true);

    try {
      await loadEvents(profile);
      if (eventId) {
        await loadEventData(eventId);
      }
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function saveDrink() {
    if (!profile || !eventId) {
      setMessage("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      setMessage("❌ Bitte ein Getränk eingeben.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("drinks")
        .insert({
          event_id: eventId,
          profile_id: profile.id,
          drink_name: drinkName.trim(),
          getraenk: drinkName.trim(),
          brand: drinkBrand.trim() || null,
          marke: drinkBrand.trim() || null,
          liters: Number(drinkLiters),
          menge: Number(drinkLiters),
          alcohol_percent: Number(drinkAlcohol),
          alkohol: Number(drinkAlcohol),
          preis: Number(drinkPrice),
          quantity: 1,
          category: "Getränk",
        });

      if (error) throw new Error(error.message);

      setDrinkName("");
      setDrinkBrand("");
      setDrinkLiters("0.5");
      setDrinkAlcohol("5");
      setDrinkPrice("");

      await loadEventData(eventId);

      setMessage("🍺 Getränk gespeichert!");
    } catch (error) {
      setMessage(
        `❌ Getränk konnte nicht gespeichert werden: ${
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler"
        }`
      );
    } finally {
      setBusy(false);
    }
  }

  async function assignDrink() {
    if (!selectedDrink || !selectedMember) {
      setMessage(
        "❌ Bitte Teilnehmer und Getränk auswählen."
      );
      return;
    }

    setBusy(true);

    try {
      const drink = drinks.find(
        (item) => item.id === selectedDrink
      );

      if (!drink) throw new Error("Getränk nicht gefunden.");

      const { error } = await supabase
        .from("drinks")
        .update({
          profile_id: selectedMember,
        })
        .eq("id", selectedDrink)
        .eq("event_id", eventId);

      if (error) throw new Error(error.message);

      await loadEventData(eventId);

      setSelectedDrink("");
      setSelectedMember("");

      setMessage(
        "🍺 Getränk zugeordnet! +10 Punkte"
      );
    } catch (error) {
      setMessage(
        `❌ Getränk konnte nicht zugeordnet werden: ${
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler"
        }`
      );
    } finally {
      setBusy(false);
    }
  }

  async function requestBeer() {
    if (!profile || !eventId) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase
        .from("beer_requests")
        .insert({
          event_id: eventId,
          requester_profile_id: profile.id,
          status: "open",
          message:
            requestText.trim() ||
            `${profile.name || profile.username || "Jemand"} möchte ein Bier.`,
        });

      if (error) throw new Error(error.message);

      setRequestText("");
      await loadEventData(eventId);

      setMessage("🍺 Bier-Anfrage gesendet!");
    } catch (error) {
      setMessage(
        `❌ Bier-Anfrage konnte nicht gesendet werden: ${
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler"
        }`
      );
    } finally {
      setBusy(false);
    }
  }

  async function sponsorCrate() {
    if (!profile || !eventId || !crateMember) {
      setMessage(
        "❌ Bitte Teilnehmer auswählen."
      );
      return;
    }

    const count = Math.max(
      1,
      Number(crateCount || 1)
    );

    const points = count * 50;

    setBusy(true);

    try {
      const { error } = await supabase
        .from("beer_crate_sponsorships")
        .insert({
          event_id: eventId,
          profile_id: crateMember,
          crates: count,
          points_awarded: points,
          description: `🍻 ${count} Kiste${
            count === 1 ? "" : "n"
          } spendiert`,
        });

      if (error) throw new Error(error.message);

      await loadEventData(eventId);

      setCrateCount("1");
      setCrateMember("");

      setMessage(
        `🍻 Kiste spendiert! +${points} Punkte`
      );
    } catch (error) {
      setMessage(
        `❌ Kiste konnte nicht gespeichert werden: ${
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler"
        }`
      );
    } finally {
      setBusy(false);
    }
  }

  async function createEvent() {
    if (!profile || !isAdmin) return;

    const title = window.prompt(
      "Name des neuen Events:"
    );

    if (!title?.trim()) return;

    setBusy(true);

    try {
      const { data, error } = await supabase
        .from("events")
        .insert({
          title: title.trim(),
          is_active: true,
          created_by_profile_id: profile.id,
          created_by: profile.user_id,
          ranking_enabled: true,
          show_points: true,
          show_ranking: true,
          show_promille: true,
          show_statistics: true,
          show_drink_amounts: true,
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

      if (error) throw new Error(error.message);

      if (data) {
        await supabase
          .from("event_settings")
          .insert({
            event_id: data.id,
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
          });

        await loadEvents(profile);
        setEventId(data.id);
        setActiveTab("home");
      }

      setMessage("🍻 Event erstellt!");
    } catch (error) {
      setMessage(
        `❌ Event konnte nicht erstellt werden: ${
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler"
        }`
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteEvent() {
    if (!isAdmin || !eventId) return;

    const ok = window.confirm(
      "Dieses Event wirklich löschen?"
    );

    if (!ok) return;

    setBusy(true);

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw new Error(error.message);

      const remaining = events.filter(
        (event) => event.id !== eventId
      );

      setEvents(remaining);
      setEventId(remaining[0]?.id ?? "");

      setMessage("🗑️ Event gelöscht.");
    } catch (error) {
      setMessage(
        `❌ Event konnte nicht gelöscht werden: ${
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler"
        }`
      );
    } finally {
      setBusy(false);
    }
  }

  function memberName(profileId: string) {
    const member = members.find(
      (item) => item.profile_id === profileId
    );

    const p = normalizeProfile(member?.profile);

    return (
      p?.name ||
      p?.username ||
      p?.email ||
      "Unbekannt"
    );
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          <div className="beerAnimation">🍺</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>Daten werden geladen …</p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!sessionUserId || !profile) {
    return (
      <main className="page">
        <div className="loginCard">
          <div className="bigBeer">🍻</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>
            Du bist nicht angemeldet.
          </p>
          <p className="muted">
            Bitte zuerst über Supabase Auth anmelden.
          </p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="glow glow1" />
      <div className="glow glow2" />

      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="logo">🍻</div>
            <div>
              <div className="eyebrow">
                GÜSTEN
              </div>
              <h1>
                Zapfhahn
                <span>Zentrale</span>
              </h1>
            </div>
          </div>

          <div className="headerActions">
            {isAdmin && (
              <div className="adminBadge">
                👑 ADMIN
              </div>
            )}

            <button
              className="iconButton"
              onClick={refresh}
              disabled={busy}
            >
              ↻
            </button>

            <button
              className="iconButton"
              onClick={logout}
            >
              ⎋
            </button>
          </div>
        </header>

        <section className="hero">
          <div>
            <span className="heroTag">
              {isAdmin
                ? "👑 GLOBAL ADMIN"
                : "🍺 EVENT"}
            </span>

            <h2>
              Hallo{" "}
              {profile.name ||
                profile.username ||
                "Philipp"}
              !
            </h2>

            <p>
              Willkommen in deiner Zapfhahn-Zentrale.
            </p>
          </div>

          <div className="floatingBeer">
            🍺
          </div>
        </section>

        {isAdmin && (
          <section className="adminPanel">
            <div>
              <strong>👑 Global-Admin</strong>
              <small>
                Zugriff auf alle Events
              </small>
            </div>

            <button
              className="goldButton"
              onClick={createEvent}
              disabled={busy}
            >
              ＋ Event erstellen
            </button>
          </section>
        )}

        <section className="card eventCard">
          <div className="sectionTitle">
            <div>
              <span className="sectionIcon">
                📅
              </span>
              <div>
                <h3>Event auswählen</h3>
                <small>
                  {isAdmin
                    ? "Du kannst jedes Event öffnen."
                    : "Deine Events"}
                </small>
              </div>
            </div>

            {selectedEvent && (
              <span className="activeDot">
                ● AKTIV
              </span>
            )}
          </div>

          <select
            className="bigSelect"
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setActiveTab("home");
            }}
          >
            <option value="">
              Event auswählen …
            </option>

            {events.map((event) => (
              <option
                key={event.id}
                value={event.id}
              >
                {event.title}
                {event.location
                  ? ` · ${event.location}`
                  : ""}
              </option>
            ))}
          </select>

          {selectedEvent && (
            <div className="eventInfo">
              <strong>
                {selectedEvent.title}
              </strong>

              {selectedEvent.description && (
                <p>
                  {selectedEvent.description}
                </p>
              )}

              <div className="chips">
                {selectedEvent.location && (
                  <span>
                    📍 {selectedEvent.location}
                  </span>
                )}

                {selectedEvent.start_date && (
                  <span>
                    📅{" "}
                    {selectedEvent.start_date}
                  </span>
                )}

                {selectedEvent.invite_code && (
                  <span>
                    🔑{" "}
                    {selectedEvent.invite_code}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {!eventId ? (
          <section className="empty card">
            <div>🍺</div>
            <h3>Kein Event ausgewählt</h3>
            <p>
              Wähle oben ein Event aus.
            </p>
          </section>
        ) : (
          <>
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
              </button>

              <button
                className={
                  activeTab === "beer"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("beer")
                }
              >
                🍻
              </button>

              <button
                className={
                  activeTab === "ranking"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("ranking")
                }
              >
                🏆
              </button>

              {isAdmin && (
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
                </button>
              )}
            </nav>

            {activeTab === "home" && (
              <>
                <section className="statsGrid">
                  <div className="statCard">
                    <span>🍺</span>
                    <strong>
                      {totalDrinks}
                    </strong>
                    <small>Getränke</small>
                  </div>

                  <div className="statCard">
                    <span>💧</span>
                    <strong>
                      {totalLiters.toFixed(1)}
                    </strong>
                    <small>Liter</small>
                  </div>

                  <div className="statCard">
                    <span>👥</span>
                    <strong>
                      {members.length}
                    </strong>
                    <small>Teilnehmer</small>
                  </div>

                  <div className="statCard">
                    <span>💶</span>
                    <strong>
                      {totalCost.toFixed(0)} €
                    </strong>
                    <small>Kosten</small>
                  </div>
                </section>

                {(settings?.show_promille ??
                  selectedEvent?.show_promille ??
                  true) && (
                  <section className="promilleCard">
                    <div className="promilleIcon">
                      🍺
                    </div>

                    <div className="promilleInfo">
                      <small>
                        DEIN PROMILLEWERT
                      </small>
                      <strong>
                        {currentPromille
                          .toFixed(2)
                          .replace(".", ",")}{" "}
                        ‰
                      </strong>
                    </div>

                    <div className="promilleStatus">
                      {currentPromille <= 0.3
                        ? "🙂"
                        : currentPromille <= 0.8
                        ? "😅"
                        : "⚠️"}
                    </div>
                  </section>
                )}

                <section className="card">
                  <div className="sectionTitle">
                    <div>
                      <span className="sectionIcon">
                        👥
                      </span>
                      <div>
                        <h3>Teilnehmer</h3>
                        <small>
                          {members.length} Personen
                        </small>
                      </div>
                    </div>
                  </div>

                  {members.length === 0 ? (
                    <div className="emptySmall">
                      Noch keine Teilnehmer.
                    </div>
                  ) : (
                    <div className="memberGrid">
                      {members.map((member) => {
                        const p =
                          normalizeProfile(
                            member.profile
                          );

                        const memberDrinks =
                          drinks.filter(
                            (drink) =>
                              drink.profile_id ===
                              member.profile_id
                          );

                        const points =
                          Number(
                            p?.points ?? 0
                          ) +
                          memberDrinks.length *
                            10;

                        return (
                          <div
                            className="member"
                            key={member.id}
                          >
                            <div className="avatar">
                              {p?.avatar_url ? (
                                <img
                                  src={
                                    p.avatar_url
                                  }
                                  alt=""
                                />
                              ) : (
                                "👤"
                              )}
                            </div>

                            <div className="memberText">
                              <strong>
                                {p?.name ||
                                  p?.username ||
                                  p?.email ||
                                  "Teilnehmer"}
                              </strong>
                              <small>
                                🍺{" "}
                                {
                                  memberDrinks.length
                                }{" "}
                                · 🏆 {points}
                              </small>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="quickGrid">
                  <button
                    className="quickButton beerQuick"
                    onClick={() =>
                      setActiveTab("beer")
                    }
                  >
                    <span>🍺</span>
                    <strong>Bier</strong>
                    <small>
                      Getränk zuordnen
                    </small>
                  </button>

                  <button
                    className="quickButton requestQuick"
                    onClick={() =>
                      setActiveTab("beer")
                    }
                  >
                    <span>🙋</span>
                    <strong>Bier holen</strong>
                    <small>
                      Anfrage senden
                    </small>
                  </button>

                  <button
                    className="quickButton crateQuick"
                    onClick={() =>
                      setActiveTab("beer")
                    }
                  >
                    <span>📦</span>
                    <strong>Kiste</strong>
                    <small>
                      Kiste spendieren
                    </small>
                  </button>

                  <button
                    className="quickButton rankingQuick"
                    onClick={() =>
                      setActiveTab("ranking")
                    }
                  >
                    <span>🏆</span>
                    <strong>Ranking</strong>
                    <small>
                      Punkte ansehen
                    </small>
                  </button>
                </section>
              </>
            )}

            {activeTab === "drinks" && (
              <>
                <section className="card">
                  <div className="sectionTitle">
                    <div>
                      <span className="sectionIcon">
                        ➕
                      </span>
                      <div>
                        <h3>Getränk hinzufügen</h3>
                        <small>
                          Neues Getränk erfassen
                        </small>
                      </div>
                    </div>
                  </div>

                  <input
                    className="input"
                    placeholder="Getränk, z. B. Krombacher"
                    value={drinkName}
                    onChange={(e) =>
                      setDrinkName(e.target.value)
                    }
                  />

                  <div className="formGrid">
                    <input
                      className="input"
                      placeholder="Marke"
                      value={drinkBrand}
                      onChange={(e) =>
                        setDrinkBrand(e.target.value)
                      }
                    />

                    <input
                      className="input"
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
                      className="input"
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
                      className="input"
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
                    className="primaryButton"
                    onClick={saveDrink}
                    disabled={busy}
                  >
                    🍻 Getränk speichern
                  </button>
                </section>

                <section className="card">
                  <div className="sectionTitle">
                    <div>
                      <span className="sectionIcon">
                        🔗
                      </span>
                      <div>
                        <h3>Getränk zuordnen</h3>
                        <small>
                          Teilnehmer + Getränk
                        </small>
                      </div>
                    </div>
                  </div>

                  <select
                    className="input"
                    value={selectedMember}
                    onChange={(e) =>
                      setSelectedMember(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      👤 Teilnehmer auswählen
                    </option>

                    {members.map((member) => (
                      <option
                        key={member.profile_id}
                        value={
                          member.profile_id
                        }
                      >
                        {memberName(
                          member.profile_id
                        )}
                      </option>
                    ))}
                  </select>

                  <select
                    className="input"
                    value={selectedDrink}
                    onChange={(e) =>
                      setSelectedDrink(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      🍺 Getränk auswählen
                    </option>

                    {drinks.map((drink) => (
                      <option
                        key={drink.id}
                        value={drink.id}
                      >
                        {drink.getraenk ||
                          drink.drink_name ||
                          "Getränk"}{" "}
                        ·{" "}
                        {Number(
                          drink.menge ??
                            drink.liters ??
                            0
                        ).toFixed(1)}{" "}
                        L
                      </option>
                    ))}
                  </select>

                  <button
                    className="goldButton full"
                    onClick={assignDrink}
                    disabled={busy}
                  >
                    🍺 Getränk zuordnen
                  </button>
                </section>

                <section className="card">
                  <div className="sectionTitle">
                    <div>
                      <span className="sectionIcon">
                        🍺
                      </span>
                      <div>
                        <h3>Getränke</h3>
                        <small>
                          {totalDrinks} insgesamt
                        </small>
                      </div>
                    </div>
                  </div>

                  {drinks.length === 0 ? (
                    <div className="emptySmall">
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

                          <div className="drinkMain">
                            <strong>
                              {drink.getraenk ||
                                drink.drink_name ||
                                "Getränk"}
                            </strong>

                            <small>
                              {drink.marke ||
                                drink.brand ||
                                "—"}{" "}
                              ·{" "}
                              {Number(
                                drink.menge ??
                                  drink.liters ??
                                  0
                              ).toFixed(1)}{" "}
                              L ·{" "}
                              {Number(
                                drink.alkohol ??
                                  drink.alcohol_percent ??
                                  0
                              ).toFixed(1)}
                              %
                            </small>

                            {drink.profile_id && (
                              <small className="assigned">
                                👤{" "}
                                {memberName(
                                  drink.profile_id
                                )}
                              </small>
                            )}
                          </div>

                          <strong className="price">
                            {money(
                              Number(
                                drink.preis ?? 0
                              )
                            )}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {activeTab === "beer" && (
              <>
                {(settings?.show_beer_requests ??
                  true) && (
                  <section className="beerHero">
                    <div className="beerHeroEmoji">
                      🍺
                    </div>
                    <div>
                      <h2>Bier holen</h2>
                      <p>
                        Sag der Runde Bescheid.
                      </p>
                    </div>
                  </section>
                )}

                <section className="card">
                  <h3>🙋 Bier-Anfrage</h3>

                  <input
                    className="input"
                    placeholder="z. B. 2 Pils bitte 🍺"
                    value={requestText}
                    onChange={(e) =>
                      setRequestText(
                        e.target.value
                      )
                    }
                  />

                  <button
                    className="primaryButton"
                    onClick={requestBeer}
                    disabled={busy}
                  >
                    🍺 Bier holen lassen
                  </button>
                </section>

                {(settings?.show_crate_button ??
                  true) && (
                  <section className="card">
                    <div className="sectionTitle">
                      <div>
                        <span className="sectionIcon">
                          📦
                        </span>
                        <div>
                          <h3>
                            Kiste spendieren
                          </h3>
                          <small>
                            +50 Punkte pro Kiste
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="formGrid">
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={crateCount}
                        onChange={(e) =>
                          setCrateCount(
                            e.target.value
                          )
                        }
                      />

                      <select
                        className="input"
                        value={crateMember}
                        onChange={(e) =>
                          setCrateMember(
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          Teilnehmer auswählen
                        </option>

                        {members.map((member) => (
                          <option
                            key={member.profile_id}
                            value={
                              member.profile_id
                            }
                          >
                            {memberName(
                              member.profile_id
                            )}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      className="goldButton full"
                      onClick={sponsorCrate}
                      disabled={busy}
                    >
                      🍻 Kiste spendieren
                    </button>
                  </section>
                )}

                <section className="card">
                  <div className="sectionTitle">
                    <div>
                      <span className="sectionIcon">
                        📣
                      </span>
                      <div>
                        <h3>
                          Bier-Anfragen
                        </h3>
                        <small>
                          Aktuelle Anfragen
                        </small>
                      </div>
                    </div>
                  </div>

                  {requests.length === 0 ? (
                    <div className="emptySmall">
                      Keine offenen Anfragen.
                    </div>
                  ) : (
                    <div className="requestList">
                      {requests.map(
                        (request) => (
                          <div
                            className="request"
                            key={request.id}
                          >
                            <span>
                              🍺
                            </span>

                            <div>
                              <strong>
                                {memberName(
                                  request.requester_profile_id
                                )}
                              </strong>
                              <small>
                                {request.message ||
                                  "Bier bitte!"}
                              </small>
                            </div>

                            <b
                              className={
                                request.status ===
                                "open"
                                  ? "open"
                                  : "done"
                              }
                            >
                              {request.status ===
                              "open"
                                ? "OFFEN"
                                : "✓"}
                            </b>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>
              </>
            )}

            {activeTab === "ranking" && (
              <section className="card">
                <div className="rankingHeader">
                  <span>🏆</span>
                  <div>
                    <h2>Ranking</h2>
                    <p>
                      Wer führt die Runde an?
                    </p>
                  </div>
                </div>

                <div className="rankingList">
                  {ranking.map(
                    (
                      row,
                      index
                    ) => (
                      <div
                        className={`rankRow ${
                          index < 3
                            ? "podium"
                            : ""
                        }`}
                        key={
                          row.member.id
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
                          {row.profile
                            ?.avatar_url ? (
                            <img
                              src={
                                row.profile
                                  .avatar_url
                              }
                              alt=""
                            />
                          ) : (
                            "👤"
                          )}
                        </div>

                        <div className="rankName">
                          <strong>
                            {row.profile
                              ?.name ||
                              row.profile
                                ?.username ||
                              row.profile
                                ?.email ||
                              "Teilnehmer"}
                          </strong>

                          <small>
                            🍺 {row.drinks}
                          </small>
                        </div>

                        <strong className="points">
                          {row.points}
                          <small>
                            Punkte
                          </small>
                        </strong>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {activeTab === "admin" &&
              isAdmin && (
                <>
                  <section className="card adminCard">
                    <div className="adminTitle">
                      <span>👑</span>
                      <div>
                        <h2>
                          Admin-Zentrale
                        </h2>
                        <p>
                          Vollzugriff auf alle
                          Events
                        </p>
                      </div>
                    </div>

                    <div className="adminStats">
                      <div>
                        <strong>
                          {events.length}
                        </strong>
                        <small>Events</small>
                      </div>

                      <div>
                        <strong>
                          {members.length}
                        </strong>
                        <small>
                          Teilnehmer
                        </small>
                      </div>

                      <div>
                        <strong>
                          {drinks.length}
                        </strong>
                        <small>
                          Getränke
                        </small>
                      </div>
                    </div>

                    <button
                      className="dangerButton"
                      onClick={deleteEvent}
                      disabled={busy}
                    >
                      🗑️ Aktuelles Event löschen
                    </button>
                  </section>

                  <section className="card">
                    <h3>
                      📅 Alle Events
                    </h3>

                    <div className="adminEventList">
                      {events.map(
                        (event) => (
                          <button
                            className={
                              event.id ===
                              eventId
                                ? "adminEvent selected"
                                : "adminEvent"
                            }
                            key={event.id}
                            onClick={() => {
                              setEventId(
                                event.id
                              );
                              setActiveTab(
                                "home"
                              );
                            }}
                          >
                            <span>
                              🍻
                            </span>

                            <div>
                              <strong>
                                {event.title}
                              </strong>

                              <small>
                                {event.location ||
                                  "Kein Ort"}
                              </small>
                            </div>

                            {event.id ===
                              eventId && (
                              <b>
                                ✓
                              </b>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </section>
                </>
              )}
          </>
        )}

        {message && (
          <div className="message">
            <span>
              {message.startsWith("❌")
                ? "⚠️"
                : "🍻"}
            </span>
            <div>{message}</div>
            <button
              onClick={() =>
                setMessage("")
              }
            >
              ×
            </button>
          </div>
        )}

        <footer>
          <div>🍻</div>
          <strong>
            Güstener Zapfhahn Zentrale
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

  .page {
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
    color: #f7f7f7;
    background:
      radial-gradient(
        circle at 20% 0%,
        rgba(245,158,11,.18),
        transparent 32%
      ),
      radial-gradient(
        circle at 90% 20%,
        rgba(251,191,36,.08),
        transparent 28%
      ),
      #07090d;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    position: relative;
  }

  .container {
    position: relative;
    z-index: 2;
    width: min(960px, calc(100% - 28px));
    margin: 0 auto;
    padding: 18px 0 40px;
  }

  .glow {
    position: fixed;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    opacity: .12;
  }

  .glow1 {
    background: #f59e0b;
    left: -120px;
    top: 30%;
  }

  .glow2 {
    background: #fbbf24;
    right: -120px;
    bottom: 10%;
  }

  button,
  input,
  select {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .logo {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    border-radius: 17px;
    background:
      linear-gradient(
        145deg,
        #fbbf24,
        #d97706
      );
    box-shadow:
      0 10px 35px rgba(245,158,11,.22);
    font-size: 29px;
  }

  .eyebrow {
    color: #fbbf24;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .22em;
  }

  h1 {
    margin: 0;
    font-size: 23px;
    letter-spacing: -.04em;
  }

  h1 span {
    color: #fbbf24;
    margin-left: 5px;
  }

  .headerActions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .adminBadge {
    padding: 8px 11px;
    border-radius: 999px;
    background: rgba(245,158,11,.12);
    border: 1px solid rgba(245,158,11,.25);
    color: #fbbf24;
    font-size: 10px;
    font-weight: 900;
  }

  .iconButton {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.045);
    color: white;
  }

  .hero {
    min-height: 180px;
    border-radius: 26px;
    padding: 26px;
    margin-bottom: 14px;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background:
      linear-gradient(
        135deg,
        rgba(245,158,11,.18),
        rgba(255,255,255,.035)
      );
    border: 1px solid rgba(245,158,11,.14);
  }

  .hero:after {
    content: "";
    position: absolute;
    width: 240px;
    height: 240px;
    right: -80px;
    top: -100px;
    border-radius: 50%;
    border: 1px solid rgba(251,191,36,.15);
    box-shadow:
      0 0 0 35px rgba(251,191,36,.025),
      0 0 0 70px rgba(251,191,36,.018);
  }

  .heroTag {
    color: #fbbf24;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .12em;
  }

  .hero h2 {
    font-size: clamp(28px, 6vw, 44px);
    margin: 8px 0 4px;
    letter-spacing: -.055em;
  }

  .hero p,
  .eventInfo p,
  .muted {
    color: #8993a2;
    margin: 0;
  }

  .floatingBeer {
    font-size: 85px;
    transform: rotate(8deg);
    animation: floatBeer 3.2s ease-in-out infinite;
    filter: drop-shadow(0 15px 25px rgba(0,0,0,.35));
    z-index: 1;
  }

  @keyframes floatBeer {
    0%, 100% {
      transform: rotate(8deg) translateY(0);
    }
    50% {
      transform: rotate(-5deg) translateY(-10px);
    }
  }

  .adminPanel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 14px;
    border-radius: 18px;
    background: linear-gradient(
      135deg,
      rgba(245,158,11,.13),
      rgba(255,255,255,.04)
    );
    border: 1px solid rgba(245,158,11,.22);
  }

  .adminPanel strong,
  .adminPanel small {
    display: block;
  }

  .adminPanel small {
    margin-top: 3px;
    color: #8c96a5;
    font-size: 12px;
  }

  .card {
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.065),
        rgba(255,255,255,.025)
      );
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 22px;
    padding: 19px;
    margin-bottom: 14px;
    box-shadow:
      0 15px 50px rgba(0,0,0,.16);
    backdrop-filter: blur(18px);
  }

  .eventCard {
    position: relative;
  }

  .sectionTitle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
  }

  .sectionTitle > div {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .sectionTitle h3 {
    margin: 0;
    font-size: 16px;
  }

  .sectionTitle small {
    display: block;
    color: #798392;
    margin-top: 2px;
  }

  .sectionIcon {
    width: 39px;
    height: 39px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(245,158,11,.1);
    font-size: 20px;
  }

  .activeDot {
    color: #86efac;
    font-size: 9px;
    font-weight: 900;
  }

  .bigSelect,
  .input {
    width: 100%;
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 14px;
    background: #10151c;
    color: white;
    outline: none;
  }

  .bigSelect {
    padding: 15px;
    font-weight: 700;
  }

  .input {
    padding: 13px 14px;
    margin-bottom: 9px;
  }

  .bigSelect:focus,
  .input:focus {
    border-color: rgba(251,191,36,.55);
    box-shadow:
      0 0 0 3px rgba(251,191,36,.08);
  }

  .eventInfo {
    margin-top: 12px;
    padding: 13px;
    border-radius: 15px;
    background: rgba(255,255,255,.035);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 9px;
  }

  .chips span {
    font-size: 11px;
    color: #b4bdc9;
    background: rgba(255,255,255,.05);
    border-radius: 999px;
    padding: 6px 9px;
  }

  .statsGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }

  .statCard {
    padding: 15px 10px;
    text-align: center;
    border-radius: 18px;
    background: rgba(255,255,255,.045);
    border: 1px solid rgba(255,255,255,.055);
  }

  .statCard span,
  .statCard strong,
  .statCard small {
    display: block;
  }

  .statCard span {
    font-size: 21px;
  }

  .statCard strong {
    margin: 5px 0 2px;
    font-size: 21px;
  }

  .statCard small {
    color: #7f8997;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .promilleCard {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
    padding: 18px;
    border-radius: 20px;
    background:
      linear-gradient(
        135deg,
        rgba(245,158,11,.16),
        rgba(255,255,255,.035)
      );
    border: 1px solid rgba(245,158,11,.18);
  }

  .promilleIcon {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: rgba(245,158,11,.12);
    font-size: 28px;
  }

  .promilleInfo {
    flex: 1;
  }

  .promilleInfo small,
  .promilleInfo strong {
    display: block;
  }

  .promilleInfo small {
    color: #8c96a5;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .13em;
  }

  .promilleInfo strong {
    margin-top: 3px;
    font-size: 28px;
    color: #fbbf24;
  }

  .promilleStatus {
    font-size: 30px;
  }

  .memberGrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .member {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px;
    border-radius: 15px;
    background: rgba(255,255,255,.035);
  }

  .avatar,
  .rankAvatar {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border-radius: 13px;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: #1b222c;
  }

  .avatar img,
  .rankAvatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .memberText {
    min-width: 0;
  }

  .memberText strong,
  .memberText small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .memberText small {
    color: #778292;
    margin-top: 3px;
  }

  .quickGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }

  .quickButton {
    text-align: left;
    padding: 16px;
    border-radius: 19px;
    color: white;
    border: 1px solid rgba(255,255,255,.07);
    transition:
      transform .18s ease,
      border-color .18s ease;
  }

  .quickButton:hover {
    transform: translateY(-3px);
    border-color: rgba(251,191,36,.35);
  }

  .quickButton span,
  .quickButton strong,
  .quickButton small {
    display: block;
  }

  .quickButton span {
    font-size: 27px;
    margin-bottom: 8px;
  }

  .quickButton strong {
    font-size: 14px;
  }

  .quickButton small {
    margin-top: 3px;
    color: #8a94a3;
    font-size: 10px;
  }

  .beerQuick {
    background:
      linear-gradient(
        145deg,
        rgba(245,158,11,.15),
        rgba(255,255,255,.03)
      );
  }

  .requestQuick {
    background:
      linear-gradient(
        145deg,
        rgba(59,130,246,.13),
        rgba(255,255,255,.03)
      );
  }

  .crateQuick {
    background:
      linear-gradient(
        145deg,
        rgba(34,197,94,.12),
        rgba(255,255,255,.03)
      );
  }

  .rankingQuick {
    background:
      linear-gradient(
        145deg,
        rgba(168,85,247,.12),
        rgba(255,255,255,.03)
      );
  }

  .tabs {
    position: sticky;
    bottom: 12px;
    z-index: 10;
    display: flex;
    gap: 7px;
    margin: 10px 0 14px;
    padding: 7px;
    border-radius: 18px;
    background: rgba(9,12,17,.88);
    border: 1px solid rgba(255,255,255,.08);
    backdrop-filter: blur(18px);
    box-shadow: 0 15px 40px rgba(0,0,0,.35);
  }

  .tabs button {
    flex: 1;
    height: 45px;
    border: 0;
    border-radius: 13px;
    color: #8c96a5;
    background: transparent;
    font-size: 21px;
  }

  .tabs button.active {
    color: #111;
    background: #fbbf24;
    box-shadow: 0 7px 20px rgba(245,158,11,.2);
  }

  .formGrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .primaryButton,
  .goldButton,
  .dangerButton {
    border: 0;
    border-radius: 14px;
    padding: 14px 17px;
    font-weight: 900;
  }

  .primaryButton {
    width: 100%;
    color: #17120a;
    background:
      linear-gradient(
        135deg,
        #fbbf24,
        #f59e0b
      );
  }

  .goldButton {
    color: #17120a;
    background: #fbbf24;
  }

  .goldButton.full {
    width: 100%;
  }

  .dangerButton {
    width: 100%;
    color: #fecaca;
    background: rgba(239,68,68,.12);
    border: 1px solid rgba(239,68,68,.2);
  }

  .drinkList,
  .requestList,
  .rankingList,
  .adminEventList {
    display: grid;
    gap: 8px;
  }

  .drinkRow {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 12px;
    border-radius: 15px;
    background: rgba(255,255,255,.035);
  }

  .drinkIcon {
    width: 43px;
    height: 43px;
    flex: 0 0 43px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: rgba(245,158,11,.1);
    font-size: 22px;
  }

  .drinkMain {
    min-width: 0;
    flex: 1;
  }

  .drinkMain strong,
  .drinkMain small {
    display: block;
  }

  .drinkMain strong {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .drinkMain small {
    color: #7e8998;
    margin-top: 3px;
  }

  .assigned {
    color: #fbbf24 !important;
  }

  .price {
    white-space: nowrap;
    color: #fbbf24;
  }

  .beerHero {
    display: flex;
    align-items: center;
    gap: 17px;
    padding: 24px;
    margin-bottom: 14px;
    border-radius: 23px;
    background:
      linear-gradient(
        135deg,
        rgba(245,158,11,.2),
        rgba(255,255,255,.035)
      );
    border: 1px solid rgba(245,158,11,.18);
  }

  .beerHeroEmoji {
    font-size: 62px;
    animation: floatBeer 2.8s ease-in-out infinite;
  }

  .beerHero h2 {
    margin: 0 0 4px;
  }

  .beerHero p {
    margin: 0;
    color: #8993a2;
  }

  .request {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 13px;
    border-radius: 15px;
    background: rgba(255,255,255,.035);
  }

  .request > span {
    font-size: 26px;
  }

  .request div {
    flex: 1;
  }

  .request strong,
  .request small {
    display: block;
  }

  .request small {
    margin-top: 3px;
    color: #828d9b;
  }

  .request b {
    font-size: 9px;
    padding: 6px 8px;
    border-radius: 999px;
  }

  .request b.open {
    color: #fbbf24;
    background: rgba(245,158,11,.1);
  }

  .request b.done {
    color: #86efac;
    background: rgba(34,197,94,.1);
  }

  .rankingHeader,
  .adminTitle {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 18px;
  }

  .rankingHeader > span,
  .adminTitle > span {
    font-size: 44px;
  }

  .rankingHeader h2,
  .adminTitle h2 {
    margin: 0;
  }

  .rankingHeader p,
  .adminTitle p {
    margin: 3px 0 0;
    color: #818b9a;
  }

  .rankRow {
    display: grid;
    grid-template-columns: 45px 43px 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 12px;
    border-radius: 16px;
    background: rgba(255,255,255,.035);
  }

  .rankRow.podium {
    background:
      linear-gradient(
        135deg,
        rgba(245,158,11,.12),
        rgba(255,255,255,.035)
      );
  }

  .rankNumber {
    text-align: center;
    font-weight: 900;
    font-size: 18px;
  }

  .rankName strong,
  .rankName small,
  .points,
  .points small {
    display: block;
  }

  .rankName small {
    color: #7e8998;
    margin-top: 3px;
  }

  .points {
    text-align: right;
    color: #fbbf24;
    font-size: 19px;
  }

  .points small {
    color: #7e8998;
    font-size: 8px;
    text-transform: uppercase;
  }

  .adminCard {
    border-color: rgba(245,158,11,.2);
  }

  .adminStats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 15px;
  }

  .adminStats div {
    text-align: center;
    padding: 15px;
    border-radius: 15px;
    background: rgba(255,255,255,.04);
  }

  .adminStats strong,
  .adminStats small {
    display: block;
  }

  .adminStats strong {
    font-size: 24px;
    color: #fbbf24;
  }

  .adminStats small {
    color: #7f8998;
  }

  .adminEvent {
    display: flex;
    align-items: center;
    gap: 11px;
    text-align: left;
    width: 100%;
    color: white;
    border: 1px solid rgba(255,255,255,.06);
    border-radius: 15px;
    padding: 12px;
    background: rgba(255,255,255,.035);
  }

  .adminEvent.selected {
    border-color: rgba(251,191,36,.4);
    background: rgba(245,158,11,.08);
  }

  .adminEvent > span {
    font-size: 24px;
  }

  .adminEvent div {
    flex: 1;
  }

  .adminEvent strong,
  .adminEvent small {
    display: block;
  }

  .adminEvent small {
    color: #7e8998;
    margin-top: 3px;
  }

  .adminEvent b {
    color: #86efac;
  }

  .message {
    position: fixed;
    z-index: 30;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    width: min(680px, calc(100% - 28px));
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 14px;
    border-radius: 15px;
    background: rgba(13,17,23,.94);
    border: 1px solid rgba(251,191,36,.22);
    box-shadow: 0 20px 60px rgba(0,0,0,.45);
    backdrop-filter: blur(18px);
    color: #f4f5f7;
  }

  .message div {
    flex: 1;
    font-size: 13px;
  }

  .message button {
    border: 0;
    background: transparent;
    color: #7f8998;
    font-size: 20px;
  }

  .empty {
    text-align: center;
    padding: 50px 20px;
  }

  .empty > div {
    font-size: 50px;
    animation: floatBeer 2.8s ease-in-out infinite;
  }

  .empty h3 {
    margin-bottom: 5px;
  }

  .empty p,
  .emptySmall {
    color: #7f8998;
  }

  .emptySmall {
    padding: 20px;
    text-align: center;
  }

  .loginCard,
  .loading {
    min-height: 100vh;
    display: grid;
    place-content: center;
    text-align: center;
    padding: 30px;
  }

  .loginCard {
    width: min(500px, calc(100% - 30px));
    min-height: auto;
    margin: 20vh auto 0;
    padding: 45px 25px;
    border-radius: 26px;
    background: rgba(255,255,255,.045);
    border: 1px solid rgba(255,255,255,.07);
  }

  .bigBeer {
    font-size: 70px;
    animation: floatBeer 2.8s ease-in-out infinite;
  }

  .loginCard h1 {
    margin-top: 12px;
  }

  .loading .beerAnimation {
    font-size: 60px;
    animation: floatBeer 1.4s ease-in-out infinite;
  }

  footer {
    text-align: center;
    padding: 25px 0 10px;
    color: #56606e;
  }

  footer div {
    font-size: 25px;
  }

  footer strong,
  footer small {
    display: block;
  }

  footer strong {
    margin-top: 5px;
    color: #707b89;
  }

  footer small {
    margin-top: 4px;
  }

  @media (max-width: 700px) {
    .container {
      width: min(100% - 20px, 960px);
    }

    .header {
      margin-bottom: 14px;
    }

    .adminBadge {
      display: none;
    }

    .hero {
      min-height: 165px;
      padding: 21px;
    }

    .floatingBeer {
      font-size: 65px;
    }

    .statsGrid {
      grid-template-columns: repeat(2, 1fr);
    }

    .quickGrid {
      grid-template-columns: repeat(2, 1fr);
    }

    .memberGrid {
      grid-template-columns: 1fr;
    }

    .formGrid {
      grid-template-columns: 1fr;
    }

    .rankRow {
      grid-template-columns: 38px 40px 1fr auto;
    }
  }

  @media (max-width: 430px) {
    .logo {
      width: 47px;
      height: 47px;
      border-radius: 14px;
      font-size: 24px;
    }

    h1 {
      font-size: 19px;
    }

    .hero h2 {
      font-size: 29px;
    }

    .hero p {
      font-size: 13px;
    }

    .floatingBeer {
      font-size: 55px;
      opacity: .75;
    }

    .card {
      padding: 15px;
      border-radius: 19px;
    }

    .statCard strong {
      font-size: 19px;
    }

    .quickButton {
      padding: 13px;
    }

    .quickButton span {
      font-size: 23px;
    }
  }
`;
