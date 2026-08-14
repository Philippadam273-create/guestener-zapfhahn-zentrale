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
  photo_required?: boolean | null;
  ai_recognition_enabled?: boolean | null;
  manual_entry_allowed?: boolean | null;
  cost_overview_enabled?: boolean | null;
  auto_split_costs?: boolean | null;
  team_mode?: boolean | null;
  show_photos?: boolean | null;
  show_costs?: boolean | null;
  privacy_mode?: boolean | null;
};

type Drink = {
  id: string;
  event_id: string;
  getraenk?: string | null;
  drink_name?: string | null;
  menge?: number | null;
  liters?: number | null;
  alkohol?: number | null;
  alcohol_percent?: number | null;
  preis?: number | null;
  price?: number | null;
  quantity?: number | null;
  photo_url?: string | null;
};

type Person = {
  id: number;
  name: string;
  weight: number;
  gender: "m" | "w";
  drinks: number;
  liters: number;
  alcoholGrams: number;
  cost: number;
  points: number;
  promille: number;
  team?: string;
};

type Challenge = {
  id: number;
  title: string;
  description: string;
  points: number;
  completed: boolean;
};

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: "🍺 Erste Runde",
    description: "Das erste Getränk zuordnen.",
    points: 10,
    completed: false,
  },
  {
    id: 2,
    title: "🔥 Zehn Getränke",
    description: "Insgesamt zehn Getränke zuordnen.",
    points: 50,
    completed: false,
  },
  {
    id: 3,
    title: "🏆 Punktejäger",
    description: "100 Punkte erreichen.",
    points: 100,
    completed: false,
  },
  {
    id: 4,
    title: "💧 Litermeister",
    description: "5 Liter Getränke erreichen.",
    points: 75,
    completed: false,
  },
  {
    id: 5,
    title: "🍻 Durchstarter",
    description: "An drei verschiedenen Getränken teilnehmen.",
    points: 30,
    completed: false,
  },
];

