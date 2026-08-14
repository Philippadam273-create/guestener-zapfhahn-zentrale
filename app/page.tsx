"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  user_id: string | null;
  role: string | null;
  points: number | null;
  drinks_count: number | null;
  username: string | null;
  email: string | null;
  name: string | null;
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
  ranking_enabled: boolean | null;
  show_points: boolean | null;
  show_ranking: boolean | null;
  show_promille: boolean | null;
  show_statistics: boolean | null;
  show_drink_amounts: boolean | null;
  cost_overview_enabled: boolean | null;
  auto_split_costs: boolean | null;
  team_mode: boolean | null;
  show_photos: boolean | null;
  show_costs: boolean | null;
  privacy_mode: boolean | null;
  created_by_profile_id: string | null;
  created_by: string | null;
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
  bezahlt_von: string | null;
  promille_wert: number | null;
  getraenk: string | null;
  menge: number | null;
  alkohol: number | null;
  preis: number | null;
  foto: string | null;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at: string | null;
  role: string | null;
  joined_via_code: string | null;
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

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  points: number | null;
  created_at: string | null;
  event_id: string;
  category: string | null;
  status: string | null;
  created_by_profile_id: string | null;
  assigned_profile_id: string | null;
  winner_profile_id: string | null;
  required_votes: number | null;
  duration_minutes: number | null;
  starts_at: string | null;
  ends_at: string | null;
  completed_at: string | null;
  is_active: boolean | null;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkPrice, setDrinkPrice] = useState("0");

  const [requestMessage, setRequestMessage] = useState("");

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null;

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventData(selectedEventId);
    }
  }, [selectedEventId]);

  async function initialize() {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        setUserEmail("");
        setProfile(null);
        setIsAdmin(false);
        setEvents([]);
        setLoading(false);
        return;
      }

      setUserEmail(user.email ?? "");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          user_id,
          role,
          points,
          drinks_count,
          username,
          email,
          name,
          is_global_admin
        `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profileData) {
        setProfile(null);
        setIsAdmin(false);
        setMessage(
          "Profil wurde noch nicht gefunden. Bitte zuerst dein Profil in Supabase anlegen."
        );
        setLoading(false);
        return;
      }

      const currentProfile = profileData as Profile;

      setProfile(currentProfile);

      const admin =
        currentProfile.is_global_admin === true ||
        currentProfile.role === "admin" ||
        currentProfile.role === "global_admin";

      setIsAdmin(admin);

      await loadEvents(admin, user.id, currentProfile.id);
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Fehler beim Laden: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadEvents(
    admin: boolean,
    userId: string,
    profileId: string
  ) {
    let query = supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    /*
     * GLOBAL ADMIN:
     * Darf alle Events sehen.
     */
    if (!admin) {
      /*
       * Normale Benutzer sehen ihre eigenen erstellten Events.
       * Die RLS-Policies entscheiden zusätzlich, welche Events
       * tatsächlich sichtbar sind.
       */
      query = query.eq("created_by", userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const eventList = (data ?? []) as Event[];

    setEvents(eventList);

    if (eventList.length > 0) {
      const stillExists = eventList.some(
        (event) => event.id === selectedEventId
      );

      if (!selectedEventId || !stillExists) {
        setSelectedEventId(eventList[0].id);
      }
    } else {
      setSelectedEventId("");
    }

    /*
     * profileId wird bewusst verwendet, damit TypeScript nicht
     * wegen einer unbenutzten Variable meckert.
     */
    console.log("Aktuelles Profil:", profileId);
  }

  async function loadEventData(eventId: string) {
    setMessage("");

    try {
      const [
        drinksResult,
        membersResult,
        requestsResult,
        challengesResult,
      ] = await Promise.all([
        supabase
          .from("drinks")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false }),

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
          .order("joined_at", { ascending: true }),

        supabase
          .from("beer_requests")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false }),

        supabase
          .from("challenges")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false }),
      ]);

      if (drinksResult.error) {
        console.error("Getränke:", drinksResult.error);
      } else {
        setDrinks((drinksResult.data ?? []) as Drink[]);
      }

      if (membersResult.error) {
        console.error("Teilnehmer:", membersResult.error);
      } else {
        setMembers((membersResult.data ?? []) as EventMember[]);
      }

      if (requestsResult.error) {
        console.error("Bier-Anfragen:", requestsResult.error);
      } else {
        setBeerRequests(
          (requestsResult.data ?? []) as BeerRequest[]
        );
      }

      if (challengesResult.error) {
        console.error("Challenges:", challengesResult.error);
      } else {
        setChallenges(
          (challengesResult.data ?? []) as Challenge[]
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Eventdaten konnten nicht geladen werden: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    }
  }

  async function createEvent() {
    if (!isAdmin) {
      setMessage("❌ Nur der Global-Admin darf Events erstellen.");
      return;
    }

    if (!eventTitle.trim()) {
      setMessage("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    setMessage("");

    try {
      if (!profile?.id) {
        setMessage("❌ Kein gültiges Admin-Profil gefunden.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("❌ Nicht angemeldet.");
        return;
      }

      const inviteCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

      const { data, error } = await supabase
        .from("events")
        .insert({
          title: eventTitle.trim(),
          description: eventDescription.trim() || null,
          location: eventLocation.trim() || null,
          invite_code: inviteCode,
          is_active: true,

          ranking_enabled: true,
          show_points: true,
          show_ranking: true,
          show_promille: false,
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

          created_by_profile_id: profile.id,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      setEvents((current) => [data as Event, ...current]);
      setSelectedEventId(data.id);

      setEventTitle("");
      setEventDescription("");
      setEventLocation("");

      setMessage("✅ Event erfolgreich erstellt.");
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Event konnte nicht erstellt werden: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    }
  }

  async function deleteEvent(eventId: string) {
    if (!isAdmin) {
      setMessage("❌ Nur der Global-Admin darf Events löschen.");
      return;
    }

    const event = events.find((item) => item.id === eventId);

    if (!event) {
      return;
    }

    const confirmed = window.confirm(
      `Event "${event.title}" wirklich löschen?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        throw error;
      }

      const remaining = events.filter(
        (item) => item.id !== eventId
      );

      setEvents(remaining);

      if (selectedEventId === eventId) {
        setSelectedEventId(
          remaining.length > 0 ? remaining[0].id : ""
        );
      }

      setMessage("✅ Event gelöscht.");
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Event konnte nicht gelöscht werden: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    }
  }

  async function addDrink() {
    if (!selectedEventId) {
      setMessage("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      setMessage("❌ Bitte einen Getränkenamen eingeben.");
      return;
    }

    try {
      const liters = Number(drinkLiters);
      const alcohol = Number(drinkAlcohol);
      const price = Number(drinkPrice);

      if (!Number.isFinite(liters) || liters <= 0) {
        setMessage("❌ Ungültige Literangabe.");
        return;
      }

      if (!Number.isFinite(alcohol) || alcohol < 0) {
        setMessage("❌ Ungültiger Alkoholgehalt.");
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        setMessage("❌ Ungültiger Preis.");
        return;
      }

      const { data, error } = await supabase
        .from("drinks")
        .insert({
          event_id: selectedEventId,
          profile_id: profile?.id ?? null,

          drink_name: drinkName.trim(),
          getraenk: drinkName.trim(),

          brand: drinkBrand.trim() || null,
          marke: drinkBrand.trim() || null,

          liters,
          menge: liters,

          alcohol_percent: alcohol,
          alkohol: alcohol,

          preis: price,
          quantity: 1,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      setDrinks((current) => [
        data as Drink,
        ...current,
      ]);

      setDrinkName("");
      setDrinkBrand("");
      setDrinkLiters("0.5");
      setDrinkAlcohol("5");
      setDrinkPrice("0");

      setMessage("🍺 Getränk gespeichert.");
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    }
  }

  async function deleteDrink(drinkId: string) {
    if (!isAdmin) {
      setMessage("❌ Nur der Global-Admin darf Getränke löschen.");
      return;
    }

    try {
      const { error } = await supabase
        .from("drinks")
        .delete()
        .eq("id", drinkId);

      if (error) {
        throw error;
      }

      setDrinks((current) =>
        current.filter((drink) => drink.id !== drinkId)
      );

      setMessage("✅ Getränk gelöscht.");
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Getränk konnte nicht gelöscht werden: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    }
  }

  async function addMember() {
    if (!selectedEventId || !profile?.id) {
      setMessage("❌ Event oder Profil fehlt.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("event_members")
        .insert({
          event_id: selectedEventId,
          profile_id: profile.id,
          role: "member",
        })
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
        .single();

      if (error) {
        throw error;
      }

      setMembers((current) => [
        ...current,
        data as EventMember,
      ]);

      setMessage("👤 Teilnehmer hinzugefügt.");
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    }
  }

  async function sendBeerRequest() {
    if (!selectedEventId || !profile?.id) {
      setMessage("❌ Event oder Profil fehlt.");
      return;
    }

    if (!requestMessage.trim()) {
      setMessage("❌ Bitte eine Nachricht eingeben.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("beer_requests")
        .insert({
          event_id: selectedEventId,
          requester_profile_id: profile.id,
          status: "open",
          message: requestMessage.trim(),
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      setBeerRequests((current) => [
        data as BeerRequest,
        ...current,
      ]);

      setRequestMessage("");

      setMessage("🍺 Bier-Anfrage gesendet.");
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Bier-Anfrage konnte nicht gesendet werden: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    }
  }

  async function updateBeerRequest(
    requestId: string,
    status: string
  ) {
    if (!isAdmin) {
      setMessage("❌ Nur der Global-Admin darf Anfragen bearbeiten.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("beer_requests")
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      setBeerRequests((current) =>
        current.map((request) =>
          request.id === requestId
            ? (data as BeerRequest)
            : request
        )
      );

      setMessage("✅ Bier-Anfrage aktualisiert.");
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Anfrage konnte nicht aktualisiert werden: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    }
  }

  async function signOut() {
    await supabase.auth.signOut();

    setProfile(null);
    setUserEmail("");
    setIsAdmin(false);
    setEvents([]);
    setSelectedEventId("");
    setDrinks([]);
    setMembers([]);
    setBeerRequests([]);
    setChallenges([]);
  }

  const totalLiters = drinks.reduce(
    (sum, drink) =>
      sum +
      Number(drink.liters ?? drink.menge ?? 0) *
        Number(drink.quantity ?? 1),
    0
  );

  const totalCost = drinks.reduce(
    (sum, drink) =>
      sum + Number(drink.preis ?? 0) *
        Number(drink.quantity ?? 1),
    0
  );

  const totalPoints = members.reduce(
    (sum, member) => {
      if (member.profile_id === profile?.id) {
        return sum + Number(profile?.points ?? 0);
      }

      return sum;
    },
    0
  );

  const costPerPerson =
    members.length > 0
      ? totalCost / members.length
      : 0;

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          <div className="logo">🍻</div>
          <h1>Güstener Zapfhahn Zentrale</h1>
          <p>Daten werden geladen...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="page">
        <div className="container">
          <header className="header">
            <div className="logo">🍻</div>

            <div>
              <h1>Güstener Zapfhahn Zentrale</h1>
              <p>Events · Getränke · Rankings · Challenges</p>
            </div>
          </header>

          <section className="card loginCard">
            <div className="bigIcon">🔐</div>

            <h2>Keine Anmeldung gefunden</h2>

            <p>
              Du bist aktuell nicht angemeldet oder dein Profil
              wurde noch nicht mit deinem Supabase-Account verbunden.
            </p>

            {userEmail && (
              <div className="info">
                Angemeldet als:
                <strong>{userEmail}</strong>
              </div>
            )}

            {message && (
              <div className="message error">
                {message}
              </div>
            )}

            <button
              className="primary"
              onClick={initialize}
            >
              🔄 Erneut prüfen
            </button>
          </section>
        </div>
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

            <div className="userBadge">
              👤 {profile.name || profile.username || "Philipp"}

              {isAdmin && (
                <span className="adminBadge">
                  👑 GLOBAL ADMIN
                </span>
              )}
            </div>
          </div>

          <button
            className="logout"
            onClick={signOut}
          >
            Abmelden
          </button>
        </header>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {isAdmin && (
          <section className="card adminCard">
            <div className="sectionTitle">
              <div>
                <h2>👑 Admin-Zentrale</h2>
                <p>Vollzugriff auf alle Events</p>
              </div>

              <span className="adminStatus">
                GLOBAL ADMIN
              </span>
            </div>

            <div className="adminStats">
              <div>
                <b>{events.length}</b>
                <span>Events</span>
              </div>

              <div>
                <b>{drinks.length}</b>
                <span>Getränke</span>
              </div>

              <div>
                <b>{members.length}</b>
                <span>Teilnehmer</span>
              </div>

              <div>
                <b>{challenges.length}</b>
                <span>Challenges</span>
              </div>
            </div>
          </section>
        )}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <h2>📅 Event auswählen</h2>

              <p>
                {events.length === 0
                  ? "Noch keine Events vorhanden."
                  : "Wähle das gewünschte Event aus."}
              </p>
            </div>

            {selectedEvent?.invite_code && (
              <div className="invite">
                Einladungscode
                <strong>
                  {selectedEvent.invite_code}
                </strong>
              </div>
            )}
          </div>

          <select
            value={selectedEventId}
            onChange={(event) =>
              setSelectedEventId(event.target.value)
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
                {event.is_active ? " · aktiv" : " · beendet"}
              </option>
            ))}
          </select>
        </section>

        {isAdmin && (
          <section className="card">
            <h2>➕ Neues Event</h2>

            <input
              placeholder="Eventname"
              value={eventTitle}
              onChange={(event) =>
                setEventTitle(event.target.value)
              }
            />

            <input
              placeholder="Ort"
              value={eventLocation}
              onChange={(event) =>
                setEventLocation(event.target.value)
              }
            />

            <textarea
              placeholder="Beschreibung"
              value={eventDescription}
              onChange={(event) =>
                setEventDescription(event.target.value)
              }
            />

            <button
              className="primary full"
              onClick={createEvent}
            >
              🍻 Event erstellen
            </button>
          </section>
        )}

        {selectedEvent && (
          <>
            <section className="eventHero">
              {selectedEvent.image && (
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                />
              )}

              <div>
                <span className="activeLabel">
                  {selectedEvent.is_active
                    ? "● EVENT AKTIV"
                    : "● EVENT BEENDET"}
                </span>

                <h2>{selectedEvent.title}</h2>

                {selectedEvent.description && (
                  <p>{selectedEvent.description}</p>
                )}

                {selectedEvent.location && (
                  <p>📍 {selectedEvent.location}</p>
                )}
              </div>
            </section>

            <section className="stats">
              <div>
                <span>🍺</span>
                <b>{drinks.length}</b>
                <small>Getränke</small>
              </div>

              <div>
                <span>💧</span>
                <b>{totalLiters.toFixed(1)}</b>
                <small>Liter</small>
              </div>

              <div>
                <span>💶</span>
                <b>{totalCost.toFixed(2)} €</b>
                <small>Kosten</small>
              </div>

              <div>
                <span>👥</span>
                <b>{members.length}</b>
                <small>Teilnehmer</small>
              </div>
            </section>

            <section className="card">
              <h2>👥 Teilnehmer</h2>

              <button
                className="secondary"
                onClick={addMember}
              >
                ➕ Mich als Teilnehmer hinzufügen
              </button>

              {members.length === 0 ? (
                <p className="muted">
                  Noch keine Teilnehmer.
                </p>
              ) : (
                <div className="list">
                  {members.map((member, index) => (
                    <div
                      className="listItem"
                      key={member.id}
                    >
                      <div>
                        <strong>
                          {index + 1}. Teilnehmer
                        </strong>

                        <small>
                          Profil-ID:{" "}
                          {member.profile_id.substring(
                            0,
                            8
                          )}
                          ...
                        </small>
                      </div>

                      {member.role === "admin" && (
                        <span className="role">
                          ADMIN
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card">
              <h2>🍺 Getränk hinzufügen</h2>

              <input
                placeholder="Getränk"
                value={drinkName}
                onChange={(event) =>
                  setDrinkName(event.target.value)
                }
              />

              <input
                placeholder="Marke"
                value={drinkBrand}
                onChange={(event) =>
                  setDrinkBrand(event.target.value)
                }
              />

              <div className="grid3">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Liter"
                  value={drinkLiters}
                  onChange={(event) =>
                    setDrinkLiters(event.target.value)
                  }
                />

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Alkohol %"
                  value={drinkAlcohol}
                  onChange={(event) =>
                    setDrinkAlcohol(event.target.value)
                  }
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Preis €"
                  value={drinkPrice}
                  onChange={(event) =>
                    setDrinkPrice(event.target.value)
                  }
                />
              </div>

              <button
                className="primary full"
                onClick={addDrink}
              >
                🍻 Getränk speichern
              </button>
            </section>

            <section className="card">
              <h2>🍺 Getränke</h2>

              {drinks.length === 0 ? (
                <p className="muted">
                  Noch keine Getränke.
                </p>
              ) : (
                <div className="list">
                  {drinks.map((drink) => {
                    const name =
                      drink.drink_name ||
                      drink.getraenk ||
                      "Getränk";

                    const brand =
                      drink.brand ||
                      drink.marke ||
                      "";

                    const liters = Number(
                      drink.liters ??
                        drink.menge ??
                        0
                    );

                    const alcohol = Number(
                      drink.alcohol_percent ??
                        drink.alkohol ??
                        0
                    );

                    const price = Number(
                      drink.preis ?? 0
                    );

                    return (
                      <div
                        className="listItem"
                        key={drink.id}
                      >
                        <div>
                          <strong>
                            🍺 {name}
                          </strong>

                          <small>
                            {brand
                              ? brand + " · "
                              : ""}
                            {liters.toFixed(2)} L ·{" "}
                            {alcohol.toFixed(1)} %
                          </small>
                        </div>

                        <div className="right">
                          <strong>
                            {price.toFixed(2)} €
                          </strong>

                          {isAdmin && (
                            <button
                              className="dangerSmall"
                              onClick={() =>
                                deleteDrink(drink.id)
                              }
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="card costCard">
              <h2>💶 Kostenübersicht</h2>

              <div className="bigNumber">
                {totalCost.toFixed(2)} €
              </div>

              <p>Gesamtkosten des Events</p>

              <div className="costLine">
                <span>👥 Teilnehmer</span>
                <strong>{members.length}</strong>
              </div>

              <div className="costLine">
                <span>💶 Pro Person</span>
                <strong>
                  {costPerPerson.toFixed(2)} €
                </strong>
              </div>

              <div className="costLine">
                <span>💧 Gesamtmenge</span>
                <strong>
                  {totalLiters.toFixed(1)} L
                </strong>
              </div>

              <div className="costLine">
                <span>🏆 Meine Punkte</span>
                <strong>
                  {totalPoints}
                </strong>
              </div>
            </section>

            <section className="card">
              <h2>🍺 Bier-Anfrage</h2>

              <textarea
                placeholder="Was soll besorgt werden?"
                value={requestMessage}
                onChange={(event) =>
                  setRequestMessage(event.target.value)
                }
              />

              <button
                className="primary full"
                onClick={sendBeerRequest}
              >
                🍺 Anfrage senden
              </button>

              {beerRequests.length > 0 && (
                <div className="list">
                  {beerRequests.map((request) => (
                    <div
                      className="listItem"
                      key={request.id}
                    >
                      <div>
                        <strong>
                          🍺{" "}
                          {request.message ||
                            "Bier-Anfrage"}
                        </strong>

                        <small>
                          Status:{" "}
                          {request.status ||
                            "offen"}
                        </small>
                      </div>

                      {isAdmin &&
                        request.status === "open" && (
                          <div className="actions">
                            <button
                              className="successSmall"
                              onClick={() =>
                                updateBeerRequest(
                                  request.id,
                                  "approved"
                                )
                              }
                            >
                              ✓
                            </button>

                            <button
                              className="dangerSmall"
                              onClick={() =>
                                updateBeerRequest(
                                  request.id,
                                  "rejected"
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card">
              <h2>🏆 Challenges</h2>

              {challenges.length === 0 ? (
                <p className="muted">
                  Noch keine Challenges vorhanden.
                </p>
              ) : (
                <div className="list">
                  {challenges.map((challenge) => (
                    <div
                      className="listItem"
                      key={challenge.id}
                    >
                      <div>
                        <strong>
                          {challenge.category || "🏆"}{" "}
                          {challenge.title}
                        </strong>

                        <small>
                          {challenge.description ||
                            "Keine Beschreibung"}
                        </small>
                      </div>

                      <strong>
                        {challenge.points ?? 0} P
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {isAdmin && (
              <section className="card dangerCard">
                <h2>⚙️ Admin-Bereich</h2>

                <p>
                  Als Global-Admin hast du Zugriff auf
                  sämtliche Events.
                </p>

                <div className="adminActions">
                  <button
                    className="secondary"
                    onClick={() =>
                      loadEventData(selectedEventId)
                    }
                  >
                    🔄 Daten aktualisieren
                  </button>

                  <button
                    className="danger"
                    onClick={() =>
                      deleteEvent(selectedEventId)
                    }
                  >
                    🗑️ Dieses Event löschen
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        <footer>
          <strong>
            🍻 Güstener Zapfhahn Zentrale
          </strong>

          <small>
            Dein Event. Deine Getränke. Deine Runde.
          </small>
        </footer>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top,
              #24384d 0%,
              #0b1016 48%,
              #06090d 100%
            );
          color: #fff;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          padding: 18px;
        }

        .container {
          width: 100%;
          max-width: 950px;
          margin: 0 auto;
        }

        .loading {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px 0 25px;
        }

        .logo {
          width: 65px;
          height: 65px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 20px;
          font-size: 36px;
          flex-shrink: 0;
        }

        .headerText {
          flex: 1;
        }

        h1 {
          margin: 0;
          font-size: 27px;
        }

        h2 {
          margin: 0 0 7px;
          font-size: 21px;
        }

        p {
          color: #aab5c1;
          line-height: 1.5;
        }

        .header p {
          margin: 5px 0;
        }

        .userBadge {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          margin-top: 8px;
          font-size: 13px;
          color: #cbd5df;
        }

        .adminBadge {
          background: #f59e0b;
          color: #111;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
        }

        .card {
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 15px;
          box-shadow:
            0 10px 35px rgba(0,0,0,.18);
        }

        .adminCard {
          border-color: rgba(245,158,11,.3);
        }

        .sectionTitle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 14px;
        }

        .sectionTitle p {
          margin: 0;
        }

        .adminStatus {
          background: #f59e0b;
          color: #111;
          font-weight: 900;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 11px;
        }

        .adminStats {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 10px;
        }

        .adminStats div {
          background: rgba(255,255,255,.05);
          border-radius: 14px;
          padding: 15px;
          text-align: center;
        }

        .adminStats b {
          display: block;
          font-size: 25px;
          color: #fbbf24;
        }

        .adminStats span {
          color: #8995a3;
          font-size: 12px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stats > div {
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 17px;
          padding: 16px;
          text-align: center;
        }

        .stats span,
        .stats b,
        .stats small {
          display: block;
        }

        .stats span {
          font-size: 23px;
        }

        .stats b {
          font-size: 21px;
          margin: 5px 0;
        }

        .stats small {
          color: #8995a3;
          font-size: 11px;
        }

        .eventHero {
          display: flex;
          gap: 18px;
          align-items: center;
          background:
            linear-gradient(
              135deg,
              rgba(245,158,11,.14),
              rgba(255,255,255,.04)
            );
          border: 1px solid rgba(245,158,11,.18);
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 15px;
        }

        .eventHero img {
          width: 130px;
          height: 100px;
          object-fit: cover;
          border-radius: 15px;
        }

        .eventHero h2 {
          font-size: 27px;
          margin-top: 8px;
        }

        .eventHero p {
          margin: 5px 0;
        }

        .activeLabel {
          color: #fbbf24;
          font-size: 11px;
          font-weight: 900;
        }

        .invite {
          background: rgba(245,158,11,.12);
          border: 1px solid rgba(245,158,11,.25);
          padding: 10px 14px;
          border-radius: 13px;
          text-align: center;
          font-size: 10px;
          color: #aab5c1;
        }

        .invite strong {
          display: block;
          color: #fbbf24;
          font-size: 18px;
          letter-spacing: 2px;
          margin-top: 3px;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 13px 14px;
          border-radius: 12px;
          border: 1px solid #303b47;
          background: #121a23;
          color: #fff;
          outline: none;
          margin-bottom: 10px;
          font: inherit;
        }

        textarea {
          min-height: 95px;
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #f59e0b;
        }

        button {
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          font-weight: 800;
          cursor: pointer;
          transition: .15s;
        }

        button:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .primary {
          background: #f59e0b;
          color: #111;
        }

        .secondary {
          background: #273442;
          color: #fff;
        }

        .logout {
          background: #252f3b;
          color: #fff;
          padding: 9px 12px;
          font-size: 12px;
        }

        .full {
          width: 100%;
        }

        .danger {
          background: #b91c1c;
          color: #fff;
        }

        .dangerSmall,
        .successSmall {
          padding: 7px 10px;
          font-size: 12px;
        }

        .dangerSmall {
          background: #7f1d1d;
          color: #fff;
        }

        .successSmall {
          background: #166534;
          color: #fff;
        }

        .grid3 {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 8px;
        }

        .list {
          margin-top: 12px;
        }

        .listItem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.045);
        }

        .listItem strong {
          display: block;
        }

        .listItem small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
        }

        .right,
        .actions,
        .adminActions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .role {
          background: #f59e0b;
          color: #111;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
        }

        .costCard {
          text-align: center;
        }

        .bigNumber {
          font-size: 42px;
          font-weight: 900;
          color: #fbbf24;
        }

        .costLine {
          display: flex;
          justify-content: space-between;
          background: rgba(255,255,255,.045);
          padding: 13px;
          border-radius: 12px;
          margin-top: 8px;
        }

        .message {
          background: #172230;
          border: 1px solid #344454;
          color: #fbbf24;
          border-radius: 13px;
          padding: 13px;
          margin-bottom: 15px;
        }

        .error {
          color: #fca5a5;
          border-color: #7f1d1d;
        }

        .muted {
          color: #7f8b98;
        }

        .bigIcon {
          font-size: 50px;
        }

        .loginCard {
          text-align: center;
          max-width: 600px;
          margin: 50px auto;
        }

        .info {
          background: rgba(255,255,255,.05);
          padding: 13px;
          border-radius: 12px;
          margin: 15px 0;
        }

        .info strong {
          display: block;
          margin-top: 5px;
          color: #fbbf24;
        }

        .dangerCard {
          border-color: rgba(239,68,68,.3);
        }

        footer {
          text-align: center;
          padding: 30px 10px;
          color: #697686;
        }

        footer strong,
        footer small {
          display: block;
        }

        footer small {
          margin-top: 5px;
        }

        @media(max-width:700px) {
          .header {
            align-items: flex-start;
          }

          .header .logout {
            display: none;
          }

          h1 {
            font-size: 21px;
          }

          .stats,
          .adminStats {
            grid-template-columns: repeat(2,1fr);
          }

          .grid3 {
            grid-template-columns: 1fr;
          }

          .sectionTitle {
            align-items: flex-start;
            flex-direction: column;
          }

          .eventHero {
            flex-direction: column;
            align-items: flex-start;
          }

          .eventHero img {
            width: 100%;
            height: 180px;
          }

          .adminActions {
            flex-direction: column;
            align-items: stretch;
          }

          .adminActions button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
