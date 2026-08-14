"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Person = {
  id: number;
  name: string;
  weight: number;
  height: number;
  age: number;
  gender: "m" | "w";
  drinks: number;
  liters: number;
  alcohol: number;
  cost: number;
  points: number;
  team: string;
  promille: number;
};

type Drink = {
  id: string;
  event_id: string;
  getraenk?: string;
  drink_name?: string;
  menge?: number;
  liters?: number;
  alkohol?: number;
  alcohol_percent?: number;
  preis?: number;
  price?: number;
  quantity?: number;
};

type Settings = {
  ranking_enabled: boolean;
  show_points: boolean;
  show_ranking: boolean;
  show_promille: boolean;
  show_statistics: boolean;
  show_drink_amounts: boolean;
  photo_required: boolean;
  ai_recognition_enabled: boolean;
  manual_entry_allowed: boolean;
  cost_overview_enabled: boolean;
  auto_split_costs: boolean;
  team_mode: boolean;
  show_photos: boolean;
  show_costs: boolean;
  privacy_mode: boolean;
};

const defaultSettings: Settings = {
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

const teams = ["Team Bier", "Team Pils", "Team Schnaps", "Team Wasser"];

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [settings, setSettings] =
    useState<Settings>(defaultSettings);

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] = useState("");
  const [weight, setWeight] = useState("82");
  const [height, setHeight] = useState("182");
  const [age, setAge] = useState("33");
  const [gender, setGender] =
    useState<"m" | "w">("m");
  const [team, setTeam] = useState(teams[0]);

  const [message, setMessage] = useState("");

  const [showAddPerson, setShowAddPerson] =
    useState(false);

  const [showSettings, setShowSettings] =
    useState(false);

  const [showCreateEvent, setShowCreateEvent] =
    useState(false);

  const [newEventTitle, setNewEventTitle] =
    useState("");

  const [photo, setPhoto] =
    useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<
      "dashboard" |
      "drinks" |
      "people" |
      "ranking" |
      "settings"
    >("dashboard");

  async function loadEvents() {
    const { data } = await supabase
      .from("events")
      .select("id,title")
      .order("created_at", {
        ascending: false,
      });

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
      .order("created_at", {
        ascending: false,
      });

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

    const savedPeople =
      localStorage.getItem(
        "guester-people-" + eventId
      );

    const savedSettings =
      localStorage.getItem(
        "guester-settings-" + eventId
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

    if (savedSettings) {
      try {
        setSettings({
          ...defaultSettings,
          ...JSON.parse(savedSettings),
        });
      } catch {
        setSettings(defaultSettings);
      }
    } else {
      setSettings(defaultSettings);
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
    if (!eventId) return;

    localStorage.setItem(
      "guester-settings-" + eventId,
      JSON.stringify(settings)
    );
  }, [settings, eventId]);

  function showMessage(text: string) {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  async function saveDrink() {
    setMessage("");

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

    if (
      settings.photo_required &&
      !photo
    ) {
      showMessage(
        "📷 Für dieses Event wird ein Foto benötigt."
      );
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .insert([
        {
          event_id: eventId,
          getraenk: drinkName.trim(),
          drink_name: drinkName.trim(),
          menge: Number(liters),
          liters: Number(liters),
          alkohol: Number(alcohol),
          alcohol_percent: Number(alcohol),
          preis: Number(price),
          price: Number(price),
          quantity: 1,
        },
      ]);

    if (error) {
      showMessage("❌ " + error.message);
      return;
    }

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");
    setPhoto(null);

    showMessage(
      "✅ Getränk gespeichert."
    );

    await loadDrinks();
  }

  function addPerson() {
    if (!personName.trim()) {
      showMessage(
        "❌ Bitte einen Namen eingeben."
      );
      return;
    }

    if (
      people.some(
        (p) =>
          p.name.toLowerCase() ===
          personName.trim().toLowerCase()
      )
    ) {
      showMessage(
        "❌ Teilnehmer bereits vorhanden."
      );
      return;
    }

    const newPerson: Person = {
      id: Date.now(),
      name: personName.trim(),
      weight: Number(weight) || 82,
      height: Number(height) || 182,
      age: Number(age) || 33,
      gender,
      drinks: 0,
      liters: 0,
      alcohol: 0,
      cost: 0,
      points: 0,
      team,
      promille: 0,
    };

    setPeople([
      ...people,
      newPerson,
    ]);

    setPersonName("");
    setShowAddPerson(false);

    showMessage(
      "✅ Teilnehmer hinzugefügt."
    );
  }

  function calculatePromille(
    person: Person,
    addedAlcoholGrams: number
  ) {
    const bodyWater =
      person.gender === "m"
        ? 0.68
        : 0.55;

    const alcoholInBody =
      addedAlcoholGrams /
      (person.weight * bodyWater);

    return Math.max(
      0,
      alcoholInBody
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

    const drinkLiters =
      Number(
        drink.liters ??
          drink.menge ??
          0
      );

    const drinkAlcohol =
      Number(
        drink.alcohol_percent ??
          drink.alkohol ??
          0
      );

    const drinkPrice =
      Number(
        drink.preis ??
          drink.price ??
          0
      );

    const alcoholGrams =
      drinkLiters *
      1000 *
      (drinkAlcohol / 100) *
      0.789;

    setPeople(
      people.map((person) => {
        if (
          person.id !== personId
        ) {
          return person;
        }

        const newAlcohol =
          person.alcohol +
          alcoholGrams;

        const newPromille =
          calculatePromille(
            person,
            newAlcohol
          );

        return {
          ...person,
          drinks:
            person.drinks + 1,
          liters:
            person.liters +
            drinkLiters,
          alcohol:
            newAlcohol,
          cost:
            person.cost +
            drinkPrice,
          points:
            person.points + 10,
          promille:
            newPromille,
        };
      })
    );

    showMessage(
      "🍺 Getränk zugeordnet! +10 Punkte"
    );
  }

  function removePerson(id: number) {
    setPeople(
      people.filter(
        (person) =>
          person.id !== id
      )
    );

    showMessage(
      "👤 Teilnehmer entfernt."
    );
  }

  async function createEvent() {
    if (!newEventTitle.trim()) {
      showMessage(
        "❌ Bitte einen Eventnamen eingeben."
      );
      return;
    }

    const { data, error } =
      await supabase
        .from("events")
        .insert([
          {
            title:
              newEventTitle.trim(),
            is_active: true,
          },
        ])
        .select()
        .single();

    if (error) {
      showMessage(
        "❌ " + error.message
      );
      return;
    }

    if (data) {
      setEvents([
        data,
        ...events,
      ]);

      setEventId(data.id);
    }

    setNewEventTitle("");
    setShowCreateEvent(false);

    showMessage(
      "🎉 Event erstellt."
    );
  }

  function handlePhoto(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload =
      () => {
        setPhoto(
          String(reader.result)
        );
      };

    reader.readAsDataURL(file);
  }

  function resetEventData() {
    if (!eventId) return;

    if (
      !confirm(
        "Teilnehmer und lokale Eventdaten wirklich zurücksetzen?"
      )
    ) {
      return;
    }

    setPeople([]);

    localStorage.removeItem(
      "guester-people-" + eventId
    );

    showMessage(
      "🗑️ Eventdaten zurückgesetzt."
    );
  }

  const totalCost =
    drinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.preis ??
            drink.price ??
            0
        ) *
          Number(
            drink.quantity ?? 1
          ),
      0
    );

  const totalLiters =
    drinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.liters ??
            drink.menge ??
            0
        ) *
          Number(
            drink.quantity ?? 1
          ),
      0
    );

  const totalAlcohol =
    people.reduce(
      (sum, person) =>
        sum + person.alcohol,
      0
    );

  const totalPoints =
    people.reduce(
      (sum, person) =>
        sum + person.points,
      0
    );

  const averagePromille =
    people.length
      ? people.reduce(
          (sum, person) =>
            sum + person.promille,
          0
        ) / people.length
      : 0;

  const costPerPerson =
    people.length > 0
      ? totalCost /
        people.length
      : 0;

  const ranking = useMemo(
    () =>
      [...people].sort(
        (a, b) =>
          b.points -
          a.points
      ),
    [people]
  );

  const highestPromille =
    people.length
      ? Math.max(
          ...people.map(
            (p) => p.promille
          )
        )
      : 0;

  const selectedEvent =
    events.find(
      (event) =>
        String(event.id) ===
        String(eventId)
    );

  return (
    <main className="page">
      <div className="container">

        <header className="hero">

          <div className="beer-crate">
            <div className="crate-top">
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
            </div>

            <div className="crate-body">
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
            </div>
          </div>

          <div className="hero-text">
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Events · Getränke · Kosten · Rankings
            </p>
          </div>

        </header>

        <section className="event-bar">

          <div>
            <small>
              AKTUELLES EVENT
            </small>

            <select
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
                    value={event.id}
                  >
                    {event.title}
                  </option>
                )
              )}
            </select>
          </div>

          <button
            className="secondary"
            onClick={() =>
              setShowCreateEvent(
                !showCreateEvent
              )
            }
          >
            ➕ Neues Event
          </button>

        </section>

        {showCreateEvent && (
          <section className="card">

            <h2>
              🎉 Neues Event erstellen
            </h2>

            <input
              placeholder="Eventname"
              value={newEventTitle}
              onChange={(e) =>
                setNewEventTitle(
                  e.target.value
                )
              }
            />

            <button
              className="save"
              onClick={
                createEvent
              }
            >
              🎉 Event erstellen
            </button>

          </section>
        )}

        <div className="stats">

          <div>
            <span>🍺</span>
            <b>{drinks.length}</b>
            <small>Getränke</small>
          </div>

          <div>
            <span>💧</span>
            <b>
              {totalLiters.toFixed(1)}
            </b>
            <small>Liter</small>
          </div>

          <div>
            <span>💶</span>
            <b>
              {totalCost.toFixed(2)} €
            </b>
            <small>Kosten</small>
          </div>

          <div>
            <span>👥</span>
            <b>
              {people.length}
            </b>
            <small>Teilnehmer</small>
          </div>

        </div>

        <nav className="tabs">

          <button
            className={
              activeTab ===
              "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "dashboard"
              )
            }
          >
            🏠 Übersicht
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
              activeTab === "people"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("people")
            }
          >
            👥 Teilnehmer
          </button>

          {settings.show_ranking && (
            <button
              className={
                activeTab ===
                "ranking"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "ranking"
                )
              }
            >
              🏆 Ranking
            </button>
          )}

          <button
            className={
              activeTab === "settings"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("settings")
            }
          >
            ⚙️ Einstellungen
          </button>

        </nav>

        {activeTab ===
          "dashboard" && (
          <>
            {settings.show_statistics && (
              <section className="card">

                <h2>
                  📊 Event-Statistik
                </h2>

                <div className="dashboard-grid">

                  <div className="dashboard-box">
                    <span>🍺</span>
                    <b>
                      {drinks.length}
                    </b>
                    <small>
                      Getränke
                    </small>
                  </div>

                  <div className="dashboard-box">
                    <span>💧</span>
                    <b>
                      {totalLiters.toFixed(
                        1
                      )} L
                    </b>
                    <small>
                      getrunken
                    </small>
                  </div>

                  <div className="dashboard-box">
                    <span>💶</span>
                    <b>
                      {totalCost.toFixed(
                        2
                      )} €
                    </b>
                    <small>
                      Gesamtkosten
                    </small>
                  </div>

                  <div className="dashboard-box">
                    <span>🏆</span>
                    <b>
                      {totalPoints}
                    </b>
                    <small>
                      Punkte
                    </small>
                  </div>

                </div>

              </section>
            )}

            <section className="card">

              <h2>
                👥 Teilnehmer
              </h2>

              <button
                className="save"
                onClick={() =>
                  setShowAddPerson(
                    !showAddPerson
                  )
                }
              >
                ➕ Teilnehmer hinzufügen
              </button>

              {showAddPerson && (
                <div className="person-form">

                  <input
                    placeholder="Name"
                    value={personName}
                    onChange={(e) =>
                      setPersonName(
                        e.target.value
                      )
                    }
                  />

                  <div className="three">

                    <input
                      type="number"
                      placeholder="Gewicht kg"
                      value={weight}
                      onChange={(e) =>
                        setWeight(
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      placeholder="Größe cm"
                      value={height}
                      onChange={(e) =>
                        setHeight(
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      placeholder="Alter"
                      value={age}
                      onChange={(e) =>
                        setAge(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="three">

                    <select
                      value={gender}
                      onChange={(e) =>
                        setGender(
                          e.target
                            .value as
                            | "m"
                            | "w"
                        )
                      }
                    >
                      <option value="m">
                        👨 Männlich
                      </option>

                      <option value="w">
                        👩 Weiblich
                      </option>
                    </select>

                    {settings.team_mode && (
                      <select
                        value={team}
                        onChange={(e) =>
                          setTeam(
                            e.target
                              .value
                          )
                        }
                      >
                        {teams.map(
                          (t) => (
                            <option
                              key={t}
                              value={t}
                            >
                              {t}
                            </option>
                          )
                        )}
                      </select>
                    )}

                  </div>

                  <button
                    onClick={
                      addPerson
                    }
                  >
                    👤 Teilnehmer speichern
                  </button>

                </div>
              )}

              {people.map(
                (person) => (
                  <div
                    className="person-card"
                    key={person.id}
                  >

                    <div className="person-main">

                      <div className="avatar">
                        👤
                      </div>

                      <div>
                        <b>
                          {person.name}
                        </b>

                        {settings.team_mode && (
                          <small>
                            {person.team}
                          </small>
                        )}

                        <small>
                          🍺{" "}
                          {person.drinks}
                          {" · "}
                          💧{" "}
                          {person.liters.toFixed(
                            1
                          )} L
                        </small>
                      </div>

                    </div>

                    <div className="person-values">

                      {settings.show_points && (
                        <strong>
                          🏆{" "}
                          {person.points}
                        </strong>
                      )}

                      {settings.show_promille && (
                        <strong>
                          🥴{" "}
                          {person.promille.toFixed(
                            2
                          }‰
                        </strong>
                      )}

                      <button
                        className="delete"
                        onClick={() =>
                          removePerson(
                            person.id
                          )
                        }
                      >
                        ×
                      </button>

                    </div>

                  </div>
                )
              )}

            </section>

            <section className="card">

              <h2>
                🍺 Getränk hinzufügen
              </h2>

              <input
                placeholder="Getränk, z. B. Krombacher Pils"
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
                  step="0.1"
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
                  step="0.1"
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
                  step="0.01"
                  placeholder="Preis €"
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value
                    )
                  }
                />

              </div>

              {settings.ai_recognition_enabled && (
                <div className="ai-box">
                  🤖 <b>KI-Getränkeerkennung</b>
                  <small>
                    Getränkename, Menge und Alkoholgehalt
                    können später automatisch aus einem Foto
                    erkannt werden.
                  </small>
                </div>
              )}

              {settings.show_photos && (
                <>
                  <label className="upload">
                    📷 Foto hinzufügen
                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handlePhoto
                      }
                    />
                  </label>

                  {photo && (
                    <img
                      className="preview"
                      src={photo}
                      alt="Getränk"
                    />
                  )}
                </>
              )}

              {settings.manual_entry_allowed && (
                <button
                  className="save"
                  onClick={
                    saveDrink
                  }
                >
                  🍻 Getränk speichern
                </button>
              )}

            </section>

            <section className="card">

              <h2>
                🔗 Getränk zuordnen
              </h2>

              {people.length === 0 ? (
                <p>
                  👥 Zuerst Teilnehmer hinzufügen.
                </p>
              ) : (
                people.map(
                  (person) => (
                    <div
                      className="assignment"
                      key={person.id}
                    >

                      <div>
                        <b>
                          {person.name}
                        </b>

                        <small>
                          Aktuell:{" "}
                          {person.promille.toFixed(
                            2
                          )}‰
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
                              person.id,
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
                                "Getränk"}
                              {" · "}
                              {Number(
                                drink.preis ??
                                  drink.price ??
                                  0
                              ).toFixed(
                                2
                              )}
                              €
                            </option>
                          )
                        )}
                      </select>

                    </div>
                  )
                )
              )}

            </section>
          </>
        )}

        {activeTab ===
          "drinks" && (
          <section className="card">

            <h2>
              🍺 Alle Getränke
            </h2>

            {drinks.length === 0 ? (
              <p>
                Noch keine Getränke.
              </p>
            ) : (
              drinks.map(
                (drink) => {

                  const drinkLiters =
                    Number(
                      drink.liters ??
                        drink.menge ??
                        0
                    );

                  const drinkAlcohol =
                    Number(
                      drink.alcohol_percent ??
                        drink.alkohol ??
                        0
                    );

                  const drinkPrice =
                    Number(
                      drink.preis ??
                        drink.price ??
                        0
                    );

                  return (
                    <div
                      className="item"
                      key={
                        drink.id
                      }
                    >

                      <div>
                        <b>
                          🍺{" "}
                          {drink.getraenk ||
                            drink.drink_name ||
                            "Getränk"}
                        </b>

                        <small>
                          {drinkLiters.toFixed(
                            1
                          )}{" "}
                          Liter ·{" "}
                          {drinkAlcohol.toFixed(
                            1
                          )} %
                        </small>
                      </div>

                      <strong>
                        {drinkPrice.toFixed(
                          2
                        )} €
                      </strong>

                    </div>
                  );
                }
              )
            )}

          </section>
        )}

        {activeTab ===
          "people" && (
          <section className="card">

            <h2>
              👥 Teilnehmerverwaltung
            </h2>

            {people.map(
              (person) => (
                <div
                  className="person-large"
                  key={person.id}
                >

                  <div className="avatar-big">
                    👤
                  </div>

                  <div className="person-info">

                    <h3>
                      {person.name}
                    </h3>

                    <p>
                      {person.age} Jahre ·{" "}
                      {person.height} cm ·{" "}
                      {person.weight} kg
                    </p>

                    {settings.team_mode && (
                      <p>
                        🏳️ {person.team}
                      </p>
                    )}

                    <div className="mini-stats">

                      <span>
                        🍺{" "}
                        {person.drinks}
                      </span>

                      <span>
                        💧{" "}
                        {person.liters.toFixed(
                          1
                        )} L
                      </span>

                      <span>
                        🏆{" "}
                        {person.points}
                      </span>

                      {settings.show_promille && (
                        <span>
                          🥴{" "}
                          {person.promille.toFixed(
                            2
                          )}‰
                        </span>
                      )}

                    </div>

                  </div>

                  <button
                    className="delete"
                    onClick={() =>
                      removePerson(
                        person.id
                      )
                    }
                  >
                    ×
                  </button>

                </div>
              )
            )}

          </section>
        )}

        {activeTab ===
          "ranking" &&
          settings.show_ranking && (
            <section className="card">

              <div className="ranking-title">
                <div>
                  <span className="trophy">
                    🏆
                  </span>
                  <h2>
                    Ranking
                  </h2>
                </div>

                <b>
                  {totalPoints} Punkte
                </b>
              </div>

              {ranking.length ===
              0 ? (
                <p>
                  Noch keine Teilnehmer.
                </p>
              ) : (
                ranking.map(
                  (
                    person,
                    index
                  ) => (
                    <div
                      className={
                        index === 0
                          ? "rank rank-first"
                          : "rank"
                      }
                      key={
                        person.id
                      }
                    >

                      <strong>
                        {index === 0
                          ? "🥇"
                          : index ===
                            1
                          ? "🥈"
                          : index ===
                            2
                          ? "🥉"
                          : `${
                              index +
                              1
                            }.`}
                      </strong>

                      <div>
                        <b>
                          {person.name}
                        </b>

                        {settings.team_mode && (
                          <small>
                            {
                              person.team
                            }
                          </small>
                        )}
                      </div>

                      <strong>
                        {
                          person.points
                        }{" "}
                        Punkte
                      </strong>

                    </div>
                  )
                )
              )}

            </section>
          )}

        {settings.cost_overview_enabled &&
          activeTab ===
            "dashboard" && (
            <section className="card cost">

              <h2>
                💶 Kostenaufteilung
              </h2>

              <div className="costBig">
                {totalCost.toFixed(
                  2
                )} €
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

              {settings.auto_split_costs && (
                <div className="costLine">
                  <span>
                    💶 Pro Person
                  </span>

                  <b>
                    {costPerPerson.toFixed(
                      2
                    )} €
                  </b>
                </div>
              )}

              <div className="costLine">
                <span>
                  🏆 Gesamtpunkte
                </span>

                <b>
                  {totalPoints}
                </b>
              </div>

              <div className="costLine">
                <span>
                  🍺 Liter
                </span>

                <b>
                  {totalLiters.toFixed(
                    1
                  )} L
                </b>
              </div>

              <p className="hint">
                Die Kosten werden automatisch
                gleichmäßig auf alle Teilnehmer
                verteilt.
              </p>

            </section>
          )}

        {settings.show_promille &&
          activeTab ===
            "dashboard" && (
            <section className="card">

              <h2>
                🥴 Promille-Übersicht
              </h2>

              <div className="dashboard-grid">

                <div className="dashboard-box">
                  <span>
                    🥴
                  </span>

                  <b>
                    {averagePromille.toFixed(
                      2
                    )}‰
                  </b>

                  <small>
                    Durchschnitt
                  </small>
                </div>

                <div className="dashboard-box">
                  <span>
                    ⚠️
                  </span>

                  <b>
                    {highestPromille.toFixed(
                      2
                    )}‰
                  </b>

                  <small>
                    Höchster Wert
                  </small>
                </div>

                <div className="dashboard-box">
                  <span>
                    🧪
                  </span>

                  <b>
                    {totalAlcohol.toFixed(
                      0
                    )} g
                  </b>

                  <small>
                    Alkohol
                  </small>
                </div>

              </div>

              <p className="warning">
                ⚠️ Die Promilleanzeige ist nur
                eine grobe Schätzung und kein
                zuverlässiger Wert für die
                Fahrtüchtigkeit.
              </p>

            </section>
          )}

        {activeTab ===
          "settings" && (
          <section className="card">

            <h2>
              ⚙️ Event-Einstellungen
            </h2>

            <p>
              {selectedEvent?.title ||
                "Aktuelles Event"}
            </p>

            {(
              Object.keys(
                defaultSettings
              ) as (keyof Settings)[]
            ).map(
              (key) => (
                <label
                  className="setting"
                  key={key}
                >

                  <div>
                    <b>
                      {settingLabel(
                        key
                      )}
                    </b>

                    <small>
                      {settingDescription(
                        key
                      )}
                    </small>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      settings[key]
                    }
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        [key]:
                          e.target
                            .checked,
                      })
                    }
                  />

                </label>
              )
            )}

            <button
              className="danger"
              onClick={
                resetEventData
              }
            >
              🗑️ Lokale Eventdaten zurücksetzen
            </button>

          </section>
        )}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <footer>

          <div className="footer-crate">
            🍺🍺🍺
          </div>

          <b>
            🍻 Güstener Zapfhahn Zentrale
          </b>

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

        body {
          margin: 0;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 50% -10%,
              #263b50 0%,
              #0c1117 42%,
              #070a0e 100%
            );
          color: #fff;
          padding: 16px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 900px;
          margin: auto;
        }

        .hero {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 12px 4px 24px;
        }

        .hero-text h1 {
          margin: 0;
          font-size: 27px;
          letter-spacing: -.6px;
        }

        .hero-text p {
          margin: 6px 0 0;
          color: #8997a5;
          font-size: 14px;
        }

        /*
          BIERKISTEN-LOGO
          Kein weißer Rand.
          Keine weiße Box.
          Nur die Kiste selbst.
        */

        .beer-crate {
          width: 82px;
          min-width: 82px;
          height: 76px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 7px;
          background:
            linear-gradient(
              145deg,
              #9b5b1e,
              #673710
            );
          border:
            3px solid #3a1d08;
          border-radius: 8px;
          box-shadow:
            0 8px 18px rgba(
              0,
              0,
              0,
              .45
            ),
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                .08
              );
          overflow: hidden;
        }

        .beer-crate::before {
          content: "";
          position: absolute;
          inset: 5px;
          border:
            2px solid rgba(
              255,
              190,
              65,
              .3
            );
          border-radius: 5px;
          pointer-events: none;
        }

        .beer-crate::after {
          content: "BIER";
          position: absolute;
          bottom: 3px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8px;
          font-weight: 900;
          color: #ffd36b;
          letter-spacing: 2px;
        }

        .crate-top,
        .crate-body {
          display: flex;
          justify-content: center;
          gap: 0;
          position: relative;
          z-index: 2;
        }

        .crate-top span,
        .crate-body span {
          font-size: 22px;
          line-height: 22px;
          filter:
            drop-shadow(
              0 2px 2px
              rgba(0,0,0,.5)
            );
        }

        .crate-body {
          margin-top: -1px;
        }

        .event-bar {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: end;
          background:
            rgba(
              255,
              255,
              255,
              .055
            );
          border:
            1px solid rgba(
              255,
              255,
              255,
              .08
            );
          border-radius: 18px;
          padding: 14px;
          margin-bottom: 14px;
        }

        .event-bar small {
          display: block;
          color: #8795a4;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }

        .card {
          background:
            rgba(
              255,
              255,
              255,
              .055
            );
          border:
            1px solid rgba(
              255,
              255,
              255,
              .08
            );
          border-radius: 20px;
          padding: 18px;
          margin-bottom: 14px;
          box-shadow:
            0 12px 30px
            rgba(
              0,
              0,
              0,
              .14
            );
        }

        h2 {
          margin:
            0 0 15px;
          font-size: 19px;
        }

        h3 {
          margin: 0 0 4px;
        }

        p {
          color: #9aa7b5;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .stats div {
          background:
            rgba(
              255,
              255,
              255,
              .055
            );
          border:
            1px solid rgba(
              255,
              255,
              255,
              .06
            );
          border-radius: 16px;
          padding: 14px 8px;
          text-align: center;
        }

        .stats span {
          display: block;
          font-size: 22px;
        }

        .stats b {
          display: block;
          font-size: 19px;
          margin: 5px 0 2px;
        }

        .stats small {
          color: #8794a2;
          font-size: 10px;
        }

        .tabs {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 10px;
          margin-bottom: 4px;
        }

        .tabs button {
          white-space: nowrap;
          background:
            rgba(
              255,
              255,
              255,
              .055
            );
          color: #aeb9c4;
          border:
            1px solid rgba(
              255,
              255,
              255,
              .07
            );
        }

        .tabs button.active {
          background: #f59e0b;
          color: #111;
          border-color:
            #f59e0b;
        }

        input,
        select {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border:
            1px solid #303b47;
          background: #121a23;
          color: #fff;
          margin-bottom: 10px;
          outline: none;
        }

        input:focus,
        select:focus {
          border-color:
            #f59e0b;
          box-shadow:
            0 0 0 2px
            rgba(
              245,
              158,
              11,
              .12
            );
        }

        button {
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          background: #f59e0b;
          color: #111;
          font-weight: 800;
          cursor: pointer;
        }

        button:active {
          transform:
            translateY(1px);
        }

        .secondary {
          background:
            #273442;
          color: #fff;
        }

        .save {
          width: 100%;
          margin-top: 3px;
        }

        .danger {
          width: 100%;
          background:
            #67272a;
          color: #fff;
          margin-top: 14px;
        }

        .three {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
        }

        .dashboard-box {
          text-align: center;
          padding: 16px 8px;
          background:
            rgba(
              255,
              255,
              255,
              .045
            );
          border-radius: 15px;
        }

        .dashboard-box span {
          display: block;
          font-size: 22px;
        }

        .dashboard-box b {
          display: block;
          font-size: 20px;
          margin: 6px 0;
        }

        .dashboard-box small {
          color: #8995a3;
        }

        .person-form {
          background:
            rgba(
              255,
              255,
              255,
              .035
            );
          padding: 13px;
          border-radius: 15px;
          margin-top: 10px;
          margin-bottom: 10px;
        }

        .person-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background:
            rgba(
              255,
              255,
              255,
              .045
            );
          border-radius: 15px;
          padding: 12px;
          margin-top: 8px;
        }

        .person-main {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .person-main b {
          display: block;
        }

        .person-main small {
          display: block;
          color: #8995a3;
          margin-top: 3px;
        }

        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background:
            #283441;
          font-size: 20px;
        }

        .person-values {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .person-values strong {
          font-size: 12px;
          white-space: nowrap;
        }

        .delete {
          background:
            #303944;
          color: #fff;
          padding:
            7px 11px;
        }

        .assignment {
          display: grid;
          grid-template-columns:
            1fr 1.5fr;
          gap: 10px;
          align-items: center;
          padding: 10px;
          background:
            rgba(
              255,
              255,
              255,
              .04
            );
          border-radius: 13px;
          margin-bottom: 8px;
        }

        .assignment b {
          display: block;
        }

        .assignment small {
          display: block;
          color: #8794a2;
          margin-top: 3px;
        }

        .assignment select {
          margin: 0;
        }

        .item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background:
            rgba(
              255,
              255,
              255,
              .045
            );
          border-radius: 14px;
          padding: 13px;
          margin-top: 8px;
        }

        .item small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
        }

        .cost {
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
            rgba(
              255,
              255,
              255,
              .045
            );
          padding: 13px;
          border-radius: 12px;
          margin-top: 8px;
        }

        .hint {
          font-size: 12px;
        }

        .warning {
          background:
            rgba(
              245,
              158,
              11,
              .08
            );
          border:
            1px solid rgba(
              245,
              158,
              11,
              .2
            );
          padding: 12px;
          border-radius: 12px;
          font-size: 12px;
        }

        .ai-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 13px;
          border-radius: 13px;
          background:
            rgba(
              90,
              130,
              255,
              .08
            );
          border:
            1px solid rgba(
              90,
              130,
              255,
              .15
            );
          margin-bottom: 10px;
        }

        .ai-box small {
          color: #8f9eaf;
        }

        .upload {
          display: block;
          padding: 13px;
          border-radius: 12px;
          background:
            #151f29;
          border:
            1px dashed #3b4958;
          text-align: center;
          cursor: pointer;
          margin-bottom: 10px;
        }

        .upload input {
          display: none;
        }

        .preview {
          width: 100%;
          max-height: 280px;
          object-fit: cover;
          border-radius: 14px;
          margin-bottom: 10px;
        }

        .person-large {
          display: flex;
          align-items: center;
          gap: 13px;
          background:
            rgba(
              255,
              255,
              255,
              .045
            );
          border-radius: 16px;
          padding: 14px;
          margin-top: 8px;
        }

        .avatar-big {
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            #283441;
          font-size: 26px;
        }

        .person-info {
          flex: 1;
        }

        .person-info p {
          margin: 3px 0;
          font-size: 12px;
        }

        .mini-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 8px;
        }

        .mini-stats span {
          background:
            rgba(
              255,
              255,
              255,
              .06
            );
          padding:
            5px 8px;
          border-radius: 8px;
          font-size: 11px;
        }

        .ranking-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ranking-title > div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ranking-title h2 {
          margin: 0;
        }

        .trophy {
          font-size: 30px;
        }

        .rank {
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          gap: 10px;
          align-items: center;
          background:
            rgba(
              255,
              255,
              255,
              .045
            );
          padding: 14px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .rank-first {
          background:
            linear-gradient(
              90deg,
              rgba(
                245,
                158,
                11,
                .18
              ),
              rgba(
                255,
                255,
                255,
                .04
              )
            );
          border:
            1px solid rgba(
              245,
              158,
              11,
              .25
            );
        }

        .rank small {
          display: block;
          color: #8995a3;
          margin-top: 3px;
        }

        .setting {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom:
            1px solid rgba(
              255,
              255,
              255,
              .07
            );
        }

        .setting b {
          display: block;
        }

        .setting small {
          display: block;
          color: #82909f;
          margin-top: 3px;
          font-size: 11px;
        }

        .setting input {
          width: 21px;
          height: 21px;
          margin: 0;
          accent-color:
            #f59e0b;
        }

        .message {
          position: fixed;
          left: 50%;
          bottom: 20px;
          transform:
            translateX(-50%);
          z-index: 50;
          width:
            min(
              calc(100% - 30px),
              600px
            );
          background:
            #172230;
          border:
            1px solid #344454;
          border-radius: 13px;
          padding: 13px;
          text-align: center;
          color: #fbbf24;
          box-shadow:
            0 12px 35px
            rgba(
              0,
              0,
              0,
              .4
            );
        }

        footer {
          text-align: center;
          padding: 30px 10px;
          color: #667585;
        }

        .footer-crate {
          font-size: 23px;
          margin-bottom: 7px;
        }

        footer b {
          display: block;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        @media (
          max-width: 700px
        ) {

          .hero-text h1 {
            font-size: 22px;
          }

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .dashboard-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .three {
            grid-template-columns:
              1fr;
          }

          .event-bar {
            grid-template-columns:
              1fr;
          }

          .assignment {
            grid-template-columns:
              1fr;
          }

          .person-values {
            flex-direction:
              column;
            align-items:
              flex-end;
            gap: 4px;
          }

          .person-large {
            align-items:
              flex-start;
          }

          .rank {
            grid-template-columns:
              38px 1fr auto;
          }

        }

        @media (
          max-width: 430px
        ) {

          .page {
            padding: 10px;
          }

          .hero {
            gap: 10px;
          }

          .beer-crate {
            width: 68px;
            min-width: 68px;
            height: 64px;
          }

          .crate-top span,
          .crate-body span {
            font-size: 18px;
            line-height: 18px;
          }

          .hero-text h1 {
            font-size: 19px;
          }

          .hero-text p {
            font-size: 11px;
          }

          .card {
            padding: 14px;
          }

        }

      `}</style>
    </main>
  );
}

function settingLabel(
  key: keyof Settings
) {
  const labels: Record<
    keyof Settings,
    string
  > = {
    ranking_enabled:
      "🏆 Ranking aktivieren",
    show_points:
      "⭐ Punkte anzeigen",
    show_ranking:
      "🏆 Ranking anzeigen",
    show_promille:
      "🥴 Promille anzeigen",
    show_statistics:
      "📊 Statistiken anzeigen",
    show_drink_amounts:
      "🍺 Getränkemengen anzeigen",
    photo_required:
      "📷 Foto verpflichtend",
    ai_recognition_enabled:
      "🤖 KI-Erkennung",
    manual_entry_allowed:
      "✍️ Manuelle Eingabe",
    cost_overview_enabled:
      "💶 Kostenübersicht",
    auto_split_costs:
      "💶 Kosten automatisch teilen",
    team_mode:
      "👥 Team-Modus",
    show_photos:
      "📷 Fotos anzeigen",
    show_costs:
      "💰 Kosten anzeigen",
    privacy_mode:
      "🔒 Datenschutzmodus",
  };

  return labels[key];
}

function settingDescription(
  key: keyof Settings
) {
  const descriptions: Record<
    keyof Settings,
    string
  > = {
    ranking_enabled:
      "Punkte können für Getränke vergeben werden.",
    show_points:
      "Punktestand der Teilnehmer sichtbar.",
    show_ranking:
      "Rangliste im Event anzeigen.",
    show_promille:
      "Geschätzten Promillewert anzeigen.",
    show_statistics:
      "Event-Statistiken anzeigen.",
    show_drink_amounts:
      "Liter und Getränkemengen anzeigen.",
    photo_required:
      "Jedes Getränk benötigt ein Foto.",
    ai_recognition_enabled:
      "Vorbereitung für automatische Bilderkennung.",
    manual_entry_allowed:
      "Getränke können manuell eingetragen werden.",
    cost_overview_enabled:
      "Kostenbereich des Events anzeigen.",
    auto_split_costs:
      "Gesamtkosten gleichmäßig verteilen.",
    team_mode:
      "Teilnehmer können Teams zugeordnet werden.",
    show_photos:
      "Getränkefotos anzeigen.",
    show_costs:
      "Preise und Kosten anzeigen.",
    privacy_mode:
      "Persönliche Daten möglichst reduziert anzeigen.",
  };

  return descriptions[key];
}
