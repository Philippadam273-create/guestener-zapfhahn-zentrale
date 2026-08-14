"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
};

type Person = {
  id: string;
  name: string;
  username?: string | null;
  drinks: number;
  liters: number;
  cost: number;
  points: number;
  promille?: number;
};

type Drink = {
  id: string;
  event_id?: string;
  getraenk?: string | null;
  drink_name?: string | null;
  menge?: number | null;
  liters?: number | null;
  alkohol?: number | null;
  alcohol_percent?: number | null;
  preis?: number | null;
  price?: number | null;
  quantity?: number | null;
  profile_id?: string | null;
};

type Payment = {
  id: string;
  event_id?: string | null;
  profile_id?: string | null;
  amount?: number | null;
  betrag?: number | null;
  description?: string | null;
  beschreibung?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type Challenge = {
  id: string;
  event_id?: string | null;
  title?: string | null;
  description?: string | null;
  points?: number | null;
  category?: string | null;
  status?: string | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  required_votes?: number | null;
  is_active?: boolean | null;
};

type PointHistory = {
  id?: string;
  profile_id?: string | null;
  event_id?: string | null;
  points?: number | null;
  amount?: number | null;
  reason?: string | null;
  description?: string | null;
  source?: string | null;
  created_at?: string | null;
};

type RankingTitle = {
  min_points: number;
  title: string;
  emoji?: string | null;
  description?: string | null;
};

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState("");

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [rankingTitles, setRankingTitles] = useState<RankingTitle[]>([]);

  const [selectedPerson, setSelectedPerson] =
    useState<Person | null>(null);

  const [showCreateEvent, setShowCreateEvent] =
    useState(false);

  const [showChallenge, setShowChallenge] =
    useState(false);

  const [showPayment, setShowPayment] =
    useState(false);

  const [showDrinkAnimation, setShowDrinkAnimation] =
    useState(false);

  const [showMoneyAnimation, setShowMoneyAnimation] =
    useState(false);

  const [showPointsAnimation, setShowPointsAnimation] =
    useState(false);

  const [message, setMessage] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] = useState("");

  const [paymentPerson, setPaymentPerson] =
    useState("");

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentDescription, setPaymentDescription] =
    useState("Getränkeeinkauf");

  const [eventTitle, setEventTitle] =
    useState("");

  const [eventDescription, setEventDescription] =
    useState("");

  const [eventLocation, setEventLocation] =
    useState("");

  const [challengeTitle, setChallengeTitle] =
    useState("");

  const [challengeDescription, setChallengeDescription] =
    useState("");

  const [challengePoints, setChallengePoints] =
    useState("10");

  const [challengeCategory, setChallengeCategory] =
    useState("Lustig");

  const [challengeVotes, setChallengeVotes] =
    useState("1");

  const [loading, setLoading] = useState(false);

  /*
   * ---------------------------------------------------------
   * EVENTS
   * ---------------------------------------------------------
   */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setEvents(data);

      if (!eventId && data.length > 0) {
        setEventId(data[0].id);
      }
    }
  }

  async function createEvent() {
    setMessage("");

    if (!eventTitle.trim()) {
      setMessage("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: eventTitle.trim(),
        description:
          eventDescription.trim() || null,
        location:
          eventLocation.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      setMessage(
        "❌ Event konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setShowCreateEvent(false);

    await loadEvents();

    if (data?.id) {
      setEventId(data.id);
    }

    setMessage("🎉 Event erfolgreich erstellt!");
  }

  async function deleteEvent() {
    if (!eventId) return;

    const event = events.find(
      (item) => item.id === eventId
    );

    const confirmed = window.confirm(
      `Soll das Event "${event?.title || ""}" wirklich gelöscht werden?`
    );

    if (!confirmed) return;

    setLoading(true);

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    setLoading(false);

    if (error) {
      setMessage(
        "❌ Event konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    setEventId("");
    setMessage("🗑️ Event gelöscht.");

    await loadEvents();
  }

  /*
   * ---------------------------------------------------------
   * DRINKS
   * ---------------------------------------------------------
   */

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
      console.error(error);
      return;
    }

    setDrinks(data || []);
  }

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!drinkName.trim()) {
      setMessage(
        "❌ Bitte ein Getränk eingeben."
      );
      return;
    }

    const litersNumber = Number(liters);
    const alcoholNumber = Number(alcohol);
    const priceNumber = Number(price);

    const { error } = await supabase
      .from("drinks")
      .insert({
        event_id: eventId,
        getraenk: drinkName.trim(),
        drink_name: drinkName.trim(),
        menge: litersNumber,
        liters: litersNumber,
        alkohol: alcoholNumber,
        alcohol_percent: alcoholNumber,
        preis: priceNumber,
        quantity: 1,
      });

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    setMessage("🍺 Getränk gespeichert!");

    await loadDrinks();
  }

  /*
   * ---------------------------------------------------------
   * PEOPLE
   * ---------------------------------------------------------
   */

  async function loadPeople() {
    if (!eventId) {
      setPeople([]);
      return;
    }

    /*
     * Profiles werden zunächst geladen.
     * Event-Mitglieder bestimmen anschließend,
     * welche Personen zum Event gehören.
     */

    const { data: members, error } =
      await supabase
        .from("event_members")
        .select("*")
        .eq("event_id", eventId);

    if (error) {
      console.error(error);
    }

    if (!members || members.length === 0) {
      setPeople([]);
      return;
    }

    const ids = members
      .map(
        (member: any) =>
          member.profile_id ||
          member.user_id
      )
      .filter(Boolean);

    if (ids.length === 0) {
      setPeople([]);
      return;
    }

    const { data: profiles } =
      await supabase
        .from("profiles")
        .select("*")
        .in("id", ids);

    const result: Person[] =
      (profiles || []).map(
        (profile: any) => ({
          id: profile.id,
          name:
            profile.name ||
            profile.username ||
            "Unbekannt",
          username: profile.username,
          drinks: 0,
          liters: 0,
          cost: 0,
          points: Number(
            profile.points || 0
          ),
          promille: Number(
            profile.promille || 0
          ),
        })
      );

    setPeople(result);
  }

  async function addPerson() {
    setMessage("");

    if (!personName.trim()) {
      setMessage(
        "❌ Bitte einen Namen eingeben."
      );
      return;
    }

    if (!eventId) {
      setMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    const existing = people.find(
      (person) =>
        person.name.toLowerCase() ===
        personName
          .trim()
          .toLowerCase()
    );

    if (existing) {
      setMessage(
        "❌ Teilnehmer bereits vorhanden."
      );
      return;
    }

    setLoading(true);

    /*
     * Erst Profil erstellen.
     */

    const { data: profile, error } =
      await supabase
        .from("profiles")
        .insert({
          name: personName.trim(),
          username: personName.trim(),
          points: 0,
          drinks_count: 0,
        })
        .select()
        .single();

    if (error) {
      setLoading(false);

      setMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message
      );

      return;
    }

    /*
     * Danach Event-Mitglied.
     */

    const { error: memberError } =
      await supabase
        .from("event_members")
        .insert({
          event_id: eventId,
          profile_id: profile.id,
        });

    setLoading(false);

    if (memberError) {
      setMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          memberError.message
      );
      return;
    }

    setPersonName("");

    await loadPeople();

    setMessage(
      "🎉 " +
        personName.trim() +
        " ist jetzt dabei!"
    );
  }

  /*
   * ---------------------------------------------------------
   * DRINK ASSIGNMENT
   * ---------------------------------------------------------
   */

  async function assignDrink(
    person: Person,
    drinkId: string
  ) {
    const drink = drinks.find(
      (item) => item.id === drinkId
    );

    if (!drink) return;

    const drinkLiters = Number(
      drink.liters ??
        drink.menge ??
        0
    );

    const drinkPrice = Number(
      drink.preis ??
        drink.price ??
        0
    );

    const newPerson = {
      ...person,
      drinks: person.drinks + 1,
      liters:
        person.liters + drinkLiters,
      cost:
        person.cost + drinkPrice,
      points:
        person.points + 10,
    };

    setPeople((current) =>
      current.map((item) =>
        item.id === person.id
          ? newPerson
          : item
      )
    );

    setShowDrinkAnimation(true);

    setTimeout(() => {
      setShowDrinkAnimation(false);
    }, 2200);

    setShowPointsAnimation(true);

    setTimeout(() => {
      setShowPointsAnimation(false);
    }, 1600);

    /*
     * Profilpunkte aktualisieren.
     */

    const { error } = await supabase
      .from("profiles")
      .update({
        points: newPerson.points,
        drinks_count:
          newPerson.drinks,
      })
      .eq("id", person.id);

    if (error) {
      console.error(error);
    }

    /*
     * Punkte-Historie.
     */

    await supabase
      .from("point_history")
      .insert({
        profile_id: person.id,
        event_id: eventId,
        points: 10,
        amount: 10,
        reason:
          "Getränk getrunken",
        description:
          "🍺 Getränk: " +
          (drink.getraenk ||
            drink.drink_name ||
            "Getränk"),
        source: "drink",
      });

    await loadPointHistory();
    await loadPeople();
  }

  /*
   * ---------------------------------------------------------
   * PAYMENTS
   * ---------------------------------------------------------
   */

  async function loadPayments() {
    if (!eventId) {
      setPayments([]);
      return;
    }

    const { data, error } =
      await supabase
        .from("payments")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(error);
      return;
    }

    setPayments(data || []);
  }

  function getPersonName(
    profileId?: string | null
  ) {
    if (!profileId) {
      return "Unbekannt";
    }

    return (
      people.find(
        (person) =>
          person.id === profileId
      )?.name ||
      "Unbekannt"
    );
  }

  async function savePayment() {
    setMessage("");

    if (!eventId) {
      setMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!paymentPerson) {
      setMessage(
        "❌ Bitte eine Person auswählen."
      );
      return;
    }

    const amount = Number(
      paymentAmount
    );

    if (!amount || amount <= 0) {
      setMessage(
        "❌ Bitte einen gültigen Betrag eingeben."
      );
      return;
    }

    /*
     * WICHTIG:
     * Status ist bewusst "completed",
     * da die Datenbank einen
     * payments_status_check besitzt.
     */

    const { error } = await supabase
      .from("payments")
      .insert({
        event_id: eventId,
        profile_id: paymentPerson,
        amount,
        betrag: amount,
        description:
          paymentDescription ||
          "Getränkeeinkauf",
        beschreibung:
          paymentDescription ||
          "Getränkeeinkauf",
        status: "completed",
      });

    if (error) {
      setMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    /*
     * Sonderbonus:
     * Kiste Bier / größere Spende.
     */

    const isCrate =
      paymentDescription
        .toLowerCase()
        .includes("kiste");

    if (isCrate) {
      const person = people.find(
        (item) =>
          item.id === paymentPerson
      );

      if (person) {
        const bonus = 50;
        const newPoints =
          person.points + bonus;

        await supabase
          .from("profiles")
          .update({
            points: newPoints,
          })
          .eq(
            "id",
            paymentPerson
          );

        await supabase
          .from("point_history")
          .insert({
            profile_id:
              paymentPerson,
            event_id: eventId,
            points: bonus,
            amount: bonus,
            reason:
              "Kiste Bier spendiert",
            description:
              "🍺 Kiste Bier spendiert",
            source: "crate",
          });

        setMessage(
          "🍺💶 Kiste spendiert! +50 Punkte!"
        );

        setShowPointsAnimation(true);

        setTimeout(() => {
          setShowPointsAnimation(false);
        }, 1600);
      }
    } else {
      setMessage(
        "💶 Zahlung gespeichert!"
      );
    }

    setShowMoneyAnimation(true);

    setTimeout(() => {
      setShowMoneyAnimation(false);
    }, 2600);

    setPaymentPerson("");
    setPaymentAmount("");
    setPaymentDescription(
      "Getränkeeinkauf"
    );
    setShowPayment(false);

    await loadPayments();
    await loadPeople();
    await loadPointHistory();
  }

  /*
   * ---------------------------------------------------------
   * CHALLENGES
   * ---------------------------------------------------------
   */

  async function loadChallenges() {
    if (!eventId) {
      setChallenges([]);
      return;
    }

    const { data, error } =
      await supabase
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
  }

  async function createChallenge() {
    setMessage("");

    if (!eventId) {
      setMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!challengeTitle.trim()) {
      setMessage(
        "❌ Bitte einen Challenge-Titel eingeben."
      );
      return;
    }

    const { error } = await supabase
      .from("challenges")
      .insert({
        event_id: eventId,
        title:
          challengeTitle.trim(),
        description:
          challengeDescription.trim() ||
          null,
        points:
          Number(challengePoints) ||
          10,
        category:
          challengeCategory,
        status: "open",
        required_votes:
          Number(challengeVotes) ||
          1,
        is_active: true,
      });

    if (error) {
      setMessage(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");
    setChallengeVotes("1");

    setShowChallenge(false);

    setMessage(
      "🔥 Challenge erstellt!"
    );

    await loadChallenges();
  }

  /*
   * ---------------------------------------------------------
   * POINT HISTORY
   * ---------------------------------------------------------
   */

  async function loadPointHistory() {
    if (!eventId) {
      setPointHistory([]);
      return;
    }

    const { data, error } =
      await supabase
        .from("point_history")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      /*
       * Falls die Tabelle noch nicht existiert,
       * soll die komplette App trotzdem funktionieren.
       */
      console.error(error);
      return;
    }

    setPointHistory(data || []);
  }

  /*
   * ---------------------------------------------------------
   * RANKING TITLES
   * ---------------------------------------------------------
   */

  async function loadRankingTitles() {
    const { data, error } =
      await supabase
        .from("ranking_titles")
        .select("*")
        .order("min_points", {
          ascending: true,
        });

    if (error) {
      console.error(error);
      return;
    }

    setRankingTitles(data || []);
  }

  function getRankingTitle(
    points: number
  ) {
    if (rankingTitles.length > 0) {
      const available =
        rankingTitles
          .filter(
            (item) =>
              Number(
                item.min_points
              ) <= points
          )
          .sort(
            (a, b) =>
              Number(b.min_points) -
              Number(a.min_points)
          );

      if (available[0]) {
        return available[0];
      }
    }

    if (points >= 500) {
      return {
        title:
          "🍻 Absolute Party-Legende",
        emoji: "👑",
        description:
          "Niemand kommt an dir vorbei.",
      };
    }

    if (points >= 300) {
      return {
        title: "🍺 Bierbaron",
        emoji: "🍺",
        description:
          "Der Zapfhahn kennt deinen Namen.",
      };
    }

    if (points >= 200) {
      return {
        title: "🎉 Partymaschine",
        emoji: "🎉",
        description:
          "Du bist nicht zum Zuschauen hier.",
      };
    }

    if (points >= 100) {
      return {
        title: "😈 Partyprofi",
        emoji: "😈",
        description:
          "Da geht noch einiges.",
      };
    }

    if (points >= 50) {
      return {
        title: "🍻 Zapfhahn-Lehrling",
        emoji: "🍻",
        description:
          "Du bist auf dem richtigen Weg.",
      };
    }

    return {
      title: "🌱 Party-Anfänger",
      emoji: "🌱",
      description:
        "Jeder große Abend beginnt klein.",
    };
  }

  /*
   * ---------------------------------------------------------
   * LOAD EVERYTHING
   * ---------------------------------------------------------
   */

  useEffect(() => {
    loadEvents();
    loadRankingTitles();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    loadDrinks();
    loadPeople();
    loadPayments();
    loadChallenges();
    loadPointHistory();
  }, [eventId]);

  /*
   * ---------------------------------------------------------
   * CALCULATIONS
   * ---------------------------------------------------------
   */

  const totalLiters = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(
            drink.liters ??
              drink.menge ??
              0
          ),
        0
      ),
    [drinks]
  );

  const totalDrinkCost = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(
            drink.preis ??
              drink.price ??
              0
          ),
        0
      ),
    [drinks]
  );

  const totalPayments = useMemo(
    () =>
      payments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount ??
              payment.betrag ??
              0
          ),
        0
      ),
    [payments]
  );

  const totalPoints = useMemo(
    () =>
      people.reduce(
        (sum, person) =>
          sum +
          Number(person.points || 0),
        0
      ),
    [people]
  );

  const ranking = useMemo(
    () =>
      [...people].sort(
        (a, b) =>
          b.points - a.points
      ),
    [people]
  );

  const currentEvent = events.find(
    (event) =>
      event.id === eventId
  );

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <main className="app">
      <div className="backgroundGlow glow1" />
      <div className="backgroundGlow glow2" />

      {showDrinkAnimation && (
        <div className="partyOverlay">
          <div className="beerClash">
            <span>🍺</span>
            <span>🍻</span>
            <span>🍺</span>
          </div>

          <div className="prost">
            PROST!
          </div>

          <div className="prostSub">
            +10 Punkte
          </div>
        </div>
      )}

      {showMoneyAnimation && (
        <div className="moneyRain">
          {Array.from({
            length: 18,
          }).map((_, index) => (
            <span
              key={index}
              style={{
                left:
                  `${(index * 17) % 100}%`,
                animationDelay:
                  `${(index % 6) * 0.12}s`,
              }}
            >
              💶
            </span>
          ))}
        </div>
      )}

      {showPointsAnimation && (
        <div className="pointsPop">
          ⭐ +PUNKTE!
        </div>
      )}

      <div className="container">

        {/* HEADER */}

        <header className="hero">
          <div className="logoBox">
            🍻
          </div>

          <div className="heroText">
            <div className="eyebrow">
              🍺 PARTY · FREUNDE · CHAOS
            </div>

            <h1>
              Güstener
              <br />
              <span>Zapfhahn Zentrale</span>
            </h1>

            <p>
              Dein Event.
              Deine Getränke.
              Dein Ranking.
            </p>
          </div>
        </header>

        {/* EVENT */}

        <section className="card eventCard">
          <div className="sectionTitle">
            <div>
              <span className="sectionEmoji">
                📅
              </span>

              <div>
                <h2>Aktuelles Event</h2>

                <small>
                  Wo das Chaos beginnt
                </small>
              </div>
            </div>

            <button
              className="iconButton"
              onClick={() =>
                setShowCreateEvent(
                  !showCreateEvent
                )
              }
            >
              ➕
            </button>
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
              <div>
                📍{" "}
                {currentEvent.location ||
                  "Geheimer Partyort"}
              </div>

              {currentEvent.description && (
                <div>
                  💬{" "}
                  {currentEvent.description}
                </div>
              )}
            </div>
          )}

          {showCreateEvent && (
            <div className="modalBox">
              <h3>
                🎉 Neues Event
              </h3>

              <input
                placeholder="Eventname"
                value={eventTitle}
                onChange={(e) =>
                  setEventTitle(
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
                className="primaryButton"
                onClick={createEvent}
                disabled={loading}
              >
                🚀 Event erstellen
              </button>
            </div>
          )}

          {eventId && (
            <button
              className="dangerButton"
              onClick={deleteEvent}
            >
              🗑️ Event löschen
            </button>
          )}
        </section>

        {/* STATS */}

        <section className="stats">
          <div className="statCard">
            <span>🍺</span>
            <strong>
              {drinks.length}
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
            <span>💶</span>
            <strong>
              {totalPayments.toFixed(2)} €
            </strong>
            <small>Bezahlt</small>
          </div>

          <div className="statCard">
            <span>🏆</span>
            <strong>
              {totalPoints}
            </strong>
            <small>Punkte</small>
          </div>
        </section>

        {/* PEOPLE */}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="sectionEmoji">
                👥
              </span>

              <div>
                <h2>Teilnehmer</h2>
                <small>
                  Wer ist dabei?
                </small>
              </div>
            </div>
          </div>

          <div className="addRow">
            <input
              placeholder="Name eingeben..."
              value={personName}
              onChange={(e) =>
                setPersonName(
                  e.target.value
                )
              }
            />

            <button
              className="primaryButton"
              onClick={addPerson}
              disabled={loading}
            >
              ➕
            </button>
          </div>

          {people.length === 0 ? (
            <div className="empty">
              👀 Noch niemand da.
              <br />
              Sei der Erste!
            </div>
          ) : (
            <div className="peopleList">
              {people.map(
                (person) => {
                  const title =
                    getRankingTitle(
                      person.points
                    );

                  return (
                    <button
                      className="personCard"
                      key={person.id}
                      onClick={() =>
                        setSelectedPerson(
                          person
                        )
                      }
                    >
                      <div className="avatar">
                        {person.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="personInfo">
                        <strong>
                          {person.name}
                        </strong>

                        <small>
                          {title.emoji}{" "}
                          {title.title}
                        </small>

                        <div className="miniStats">
                          🍺{" "}
                          {person.drinks}
                          {" · "}
                          💧{" "}
                          {person.liters.toFixed(
                            1
                          )}{" "}
                          L
                        </div>
                      </div>

                      <div className="personPoints">
                        <strong>
                          {person.points}
                        </strong>

                        <small>
                          Punkte
                        </small>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* DRINK */}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="sectionEmoji">
                🍺
              </span>

              <div>
                <h2>
                  Getränk hinzufügen
                </h2>

                <small>
                  Jeder Schluck zählt
                </small>
              </div>
            </div>
          </div>

          <input
            placeholder="z.B. Krombacher Pils"
            value={drinkName}
            onChange={(e) =>
              setDrinkName(
                e.target.value
              )
            }
          />

          <div className="three">
            <input
              type="number"
              placeholder="Liter"
              value={liters}
              onChange={(e) =>
                setLiters(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Alkohol %"
              value={alcohol}
              onChange={(e) =>
                setAlcohol(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Preis €"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
            />
          </div>

          <button
            className="primaryButton full"
            onClick={saveDrink}
          >
            🍻 Getränk speichern
          </button>
        </section>

        {/* ASSIGN DRINK */}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="sectionEmoji">
                🍻
              </span>

              <div>
                <h2>
                  Wer trinkt was?
                </h2>

                <small>
                  10 Punkte pro Getränk
                </small>
              </div>
            </div>
          </div>

          {people.length === 0 ? (
            <div className="empty">
              👥 Erst Teilnehmer
              hinzufügen.
            </div>
          ) : drinks.length === 0 ? (
            <div className="empty">
              🍺 Noch keine Getränke.
            </div>
          ) : (
            <div>
              {people.map(
                (person) => (
                  <div
                    className="assignment"
                    key={person.id}
                  >
                    <div>
                      <strong>
                        {person.name}
                      </strong>

                      <small>
                        🏆{" "}
                        {person.points}{" "}
                        Punkte
                      </small>
                    </div>

                    <select
                      defaultValue=""
                      onChange={(e) => {
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
                            {drink.getraenk ||
                              drink.drink_name ||
                              "Getränk"}{" "}
                            ·{" "}
                            {Number(
                              drink.preis ??
                                drink.price ??
                                0
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
            </div>
          )}
        </section>

        {/* DRINK LIST */}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="sectionEmoji">
                🍺
              </span>

              <div>
                <h2>
                  Getränke
                </h2>

                <small>
                  {totalDrinkCost.toFixed(
                    2
                  )}{" "}
                  € Gesamtwert
                </small>
              </div>
            </div>
          </div>

          {drinks.length === 0 ? (
            <div className="empty">
              🍻 Noch keine Getränke.
            </div>
          ) : (
            drinks.map(
              (drink) => (
                <div
                  className="drinkItem"
                  key={drink.id}
                >
                  <div className="drinkIcon">
                    🍺
                  </div>

                  <div>
                    <strong>
                      {drink.getraenk ||
                        drink.drink_name ||
                        "Getränk"}
                    </strong>

                    <small>
                      {Number(
                        drink.liters ??
                          drink.menge ??
                          0
                      ).toFixed(
                        1
                      )}{" "}
                      L ·{" "}
                      {Number(
                        drink.alcohol_percent ??
                          drink.alkohol ??
                          0
                      ).toFixed(
                        1
                      )}
                      %
                    </small>
                  </div>

                  <strong>
                    {Number(
                      drink.preis ??
                        drink.price ??
                        0
                    ).toFixed(2)}{" "}
                    €
                  </strong>
                </div>
              )
            )
          )}
        </section>

        {/* PAYMENTS */}

        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="sectionEmoji">
                💶
              </span>

              <div>
                <h2>
                  Zahlungen
                </h2>

                <small>
                  Wer hat was bezahlt?
                </small>
              </div>
            </div>

            <button
              className="iconButton"
              onClick={() =>
                setShowPayment(
                  !showPayment
                )
              }
            >
              ➕
            </button>
          </div>

          {showPayment && (
            <div className="modalBox">
              <h3>
                💶 Zahlung eintragen
              </h3>

              <select
                value={paymentPerson}
                onChange={(e) =>
                  setPaymentPerson(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Person auswählen
                </option>

                {people.map(
                  (person) => (
                    <option
                      key={
                        person.id
                      }
                      value={
                        person.id
                      }
                    >
                      {person.name}
                    </option>
                  )
                )}
              </select>

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

              <input
                placeholder="Wofür?"
                value={
                  paymentDescription
                }
                onChange={(e) =>
                  setPaymentDescription(
                    e.target.value
                  )
                }
              />

              <div className="bonusHint">
                🍺 Tipp: Schreibe
                „Kiste Bier“, um
                <strong>
                  +50 Punkte
                </strong>{" "}
                zu vergeben.
              </div>

              <button
                className="primaryButton full"
                onClick={
                  savePayment
                }
              >
                💶 Zahlung speichern
              </button>
            </div>
          )}

          {payments.length === 0 ? (
            <div className="empty">
              💸 Noch keine Zahlungen.
            </div>
          ) : (
            payments.map(
              (payment) => (
                <div
                  className="paymentItem"
                  key={
                    payment.id
                  }
                >
                  <div className="moneyIcon">
                    💶
                  </div>

                  <div className="paymentInfo">
                    <strong>
                      {getPersonName(
                        payment.profile_id
                      )}
                    </strong>

                    <small>
                      {payment.description ||
                        payment.beschreibung ||
                        "Zahlung"}
                    </small>
                  </div>

                  <strong className="paymentAmount">
                    +
                    {Number(
                      payment.amount ??
                        payment.betrag ??
                        0
                    ).toFixed(2)}{" "}
                    €
                  </strong>
                </div>
              )
            )
          )}
        </section>

        {/* CHALLENGES */}

        <section className="card challengeCard">
          <div className="sectionTitle">
            <div>
              <span className="sectionEmoji">
                🔥
              </span>

              <div>
                <h2>
                  Challenges
                </h2>

                <small>
                  Aufgaben = Punkte
                </small>
              </div>
            </div>

            <button
              className="iconButton"
              onClick={() =>
                setShowChallenge(
                  !showChallenge
                )
              }
            >
              ➕
            </button>
          </div>

          {showChallenge && (
            <div className="modalBox">
              <h3>
                🔥 Neue Challenge
              </h3>

              <input
                placeholder="Challenge"
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
                  Quatsch
                </option>

                <option>
                  Team
                </option>
              </select>

              <div className="three">
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

                <input
                  type="number"
                  placeholder="Stimmen"
                  value={
                    challengeVotes
                  }
                  onChange={(e) =>
                    setChallengeVotes(
                      e.target.value
                    )
                  }
                />
              </div>

              <button
                className="primaryButton full"
                onClick={
                  createChallenge
                }
              >
                🔥 Challenge starten
              </button>
            </div>
          )}

          {challenges.length ===
          0 ? (
            <div className="empty">
              😈 Noch keine Challenge.
              <br />
              Zeit, jemanden
              herauszufordern!
            </div>
          ) : (
            challenges.map(
              (challenge) => (
                <div
                  className="challengeItem"
                  key={
                    challenge.id
                  }
                >
                  <div className="challengeEmoji">
                    {challenge.category ===
                    "Duell"
                      ? "⚔️"
                      : challenge.category ===
                        "Mutprobe"
                      ? "😈"
                      : challenge.category ===
                        "Geschicklichkeit"
                      ? "🎯"
                      : "🔥"}
                  </div>

                  <div>
                    <strong>
                      {challenge.title}
                    </strong>

                    <small>
                      {challenge.description ||
                        "Aufgabe wartet!"}
                    </small>

                    <span className="challengeCategory">
                      {challenge.category ||
                        "Fun"}
                    </span>
                  </div>

                  <div className="challengePoints">
                    +{" "}
                    {Number(
                      challenge.points ||
                        0
                    )}
                  </div>
                </div>
              )
            )
          )}
        </section>

        {/* RANKING */}

        <section className="card rankingCard">
          <div className="sectionTitle">
            <div>
              <span className="sectionEmoji">
                🏆
              </span>

              <div>
                <h2>
                  Hall of Fame
                </h2>

                <small>
                  Wer regiert den
                  Zapfhahn?
                </small>
              </div>
            </div>
          </div>

          {ranking.length ===
          0 ? (
            <div className="empty">
              🏆 Noch niemand im
              Ranking.
            </div>
          ) : (
            ranking.map(
              (
                person,
                index
              ) => {
                const title =
                  getRankingTitle(
                    person.points
                  );

                return (
                  <button
                    className={
                      "rankItem " +
                      (index ===
                      0
                        ? "first"
                        : "")
                    }
                    key={
                      person.id
                    }
                    onClick={() =>
                      setSelectedPerson(
                        person
                      )
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
                        : index +
                          1}
                    </div>

                    <div className="rankAvatar">
                      {person.name
                        .charAt(
                          0
                        )
                        .toUpperCase()}
                    </div>

                    <div className="rankName">
                      <strong>
                        {person.name}
                      </strong>

                      <small>
                        {title.emoji}{" "}
                        {
                          title.title
                        }
                      </small>
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
                  </button>
                );
              }
            )
          )}
        </section>

        {/* MESSAGE */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {/* PERSON DETAIL */}

        {selectedPerson && (
          <div
            className="modalBackdrop"
            onClick={() =>
              setSelectedPerson(
                null
              )
            }
          >
            <div
              className="personModal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <button
                className="closeButton"
                onClick={() =>
                  setSelectedPerson(
                    null
                  )
                }
              >
                ×
              </button>

              <div className="bigAvatar">
                {selectedPerson.name
                  .charAt(
                    0
                  )
                  .toUpperCase()}
              </div>

              <h2>
                {
                  selectedPerson.name
                }
              </h2>

              <div className="bigTitle">
                {
                  getRankingTitle(
                    selectedPerson.points
                  ).emoji
                }{" "}
                {
                  getRankingTitle(
                    selectedPerson.points
                  ).title
                }
              </div>

              <div className="detailStats">
                <div>
                  <strong>
                    {
                      selectedPerson.points
                    }
                  </strong>

                  <small>
                    Punkte
                  </small>
                </div>

                <div>
                  <strong>
                    {
                      selectedPerson.drinks
                    }
                  </strong>

                  <small>
                    Getränke
                  </small>
                </div>

                <div>
                  <strong>
                    {selectedPerson.liters.toFixed(
                      1
                    )}
                  </strong>

                  <small>
                    Liter
                  </small>
                </div>

                <div>
                  <strong>
                    {selectedPerson.cost.toFixed(
                      2
                    )}{" "}
                    €
                  </strong>

                  <small>
                    Getränke
                  </small>
                </div>
              </div>

              <h3>
                ⭐ Punkte-Historie
              </h3>

              <div className="history">
                {pointHistory
                  .filter(
                    (item) =>
                      item.profile_id ===
                      selectedPerson.id
                  )
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        className="historyItem"
                        key={
                          item.id ||
                          index
                        }
                      >
                        <span>
                          ⭐
                        </span>

                        <div>
                          <strong>
                            {item.reason ||
                              item.description ||
                              item.source ||
                              "Punkte"}
                          </strong>

                          <small>
                            {item.description &&
                            item.reason
                              ? item.description
                              : ""}
                          </small>
                        </div>

                        <b>
                          +
                          {Number(
                            item.points ??
                              item.amount ??
                              0
                          )}
                        </b>
                      </div>
                    )
                  )}

                {pointHistory.filter(
                  (item) =>
                    item.profile_id ===
                    selectedPerson.id
                ).length ===
                  0 && (
                  <div className="empty">
                    ⭐ Noch keine
                    Punkte-Historie.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
            Getränke. Deine
            Runde.
          </small>
        </footer>
      </div>

      <style jsx global>{`
        /*
        =====================================================
        GLOBAL
        =====================================================
        */

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          min-height: 100%;
          background: #070b12 !important;
          overflow-x: hidden;
        }

        body {
          color: white;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
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

        /*
        =====================================================
        APP
        =====================================================
        */

        .app {
          position: relative;
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0 14px 40px;
          overflow: hidden;

          background:
            radial-gradient(
              circle at 50% -10%,
              #263d55 0%,
              #111a26 30%,
              #070b12 70%
            );

          color: #fff;
        }

        .container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .backgroundGlow {
          position: fixed;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.18;
          pointer-events: none;
          z-index: 0;
        }

        .glow1 {
          background: #f59e0b;
          top: -150px;
          left: -120px;
        }

        .glow2 {
          background: #8b5cf6;
          right: -150px;
          top: 400px;
        }

        /*
        =====================================================
        HERO
        =====================================================
        */

        .hero {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 32px 4px 24px;
        }

        .logoBox {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 76px;
          height: 76px;
          border-radius: 24px;

          background:
            linear-gradient(
              145deg,
              #fbbf24,
              #f59e0b
            );

          box-shadow:
            0 15px 40px
              rgba(245, 158, 11, 0.25),
            inset 0 1px 0
              rgba(255, 255, 255, 0.35);

          font-size: 40px;
          transform: rotate(-4deg);
        }

        .eyebrow {
          color: #fbbf24;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.8px;
          margin-bottom: 4px;
        }

        h1 {
          margin: 0;
          font-size: clamp(
            25px,
            6vw,
            43px
          );
          line-height: 0.98;
          letter-spacing: -1.8px;
        }

        h1 span {
          color: #fbbf24;
        }

        .hero p {
          margin: 9px 0 0;
          color: #94a3b8;
          font-size: 14px;
        }

        /*
        =====================================================
        CARDS
        =====================================================
        */

        .card {
          position: relative;
          margin-bottom: 14px;
          padding: 19px;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,0.075),
              rgba(255,255,255,0.035)
            );

          border:
            1px solid
            rgba(255,255,255,0.09);

          border-radius: 24px;

          box-shadow:
            0 18px 50px
              rgba(0,0,0,0.18);

          backdrop-filter:
            blur(15px);
        }

        .sectionTitle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .sectionTitle > div:first-child {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .sectionEmoji {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 45px;
          height: 45px;

          border-radius: 15px;

          background:
            rgba(251,191,36,0.11);

          font-size: 23px;
        }

        h2 {
          margin: 0;
          font-size: 20px;
        }

        .sectionTitle small {
          display: block;
          margin-top: 3px;
          color: #7f8da0;
          font-size: 11px;
        }

        /*
        =====================================================
        INPUTS
        =====================================================
        */

        input,
        select,
        textarea {
          width: 100%;
          margin-bottom: 10px;
          padding: 13px 14px;

          color: white;

          background:
            rgba(5,9,15,0.72);

          border:
            1px solid
            rgba(255,255,255,0.1);

          border-radius: 13px;
          outline: none;

          transition:
            0.2s ease;
        }

        textarea {
          min-height: 90px;
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #fbbf24;

          box-shadow:
            0 0 0 3px
              rgba(251,191,36,0.08);
        }

        option {
          background: #111827;
          color: white;
        }

        /*
        =====================================================
        BUTTONS
        =====================================================
        */

        button {
          border: 0;
          cursor: pointer;
        }

        .primaryButton {
          padding: 13px 18px;

          color: #17120a;

          font-weight: 900;

          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );

          border-radius: 13px;

          box-shadow:
            0 10px 25px
              rgba(245,158,11,0.15);

          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease;
        }

        .primaryButton:hover {
          transform:
            translateY(-2px);
        }

        .primaryButton:active {
          transform:
            translateY(1px);
        }

        .primaryButton.full {
          width: 100%;
        }

        .iconButton {
          width: 43px;
          height: 43px;

          border-radius: 14px;

          color: #111;
          background: #fbbf24;

          font-size: 18px;
          font-weight: 900;
        }

        .dangerButton {
          width: 100%;
          padding: 10px;

          color: #fca5a5;
          background:
            rgba(239,68,68,0.08);

          border:
            1px solid
            rgba(239,68,68,0.18);

          border-radius: 12px;
          margin-top: 4px;
        }

        /*
        =====================================================
        EVENT
        =====================================================
        */

        .bigSelect {
          font-size: 16px;
          font-weight: 700;
          padding: 15px;
        }

        .eventInfo {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
          color: #94a3b8;
          font-size: 12px;
        }

        .eventInfo div {
          padding: 7px 10px;
          background:
            rgba(255,255,255,0.04);
          border-radius: 9px;
        }

        .modalBox {
          margin-top: 12px;
          padding: 15px;

          background:
            rgba(0,0,0,0.22);

          border-radius: 17px;
          border:
            1px solid
            rgba(255,255,255,0.07);
        }

        .modalBox h3 {
          margin-top: 0;
        }

        /*
        =====================================================
        STATS
        =====================================================
        */

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4,1fr);
          gap: 9px;
          margin-bottom: 14px;
        }

        .statCard {
          padding: 15px 8px;
          text-align: center;

          background:
            rgba(255,255,255,0.055);

          border:
            1px solid
            rgba(255,255,255,0.07);

          border-radius: 18px;
        }

        .statCard span {
          display: block;
          font-size: 21px;
        }

        .statCard strong {
          display: block;
          margin: 4px 0;

          color: #fbbf24;

          font-size: 19px;
        }

        .statCard small {
          color: #718096;
          font-size: 10px;
        }

        /*
        =====================================================
        PEOPLE
        =====================================================
        */

        .addRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .addRow input {
          margin: 0;
        }

        .peopleList {
          display: grid;
          gap: 8px;
          margin-top: 12px;
        }

        .personCard {
          display: grid;
          grid-template-columns:
            48px 1fr auto;
          align-items: center;
          gap: 11px;

          width: 100%;
          padding: 11px;

          text-align: left;
          color: white;

          background:
            rgba(255,255,255,0.045);

          border:
            1px solid
            rgba(255,255,255,0.06);

          border-radius: 16px;

          transition:
            transform 0.15s ease,
            background 0.15s ease;
        }

        .personCard:hover {
          transform:
            translateX(3px);

          background:
            rgba(255,255,255,0.07);
        }

        .avatar,
        .rankAvatar {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 48px;
          height: 48px;

          border-radius: 15px;

          color: #111;
          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #fb923c
            );

          font-weight: 900;
          font-size: 19px;
        }

        .personInfo strong,
        .personInfo small {
          display: block;
        }

        .personInfo small {
          color: #fbbf24;
          margin-top: 2px;
          font-size: 11px;
        }

        .miniStats {
          margin-top: 5px;
          color: #718096;
          font-size: 10px;
        }

        .personPoints {
          text-align: right;
        }

        .personPoints strong {
          display: block;
          color: #fbbf24;
          font-size: 21px;
        }

        .personPoints small {
          color: #64748b;
          font-size: 9px;
        }

        /*
        =====================================================
        ASSIGNMENTS
        =====================================================
        */

        .assignment {
          display: grid;
          grid-template-columns:
            1fr 1.4fr;
          align-items: center;
          gap: 10px;

          margin-bottom: 8px;
          padding: 10px 12px;

          background:
            rgba(255,255,255,0.035);

          border-radius: 14px;
        }

        .assignment strong,
        .assignment small {
          display: block;
        }

        .assignment small {
          color: #fbbf24;
          font-size: 10px;
          margin-top: 3px;
        }

        .assignment select {
          margin: 0;
        }

        /*
        =====================================================
        DRINKS
        =====================================================
        */

        .drinkItem {
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          align-items: center;
          gap: 10px;

          margin-top: 8px;
          padding: 11px;

          background:
            rgba(255,255,255,0.04);

          border-radius: 15px;
        }

        .drinkIcon {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 43px;
          height: 43px;

          border-radius: 13px;

          background:
            rgba(251,191,36,0.1);

          font-size: 21px;
        }

        .drinkItem strong,
        .drinkItem small {
          display: block;
        }

        .drinkItem small {
          margin-top: 3px;
          color: #718096;
          font-size: 10px;
        }

        /*
        =====================================================
        PAYMENTS
        =====================================================
        */

        .paymentItem {
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          align-items: center;
          gap: 10px;

          padding: 12px;
          margin-top: 8px;

          background:
            rgba(255,255,255,0.04);

          border-radius: 15px;
        }

        .moneyIcon {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 43px;
          height: 43px;

          border-radius: 13px;

          background:
            rgba(34,197,94,0.09);

          font-size: 21px;
        }

        .paymentInfo strong,
        .paymentInfo small {
          display: block;
        }

        .paymentInfo small {
          margin-top: 3px;
          color: #718096;
          font-size: 10px;
        }

        .paymentAmount {
          color: #4ade80;
        }

        .bonusHint {
          margin: 4px 0 12px;
          padding: 10px;

          color: #fbbf24;
          background:
            rgba(251,191,36,0.06);

          border-radius: 10px;
          font-size: 11px;
        }

        /*
        =====================================================
        CHALLENGES
        =====================================================
        */

        .challengeCard {
          background:
            linear-gradient(
              145deg,
              rgba(139,92,246,0.12),
              rgba(255,255,255,0.035)
            );
        }

        .challengeItem {
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          align-items: center;
          gap: 10px;

          margin-top: 8px;
          padding: 12px;

          background:
            rgba(255,255,255,0.045);

          border:
            1px solid
            rgba(139,92,246,0.12);

          border-radius: 15px;
        }

        .challengeEmoji {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 43px;
          height: 43px;

          border-radius: 13px;

          background:
            rgba(139,92,246,0.13);

          font-size: 21px;
        }

        .challengeItem strong,
        .challengeItem small {
          display: block;
        }

        .challengeItem small {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
        }

        .challengeCategory {
          display: inline-block;
          margin-top: 5px;
          padding: 3px 7px;

          color: #c4b5fd;
          background:
            rgba(139,92,246,0.12);

          border-radius: 6px;
          font-size: 8px;
        }

        .challengePoints {
          color: #fbbf24;
          font-size: 18px;
          font-weight: 900;
        }

        /*
        =====================================================
        RANKING
        =====================================================
        */

        .rankingCard {
          background:
            linear-gradient(
              145deg,
              rgba(251,191,36,0.09),
              rgba(255,255,255,0.035)
            );
        }

        .rankItem {
          display: grid;
          grid-template-columns:
            38px 43px 1fr auto;
          align-items: center;
          gap: 9px;

          width: 100%;

          margin-top: 8px;
          padding: 10px;

          color: white;
          text-align: left;

          background:
            rgba(255,255,255,0.04);

          border:
            1px solid
            rgba(255,255,255,0.06);

          border-radius: 15px;
        }

        .rankItem.first {
          background:
            linear-gradient(
              100deg,
              rgba(251,191,36,0.14),
              rgba(255,255,255,0.04)
            );

          border-color:
            rgba(251,191,36,0.22);
        }

        .rankPlace {
          text-align: center;
          font-size: 19px;
        }

        .rankAvatar {
          width: 43px;
          height: 43px;
          border-radius: 13px;
          font-size: 16px;
        }

        .rankName strong,
        .rankName small {
          display: block;
        }

        .rankName small {
          color: #fbbf24;
          font-size: 9px;
          margin-top: 3px;
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
          color: #64748b;
          font-size: 8px;
        }

        /*
        =====================================================
        EMPTY / MESSAGE
        =====================================================
        */

        .empty {
          padding: 24px 10px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
        }

        .message {
          position: sticky;
          bottom: 15px;
          z-index: 30;

          margin: 12px 0;
          padding: 13px 15px;

          color: #fbbf24;

          background:
            rgba(20,27,38,0.95);

          border:
            1px solid
            rgba(251,191,36,0.18);

          border-radius: 14px;

          box-shadow:
            0 15px 40px
              rgba(0,0,0,0.3);

          backdrop-filter:
            blur(15px);
        }

        /*
        =====================================================
        PERSON MODAL
        =====================================================
        */

        .modalBackdrop {
          position: fixed;
          inset: 0;
          z-index: 100;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 18px;

          background:
            rgba(0,0,0,0.72);

          backdrop-filter:
            blur(10px);
        }

        .personModal {
          position: relative;

          width: 100%;
          max-width: 560px;
          max-height: 90vh;

          overflow-y: auto;

          padding: 24px;

          text-align: center;

          background:
            linear-gradient(
              145deg,
              #172231,
              #0b111a
            );

          border:
            1px solid
            rgba(255,255,255,0.1);

          border-radius: 25px;

          box-shadow:
            0 30px 100px
              rgba(0,0,0,0.55);
        }

        .closeButton {
          position: absolute;
          right: 15px;
          top: 15px;

          width: 35px;
          height: 35px;

          color: white;
          background:
            rgba(255,255,255,0.08);

          border-radius: 50%;

          font-size: 21px;
        }

        .bigAvatar {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 82px;
          height: 82px;

          margin: 5px auto 12px;

          border-radius: 25px;

          color: #111;

          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #fb923c
            );

          font-size: 34px;
          font-weight: 900;
        }

        .personModal h2 {
          font-size: 27px;
        }

        .bigTitle {
          margin-top: 5px;
          color: #fbbf24;
          font-weight: 800;
        }

        .detailStats {
          display: grid;
          grid-template-columns:
            repeat(4,1fr);

          gap: 7px;
          margin: 20px 0;
        }

        .detailStats div {
          padding: 10px 5px;

          background:
            rgba(255,255,255,0.045);

          border-radius: 12px;
        }

        .detailStats strong,
        .detailStats small {
          display: block;
        }

        .detailStats strong {
          color: #fbbf24;
        }

        .detailStats small {
          color: #64748b;
          margin-top: 3px;
          font-size: 8px;
        }

        .personModal h3 {
          text-align: left;
          margin-top: 22px;
        }

        .history {
          text-align: left;
        }

        .historyItem {
          display: grid;
          grid-template-columns:
            30px 1fr auto;
          align-items: center;
          gap: 8px;

          margin-top: 7px;
          padding: 10px;

          background:
            rgba(255,255,255,0.045);

          border-radius: 12px;
        }

        .historyItem span {
          font-size: 17px;
        }

        .historyItem strong,
        .historyItem small {
          display: block;
        }

        .historyItem small {
          color: #718096;
          font-size: 9px;
          margin-top: 2px;
        }

        .historyItem b {
          color: #4ade80;
        }

        /*
        =====================================================
        PARTY ANIMATIONS
        =====================================================
        */

        .partyOverlay {
          position: fixed;
          inset: 0;
          z-index: 200;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          background:
            rgba(3,7,12,0.7);

          backdrop-filter:
            blur(8px);

          animation:
            overlayIn 0.2s ease;
        }

        .beerClash {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;

          font-size: 75px;

          animation:
            cheers 1.5s
            cubic-bezier(.2,.8,.2,1);
        }

        .beerClash span:nth-child(1) {
          transform: rotate(-22deg);
        }

        .beerClash span:nth-child(3) {
          transform: rotate(22deg);
        }

        .prost {
          margin-top: 5px;

          color: #fbbf24;

          font-size: 54px;
          font-weight: 1000;
          letter-spacing: -2px;

          text-shadow:
            0 0 25px
              rgba(251,191,36,0.5);

          animation:
            popIn 0.45s
            0.25s both;
        }

        .prostSub {
          margin-top: 3px;
          color: white;
          font-size: 16px;
          font-weight: 800;

          animation:
            popIn 0.45s
            0.4s both;
        }

        .moneyRain {
          position: fixed;
          inset: 0;
          z-index: 190;

          pointer-events: none;
          overflow: hidden;
        }

        .moneyRain span {
          position: absolute;
          top: -60px;

          font-size: 30px;

          animation:
            moneyFall 2.4s
            linear both;
        }

        .pointsPop {
          position: fixed;
          left: 50%;
          top: 28%;
          z-index: 210;

          transform:
            translateX(-50%);

          padding: 13px 21px;

          color: #111;

          background: #fbbf24;

          border-radius: 999px;

          font-size: 21px;
          font-weight: 1000;

          box-shadow:
            0 15px 50px
              rgba(251,191,36,0.4);

          animation:
            pointsFloat 1.5s ease both;
        }

        /*
        =====================================================
        FOOTER
        =====================================================
        */

        footer {
          padding: 35px 10px 10px;
          text-align: center;
          color: #475569;
        }

        footer div {
          font-size: 28px;
          margin-bottom: 5px;
        }

        footer strong,
        footer small {
          display: block;
        }

        footer strong {
          color: #64748b;
        }

        footer small {
          margin-top: 4px;
          font-size: 10px;
        }

        /*
        =====================================================
        ANIMATION KEYFRAMES
        =====================================================
        */

        @keyframes cheers {
          0% {
            transform:
              scale(0.4)
              translateY(30px);
            opacity: 0;
          }

          30% {
            transform:
              scale(1.15)
              translateY(0);
            opacity: 1;
          }

          55% {
            transform:
              scale(0.96)
              rotate(-3deg);
          }

          70% {
            transform:
              scale(1.03)
              rotate(3deg);
          }

          100% {
            transform:
              scale(1)
              rotate(0);
          }
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform:
              translateY(20px)
              scale(0.7);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes moneyFall {
          0% {
            transform:
              translateY(-80px)
              rotate(0deg);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          100% {
            transform:
              translateY(110vh)
              rotate(540deg);
            opacity: 0;
          }
        }

        @keyframes pointsFloat {
          0% {
            opacity: 0;
            transform:
              translate(-50%, 40px)
              scale(0.6);
          }

          25% {
            opacity: 1;
            transform:
              translate(-50%, 0)
              scale(1.1);
          }

          70% {
            opacity: 1;
            transform:
              translate(-50%, -20px)
              scale(1);
          }

          100% {
            opacity: 0;
            transform:
              translate(-50%, -80px)
              scale(0.9);
          }
        }

        /*
        =====================================================
        MOBILE
        =====================================================
        */

        @media (max-width: 650px) {
          .app {
            padding-left: 10px;
            padding-right: 10px;
          }

          .hero {
            padding-top: 22px;
          }

          .logoBox {
            width: 60px;
            height: 60px;
            border-radius: 19px;
            font-size: 31px;
          }

          h1 {
            font-size: 27px;
          }

          .hero p {
            font-size: 12px;
          }

          .stats {
            grid-template-columns:
              repeat(2,1fr);
          }

          .three {
            grid-template-columns:
              1fr;
          }

          .addRow {
            grid-template-columns:
              1fr;
          }

          .addRow .primaryButton {
            width: 100%;
          }

          .assignment {
            grid-template-columns:
              1fr;
          }

          .assignment select {
            width: 100%;
          }

          .detailStats {
            grid-template-columns:
              repeat(2,1fr);
          }

          .rankItem {
            grid-template-columns:
              35px 40px 1fr auto;
          }

          .rankAvatar {
            width: 40px;
            height: 40px;
          }

          .beerClash {
            font-size: 58px;
          }

          .prost {
            font-size: 43px;
          }
        }
      `}</style>
    </main>
  );
}
