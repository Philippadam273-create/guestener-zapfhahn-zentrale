"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/* =========================================================
   TYPES
========================================================= */

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

  created_by_profile_id?: string | null;
  created_at?: string | null;
};

type Profile = {
  id: string;
  user_id?: string | null;
  username?: string | null;
  role?: string | null;

  points?: number | null;
  drinks_count?: number | null;

  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;

  gewicht_kg?: number | null;
  alter?: number | null;
  geschlecht?: string | null;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string | null;
  gender_factor?: number | null;
  joined_via_code?: string | null;

  profile?: Profile | null;
};

type Drink = {
  id: string;
  event_id: string;
  profile_id?: string | null;

  category?: string | null;
  drink_name?: string | null;
  brand?: string | null;

  liters?: number | null;
  alcohol_percent?: number | null;
  quantity?: number | null;

  image?: string | null;
  comment?: string | null;
  created_at?: string | null;

  image_path?: string | null;
  ai_detected?: boolean | null;
  detected_brand?: string | null;
  detected_alcohol_percent?: number | null;

  paid_by?: string | null;
  shared_cost?: boolean | null;

  marke?: string | null;
  bezahlt_von?: string | null;

  promille_wert?: number | null;

  getraenk?: string | null;
  menge?: number | null;
  alkohol?: number | null;
  preis?: number | null;
  foto?: string | null;
};

type Payment = {
  id: string;
  event_id: string;
  betrag?: number | null;
  created_at?: string | null;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string | null;
};

type ParticipantStats = {
  drinks: number;
  liters: number;
  alcohol: number;
  cost: number;
  points: number;
  promille: number;
};

type MessageType = "success" | "error" | "info";

type Message = {
  text: string;
  type: MessageType;
};

/* =========================================================
   HELPERS
========================================================= */

