"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/* =========================================================
   TYPES
========================================================= */

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
  photo_required: boolean | null;
  ai_recognition_enabled: boolean | null;
  manual_entry_allowed: boolean | null;
  cost_overview_enabled: boolean | null;
  auto_split_costs: boolean | null;
  team_mode: boolean | null;
  show_photos: boolean | null;
  show_costs: boolean | null;
  privacy_mode: boolean | null;

  created_by_profile_id: string | null;
  created_at: string | null;
};

type Profile = {
  id: string;
  username: string | null;
  points: number | null;
  drinks_count: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  gewicht_kg: number | null;
  alter: number | null;
  geschlecht: string | null;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at: string | null;
  gender_factor: number | null;
  joined_via_code: string | null;
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
  image_path: string | null;

  ai_detected: boolean | null;
  detected_brand: string | null;
  detected_alcohol_percent: number | null;

  paid_by: string | null;
  shared_cost: boolean | null;

  marke: string | null;
  bezahlt_von: string | null;
  promille_wert: number | null;

  getraenk: string | null;
  menge: number | null;
  alkohol: number | null;
  preis: number | null;
  foto: string | null;
};

type Payment = {
  id: string;
  event_id: string;
  betrag: number | null;
  created_at: string | null;
  bezahlt_von: string | null;
  profile_id: string | null;
  status: string | null;
};

/* =========================================================
   HELPERS
========================================================= */

