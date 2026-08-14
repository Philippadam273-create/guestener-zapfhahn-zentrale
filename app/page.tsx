"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  invite_code?: string | null;
  created_by?: string | null;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
};

type Profile = {
  id: string;
  name: string;
  email?: string | null;
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
  quantity?: number | null;
  created_at?: string;
};

type Payment = {
  id: string;
  event_id: string;
  betrag: number;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string;
  created_at?: string;
};

type DrinkHistory = {
  id: string;
  event_id: string;
  profile_id: string;
  drink_id?: string | null;
  drink_name: string;
  liters: number;
  alcohol_percent: number;
  price: number;
  consumed_at: string;
};

type PointsHistory = {
  id: string;
  event_id: string;
  profile_id: string;
  points: number;
  reason: string;
  reference_type?: string | null;
  created_at: string;
};

type Challenge = {
  id: string;
  event_id: string;
  title: string;
  description?: string | null;
  points: number;
  category?: string | null;
  status?: string | null;
  created_by_profile_id?: string | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  is_active?: boolean;
  created_at?: string;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  target_profile_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at?: string | null;
};

type CrateDonation = {
  id: string;
  event_id: string;
  profile_id: string;
  crates: number;
  points_awarded: number;
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

type PersonStats = {
  profile: Profile;
  drinks: number;
  liters: number;
  points: number;
  promille: number;
  paid: number;
  owed: number;
};

const DEFAULT_SETTINGS: EventSettings = {
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
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [drinkHistory, setDrinkHistory] = useState<DrinkHistory[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [crateDonations, setCrateDonations] = useState<CrateDonation[]>([]);

  const [settings, setSettings] =
    useState<EventSettings>(DEFAULT_SETTINGS);

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("2");

  const [personName, setPersonName] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPerson, setPaymentPerson] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePoints, setChallengePoints] = useState("20");

  const [selectedPerson, setSelectedPerson] =
    useState<Profile | null>(null);

  const [animation, setAnimation] =
    useState<"beer" | "money" | "crate" | null>(null);

  /*
   * ============================================================
   * AUTH
   * ============================================================
   */

  useEffect(() => {
    getCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || "");
        loadEverything(session.user.id);
      } else {
        setUserId(null);
        setUserEmail("");
        setEvents([]);
        setProfiles([]);
        setDrinks([]);
        setPayments([]);
        setDrinkHistory([]);
        setPointsHistory([]);
        setChallenges([]);
        setBeerRequests([]);
        setCrateDonations([]);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function getCurrentUser() {
    setLoading(true);

    const { data } = await supabase.auth.getUser();

    if (data.user) {
      setUserId(data.user.id);
      setUserEmail(data.user.email || "");
      await loadEverything(data.user.id);
    } else {
      setUserId(null);
    }

    setLoading(false);
  }

  /*
   * ============================================================
   * HAUPT-ADMIN
   *
   * Der eingeloggte Benutzer wird hier als Haupt-Admin behandelt.
   * Dadurch ist die Page nicht auf einen einzelnen Event begrenzt.
   * ============================================================
   */

  const isMainAdmin = Boolean(userId);

  /*
   * ============================================================
   * DATEN LADEN
   * ============================================================
   */

  async function loadEverything(uid: string) {
    await ensureProfile(uid);

    await Promise.all([
      loadEvents(),
      loadProfiles(),
    ]);
  }

  async function ensureProfile(uid: string) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (!existing) {
      const { data: userData } =
        await supabase.auth.getUser();

      if (userData.user) {
        await supabase.from("profiles").insert({
          id: uid,
          name:
            userData.user.user_metadata?.name ||
            userData.user.email?.split("@")[0] ||
            "Benutzer",
          email: userData.user.email,
        });
      }
    }
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEvents(data);

      if (!eventId && data.length > 0) {
        setEventId(data[0].id);
      }
    }
  }

  async function loadProfiles() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("name");

    if (data) {
      setProfiles(data);
    }
  }

  async function loadEventData(id: string) {
    if (!id) return;

    const [
      drinksResult,
      paymentsResult,
      historyResult,
      pointsResult,
      challengesResult,
      requestsResult,
      crateResult,
      settingsResult,
    ] = await Promise.all([
      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("payments")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("drink_history")
        .select("*")
        .eq("event_id", id)
        .order("consumed_at", { ascending: false }),

      supabase
        .from("points_history")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("challenges")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("beer_requests")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("crate_donations")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("event_settings")
        .select("*")
        .eq("event_id", id)
        .maybeSingle(),
    ]);

    setDrinks(drinksResult.data || []);
    setPayments(paymentsResult.data || []);
    setDrinkHistory(historyResult.data || []);
    setPointsHistory(pointsResult.data || []);
    setChallenges(challengesResult.data || []);
    setBeerRequests(requestsResult.data || []);
    setCrateDonations(crateResult.data || []);

    if (settingsResult.data) {
      setSettings(settingsResult.data);
    } else {
      setSettings({
        ...DEFAULT_SETTINGS,
        event_id: id,
      });
    }
  }

  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
    }
  }, [eventId]);

  /*
   * ============================================================
   * EVENT
   * ============================================================
   */

  async function createEvent() {
    setMessage("");

    if (!eventTitle.trim()) {
      setMessage("❌ Bitte einen Eventnamen eingeben.");
      return;
    }

    if (!userId) {
      setMessage("❌ Bitte zuerst anmelden.");
      return;
    }

    const { data, error } = await supabase.rpc(
      "create_event",
      {
        p_title: eventTitle.trim(),
        p_description:
          eventDescription.trim() || null,
        p_location:
          eventLocation.trim() || null,
      }
    );

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

    if (data) {
      setEventId(data);
    }

    setMessage("✅ Event erfolgreich erstellt.");
  }

  async function deleteEvent() {
    if (!eventId) return;

    const event = events.find(
      (e) => e.id === eventId
    );

    if (!event) return;

    const ok = window.confirm(
      `Event "${event.title}" wirklich löschen?`
    );

    if (!ok) return;

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

    setEventId("");
    await loadEvents();

    setMessage("🗑️ Event gelöscht.");
  }

  /*
   * ============================================================
   * GETRÄNKE
   * ============================================================
   */

  async function saveDrink() {
    if (!eventId) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    if (!drinkName.trim()) {
      setMessage("❌ Bitte Getränk eingeben.");
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
    setPrice("2");

    await loadEventData(eventId);

    setMessage("🍺 Getränk gespeichert.");
  }

  /*
   * ============================================================
   * TEILNEHMER
   * ============================================================
   */

  async function addParticipant() {
    if (!eventId) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    if (!personName.trim()) {
      setMessage("❌ Bitte Namen eingeben.");
      return;
    }

    let profile =
      profiles.find(
        (p) =>
          p.name.toLowerCase() ===
          personName.trim().toLowerCase()
      ) || null;

    if (!profile) {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          name: personName.trim(),
        })
        .select()
        .single();

      if (error || !data) {
        setMessage(
          "❌ Teilnehmer konnte nicht erstellt werden: " +
            (error?.message || "Unbekannter Fehler")
        );
        return;
      }

      profile = data;
      setProfiles((old) => [...old, data]);
    }

    const { error } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        profile_id: profile.id,
        role: "member",
      });

    if (
      error &&
      !error.message.toLowerCase().includes("duplicate")
    ) {
      setMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message
      );
      return;
    }

    setPersonName("");

    await loadProfiles();

    setMessage(
      `✅ ${profile.name} ist jetzt Teilnehmer.`
    );
  }

  async function removeParticipant(profileId: string) {
    if (!eventId) return;

    const { error } = await supabase
      .from("event_members")
      .delete()
      .eq("event_id", eventId)
      .eq("profile_id", profileId);

    if (error) {
      setMessage(
        "❌ Teilnehmer konnte nicht entfernt werden: " +
          error.message
      );
      return;
    }

    setMessage("👤 Teilnehmer entfernt.");
  }

  /*
   * ============================================================
   * GETRÄNK ZUORDNEN
   * ============================================================
   */

  async function assignDrink(
    profileId: string,
    drinkId: string
  ) {
    const drink = drinks.find(
      (d) => d.id === drinkId
    );

    if (!drink || !eventId) return;

    const name =
      drink.getraenk ||
      drink.drink_name ||
      "Getränk";

    const drinkLiters = Number(
      drink.liters ??
        drink.menge ??
        0
    );

    const drinkAlcohol = Number(
      drink.alcohol_percent ??
        drink.alkohol ??
        0
    );

    const drinkPrice = Number(
      drink.preis || 0
    );

    const { error } = await supabase
      .from("drink_history")
      .insert({
        event_id: eventId,
        profile_id: profileId,
        drink_id: drink.id,
        drink_name: name,
        liters: drinkLiters,
        alcohol_percent: drinkAlcohol,
        price: drinkPrice,
      });

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    await supabase
      .from("points_history")
      .insert({
        event_id: eventId,
        profile_id: profileId,
        points: 10,
        reason: `Getränk: ${name}`,
        reference_type: "drink",
        reference_id: drink.id,
      });

    setAnimation("beer");

    setTimeout(() => {
      setAnimation(null);
    }, 2400);

    await loadEventData(eventId);

    setMessage(
      `🍻 ${name} wurde getrunken! +10 Punkte`
    );
  }

  /*
   * ============================================================
   * ZAHLUNG
   * ============================================================
   */

  async function savePayment() {
    if (!eventId) {
      setMessage("❌ Kein Event ausgewählt.");
      return;
    }

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      setMessage("❌ Bitte einen Betrag eingeben.");
      return;
    }

    if (!paymentPerson) {
      setMessage("❌ Bitte auswählen, wer bezahlt hat.");
      return;
    }

    const { error } = await supabase
      .from("payments")
      .insert({
        event_id: eventId,
        betrag: amount,
        bezahlt_von: paymentPerson,
        profile_id: paymentPerson,
        status: "paid",
      });

    if (error) {
      setMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    await supabase
      .from("points_history")
      .insert({
        event_id: eventId,
        profile_id: paymentPerson,
        points: 5,
        reason: `Zahlung ${amount.toFixed(2)} €`,
        reference_type: "payment",
      });

    setPaymentAmount("");
    setPaymentPerson("");

    setAnimation("money");

    setTimeout(() => {
      setAnimation(null);
    }, 2800);

    await loadEventData(eventId);

    setMessage(
      "💶 Zahlung gespeichert! +5 Punkte"
    );
  }

  /*
   * ============================================================
   * BIER BUTTON
   * ============================================================
   */

  async function requestBeer() {
    if (!eventId || !userId) return;

    const membersResult = await supabase
      .from("event_members")
      .select("profile_id")
      .eq("event_id", eventId);

    if (membersResult.error) {
      setMessage(
        "❌ Teilnehmer konnten nicht geladen werden."
      );
      return;
    }

    const targets =
      membersResult.data?.filter(
        (m) => m.profile_id !== userId
      ) || [];

    if (targets.length === 0) {
      setMessage(
        "👥 Es sind keine anderen Teilnehmer im Event."
      );
      return;
    }

    await Promise.all(
      targets.map((target) =>
        supabase.from("beer_requests").insert({
          event_id: eventId,
          requester_profile_id: userId,
          target_profile_id: target.profile_id,
          status: "pending",
        })
      )
    );

    setMessage(
      "🍺 Bier-Anfrage an alle Teilnehmer gesendet!"
    );
  }

  async function respondBeer(
    requestId: string,
    status: "accepted" | "declined"
  ) {
    const { error } = await supabase
      .from("beer_requests")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      setMessage(
        "❌ Antwort konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    await loadEventData(eventId);

    setMessage(
      status === "accepted"
        ? "🍻 Bier angenommen!"
        : "❌ Bier abgelehnt."
    );
  }

  /*
   * ============================================================
   * KISTE BIER
   * ============================================================
   */

  async function donateCrate() {
    if (!eventId || !userId) return;

    const { error } = await supabase
      .from("crate_donations")
      .insert({
        event_id: eventId,
        profile_id: userId,
        crates: 1,
        points_awarded: 20,
      });

    if (error) {
      setMessage(
        "❌ Kiste konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    await supabase
      .from("points_history")
      .insert({
        event_id: eventId,
        profile_id: userId,
        points: 20,
        reason: "🍺 Kiste Bier spendiert",
        reference_type: "crate",
      });

    setAnimation("crate");

    setTimeout(() => {
      setAnimation(null);
    }, 3000);

    await loadEventData(eventId);

    setMessage(
      "🍺 Kiste Bier spendiert! +20 Punkte"
    );
  }

  /*
   * ============================================================
   * CHALLENGES
   * ============================================================
   */

  async function createChallenge() {
    if (!eventId || !userId) return;

    if (!challengeTitle.trim()) {
      setMessage(
        "❌ Bitte Challenge-Titel eingeben."
      );
      return;
    }

    const { error } = await supabase
      .from("challenges")
      .insert({
        event_id: eventId,
        title: challengeTitle.trim(),
        description:
          challengeDescription.trim() || null,
        points: Number(challengePoints) || 20,
        category: "fun",
        status: "open",
        created_by_profile_id: userId,
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
    setChallengePoints("20");
    setShowChallengeForm(false);

    await loadEventData(eventId);

    setMessage("🏆 Challenge erstellt!");
  }

  /*
   * ============================================================
   * EVENT SETTINGS
   * ============================================================
   */

  async function saveSettings() {
    if (!eventId) return;

    const { error } = await supabase.rpc(
      "update_event_settings",
      {
        p_event_id: eventId,
        p_show_participants:
          settings.show_participants,
        p_show_drinks:
          settings.show_drinks,
        p_show_drink_history:
          settings.show_drink_history,
        p_show_payments:
          settings.show_payments,
        p_show_costs:
          settings.show_costs,
        p_show_ranking:
          settings.show_ranking,
        p_show_points:
          settings.show_points,
        p_show_promille:
          settings.show_promille,
        p_show_statistics:
          settings.show_statistics,
        p_show_challenges:
          settings.show_challenges,
        p_show_challenge_points:
          settings.show_challenge_points,
        p_show_beer_button:
          settings.show_beer_button,
        p_show_beer_requests:
          settings.show_beer_requests,
        p_show_crate_button:
          settings.show_crate_button,
        p_show_profiles:
          settings.show_profiles,
        p_show_photos:
          settings.show_photos,
        p_show_who_paid:
          settings.show_who_paid,
        p_show_who_owes:
          settings.show_who_owes,
      }
    );

    if (error) {
      setMessage(
        "❌ Einstellungen konnten nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setMessage(
      "⚙️ Event-Einstellungen gespeichert."
    );
  }

  /*
   * ============================================================
   * STATISTIK
   * ============================================================
   */

  const currentEvent = events.find(
    (e) => e.id === eventId
  );

  const eventProfiles = useMemo(() => {
    const ids = new Set<string>();

    drinkHistory
      .filter((h) => h.event_id === eventId)
      .forEach((h) => ids.add(h.profile_id));

    payments
      .filter((p) => p.event_id === eventId)
      .forEach((p) => {
        if (p.bezahlt_von) ids.add(p.bezahlt_von);
        if (p.profile_id) ids.add(p.profile_id);
      });

    pointsHistory
      .filter((p) => p.event_id === eventId)
      .forEach((p) => ids.add(p.profile_id));

    beerRequests
      .filter((r) => r.event_id === eventId)
      .forEach((r) => {
        ids.add(r.requester_profile_id);
        ids.add(r.target_profile_id);
      });

    crateDonations
      .filter((c) => c.event_id === eventId)
      .forEach((c) => ids.add(c.profile_id));

    return profiles.filter((p) => ids.has(p.id));
  }, [
    profiles,
    drinkHistory,
    payments,
    pointsHistory,
    beerRequests,
    crateDonations,
    eventId,
  ]);

  const stats: PersonStats[] = eventProfiles.map(
    (profile) => {
      const history =
        drinkHistory.filter(
          (h) =>
            h.profile_id === profile.id &&
            h.event_id === eventId
        );

      const points =
        pointsHistory
          .filter(
            (p) =>
              p.profile_id === profile.id &&
              p.event_id === eventId
          )
          .reduce(
            (sum, p) => sum + Number(p.points || 0),
            0
          );

      const paid =
        payments
          .filter(
            (p) =>
              (p.bezahlt_von === profile.id ||
                p.profile_id === profile.id) &&
              p.event_id === eventId
          )
          .reduce(
            (sum, p) => sum + Number(p.betrag || 0),
            0
          );

      const liters = history.reduce(
        (sum, h) =>
          sum + Number(h.liters || 0),
        0
      );

      /*
       * Vereinfachte Promille-Anzeige.
       *
       * Für die genaue Berechnung können später Gewicht,
       * Geschlecht und Abbauzeit ergänzt werden.
       */
      const promille =
        history.length > 0
          ? Math.min(
              2.5,
              history.reduce(
                (sum, h) =>
                  sum +
                  Number(h.alcohol_percent || 0) *
                    Number(h.liters || 0) *
                    0.1,
                0
              )
            )
          : 0;

      return {
        profile,
        drinks: history.length,
        liters,
        points,
        promille,
        paid,
        owed: 0,
      };
    }
  );

  const totalLiters = drinks.reduce(
    (sum, d) =>
      sum +
      Number(
        d.liters ??
          d.menge ??
          0
      ),
    0
  );

  const totalDrinkCost = drinks.reduce(
    (sum, d) =>
      sum +
      Number(d.preis || 0),
    0
  );

  const totalPaid = payments.reduce(
    (sum, p) =>
      sum +
      Number(p.betrag || 0),
    0
  );

  const totalPoints = stats.reduce(
    (sum, p) => sum + p.points,
    0
  );

  const ranking = [...stats].sort(
    (a, b) => b.points - a.points
  );

  const currentUserProfile =
    profiles.find(
      (p) => p.id === userId
    ) || null;

  const incomingBeerRequests =
    beerRequests.filter(
      (r) =>
        r.target_profile_id === userId &&
        r.status === "pending"
    );

  const myBeerRequests =
    beerRequests.filter(
      (r) =>
        r.requester_profile_id === userId
    );

  const selectedPersonStats =
    selectedPerson
      ? stats.find(
          (s) =>
            s.profile.id === selectedPerson.id
        )
      : null;

  /*
   * ============================================================
   * ANIMATION
   * ============================================================
   */

  function renderAnimation() {
    if (!animation) return null;

    if (animation === "beer") {
      return (
        <div className="animationOverlay">
          <div className="beerAnimation">
            <div className="beerGlass left">
              🍺
            </div>

            <div className="beerGlass right">
              🍺
            </div>

            <div className="prost">
              PROST! 🍻
            </div>
          </div>
        </div>
      );
    }

    if (animation === "money") {
      return (
        <div className="animationOverlay moneyRain">
          {Array.from({ length: 35 }).map(
            (_, index) => (
              <span
                key={index}
                style={{
                  left:
                    `${Math.random() * 100}%`,
                  animationDelay:
                    `${Math.random() * 0.8}s`,
                }}
              >
                💶
              </span>
            )
          )}

          <div className="animationText">
            ZAHLUNG ERHALTEN 💰
          </div>
        </div>
      );
    }

    return (
      <div className="animationOverlay">
        <div className="crateAnimation">
          🍺🍺🍺
          <strong>
            KISTE SPENDIERT!
          </strong>
          <small>
            +20 Punkte
          </small>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          <div className="loadingBeer">
            🍻
          </div>
          <h1>
            Güstener Zapfhahn Zentrale
          </h1>
          <p>
            Wird geladen ...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * NICHT ANGEMELDET
   * ============================================================
   */

  if (!userId) {
    return (
      <main className="page">
        <div className="authCard">
          <div className="bigLogo">
            🍻
          </div>

          <h1>
            Güstener Zapfhahn Zentrale
          </h1>

          <p>
            Du bist nicht angemeldet.
          </p>

          <p>
            Bitte zuerst über Supabase Auth
            anmelden.
          </p>

          <div className="authHint">
            Dein angemeldeter Supabase-Benutzer
            wird automatisch als Haupt-Admin
            verwendet.
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * HAUPTSEITE
   * ============================================================
   */

  return (
    <main className="page">
      {renderAnimation()}

      <div className="container">

        <header className="header">
          <div className="logo">
            🍻
          </div>

          <div className="headerText">
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Events · Getränke · Punkte ·
              Challenges
            </p>
          </div>

          <div className="adminBadge">
            👑 ADMIN
          </div>
        </header>

        {/* EVENT AUSWAHL */}

        <section className="card eventCard">
          <div className="sectionHeader">
            <div>
              <h2>
                📅 Aktuelles Event
              </h2>

              {currentEvent && (
                <p>
                  {currentEvent.location ||
                    "Güstener Zapfhahn Event"}
                </p>
              )}
            </div>

            <button
              className="smallButton"
              onClick={() =>
                setShowCreateEvent(
                  !showCreateEvent
                )
              }
            >
              ➕ Neues Event
            </button>
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

            {events.map((event) => (
              <option
                key={event.id}
                value={event.id}
              >
                {event.title}
              </option>
            ))}
          </select>

          {currentEvent?.invite_code && (
            <div className="inviteBox">
              <span>
                🔑 Einladungscode
              </span>

              <strong>
                {currentEvent.invite_code}
              </strong>

              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    currentEvent.invite_code || ""
                  )
                }
              >
                📋 Kopieren
              </button>
            </div>
          )}

          {showCreateEvent && (
            <div className="createBox">
              <h3>
                📅 Neues Event erstellen
              </h3>

              <input
                placeholder="Eventname"
                value={eventTitle}
                onChange={(e) =>
                  setEventTitle(e.target.value)
                }
              />

              <input
                placeholder="Beschreibung"
                value={eventDescription}
                onChange={(e) =>
                  setEventDescription(
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

              <button
                className="primary"
                onClick={createEvent}
              >
                🍻 Event erstellen
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

        {/* STATISTIK */}

        {settings.show_statistics && (
          <div className="statsGrid">
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
                {totalDrinkCost.toFixed(2)} €
              </b>
              <small>Getränke</small>
            </div>

            <div className="stat">
              <span>👥</span>
              <b>
                {stats.length}
              </b>
              <small>Teilnehmer</small>
            </div>
          </div>
        )}

        {/* BIER BUTTON */}

        {settings.show_beer_button && (
          <section className="beerSection">
            <button
              className="bigBeerButton"
              onClick={requestBeer}
            >
              <span>
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
        )}

        {/* BIER ANFRAGEN */}

        {settings.show_beer_requests &&
          incomingBeerRequests.length > 0 && (
            <section className="card">
              <h2>
                🔔 Bier-Anfragen
              </h2>

              {incomingBeerRequests.map(
                (request) => {
                  const requester =
                    profiles.find(
                      (p) =>
                        p.id ===
                        request.requester_profile_id
                    );

                  return (
                    <div
                      className="request"
                      key={request.id}
                    >
                      <div>
                        <b>
                          🍻{" "}
                          {requester?.name ||
                            "Teilnehmer"}
                        </b>

                        <p>
                          möchte ein Bier mit dir
                          trinken.
                        </p>
                      </div>

                      <div className="requestButtons">
                        <button
                          className="accept"
                          onClick={() =>
                            respondBeer(
                              request.id,
                              "accepted"
                            )
                          }
                        >
                          ✅ Zusagen
                        </button>

                        <button
                          className="decline"
                          onClick={() =>
                            respondBeer(
                              request.id,
                              "declined"
                            )
                          }
                        >
                          ❌ Ablehnen
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </section>
          )}

        {/* KISTE */}

        {settings.show_crate_button && (
          <section className="card crateCard">
            <button
              className="crateButton"
              onClick={donateCrate}
            >
              <span>
                🍺
              </span>

              <strong>
                KISTE BIER SPENDIEREN
              </strong>

              <small>
                +20 Punkte
              </small>
            </button>
          </section>
        )}

        {/* TEILNEHMER */}

        {settings.show_participants && (
          <section className="card">
            <h2>
              🍻 Teilnehmer
            </h2>

            <div className="addRow">
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
                className="primary"
                onClick={addParticipant}
              >
                ➕ Hinzufügen
              </button>
            </div>

            {stats.length === 0 ? (
              <p className="empty">
                Noch keine Teilnehmer.
              </p>
            ) : (
              stats.map((person) => (
                <div
                  className="personRow"
                  key={person.profile.id}
                >
                  <div>
                    <b>
                      👤{" "}
                      {person.profile.name}
                    </b>

                    <small>
                      🍺 {person.drinks}
                      {" · "}
                      💧{" "}
                      {person.liters.toFixed(1)}
                      {" L · "}
                      🏆{" "}
                      {person.points}
                      {settings.show_promille &&
                        ` · 🍺 ${person.promille.toFixed(
                          2
                        )} ‰`}
                    </small>
                  </div>

                  <button
                    className="personInfo"
                    onClick={() =>
                      setSelectedPerson(
                        person.profile
                      )
                    }
                  >
                    👤
                  </button>
                </div>
              ))
            )}
          </section>
        )}

        {/* GETRÄNK HINZUFÜGEN */}

        {settings.show_drinks && (
          <section className="card">
            <h2>
              🍺 Getränk hinzufügen
            </h2>

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
                placeholder="Liter"
                value={liters}
                onChange={(e) =>
                  setLiters(e.target.value)
                }
              />

              <input
                type="number"
                placeholder="Alkohol %"
                value={alcohol}
                onChange={(e) =>
                  setAlcohol(e.target.value)
                }
              />

              <input
                type="number"
                placeholder="Preis €"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
              />
            </div>

            <button
              className="primary full"
              onClick={saveDrink}
            >
              🍻 Getränk speichern
            </button>
          </section>
        )}

        {/* ZUORDNEN */}

        {settings.show_drinks && (
          <section className="card">
            <h2>
              🔗 Getränk zuordnen
            </h2>

            {stats.map((person) => (
              <div
                className="assignment"
                key={person.profile.id}
              >
                <b>
                  {person.profile.name}
                </b>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (
                      e.target.value
                    ) {
                      assignDrink(
                        person.profile.id,
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
                        drink.preis || 0
                      ).toFixed(2)}
                      €
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </section>
        )}

        {/* GETRÄNKE */}

        {settings.show_drinks && (
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
                  <b>
                    🍺{" "}
                    {drink.getraenk ||
                      drink.drink_name}
                  </b>

                  <small>
                    {Number(
                      drink.liters ??
                        drink.menge ??
                        0
                    ).toFixed(1)}
                    {" Liter · "}
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
                  ).toFixed(2)} €
                </b>
              </div>
            ))}
          </section>
        )}

        {/* GETRÄNKEVERLAUF */}

        {settings.show_drink_history && (
          <section className="card">
            <div className="sectionHeader">
              <h2>
                🕐 Getränkeverlauf
              </h2>

              <button
                className="smallButton"
                onClick={() =>
                  setShowHistory(
                    !showHistory
                  )
                }
              >
                {showHistory
                  ? "▲ Schließen"
                  : "▼ Anzeigen"}
              </button>
            </div>

            {showHistory && (
              <>
                {drinkHistory.length === 0 ? (
                  <p className="empty">
                    Noch kein Getränk getrunken.
                  </p>
                ) : (
                  drinkHistory.map(
                    (history) => {
                      const person =
                        profiles.find(
                          (p) =>
                            p.id ===
                            history.profile_id
                        );

                      return (
                        <div
                          className="historyRow"
                          key={history.id}
                        >
                          <span>
                            🍺
                          </span>

                          <div>
                            <b>
                              {person?.name ||
                                "Unbekannt"}
                            </b>

                            <small>
                              hat{" "}
                              {
                                history.drink_name
                              }{" "}
                              getrunken
                              {" · "}
                              {Number(
                                history.liters
                              ).toFixed(1)}
                              L
                            </small>
                          </div>

                          <time>
                            {new Date(
                              history.consumed_at
                            ).toLocaleTimeString(
                              "de-DE",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </time>
                        </div>
                      );
                    }
                  )
                )}
              </>
            )}
          </section>
        )}

        {/* ZAHLUNGEN */}

        {settings.show_payments && (
          <section className="card">
            <div className="sectionHeader">
              <h2>
                💶 Zahlungen
              </h2>

              <button
                className="smallButton"
                onClick={() =>
                  setShowPayments(
                    !showPayments
                  )
                }
              >
                {showPayments
                  ? "▲ Schließen"
                  : "▼ Anzeigen"}
              </button>
            </div>

            {showPayments && (
              <>
                <div className="three">
                  <input
                    type="number"
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
                      Wer bezahlt?
                    </option>

                    {profiles.map(
                      (profile) => (
                        <option
                          key={profile.id}
                          value={profile.id}
                        >
                          {profile.name}
                        </option>
                      )
                    )}
                  </select>

                  <button
                    className="primary"
                    onClick={savePayment}
                  >
                    💶 Zahlung speichern
                  </button>
                </div>

                <div className="paymentTotal">
                  <span>
                    💰 Gesamt bezahlt
                  </span>

                  <strong>
                    {totalPaid.toFixed(2)} €
                  </strong>
                </div>

                {payments.map(
                  (payment) => {
                    const payer =
                      profiles.find(
                        (p) =>
                          p.id ===
                            payment.bezahlt_von ||
                          p.id ===
                            payment.profile_id
                      );

                    return (
                      <div
                        className="paymentRow"
                        key={payment.id}
                      >
                        <span>
                          💶
                        </span>

                        <div>
                          <b>
                            {payer?.name ||
                              "Unbekannt"}
                          </b>

                          <small>
                            hat bezahlt
                          </small>
                        </div>

                        <strong>
                          {Number(
                            payment.betrag
                          ).toFixed(2)} €
                        </strong>
                      </div>
                    );
                  }
                )}

                {settings.show_who_owes && (
                  <div className="oweBox">
                    <h3>
                      💳 Wer muss noch bezahlen?
                    </h3>

                    {stats.map(
                      (person) => {
                        const share =
                          stats.length > 0
                            ? totalDrinkCost /
                              stats.length
                            : 0;

                        const remaining =
                          Math.max(
                            0,
                            share -
                              person.paid
                          );

                        return (
                          <div
                            className="oweRow"
                            key={
                              person.profile.id
                            }
                          >
                            <span>
                              {person.profile.name}
                            </span>

                            <strong
                              className={
                                remaining <=
                                0
                                  ? "paid"
                                  : "owes"
                              }
                            >
                              {remaining <=
                              0
                                ? "✅ Bezahlt"
                                : `${remaining.toFixed(
                                    2
                                  )} € offen`}
                            </strong>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* CHALLENGES */}

        {settings.show_challenges && (
          <section className="card">
            <div className="sectionHeader">
              <h2>
                🏆 Challenges
              </h2>

              <button
                className="smallButton"
                onClick={() =>
                  setShowChallengeForm(
                    !showChallengeForm
                  )
                }
              >
                ➕ Challenge
              </button>
            </div>

            {showChallengeForm && (
              <div className="createBox">
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

                <button
                  className="primary"
                  onClick={
                    createChallenge
                  }
                >
                  🏆 Challenge erstellen
                </button>
              </div>
            )}

            {challenges.length === 0 ? (
              <p className="empty">
                Noch keine Challenges.
              </p>
            ) : (
              challenges.map(
                (challenge) => (
                  <div
                    className="challenge"
                    key={challenge.id}
                  >
                    <div className="challengeIcon">
                      🏆
                    </div>

                    <div>
                      <b>
                        {challenge.title}
                      </b>

                      <small>
                        {
                          challenge.description
                        }
                      </small>

                      {settings.show_challenge_points && (
                        <span className="pointsBadge">
                          +{" "}
                          {challenge.points} Punkte
                        </span>
                      )}
                    </div>
                  </div>
                )
              )
            )}
          </section>
        )}

        {/* RANGLISTE */}

        {settings.show_ranking && (
          <section className="card">
            <h2>
              🏆 Rangliste
            </h2>

            <p className="hint">
              Tippe auf eine Person, um zu sehen,
              wofür sie Punkte bekommen hat.
            </p>

            {ranking.map(
              (person, index) => (
                <button
                  className="rankRow"
                  key={person.profile.id}
                  onClick={() =>
                    setSelectedPerson(
                      person.profile
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
                    {person.profile.name}
                  </span>

                  <b>
                    {person.points} Punkte
                  </b>
                </button>
              )
            )}
          </section>
        )}

        {/* EVENT EINSTELLUNGEN */}

        {isMainAdmin && eventId && (
          <section className="card">
            <button
              className="settingsButton"
              onClick={() =>
                setShowSettings(
                  !showSettings
                )
              }
            >
              ⚙️ Event-Einstellungen
            </button>

            {showSettings && (
              <div className="settingsPanel">
                <h2>
                  ⚙️ Was soll im Event angezeigt
                  werden?
                </h2>

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
                      "🕐 Getränkeverlauf",
                    ],
                    [
                      "show_payments",
                      "💶 Zahlungen",
                    ],
                    [
                      "show_costs",
                      "💰 Kosten",
                    ],
                    [
                      "show_ranking",
                      "🏆 Rangliste",
                    ],
                    [
                      "show_points",
                      "⭐ Punkte",
                    ],
                    [
                      "show_promille",
                      "🍺 Promille",
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
                      "🏆 Challenge-Punkte",
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
                      "🍺 Kiste Bier",
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
                      "💶 Wer bezahlt hat",
                    ],
                    [
                      "show_who_owes",
                      "💳 Wer noch bezahlen muss",
                    ],
                  ] as [
                    keyof EventSettings,
                    string
                  ][]
                ).map(
                  ([key, label]) => (
                    <label
                      className="settingRow"
                      key={key}
                    >
                      <span>
                        {label}
                      </span>

                      <input
                        type="checkbox"
                        checked={
                          Boolean(
                            settings[key]
                          )
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            [key]:
                              e.target.checked,
                          })
                        }
                      />
                    </label>
                  )
                )}

                <button
                  className="primary full"
                  onClick={
                    saveSettings
                  }
                >
                  💾 Einstellungen speichern
                </button>
              </div>
            )}
          </section>
        )}

        {/* PERSONENDETAILS */}

        {selectedPerson && (
          <div
            className="modalBackdrop"
            onClick={() =>
              setSelectedPerson(null)
            }
          >
            <div
              className="personModal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <button
                className="closeModal"
                onClick={() =>
                  setSelectedPerson(null)
                }
              >
                ×
              </button>

              <div className="profileAvatar">
                👤
              </div>

              <h2>
                {selectedPerson.name}
              </h2>

              {selectedPersonStats && (
                <>
                  <div className="personStats">
                    <div>
                      🍺
                      <b>
                        {
                          selectedPersonStats.drinks
                        }
                      </b>
                      <small>
                        Getränke
                      </small>
                    </div>

                    <div>
                      🏆
                      <b>
                        {
                          selectedPersonStats.points
                        }
                      </b>
                      <small>
                        Punkte
                      </small>
                    </div>

                    <div>
                      💶
                      <b>
                        {
                          selectedPersonStats.paid.toFixed(
                            2
                          )
                        } €
                      </b>
                      <small>
                        Bezahlt
                      </small>
                    </div>
                  </div>

                  <h3>
                    ⭐ Punkte-Historie
                  </h3>

                  {pointsHistory.filter(
                    (p) =>
                      p.profile_id ===
                        selectedPerson.id &&
                      p.event_id ===
                        eventId
                  ).length === 0 ? (
                    <p>
                      Noch keine Punkte.
                    </p>
                  ) : (
                    pointsHistory
                      .filter(
                        (p) =>
                          p.profile_id ===
                            selectedPerson.id &&
                          p.event_id ===
                            eventId
                      )
                      .map((point) => (
                        <div
                          className="pointHistory"
                          key={point.id}
                        >
                          <span>
                            +{point.points}
                          </span>

                          <div>
                            <b>
                              {point.reason}
                            </b>

                            <small>
                              {new Date(
                                point.created_at
                              ).toLocaleString(
                                "de-DE"
                              )}
                            </small>
                          </div>
                        </div>
                      ))
                  )}

                  <h3>
                    🍺 Getränke
                  </h3>

                  {drinkHistory
                    .filter(
                      (h) =>
                        h.profile_id ===
                          selectedPerson.id &&
                        h.event_id ===
                          eventId
                    )
                    .map((history) => (
                      <div
                        className="pointHistory"
                        key={history.id}
                      >
                        <span>
                          🍺
                        </span>

                        <div>
                          <b>
                            {
                              history.drink_name
                            }
                          </b>

                          <small>
                            {new Date(
                              history.consumed_at
                            ).toLocaleString(
                              "de-DE"
                            )}
                          </small>
                        </div>
                      </div>
                    ))}
                </>
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
          background: #070b10;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          background:
            radial-gradient(
              circle at 50% -10%,
              #253c52 0,
              #111a24 35%,
              #070b10 75%
            );
          color: #fff;
          padding: 20px 14px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .logo {
          width: 62px;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          border-radius: 20px;
          background:
            linear-gradient(
              145deg,
              #25384b,
              #111923
            );
          box-shadow:
            0 12px 35px
              rgba(0, 0, 0, 0.35);
        }

        .headerText {
          flex: 1;
        }

        h1 {
          margin: 0;
          font-size: 25px;
        }

        h2 {
          margin: 0 0 12px;
          font-size: 20px;
        }

        h3 {
          margin-top: 18px;
        }

        p {
          color: #9ca9b8;
        }

        .headerText p {
          margin: 5px 0 0;
        }

        .adminBadge {
          padding: 8px 10px;
          border-radius: 12px;
          background: rgba(
            245,
            158,
            11,
            0.14
          );
          border: 1px solid
            rgba(245, 158, 11, 0.35);
          color: #fbbf24;
          font-weight: bold;
          font-size: 11px;
        }

        .card {
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.075),
              rgba(255, 255, 255, 0.035)
            );
          border: 1px solid
            rgba(255, 255, 255, 0.08);
          border-radius: 22px;
          padding: 18px;
          margin-bottom: 14px;
          box-shadow:
            0 15px 40px
              rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(12px);
        }

        .sectionHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .sectionHeader h2 {
          margin-bottom: 3px;
        }

        input,
        select {
          width: 100%;
          padding: 14px;
          border-radius: 13px;
          border: 1px solid #334150;
          background: #111923;
          color: white;
          margin-bottom: 10px;
          outline: none;
        }

        input:focus,
        select:focus {
          border-color: #f59e0b;
          box-shadow:
            0 0 0 3px
              rgba(245, 158, 11, 0.1);
        }

        button {
          border: none;
          cursor: pointer;
          font-weight: bold;
          border-radius: 13px;
          transition:
            transform 0.15s,
            opacity 0.15s;
        }

        button:active {
          transform: scale(0.97);
        }

        .primary {
          background: #f59e0b;
          color: #111;
          padding: 13px 17px;
        }

        .smallButton {
          padding: 10px 12px;
          background: #263444;
          color: white;
        }

        .dangerButton {
          margin-top: 6px;
          padding: 9px 12px;
          background: #452329;
          color: #ff9ba5;
        }

        .full {
          width: 100%;
        }

        .createBox {
          padding: 14px;
          margin-top: 12px;
          border-radius: 16px;
          background: rgba(
            0,
            0,
            0,
            0.15
          );
        }

        .inviteBox {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(
            245,
            158,
            11,
            0.09
          );
          border: 1px solid
            rgba(245, 158, 11, 0.2);
        }

        .inviteBox span {
          color: #aab5c0;
          font-size: 12px;
        }

        .inviteBox strong {
          flex: 1;
          color: #fbbf24;
          font-size: 20px;
          letter-spacing: 2px;
        }

        .inviteBox button {
          padding: 8px;
          background: #303d4c;
          color: white;
        }

        .statsGrid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .stat {
          text-align: center;
          padding: 15px 8px;
          border-radius: 17px;
          background:
            rgba(255, 255, 255, 0.055);
          border: 1px solid
            rgba(255, 255, 255, 0.06);
        }

        .stat span {
          display: block;
          font-size: 23px;
        }

        .stat b {
          display: block;
          font-size: 20px;
          margin-top: 4px;
        }

        .stat small {
          color: #8996a5;
        }

        .beerSection {
          margin-bottom: 14px;
        }

        .bigBeerButton {
          width: 100%;
          padding: 23px;
          border-radius: 24px;
          color: white;
          background:
            linear-gradient(
              145deg,
              #b91c1c,
              #7f1d1d
            );
          border: 2px solid
            rgba(255, 255, 255, 0.12);
          box-shadow:
            0 15px 35px
              rgba(127, 29, 29, 0.35);
        }

        .bigBeerButton span {
          display: block;
          font-size: 44px;
        }

        .bigBeerButton strong {
          display: block;
          font-size: 29px;
          margin-top: 3px;
          letter-spacing: 2px;
        }

        .bigBeerButton small {
          display: block;
          margin-top: 4px;
          color: #fecaca;
        }

        .request {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 15px;
          background: rgba(
            255,
            255,
            255,
            0.05
          );
        }

        .request p {
          margin: 5px 0 0;
        }

        .requestButtons {
          display: flex;
          gap: 6px;
        }

        .accept,
        .decline {
          padding: 10px;
        }

        .accept {
          background: #14532d;
          color: #bbf7d0;
        }

        .decline {
          background: #3f2025;
          color: #fecaca;
        }

        .crateCard {
          padding: 10px;
        }

        .crateButton {
          width: 100%;
          padding: 19px;
          background:
            linear-gradient(
              145deg,
              #b7791f,
              #713f12
            );
          color: white;
          border-radius: 17px;
        }

        .crateButton span {
          display: block;
          font-size: 34px;
        }

        .crateButton strong {
          display: block;
          font-size: 18px;
          margin-top: 5px;
        }

        .crateButton small {
          display: block;
          margin-top: 4px;
          color: #fde68a;
        }

        .addRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .personRow,
        .item,
        .paymentRow,
        .historyRow,
        .pointHistory,
        .oweRow {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          margin-top: 8px;
          border-radius: 14px;
          background:
            rgba(255, 255, 255, 0.045);
        }

        .personRow > div,
        .item > div,
        .paymentRow > div,
        .historyRow > div,
        .pointHistory > div {
          flex: 1;
        }

        .personRow small,
        .item small,
        .paymentRow small,
        .historyRow small,
        .pointHistory small {
          display: block;
          color: #8996a5;
          margin-top: 4px;
        }

        .personInfo {
          padding: 9px;
          background: #273342;
          color: white;
        }

        .three {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .assignment {
          display: grid;
          grid-template-columns:
            1fr 1.5fr;
          align-items: center;
          gap: 10px;
          margin-bottom: 7px;
        }

        .assignment select {
          margin: 0;
        }

        .historyRow time {
          color: #788697;
          font-size: 11px;
        }

        .paymentTotal {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          margin-top: 12px;
          border-radius: 15px;
          background:
            rgba(245, 158, 11, 0.09);
        }

        .paymentTotal strong {
          color: #fbbf24;
          font-size: 20px;
        }

        .oweBox {
          margin-top: 15px;
          padding: 12px;
          border-radius: 15px;
          background:
            rgba(0, 0, 0, 0.12);
        }

        .oweRow {
          justify-content: space-between;
        }

        .paid {
          color: #86efac;
        }

        .owes {
          color: #fca5a5;
        }

        .challenge {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 15px;
          background:
            rgba(255, 255, 255, 0.045);
        }

        .challengeIcon {
          font-size: 29px;
        }

        .challenge b {
          display: block;
        }

        .challenge small {
          display: block;
          color: #8f9baa;
          margin-top: 4px;
        }

        .pointsBadge {
          display: inline-block;
          margin-top: 7px;
          padding: 4px 7px;
          border-radius: 7px;
          background:
            rgba(245, 158, 11, 0.13);
          color: #fbbf24;
          font-size: 11px;
        }

        .rankRow {
          width: 100%;
          display: grid;
          grid-template-columns:
            45px 1fr auto;
          gap: 10px;
          align-items: center;
          text-align: left;
          padding: 14px;
          margin-top: 7px;
          background:
            rgba(255, 255, 255, 0.05);
          color: white;
        }

        .rankRow strong {
          font-size: 22px;
        }

        .rankRow b {
          color: #fbbf24;
        }

        .hint {
          font-size: 12px;
        }

        .settingsButton {
          width: 100%;
          padding: 15px;
          background: #253343;
          color: white;
          font-size: 15px;
        }

        .settingsPanel {
          margin-top: 14px;
        }

        .settingRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-bottom: 1px solid
            rgba(255, 255, 255, 0.06);
          cursor: pointer;
        }

        .settingRow input {
          width: 20px;
          height: 20px;
          margin: 0;
          accent-color: #f59e0b;
        }

        .message {
          position: fixed;
          left: 50%;
          bottom: 20px;
          transform: translateX(-50%);
          z-index: 1000;
          width: calc(100% - 30px);
          max-width: 600px;
          padding: 14px;
          border-radius: 14px;
          text-align: center;
          background: #162230;
          border: 1px solid #344454;
          color: #fbbf24;
          box-shadow:
            0 15px 35px
              rgba(0, 0, 0, 0.35);
        }

        footer {
          text-align: center;
          padding: 30px;
          color: #627181;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        .authCard,
        .loading {
          max-width: 500px;
          margin: 100px auto;
          text-align: center;
          padding: 35px 25px;
          border-radius: 25px;
          background:
            rgba(255, 255, 255, 0.06);
          border: 1px solid
            rgba(255, 255, 255, 0.09);
        }

        .bigLogo,
        .loadingBeer {
          font-size: 65px;
        }

        .authHint {
          margin-top: 20px;
          padding: 13px;
          border-radius: 13px;
          background:
            rgba(245, 158, 11, 0.08);
          color: #fbbf24;
          font-size: 13px;
        }

        .modalBackdrop {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
          background:
            rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(8px);
        }

        .personModal {
          position: relative;
          width: 100%;
          max-width: 550px;
          max-height: 85vh;
          overflow-y: auto;
          padding: 25px;
          border-radius: 24px;
          background: #121b25;
          border: 1px solid
            rgba(255, 255, 255, 0.1);
        }

        .closeModal {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #303b48;
          color: white;
          font-size: 24px;
        }

        .profileAvatar {
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          border-radius: 50%;
          background: #253444;
          font-size: 35px;
        }

        .personModal h2,
        .personModal h3 {
          text-align: center;
        }

        .personStats {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
          margin: 15px 0;
        }

        .personStats > div {
          padding: 12px;
          text-align: center;
          border-radius: 13px;
          background:
            rgba(255, 255, 255, 0.05);
        }

        .personStats b,
        .personStats small {
          display: block;
        }

        .personStats small {
          color: #8996a5;
          margin-top: 4px;
        }

        .pointHistory span {
          min-width: 45px;
          text-align: center;
          color: #fbbf24;
          font-weight: bold;
        }

        .animationOverlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          background:
            rgba(0, 0, 0, 0.2);
          animation: overlayFade 2.4s
            forwards;
        }

        .beerAnimation {
          position: relative;
          width: 330px;
          height: 260px;
        }

        .beerGlass {
          position: absolute;
          top: 50px;
          font-size: 95px;
          animation: toast 1.4s
            cubic-bezier(.2,.8,.2,1)
            forwards;
        }

        .beerGlass.left {
          left: 20px;
          transform: rotate(-15deg);
        }

        .beerGlass.right {
          right: 20px;
          transform: rotate(15deg);
        }

        .prost {
          position: absolute;
          left: 50%;
          top: 175px;
          transform: translateX(-50%);
          font-size: 38px;
          font-weight: 900;
          color: #fbbf24;
          text-shadow:
            0 4px 25px
              rgba(0, 0, 0, 0.7);
          animation: prost 2s
            forwards;
        }

        .moneyRain span {
          position: absolute;
          top: -50px;
          font-size: 30px;
          animation: moneyFall 2.3s
            linear forwards;
        }

        .animationText {
          position: absolute;
          top: 48%;
          font-size: 35px;
          font-weight: 900;
          color: #86efac;
          text-shadow:
            0 5px 25px
              rgba(0, 0, 0, 0.8);
        }

        .crateAnimation {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          font-size: 70px;
          animation: cratePop 2.5s
            forwards;
        }

        .crateAnimation strong {
          font-size: 30px;
          color: #fbbf24;
        }

        .crateAnimation small {
          color: #86efac;
          font-size: 22px;
        }

        @keyframes toast {
          0% {
            transform:
              translateY(100px)
              rotate(-30deg);
            opacity: 0;
          }

          50% {
            opacity: 1;
          }

          70% {
            transform:
              translateY(0)
              rotate(-5deg);
          }

          82% {
            transform:
              translateX(100px)
              rotate(10deg);
          }

          100% {
            transform:
              translateX(90px)
              rotate(8deg);
          }
        }

        .beerGlass.right {
          animation-name: toastRight;
        }

        @keyframes toastRight {
          0% {
            transform:
              translateY(100px)
              rotate(30deg);
            opacity: 0;
          }

          50% {
            opacity: 1;
          }

          70% {
            transform:
              translateY(0)
              rotate(5deg);
          }

          82% {
            transform:
              translateX(-100px)
              rotate(-10deg);
          }

          100% {
            transform:
              translateX(-90px)
              rotate(-8deg);
          }
        }

        @keyframes prost {
          0% {
            opacity: 0;
            transform:
              translateX(-50%)
              scale(0.3);
          }

          45% {
            opacity: 0;
          }

          65% {
            opacity: 1;
            transform:
              translateX(-50%)
              scale(1.2);
          }

          100% {
            opacity: 1;
            transform:
              translateX(-50%)
              scale(1);
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
              rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes cratePop {
          0% {
            transform:
              scale(0.2)
              translateY(50px);
            opacity: 0;
          }

          35% {
            transform:
              scale(1.25)
              translateY(0);
            opacity: 1;
          }

          65% {
            transform:
              scale(1);
          }

          100% {
            transform:
              scale(1.05);
            opacity: 1;
          }
        }

        @keyframes overlayFade {
          0% {
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          80% {
            opacity: 1;
          }

          100% {
            opacity: 0;
          }
        }

        @media (max-width: 700px) {
          .statsGrid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .three {
            grid-template-columns: 1fr;
          }

          .addRow {
            grid-template-columns: 1fr;
          }

          .assignment {
            grid-template-columns: 1fr;
          }

          .request {
            flex-direction: column;
            align-items: stretch;
          }

          .requestButtons {
            display: grid;
            grid-template-columns:
              1fr 1fr;
          }

          .header {
            flex-wrap: wrap;
          }

          .adminBadge {
            margin-left: 76px;
          }

          .inviteBox {
            flex-wrap: wrap;
          }

          .inviteBox strong {
            min-width: 100%;
            order: -1;
          }
        }

        @media (max-width: 430px) {
          .page {
            padding: 12px 9px;
          }

          h1 {
            font-size: 21px;
          }

          .logo {
            width: 53px;
            height: 53px;
            font-size: 29px;
          }

          .card {
            padding: 14px;
            border-radius: 18px;
          }

          .rankRow {
            grid-template-columns:
              35px 1fr auto;
            padding: 11px;
          }

          .rankRow b {
            font-size: 12px;
          }
        }
      `}</style>
    </main>
  );
}
