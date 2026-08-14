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
  promille: number;
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

type Payment = {
  id: string;
  event_id?: string;
  betrag?: number;
  bezahlt_von?: string;
  profile_id?: string;
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

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status?: string;
  message?: string;
  created_at?: string;
  requester_name?: string;
};

type BeerResponse = {
  request_id: string;
  profile_id: string;
  response: string;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [people, setPeople] = useState<Person[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pointHistory, setPointHistory] =
    useState<PointHistory[]>([]);

  const [beerRequests, setBeerRequests] =
    useState<BeerRequest[]>([]);
  const [beerResponses, setBeerResponses] =
    useState<BeerResponse[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] =
    useState("");

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentDescription, setPaymentDescription] =
    useState("Getränkeeinkauf");

  const [message, setMessage] =
    useState("");

  const [animation, setAnimation] =
    useState<"prost" | "money" | "beer" | null>(
      null
    );

  const [selectedPerson, setSelectedPerson] =
    useState<Person | null>(null);

  /*
   * =========================================================
   * EVENTS
   * =========================================================
   */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id,title")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "❌ Events konnten nicht geladen werden: " +
          error.message
      );
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
    const title = window.prompt(
      "🍻 Wie soll das Event heißen?"
    );

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
      setMessage(
        "🎉 Event erfolgreich erstellt!"
      );
    }
  }

  async function deleteEvent() {
    if (!eventId) return;

    const event = events.find(
      (item) => item.id === eventId
    );

    const confirmed = window.confirm(
      `⚠️ Möchtest du "${event?.title}" wirklich löschen?`
    );

    if (!confirmed) return;

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
      old.filter(
        (item) => item.id !== eventId
      )
    );

    setEventId("");
    setPeople([]);
    setDrinks([]);
    setPayments([]);
    setBeerRequests([]);

    setMessage("🗑️ Event gelöscht.");
  }

  /*
   * =========================================================
   * DRINKS
   * =========================================================
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

    await loadDrinks();

    setMessage(
      "🍺 Getränk gespeichert!"
    );
  }

  /*
   * =========================================================
   * PEOPLE
   * =========================================================
   */

  async function loadPeople() {
    if (!eventId) return;

    const { data: members, error } =
      await supabase
        .from("event_members")
        .select("profile_id")
        .eq("event_id", eventId);

    if (error) {
      setMessage(
        "❌ Teilnehmer konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    if (!members || members.length === 0) {
      setPeople([]);
      return;
    }

    const ids = members.map(
      (member) => member.profile_id
    );

    const { data: profiles } =
      await supabase
        .from("profiles")
        .select("*")
        .in("id", ids);

    if (!profiles) {
      setPeople([]);
      return;
    }

    const result: Person[] =
      profiles.map((profile: any) => ({
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
      }));

    setPeople(result);
  }

  async function addPerson() {
    if (!eventId) {
      setMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!personName.trim()) {
      setMessage(
        "❌ Bitte einen Namen eingeben."
      );
      return;
    }

    const name = personName.trim();

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
          (error?.message ||
            "Unbekannter Fehler")
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

    setMessage(
      "✅ Teilnehmer hinzugefügt!"
    );
  }

  /*
   * =========================================================
   * DRINK ZUORDNEN
   * =========================================================
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
      drink.preis || 0
    );

    const points = 10;

    const { error } = await supabase
      .from("profiles")
      .update({
        points:
          person.points + points,
        drinks_count:
          person.drinks + 1,
        liters:
          person.liters + drinkLiters,
        cost:
          person.cost + drinkPrice,
      })
      .eq("id", person.id);

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    await supabase
      .from("point_history")
      .insert({
        profile_id: person.id,
        points,
        reason: "Getränk",
        description:
          `Getrunken: ${
            drink.getraenk ||
            drink.drink_name ||
            "Getränk"
          }`,
      });

    setAnimation("prost");

    window.setTimeout(() => {
      setAnimation(null);
    }, 2200);

    await loadPeople();
    await loadPointHistory(
      person.id
    );

    setMessage(
      `🍺 ${person.name}: +${points} Punkte`
    );
  }

  /*
   * =========================================================
   * PAYMENTS
   * =========================================================
   */

  async function loadPayments() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "❌ Zahlungen konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    if (!data) {
      setPayments([]);
      return;
    }

    const profileIds = data
      .map(
        (payment: any) =>
          payment.bezahlt_von ||
          payment.profile_id
      )
      .filter(Boolean);

    let names: Record<
      string,
      string
    > = {};

    if (profileIds.length > 0) {
      const { data: profiles } =
        await supabase
          .from("profiles")
          .select(
            "id,username,name"
          )
          .in("id", profileIds);

      profiles?.forEach(
        (profile: any) => {
          names[profile.id] =
            profile.username ||
            profile.name ||
            "Teilnehmer";
        }
      );
    }

    const mapped: Payment[] =
      data.map((payment: any) => {
        const payerId =
          payment.bezahlt_von ||
          payment.profile_id;

        return {
          ...payment,
          person_name:
            names[payerId] ||
            "Unbekannt",
        };
      });

    setPayments(mapped);
  }

  async function savePayment() {
    if (!eventId) {
      setMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    const amount =
      Number(paymentAmount);

    if (!amount || amount <= 0) {
      setMessage(
        "❌ Bitte einen gültigen Betrag eingeben."
      );
      return;
    }

    if (people.length === 0) {
      setMessage(
        "❌ Bitte zuerst einen Teilnehmer hinzufügen."
      );
      return;
    }

    const choices = people
      .map(
        (person, index) =>
          `${index + 1}. ${person.name}`
      )
      .join("\n");

    const answer = window.prompt(
      `💶 Wer hat bezahlt?\n\n${choices}\n\nNummer eingeben:`
    );

    if (answer === null) return;

    const index =
      Number(answer) - 1;

    const payer = people[index];

    if (!payer) {
      setMessage(
        "❌ Ungültiger Teilnehmer."
      );
      return;
    }

    const { error } = await supabase
      .from("payments")
      .insert({
        event_id: eventId,
        betrag: amount,
        bezahlt_von: payer.id,
        profile_id: payer.id,
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

    window.setTimeout(() => {
      setAnimation(null);
    }, 2500);

    await loadPayments();

    setMessage(
      `💶 ${payer.name} hat ${amount.toFixed(
        2
      )} € bezahlt!`
    );
  }

  /*
   * =========================================================
   * PUNKTE-HISTORIE
   * =========================================================
   */

  async function loadPointHistory(
    profileId?: string
  ) {
    const id =
      profileId ||
      selectedPerson?.id;

    if (!id) return;

    const { data } = await supabase
      .from("point_history")
      .select("*")
      .eq("profile_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (data) {
      setPointHistory(data);
    }
  }

  /*
   * =========================================================
   * BIER-SYSTEM
   * =========================================================
   */

  async function loadBeerRequests() {
    if (!eventId) return;

    const { data, error } =
      await supabase
        .from("beer_requests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      /*
       * Falls die Tabelle noch nicht in
       * der aktuellen Schema-Version existiert,
       * bleibt die restliche App trotzdem nutzbar.
       */
      console.log(
        "Beer requests:",
        error.message
      );
      return;
    }

    if (!data) {
      setBeerRequests([]);
      return;
    }

    const ids = data.map(
      (request: any) =>
        request.requester_profile_id
    );

    let names: Record<
      string,
      string
    > = {};

    if (ids.length > 0) {
      const { data: profiles } =
        await supabase
          .from("profiles")
          .select(
            "id,username,name"
          )
          .in("id", ids);

      profiles?.forEach(
        (profile: any) => {
          names[profile.id] =
            profile.username ||
            profile.name ||
            "Teilnehmer";
        }
      );
    }

    setBeerRequests(
      data.map((request: any) => ({
        ...request,
        requester_name:
          names[
            request.requester_profile_id
          ] ||
          "Teilnehmer",
      }))
    );

    const requestIds =
      data.map(
        (request: any) =>
          request.id
      );

    if (requestIds.length > 0) {
      const { data: responses } =
        await supabase
          .from(
            "beer_request_responses"
          )
          .select("*")
          .in(
            "request_id",
            requestIds
          );

      if (responses) {
        setBeerResponses(
          responses
        );
      }
    }
  }

  async function requestBeer() {
    if (!eventId) {
      setMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (people.length < 2) {
      setMessage(
        "🍺 Es müssen mindestens zwei Teilnehmer im Event sein."
      );
      return;
    }

    const requester =
      people[0];

    const { error } =
      await supabase.rpc(
        "create_beer_request",
        {
          input_event_id:
            eventId,
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

    window.setTimeout(() => {
      setAnimation(null);
    }, 2200);

    await loadBeerRequests();

    setMessage(
      `🍻 ${requester.name} möchte ein Bier mit dir trinken!`
    );
  }

  async function respondBeer(
    requestId: string,
    response:
      | "accepted"
      | "declined",
    personId: string
  ) {
    const { error } =
      await supabase.rpc(
        "respond_to_beer_request",
        {
          input_request_id:
            requestId,
          input_profile_id:
            personId,
          input_response:
            response,
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
      const person =
        people.find(
          (item) =>
            item.id === personId
        );

      if (person) {
        await supabase
          .from("profiles")
          .update({
            points:
              person.points + 10,
          })
          .eq(
            "id",
            person.id
          );

        await supabase
          .from("point_history")
          .insert({
            profile_id:
              person.id,
            points: 10,
            reason:
              "Bier-Runde",
            description:
              "Bier-Anfrage angenommen 🍻",
          });
      }

      setAnimation("prost");

      window.setTimeout(() => {
        setAnimation(null);
      }, 2200);
    }

    await loadBeerRequests();
    await loadPeople();

    setMessage(
      response === "accepted"
        ? "🍻 Bier angenommen! +10 Punkte"
        : "❌ Bier abgelehnt."
    );
  }

  /*
   * =========================================================
   * KISTE BIER
   * =========================================================
   */

  async function sponsorCrate(
    person: Person
  ) {
    if (!eventId) return;

    const input =
      window.prompt(
        "🍺 Wie viele Kisten möchtest du spendieren?",
        "1"
      );

    if (input === null) return;

    const crates =
      Number(input);

    if (
      !Number.isInteger(
        crates
      ) ||
      crates < 1
    ) {
      setMessage(
        "❌ Bitte eine gültige Anzahl eingeben."
      );
      return;
    }

    const points =
      crates * 50;

    /*
     * Der RPC wird versucht, falls
     * dein zuvor eingerichtetes
     * Bier-System ihn besitzt.
     */
    const { error: rpcError } =
      await supabase.rpc(
        "sponsor_beer_crate",
        {
          input_event_id:
            eventId,
          input_profile_id:
            person.id,
          input_crates:
            crates,
        }
      );

    /*
     * Wenn der RPC bereits Punkte
     * selbst vergeben hat, verhindern
     * wir eine doppelte Punktevergabe
     * nicht durch eine weitere RPC-
     * Operation.
     *
     * Die lokale Punktehistorie wird
     * trotzdem versucht.
     */
    if (rpcError) {
      console.log(
        "sponsor_beer_crate:",
        rpcError.message
      );
    }

    const currentPoints =
      person.points;

    const { error } =
      await supabase
        .from("profiles")
        .update({
          points:
            currentPoints +
            points,
        })
        .eq(
          "id",
          person.id
        );

    if (error) {
      setMessage(
        "❌ Kiste konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    await supabase
      .from("point_history")
      .insert({
        profile_id:
          person.id,
        points,
        reason:
          "Kiste Bier",
        description:
          `${crates} Kiste${
            crates === 1
              ? ""
              : "n"
          } Bier spendiert 🍺`,
      });

    await loadPeople();

    setMessage(
      `🍺 ${person.name} spendiert ${crates} Kiste${
        crates === 1
          ? ""
          : "n"
      }! +${points} Punkte`
    );
  }

  /*
   * =========================================================
   * EFFECTS
   * =========================================================
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
      loadPointHistory(
        selectedPerson.id
      );
    }
  }, [selectedPerson]);

  /*
   * =========================================================
   * STATISTIK
   * =========================================================
   */

  const totalLiters =
    drinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.liters ??
            drink.menge ??
            0
        ),
      0
    );

  const totalDrinkCost =
    drinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.preis || 0
        ),
      0
    );

  const totalPayments =
    payments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.betrag || 0
        ),
      0
    );

  const totalPoints =
    people.reduce(
      (sum, person) =>
        sum + person.points,
      0
    );

  const ranking =
    useMemo(
      () =>
        [...people].sort(
          (a, b) =>
            b.points -
            a.points
        ),
      [people]
    );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <main className="page">

      {/* PROST */}

      {animation ===
        "prost" && (
        <div className="animationOverlay">
          <div className="clinkingGlasses">
            <span>🍺</span>
            <span>🍺</span>
          </div>

          <div className="prost">
            PROST! 🍻
          </div>
        </div>
      )}

      {/* BIER */}

      {animation ===
        "beer" && (
        <div className="animationOverlay">
          <div className="giantBeer">
            🍺
          </div>

          <div className="prost">
            BIER? 🍻
          </div>
        </div>
      )}

      {/* GELD */}

      {animation ===
        "money" && (
        <div className="moneyOverlay">
          <span>💶</span>
          <span>💵</span>
          <span>💶</span>
          <span>💵</span>
          <span>💶</span>
          <span>💵</span>
          <span>💶</span>
          <span>💵</span>
          <span>💶</span>
          <span>💵</span>
          <span>💶</span>
          <span>💵</span>
          <span>💶</span>
          <span>💵</span>
          <span>💶</span>
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
              Events · Getränke ·
              Punkte · Challenges
            </p>
          </div>
        </header>

        {/* EVENT */}

        <section className="card">

          <div className="sectionHeader">
            <h2>
              📅 Aktuelles Event
            </h2>

            <button
              className="goldButton"
              onClick={
                createEvent
              }
            >
              ➕ Neues Event
            </button>
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

          {eventId && (
            <button
              className="deleteButton"
              onClick={
                deleteEvent
              }
            >
              🗑️ Event löschen
            </button>
          )}

        </section>

        {/* STATS */}

        <div className="stats">

          <div className="stat">
            <span>
              🍺
            </span>
            <b>
              {drinks.length}
            </b>
            <small>
              Getränke
            </small>
          </div>

          <div className="stat">
            <span>
              💧
            </span>
            <b>
              {totalLiters.toFixed(
                1
              )}
            </b>
            <small>
              Liter
            </small>
          </div>

          <div className="stat">
            <span>
              💶
            </span>
            <b>
              {totalDrinkCost.toFixed(
                2
              )} €
            </b>
            <small>
              Getränke
            </small>
          </div>

          <div className="stat">
            <span>
              👥
            </span>
            <b>
              {people.length}
            </b>
            <small>
              Teilnehmer
            </small>
          </div>

        </div>

        {/* BIER BUTTON */}

        <section className="beerHero">

          <button
            className="beerButton"
            onClick={
              requestBeer
            }
          >
            <span className="beerEmoji">
              🍺
            </span>

            <strong>
              BIER
            </strong>

            <small>
              Wer trinkt ein Bier
              mit mir?
            </small>
          </button>

        </section>

        {/* BIER REQUESTS */}

        {beerRequests.length >
          0 && (
          <section className="card">

            <h2>
              🔔 Bier-Anfragen
            </h2>

            {beerRequests.map(
              (request) => {

                const responses =
                  beerResponses.filter(
                    (response) =>
                      response.request_id ===
                      request.id
                  );

                return (
                  <div
                    className="beerRequest"
                    key={
                      request.id
                    }
                  >

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

                    {people
                      .filter(
                        (person) =>
                          person.id !==
                          request.requester_profile_id
                      )
                      .map(
                        (person) => {

                          const answer =
                            responses.find(
                              (item) =>
                                item.profile_id ===
                                person.id
                            );

                          return (
                            <div
                              className="response"
                              key={
                                person.id
                              }
                            >

                              <span>
                                {
                                  person.name
                                }
                              </span>

                              {answer ? (
                                <b>
                                  {answer.response ===
                                  "accepted"
                                    ? "✅ Zugesagt"
                                    : "❌ Abgelehnt"}
                                </b>
                              ) : (
                                <div className="responseButtons">

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

                                </div>
                              )}

                            </div>
                          );
                        }
                      )}

                  </div>
                );
              }
            )}

          </section>
        )}

        {/* TEILNEHMER */}

        <section className="card">

          <h2>
            👥 Teilnehmer
          </h2>

          <div className="row">

            <input
              placeholder="Name"
              value={
                personName
              }
              onChange={(event) =>
                setPersonName(
                  event.target.value
                )
              }
            />

            <button
              className="goldButton"
              onClick={
                addPerson
              }
            >
              ➕ Hinzufügen
            </button>

          </div>

          {people.map(
            (person) => (
              <div
                className="person"
                key={person.id}
              >

                <div>
                  <strong>
                    👤{" "}
                    {person.name}
                  </strong>

                  <small>
                    🍺{" "}
                    {person.drinks}
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
                    {person.promille.toFixed(
                      2
                    )} ‰
                  </small>
                </div>

                <div className="personButtons">

                  <button
                    className="crate"
                    onClick={() =>
                      sponsorCrate(
                        person
                      )
                    }
                  >
                    🍺 Kiste
                  </button>

                  <button
                    className="darkButton"
                    onClick={() => {
                      setSelectedPerson(
                        person
                      );
                      loadPointHistory(
                        person.id
                      );
                    }}
                  >
                    🏆
                  </button>

                </div>

              </div>
            )
          )}

        </section>

        {/* GETRÄNK */}

        <section className="card">

          <h2>
            🍺 Getränk hinzufügen
          </h2>

          <input
            placeholder="Getränk"
            value={
              drinkName
            }
            onChange={(event) =>
              setDrinkName(
                event.target.value
              )
            }
          />

          <div className="three">

            <input
              type="number"
              value={liters}
              onChange={(event) =>
                setLiters(
                  event.target.value
                )
              }
              placeholder="Liter"
            />

            <input
              type="number"
              value={alcohol}
              onChange={(event) =>
                setAlcohol(
                  event.target.value
                )
              }
              placeholder="Alkohol %"
            />

            <input
              type="number"
              value={price}
              onChange={(event) =>
                setPrice(
                  event.target.value
                )
              }
              placeholder="Preis €"
            />

          </div>

          <button
            className="saveButton"
            onClick={
              saveDrink
            }
          >
            🍻 Getränk speichern
          </button>

        </section>

        {/* ZUORDNUNG */}

        <section className="card">

          <h2>
            🔗 Getränk zuordnen
          </h2>

          {people.length ===
          0 ? (
            <p>
              👥 Zuerst Teilnehmer
              hinzufügen.
            </p>
          ) : (
            people.map(
              (person) => (
                <div
                  className="assignment"
                  key={
                    person.id
                  }
                >

                  <strong>
                    {
                      person.name
                    }
                  </strong>

                  <select
                    defaultValue=""
                    onChange={(event) => {

                      const drink =
                        drinks.find(
                          (item) =>
                            item.id ===
                            event.target.value
                        );

                      if (drink) {
                        assignDrink(
                          person,
                          drink
                        );

                        event.target.value =
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
                          {
                            drink.getraenk ||
                            drink.drink_name ||
                            "Getränk"
                          }
                          {" · "}
                          {Number(
                            drink.preis ||
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

        {/* GETRÄNKE */}

        <section className="card">

          <h2>
            🍺 Getränke
          </h2>

          {drinks.map(
            (drink) => (
              <div
                className="item"
                key={
                  drink.id
                }
              >

                <div>
                  <strong>
                    🍺{" "}
                    {
                      drink.getraenk ||
                      drink.drink_name ||
                      "Getränk"
                    }
                  </strong>

                  <small>
                    {Number(
                      drink.liters ??
                        drink.menge ??
                        0
                    ).toFixed(
                      1
                    )}{" "}
                    Liter ·{" "}
                    {Number(
                      drink.alcohol_percent ??
                        drink.alkohol ??
                        0
                    ).toFixed(
                      1
                    )} %
                  </small>
                </div>

                <b>
                  {Number(
                    drink.preis ||
                      0
                  ).toFixed(
                    2
                  )} €
                </b>

              </div>
            )
          )}

        </section>

        {/* ZAHLUNG */}

        <section className="card">

          <h2>
            💶 Zahlung
          </h2>

          <input
            type="number"
            step="0.01"
            placeholder="Betrag €"
            value={
              paymentAmount
            }
            onChange={(event) =>
              setPaymentAmount(
                event.target.value
              )
            }
          />

          <input
            placeholder="Wofür?"
            value={
              paymentDescription
            }
            onChange={(event) =>
              setPaymentDescription(
                event.target.value
              )
            }
          />

          <button
            className="saveButton"
            onClick={
              savePayment
            }
          >
            💶 Zahlung speichern
          </button>

          <div className="paymentTotal">

            <span>
              💰 Gesamt bezahlt
            </span>

            <strong>
              {totalPayments.toFixed(
                2
              )} €
            </strong>

          </div>

          {payments.map(
            (payment) => (
              <div
                className="item"
                key={
                  payment.id
                }
              >

                <div>

                  <strong>
                    💶{" "}
                    {
                      payment.person_name
                    }
                  </strong>

                  <small>
                    {payment.status ===
                    "paid"
                      ? "Bezahlt"
                      : payment.status ||
                        "Zahlung"}
                  </small>

                </div>

                <b>
                  {Number(
                    payment.betrag ||
                      0
                  ).toFixed(
                    2
                  )} €
                </b>

              </div>
            )
          )}

        </section>

        {/* RANGLISTE */}

        <section className="card">

          <h2>
            🏆 Rangliste
          </h2>

          <p>
            Tippe auf eine Person,
            um zu sehen, wofür sie
            Punkte bekommen hat.
          </p>

          {ranking.map(
            (person, index) => (
              <button
                className="rank"
                key={
                  person.id
                }
                onClick={() => {
                  setSelectedPerson(
                    person
                  );
                  loadPointHistory(
                    person.id
                  );
                }}
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
                  {
                    person.points
                  }{" "}
                  Punkte
                </b>

              </button>
            )
          )}

          <div className="totalPoints">
            🏆 Gesamt:
            <strong>
              {" "}
              {totalPoints}
            </strong>{" "}
            Punkte
          </div>

        </section>

        {/* PERSON MODAL */}

        {selectedPerson && (
          <div className="modal">

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
                {
                  selectedPerson.name
                }
              </h2>

              <div className="bigPoints">
                {
                  selectedPerson.points
                }

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
                  (
                    entry,
                    index
                  ) => (
                    <div
                      className="history"
                      key={
                        entry.id ||
                        index
                      }
                    >

                      <div>
                        <strong>
                          {
                            entry.reason ||
                            "Punkte"
                          }
                        </strong>

                        <small>
                          {
                            entry.description ||
                            ""
                          }
                        </small>
                      </div>

                      <b>
                        +
                        {
                          entry.points ||
                          0
                        }
                      </b>

                    </div>
                  )
                )
              )}

            </div>

          </div>
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
          min-height: 100%;
          width: 100%;
          background: #07090d;
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
          padding: 12px;
          color: white;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          background:
            radial-gradient(
              circle at 10% 0%,
              rgba(245,158,11,.15),
              transparent 30%
            ),
            radial-gradient(
              circle at 100% 20%,
              rgba(30,90,130,.18),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              #06080c,
              #111923 55%,
              #06080c
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
            10px 3px 24px;
        }

        .logo {
          font-size: 40px;
          padding: 12px;
          border-radius: 20px;

          background:
            linear-gradient(
              145deg,
              #f59e0b,
              #d97706
            );

          box-shadow:
            0 12px 35px
            rgba(245,158,11,.25);
        }

        h1 {
          margin: 0;
          font-size: 25px;
        }

        h2 {
          margin:
            0 0 15px;
        }

        p {
          color: #9ca8b5;
        }

        .card {
          margin-bottom: 15px;
          padding: 18px;
          border-radius: 22px;

          background:
            rgba(255,255,255,.055);

          border:
            1px solid
            rgba(255,255,255,.08);

          box-shadow:
            0 15px 40px
            rgba(0,0,0,.2);

          backdrop-filter:
            blur(10px);
        }

        .sectionHeader {
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
            #303b47;

          background:
            #111820;

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
          font-weight: 800;
        }

        .goldButton {
          padding:
            12px 15px;
          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );
          color: #111;
        }

        .deleteButton {
          width: 100%;
          padding: 12px;
          background:
            #401919;
          color:
            #ff9999;
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
          padding: 15px 8px;
          border-radius: 18px;

          background:
            rgba(255,255,255,.05);

          border:
            1px solid
            rgba(255,255,255,.07);
        }

        .stat span {
          display: block;
          font-size: 23px;
        }

        .stat b {
          display: block;
          margin:
            5px 0;
          font-size: 20px;
        }

        .stat small {
          color:
            #8995a3;
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

          color: white;

          background:
            radial-gradient(
              circle at 50% 15%,
              #ff5a5a,
              #b81717 55%,
              #700b0b
            );

          border:
            3px solid
            rgba(255,255,255,.15);

          box-shadow:
            0 18px 50px
            rgba(190,20,20,.35);

          transition:
            transform .15s ease;
        }

        .beerButton:hover {
          transform:
            translateY(-3px)
            scale(1.01);
        }

        .beerButton:active {
          transform:
            scale(.97);
        }

        .beerEmoji {
          font-size: 55px;
        }

        .beerButton strong {
          font-size: 42px;
          letter-spacing: 5px;
        }

        .beerButton small {
          font-size: 13px;
          opacity: .85;
        }

        .beerRequest {
          padding: 15px;
          margin-top: 10px;
          border-radius: 16px;

          background:
            rgba(255,255,255,.05);
        }

        .response {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          padding:
            9px 0;

          border-top:
            1px solid
            rgba(255,255,255,.05);
        }

        .responseButtons {
          display: flex;
          gap: 6px;
        }

        .accept {
          padding:
            10px 14px;
          background:
            #15803d;
          color: white;
        }

        .decline {
          padding:
            10px 14px;
          background:
            #991b1b;
          color: white;
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
          padding: 14px;

          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );

          color: #111;
        }

        .person,
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

        .person small,
        .item small,
        .history small {
          display: block;
          margin-top: 4px;
          color:
            #8995a3;
        }

        .personButtons {
          display: flex;
          gap: 6px;
        }

        .crate {
          padding:
            10px 12px;
          background:
            #f59e0b;
          color: #111;
        }

        .darkButton {
          padding:
            10px 12px;
          background:
            #303944;
          color: white;
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

        .paymentTotal {
          display: flex;
          justify-content: space-between;

          padding: 15px;
          margin-top: 10px;

          border-radius: 14px;

          background:
            rgba(245,158,11,.1);

          color:
            #fbbf24;
        }

        .rank {
          width: 100%;

          display: grid;
          grid-template-columns:
            45px 1fr auto;
          align-items: center;
          gap: 10px;

          padding: 14px;
          margin-top: 8px;

          text-align: left;
          color: white;

          background:
            rgba(255,255,255,.05);
        }

        .rank:hover {
          background:
            rgba(245,158,11,.12);
        }

        .totalPoints {
          margin-top: 15px;
          text-align: center;
          color:
            #fbbf24;
        }

        .message {
          position: fixed;
          left: 50%;
          bottom: 20px;
          z-index: 1000;

          width:
            min(90%, 600px);

          transform:
            translateX(-50%);

          padding: 15px;

          border-radius: 15px;

          background:
            #172230;

          border:
            1px solid
            #405366;

          color:
            #fbbf24;

          text-align: center;

          box-shadow:
            0 15px 40px
            rgba(0,0,0,.4);
        }

        .animationOverlay {
          position: fixed;
          inset: 0;
          z-index: 2000;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          background:
            rgba(0,0,0,.8);

          backdrop-filter:
            blur(6px);

          pointer-events: none;
        }

        .clinkingGlasses {
          display: flex;
          gap: 30px;
          font-size: 90px;

          animation:
            clink .9s
            ease-in-out
            infinite alternate;
        }

        .giantBeer {
          font-size: 130px;

          animation:
            beerBounce .7s
            ease-in-out
            infinite alternate;
        }

        .prost {
          margin-top: 20px;

          font-size: 60px;
          font-weight: 900;

          color:
            #fbbf24;

          text-shadow:
            0 5px 35px
            rgba(245,158,11,.7);
        }

        .moneyOverlay {
          position: fixed;
          inset: 0;
          z-index: 2000;

          display: flex;
          flex-wrap: wrap;
          justify-content:
            space-around;
          align-content:
            flex-start;

          overflow: hidden;

          padding-top: 0;

          background:
            rgba(0,0,0,.18);

          pointer-events: none;
        }

        .moneyOverlay span {
          display: block;
          font-size: 50px;

          animation:
            moneyFall 2.4s
            linear forwards;

          animation-delay:
            calc(
              var(--delay, 0)
              * 0.05s
            );
        }

        .modal {
          position: fixed;
          inset: 0;
          z-index: 1500;

          display: flex;
          justify-content: center;
          align-items: center;

          padding: 20px;

          background:
            rgba(0,0,0,.78);

          backdrop-filter:
            blur(8px);
        }

        .modalBox {
          position: relative;

          width:
            min(100%, 600px);

          max-height: 85vh;
          overflow-y: auto;

          padding: 25px;
          border-radius: 25px;

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

        .bigPoints {
          text-align: center;
          padding: 20px;

          font-size: 55px;
          font-weight: 900;

          color:
            #fbbf24;
        }

        .bigPoints small {
          display: block;

          font-size: 13px;
          color:
            #8995a3;
        }

        .history b {
          color:
            #4ade80;
          font-size: 20px;
        }

        footer {
          padding:
            35px 10px;

          text-align: center;
          color:
            #687686;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        @keyframes clink {
          from {
            transform:
              translateX(-25px)
              rotate(-10deg);
          }

          to {
            transform:
              translateX(25px)
              rotate(10deg);
          }
        }

        @keyframes beerBounce {
          from {
            transform:
              scale(.85)
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
              translateY(-120px)
              rotate(0deg);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          100% {
            transform:
              translateY(110vh)
              rotate(720deg);
            opacity: 0;
          }
        }

        @media(max-width:650px) {

          .page {
            padding: 8px;
          }

          header {
            padding-top: 8px;
          }

          h1 {
            font-size: 21px;
          }

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .row,
          .three,
          .assignment {
            grid-template-columns:
              1fr;
          }

          .sectionHeader {
            align-items:
              stretch;
            flex-direction:
              column;
          }

          .beerButton {
            min-height: 175px;
          }

          .beerButton strong {
            font-size: 35px;
          }

          .person {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .personButtons {
            width: 100%;
          }

          .personButtons button {
            flex: 1;
          }

          .prost {
            font-size: 43px;
          }

          .clinkingGlasses {
            font-size: 65px;
          }
        }

      `}</style>

    </main>
  );
}
