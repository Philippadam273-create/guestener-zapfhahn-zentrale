"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

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
  user_id?: string | null;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  points?: number | null;
  drinks_count?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  gender?: string | null;
  gewicht_kg?: number | null;
  alter?: number | null;
  geschlecht?: string | null;
  avatar_url?: string | null;
  is_global_admin?: boolean | null;
};

type Member = {
  id: string;
  profile_id: string;
  role?: string | null;
  joined_via_code?: string | null;
  profile?: Profile | null;
};

type Drink = {
  id: string;
  event_id?: string | null;
  profile_id?: string | null;
  category?: string | null;
  drink_name?: string | null;
  brand?: string | null;
  liters?: number | null;
  alcohol_percent?: number | null;
  quantity?: number | null;
  image?: string | null;
  comment?: string | null;
  price?: number | null;
  preis?: number | null;
  getraenk?: string | null;
  menge?: number | null;
  alkohol?: number | null;
  promille_wert?: number | null;
  created_at?: string | null;
};

type BeerRequest = {
  id: string;
  event_id: string;
  requester_profile_id: string;
  status: string;
  message?: string | null;
  created_at: string;
};

type BeerResponse = {
  id: string;
  request_id: string;
  profile_id: string;
  response: string;
};

type Challenge = {
  id: string;
  event_id?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  points?: number | null;
  status?: string | null;
  required_votes?: number | null;
  assigned_profile_id?: string | null;
  winner_profile_id?: string | null;
  created_at?: string | null;
};

