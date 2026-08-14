"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Event = {
  id: string;
  title: string;
  created_at?: string;
};

type Profile = {
  id: string;
  username?: string | null;
  name?: string | null;
  points?: number | null;
  drinks_count?: number | null;
  promille?: number | null;
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
  event_id?: string;
  getraenk?: string | null;
  drink_name?: string | null;
  menge?: number | null;
  liters?: number | null;
  alkohol?: number | null;
  alcohol_percent?: number | null;
  preis?: number | null;
  quantity?: number | null;
  created_at?: string | null;
};

type Payment = {
  id: string;
  event_id?: string | null;
  betrag?: number | null;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string | null;
  created_at?: string | null;
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

type ChallengeCategory = {
  id: string;
  name: string;
  emoji?: string | null;
  description?: string | null;
};

type ChallengeTemplate = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  default_points?: number | null;
  requires_vote?: boolean | null;
  minimum_votes?: number | null;
  is_active?: boolean | null;
};

type Challenge = {
  id: string;
  event_id?: string | null;
  title?: string | null;
  description?: string | null;
  points?: number | null;
  category?: string | null;
  status?: string | null;
  created_by_profile_id?: string | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  required_votes?: number | null;
  duration_minutes?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  completed_at?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status?: string | null;
  message?: string | null;
  created_at?: string | null;
  requester_name?: string;
};

type BeerResponse = {
  id?: string;
  request_id: string;
  profile_id: string;
  response: string;
};

