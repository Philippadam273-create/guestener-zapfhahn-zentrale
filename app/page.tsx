"use client";

import"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  invite_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
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
};

type Person = {
  id: number;
  name: string;
  weight: number;
  height: number;
  age: number;
  gender: "m" | "w";
  drinks: number;
  liters: number;
  alcoholGrams: number;
  cost: number;
  points: number;
  promille: number;
};

type Challenge = {
  id: number;
  title: string;
  description: string;
  points: number;
  icon: string;
};

const DEFAULT_WEIGHT = 82;
const DEFAULT_HEIGHT = 182;
const DEFAULT_AGE = 33;

const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: "Erstes Getränk",
    description: "Ordne dein erstes Getränk zu.",
    points: 10,
    icon: "🍺",
  },
  {
    id: 2,
    title: "Dreierrunde",
    description: "Trinke bzw. ordne drei Getränke zu.",
    points: 30,
    icon: "🍻",
  },
  {
    id: 3,
    title: "Litermeister",
    description: "Erreiche mindestens 1,5 Liter.",
    points: 50,
    icon: "💧",
  },
  {
    id: 4,
    title: "Punktejäger",
    description: "Erreiche mindestens 100 Punkte.",
    points: 75,
    icon: "🏆",
  },
  {
    id: 5,
    title: "Kistenjäger",
    description: "Erreiche mindestens 5 Getränke.",
    points: 100,
    icon: "📦",
  },
];

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] = useState("");
  const [personWeight, setPersonWeight] = useState(
    String(DEFAULT_WEIGHT)
  );
  const [personHeight, setPersonHeight] = useState(
    String(DEFAULT_HEIGHT)
  );
  const [personAge, setPersonAge] = useState(
    String(DEFAULT_AGE)
  );
  const [personGender, setPersonGender] =
    useState<"m" | "w">("m");

  const [inviteCode, setInviteCode] = useState("");
  const [challengeOpen, setChallengeOpen] =
    useState(false);

  const currentEvent = useMemo(
    () =>
      events.find((event) => event.id === eventId) ??
      null,
    [events, eventId]
  );

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,title,description,location,invite_code,start_date,end_date"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage("❌ Events konnten nicht geladen werden.");
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
      setMessage("❌ Getränke konnten nicht geladen werden.");
      return;
    }

    setDrinks(data ?? []);
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadEvents();
      setLoading(false);
    }

    init();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    loadDrinks();

    const saved = localStorage.getItem(
      "guester-people-" + eventId
    );

    if (saved) {
      try {
        setPeople(JSON.parse(saved));
      } catch {
        setPeople([]);
      }
    } else {
      setPeople([]);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guester-people-" + eventId,
      JSON.stringify(people)
    );
  }, [people, eventId]);

  useEffect(() => {
    if (currentEvent?.invite_code) {
      setInviteCode(currentEvent.invite_code);
    } else {
      setInviteCode("");
    }
  }, [currentEvent]);

  function getDrinkName(drink: Drink) {
    return (
      drink.getraenk ||
      drink.drink_name ||
      "Getränk"
    );
  }

  function getDrinkLiters(drink: Drink) {
    return Number(
      drink.liters ??
        drink.menge ??
        0
    );
  }

  function getDrinkAlcohol(drink: Drink) {
    return Number(
      drink.alcohol_percent ??
        drink.alkohol ??
        0
    );
  }

  function getDrinkPrice(drink: Drink) {
    return Number(
      drink.preis ??
        drink.price ??
        0
    );
  }

  function calculatePromille(
    person: Person,
    additionalAlcoholGrams = 0
  ) {
    /*
      Vereinfachte Widmark-Näherung.
      Kein medizinisch zuverlässiger Wert.
    */

    const bodyWeight =
      Number(person.weight) || DEFAULT_WEIGHT;

    const r =
      person.gender === "w"
        ? 0.55
        : 0.68;

    const totalAlcohol =
      Number(person.alcoholGrams || 0) +
      Number(additionalAlcoholGrams || 0);

    const bac =
      totalAlcohol /
      (bodyWeight * r);

    return Math.max(
      0,
      Number(bac.toFixed(2))
    );
  }

  function calculateAlcoholGrams(
    litersValue: number,
    alcoholPercent: number
  ) {
    const ml = litersValue * 1000;

    /*
      Ethanol:
      Volumen × Alkoholanteil × Dichte
      Dichte ≈ 0,789 g/ml
    */

    return (
      ml *
      (alcoholPercent / 100) *
      0.789
    );
  }

  function addPerson() {
    setMessage("");

    const name = personName.trim();

    if (!name) {
      setMessage(
        "❌ Bitte einen Namen eingeben."
      );
      return;
    }

    if (
      people.some(
        (person) =>
          person.name.toLowerCase() ===
          name.toLowerCase()
      )
    ) {
      setMessage(
        "❌ Teilnehmer bereits vorhanden."
      );
      return;
    }

    const newPerson: Person = {
      id: Date.now(),
      name,
      weight:
        Number(personWeight) ||
        DEFAULT_WEIGHT,
      height:
        Number(personHeight) ||
        DEFAULT_HEIGHT,
      age:
        Number(personAge) ||
        DEFAULT_AGE,
      gender: personGender,
      drinks: 0,
      liters: 0,
      alcoholGrams: 0,
      cost: 0,
      points: 0,
      promille: 0,
    };

    setPeople((previous) => [
      ...previous,
      newPerson,
    ]);

    setPersonName("");
    setMessage(
      "✅ Teilnehmer hinzugefügt."
    );
  }

  function removePerson(id: number) {
    setPeople((previous) =>
      previous.filter(
        (person) => person.id !== id
      )
    );

    setMessage(
      "👤 Teilnehmer entfernt."
    );
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

    const litersNumber =
      Number(liters) || 0;

    const alcoholNumber =
      Number(alcohol) || 0;

    const priceNumber =
      Number(price) || 0;

    const { error } = await supabase
      .from("drinks")
      .insert([
        {
          event_id: eventId,
          getraenk: drinkName.trim(),
          drink_name: drinkName.trim(),
          menge: litersNumber,
          liters: litersNumber,
          alkohol: alcoholNumber,
          alcohol_percent: alcoholNumber,
          preis: priceNumber,
          quantity: 1,
        },
      ]);

    if (error) {
      console.error(error);

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

    setMessage(
      "✅ Getränk gespeichert."
    );

    await loadDrinks();
  }

  function assignDrink(
    personId: number,
    drinkId: string
  ) {
    const drink = drinks.find(
      (item) => item.id === drinkId
    );

    if (!drink) return;

    const drinkLiters =
      getDrinkLiters(drink);

    const drinkAlcohol =
      getDrinkAlcohol(drink);

    const drinkPrice =
      getDrinkPrice(drink);

    const alcoholGrams =
      calculateAlcoholGrams(
        drinkLiters,
        drinkAlcohol
      );

    setPeople((previous) =>
      previous.map((person) => {
        if (person.id !== personId) {
          return person;
        }

        const newAlcoholGrams =
          person.alcoholGrams +
          alcoholGrams;

        const newPerson = {
          ...person,
          drinks:
            person.drinks + 1,
          liters:
            person.liters +
            drinkLiters,
          alcoholGrams:
            newAlcoholGrams,
          cost:
            person.cost +
            drinkPrice,
          points:
            person.points + 10,
        };

        return {
          ...newPerson,
          promille:
            calculatePromille(
              newPerson
            ),
        };
      })
    );

    setMessage(
      `🍺 ${getDrinkName(
        drink
      )} zugeordnet · +10 Punkte`
    );
  }

  function getCompletedChallenges(
    person: Person
  ) {
    return CHALLENGES.filter(
      (challenge) => {
        if (challenge.id === 1) {
          return person.drinks >= 1;
        }

        if (challenge.id === 2) {
          return person.drinks >= 3;
        }

        if (challenge.id === 3) {
          return person.liters >= 1.5;
        }

        if (challenge.id === 4) {
          return person.points >= 100;
        }

        if (challenge.id === 5) {
          return person.drinks >= 5;
        }

        return false;
      }
    );
  }

  const totalCost = drinks.reduce(
    (sum, drink) =>
      sum +
      getDrinkPrice(drink),
    0
  );

  const totalLiters = drinks.reduce(
    (sum, drink) =>
      sum +
      getDrinkLiters(drink),
    0
  );

  const totalAlcohol = drinks.reduce(
    (sum, drink) =>
      sum +
      calculateAlcoholGrams(
        getDrinkLiters(drink),
        getDrinkAlcohol(drink)
      ),
    0
  );

  const totalPoints = people.reduce(
    (sum, person) =>
      sum + person.points,
    0
  );

  const costPerPerson =
    people.length > 0
      ? totalCost / people.length
      : 0;

  const ranking = [...people].sort(
    (a, b) =>
      b.points - a.points
  );

  return (
    <main className="page">
      <div className="container">

        {/* HEADER */}

        <header className="header">
          <button
            className="crateButton"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            aria-label="Güstener Zapfhahn Zentrale"
          >
            <span className="beerCrate">
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
            </span>
          </button>

          <div>
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Events · Getränke · Kosten · Rankings
            </p>
          </div>
        </header>

        {/* EVENT */}

        <section className="card heroCard">
          <div className="sectionTitle">
            <span>📅</span>
            <h2>Aktuelles Event</h2>
          </div>

          <select
            value={eventId}
            onChange={(event) =>
              setEventId(
                event.target.value
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
                <strong>
                  {currentEvent.title}
                </strong>

                {currentEvent.location && (
                  <small>
                    📍{" "}
                    {currentEvent.location}
                  </small>
                )}
              </div>

              <div className="inviteBox">
                <span>
                  🔑 Einladungscode
                </span>

                <strong>
                  {inviteCode ||
                    "Kein Code vorhanden"}
                </strong>

                {inviteCode && (
                  <button
                    className="copyButton"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        inviteCode
                      );

                      setMessage(
                        "📋 Einladungscode kopiert."
                      );
                    }}
                  >
                    Kopieren
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* STATS */}

        <div className="stats">
          <div className="stat">
            <span>🍺</span>
            <b>{drinks.length}</b>
            <small>Getränke</small>
          </div>

          <div className="stat">
            <span>💧</span>
            <b>
              {totalLiters.toFixed(1)}
            </b>
            <small>Liter</small>
          </div>

          <div className="stat">
            <span>💶</span>
            <b>
              {totalCost.toFixed(2)} €
            </b>
            <small>Kosten</small>
          </div>

          <div className="stat">
            <span>👥</span>
            <b>{people.length}</b>
            <small>Teilnehmer</small>
          </div>
        </div>

        {/* TEILNEHMER */}

        <section className="card">
          <div className="sectionTitle">
            <span>👥</span>
            <h2>Teilnehmer</h2>
          </div>

          <input
            placeholder="Name"
            value={personName}
            onChange={(event) =>
              setPersonName(
                event.target.value
              )
            }
          />

          <div className="four">
            <input
              type="number"
              placeholder="Gewicht kg"
              value={personWeight}
              onChange={(event) =>
                setPersonWeight(
                  event.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Größe cm"
              value={personHeight}
              onChange={(event) =>
                setPersonHeight(
                  event.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Alter"
              value={personAge}
              onChange={(event) =>
                setPersonAge(
                  event.target.value
                )
              }
            />

            <select
              value={personGender}
              onChange={(event) =>
                setPersonGender(
                  event.target.value as
                    | "m"
                    | "w"
                )
              }
            >
              <option value="m">
                ♂ Männlich
              </option>

              <option value="w">
                ♀ Weiblich
              </option>
            </select>
          </div>

          <button
            className="primaryButton full"
            onClick={addPerson}
          >
            ➕ Teilnehmer hinzufügen
          </button>

          <div className="peopleList">
            {people.map((person) => {
              const completed =
                getCompletedChallenges(
                  person
                );

              return (
                <div
                  className="personCard"
                  key={person.id}
                >
                  <div className="personTop">
                    <div>
                      <strong>
                        👤 {person.name}
                      </strong>

                      <small>
                        {person.weight} kg ·{" "}
                        {person.height} cm ·{" "}
                        {person.age} Jahre
                      </small>
                    </div>

                    <button
                      className="deleteButton"
                      onClick={() =>
                        removePerson(
                          person.id
                        )
                      }
                    >
                      ×
                    </button>
                  </div>

                  <div className="personStats">
                    <span>
                      🍺{" "}
                      <b>
                        {person.drinks}
                      </b>
                    </span>

                    <span>
                      💧{" "}
                      <b>
                        {person.liters.toFixed(
                          1
                        )}{" "}
                        L
                      </b>
                    </span>

                    <span>
                      🏆{" "}
                      <b>
                        {person.points}
                      </b>
                      P
                    </span>

                    <span className="promille">
                      🍻{" "}
                      <b>
                        {person.promille.toFixed(
                          2
                        )}
                        ‰
                      </b>
                    </span>
                  </div>

                  <div className="challengeMini">
                    🎯{" "}
                    {completed.length}/
                    {CHALLENGES.length} Challenges
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* GETRÄNK */}

        <section className="card">
          <div className="sectionTitle">
            <span>🍺</span>
            <h2>Getränk hinzufügen</h2>
          </div>

          <input
            placeholder="Getränk"
            value={drinkName}
            onChange={(event) =>
              setDrinkName(
                event.target.value
              )
            }
          />

          <div className="three">
            <input
              type="number"
              step="0.1"
              placeholder="Liter"
              value={liters}
              onChange={(event) =>
                setLiters(
                  event.target.value
                )
              }
            />

            <input
              type="number"
              step="0.1"
              placeholder="Alkohol %"
              value={alcohol}
              onChange={(event) =>
                setAlcohol(
                  event.target.value
                )
              }
            />

            <input
              type="number"
              step="0.01"
              placeholder="Preis €"
              value={price}
              onChange={(event) =>
                setPrice(
                  event.target.value
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

        {/* ZUORDNEN */}

        <section className="card">
          <div className="sectionTitle">
            <span>🔗</span>
            <h2>Getränk zuordnen</h2>
          </div>

          {people.length === 0 ? (
            <div className="empty">
              👥 Zuerst Teilnehmer hinzufügen.
            </div>
          ) : drinks.length === 0 ? (
            <div className="empty">
              🍺 Zuerst ein Getränk anlegen.
            </div>
          ) : (
            people.map((person) => (
              <div
                className="assignment"
                key={person.id}
              >
                <strong>
                  {person.name}
                </strong>

                <select
                  defaultValue=""
                  onChange={(event) => {
                    if (
                      event.target.value
                    ) {
                      assignDrink(
                        person.id,
                        event.target.value
                      );

                      event.target.value =
                        "";
                    }
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
                      {getDrinkName(
                        drink
                      )}{" "}
                      ·{" "}
                      {getDrinkLiters(
                        drink
                      ).toFixed(1)}
                      L ·{" "}
                      {getDrinkAlcohol(
                        drink
                      ).toFixed(1)}
                      %
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </section>

        {/* GETRÄNKE */}

        <section className="card">
          <div className="sectionTitle">
            <span>🍺</span>
            <h2>Getränke</h2>
          </div>

          {drinks.length === 0 ? (
            <div className="empty">
              Noch keine Getränke.
            </div>
          ) : (
            drinks.map((drink) => (
              <div
                className="drinkItem"
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
                    {getDrinkLiters(
                      drink
                    ).toFixed(1)}{" "}
                    Liter ·{" "}
                    {getDrinkAlcohol(
                      drink
                    ).toFixed(1)}{" "}
                    % Alkohol
                  </small>
                </div>

                <strong>
                  {getDrinkPrice(
                    drink
                  ).toFixed(2)} €
                </strong>
              </div>
            ))
          )}
        </section>

        {/* PROMILLE */}

        <section className="card promilleCard">
          <div className="sectionTitle">
            <span>🍻</span>
            <h2>Promille</h2>
          </div>

          <p className="hint">
            Die Anzeige ist nur eine
            vereinfachte rechnerische
            Schätzung und kein Messwert.
          </p>

          {people.length === 0 ? (
            <div className="empty">
              Noch keine Teilnehmer.
            </div>
          ) : (
            people
              .slice()
              .sort(
                (a, b) =>
                  b.promille -
                  a.promille
              )
              .map((person) => (
                <div
                  className="promilleRow"
                  key={person.id}
                >
                  <span>
                    👤 {person.name}
                  </span>

                  <strong>
                    {person.promille.toFixed(
                      2
                    )}
                    ‰
                  </strong>
                </div>
              ))
          )}
        </section>

        {/* KOSTEN */}

        <section className="card costCard">
          <div className="sectionTitle">
            <span>💶</span>
            <h2>Kostenaufteilung</h2>
          </div>

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
              🍺 Gesamtgetränke
            </span>

            <strong>
              {drinks.length}
            </strong>
          </div>

          <div className="costLine">
            <span>
              🧪 Alkohol
            </span>

            <strong>
              {totalAlcohol.toFixed(
                0
              )} g
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

          <p className="hint">
            Die Kosten werden automatisch
            gleichmäßig auf alle Teilnehmer
            verteilt.
          </p>
        </section>

        {/* CHALLENGES */}

        <section className="card">
          <button
            className="challengeHeader"
            onClick={() =>
              setChallengeOpen(
                !challengeOpen
              )
            }
          >
            <span>
              🎯 Challenges
            </span>

            <span>
              {challengeOpen
                ? "▲"
                : "▼"}
            </span>
          </button>

          {challengeOpen && (
            <div className="challengeList">
              {CHALLENGES.map(
                (challenge) => (
                  <div
                    className="challenge"
                    key={
                      challenge.id
                    }
                  >
                    <span className="challengeIcon">
                      {challenge.icon}
                    </span>

                    <div>
                      <strong>
                        {challenge.title}
                      </strong>

                      <small>
                        {
                          challenge.description
                        }
                      </small>
                    </div>

                    <b>
                      +{challenge.points}
                    </b>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* RANKING */}

        <section className="card">
          <div className="sectionTitle">
            <span>🏆</span>
            <h2>Ranking</h2>
          </div>

          {ranking.length === 0 ? (
            <div className="empty">
              Noch keine Teilnehmer.
            </div>
          ) : (
            ranking.map(
              (person, index) => (
                <div
                  className="rank"
                  key={person.id}
                >
                  <strong className="rankNumber">
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : `${index + 1}.`}
                  </strong>

                  <div>
                    <strong>
                      {person.name}
                    </strong>

                    <small>
                      🍺{" "}
                      {person.drinks} · 💧{" "}
                      {person.liters.toFixed(
                        1
                      )}{" "}
                      L
                    </small>
                  </div>

                  <b>
                    {person.points} Punkte
                  </b>
                </div>
              )
            )
          )}
        </section>

        {/* MESSAGE */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {/* FOOTER */}

        <footer>
          <div className="footerCrate">
            🍺 🍺 🍺
          </div>

          <strong>
            Güstener Zapfhahn Zentrale
          </strong>

          <small>
            Dein Event. Deine Getränke.
            Deine Runde.
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
          background: #080c11;
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
              #111923 28%,
              #080c11 70%
            );
          color: #fff;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 18px;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 0 24px;
        }

        .crateButton {
          border: 0;
          outline: 0;
          padding: 0;
          margin: 0;
          background: transparent;
          cursor: pointer;
          appearance: none;
          box-shadow: none;
        }

        .crateButton:focus,
        .crateButton:active {
          outline: none;
          box-shadow: none;
        }

        .beerCrate {
          width: 78px;
          height: 78px;
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 3px;
          padding: 7px;
          align-items: center;
          justify-items: center;
          border-radius: 13px;
          background:
            linear-gradient(
              135deg,
              #8b4b1f,
              #5a2d12
            );
          border: 3px solid #3b1d0c;
          box-shadow:
            inset 0 3px 0
              rgba(255,255,255,.1),
            0 8px 20px
              rgba(0,0,0,.4);
        }

        .beerCrate span {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 19px;
          height: 19px;
          font-size: 15px;
          line-height: 1;
          border-radius: 50%;
          background: #d9a441;
          box-shadow:
            inset 0 2px 2px
              rgba(255,255,255,.35),
            0 2px 2px
              rgba(0,0,0,.3);
        }

        h1 {
          margin: 0;
          font-size: clamp(
            22px,
            5vw,
            31px
          );
          line-height: 1.1;
        }

        h2 {
          margin: 0;
          font-size: 19px;
        }

        p {
          color: #9ca8b5;
          margin: 7px 0 0;
        }

        .card {
          width: 100%;
          background:
            rgba(255,255,255,.055);
          border: 1px solid
            rgba(255,255,255,.08);
          border-radius: 20px;
          padding: 18px;
          margin-bottom: 14px;
          box-shadow:
            0 10px 35px
              rgba(0,0,0,.14);
          backdrop-filter: blur(10px);
        }

        .heroCard {
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.075),
              rgba(255,255,255,.035)
            );
        }

        .sectionTitle {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 14px;
        }

        .sectionTitle span {
          font-size: 22px;
        }

        input,
        select {
          width: 100%;
          min-height: 47px;
          padding: 12px 13px;
          border-radius: 12px;
          border: 1px solid #303b47;
          background: #151d26;
          color: white;
          margin-bottom: 10px;
          font-size: 15px;
          outline: none;
        }

        input:focus,
        select:focus {
          border-color: #f59e0b;
          box-shadow:
            0 0 0 2px
              rgba(245,158,11,.12);
        }

        button {
          font-family: inherit;
        }

        .primaryButton {
          border: none;
          border-radius: 12px;
          padding: 13px 17px;
          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );
          color: #111;
          font-weight: 800;
          cursor: pointer;
          min-height: 46px;
        }

        .full {
          width: 100%;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .stat {
          min-width: 0;
          background:
            rgba(255,255,255,.055);
          border: 1px solid
            rgba(255,255,255,.06);
          border-radius: 16px;
          padding: 14px 8px;
          text-align: center;
        }

        .stat span {
          font-size: 22px;
        }

        .stat b,
        .stat small {
          display: block;
        }

        .stat b {
          margin-top: 5px;
          font-size: 19px;
        }

        .stat small {
          margin-top: 4px;
          color: #8995a3;
          font-size: 11px;
        }

        .eventInfo {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 12px;
          margin-top: 8px;
        }

        .eventInfo small {
          display: block;
          color: #8995a3;
          margin-top: 5px;
        }

        .inviteBox {
          background:
            rgba(245,158,11,.1);
          border: 1px solid
            rgba(245,158,11,.25);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .inviteBox span {
          color: #9ca8b5;
          font-size: 12px;
        }

        .inviteBox strong {
          color: #fbbf24;
          font-size: 22px;
          letter-spacing: 2px;
        }

        .copyButton {
          width: max-content;
          margin-top: 5px;
          padding: 7px 10px;
          border: 0;
          border-radius: 8px;
          background: #293543;
          color: white;
          cursor: pointer;
        }

        .four {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 8px;
        }

        .three {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .peopleList {
          margin-top: 10px;
        }

        .personCard {
          background:
            rgba(255,255,255,.045);
          border-radius: 15px;
          padding: 13px;
          margin-top: 8px;
          border: 1px solid
            rgba(255,255,255,.05);
        }

        .personTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .personTop strong {
          display: block;
        }

        .personTop small {
          display: block;
          margin-top: 4px;
          color: #8995a3;
        }

        .deleteButton {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 9px;
          background: #303944;
          color: white;
          font-size: 20px;
          cursor: pointer;
        }

        .personStats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 7px;
          margin-top: 10px;
        }

        .personStats span {
          background:
            rgba(0,0,0,.18);
          padding: 8px;
          border-radius: 9px;
          font-size: 12px;
          text-align: center;
        }

        .promille {
          color: #fbbf24;
        }

        .challengeMini {
          margin-top: 8px;
          color: #aab4bf;
          font-size: 12px;
        }

        .assignment {
          display: grid;
          grid-template-columns:
            1fr 1.5fr;
          gap: 10px;
          align-items: center;
          margin-bottom: 8px;
        }

        .assignment select {
          margin: 0;
        }

        .drinkItem {
          display: grid;
          grid-template-columns:
            42px 1fr auto;
          gap: 10px;
          align-items: center;
          background:
            rgba(255,255,255,.045);
          padding: 12px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .drinkIcon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            rgba(245,158,11,.12);
          border-radius: 11px;
          font-size: 22px;
        }

        .drinkInfo strong,
        .drinkInfo small {
          display: block;
        }

        .drinkInfo small {
          margin-top: 4px;
          color: #8995a3;
        }

        .promilleCard {
          border-color:
            rgba(245,158,11,.16);
        }

        .promilleRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background:
            rgba(255,255,255,.045);
          padding: 13px;
          border-radius: 12px;
          margin-top: 8px;
        }

        .promilleRow strong {
          color: #fbbf24;
          font-size: 19px;
        }

        .costCard {
          text-align: center;
        }

        .costBig {
          font-size: 40px;
          font-weight: 900;
          color: #fbbf24;
        }

        .costLine {
          display: flex;
          justify-content: space-between;
          background:
            rgba(255,255,255,.045);
          padding: 13px;
          border-radius: 12px;
          margin-top: 8px;
        }

        .hint {
          font-size: 12px;
        }

        .challengeHeader {
          width: 100%;
          border: 0;
          background: transparent;
          color: white;
          display: flex;
          justify-content: space-between;
          font-size: 19px;
          font-weight: 800;
          padding: 0;
          cursor: pointer;
        }

        .challengeList {
          margin-top: 12px;
        }

        .challenge {
          display: grid;
          grid-template-columns:
            42px 1fr auto;
          gap: 10px;
          align-items: center;
          background:
            rgba(255,255,255,.045);
          padding: 12px;
          border-radius: 13px;
          margin-top: 8px;
        }

        .challengeIcon {
          font-size: 25px;
        }

        .challenge strong,
        .challenge small {
          display: block;
        }

        .challenge small {
          margin-top: 4px;
          color: #8995a3;
        }

        .challenge b {
          color: #fbbf24;
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

        .rankNumber {
          font-size: 23px;
        }

        .rank small {
          display: block;
          margin-top: 4px;
          color: #8995a3;
        }

        .rank b {
          color: #fbbf24;
        }

        .empty {
          padding: 18px;
          text-align: center;
          color: #8995a3;
          background:
            rgba(255,255,255,.03);
          border-radius: 12px;
        }

        .message {
          position: sticky;
          bottom: 12px;
          z-index: 20;
          background: #172230;
          border: 1px solid #344454;
          border-radius: 12px;
          padding: 13px;
          margin-bottom: 15px;
          color: #fbbf24;
          box-shadow:
            0 10px 30px
              rgba(0,0,0,.35);
        }

        footer {
          text-align: center;
          color: #687686;
          padding: 30px 10px;
        }

        footer strong,
        footer small {
          display: block;
        }

        footer small {
          margin-top: 5px;
        }

        .footerCrate {
          font-size: 22px;
          margin-bottom: 8px;
          letter-spacing: 5px;
        }

        @media (max-width: 700px) {
          .container {
            padding: 12px;
          }

          .header {
            align-items: flex-start;
          }

          .beerCrate {
            width: 68px;
            height: 68px;
          }

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .eventInfo {
            grid-template-columns: 1fr;
          }

          .four {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .three {
            grid-template-columns: 1fr;
          }

          .assignment {
            grid-template-columns: 1fr;
          }

          .personStats {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 430px) {
          .header {
            gap: 10px;
          }

          .beerCrate {
            width: 60px;
            height: 60px;
            padding: 5px;
          }

          .beerCrate span {
            width: 16px;
            height: 16px;
            font-size: 12px;
          }

          h1 {
            font-size: 20px;
          }

          .four {
            grid-template-columns: 1fr;
          }

          .rank {
            grid-template-columns:
              35px 1fr auto;
          }

          .rank b {
            font-size: 12px;
          }
        }
      `}</style>
    </main>
  );
} { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Person = {
  id: number;
  name: string;
  drinks: number;
  liters: number;
  cost: number;
  points: number;
};

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");
  const [drinks, setDrinks] = useState<any[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] = useState("");
  const [message, setMessage] = useState("");

  async function loadEvents() {
    const { data } = await supabase
      .from("events")
      .select("id,title")
      .order("created_at", { ascending: false });

    if (data) {
      setEvents(data);

      if (!eventId && data.length > 0) {
        setEventId(data[0].id);
      }
    }
  }

  async function loadDrinks() {
    if (!eventId) return;

    const { data } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (data) {
      setDrinks(data);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadDrinks();

    if (!eventId) return;

    const saved = localStorage.getItem(
      "guester-people-" + eventId
    );

    if (saved) {
      try {
        setPeople(JSON.parse(saved));
      } catch {
        setPeople([]);
      }
    } else {
      setPeople([]);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guester-people-" + eventId,
      JSON.stringify(people)
    );
  }, [people, eventId]);

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      setMessage("❌ Bitte ein Getränk eingeben.");
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .insert([
        {
          event_id: eventId,
          getraenk: drinkName,
          drink_name: drinkName,
          menge: Number(liters),
          liters: Number(liters),
          alkohol: Number(alcohol),
          alcohol_percent: Number(alcohol),
          preis: Number(price),
          quantity: 1,
        },
      ]);

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setMessage("✅ Getränk gespeichert.");

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    await loadDrinks();
  }

  function addPerson() {
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

    setPeople([
      ...people,
      {
        id: Date.now(),
        name,
        drinks: 0,
        liters: 0,
        cost: 0,
        points: 0,
      },
    ]);

    setPersonName("");
    setMessage("✅ Teilnehmer hinzugefügt.");
  }

  function assignDrink(
    personId: number,
    drinkId: string
  ) {
    const drink = drinks.find(
      (d) => String(d.id) === String(drinkId)
    );

    if (!drink) return;

    const drinkLiters = Number(
      drink.liters ?? drink.menge ?? 0
    );

    const drinkPrice = Number(
      drink.preis ?? drink.price ?? 0
    );

    setPeople((currentPeople) =>
      currentPeople.map((person) => {
        if (person.id !== personId) {
          return person;
        }

        return {
          ...person,
          drinks: person.drinks + 1,
          liters: person.liters + drinkLiters,
          cost: person.cost + drinkPrice,
          points: person.points + 10,
        };
      })
    );

    setMessage("🍺 Getränk zugeordnet! +10 Punkte");
  }

  function removePerson(id: number) {
    setPeople((currentPeople) =>
      currentPeople.filter(
        (person) => person.id !== id
      )
    );
  }

  const totalCost = drinks.reduce(
    (sum, drink) =>
      sum +
      Number(
        drink.preis ??
          drink.price ??
          0
      ),
    0
  );

  const totalLiters = drinks.reduce(
    (sum, drink) =>
      sum +
      Number(
        drink.liters ??
          drink.menge ??
          0
      ),
    0
  );

  const costPerPerson =
    people.length > 0
      ? totalCost / people.length
      : 0;

  const totalPoints = people.reduce(
    (sum, person) =>
      sum + person.points,
    0
  );

  const ranking = [...people].sort(
    (a, b) => b.points - a.points
  );

  return (
    <>
      <main className="page">
        <div className="container">

          {/* =====================================================
              HEADER
              Bierkisten-Button:
              KEIN weißer Rand.
              ===================================================== */}

          <header className="header">
            <button
              className="beer-crate-button"
              type="button"
              aria-label="Bierkiste"
            >
              <span className="beer-crate">
                <span className="crate-top">
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                </span>

                <span className="crate-middle">
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                </span>

                <span className="crate-bottom">
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                  <span className="bottle">🍺</span>
                </span>

                <span className="crate-label">
                  BIER
                </span>
              </span>
            </button>

            <div>
              <h1>Güstener Zapfhahn Zentrale</h1>

              <p>
                Events · Getränke · Kosten · Rankings
              </p>
            </div>
          </header>

          {/* EVENT */}

          <section className="card">
            <h2>📅 Aktuelles Event</h2>

            <select
              value={eventId}
              onChange={(e) =>
                setEventId(e.target.value)
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
          </section>

          {/* STATS */}

          <div className="stats">

            <div className="stat">
              <span>🍺</span>
              <b>{drinks.length}</b>
              <small>Getränke</small>
            </div>

            <div className="stat">
              <span>💧</span>
              <b>{totalLiters.toFixed(1)}</b>
              <small>Liter</small>
            </div>

            <div className="stat">
              <span>💶</span>
              <b>{totalCost.toFixed(2)} €</b>
              <small>Kosten</small>
            </div>

            <div className="stat">
              <span>👥</span>
              <b>{people.length}</b>
              <small>Teilnehmer</small>
            </div>

          </div>

          {/* TEILNEHMER */}

          <section className="card">

            <h2>👥 Teilnehmer</h2>

            <div className="row">

              <input
                placeholder="Name"
                value={personName}
                onChange={(e) =>
                  setPersonName(e.target.value)
                }
              />

              <button onClick={addPerson}>
                ➕ Hinzufügen
              </button>

            </div>

            {people.map((person) => (

              <div
                className="item"
                key={person.id}
              >

                <div>
                  <b>👤 {person.name}</b>

                  <small>
                    🍺 {person.drinks}
                    {" · "}
                    💧 {person.liters.toFixed(1)} L
                    {" · "}
                    🏆 {person.points}
                  </small>
                </div>

                <button
                  className="delete"
                  onClick={() =>
                    removePerson(person.id)
                  }
                >
                  ×
                </button>

              </div>

            ))}

          </section>

          {/* GETRÄNK */}

          <section className="card">

            <h2>🍺 Getränk hinzufügen</h2>

            <input
              placeholder="Getränk"
              value={drinkName}
              onChange={(e) =>
                setDrinkName(e.target.value)
              }
            />

            <div className="three">

              <input
                type="number"
                value={liters}
                onChange={(e) =>
                  setLiters(e.target.value)
                }
                placeholder="Liter"
              />

              <input
                type="number"
                value={alcohol}
                onChange={(e) =>
                  setAlcohol(e.target.value)
                }
                placeholder="Alkohol %"
              />

              <input
                type="number"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
                placeholder="Preis €"
              />

            </div>

            <button
              className="save"
              onClick={saveDrink}
            >
              🍻 Getränk speichern
            </button>

          </section>

          {/* ZUORDNEN */}

          <section className="card">

            <h2>🔗 Getränk zuordnen</h2>

            {people.length === 0 ? (

              <p>
                👥 Zuerst Teilnehmer hinzufügen.
              </p>

            ) : (

              people.map((person) => (

                <div
                  className="assignment"
                  key={person.id}
                >

                  <b>{person.name}</b>

                  <select
                    defaultValue=""
                    onChange={(e) => {

                      if (e.target.value) {

                        assignDrink(
                          person.id,
                          e.target.value
                        );

                        e.target.value = "";
                      }

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

                        {drink.getraenk ||
                          drink.drink_name ||
                          "Getränk"}

                        {" · "}

                        {Number(
                          drink.preis ??
                            drink.price ??
                            0
                        ).toFixed(2)}

                        €

                      </option>

                    ))}

                  </select>

                </div>

              ))

            )}

          </section>

          {/* GETRÄNKE */}

          <section className="card">

            <h2>🍺 Getränke</h2>

            {drinks.map((drink) => (

              <div
                className="item"
                key={drink.id}
              >

                <div>

                  <b>
                    🍺{" "}
                    {drink.getraenk ||
                      drink.drink_name ||
                      "Getränk"}
                  </b>

                  <small>

                    {Number(
                      drink.liters ??
                        drink.menge ??
                        0
                    ).toFixed(1)}

                    {" "}Liter ·{" "}

                    {Number(
                      drink.alcohol_percent ??
                        drink.alkohol ??
                        0
                    ).toFixed(1)}

                    {" "}%

                  </small>

                </div>

                <b>

                  {Number(
                    drink.preis ??
                      drink.price ??
                      0
                  ).toFixed(2)}

                  {" "}€

                </b>

              </div>

            ))}

          </section>

          {/* KOSTEN */}

          <section className="card cost">

            <h2>💶 Kostenaufteilung</h2>

            <div className="costBig">
              {totalCost.toFixed(2)} €
            </div>

            <p>
              Gesamtkosten des Events
            </p>

            <div className="costLine">
              <span>👥 Teilnehmer</span>
              <b>{people.length}</b>
            </div>

            <div className="costLine">
              <span>💶 Pro Person</span>

              <b>
                {costPerPerson.toFixed(2)} €
              </b>

            </div>

            <div className="costLine">

              <span>🏆 Gesamtpunkte</span>

              <b>{totalPoints}</b>

            </div>

            <p className="hint">

              Die Kosten werden automatisch
              gleichmäßig auf alle Teilnehmer
              verteilt.

            </p>

          </section>

          {/* RANKING */}

          <section className="card">

            <h2>🏆 Ranking</h2>

            {ranking.length === 0 ? (

              <p>
                Noch keine Teilnehmer.
              </p>

            ) : (

              ranking.map(
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

          </section>

          {message && (

            <div className="message">
              {message}
            </div>

          )}

          <footer>

            🍻 Güstener Zapfhahn Zentrale

            <small>
              Dein Event. Deine Getränke.
              Deine Runde.
            </small>

          </footer>

        </div>
      </main>

      <style jsx global>{`

        /* =========================================================
           WICHTIG:
           DER WEISSE RAND WIRD HIER VOLLSTÄNDIG ENTFERNT.
           ========================================================= */

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          min-height: 100%;
          background: #080c11 !important;
        }

        body {
          overflow-x: hidden;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        #__next {
          min-height: 100vh;
          margin: 0;
          padding: 0;
          background: #080c11;
        }

        /* =========================================================
           APP
           ========================================================= */

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 15px;

          background:
            radial-gradient(
              circle at top,
              #26384b 0%,
              #111923 35%,
              #080c11 75%
            );

          color: white;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 850px;
          margin: 0 auto;
        }

        /* =========================================================
           HEADER
           ========================================================= */

        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px 5px 25px;
        }

        .header h1 {
          font-size: 25px;
          margin: 0;
        }

        .header p {
          color: #9ca8b5;
          margin: 6px 0 0;
        }

        /* =========================================================
           BIERKISTEN-BUTTON
           ========================================================= */

        .beer-crate-button {
          width: 82px;
          height: 82px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 0;

          border: 0 !important;
          outline: 0 !important;

          background: transparent !important;

          box-shadow: none !important;

          cursor: pointer;

          flex-shrink: 0;
        }

        .beer-crate {
          position: relative;

          width: 76px;
          height: 70px;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          padding: 7px 5px;

          border-radius: 7px;

          background:
            linear-gradient(
              180deg,
              #b76e25 0%,
              #8c4e19 45%,
              #63350f 100%
            );

          border: 3px solid #4a270c;

          box-shadow:
            inset 0 3px 0 rgba(255,255,255,.12),
            inset 0 -5px 0 rgba(0,0,0,.18),
            0 5px 12px rgba(0,0,0,.45);
        }

        .beer-crate::before,
        .beer-crate::after {
          content: "";

          position: absolute;

          left: 5px;
          right: 5px;

          height: 4px;

          border-radius: 3px;

          background: rgba(48,24,7,.75);
        }

        .beer-crate::before {
          top: 5px;
        }

        .beer-crate::after {
          bottom: 5px;
        }

        .crate-top,
        .crate-middle,
        .crate-bottom {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 100%;

          gap: 1px;

          position: relative;
          z-index: 2;
        }

        .bottle {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          width: 19px;
          height: 19px;

          font-size: 16px;

          filter:
            drop-shadow(
              0 1px 1px
              rgba(0,0,0,.55)
            );
        }

        .crate-label {
          position: absolute;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%, -50%);

          z-index: 4;

          padding: 2px 7px;

          border-radius: 3px;

          background: #d99a42;

          border: 1px solid #6b3b11;

          color: #3a2008;

          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;

          box-shadow:
            0 1px 2px
            rgba(0,0,0,.35);
        }

        /* =========================================================
           CARDS
           ========================================================= */

        .card {
          background:
            rgba(255,255,255,.06);

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 20px;

          padding: 18px;

          margin-bottom: 14px;

          backdrop-filter: blur(8px);
        }

        h2 {
          margin-top: 0;
        }

        p {
          color: #9ca8b5;
        }

        /* =========================================================
           STATS
           ========================================================= */

        .stats {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 10px;

          margin-bottom: 14px;
        }

        .stat {
          background:
            rgba(255,255,255,.06);

          border-radius: 16px;

          padding: 14px;

          text-align: center;

          font-size: 22px;
        }

        .stat span,
        .stat b,
        .stat small {
          display: block;
        }

        .stat b {
          font-size: 20px;
          margin: 5px 0;
        }

        .stat small {
          color: #8995a3;
          font-size: 11px;
        }

        /* =========================================================
           INPUTS
           ========================================================= */

        input,
        select {
          width: 100%;

          padding: 13px;

          border-radius: 12px;

          border:
            1px solid #303b47;

          background: #151d26;

          color: white;

          margin-bottom: 10px;

          font-size: 15px;
        }

        input:focus,
        select:focus {
          outline: none;

          border-color: #f59e0b;

          box-shadow:
            0 0 0 2px
            rgba(245,158,11,.15);
        }

        /* =========================================================
           BUTTONS
           ========================================================= */

        button {
          border: none;

          border-radius: 12px;

          padding: 13px 17px;

          background: #f59e0b;

          color: #111;

          font-weight: bold;

          cursor: pointer;
        }

        button:hover {
          filter: brightness(1.08);
        }

        /* =========================================================
           FORM ROWS
           ========================================================= */

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

        .save {
          width: 100%;
          margin-top: 4px;
        }

        /* =========================================================
           ITEMS
           ========================================================= */

        .item {
          display: flex;

          justify-content: space-between;

          align-items: center;

          background:
            rgba(255,255,255,.05);

          padding: 12px;

          border-radius: 14px;

          margin-top: 8px;
        }

        .item small {
          display: block;

          color: #8995a3;

          margin-top: 4px;
        }

        .delete {
          background: #303944;
          color: white;

          padding: 7px 12px;
        }

        /* =========================================================
           ASSIGNMENT
           ========================================================= */

        .assignment {
          display: grid;

          grid-template-columns:
            1fr 1.5fr;

          gap: 10px;

          align-items: center;

          margin-bottom: 8px;
        }

        .assignment select {
          margin: 0;
        }

        /* =========================================================
           COST
           ========================================================= */

        .cost {
          text-align: center;
        }

        .costBig {
          font-size: 38px;

          font-weight: bold;

          color: #fbbf24;
        }

        .costLine {
          display: flex;

          justify-content: space-between;

          background:
            rgba(255,255,255,.05);

          padding: 13px;

          border-radius: 12px;

          margin-top: 8px;
        }

        .hint {
          font-size: 12px;
        }

        /* =========================================================
           RANKING
           ========================================================= */

        .rank {
          display: grid;

          grid-template-columns:
            45px 1fr auto;

          gap: 10px;

          align-items: center;

          background:
            rgba(255,255,255,.05);

          padding: 13px;

          border-radius: 13px;

          margin-top: 8px;
        }

        /* =========================================================
           MESSAGE
           ========================================================= */

        .message {
          background: #172230;

          border:
            1px solid #344454;

          border-radius: 12px;

          padding: 13px;

          margin-bottom: 15px;

          color: #fbbf24;
        }

        /* =========================================================
           FOOTER
           ========================================================= */

        footer {
          text-align: center;

          color: #687686;

          padding: 25px;
        }

        footer small {
          display: block;

          margin-top: 5px;
        }

        /* =========================================================
           MOBILE
           ========================================================= */

        @media (max-width: 650px) {

          .page {
            padding: 10px;
          }

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .three {
            grid-template-columns: 1fr;
          }

          .row {
            grid-template-columns: 1fr;
          }

          .assignment {
            grid-template-columns: 1fr;
          }

          .header h1 {
            font-size: 21px;
          }

          .beer-crate-button {
            width: 70px;
            height: 70px;
          }

          .beer-crate {
            transform: scale(.9);
          }

        }

      `}</style>
    </>
  );
}
