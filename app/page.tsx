"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Event = {
  id: string;
  title: string;
};

type Person = {
  id: string;
  name: string;
  points: number;
  drinks: number;
  liters: number;
  cost: number;
  promille?: number;
};

type Drink = {
  id: string;
  getraenk?: string;
  drink_name?: string;
  liters?: number;
  menge?: number;
  alkohol?: number;
  alcohol_percent?: number;
  preis?: number;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status: string;
  message?: string;
  created_at: string;
  requester_name?: string;
};

type BeerResponse = {
  request_id: string;
  profile_id: string;
  response: string;
};

type Payment = {
  id: string;
  profile_id?: string;
  amount?: number;
  description?: string;
  status?: string;
  created_at?: string;
  person_name?: string;
};

type PointHistory = {
  id?: string;
  profile_id?: string;
  points?: number;
  reason?: string;
  description?: string;
  created_at?: string;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [people, setPeople] = useState<Person[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);

  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [beerResponses, setBeerResponses] = useState<BeerResponse[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] =
    useState("Getränkeeinkauf");

  const [message, setMessage] = useState("");

  const [animation, setAnimation] = useState<
    "prost" | "money" | "beer" | null
  >(null);

  const [selectedPerson, setSelectedPerson] =
    useState<Person | null>(null);

  const [loading, setLoading] = useState(false);

  /*
   * ---------------------------------------------------------
   * EVENTS
   * ---------------------------------------------------------
   */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id,title")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("❌ Events konnten nicht geladen werden.");
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
    const title = window.prompt("🍻 Name des neuen Events:");

    if (!title?.trim()) return;

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: title.trim(),
      })
      .select("id,title")
      .single();

    if (error) {
      setMessage(
        "❌ Event konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    if (data) {
      setEvents((old) => [data, ...old]);
      setEventId(data.id);
      setMessage("✅ Event erstellt!");
    }
  }

  async function deleteEvent() {
    if (!eventId) return;

    const event = events.find((e) => e.id === eventId);

    if (
      !window.confirm(
        `⚠️ Event "${event?.title}" wirklich löschen?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      setMessage(
        "❌ Event konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    setEvents((old) =>
      old.filter((e) => e.id !== eventId)
    );

    setEventId("");
    setPeople([]);
    setDrinks([]);
    setPayments([]);
    setBeerRequests([]);

    setMessage("🗑️ Event gelöscht.");
  }

  /*
   * ---------------------------------------------------------
   * DRINKS
   * ---------------------------------------------------------
   */

  async function loadDrinks() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setDrinks(data);
    }
  }

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
      .insert({
        event_id: eventId,
        getraenk: drinkName.trim(),
        drink_name: drinkName.trim(),
        menge: Number(liters),
        liters: Number(liters),
        alkohol: Number(alcohol),
        alcohol_percent: Number(alcohol),
        preis: Number(price),
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
    if (!eventId) return;

    const { data: members } = await supabase
      .from("event_members")
      .select("profile_id")
      .eq("event_id", eventId);

    if (!members) {
      setPeople([]);
      return;
    }

    const ids = members.map(
      (m) => m.profile_id
    );

    if (ids.length === 0) {
      setPeople([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    if (!profiles) {
      setPeople([]);
      return;
    }

    const result: Person[] = profiles.map(
      (profile: any) => ({
        id: profile.id,
        name:
          profile.username ||
          profile.name ||
          "Teilnehmer",
        points: Number(
          profile.points || 0
        ),
        drinks: Number(
          profile.drinks_count || 0
        ),
        liters: Number(
          profile.liters || 0
        ),
        cost: Number(
          profile.cost || 0
        ),
        promille: Number(
          profile.promille || 0
        ),
      })
    );

    setPeople(result);
  }

  async function addPerson() {
    if (!personName.trim()) {
      setMessage("❌ Bitte einen Namen eingeben.");
      return;
    }

    if (!eventId) {
      setMessage("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    const name = personName.trim();

    const existing = people.some(
      (p) =>
        p.name.toLowerCase() ===
        name.toLowerCase()
    );

    if (existing) {
      setMessage("❌ Teilnehmer bereits vorhanden.");
      return;
    }

    const { data: profile, error } =
      await supabase
        .from("profiles")
        .insert({
          username: name,
          name,
          points: 0,
          drinks_count: 0,
        })
        .select("id")
        .single();

    if (error || !profile) {
      setMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          (error?.message || "Unbekannter Fehler")
      );
      return;
    }

    const { error: memberError } =
      await supabase
        .from("event_members")
        .insert({
          event_id: eventId,
          profile_id: profile.id,
        });

    if (memberError) {
      setMessage(
        "❌ Teilnehmer konnte nicht dem Event hinzugefügt werden: " +
          memberError.message
      );
      return;
    }

    setPersonName("");

    await loadPeople();

    setMessage("✅ Teilnehmer hinzugefügt!");
  }

  /*
   * ---------------------------------------------------------
   * DRINK ASSIGNMENT
   * ---------------------------------------------------------
   */

  async function assignDrink(
    person: Person,
    drink: Drink
  ) {
    const drinkLiters = Number(
      drink.liters ??
        drink.menge ??
        0
    );

    const drinkPrice = Number(
      drink.preis ?? 0
    );

    const newPoints = person.points + 10;
    const newDrinks = person.drinks + 1;
    const newLiters =
      person.liters + drinkLiters;
    const newCost =
      person.cost + drinkPrice;

    await supabase
      .from("profiles")
      .update({
        points: newPoints,
        drinks_count: newDrinks,
        liters: newLiters,
        cost: newCost,
      })
      .eq("id", person.id);

    await supabase
      .from("point_history")
      .insert({
        profile_id: person.id,
        points: 10,
        reason: "Getränk",
        description:
          `Getränk getrunken: ${
            drink.getraenk ||
            drink.drink_name ||
            "Getränk"
          }`,
      })
      .then(() => {});

    setAnimation("prost");

    setTimeout(() => {
      setAnimation(null);
    }, 2200);

    await loadPeople();
    await loadPointHistory();

    setMessage(
      `🍺 ${person.name} hat ein Getränk bekommen! +10 Punkte`
    );
  }

  /*
   * ---------------------------------------------------------
   * PAYMENTS
   * ---------------------------------------------------------
   */

  async function loadPayments() {
    if (!eventId) return;

    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (data) {
      setPayments(data);
    }
  }

  async function savePayment() {
    if (!eventId) {
      setMessage("❌ Bitte Event auswählen.");
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

    const firstPerson = people[0];

    const { error } = await supabase
      .from("payments")
      .insert({
        event_id: eventId,
        profile_id:
          firstPerson?.id || null,
        amount,
        description:
          paymentDescription ||
          "Getränkeeinkauf",
        status: "paid",
      });

    if (error) {
      setMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setPaymentAmount("");

    setAnimation("money");

    setTimeout(() => {
      setAnimation(null);
    }, 2500);

    await loadPayments();

    setMessage(
      `💶 Zahlung über ${amount.toFixed(
        2
      )} € gespeichert!`
    );
  }

  /*
   * ---------------------------------------------------------
   * POINT HISTORY
   * ---------------------------------------------------------
   */

  async function loadPointHistory() {
    if (!selectedPerson) return;

    const { data } = await supabase
      .from("point_history")
      .select("*")
      .eq(
        "profile_id",
        selectedPerson.id
      )
      .order("created_at", {
        ascending: false,
      });

    if (data) {
      setPointHistory(data);
    }
  }

  /*
   * ---------------------------------------------------------
   * BEER SYSTEM
   * ---------------------------------------------------------
   */

  async function loadBeerRequests() {
    if (!eventId) return;

    const { data: requests } =
      await supabase
        .from("beer_requests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        });

    if (!requests) {
      setBeerRequests([]);
      return;
    }

    const ids = requests.map(
      (r) => r.requester_profile_id
    );

    let names: Record<string, string> =
      {};

    if (ids.length > 0) {
      const { data: profiles } =
        await supabase
          .from("profiles")
          .select("id,username,name")
          .in("id", ids);

      profiles?.forEach((p: any) => {
        names[p.id] =
          p.username ||
          p.name ||
          "Teilnehmer";
      });
    }

    setBeerRequests(
      requests.map((r) => ({
        ...r,
        requester_name:
          names[r.requester_profile_id] ||
          "Teilnehmer",
      }))
    );

    const requestIds = requests.map(
      (r) => r.id
    );

    if (requestIds.length > 0) {
      const { data: responses } =
        await supabase
          .from("beer_request_responses")
          .select("*")
          .in(
            "request_id",
            requestIds
          );

      if (responses) {
        setBeerResponses(responses);
      }
    }
  }

  async function requestBeer() {
    if (!eventId || people.length < 2) {
      setMessage(
        "🍺 Es müssen mindestens zwei Teilnehmer im Event sein."
      );
      return;
    }

    const requester = people[0];

    const { error } = await supabase.rpc(
      "create_beer_request",
      {
        input_event_id: eventId,
        input_requester_profile_id:
          requester.id,
        input_message:
          `${requester.name} möchte ein Bier mit dir trinken 🍻`,
      }
    );

    if (error) {
      setMessage(
        "❌ Bier-Anfrage konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setAnimation("beer");

    setTimeout(() => {
      setAnimation(null);
    }, 2200);

    await loadBeerRequests();

    setMessage(
      `🍻 ${requester.name} möchte ein Bier mit dir trinken!`
    );
  }

  async function respondBeer(
    requestId: string,
    response: "accepted" | "declined",
    personId: string
  ) {
    const { error } = await supabase.rpc(
      "respond_to_beer_request",
      {
        input_request_id: requestId,
        input_profile_id: personId,
        input_response: response,
      }
    );

    if (error) {
      setMessage(
        "❌ Antwort konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    if (response === "accepted") {
      await supabase
        .from("profiles")
        .update({
          points: 10,
        })
        .eq("id", personId);

      await supabase
        .from("point_history")
        .insert({
          profile_id: personId,
          points: 10,
          reason: "Bier-Runde",
          description:
            "Bier-Anfrage angenommen 🍻",
        })
        .then(() => {});
    }

    await loadBeerRequests();
    await loadPeople();

    setMessage(
      response === "accepted"
        ? "🍻 Bier-Anfrage angenommen! +10 Punkte"
        : "❌ Bier-Anfrage abgelehnt."
    );
  }

  async function sponsorCrate(
    person: Person
  ) {
    if (!eventId) return;

    const crates = Number(
      window.prompt(
        "🍺 Wie viele Kisten Bier möchtest du spendieren?",
        "1"
      )
    );

    if (!crates || crates < 1) return;

    const points = crates * 50;

    const { error } = await supabase.rpc(
      "sponsor_beer_crate",
      {
        input_event_id: eventId,
        input_profile_id: person.id,
        input_crates: crates,
      }
    );

    if (error) {
      setMessage(
        "❌ Kiste konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    await supabase
      .from("profiles")
      .update({
        points:
          person.points + points,
      })
      .eq("id", person.id);

    await supabase
      .from("point_history")
      .insert({
        profile_id: person.id,
        points,
        reason: "Kiste Bier",
        description:
          `${crates} Kiste${
            crates > 1 ? "n" : ""
          } Bier spendiert 🍺`,
      })
      .then(() => {});

    await loadPeople();
    await loadPointHistory();

    setMessage(
      `🍺 ${person.name} spendiert ${crates} Kiste${
        crates > 1 ? "n" : ""
      }! +${points} Punkte`
    );
  }

  /*
   * ---------------------------------------------------------
   * EFFECTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    loadDrinks();
    loadPeople();
    loadPayments();
    loadBeerRequests();
  }, [eventId]);

  useEffect(() => {
    if (selectedPerson) {
      loadPointHistory();
    }
  }, [selectedPerson]);

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
            drink.preis || 0
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
            payment.amount || 0
          ),
        0
      ),
    [payments]
  );

  const totalPoints = people.reduce(
    (sum, person) =>
      sum + person.points,
    0
  );

  const ranking = [...people].sort(
    (a, b) =>
      b.points - a.points
  );

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <main className="page">

      {/* ANIMATION */}

      {animation === "prost" && (
        <div className="overlayAnimation">
          <div className="beerClink">
            🍺 🥂 🍺
          </div>
          <div className="prostText">
            PROST! 🍻
          </div>
        </div>
      )}

      {animation === "money" && (
        <div className="moneyRain">
          💶 💵 💶 💵 💶
          <br />
          💵 💶 💵 💶 💵
          <br />
          💶 💵 💶 💵 💶
        </div>
      )}

      {animation === "beer" && (
        <div className="overlayAnimation">
          <div className="bigBeer">
            🍺
          </div>
          <div className="prostText">
            BIER? 🍻
          </div>
        </div>
      )}

      <div className="container">

        {/* HEADER */}

        <header>
          <div className="logo">
            🍻
          </div>

          <div>
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Dein Event. Deine Getränke.
              Deine Runde. 🍺
            </p>
          </div>
        </header>

        {/* EVENT */}

        <section className="card eventCard">

          <div className="sectionTitle">
            <h2>
              📅 Event
            </h2>

            <button
              className="smallButton"
              onClick={createEvent}
            >
              ➕ Neues Event
            </button>
          </div>

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

            {events.map((event) => (
              <option
                key={event.id}
                value={event.id}
              >
                {event.title}
              </option>
            ))}
          </select>

          {eventId && (
            <button
              className="deleteEvent"
              onClick={deleteEvent}
            >
              🗑️ Event löschen
            </button>
          )}
        </section>

        {/* STATS */}

        <div className="stats">

          <div>
            🍺
            <b>
              {drinks.length}
            </b>
            <small>
              Getränke
            </small>
          </div>

          <div>
            💧
            <b>
              {totalLiters.toFixed(1)}
            </b>
            <small>
              Liter
            </small>
          </div>

          <div>
            💶
            <b>
              {totalDrinkCost.toFixed(
                2
              )} €
            </b>
            <small>
              Getränke
            </small>
          </div>

          <div>
            👥
            <b>
              {people.length}
            </b>
            <small>
              Teilnehmer
            </small>
          </div>

        </div>

        {/* BIG BEER BUTTON */}

        <section className="beerHero">

          <button
            className="beerButton"
            onClick={requestBeer}
          >
            <span className="beerIcon">
              🍺
            </span>

            <span>
              BIER
            </span>

            <small>
              Wer trinkt ein Bier
              mit mir?
            </small>
          </button>

        </section>

        {/* BEER REQUESTS */}

        {beerRequests.length > 0 && (
          <section className="card">

            <h2>
              🔔 Bier-Anfragen
            </h2>

            {beerRequests.map(
              (request) => {

                const myResponses =
                  beerResponses.filter(
                    (r) =>
                      r.request_id ===
                      request.id
                  );

                return (
                  <div
                    className="beerRequest"
                    key={request.id}
                  >

                    <div>
                      <strong>
                        🍻{" "}
                        {
                          request.requester_name
                        }
                      </strong>

                      <p>
                        möchte ein Bier
                        mit dir trinken.
                      </p>
                    </div>

                    <div className="requestButtons">

                      {people
                        .filter(
                          (p) =>
                            p.id !==
                            request.requester_profile_id
                        )
                        .map((person) => {

                          const answer =
                            myResponses.find(
                              (r) =>
                                r.profile_id ===
                                person.id
                            );

                          return (
                            <div
                              key={person.id}
                              className="responseRow"
                            >

                              <span>
                                {person.name}
                              </span>

                              {answer ? (
                                <b>
                                  {answer.response ===
                                  "accepted"
                                    ? "✅"
                                    : "❌"}
                                </b>
                              ) : (
                                <>
                                  <button
                                    className="accept"
                                    onClick={() =>
                                      respondBeer(
                                        request.id,
                                        "accepted",
                                        person.id
                                      )
                                    }
                                  >
                                    ✅
                                  </button>

                                  <button
                                    className="decline"
                                    onClick={() =>
                                      respondBeer(
                                        request.id,
                                        "declined",
                                        person.id
                                      )
                                    }
                                  >
                                    ❌
                                  </button>
                                </>
                              )}

                            </div>
                          );
                        })}

                    </div>
                  </div>
                );
              }
            )}

          </section>
        )}

        {/* PEOPLE */}

        <section className="card">

          <h2>
            👥 Teilnehmer
          </h2>

          <div className="row">

            <input
              placeholder="Name"
              value={personName}
              onChange={(e) =>
                setPersonName(
                  e.target.value
                )
              }
            />

            <button
              onClick={addPerson}
            >
              ➕ Hinzufügen
            </button>

          </div>

          {people.map((person) => (

            <div
              className="personItem"
              key={person.id}
            >

              <div>
                <strong>
                  👤 {person.name}
                </strong>

                <small>
                  🍺 {person.drinks}
                  {" · "}
                  💧{" "}
                  {person.liters.toFixed(
                    1
                  )} L
                  {" · "}
                  🏆{" "}
                  {person.points}
                  {" · "}
                  🍺{" "}
                  {(
                    person.promille ||
                    0
                  ).toFixed(2)} ‰
                </small>
              </div>

              <div className="personActions">

                <button
                  className="crateButton"
                  onClick={() =>
                    sponsorCrate(
                      person
                    )
                  }
                >
                  🍺 Kiste
                </button>

                <button
                  className="historyButton"
                  onClick={() =>
                    setSelectedPerson(
                      person
                    )
                  }
                >
                  🏆
                </button>

              </div>

            </div>

          ))}

        </section>

        {/* DRINK ADD */}

        <section className="card">

          <h2>
            🍺 Getränk hinzufügen
          </h2>

          <input
            placeholder="Getränk"
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
              value={liters}
              onChange={(e) =>
                setLiters(
                  e.target.value
                )
              }
              placeholder="Liter"
            />

            <input
              type="number"
              value={alcohol}
              onChange={(e) =>
                setAlcohol(
                  e.target.value
                )
              }
              placeholder="Alkohol %"
            />

            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
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

        {/* ASSIGN */}

        <section className="card">

          <h2>
            🔗 Getränk zuordnen
          </h2>

          {people.length === 0 ? (
            <p>
              👥 Zuerst Teilnehmer
              hinzufügen.
            </p>
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
                  onChange={(e) => {

                    const drink =
                      drinks.find(
                        (d) =>
                          d.id ===
                          e.target.value
                      );

                    if (drink) {
                      assignDrink(
                        person,
                        drink
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
                        key={drink.id}
                        value={drink.id}
                      >
                        {drink.getraenk ||
                          drink.drink_name ||
                          "Getränk"}
                        {" · "}
                        {Number(
                          drink.preis ||
                            0
                        ).toFixed(2)}
                        €
                      </option>

                    )
                  )}

                </select>

              </div>

            ))

          )}

        </section>

        {/* DRINKS */}

        <section className="card">

          <h2>
            🍺 Getränke
          </h2>

          {drinks.map((drink) => (

            <div
              className="item"
              key={drink.id}
            >

              <div>

                <strong>
                  🍺{" "}
                  {drink.getraenk ||
                    drink.drink_name ||
                    "Getränk"}
                </strong>

                <small>
                  {Number(
                    drink.liters ??
                      drink.menge ??
                      0
                  ).toFixed(1)}
                  {" L · "}
                  {Number(
                    drink.alcohol_percent ??
                      drink.alkohol ??
                      0
                  ).toFixed(1)}
                  {" %"}
                </small>

              </div>

              <b>
                {Number(
                  drink.preis || 0
                ).toFixed(2)}
                €
              </b>

            </div>

          ))}

        </section>

        {/* PAYMENT */}

        <section className="card">

          <h2>
            💶 Zahlung
          </h2>

          <input
            type="number"
            step="0.01"
            placeholder="Betrag €"
            value={paymentAmount}
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

          <button
            className="save"
            onClick={savePayment}
          >
            💶 Zahlung speichern
          </button>

          <div className="paymentTotal">
            <span>
              💰 Gesamt bezahlt
            </span>

            <b>
              {totalPayments.toFixed(
                2
              )} €
            </b>
          </div>

          {payments.map(
            (payment) => (

              <div
                className="item"
                key={payment.id}
              >

                <div>
                  <strong>
                    💶{" "}
                    {payment.person_name ||
                      "Teilnehmer"}
                  </strong>

                  <small>
                    {payment.description ||
                      "Zahlung"}
                  </small>
                </div>

                <b>
                  {Number(
                    payment.amount ||
                      0
                  ).toFixed(2)}
                  €
                </b>

              </div>

            )
          )}

        </section>

        {/* RANKING */}

        <section className="card">

          <h2>
            🏆 Lustigste Rangliste
          </h2>

          <p className="rankingSubtitle">
            Wer wird zur Legende des
            Abends? 😎
          </p>

          {ranking.map(
            (person, index) => (

              <button
                className="rank"
                key={person.id}
                onClick={() =>
                  setSelectedPerson(
                    person
                  )
                }
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
                  {person.points} 🏆
                </b>

              </button>

            )
          )}

          <div className="totalPoints">
            🏆 Insgesamt{" "}
            <b>
              {totalPoints}
            </b>{" "}
            Punkte
          </div>

        </section>

        {/* PERSON DETAIL */}

        {selectedPerson && (

          <section className="modal">

            <div className="modalBox">

              <button
                className="close"
                onClick={() =>
                  setSelectedPerson(
                    null
                  )
                }
              >
                ×
              </button>

              <h2>
                🏆{" "}
                {selectedPerson.name}
              </h2>

              <div className="profileBig">
                {selectedPerson.points}
                <small>
                  Punkte
                </small>
              </div>

              <h3>
                📜 Punkte-Historie
              </h3>

              {pointHistory.length ===
              0 ? (
                <p>
                  Noch keine
                  Punkte-Historie.
                </p>
              ) : (

                pointHistory.map(
                  (entry, index) => (

                    <div
                      className="history"
                      key={
                        entry.id ||
                        index
                      }
                    >

                      <div>
                        <strong>
                          {entry.reason ||
                            "Punkte"}
                        </strong>

                        <small>
                          {entry.description ||
                            ""}
                        </small>
                      </div>

                      <b>
                        +
                        {entry.points ||
                          0}
                      </b>

                    </div>

                  )
                )

              )}

            </div>

          </section>

        )}

        {/* MESSAGE */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <footer>
          🍻 Güstener Zapfhahn
          Zentrale
          <small>
            Dein Event. Deine Getränke.
            Deine Runde.
          </small>
        </footer>

      </div>

      <style jsx global>{`

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
          background: #080b10;
        }

        body {
          overflow-x: hidden;
        }

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 18px;
          color: white;
          font-family:
            Arial,
            Helvetica,
            sans-serif;

          background:
            radial-gradient(
              circle at 20% 0%,
              #49320d 0,
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 20%,
              #162c3d 0,
              transparent 35%
            ),
            linear-gradient(
              145deg,
              #070a0e,
              #101821 50%,
              #07090d
            );
        }

        .container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding:
            10px 4px 25px;
        }

        .logo {
          font-size: 42px;
          background:
            linear-gradient(
              145deg,
              #f59e0b,
              #d97706
            );
          padding: 12px;
          border-radius: 20px;
          box-shadow:
            0 10px 30px
              rgba(245,158,11,.25);
        }

        h1 {
          font-size: 26px;
          margin: 0;
        }

        h2 {
          margin:
            0 0 15px;
        }

        h3 {
          margin-top: 25px;
        }

        p {
          color: #9aa6b2;
        }

        .card {
          background:
            rgba(255,255,255,.055);
          border:
            1px solid
            rgba(255,255,255,.09);
          border-radius: 22px;
          padding: 18px;
          margin-bottom: 15px;
          backdrop-filter: blur(10px);
          box-shadow:
            0 15px 35px
              rgba(0,0,0,.18);
        }

        .sectionTitle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        input,
        select {
          width: 100%;
          padding: 14px;
          margin-bottom: 10px;
          border-radius: 13px;
          border:
            1px solid
            #303b48;
          background: #111820;
          color: white;
          outline: none;
        }

        input:focus,
        select:focus {
          border-color:
            #f59e0b;
        }

        button {
          border: 0;
          cursor: pointer;
          border-radius: 13px;
          padding: 13px 17px;
          font-weight: 800;
        }

        .smallButton {
          background: #f59e0b;
          color: #111;
        }

        .deleteEvent {
          background: #3b1616;
          color: #ff8b8b;
          width: 100%;
        }

        .stats {
          display:
            grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stats div {
          text-align: center;
          padding: 16px 8px;
          border-radius: 18px;
          background:
            rgba(255,255,255,.055);
          border:
            1px solid
            rgba(255,255,255,.07);
        }

        .stats b,
        .stats small {
          display: block;
        }

        .stats b {
          font-size: 20px;
          margin: 5px 0;
        }

        .stats small {
          color: #8995a3;
          font-size: 11px;
        }

        .beerHero {
          margin-bottom: 15px;
        }

        .beerButton {
          width: 100%;
          min-height: 190px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 3px;

          color: white;

          background:
            radial-gradient(
              circle at 50% 20%,
              #ff5757,
              #b81414 55%,
              #710b0b
            );

          border:
            3px solid
            rgba(255,255,255,.18);

          box-shadow:
            0 15px 45px
              rgba(200,20,20,.35);

          transition:
            transform .15s,
            box-shadow .15s;
        }

        .beerButton:hover {
          transform:
            translateY(-3px)
            scale(1.01);

          box-shadow:
            0 20px 55px
              rgba(255,40,40,.45);
        }

        .beerButton:active {
          transform:
            scale(.97);
        }

        .beerIcon {
          font-size: 55px;
        }

        .beerButton span:not(.beerIcon) {
          font-size: 42px;
          letter-spacing: 5px;
        }

        .beerButton small {
          font-size: 13px;
          opacity: .85;
        }

        .beerRequest {
          background:
            rgba(255,255,255,.05);
          border-radius: 16px;
          padding: 14px;
          margin-top: 10px;
        }

        .requestButtons {
          margin-top: 12px;
        }

        .responseRow {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
        }

        .responseRow span {
          flex: 1;
        }

        .accept {
          background: #16a34a;
          color: white;
        }

        .decline {
          background: #991b1b;
          color: white;
        }

        .row {
          display:
            grid;
          grid-template-columns:
            1fr auto;
          gap: 8px;
        }

        .three {
          display:
            grid;
          grid-template-columns:
            repeat(3,1fr);
          gap: 8px;
        }

        .save {
          width: 100%;
          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );
          color: #111;
        }

        .personItem,
        .item,
        .history {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 15px;
          background:
            rgba(255,255,255,.045);
        }

        .personItem small,
        .item small,
        .history small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
        }

        .personActions {
          display: flex;
          gap: 6px;
        }

        .crateButton {
          background: #f59e0b;
          color: #111;
        }

        .historyButton {
          background: #303944;
          color: white;
        }

        .assignment {
          display:
            grid;
          grid-template-columns:
            1fr 1.5fr;
          gap: 10px;
          align-items: center;
          margin-bottom: 8px;
        }

        .assignment select {
          margin: 0;
        }

        .paymentTotal {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          margin-top: 10px;
          border-radius: 14px;
          background:
            rgba(245,158,11,.1);
        }

        .rank {
          width: 100%;
          display:
            grid;
          grid-template-columns:
            45px 1fr auto;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
          background:
            rgba(255,255,255,.05);
          color: white;
          text-align: left;
        }

        .rank:hover {
          background:
            rgba(245,158,11,.15);
        }

        .rankingSubtitle {
          margin-top: -5px;
        }

        .totalPoints {
          text-align: center;
          margin-top: 15px;
          color: #fbbf24;
        }

        .message {
          position: fixed;
          left: 50%;
          bottom: 20px;
          transform:
            translateX(-50%);
          z-index: 100;
          width:
            min(90%, 600px);
          padding: 15px;
          border-radius: 15px;
          background:
            #172230;
          border:
            1px solid
            #46586a;
          color: #fbbf24;
          text-align: center;
          box-shadow:
            0 15px 40px
              rgba(0,0,0,.35);
        }

        .overlayAnimation {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background:
            rgba(0,0,0,.78);
          backdrop-filter:
            blur(5px);
          animation:
            fadeIn .2s ease;
          pointer-events: none;
        }

        .beerClink {
          font-size: 90px;
          animation:
            clink 1s ease-in-out
            infinite alternate;
        }

        .bigBeer {
          font-size: 130px;
          animation:
            bounceBeer .7s
            infinite alternate;
        }

        .prostText {
          margin-top: 20px;
          font-size: 60px;
          font-weight: 900;
          color: #fbbf24;
          text-shadow:
            0 5px 30px
            rgba(245,158,11,.6);
        }

        .moneyRain {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-size: 70px;
          line-height: 1.4;
          background:
            rgba(0,0,0,.25);
          animation:
            moneyFall 2.5s
            ease-in-out;
          pointer-events: none;
        }

        .modal {
          position: fixed;
          inset: 0;
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            rgba(0,0,0,.75);
          backdrop-filter:
            blur(8px);
        }

        .modalBox {
          position: relative;
          width:
            min(100%, 600px);
          max-height: 85vh;
          overflow: auto;
          padding: 25px;
          border-radius: 24px;
          background:
            #111820;
          border:
            1px solid
            #344454;
        }

        .close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background:
            #303944;
          color: white;
          font-size: 25px;
        }

        .profileBig {
          text-align: center;
          font-size: 55px;
          font-weight: 900;
          color: #fbbf24;
          padding: 20px;
        }

        .profileBig small {
          display: block;
          color: #8995a3;
          font-size: 13px;
        }

        .history b {
          color: #4ade80;
          font-size: 20px;
        }

        footer {
          text-align: center;
          padding: 35px 10px;
          color: #687686;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes clink {
          from {
            transform:
              rotate(-12deg)
              translateX(-15px);
          }

          to {
            transform:
              rotate(12deg)
              translateX(15px);
          }
        }

        @keyframes bounceBeer {
          from {
            transform:
              scale(.9)
              rotate(-8deg);
          }

          to {
            transform:
              scale(1.15)
              rotate(8deg);
          }
        }

        @keyframes moneyFall {
          0% {
            transform:
              translateY(-100vh);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          100% {
            transform:
              translateY(100vh);
            opacity: 0;
          }
        }

        @media(max-width:650px) {

          .page {
            padding: 10px;
          }

          h1 {
            font-size: 21px;
          }

          .stats {
            grid-template-columns:
              repeat(2,1fr);
          }

          .row,
          .three,
          .assignment {
            grid-template-columns:
              1fr;
          }

          .sectionTitle {
            align-items: stretch;
            flex-direction: column;
          }

          .beerButton {
            min-height: 170px;
          }

          .beerButton span:not(.beerIcon) {
            font-size: 35px;
          }

          .prostText {
            font-size: 42px;
          }

          .beerClink {
            font-size: 65px;
          }

          .personItem {
            align-items: flex-start;
            flex-direction: column;
          }

          .personActions {
            width: 100%;
          }

          .personActions button {
            flex: 1;
          }
        }

      `}</style>
    </main>
  );
}