type AnimationType =
  | "prost"
  | "money"
  | "crate"
  | "challenge"
  | "beer"
  | null;

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [people, setPeople] = useState<Person[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);

  const [challengeCategories, setChallengeCategories] =
    useState<ChallengeCategory[]>([]);

  const [challengeTemplates, setChallengeTemplates] =
    useState<ChallengeTemplate[]>([]);

  const [challenges, setChallenges] =
    useState<Challenge[]>([]);

  const [beerRequests, setBeerRequests] =
    useState<BeerRequest[]>([]);

  const [beerResponses, setBeerResponses] =
    useState<BeerResponse[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [personName, setPersonName] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] =
    useState("Getränkeeinkauf");

  const [selectedPerson, setSelectedPerson] =
    useState<Person | null>(null);

  const [showChallenges, setShowChallenges] =
    useState(false);

  const [showPayments, setShowPayments] =
    useState(false);

  const [showDrinkHistory, setShowDrinkHistory] =
    useState(false);

  const [showPeople, setShowPeople] =
    useState(true);

  const [showDrinks, setShowDrinks] =
    useState(false);

  const [showBeerRequests, setShowBeerRequests] =
    useState(true);

  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [message, setMessage] = useState("");

  const [animation, setAnimation] =
    useState<AnimationType>(null);

  /*
   * =========================================================
   * HILFSFUNKTIONEN
   * =========================================================
   */

  function getPersonName(profile: any) {
    return (
      profile?.username ||
      profile?.name ||
      "Unbekannt"
    );
  }

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
      drink.preis ||
        0
    );
  }

  function showAnimation(
    type: Exclude<AnimationType, null>
  ) {
    setAnimation(type);

    window.setTimeout(() => {
      setAnimation(null);
    }, 2600);
  }

  function showMessage(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  /*
   * =========================================================
   * EVENTS
   * =========================================================
   */

  async function loadEvents() {
    const {
      data,
      error,
    } = await supabase
      .from("events")
      .select("id,title,created_at")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        "❌ Events konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    if (data) {
      setEvents(data);

      if (
        !eventId &&
        data.length > 0
      ) {
        setEventId(data[0].id);
      }
    }
  }

  async function createEvent() {
    const title =
      window.prompt(
        "🍻 Name des neuen Events:"
      );

    if (!title?.trim()) {
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("events")
      .insert({
        title: title.trim(),
      })
      .select("id,title,created_at")
      .single();

    if (error) {
      showMessage(
        "❌ Event konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    if (data) {
      setEvents((current) => [
        data,
        ...current,
      ]);

      setEventId(data.id);

      showMessage(
        "🎉 Event erfolgreich erstellt!"
      );
    }
  }

  async function deleteEvent() {
    if (!eventId) {
      return;
    }

    const event =
      events.find(
        (item) =>
          item.id === eventId
      );

    if (
      !window.confirm(
        `⚠️ "${event?.title}" wirklich löschen?`
      )
    ) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      showMessage(
        "❌ Event konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    setEvents((current) =>
      current.filter(
        (item) =>
          item.id !== eventId
      )
    );

    setEventId("");

    setPeople([]);
    setDrinks([]);
    setPayments([]);
    setChallenges([]);
    setBeerRequests([]);

    showMessage(
      "🗑️ Event gelöscht."
    );
  }

  /*
   * =========================================================
   * PROFILE
   * =========================================================
   */

  async function loadProfiles() {
    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(
        "id,username,name,points,drinks_count,promille"
      );

    if (error) {
      console.log(
        "Profiles:",
        error.message
      );
      return;
    }

    if (data) {
      setProfiles(data);
    }
  }

  /*
   * =========================================================
   * TEILNEHMER
   * =========================================================
   */

  async function loadPeople() {
    if (!eventId) {
      setPeople([]);
      return;
    }

    const {
      data: members,
      error: memberError,
    } = await supabase
      .from("event_members")
      .select("profile_id")
      .eq(
        "event_id",
        eventId
      );

    if (memberError) {
      showMessage(
        "❌ Teilnehmer konnten nicht geladen werden: " +
          memberError.message
      );
      return;
    }

    if (
      !members ||
      members.length === 0
    ) {
      setPeople([]);
      return;
    }

    const ids =
      members
        .map(
          (item) =>
            item.profile_id
        )
        .filter(Boolean);

    if (ids.length === 0) {
      setPeople([]);
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(
        "id,username,name,points,drinks_count,promille"
      )
      .in(
        "id",
        ids
      );

    if (error) {
      showMessage(
        "❌ Teilnehmerprofile konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    if (!data) {
      setPeople([]);
      return;
    }

    const paymentByPerson: Record<
      string,
      number
    > = {};

    payments.forEach(
      (payment) => {
        const id =
          payment.bezahlt_von ||
          payment.profile_id;

        if (!id) {
          return;
        }

        paymentByPerson[id] =
          (paymentByPerson[id] || 0) +
          Number(
            payment.betrag || 0
          );
      }
    );

    const result: Person[] =
      data.map(
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
            profile.drinks_count ||
              0
          ),

          liters: 0,

          cost: 0,

          promille: Number(
            profile.promille ||
              0
          ),
        })
      );

    setPeople(result);
  }

  async function addPerson() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    const name =
      personName.trim();

    if (!name) {
      showMessage(
        "❌ Bitte einen Namen eingeben."
      );
      return;
    }

    /*
     * Zuerst prüfen wir, ob es bereits
     * ein Profil mit diesem Namen gibt.
     *
     * Dadurch vermeiden wir möglichst
     * doppelte Teilnehmer wie:
     *
     * Philipp
     * Philipp Adam
     */

    const {
      data: existingProfiles,
    } = await supabase
      .from("profiles")
      .select(
        "id,username,name,points,drinks_count,promille"
      )
      .or(
        `username.ilike.${name},name.ilike.${name}`
      )
      .limit(1);

    let profileId =
      existingProfiles?.[0]?.id;

    if (!profileId) {
      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .insert({
          username: name,
          name,
          points: 0,
          drinks_count: 0,
        })
        .select("id")
        .single();

      if (error || !data) {
        showMessage(
          "❌ Teilnehmer konnte nicht erstellt werden: " +
            (error?.message ||
              "Unbekannter Fehler")
        );
        return;
      }

      profileId =
        data.id;
    }

    /*
     * Prüfen, ob der Teilnehmer
     * bereits im Event ist.
     */

    const {
      data: existingMember,
    } = await supabase
      .from("event_members")
      .select("profile_id")
      .eq(
        "event_id",
        eventId
      )
      .eq(
        "profile_id",
        profileId
      )
      .maybeSingle();

    if (existingMember) {
      showMessage(
        "❌ Teilnehmer ist bereits in diesem Event."
      );
      return;
    }

    const {
      error: memberError,
    } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        profile_id: profileId,
      });

    if (memberError) {
      showMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          memberError.message
      );
      return;
    }

    setPersonName("");

    await loadProfiles();
    await loadPeople();

    showMessage(
      "✅ Teilnehmer hinzugefügt!"
    );
  }

  /*
   * =========================================================
   * GETRÄNKE
   * =========================================================
   */

  async function loadDrinks() {
    if (!eventId) {
      setDrinks([]);
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("drinks")
      .select("*")
      .eq(
        "event_id",
        eventId
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        "❌ Getränke konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    setDrinks(data || []);
  }

  async function saveDrink() {
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

    const {
      error,
    } = await supabase
      .from("drinks")
      .insert({
        event_id: eventId,

        getraenk:
          drinkName.trim(),

        drink_name:
          drinkName.trim(),

        menge:
          Number(liters),

        liters:
          Number(liters),

        alkohol:
          Number(alcohol),

        alcohol_percent:
          Number(alcohol),

        preis:
          Number(price),

        quantity: 1,
      });

    if (error) {
      showMessage(
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

    showMessage(
      "🍺 Getränk gespeichert!"
    );
  }

  /*
   * =========================================================
   * GETRÄNK ZUORDNEN
   * =========================================================
   */

  async function assignDrink(
    person: Person,
    drink: Drink
  ) {
    const drinkNameValue =
      getDrinkName(drink);

    const drinkLiters =
      getDrinkLiters(drink);

    const drinkPrice =
      getDrinkPrice(drink);

    const newPoints =
      person.points + 10;

    /*
     * Punkte + Getränkezahl.
     *
     * KEIN profiles.cost!
     */

    const {
      error,
    } = await supabase
      .from("profiles")
      .update({
        points:
          newPoints,

        drinks_count:
          person.drinks + 1,
      })
      .eq(
        "id",
        person.id
      );

    if (error) {
      showMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    /*
     * Punkte-Historie.
     *
     * Diese Einträge verwenden wir gleichzeitig
     * als Getränkeverlauf.
     */

    const {
      error:
        historyError,
    } = await supabase
      .from("point_history")
      .insert({
        profile_id:
          person.id,

        points: 10,

        reason:
          "Getränk",

        description:
          `🍺 ${drinkNameValue} · ${drinkLiters.toFixed(
            2
          )} L · ${getDrinkAlcohol(
            drink
          ).toFixed(
            1
          )}% · ${drinkPrice.toFixed(
            2
          )} €`,
      });

    if (historyError) {
      console.log(
        "point_history:",
        historyError.message
      );
    }

    /*
     * Promille neu berechnen.
     *
     * Deine vorhandene Funktion:
     *
     * calculate_promille(uuid, uuid)
     */

    await calculatePersonPromille(
      person.id
    );

    await loadProfiles();
    await loadPeople();

    showAnimation(
      "prost"
    );

    showMessage(
      `🍺 ${person.name} hat ${drinkNameValue} getrunken · +10 Punkte`
    );
  }

  /*
   * =========================================================
   * PROMILLE
   * =========================================================
   */

  async function calculatePersonPromille(
    profileId: string
  ) {
    if (!eventId) {
      return;
    }

    /*
     * Erst versuchen wir die vorhandene
     * Datenbankfunktion.
     */

    const {
      data,
      error,
    } = await supabase.rpc(
      "calculate_promille",
      {
        input_event_id:
          eventId,

        input_profile_id:
          profileId,
      }
    );

    if (error) {
      console.log(
        "Promille RPC:",
        error.message
      );
      return;
    }

    /*
     * Je nach Rückgabetyp kann Supabase
     * einen einzelnen Wert oder ein
     * Objekt zurückgeben.
     */

    let value = 0;

    if (
      typeof data ===
      "number"
    ) {
      value = data;
    } else if (
      typeof data ===
        "string" &&
      !Number.isNaN(
        Number(data)
      )
    ) {
      value =
        Number(data);
    } else if (
      data &&
      typeof data ===
        "object"
    ) {
      value = Number(
        data.promille ??
          data.calculate_promille ??
          data.value ??
          0
      );
    }

    if (
      Number.isFinite(value)
    ) {
      await supabase
        .from("profiles")
        .update({
          promille: value,
        })
        .eq(
          "id",
          profileId
        );
    }
  }

  async function recalculateAllPromille() {
    for (
      const person of people
    ) {
      await calculatePersonPromille(
        person.id
      );
    }

    await loadProfiles();
    await loadPeople();

    showMessage(
      "🍺 Promillewerte aktualisiert."
    );
  }

  /*
   * =========================================================
   * ZAHLUNGEN
   * =========================================================
   */

  async function loadPayments() {
    if (!eventId) {
      setPayments([]);
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("payments")
      .select("*")
      .eq(
        "event_id",
        eventId
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        "❌ Zahlungen konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    if (!data) {
      setPayments([]);
      return;
    }

    const ids =
      data
        .map(
          (payment: any) =>
            payment.bezahlt_von ||
            payment.profile_id
        )
        .filter(Boolean);

    const names: Record<
      string,
      string
    > = {};

    if (ids.length > 0) {
      const {
        data: payerProfiles,
      } = await supabase
        .from("profiles")
        .select(
          "id,username,name"
        )
        .in(
          "id",
          ids
        );

      payerProfiles?.forEach(
        (profile: any) => {
          names[profile.id] =
            getPersonName(
              profile
            );
        }
      );
    }

    setPayments(
      data.map(
        (payment: any) => {
          const payerId =
            payment.bezahlt_von ||
            payment.profile_id;

          return {
            ...payment,
            person_name:
              names[payerId] ||
              "Unbekannt",
          };
        }
      )
    );
  }

  async function savePayment() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    const amount =
      Number(paymentAmount);

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      showMessage(
        "❌ Bitte einen gültigen Betrag eingeben."
      );
      return;
    }

    if (
      people.length === 0
    ) {
      showMessage(
        "❌ Keine Teilnehmer vorhanden."
      );
      return;
    }

    const choices =
      people
        .map(
          (
            person,
            index
          ) =>
            `${index + 1}. ${person.name}`
        )
        .join("\n");

    const answer =
      window.prompt(
        `💶 Wer hat bezahlt?\n\n${choices}\n\nNummer eingeben:`
      );

    if (
      answer === null
    ) {
      return;
    }

    const index =
      Number(answer) - 1;

    const payer =
      people[index];

    if (!payer) {
      showMessage(
        "❌ Ungültiger Teilnehmer."
      );
      return;
    }

    /*
     * Deine Tabelle besitzt:
     *
     * betrag
     * bezahlt_von
     * profile_id
     * status
     */

    const {
      error,
    } = await supabase
      .from("payments")
      .insert({
        event_id:
          eventId,

        betrag:
          amount,

        bezahlt_von:
          payer.id,

        profile_id:
          payer.id,

        status:
          "paid",
      });

    if (error) {
      showMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setPaymentAmount("");

    await loadPayments();

    showAnimation(
      "money"
    );

    showMessage(
      `💶 ${payer.name} hat ${amount.toFixed(
        2
      )} € bezahlt.`
    );
  }

  /*
   * =========================================================
   * PUNKTE-HISTORIE
   * =========================================================
   */

  async function loadPointHistory(
    profileId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("point_history")
      .select("*")
      .eq(
        "profile_id",
        profileId
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.log(
        "Punkte-Historie:",
        error.message
      );
      setPointHistory([]);
      return;
    }

    setPointHistory(
      data || []
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
    if (!eventId) {
      return;
    }

    const input =
      window.prompt(
        `🍺 ${person.name}\n\nWie viele Kisten Bier möchtest du spendieren?`,
        "1"
      );

    if (
      input === null
    ) {
      return;
    }

    const crates =
      Number(input);

    if (
      !Number.isInteger(
        crates
      ) ||
      crates < 1
    ) {
      showMessage(
        "❌ Ungültige Anzahl."
      );
      return;
    }

    const points =
      crates * 50;

    const {
      error,
    } = await supabase
      .from("profiles")
      .update({
        points:
          person.points +
          points,
      })
      .eq(
        "id",
        person.id
      );

    if (error) {
      showMessage(
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
          `🍺 ${crates} Kiste${
            crates === 1
              ? ""
              : "n"
          } Bier spendiert`,
      });

    await loadProfiles();
    await loadPeople();

    showAnimation(
      "crate"
    );

    showMessage(
      `🍺 ${person.name} spendiert ${crates} Kiste${
        crates === 1
          ? ""
          : "n"
      } Bier · +${points} Punkte`
    );
  }

  /*
   * =========================================================
   * CHALLENGES
   * =========================================================
   */

  async function loadChallengeData() {
    const {
      data: categories,
    } = await supabase
      .from(
        "challenge_categories"
      )
      .select(
        "id,name,emoji,description"
      )
      .order(
        "name",
        {
          ascending: true,
        }
      );

    setChallengeCategories(
      categories || []
    );

    const {
      data: templates,
    } = await supabase
      .from(
        "challenge_templates"
      )
      .select(
        "id,title,description,category,default_points,requires_vote,minimum_votes,is_active"
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    setChallengeTemplates(
      templates || []
    );

    await loadChallenges();
  }

  async function loadChallenges() {
    if (!eventId) {
      setChallenges([]);
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("challenges")
      .select("*")
      .eq(
        "event_id",
        eventId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      console.log(
        "Challenges:",
        error.message
      );
      return;
    }

    setChallenges(
      data || []
    );
  }

  async function createChallenge(
    template?: ChallengeTemplate
  ) {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    let title =
      template?.title ||
      window.prompt(
        "🎯 Name der Challenge:"
      );

    if (!title?.trim()) {
      return;
    }

    let description =
      template?.description ||
      window.prompt(
        "Beschreibung:"
      ) ||
      "";

    let points =
      Number(
        template?.default_points ||
          10
      );

    if (!template) {
      const pointInput =
        window.prompt(
          "🏆 Punkte:",
          "10"
        );

      if (
        pointInput !==
        null
      ) {
        points =
          Number(
            pointInput
          ) || 10;
      }
    }

    let category =
      template?.category ||
      "Quatsch";

    if (
      challengeCategories.length >
      0
    ) {
      const categoryText =
        challengeCategories
          .map(
            (
              item,
              index
            ) =>
              `${index + 1}. ${
                item.emoji || ""
              } ${
                item.name
              }`
          )
          .join("\n");

      const selected =
        window.prompt(
          `Kategorie auswählen:\n\n${categoryText}`,
          "1"
        );

      if (
        selected !==
        null
      ) {
        const categoryIndex =
          Number(
            selected
          ) - 1;

        if (
          challengeCategories[
            categoryIndex
          ]
        ) {
          category =
            challengeCategories[
              categoryIndex
            ].name;
        }
      }
    }

    const {
      data,
      error,
    } = await supabase
      .from("challenges")
      .insert({
        event_id:
          eventId,

        title:
          title.trim(),

        description:
          description.trim(),

        points,

        category,

        status:
          "open",

        required_votes:
          template?.minimum_votes ||
          1,

        is_active:
          true,
      })
      .select("*")
      .single();

    if (error) {
      showMessage(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    if (data) {
      setChallenges(
        (current) => [
          data,
          ...current,
        ]
      );

      showAnimation(
        "challenge"
      );

      showMessage(
        "🎯 Challenge erstellt!"
      );
    }
  }

  async function assignChallenge(
    challenge: Challenge,
    person: Person
  ) {
    const {
      error,
    } = await supabase
      .from("challenges")
      .update({
        assigned_profile_id:
          person.id,

        status:
          "open",
      })
      .eq(
        "id",
        challenge.id
      );

    if (error) {
      showMessage(
        "❌ Challenge konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    await loadChallenges();

    showMessage(
      `🎯 Challenge an ${person.name} zugewiesen.`
    );
  }

  async function completeChallenge(
    challenge: Challenge,
    person: Person
  ) {
    const points =
      Number(
        challenge.points ||
          0
      );

    /*
     * Challenge abschließen.
     */

    const {
      error,
    } = await supabase
      .from("challenges")
      .update({
        status:
          "completed",

        winner_profile_id:
          person.id,

        completed_at:
          new Date().toISOString(),

        is_active:
          false,
      })
      .eq(
        "id",
        challenge.id
      );

    if (error) {
      showMessage(
        "❌ Challenge konnte nicht abgeschlossen werden: " +
          error.message
      );
      return;
    }

    /*
     * Punkte vergeben.
     */

    const currentPerson =
      people.find(
        (item) =>
          item.id ===
          person.id
      );

    const oldPoints =
      currentPerson?.points ||
      person.points ||
      0;

    await supabase
      .from("profiles")
      .update({
        points:
          oldPoints +
          points,
      })
      .eq(
        "id",
        person.id
      );

    /*
     * Ergebnis speichern.
     */

    await supabase
      .from(
        "challenge_results"
      )
      .insert({
        challenge_id:
          challenge.id,

        profile_id:
          person.id,

        place: 1,

        points,

        result_type:
          "winner",
      });

    /*
     * Punkte-Historie.
     */

    await supabase
      .from("point_history")
      .insert({
        profile_id:
          person.id,

        points,

        reason:
          "Challenge",

        description:
          `🎯 ${challenge.title}`,
      });

    await loadProfiles();
    await loadPeople();
    await loadChallenges();

    showAnimation(
      "challenge"
    );

    showMessage(
      `🏆 ${person.name} gewinnt "${challenge.title}" · +${points} Punkte`
    );
  }

  /*
   * =========================================================
   * BIER-ANFRAGEN
   * =========================================================
   */

  async function loadBeerRequests() {
    if (!eventId) {
      setBeerRequests([]);
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("beer_requests")
      .select("*")
      .eq(
        "event_id",
        eventId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      console.log(
        "Beer Requests:",
        error.message
      );
      return;
    }

    if (!data) {
      setBeerRequests([]);
      return;
    }

    const ids =
      data.map(
        (item: any) =>
          item.requester_profile_id
      );

    const names: Record<
      string,
      string
    > = {};

    if (ids.length) {
      const {
        data: requesterProfiles,
      } = await supabase
        .from("profiles")
        .select(
          "id,username,name"
        )
        .in(
          "id",
          ids
        );

      requesterProfiles?.forEach(
        (profile: any) => {
          names[profile.id] =
            getPersonName(
              profile
            );
        }
      );
    }

    setBeerRequests(
      data.map(
        (item: any) => ({
          ...item,

          requester_name:
            names[
              item.requester_profile_id
            ] ||
            "Teilnehmer",
        })
      )
    );

    const requestIds =
      data.map(
        (item: any) =>
          item.id
      );

    if (
      requestIds.length
    ) {
      const {
        data: responses,
      } = await supabase
        .from(
          "beer_request_responses"
        )
        .select("*")
        .in(
          "request_id",
          requestIds
        );

      setBeerResponses(
        responses || []
      );
    }
  }

  async function requestBeer() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (
      people.length <
      2
    ) {
      showMessage(
        "🍺 Mindestens zwei Teilnehmer werden benötigt."
      );
      return;
    }

    /*
     * Der aktuelle Benutzer wird
     * soweit möglich über das Profil
     * bestimmt.
     *
     * Wenn nur ein Profil vorhanden ist,
     * verwenden wir dieses.
     */

    const requester =
      people[0];

    const {
      error,
    } = await supabase.rpc(
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
      showMessage(
        "❌ Bier-Anfrage konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    await loadBeerRequests();

    showAnimation(
      "beer"
    );

    showMessage(
      `🍻 ${requester.name} möchte ein Bier mit dir trinken!`
    );
  }

  async function respondBeer(
    request: BeerRequest,
    person: Person,
    response:
      | "accepted"
      | "declined"
  ) {
    const {
      error,
    } = await supabase.rpc(
      "respond_to_beer_request",
      {
        input_request_id:
          request.id,

        input_profile_id:
          person.id,

        input_response:
          response,
      }
    );

    if (error) {
      showMessage(
        "❌ Antwort konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    if (
      response ===
      "accepted"
    ) {
      const points = 10;

      const newPoints =
        person.points +
        points;

      await supabase
        .from("profiles")
        .update({
          points:
            newPoints,
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

          points,

          reason:
            "Bier-Runde",

          description:
            "🍻 Bier-Anfrage angenommen",
        });

      showAnimation(
        "prost"
      );

      showMessage(
        `🍻 ${person.name} hat zugesagt · +10 Punkte`
      );
    } else {
      showMessage(
        `❌ ${person.name} hat abgelehnt.`
      );
    }

    await loadBeerRequests();
    await loadProfiles();
    await loadPeople();
  }

  /*
   * =========================================================
   * EFFECTS
   * =========================================================
   */

  useEffect(() => {
    loadEvents();
    loadProfiles();
    loadChallengeData();
  }, []);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    loadDrinks();
    loadPayments();
    loadPeople();
    loadChallenges();
    loadBeerRequests();
  }, [eventId]);

  /*
   * =========================================================
   * BERECHNUNGEN
   * =========================================================
   */

  const totalDrinkCost =
    drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkPrice(
          drink
        ),
      0
    );

  const totalLiters =
    drinks.reduce(
      (sum, drink) =>
        sum +
        getDrinkLiters(
          drink
        ),
      0
    );

  const totalPayments =
    payments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.betrag ||
            0
        ),
      0
    );

  /*
   * Gesamtkosten des Events.
   *
   * Wenn bereits Zahlungen höher sind,
   * verwenden wir den höheren Wert,
   * damit die offene Summe nicht negativ
   * wird.
   */

  const eventTotal =
    Math.max(
      totalDrinkCost,
      totalPayments
    );

  const amountPerPerson =
    people.length > 0
      ? eventTotal /
        people.length
      : 0;

  const paidByPerson: Record<
    string,
    number
  > = {};

  payments.forEach(
    (payment) => {
      const profileId =
        payment.bezahlt_von ||
        payment.profile_id;

      if (!profileId) {
        return;
      }

      paidByPerson[
        profileId
      ] =
        (paidByPerson[
          profileId
        ] || 0) +
        Number(
          payment.betrag ||
            0
        );
    }
  );

  const totalPoints =
    people.reduce(
      (sum, person) =>
        sum +
        person.points,
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
   * Getränkeverlauf:
   *
   * Wir verwenden point_history,
   * weil dort jeder getrunkene Drink
   * mit Zeitstempel gespeichert wird.
   */

  const drinkHistory =
    pointHistory.filter(
      (entry) =>
        entry.reason ===
        "Getränk"
    );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <main className="page">

      {/* ===================================================
          ANIMATION: PROST
      =================================================== */}

      {animation ===
        "prost" && (
        <div className="animationOverlay">

          <div className="clinkingGlasses">
            <span>
              🍺
            </span>

            <span>
              🍺
            </span>
          </div>

          <div className="prostText">
            PROST! 🍻
          </div>

        </div>
      )}

      {/* ===================================================
          ANIMATION: GELD
      =================================================== */}

      {animation ===
        "money" && (
        <div className="moneyOverlay">

          {Array.from(
            {
              length: 28,
            },
            (_, index) => (
              <span
                key={
                  index
                }
                style={{
                  left:
                    `${Math.random() * 100}%`,
                  animationDelay:
                    `${index * 0.06}s`,
                }}
              >
                {index % 2 ===
                0
                  ? "💶"
                  : "💵"}
              </span>
            )
          )}

          <div className="moneyText">
            BEZAHLT! 💶
          </div>

        </div>
      )}

      {/* ===================================================
          ANIMATION: KISTE
      =================================================== */}

      {animation ===
        "crate" && (
        <div className="animationOverlay">

          <div className="crateAnimation">
            🍺🍺🍺
          </div>

          <div className="crateText">
            KISTE BIER!
          </div>

          <div className="crateSub">
            SPENDIERT 🍻
          </div>

        </div>
      )}

      {/* ===================================================
          ANIMATION: CHALLENGE
      =================================================== */}

      {animation ===
        "challenge" && (
        <div className="animationOverlay">

          <div className="challengeAnimation">
            🎯
          </div>

          <div className="challengeText">
            CHALLENGE!
          </div>

          <div className="challengeSub">
            🏆 PUNKTE!
          </div>

        </div>
      )}

      {/* ===================================================
          ANIMATION: BIER
      =================================================== */}

      {animation ===
        "beer" && (
        <div className="animationOverlay">

          <div className="beerAnimation">
            🍺
          </div>

          <div className="beerText">
            BIER?
          </div>

          <div className="beerSub">
            Wer ist dabei? 🍻
          </div>

        </div>
      )}

      <div className="container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header>

          <div className="logo">
            🍻
          </div>

          <div>
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Events · Getränke · Punkte · Challenges
            </p>
          </div>

        </header>

        {/* =================================================
            EVENT
        ================================================= */}

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
                  key={
                    event.id
                  }
                  value={
                    event.id
                  }
                >
                  {
                    event.title
                  }
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

        {/* =================================================
            STATISTIK
        ================================================= */}

        <div className="stats">

          <div className="stat">
            <span>
              🍺
            </span>

            <b>
              {
                drinks.length
              }
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
              {
                totalLiters.toFixed(
                  1
                )
              }
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
              {
                eventTotal.toFixed(
                  2
                )
              } €
            </b>

            <small>
              Eventwert
            </small>
          </div>

          <div className="stat">
            <span>
              👥
            </span>

            <b>
              {
                people.length
              }
            </b>

            <small>
              Teilnehmer
            </small>
          </div>

        </div>

        {/* =================================================
            BIER BUTTON
        ================================================= */}

        <section className="beerHero">

          <button
            className="bigBeerButton"
            onClick={
              requestBeer
            }
          >

            <span className="bigBeerEmoji">
              🍺
            </span>

            <strong>
              BIER
            </strong>

            <small>
              Wer trinkt ein Bier mit mir?
            </small>

          </button>

        </section>

        {/* =================================================
            BIER ANFRAGEN
        ================================================= */}

        {beerRequests.length >
          0 && (
          <section className="card">

            <button
              className="collapseButton"
              onClick={() =>
                setShowBeerRequests(
                  !showBeerRequests
                )
              }
            >
              <span>
                🔔 Bier-Anfragen
              </span>

              <span>
                {
                  showBeerRequests
                    ? "▲"
                    : "▼"
                }
              </span>
            </button>

            {showBeerRequests &&
              beerRequests.map(
                (
                  request
                ) => {

                  const responses =
                    beerResponses.filter(
                      (
                        response
                      ) =>
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
                        möchte ein Bier mit dir trinken.
                      </p>

                      {people
                        .filter(
                          (
                            person
                          ) =>
                            person.id !==
                            request.requester_profile_id
                        )
                        .map(
                          (
                            person
                          ) => {

                            const answer =
                              responses.find(
                                (
                                  item
                                ) =>
                                  item.profile_id ===
                                  person.id
                              );

                            return (
                              <div
                                className="responseRow"
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
                                          request,
                                          person,
                                          "accepted"
                                        )
                                      }
                                    >
                                      ✅
                                    </button>

                                    <button
                                      className="decline"
                                      onClick={() =>
                                        respondBeer(
                                          request,
                                          person,
                                          "declined"
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

        {/* =================================================
            TEILNEHMER
        ================================================= */}

        <section className="card">

          <button
            className="collapseButton"
            onClick={() =>
              setShowPeople(
                !showPeople
              )
            }
          >

            <span>
              👥 Teilnehmer
            </span>

            <span>
              {
                showPeople
                  ? "▲"
                  : "▼"
              }
            </span>

          </button>

          {showPeople && (
            <>
              <div className="row">

                <input
                  placeholder="Name"
                  value={
                    personName
                  }
                  onChange={(
                    event
                  ) =>
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
                (
                  person
                ) => {

                  const paid =
                    paidByPerson[
                      person.id
                    ] || 0;

                  const open =
                    Math.max(
                      0,
                      amountPerPerson -
                        paid
                    );

                  return (
                    <div
                      className="personCard"
                      key={
                        person.id
                      }
                    >

                      <div className="personTop">

                        <div>

                          <strong>
                            👤{" "}
                            {
                              person.name
                            }
                          </strong>

                          <small>
                            🍺{" "}
                            {
                              person.drinks
                            }
                            {" · "}
                            💧{" "}
                            {
                              person.liters.toFixed(
                                1
                              )
                            } L
                            {" · "}
                            🏆{" "}
                            {
                              person.points
                            }
                          </small>

                        </div>

                        <button
                          className="rankMiniButton"
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

                      <div className="personStats">

                        <div>
                          <span>
                            💶 Anteil
                          </span>

                          <b>
                            {
                              amountPerPerson.toFixed(
                                2
                              )
                            } €
                          </b>
                        </div>

                        <div>
                          <span>
                            💳 Bezahlt
                          </span>

                          <b className="green">
                            {
                              paid.toFixed(
                                2
                              )
                            } €
                          </b>
                        </div>

                        <div>
                          <span>
                            ⚠️ Offen
                          </span>

                          <b
                            className={
                              open >
                              0
                                ? "red"
                                : "green"
                            }
                          >
                            {
                              open.toFixed(
                                2
                              )
                            } €
                          </b>
                        </div>

                        <div>
                          <span>
                            🍺 Promille
                          </span>

                          <b>
                            {
                              Number(
                                person.promille ||
                                  0
                              ).toFixed(
                                2
                              )
                            } ‰
                          </b>
                        </div>

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
                          🍺 Kiste Bier spendieren
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

              {people.length >
                0 && (
                <button
                  className="outlineButton"
                  onClick={
                    recalculateAllPromille
                  }
                >
                  🍺 Promille neu berechnen
                </button>
              )}

            </>
          )}

        </section>

        {/* =================================================
            GETRÄNK HINZUFÜGEN
        ================================================= */}

        <section className="card">

          <h2>
            🍺 Getränk hinzufügen
          </h2>

          <input
            placeholder="Getränk"
            value={
              drinkName
            }
            onChange={(
              event
            ) =>
              setDrinkName(
                event.target.value
              )
            }
          />

          <div className="three">

            <input
              type="number"
              value={
                liters
              }
              onChange={(
                event
              ) =>
                setLiters(
                  event.target.value
                )
              }
              placeholder="Liter"
            />

            <input
              type="number"
              value={
                alcohol
              }
              onChange={(
                event
              ) =>
                setAlcohol(
                  event.target.value
                )
              }
              placeholder="Alkohol %"
            />

            <input
              type="number"
              value={
                price
              }
              onChange={(
                event
              ) =>
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

        {/* =================================================
            GETRÄNKE ZUORDNEN
        ================================================= */}

        <section className="card">

          <h2>
            🔗 Getränk zuordnen
          </h2>

          {people.length ===
          0 ? (
            <p>
              👥 Zuerst Teilnehmer hinzufügen.
            </p>
          ) : (
            people.map(
              (
                person
              ) => (
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
                    onChange={(
                      event
                    ) => {

                      const drink =
                        drinks.find(
                          (
                            item
                          ) =>
                            item.id ===
                            event.target.value
                        );

                      if (
                        drink
                      ) {
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
                      (
                        drink
                      ) => (
                        <option
                          key={
                            drink.id
                          }
                          value={
                            drink.id
                          }
                        >
                          {
                            getDrinkName(
                              drink
                            )
                          }
                          {" · "}
                          {
                            getDrinkLiters(
                              drink
                            ).toFixed(
                              1
                            )
                          } L ·{" "}
                          {
                            getDrinkPrice(
                              drink
                            ).toFixed(
                              2
                            )
                          } €
                        </option>
                      )
                    )}

                  </select>

                </div>
              )
            )
          )}

        </section>

        {/* =================================================
            GETRÄNKE
        ================================================= */}

        <section className="card">

          <button
            className="collapseButton"
            onClick={() =>
              setShowDrinks(
                !showDrinks
              )
            }
          >

            <span>
              🍺 Getränke
            </span>

            <span>
              {
                showDrinks
                  ? "▲"
                  : "▼"
              }
            </span>

          </button>

          {showDrinks &&
            drinks.map(
              (
                drink
              ) => (
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
                        getDrinkName(
                          drink
                        )
                      }
                    </strong>

                    <small>
                      {
                        getDrinkLiters(
                          drink
                        ).toFixed(
                          1
                        )
                      } Liter ·{" "}
                      {
                        getDrinkAlcohol(
                          drink
                        ).toFixed(
                          1
                        )
                      } %
                    </small>

                  </div>

                  <b>
                    {
                      getDrinkPrice(
                        drink
                      ).toFixed(
                        2
                      )
                    } €
                  </b>

                </div>
              )
            )}

        </section>

        {/* =================================================
            GETRÄNKEVERLAUF
        ================================================= */}

        <section className="card">

          <button
            className="collapseButton"
            onClick={() =>
              setShowDrinkHistory(
                !showDrinkHistory
              )
            }
          >

            <span>
              🕒 Getränkeverlauf
            </span>

            <span>
              {
                showDrinkHistory
                  ? "▲"
                  : "▼"
              }
            </span>

          </button>

          {showDrinkHistory && (
            <>

              {drinkHistory.length ===
              0 ? (
                <p>
                  Noch kein Getränk getrunken.
                </p>
              ) : (
                drinkHistory.map(
                  (
                    entry,
                    index
                  ) => {

                    const person =
                      people.find(
                        (
                          item
                        ) =>
                          item.id ===
                          entry.profile_id
                      );

                    return (
                      <div
                        className="historyItem"
                        key={
                          entry.id ||
                          index
                        }
                      >

                        <div>

                          <strong>
                            🍺{" "}
                            {
                              person?.name ||
                              "Teilnehmer"
                            }
                          </strong>

                          <small>
                            {
                              entry.description
                            }
                          </small>

                        </div>

                        <div className="historyTime">
                          {entry.created_at
                            ? new Date(
                                entry.created_at
                              ).toLocaleTimeString(
                                "de-DE",
                                {
                                  hour:
                                    "2-digit",
                                  minute:
                                    "2-digit",
                                }
                              )
                            : ""}
                        </div>

                      </div>
                    );
                  }
                )
              )}

            </>
          )}

        </section>

        {/* =================================================
            ZAHLUNGEN
        ================================================= */}

        <section className="card">

          <button
            className="collapseButton"
            onClick={() =>
              setShowPayments(
                !showPayments
              )
            }
          >

            <span>
              💶 Zahlungen & Kosten
            </span>

            <span>
              {
                showPayments
                  ? "▲"
                  : "▼"
              }
            </span>

          </button>

          {showPayments && (
            <>

              <div className="paymentOverview">

                <div>
                  <span>
                    💰 Gesamtkosten
                  </span>

                  <strong>
                    {
                      eventTotal.toFixed(
                        2
                      )
                    } €
                  </strong>
                </div>

                <div>
                  <span>
                    💳 Bezahlt
                  </span>

                  <strong className="green">
                    {
                      totalPayments.toFixed(
                        2
                      )
                    } €
                  </strong>
                </div>

                <div>
                  <span>
                    ⚠️ Noch offen
                  </span>

                  <strong className="red">
                    {
                      Math.max(
                        0,
                        eventTotal -
                          totalPayments
                      ).toFixed(
                        2
                      )
                    } €
                  </strong>
                </div>

                <div>
                  <span>
                    👥 Pro Person
                  </span>

                  <strong>
                    {
                      amountPerPerson.toFixed(
                        2
                      )
                    } €
                  </strong>
                </div>

              </div>

              <input
                type="number"
                step="0.01"
                placeholder="Betrag €"
                value={
                  paymentAmount
                }
                onChange={(
                  event
                ) =>
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
                onChange={(
                  event
                ) =>
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

              <h3>
                👥 Wer hat bezahlt?
              </h3>

              {payments.length ===
              0 ? (
                <p>
                  Noch keine Zahlungen.
                </p>
              ) : (
                payments.map(
                  (
                    payment
                  ) => (
                    <div
                      className="paymentRow"
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
                          {
                            payment.created_at
                              ? new Date(
                                  payment.created_at
                                ).toLocaleString(
                                  "de-DE"
                                )
                              : "Datum unbekannt"
                          }
                        </small>

                      </div>

                      <b className="green">
                        +
                        {
                          Number(
                            payment.betrag ||
                              0
                          ).toFixed(
                            2
                          )
                        } €
                      </b>

                    </div>
                  )
                )
              )}

              <h3>
                ⚠️ Wer muss noch bezahlen?
              </h3>

              {people.map(
                (
                  person
                ) => {

                  const paid =
                    paidByPerson[
                      person.id
                    ] || 0;

                  const open =
                    Math.max(
                      0,
                      amountPerPerson -
                        paid
                    );

                  return (
                    <div
                      className="paymentPerson"
                      key={
                        person.id
                      }
                    >

                      <div>

                        <strong>
                          {
                            person.name
                          }
                        </strong>

                        <small>
                          Anteil:{" "}
                          {
                            amountPerPerson.toFixed(
                              2
                            )
                          } € · Bezahlt:{" "}
                          {
                            paid.toFixed(
                              2
                            )
                          } €
                        </small>

                      </div>

                      <b
                        className={
                          open >
                          0
                            ? "red"
                            : "green"
                        }
                      >
                        {open >
                        0
                          ? `${open.toFixed(
                              2
                            )} € offen`
                          : "✅ Bezahlt"}
                      </b>

                    </div>
                  );
                }
              )}

            </>
          )}

        </section>

        {/* =================================================
            CHALLENGES
        ================================================= */}

        <section className="card">

          <button
            className="collapseButton"
            onClick={() =>
              setShowChallenges(
                !showChallenges
              )
            }
          >

            <span>
              🎯 Challenges
            </span>

            <span>
              {
                showChallenges
                  ? "▲"
                  : "▼"
              }
            </span>

          </button>

          {showChallenges && (
            <>

              <div className="challengeCreate">

                <button
                  className="challengeMainButton"
                  onClick={() =>
                    createChallenge()
                  }
                >
                  🎯 Eigene Challenge erstellen
                </button>

              </div>

              <h3>
                ⚡ Vorlagen
              </h3>

              <div className="templateGrid">

                {challengeTemplates
                  .filter(
                    (
                      template
                    ) =>
                      !selectedCategory ||
                      template.category ===
                        selectedCategory
                  )
                  .slice(
                    0,
                    12
                  )
                  .map(
                    (
                      template
                    ) => (
                      <button
                        className="templateCard"
                        key={
                          template.id
                        }
                        onClick={() =>
                          createChallenge(
                            template
                          )
                        }
                      >

                        <strong>
                          🎯{" "}
                          {
                            template.title
                          }
                        </strong>

                        <small>
                          {
                            template.description
                          }
                        </small>

                        <b>
                          +{
                            template.default_points ||
                            10
                          } Punkte
                        </b>

                      </button>
                    )
                  )}

              </div>

              <h3>
                🏷️ Kategorien
              </h3>

              <div className="categoryScroll">

                <button
                  className={
                    selectedCategory ===
                    ""
                      ? "category active"
                      : "category"
                  }
                  onClick={() =>
                    setSelectedCategory(
                      ""
                    )
                  }
                >
                  🎯 Alle
                </button>

                {challengeCategories.map(
                  (
                    category
                  ) => (
                    <button
                      className={
                        selectedCategory ===
                        category.name
                          ? "category active"
                          : "category"
                      }
                      key={
                        category.id
                      }
                      onClick={() =>
                        setSelectedCategory(
                          category.name
                        )
                      }
                    >
                      {
                        category.emoji
                      }{" "}
                      {
                        category.name
                      }
                    </button>
                  )
                )}

              </div>

              <h3>
                🔥 Aktive Challenges
              </h3>

              {challenges.length ===
              0 ? (
                <p>
                  Noch keine Challenges in diesem Event.
                </p>
              ) : (
                challenges.map(
                  (
                    challenge
                  ) => {

                    const assigned =
                      people.find(
                        (
                          person
                        ) =>
                          person.id ===
                          challenge.assigned_profile_id
                      );

                    return (
                      <div
                        className="challengeItem"
                        key={
                          challenge.id
                        }
                      >

                        <div>

                          <strong>
                            🎯{" "}
                            {
                              challenge.title
                            }
                          </strong>

                          <small>
                            {
                              challenge.description
                            }
                          </small>

                          <small>
                            Kategorie:{" "}
                            {
                              challenge.category
                            }
                            {" · "}
                            +{
                              challenge.points ||
                              0
                            } Punkte
                          </small>

                          {assigned && (
                            <small>
                              👤 Für:{" "}
                              {
                                assigned.name
                              }
                            </small>
                          )}

                        </div>

                        <div className="challengeActions">

                          <select
                            value={
                              challenge.assigned_profile_id ||
                              ""
                            }
                            onChange={(
                              event
                            ) => {

                              const person =
                                people.find(
                                  (
                                    item
                                  ) =>
                                    item.id ===
                                    event.target.value
                                );

                              if (
                                person
                              ) {
                                assignChallenge(
                                  challenge,
                                  person
                                );
                              }
                            }}
                          >

                            <option value="">
                              Teilnehmer
                            </option>

                            {people.map(
                              (
                                person
                              ) => (
                                <option
                                  key={
                                    person.id
                                  }
                                  value={
                                    person.id
                                  }
                                >
                                  {
                                    person.name
                                  }
                                </option>
                              )
                            )}

                          </select>

                          <button
                            className="completeChallenge"
                            onClick={() => {

                              const person =
                                assigned ||
                                people[0];

                              if (
                                person
                              ) {
                                completeChallenge(
                                  challenge,
                                  person
                                );
                              }

                            }}
                          >
                            🏆 Fertig
                          </button>

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </>
          )}

        </section>

        {/* =================================================
            RANGLISTE
        ================================================= */}

        <section className="card">

          <h2>
            🏆 Rangliste
          </h2>

          <p>
            Tippe auf eine Person, um zu sehen, wofür sie Punkte bekommen hat.
          </p>

          {ranking.map(
            (
              person,
              index
            ) => (
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
                  {index ===
                  0
                    ? "🥇"
                    : index ===
                      1
                    ? "🥈"
                    : index ===
                      2
                    ? "🥉"
                    : `${index + 1}.`}
                </strong>

                <span>
                  {
                    person.name
                  }
                </span>

                <b>
                  {
                    person.points
                  } Punkte
                </b>

              </button>
            )
          )}

          <div className="totalPoints">
            🏆 Gesamt:
            <strong>
              {" "}
              {
                totalPoints
              }
            </strong>{" "}
            Punkte
          </div>

        </section>

        {/* =================================================
            PERSON DETAIL / PUNKTE HISTORIE
        ================================================= */}

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

              <div className="detailStats">

                <div>
                  🍺
                  <strong>
                    {
                      selectedPerson.drinks
                    }
                  </strong>
                  Getränke
                </div>

                <div>
                  💧
                  <strong>
                    {
                      selectedPerson.liters.toFixed(
                        1
                      )
                    }
                  </strong>
                  Liter
                </div>

                <div>
                  🍺
                  <strong>
                    {
                      selectedPerson.promille.toFixed(
                        2
                      )
                    }
                  </strong>
                  ‰
                </div>

              </div>

              <h3>
                📜 Punkte-Historie
              </h3>

              {pointHistory.length ===
              0 ? (
                <p>
                  Noch keine Punkte-Historie.
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

                        <small>
                          {
                            entry.created_at
                              ? new Date(
                                  entry.created_at
                                ).toLocaleString(
                                  "de-DE"
                                )
                              : ""
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

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="message">
            {
              message
            }
          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer>

          🍻 Güstener Zapfhahn Zentrale

          <small>
            Dein Event. Deine Getränke. Deine Runde.
          </small>

        </footer>

      </div>

      {/* ===================================================
          DESIGN
      =================================================== */}

      <style jsx global>{`

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
          background: #05070a;
        }

        body {
          overflow-x: hidden;
        }

        * {
          box-sizing: border-box;
        }

        .page {
          width: 100%;
          min-height: 100vh;
          padding: 10px;

          color: white;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          background:
            radial-gradient(
              circle at 10% 0%,
              rgba(245,158,11,.18),
              transparent 28%
            ),

            radial-gradient(
              circle at 100% 15%,
              rgba(40,90,140,.18),
              transparent 35%
            ),

            linear-gradient(
              145deg,
              #05070a,
              #101821 55%,
              #05070a
            );
        }

        .container {
          width: 100%;
          max-width: 920px;
          margin: 0 auto;
        }

        header {
          display: flex;
          align-items: center;
          gap: 15px;

          padding:
            12px
            4px
            25px;
        }

        .logo {
          width: 65px;
          height: 65px;

          display: flex;
          justify-content: center;
          align-items: center;

          font-size: 38px;

          border-radius: 20px;

          background:
            linear-gradient(
              145deg,
              #fbbf24,
              #d97706
            );

          box-shadow:
            0 15px 40px
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

        h3 {
          margin-top: 20px;
        }

        p {
          color:
            #9ca8b5;
        }

        small {
          color:
            #8995a3;
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
            0 15px 45px
            rgba(0,0,0,.18);

          backdrop-filter:
            blur(12px);
        }

        .sectionHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;

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
            12px 16px;

          color:
            #111;

          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );
        }

        .deleteButton {
          width: 100%;

          padding: 12px;

          color:
            #ffaaaa;

          background:
            #411719;
        }

        .stats {
          display: grid;

          grid-template-columns:
            repeat(4,1fr);

          gap: 10px;

          margin-bottom: 15px;
        }

        .stat {
          padding: 15px 8px;

          text-align: center;

          border-radius: 18px;

          background:
            rgba(255,255,255,.05);

          border:
            1px solid
            rgba(255,255,255,.07);
        }

        .stat span {
          display: block;
          font-size: 24px;
        }

        .stat b {
          display: block;

          margin:
            5px 0;

          font-size: 20px;
        }

        .stat small {
          font-size: 11px;
        }

        .beerHero {
          margin-bottom: 15px;
        }

        .bigBeerButton {
          width: 100%;
          min-height: 205px;

          display: flex;

          flex-direction: column;

          justify-content: center;
          align-items: center;

          color: white;

          background:
            radial-gradient(
              circle at 50% 15%,
              #ff5555,
              #bd1515 55%,
              #690808
            );

          border:
            3px solid
            rgba(255,255,255,.15);

          box-shadow:
            0 20px 60px
            rgba(180,15,15,.4);

          transition:
            transform .15s ease,
            box-shadow .15s ease;
        }

        .bigBeerButton:hover {
          transform:
            translateY(-3px);

          box-shadow:
            0 25px 70px
            rgba(220,20,20,.5);
        }

        .bigBeerButton:active {
          transform:
            scale(.96);
        }

        .bigBeerEmoji {
          font-size: 60px;
        }

        .bigBeerButton strong {
          font-size: 44px;
          letter-spacing: 6px;
        }

        .bigBeerButton small {
          color:
            rgba(255,255,255,.8);
        }

        .collapseButton {
          width: 100%;

          display: flex;

          align-items: center;
          justify-content: space-between;

          padding: 2px 0;

          color: white;

          background: transparent;

          font-size: 19px;

          text-align: left;
        }

        .personCard {
          margin-top: 10px;
          padding: 15px;

          border-radius: 17px;

          background:
            rgba(255,255,255,.045);

          border:
            1px solid
            rgba(255,255,255,.05);
        }

        .personTop {
          display: flex;

          justify-content: space-between;
          align-items: center;
        }

        .personTop strong {
          display: block;
          font-size: 17px;
        }

        .personTop small {
          display: block;

          margin-top: 5px;
        }

        .rankMiniButton {
          padding:
            10px 13px;

          color: white;

          background:
            #303944;
        }

        .personStats {
          display: grid;

          grid-template-columns:
            repeat(4,1fr);

          gap: 7px;

          margin-top: 13px;
        }

        .personStats div {
          padding: 10px;

          text-align: center;

          border-radius: 12px;

          background:
            rgba(255,255,255,.04);
        }

        .personStats span {
          display: block;

          font-size: 11px;

          color:
            #8995a3;
        }

        .personStats b {
          display: block;

          margin-top: 4px;
        }

        .personActions {
          margin-top: 10px;
        }

        .crateButton {
          width: 100%;

          padding: 13px;

          color:
            #111;

          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #d97706
            );
        }

        .outlineButton {
          width: 100%;

          margin-top: 12px;

          padding: 13px;

          color:
            #fbbf24;

          background:
            transparent;

          border:
            1px solid
            #9a6b08;
        }

        .green {
          color:
            #4ade80 !important;
        }

        .red {
          color:
            #ff6b6b !important;
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
            repeat(3,1fr);

          gap: 8px;
        }

        .saveButton {
          width: 100%;

          padding: 14px;

          color:
            #111;

          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );
        }

        .assignment {
          display: grid;

          grid-template-columns:
            1fr 1.6fr;

          align-items: center;

          gap: 10px;

          margin-bottom: 8px;
        }

        .assignment select {
          margin: 0;
        }

        .item {
          display: flex;

          justify-content: space-between;
          align-items: center;

          gap: 10px;

          margin-top: 8px;

          padding: 13px;

          border-radius: 15px;

          background:
            rgba(255,255,255,.045);
        }

        .item small {
          display: block;

          margin-top: 4px;
        }

        .historyItem {
          display: flex;

          justify-content: space-between;
          align-items: center;

          gap: 10px;

          margin-top: 8px;

          padding: 13px;

          border-radius: 15px;

          background:
            rgba(255,255,255,.045);
        }

        .historyItem small {
          display: block;

          margin-top: 5px;
        }

        .historyTime {
          color:
            #fbbf24;
        }

        .paymentOverview {
          display: grid;

          grid-template-columns:
            repeat(4,1fr);

          gap: 8px;

          margin-bottom: 15px;
        }

        .paymentOverview div {
          padding: 12px;

          border-radius: 13px;

          text-align: center;

          background:
            rgba(255,255,255,.045);
        }

        .paymentOverview span {
          display: block;

          font-size: 11px;

          color:
            #8995a3;
        }

        .paymentOverview strong {
          display: block;

          margin-top: 5px;
        }

        .paymentRow,
        .paymentPerson {
          display: flex;

          justify-content: space-between;
          align-items: center;

          gap: 10px;

          margin-top: 8px;

          padding: 13px;

          border-radius: 15px;

          background:
            rgba(255,255,255,.045);
        }

        .paymentRow small,
        .paymentPerson small {
          display: block;

          margin-top: 4px;
        }

        .beerRequest {
          margin-top: 12px;

          padding: 15px;

          border-radius: 16px;

          background:
            rgba(255,255,255,.045);

          border:
            1px solid
            rgba(255,255,255,.06);
        }

        .responseRow {
          display: flex;

          justify-content: space-between;
          align-items: center;

          padding:
            10px 0;

          border-top:
            1px solid
            rgba(255,255,255,.06);
        }

        .responseButtons {
          display: flex;

          gap: 6px;
        }

        .accept {
          padding:
            9px 13px;

          color: white;

          background:
            #15803d;
        }

        .decline {
          padding:
            9px 13px;

          color: white;

          background:
            #991b1b;
        }

        .challengeMainButton {
          width: 100%;

          padding: 14px;

          color:
            #111;

          background:
            linear-gradient(
              135deg,
              #fbbf24,
              #f59e0b
            );
        }

        .templateGrid {
          display: grid;

          grid-template-columns:
            repeat(2,1fr);

          gap: 8px;
        }

        .templateCard {
          padding: 13px;

          color: white;

          text-align: left;

          background:
            rgba(255,255,255,.045);

          border:
            1px solid
            rgba(255,255,255,.07);
        }

        .templateCard strong {
          display: block;
        }

        .templateCard small {
          display: block;

          margin-top: 6px;
        }

        .templateCard b {
          display: block;

          margin-top: 8px;

          color:
            #fbbf24;
        }

        .categoryScroll {
          display: flex;

          gap: 7px;

          overflow-x: auto;

          padding-bottom: 5px;
        }

        .category {
          flex:
            0 0 auto;

          padding:
            10px 13px;

          color:
            #d4d9df;

          background:
            #1a232d;
        }

        .category.active {
          color:
            #111;

          background:
            #fbbf24;
        }

        .challengeItem {
          display: grid;

          grid-template-columns:
            1fr auto;

          gap: 12px;

          margin-top: 10px;

          padding: 15px;

          border-radius: 17px;

          background:
            rgba(255,255,255,.045);
        }

        .challengeItem strong {
          display: block;

          font-size: 17px;
        }

        .challengeItem small {
          display: block;

          margin-top: 5px;
        }

        .challengeActions {
          display: flex;

          flex-direction: column;

          gap: 6px;

          min-width: 140px;
        }

        .challengeActions select {
          margin: 0;
        }

        .completeChallenge {
          padding: 11px;

          color:
            #111;

          background:
            #4ade80;
        }

        .rank {
          width: 100%;

          display: grid;

          grid-template-columns:
            45px 1fr auto;

          align-items: center;

          gap: 10px;

          margin-top: 8px;

          padding: 14px;

          color: white;

          text-align: left;

          background:
            rgba(255,255,255,.045);
        }

        .rank:hover {
          background:
            rgba(245,158,11,.1);
        }

        .totalPoints {
          margin-top: 15px;

          text-align: center;

          color:
            #fbbf24;
        }

        .modal {
          position: fixed;

          inset: 0;

          z-index: 1500;

          display: flex;

          align-items: center;
          justify-content: center;

          padding: 20px;

          background:
            rgba(0,0,0,.8);

          backdrop-filter:
            blur(8px);
        }

        .modalBox {
          position: relative;

          width:
            min(100%,620px);

          max-height:
            88vh;

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

          color: white;

          background:
            #303944;

          font-size: 25px;
        }

        .bigPoints {
          text-align: center;

          padding: 20px;

          color:
            #fbbf24;

          font-size: 55px;
          font-weight: 900;
        }

        .bigPoints small {
          display: block;

          font-size: 13px;
        }

        .detailStats {
          display: grid;

          grid-template-columns:
            repeat(3,1fr);

          gap: 8px;
        }

        .detailStats div {
          padding: 13px;

          text-align: center;

          border-radius: 14px;

          background:
            rgba(255,255,255,.045);
        }

        .detailStats strong {
          display: block;

          margin: 5px 0;
        }

        .history {
          display: flex;

          justify-content: space-between;

          gap: 10px;

          margin-top: 8px;

          padding: 13px;

          border-radius: 14px;

          background:
            rgba(255,255,255,.045);
        }

        .history small {
          display: block;

          margin-top: 4px;
        }

        .history b {
          color:
            #4ade80;

          font-size: 20px;
        }

        .message {
          position: fixed;

          left: 50%;
          bottom: 20px;

          z-index: 3000;

          width:
            min(92%,650px);

          transform:
            translateX(-50%);

          padding: 15px;

          border-radius: 15px;

          text-align: center;

          color:
            #fbbf24;

          background:
            #172230;

          border:
            1px solid
            #405366;

          box-shadow:
            0 20px 50px
            rgba(0,0,0,.5);
        }

        .animationOverlay {
          position: fixed;

          inset: 0;

          z-index: 2500;

          display: flex;

          flex-direction: column;

          justify-content: center;
          align-items: center;

          pointer-events: none;

          background:
            rgba(0,0,0,.82);

          backdrop-filter:
            blur(7px);
        }

        .clinkingGlasses {
          display: flex;

          gap: 35px;

          font-size: 100px;

          animation:
            clink .8s
            ease-in-out
            infinite alternate;
        }

        .prostText {
          margin-top: 20px;

          color:
            #fbbf24;

          font-size: 65px;
          font-weight: 900;

          text-shadow:
            0 5px 40px
            rgba(245,158,11,.7);
        }

        .beerAnimation {
          font-size: 150px;

          animation:
            beerBounce .7s
            ease-in-out
            infinite alternate;
        }

        .beerText {
          margin-top: 10px;

          font-size: 70px;
          font-weight: 900;

          color:
            #ff4b4b;
        }

        .beerSub {
          font-size: 20px;

          color:
            white;
        }

        .crateAnimation {
          font-size: 90px;

          animation:
            cratePop .7s
            ease-out
            infinite alternate;
        }

        .crateText {
          margin-top: 15px;

          color:
            #fbbf24;

          font-size: 55px;
          font-weight: 900;
        }

        .crateSub {
          margin-top: 8px;

          font-size: 24px;
        }

        .challengeAnimation {
          font-size: 140px;

          animation:
            challengeSpin 1s
            ease-in-out
            infinite alternate;
        }

        .challengeText {
          font-size: 55px;

          color:
            #fbbf24;

          font-weight: 900;
        }

        .challengeSub {
          margin-top: 10px;

          font-size: 25px;
        }

        .moneyOverlay {
          position: fixed;

          inset: 0;

          z-index: 2500;

          overflow: hidden;

          pointer-events: none;
        }

        .moneyOverlay span {
          position: absolute;

          top: -80px;

          font-size: 48px;

          animation:
            moneyFall 2.4s
            linear forwards;
        }

        .moneyText {
          position: absolute;

          inset: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          font-size: 65px;
          font-weight: 900;

          color:
            #4ade80;

          text-shadow:
            0 5px 40px
            rgba(74,222,128,.6);
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
              translateX(-30px)
              rotate(-10deg);
          }

          to {
            transform:
              translateX(30px)
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

        @keyframes cratePop {

          from {
            transform:
              scale(.8)
              translateY(20px);
          }

          to {
            transform:
              scale(1.15)
              translateY(-10px);
          }

        }

        @keyframes challengeSpin {

          from {
            transform:
              rotate(-12deg)
              scale(.9);
          }

          to {
            transform:
              rotate(12deg)
              scale(1.15);
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

        @media(max-width:700px) {

          .page {
            padding: 7px;
          }

          h1 {
            font-size: 20px;
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

          .sectionHeader {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .personStats {
            grid-template-columns:
              repeat(2,1fr);
          }

          .paymentOverview {
            grid-template-columns:
              repeat(2,1fr);
          }

          .challengeItem {
            grid-template-columns:
              1fr;
          }

          .challengeActions {
            min-width: 0;
          }

          .templateGrid {
            grid-template-columns:
              1fr;
          }

          .bigBeerButton {
            min-height: 180px;
          }

          .bigBeerButton strong {
            font-size: 36px;
          }

          .prostText {
            font-size: 45px;
          }

          .clinkingGlasses {
            font-size: 70px;
          }

          .beerText {
            font-size: 55px;
          }

          .crateText {
            font-size: 40px;
          }

          .challengeText {
            font-size: 42px;
          }

          .moneyText {
            font-size: 45px;
          }

          .detailStats {
            grid-template-columns:
              repeat(3,1fr);
          }

        }

      `}</style>

    </main>
  );
}
