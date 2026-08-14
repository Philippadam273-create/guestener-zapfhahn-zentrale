"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type User = {
  id: string;
  email?: string;
};

type Profile = {
  id: string;
  user_id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  role: string | null;
  points: number | null;
  drinks_count: number | null;
  is_global_admin: boolean | null;
  avatar_url: string | null;
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
  created_at: string;
  created_by: string | null;
  created_by_profile_id: string | null;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at: string;
  role: string | null;
  joined_via_code: string | null;
  profile?: Profile | null;
};

type Drink = {
  id: string;
  event_id: string;
  profile_id: string | null;
  drink_name: string | null;
  getraenk: string | null;
  marke: string | null;
  brand: string | null;
  liters: number | null;
  menge: number | null;
  alcohol_percent: number | null;
  alkohol: number | null;
  preis: number | null;
  quantity: number | null;
  created_at: string;
};

type EventSettings = {
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

const defaultSettings: EventSettings = {
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [settings, setSettings] =
    useState<EventSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showLogin, setShowLogin] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showJoinEvent, setShowJoinEvent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const [inviteCode, setInviteCode] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  const isGlobalAdmin = Boolean(profile?.is_global_admin);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const isEventAdmin =
    isGlobalAdmin ||
    Boolean(
      members.find(
        (member) =>
          member.profile_id === profile?.id &&
          member.role === "admin"
      )
    );

  function clearMessages() {
    setMessage("");
    setError("");
  }

  async function loadProfile(currentUser: User) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        user_id,
        name,
        username,
        email,
        role,
        points,
        drinks_count,
        is_global_admin,
        avatar_url
        `
      )
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setError("Profil konnte nicht geladen werden.");
      return null;
    }

    if (!data) {
      setError(
        "Dein Benutzerkonto ist vorhanden, aber noch kein Profil."
      );
      return null;
    }

    setProfile(data as Profile);
    return data as Profile;
  }

  async function loadEvents(currentProfile?: Profile | null) {
    if (!currentProfile && !profile) return;

    setError("");

    const globalAdmin =
      Boolean(currentProfile?.is_global_admin) ||
      Boolean(profile?.is_global_admin);

    let query = supabase
      .from("events")
      .select(
        `
        id,
        title,
        description,
        location,
        image,
        invite_code,
        start_date,
        end_date,
        is_active,
        created_at,
        created_by,
        created_by_profile_id
        `
      )
      .order("created_at", { ascending: false });

    /*
      Global Admin:
      darf alle Events sehen.

      Normaler Benutzer:
      sieht Events, bei denen er Mitglied ist.
    */

    if (!globalAdmin) {
      const currentProfileId =
        currentProfile?.id ?? profile?.id;

      if (!currentProfileId) return;

      const { data: memberships, error: membershipError } =
        await supabase
          .from("event_members")
          .select("event_id")
          .eq("profile_id", currentProfileId);

      if (membershipError) {
        setError(
          "Events konnten nicht geladen werden: " +
            membershipError.message
        );
        return;
      }

      const ids = (memberships ?? []).map(
        (item) => item.event_id
      );

      if (ids.length === 0) {
        setEvents([]);
        setSelectedEventId("");
        return;
      }

      query = query.in("id", ids);
    }

    const { data, error: eventsError } = await query;

    if (eventsError) {
      setError(
        "Events konnten nicht geladen werden: " +
          eventsError.message
      );
      return;
    }

    const loadedEvents = (data ?? []) as Event[];

    setEvents(loadedEvents);

    if (
      loadedEvents.length > 0 &&
      !loadedEvents.some(
        (event) => event.id === selectedEventId
      )
    ) {
      setSelectedEventId(loadedEvents[0].id);
    }

    if (loadedEvents.length === 0) {
      setSelectedEventId("");
    }
  }

  async function loadEventData(eventId: string) {
    if (!eventId) return;

    setLoadingEvent(true);
    setError("");

    try {
      const [
        membersResult,
        drinksResult,
        settingsResult,
      ] = await Promise.all([
        supabase
          .from("event_members")
          .select(
            `
            id,
            event_id,
            profile_id,
            joined_at,
            role,
            joined_via_code
            `
          )
          .eq("event_id", eventId)
          .order("joined_at", {
            ascending: true,
          }),

        supabase
          .from("drinks")
          .select(
            `
            id,
            event_id,
            profile_id,
            drink_name,
            getraenk,
            marke,
            brand,
            liters,
            menge,
            alcohol_percent,
            alkohol,
            preis,
            quantity,
            created_at
            `
          )
          .eq("event_id", eventId)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("event_settings")
          .select("*")
          .eq("event_id", eventId)
          .maybeSingle(),
      ]);

      if (membersResult.error) {
        throw new Error(
          "Teilnehmer konnten nicht geladen werden: " +
            membersResult.error.message
        );
      }

      if (drinksResult.error) {
        throw new Error(
          "Getränke konnten nicht geladen werden: " +
            drinksResult.error.message
        );
      }

      if (settingsResult.error) {
        throw new Error(
          "Event-Einstellungen konnten nicht geladen werden: " +
            settingsResult.error.message
        );
      }

      const rawMembers = membersResult.data ?? [];

      /*
        Wichtig:
        Wir laden Profile separat.

        Dadurch vermeiden wir die bisherigen Probleme
        mit verschachtelten Supabase-Beziehungen und
        TypeScript-Fehlern.
      */

      const profileIds = [
        ...new Set(
          rawMembers
            .map((member) => member.profile_id)
            .filter(Boolean)
        ),
      ];

      let profileMap = new Map<string, Profile>();

      if (profileIds.length > 0) {
        const { data: profilesData, error: profilesError } =
          await supabase
            .from("profiles")
            .select(
              `
              id,
              user_id,
              name,
              username,
              email,
              role,
              points,
              drinks_count,
              is_global_admin,
              avatar_url
              `
            )
            .in("id", profileIds);

        if (profilesError) {
          console.warn(
            "Profile konnten nicht geladen werden:",
            profilesError.message
          );
        } else {
          profileMap = new Map(
            (profilesData ?? []).map((item) => [
              item.id,
              item as Profile,
            ])
          );
        }
      }

      const preparedMembers: EventMember[] =
        rawMembers.map((member) => ({
          id: member.id,
          event_id: member.event_id,
          profile_id: member.profile_id,
          joined_at: member.joined_at,
          role: member.role,
          joined_via_code: member.joined_via_code,
          profile:
            profileMap.get(member.profile_id) ?? null,
        }));

      setMembers(preparedMembers);
      setDrinks((drinksResult.data ?? []) as Drink[]);

      if (settingsResult.data) {
        setSettings({
          ...defaultSettings,
          ...(settingsResult.data as Partial<EventSettings>),
        });
      } else {
        setSettings({
          ...defaultSettings,
          event_id: eventId,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Event konnte nicht geladen werden."
      );
    } finally {
      setLoadingEvent(false);
    }
  }

  async function initialize() {
    setLoading(true);
    clearMessages();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setEvents([]);
      setLoading(false);
      return;
    }

    setUser({
      id: currentUser.id,
      email: currentUser.email,
    });

    const loadedProfile = await loadProfile({
      id: currentUser.id,
      email: currentUser.email,
    });

    if (loadedProfile) {
      await loadEvents(loadedProfile);
    }

    setLoading(false);
  }

  useEffect(() => {
    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const currentUser = {
            id: session.user.id,
            email: session.user.email,
          };

          setUser(currentUser);

          const loadedProfile =
            await loadProfile(currentUser);

          if (loadedProfile) {
            await loadEvents(loadedProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
          setEvents([]);
          setSelectedEventId("");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventData(selectedEventId);
    }
  }, [selectedEventId]);

  async function login() {
    clearMessages();

    if (!email.trim() || !password) {
      setError("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("✅ Erfolgreich angemeldet.");
    setShowLogin(false);
    setPassword("");
  }

  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setEvents([]);
    setSelectedEventId("");

    setMessage("Du wurdest abgemeldet.");
  }

  async function createEvent() {
    clearMessages();

    if (!eventTitle.trim()) {
      setError("Bitte einen Eventnamen eingeben.");
      return;
    }

    if (!user) {
      setError("Bitte zuerst anmelden.");
      return;
    }

    /*
      Wir erstellen das Event direkt.
      Dadurch sind wir unabhängig von alten RPC-Versionen.
    */

    const code =
      Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();

    const { data: createdEvent, error: eventError } =
      await supabase
        .from("events")
        .insert({
          title: eventTitle.trim(),
          description:
            eventDescription.trim() || null,
          location:
            eventLocation.trim() || null,
          invite_code: code,
          is_active: true,
          created_by: user.id,
          created_by_profile_id:
            profile?.id ?? null,
        })
        .select("*")
        .single();

    if (eventError) {
      setError(
        "Event konnte nicht erstellt werden: " +
          eventError.message
      );
      return;
    }

    /*
      Ersteller als Admin eintragen.
    */

    if (profile?.id) {
      const { error: memberError } =
        await supabase.from("event_members").insert({
          event_id: createdEvent.id,
          profile_id: profile.id,
          role: "admin",
        });

      if (memberError) {
        console.warn(
          "Event wurde erstellt, aber Admin-Mitglied konnte nicht angelegt werden:",
          memberError.message
        );
      }
    }

    /*
      Standard-Einstellungen.
    */

    const { error: settingsError } =
      await supabase.from("event_settings").insert({
        event_id: createdEvent.id,
        ...defaultSettings,
      });

    if (settingsError) {
      console.warn(
        "Event-Einstellungen konnten nicht angelegt werden:",
        settingsError.message
      );
    }

    setMessage(
      `✅ Event erstellt! Einladungscode: ${code}`
    );

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");

    setShowCreateEvent(false);

    await loadEvents(profile);
    setSelectedEventId(createdEvent.id);
  }

  async function joinEvent() {
    clearMessages();

    if (!inviteCode.trim()) {
      setError("Bitte Einladungscode eingeben.");
      return;
    }

    if (!profile?.id) {
      setError("Profil nicht gefunden.");
      return;
    }

    const normalizedCode =
      inviteCode.trim().toUpperCase();

    const { data: event, error: eventError } =
      await supabase
        .from("events")
        .select("id,title")
        .eq("invite_code", normalizedCode)
        .eq("is_active", true)
        .maybeSingle();

    if (eventError) {
      setError(eventError.message);
      return;
    }

    if (!event) {
      setError("Einladungscode nicht gefunden.");
      return;
    }

    const { error: memberError } =
      await supabase.from("event_members").upsert(
        {
          event_id: event.id,
          profile_id: profile.id,
          role: "member",
          joined_via_code: normalizedCode,
        },
        {
          onConflict: "event_id,profile_id",
        }
      );

    if (memberError) {
      setError(
        "Event konnte nicht beigetreten werden: " +
          memberError.message
      );
      return;
    }

    setMessage(
      `✅ Du bist dem Event „${event.title}“ beigetreten.`
    );

    setInviteCode("");
    setShowJoinEvent(false);

    await loadEvents(profile);
    setSelectedEventId(event.id);
  }

  async function addDrink() {
    clearMessages();

    if (!selectedEventId) {
      setError("Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      setError("Bitte Getränkenamen eingeben.");
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .insert({
        event_id: selectedEventId,
        profile_id: profile?.id ?? null,
        drink_name: drinkName.trim(),
        getraenk: drinkName.trim(),
        liters: Number(drinkLiters) || 0,
        menge: Number(drinkLiters) || 0,
        alcohol_percent:
          Number(drinkAlcohol) || 0,
        alkohol: Number(drinkAlcohol) || 0,
        preis: Number(drinkPrice) || 0,
        quantity: 1,
      });

    if (error) {
      setError(
        "Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setMessage("🍺 Getränk gespeichert.");

    setDrinkName("");
    setDrinkLiters("0.5");
    setDrinkAlcohol("5");
    setDrinkPrice("0");

    await loadEventData(selectedEventId);
  }

  async function saveSettings() {
    if (!selectedEventId) return;

    clearMessages();

    const payload = {
      ...settings,
      event_id: selectedEventId,
    };

    delete (payload as Partial<EventSettings>).event_id;

    const { error } = await supabase
      .from("event_settings")
      .upsert(
        {
          event_id: selectedEventId,
          ...payload,
        },
        {
          onConflict: "event_id",
        }
      );

    if (error) {
      setError(
        "Einstellungen konnten nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setMessage("✅ Event-Einstellungen gespeichert.");
    setShowSettings(false);
  }

  async function deleteEvent() {
    if (!selectedEventId || !isEventAdmin) return;

    const confirmed = window.confirm(
      "Dieses Event wirklich löschen?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", selectedEventId);

    if (error) {
      setError(
        "Event konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    setMessage("🗑️ Event gelöscht.");
    setSelectedEventId("");

    await loadEvents(profile);
  }

  const totalLiters = drinks.reduce(
    (sum, drink) =>
      sum +
      Number(drink.liters ?? drink.menge ?? 0),
    0
  );

  const totalCost = drinks.reduce(
    (sum, drink) =>
      sum + Number(drink.preis ?? 0),
    0
  );

  const totalPoints = members.reduce(
    (sum, member) =>
      sum + Number(member.profile?.points ?? 0),
    0
  );

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          <div className="bigLogo">🍻</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>Daten werden geladen...</p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">

        <header className="header">
          <div className="logo">🍻</div>

          <div className="headerText">
            <h1>Güstener Zapfhahn Zentrale</h1>
            <p>
              Events · Getränke · Rankings · Challenges
            </p>
          </div>

          {user ? (
            <button
              className="logoutButton"
              onClick={logout}
            >
              Abmelden
            </button>
          ) : (
            <button
              className="primaryButton"
              onClick={() => setShowLogin(true)}
            >
              🔐 Anmelden
            </button>
          )}
        </header>

        {!user && (
          <section className="welcome card">
            <div className="welcomeIcon">🍻</div>

            <h2>Willkommen!</h2>

            <p>
              Melde dich an, um Events zu erstellen,
              Einladungscodes zu verwenden und an
              Veranstaltungen teilzunehmen.
            </p>

            <button
              className="primaryButton large"
              onClick={() => setShowLogin(true)}
            >
              🔐 Jetzt anmelden
            </button>
          </section>
        )}

        {user && profile && (
          <>
            <section className="profileBar">
              <div className="profileAvatar">
                {profile.name?.charAt(0) ||
                  profile.username?.charAt(0) ||
                  "P"}
              </div>

              <div>
                <strong>
                  {profile.name ||
                    profile.username ||
                    "Philipp"}
                </strong>

                <small>
                  {profile.email || user.email}
                </small>
              </div>

              {isGlobalAdmin && (
                <span className="adminBadge">
                  👑 GLOBAL ADMIN
                </span>
              )}
            </section>

            <section className="card">
              <div className="sectionHeader">
                <div>
                  <h2>📅 Meine Events</h2>
                  <p>
                    {isGlobalAdmin
                      ? "Du hast als Global Admin Zugriff auf alle Events."
                      : "Hier findest du deine Events."}
                  </p>
                </div>

                <div className="headerActions">
                  <button
                    className="secondaryButton"
                    onClick={() =>
                      setShowJoinEvent(true)
                    }
                  >
                    🔗 Beitreten
                  </button>

                  <button
                    className="primaryButton"
                    onClick={() =>
                      setShowCreateEvent(true)
                    }
                  >
                    ➕ Event erstellen
                  </button>
                </div>
              </div>

              {events.length === 0 ? (
                <div className="empty">
                  <div>🍻</div>
                  <h3>Noch keine Events</h3>
                  <p>
                    Erstelle dein erstes Event oder
                    tritt einem Event mit Einladungscode
                    bei.
                  </p>
                </div>
              ) : (
                <div className="eventGrid">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      className={
                        selectedEventId === event.id
                          ? "eventCard active"
                          : "eventCard"
                      }
                      onClick={() =>
                        setSelectedEventId(event.id)
                      }
                    >
                      <div className="eventIcon">
                        🍻
                      </div>

                      <div className="eventInfo">
                        <strong>{event.title}</strong>

                        {event.location && (
                          <small>
                            📍 {event.location}
                          </small>
                        )}

                        {event.start_date && (
                          <small>
                            📅{" "}
                            {new Date(
                              event.start_date
                            ).toLocaleDateString(
                              "de-DE"
                            )}
                          </small>
                        )}
                      </div>

                      {event.invite_code && (
                        <span className="miniCode">
                          {event.invite_code}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {selectedEvent && (
              <>
                <section className="heroEvent card">
                  <div>
                    <span className="eyebrow">
                      AKTUELLES EVENT
                    </span>

                    <h2>
                      {selectedEvent.title}
                    </h2>

                    {selectedEvent.description && (
                      <p>
                        {selectedEvent.description}
                      </p>
                    )}

                    {selectedEvent.location && (
                      <p>
                        📍 {selectedEvent.location}
                      </p>
                    )}

                    {selectedEvent.invite_code && (
                      <div className="inviteBox">
                        <span>
                          Einladungscode
                        </span>

                        <strong>
                          {selectedEvent.invite_code}
                        </strong>

                        <button
                          onClick={() =>
                            navigator.clipboard?.writeText(
                              selectedEvent.invite_code ??
                                ""
                            )
                          }
                        >
                          📋 Kopieren
                        </button>
                      </div>
                    )}
                  </div>

                  {isEventAdmin && (
                    <div className="eventAdminActions">
                      <button
                        className="secondaryButton"
                        onClick={() =>
                          setShowSettings(true)
                        }
                      >
                        ⚙️ Event-Einstellungen
                      </button>

                      <button
                        className="dangerButton"
                        onClick={deleteEvent}
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  )}
                </section>

                <section className="stats">
                  {settings.show_drinks && (
                    <div className="stat">
                      <span>🍺</span>
                      <strong>
                        {drinks.length}
                      </strong>
                      <small>Getränke</small>
                    </div>
                  )}

                  {settings.show_statistics && (
                    <div className="stat">
                      <span>💧</span>
                      <strong>
                        {totalLiters.toFixed(1)}
                      </strong>
                      <small>Liter</small>
                    </div>
                  )}

                  {settings.show_costs && (
                    <div className="stat">
                      <span>💶</span>
                      <strong>
                        {totalCost.toFixed(2)} €
                      </strong>
                      <small>Kosten</small>
                    </div>
                  )}

                  {settings.show_participants && (
                    <div className="stat">
                      <span>👥</span>
                      <strong>
                        {members.length}
                      </strong>
                      <small>Teilnehmer</small>
                    </div>
                  )}
                </section>

                {settings.show_participants && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>👥 Teilnehmer</h2>
                        <p>
                          Teilnehmer dieses Events
                        </p>
                      </div>
                    </div>

                    <div className="memberList">
                      {members.length === 0 ? (
                        <p className="muted">
                          Noch keine Teilnehmer.
                        </p>
                      ) : (
                        members.map((member) => (
                          <div
                            className="member"
                            key={member.id}
                          >
                            <div className="memberAvatar">
                              {member.profile?.name?.charAt(
                                0
                              ) || "👤"}
                            </div>

                            <div className="memberInfo">
                              <strong>
                                {member.profile?.name ||
                                  member.profile
                                    ?.username ||
                                  "Teilnehmer"}
                              </strong>

                              <small>
                                {member.role ===
                                "admin"
                                  ? "👑 Event Admin"
                                  : "Teilnehmer"}
                              </small>
                            </div>

                            {settings.show_points && (
                              <strong className="points">
                                🏆{" "}
                                {member.profile
                                  ?.points ?? 0}
                              </strong>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                )}

                {settings.show_drinks && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>🍺 Getränke</h2>
                        <p>
                          Getränke dieses Events
                        </p>
                      </div>
                    </div>

                    {isEventAdmin && (
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

                        <button
                          className="primaryButton"
                          onClick={addDrink}
                        >
                          🍻 Getränk hinzufügen
                        </button>
                      </div>
                    )}

                    <div className="drinkList">
                      {drinks.length === 0 ? (
                        <p className="muted">
                          Noch keine Getränke.
                        </p>
                      ) : (
                        drinks.map((drink) => (
                          <div
                            className="drink"
                            key={drink.id}
                          >
                            <div className="drinkIcon">
                              🍺
                            </div>

                            <div className="drinkInfo">
                              <strong>
                                {drink.drink_name ||
                                  drink.getraenk ||
                                  drink.marke ||
                                  drink.brand ||
                                  "Getränk"}
                              </strong>

                              <small>
                                {Number(
                                  drink.liters ??
                                    drink.menge ??
                                    0
                                ).toFixed(1)}{" "}
                                L ·{" "}
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
                        ))
                      )}
                    </div>
                  </section>
                )}

                {settings.show_ranking && (
                  <section className="card">
                    <div className="sectionHeader">
                      <div>
                        <h2>🏆 Ranking</h2>
                        <p>
                          Punktestand des Events
                        </p>
                      </div>
                    </div>

                    {members.length === 0 ? (
                      <p className="muted">
                        Noch keine Teilnehmer.
                      </p>
                    ) : (
                      <div className="ranking">
                        {[...members]
                          .sort(
                            (a, b) =>
                              Number(
                                b.profile?.points ?? 0
                              ) -
                              Number(
                                a.profile?.points ?? 0
                              )
                          )
                          .map(
                            (member, index) => (
                              <div
                                className="rankingRow"
                                key={member.id}
                              >
                                <span className="rank">
                                  {index === 0
                                    ? "🥇"
                                    : index === 1
                                    ? "🥈"
                                    : index === 2
                                    ? "🥉"
                                    : `${index + 1}.`}
                                </span>

                                <span>
                                  {member.profile
                                    ?.name ||
                                    member.profile
                                      ?.username ||
                                    "Teilnehmer"}
                                </span>

                                {settings.show_points && (
                                  <strong>
                                    {member.profile
                                      ?.points ?? 0}{" "}
                                    Punkte
                                  </strong>
                                )}
                              </div>
                            )
                          )}
                      </div>
                    )}
                  </section>
                )}

                {settings.show_challenges && (
                  <section className="card featureCard">
                    <div className="featureIcon">
                      🎯
                    </div>

                    <div>
                      <h2>Challenges</h2>
                      <p>
                        Event-Challenges können hier
                        verwaltet werden.
                      </p>
                    </div>

                    <span className="coming">
                      BEREIT
                    </span>
                  </section>
                )}

                {settings.show_beer_button && (
                  <section className="card featureCard">
                    <div className="featureIcon">
                      🍺
                    </div>

                    <div>
                      <h2>Bier-Button</h2>
                      <p>
                        Schnell eine Runde Bier
                        anfordern.
                      </p>
                    </div>

                    <button className="primaryButton">
                      🍺 Runde
                    </button>
                  </section>
                )}

                {settings.show_crate_button && (
                  <section className="card featureCard">
                    <div className="featureIcon">
                      📦
                    </div>

                    <div>
                      <h2>Bierkiste</h2>
                      <p>
                        Bierkisten sponsern und Punkte
                        sammeln.
                      </p>
                    </div>

                    <button className="secondaryButton">
                      📦 Kiste
                    </button>
                  </section>
                )}

                {settings.show_payments && (
                  <section className="card">
                    <h2>💶 Zahlungen</h2>

                    <div className="costBig">
                      {totalCost.toFixed(2)} €
                    </div>

                    {settings.show_who_paid && (
                      <div className="infoRow">
                        <span>
                          💳 Zahlungen
                        </span>

                        <strong>
                          {totalCost.toFixed(2)} €
                        </strong>
                      </div>
                    )}

                    {settings.show_who_owes && (
                      <div className="infoRow">
                        <span>
                          👥 Teilnehmer
                        </span>

                        <strong>
                          {members.length}
                        </strong>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </>
        )}

        {message && (
          <div className="message success">
            {message}
          </div>
        )}

        {error && (
          <div className="message error">
            ❌ {error}
          </div>
        )}

        <footer>
          🍻 Güstener Zapfhahn Zentrale
          <small>
            Dein Event. Deine Getränke. Deine Runde.
          </small>
        </footer>
      </div>

      {showLogin && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="close"
              onClick={() => setShowLogin(false)}
            >
              ×
            </button>

            <div className="modalIcon">🔐</div>

            <h2>Anmelden</h2>

            <p>
              Melde dich mit deinem Supabase-Konto an.
            </p>

            <input
              type="email"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              className="primaryButton large full"
              onClick={login}
            >
              🔐 Anmelden
            </button>
          </div>
        </div>
      )}

      {showCreateEvent && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="close"
              onClick={() =>
                setShowCreateEvent(false)
              }
            >
              ×
            </button>

            <div className="modalIcon">🍻</div>

            <h2>Event erstellen</h2>

            <p>
              Nach dem Erstellen erhältst du
              automatisch einen Einladungscode.
            </p>

            <input
              placeholder="Eventname *"
              value={eventTitle}
              onChange={(e) =>
                setEventTitle(e.target.value)
              }
            />

            <input
              placeholder="Ort"
              value={eventLocation}
              onChange={(e) =>
                setEventLocation(e.target.value)
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

            <button
              className="primaryButton large full"
              onClick={createEvent}
            >
              🍻 Event erstellen
            </button>
          </div>
        </div>
      )}

      {showJoinEvent && (
        <div className="modalBackdrop">
          <div className="modal">
            <button
              className="close"
              onClick={() =>
                setShowJoinEvent(false)
              }
            >
              ×
            </button>

            <div className="modalIcon">🔗</div>

            <h2>Event beitreten</h2>

            <p>
              Gib den Einladungscode des Events ein.
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
              className="primaryButton large full"
              onClick={joinEvent}
            >
              🔗 Event beitreten
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="modalBackdrop">
          <div className="settingsModal">
            <button
              className="close"
              onClick={() =>
                setShowSettings(false)
              }
            >
              ×
            </button>

            <h2>⚙️ Event-Einstellungen</h2>

            <p>
              Als Event-Admin bestimmst du hier,
              welche Bereiche die Teilnehmer sehen.
            </p>

            <div className="settingsGrid">
              {(
                [
                  [
                    "show_participants",
                    "👥 Teilnehmer",
                  ],
                  [
                    "show_drinks",
                    "🍺 Getränke",
                  ],
                  [
                    "show_drink_history",
                    "📜 Getränkeverlauf",
                  ],
                  [
                    "show_payments",
                    "💳 Zahlungen",
                  ],
                  [
                    "show_costs",
                    "💶 Kosten",
                  ],
                  [
                    "show_ranking",
                    "🏆 Ranking",
                  ],
                  [
                    "show_points",
                    "⭐ Punkte",
                  ],
                  [
                    "show_promille",
                    "🍷 Promille",
                  ],
                  [
                    "show_statistics",
                    "📊 Statistiken",
                  ],
                  [
                    "show_challenges",
                    "🎯 Challenges",
                  ],
                  [
                    "show_challenge_points",
                    "🎯 Challenge-Punkte",
                  ],
                  [
                    "show_beer_button",
                    "🍺 Bier-Button",
                  ],
                  [
                    "show_beer_requests",
                    "🔔 Bier-Anfragen",
                  ],
                  [
                    "show_crate_button",
                    "📦 Kisten-Button",
                  ],
                  [
                    "show_profiles",
                    "👤 Profile",
                  ],
                  [
                    "show_photos",
                    "📸 Fotos",
                  ],
                  [
                    "show_who_paid",
                    "💳 Wer bezahlt hat",
                  ],
                  [
                    "show_who_owes",
                    "💰 Wer etwas schuldet",
                  ],
                ] as [
                  keyof EventSettings,
                  string
                ][]
              ).map(([key, label]) => (
                <label
                  className="setting"
                  key={key}
                >
                  <span>{label}</span>

                  <input
                    type="checkbox"
                    checked={Boolean(
                      settings[key]
                    )}
                    onChange={(e) =>
                      setSettings((old) => ({
                        ...old,
                        [key]:
                          e.target.checked,
                      }))
                    }
                  />

                  <span className="switch" />
                </label>
              ))}
            </div>

            <button
              className="primaryButton large full"
              onClick={saveSettings}
            >
              💾 Einstellungen speichern
            </button>
          </div>
        </div>
      )}

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
    background:
      radial-gradient(
        circle at top,
        #25384b 0%,
        #0b1017 48%,
        #06090d 100%
      );
    color: #fff;
    font-family:
      Inter,
      Arial,
      Helvetica,
      sans-serif;
    padding: 20px;
  }

  .container {
    max-width: 1050px;
    margin: 0 auto;
  }

  .loading {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .bigLogo {
    font-size: 70px;
    margin-bottom: 15px;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 10px 0 25px;
  }

  .logo {
    font-size: 36px;
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 18px;
    padding: 12px;
  }

  .headerText {
    flex: 1;
  }

  h1 {
    font-size: 25px;
    margin: 0;
  }

  h2 {
    margin: 0 0 6px;
    font-size: 21px;
  }

  h3 {
    margin: 8px 0;
  }

  p {
    color: #9da9b6;
    line-height: 1.5;
  }

  small {
    color: #8f9cab;
  }

  .card {
    background: rgba(255,255,255,.055);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 22px;
    padding: 20px;
    margin-bottom: 15px;
    backdrop-filter: blur(15px);
  }

  .profileBar {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 18px;
    padding: 12px 15px;
    margin-bottom: 15px;
  }

  .profileBar small {
    display: block;
    margin-top: 3px;
  }

  .profileAvatar,
  .memberAvatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f59e0b;
    color: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
  }

  .adminBadge {
    margin-left: auto;
    background: rgba(245,158,11,.15);
    color: #fbbf24;
    border: 1px solid rgba(245,158,11,.3);
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
  }

  .card.welcome {
    text-align: center;
    padding: 45px 20px;
  }

  .welcomeIcon {
    font-size: 55px;
  }

  .sectionHeader {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    align-items: center;
    margin-bottom: 15px;
  }

  .headerActions,
  .eventAdminActions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  button {
    border: none;
    cursor: pointer;
    border-radius: 12px;
    padding: 11px 15px;
    font-weight: 800;
    transition: .15s ease;
  }

  button:hover {
    transform: translateY(-1px);
  }

  .primaryButton {
    background: #f59e0b;
    color: #111;
  }

  .secondaryButton {
    background: #26313d;
    color: white;
    border: 1px solid #3b4856;
  }

  .dangerButton {
    background: #7f1d1d;
    color: white;
  }

  .logoutButton {
    background: #202a35;
    color: #fff;
    border: 1px solid #34404d;
  }

  .large {
    padding: 14px 20px;
  }

  .full {
    width: 100%;
  }

  .eventGrid {
    display: grid;
    grid-template-columns:
      repeat(auto-fill,minmax(280px,1fr));
    gap: 10px;
  }

  .eventCard {
    text-align: left;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    background: rgba(255,255,255,.045);
    color: white;
    border: 1px solid rgba(255,255,255,.08);
    padding: 13px;
  }

  .eventCard.active {
    border-color: #f59e0b;
    background: rgba(245,158,11,.1);
  }

  .eventIcon {
    font-size: 27px;
  }

  .eventInfo {
    flex: 1;
    min-width: 0;
  }

  .eventInfo strong,
  .eventInfo small {
    display: block;
  }

  .eventInfo small {
    margin-top: 3px;
  }

  .miniCode {
    font-size: 9px;
    color: #fbbf24;
  }

  .heroEvent {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
  }

  .eyebrow {
    color: #fbbf24;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1px;
  }

  .inviteBox {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(245,158,11,.08);
    border: 1px solid rgba(245,158,11,.25);
    padding: 10px;
    border-radius: 14px;
    margin-top: 12px;
  }

  .inviteBox span {
    color: #9da9b6;
    font-size: 12px;
  }

  .inviteBox strong {
    color: #fbbf24;
    font-size: 18px;
    letter-spacing: 2px;
  }

  .inviteBox button {
    margin-left: auto;
    background: #26313d;
    color: white;
    padding: 7px 10px;
  }

  .stats {
    display: grid;
    grid-template-columns:
      repeat(4,1fr);
    gap: 10px;
    margin-bottom: 15px;
  }

  .stat {
    background: rgba(255,255,255,.055);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 17px;
    text-align: center;
    padding: 15px;
  }

  .stat span {
    font-size: 23px;
  }

  .stat strong,
  .stat small {
    display: block;
  }

  .stat strong {
    font-size: 20px;
    margin: 5px 0;
  }

  .memberList,
  .drinkList,
  .ranking {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .member,
  .drink,
  .rankingRow,
  .infoRow {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,.045);
    border-radius: 14px;
    padding: 11px;
  }

  .memberInfo,
  .drinkInfo {
    flex: 1;
  }

  .memberInfo strong,
  .memberInfo small,
  .drinkInfo strong,
  .drinkInfo small {
    display: block;
  }

  .memberInfo small,
  .drinkInfo small {
    margin-top: 3px;
  }

  .points {
    color: #fbbf24;
  }

  .drinkIcon {
    font-size: 25px;
  }

  .drinkForm {
    display: grid;
    grid-template-columns:
      2fr 1fr 1fr 1fr auto;
    gap: 8px;
    margin-bottom: 15px;
  }

  input,
  textarea {
    width: 100%;
    background: #121922;
    border: 1px solid #303b48;
    border-radius: 12px;
    padding: 13px;
    color: white;
    outline: none;
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }

  input:focus,
  textarea:focus {
    border-color: #f59e0b;
  }

  .featureCard {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .featureCard > div:nth-child(2) {
    flex: 1;
  }

  .featureIcon {
    font-size: 32px;
  }

  .coming {
    font-size: 10px;
    color: #fbbf24;
    border: 1px solid #6b4b08;
    padding: 5px 8px;
    border-radius: 999px;
  }

  .costBig {
    font-size: 36px;
    font-weight: 900;
    color: #fbbf24;
    margin: 10px 0 15px;
  }

  .infoRow {
    justify-content: space-between;
    margin-top: 7px;
  }

  .empty {
    text-align: center;
    padding: 35px 10px;
  }

  .empty div {
    font-size: 45px;
  }

  .muted {
    color: #778494;
  }

  .message {
    border-radius: 13px;
    padding: 13px;
    margin-bottom: 15px;
  }

  .success {
    background: #102b1b;
    border: 1px solid #1c6137;
    color: #7ee2a8;
  }

  .error {
    background: #321417;
    border: 1px solid #75303a;
    color: #ff9b9b;
  }

  footer {
    text-align: center;
    color: #647180;
    padding: 30px 10px;
  }

  footer small {
    display: block;
    margin-top: 5px;
  }

  .modalBackdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.75);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 15px;
    z-index: 1000;
    backdrop-filter: blur(8px);
  }

  .modal,
  .settingsModal {
    width: 100%;
    max-width: 500px;
    background: #111821;
    border: 1px solid #303b48;
    border-radius: 22px;
    padding: 25px;
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
  }

  .settingsModal {
    max-width: 700px;
  }

  .modalIcon {
    font-size: 38px;
    margin-bottom: 10px;
  }

  .modal input,
  .modal textarea {
    margin-bottom: 10px;
  }

  .close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #26313d;
    color: white;
    font-size: 22px;
    width: 38px;
    height: 38px;
    padding: 0;
  }

  .settingsGrid {
    display: grid;
    grid-template-columns:
      repeat(2,1fr);
    gap: 8px;
    margin: 20px 0;
  }

  .setting {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: space-between;
    background: rgba(255,255,255,.045);
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
  }

  .setting input {
    display: none;
  }

  .switch {
    width: 43px;
    height: 24px;
    background: #303b48;
    border-radius: 20px;
    position: relative;
  }

  .switch::after {
    content: "";
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #8995a3;
    left: 3px;
    top: 3px;
    transition: .15s;
  }

  .setting input:checked + .switch {
    background: #d88905;
  }

  .setting input:checked + .switch::after {
    left: 22px;
    background: white;
  }

  @media(max-width:800px) {
    .drinkForm {
      grid-template-columns: 1fr 1fr;
    }

    .drinkForm button {
      grid-column: 1 / -1;
    }

    .heroEvent {
      flex-direction: column;
      align-items: stretch;
    }
  }

  @media(max-width:650px) {
    .page {
      padding: 12px;
    }

    .header {
      flex-wrap: wrap;
    }

    .headerText {
      min-width: 200px;
    }

    .logoutButton,
    .header > .primaryButton {
      width: 100%;
    }

    .sectionHeader {
      flex-direction: column;
      align-items: stretch;
    }

    .headerActions {
      flex-direction: column;
    }

    .headerActions button {
      width: 100%;
    }

    .stats {
      grid-template-columns:
        repeat(2,1fr);
    }

    .drinkForm {
      grid-template-columns: 1fr;
    }

    .settingsGrid {
      grid-template-columns: 1fr;
    }

    .inviteBox {
      flex-wrap: wrap;
    }

    .inviteBox button {
      margin-left: 0;
    }

    .profileBar {
      flex-wrap: wrap;
    }

    .adminBadge {
      margin-left: 0;
    }
  }
`;
