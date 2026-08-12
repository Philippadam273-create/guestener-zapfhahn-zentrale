"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/* ============================================================
   TYPEN
============================================================ */

type Event = {
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

  created_at?: string | null;
};

type EventMember = {
  id: string;
  event_id: string;
  profile_id: string;
  joined_at?: string;
  gender_factor?: number | null;
  joined_via_code?: string | null;
};

type Payment = {
  id: string;
  event_id: string;
  betrag: number;
  created_at?: string;
  bezahlt_von?: string | null;
  profile_id?: string | null;
  status?: string | null;
};


/* ============================================================
   HAUPTKOMPONENTE
============================================================ */

export default function Home() {
  /* ==========================================================
     EVENTS
  ========================================================== */

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");

  const [showEventCreator, setShowEventCreator] = useState(false);

  /* ==========================================================
     DRINKS
  ========================================================== */

  const [drinks, setDrinks] = useState<Drink[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [drinkBrand, setDrinkBrand] = useState("");
  const [drinkCategory, setDrinkCategory] = useState("Bier");
  const [drinkLiters, setDrinkLiters] = useState("0.5");
  const [drinkAlcohol, setDrinkAlcohol] = useState("5");
  const [drinkQuantity, setDrinkQuantity] = useState("1");
  const [drinkPrice, setDrinkPrice] = useState("0");
  const [drinkComment, setDrinkComment] = useState("");
  const [drinkSharedCost, setDrinkSharedCost] = useState(true);

  /* ==========================================================
     PROFILE / TEILNEHMER
  ========================================================== */

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<EventMember[]>([]);

  const [profileSearch, setProfileSearch] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");

  /* ==========================================================
     EIGENE DATEN
  ========================================================== */

  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("männlich");

  /* ==========================================================
     ZAHLUNGEN
  ========================================================== */

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentProfileId, setPaymentProfileId] = useState("");

  /* ==========================================================
     UI
  ========================================================== */

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "dashboard" |
    "participants" |
    "drinks" |
    "payments" |
    "ranking" |
    "settings"
  >("dashboard");


  /* ==========================================================
     EVENT LADEN
  ========================================================== */

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      showMessage("❌ Events konnten nicht geladen werden.");
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


  /* ==========================================================
     EVENT LADEN
  ========================================================== */

  async function loadEventData() {
    if (!eventId) {
      setDrinks([]);
      setMembers([]);
      setPayments([]);
      return;
    }

    setLoading(true);

    const [
      drinksResult,
      membersResult,
      paymentsResult,
    ] = await Promise.all([
      supabase
        .from("drinks")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("event_members")
        .select("*")
        .eq("event_id", eventId)
        .order("joined_at", {
          ascending: true,
        }),

      supabase
        .from("payments")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (drinksResult.data) {
      setDrinks(drinksResult.data);
    }

    if (membersResult.data) {
      setMembers(membersResult.data);
    }

    if (paymentsResult.data) {
      setPayments(paymentsResult.data);
    }

    setLoading(false);
  }


  /* ==========================================================
     PROFILE LADEN
  ========================================================== */

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
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
      `)
      .order("username", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setProfiles(data);
    }
  }


  /* ==========================================================
     AKTUELLEN USER / PROFIL ERMITTELN
  ========================================================== */

  async function loadMyProfile() {
    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(`
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
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setMyProfile(data);

      setWeight(
        String(
          data.weight_kg ??
          data.gewicht_kg ??
          ""
        )
      );

      setHeight(
        String(
          data.height_cm ??
          ""
        )
      );

      setAge(
        String(
          data.age ??
          data.alter ??
          ""
        )
      );

      setGender(
        data.gender ??
        data.geschlecht ??
        "männlich"
      );
    }
  }


  /* ==========================================================
     INITIALISIERUNG
  ========================================================== */

  useEffect(() => {
    loadEvents();
    loadProfiles();
    loadMyProfile();
  }, []);


  /* ==========================================================
     EVENT WECHSEL
  ========================================================== */

  useEffect(() => {
    loadEventData();
  }, [eventId]);


  /* ==========================================================
     AKTUELLES EVENT
  ========================================================== */

  const currentEvent = useMemo(() => {
    return events.find(
      (event) => event.id === eventId
    ) ?? null;
  }, [events, eventId]);


  /* ==========================================================
     TEILNEHMER-PROFILE
  ========================================================== */

  const memberProfiles = useMemo(() => {
    return members
      .map((member) => {
        return profiles.find(
          (profile) =>
            profile.id === member.profile_id
        );
      })
      .filter(Boolean) as Profile[];
  }, [members, profiles]);


  /* ==========================================================
     GEFILTERTE PROFILE
  ========================================================== */

  const availableProfiles = useMemo(() => {
    const memberIds = new Set(
      members.map(
        (member) => member.profile_id
      )
    );

    return profiles.filter(
      (profile) => {
        if (memberIds.has(profile.id)) {
          return false;
        }

        if (!profileSearch.trim()) {
          return true;
        }

        return (
          profile.username
            ?.toLowerCase()
            .includes(
              profileSearch
                .toLowerCase()
                .trim()
            )
        );
      }
    );
  }, [
    profiles,
    members,
    profileSearch,
  ]);


  /* ==========================================================
     STATISTIK
  ========================================================== */

  const totalDrinks = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.quantity ?? 1
        ),
      0
    );
  }, [drinks]);


  const totalLiters = useMemo(() => {
    return drinks.reduce(
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
  }, [drinks]);


  const totalCost = useMemo(() => {
    return drinks.reduce(
      (sum, drink) =>
        sum +
        Number(
          drink.preis ?? 0
        ) *
        Number(
          drink.quantity ?? 1
        ),
      0
    );
  }, [drinks]);


  const totalPayments = useMemo(() => {
    return payments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.betrag ?? 0
        ),
      0
    );
  }, [payments]);


  const remainingCost =
    totalCost - totalPayments;


  const costPerPerson =
    memberProfiles.length > 0
      ? totalCost /
        memberProfiles.length
      : 0;


  /* ==========================================================
     RANKING
  ========================================================== */

  const ranking = useMemo(() => {
    return [...memberProfiles].sort(
      (a, b) =>
        Number(b.points ?? 0) -
        Number(a.points ?? 0)
    );
  }, [memberProfiles]);


  /* ==========================================================
     MESSAGE
  ========================================================== */

  function showMessage(
    text: string
  ) {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  }


  /* ==========================================================
     EVENT ERSTELLEN
  ========================================================== */

  async function createEvent() {
    if (!eventTitle.trim()) {
      showMessage(
        "❌ Bitte einen Eventnamen eingeben."
      );
      return;
    }

    setLoading(true);

    const inviteCode =
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const { data, error } =
      await supabase
        .from("events")
        .insert([
          {
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
              inviteCode,

            is_active:
              true,

            ranking_enabled:
              true,

            show_points:
              true,

            show_ranking:
              true,

            show_promille:
              false,

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
          },
        ])
        .select()
        .single();

    setLoading(false);

    if (error) {
      console.error(error);

      showMessage(
        "❌ Event konnte nicht erstellt werden: " +
        error.message
      );

      return;
    }

    if (data) {
      setEvents([
        data,
        ...events,
      ]);

      setEventId(data.id);

      setEventTitle("");
      setEventDescription("");
      setEventLocation("");
      setEventStart("");
      setEventEnd("");

      setShowEventCreator(false);

      showMessage(
        "✅ Event erfolgreich erstellt!"
      );
    }
  }


  /* ==========================================================
     TEILNEHMER HINZUFÜGEN
  ========================================================== */

  async function addParticipant() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    if (!selectedProfileId) {
      showMessage(
        "❌ Bitte einen Teilnehmer auswählen."
      );
      return;
    }

    const exists =
      members.some(
        (member) =>
          member.profile_id ===
          selectedProfileId
      );

    if (exists) {
      showMessage(
        "❌ Dieser Teilnehmer ist bereits dabei."
      );
      return;
    }

    const { data, error } =
      await supabase
        .from("event_members")
        .insert([
          {
            event_id:
              eventId,

            profile_id:
              selectedProfileId,

            joined_via_code:
              currentEvent?.invite_code ??
              null,

            gender_factor:
              null,
          },
        ])
        .select()
        .single();

    if (error) {
      console.error(error);

      showMessage(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
        error.message
      );

      return;
    }

    if (data) {
      setMembers([
        ...members,
        data,
      ]);

      setSelectedProfileId("");
      setProfileSearch("");

      showMessage(
        "✅ Teilnehmer hinzugefügt!"
      );
    }
  }


  /* ==========================================================
     TEILNEHMER ENTFERNEN
  ========================================================== */

  async function removeParticipant(
    memberId: string
  ) {
    const { error } =
      await supabase
        .from("event_members")
        .delete()
        .eq("id", memberId);

    if (error) {
      showMessage(
        "❌ Teilnehmer konnte nicht entfernt werden."
      );
      return;
    }

    setMembers(
      members.filter(
        (member) =>
          member.id !== memberId
      )
    );

    showMessage(
      "✅ Teilnehmer entfernt."
    );
  }


  /* ==========================================================
     GETRÄNK SPEICHERN
  ========================================================== */

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

    const liters =
      Number(drinkLiters);

    const alcohol =
      Number(drinkAlcohol);

    const quantity =
      Number(drinkQuantity);

    const price =
      Number(drinkPrice);

    if (liters <= 0) {
      showMessage(
        "❌ Die Literzahl muss größer als 0 sein."
      );
      return;
    }

    if (quantity <= 0) {
      showMessage(
        "❌ Die Anzahl muss größer als 0 sein."
      );
      return;
    }

    setLoading(true);

    const { data, error } =
      await supabase
        .from("drinks")
        .insert([
          {
            event_id:
              eventId,

            profile_id:
              null,

            category:
              drinkCategory,

            drink_name:
              drinkName.trim(),

            brand:
              drinkBrand.trim() ||
              null,

            liters:
              liters,

            alcohol_percent:
              alcohol,

            quantity:
              quantity,

            comment:
              drinkComment.trim() ||
              null,

            ai_detected:
              false,

            shared_cost:
              drinkSharedCost,

            marke:
              drinkBrand.trim() ||
              null,

            getraenk:
              drinkName.trim(),

            menge:
              liters,

            alkohol:
              alcohol,

            preis:
              price,
          },
        ])
        .select()
        .single();

    setLoading(false);

    if (error) {
      console.error(error);

      showMessage(
        "❌ Getränk konnte nicht gespeichert werden: " +
        error.message
      );

      return;
    }

    if (data) {
      setDrinks([
        data,
        ...drinks,
      ]);

      setDrinkName("");
      setDrinkBrand("");
      setDrinkCategory("Bier");
      setDrinkLiters("0.5");
      setDrinkAlcohol("5");
      setDrinkQuantity("1");
      setDrinkPrice("0");
      setDrinkComment("");
      setDrinkSharedCost(true);

      showMessage(
        "🍺 Getränk gespeichert!"
      );
    }
  }


  /* ==========================================================
     GETRÄNK EINEM TEILNEHMER ZUORDNEN
  ========================================================== */

  async function assignDrink(
    drinkId: string,
    profileId: string
  ) {
    if (!profileId) {
      return;
    }

    const drink =
      drinks.find(
        (item) =>
          item.id === drinkId
      );

    if (!drink) {
      return;
    }

    const quantity =
      Number(
        drink.quantity ?? 1
      );

    const { error } =
      await supabase
        .from("drinks")
        .update({
          profile_id:
            profileId,
        })
        .eq("id", drinkId);

    if (error) {
      console.error(error);

      showMessage(
        "❌ Getränk konnte nicht zugeordnet werden: " +
        error.message
      );

      return;
    }

    setDrinks(
      drinks.map(
        (item) =>
          item.id === drinkId
            ? {
                ...item,
                profile_id:
                  profileId,
              }
            : item
      )
    );

    /* Punkte aktualisieren */

    const profile =
      profiles.find(
        (item) =>
          item.id === profileId
      );

    if (profile) {
      const newPoints =
        Number(
          profile.points ?? 0
        ) +
        quantity * 10;

      const newDrinkCount =
        Number(
          profile.drinks_count ?? 0
        ) +
        quantity;

      await supabase
        .from("profiles")
        .update({
          points:
            newPoints,

          drinks_count:
            newDrinkCount,
        })
        .eq(
          "id",
          profileId
        );

      setProfiles(
        profiles.map(
          (item) =>
            item.id === profileId
              ? {
                  ...item,
                  points:
                    newPoints,
                  drinks_count:
                    newDrinkCount,
                }
              : item
        )
      );
    }

    showMessage(
      "🍺 Getränk zugeordnet! +" +
      quantity * 10 +
      " Punkte"
    );
  }


  /* ==========================================================
     GETRÄNK LÖSCHEN
  ========================================================== */

  async function deleteDrink(
    drinkId: string
  ) {
    const confirmed =
      window.confirm(
        "Getränk wirklich löschen?"
      );

    if (!confirmed) {
      return;
    }

    const { error } =
      await supabase
        .from("drinks")
        .delete()
        .eq(
          "id",
          drinkId
        );

    if (error) {
      showMessage(
        "❌ Getränk konnte nicht gelöscht werden."
      );
      return;
    }

    setDrinks(
      drinks.filter(
        (drink) =>
          drink.id !== drinkId
      )
    );

    showMessage(
      "✅ Getränk gelöscht."
    );
  }


  /* ==========================================================
     ZAHLUNG SPEICHERN
  ========================================================== */

  async function savePayment() {
    if (!eventId) {
      showMessage(
        "❌ Bitte zuerst ein Event auswählen."
      );
      return;
    }

    const amount =
      Number(paymentAmount);

    if (!amount || amount <= 0) {
      showMessage(
        "❌ Bitte einen gültigen Betrag eingeben."
      );
      return;
    }

    const { data, error } =
      await supabase
        .from("payments")
        .insert([
          {
            event_id:
              eventId,

            betrag:
              amount,

            profile_id:
              paymentProfileId ||
              null,

            bezahlt_von:
              paymentProfileId ||
              null,

            status:
              "bezahlt",
          },
        ])
        .select()
        .single();

    if (error) {
      console.error(error);

      showMessage(
        "❌ Zahlung konnte nicht gespeichert werden: " +
        error.message
      );

      return;
    }

    if (data) {
      setPayments([
        data,
        ...payments,
      ]);

      setPaymentAmount("");
      setPaymentProfileId("");

      showMessage(
        "💶 Zahlung gespeichert."
      );
    }
  }


  /* ==========================================================
     PROFILDATEN SPEICHERN
  ========================================================== */

  async function saveProfile() {
    if (!myProfile) {
      showMessage(
        "❌ Kein Profil gefunden."
      );
      return;
    }

    const updateData = {
      weight_kg:
        Number(weight) || null,

      gewicht_kg:
        Number(weight) || null,

      height_cm:
        Number(height) || null,

      age:
        Number(age) || null,

      alter:
        Number(age) || null,

      gender:
        gender,

      geschlecht:
        gender,
    };

    const { error } =
      await supabase
        .from("profiles")
        .update(updateData)
        .eq(
          "id",
          myProfile.id
        );

    if (error) {
      console.error(error);

      showMessage(
        "❌ Profil konnte nicht gespeichert werden: " +
        error.message
      );

      return;
    }

    setMyProfile({
      ...myProfile,
      ...updateData,
    });

    setProfiles(
      profiles.map(
        (profile) =>
          profile.id ===
          myProfile.id
            ? {
                ...profile,
                ...updateData,
              }
            : profile
      )
    );

    showMessage(
      "✅ Profil gespeichert."
    );
  }


  /* ==========================================================
     PROMILLE
  ========================================================== */

  function calculatePersonalPromille(
    profileId: string
  ) {
    const profile =
      profiles.find(
        (item) =>
          item.id === profileId
      );

    if (!profile) {
      return 0;
    }

    const bodyWeight =
      Number(
        profile.weight_kg ??
        profile.gewicht_kg ??
        0
      );

    if (!bodyWeight) {
      return 0;
    }

    const genderValue =
      (
        profile.gender ??
        profile.geschlecht ??
        ""
      ).toLowerCase();

    const factor =
      genderValue.includes("frau") ||
      genderValue.includes("weib") ||
      genderValue === "f"
        ? 0.55
        : 0.68;

    const personDrinks =
      drinks.filter(
        (drink) =>
          drink.profile_id ===
          profileId
      );

    const alcoholGrams =
      personDrinks.reduce(
        (sum, drink) => {
          const liters =
            Number(
              drink.liters ??
              drink.menge ??
              0
            );

          const percent =
            Number(
              drink.alcohol_percent ??
              drink.alkohol ??
              0
            );

          const quantity =
            Number(
              drink.quantity ?? 1
            );

          return (
            sum +
            liters *
              percent *
              0.789 *
              quantity
          );
        },
        0
      );

    return Math.max(
      0,
      alcoholGrams /
        (bodyWeight * factor)
    );
  }


  /* ==========================================================
     EVENT EINSTELLUNG ÄNDERN
  ========================================================== */

  async function updateEventSetting(
    field: string,
    value: boolean
  ) {
    if (!currentEvent) {
      return;
    }

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
      showMessage(
        "❌ Einstellung konnte nicht gespeichert werden."
      );
      return;
    }

    setEvents(
      events.map(
        (event) =>
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
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="page">

      <div className="container">

        {/* ==================================================
            HEADER
        ================================================== */}

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

        </header>


        {/* ==================================================
            EVENT AUSWAHL
        ================================================== */}

        <section className="card">

          <div className="sectionHeader">

            <div>
              <h2>
                📅 Aktuelles Event
              </h2>

              {currentEvent && (
                <p>
                  {currentEvent.location ||
                    "Kein Veranstaltungsort"}
                </p>
              )}
            </div>

            <button
              className="secondaryButton"
              onClick={() =>
                setShowEventCreator(
                  !showEventCreator
                )
              }
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


          {currentEvent?.invite_code && (
            <div className="inviteBox">

              <span>
                🔗 Einladungscode
              </span>

              <strong>
                {currentEvent.invite_code}
              </strong>

            </div>
          )}


          {/* =================================================
              EVENT ERSTELLEN
          ================================================= */}

          {showEventCreator && (
            <div className="creator">

              <h3>
                Neues Event erstellen
              </h3>

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

              <div className="three">

                <div>
                  <label>
                    Beginn
                  </label>

                  <input
                    type="date"
                    value={eventStart}
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
                    value={eventEnd}
                    onChange={(e) =>
                      setEventEnd(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="buttonColumn">
                  <button
                    onClick={
                      createEvent
                    }
                    disabled={loading}
                  >
                    {loading
                      ? "Speichere..."
                      : "🍻 Event erstellen"}
                  </button>
                </div>

              </div>

            </div>
          )}

        </section>


        {/* ==================================================
            NAVIGATION
        ================================================== */}

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
            📊 Dashboard
          </button>

          <button
            className={
              activeTab ===
              "participants"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "participants"
              )
            }
          >
            👥 Teilnehmer
          </button>

          <button
            className={
              activeTab ===
              "drinks"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "drinks"
              )
            }
          >
            🍺 Getränke
          </button>

          <button
            className={
              activeTab ===
              "payments"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "payments"
              )
            }
          >
            💶 Kosten
          </button>

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

          <button
            className={
              activeTab ===
              "settings"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "settings"
              )
            }
          >
            ⚙️ Einstellungen
          </button>

        </nav>


        {/* ==================================================
            DASHBOARD
        ================================================== */}

        {activeTab ===
          "dashboard" && (
          <>

            <div className="stats">

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
                  Gesamtkosten
                </small>
              </div>

              <div className="stat">
                <span>
                  👥
                </span>

                <strong>
                  {memberProfiles.length}
                </strong>

                <small>
                  Teilnehmer
                </small>
              </div>

            </div>


            {/* EVENT INFO */}

            {currentEvent && (
              <section className="card">

                <h2>
                  📋 Eventübersicht
                </h2>

                {currentEvent.description && (
                  <p>
                    {currentEvent.description}
                  </p>
                )}

                <div className="infoGrid">

                  <div>
                    <span>
                      📍 Ort
                    </span>

                    <strong>
                      {currentEvent.location ||
                        "Nicht angegeben"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      📅 Zeitraum
                    </span>

                    <strong>
                      {currentEvent.start_date ||
                        "Nicht angegeben"}
                      {" – "}
                      {currentEvent.end_date ||
                        "Nicht angegeben"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      👥 Teilnehmer
                    </span>

                    <strong>
                      {memberProfiles.length}
                    </strong>
                  </div>

                  <div>
                    <span>
                      🍺 Getränke
                    </span>

                    <strong>
                      {totalDrinks}
                    </strong>
                  </div>

                </div>

              </section>
            )}


            {/* KOSTEN */}

            <section className="card costCard">

              <h2>
                💶 Kostenübersicht
              </h2>

              <div className="costBig">
                {totalCost.toFixed(
                  2
                )} €
              </div>

              <p>
                Gesamtkosten
              </p>

              <div className="costLine">
                <span>
                  💳 Bereits bezahlt
                </span>

                <strong>
                  {totalPayments.toFixed(
                    2
                  )} €
                </strong>
              </div>

              <div className="costLine">
                <span>
                  ⏳ Offen
                </span>

                <strong>
                  {remainingCost.toFixed(
                    2
                  )} €
                </strong>
              </div>

              <div className="costLine">
                <span>
                  👤 Pro Person
                </span>

                <strong>
                  {costPerPerson.toFixed(
                    2
                  )} €
                </strong>
              </div>

            </section>


            {/* SCHNELLÜBERSICHT */}

            <section className="card">

              <h2>
                ⚡ Schnellzugriff
              </h2>

              <div className="quickGrid">

                <button
                  onClick={() =>
                    setActiveTab(
                      "participants"
                    )
                  }
                >
                  👥
                  <span>
                    Teilnehmer
                  </span>
                </button>

                <button
                  onClick={() =>
                    setActiveTab(
                      "drinks"
                    )
                  }
                >
                  🍺
                  <span>
                    Getränk hinzufügen
                  </span>
                </button>

                <button
                  onClick={() =>
                    setActiveTab(
                      "payments"
                    )
                  }
                >
                  💶
                  <span>
                    Zahlung erfassen
                  </span>
                </button>

                <button
                  onClick={() =>
                    setActiveTab(
                      "ranking"
                    )
                  }
                >
                  🏆
                  <span>
                    Ranking
                  </span>
                </button>

              </div>

            </section>

          </>
        )}


        {/* ==================================================
            TEILNEHMER
        ================================================== */}

        {activeTab ===
          "participants" && (
          <>

            <section className="card">

              <h2>
                👥 Teilnehmer hinzufügen
              </h2>

              <input
                placeholder="Teilnehmer suchen..."
                value={
                  profileSearch
                }
                onChange={(e) =>
                  setProfileSearch(
                    e.target.value
                  )
                }
              />

              <select
                value={
                  selectedProfileId
                }
                onChange={(e) =>
                  setSelectedProfileId(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Teilnehmer auswählen
                </option>

                {availableProfiles.map(
                  (profile) => (
                    <option
                      key={
                        profile.id
                      }
                      value={
                        profile.id
                      }
                    >
                      {profile.username ||
                        "Unbekannter Benutzer"}
                    </option>
                  )
                )}

              </select>

              <button
                className="save"
                onClick={
                  addParticipant
                }
              >
                ➕ Teilnehmer hinzufügen
              </button>

            </section>


            <section className="card">

              <h2>
                👥 Teilnehmer des Events
              </h2>

              {memberProfiles.length ===
              0 ? (
                <p>
                  Noch keine Teilnehmer.
                </p>
              ) : (
                memberProfiles.map(
                  (profile) => {

                    const member =
                      members.find(
                        (item) =>
                          item.profile_id ===
                          profile.id
                      );

                    const promille =
                      calculatePersonalPromille(
                        profile.id
                      );

                    return (
                      <div
                        className="participant"
                        key={
                          profile.id
                        }
                      >

                        <div className="avatar">
                          👤
                        </div>

                        <div className="participantInfo">

                          <strong>
                            {profile.username ||
                              "Teilnehmer"}
                          </strong>

                          <small>
                            🏆{" "}
                            {profile.points ??
                              0}{" "}
                            Punkte
                            {" · "}
                            🍺{" "}
                            {profile.drinks_count ??
                              0}{" "}
                            Getränke
                          </small>

                          {currentEvent?.show_promille && (
                            <small>
                              🍷{" "}
                              {promille.toFixed(
                                2
                              )} ‰
                            </small>
                          )}

                        </div>

                        {member && (
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
                        )}

                      </div>
                    );
                  }
                )
              )}

            </section>

          </>
        )}


        {/* ==================================================
            GETRÄNKE
        ================================================== */}

        {activeTab ===
          "drinks" && (
          <>

            <section className="card">

              <h2>
                🍺 Getränk hinzufügen
              </h2>

              <input
                placeholder="Getränk"
                value={
                  drinkName
                }
                onChange={(e) =>
                  setDrinkName(
                    e.target.value
                  )
                }
              />

              <div className="three">

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
                    Cocktail
                  </option>

                  <option>
                    Softdrink
                  </option>

                  <option>
                    Sonstiges
                  </option>
                </select>

                <input
                  type="number"
                  step="0.1"
                  placeholder="Liter"
                  value={
                    drinkLiters
                  }
                  onChange={(e) =>
                    setDrinkLiters(
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="three">

                <input
                  type="number"
                  step="0.1"
                  placeholder="Alkohol %"
                  value={
                    drinkAlcohol
                  }
                  onChange={(e) =>
                    setDrinkAlcohol(
                      e.target.value
                    )
                  }
                />

                <input
                  type="number"
                  min="1"
                  placeholder="Anzahl"
                  value={
                    drinkQuantity
                  }
                  onChange={(e) =>
                    setDrinkQuantity(
                      e.target.value
                    )
                  }
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Preis €"
                  value={
                    drinkPrice
                  }
                  onChange={(e) =>
                    setDrinkPrice(
                      e.target.value
                    )
                  }
                />

              </div>


              <input
                placeholder="Kommentar"
                value={
                  drinkComment
                }
                onChange={(e) =>
                  setDrinkComment(
                    e.target.value
                  )
                }
              />


              <label className="check">

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

                Kosten in Gesamtaufteilung
                einbeziehen

              </label>


              <button
                className="save"
                onClick={
                  saveDrink
                }
                disabled={
                  loading
                }
              >
                {loading
                  ? "Speichere..."
                  : "🍻 Getränk speichern"}
              </button>

            </section>


            {/* GETRÄNKE LISTE */}

            <section className="card">

              <h2>
                🍺 Getränke des Events
              </h2>

              {drinks.length ===
              0 ? (
                <p>
                  Noch keine Getränke.
                </p>
              ) : (
                drinks.map(
                  (drink) => {

                    const assignedProfile =
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
                            {Number(
                              drink.liters ??
                              drink.menge ??
                              0
                            ).toFixed(
                              1
                            )}
                            L
                            {" · "}
                            {Number(
                              drink.alcohol_percent ??
                              drink.alkohol ??
                              0
                            ).toFixed(
                              1
                            )}
                            %
                            {" · "}
                            {Number(
                              drink.preis ??
                              0
                            ).toFixed(
                              2
                            )}
                            €
                          </small>

                          {assignedProfile && (
                            <small className="assigned">
                              👤{" "}
                              {assignedProfile.username}
                            </small>
                          )}

                        </div>


                        <div className="drinkActions">

                          <select
                            value={
                              drink.profile_id ??
                              ""
                            }
                            onChange={(e) =>
                              assignDrink(
                                drink.id,
                                e.target.value
                              )
                            }
                          >

                            <option value="">
                              Teilnehmer
                            </option>

                            {memberProfiles.map(
                              (
                                profile
                              ) => (
                                <option
                                  key={
                                    profile.id
                                  }
                                  value={
                                    profile.id
                                  }
                                >
                                  {
                                    profile.username
                                  }
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
                            ×
                          </button>

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </section>

          </>
        )}


        {/* ==================================================
            ZAHLUNGEN
        ================================================== */}

        {activeTab ===
          "payments" && (
          <>

            <section className="card">

              <h2>
                💶 Zahlung hinzufügen
              </h2>

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
                  Wer hat bezahlt?
                </option>

                {memberProfiles.map(
                  (profile) => (
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
                className="save"
                onClick={
                  savePayment
                }
              >
                💶 Zahlung speichern
              </button>

            </section>


            <section className="card costCard">

              <h2>
                💶 Kosten
              </h2>

              <div className="costBig">
                {totalCost.toFixed(
                  2
                )} €
              </div>

              <div className="costLine">
                <span>
                  Bezahlt
                </span>

                <strong>
                  {totalPayments.toFixed(
                    2
                  )} €
                </strong>
              </div>

              <div className="costLine">
                <span>
                  Offen
                </span>

                <strong>
                  {remainingCost.toFixed(
                    2
                  )} €
                </strong>
              </div>

              <div className="costLine">
                <span>
                  Pro Person
                </span>

                <strong>
                  {costPerPerson.toFixed(
                    2
                  )} €
                </strong>
              </div>

            </section>


            <section className="card">

              <h2>
                💳 Zahlungen
              </h2>

              {payments.length ===
              0 ? (
                <p>
                  Noch keine Zahlungen.
                </p>
              ) : (
                payments.map(
                  (payment) => {

                    const profile =
                      profiles.find(
                        (item) =>
                          item.id ===
                          (
                            payment.profile_id ??
                            payment.bezahlt_von
                          )
                      );

                    return (
                      <div
                        className="paymentItem"
                        key={
                          payment.id
                        }
                      >

                        <span>
                          💳{" "}
                          {profile?.username ||
                            "Unbekannt"}
                        </span>

                        <strong>
                          {Number(
                            payment.betrag
                          ).toFixed(
                            2
                          )} €
                        </strong>

                      </div>
                    );
                  }
                )
              )}

            </section>

          </>
        )}


        {/* ==================================================
            RANKING
        ================================================== */}

        {activeTab ===
          "ranking" && (
          <section className="card">

            <h2>
              🏆 Ranking
            </h2>

            {!currentEvent?.ranking_enabled ? (
              <p>
                Das Ranking ist für dieses
                Event deaktiviert.
              </p>
            ) : ranking.length ===
              0 ? (
              <p>
                Noch keine Teilnehmer.
              </p>
            ) : (
              ranking.map(
                (
                  profile,
                  index
                ) => (
                  <div
                    className="rank"
                    key={
                      profile.id
                    }
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
                        {profile.username ||
                          "Teilnehmer"}
                      </strong>

                      <small>
                        🍺{" "}
                        {profile.drinks_count ??
                          0}{" "}
                        Getränke
                      </small>

                    </div>

                    <b>
                      {profile.points ??
                        0}{" "}
                      Punkte
                    </b>

                  </div>
                )
              )
            )}

          </section>
        )}


        {/* ==================================================
            EINSTELLUNGEN
        ================================================== */}

        {activeTab ===
          "settings" &&
          currentEvent && (
          <section className="card">

            <h2>
              ⚙️ Event-Einstellungen
            </h2>

            <Setting
              title="🏆 Ranking aktiv"
              description="Teilnehmer können Punkte sammeln."
              value={
                Boolean(
                  currentEvent.ranking_enabled
                )
              }
              onChange={(value) =>
                updateEventSetting(
                  "ranking_enabled",
                  value
                )
              }
            />

            <Setting
              title="⭐ Punkte anzeigen"
              description="Punkte der Teilnehmer anzeigen."
              value={
                Boolean(
                  currentEvent.show_points
                )
              }
              onChange={(value) =>
                updateEventSetting(
                  "show_points",
                  value
                )
              }
            />

            <Setting
              title="🏆 Ranking anzeigen"
              description="Ranking im Event anzeigen."
              value={
                Boolean(
                  currentEvent.show_ranking
                )
              }
              onChange={(value) =>
                updateEventSetting(
                  "show_ranking",
                  value
                )
              }
            />

            <Setting
              title="🍷 Promille anzeigen"
              description="Promilleberechnung anzeigen."
              value={
                Boolean(
                  currentEvent.show_promille
                )
              }
              onChange={(value) =>
                updateEventSetting(
                  "show_promille",
                  value
                )
              }
            />

            <Setting
              title="📊 Statistiken"
              description="Eventstatistiken anzeigen."
              value={
                Boolean(
                  currentEvent.show_statistics
                )
              }
              onChange={(value) =>
                updateEventSetting(
                  "show_statistics",
                  value
                )
              }
            />

            <Setting
              title="🍺 Getränkemengen"
              description="Getränkemengen anzeigen."
              value={
                Boolean(
                  currentEvent.show_drink_amounts
                )
              }
              onChange={(value) =>
                updateEventSetting(
                  "show_drink_amounts",
                  value
                )
              }
            />

            <Setting
              title="💶 Kostenübersicht"
              description="Kosten des Events anzeigen."
              value={
                Boolean(
                  currentEvent.cost_overview_enabled
                )
              }
              onChange={(value) =>
                updateEventSetting(
                  "cost_overview_enabled",
                  value
                )
              }
            />

            <Setting
              title="💰 Automatische Kostenaufteilung"
              description="Kosten automatisch auf Teilnehmer verteilen."
              value={
                Boolean(
                  currentEvent.auto_split_costs
                )
              }
              onChange={(value) =>
                updateEventSetting(
                  "auto_split_costs",
                  value
                )
              }
            />

            <Setting
              title="📸 Fotos anzeigen"
              description="Getränkefotos anzeigen."
              value={
                Boolean(
                  currentEvent.show_photos
                )
              }
              onChange={(value) =>
                updateEventSetting(
                  "show_photos",
                  value
                )
              }
            />

            <Setting
              title="🔒 Datenschutzmodus"
              description="Zusätzliche Einschränkungen bei der Anzeige."
              value={
                Boolean(
                  currentEvent.privacy_mode
                )
              }
              onChange={(value) =>
                updateEventSetting(
                  "privacy_mode",
                  value
                )
              }
            />

          </section>
        )}


        {/* ==================================================
            PROFIL
        ================================================== */}

        {activeTab ===
          "settings" && (
          <section className="card">

            <h2>
              👤 Meine Daten
            </h2>

            {!myProfile ? (
              <p>
                Kein angemeldetes Profil gefunden.
              </p>
            ) : (
              <>

                <p>
                  Benutzer:
                  {" "}
                  <strong>
                    {myProfile.username}
                  </strong>
                </p>

                <div className="three">

                  <div>
                    <label>
                      Gewicht kg
                    </label>

                    <input
                      type="number"
                      value={
                        weight
                      }
                      onChange={(e) =>
                        setWeight(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label>
                      Größe cm
                    </label>

                    <input
                      type="number"
                      value={
                        height
                      }
                      onChange={(e) =>
                        setHeight(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label>
                      Alter
                    </label>

                    <input
                      type="number"
                      value={
                        age
                      }
                      onChange={(e) =>
                        setAge(
                          e.target.value
                        )
                      }
                    />
                  </div>

                </div>


                <select
                  value={
                    gender
                  }
                  onChange={(e) =>
                    setGender(
                      e.target.value
                    )
                  }
                >
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


                <button
                  className="save"
                  onClick={
                    saveProfile
                  }
                >
                  💾 Profil speichern
                </button>

              </>
            )}

          </section>
        )}


        {/* ==================================================
            MESSAGE
        ================================================== */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}


        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer>

          🍻 Güstener Zapfhahn Zentrale

          <small>
            Dein Event. Deine Getränke.
            Deine Runde.
          </small>

        </footer>

      </div>


      {/* ======================================================
          CSS
      ====================================================== */}

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
              #0b1016 55%,
              #06080b 100%
            );
          color: white;
          padding: 15px;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .container {
          max-width: 950px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding:
            10px
            5px
            25px;
        }

        .logo {
          font-size: 38px;
          background:
            rgba(
              255,
              255,
              255,
              .07
            );
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .1
            );
          border-radius: 18px;
          padding: 12px;
        }

        .headerText h1 {
          margin: 0;
          font-size: 26px;
        }

        .headerText p {
          margin:
            5px
            0
            0;
          color: #9ba7b5;
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
            1px solid
            rgba(
              255,
              255,
              255,
              .09
            );
          border-radius: 20px;
          padding: 18px;
          margin-bottom: 15px;
          backdrop-filter:
            blur(10px);
        }

        h2 {
          margin:
            0
            0
            15px;
          font-size: 20px;
        }

        h3 {
          margin-top: 0;
        }

        p {
          color: #9ba7b5;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 13px;
          margin-bottom: 10px;
          border-radius: 12px;
          border:
            1px solid
            #303b47;
          background:
            #151d26;
          color: white;
          outline: none;
          font-size: 14px;
        }

        textarea {
          min-height: 90px;
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color:
            #f59e0b;
        }

        button {
          border: none;
          border-radius: 12px;
          padding:
            13px
            17px;
          background:
            #f59e0b;
          color: #111;
          font-weight: bold;
          cursor: pointer;
          transition:
            .2s;
        }

        button:hover {
          transform:
            translateY(-1px);
          filter:
            brightness(1.08);
        }

        button:disabled {
          opacity: .5;
          cursor:
            not-allowed;
        }

        .secondaryButton {
          background:
            #273442;
          color: white;
        }

        .save {
          width: 100%;
          margin-top: 5px;
        }

        .sectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .sectionHeader p {
          margin-top: -8px;
        }

        .inviteBox {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background:
            rgba(
              245,
              158,
              11,
              .1
            );
          border:
            1px solid
            rgba(
              245,
              158,
              11,
              .3
            );
          padding: 13px;
          border-radius: 12px;
          margin-top: 5px;
        }

        .inviteBox strong {
          color:
            #fbbf24;
          font-size: 20px;
          letter-spacing:
            2px;
        }

        .creator {
          margin-top: 15px;
          padding-top: 15px;
          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );
        }

        label {
          display: block;
          color:
            #9ba7b5;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .buttonColumn {
          display: flex;
          align-items: flex-end;
        }

        .buttonColumn button {
          width: 100%;
        }

        .tabs {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          margin-bottom: 15px;
          padding-bottom: 2px;
        }

        .tabs button {
          flex:
            0 0 auto;
          background:
            rgba(
              255,
              255,
              255,
              .07
            );
          color:
            #b8c2cd;
        }

        .tabs button.active {
          background:
            #f59e0b;
          color: #111;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              1fr
            );
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          background:
            rgba(
              255,
              255,
              255,
              .055
            );
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );
          border-radius: 17px;
          padding: 15px;
          text-align: center;
        }

        .stat span {
          font-size: 25px;
        }

        .stat strong {
          display: block;
          font-size: 22px;
          margin:
            5px
            0;
        }

        .stat small {
          color:
            #8995a3;
          font-size: 11px;
        }

        .infoGrid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              1fr
            );
          gap: 10px;
        }

        .infoGrid div {
          background:
            rgba(
              255,
              255,
              255,
              .05
            );
          padding: 13px;
          border-radius: 12px;
        }

        .infoGrid span {
          display: block;
          color:
            #8995a3;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .infoGrid strong {
          font-size: 14px;
        }

        .costCard {
          text-align: center;
        }

        .costBig {
          font-size: 40px;
          font-weight: bold;
          color:
            #fbbf24;
        }

        .costLine {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background:
            rgba(
              255,
              255,
              255,
              .05
            );
          padding: 13px;
          border-radius: 12px;
          margin-top: 8px;
        }

        .quickGrid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              1fr
            );
          gap: 10px;
        }

        .quickGrid button {
          background:
            rgba(
              255,
              255,
              255,
              .06
            );
          color: white;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .quickGrid button:first-letter {
          font-size: 24px;
        }

        .three {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              1fr
            );
          gap: 8px;
        }

        .participant {
          display: flex;
          align-items: center;
          gap: 12px;
          background:
            rgba(
              255,
              255,
              255,
              .05
            );
          padding: 12px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background:
            #273442;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 21px;
        }

        .participantInfo {
          flex: 1;
        }

        .participantInfo strong {
          display: block;
        }

        .participantInfo small {
          display: block;
          color:
            #8995a3;
          margin-top: 4px;
        }

        .deleteButton {
          background:
            #303944;
          color: white;
          padding:
            7px
            12px;
        }

        .drinkItem {
          display: flex;
          align-items: center;
          gap: 12px;
          background:
            rgba(
              255,
              255,
              255,
              .05
            );
          padding: 12px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .drinkIcon {
          font-size: 25px;
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
          color:
            #8995a3;
          margin-top: 4px;
        }

        .assigned {
          color:
            #fbbf24 !important;
        }

        .drinkActions {
          display: flex;
          gap: 7px;
          align-items: center;
        }

        .drinkActions select {
          width: 150px;
          margin: 0;
        }

        .check {
          display: flex;
          align-items: center;
          gap: 8px;
          color:
            #b8c2cd;
          margin:
            8px
            0;
        }

        .check input {
          width: auto;
          margin: 0;
        }

        .paymentItem {
          display: flex;
          justify-content: space-between;
          background:
            rgba(
              255,
              255,
              255,
              .05
            );
          padding: 13px;
          border-radius: 12px;
          margin-top: 8px;
        }

        .rank {
          display: grid;
          grid-template-columns:
            50px
            1fr
            auto;
          gap: 10px;
          align-items: center;
          background:
            rgba(
              255,
              255,
              255,
              .05
            );
          padding: 14px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .rankNumber {
          font-size: 24px;
        }

        .rank small {
          display: block;
          color:
            #8995a3;
          margin-top: 4px;
        }

        .rank b {
          color:
            #fbbf24;
        }

        .message {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform:
            translateX(-50%);
          z-index: 100;
          width:
            min(
              90%,
              600px
            );
          background:
            #172230;
          border:
            1px solid
            #344454;
          border-radius: 14px;
          padding: 14px;
          text-align: center;
          color:
            #fbbf24;
          box-shadow:
            0
            10px
            40px
            rgba(
              0,
              0,
              0,
              .4
            );
        }

        footer {
          text-align: center;
          color:
            #687686;
          padding: 30px;
        }

        footer small {
          display: block;
          margin-top: 5px;
        }

        @media (
          max-width: 700px
        ) {

          .headerText h1 {
            font-size: 21px;
          }

          .stats {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .three {
            grid-template-columns:
              1fr;
          }

          .infoGrid {
            grid-template-columns:
              1fr;
          }

          .quickGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .sectionHeader {
            flex-direction:
              column;
            align-items:
              stretch;
          }

          .drinkItem {
            align-items:
              flex-start;
          }

          .drinkActions {
            flex-direction:
              column;
          }

          .drinkActions select {
            width:
              120px;
          }

        }

      `}</style>

    </main>
  );
}


/* ============================================================
   EINSTELLUNGS-KOMPONENTE
============================================================ */

function Setting({
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
    <div className="setting">

      <div>
        <strong>
          {title}
        </strong>

        <small>
          {description}
        </small>
      </div>

      <button
        className={
          value
            ? "toggle on"
            : "toggle"
        }
        onClick={() =>
          onChange(!value)
        }
      >
        {value
          ? "AN"
          : "AUS"}
      </button>

      <style jsx>{`

        .setting {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background:
            rgba(
              255,
              255,
              255,
              .05
            );
          padding: 14px;
          border-radius: 14px;
          margin-top: 8px;
        }

        .setting strong {
          display: block;
        }

        .setting small {
          display: block;
          color:
            #8995a3;
          margin-top: 4px;
        }

        .toggle {
          min-width: 60px;
          background:
            #303944;
          color:
            #aeb8c3;
        }

        .toggle.on {
          background:
            #22c55e;
          color: white;
        }

      `}</style>

    </div>
  );
}