function numberValue(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function drinkName(drink: Drink) {
  return drink.getraenk || drink.drink_name || "Getränk";
}

function drinkLiters(drink: Drink) {
  return numberValue(drink.liters ?? drink.menge);
}

function drinkAlcohol(drink: Drink) {
  return numberValue(drink.alcohol_percent ?? drink.alkohol);
}

function drinkPrice(drink: Drink) {
  return numberValue(drink.preis ?? drink.price);
}

function calculatePromille(person: Person) {
  /*
   * Vereinfachte Widmark-Näherung.
   * Das ist KEIN medizinisches Messverfahren.
   * Für die App dient es ausschließlich als Schätzwert.
   */
  const r = person.gender === "w" ? 0.55 : 0.68;
  const alcoholKg = person.alcoholGrams / 1000;

  if (person.weight <= 0) return 0;

  const value = (alcoholKg / (person.weight * r)) * 1000;

  return Math.max(0, value);
}

function createPerson(name: string): Person {
  return {
    id: Date.now() + Math.floor(Math.random() * 10000),
    name,
    weight: 82,
    gender: "m",
    drinks: 0,
    liters: 0,
    alcoholGrams: 0,
    cost: 0,
    points: 0,
    promille: 0,
    team: "",
  };
}

export default function Home() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventId, setEventId] = useState("");

  const [event, setEvent] = useState<EventRow | null>(null);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [drinkNameInput, setDrinkNameInput] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "participants" | "drinks" | "challenges" | "stats"
  >("dashboard");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(
    null
  );

  const [personWeight, setPersonWeight] = useState("82");
  const [personGender, setPersonGender] = useState<"m" | "w">("m");

  const [challenges, setChallenges] = useState<Challenge[]>(
    DEFAULT_CHALLENGES
  );

  const [showInvite, setShowInvite] = useState(false);
  const [showPromilleInfo, setShowPromilleInfo] = useState(false);

  async function loadEvents() {
    const result = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (result.error) {
      setMessage("❌ Events konnten nicht geladen werden.");
      return;
    }

    const data = (result.data || []) as EventRow[];

    setEvents(data);

    if (!eventId && data.length > 0) {
      setEventId(data[0].id);
    }
  }

  async function loadEventData(id: string) {
    if (!id) return;

    setLoading(true);

    const eventResult = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (!eventResult.error && eventResult.data) {
      setEvent(eventResult.data as EventRow);
    }

    const drinksResult = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (!drinksResult.error) {
      setDrinks((drinksResult.data || []) as Drink[]);
    }

    const savedPeople = localStorage.getItem(
      "guester-people-" + id
    );

    if (savedPeople) {
      try {
        setPeople(JSON.parse(savedPeople));
      } catch {
        setPeople([]);
      }
    } else {
      setPeople([]);
    }

    const savedChallenges = localStorage.getItem(
      "guester-challenges-" + id
    );

    if (savedChallenges) {
      try {
        setChallenges(JSON.parse(savedChallenges));
      } catch {
        setChallenges(DEFAULT_CHALLENGES);
      }
    } else {
      setChallenges(DEFAULT_CHALLENGES);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    loadEventData(eventId);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guester-people-" + eventId,
      JSON.stringify(people)
    );
  }, [people, eventId]);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guester-challenges-" + eventId,
      JSON.stringify(challenges)
    );
  }, [challenges, eventId]);

  const totalLiters = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum + drinkLiters(drink) * numberValue(drink.quantity || 1),
      0
    );
  }, [drinks]);

  const totalCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum + drinkPrice(drink) * numberValue(drink.quantity || 1),
      0
    );
  }, [drinks]);

  const totalAlcohol = useMemo(() => {
    return drinks.reduce((sum, drink) => {
      const litersValue = drinkLiters(drink);
      const alcoholValue = drinkAlcohol(drink);

      return (
        sum +
        litersValue *
          1000 *
          (alcoholValue / 100) *
          0.789
      );
    }, 0);
  }, [drinks]);

  const totalPoints = people.reduce(
    (sum, person) => sum + person.points,
    0
  );

  const costPerPerson =
    people.length > 0 ? totalCost / people.length : 0;

  const ranking = [...people].sort(
    (a, b) => b.points - a.points
  );

  const selectedPerson =
    people.find((p) => p.id === selectedPersonId) || null;

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkNameInput.trim()) {
      setMessage("❌ Bitte ein Getränk eingeben.");
      return;
    }

    setLoading(true);

    const payload = {
      event_id: eventId,
      getraenk: drinkNameInput.trim(),
      drink_name: drinkNameInput.trim(),
      menge: numberValue(liters),
      liters: numberValue(liters),
      alkohol: numberValue(alcohol),
      alcohol_percent: numberValue(alcohol),
      preis: numberValue(price),
      price: numberValue(price),
      quantity: 1,
    };

    const result = await supabase
      .from("drinks")
      .insert([payload]);

    setLoading(false);

    if (result.error) {
      setMessage("❌ " + result.error.message);
      return;
    }

    setMessage("✅ Getränk gespeichert.");

    setDrinkNameInput("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    await loadEventData(eventId);
  }

  function addPerson() {
    setMessage("");

    const name = personName.trim();

    if (!name) {
      setMessage("❌ Bitte einen Namen eingeben.");
      return;
    }

    if (
      people.some(
        (p) =>
          p.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setMessage("❌ Teilnehmer bereits vorhanden.");
      return;
    }

    const person = createPerson(name);

    person.weight = numberValue(personWeight) || 82;
    person.gender = personGender;

    setPeople((current) => [...current, person]);

    setPersonName("");

    setMessage("✅ Teilnehmer hinzugefügt.");
  }

  function updatePerson(id: number, changes: Partial<Person>) {
    setPeople((current) =>
      current.map((person) => {
        if (person.id !== id) return person;

        const updated = {
          ...person,
          ...changes,
        };

        updated.promille = calculatePromille(updated);

        return updated;
      })
    );
  }

  function assignDrink(
    personId: number,
    drinkId: string
  ) {
    const drink = drinks.find(
      (d) => String(d.id) === String(drinkId)
    );

    if (!drink) return;

    const litersValue = drinkLiters(drink);
    const alcoholValue = drinkAlcohol(drink);
    const priceValue = drinkPrice(drink);

    const alcoholGrams =
      litersValue *
      1000 *
      (alcoholValue / 100) *
      0.789;

    setPeople((current) =>
      current.map((person) => {
        if (person.id !== personId) {
          return person;
        }

        const updated: Person = {
          ...person,
          drinks: person.drinks + 1,
          liters: person.liters + litersValue,
          alcoholGrams:
            person.alcoholGrams + alcoholGrams,
          cost: person.cost + priceValue,
          points: person.points + 10,
        };

        updated.promille = calculatePromille(updated);

        return updated;
      })
    );

    setMessage("🍺 Getränk zugeordnet! +10 Punkte");

    checkChallenges();
  }

  function removePerson(id: number) {
    setPeople((current) =>
      current.filter((person) => person.id !== id)
    );

    if (selectedPersonId === id) {
      setSelectedPersonId(null);
    }
  }

  function checkChallenges() {
    setTimeout(() => {
      setChallenges((current) =>
        current.map((challenge) => {
          if (challenge.completed) return challenge;

          const totalDrinks = people.reduce(
            (sum, p) => sum + p.drinks,
            0
          );

          if (
            challenge.id === 1 &&
            totalDrinks >= 1
          ) {
            return {
              ...challenge,
              completed: true,
            };
          }

          if (
            challenge.id === 2 &&
            totalDrinks >= 10
          ) {
            return {
              ...challenge,
              completed: true,
            };
          }

          if (
            challenge.id === 3 &&
            totalPoints >= 100
          ) {
            return {
              ...challenge,
              completed: true,
            };
          }

          if (
            challenge.id === 4 &&
            totalLiters >= 5
          ) {
            return {
              ...challenge,
              completed: true,
            };
          }

          return challenge;
        })
      );
    }, 100);
  }

  function copyInviteCode() {
    if (!event?.invite_code) {
      setMessage("❌ Für dieses Event gibt es keinen Einladungscode.");
      return;
    }

    navigator.clipboard
      ?.writeText(event.invite_code)
      .then(() => {
        setMessage("✅ Einladungscode kopiert.");
      })
      .catch(() => {
        setMessage("🔑 Einladungscode: " + event.invite_code);
      });
  }

  function copyInviteLink() {
    if (!event?.invite_code) {
      setMessage("❌ Kein Einladungscode vorhanden.");
      return;
    }

    const url =
      window.location.origin +
      "/?invite=" +
      encodeURIComponent(event.invite_code);

    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setMessage("🔗 Einladungslink kopiert.");
      })
      .catch(() => {
        setMessage(url);
      });
  }

  return (
    <main className="page">
      <div className="appShell">

        {/* HEADER */}
        <header className="header">

          <button
            className="crateButton"
            onClick={() =>
              setActiveTab("dashboard")
            }
            aria-label="Bierkiste"
          >
            <span className="crate">
              <span className="crateTop">
                🍺 🍺 🍺
              </span>
              <span className="crateBody">
                BIER
              </span>
            </span>
          </button>

          <div className="brand">
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Events · Getränke · Kosten · Rankings
            </p>
          </div>

          <button
            className="inviteTop"
            onClick={() =>
              setShowInvite(true)
            }
          >
            🔑
            <span>Einladen</span>
          </button>
        </header>

        {/* EVENT */}
        <section className="card eventCard">

          <div className="sectionTitle">
            <div>
              <h2>📅 Aktuelles Event</h2>
              <p>
                Wähle das Event, an dem du teilnehmen möchtest.
              </p>
            </div>

            {event?.invite_code && (
              <button
                className="codeButton"
                onClick={() =>
                  setShowInvite(true)
                }
              >
                🔑 {event.invite_code}
              </button>
            )}
          </div>

          <select
            value={eventId}
            onChange={(e) =>
              setEventId(e.target.value)
            }
          >
            <option value="">
              Event auswählen
            </option>

            {events.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.title}
              </option>
            ))}
          </select>

          {event?.description && (
            <p className="eventDescription">
              {event.description}
            </p>
          )}
        </section>

        {/* STATS */}
        <section className="stats">

          <div className="stat">
            <span>🍺</span>
            <strong>{drinks.length}</strong>
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
            <strong>{people.length}</strong>
            <small>Teilnehmer</small>
          </div>

        </section>

        {/* NAVIGATION */}
        <nav className="tabs">

          <button
            className={
              activeTab === "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("dashboard")
            }
          >
            🏠 Übersicht
          </button>

          <button
            className={
              activeTab === "participants"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("participants")
            }
          >
            👥 Teilnehmer
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
            🍺 Getränke
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
            ⚔️ Challenges
          </button>

          <button
            className={
              activeTab === "stats"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("stats")
            }
          >
            📊 Statistik
          </button>

        </nav>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <section className="card heroCard">

              <div className="heroIcon">
                🍻
              </div>

              <div>
                <h2>
                  Willkommen beim Zapfhahn
                </h2>

                <p>
                  Verwalte Getränke, Teilnehmer,
                  Punkte, Kosten, Promille und Challenges
                  an einem Ort.
                </p>
              </div>

            </section>

            <section className="card">

              <div className="sectionTitle">
                <div>
                  <h2>👥 Teilnehmer</h2>
                  <p>
                    Neue Teilnehmer hinzufügen
                  </p>
                </div>
              </div>

              <div className="row">

                <input
                  placeholder="Name"
                  value={personName}
                  onChange={(e) =>
                    setPersonName(e.target.value)
                  }
                />

                <button
                  onClick={addPerson}
                >
                  ➕ Hinzufügen
                </button>

              </div>

            </section>

            <section className="card">

              <h2>
                🍺 Getränk hinzufügen
              </h2>

              <input
                placeholder="Getränk"
                value={drinkNameInput}
                onChange={(e) =>
                  setDrinkNameInput(e.target.value)
                }
              />

              <div className="three">

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={liters}
                  onChange={(e) =>
                    setLiters(e.target.value)
                  }
                  placeholder="Liter"
                />

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={alcohol}
                  onChange={(e) =>
                    setAlcohol(e.target.value)
                  }
                  placeholder="Alkohol %"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value)
                  }
                  placeholder="Preis €"
                />

              </div>

              <button
                className="saveButton"
                onClick={saveDrink}
                disabled={loading}
              >
                {loading
                  ? "⏳ Speichert..."
                  : "🍻 Getränk speichern"}
              </button>

            </section>

            <section className="card">

              <h2>🏆 Ranking</h2>

              {ranking.length === 0 ? (
                <p>
                  Noch keine Teilnehmer.
                </p>
              ) : (
                ranking.slice(0, 5).map(
                  (person, index) => (
                    <div
                      className="rank"
                      key={person.id}
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
                        {person.name}
                      </span>

                      <b>
                        {person.points} Punkte
                      </b>
                    </div>
                  )
                )
              )}

              {ranking.length > 5 && (
                <button
                  className="secondaryButton"
                  onClick={() =>
                    setActiveTab("participants")
                  }
                >
                  Alle Teilnehmer anzeigen
                </button>
              )}

            </section>
          </>
        )}

        {/* PARTICIPANTS */}
        {activeTab === "participants" && (
          <section className="card">

            <h2>👥 Teilnehmer</h2>

            <div className="personAdd">

              <input
                placeholder="Name"
                value={personName}
                onChange={(e) =>
                  setPersonName(e.target.value)
                }
              />

              <input
                type="number"
                min="30"
                max="250"
                value={personWeight}
                onChange={(e) =>
                  setPersonWeight(e.target.value)
                }
                placeholder="Gewicht kg"
              />

              <select
                value={personGender}
                onChange={(e) =>
                  setPersonGender(
                    e.target.value as "m" | "w"
                  )
                }
              >
                <option value="m">
                  ♂️ Männlich
                </option>
                <option value="w">
                  ♀️ Weiblich
                </option>
              </select>

              <button
                onClick={addPerson}
              >
                ➕ Hinzufügen
              </button>

            </div>

            {people.length === 0 ? (
              <div className="empty">
                👥 Noch keine Teilnehmer.
              </div>
            ) : (
              people.map((person) => (
                <div
                  className="personCard"
                  key={person.id}
                >

                  <div className="personHeader">

                    <div>
                      <strong>
                        👤 {person.name}
                      </strong>

                      <small>
                        {person.drinks} Getränke ·{" "}
                        {person.liters.toFixed(1)} L ·{" "}
                        {person.points} Punkte
                      </small>
                    </div>

                    <button
                      className="deleteButton"
                      onClick={() =>
                        removePerson(person.id)
                      }
                    >
                      ×
                    </button>

                  </div>

                  <div className="personStats">

                    <div>
                      <small>Gewicht</small>
                      <b>
                        {person.weight} kg
                      </b>
                    </div>

                    <div>
                      <small>Alkohol</small>
                      <b>
                        {person.alcoholGrams.toFixed(0)} g
                      </b>
                    </div>

                    <div>
                      <small>Promille*</small>
                      <b className="promille">
                        {person.promille.toFixed(2)} ‰
                      </b>
                    </div>

                    <div>
                      <small>Kosten</small>
                      <b>
                        {person.cost.toFixed(2)} €
                      </b>
                    </div>

                  </div>

                  <div className="personControls">

                    <input
                      type="number"
                      min="30"
                      max="250"
                      value={person.weight}
                      onChange={(e) =>
                        updatePerson(
                          person.id,
                          {
                            weight:
                              numberValue(
                                e.target.value
                              ),
                          }
                        )
                      }
                    />

                    <select
                      value={person.gender}
                      onChange={(e) =>
                        updatePerson(
                          person.id,
                          {
                            gender:
                              e.target.value as
                                | "m"
                                | "w",
                          }
                        )
                      }
                    >
                      <option value="m">
                        ♂️
                      </option>
                      <option value="w">
                        ♀️
                      </option>
                    </select>

                    <button
                      onClick={() => {
                        setSelectedPersonId(
                          person.id
                        );

                        setActiveTab("drinks");
                      }}
                    >
                      🍺 Getränk zuordnen
                    </button>

                  </div>

                </div>
              ))
            )}

            <p className="legalHint">
              * Die Promilleanzeige ist nur eine
              rechnerische Schätzung und kein Messwert.
              Sie darf niemals zur Beurteilung der
              Fahrtüchtigkeit verwendet werden.
            </p>

          </section>
        )}

        {/* DRINKS */}
        {activeTab === "drinks" && (
          <>

            <section className="card">

              <h2>🔗 Getränk zuordnen</h2>

              {people.length === 0 ? (
                <p>
                  👥 Zuerst Teilnehmer hinzufügen.
                </p>
              ) : drinks.length === 0 ? (
                <p>
                  🍺 Zuerst Getränke hinzufügen.
                </p>
              ) : (
                people.map((person) => (
                  <div
                    className="assignment"
                    key={person.id}
                  >

                    <div>
                      <strong>
                        {person.name}
                      </strong>

                      <small>
                        {person.promille.toFixed(2)} ‰
                      </small>
                    </div>

                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value)
                          return;

                        assignDrink(
                          person.id,
                          e.target.value
                        );

                        e.target.value = "";
                      }}
                    >
                      <option value="">
                        🍺 Getränk auswählen
                      </option>

                      {drinks.map((drink) => (
                        <option
                          key={drink.id}
                          value={drink.id}
                        >
                          {drinkName(drink)} ·{" "}
                          {drinkLiters(drink).toFixed(
                            1
                          )} L ·{" "}
                          {drinkAlcohol(drink).toFixed(
                            1
                          )}% ·{" "}
                          {drinkPrice(drink).toFixed(
                            2
                          )} €
                        </option>
                      ))}
                    </select>

                  </div>
                ))
              )}

            </section>

            <section className="card">

              <h2>🍺 Getränke</h2>

              {drinks.length === 0 ? (
                <div className="empty">
                  🍺 Noch keine Getränke.
                </div>
              ) : (
                drinks.map((drink) => (
                  <div
                    className="item"
                    key={drink.id}
                  >

                    <div>
                      <strong>
                        🍺 {drinkName(drink)}
                      </strong>

                      <small>
                        {drinkLiters(drink).toFixed(
                          1
                        )} Liter ·{" "}
                        {drinkAlcohol(drink).toFixed(
                          1
                        )} %
                      </small>
                    </div>

                    <strong>
                      {drinkPrice(drink).toFixed(2)} €
                    </strong>

                  </div>
                ))
              )}

            </section>

          </>
        )}

        {/* CHALLENGES */}
        {activeTab === "challenges" && (
          <section className="card">

            <h2>⚔️ Challenges</h2>

            <p>
              Sammle Punkte und schalte
              Herausforderungen frei.
            </p>

            <div className="challengeGrid">

              {challenges.map((challenge) => (
                <div
                  className={
                    challenge.completed
                      ? "challenge completed"
                      : "challenge"
                  }
                  key={challenge.id}
                >

                  <div className="challengeIcon">
                    {challenge.completed
                      ? "✅"
                      : "⚔️"}
                  </div>

                  <div>
                    <strong>
                      {challenge.title}
                    </strong>

                    <p>
                      {challenge.description}
                    </p>

                    <b>
                      +{challenge.points} Punkte
                    </b>
                  </div>

                </div>
              ))}

            </div>

          </section>
        )}

        {/* STATS */}
        {activeTab === "stats" && (
          <>

            <section className="card">

              <h2>📊 Event-Statistik</h2>

              <div className="bigStats">

                <div>
                  <span>🍺</span>
                  <strong>
                    {drinks.length}
                  </strong>
                  <small>
                    Getränke
                  </small>
                </div>

                <div>
                  <span>💧</span>
                  <strong>
                    {totalLiters.toFixed(1)}
                  </strong>
                  <small>
                    Liter
                  </small>
                </div>

                <div>
                  <span>🥃</span>
                  <strong>
                    {totalAlcohol.toFixed(0)}
                  </strong>
                  <small>
                    Gramm Alkohol
                  </small>
                </div>

                <div>
                  <span>🏆</span>
                  <strong>
                    {totalPoints}
                  </strong>
                  <small>
                    Punkte
                  </small>
                </div>

              </div>

            </section>

            <section className="card cost">

              <h2>💶 Kostenaufteilung</h2>

              <div className="costBig">
                {totalCost.toFixed(2)} €
              </div>

              <p>
                Gesamtkosten des Events
              </p>

              <div className="costLine">
                <span>
                  👥 Teilnehmer
                </span>

                <b>
                  {people.length}
                </b>
              </div>

              <div className="costLine">
                <span>
                  💶 Pro Person
                </span>

                <b>
                  {costPerPerson.toFixed(2)} €
                </b>
              </div>

              <div className="costLine">
                <span>
                  🏆 Gesamtpunkte
                </span>

                <b>
                  {totalPoints}
                </b>
              </div>

            </section>

            <section className="card">

              <h2>🥃 Promille</h2>

              <button
                className="secondaryButton"
                onClick={() =>
                  setShowPromilleInfo(true)
                }
              >
                ℹ️ Wie wird das berechnet?
              </button>

              {people.length === 0 ? (
                <p>
                  Noch keine Teilnehmer.
                </p>
              ) : (
                people
                  .sort(
                    (a, b) =>
                      b.promille - a.promille
                  )
                  .map((person) => (
                    <div
                      className="promilleRow"
                      key={person.id}
                    >
                      <span>
                        {person.name}
                      </span>

                      <strong>
                        {person.promille.toFixed(2)} ‰
                      </strong>
                    </div>
                  ))
              )}

            </section>

          </>
        )}

        {/* MESSAGE */}
        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {/* INVITE MODAL */}
        {showInvite && (
          <div
            className="modalOverlay"
            onClick={() =>
              setShowInvite(false)
            }
          >
            <div
              className="modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <button
                className="modalClose"
                onClick={() =>
                  setShowInvite(false)
                }
              >
                ×
              </button>

              <div className="modalIcon">
                🔑
              </div>

              <h2>
                Event einladen
              </h2>

              {event?.invite_code ? (
                <>
                  <p>
                    Teile diesen Code mit deinen
                    Freunden:
                  </p>

                  <div className="inviteCode">
                    {event.invite_code}
                  </div>

                  <div className="modalButtons">

                    <button
                      onClick={copyInviteCode}
                    >
                      📋 Code kopieren
                    </button>

                    <button
                      onClick={copyInviteLink}
                    >
                      🔗 Link kopieren
                    </button>

                  </div>
                </>
              ) : (
                <p>
                  Für dieses Event wurde noch kein
                  Einladungscode hinterlegt.
                </p>
              )}

            </div>
          </div>
        )}

        {/* PROMILLE INFO */}
        {showPromilleInfo && (
          <div
            className="modalOverlay"
            onClick={() =>
              setShowPromilleInfo(false)
            }
          >
            <div
              className="modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <button
                className="modalClose"
                onClick={() =>
                  setShowPromilleInfo(false)
                }
              >
                ×
              </button>

              <div className="modalIcon">
                🥃
              </div>

              <h2>
                Promille-Schätzung
              </h2>

              <p>
                Die App verwendet eine vereinfachte
                Widmark-Näherung aus Körpergewicht,
                Geschlecht und der aufgenommenen
                Alkoholmenge.
              </p>

              <div className="warning">
                ⚠️ Wichtig
                <br />
                Dieser Wert ist nur eine Schätzung.
                Er ist kein Alkoholtest und darf
                niemals zur Entscheidung verwendet
                werden, ob jemand noch fahren darf.
              </div>

            </div>
          </div>
        )}

        <footer>
          🍻 Güstener Zapfhahn Zentrale
          <small>
            Dein Event. Deine Getränke. Deine Runde.
          </small>
        </footer>

      </div>

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

        body {
          overflow-x: hidden;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          background:
            radial-gradient(
              circle at top,
              #26384b 0%,
              #0d141c 38%,
              #070b10 80%
            );
          color: white;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .appShell {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px 0 24px;
        }

        .crateButton {
          border: 0;
          padding: 0;
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
        }

        .crate {
          display: flex;
          flex-direction: column;
          width: 82px;
          height: 70px;
          border-radius: 12px;
          overflow: hidden;
          border: 3px solid #6b3e19;
          background:
            linear-gradient(
              90deg,
              #7a471d,
              #a96326,
              #7a471d
            );
          box-shadow:
            0 8px 25px rgba(0,0,0,.45);
        }

        .crateTop {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 31px;
          background: #e9a42c;
          color: #20140a;
          font-size: 16px;
          letter-spacing: -4px;
        }

        .crateBody {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 900;
          font-size: 16px;
          letter-spacing: 2px;
          color: #ffe7a0;
          text-shadow:
            1px 1px 0 #4d260e;
        }

        .brand {
          flex: 1;
        }

        .brand h1 {
          margin: 0;
          font-size: clamp(21px, 4vw, 31px);
          line-height: 1.1;
        }

        .brand p {
          margin: 7px 0 0;
          color: #9ca8b5;
        }

        .inviteTop {
          border: 0;
          background: #f59e0b;
          color: #111;
          font-weight: 800;
          border-radius: 13px;
          padding: 11px 14px;
          cursor: pointer;
        }

        .inviteTop span {
          margin-left: 5px;
        }

        .card {
          background: rgba(255,255,255,.065);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 20px;
          padding: 19px;
          margin-bottom: 15px;
          box-shadow:
            0 12px 30px rgba(0,0,0,.13);
        }

        .eventCard {
          position: relative;
        }

        h2 {
          margin: 0 0 7px;
          font-size: 21px;
        }

        p {
          color: #9ca8b5;
          line-height: 1.5;
        }

        .sectionTitle {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .eventDescription {
          margin-bottom: 0;
        }

        .codeButton {
          border: 0;
          border-radius: 12px;
          padding: 10px 13px;
          background: #202c38;
          color: #fbbf24;
          font-weight: 800;
          cursor: pointer;
        }

        select,
        input {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid #303b47;
          background: #121a23;
          color: white;
          outline: none;
          margin-bottom: 10px;
        }

        select:focus,
        input:focus {
          border-color: #f59e0b;
        }

        button {
          transition:
            transform .12s ease,
            filter .12s ease;
        }

        button:hover {
          filter: brightness(1.08);
        }

        button:active {
          transform: scale(.98);
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          text-align: center;
          padding: 16px 10px;
          border-radius: 17px;
          background:
            rgba(255,255,255,.055);
        }

        .stat span {
          display: block;
          font-size: 23px;
        }

        .stat strong {
          display: block;
          font-size: 21px;
          margin: 4px 0;
        }

        .stat small {
          color: #8995a3;
        }

        .tabs {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 10px;
          margin-bottom: 5px;
        }

        .tabs button {
          white-space: nowrap;
          border: 1px solid #303b47;
          border-radius: 12px;
          padding: 10px 13px;
          background: #121a23;
          color: #b9c3cc;
          cursor: pointer;
        }

        .tabs button.active {
          background: #f59e0b;
          color: #111;
          border-color: #f59e0b;
          font-weight: 800;
        }

        .heroCard {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .heroIcon {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 75px;
          height: 75px;
          border-radius: 20px;
          background: #1b2834;
          font-size: 38px;
          flex-shrink: 0;
        }

        .heroCard p {
          margin-bottom: 0;
        }

        .row {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 8px;
        }

        .three {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .saveButton {
          width: 100%;
          border: 0;
          border-radius: 13px;
          padding: 14px;
          background: #f59e0b;
          color: #111;
          font-weight: 900;
          cursor: pointer;
        }

        .saveButton:disabled {
          opacity: .6;
          cursor: wait;
        }

        .secondaryButton {
          border: 1px solid #3a4856;
          border-radius: 12px;
          background: #17222e;
          color: white;
          padding: 10px 13px;
          cursor: pointer;
        }

        .rank {
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          gap: 10px;
          align-items: center;
          background:
            rgba(255,255,255,.045);
          padding: 13px;
          border-radius: 13px;
          margin-top: 8px;
        }

        .personAdd {
          display: grid;
          grid-template-columns:
            1fr 130px 140px auto;
          gap: 8px;
        }

        .personCard {
          margin-top: 10px;
          padding: 15px;
          border-radius: 16px;
          background:
            rgba(255,255,255,.045);
          border: 1px solid
            rgba(255,255,255,.06);
        }

        .personHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .personHeader strong {
          display: block;
          font-size: 17px;
        }

        .personHeader small {
          display: block;
          margin-top: 4px;
          color: #8995a3;
        }

        .deleteButton {
          border: 0;
          border-radius: 10px;
          background: #303944;
          color: white;
          padding: 7px 12px;
          cursor: pointer;
        }

        .personStats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 8px;
          margin: 13px 0;
        }

        .personStats div {
          background:
            rgba(255,255,255,.045);
          border-radius: 11px;
          padding: 10px;
        }

        .personStats small {
          display: block;
          color: #8995a3;
          margin-bottom: 4px;
        }

        .personStats b {
          font-size: 15px;
        }

        .promille {
          color: #fbbf24;
        }

        .personControls {
          display: grid;
          grid-template-columns:
            100px 80px 1fr;
          gap: 8px;
        }

        .personControls input,
        .personControls select {
          margin: 0;
        }

        .personControls button {
          border: 0;
          border-radius: 12px;
          background: #f59e0b;
          color: #111;
          font-weight: 800;
          cursor: pointer;
        }

        .assignment {
          display: grid;
          grid-template-columns:
            1fr 2fr;
          gap: 10px;
          align-items: center;
          padding: 11px;
          margin-top: 8px;
          background:
            rgba(255,255,255,.045);
          border-radius: 13px;
        }

        .assignment strong {
          display: block;
        }

        .assignment small {
          display: block;
          color: #fbbf24;
          margin-top: 4px;
        }

        .assignment select {
          margin: 0;
        }

        .item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          background:
            rgba(255,255,255,.045);
          padding: 13px;
          border-radius: 13px;
          margin-top: 8px;
        }

        .item strong {
          display: block;
        }

        .item small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
        }

        .challengeGrid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 10px;
        }

        .challenge {
          display: flex;
          gap: 13px;
          padding: 15px;
          border-radius: 15px;
          background:
            rgba(255,255,255,.045);
          border: 1px solid
            rgba(255,255,255,.06);
        }

        .challenge.completed {
          border-color: #e9a42c;
          background:
            rgba(245,158,11,.09);
        }

        .challengeIcon {
          font-size: 28px;
        }

        .challenge p {
          margin: 6px 0;
          font-size: 13px;
        }

        .challenge b {
          color: #fbbf24;
        }

        .bigStats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
        }

        .bigStats div {
          text-align: center;
          padding: 18px;
          background:
            rgba(255,255,255,.045);
          border-radius: 15px;
        }

        .bigStats span {
          display: block;
          font-size: 27px;
        }

        .bigStats strong {
          display: block;
          font-size: 26px;
          margin: 6px 0;
        }

        .bigStats small {
          color: #8995a3;
        }

        .cost {
          text-align: center;
        }

        .costBig {
          color: #fbbf24;
          font-size: 42px;
          font-weight: 900;
        }

        .costLine {
          display: flex;
          justify-content: space-between;
          padding: 13px;
          border-radius: 12px;
          background:
            rgba(255,255,255,.045);
          margin-top: 8px;
        }

        .promilleRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px;
          margin-top: 8px;
          border-radius: 12px;
          background:
            rgba(255,255,255,.045);
        }

        .promilleRow strong {
          color: #fbbf24;
        }

        .message {
          position: sticky;
          bottom: 15px;
          z-index: 20;
          padding: 13px;
          border-radius: 13px;
          background: #172330;
          border: 1px solid #344454;
          color: #fbbf24;
          margin-bottom: 15px;
          box-shadow:
            0 10px 30px rgba(0,0,0,.35);
        }

        .empty {
          text-align: center;
          padding: 30px;
          color: #8995a3;
        }

        .legalHint {
          font-size: 11px;
          margin-top: 18px;
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            rgba(0,0,0,.72);
          backdrop-filter: blur(8px);
        }

        .modal {
          position: relative;
          width: 100%;
          max-width: 440px;
          padding: 25px;
          border-radius: 22px;
          background: #121a23;
          border: 1px solid #344454;
          box-shadow:
            0 30px 80px rgba(0,0,0,.5);
        }

        .modalClose {
          position: absolute;
          right: 15px;
          top: 15px;
          border: 0;
          background: #26323e;
          color: white;
          width: 35px;
          height: 35px;
          border-radius: 10px;
          font-size: 20px;
          cursor: pointer;
        }

        .modalIcon {
          font-size: 42px;
          margin-bottom: 10px;
        }

        .inviteCode {
          text-align: center;
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 5px;
          color: #fbbf24;
          background: #080d13;
          padding: 18px;
          border-radius: 15px;
          margin: 18px 0;
        }

        .modalButtons {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 8px;
        }

        .modalButtons button {
          border: 0;
          border-radius: 12px;
          padding: 13px;
          background: #f59e0b;
          color: #111;
          font-weight: 800;
          cursor: pointer;
        }

        .warning {
          padding: 15px;
          border-radius: 13px;
          background:
            rgba(245,158,11,.12);
          border: 1px solid
            rgba(245,158,11,.35);
          color: #fbbf24;
          line-height: 1.5;
        }

        footer {
          text-align: center;
          color: #687686;
          padding: 30px 10px;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        @media (max-width: 750px) {

          .appShell {
            padding: 12px;
          }

          .header {
            align-items: flex-start;
          }

          .crate {
            width: 68px;
            height: 60px;
          }

          .brand h1 {
            font-size: 20px;
          }

          .brand p {
            font-size: 12px;
          }

          .inviteTop {
            padding: 10px;
          }

          .inviteTop span {
            display: none;
          }

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .row {
            grid-template-columns: 1fr;
          }

          .three {
            grid-template-columns: 1fr;
          }

          .personAdd {
            grid-template-columns: 1fr;
          }

          .personStats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .personControls {
            grid-template-columns:
              1fr 70px;
          }

          .personControls button {
            grid-column: 1 / -1;
            padding: 12px;
          }

          .assignment {
            grid-template-columns: 1fr;
          }

          .challengeGrid {
            grid-template-columns: 1fr;
          }

          .bigStats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .sectionTitle {
            flex-direction: column;
          }

          .heroCard {
            align-items: flex-start;
          }

        }

        @media (max-width: 430px) {

          .appShell {
            padding: 8px;
          }

          .header {
            gap: 9px;
          }

          .crate {
            width: 58px;
            height: 52px;
          }

          .crateTop {
            font-size: 12px;
          }

          .crateBody {
            font-size: 12px;
          }

          .brand h1 {
            font-size: 17px;
          }

          .brand p {
            font-size: 10px;
          }

          .stat {
            padding: 12px 5px;
          }

          .stat strong {
            font-size: 18px;
          }

          .tabs button {
            font-size: 12px;
          }

          .costBig {
            font-size: 34px;
          }

        }

      `}</style>

    </main>
  );
}
