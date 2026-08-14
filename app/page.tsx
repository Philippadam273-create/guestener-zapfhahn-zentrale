"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  invite_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
  show_promille?: boolean | null;
  show_points?: boolean | null;
  show_ranking?: boolean | null;
  show_statistics?: boolean | null;
  show_drink_amounts?: boolean | null;
  show_costs?: boolean | null;
  cost_overview_enabled?: boolean | null;
  auto_split_costs?: boolean | null;
  ranking_enabled?: boolean | null;
};

type Profile = {
  id: string;
  username: string;
  points: number | null;
  drinks_count: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
  gewicht_kg?: number | null;
  alter?: number | null;
  geschlecht?: string | null;
};

type Drink = {
  id: string;
  event_id: string;
  profile_id?: string | null;
  drink_name?: string | null;
  getraenk?: string | null;
  brand?: string | null;
  marke?: string | null;
  liters?: number | null;
  menge?: number | null;
  alcohol_percent?: number | null;
  alkohol?: number | null;
  preis?: number | null;
  quantity?: number | null;
  promille_wert?: number | null;
};

type Payment = {
  id: string;
  event_id: string;
  betrag: number;
  created_at: string;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string | null;
};

type Challenge = {
  id: string;
  event_id: string;
  title: string;
  description?: string | null;
  points?: number | null;
  category?: string | null;
  status?: string | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  required_votes?: number | null;
};

type PointTransaction = {
  id: string;
  event_id?: string | null;
  profile_id: string;
  points: number;
  reason_type: string;
  reason: string;
  description?: string | null;
  reference_id?: string | null;
  created_at: string;
};

type ChallengeTemplate = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  default_points?: number | null;
  requires_vote?: boolean | null;
  minimum_votes?: number | null;
};