function numberValue(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatEuro(value: number) {
  return `${value.toFixed(2)} €`;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("de-DE");
}

function calculatePromille(
  liters: number,
  alcoholPercent: number,
  weightKg: number,
  gender: string
) {
  if (
    liters <= 0 ||
    alcoholPercent <= 0 ||
    weightKg <= 0
  ) {
    return 0;
  }

  /*
    Näherungsrechnung:

    Alkohol in Gramm:
    Liter × Alkohol% × 0,8 × 10

    Verteilungsfaktor:
    Männer ca. 0,68
    Frauen ca. 0,55
  */

  const alcoholGrams =
    liters *
    (alcoholPercent / 100) *
    1000 *
    0.8;

  const factor =
    gender.toLowerCase().startsWith("w") ||
    gender.toLowerCase().startsWith("f")
      ? 0.55
      : 0.68;

  return alcoholGrams / (weightKg * factor);
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Home() {
  /* -------------------------------------------------------
     DATA
  ------------------------------------------------------- */

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* -------------------------------------------------------
     CURRENT USER / PROFILE
  ------------------------------------------------------- */

  const [currentProfileId, setCurrentProfileId] =
    useState("");

  /* -------------------------------------------------------
     EVENT FORM
  ------------------------------------------------------- */

  const [showEventForm, setShowEventForm] =
    useState(false);

  const [eventTitle, setEventTitle] =
    useState("");

  const [eventDescription, setEventDescription] =
    useState("");

  const [eventLocation, setEventLocation] =
    useState("");

  const [eventStart, setEventStart] =
    useState("");

  const [eventEnd, setEventEnd] =
    useState("");

  /* -------------------------------------------------------
     JOIN EVENT
  ------------------------------------------------------- */

  const [inviteCode, setInviteCode] =
    useState("");

  /* -------------------------------------------------------
     PARTICIPANT
  ------------------------------------------------------- */

  const [personName, setPersonName] =
    useState("");

  const [showParticipantForm, setShowParticipantForm] =
    useState(false);

  /* -------------------------------------------------------
     DRINK
  ------------------------------------------------------- */

  const [drinkName, setDrinkName] =
    useState("");

  const [drinkBrand, setDrinkBrand] =
    useState("");

  const [drinkCategory, setDrinkCategory] =
    useState("Bier");

  const [liters, setLiters] =
    useState("0.5");

  const [alcohol, setAlcohol] =
    useState("5");

  const [price, setPrice] =
    useState("0");

  const [drinkComment, setDrinkComment] =
    useState("");

  const [sharedCost, setSharedCost] =
    useState(true);

  /* -------------------------------------------------------
     PAYMENT
  ------------------------------------------------------- */

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentProfileId, setPaymentProfileId] =
    useState("");

  /* -------------------------------------------------------
     SETTINGS
  ------------------------------------------------------- */

  const [showSettings, setShowSettings] =
    useState(false);

  /* -------------------------------------------------------
     LOAD EVENTS
  ------------------------------------------------------- */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
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
      setEvents(data as Event[]);

      if (
        !eventId &&
        data.length > 0
      ) {
        setEventId(data[0].id);
      }
    }
  }

  /* -------------------------------------------------------
     LOAD PROFILES
  ------------------------------------------------------- */

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        username,
        points,
        drinks_count,
        weight_kg,
        height_cm,
        age,
        gender,
        gewicht_kg,
        alter,
        geschlecht
        `
      )
      .order("username", {
        ascending: true,
      });

    if (error) {
      setMessage(
        "❌ Profile konnten nicht geladen werden: " +
          error.message
      );
      return;
    }

    if (data) {
      setProfiles(data as Profile[]);

      if (
        !currentProfileId &&
        data.length > 0
      ) {
        setCurrentProfileId(data[0].id);
      }
    }
  }

  /* -------------------------------------------------------
     LOAD EVENT DATA
  ------------------------------------------------------- */

  async function loadEventData() {
    if (!eventId) return;

    setLoading(true);

    const [
      membersResult,
      drinksResult,
      paymentsResult,
    ] = await Promise.all([
      supabase
        .from("event_members")
        .select("*")
        .eq("event_id", eventId)
        .order("joined_at", {
          ascending: true,
        }),

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
    ]);

    if (membersResult.error) {
      setMessage(
        "❌ Teilnehmer konnten nicht geladen werden: " +
          membersResult.error.message
      );
    }

    if (drinksResult.error) {
      setMessage(
        "❌ Getränke konnten nicht geladen werden: " +
          drinksResult.error.message
      );
    }

    if (paymentsResult.error) {
      setMessage(
        "❌ Zahlungen konnten nicht geladen werden: " +
          paymentsResult.error.message
      );
    }

    setMembers(
      (membersResult.data ||
        []) as EventMember[]
    );

    setDrinks(
      (drinksResult.data ||
        []) as Drink[]
    );

    setPayments(
      (paymentsResult.data ||
        []) as Payment[]
    );

    setLoading(false);
  }

  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */

  useEffect(() => {
    loadProfiles();
    loadEvents();
  }, []);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  /* =========================================================
     CURRENT EVENT
  ========================================================= */

  const currentEvent = useMemo(() => {
    return events.find(
      (event) =>
        event.id === eventId
    );
  }, [events, eventId]);

  /* =========================================================
     EVENT MEMBERS WITH PROFILE
  ========================================================= */

  const eventPeople = useMemo(() => {
    return members.map((member) => {
      const profile =
        profiles.find(
          (p) =>
            p.id === member.profile_id
        );

      return {
        member,
        profile,
      };
    });
  }, [members, profiles]);

  /* =========================================================
     DRINK TOTALS
  ========================================================= */

  const totalDrinks = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        numberValue(
          drink.quantity || 1
        ),
      0
    );
  }, [drinks]);

  const totalLiters = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        numberValue(
          drink.liters ??
            drink.menge
        ) *
          numberValue(
            drink.quantity || 1
          ),
      0
    );
  }, [drinks]);

  const totalCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        numberValue(
          drink.preis
        ) *
          numberValue(
            drink.quantity || 1
          ),
      0
    );
  }, [drinks]);

  const totalPayments = useMemo(() => {
    return payments.reduce(
      (sum, payment) =>
        sum +
        numberValue(
          payment.betrag
        ),
      0
    );
  }, [payments]);

  /* =========================================================
     PERSON STATISTICS
  ========================================================= */

  function drinksForPerson(
    profileId: string
  ) {
    return drinks.filter(
      (drink) =>
        drink.profile_id ===
        profileId
    );
  }

  function personDrinkCount(
    profileId: string
  ) {
    return drinksForPerson(
      profileId
    ).reduce(
      (sum, drink) =>
        sum +
        numberValue(
          drink.quantity || 1
        ),
      0
    );
  }

  function personLiters(
    profileId: string
  ) {
    return drinksForPerson(
      profileId
    ).reduce(
      (sum, drink) =>
        sum +
        numberValue(
          drink.liters ??
            drink.menge
        ) *
          numberValue(
            drink.quantity || 1
          ),
      0
    );
  }

  function personCost(
    profileId: string
  ) {
    return drinksForPerson(
      profileId
    ).reduce(
      (sum, drink) =>
        sum +
        numberValue(
          drink.preis
        ) *
          numberValue(
            drink.quantity || 1
          ),
      0
    );
  }

  function personPromille(
    profile: Profile | undefined
  ) {
    if (!profile) return 0;

    const weight =
      numberValue(
        profile.weight_kg ??
          profile.gewicht_kg
      );

    const gender =
      profile.gender ??
      profile.geschlecht ??
      "m";

    let total = 0;

    drinksForPerson(
      profile.id
    ).forEach((drink) => {
      const liters =
        numberValue(
          drink.liters ??
            drink.menge
        );

      const alcohol =
        numberValue(
          drink.alcohol_percent ??
            drink.alkohol
        );

      total +=
        calculatePromille(
          liters,
          alcohol,
          weight,
          gender
        );
    });

    return total;
  }

  function personPoints(
    profileId: string
  ) {
    return (
      personDrinkCount(
        profileId
      ) * 10
    );
  }

  /* =========================================================
     RANKING
  ========================================================= */

  const ranking = useMemo(() => {
    return eventPeople
      .map(
        ({
          member,
          profile,
        }) => ({
          member,
          profile,
          drinks:
            profile
              ? personDrinkCount(
                  profile.id
                )
              : 0,
          liters:
            profile
              ? personLiters(
                  profile.id
                )
              : 0,
          cost:
            profile
              ? personCost(
                  profile.id
                )
              : 0,
          points:
            profile
              ? personPoints(
                  profile.id
                )
              : 0,
          promille:
            profile
              ? personPromille(
                  profile
                )
              : 0,
        })
      )
      .sort(
        (a, b) =>
          b.points -
          a.points
      );
  }, [
    eventPeople,
    drinks,
    profiles,
  ]);

  /* =========================================================
     COST PER PERSON
  ========================================================= */

  const costPerPerson =
    eventPeople.length > 0
      ? totalCost /
        eventPeople.length
      : 0;

  /* =========================================================
     CREATE EVENT
  ========================================================= */

  async function createEvent() {
    setMessage("");

    if (!eventTitle.trim()) {
      setMessage(
        "❌ Bitte einen Eventnamen eingeben."
      );
      return;
    }

    if (!currentProfileId) {
      setMessage(
        "❌ Bitte zuerst ein Profil auswählen."
      );
      return;
    }

    setLoading(true);

    const generatedCode =
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const { data, error } =
      await supabase
        .from("events")
        .insert({
          title:
            eventTitle.trim(),

          description:
            eventDescription.trim() ||
            null,

          location:
            eventLocation.trim() ||
            null,

          start_date:
            eventStart || null,

          end_date:
            eventEnd || null,

          invite_code:
            generatedCode,

          is_active: true,

          created_by_profile_id:
            currentProfileId,

          ranking_enabled: true,
          show_points: true,
          show_ranking: true,
          show_promille: true,
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
        })
        .select("*")
        .single();

    setLoading(false);

    if (error) {
      setMessage(
        "❌ Event konnte nicht erstellt werden: " +
          error.message
      );
      return;
    }

    setMessage(
      "✅ Event erfolgreich erstellt."
    );

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setEventStart("");
    setEventEnd("");

    setShowEventForm(false);

    await loadEvents();

    if (data?.id) {
      setEventId(data.id);
    }
  }

  /* =========================================================
     JOIN EVENT WITH INVITE CODE
  ========================================================= */

  async function joinEvent() {
    setMessage("");

    if (!inviteCode.trim()) {
      setMessage(
        "❌ Bitte Einladungscode eingeben."
      );
      return;
    }

    if (!currentProfileId) {
      setMessage(
        "❌ Bitte zuerst ein Profil auswählen."
      );
      return;
    }

    const { data: event } =
      await supabase
        .from("events")
        .select("*")
        .eq(
          "invite_code",
          inviteCode
            .trim()
            .toUpperCase()
        )
        .maybeSingle();

    if (!event) {
      setMessage(
        "❌ Kein Event mit diesem Einladungscode gefunden."
      );
      return;
    }

    const { data: existing } =
      await supabase
        .from("event_members")
        .select("id")
        .eq(
          "event_id",
          event.id
        )
        .eq(
          "profile_id",
          currentProfileId
        )
        .maybeSingle();

    if (existing) {
      setEventId(event.id);

      setMessage(
        "ℹ️ Du bist bereits Teilnehmer dieses Events."
      );

      return;
    }

    const { error } =
      await supabase
        .from("event_members")
        .insert({
          event_id: event.id,
          profile_id:
            currentProfileId,
          joined_via_code:
            inviteCode
              .trim()
              .toUpperCase(),
          joined_at:
            new Date().toISOString(),
          gender_factor: 0.68,
        });

    if (error) {
      setMessage(
        "❌ Teilnahme konnte nicht hinzugefügt werden: " +
          error.message
      );
      return;
    }

    setEventId(event.id);

    setInviteCode("");

    setMessage(
      "✅ Du bist dem Event beigetreten."
    );

    await loadEventData();
  }

  /* =========================================================
     ADD PARTICIPANT
  ========================================================= */

  async function addParticipant() {
    setMessage("");

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

    /*
      Wir suchen zuerst nach einem vorhandenen Profil.
    */

    let profile =
      profiles.find(
        (p) =>
          (p.username || "")
            .toLowerCase() ===
          personName
            .trim()
            .toLowerCase()
      );

    /*
      Falls kein Profil existiert,
      erstellen wir eines.
    */

    if (!profile) {
      const { data, error } =
        await supabase
          .from("profiles")
          .insert({
            username:
              personName.trim(),
            points: 0,
            drinks_count: 0,
          })
          .select("*")
          .single();

      if (error) {
        setMessage(
          "❌ Profil konnte nicht erstellt werden: " +
            error.message
        );
        return;
      }

      profile =
        data as Profile;

      await loadProfiles();
    }

    const alreadyMember =
      members.some(
        (member) =>
          member.profile_id ===
          profile!.id
      );

    if (alreadyMember) {
      setMessage(
        "❌ Diese Person ist bereits Teilnehmer."
      );
      return;
    }

    const { error } =
      await supabase
        .from("event_members")
        .insert({
          event_id: eventId,
          profile_id:
            profile.id,
          joined_at:
            new Date().toISOString(),
          joined_via_code: null,
          gender_factor:
            (
              profile.gender ??
              profile.geschlecht ??
              ""
            )
              .toLowerCase()
              .startsWith("w")
              ? 0.55
              : 0.68,
        });

    if (error) {
      setMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message
      );
      return;
    }

    setPersonName("");

    setMessage(
      "✅ Teilnehmer hinzugefügt."
    );

    setShowParticipantForm(false);

    await loadEventData();
  }

  /* =========================================================
     REMOVE PARTICIPANT
  ========================================================= */

  async function removeParticipant(
    memberId: string
  ) {
    const { error } =
      await supabase
        .from("event_members")
        .delete()
        .eq(
          "id",
          memberId
        );

    if (error) {
      setMessage(
        "❌ Teilnehmer konnte nicht entfernt werden: " +
          error.message
      );
      return;
    }

    setMessage(
      "✅ Teilnehmer entfernt."
    );

    await loadEventData();
  }

  /* =========================================================
     SAVE DRINK
  ========================================================= */

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

    const drinkLiters =
      numberValue(liters);

    const alcoholPercent =
      numberValue(alcohol);

    const drinkPrice =
      numberValue(price);

    if (drinkLiters <= 0) {
      setMessage(
        "❌ Die Literangabe muss größer als 0 sein."
      );
      return;
    }

    if (
      alcoholPercent < 0 ||
      alcoholPercent > 100
    ) {
      setMessage(
        "❌ Alkoholgehalt muss zwischen 0 und 100 % liegen."
      );
      return;
    }

    const { error } =
      await supabase
        .from("drinks")
        .insert({
          event_id: eventId,

          profile_id: null,

          category:
            drinkCategory,

          drink_name:
            drinkName.trim(),

          brand:
            drinkBrand.trim() ||
            null,

          liters:
            drinkLiters,

          alcohol_percent:
            alcoholPercent,

          quantity: 1,

          comment:
            drinkComment.trim() ||
            null,

          shared_cost:
            sharedCost,

          getraenk:
            drinkName.trim(),

          menge:
            drinkLiters,

          alkohol:
            alcoholPercent,

          preis:
            drinkPrice,

          marke:
            drinkBrand.trim() ||
            null,

          created_at:
            new Date().toISOString(),
        });

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setDrinkName("");
    setDrinkBrand("");
    setDrinkCategory("Bier");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");
    setDrinkComment("");
    setSharedCost(true);

    setMessage(
      "✅ Getränk gespeichert."
    );

    await loadEventData();
  }

  /* =========================================================
     ASSIGN DRINK
  ========================================================= */

  async function assignDrink(
    drinkId: string,
    profileId: string
  ) {
    setMessage("");

    const { error } =
      await supabase
        .from("drinks")
        .update({
          profile_id:
            profileId,
        })
        .eq(
          "id",
          drinkId
        );

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
      return;
    }

    setMessage(
      "🍺 Getränk zugeordnet – +10 Punkte."
    );

    await loadEventData();
  }

  /* =========================================================
     UNASSIGN DRINK
  ========================================================= */

  async function unassignDrink(
    drinkId: string
  ) {
    const { error } =
      await supabase
        .from("drinks")
        .update({
          profile_id: null,
        })
        .eq(
          "id",
          drinkId
        );

    if (error) {
      setMessage(
        "❌ Zuordnung konnte nicht entfernt werden: " +
          error.message
      );
      return;
    }

    setMessage(
      "✅ Getränk wurde wieder freigegeben."
    );

    await loadEventData();
  }

  /* =========================================================
     ADD PAYMENT
  ========================================================= */

  async function addPayment() {
    setMessage("");

    if (!eventId) {
      setMessage(
        "❌ Bitte Event auswählen."
      );
      return;
    }

    const amount =
      numberValue(
        paymentAmount
      );

    if (amount <= 0) {
      setMessage(
        "❌ Bitte einen gültigen Betrag eingeben."
      );
      return;
    }

    const profileId =
      paymentProfileId ||
      currentProfileId ||
      null;

    const { error } =
      await supabase
        .from("payments")
        .insert({
          event_id: eventId,
          betrag: amount,
          profile_id:
            profileId,
          bezahlt_von:
            profileId,
          status:
            "bezahlt",
          created_at:
            new Date().toISOString(),
        });

    if (error) {
      setMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
          error.message
      );
      return;
    }

    setPaymentAmount("");
    setPaymentProfileId("");

    setMessage(
      "✅ Zahlung gespeichert."
    );

    await loadEventData();
  }

  /* =========================================================
     UPDATE EVENT SETTINGS
  ========================================================= */

  async function updateEventSetting(
    field: string,
    value: boolean
  ) {
    if (!currentEvent) return;

    const { error } =
      await supabase
        .from("events")
        .update({
          [field]:
            value,
        })
        .eq(
          "id",
          currentEvent.id
        );

    if (error) {
      setMessage(
        "❌ Einstellung konnte nicht geändert werden: " +
          error.message
      );
      return;
    }

    setEvents((old) =>
      old.map((event) =>
        event.id ===
        currentEvent.id
          ? {
              ...event,
              [field]:
                value,
            }
          : event
      )
    );

    setMessage(
      "✅ Einstellung gespeichert."
    );
  }

  /* =========================================================
     DELETE DRINK
  ========================================================= */

  async function deleteDrink(
    drinkId: string
  ) {
    const confirmed =
      window.confirm(
        "Getränk wirklich löschen?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("drinks")
        .delete()
        .eq(
          "id",
          drinkId
        );

    if (error) {
      setMessage(
        "❌ Getränk konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    setMessage(
      "✅ Getränk gelöscht."
    );

    await loadEventData();
  }

  /* =========================================================
     DELETE PAYMENT
  ========================================================= */

  async function deletePayment(
    paymentId: string
  ) {
    const confirmed =
      window.confirm(
        "Zahlung wirklich löschen?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("payments")
        .delete()
        .eq(
          "id",
          paymentId
        );

    if (error) {
      setMessage(
        "❌ Zahlung konnte nicht gelöscht werden: " +
          error.message
      );
      return;
    }

    setMessage(
      "✅ Zahlung gelöscht."
    );

    await loadEventData();
  }

  /* =========================================================
     COPY INVITE CODE
  ========================================================= */

  async function copyInviteCode() {
    if (!currentEvent?.invite_code)
      return;

    try {
      await navigator.clipboard.writeText(
        currentEvent.invite_code
      );

      setMessage(
        "📋 Einladungscode kopiert."
      );
    } catch {
      setMessage(
        "ℹ️ Einladungscode: " +
          currentEvent.invite_code
      );
    }
  }

  /* =========================================================
     REFRESH
  ========================================================= */

  async function refreshAll() {
    setMessage(
      "🔄 Daten werden aktualisiert..."
    );

    await Promise.all([
      loadEvents(),
      loadProfiles(),
      loadEventData(),
    ]);

    setMessage(
      "✅ Daten aktualisiert."
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="page">
      <div className="container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="header">
          <div className="logo">
            🍻
          </div>

          <div className="headerText">
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Dein Event. Deine Getränke.
              Deine Runde.
            </p>
          </div>

          <button
            className="refreshButton"
            onClick={refreshAll}
          >
            🔄
          </button>
        </header>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {/* =================================================
            PROFILE SELECT
        ================================================= */}

        <section className="card">
          <div className="sectionHeader">
            <div>
              <h2>
                👤 Aktuelles Profil
              </h2>

              <p>
                Wer benutzt die App gerade?
              </p>
            </div>
          </div>

          <select
            value={
              currentProfileId
            }
            onChange={(e) =>
              setCurrentProfileId(
                e.target.value
              )
            }
          >
            <option value="">
              Profil auswählen
            </option>

            {profiles.map(
              (profile) => (
                <option
                  key={profile.id}
                  value={profile.id}
                >
                  {profile.username ||
                    "Profil"}
                </option>
              )
            )}
          </select>
        </section>

        {/* =================================================
            EVENT SELECT
        ================================================= */}

        <section className="card">
          <div className="sectionHeader">
            <div>
              <h2>
                📅 Aktuelles Event
              </h2>

              {currentEvent && (
                <p>
                  {currentEvent.title}
                </p>
              )}
            </div>

            <button
              className="smallButton"
              onClick={() =>
                setShowEventForm(
                  !showEventForm
                )
              }
            >
              ➕ Event
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

          {currentEvent && (
            <div className="eventInfo">
              <div>
                📍{" "}
                {currentEvent.location ||
                  "Kein Ort angegeben"}
              </div>

              <div>
                📅{" "}
                {formatDate(
                  currentEvent.start_date
                )}
                {" – "}
                {formatDate(
                  currentEvent.end_date
                )}
              </div>

              <div>
                🟢{" "}
                {currentEvent.is_active
                  ? "Aktiv"
                  : "Beendet"}
              </div>
            </div>
          )}
        </section>

        {/* =================================================
            CREATE EVENT
        ================================================= */}

        {showEventForm && (
          <section className="card highlightCard">
            <h2>
              ➕ Neues Event erstellen
            </h2>

            <input
              placeholder="Eventname"
              value={eventTitle}
              onChange={(e) =>
                setEventTitle(
                  e.target.value
                )
              }
            />

            <textarea
              placeholder="Beschreibung"
              value={
                eventDescription
              }
              onChange={(e) =>
                setEventDescription(
                  e.target.value
                )
              }
            />

            <input
              placeholder="Ort"
              value={
                eventLocation
              }
              onChange={(e) =>
                setEventLocation(
                  e.target.value
                )
              }
            />

            <div className="twoColumns">
              <div>
                <label>
                  Start
                </label>

                <input
                  type="date"
                  value={
                    eventStart
                  }
                  onChange={(e) =>
                    setEventStart(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  Ende
                </label>

                <input
                  type="date"
                  value={
                    eventEnd
                  }
                  onChange={(e) =>
                    setEventEnd(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <button
              className="primaryButton full"
              onClick={
                createEvent
              }
              disabled={
                loading
              }
            >
              🍻 Event erstellen
            </button>
          </section>
        )}

        {/* =================================================
            INVITE
        ================================================= */}

        <section className="card">
          <h2>
            🔗 Event beitreten
          </h2>

          <p>
            Gib den Einladungscode eines
            anderen Events ein.
          </p>

          <div className="inlineForm">
            <input
              placeholder="z.B. ABC123"
              value={inviteCode}
              onChange={(e) =>
                setInviteCode(
                  e.target.value
                )
              }
            />

            <button
              onClick={
                joinEvent
              }
            >
              Beitreten
            </button>
          </div>

          {currentEvent?.invite_code && (
            <div className="inviteBox">
              <div>
                <small>
                  Dein Einladungscode
                </small>

                <strong>
                  {
                    currentEvent.invite_code
                  }
                </strong>
              </div>

              <button
                onClick={
                  copyInviteCode
                }
              >
                📋 Kopieren
              </button>
            </div>
          )}
        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="statsGrid">

          <div className="stat">
            <span>
              🍺
            </span>

            <strong>
              {totalDrinks}
            </strong>

            <small>
              Getränke
            </small>
          </div>

          <div className="stat">
            <span>
              💧
            </span>

            <strong>
              {totalLiters.toFixed(
                1
              )}
            </strong>

            <small>
              Liter
            </small>
          </div>

          <div className="stat">
            <span>
              💶
            </span>

            <strong>
              {totalCost.toFixed(
                2
              )} €
            </strong>

            <small>
              Kosten
            </small>
          </div>

          <div className="stat">
            <span>
              👥
            </span>

            <strong>
              {eventPeople.length}
            </strong>

            <small>
              Teilnehmer
            </small>
          </div>

        </div>

        {/* =================================================
            PARTICIPANTS
        ================================================= */}

        <section className="card">
          <div className="sectionHeader">
            <div>
              <h2>
                👥 Teilnehmer
              </h2>

              <p>
                {eventPeople.length} Personen
                im Event
              </p>
            </div>

            <button
              className="smallButton"
              onClick={() =>
                setShowParticipantForm(
                  !showParticipantForm
                )
              }
            >
              ➕ Hinzufügen
            </button>
          </div>

          {showParticipantForm && (
            <div className="addBox">
              <input
                placeholder="Name des Teilnehmers"
                value={personName}
                onChange={(e) =>
                  setPersonName(
                    e.target.value
                  )
                }
              />

              <button
                className="primaryButton full"
                onClick={
                  addParticipant
                }
              >
                👤 Teilnehmer hinzufügen
              </button>
            </div>
          )}

          {eventPeople.length ===
          0 ? (
            <div className="empty">
              👥 Noch keine Teilnehmer.
            </div>
          ) : (
            eventPeople.map(
              ({
                member,
                profile,
              }) => (
                <div
                  className="personItem"
                  key={
                    member.id
                  }
                >
                  <div className="personAvatar">
                    👤
                  </div>

                  <div className="personInfo">
                    <strong>
                      {profile?.username ||
                        "Unbekannt"}
                    </strong>

                    <small>
                      🍺{" "}
                      {profile
                        ? personDrinkCount(
                            profile.id
                          )
                        : 0}

                      {" · "}

                      💧{" "}
                      {profile
                        ? personLiters(
                            profile.id
                          ).toFixed(
                            1
                          )
                        : "0.0"}{" "}
                      L

                      {" · "}

                      🏆{" "}
                      {profile
                        ? personPoints(
                            profile.id
                          )
                        : 0}
                    </small>
                  </div>

                  {currentEvent?.show_promille && (
                    <div className="promilleSmall">
                      {profile
                        ? personPromille(
                            profile
                          ).toFixed(
                            2
                          )
                        : "0.00"} ‰
                    </div>
                  )}

                  <button
                    className="deleteButton"
                    onClick={() =>
                      removeParticipant(
                        member.id
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              )
            )
          )}
        </section>

        {/* =================================================
            DRINK ADD
        ================================================= */}

        {currentEvent?.manual_entry_allowed !==
          false && (
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

            <div className="twoColumns">
              <input
                placeholder="Marke"
                value={
                  drinkBrand
                }
                onChange={(e) =>
                  setDrinkBrand(
                    e.target.value
                  )
                }
              />

              <select
                value={
                  drinkCategory
                }
                onChange={(e) =>
                  setDrinkCategory(
                    e.target.value
                  )
                }
              >
                <option>
                  Bier
                </option>

                <option>
                  Wein
                </option>

                <option>
                  Sekt
                </option>

                <option>
                  Schnaps
                </option>

                <option>
                  Longdrink
                </option>

                <option>
                  Cocktail
                </option>

                <option>
                  Softdrink
                </option>

                <option>
                  Sonstiges
                </option>
              </select>
            </div>

            <div className="threeColumns">
              <div>
                <label>
                  Liter
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    liters
                  }
                  onChange={(e) =>
                    setLiters(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  Alkohol %
                </label>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={
                    alcohol
                  }
                  onChange={(e) =>
                    setAlcohol(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  Preis €
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    price
                  }
                  onChange={(e) =>
                    setPrice(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <textarea
              placeholder="Kommentar / Notiz"
              value={
                drinkComment
              }
              onChange={(e) =>
                setDrinkComment(
                  e.target.value
                )
              }
            />

            <label className="checkboxLine">
              <input
                type="checkbox"
                checked={
                  sharedCost
                }
                onChange={(e) =>
                  setSharedCost(
                    e.target.checked
                  )
                }
              />

              Kosten automatisch
              berücksichtigen
            </label>

            <button
              className="primaryButton full"
              onClick={
                saveDrink
              }
            >
              🍻 Getränk speichern
            </button>
          </section>
        )}

        {/* =================================================
            DRINK ASSIGNMENT
        ================================================= */}

        <section className="card">
          <h2>
            🔗 Getränke zuordnen
          </h2>

          <p>
            Wähle aus, wer welches Getränk
            getrunken hat.
          </p>

          {drinks.length ===
          0 ? (
            <div className="empty">
              🍺 Noch keine Getränke.
            </div>
          ) : (
            drinks.map(
              (drink) => {
                const assigned =
                  profiles.find(
                    (profile) =>
                      profile.id ===
                      drink.profile_id
                  );

                return (
                  <div
                    className="drinkAssignment"
                    key={
                      drink.id
                    }
                  >
                    <div>
                      <strong>
                        🍺{" "}
                        {drink.drink_name ||
                          drink.getraenk ||
                          "Getränk"}
                      </strong>

                      <small>
                        {numberValue(
                          drink.liters ??
                            drink.menge
                        ).toFixed(
                          1
                        )}{" "}
                        L ·{" "}
                        {numberValue(
                          drink.alcohol_percent ??
                            drink.alkohol
                        ).toFixed(
                          1
                        )} %
                        {" · "}
                        {formatEuro(
                          numberValue(
                            drink.preis
                          )
                        )}
                      </small>

                      {assigned && (
                        <span className="assigned">
                          👤{" "}
                          {assigned.username}
                        </span>
                      )}
                    </div>

                    <select
                      value={
                        drink.profile_id ||
                        ""
                      }
                      onChange={(e) => {
                        if (
                          e.target.value
                        ) {
                          assignDrink(
                            drink.id,
                            e.target.value
                          );
                        } else {
                          unassignDrink(
                            drink.id
                          );
                        }
                      }}
                    >
                      <option value="">
                        👤 Nicht zugeordnet
                      </option>

                      {eventPeople.map(
                        ({
                          profile,
                        }) =>
                          profile && (
                            <option
                              key={
                                profile.id
                              }
                              value={
                                profile.id
                              }
                            >
                              {profile.username}
                            </option>
                          )
                      )}
                    </select>

                    <button
                      className="deleteButton"
                      onClick={() =>
                        deleteDrink(
                          drink.id
                        )
                      }
                    >
                      🗑️
                    </button>
                  </div>
                );
              }
            )
          )}
        </section>

        {/* =================================================
            DRINK LIST
        ================================================= */}

        <section className="card">
          <h2>
            🍺 Alle Getränke
          </h2>

          {drinks.length ===
          0 ? (
            <div className="empty">
              Keine Getränke vorhanden.
            </div>
          ) : (
            drinks.map(
              (drink) => {
                const assigned =
                  profiles.find(
                    (profile) =>
                      profile.id ===
                      drink.profile_id
                  );

                return (
                  <div
                    className="drinkItem"
                    key={
                      drink.id
                    }
                  >
                    <div className="drinkIcon">
                      🍺
                    </div>

                    <div className="drinkInfo">
                      <strong>
                        {drink.drink_name ||
                          drink.getraenk ||
                          "Getränk"}
                      </strong>

                      <small>
                        {drink.brand ||
                          drink.marke ||
                          ""}

                        {" · "}

                        {numberValue(
                          drink.liters ??
                            drink.menge
                        ).toFixed(
                          1
                        )}{" "}
                        L

                        {" · "}

                        {numberValue(
                          drink.alcohol_percent ??
                            drink.alkohol
                        ).toFixed(
                          1
                        )} %
                      </small>

                      {assigned && (
                        <span className="assigned">
                          👤{" "}
                          {assigned.username}
                        </span>
                      )}
                    </div>

                    <div className="drinkPrice">
                      {formatEuro(
                        numberValue(
                          drink.preis
                        )
                      )}
                    </div>
                  </div>
                );
              }
            )
          )}
        </section>

        {/* =================================================
            RANKING
        ================================================= */}

        {currentEvent?.ranking_enabled &&
          currentEvent?.show_ranking && (
            <section className="card">
              <h2>
                🏆 Ranking
              </h2>

              {ranking.length ===
              0 ? (
                <div className="empty">
                  Noch keine Teilnehmer.
                </div>
              ) : (
                ranking.map(
                  (
                    person,
                    index
                  ) => (
                    <div
                      className={
                        "rankingItem " +
                        (index ===
                        0
                          ? "first"
                          : "")
                      }
                      key={
                        person.member
                          .id
                      }
                    >
                      <div className="rankNumber">
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
                      </div>

                      <div className="rankName">
                        <strong>
                          {person
                            .profile
                            ?.username ||
                            "Unbekannt"}
                        </strong>

                        <small>
                          🍺{" "}
                          {
                            person.drinks
                          }{" "}
                          Getränke ·{" "}
                          {person.liters.toFixed(
                            1
                          )}{" "}
                          L
                        </small>
                      </div>

                      {currentEvent.show_points && (
                        <div className="points">
                          {
                            person.points
                          }{" "}
                          Punkte
                        </div>
                      )}
                    </div>
                  )
                )
              )}
            </section>
          )}

        {/* =================================================
            COSTS
        ================================================= */}

        {currentEvent?.cost_overview_enabled && (
          <section className="card costCard">
            <h2>
              💶 Kostenübersicht
            </h2>

            <div className="bigAmount">
              {formatEuro(
                totalCost
              )}
            </div>

            <p>
              Gesamtkosten des Events
            </p>

            <div className="costRow">
              <span>
                👥 Teilnehmer
              </span>

              <strong>
                {eventPeople.length}
              </strong>
            </div>

            <div className="costRow">
              <span>
                💶 Pro Person
              </span>

              <strong>
                {formatEuro(
                  costPerPerson
                )}
              </strong>
            </div>

            <div className="costRow">
              <span>
                💰 Bereits bezahlt
              </span>

              <strong>
                {formatEuro(
                  totalPayments
                )}
              </strong>
            </div>

            <div className="costRow">
              <span>
                🔴 Noch offen
              </span>

              <strong>
                {formatEuro(
                  Math.max(
                    0,
                    totalCost -
                      totalPayments
                  )
                )}
              </strong>
            </div>

            <div className="hintBox">
              {currentEvent.auto_split_costs
                ? "Die Kosten werden automatisch gleichmäßig auf die Teilnehmer verteilt."
                : "Die automatische Kostenaufteilung ist deaktiviert."}
            </div>
          </section>
        )}

        {/* =================================================
            PERSONAL COSTS
        ================================================= */}

        {currentProfileId &&
          currentEvent?.show_costs && (
            <section className="card">
              <h2>
                👤 Meine Kosten
              </h2>

              {(() => {
                const mine =
                  personCost(
                    currentProfileId
                  );

                const paid =
                  payments
                    .filter(
                      (payment) =>
                        payment.profile_id ===
                        currentProfileId
                    )
                    .reduce(
                      (
                        sum,
                        payment
                      ) =>
                        sum +
                        numberValue(
                          payment.betrag
                        ),
                      0
                    );

                return (
                  <>
                    <div className="personalGrid">
                      <div>
                        <span>
                          🍺 Getränke
                        </span>

                        <strong>
                          {personDrinkCount(
                            currentProfileId
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          💶 Konsum
                        </span>

                        <strong>
                          {formatEuro(
                            mine
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          💰 Bezahlt
                        </span>

                        <strong>
                          {formatEuro(
                            paid
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          🔴 Offen
                        </span>

                        <strong>
                          {formatEuro(
                            Math.max(
                              0,
                              mine -
                                paid
                            )
                          )}
                        </strong>
                      </div>
                    </div>
                  </>
                );
              })()}
            </section>
          )}

        {/* =================================================
            PAYMENT
        ================================================= */}

        {currentEvent?.show_costs && (
          <section className="card">
            <h2>
              💰 Zahlung erfassen
            </h2>

            <div className="twoColumns">
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

              <select
                value={
                  paymentProfileId
                }
                onChange={(e) =>
                  setPaymentProfileId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Wer bezahlt?
                </option>

                {eventPeople.map(
                  ({
                    profile,
                  }) =>
                    profile && (
                      <option
                        key={
                          profile.id
                        }
                        value={
                          profile.id
                        }
                      >
                        {profile.username}
                      </option>
                    )
                )}
              </select>
            </div>

            <button
              className="primaryButton full"
              onClick={
                addPayment
              }
            >
              💰 Zahlung speichern
            </button>
          </section>
        )}

        {/* =================================================
            PAYMENT HISTORY
        ================================================= */}

        {currentEvent?.show_costs && (
          <section className="card">
            <h2>
              💳 Zahlungen
            </h2>

            {payments.length ===
            0 ? (
              <div className="empty">
                Noch keine Zahlungen.
              </div>
            ) : (
              payments.map(
                (payment) => {
                  const profile =
                    profiles.find(
                      (p) =>
                        p.id ===
                        payment.profile_id
                    );

                  return (
                    <div
                      className="paymentItem"
                      key={
                        payment.id
                      }
                    >
                      <div>
                        <strong>
                          💰{" "}
                          {formatEuro(
                            numberValue(
                              payment.betrag
                            )
                          )}
                        </strong>

                        <small>
                          👤{" "}
                          {profile?.username ||
                            "Unbekannt"}

                          {" · "}

                          {formatDate(
                            payment.created_at
                          )}
                        </small>
                      </div>

                      <button
                        className="deleteButton"
                        onClick={() =>
                          deletePayment(
                            payment.id
                          )
                        }
                      >
                        🗑️
                      </button>
                    </div>
                  );
                }
              )
            )}
          </section>
        )}

        {/* =================================================
            PROMILLE
        ================================================= */}

        {currentEvent?.show_promille && (
          <section className="card">
            <h2>
              🍺 Promilleübersicht
            </h2>

            <div className="warning">
              ⚠️ Die Promillewerte sind nur
              eine mathematische Näherung
              und dürfen nicht zur Beurteilung
              der Fahrtüchtigkeit verwendet
              werden.
            </div>

            {ranking.map(
              (person) => (
                <div
                  className="promilleItem"
                  key={
                    person.member.id
                  }
                >
                  <div>
                    <strong>
                      {
                        person
                          .profile
                          ?.username
                      }
                    </strong>

                    <small>
                      {person.drinks} Getränke ·{" "}
                      {person.liters.toFixed(
                        1
                      )} L
                    </small>
                  </div>

                  <strong>
                    {person.promille.toFixed(
                      2
                    )} ‰
                  </strong>
                </div>
              )
            )}
          </section>
        )}

        {/* =================================================
            EVENT STATISTICS
        ================================================= */}

        {currentEvent?.show_statistics && (
          <section className="card">
            <h2>
              📊 Event-Statistik
            </h2>

            <div className="statisticsGrid">
              <div>
                <span>
                  🍺 Durchschnitt
                </span>

                <strong>
                  {eventPeople.length
                    ? (
                        totalDrinks /
                        eventPeople.length
                      ).toFixed(
                        1
                      )
                    : "0.0"}
                </strong>

                <small>
                  Getränke / Person
                </small>
              </div>

              <div>
                <span>
                  💧 Durchschnitt
                </span>

                <strong>
                  {eventPeople.length
                    ? (
                        totalLiters /
                        eventPeople.length
                      ).toFixed(
                        1
                      )
                    : "0.0"}
                </strong>

                <small>
                  Liter / Person
                </small>
              </div>

              <div>
                <span>
                  💶 Durchschnitt
                </span>

                <strong>
                  {eventPeople.length
                    ? formatEuro(
                        totalCost /
                          eventPeople.length
                      )
                    : "0,00 €"}
                </strong>

                <small>
                  Kosten / Person
                </small>
              </div>

              <div>
                <span>
                  🏆 Punkte
                </span>

                <strong>
                  {ranking.reduce(
                    (
                      sum,
                      person
                    ) =>
                      sum +
                      person.points,
                    0
                  )}
                </strong>

                <small>
                  Gesamtpunkte
                </small>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            EVENT SETTINGS
        ================================================= */}

        {currentEvent && (
          <section className="card">
            <div className="sectionHeader">
              <div>
                <h2>
                  ⚙️ Event-Einstellungen
                </h2>

                <p>
                  Funktionen für dieses Event
                </p>
              </div>

              <button
                className="smallButton"
                onClick={() =>
                  setShowSettings(
                    !showSettings
                  )
                }
              >
                {showSettings
                  ? "Schließen"
                  : "Öffnen"}
              </button>
            </div>

            {showSettings && (
              <div className="settings">

                <SettingRow
                  title="🏆 Ranking"
                  description="Teilnehmer können miteinander verglichen werden."
                  value={
                    !!currentEvent.ranking_enabled
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "ranking_enabled",
                      value
                    )
                  }
                />

                <SettingRow
                  title="⭐ Punkte anzeigen"
                  description="Punktestand der Teilnehmer anzeigen."
                  value={
                    !!currentEvent.show_points
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "show_points",
                      value
                    )
                  }
                />

                <SettingRow
                  title="🏆 Ranking anzeigen"
                  description="Das Ranking im Event anzeigen."
                  value={
                    !!currentEvent.show_ranking
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "show_ranking",
                      value
                    )
                  }
                />

                <SettingRow
                  title="🍺 Promille anzeigen"
                  description="Promille-Näherung anzeigen."
                  value={
                    !!currentEvent.show_promille
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "show_promille",
                      value
                    )
                  }
                />

                <SettingRow
                  title="📊 Statistiken"
                  description="Event-Statistiken anzeigen."
                  value={
                    !!currentEvent.show_statistics
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "show_statistics",
                      value
                    )
                  }
                />

                <SettingRow
                  title="🍺 Getränkemengen"
                  description="Liter und Mengen anzeigen."
                  value={
                    !!currentEvent.show_drink_amounts
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "show_drink_amounts",
                      value
                    )
                  }
                />

                <SettingRow
                  title="💶 Kostenübersicht"
                  description="Kosten des Events anzeigen."
                  value={
                    !!currentEvent.cost_overview_enabled
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "cost_overview_enabled",
                      value
                    )
                  }
                />

                <SettingRow
                  title="💰 Automatische Kostenaufteilung"
                  description="Kosten automatisch auf Teilnehmer verteilen."
                  value={
                    !!currentEvent.auto_split_costs
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "auto_split_costs",
                      value
                    )
                  }
                />

                <SettingRow
                  title="📷 Fotos"
                  description="Fotos im Event erlauben."
                  value={
                    !!currentEvent.show_photos
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "show_photos",
                      value
                    )
                  }
                />

                <SettingRow
                  title="🤖 KI-Erkennung"
                  description="Getränkeerkennung über Bilder vorbereiten."
                  value={
                    !!currentEvent.ai_recognition_enabled
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "ai_recognition_enabled",
                      value
                    )
                  }
                />

                <SettingRow
                  title="✏️ Manuelle Eingabe"
                  description="Getränke manuell erfassen."
                  value={
                    !!currentEvent.manual_entry_allowed
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "manual_entry_allowed",
                      value
                    )
                  }
                />

                <SettingRow
                  title="👥 Team-Modus"
                  description="Team-Modus für das Event aktivieren."
                  value={
                    !!currentEvent.team_mode
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "team_mode",
                      value
                    )
                  }
                />

                <SettingRow
                  title="🔒 Datenschutzmodus"
                  description="Zusätzliche Privatsphäre im Event."
                  value={
                    !!currentEvent.privacy_mode
                  }
                  onChange={(value) =>
                    updateEventSetting(
                      "privacy_mode",
                      value
                    )
                  }
                />

              </div>
            )}
          </section>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="loading">
            🔄 Daten werden geladen...
          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer>
          <strong>
            🍻 Güstener Zapfhahn Zentrale
          </strong>

          <small>
            Dein Event. Deine Getränke.
            Deine Runde.
          </small>
        </footer>

      </div>

      {/* =====================================================
          CSS
      ===================================================== */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top,
              #26384b 0%,
              #111821 42%,
              #070a0e 100%
            );
          color: #fff;
          padding: 15px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 950px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 3px 25px;
        }

        .logo {
          width: 62px;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 20px;
          flex-shrink: 0;
        }

        .headerText {
          flex: 1;
        }

        h1 {
          font-size: 25px;
          margin: 0;
          line-height: 1.2;
        }

        h2 {
          margin: 0 0 5px;
          font-size: 20px;
        }

        p {
          color: #9aa7b5;
          margin: 5px 0;
          line-height: 1.45;
        }

        .refreshButton {
          width: 45px;
          height: 45px;
          border: none;
          border-radius: 14px;
          background: rgba(255,255,255,.08);
          color: white;
          font-size: 20px;
          cursor: pointer;
        }

        .card {
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 20px;
          padding: 18px;
          margin-bottom: 14px;
          backdrop-filter: blur(8px);
        }

        .highlightCard {
          border-color: rgba(245,158,11,.35);
          background: rgba(245,158,11,.055);
        }

        .sectionHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .message {
          background: #172230;
          border: 1px solid #344454;
          color: #fbbf24;
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 14px;
          line-height: 1.4;
        }

        .eventInfo {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .eventInfo div {
          background: rgba(255,255,255,.05);
          padding: 9px 11px;
          border-radius: 10px;
          color: #aab5c0;
          font-size: 13px;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid #303b47;
          background: #131b24;
          color: white;
          border-radius: 12px;
          padding: 13px;
          margin-bottom: 10px;
          outline: none;
          font-size: 15px;
        }

        textarea {
          min-height: 85px;
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #f59e0b;
        }

        input[type="checkbox"] {
          width: auto;
          margin: 0;
        }

        label {
          display: block;
          color: #aab5c0;
          font-size: 12px;
          margin-bottom: 5px;
        }

        button {
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          background: #f59e0b;
          color: #111;
          font-weight: 700;
          cursor: pointer;
          transition: .15s;
        }

        button:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .primaryButton {
          background: #f59e0b;
          color: #111;
        }

        .smallButton {
          padding: 9px 12px;
          font-size: 13px;
        }

        .full {
          width: 100%;
        }

        .inlineForm {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .inlineForm input {
          margin: 0;
        }

        .inviteBox {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: rgba(245,158,11,.08);
          border: 1px solid rgba(245,158,11,.25);
          border-radius: 14px;
          padding: 13px;
          margin-top: 10px;
        }

        .inviteBox small {
          display: block;
          color: #9ca8b5;
          margin-bottom: 4px;
        }

        .inviteBox strong {
          font-size: 22px;
          letter-spacing: 3px;
          color: #fbbf24;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .stat {
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 17px;
          padding: 14px;
          text-align: center;
        }

        .stat span {
          display: block;
          font-size: 23px;
        }

        .stat strong {
          display: block;
          font-size: 21px;
          margin: 5px 0;
        }

        .stat small {
          color: #8995a3;
          font-size: 11px;
        }

        .twoColumns {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 9px;
        }

        .threeColumns {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
        }

        .addBox {
          background: rgba(255,255,255,.04);
          border-radius: 14px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .personItem {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,.045);
          padding: 11px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .personAvatar {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(255,255,255,.07);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .personInfo {
          flex: 1;
          min-width: 0;
        }

        .personInfo strong {
          display: block;
        }

        .personInfo small {
          display: block;
          color: #8f9ba8;
          margin-top: 4px;
        }

        .promilleSmall {
          font-weight: bold;
          color: #fbbf24;
        }

        .deleteButton {
          background: #303944;
          color: white;
          padding: 8px 11px;
        }

        .checkboxLine {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #aeb8c2;
          margin: 5px 0 13px;
          cursor: pointer;
        }

        .drinkAssignment {
          display: grid;
          grid-template-columns: 1fr 230px auto;
          align-items: center;
          gap: 9px;
          background: rgba(255,255,255,.045);
          border-radius: 14px;
          padding: 11px;
          margin-top: 8px;
        }

        .drinkAssignment strong {
          display: block;
        }

        .drinkAssignment small {
          display: block;
          color: #8f9ba8;
          margin-top: 4px;
        }

        .drinkAssignment select {
          margin: 0;
        }

        .assigned {
          display: inline-block;
          color: #fbbf24;
          font-size: 12px;
          margin-top: 5px;
        }

        .drinkItem {
          display: flex;
          align-items: center;
          gap: 11px;
          background: rgba(255,255,255,.045);
          border-radius: 14px;
          padding: 12px;
          margin-top: 8px;
        }

        .drinkIcon {
          width: 43px;
          height: 43px;
          border-radius: 12px;
          background: rgba(255,255,255,.07);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .drinkInfo {
          flex: 1;
          min-width: 0;
        }

        .drinkInfo strong {
          display: block;
        }

        .drinkInfo small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
        }

        .drinkPrice {
          font-weight: bold;
          color: #fbbf24;
        }

        .rankingItem {
          display: grid;
          grid-template-columns: 45px 1fr auto;
          gap: 10px;
          align-items: center;
          background: rgba(255,255,255,.045);
          border-radius: 14px;
          padding: 13px;
          margin-top: 8px;
        }

        .rankingItem.first {
          border: 1px solid rgba(245,158,11,.3);
          background: rgba(245,158,11,.08);
        }

        .rankNumber {
          font-size: 22px;
          text-align: center;
        }

        .rankName strong {
          display: block;
        }

        .rankName small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
        }

        .points {
          font-weight: bold;
          color: #fbbf24;
        }

        .costCard {
          text-align: center;
        }

        .bigAmount {
          font-size: 40px;
          font-weight: 800;
          color: #fbbf24;
          margin-top: 5px;
        }

        .costRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,.045);
          padding: 13px;
          border-radius: 12px;
          margin-top: 8px;
        }

        .hintBox {
          background: rgba(255,255,255,.04);
          color: #8f9ba8;
          padding: 11px;
          border-radius: 12px;
          margin-top: 12px;
          font-size: 12px;
        }

        .personalGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .personalGrid > div {
          background: rgba(255,255,255,.045);
          border-radius: 13px;
          padding: 12px;
          text-align: center;
        }

        .personalGrid span,
        .statisticsGrid span {
          display: block;
          color: #8f9ba8;
          font-size: 12px;
        }

        .personalGrid strong,
        .statisticsGrid strong {
          display: block;
          font-size: 18px;
          margin-top: 6px;
        }

        .paymentItem {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,.045);
          border-radius: 14px;
          padding: 12px;
          margin-top: 8px;
        }

        .paymentItem strong {
          display: block;
          color: #fbbf24;
        }

        .paymentItem small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
        }

        .promilleItem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,.045);
          border-radius: 14px;
          padding: 13px;
          margin-top: 8px;
        }

        .promilleItem strong {
          color: #fbbf24;
        }

        .promilleItem small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
        }

        .warning {
          background: rgba(239,68,68,.09);
          border: 1px solid rgba(239,68,68,.2);
          color: #fca5a5;
          padding: 12px;
          border-radius: 12px;
          font-size: 12px;
          line-height: 1.45;
          margin-bottom: 10px;
        }

        .statisticsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .statisticsGrid > div {
          background: rgba(255,255,255,.045);
          padding: 13px;
          border-radius: 13px;
          text-align: center;
        }

        .statisticsGrid small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
          font-size: 11px;
        }

        .settings {
          margin-top: 10px;
        }

        .settingRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 13px 0;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        .settingRow:last-child {
          border-bottom: none;
        }

        .settingText {
          flex: 1;
        }

        .settingText strong {
          display: block;
        }

        .settingText small {
          display: block;
          color: #8995a3;
          margin-top: 4px;
          line-height: 1.35;
        }

        .switch {
          width: 50px;
          height: 28px;
          padding: 3px;
          border-radius: 20px;
          background: #303944;
          flex-shrink: 0;
          transition: .2s;
        }

        .switch.active {
          background: #f59e0b;
        }

        .switchKnob {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          transition: .2s;
        }

        .switch.active .switchKnob {
          transform: translateX(22px);
        }

        .empty {
          text-align: center;
          color: #7f8a97;
          padding: 20px 10px;
        }

        .loading {
          text-align: center;
          color: #fbbf24;
          padding: 15px;
        }

        footer {
          text-align: center;
          color: #65717f;
          padding: 30px 10px;
        }

        footer strong {
          display: block;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        @media (max-width: 750px) {

          .statsGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .personalGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .statisticsGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .drinkAssignment {
            grid-template-columns: 1fr;
          }

          .drinkAssignment select {
            margin-top: 3px;
          }
        }

        @media (max-width: 600px) {

          .page {
            padding: 10px;
          }

          .header {
            padding-bottom: 18px;
          }

          h1 {
            font-size: 21px;
          }

          h2 {
            font-size: 18px;
          }

          .card {
            padding: 14px;
            border-radius: 17px;
          }

          .twoColumns,
          .threeColumns {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .inlineForm {
            grid-template-columns: 1fr;
          }

          .inlineForm input {
            margin-bottom: 8px;
          }

          .rankingItem {
            grid-template-columns: 40px 1fr;
          }

          .points {
            grid-column: 2;
          }

          .inviteBox {
            align-items: flex-start;
            flex-direction: column;
          }

          .bigAmount {
            font-size: 34px;
          }

          .personItem {
            flex-wrap: wrap;
          }

          .promilleSmall {
            margin-left: 52px;
          }
        }

      `}</style>
    </main>
  );
}

/* =========================================================
   SETTING COMPONENT
========================================================= */

function SettingRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="settingRow">
      <div className="settingText">
        <strong>
          {title}
        </strong>

        <small>
          {description}
        </small>
      </div>

      <button
        type="button"
        className={
          "switch " +
          (value
            ? "active"
            : "")
        }
        onClick={() =>
          onChange(!value)
        }
        aria-label={
          title
        }
      >
        <div className="switchKnob" />
      </button>
    </div>
  );
}