type Tab =
  | "home"
  | "drinks"
  | "beer"
  | "challenges"
  | "ranking"
  | "stats"
  | "settings";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");
  const [event, setEvent] = useState<Event | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [beerRequests, setBeerRequests] = useState<BeerRequest[]>([]);
  const [beerResponses, setBeerResponses] = useState<BeerResponse[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [tab, setTab] = useState<Tab>("home");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [personName, setPersonName] = useState("");

  const [drinkName, setDrinkName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Bier");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [beerMessage, setBeerMessage] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePoints, setChallengePoints] = useState("50");

  const [inviteCode, setInviteCode] = useState("");

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");

  const [settings, setSettings] = useState({
    ranking_enabled: true,
    show_points: true,
    show_ranking: true,
    show_promille: true,
    show_statistics: true,
    show_drink_amounts: true,
    cost_overview_enabled: true,
    auto_split_costs: true,
    team_mode: false,
    show_photos: true,
    show_costs: true,
    privacy_mode: false,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
    }
  }, [eventId]);

  async function loadInitialData() {
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();

      if (authData.user) {
        const { data: ownProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (ownProfile) {
          setProfile(ownProfile);

          setWeight(
            String(
              ownProfile.weight_kg ??
                ownProfile.gewicht_kg ??
                ""
            )
          );

          setHeight(
            String(ownProfile.height_cm ?? "")
          );

          setAge(
            String(
              ownProfile.age ??
                ownProfile.alter ??
                ""
            )
          );

          setGender(
            ownProfile.gender ??
              ownProfile.geschlecht ??
              "male"
          );
        }
      }

      const { data: eventData, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      if (eventData) {
        setEvents(eventData);

        if (eventData.length > 0) {
          setEventId(eventData[0].id);
        }
      }
    } catch (error: any) {
      setMessage(
        "❌ " +
          (error?.message ||
            "Daten konnten nicht geladen werden.")
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadEventData(id: string) {
    setLoading(true);

    try {
      const selectedEvent =
        events.find((item) => item.id === id) ?? null;

      if (selectedEvent) {
        setEvent(selectedEvent);

        setSettings({
          ranking_enabled:
            selectedEvent.ranking_enabled ?? true,
          show_points:
            selectedEvent.show_points ?? true,
          show_ranking:
            selectedEvent.show_ranking ?? true,
          show_promille:
            selectedEvent.show_promille ?? true,
          show_statistics:
            selectedEvent.show_statistics ?? true,
          show_drink_amounts:
            selectedEvent.show_drink_amounts ?? true,
          cost_overview_enabled:
            selectedEvent.cost_overview_enabled ?? true,
          auto_split_costs:
            selectedEvent.auto_split_costs ?? true,
          team_mode:
            selectedEvent.team_mode ?? false,
          show_photos:
            selectedEvent.show_photos ?? true,
          show_costs:
            selectedEvent.show_costs ?? true,
          privacy_mode:
            selectedEvent.privacy_mode ?? false,
        });
      }

      const [
        membersResult,
        drinksResult,
        requestResult,
        challengeResult,
      ] = await Promise.all([
        supabase
          .from("event_members")
          .select("*")
          .eq("event_id", id)
          .order("joined_at", {
            ascending: true,
          }),

        supabase
          .from("drinks")
          .select("*")
          .eq("event_id", id)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("beer_requests")
          .select("*")
          .eq("event_id", id)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("challenge_dashboard")
          .select("*")
          .eq("event_id", id)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (membersResult.data) {
        const ids = membersResult.data.map(
          (member) => member.profile_id
        );

        let profileMap: Record<string, Profile> = {};

        if (ids.length > 0) {
          const { data: profileData } =
            await supabase
              .from("profiles")
              .select("*")
              .in("id", ids);

          if (profileData) {
            profileMap = Object.fromEntries(
              profileData.map((p) => [p.id, p])
            );
          }
        }

        setMembers(
          membersResult.data.map((member) => ({
            ...member,
            profile:
              profileMap[member.profile_id] ?? null,
          }))
        );
      } else {
        setMembers([]);
      }

      setDrinks(drinksResult.data ?? []);
      setBeerRequests(requestResult.data ?? []);
      setChallenges(challengeResult.data ?? []);

      const requestIds =
        requestResult.data?.map((r) => r.id) ?? [];

      if (requestIds.length > 0) {
        const { data: responses } =
          await supabase
            .from("beer_request_responses")
            .select("*")
            .in("request_id", requestIds);

        setBeerResponses(responses ?? []);
      } else {
        setBeerResponses([]);
      }
    } catch (error: any) {
      setMessage(
        "❌ " +
          (error?.message ||
            "Eventdaten konnten nicht geladen werden.")
      );
    } finally {
      setLoading(false);
    }
  }

  function notify(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  async function addPerson() {
    if (!personName.trim()) {
      notify("❌ Bitte einen Namen eingeben.");
      return;
    }

    if (!profile) {
      notify(
        "❌ Bitte zuerst einen Benutzer anmelden."
      );
      return;
    }

    if (!eventId) {
      notify("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    setSaving(true);

    try {
      const existing = members.some(
        (member) =>
          (
            member.profile?.name ??
            member.profile?.username ??
            ""
          ).toLowerCase() ===
          personName.trim().toLowerCase()
      );

      if (existing) {
        notify("❌ Teilnehmer bereits vorhanden.");
        return;
      }

      const { error } = await supabase
        .from("event_members")
        .insert({
          event_id: eventId,
          profile_id: profile.id,
          joined_via_code:
            event?.invite_code ?? null,
          role: "member",
        });

      if (error) {
        throw error;
      }

      setPersonName("");

      notify("✅ Teilnehmer hinzugefügt.");

      await loadEventData(eventId);
    } catch (error: any) {
      notify(
        "❌ Teilnehmer konnte nicht hinzugefügt werden: " +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function joinWithInviteCode() {
    if (!inviteCode.trim()) {
      notify("❌ Einladungscode eingeben.");
      return;
    }

    if (!profile) {
      notify("❌ Bitte zuerst anmelden.");
      return;
    }

    setSaving(true);

    try {
      const { data: foundEvent, error } =
        await supabase
          .from("events")
          .select("*")
          .eq(
            "invite_code",
            inviteCode.trim()
          )
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!foundEvent) {
        notify("❌ Einladungscode nicht gefunden.");
        return;
      }

      const { error: memberError } =
        await supabase
          .from("event_members")
          .upsert(
            {
              event_id: foundEvent.id,
              profile_id: profile.id,
              joined_via_code:
                inviteCode.trim(),
              role: "member",
            },
            {
              onConflict:
                "event_id,profile_id",
            }
          );

      if (memberError) {
        throw memberError;
      }

      setEvents((old) => [
        foundEvent,
        ...old.filter(
          (item) => item.id !== foundEvent.id
        ),
      ]);

      setEventId(foundEvent.id);
      setInviteCode("");

      notify(
        "🎉 Du bist dem Event beigetreten!"
      );
    } catch (error: any) {
      notify(
        "❌ " +
          (error?.message ||
            "Beitritt fehlgeschlagen.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveDrink() {
    if (!eventId) {
      notify("❌ Bitte zuerst ein Event auswählen.");
      return;
    }

    if (!drinkName.trim()) {
      notify("❌ Bitte ein Getränk eingeben.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("drinks")
        .insert({
          event_id: eventId,
          profile_id: profile?.id ?? null,
          category,
          drink_name: drinkName.trim(),
          getraenk: drinkName.trim(),
          brand: brand.trim() || null,
          marke: brand.trim() || null,
          liters: Number(liters) || 0.5,
          menge: Number(liters) || 0.5,
          alcohol_percent:
            Number(alcohol) || 0,
          alkohol: Number(alcohol) || 0,
          quantity: 1,
          price: Number(price) || 0,
          preis: Number(price) || 0,
          promille_wert: 0,
        });

      if (error) {
        throw error;
      }

      setDrinkName("");
      setBrand("");
      setLiters("0.5");
      setAlcohol("5");
      setPrice("0");

      notify("🍺 Getränk gespeichert.");

      await loadEventData(eventId);
    } catch (error: any) {
      notify(
        "❌ Getränk konnte nicht gespeichert werden: " +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function assignDrink(drink: Drink) {
    if (!profile) {
      notify("❌ Kein Benutzerprofil gefunden.");
      return;
    }

    const litersValue = Number(
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
      drink.price ??
        drink.preis ??
        0
    );

    try {
      const { error } = await supabase
        .from("drinks")
        .update({
          profile_id: profile.id,
        })
        .eq("id", drink.id);

      if (error) {
        throw error;
      }

      const alcoholGrams =
        litersValue *
        1000 *
        (drinkAlcohol / 100) *
        0.789;

      await supabase
        .from("alcohol_consumption")
        .insert({
          user_id:
            profile.user_id ??
            null,
          alcohol_grams:
            alcoholGrams,
        });

      await supabase
        .from("blood_alcohol")
        .upsert(
          {
            event_id: eventId,
            member_id: profile.id,
            alcohol_grams:
              alcoholGrams,
            current_promille:
              calculatePromille(
                alcoholGrams
              ),
            calculated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "event_id,member_id",
          }
        );

      notify(
        `🍺 ${drink.drink_name ?? drink.getraenk ?? "Bier"} zugeordnet · +10 Punkte`
      );

      await loadEventData(eventId);
    } catch (error: any) {
      notify(
        "❌ Getränk konnte nicht zugeordnet werden: " +
          error.message
      );
    }
  }

  function calculatePromille(
    alcoholGrams: number
  ) {
    const kg =
      Number(
        profile?.weight_kg ??
          profile?.gewicht_kg ??
          weight
      ) || 82;

    const factor =
      gender === "female"
        ? 0.55
        : 0.68;

    return alcoholGrams / (kg * factor);
  }

  const myDrinks = useMemo(() => {
    if (!profile) return [];

    return drinks.filter(
      (drink) =>
        drink.profile_id ===
        profile.id
    );
  }, [drinks, profile]);

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
            Number(
              drink.quantity ?? 1
            ),
        0
      ),
    [drinks]
  );

  const totalCost = useMemo(
    () =>
      drinks.reduce(
        (sum, drink) =>
          sum +
          Number(
            drink.price ??
              drink.preis ??
              0
          ) *
            Number(
              drink.quantity ?? 1
            ),
        0
      ),
    [drinks]
  );

  const myLiters = useMemo(
    () =>
      myDrinks.reduce(
        (sum, drink) =>
          sum +
          Number(
            drink.liters ??
              drink.menge ??
              0
          ),
        0
      ),
    [myDrinks]
  );

  const myPoints =
    Number(profile?.points ?? 0);

  const ranking = useMemo(() => {
    return [...members].sort(
      (a, b) =>
        Number(
          b.profile?.points ?? 0
        ) -
        Number(
          a.profile?.points ?? 0
        )
    );
  }, [members]);

  const myPromille = useMemo(() => {
    const grams = myDrinks.reduce(
      (sum, drink) => {
        const l =
          Number(
            drink.liters ??
              drink.menge ??
              0
          );

        const alc =
          Number(
            drink.alcohol_percent ??
              drink.alkohol ??
              0
          );

        return (
          sum +
          l *
            1000 *
            (alc / 100) *
            0.789
        );
      },
      0
    );

    return calculatePromille(
      grams
    );
  }, [
    myDrinks,
    profile,
    weight,
    gender,
  ]);

  const costPerPerson =
    members.length > 0
      ? totalCost / members.length
      : 0;

  const pendingBeerRequests =
    beerRequests.filter(
      (request) =>
        request.status ===
        "pending"
    );

  async function requestBeer() {
    if (!profile) {
      notify("❌ Kein Benutzerprofil.");
      return;
    }

    if (!eventId) {
      notify("❌ Kein Event ausgewählt.");
      return;
    }

    try {
      const { error } =
        await supabase
          .from("beer_requests")
          .insert({
            event_id: eventId,
            requester_profile_id:
              profile.id,
            status: "pending",
            message:
              beerMessage.trim() ||
              "🍺 Ich möchte gerne ein Bier trinken!",
          });

      if (error) {
        throw error;
      }

      setBeerMessage("");

      notify(
        "🍺 Bier-Anfrage wurde an alle Teilnehmer gesendet!"
      );

      await loadEventData(eventId);
    } catch (error: any) {
      notify(
        "❌ Bier-Anfrage fehlgeschlagen: " +
          error.message
      );
    }
  }

  async function answerBeerRequest(
    request: BeerRequest,
    response: "accepted" | "declined"
  ) {
    if (!profile) return;

    try {
      const { error } =
        await supabase
          .from(
            "beer_request_responses"
          )
          .upsert(
            {
              request_id:
                request.id,
              profile_id:
                profile.id,
              response,
            },
            {
              onConflict:
                "request_id,profile_id",
            }
          );

      if (error) {
        throw error;
      }

      const responses =
        beerResponses.filter(
          (item) =>
            item.request_id ===
            request.id
        );

      const accepted =
        responses.filter(
          (item) =>
            item.response ===
            "accepted"
        ).length +
        (response === "accepted"
          ? 1
          : 0);

      const total =
        Math.max(
          members.length - 1,
          1
        );

      if (accepted >= total) {
        await supabase
          .from("beer_requests")
          .update({
            status: "accepted",
            responded_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            request.id
          );
      }

      notify(
        response === "accepted"
          ? "✅ Du hast zugestimmt."
          : "❌ Du hast abgelehnt."
      );

      await loadEventData(eventId);
    } catch (error: any) {
      notify(
        "❌ Antwort konnte nicht gespeichert werden: " +
          error.message
      );
    }
  }

  async function sponsorCrate() {
    if (!profile) {
      notify("❌ Kein Benutzerprofil.");
      return;
    }

    try {
      const { error } =
        await supabase
          .from(
            "beer_crate_sponsorships"
          )
          .insert({
            event_id: eventId,
            profile_id:
              profile.id,
            crates: 1,
            points_awarded: 100,
            description:
              "🍺 Bierkiste ausgegeben",
          });

      if (error) {
        throw error;
      }

      notify(
        "🍺 Bierkiste ausgegeben! +100 Punkte"
      );

      await loadEventData(eventId);
    } catch (error: any) {
      notify(
        "❌ Bierkiste konnte nicht gespeichert werden: " +
          error.message
      );
    }
  }

  async function createChallenge() {
    if (!challengeTitle.trim()) {
      notify(
        "❌ Bitte einen Challenge-Namen eingeben."
      );
      return;
    }

    try {
      const { error } =
        await supabase
          .from(
            "challenges"
          )
          .insert({
            event_id: eventId,
            title:
              challengeTitle.trim(),
            description:
              challengeDescription.trim(),
            points:
              Number(
                challengePoints
              ) || 50,
            status: "open",
          });

      if (error) {
        /*
         * Falls die Tabelle "challenges"
         * nicht vorhanden ist, verwenden wir
         * die vorhandene Dashboard-Struktur.
         */
        const fallback =
          await supabase
            .from(
              "challenge_dashboard"
            )
            .insert({
              event_id: eventId,
              title:
                challengeTitle.trim(),
              description:
                challengeDescription.trim(),
              category:
                "Event",
              points:
                Number(
                  challengePoints
                ) || 50,
              status: "open",
              required_votes:
                Math.max(
                  members.length - 1,
                  1
                ),
              assigned_profile_id:
                profile?.id ?? null,
            });

        if (fallback.error) {
          throw fallback.error;
        }
      }

      setChallengeTitle("");
      setChallengeDescription("");
      setChallengePoints("50");

      notify(
        "🔥 Challenge erstellt!"
      );

      await loadEventData(eventId);
    } catch (error: any) {
      notify(
        "❌ Challenge konnte nicht erstellt werden: " +
          error.message
      );
    }
  }

  async function updateProfile() {
    if (!profile) return;

    setSaving(true);

    try {
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
        gender,
        geschlecht:
          gender,
      };

      const { error } =
        await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", profile.id);

      if (error) {
        throw error;
      }

      setProfile({
        ...profile,
        ...updateData,
      });

      notify(
        "✅ Profil gespeichert."
      );
    } catch (error: any) {
      notify(
        "❌ Profil konnte nicht gespeichert werden: " +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveEventSettings() {
    if (!eventId) return;

    try {
      const { error } =
        await supabase
          .from("events")
          .update(settings)
          .eq("id", eventId);

      if (error) {
        throw error;
      }

      setEvent((old) =>
        old
          ? {
              ...old,
              ...settings,
            }
          : old
      );

      notify(
        "✅ Event-Einstellungen gespeichert."
      );
    } catch (error: any) {
      notify(
        "❌ Einstellungen konnten nicht gespeichert werden: " +
          error.message
      );
    }
  }

  if (loading && events.length === 0) {
    return (
      <main className="loadingPage">
        <div className="loaderCard">
          <div className="crateIcon">
            🍺🍺🍺
          </div>
          <h1>
            Güstener Zapfhahn Zentrale
          </h1>
          <p>
            App wird geladen ...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app">
      <div className="shell">

        <header className="hero">
          <div className="brand">
            <div className="crateLogo">
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
              <span>🍺</span>
            </div>

            <div>
              <h1>
                Güstener Zapfhahn Zentrale
              </h1>

              <p>
                Events · Getränke · Kosten ·
                Rankings · Challenges
              </p>
            </div>
          </div>

          <div className="heroActions">
            <button
              className="crateButton"
              onClick={sponsorCrate}
            >
              <span className="crateMini">
                🍺🍺
                <br />
                🍺🍺
              </span>

              <span>
                Bierkiste
                <small>
                  +100 Punkte
                </small>
              </span>
            </button>

            <button
              className="beerButton"
              onClick={() =>
                setTab("beer")
              }
            >
              🍺
              <span>
                Bier?
                <small>
                  Anfrage senden
                </small>
              </span>
            </button>
          </div>
        </header>

        <section className="eventCard">
          <div>
            <span className="eyebrow">
              AKTUELLES EVENT
            </span>

            <h2>
              {event?.title ??
                "Kein Event ausgewählt"}
            </h2>

            <p>
              {event?.location ||
                "Güsten"}
              {" · "}
              {event?.start_date ||
                "Datum offen"}
            </p>
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

            {events.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.title}
              </option>
            ))}
          </select>
        </section>

        <nav className="tabs">
          <button
            className={
              tab === "home"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("home")
            }
          >
            🏠
            <span>Home</span>
          </button>

          <button
            className={
              tab === "drinks"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("drinks")
            }
          >
            🍺
            <span>Getränke</span>
          </button>

          <button
            className={
              tab === "beer"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("beer")
            }
          >
            🍻
            <span>Bier</span>

            {pendingBeerRequests.length >
              0 && (
              <i>
                {pendingBeerRequests.length}
              </i>
            )}
          </button>

          <button
            className={
              tab === "challenges"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("challenges")
            }
          >
            🔥
            <span>Challenges</span>
          </button>

          <button
            className={
              tab === "ranking"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("ranking")
            }
          >
            🏆
            <span>Ranking</span>
          </button>

          <button
            className={
              tab === "stats"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("stats")
            }
          >
            📊
            <span>Statistik</span>
          </button>
        </nav>

        {message && (
          <div className="toast">
            {message}
          </div>
        )}

        {tab === "home" && (
          <>
            <section className="statsGrid">
              <div className="stat">
                <span>🍺</span>
                <strong>
                  {drinks.length}
                </strong>
                <small>
                  Getränke
                </small>
              </div>

              <div className="stat">
                <span>💧</span>
                <strong>
                  {totalLiters.toFixed(1)}
                </strong>
                <small>
                  Liter
                </small>
              </div>

              <div className="stat">
                <span>💶</span>
                <strong>
                  {totalCost.toFixed(2)} €
                </strong>
                <small>
                  Kosten
                </small>
              </div>

              <div className="stat">
                <span>👥</span>
                <strong>
                  {members.length}
                </strong>
                <small>
                  Teilnehmer
                </small>
              </div>
            </section>

            <section className="featureGrid">

              <div className="featureCard beerFeature">
                <div className="featureIcon">
                  🍺
                </div>

                <div>
                  <h3>
                    Ich möchte ein Bier
                  </h3>

                  <p>
                    Alle Teilnehmer bekommen
                    eine Anfrage.
                  </p>
                </div>

                <button
                  onClick={requestBeer}
                >
                  🍺 Bier anfragen
                </button>
              </div>

              <div className="featureCard crateFeature">
                <div className="featureIcon crateVisual">
                  🍺🍺
                  <br />
                  🍺🍺
                </div>

                <div>
                  <h3>
                    Bierkiste ausgeben
                  </h3>

                  <p>
                    Eine Kiste spendieren und
                    Punkte sammeln.
                  </p>
                </div>

                <button
                  onClick={sponsorCrate}
                >
                  🍻 Kiste ausgeben
                </button>
              </div>

            </section>

            <section className="card">
              <div className="sectionTitle">
                <div>
                  <span className="eyebrow">
                    DEIN EVENT
                  </span>

                  <h2>
                    👥 Teilnehmer
                  </h2>
                </div>

                <span className="countBadge">
                  {members.length}
                </span>
              </div>

              <div className="addRow">
                <input
                  value={personName}
                  onChange={(e) =>
                    setPersonName(
                      e.target.value
                    )
                  }
                  placeholder="Teilnehmername"
                />

                <button
                  onClick={addPerson}
                  disabled={saving}
                >
                  ➕ Hinzufügen
                </button>
              </div>

              <div className="members">
                {members.length === 0 ? (
                  <div className="empty">
                    👥 Noch keine Teilnehmer.
                  </div>
                ) : (
                  members.map(
                    (member, index) => (
                      <div
                        className="member"
                        key={member.id}
                      >
                        <div className="avatar">
                          {(
                            member.profile
                              ?.name ??
                            member.profile
                              ?.username ??
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="memberInfo">
                          <strong>
                            {member.profile
                              ?.name ??
                              member.profile
                                ?.username ??
                              "Teilnehmer"}
                          </strong>

                          <small>
                            🍺{" "}
                            {member.profile
                              ?.drinks_count ??
                              0}
                            {" · "}
                            🏆{" "}
                            {member.profile
                              ?.points ??
                              0}{" "}
                            Punkte
                          </small>
                        </div>

                        {index === 0 && (
                          <span className="miniBadge">
                            ⭐
                          </span>
                        )}
                      </div>
                    )
                  )
                )}
              </div>
            </section>

            <section className="card">
              <div className="sectionTitle">
                <div>
                  <span className="eyebrow">
                    DEIN PROFIL
                  </span>

                  <h2>
                    👤 Meine Werte
                  </h2>
                </div>
              </div>

              <div className="profileStats">
                <div>
                  <span>🏆</span>
                  <strong>
                    {myPoints}
                  </strong>
                  <small>
                    Punkte
                  </small>
                </div>

                <div>
                  <span>🍺</span>
                  <strong>
                    {myDrinks.length}
                  </strong>
                  <small>
                    Getränke
                  </small>
                </div>

                <div>
                  <span>💧</span>
                  <strong>
                    {myLiters.toFixed(1)}
                  </strong>
                  <small>
                    Liter
                  </small>
                </div>

                {settings.show_promille && (
                  <div>
                    <span>⚠️</span>
                    <strong>
                      {myPromille.toFixed(
                        2
                      )}
                      ‰
                    </strong>
                    <small>
                      Promille
                    </small>
                  </div>
                )}
              </div>
            </section>

            <section className="card inviteCard">
              <div>
                <span className="eyebrow">
                  EVENT BEITRETEN
                </span>

                <h2>
                  🔗 Einladungscode
                </h2>

                <p>
                  Freunde können mit dem
                  Einladungscode beitreten.
                </p>
              </div>

              <div className="inviteRow">
                <input
                  value={inviteCode}
                  onChange={(e) =>
                    setInviteCode(
                      e.target.value
                    )
                  }
                  placeholder="z.B. GUEST2026"
                />

                <button
                  onClick={
                    joinWithInviteCode
                  }
                >
                  Beitreten
                </button>
              </div>

              {event?.invite_code && (
                <div className="currentCode">
                  <span>
                    Dein Event-Code
                  </span>

                  <strong>
                    {event.invite_code}
                  </strong>
                </div>
              )}
            </section>
          </>
        )}

        {tab === "drinks" && (
          <>
            <section className="card">
              <div className="sectionTitle">
                <div>
                  <span className="eyebrow">
                    VERWALTUNG
                  </span>

                  <h2>
                    🍺 Getränk hinzufügen
                  </h2>
                </div>
              </div>

              <input
                value={drinkName}
                onChange={(e) =>
                  setDrinkName(
                    e.target.value
                  )
                }
                placeholder="Getränk"
              />

              <div className="formGrid">
                <input
                  value={brand}
                  onChange={(e) =>
                    setBrand(e.target.value)
                  }
                  placeholder="Marke"
                />

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                >
                  <option>Bier</option>
                  <option>Radler</option>
                  <option>Wein</option>
                  <option>Sekt</option>
                  <option>Spirituose</option>
                  <option>Longdrink</option>
                  <option>Softdrink</option>
                  <option>Sonstiges</option>
                </select>

                <input
                  type="number"
                  step="0.1"
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
                  step="0.1"
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
                  step="0.01"
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
                className="primary full"
                onClick={saveDrink}
                disabled={saving}
              >
                🍻 Getränk speichern
              </button>
            </section>

            <section className="card">
              <div className="sectionTitle">
                <div>
                  <span className="eyebrow">
                    GETRÄNKE
                  </span>

                  <h2>
                    🍺 Alle Getränke
                  </h2>
                </div>

                <span className="countBadge">
                  {drinks.length}
                </span>
              </div>

              <div className="drinkList">
                {drinks.length === 0 ? (
                  <div className="empty">
                    🍺 Noch keine Getränke.
                  </div>
                ) : (
                  drinks.map((drink) => (
                    <div
                      className="drink"
                      key={drink.id}
                    >
                      <div className="drinkIcon">
                        🍺
                      </div>

                      <div className="drinkInfo">
                        <strong>
                          {drink.drink_name ??
                            drink.getraenk ??
                            "Getränk"}
                        </strong>

                        <small>
                          {drink.brand ??
                            drink.marke ??
                            ""}
                          {" · "}
                          {Number(
                            drink.liters ??
                              drink.menge ??
                              0
                          ).toFixed(1)}{" "}
                          L
                          {" · "}
                          {Number(
                            drink.alcohol_percent ??
                              drink.alkohol ??
                              0
                          ).toFixed(1)}
                          %
                        </small>
                      </div>

                      <div className="drinkRight">
                        <strong>
                          {Number(
                            drink.price ??
                              drink.preis ??
                              0
                          ).toFixed(2)}{" "}
                          €
                        </strong>

                        <button
                          onClick={() =>
                            assignDrink(
                              drink
                            )
                          }
                        >
                          Zuordnen
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {tab === "beer" && (
          <>
            <section className="beerHero">
              <div className="bigBeer">
                🍺
              </div>

              <h2>
                Ich möchte ein Bier!
              </h2>

              <p>
                Alle anderen Teilnehmer
                bekommen deine Anfrage und
                können zustimmen oder ablehnen.
              </p>

              <textarea
                value={beerMessage}
                onChange={(e) =>
                  setBeerMessage(
                    e.target.value
                  )
                }
                placeholder="Nachricht optional ..."
              />

              <button
                className="beerBigButton"
                onClick={requestBeer}
              >
                🍺 BIER ANFRAGEN
              </button>
            </section>

            <section className="card">
              <div className="sectionTitle">
                <div>
                  <span className="eyebrow">
                    ANFRAGEN
                  </span>

                  <h2>
                    🍻 Bier-Anfragen
                  </h2>
                </div>

                <span className="countBadge">
                  {pendingBeerRequests.length}
                </span>
              </div>

              <div className="requestList">
                {beerRequests.length ===
                0 ? (
                  <div className="empty">
                    🍺 Keine Bier-Anfragen.
                  </div>
                ) : (
                  beerRequests.map(
                    (request) => {
                      const requester =
                        members.find(
                          (member) =>
                            member.profile_id ===
                            request.requester_profile_id
                        );

                      const ownResponse =
                        beerResponses.find(
                          (response) =>
                            response.request_id ===
                              request.id &&
                            response.profile_id ===
                              profile?.id
                        );

                      const responseCount =
                        beerResponses.filter(
                          (response) =>
                            response.request_id ===
                            request.id
                        ).length;

                      return (
                        <div
                          className="request"
                          key={request.id}
                        >
                          <div className="requestTop">
                            <div className="avatar beerAvatar">
                              🍺
                            </div>

                            <div>
                              <strong>
                                {requester
                                  ?.profile
                                  ?.name ??
                                  requester
                                    ?.profile
                                    ?.username ??
                                  "Teilnehmer"}
                              </strong>

                              <small>
                                {request.message}
                              </small>
                            </div>

                            <span
                              className={
                                "status " +
                                request.status
                              }
                            >
                              {request.status ===
                              "accepted"
                                ? "✅"
                                : request.status ===
                                  "declined"
                                ? "❌"
                                : "⏳"}
                            </span>
                          </div>

                          <div className="votes">
                            👍{" "}
                            {responseCount}{" "}
                            Antworten
                          </div>

                          {request.status ===
                            "pending" &&
                            request.requester_profile_id !==
                              profile?.id &&
                            !ownResponse && (
                              <div className="voteButtons">
                                <button
                                  className="accept"
                                  onClick={() =>
                                    answerBeerRequest(
                                      request,
                                      "accepted"
                                    )
                                  }
                                >
                                  ✅ Zustimmen
                                </button>

                                <button
                                  className="decline"
                                  onClick={() =>
                                    answerBeerRequest(
                                      request,
                                      "declined"
                                    )
                                  }
                                >
                                  ❌ Ablehnen
                                </button>
                              </div>
                            )}
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </section>
          </>
        )}

        {tab === "challenges" && (
          <>
            <section className="card challengeCreate">
              <div className="sectionTitle">
                <div>
                  <span className="eyebrow">
                    EVENT
                  </span>

                  <h2>
                    🔥 Challenge erstellen
                  </h2>
                </div>
              </div>

              <input
                value={challengeTitle}
                onChange={(e) =>
                  setChallengeTitle(
                    e.target.value
                  )
                }
                placeholder="Challenge"
              />

              <textarea
                value={
                  challengeDescription
                }
                onChange={(e) =>
                  setChallengeDescription(
                    e.target.value
                  )
                }
                placeholder="Beschreibung"
              />

              <input
                type="number"
                value={challengePoints}
                onChange={(e) =>
                  setChallengePoints(
                    e.target.value
                  )
                }
                placeholder="Punkte"
              />

              <button
                className="primary full"
                onClick={
                  createChallenge
                }
              >
                🔥 Challenge starten
              </button>
            </section>

            <section className="challengeGrid">
              {challenges.length ===
              0 ? (
                <div className="card empty">
                  🔥 Noch keine Challenges.
                </div>
              ) : (
                challenges.map(
                  (challenge) => (
                    <div
                      className="challenge"
                      key={challenge.id}
                    >
                      <div className="challengeIcon">
                        🔥
                      </div>

                      <span className="challengeCategory">
                        {challenge.category ??
                          "Event"}
                      </span>

                      <h3>
                        {challenge.title ??
                          "Challenge"}
                      </h3>

                      <p>
                        {challenge.description ??
                          ""}
                      </p>

                      <div className="challengeBottom">
                        <strong>
                          +{" "}
                          {challenge.points ??
                            0}{" "}
                          Punkte
                        </strong>

                        <span>
                          {challenge.status ??
                            "open"}
                        </span>
                      </div>
                    </div>
                  )
                )
              )}
            </section>
          </>
        )}

        {tab === "ranking" && (
          <section className="card">
            <div className="rankingHero">
              <span>
                🏆
              </span>

              <h2>
                Güstener Ranking
              </h2>

              <p>
                Wer sammelt die meisten Punkte?
              </p>
            </div>

            <div className="rankingList">
              {ranking.length ===
              0 ? (
                <div className="empty">
                  Noch keine Teilnehmer.
                </div>
              ) : (
                ranking.map(
                  (member, index) => (
                    <div
                      className={
                        "rankRow " +
                        (index < 3
                          ? "top"
                          : "")
                      }
                      key={member.id}
                    >
                      <strong className="rankNumber">
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : index + 1}
                      </strong>

                      <div className="avatar">
                        {(
                          member.profile
                            ?.name ??
                          member.profile
                            ?.username ??
                          "?"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="rankName">
                        <strong>
                          {member.profile
                            ?.name ??
                            member.profile
                              ?.username ??
                            "Teilnehmer"}
                        </strong>

                        <small>
                          🍺{" "}
                          {member.profile
                            ?.drinks_count ??
                            0}{" "}
                          Getränke
                        </small>
                      </div>

                      <strong className="points">
                        {member.profile
                          ?.points ??
                          0}{" "}
                        P.
                      </strong>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        )}

        {tab === "stats" && (
          <>
            <section className="statsGrid large">
              <div className="stat">
                <span>🍺</span>
                <strong>
                  {drinks.length}
                </strong>
                <small>
                  Getränke
                </small>
              </div>

              <div className="stat">
                <span>💧</span>
                <strong>
                  {totalLiters.toFixed(1)}
                </strong>
                <small>
                  Liter
                </small>
              </div>

              <div className="stat">
                <span>💶</span>
                <strong>
                  {totalCost.toFixed(2)} €
                </strong>
                <small>
                  Gesamtkosten
                </small>
              </div>

              <div className="stat">
                <span>👥</span>
                <strong>
                  {members.length}
                </strong>
                <small>
                  Teilnehmer
                </small>
              </div>
            </section>

            <section className="card">
              <h2>
                📊 Kostenaufteilung
              </h2>

              <div className="costBig">
                {totalCost.toFixed(2)} €
              </div>

              <div className="costRows">
                <div>
                  <span>
                    👥 Teilnehmer
                  </span>

                  <strong>
                    {members.length}
                  </strong>
                </div>

                <div>
                  <span>
                    💶 Pro Person
                  </span>

                  <strong>
                    {costPerPerson.toFixed(
                      2
                    )}{" "}
                    €
                  </strong>
                </div>

                <div>
                  <span>
                    🏆 Punkte
                  </span>

                  <strong>
                    {members.reduce(
                      (sum, member) =>
                        sum +
                        Number(
                          member.profile
                            ?.points ??
                            0
                        ),
                      0
                    )}
                  </strong>
                </div>
              </div>
            </section>

            {settings.show_promille && (
              <section className="card">
                <h2>
                  ⚠️ Promille
                </h2>

                <div className="promilleBox">
                  <strong>
                    {myPromille.toFixed(
                      2
                    )}{" "}
                    ‰
                  </strong>

                  <span>
                    geschätzter aktueller
                    Wert
                  </span>
                </div>

                <p className="warning">
                  Der Promillewert ist nur eine
                  Schätzung und kein
                  medizinisches Messverfahren.
                </p>
              </section>
            )}
          </>
        )}

        {tab === "settings" && (
          <>
            <section className="card">
              <h2>
                👤 Mein Profil
              </h2>

              <div className="formGrid">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) =>
                    setWeight(
                      e.target.value
                    )
                  }
                  placeholder="Gewicht kg"
                />

                <input
                  type="number"
                  value={height}
                  onChange={(e) =>
                    setHeight(
                      e.target.value
                    )
                  }
                  placeholder="Größe cm"
                />

                <input
                  type="number"
                  value={age}
                  onChange={(e) =>
                    setAge(
                      e.target.value
                    )
                  }
                  placeholder="Alter"
                />

                <select
                  value={gender}
                  onChange={(e) =>
                    setGender(
                      e.target.value
                    )
                  }
                >
                  <option value="male">
                    Männlich
                  </option>

                  <option value="female">
                    Weiblich
                  </option>

                  <option value="other">
                    Divers
                  </option>
                </select>
              </div>

              <button
                className="primary full"
                onClick={
                  updateProfile
                }
              >
                💾 Profil speichern
              </button>
            </section>

            <section className="card">
              <h2>
                ⚙️ Event-Einstellungen
              </h2>

              <SettingsSwitch
                label="Ranking aktivieren"
                value={
                  settings.ranking_enabled
                }
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    ranking_enabled:
                      value,
                  })
                }
              />

              <SettingsSwitch
                label="Punkte anzeigen"
                value={
                  settings.show_points
                }
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    show_points:
                      value,
                  })
                }
              />

              <SettingsSwitch
                label="Ranking anzeigen"
                value={
                  settings.show_ranking
                }
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    show_ranking:
                      value,
                  })
                }
              />

              <SettingsSwitch
                label="Promille anzeigen"
                value={
                  settings.show_promille
                }
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    show_promille:
                      value,
                  })
                }
              />

              <SettingsSwitch
                label="Statistiken anzeigen"
                value={
                  settings.show_statistics
                }
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    show_statistics:
                      value,
                  })
                }
              />

              <SettingsSwitch
                label="Getränkemengen anzeigen"
                value={
                  settings.show_drink_amounts
                }
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    show_drink_amounts:
                      value,
                  })
                }
              />

              <SettingsSwitch
                label="Kostenübersicht"
                value={
                  settings.cost_overview_enabled
                }
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    cost_overview_enabled:
                      value,
                  })
                }
              />

              <SettingsSwitch
                label="Kosten automatisch teilen"
                value={
                  settings.auto_split_costs
                }
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    auto_split_costs:
                      value,
                  })
                }
              />

              <SettingsSwitch
                label="Team-Modus"
                value={
                  settings.team_mode
                }
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    team_mode:
                      value,
                  })
                }
              />

              <SettingsSwitch
                label="Privatsphäre-Modus"
                value={
                  settings.privacy_mode
                }
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    privacy_mode:
                      value,
                  })
                }
              />

              <button
                className="primary full"
                onClick={
                  saveEventSettings
                }
              >
                💾 Einstellungen speichern
              </button>
            </section>
          </>
        )}

        <footer>
          <div className="footerLogo">
            🍻
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

      <div className="bottomNav">
        <button
          className={
            tab === "home"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("home")
          }
        >
          🏠
          <small>
            Home
          </small>
        </button>

        <button
          className={
            tab === "drinks"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("drinks")
          }
        >
          🍺
          <small>
            Getränke
          </small>
        </button>

        <button
          className="bottomBeer"
          onClick={requestBeer}
        >
          🍺
        </button>

        <button
          className={
            tab === "ranking"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("ranking")
          }
        >
          🏆
          <small>
            Ranking
          </small>
        </button>

        <button
          className={
            tab === "settings"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("settings")
          }
        >
          ⚙️
          <small>
            Mehr
          </small>
        </button>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          min-height: 100%;
          background: #070a0d !important;
        }

        body {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          color: #f8fafc;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          border: 0;
        }

        .app {
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          background:
            radial-gradient(
              circle at 50% -10%,
              #263a4d 0,
              #101820 30%,
              #070a0d 70%
            );
        }

        .shell {
          width: min(
            1100px,
            calc(100% - 28px)
          );
          margin: 0 auto;
          padding: 22px 0 110px;
        }

        .loadingPage {
          min-height: 100vh;
          margin: 0;
          padding: 0;
          display: grid;
          place-items: center;
          background: #070a0d;
          color: white;
        }

        .loaderCard {
          text-align: center;
          padding: 30px;
        }

        .loaderCard h1 {
          font-size: 25px;
        }

        .crateIcon {
          font-size: 42px;
          letter-spacing: -10px;
          margin-bottom: 20px;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 10px 0 25px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .brand h1 {
          margin: 0;
          font-size: clamp(
            22px,
            4vw,
            34px
          );
          letter-spacing: -0.7px;
        }

        .brand p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 14px;
        }

        .crateLogo {
          width: 72px;
          height: 72px;
          padding: 9px;
          display: grid;
          grid-template-columns: repeat(
            2,
            1fr
          );
          gap: 2px;
          align-content: center;
          justify-items: center;
          background:
            linear-gradient(
              135deg,
              #b76b20,
              #6f3511
            );
          border: 3px solid #d28a35;
          border-radius: 10px;
          box-shadow:
            inset 0 0 0 2px
              rgba(0, 0, 0, 0.35),
            0 12px 30px
              rgba(0, 0, 0, 0.35);
          font-size: 20px;
          line-height: 19px;
        }

        .heroActions {
          display: flex;
          gap: 9px;
        }

        .crateButton,
        .beerButton {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 13px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 800;
          color: white;
          background: #18222d;
          border: 1px solid #354657;
        }

        .crateButton:hover,
        .beerButton:hover {
          transform: translateY(-1px);
          background: #202d3a;
        }

        .crateButton small,
        .beerButton small {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          margin-top: 2px;
        }

        .crateMini {
          font-size: 17px;
          line-height: 15px;
          background: #8c4918;
          padding: 6px;
          border-radius: 5px;
        }

        .eventCard {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 20px;
          margin-bottom: 14px;
          border: 1px solid #273543;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.08),
              rgba(255, 255, 255, 0.035)
            );
          border-radius: 22px;
        }

        .eyebrow {
          color: #fbbf24;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.6px;
        }

        .eventCard h2 {
          margin: 4px 0;
          font-size: 23px;
        }

        .eventCard p {
          margin: 0;
          color: #94a3b8;
        }

        select,
        input,
        textarea {
          width: 100%;
          color: white;
          background: #101820;
          border: 1px solid #334252;
          border-radius: 12px;
          padding: 13px 14px;
          outline: none;
        }

        select:focus,
        input:focus,
        textarea:focus {
          border-color: #f59e0b;
        }

        textarea {
          min-height: 100px;
          resize: vertical;
        }

        .eventCard select {
          max-width: 310px;
        }

        .tabs {
          display: grid;
          grid-template-columns: repeat(
            7,
            1fr
          );
          gap: 7px;
          padding: 7px;
          background: #0d141b;
          border: 1px solid #202d38;
          border-radius: 18px;
          margin-bottom: 15px;
        }

        .tabs button {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          color: #8796a7;
          background: transparent;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
        }

        .tabs button.active {
          color: #111827;
          background: #f59e0b;
        }

        .tabs i {
          position: absolute;
          right: 7px;
          top: 5px;
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          font-size: 9px;
          font-style: normal;
        }

        .toast {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 100;
          max-width: 420px;
          padding: 14px 17px;
          border-radius: 14px;
          color: #fff;
          background: #182431;
          border: 1px solid #46586b;
          box-shadow:
            0 20px 60px
              rgba(0, 0, 0, 0.5);
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          gap: 10px;
          margin-bottom: 14px;
        }

        .stat {
          padding: 18px;
          text-align: center;
          border: 1px solid #273543;
          background: rgba(
            255,
            255,
            255,
            0.045
          );
          border-radius: 18px;
        }

        .stat span {
          display: block;
          font-size: 25px;
        }

        .stat strong {
          display: block;
          margin: 5px 0;
          font-size: 24px;
        }

        .stat small {
          color: #8998a9;
        }

        .featureGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }

        .featureCard {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 13px;
          align-items: center;
          padding: 18px;
          border-radius: 20px;
          border: 1px solid #334252;
        }

        .beerFeature {
          background:
            linear-gradient(
              135deg,
              rgba(245, 158, 11, 0.18),
              rgba(245, 158, 11, 0.04)
            );
        }

        .crateFeature {
          background:
            linear-gradient(
              135deg,
              rgba(181, 101, 31, 0.2),
              rgba(181, 101, 31, 0.04)
            );
        }

        .featureIcon {
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: rgba(
            255,
            255,
            255,
            0.08
          );
          font-size: 29px;
        }

        .crateVisual {
          font-size: 16px;
          line-height: 14px;
        }

        .featureCard h3 {
          margin: 0;
        }

        .featureCard p {
          margin: 4px 0 10px;
          color: #94a3b8;
          font-size: 13px;
        }

        .featureCard button {
          grid-column: 1 / -1;
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          background: #f59e0b;
          color: #111827;
          font-weight: 900;
          cursor: pointer;
        }

        .card {
          padding: 20px;
          margin-bottom: 14px;
          background: rgba(
            255,
            255,
            255,
            0.045
          );
          border: 1px solid #263442;
          border-radius: 20px;
        }

        .sectionTitle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 16px;
        }

        .sectionTitle h2 {
          margin: 3px 0 0;
        }

        .countBadge {
          min-width: 38px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #182431;
          color: #fbbf24;
          font-weight: 900;
        }

        .addRow,
        .inviteRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .addRow button,
        .inviteRow button {
          padding: 0 20px;
          border-radius: 12px;
          background: #f59e0b;
          color: #111827;
          font-weight: 900;
          cursor: pointer;
        }

        .members,
        .drinkList,
        .requestList,
        .rankingList {
          display: grid;
          gap: 8px;
        }

        .member,
        .drink,
        .request,
        .rankRow {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 15px;
          background: rgba(
            255,
            255,
            255,
            0.045
          );
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.04
            );
        }

        .avatar {
          flex: 0 0 42px;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            linear-gradient(
              135deg,
              #f59e0b,
              #b45309
            );
          color: #111827;
          font-weight: 900;
        }

        .memberInfo,
        .drinkInfo,
        .rankName {
          min-width: 0;
          flex: 1;
        }

        .memberInfo strong,
        .drinkInfo strong,
        .rankName strong {
          display: block;
        }

        .memberInfo small,
        .drinkInfo small,
        .rankName small {
          display: block;
          margin-top: 3px;
          color: #8998a9;
        }

        .miniBadge {
          font-size: 20px;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(
            2,
            1fr
          );
          gap: 9px;
          margin-bottom: 10px;
        }

        .primary {
          background: #f59e0b;
          color: #111827;
          font-weight: 900;
          cursor: pointer;
        }

        .full {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
        }

        .drinkIcon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #1b2732;
          font-size: 22px;
        }

        .drinkRight {
          text-align: right;
        }

        .drinkRight button {
          margin-top: 5px;
          padding: 6px 10px;
          border-radius: 9px;
          background: #273543;
          color: white;
          cursor: pointer;
          font-size: 11px;
        }

        .beerHero {
          text-align: center;
          padding: 35px 20px;
          margin-bottom: 14px;
          border-radius: 24px;
          border: 1px solid #5b451c;
          background:
            radial-gradient(
              circle at top,
              rgba(
                245,
                158,
                11,
                0.2
              ),
              rgba(
                245,
                158,
                11,
                0.03
              )
            );
        }

        .bigBeer {
          font-size: 70px;
          filter: drop-shadow(
            0 10px 20px
              rgba(245, 158, 11, 0.2)
          );
        }

        .beerHero h2 {
          margin: 10px 0 5px;
          font-size: 30px;
        }

        .beerHero p {
          max-width: 520px;
          margin: 0 auto 20px;
          color: #94a3b8;
        }

        .beerHero textarea {
          display: block;
          max-width: 600px;
          margin: 0 auto 10px;
        }

        .beerBigButton {
          width: min(
            600px,
            100%
          );
          padding: 17px;
          border-radius: 14px;
          background: #f59e0b;
          color: #111827;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .request {
          display: block;
        }

        .requestTop {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .beerAvatar {
          background: #f59e0b;
          font-size: 20px;
        }

        .requestTop small {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
        }

        .status {
          margin-left: auto;
          font-size: 20px;
        }

        .votes {
          margin: 9px 0;
          color: #8fa0b0;
          font-size: 12px;
        }

        .voteButtons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .voteButtons button {
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 800;
        }

        .accept {
          background: #166534;
          color: white;
        }

        .decline {
          background: #7f1d1d;
          color: white;
        }

        .challengeCreate textarea {
          margin: 9px 0;
        }

        .challengeGrid {
          display: grid;
          grid-template-columns: repeat(
            2,
            1fr
          );
          gap: 12px;
        }

        .challenge {
          padding: 20px;
          border-radius: 20px;
          border: 1px solid #334252;
          background:
            linear-gradient(
              145deg,
              rgba(
                239,
                68,
                68,
                0.12
              ),
              rgba(
                255,
                255,
                255,
                0.04
              )
            );
        }

        .challengeIcon {
          font-size: 32px;
        }

        .challengeCategory {
          color: #fbbf24;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .challenge h3 {
          margin: 5px 0;
        }

        .challenge p {
          color: #94a3b8;
          min-height: 40px;
        }

        .challengeBottom {
          display: flex;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid #273543;
        }

        .challengeBottom strong {
          color: #fbbf24;
        }

        .challengeBottom span {
          color: #8fa0b0;
        }

        .rankingHero {
          text-align: center;
          padding: 10px 0 25px;
        }

        .rankingHero span {
          font-size: 55px;
        }

        .rankingHero h2 {
          margin: 8px 0 3px;
        }

        .rankingHero p {
          color: #94a3b8;
        }

        .rankRow {
          min-height: 65px;
        }

        .rankRow.top {
          background:
            linear-gradient(
              90deg,
              rgba(
                245,
                158,
                11,
                0.12
              ),
              rgba(
                255,
                255,
                255,
                0.04
              )
            );
        }

        .rankNumber {
          width: 40px;
          text-align: center;
          font-size: 19px;
        }

        .points {
          color: #fbbf24;
        }

        .profileStats {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          gap: 9px;
        }

        .profileStats div {
          text-align: center;
          padding: 13px;
          border-radius: 13px;
          background: #111a22;
        }

        .profileStats span,
        .profileStats strong,
        .profileStats small {
          display: block;
        }

        .profileStats span {
          font-size: 20px;
        }

        .profileStats strong {
          margin: 3px 0;
        }

        .profileStats small {
          color: #8998a9;
          font-size: 10px;
        }

        .inviteCard {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: center;
        }

        .currentCode {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px;
          border-radius: 13px;
          background: #111a22;
        }

        .currentCode span {
          color: #8998a9;
        }

        .currentCode strong {
          color: #fbbf24;
          letter-spacing: 2px;
          font-size: 18px;
        }

        .costBig {
          margin: 15px 0;
          text-align: center;
          font-size: 48px;
          font-weight: 900;
          color: #fbbf24;
        }

        .costRows {
          display: grid;
          gap: 8px;
        }

        .costRows div {
          display: flex;
          justify-content: space-between;
          padding: 14px;
          border-radius: 12px;
          background: #111a22;
        }

        .costRows span {
          color: #94a3b8;
        }

        .promilleBox {
          text-align: center;
          padding: 30px;
          border-radius: 18px;
          background:
            linear-gradient(
              135deg,
              rgba(
                245,
                158,
                11,
                0.14
              ),
              rgba(
                255,
                255,
                255,
                0.04
              )
            );
        }

        .promilleBox strong,
        .promilleBox span {
          display: block;
        }

        .promilleBox strong {
          font-size: 50px;
          color: #fbbf24;
        }

        .promilleBox span {
          color: #94a3b8;
        }

        .warning {
          color: #fbbf24;
          font-size: 12px;
          text-align: center;
        }

        .empty {
          text-align: center;
          padding: 30px;
          color: #7f8d9c;
        }

        .inviteCard p {
          color: #94a3b8;
        }

        footer {
          text-align: center;
          padding: 35px 10px 20px;
          color: #647384;
        }

        .footerLogo {
          font-size: 35px;
          margin-bottom: 8px;
        }

        footer strong,
        footer small {
          display: block;
        }

        footer small {
          margin-top: 5px;
        }

        .bottomNav {
          display: none;
        }

        @media (max-width: 800px) {
          .hero {
            align-items: flex-start;
            flex-direction: column;
          }

          .heroActions {
            width: 100%;
          }

          .heroActions button {
            flex: 1;
          }

          .tabs {
            grid-template-columns: repeat(
              4,
              1fr
            );
          }

          .tabs button:nth-child(
              5
            ),
          .tabs button:nth-child(
              6
            ) {
            display: none;
          }

          .featureGrid,
          .challengeGrid {
            grid-template-columns: 1fr;
          }

          .inviteCard {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .shell {
            width: min(
              100% - 18px,
              1100px
            );
            padding-top: 10px;
          }

          .brand h1 {
            font-size: 22px;
          }

          .brand p {
            font-size: 11px;
          }

          .crateLogo {
            width: 58px;
            height: 58px;
            font-size: 16px;
          }

          .heroActions {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .eventCard {
            align-items: stretch;
            flex-direction: column;
          }

          .eventCard select {
            max-width: none;
          }

          .statsGrid {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .statsGrid.large {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .stat {
            padding: 13px 8px;
          }

          .stat strong {
            font-size: 20px;
          }

          .tabs {
            display: none;
          }

          .formGrid {
            grid-template-columns: 1fr;
          }

          .addRow,
          .inviteRow {
            grid-template-columns: 1fr;
          }

          .addRow button,
          .inviteRow button {
            min-height: 45px;
          }

          .profileStats {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .bottomNav {
            position: fixed;
            display: grid;
            grid-template-columns: repeat(
              5,
              1fr
            );
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 90;
            height: 68px;
            padding: 6px 10px;
            background: rgba(
              9,
              13,
              17,
              0.97
            );
            border-top: 1px solid #273543;
            backdrop-filter: blur(
              15px
            );
          }

          .bottomNav button {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            background: transparent;
            color: #778697;
            cursor: pointer;
            border-radius: 12px;
            font-size: 18px;
          }

          .bottomNav button.active {
            color: #fbbf24;
          }

          .bottomNav small {
            font-size: 9px;
          }

          .bottomBeer {
            width: 56px;
            height: 56px;
            margin: -20px auto 0;
            border-radius: 50% !important;
            background: #f59e0b !important;
            color: #111827 !important;
            box-shadow:
              0 8px 25px
                rgba(
                  245,
                  158,
                  11,
                  0.35
                );
          }

          footer {
            padding-bottom: 30px;
          }

          .toast {
            left: 10px;
            right: 10px;
            top: 10px;
            max-width: none;
          }
        }
      `}</style>
    </main>
  );
}

function SettingsSwitch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="settingRow">
      <span>{label}</span>

      <button
        type="button"
        onClick={() =>
          onChange(!value)
        }
        style={{
          width: 52,
          height: 29,
          borderRadius: 999,
          padding: 3,
          background: value
            ? "#f59e0b"
            : "#273543",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            display: "block",
            width: 23,
            height: 23,
            borderRadius: "50%",
            background: "white",
            transform: value
              ? "translateX(23px)"
              : "translateX(0)",
            transition:
              "transform .2s",
          }}
        />
      </button>
    </div>
  );
}