type AnimationType =
  | "prost"
  | "money"
  | "crate"
  | "points"
  | null;

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [templates, setTemplates] = useState<
    ChallengeTemplate[]
  >([]);

  const [message, setMessage] = useState("");

  const [personName, setPersonName] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPerson, setPaymentPerson] = useState("");

  const [challengeTitle, setChallengeTitle] =
    useState("");
  const [challengeDescription, setChallengeDescription] =
    useState("");
  const [challengePoints, setChallengePoints] =
    useState("10");
  const [challengePerson, setChallengePerson] =
    useState("");

  const [selectedRankingProfile, setSelectedRankingProfile] =
    useState<Profile | null>(null);

  const [pointHistory, setPointHistory] = useState<
    PointTransaction[]
  >([]);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const [animation, setAnimation] =
    useState<AnimationType>(null);

  const [cratePerson, setCratePerson] =
    useState("");

  const [savingCrate, setSavingCrate] =
    useState(false);

  function showMessage(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  function startAnimation(
    type: Exclude<AnimationType, null>
  ) {
    setAnimation(type);

    window.setTimeout(() => {
      setAnimation(null);
    }, type === "money" ? 3500 : 2800);
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
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

      if (!eventId && data.length > 0) {
        setEventId(data[0].id);
      }
    }
  }

  async function loadData() {
    if (!eventId) return;

    const [
      profilesResult,
      drinksResult,
      paymentsResult,
      challengesResult,
      templatesResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("username"),

      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("payments")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("challenges")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("challenge_templates")
        .select("*")
        .eq("is_active", true)
        .order("title"),
    ]);

    if (profilesResult.data) {
      setProfiles(profilesResult.data);
    }

    if (drinksResult.data) {
      setDrinks(drinksResult.data);
    }

    if (paymentsResult.data) {
      setPayments(paymentsResult.data);
    }

    if (challengesResult.data) {
      setChallenges(challengesResult.data);
    }

    if (templatesResult.data) {
      setTemplates(templatesResult.data);
    }

    /*
     * Falls eine Person gerade geöffnet ist,
     * aktualisieren wir auch ihre Historie.
     */
    if (selectedRankingProfile) {
      await loadPointHistory(
        selectedRankingProfile.id
      );
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!eventId) return;

    setSelectedRankingProfile(null);
    setPointHistory([]);

    loadData();
  }, [eventId]);

  function profileName(
    profileId?: string | null
  ) {
    if (!profileId) {
      return "Unbekannt";
    }

    const profile = profiles.find(
      (p) => p.id === profileId
    );

    return profile?.username || "Unbekannt";
  }

  async function loadPointHistory(
    profileId: string
  ) {
    if (!eventId || !profileId) return;

    setLoadingHistory(true);

    const { data, error } = await supabase
      .from("point_transactions")
      .select("*")
      .eq("event_id", eventId)
      .eq("profile_id", profileId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage(
        "❌ Punktehistorie konnte nicht geladen werden: " +
          error.message
      );
      setLoadingHistory(false);
      return;
    }

    setPointHistory(data || []);
    setLoadingHistory(false);
  }

  async function openRankingProfile(
    profile: Profile
  ) {
    setSelectedRankingProfile(profile);

    await loadPointHistory(profile.id);
  }

  function closeRankingProfile() {
    setSelectedRankingProfile(null);
    setPointHistory([]);
  }

  async function addPerson() {
    if (!personName.trim()) {
      showMessage(
        "❌ Bitte einen Namen eingeben."
      );
      return;
    }

    const exists = profiles.some(
      (profile) =>
        profile.username.toLowerCase() ===
        personName.trim().toLowerCase()
    );

    if (exists) {
      showMessage(
        "❌ Teilnehmer bereits vorhanden."
      );
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        username: personName.trim(),
        points: 0,
        drinks_count: 0,
      })
      .select()
      .single();

    if (error) {
      showMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message
      );
      return;
    }

    if (data && eventId) {
      const { error: memberError } =
        await supabase
          .from("event_members")
          .insert({
            event_id: eventId,
            profile_id: data.id,
          });

      if (memberError) {
        showMessage(
          "❌ Teilnehmer konnte nicht zum Event hinzugefügt werden: " +
            memberError.message
        );
        return;
      }
    }

    setPersonName("");

    showMessage(
      "✅ Teilnehmer hinzugefügt."
    );

    await loadData();
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

    const { error } = await supabase
      .from("drinks")
      .insert({
        event_id: eventId,
        drink_name: drinkName.trim(),
        getraenk: drinkName.trim(),
        menge: Number(liters),
        liters: Number(liters),
        alkohol: Number(alcohol),
        alcohol_percent: Number(alcohol),
        preis: Number(price),
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

    showMessage(
      "🍺 Getränk gespeichert."
    );

    await loadData();
  }

  async function assignDrink(
    drink: Drink,
    profileId: string
  ) {
    if (!profileId) return;

    const profile = profiles.find(
      (p) => p.id === profileId
    );

    if (!profile) {
      showMessage(
        "❌ Teilnehmer nicht gefunden."
      );
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .update({
        profile_id: profileId,
      })
      .eq("id", drink.id);

    if (error) {
      showMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    /*
     * Punkte nur vergeben, wenn das Getränk
     * vorher noch keinem Teilnehmer zugeordnet war.
     *
     * Dadurch verhindert die App, dass durch
     * mehrfaches Auswählen immer wieder +10
     * vergeben werden.
     */
    if (!drink.profile_id) {
      const { error: pointError } =
        await supabase.rpc(
          "award_drink_points",
          {
            input_event_id: eventId,
            input_profile_id: profileId,
            input_drink_id: drink.id,
          }
        );

      if (pointError) {
        showMessage(
          "⚠️ Getränk zugeordnet, aber Punkte konnten nicht gespeichert werden: " +
            pointError.message
        );
      }

      await supabase
        .from("profiles")
        .update({
          drinks_count:
            Number(
              profile.drinks_count || 0
            ) + 1,
        })
        .eq("id", profileId);
    }

    showMessage(
      `🍺 ${profile.username} hat ein Getränk bekommen! +10 Punkte`
    );

    startAnimation("prost");

    await loadData();
  }

  async function savePayment() {
    if (!eventId) {
      showMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    if (
      !paymentAmount ||
      Number(paymentAmount) <= 0
    ) {
      showMessage(
        "❌ Bitte einen Betrag eingeben."
      );
      return;
    }

    if (!paymentPerson) {
      showMessage(
        "❌ Bitte auswählen, wer bezahlt hat."
      );
      return;
    }

    const { error } = await supabase
      .from("payments")
      .insert({
        event_id: eventId,
        betrag: Number(paymentAmount),
        bezahlt_von: paymentPerson,
        profile_id: paymentPerson,
        status: "paid",
      });

    if (error) {
      showMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    const payerName =
      profileName(paymentPerson);

    setPaymentAmount("");
    setPaymentPerson("");

    showMessage(
      `💶 ${payerName} hat ${Number(
        paymentAmount
      ).toFixed(2)} € bezahlt.`
    );

    startAnimation("money");

    await loadData();
  }

  async function sponsorBeerCrate() {
    if (!eventId) {
      showMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    if (!cratePerson) {
      showMessage(
        "❌ Bitte auswählen, wer die Kiste spendiert hat."
      );
      return;
    }

    setSavingCrate(true);

    const sponsor =
      profiles.find(
        (profile) =>
          profile.id === cratePerson
      );

    const { error } = await supabase.rpc(
      "sponsor_beer_crate",
      {
        input_event_id: eventId,
        input_profile_id: cratePerson,
      }
    );

    setSavingCrate(false);

    if (error) {
      showMessage(
        "❌ Kiste konnte nicht verbucht werden: " +
          error.message
      );
      return;
    }

    setCratePerson("");

    showMessage(
      `🍺 ${sponsor?.username || "Teilnehmer"} hat eine Kiste Bier spendiert! +50 Punkte`
    );

    startAnimation("crate");

    await loadData();
  }

  async function createChallenge() {
    if (!eventId) {
      showMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    if (!challengeTitle.trim()) {
      showMessage(
        "❌ Bitte einen Challenge-Namen eingeben."
      );
      return;
    }

    const { error } = await supabase
      .from("challenges")
      .insert({
        event_id: eventId,
        title: challengeTitle.trim(),
        description:
          challengeDescription.trim(),
        points:
          Number(challengePoints) || 10,
        assigned_profile_id:
          challengePerson || null,
        status: "open",
        is_active: true,
      });

    if (error) {
      showMessage(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setChallengeTitle("");
    setChallengeDescription("");
    setChallengePoints("10");
    setChallengePerson("");

    showMessage(
      "🔥 Challenge erstellt!"
    );

    await loadData();
  }

  const totalDrinkCost = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(drink.preis || 0) *
            Number(drink.quantity || 1),
        0
      ),
    [drinks]
  );

  const totalPayments = useMemo(
    () =>
      payments.reduce(
        (sum, payment) =>
          sum +
          Number(payment.betrag || 0),
        0
      ),
    [payments]
  );

  const totalLiters = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(
            drink.liters ??
              drink.menge ??
              0
          ) *
            Number(drink.quantity || 1),
        0
      ),
    [drinks]
  );

  const ranking = [...profiles].sort(
    (a, b) =>
      Number(b.points || 0) -
      Number(a.points || 0)
  );

  const historyTotal = useMemo(
    () =>
      pointHistory.reduce(
        (sum, item) =>
          sum + Number(item.points || 0),
        0
      ),
    [pointHistory]
  );

  const getReasonEmoji = (
    reasonType: string
  ) => {
    switch (reasonType) {
      case "drink":
        return "🍺";

      case "beer_crate":
        return "🍻";

      case "challenge":
        return "🔥";

      case "challenge_winner":
        return "🏆";

      case "vote":
        return "🗳️";

      case "bonus":
        return "⭐";

      default:
        return "🎯";
    }
  };

  const getRankingTitle = (
    points: number
  ) => {
    if (points >= 1000)
      return "👑 Zapfhahn-Legende";

    if (points >= 750)
      return "🍻 Bier-Gott";

    if (points >= 500)
      return "🏆 Party-Endgegner";

    if (points >= 350)
      return "🔥 Feierbiest";

    if (points >= 250)
      return "🍺 Bier-Akrobat";

    if (points >= 150)
      return "😎 Stimmungsmacher";

    if (points >= 100)
      return "🎉 Party-Profi";

    if (points >= 50)
      return "🍻 Theken-Talent";

    if (points >= 25)
      return "😈 Anwärter";

    return "🥤 Frischling";
  };

  return (
    <main className="page">

      {/* ================================================= */}
      {/* ANIMATION: PROST */}
      {/* ================================================= */}

      {animation === "prost" && (
        <div className="animationOverlay">

          <div className="toastBeer leftBeer">
            🍺
          </div>

          <div className="toastBeer rightBeer">
            🍺
          </div>

          <div className="prostText">
            PROST!
          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* ANIMATION: GELD */}
      {/* ================================================= */}

      {animation === "money" && (
        <div className="moneyRain">

          {Array.from({
            length: 45,
          }).map((_, index) => (
            <span
              key={index}
              style={{
                left:
                  `${Math.random() * 100}%`,
                animationDelay:
                  `${Math.random() * 1.5}s`,
              }}
            >
              💶
            </span>
          ))}

          <div className="moneyText">
            💸 ZAHLUNG EINGEGANGEN! 💸
          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* ANIMATION: KISTE */}
      {/* ================================================= */}

      {animation === "crate" && (
        <div className="crateAnimation">

          <div className="crateBeer">
            🍺🍺🍺
          </div>

          <div className="crateText">
            DANKE FÜR DIE KISTE!
          </div>

          <div className="cratePoints">
            +50 PUNKTE
          </div>

          <div className="confetti">
            🎉 🍻 🎊 🍺 🎉 🍻 🎊
          </div>

        </div>
      )}

      <div className="container">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header>

          <div className="logo">
            🍻
          </div>

          <div>

            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Events · Getränke · Geld ·
              Challenges · Ranking
            </p>

          </div>

        </header>

        {/* ================================================= */}
        {/* EVENT */}
        {/* ================================================= */}

        <section className="card">

          <h2>
            📅 Aktuelles Event
          </h2>

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

          {currentEvent(eventId, events)}

        </section>

        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        <div className="stats">

          <div className="stat">
            🍺
            <b>{drinks.length}</b>
            <small>Getränke</small>
          </div>

          <div className="stat">
            💧
            <b>
              {totalLiters.toFixed(1)}
            </b>
            <small>Liter</small>
          </div>

          <div className="stat">
            💶
            <b>
              {totalDrinkCost.toFixed(2)} €
            </b>
            <small>Getränkekosten</small>
          </div>

          <div className="stat">
            👥
            <b>{profiles.length}</b>
            <small>Teilnehmer</small>
          </div>

        </div>

        {/* ================================================= */}
        {/* TEILNEHMER */}
        {/* ================================================= */}

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

          {profiles.map((profile) => (

            <div
              className="person"
              key={profile.id}
            >

              <div>

                <b>
                  👤 {profile.username}
                </b>

                <small>
                  🍺{" "}
                  {profile.drinks_count || 0}
                  {" · "}
                  🏆{" "}
                  {profile.points || 0}
                  Punkte
                </small>

              </div>

              <span className="miniBadge">
                {getRankingTitle(
                  Number(
                    profile.points || 0
                  )
                )}
              </span>

            </div>

          ))}

        </section>

        {/* ================================================= */}
        {/* GETRÄNK */}
        {/* ================================================= */}

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

          <button
            className="save"
            onClick={saveDrink}
          >
            🍻 Getränk speichern
          </button>

        </section>

        {/* ================================================= */}
        {/* GETRÄNK ZUORDNEN */}
        {/* ================================================= */}

        <section className="card">

          <h2>
            🔗 Getränk zuordnen
          </h2>

          {drinks.length === 0 ? (

            <p>
              Noch keine Getränke vorhanden.
            </p>

          ) : (

            drinks.map((drink) => (

              <div
                className="drinkAssignment"
                key={drink.id}
              >

                <div>

                  <b>
                    🍺{" "}
                    {drink.drink_name ||
                      drink.getraenk ||
                      "Getränk"}
                  </b>

                  <small>
                    {Number(
                      drink.liters ??
                        drink.menge ??
                        0
                    ).toFixed(1)}
                    {" "}L ·{" "}
                    {Number(
                      drink.alcohol_percent ??
                        drink.alkohol ??
                        0
                    ).toFixed(1)}
                    %
                  </small>

                </div>

                <select
                  value={
                    drink.profile_id || ""
                  }
                  onChange={(e) =>
                    assignDrink(
                      drink,
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Teilnehmer auswählen
                  </option>

                  {profiles.map(
                    (profile) => (
                      <option
                        key={profile.id}
                        value={profile.id}
                      >
                        {profile.username}
                      </option>
                    )
                  )}

                </select>

              </div>

            ))

          )}

        </section>

        {/* ================================================= */}
        {/* ZAHLUNGEN */}
        {/* ================================================= */}

        <section className="card">

          <h2>
            💶 Zahlungen
          </h2>

          <div className="paymentForm">

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

            <select
              value={paymentPerson}
              onChange={(e) =>
                setPaymentPerson(
                  e.target.value
                )
              }
            >

              <option value="">
                👤 Wer hat bezahlt?
              </option>

              {profiles.map(
                (profile) => (
                  <option
                    key={profile.id}
                    value={profile.id}
                  >
                    {profile.username}
                  </option>
                )
              )}

            </select>

            <button
              onClick={savePayment}
            >
              💶 Zahlung speichern
            </button>

          </div>

          <div className="paymentTotal">

            <span>
              💰 Insgesamt bezahlt
            </span>

            <b>
              {totalPayments.toFixed(2)} €
            </b>

          </div>

          <h3>
            💳 Zahlungshistorie
          </h3>

          {payments.length === 0 ? (

            <p>
              Noch keine Zahlungen.
            </p>

          ) : (

            payments.map(
              (payment) => (

                <div
                  className="paymentItem"
                  key={payment.id}
                >

                  <div className="paymentPerson">

                    <div className="avatar">
                      💶
                    </div>

                    <div>

                      <b>
                        {profileName(
                          payment.bezahlt_von ||
                            payment.profile_id
                        )}
                      </b>

                      <small>
                        hat am{" "}
                        {new Date(
                          payment.created_at
                        ).toLocaleDateString(
                          "de-DE"
                        )}{" "}
                        bezahlt
                      </small>

                    </div>

                  </div>

                  <strong>
                    {Number(
                      payment.betrag || 0
                    ).toFixed(2)}
                    €
                  </strong>

                </div>

              )
            )

          )}

        </section>

        {/* ================================================= */}
        {/* KISTE BIER */}
        {/* ================================================= */}

        <section className="card crateCard">

          <div className="crateHeader">

            <div>
              <h2>
                🍺 Kiste Bier spendieren
              </h2>

              <p>
                Eine Kiste Bier bringt dem
                edlen Spender ordentlich
                Ruhm.
              </p>
            </div>

            <div className="crateBonus">
              +50
            </div>

          </div>

          <select
            value={cratePerson}
            onChange={(e) =>
              setCratePerson(
                e.target.value
              )
            }
          >

            <option value="">
              🍻 Wer spendiert die Kiste?
            </option>

            {profiles.map(
              (profile) => (
                <option
                  key={profile.id}
                  value={profile.id}
                >
                  {profile.username}
                </option>
              )
            )}

          </select>

          <button
            className="crateButton"
            onClick={sponsorBeerCrate}
            disabled={savingCrate}
          >
            {savingCrate
              ? "🍺 Wird verbucht..."
              : "🍻 KISTE SPENDIERT! +50"}
          </button>

        </section>

        {/* ================================================= */}
        {/* CHALLENGES */}
        {/* ================================================= */}

        <section className="card">

          <h2>
            🔥 Challenges
          </h2>

          <div className="challengeForm">

            <input
              placeholder="Challenge"
              value={challengeTitle}
              onChange={(e) =>
                setChallengeTitle(
                  e.target.value
                )
              }
            />

            <input
              placeholder="Beschreibung"
              value={
                challengeDescription
              }
              onChange={(e) =>
                setChallengeDescription(
                  e.target.value
                )
              }
            />

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

              <select
                value={
                  challengePerson
                }
                onChange={(e) =>
                  setChallengePerson(
                    e.target.value
                  )
                }
              >

                <option value="">
                  🎯 Teilnehmer
                </option>

                {profiles.map(
                  (profile) => (
                    <option
                      key={profile.id}
                      value={profile.id}
                    >
                      {profile.username}
                    </option>
                  )
                )}

              </select>

            </div>

            <button
              onClick={createChallenge}
            >
              🚀 Challenge starten
            </button>

          </div>

          {challenges.map(
            (challenge) => (

              <div
                className="challenge"
                key={challenge.id}
              >

                <div>

                  <b>
                    🔥{" "}
                    {challenge.title}
                  </b>

                  {challenge.description && (
                    <small>
                      {
                        challenge.description
                      }
                    </small>
                  )}

                </div>

                <strong>
                  +
                  {challenge.points ||
                    0}
                </strong>

              </div>

            )
          )}

        </section>

        {/* ================================================= */}
        {/* RANKING */}
        {/* ================================================= */}

        <section className="card">

          <div className="rankingHeader">

            <div>
              <h2>
                🏆 Ranking
              </h2>

              <p>
                Klicke auf eine Person,
                um zu sehen, woher die
                Punkte kommen.
              </p>
            </div>

            <div className="rankingTrophy">
              🏆
            </div>

          </div>

          {ranking.length === 0 ? (

            <p>
              Noch keine Teilnehmer.
            </p>

          ) : (

            ranking.map(
              (profile, index) => (

                <button
                  className="rankButton"
                  key={profile.id}
                  onClick={() =>
                    openRankingProfile(
                      profile
                    )
                  }
                >

                  <span className="rankPlace">

                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : `${index + 1}.`}

                  </span>

                  <span className="rankName">

                    <b>
                      {profile.username}
                    </b>

                    <small>
                      {getRankingTitle(
                        Number(
                          profile.points ||
                            0
                        )
                      )}
                    </small>

                  </span>

                  <span className="rankPoints">
                    {profile.points ||
                      0}
                    <small>
                      Punkte
                    </small>
                  </span>

                  <span className="rankArrow">
                    →
                  </span>

                </button>

              )
            )

          )}

        </section>

        {/* ================================================= */}
        {/* RANKING DETAIL */}
        {/* ================================================= */}

        {selectedRankingProfile && (

          <div
            className="modalBackdrop"
            onClick={
              closeRankingProfile
            }
          >

            <div
              className="rankingModal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <button
                className="closeModal"
                onClick={
                  closeRankingProfile
                }
              >
                ×
              </button>

              <div className="profileHero">

                <div className="bigAvatar">
                  👤
                </div>

                <h2>
                  {
                    selectedRankingProfile.username
                  }
                </h2>

                <div className="profileTitle">
                  {getRankingTitle(
                    Number(
                      selectedRankingProfile.points ||
                        0
                    )
                  )}
                </div>

                <div className="bigPoints">
                  {
                    selectedRankingProfile.points ||
                      0
                  }
                  <small>
                    GESAMTPUNKTE
                  </small>
                </div>

              </div>

              <div className="historySummary">

                <div>
                  <b>
                    {pointHistory.length}
                  </b>
                  <small>
                    Aktionen
                  </small>
                </div>

                <div>
                  <b>
                    {historyTotal}
                  </b>
                  <small>
                    Historienpunkte
                  </small>
                </div>

              </div>

              <h3>
                📜 Punkte-Historie
              </h3>

              {loadingHistory ? (

                <div className="loading">
                  ⏳ Punkte werden geladen...
                </div>

              ) : pointHistory.length ===
                0 ? (

                <div className="emptyHistory">

                  <div>
                    🥤
                  </div>

                  <b>
                    Noch keine Punkteaktionen
                  </b>

                  <small>
                    Hier wird später genau
                    angezeigt, wofür die
                    Punkte vergeben wurden.
                  </small>

                </div>

              ) : (

                <div className="history">

                  {pointHistory.map(
                    (item) => (

                      <div
                        className="historyItem"
                        key={item.id}
                      >

                        <div className="historyIcon">
                          {getReasonEmoji(
                            item.reason_type
                          )}
                        </div>

                        <div className="historyText">

                          <b>
                            {item.reason}
                          </b>

                          <small>
                            {new Date(
                              item.created_at
                            ).toLocaleDateString(
                              "de-DE"
                            )}{" "}
                            um{" "}
                            {new Date(
                              item.created_at
                            ).toLocaleTimeString(
                              "de-DE",
                              {
                                hour:
                                  "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </small>

                        </div>

                        <strong
                          className={
                            item.points >= 0
                              ? "positivePoints"
                              : "negativePoints"
                          }
                        >
                          {item.points >= 0
                            ? "+"
                            : ""}
                          {item.points}
                        </strong>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* MESSAGE */}
        {/* ================================================= */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <footer>

          🍻 Güstener Zapfhahn Zentrale

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
          background: #05080c;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 20px;
          background:
            radial-gradient(
              circle at top,
              #26384b 0%,
              #0a0f15 48%,
              #05080c 100%
            );
          color: white;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          overflow-x: hidden;
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
            10px 5px 25px;
        }

        .logo {
          font-size: 42px;
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #ef4444
            );
          border-radius: 20px;
          padding: 12px;
          box-shadow:
            0 10px 30px
            rgba(245,158,11,.25);
        }

        h1 {
          margin: 0;
          font-size: 28px;
        }

        h2 {
          margin-top: 0;
        }

        h3 {
          margin-top: 25px;
        }

        p {
          color: #9ca8b5;
        }

        .card {
          background:
            rgba(255,255,255,.055);
          border:
            1px solid
            rgba(255,255,255,.09);
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 16px;
          backdrop-filter:
            blur(12px);
          box-shadow:
            0 10px 30px
            rgba(0,0,0,.18);
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4,1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .stat {
          text-align: center;
          background:
            rgba(255,255,255,.055);
          border-radius: 18px;
          padding: 15px;
          font-size: 23px;
        }

        .stats b,
        .stats small {
          display: block;
        }

        .stats b {
          font-size: 21px;
          margin: 5px 0;
        }

        .stats small {
          color: #8995a3;
          font-size: 11px;
        }

        input,
        select {
          width: 100%;
          padding: 14px;
          border-radius: 13px;
          border:
            1px solid
            #303b47;
          background:
            #121a23;
          color: white;
          margin-bottom: 10px;
          outline: none;
        }

        input:focus,
        select:focus {
          border-color:
            #f59e0b;
          box-shadow:
            0 0 0 2px
            rgba(245,158,11,.15);
        }

        button {
          border: none;
          border-radius: 13px;
          padding: 14px 18px;
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #fbbf24
            );
          color: #111;
          font-weight: bold;
          cursor: pointer;
          transition:
            transform .15s,
            box-shadow .15s;
        }

        button:hover {
          transform:
            translateY(-2px);
          box-shadow:
            0 8px 20px
            rgba(245,158,11,.25);
        }

        button:disabled {
          opacity: .6;
          cursor: wait;
          transform: none;
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

        .save {
          width: 100%;
        }

        .person,
        .drinkAssignment,
        .challenge,
        .paymentItem {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 12px;
          background:
            rgba(255,255,255,.05);
          padding: 13px;
          border-radius: 14px;
          margin-top: 9px;
        }

        .person small,
        .drinkAssignment small,
        .challenge small,
        .paymentItem small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
        }

        .miniBadge {
          font-size: 11px;
          color: #fbbf24;
          background:
            rgba(245,158,11,.1);
          border-radius: 20px;
          padding:
            7px 10px;
          white-space: nowrap;
        }

        .drinkAssignment select {
          max-width: 250px;
          margin: 0;
        }

        .paymentForm {
          display: grid;
          grid-template-columns:
            1fr 1fr auto;
          gap: 8px;
        }

        .paymentForm input,
        .paymentForm select {
          margin: 0;
        }

        .paymentTotal {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          background:
            rgba(245,158,11,.1);
          border:
            1px solid
            rgba(245,158,11,.2);
          border-radius: 14px;
          padding: 15px;
          margin-top: 12px;
        }

        .paymentTotal b {
          color: #fbbf24;
          font-size: 22px;
        }

        .paymentPerson {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background:
            rgba(245,158,11,.15);
          font-size: 22px;
        }

        .paymentItem strong {
          color: #4ade80;
          font-size: 20px;
        }

        .challengeForm {
          margin-bottom: 15px;
        }

        .challengeForm button {
          width: 100%;
        }

        /* =============================================== */
        /* KISTE */
        /* =============================================== */

        .crateCard {
          background:
            linear-gradient(
              135deg,
              rgba(245,158,11,.12),
              rgba(239,68,68,.07)
            );
          border-color:
            rgba(245,158,11,.25);
        }

        .crateHeader {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 15px;
        }

        .crateBonus {
          font-size: 34px;
          font-weight: 900;
          color: #fbbf24;
          background:
            rgba(245,158,11,.12);
          padding:
            12px 16px;
          border-radius: 18px;
          white-space: nowrap;
        }

        .crateButton {
          width: 100%;
          font-size: 16px;
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #ef4444
            );
          color: white;
        }

        /* =============================================== */
        /* RANKING */
        /* =============================================== */

        .rankingHeader {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
        }

        .rankingTrophy {
          font-size: 42px;
        }

        .rankButton {
          width: 100%;
          display: grid;
          grid-template-columns:
            45px 1fr auto 30px;
          align-items: center;
          gap: 10px;
          margin-top: 9px;
          text-align: left;
          background:
            rgba(255,255,255,.05);
          color: white;
          border:
            1px solid
            rgba(255,255,255,.06);
        }

        .rankButton:hover {
          background:
            rgba(245,158,11,.10);
          border-color:
            rgba(245,158,11,.3);
        }

        .rankPlace {
          font-size: 23px;
          text-align: center;
        }

        .rankName b,
        .rankName small {
          display: block;
        }

        .rankName small {
          margin-top: 4px;
          color: #8995a3;
          font-size: 11px;
        }

        .rankPoints {
          text-align: right;
          color: #fbbf24;
          font-size: 20px;
          font-weight: 900;
        }

        .rankPoints small {
          display: block;
          font-size: 9px;
          color: #8995a3;
          font-weight: normal;
        }

        .rankArrow {
          color: #8995a3;
          font-size: 22px;
        }

        /* =============================================== */
        /* MODAL */
        /* =============================================== */

        .modalBackdrop {
          position: fixed;
          inset: 0;
          z-index: 9000;
          background:
            rgba(0,0,0,.72);
          backdrop-filter:
            blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .rankingModal {
          width: 100%;
          max-width: 620px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          background:
            linear-gradient(
              180deg,
              #182431,
              #0c1219
            );
          border:
            1px solid
            rgba(255,255,255,.12);
          border-radius: 28px;
          padding: 25px;
          box-shadow:
            0 30px 80px
            rgba(0,0,0,.6);
          animation:
            modalIn .25s
            ease-out;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform:
              translateY(30px)
              scale(.96);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        .closeModal {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 40px;
          height: 40px;
          padding: 0;
          border-radius: 50%;
          background:
            rgba(255,255,255,.08);
          color: white;
          font-size: 25px;
        }

        .profileHero {
          text-align: center;
          padding-top: 10px;
        }

        .bigAvatar {
          width: 85px;
          height: 85px;
          margin: 0 auto 10px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          font-size: 45px;
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #ef4444
            );
        }

        .profileHero h2 {
          margin:
            8px 0 5px;
          font-size: 28px;
        }

        .profileTitle {
          color: #fbbf24;
          font-weight: bold;
        }

        .bigPoints {
          margin-top: 15px;
          font-size: 48px;
          font-weight: 900;
          color: #fbbf24;
        }

        .bigPoints small {
          display: block;
          color: #8995a3;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .historySummary {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 10px;
          margin:
            20px 0;
        }

        .historySummary div {
          text-align: center;
          padding: 14px;
          border-radius: 15px;
          background:
            rgba(255,255,255,.05);
        }

        .historySummary b,
        .historySummary small {
          display: block;
        }

        .historySummary b {
          font-size: 23px;
        }

        .historySummary small {
          margin-top: 4px;
          color: #8995a3;
          font-size: 10px;
        }

        .historyItem {
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 15px;
          background:
            rgba(255,255,255,.05);
        }

        .historyIcon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            rgba(245,158,11,.1);
          font-size: 21px;
        }

        .historyText b,
        .historyText small {
          display: block;
        }

        .historyText small {
          color: #8995a3;
          margin-top: 4px;
          font-size: 10px;
        }

        .positivePoints {
          color: #4ade80;
          font-size: 19px;
        }

        .negativePoints {
          color: #f87171;
          font-size: 19px;
        }

        .emptyHistory {
          text-align: center;
          padding: 35px 15px;
          color: #8995a3;
        }

        .emptyHistory > div {
          font-size: 45px;
          margin-bottom: 10px;
        }

        .emptyHistory b,
        .emptyHistory small {
          display: block;
        }

        .emptyHistory b {
          color: white;
        }

        .emptyHistory small {
          margin-top: 7px;
        }

        .loading {
          text-align: center;
          padding: 30px;
          color: #fbbf24;
        }

        /* =============================================== */
        /* MESSAGE */
        /* =============================================== */

        .message {
          position: fixed;
          left: 50%;
          bottom: 25px;
          transform:
            translateX(-50%);
          z-index: 9999;
          background:
            #172230;
          border:
            1px solid
            #344454;
          border-radius: 14px;
          padding:
            14px 20px;
          color: #fbbf24;
          box-shadow:
            0 15px 40px
            rgba(0,0,0,.4);
          max-width: 90%;
          text-align: center;
        }

        /* =============================================== */
        /* PROST ANIMATION */
        /* =============================================== */

        .animationOverlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          pointer-events: none;
          background:
            rgba(0,0,0,.45);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toastBeer {
          position: absolute;
          font-size: 100px;
          animation:
            toastBeer 2.4s
            ease-in-out forwards;
        }

        .leftBeer {
          left: 18%;
        }

        .rightBeer {
          right: 18%;
        }

        @keyframes toastBeer {
          0% {
            transform:
              translateY(120px)
              rotate(-25deg)
              scale(.5);
          }

          35% {
            transform:
              translateY(0)
              rotate(10deg)
              scale(1);
          }

          55% {
            transform:
              translateX(80px)
              rotate(0)
              scale(1.1);
          }

          75% {
            transform:
              translateX(60px)
              rotate(-5deg)
              scale(1);
          }

          100% {
            transform:
              translateY(-30px)
              scale(1.15);
          }
        }

        .prostText {
          font-size: 70px;
          font-weight: 900;
          color: #fbbf24;
          text-shadow:
            0 5px 30px
            rgba(245,158,11,.9);
          animation:
            prostText 2.4s
            ease-out forwards;
        }

        @keyframes prostText {
          0% {
            opacity: 0;
            transform:
              scale(.4);
          }

          45% {
            opacity: 0;
          }

          60% {
            opacity: 1;
            transform:
              scale(1.2);
          }

          100% {
            opacity: 0;
            transform:
              scale(1.45);
          }
        }

        /* =============================================== */
        /* MONEY */
        /* =============================================== */

        .moneyRain {
          position: fixed;
          inset: 0;
          z-index: 10000;
          pointer-events: none;
          overflow: hidden;
          background:
            rgba(0,0,0,.2);
        }

        .moneyRain span {
          position: absolute;
          top: -60px;
          font-size: 35px;
          animation:
            moneyFall 3s
            linear forwards;
        }

        @keyframes moneyFall {
          from {
            transform:
              translateY(-60px)
              rotate(0deg);
          }

          to {
            transform:
              translateY(110vh)
              rotate(720deg);
          }
        }

        .moneyText {
          position: absolute;
          left: 50%;
          top: 45%;
          transform:
            translate(-50%,-50%);
          font-size: 44px;
          font-weight: 900;
          color: #4ade80;
          text-shadow:
            0 5px 25px
            rgba(74,222,128,.8);
          animation:
            moneyMessage 3s
            ease-out forwards;
          white-space: nowrap;
        }

        @keyframes moneyMessage {
          0% {
            opacity: 0;
            transform:
              translate(-50%,-50%)
              scale(.4);
          }

          25% {
            opacity: 1;
            transform:
              translate(-50%,-50%)
              scale(1.15);
          }

          70% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform:
              translate(-50%,-50%)
              scale(1.3);
          }
        }

        /* =============================================== */
        /* KISTE ANIMATION */
        /* =============================================== */

        .crateAnimation {
          position: fixed;
          inset: 0;
          z-index: 10001;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background:
            rgba(0,0,0,.55);
          text-align: center;
        }

        .crateBeer {
          font-size: 95px;
          animation:
            cratePop .8s
            ease-out;
        }

        .crateText {
          margin-top: 15px;
          font-size: 42px;
          font-weight: 900;
          color: #fbbf24;
          animation:
            crateTextIn .6s
            ease-out;
        }

        .cratePoints {
          margin-top: 10px;
          font-size: 50px;
          font-weight: 900;
          color: #4ade80;
          animation:
            pointsPop .8s
            ease-out;
        }

        .confetti {
          position: absolute;
          top: 20%;
          font-size: 35px;
          word-spacing: 30px;
          animation:
            confettiMove 2.5s
            ease-out forwards;
        }

        @keyframes cratePop {
          0% {
            transform:
              scale(.2)
              rotate(-15deg);
            opacity: 0;
          }

          60% {
            transform:
              scale(1.25)
              rotate(5deg);
            opacity: 1;
          }

          100% {
            transform:
              scale(1)
              rotate(0);
          }
        }

        @keyframes crateTextIn {
          from {
            opacity: 0;
            transform:
              translateY(25px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes pointsPop {
          0% {
            opacity: 0;
            transform:
              scale(.3);
          }

          50% {
            opacity: 1;
            transform:
              scale(1.25);
          }

          100% {
            transform:
              scale(1);
          }
        }

        @keyframes confettiMove {
          from {
            transform:
              translateY(-50px)
              scale(.7);
            opacity: 0;
          }

          20% {
            opacity: 1;
          }

          to {
            transform:
              translateY(300px)
              scale(1.3);
            opacity: 0;
          }
        }

        footer {
          text-align: center;
          color: #687686;
          padding: 30px;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        /* =============================================== */
        /* MOBILE */
        /* =============================================== */

        @media(max-width:700px) {

          .page {
            padding: 10px;
          }

          header {
            align-items:
              flex-start;
          }

          h1 {
            font-size: 21px;
          }

          .stats {
            grid-template-columns:
              repeat(2,1fr);
          }

          .three {
            grid-template-columns:
              1fr;
          }

          .row {
            grid-template-columns:
              1fr;
          }

          .paymentForm {
            grid-template-columns:
              1fr;
          }

          .paymentForm input,
          .paymentForm select {
            margin-bottom: 0;
          }

          .drinkAssignment {
            display: block;
          }

          .drinkAssignment select {
            max-width: none;
            margin-top: 8px;
          }

          .crateHeader {
            align-items:
              flex-start;
          }

          .crateBonus {
            font-size: 25px;
          }

          .rankButton {
            grid-template-columns:
              38px 1fr auto 20px;
            padding:
              12px 10px;
          }

          .rankPoints {
            font-size: 17px;
          }

          .modalBackdrop {
            padding: 8px;
          }

          .rankingModal {
            max-height: 94vh;
            padding: 18px;
            border-radius: 22px;
          }

          .bigPoints {
            font-size: 40px;
          }

          .historyItem {
            grid-template-columns:
              38px 1fr auto;
          }

          .historyIcon {
            width: 34px;
            height: 34px;
            font-size: 18px;
          }

          .toastBeer {
            font-size: 70px;
          }

          .leftBeer {
            left: 5%;
          }

          .rightBeer {
            right: 5%;
          }

          .prostText {
            font-size: 42px;
          }

          .moneyText {
            font-size: 27px;
          }

          .crateBeer {
            font-size: 70px;
          }

          .crateText {
            font-size: 28px;
          }

          .cratePoints {
            font-size: 40px;
          }

        }

      `}</style>

    </main>
  );
}


/*
 * Kleiner Helfer für die Event-Anzeige.
 */
function currentEvent(
  eventId: string,
  events: Event[]
) {
  const event = events.find(
    (item) => item.id === eventId
  );

  if (!event) {
    return null;
  }

  return (
    <div className="eventInfo">
      <b>
        {event.title}
      </b>

      {event.location && (
        <span>
          📍 {event.location}
        </span>
      )}
    </div>
  );
}