function numberValue(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(value: number): string {
  return value.toFixed(2) + " €";
}

function liters(value: number): string {
  return value.toFixed(2) + " L";
}

function getDrinkName(drink: Drink): string {
  return (
    drink.drink_name ||
    drink.getraenk ||
    drink.detected_brand ||
    drink.marke ||
    "Getränk"
  );
}

function getDrinkBrand(drink: Drink): string {
  return (
    drink.brand ||
    drink.marke ||
    drink.detected_brand ||
    ""
  );
}

function getDrinkLiters(drink: Drink): number {
  return numberValue(
    drink.liters ??
      drink.menge ??
      0
  );
}

function getDrinkAlcohol(drink: Drink): number {
  return numberValue(
    drink.alcohol_percent ??
      drink.alkohol ??
      drink.detected_alcohol_percent ??
      0
  );
}

function getDrinkPrice(drink: Drink): number {
  return numberValue(drink.preis ?? 0);
}

function getProfileWeight(profile?: Profile | null): number {
  if (!profile) return 0;

  return numberValue(
    profile.weight_kg ??
      profile.gewicht_kg ??
      0
  );
}

function getProfileHeight(profile?: Profile | null): number {
  if (!profile) return 0;

  return numberValue(
    profile.height_cm ??
      0
  );
}

function getProfileAge(profile?: Profile | null): number {
  if (!profile) return 0;

  return numberValue(
    profile.age ??
      profile.alter ??
      0
  );
}

function getProfileGender(profile?: Profile | null): string {
  if (!profile) return "";

  return (
    profile.gender ||
    profile.geschlecht ||
    ""
  );
}

/*
  Vereinfachte Widmark-Berechnung.

  Alkohol in Gramm:
  Liter × Alkoholanteil × 0,789 × 1000

  Promille:
  Alkoholgramm / (Gewicht × Reduktionsfaktor)

  Die Berechnung dient ausschließlich als grobe
  Schätzung und ersetzt keine medizinische Messung.
*/
function calculatePromille(
  drinkList: Drink[],
  profile?: Profile | null
): number {
  if (!profile) return 0;

  const weight = getProfileWeight(profile);

  if (weight <= 0) {
    return 0;
  }

  let alcoholGrams = 0;

  for (const drink of drinkList) {
    const quantity = numberValue(
      drink.quantity ?? 1
    );

    const volume = getDrinkLiters(drink);
    const alcohol = getDrinkAlcohol(drink);

    alcoholGrams +=
      volume *
      (alcohol / 100) *
      0.789 *
      1000 *
      quantity;
  }

  let factor = 0.68;

  const gender =
    getProfileGender(profile).toLowerCase();

  if (
    gender === "weiblich" ||
    gender === "female" ||
    gender === "f"
  ) {
    factor = 0.55;
  }

  const result =
    alcoholGrams /
    (weight * factor);

  return Number(result.toFixed(2));
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Home() {
  /* =======================================================
     AUTH / PROFILE
  ======================================================= */

  const [currentUserId, setCurrentUserId] =
    useState<string>("");

  const [currentProfile, setCurrentProfile] =
    useState<Profile | null>(null);

  /* =======================================================
     EVENTS
  ======================================================= */

  const [events, setEvents] =
    useState<EventRow[]>([]);

  const [selectedEventId, setSelectedEventId] =
    useState<string>("");

  const [eventLoading, setEventLoading] =
    useState(false);

  /* =======================================================
     EVENT CREATION
  ======================================================= */

  const [newEventTitle, setNewEventTitle] =
    useState("");

  const [newEventDescription, setNewEventDescription] =
    useState("");

  const [newEventLocation, setNewEventLocation] =
    useState("");

  const [newEventStart, setNewEventStart] =
    useState("");

  const [newEventEnd, setNewEventEnd] =
    useState("");

  /* =======================================================
     INVITE
  ======================================================= */

  const [inviteCode, setInviteCode] =
    useState("");

  /* =======================================================
     EVENT DATA
  ======================================================= */

  const [eventMembers, setEventMembers] =
    useState<EventMember[]>([]);

  const [drinks, setDrinks] =
    useState<Drink[]>([]);

  const [payments, setPayments] =
    useState<Payment[]>([]);

  /* =======================================================
     DRINK FORM
  ======================================================= */

  const [drinkName, setDrinkName] =
    useState("");

  const [drinkBrand, setDrinkBrand] =
    useState("");

  const [drinkCategory, setDrinkCategory] =
    useState("Bier");

  const [drinkLiters, setDrinkLiters] =
    useState("0.5");

  const [drinkAlcohol, setDrinkAlcohol] =
    useState("5");

  const [drinkPrice, setDrinkPrice] =
    useState("0");

  const [drinkQuantity, setDrinkQuantity] =
    useState("1");

  const [drinkComment, setDrinkComment] =
    useState("");

  const [drinkSharedCost, setDrinkSharedCost] =
    useState(true);

  /* =======================================================
     PAYMENT FORM
  ======================================================= */

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentStatus, setPaymentStatus] =
    useState("bezahlt");

  /* =======================================================
     PROFILE FORM
  ======================================================= */

  const [profileUsername, setProfileUsername] =
    useState("");

  const [profileWeight, setProfileWeight] =
    useState("");

  const [profileHeight, setProfileHeight] =
    useState("");

  const [profileAge, setProfileAge] =
    useState("");

  const [profileGender, setProfileGender] =
    useState("");

  /* =======================================================
     UI
  ======================================================= */

  const [message, setMessage] =
    useState<Message | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState("dashboard");

  const [showCreateEvent, setShowCreateEvent] =
    useState(false);

  const [showProfile, setShowProfile] =
    useState(false);

  const [showInvite, setShowInvite] =
    useState(false);

  const [showPayment, setShowPayment] =
    useState(false);

  /* =======================================================
     SELECTED EVENT
  ======================================================= */

  const selectedEvent = useMemo(() => {
    return events.find(
      (event) =>
        event.id === selectedEventId
    ) || null;
  }, [
    events,
    selectedEventId
  ]);

  /* =======================================================
     MESSAGE
  ======================================================= */

  function showMessage(
    text: string,
    type: MessageType = "info"
  ) {
    setMessage({
      text,
      type
    });

    window.setTimeout(() => {
      setMessage(null);
    }, 4500);
  }

  /* =======================================================
     LOAD CURRENT USER
  ======================================================= */

  async function loadCurrentUser() {
    try {
      const {
        data,
        error
      } =
        await supabase.auth.getUser();

      if (error) {
        console.error(error);
        return;
      }

      if (!data.user) {
        return;
      }

      setCurrentUserId(
        data.user.id
      );

      const {
        data: profile,
        error: profileError
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq(
            "user_id",
            data.user.id
          )
          .maybeSingle();

      if (
        profileError
      ) {
        console.error(
          profileError
        );
        return;
      }

      if (profile) {
        setCurrentProfile(
          profile
        );

        setProfileUsername(
          profile.username ||
            ""
        );

        setProfileWeight(
          String(
            profile.weight_kg ??
              profile.gewicht_kg ??
              ""
          )
        );

        setProfileHeight(
          String(
            profile.height_cm ??
              ""
          )
        );

        setProfileAge(
          String(
            profile.age ??
              profile.alter ??
              ""
          )
        );

        setProfileGender(
          profile.gender ??
            profile.geschlecht ??
            ""
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  /* =======================================================
     LOAD EVENTS
  ======================================================= */

  async function loadEvents(
    selectFirst = false
  ) {
    setEventLoading(true);

    try {
      const {
        data,
        error
      } =
        await supabase
          .from("events")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          );

      if (error) {
        console.error(error);

        showMessage(
          "Events konnten nicht geladen werden: " +
            error.message,
          "error"
        );

        return;
      }

      const eventList =
        (data ||
          []) as EventRow[];

      setEvents(
        eventList
      );

      if (
        selectFirst &&
        eventList.length > 0
      ) {
        setSelectedEventId(
          eventList[0].id
        );
      }

      if (
        selectedEventId &&
        !eventList.some(
          (event) =>
            event.id ===
            selectedEventId
        )
      ) {
        setSelectedEventId(
          eventList[0]?.id ||
            ""
        );
      }
    } finally {
      setEventLoading(false);
    }
  }

  /* =======================================================
     LOAD EVENT MEMBERS
  ======================================================= */

  async function loadMembers() {
    if (!selectedEventId) {
      setEventMembers([]);
      return;
    }

    const {
      data,
      error
    } =
      await supabase
        .from("event_members")
        .select(
          `
          *,
          profile:profiles(*)
          `
        )
        .eq(
          "event_id",
          selectedEventId
        )
        .order(
          "joined_at",
          {
            ascending: true
          }
        );

    if (error) {
      console.error(error);

      showMessage(
        "Teilnehmer konnten nicht geladen werden: " +
          error.message,
        "error"
      );

      return;
    }

    setEventMembers(
      (data ||
        []) as EventMember[]
    );
  }

  /* =======================================================
     LOAD DRINKS
  ======================================================= */

  async function loadDrinks() {
    if (!selectedEventId) {
      setDrinks([]);
      return;
    }

    const {
      data,
      error
    } =
      await supabase
        .from("drinks")
        .select("*")
        .eq(
          "event_id",
          selectedEventId
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {
      console.error(error);

      showMessage(
        "Getränke konnten nicht geladen werden: " +
          error.message,
        "error"
      );

      return;
    }

    setDrinks(
      (data ||
        []) as Drink[]
    );
  }

  /* =======================================================
     LOAD PAYMENTS
  ======================================================= */

  async function loadPayments() {
    if (!selectedEventId) {
      setPayments([]);
      return;
    }

    const {
      data,
      error
    } =
      await supabase
        .from("payments")
        .select("*")
        .eq(
          "event_id",
          selectedEventId
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {
      console.error(error);

      showMessage(
        "Zahlungen konnten nicht geladen werden: " +
          error.message,
        "error"
      );

      return;
    }

    setPayments(
      (data ||
        []) as Payment[]
    );
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadCurrentUser();
    loadEvents(true);
  }, []);

  /* =======================================================
     EVENT CHANGE
  ======================================================= */

  useEffect(() => {
    if (!selectedEventId) {
      setEventMembers([]);
      setDrinks([]);
      setPayments([]);
      return;
    }

    loadMembers();
    loadDrinks();
    loadPayments();
  }, [
    selectedEventId
  ]);

  /* =======================================================
     CREATE EVENT
  ======================================================= */

  async function createEvent() {
    if (!newEventTitle.trim()) {
      showMessage(
        "Bitte einen Eventnamen eingeben.",
        "error"
      );
      return;
    }

    if (
      !currentProfile?.id
    ) {
      showMessage(
        "Dein Benutzerprofil wurde nicht gefunden.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const code =
        Math.random()
          .toString(36)
          .substring(
            2,
            8
          )
          .toUpperCase();

      const {
        data,
        error
      } =
        await supabase
          .from("events")
          .insert({
            title:
              newEventTitle.trim(),

            description:
              newEventDescription.trim() ||
              null,

            location:
              newEventLocation.trim() ||
              null,

            invite_code:
              code,

            start_date:
              newEventStart ||
              null,

            end_date:
              newEventEnd ||
              null,

            is_active:
              true,

            ranking_enabled:
              true,

            show_points:
              true,

            show_ranking:
              true,

            show_promille:
              true,

            show_statistics:
              true,

            show_drink_amounts:
              true,

            photo_required:
              false,

            ai_recognition_enabled:
              false,

            manual_entry_allowed:
              true,

            cost_overview_enabled:
              true,

            auto_split_costs:
              true,

            team_mode:
              false,

            show_photos:
              true,

            show_costs:
              true,

            privacy_mode:
              false,

            created_by_profile_id:
              currentProfile.id
          })
          .select("*")
          .single();

      if (error) {
        throw error;
      }

      /*
        Ersteller automatisch als
        Event-Mitglied hinzufügen.
      */

      const {
        error: memberError
      } =
        await supabase
          .from("event_members")
          .insert({
            event_id:
              data.id,

            profile_id:
              currentProfile.id,

            joined_via_code:
              code
          });

      if (memberError) {
        console.error(
          memberError
        );
      }

      showMessage(
        "Event erfolgreich erstellt.",
        "success"
      );

      setNewEventTitle("");
      setNewEventDescription("");
      setNewEventLocation("");
      setNewEventStart("");
      setNewEventEnd("");

      setShowCreateEvent(
        false
      );

      await loadEvents();

      setSelectedEventId(
        data.id
      );
    } catch (error: any) {
      showMessage(
        "Event konnte nicht erstellt werden: " +
          (error?.message ||
            "Unbekannter Fehler"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     JOIN EVENT WITH INVITE CODE
  ======================================================= */

  async function joinEvent() {
    if (!inviteCode.trim()) {
      showMessage(
        "Bitte einen Einladungscode eingeben.",
        "error"
      );
      return;
    }

    if (
      !currentProfile?.id
    ) {
      showMessage(
        "Dein Benutzerprofil wurde nicht gefunden.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: event,
        error: eventError
      } =
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

      if (eventError) {
        throw eventError;
      }

      if (!event) {
        showMessage(
          "Kein Event mit diesem Einladungscode gefunden.",
          "error"
        );
        return;
      }

      const {
        data: existing
      } =
        await supabase
          .from("event_members")
          .select("id")
          .eq(
            "event_id",
            event.id
          )
          .eq(
            "profile_id",
            currentProfile.id
          )
          .maybeSingle();

      if (existing) {
        showMessage(
          "Du bist bereits Teilnehmer dieses Events.",
          "info"
        );

        setSelectedEventId(
          event.id
        );

        return;
      }

      const {
        error: insertError
      } =
        await supabase
          .from("event_members")
          .insert({
            event_id:
              event.id,

            profile_id:
              currentProfile.id,

            joined_via_code:
              inviteCode
                .trim()
                .toUpperCase()
          });

      if (insertError) {
        throw insertError;
      }

      showMessage(
        "Du bist dem Event erfolgreich beigetreten.",
        "success"
      );

      setInviteCode("");
      setShowInvite(false);

      await loadEvents();

      setSelectedEventId(
        event.id
      );
    } catch (error: any) {
      showMessage(
        "Beitritt fehlgeschlagen: " +
          (error?.message ||
            "Unbekannter Fehler"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  async function saveProfile() {
    if (!currentProfile?.id) {
      showMessage(
        "Profil nicht gefunden.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const {
        error
      } =
        await supabase
          .from("profiles")
          .update({
            username:
              profileUsername.trim(),

            weight_kg:
              numberValue(
                profileWeight
              ) || null,

            gewicht_kg:
              numberValue(
                profileWeight
              ) || null,

            height_cm:
              numberValue(
                profileHeight
              ) || null,

            age:
              numberValue(
                profileAge
              ) || null,

            alter:
              numberValue(
                profileAge
              ) || null,

            gender:
              profileGender ||
              null,

            geschlecht:
              profileGender ||
              null
          })
          .eq(
            "id",
            currentProfile.id
          );

      if (error) {
        throw error;
      }

      setCurrentProfile({
        ...currentProfile,

        username:
          profileUsername.trim(),

        weight_kg:
          numberValue(
            profileWeight
          ),

        gewicht_kg:
          numberValue(
            profileWeight
          ),

        height_cm:
          numberValue(
            profileHeight
          ),

        age:
          numberValue(
            profileAge
          ),

        alter:
          numberValue(
            profileAge
          ),

        gender:
          profileGender,

        geschlecht:
          profileGender
      });

      showMessage(
        "Profil gespeichert.",
        "success"
      );
    } catch (error: any) {
      showMessage(
        "Profil konnte nicht gespeichert werden: " +
          (error?.message ||
            "Unbekannter Fehler"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     ADD DRINK
  ======================================================= */

  async function addDrink() {
    if (!selectedEventId) {
      showMessage(
        "Bitte zuerst ein Event auswählen.",
        "error"
      );
      return;
    }

    if (!drinkName.trim()) {
      showMessage(
        "Bitte einen Getränkenamen eingeben.",
        "error"
      );
      return;
    }

    if (
      !selectedEvent?.manual_entry_allowed &&
      !selectedEvent?.ai_recognition_enabled
    ) {
      showMessage(
        "Manuelle Getränkeeingabe ist für dieses Event deaktiviert.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const quantity =
        Math.max(
          1,
          Math.round(
            numberValue(
              drinkQuantity
            )
          )
        );

      const litersValue =
        numberValue(
          drinkLiters
        );

      const alcoholValue =
        numberValue(
          drinkAlcohol
        );

      const priceValue =
        numberValue(
          drinkPrice
        );

      const insertData = {
        event_id:
          selectedEventId,

        profile_id:
          currentProfile?.id ||
          null,

        category:
          drinkCategory,

        drink_name:
          drinkName.trim(),

        brand:
          drinkBrand.trim() ||
          null,

        liters:
          litersValue,

        alcohol_percent:
          alcoholValue,

        quantity,

        comment:
          drinkComment.trim() ||
          null,

        ai_detected:
          false,

        detected_brand:
          null,

        detected_alcohol_percent:
          null,

        paid_by:
          currentProfile?.id ||
          null,

        shared_cost:
          drinkSharedCost,

        marke:
          drinkBrand.trim() ||
          null,

        bezahlt_von:
          currentProfile?.id ||
          null,

        promille_wert:
          null,

        getraenk:
          drinkName.trim(),

        menge:
          litersValue,

        alkohol:
          alcoholValue,

        preis:
          priceValue,

        foto:
          null
      };

      const {
        error
      } =
        await supabase
          .from("drinks")
          .insert(
            insertData
          );

      if (error) {
        throw error;
      }

      showMessage(
        "Getränk erfolgreich gespeichert.",
        "success"
      );

      setDrinkName("");
      setDrinkBrand("");
      setDrinkLiters("0.5");
      setDrinkAlcohol("5");
      setDrinkPrice("0");
      setDrinkQuantity("1");
      setDrinkComment("");
      setDrinkSharedCost(true);

      await loadDrinks();
    } catch (error: any) {
      showMessage(
        "Getränk konnte nicht gespeichert werden: " +
          (error?.message ||
            "Unbekannter Fehler"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     DELETE DRINK
  ======================================================= */

  async function deleteDrink(
    drinkId: string
  ) {
    if (
      !window.confirm(
        "Dieses Getränk wirklich löschen?"
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const {
        error
      } =
        await supabase
          .from("drinks")
          .delete()
          .eq(
            "id",
            drinkId
          );

      if (error) {
        throw error;
      }

      showMessage(
        "Getränk gelöscht.",
        "success"
      );

      await loadDrinks();
    } catch (error: any) {
      showMessage(
        "Getränk konnte nicht gelöscht werden: " +
          (error?.message ||
            "Unbekannter Fehler"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     ADD PAYMENT
  ======================================================= */

  async function addPayment() {
    if (!selectedEventId) {
      showMessage(
        "Bitte zuerst ein Event auswählen.",
        "error"
      );
      return;
    }

    const amount =
      numberValue(
        paymentAmount
      );

    if (amount <= 0) {
      showMessage(
        "Bitte einen gültigen Betrag eingeben.",
        "error"
      );
      return;
    }

    if (
      !currentProfile?.id
    ) {
      showMessage(
        "Dein Profil wurde nicht gefunden.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const {
        error
      } =
        await supabase
          .from("payments")
          .insert({
            event_id:
              selectedEventId,

            betrag:
              amount,

            bezahlt_von:
              currentProfile.id,

            profile_id:
              currentProfile.id,

            status:
              paymentStatus
          });

      if (error) {
        throw error;
      }

      showMessage(
        "Zahlung gespeichert.",
        "success"
      );

      setPaymentAmount("");
      setPaymentStatus(
        "bezahlt"
      );

      setShowPayment(
        false
      );

      await loadPayments();
    } catch (error: any) {
      showMessage(
        "Zahlung konnte nicht gespeichert werden: " +
          (error?.message ||
            "Unbekannter Fehler"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     DELETE PAYMENT
  ======================================================= */

  async function deletePayment(
    paymentId: string
  ) {
    if (
      !window.confirm(
        "Diese Zahlung wirklich löschen?"
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const {
        error
      } =
        await supabase
          .from("payments")
          .delete()
          .eq(
            "id",
            paymentId
          );

      if (error) {
        throw error;
      }

      await loadPayments();

      showMessage(
        "Zahlung gelöscht.",
        "success"
      );
    } catch (error: any) {
      showMessage(
        "Zahlung konnte nicht gelöscht werden: " +
          (error?.message ||
            "Unbekannter Fehler"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     ASSIGN DRINK TO PARTICIPANT
  ======================================================= */

  async function assignDrink(
    drink: Drink,
    member: EventMember
  ) {
    if (!member.profile_id) {
      return;
    }

    setLoading(true);

    try {
      const {
        error
      } =
        await supabase
          .from("drinks")
          .update({
            profile_id:
              member.profile_id
          })
          .eq(
            "id",
            drink.id
          );

      if (error) {
        throw error;
      }

      /*
        Punkte werden hier bewusst
        nicht direkt in profiles erhöht.

        Dadurch vermeiden wir doppelte
        Punktberechnung bei erneutem
        Laden der Seite.
      */

      showMessage(
        `${getDrinkName(drink)} wurde ${member.profile?.username || "Teilnehmer"} zugeordnet.`,
        "success"
      );

      await loadDrinks();
    } catch (error: any) {
      showMessage(
        "Getränk konnte nicht zugeordnet werden: " +
          (error?.message ||
            "Unbekannter Fehler"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     REMOVE PARTICIPANT
  ======================================================= */

  async function removeMember(
    member: EventMember
  ) {
    if (
      !window.confirm(
        "Teilnehmer wirklich aus dem Event entfernen?"
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const {
        error
      } =
        await supabase
          .from("event_members")
          .delete()
          .eq(
            "id",
            member.id
          );

      if (error) {
        throw error;
      }

      await loadMembers();

      showMessage(
        "Teilnehmer entfernt.",
        "success"
      );
    } catch (error: any) {
      showMessage(
        "Teilnehmer konnte nicht entfernt werden: " +
          (error?.message ||
            "Unbekannter Fehler"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     REFRESH EVERYTHING
  ======================================================= */

  async function refreshAll() {
    setLoading(true);

    try {
      await Promise.all([
        loadEvents(),
        loadMembers(),
        loadDrinks(),
        loadPayments()
      ]);

      showMessage(
        "Daten aktualisiert.",
        "success"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const totalDrinkCount =
    drinks.reduce(
      (
        sum,
        drink
      ) =>
        sum +
        numberValue(
          drink.quantity ??
            1
        ),
      0
    );

  const totalLiters =
    drinks.reduce(
      (
        sum,
        drink
      ) =>
        sum +
        getDrinkLiters(
          drink
        ) *
          numberValue(
            drink.quantity ??
              1
          ),
      0
    );

  const totalDrinkCosts =
    drinks.reduce(
      (
        sum,
        drink
      ) =>
        sum +
        getDrinkPrice(
          drink
        ) *
          numberValue(
            drink.quantity ??
              1
          ),
      0
    );

  const totalPayments =
    payments.reduce(
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

  const balance =
    totalPayments -
    totalDrinkCosts;

  const costPerPerson =
    eventMembers.length > 0
      ? totalDrinkCosts /
        eventMembers.length
      : 0;

  /* =======================================================
     PARTICIPANT STATISTICS
  ======================================================= */

  const participantStats =
    useMemo(() => {
      const map =
        new Map<
          string,
          ParticipantStats
        >();

      for (
        const member of eventMembers
      ) {
        map.set(
          member.profile_id,
          {
            drinks: 0,
            liters: 0,
            alcohol: 0,
            cost: 0,
            points: numberValue(
              member.profile
                ?.points
            ),
            promille: 0
          }
        );
      }

      for (
        const drink of drinks
      ) {
        if (
          !drink.profile_id
        ) {
          continue;
        }

        const current =
          map.get(
            drink.profile_id
          );

        if (!current) {
          continue;
        }

        const quantity =
          numberValue(
            drink.quantity ??
              1
          );

        const volume =
          getDrinkLiters(
            drink
          ) *
          quantity;

        const alcohol =
          getDrinkAlcohol(
            drink
          );

        const price =
          getDrinkPrice(
            drink
          ) *
          quantity;

        current.drinks +=
          quantity;

        current.liters +=
          volume;

        current.alcohol +=
          volume *
          (alcohol / 100) *
          0.789 *
          1000;

        current.cost +=
          price;

        current.points +=
          quantity * 10;
      }

      for (
        const member of eventMembers
      ) {
        const current =
          map.get(
            member.profile_id
          );

        if (!current) {
          continue;
        }

        const memberDrinks =
          drinks.filter(
            (drink) =>
              drink.profile_id ===
              member.profile_id
          );

        current.promille =
          calculatePromille(
            memberDrinks,
            member.profile
          );
      }

      return map;
    }, [
      drinks,
      eventMembers
    ]);

  /* =======================================================
     RANKING
  ======================================================= */

  const ranking =
    useMemo(() => {
      return [
        ...eventMembers
      ]
        .map(
          (member) => {
            const stats =
              participantStats.get(
                member.profile_id
              );

            return {
              member,
              points:
                stats?.points ||
                0,

              drinks:
                stats?.drinks ||
                0,

              liters:
                stats?.liters ||
                0,

              promille:
                stats?.promille ||
                0
            };
          }
        )
        .sort(
          (a, b) =>
            b.points -
            a.points
        );
    }, [
      eventMembers,
      participantStats
    ]);

  /* =======================================================
     UNASSIGNED DRINKS
  ======================================================= */

  const unassignedDrinks =
    drinks.filter(
      (drink) =>
        !drink.profile_id
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div className="brand">

          <div className="logo">
            🍻
          </div>

          <div>
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Dein Event. Deine Getränke. Deine Runde.
            </p>
          </div>

        </div>

        <div className="headerActions">

          <button
            className="iconButton"
            onClick={
              refreshAll
            }
            disabled={loading}
          >
            🔄
          </button>

          <button
            className="profileButton"
            onClick={() =>
              setShowProfile(
                !showProfile
              )
            }
          >
            👤
          </button>

        </div>

      </header>

      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (
        <div
          className={
            "message " +
            message.type
          }
        >
          {message.type ===
            "success" && "✅ "}

          {message.type ===
            "error" && "❌ "}

          {message.type ===
            "info" && "ℹ️ "}

          {message.text}
        </div>
      )}

      {/* =================================================
          PROFILE
      ================================================= */}

      {showProfile && (
        <section className="card">

          <div className="sectionHeader">

            <div>
              <h2>
                👤 Mein Profil
              </h2>

              <p>
                Daten für Ranking und Promille-Schätzung
              </p>
            </div>

            <button
              className="secondary"
              onClick={() =>
                setShowProfile(
                  false
                )
              }
            >
              Schließen
            </button>

          </div>

          <div className="grid2">

            <label>
              Benutzername

              <input
                value={
                  profileUsername
                }
                onChange={(e) =>
                  setProfileUsername(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Gewicht in kg

              <input
                type="number"
                value={
                  profileWeight
                }
                onChange={(e) =>
                  setProfileWeight(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Größe in cm

              <input
                type="number"
                value={
                  profileHeight
                }
                onChange={(e) =>
                  setProfileHeight(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Alter

              <input
                type="number"
                value={
                  profileAge
                }
                onChange={(e) =>
                  setProfileAge(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Geschlecht

              <select
                value={
                  profileGender
                }
                onChange={(e) =>
                  setProfileGender(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Bitte auswählen
                </option>

                <option value="männlich">
                  Männlich
                </option>

                <option value="weiblich">
                  Weiblich
                </option>

                <option value="divers">
                  Divers
                </option>
              </select>
            </label>

          </div>

          <button
            className="primary full"
            onClick={
              saveProfile
            }
            disabled={loading}
          >
            💾 Profil speichern
          </button>

        </section>
      )}

      {/* =================================================
          EVENT SELECTOR
      ================================================= */}

      <section className="card">

        <div className="sectionHeader">

          <div>
            <h2>
              📅 Aktuelles Event
            </h2>

            <p>
              Wähle das Event, das du verwalten möchtest.
            </p>
          </div>

          <div className="headerButtons">

            <button
              className="secondary"
              onClick={() =>
                setShowInvite(
                  !showInvite
                )
              }
            >
              🔗 Beitreten
            </button>

            <button
              className="primary"
              onClick={() =>
                setShowCreateEvent(
                  !showCreateEvent
                )
              }
            >
              ➕ Neues Event
            </button>

          </div>

        </div>

        <select
          value={
            selectedEventId
          }
          onChange={(e) =>
            setSelectedEventId(
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
                key={
                  event.id
                }
                value={
                  event.id
                }
              >
                {event.title}
              </option>
            )
          )}

        </select>

        {selectedEvent && (
          <div className="eventInfo">

            <div>
              <strong>
                {selectedEvent.title}
              </strong>

              {selectedEvent.location && (
                <span>
                  📍{" "}
                  {
                    selectedEvent.location
                  }
                </span>
              )}

              {selectedEvent.start_date && (
                <span>
                  📅{" "}
                  {
                    selectedEvent.start_date
                  }
                </span>
              )}
            </div>

            <div className="eventCode">
              🔑{" "}
              {
                selectedEvent.invite_code ||
                "kein Code"
              }
            </div>

          </div>
        )}

      </section>

      {/* =================================================
          CREATE EVENT
      ================================================= */}

      {showCreateEvent && (
        <section className="card">

          <h2>
            ➕ Neues Event erstellen
          </h2>

          <div className="grid2">

            <label>
              Eventname

              <input
                placeholder="z. B. Sommerfest Güsten"
                value={
                  newEventTitle
                }
                onChange={(e) =>
                  setNewEventTitle(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Ort

              <input
                placeholder="z. B. Güsten"
                value={
                  newEventLocation
                }
                onChange={(e) =>
                  setNewEventLocation(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Start

              <input
                type="date"
                value={
                  newEventStart
                }
                onChange={(e) =>
                  setNewEventStart(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Ende

              <input
                type="date"
                value={
                  newEventEnd
                }
                onChange={(e) =>
                  setNewEventEnd(
                    e.target.value
                  )
                }
              />
            </label>

          </div>

          <label>
            Beschreibung

            <textarea
              value={
                newEventDescription
              }
              onChange={(e) =>
                setNewEventDescription(
                  e.target.value
                )
              }
              placeholder="Beschreibung des Events"
            />
          </label>

          <button
            className="primary full"
            onClick={
              createEvent
            }
            disabled={loading}
          >
            🍻 Event erstellen
          </button>

        </section>
      )}

      {/* =================================================
          JOIN EVENT
      ================================================= */}

      {showInvite && (
        <section className="card">

          <h2>
            🔗 Event beitreten
          </h2>

          <p>
            Gib den Einladungscode des Events ein.
          </p>

          <div className="joinRow">

            <input
              placeholder="z. B. AB12CD"
              value={
                inviteCode
              }
              onChange={(e) =>
                setInviteCode(
                  e.target.value
                    .toUpperCase()
                )
              }
            />

            <button
              className="primary"
              onClick={
                joinEvent
              }
              disabled={loading}
            >
              Beitreten
            </button>

          </div>

        </section>
      )}

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="navigation">

        <button
          className={
            activeSection ===
            "dashboard"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "dashboard"
            )
          }
        >
          📊 Dashboard
        </button>

        <button
          className={
            activeSection ===
            "participants"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "participants"
            )
          }
        >
          👥 Teilnehmer
        </button>

        <button
          className={
            activeSection ===
            "drinks"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "drinks"
            )
          }
        >
          🍺 Getränke
        </button>

        <button
          className={
            activeSection ===
            "costs"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "costs"
            )
          }
        >
          💶 Kosten
        </button>

        <button
          className={
            activeSection ===
            "ranking"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "ranking"
            )
          }
        >
          🏆 Ranking
        </button>

      </nav>

      {/* =================================================
          NO EVENT
      ================================================= */}

      {!selectedEvent && (
        <section className="emptyState">

          <div className="emptyIcon">
            🍻
          </div>

          <h2>
            Noch kein Event ausgewählt
          </h2>

          <p>
            Erstelle ein neues Event oder wähle ein vorhandenes Event aus.
          </p>

          <button
            className="primary"
            onClick={() =>
              setShowCreateEvent(
                true
              )
            }
          >
            ➕ Event erstellen
          </button>

        </section>
      )}

      {/* =================================================
          DASHBOARD
      ================================================= */}

      {selectedEvent &&
        activeSection ===
          "dashboard" && (
          <>

            <section className="statsGrid">

              <div className="statCard">
                <span>
                  🍺
                </span>

                <strong>
                  {
                    totalDrinkCount
                  }
                </strong>

                <small>
                  Getränke
                </small>
              </div>

              <div className="statCard">
                <span>
                  💧
                </span>

                <strong>
                  {
                    liters(
                      totalLiters
                    )
                  }
                </strong>

                <small>
                  Liter
                </small>
              </div>

              <div className="statCard">
                <span>
                  💶
                </span>

                <strong>
                  {
                    money(
                      totalDrinkCosts
                    )
                  }
                </strong>

                <small>
                  Getränkekosten
                </small>
              </div>

              <div className="statCard">
                <span>
                  👥
                </span>

                <strong>
                  {
                    eventMembers.length
                  }
                </strong>

                <small>
                  Teilnehmer
                </small>
              </div>

            </section>

            <section className="card">

              <div className="sectionHeader">

                <div>
                  <h2>
                    📊 Event-Übersicht
                  </h2>

                  <p>
                    Alle wichtigen Daten auf einen Blick.
                  </p>
                </div>

              </div>

              <div className="dashboardGrid">

                <div className="dashboardBox">
                  <span>
                    Getränke
                  </span>

                  <strong>
                    {
                      totalDrinkCount
                    }
                  </strong>
                </div>

                <div className="dashboardBox">
                  <span>
                    Verbrauch
                  </span>

                  <strong>
                    {
                      liters(
                        totalLiters
                      )
                    }
                  </strong>
                </div>

                <div className="dashboardBox">
                  <span>
                    Eingezahlt
                  </span>

                  <strong>
                    {
                      money(
                        totalPayments
                      )
                    }
                  </strong>
                </div>

                <div className="dashboardBox">
                  <span>
                    Offen / Differenz
                  </span>

                  <strong
                    className={
                      balance >=
                      0
                        ? "positive"
                        : "negative"
                    }
                  >
                    {
                      money(
                        balance
                      )
                    }
                  </strong>
                </div>

              </div>

            </section>

            <section className="card">

              <h2>
                ⚙️ Event-Einstellungen
              </h2>

              <div className="settingsGrid">

                <div>
                  <span>
                    🏆 Ranking
                  </span>

                  <b>
                    {
                      selectedEvent.ranking_enabled
                        ? "Aktiv"
                        : "Aus"
                    }
                  </b>
                </div>

                <div>
                  <span>
                    📊 Statistiken
                  </span>

                  <b>
                    {
                      selectedEvent.show_statistics
                        ? "Aktiv"
                        : "Aus"
                    }
                  </b>
                </div>

                <div>
                  <span>
                    🍺 Getränkemengen
                  </span>

                  <b>
                    {
                      selectedEvent.show_drink_amounts
                        ? "Aktiv"
                        : "Aus"
                    }
                  </b>
                </div>

                <div>
                  <span>
                    💶 Kosten
                  </span>

                  <b>
                    {
                      selectedEvent.show_costs
                        ? "Aktiv"
                        : "Aus"
                    }
                  </b>
                </div>

                <div>
                  <span>
                    🥃 Promille
                  </span>

                  <b>
                    {
                      selectedEvent.show_promille
                        ? "Aktiv"
                        : "Aus"
                    }
                  </b>
                </div>

                <div>
                  <span>
                    🤖 KI-Erkennung
                  </span>

                  <b>
                    {
                      selectedEvent.ai_recognition_enabled
                        ? "Aktiv"
                        : "Aus"
                    }
                  </b>
                </div>

              </div>

            </section>

          </>
        )}

      {/* =================================================
          PARTICIPANTS
      ================================================= */}

      {selectedEvent &&
        activeSection ===
          "participants" && (
          <section className="card">

            <div className="sectionHeader">

              <div>
                <h2>
                  👥 Teilnehmer
                </h2>

                <p>
                  {
                    eventMembers.length
                  } Teilnehmer im Event.
                </p>
              </div>

            </div>

            {eventMembers.length ===
            0 ? (
              <div className="emptySmall">
                👥 Noch keine Teilnehmer.
              </div>
            ) : (
              <div className="list">

                {eventMembers.map(
                  (member) => {
                    const stats =
                      participantStats.get(
                        member.profile_id
                      );

                    return (
                      <div
                        className="participant"
                        key={
                          member.id
                        }
                      >

                        <div className="avatar">
                          👤
                        </div>

                        <div className="participantMain">

                          <strong>
                            {
                              member.profile
                                ?.username ||
                              "Teilnehmer"
                            }
                          </strong>

                          <small>
                            🍺{" "}
                            {
                              stats?.drinks ||
                              0
                            }{" "}
                            · 💧{" "}
                            {
                              liters(
                                stats?.liters ||
                                  0
                              )
                            }{" "}
                            · 💶{" "}
                            {
                              money(
                                stats?.cost ||
                                  0
                              )
                            }
                          </small>

                        </div>

                        <div className="participantPoints">
                          🏆{" "}
                          {
                            Math.round(
                              stats?.points ||
                                0
                            )
                          }
                        </div>

                        <button
                          className="deleteButton"
                          onClick={() =>
                            removeMember(
                              member
                            )
                          }
                        >
                          ×
                        </button>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>
        )}

      {/* =================================================
          DRINKS
      ================================================= */}

      {selectedEvent &&
        activeSection ===
          "drinks" && (
          <>

            <section className="card">

              <h2>
                🍺 Getränk hinzufügen
              </h2>

              <div className="grid2">

                <label>
                  Getränk

                  <input
                    placeholder="z. B. Krombacher Pils"
                    value={
                      drinkName
                    }
                    onChange={(e) =>
                      setDrinkName(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Marke

                  <input
                    placeholder="z. B. Krombacher"
                    value={
                      drinkBrand
                    }
                    onChange={(e) =>
                      setDrinkBrand(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Kategorie

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
                      Radler
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
                      Wasser
                    </option>

                    <option>
                      Sonstiges
                    </option>
                  </select>
                </label>

                <label>
                  Menge in Liter

                  <input
                    type="number"
                    step="0.01"
                    value={
                      drinkLiters
                    }
                    onChange={(e) =>
                      setDrinkLiters(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Alkohol %

                  <input
                    type="number"
                    step="0.1"
                    value={
                      drinkAlcohol
                    }
                    onChange={(e) =>
                      setDrinkAlcohol(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Preis

                  <input
                    type="number"
                    step="0.01"
                    value={
                      drinkPrice
                    }
                    onChange={(e) =>
                      setDrinkPrice(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Anzahl

                  <input
                    type="number"
                    min="1"
                    value={
                      drinkQuantity
                    }
                    onChange={(e) =>
                      setDrinkQuantity(
                        e.target.value
                      )
                    }
                  />
                </label>

              </div>

              <label>
                Kommentar

                <textarea
                  placeholder="Optional"
                  value={
                    drinkComment
                  }
                  onChange={(e) =>
                    setDrinkComment(
                      e.target.value
                    )
                  }
                />
              </label>

              <label className="checkbox">

                <input
                  type="checkbox"
                  checked={
                    drinkSharedCost
                  }
                  onChange={(e) =>
                    setDrinkSharedCost(
                      e.target.checked
                    )
                  }
                />

                Kosten gemeinsam aufteilen

              </label>

              <button
                className="primary full"
                onClick={
                  addDrink
                }
                disabled={loading}
              >
                🍻 Getränk speichern
              </button>

            </section>

            <section className="card">

              <div className="sectionHeader">

                <div>
                  <h2>
                    🍺 Getränkeliste
                  </h2>

                  <p>
                    {
                      drinks.length
                    } Einträge
                  </p>
                </div>

              </div>

              {drinks.length ===
              0 ? (
                <div className="emptySmall">
                  🍺 Noch keine Getränke.
                </div>
              ) : (
                <div className="list">

                  {drinks.map(
                    (drink) => (
                      <div
                        className="drink"
                        key={
                          drink.id
                        }
                      >

                        <div className="drinkIcon">
                          🍺
                        </div>

                        <div className="drinkMain">

                          <strong>
                            {
                              getDrinkName(
                                drink
                              )
                            }
                          </strong>

                          <small>

                            {getDrinkBrand(
                              drink
                            ) && (
                              <>
                                {
                                  getDrinkBrand(
                                    drink
                                  )
                                }{" "}
                                ·{" "}
                              </>
                            )}

                            {
                              getDrinkLiters(
                                drink
                              ).toFixed(
                                2
                              )
                            }{" "}
                            L ·{" "}
                            {
                              getDrinkAlcohol(
                                drink
                              ).toFixed(
                                1
                              )
                            }
                            %

                          </small>

                          <small>
                            {drink.profile_id
                              ? "👤 Zugeordnet"
                              : "⚪ Nicht zugeordnet"}
                          </small>

                        </div>

                        <div className="drinkPrice">
                          {
                            money(
                              getDrinkPrice(
                                drink
                              )
                            )
                          }
                        </div>

                        <button
                          className="deleteButton"
                          onClick={() =>
                            deleteDrink(
                              drink.id
                            )
                          }
                        >
                          ×
                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

            </section>

            {/* =================================================
                UNASSIGNED
            ================================================= */}

            <section className="card">

              <h2>
                🔗 Getränke zuordnen
              </h2>

              {unassignedDrinks.length ===
              0 ? (
                <div className="emptySmall">
                  ✅ Alle Getränke sind zugeordnet.
                </div>
              ) : (
                <div className="assignmentList">

                  {unassignedDrinks.map(
                    (drink) => (
                      <div
                        className="assignmentCard"
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
                                2
                              )
                            }{" "}
                            L ·{" "}
                            {
                              getDrinkAlcohol(
                                drink
                              ).toFixed(
                                1
                              )
                            }%
                          </small>
                        </div>

                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const profileId =
                              e.target.value;

                            if (!profileId) {
                              return;
                            }

                            const member =
                              eventMembers.find(
                                (m) =>
                                  m.profile_id ===
                                  profileId
                              );

                            if (
                              member
                            ) {
                              assignDrink(
                                drink,
                                member
                              );
                            }

                            e.target.value =
                              "";
                          }}
                        >

                          <option value="">
                            Teilnehmer auswählen
                          </option>

                          {eventMembers.map(
                            (member) => (
                              <option
                                key={
                                  member.profile_id
                                }
                                value={
                                  member.profile_id
                                }
                              >
                                {
                                  member.profile
                                    ?.username ||
                                  "Teilnehmer"
                                }
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

          </>
        )}

      {/* =================================================
          COSTS
      ================================================= */}

      {selectedEvent &&
        activeSection ===
          "costs" && (
          <>

            <section className="statsGrid">

              <div className="statCard">
                <span>
                  💶
                </span>

                <strong>
                  {
                    money(
                      totalDrinkCosts
                    )
                  }
                </strong>

                <small>
                  Gesamtkosten
                </small>
              </div>

              <div className="statCard">
                <span>
                  💳
                </span>

                <strong>
                  {
                    money(
                      totalPayments
                    )
                  }
                </strong>

                <small>
                  Eingezahlt
                </small>
              </div>

              <div className="statCard">
                <span>
                  👥
                </span>

                <strong>
                  {
                    money(
                      costPerPerson
                    )
                  }
                </strong>

                <small>
                  Pro Person
                </small>
              </div>

              <div className="statCard">
                <span>
                  📊
                </span>

                <strong
                  className={
                    balance >=
                    0
                      ? "positive"
                      : "negative"
                  }
                >
                  {
                    money(
                      balance
                    )
                  }
                </strong>

                <small>
                  Differenz
                </small>
              </div>

            </section>

            <section className="card">

              <div className="sectionHeader">

                <div>
                  <h2>
                    💳 Zahlungen
                  </h2>
                </div>

                <button
                  className="primary"
                  onClick={() =>
                    setShowPayment(
                      !showPayment
                    )
                  }
                >
                  ➕ Zahlung
                </button>

              </div>

              {showPayment && (
                <div className="paymentForm">

                  <label>
                    Betrag

                    <input
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      value={
                        paymentAmount
                      }
                      onChange={(e) =>
                        setPaymentAmount(
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Status

                    <select
                      value={
                        paymentStatus
                      }
                      onChange={(e) =>
                        setPaymentStatus(
                          e.target.value
                        )
                      }
                    >
                      <option value="bezahlt">
                        Bezahlt
                      </option>

                      <option value="offen">
                        Offen
                      </option>

                      <option value="teilweise">
                        Teilweise
                      </option>
                    </select>
                  </label>

                  <button
                    className="primary full"
                    onClick={
                      addPayment
                    }
                  >
                    💳 Zahlung speichern
                  </button>

                </div>
              )}

              {payments.length ===
              0 ? (
                <div className="emptySmall">
                  💳 Noch keine Zahlungen.
                </div>
              ) : (
                <div className="list">

                  {payments.map(
                    (payment) => (
                      <div
                        className="payment"
                        key={
                          payment.id
                        }
                      >

                        <div>
                          <strong>
                            💶 Zahlung
                          </strong>

                          <small>
                            {
                              payment.status ||
                              "unbekannt"
                            }
                          </small>
                        </div>

                        <strong>
                          {
                            money(
                              numberValue(
                                payment.betrag
                              )
                            )
                          }
                        </strong>

                        <button
                          className="deleteButton"
                          onClick={() =>
                            deletePayment(
                              payment.id
                            )
                          }
                        >
                          ×
                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

            </section>

            <section className="card">

              <h2>
                👥 Kosten pro Teilnehmer
              </h2>

              {eventMembers.length ===
              0 ? (
                <div className="emptySmall">
                  Noch keine Teilnehmer.
                </div>
              ) : (
                <div className="list">

                  {eventMembers.map(
                    (member) => {
                      const stats =
                        participantStats.get(
                          member.profile_id
                        );

                      return (
                        <div
                          className="costParticipant"
                          key={
                            member.id
                          }
                        >

                          <span>
                            👤{" "}
                            {
                              member.profile
                                ?.username ||
                              "Teilnehmer"
                            }
                          </span>

                          <strong>
                            {
                              money(
                                stats?.cost ||
                                  0
                              )
                            }
                          </strong>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>

          </>
        )}

      {/* =================================================
          RANKING
      ================================================= */}

      {selectedEvent &&
        activeSection ===
          "ranking" && (
          <section className="card">

            <div className="sectionHeader">

              <div>
                <h2>
                  🏆 Ranking
                </h2>

                <p>
                  Wer hat am meisten Punkte gesammelt?
                </p>
              </div>

            </div>

            {!selectedEvent.show_ranking ? (
              <div className="disabledBox">
                🔒 Das Ranking ist für dieses Event deaktiviert.
              </div>
            ) : ranking.length ===
              0 ? (
              <div className="emptySmall">
                🏆 Noch keine Teilnehmer.
              </div>
            ) : (
              <div className="rankingList">

                {ranking.map(
                  (
                    entry,
                    index
                  ) => (
                    <div
                      className={
                        "rankingRow " +
                        (index ===
                        0
                          ? "first"
                          : "")
                      }
                      key={
                        entry.member
                          .id
                      }
                    >

                      <div className="rankNumber">

                        {index ===
                          0 &&
                          "🥇"}

                        {index ===
                          1 &&
                          "🥈"}

                        {index ===
                          2 &&
                          "🥉"}

                        {index >
                          2 &&
                          `${index + 1}.`}

                      </div>

                      <div className="rankName">

                        <strong>
                          {
                            entry
                              .member
                              .profile
                              ?.username ||
                            "Teilnehmer"
                          }
                        </strong>

                        <small>
                          🍺{" "}
                          {
                            entry.drinks
                          }{" "}
                          · 💧{" "}
                          {
                            liters(
                              entry.liters
                            )
                          }
                        </small>

                      </div>

                      {selectedEvent.show_promille && (
                        <div className="promille">
                          🥃{" "}
                          {
                            entry.promille.toFixed(
                              2
                            )
                          }‰
                        </div>
                      )}

                      <div className="points">
                        🏆{" "}
                        {
                          Math.round(
                            entry.points
                          )
                        }
                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </section>
        )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>

        <strong>
          🍻 Güstener Zapfhahn Zentrale
        </strong>

        <span>
          Dein Event. Deine Getränke. Deine Runde.
        </span>

        {currentProfile && (
          <span>
            Angemeldet als{" "}
            {
              currentProfile.username ||
              "Benutzer"
            }
          </span>
        )}

      </footer>

      {/* =================================================
          GLOBAL CSS
      ================================================= */}

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
              #111820 35%,
              #080c11 75%
            );
          color: #ffffff;
          padding: 20px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .header {
          max-width: 1100px;
          margin: 0 auto 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .logo {
          width: 62px;
          height: 62px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 18px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.1);
          font-size: 34px;
        }

        h1 {
          margin: 0;
          font-size: 26px;
        }

        h2 {
          margin: 0 0 7px;
          font-size: 21px;
        }

        p {
          color: #98a5b3;
          margin: 0;
          line-height: 1.5;
        }

        .brand p {
          margin-top: 4px;
        }

        .headerActions {
          display: flex;
          gap: 8px;
        }

        button {
          border: none;
          cursor: pointer;
          font-weight: 700;
          border-radius: 12px;
          padding: 12px 16px;
          transition:
            transform .15s ease,
            opacity .15s ease,
            background .15s ease;
        }

        button:hover {
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: .5;
          cursor: not-allowed;
          transform: none;
        }

        .primary {
          background: #f59e0b;
          color: #111827;
        }

        .primary:hover {
          background: #fbbf24;
        }

        .secondary {
          background: #25313e;
          color: white;
          border: 1px solid #344352;
        }

        .iconButton,
        .profileButton {
          width: 46px;
          height: 46px;
          padding: 0;
          background: #1b2530;
          color: white;
          border: 1px solid #33404d;
          font-size: 19px;
        }

        .message {
          max-width: 1100px;
          margin: 0 auto 15px;
          padding: 14px 16px;
          border-radius: 13px;
          border: 1px solid #344454;
          background: #172230;
        }

        .message.success {
          color: #86efac;
          border-color: #285d3c;
        }

        .message.error {
          color: #fca5a5;
          border-color: #713838;
        }

        .message.info {
          color: #fbbf24;
        }

        .card {
          max-width: 1100px;
          margin: 0 auto 16px;
          padding: 20px;
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 20px;
          box-shadow:
            0 10px 35px rgba(0,0,0,.16);
        }

        .sectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .headerButtons {
          display: flex;
          gap: 8px;
        }

        input,
        select,
        textarea {
          width: 100%;
          margin-top: 7px;
          margin-bottom: 12px;
          padding: 13px 14px;
          border-radius: 12px;
          border: 1px solid #34414f;
          background: #141c25;
          color: white;
          outline: none;
          font-size: 15px;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #f59e0b;
        }

        textarea {
          min-height: 95px;
          resize: vertical;
        }

        label {
          display: block;
          color: #d9e0e7;
          font-size: 14px;
          font-weight: 600;
        }

        .grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .joinRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .joinRow input {
          margin: 0;
        }

        .full {
          width: 100%;
        }

        .eventInfo {
          margin-top: 8px;
          padding: 14px;
          background: rgba(255,255,255,.045);
          border-radius: 14px;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          align-items: center;
        }

        .eventInfo span {
          display: inline-block;
          color: #96a4b2;
          margin-left: 12px;
          font-size: 13px;
        }

        .eventCode {
          padding: 9px 12px;
          background: #1b2733;
          border-radius: 10px;
          font-family: monospace;
          color: #fbbf24;
        }

        .navigation {
          max-width: 1100px;
          margin: 0 auto 16px;
          display: grid;
          grid-template-columns: repeat(5,1fr);
          gap: 7px;
          background: rgba(255,255,255,.045);
          padding: 7px;
          border-radius: 15px;
          border: 1px solid rgba(255,255,255,.07);
        }

        .navigation button {
          background: transparent;
          color: #91a0ae;
        }

        .navigation button.active {
          background: #f59e0b;
          color: #111827;
        }

        .statsGrid {
          max-width: 1100px;
          margin: 0 auto 16px;
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 10px;
        }

        .statCard {
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 18px;
          padding: 17px;
          text-align: center;
        }

        .statCard span {
          display: block;
          font-size: 24px;
        }

        .statCard strong {
          display: block;
          margin-top: 7px;
          font-size: 22px;
        }

        .statCard small {
          display: block;
          color: #82909e;
          margin-top: 4px;
        }

        .dashboardGrid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 10px;
        }

        .dashboardBox {
          background: rgba(255,255,255,.045);
          padding: 15px;
          border-radius: 14px;
        }

        .dashboardBox span {
          display: block;
          color: #8f9dac;
          font-size: 13px;
        }

        .dashboardBox strong {
          display: block;
          margin-top: 6px;
          font-size: 21px;
        }

        .positive {
          color: #4ade80;
        }

        .negative {
          color: #f87171;
        }

        .settingsGrid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 9px;
        }

        .settingsGrid > div {
          padding: 13px;
          background: rgba(255,255,255,.045);
          border-radius: 12px;
        }

        .settingsGrid span {
          display: block;
          color: #929eab;
          font-size: 13px;
        }

        .settingsGrid b {
          display: block;
          margin-top: 5px;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .participant,
        .drink,
        .payment,
        .costParticipant {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          background: rgba(255,255,255,.045);
          border-radius: 14px;
        }

        .avatar,
        .drinkIcon {
          width: 43px;
          height: 43px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #202b36;
          font-size: 20px;
          flex-shrink: 0;
        }

        .participantMain,
        .drinkMain {
          flex: 1;
          min-width: 0;
        }

        .participantMain strong,
        .drinkMain strong {
          display: block;
        }

        .participantMain small,
        .drinkMain small,
        .payment small {
          display: block;
          color: #84919f;
          margin-top: 4px;
        }

        .participantPoints {
          color: #fbbf24;
          font-weight: 800;
        }

        .drinkPrice {
          font-weight: 800;
          color: #fbbf24;
        }

        .deleteButton {
          width: 34px;
          height: 34px;
          padding: 0;
          border-radius: 10px;
          background: #303b47;
          color: white;
          font-size: 20px;
        }

        .assignmentList {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .assignmentCard {
          display: grid;
          grid-template-columns: 1fr 260px;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border-radius: 14px;
          background: rgba(255,255,255,.045);
        }

        .assignmentCard strong {
          display: block;
        }

        .assignmentCard small {
          display: block;
          color: #84919f;
          margin-top: 4px;
        }

        .assignmentCard select {
          margin: 0;
        }

        .payment {
          justify-content: space-between;
        }

        .paymentForm {
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 14px;
          background: rgba(255,255,255,.04);
        }

        .costParticipant {
          justify-content: space-between;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .checkbox input {
          width: auto;
          margin: 0;
        }

        .rankingList {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .rankingRow {
          display: grid;
          grid-template-columns: 55px 1fr auto auto;
          align-items: center;
          gap: 12px;
          padding: 15px;
          background: rgba(255,255,255,.045);
          border-radius: 14px;
        }

        .rankingRow.first {
          border: 1px solid rgba(245,158,11,.35);
          background: rgba(245,158,11,.07);
        }

        .rankNumber {
          font-size: 22px;
          font-weight: 900;
          text-align: center;
        }

        .rankName strong {
          display: block;
        }

        .rankName small {
          display: block;
          color: #8794a2;
          margin-top: 4px;
        }

        .points {
          color: #fbbf24;
          font-weight: 900;
          font-size: 18px;
        }

        .promille {
          color: #fca5a5;
          font-weight: 700;
        }

        .disabledBox,
        .emptySmall,
        .emptyState {
          text-align: center;
          padding: 30px 15px;
          color: #8996a4;
        }

        .emptyState {
          max-width: 1100px;
          margin: 0 auto;
          background: rgba(255,255,255,.04);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,.07);
        }

        .emptyIcon {
          font-size: 55px;
          margin-bottom: 10px;
        }

        .emptyState h2 {
          margin-bottom: 7px;
        }

        footer {
          max-width: 1100px;
          margin: 20px auto 0;
          padding: 30px 10px;
          text-align: center;
          color: #687686;
        }

        footer strong,
        footer span {
          display: block;
        }

        footer span {
          margin-top: 5px;
          font-size: 12px;
        }

        @media (max-width: 800px) {

          .statsGrid {
            grid-template-columns: repeat(2,1fr);
          }

          .dashboardGrid {
            grid-template-columns: repeat(2,1fr);
          }

          .settingsGrid {
            grid-template-columns: repeat(2,1fr);
          }

          .assignmentCard {
            grid-template-columns: 1fr;
          }

          .assignmentCard select {
            margin-top: 3px;
          }

        }

        @media (max-width: 600px) {

          .page {
            padding: 10px;
          }

          .header {
            align-items: flex-start;
          }

          .brand {
            align-items: flex-start;
          }

          .logo {
            width: 50px;
            height: 50px;
            font-size: 26px;
          }

          h1 {
            font-size: 20px;
          }

          .headerActions {
            flex-shrink: 0;
          }

          .card {
            padding: 15px;
            border-radius: 17px;
          }

          .sectionHeader {
            align-items: flex-start;
            flex-direction: column;
          }

          .headerButtons {
            width: 100%;
          }

          .headerButtons button {
            flex: 1;
          }

          .grid2 {
            grid-template-columns: 1fr;
          }

          .statsGrid {
            grid-template-columns: repeat(2,1fr);
          }

          .statCard {
            padding: 13px 8px;
          }

          .statCard strong {
            font-size: 18px;
          }

          .navigation {
            grid-template-columns: repeat(5,1fr);
            overflow-x: auto;
          }

          .navigation button {
            padding: 10px 7px;
            font-size: 11px;
            white-space: nowrap;
          }

          .dashboardGrid {
            grid-template-columns: 1fr 1fr;
          }

          .settingsGrid {
            grid-template-columns: 1fr;
          }

          .eventInfo {
            align-items: flex-start;
            flex-direction: column;
          }

          .eventInfo span {
            display: block;
            margin-left: 0;
            margin-top: 5px;
          }

          .joinRow {
            grid-template-columns: 1fr;
          }

          .joinRow input {
            margin-bottom: 8px;
          }

          .rankingRow {
            grid-template-columns: 40px 1fr auto;
          }

          .rankingRow .promille {
            grid-column: 2;
            grid-row: 2;
          }

          .rankingRow .points {
            grid-column: 3;
            grid-row: 1 / span 2;
          }

          .participant,
          .drink,
          .payment {
            gap: 8px;
          }

          .drinkPrice {
            font-size: 14px;
          }

        }

      `}</style>

    </main>
  );
}
