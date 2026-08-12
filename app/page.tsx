"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Event = {
  id: string;
  title: string;
  invite_code: string | null;
  cost_overview_enabled: boolean;
  auto_split_costs: boolean;
  ranking_enabled: boolean;
  show_points: boolean;
  show_ranking: boolean;
  show_promille: boolean;
  show_statistics: boolean;
  show_drink_amounts: boolean;
  show_costs: boolean;
  team_mode: boolean;
  show_photos: boolean;
  photo_required: boolean;
  ai_recognition_enabled: boolean;
  manual_entry_allowed: boolean;
  privacy_mode: boolean;
  created_by_profile_id: string | null;
};

type Profile = {
  id: string;
  username: string | null;
  points: number | null;
  drinks_count: number | null;
  gewicht_kg: number | null;
  alter: number | null;
  geschlecht: string | null;
};

type Member = {
  id: string;
  profile_id: string;
  username: string;
  points: number;
  drinks: number;
  gewicht_kg: number;
  alter: number;
  geschlecht: string;
};

type Drink = {
  id: string;
  event_id: string;
  drink_name: string | null;
  getraenk: string | null;
  liters: number | null;
  menge: number | null;
  alcohol_percent: number | null;
  alkohol: number | null;
  preis: number | null;
};

type Consumption = {
  id: string;
  event_id: string;
  drink_id: string;
  profile_id: string;
  created_at: string;
};

type Payment = {
  id: string;
  event_id: string;
  profile_id: string | null;
  bezahlt_von: string | null;
  betrag: number | null;
  status: "offen" | "bezahlt";
};

type SettingKey =
  | "cost_overview_enabled"
  | "auto_split_costs"
  | "ranking_enabled"
  | "show_points"
  | "show_ranking"
  | "show_promille"
  | "show_statistics"
  | "show_drink_amounts"
  | "show_costs"
  | "team_mode"
  | "show_photos"
  | "photo_required"
  | "ai_recognition_enabled"
  | "manual_entry_allowed"
  | "privacy_mode";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [selectedProfile, setSelectedProfile] = useState("");
  const [currentProfileId, setCurrentProfileId] = useState("");

  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSetting, setSavingSetting] =
    useState<SettingKey | null>(null);

  /* FOTO */

  const [drinkPhoto, setDrinkPhoto] = useState<File | null>(null);
  const [drinkPhotoPreview, setDrinkPhotoPreview] =
    useState<string>("");

  const currentEvent = useMemo(
    () =>
      events.find((event) => event.id === eventId) || null,
    [events, eventId]
  );

  const isEventCreator =
    !!currentEvent &&
    !!currentProfileId &&
    currentEvent.created_by_profile_id === currentProfileId;

  useEffect(() => {
    loadProfiles();
    loadEvents();

    const savedProfile = localStorage.getItem(
      "guesten-current-profile"
    );

    if (savedProfile) {
      setCurrentProfileId(savedProfile);
    }
  }, []);

  useEffect(() => {
    if (!eventId) return;

    localStorage.setItem(
      "guesten-active-event",
      eventId
    );

    refreshEvent();
  }, [eventId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  function handleDrinkPhoto(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("❌ Bitte ein Bild auswählen.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage(
        "❌ Das Foto darf maximal 10 MB groß sein."
      );
      return;
    }

    setDrinkPhoto(file);

    const previewUrl = URL.createObjectURL(file);

    setDrinkPhotoPreview(previewUrl);

    setMessage(
      "📸 Getränkefoto ausgewählt."
    );
  }

  function removeDrinkPhoto() {
    if (drinkPhotoPreview) {
      URL.revokeObjectURL(drinkPhotoPreview);
    }

    setDrinkPhoto(null);
    setDrinkPhotoPreview("");

    setMessage(
      "↩️ Getränkefoto entfernt."
    );
  }

  async function refreshEvent() {
    await Promise.all([
      loadMembers(),
      loadDrinks(),
      loadConsumptions(),
      loadPayments(),
      loadInviteCode(),
    ]);
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        invite_code,
        cost_overview_enabled,
        auto_split_costs,
        ranking_enabled,
        show_points,
        show_ranking,
        show_promille,
        show_statistics,
        show_drink_amounts,
        show_costs,
        team_mode,
        show_photos,
        photo_required,
        ai_recognition_enabled,
        manual_entry_allowed,
        privacy_mode,
        created_by_profile_id
      `)
      .order("start_date", {
        ascending: false,
      });

    if (error) {
      setMessage("❌ Events: " + error.message);
      return;
    }

    const result = data || [];

    setEvents(result);

    if (!result.length) return;

    const saved = localStorage.getItem(
      "guesten-active-event"
    );

    const exists = result.some(
      (event) => event.id === saved
    );

    setEventId(
      saved && exists
        ? saved
        : result[0].id
    );
  }

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,username,points,drinks_count,gewicht_kg,alter,geschlecht"
      )
      .order("username");

    if (error) {
      setMessage("❌ Profile: " + error.message);
      return;
    }

    const result = data || [];

    setProfiles(result);

    const saved = localStorage.getItem(
      "guesten-current-profile"
    );

    const validSaved = result.some(
      (profile) => profile.id === saved
    );

    if (!currentProfileId && result.length) {
      const id =
        saved && validSaved
          ? saved
          : result[0].id;

      setCurrentProfileId(id);

      localStorage.setItem(
        "guesten-current-profile",
        id
      );
    }
  }

  async function loadMembers() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("event_members")
      .select(`
        id,
        profile_id,
        profiles (
          id,
          username,
          points,
          drinks_count,
          gewicht_kg,
          alter,
          geschlecht
        )
      `)
      .eq("event_id", eventId);

    if (error) {
      setMessage(
        "❌ Teilnehmer: " +
          error.message
      );
      return;
    }

    const result: Member[] =
      (data || []).map((row: any) => {
        const profile =
          Array.isArray(row.profiles)
            ? row.profiles[0]
            : row.profiles;

        return {
          id: row.id,
          profile_id: row.profile_id,
          username:
            profile?.username ||
            "Teilnehmer",
          points: Number(
            profile?.points || 0
          ),
          drinks: Number(
            profile?.drinks_count || 0
          ),
          gewicht_kg: Number(
            profile?.gewicht_kg || 82
          ),
          alter: Number(
            profile?.alter || 33
          ),
          geschlecht:
            profile?.geschlecht ||
            "männlich",
        };
      });

    setMembers(result);
  }

  async function loadDrinks() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drinks")
      .select(`
        id,
        event_id,
        drink_name,
        getraenk,
        liters,
        menge,
        alcohol_percent,
        alkohol,
        preis
      `)
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "❌ Getränke: " +
          error.message
      );
      return;
    }

    setDrinks(data || []);
  }

  async function loadConsumptions() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("drink_consumptions")
      .select(
        "id,event_id,drink_id,profile_id,created_at"
      )
      .eq("event_id", eventId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setMessage(
        "❌ Trinkverlauf: " +
          error.message
      );
      return;
    }

    setConsumptions(data || []);
  }

  async function loadPayments() {
    if (!eventId) return;

    const { data, error } = await supabase
      .from("payments")
      .select(
        "id,event_id,profile_id,bezahlt_von,betrag,status"
      )
      .eq("event_id", eventId);

    if (error) {
      setMessage(
        "❌ Zahlungen: " +
          error.message
      );
      return;
    }

    setPayments(data || []);
  }

  async function loadInviteCode() {
    if (!eventId) return;

    const { data } = await supabase
      .from("events")
      .select("invite_code")
      .eq("id", eventId)
      .single();

    setInviteCode(
      data?.invite_code || ""
    );
  }

  async function createInviteCode() {
    if (!eventId) return;

    if (!isEventCreator) {
      setMessage(
        "❌ Nur der Ersteller kann den Einladungscode ändern."
      );
      return;
    }

    const code =
      "GZ-" +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const { error } = await supabase
      .from("events")
      .update({
        invite_code: code,
      })
      .eq("id", eventId);

    if (error) {
      setMessage(
        "❌ Code: " +
          error.message
      );
      return;
    }

    setInviteCode(code);

    await loadEvents();

    setMessage(
      "✅ Neuer Einladungscode erstellt."
    );
  }

  async function copyInviteCode() {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(
        inviteCode
      );

      setMessage(
        "✅ Einladungscode kopiert."
      );
    } catch {
      setMessage(
        "ℹ️ Code: " + inviteCode
      );
    }
  }

  async function joinEventWithCode() {
    setMessage("");

    const code = joinCode
      .trim()
      .toUpperCase();

    if (!code) {
      setMessage(
        "❌ Bitte Einladungscode eingeben."
      );
      return;
    }

    const { data: event } =
      await supabase
        .from("events")
        .select(
          "id,title,invite_code"
        )
        .eq(
          "invite_code",
          code
        )
        .maybeSingle();

    if (!event) {
      setMessage(
        "❌ Einladungscode ist ungültig."
      );
      return;
    }

    const profile =
      profiles.find(
        (item) =>
          item.id === currentProfileId
      ) || profiles[0];

    if (!profile) {
      setMessage(
        "❌ Kein Profil vorhanden."
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
          profile.id
        )
        .maybeSingle();

    if (!existing) {
      const { error } =
        await supabase
          .from("event_members")
          .insert({
            event_id: event.id,
            profile_id:
              profile.id,
            joined_at:
              new Date().toISOString(),
            joined_via_code:
              code,
          });

      if (error) {
        setMessage(
          "❌ Beitreten: " +
            error.message
        );
        return;
      }
    }

    setEventId(event.id);
    setJoinCode("");

    await loadMembers();

    setMessage(
      `✅ Du bist dem Event „${event.title}“ beigetreten.`
    );
  }

  async function addParticipant() {
    if (
      !eventId ||
      !selectedProfile
    ) {
      setMessage(
        "❌ Bitte Teilnehmer auswählen."
      );
      return;
    }

    if (!isEventCreator) {
      setMessage(
        "❌ Nur der Ersteller kann Teilnehmer hinzufügen."
      );
      return;
    }

    if (
      members.some(
        (member) =>
          member.profile_id ===
          selectedProfile
      )
    ) {
      setMessage(
        "❌ Teilnehmer ist bereits dabei."
      );
      return;
    }

    const { error } =
      await supabase
        .from("event_members")
        .insert({
          event_id: eventId,
          profile_id:
            selectedProfile,
          joined_at:
            new Date().toISOString(),
        });

    if (error) {
      setMessage(
        "❌ Teilnehmer: " +
          error.message
      );
      return;
    }

    setSelectedProfile("");

    await loadMembers();

    setMessage(
      "✅ Teilnehmer hinzugefügt."
    );
  }

  async function removeParticipant(
    memberId: string
  ) {
    if (!isEventCreator) {
      setMessage(
        "❌ Nur der Ersteller kann Teilnehmer entfernen."
      );
      return;
    }

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
        "❌ Entfernen: " +
          error.message
      );
      return;
    }

    await loadMembers();

    setMessage(
      "✅ Teilnehmer entfernt."
    );
  }

  async function saveDrink() {
    setMessage("");

    if (!eventId) {
      setMessage(
        "❌ Kein Event ausgewählt."
      );
      return;
    }

    if (
      currentEvent &&
      !currentEvent.manual_entry_allowed
    ) {
      setMessage(
        "❌ Manuelle Getränkeeingabe ist für dieses Event deaktiviert."
      );
      return;
    }

    if (!drinkName.trim()) {
      setMessage(
        "❌ Bitte Getränk eingeben."
      );
      return;
    }

    if (
      currentEvent?.photo_required &&
      !drinkPhoto
    ) {
      setMessage(
        "❌ Für dieses Event ist ein Getränkefoto erforderlich."
      );
      return;
    }

    const { error } =
      await supabase
        .from("drinks")
        .insert({
          event_id: eventId,
          drink_name:
            drinkName.trim(),
          getraenk:
            drinkName.trim(),
          liters:
            Number(liters),
          menge:
            Number(liters),
          alcohol_percent:
            Number(alcohol),
          alkohol:
            Number(alcohol),
          preis:
            Number(price),
          quantity: 1,
        });

    if (error) {
      setMessage(
        "❌ Getränk: " +
          error.message
      );
      return;
    }

    removeDrinkPhoto();

    setDrinkName("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");

    await loadDrinks();

    setMessage(
      "✅ Getränk gespeichert."
    );
  }

  async function toggleEventSetting(
    key: SettingKey
  ) {
    if (!currentEvent) return;

    if (!isEventCreator) {
      setMessage(
        "❌ Nur der Ersteller kann Event-Einstellungen ändern."
      );
      return;
    }

    const value =
      !currentEvent[key];

    setSavingSetting(key);

    const { error } =
      await supabase
        .from("events")
        .update({
          [key]: value,
        })
        .eq(
          "id",
          currentEvent.id
        );

    setSavingSetting(null);

    if (error) {
      setMessage(
        "❌ Einstellung: " +
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
              [key]: value,
            }
          : event
      )
    );

    setMessage(
      "✅ Event-Einstellung geändert."
    );
  }

  function getDrinkName(
    drink: Drink
  ) {
    return (
      drink.drink_name ||
      drink.getraenk ||
      "Getränk"
    );
  }

  function getDrinkLiters(
    drink: Drink
  ) {
    return Number(
      drink.liters ??
        drink.menge ??
        0
    );
  }

  function getDrinkAlcohol(
    drink: Drink
  ) {
    return Number(
      drink.alcohol_percent ??
        drink.alkohol ??
        0
    );
  }

  function getMemberConsumptions(
    profileId: string
  ) {
    return consumptions.filter(
      (item) =>
        item.profile_id ===
        profileId
    );
  }

  function getMemberDrinkCount(
    profileId: string
  ) {
    return getMemberConsumptions(
      profileId
    ).length;
  }

  function getMemberPoints(
    profileId: string
  ) {
    return (
      getMemberDrinkCount(
        profileId
      ) * 10
    );
  }

  function calculatePromille(
    profileId: string
  ) {
    const member =
      members.find(
        (item) =>
          item.profile_id ===
          profileId
      );

    if (!member) return 0;

    const personal =
      getMemberConsumptions(
        profileId
      );

    const faktor =
      member.geschlecht
        ?.toLowerCase()
        .includes("frau")
        ? 0.55
        : 0.68;

    const weight =
      member.gewicht_kg >
      0
        ? member.gewicht_kg
        : 82;

    let result = 0;

    for (
      const consumption of personal
    ) {
      const drink =
        drinks.find(
          (item) =>
            item.id ===
            consumption.drink_id
        );

      if (!drink) continue;

      const alcoholGrams =
        getDrinkLiters(
          drink
        ) *
        1000 *
        (getDrinkAlcohol(
          drink
        ) /
          100) *
        0.789;

      const initial =
        alcoholGrams /
        (weight *
          faktor);

      const elapsedHours =
        Math.max(
          0,
          (now -
            new Date(
              consumption.created_at
            ).getTime()) /
            3600000
        );

      const remaining =
        Math.max(
          0,
          initial -
            elapsedHours *
              0.15
        );

      result += remaining;
    }

    return Number(
      Math.max(
        0,
        result
      ).toFixed(2)
    );
  }

  async function drinkNow(
    drinkId: string
  ) {
    if (!currentProfileId) {
      setMessage(
        "❌ Bitte zuerst einen Teilnehmer auswählen."
      );
      return;
    }

    if (
      !members.some(
        (member) =>
          member.profile_id ===
          currentProfileId
      )
    ) {
      setMessage(
        "❌ Teilnehmer ist nicht im Event."
      );
      return;
    }

    const { error } =
      await supabase
        .from(
          "drink_consumptions"
        )
        .insert({
          event_id: eventId,
          drink_id: drinkId,
          profile_id:
            currentProfileId,
        });

    if (error) {
      setMessage(
        "❌ Trinkvorgang: " +
          error.message
      );
      return;
    }

    const newCount =
      getMemberDrinkCount(
        currentProfileId
      ) + 1;

    await supabase
      .from("profiles")
      .update({
        drinks_count:
          newCount,
        points:
          newCount * 10,
      })
      .eq(
        "id",
        currentProfileId
      );

    await loadConsumptions();
    await loadMembers();

    setMessage(
      "🍺 Getränk hinzugefügt. +10 Punkte"
    );
  }

  async function removeConsumption(
    consumption: Consumption
  ) {
    if (
      consumption.profile_id !==
      currentProfileId
    ) {
      setMessage(
        "❌ Du kannst nur deine eigenen Getränke entfernen."
      );
      return;
    }

    const { error } =
      await supabase
        .from(
          "drink_consumptions"
        )
        .delete()
        .eq(
          "id",
          consumption.id
        );

    if (error) {
      setMessage(
        "❌ Entfernen: " +
          error.message
      );
      return;
    }

    await loadConsumptions();

    const remaining =
      getMemberDrinkCount(
        consumption.profile_id
      );

    await supabase
      .from("profiles")
      .update({
        drinks_count:
          remaining,
        points:
          remaining * 10,
      })
      .eq(
        "id",
        consumption.profile_id
      );

    await loadMembers();

    setMessage(
      "↩️ Getränk entfernt."
    );
  }

  async function togglePayment(
    member: Member
  ) {
    if (!currentEvent?.cost_overview_enabled) {
      return;
    }

    const totalCost =
      consumptions.reduce(
        (sum, consumption) => {
          const drink =
            drinks.find(
              (item) =>
                item.id ===
                consumption.drink_id
            );

          return (
            sum +
            Number(
              drink?.preis ||
                0
            )
          );
        },
        0
      );

    const amountPerPerson =
      currentEvent.auto_split_costs &&
      members.length
        ? totalCost /
          members.length
        : 0;

    const existing =
      payments.find(
        (payment) =>
          payment.profile_id ===
          member.profile_id
      );

    const status =
      existing?.status ===
      "bezahlt"
        ? "offen"
        : "bezahlt";

    if (existing) {
      const { error } =
        await supabase
          .from("payments")
          .update({
            status,
            betrag:
              amountPerPerson,
          })
          .eq(
            "id",
            existing.id
          );

      if (error) {
        setMessage(
          "❌ Zahlung: " +
            error.message
        );
        return;
      }
    } else {
      const { error } =
        await supabase
          .from("payments")
          .insert({
            event_id:
              eventId,
            profile_id:
              member.profile_id,
            bezahlt_von:
              member.profile_id,
            betrag:
              amountPerPerson,
            status,
          });

      if (error) {
        setMessage(
          "❌ Zahlung: " +
            error.message
        );
        return;
      }
    }

    await loadPayments();

    setMessage(
      status ===
        "bezahlt"
        ? `✅ ${member.username} hat bezahlt.`
        : `↩️ ${member.username} wieder auf offen gesetzt.`
    );
  }

  const drinkUsage =
    useMemo(() => {
      const result: Record<
        string,
        number
      > = {};

      for (
        const item of consumptions
      ) {
        result[item.drink_id] =
          (result[
            item.drink_id
          ] || 0) + 1;
      }

      return result;
    }, [consumptions]);

  const sortedDrinks =
    useMemo(
      () =>
        [...drinks].sort(
          (a, b) =>
            (drinkUsage[
              b.id
            ] || 0) -
            (drinkUsage[
              a.id
            ] || 0)
        ),
      [drinks, drinkUsage]
    );

  const totalCost =
    consumptions.reduce(
      (sum, consumption) => {
        const drink =
          drinks.find(
            (item) =>
              item.id ===
              consumption.drink_id
          );

        return (
          sum +
          Number(
            drink?.preis || 0
          )
        );
      },
      0
    );

  const totalLiters =
    consumptions.reduce(
      (sum, consumption) => {
        const drink =
          drinks.find(
            (item) =>
              item.id ===
              consumption.drink_id
          );

        return (
          sum +
          (drink
            ? getDrinkLiters(
                drink
              )
            : 0)
        );
      },
      0
    );

  const amountPerPerson =
    currentEvent?.auto_split_costs &&
    members.length
      ? totalCost /
        members.length
      : 0;

  const totalPoints =
    members.reduce(
      (sum, member) =>
        sum +
        getMemberPoints(
          member.profile_id
        ),
      0
    );

  const ranking =
    [...members].sort(
      (a, b) =>
        getMemberPoints(
          b.profile_id
        ) -
        getMemberPoints(
          a.profile_id
        )
    );

  const paidCount =
    members.filter(
      (member) =>
        payments.some(
          (payment) =>
            payment.profile_id ===
              member.profile_id &&
            payment.status ===
              "bezahlt"
        )
    ).length;

  const openCount =
    members.length -
    paidCount;

  const currentMember =
    members.find(
      (member) =>
        member.profile_id ===
        currentProfileId
    );

  const currentConsumptions =
    consumptions.filter(
      (item) =>
        item.profile_id ===
        currentProfileId
    );

  const currentPromille =
    currentMember
      ? calculatePromille(
          currentProfileId
        )
      : 0;

  function settingLabel(
    key: SettingKey
  ) {
    const labels: Record<
      SettingKey,
      string
    > = {
      cost_overview_enabled:
        "💶 Kostenberechnung",
      auto_split_costs:
        "➗ Kosten automatisch teilen",
      ranking_enabled:
        "🏆 Ranking",
      show_points:
        "⭐ Punkte",
      show_ranking:
        "🏆 Rangliste",
      show_promille:
        "🍷 Promille",
      show_statistics:
        "📊 Statistiken",
      show_drink_amounts:
        "🍺 Trinkmengen",
      show_costs:
        "💰 Getränkepreise",
      team_mode:
        "👥 Team-Modus",
      show_photos:
        "📸 Fotos",
      photo_required:
        "📷 Foto erforderlich",
      ai_recognition_enabled:
        "🤖 KI-Erkennung",
      manual_entry_allowed:
        "✍️ Manuelle Eingabe",
      privacy_mode:
        "🔒 Privatsphäre-Modus",
    };

    return labels[key];
  }

  function settingDescription(
    key: SettingKey
  ) {
    const descriptions: Record<
      SettingKey,
      string
    > = {
      cost_overview_enabled:
        "Kostenaufteilung und Zahlungen anzeigen.",
      auto_split_costs:
        "Gesamtkosten automatisch gleichmäßig verteilen.",
      ranking_enabled:
        "Das komplette Ranking aktivieren.",
      show_points:
        "Punkte bei Teilnehmern anzeigen.",
      show_ranking:
        "Die Rangliste anzeigen.",
      show_promille:
        "Promilleanzeige anzeigen.",
      show_statistics:
        "Statistikbereich anzeigen.",
      show_drink_amounts:
        "Getrunkene Mengen anzeigen.",
      show_costs:
        "Preise der Getränke anzeigen.",
      team_mode:
        "Teilnehmer in Teams organisieren.",
      show_photos:
        "Fotos bei Getränken erlauben.",
      photo_required:
        "Bei jedem Getränk ein Foto verlangen.",
      ai_recognition_enabled:
        "KI-Erkennung für Getränke aktivieren.",
      manual_entry_allowed:
        "Getränke manuell eingeben erlauben.",
      privacy_mode:
        "Persönliche Daten stärker ausblenden.",
    };

    return descriptions[key];
  }

  const settings: SettingKey[] = [
    "cost_overview_enabled",
    "auto_split_costs",
    "ranking_enabled",
    "show_points",
    "show_ranking",
    "show_promille",
    "show_statistics",
    "show_drink_amounts",
    "show_costs",
    "team_mode",
    "show_photos",
    "photo_required",
    "ai_recognition_enabled",
    "manual_entry_allowed",
    "privacy_mode",
  ];

  return (
    <main className="page">
      <div className="container">

        <header className="header">
          <div className="logo">
            🍻
          </div>

          <div>
            <h1>
              Güstener Zapfhahn Zentrale
            </h1>

            <p>
              Events · Getränke · Kosten · Rankings
            </p>
          </div>
        </header>

        <section className="card">
          <h2>
            📅 Aktuelles Event
          </h2>

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

          {eventId && (
            <div className="inviteBox">

              <h3>
                🔗 Freunde einladen
              </h3>

              <p>
                Teile diesen Code:
              </p>

              <div className="codeRow">
                <strong>
                  {inviteCode ||
                    "------"}
                </strong>

                <button
                  onClick={
                    copyInviteCode
                  }
                >
                  📋 Kopieren
                </button>
              </div>

              {isEventCreator && (
                <button
                  className="newCode"
                  onClick={
                    createInviteCode
                  }
                >
                  🔄 Neuen Code erstellen
                </button>
              )}

            </div>
          )}

          {currentEvent && (
            <div className="management">

              <button
                className="managementButton"
                onClick={() =>
                  setSettingsOpen(
                    !settingsOpen
                  )
                }
              >
                ⚙️ Event-Verwaltung

                <span>
                  {settingsOpen
                    ? "▲"
                    : "▼"}
                </span>
              </button>

              {settingsOpen && (
                <div className="settings">

                  <p className="settingsInfo">
                    {isEventCreator
                      ? "Du bist der Ersteller dieses Events und kannst die Einstellungen ändern."
                      : "Nur der Ersteller kann diese Einstellungen ändern."}
                  </p>

                  {settings.map(
                    (key) => {

                      const enabled =
                        !!currentEvent[
                          key
                        ];

                      return (
                        <div
                          className="setting"
                          key={key}
                        >

                          <div className="settingText">

                            <strong>
                              {settingLabel(
                                key
                              )}
                            </strong>

                            <small>
                              {settingDescription(
                                key
                              )}
                            </small>

                          </div>

                          <button
                            className={
                              enabled
                                ? "toggle on"
                                : "toggle off"
                            }
                            disabled={
                              !isEventCreator ||
                              savingSetting ===
                                key
                            }
                            onClick={() =>
                              toggleEventSetting(
                                key
                              )
                            }
                          >
                            {enabled
                              ? "🟢 AN"
                              : "⚫ AUS"}
                          </button>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>
          )}

        </section>

        <section className="card">
          <h2>
            👥 Event beitreten
          </h2>

          <p>
            Einladungscode eingeben:
          </p>

          <div className="joinBox">

            <input
              value={joinCode}
              onChange={(e) =>
                setJoinCode(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="z.B. GZ-F4B4D4"
              maxLength={10}
            />

            <button
              onClick={
                joinEventWithCode
              }
            >
              🚀 Beitreten
            </button>

          </div>
        </section>

        {(!currentEvent ||
          currentEvent.show_statistics) && (
          <div className="stats">

            <div className="stat">
              <span>🍺</span>

              <strong>
                {consumptions.length}
              </strong>

              <small>
                Getrunken
              </small>
            </div>

            <div className="stat">
              <span>💧</span>

              <strong>
                {totalLiters.toFixed(
                  1
                )}
              </strong>

              <small>
                Liter
              </small>
            </div>

            {(!currentEvent ||
              currentEvent.show_costs) && (
              <div className="stat">
                <span>💶</span>

                <strong>
                  {totalCost.toFixed(
                    2
                  )} €
                </strong>

                <small>
                  Tatsächlich getrunken
                </small>
              </div>
            )}

            <div className="stat">
              <span>👥</span>

              <strong>
                {members.length}
              </strong>

              <small>
                Teilnehmer
              </small>
            </div>

          </div>
        )}

        <section className="card">
          <h2>
            👥 Teilnehmer
          </h2>

          <div className="profileSelect">

            <label>
              Aktiver Teilnehmer
            </label>

            <select
              value={
                currentProfileId
              }
              onChange={(e) => {
                setCurrentProfileId(
                  e.target.value
                );

                localStorage.setItem(
                  "guesten-current-profile",
                  e.target.value
                );
              }}
            >

              <option value="">
                Teilnehmer auswählen
              </option>

              {members.map(
                (member) => (
                  <option
                    key={
                      member.profile_id
                    }
                    value={
                      member.profile_id
                    }
                  >
                    {member.username}
                  </option>
                )
              )}

            </select>

          </div>

          {isEventCreator &&
            profiles.filter(
              (profile) =>
                !members.some(
                  (member) =>
                    member.profile_id ===
                    profile.id
                )
            ).length > 0 && (

              <div className="addParticipant">

                <select
                  value={
                    selectedProfile
                  }
                  onChange={(e) =>
                    setSelectedProfile(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Teilnehmer auswählen
                  </option>

                  {profiles
                    .filter(
                      (profile) =>
                        !members.some(
                          (member) =>
                            member.profile_id ===
                            profile.id
                        )
                    )
                    .map(
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
                            "Unbenannt"}
                        </option>
                      )
                    )}

                </select>

                <button
                  onClick={
                    addParticipant
                  }
                >
                  ➕ Hinzufügen
                </button>

              </div>
            )}

          {members.map(
            (member) => (

              <div
                className="member"
                key={member.id}
              >

                <div className="avatar">
                  {member.username
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>

                  <strong>
                    {member.username}
                  </strong>

                  {(!currentEvent ||
                    currentEvent.show_drink_amounts) && (
                    <small>
                      🍺{" "}
                      {getMemberDrinkCount(
                        member.profile_id
                      )}
                    </small>
                  )}

                  {(!currentEvent ||
                    currentEvent.show_points) && (
                    <small>
                      🏆{" "}
                      {getMemberPoints(
                        member.profile_id
                      )}{" "}
                      Punkte
                    </small>
                  )}

                  {(!currentEvent ||
                    currentEvent.show_promille) && (
                    <small className="promilleSmall">
                      🍷{" "}
                      {calculatePromille(
                        member.profile_id
                      ).toFixed(2)}
                      {" ‰"}
                    </small>
                  )}

                </div>

                {isEventCreator && (
                  <button
                    className="remove"
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
            )
          )}

        </section>

        {(!currentEvent ||
          currentEvent.manual_entry_allowed) && (
          <section className="card">

            <h2>
              🍺 Getränk hinzufügen
            </h2>

            {/* FOTO */}

            {(!currentEvent ||
              currentEvent.show_photos ||
              currentEvent.ai_recognition_enabled) && (
              <div className="photoBox">

                <div className="photoHeader">
                  <div>
                    <strong>
                      📸 Getränk fotografieren
                    </strong>

                    <small>
                      Foto aufnehmen oder aus der Galerie auswählen.
                    </small>
                  </div>

                  {currentEvent?.ai_recognition_enabled && (
                    <span className="aiBadge">
                      🤖 KI
                    </span>
                  )}
                </div>

                <label className="photoButton">

                  📸 Foto aufnehmen

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={
                      handleDrinkPhoto
                    }
                    hidden
                  />

                </label>

                {drinkPhotoPreview && (
                  <div className="photoPreview">

                    <img
                      src={
                        drinkPhotoPreview
                      }
                      alt="Getränkevorschau"
                    />

                    <div className="photoActions">

                      <strong>
                        📸 Foto ausgewählt
                      </strong>

                      <button
                        type="button"
                        className="removePhoto"
                        onClick={
                          removeDrinkPhoto
                        }
                      >
                        × Entfernen
                      </button>

                    </div>

                    {currentEvent?.ai_recognition_enabled && (
                      <div className="aiInfo">
                        🤖 Die automatische
                        Getränkeerkennung wird
                        im nächsten Schritt
                        mit diesem Foto verbunden.
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

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
              className="save"
              onClick={
                saveDrink
              }
            >
              🍻 Getränk speichern
            </button>

          </section>
        )}

        <section className="card">

          <h2>
            🍺 Getränke
          </h2>

          <p>
            Getränk anklicken, um es einem
            Teilnehmer zuzuordnen.
          </p>

          {sortedDrinks.map(
            (drink) => {

              const usage =
                drinkUsage[
                  drink.id
                ] || 0;

              return (
                <div
                  className="drink"
                  key={drink.id}
                >

                  <div className="drinkMain">

                    <div className="drinkIcon">
                      🍺
                    </div>

                    <div>

                      <strong>
                        {getDrinkName(
                          drink
                        )}
                      </strong>

                      {(!currentEvent ||
                        currentEvent.show_drink_amounts) && (
                        <small>
                          {getDrinkLiters(
                            drink
                          ).toFixed(1)}
                          {" L · "}
                          {getDrinkAlcohol(
                            drink
                          ).toFixed(1)}
                          {" % · "}
                          {usage}
                          × getrunken
                        </small>
                      )}

                      {(!currentEvent ||
                        currentEvent.show_costs) && (
                        <small>
                          {Number(
                            drink.preis ||
                              0
                          ).toFixed(2)}
                          € pro Getränk
                        </small>
                      )}

                    </div>

                  </div>

                  <button
                    className="drinkButton"
                    disabled={
                      !currentProfileId
                    }
                    onClick={() =>
                      drinkNow(
                        drink.id
                      )
                    }
                  >
                    🍺{" "}
                    {currentMember?.username ||
                      "Teilnehmer"}{" "}
                    +1
                  </button>

                </div>
              );
            }
          )}

        </section>

        <section className="card">

          <h2>
            🍻 Meine Getränke
          </h2>

          <p>
            Hier kannst du eigene
            Trinkvorgänge wieder entfernen.
          </p>

          {currentConsumptions.length ===
          0 ? (
            <div className="empty">
              Noch keine Getränke
              getrunken.
            </div>
          ) : (
            currentConsumptions.map(
              (consumption) => {

                const drink =
                  drinks.find(
                    (item) =>
                      item.id ===
                      consumption.drink_id
                  );

                return (
                  <div
                    className="consumption"
                    key={
                      consumption.id
                    }
                  >

                    <div>

                      <strong>
                        🍺{" "}
                        {drink
                          ? getDrinkName(
                              drink
                            )
                          : "Getränk"}
                      </strong>

                      <small>
                        {new Date(
                          consumption.created_at
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

                    <button
                      className="undo"
                      onClick={() =>
                        removeConsumption(
                          consumption
                        )
                      }
                    >
                      ↩️ Entfernen
                    </button>

                  </div>
                );
              }
            )
          )}

        </section>

        {(!currentEvent ||
          currentEvent.show_promille) && (
          <section className="card promilleCard">

            <h2>
              🍷 Aktuelle Promille
            </h2>

            {currentMember ? (
              <>
                <h3>
                  {currentMember.username}
                </h3>

                <p>
                  Gewicht:{" "}
                  {
                    currentMember.gewicht_kg
                  }
                  {" kg · Alter: "}
                  {
                    currentMember.alter
                  }
                </p>

                <div className="promille">
                  {currentPromille.toFixed(
                    2
                  )}
                  {" ‰"}
                </div>

                <div className="promilleInfo">

                  <strong>
                    🔄 Automatisch aktuell
                  </strong>

                  <small>
                    Die Berechnung berücksichtigt
                    die einzelnen Trinkzeiten
                    und den geschätzten
                    Alkoholabbau.
                  </small>

                  <small>
                    Letzte Aktualisierung:{" "}
                    {new Date(
                      now
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

                <p className="warning">
                  ⚠️ Die Promilleanzeige
                  ist nur eine rechnerische
                  Schätzung und darf nicht
                  zur Beurteilung der
                  Fahrtüchtigkeit verwendet
                  werden.
                </p>

              </>
            ) : (
              <p>
                Bitte zuerst einen
                Teilnehmer auswählen.
              </p>
            )}

          </section>
        )}

        {(!currentEvent ||
          currentEvent.show_statistics) && (
          <section className="card">

            <h2>
              📋 Trinkverlauf
            </h2>

            {consumptions.length ===
            0 ? (
              <p>
                Noch keine Getränke.
              </p>
            ) : (
              consumptions.map(
                (consumption) => {

                  const drink =
                    drinks.find(
                      (item) =>
                        item.id ===
                        consumption.drink_id
                    );

                  const member =
                    members.find(
                      (item) =>
                        item.profile_id ===
                        consumption.profile_id
                    );

                  return (
                    <div
                      className="history"
                      key={
                        consumption.id
                      }
                    >

                      <div>

                        <strong>
                          🍺{" "}
                          {member?.username ||
                            "Teilnehmer"}
                        </strong>

                        <small>
                          {drink
                            ? getDrinkName(
                                drink
                              )
                            : "Getränk"}
                          {" · "}
                          {new Date(
                            consumption.created_at
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

                      {(!currentEvent ||
                        currentEvent.show_points) && (
                        <span>
                          +10
                        </span>
                      )}

                    </div>
                  );
                }
              )
            )}

          </section>
        )}

        {(!currentEvent ||
          currentEvent.cost_overview_enabled) && (
          <section className="card">

            <h2>
              💶 Kostenaufteilung
            </h2>

            <div className="total">
              {totalCost.toFixed(
                2
              )} €
            </div>

            <p className="center">
              Tatsächlich getrunkene Getränke
            </p>

            <div className="row">
              <span>
                🍺 Getrunken
              </span>

              <strong>
                {consumptions.length}
              </strong>
            </div>

            <div className="row">
              <span>
                👥 Teilnehmer
              </span>

              <strong>
                {members.length}
              </strong>
            </div>

            {currentEvent
              ?.auto_split_costs && (
              <div className="row">

                <span>
                  💶 Pro Person
                </span>

                <strong>
                  {amountPerPerson.toFixed(
                    2
                  )}
                  {" €"}
                </strong>

              </div>
            )}

            <div className="paymentSummary">

              <div className="paymentBox paid">
                <span>
                  ✅
                </span>

                <strong>
                  {paidCount}
                </strong>

                <small>
                  Bezahlt
                </small>
              </div>

              <div className="paymentBox open">
                <span>
                  ⏳
                </span>

                <strong>
                  {openCount}
                </strong>

                <small>
                  Offen
                </small>
              </div>

            </div>

            <h3>
              💶 Zahlungen
            </h3>

            {members.map(
              (member) => {

                const payment =
                  payments.find(
                    (item) =>
                      item.profile_id ===
                      member.profile_id
                  );

                const isPaid =
                  payment?.status ===
                  "bezahlt";

                return (
                  <div
                    className={
                      isPaid
                        ? "paymentPerson paidRow"
                        : "paymentPerson"
                    }
                    key={member.id}
                  >

                    <div className="paymentAvatar">
                      {member.username
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="paymentInfo">

                      <strong>
                        {member.username}
                      </strong>

                      <small>
                        Anteil:{" "}
                        {amountPerPerson.toFixed(
                          2
                        )}
                        {" €"}
                      </small>

                    </div>

                    <button
                      className={
                        isPaid
                          ? "paidButton"
                          : "openButton"
                      }
                      onClick={() =>
                        togglePayment(
                          member
                        )
                      }
                    >
                      {isPaid
                        ? "✅ Bezahlt"
                        : "⏳ Offen"}
                    </button>

                  </div>
                );
              }
            )}

          </section>
        )}

        {(!currentEvent ||
          currentEvent.ranking_enabled) &&
          (!currentEvent ||
            currentEvent.show_ranking) && (
          <section className="card">

            <h2>
              🏆 Ranking
            </h2>

            {ranking.map(
              (
                member,
                index
              ) => {

                const count =
                  getMemberDrinkCount(
                    member.profile_id
                  );

                const points =
                  getMemberPoints(
                    member.profile_id
                  );

                return (
                  <div
                    className="ranking"
                    key={
                      member.id
                    }
                  >

                    <span className="rank">
                      {index ===
                      0
                        ? "🥇"
                        : index ===
                          1
                        ? "🥈"
                        : index ===
                          2
                        ? "🥉"
                        : index + 1}
                    </span>

                    <div>

                      <strong>
                        {
                          member.username
                        }
                      </strong>

                      {(!currentEvent ||
                        currentEvent.show_drink_amounts) && (
                        <small>
                          🍺{" "}
                          {count}
                        </small>
                      )}

                    </div>

                    {(!currentEvent ||
                      currentEvent.show_points) && (
                      <div className="points">

                        {points}

                        <small>
                          Punkte
                        </small>

                      </div>
                    )}

                  </div>
                );
              }
            )}

            {(!currentEvent ||
              currentEvent.show_points) && (
              <div className="totalPoints">
                🏆 Gesamtpunkte:{" "}
                {totalPoints}
              </div>
            )}

          </section>
        )}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

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

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          padding: 16px;
          color: white;
          font-family: Arial, Helvetica, sans-serif;
          background:
            radial-gradient(
              circle at top,
              #29445d 0%,
              #0a0f16 62%
            );
        }

        .container {
          max-width: 850px;
          margin: auto;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 4px 25px;
        }

        .logo {
          font-size: 38px;
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,.07);
        }

        h1 {
          margin: 0;
          font-size: 25px;
        }

        h2 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        h3 {
          margin: 20px 0 10px;
        }

        p {
          color: #94a3b8;
        }

        small {
          display: block;
          color: #94a3b8;
          margin-top: 5px;
        }

        .card {
          padding: 18px;
          margin-bottom: 15px;
          border-radius: 20px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.08);
        }

        .inviteBox {
          margin-top: 15px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(245,158,11,.08);
          border: 1px solid rgba(245,158,11,.25);
        }

        .inviteBox h3 {
          margin: 0;
        }

        .codeRow,
        .joinBox,
        .addParticipant {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .codeRow {
          align-items: center;
        }

        .codeRow strong {
          padding: 14px;
          border-radius: 12px;
          text-align: center;
          font-size: 26px;
          letter-spacing: 5px;
          background: #111923;
          color: #fbbf24;
        }

        .newCode {
          margin-top: 10px;
          background: #334155;
          color: white;
        }

        .management {
          margin-top: 15px;
        }

        .managementButton {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #334155;
          color: white;
        }

        .settings {
          margin-top: 10px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(0,0,0,.18);
        }

        .settingsInfo {
          padding: 10px;
          margin: 0 0 10px;
          border-radius: 10px;
          background: rgba(245,158,11,.08);
          font-size: 13px;
        }

        .setting {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .settingText {
          min-width: 0;
          flex: 1;
        }

        .settingText strong {
          display: block;
        }

        .toggle {
          min-width: 78px;
          padding: 10px 8px;
        }

        .toggle.on {
          background: #22c55e;
          color: white;
        }

        .toggle.off {
          background: #334155;
          color: #cbd5e1;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat {
          text-align: center;
          padding: 14px 5px;
          border-radius: 16px;
          background: rgba(255,255,255,.06);
        }

        .stat span {
          font-size: 22px;
          display: block;
        }

        .stat strong {
          display: block;
          font-size: 20px;
          margin-top: 4px;
        }

        input,
        select {
          width: 100%;
          padding: 13px;
          margin-bottom: 10px;
          border-radius: 12px;
          border: 1px solid #344252;
          background: #121a23;
          color: white;
          font-size: 15px;
        }

        button {
          padding: 13px 17px;
          border: 0;
          border-radius: 12px;
          background: #f59e0b;
          color: #111;
          font-weight: bold;
          cursor: pointer;
        }

        button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .profileSelect {
          margin-bottom: 10px;
        }

        .profileSelect label {
          display: block;
          color: #94a3b8;
          margin-bottom: 6px;
          font-size: 13px;
        }

        .member {
          display: grid;
          grid-template-columns: 40px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 11px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .avatar,
        .paymentAvatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #334155;
          font-weight: bold;
        }

        .remove {
          padding: 6px 11px;
          background: #303b48;
          color: white;
        }

        .promilleSmall {
          color: #fbbf24;
          font-weight: bold;
        }

        .three {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 8px;
        }

        .save {
          width: 100%;
        }

        /* FOTO */

        .photoBox {
          padding: 15px;
          margin-bottom: 14px;
          border-radius: 16px;
          background: rgba(255,255,255,.04);
          border: 1px dashed #475569;
        }

        .photoHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .photoHeader strong {
          display: block;
          font-size: 16px;
        }

        .aiBadge {
          padding: 7px 10px;
          border-radius: 10px;
          background: rgba(139,92,246,.18);
          border: 1px solid rgba(139,92,246,.4);
          color: #c4b5fd;
          font-size: 12px;
          font-weight: bold;
        }

        .photoButton {
          display: block;
          width: 100%;
          padding: 15px;
          border-radius: 13px;
          background: #334155;
          color: white;
          text-align: center;
          font-weight: bold;
          cursor: pointer;
        }

        .photoButton:hover {
          background: #475569;
        }

        .photoPreview {
          margin-top: 12px;
          overflow: hidden;
          border-radius: 15px;
          background: #0f172a;
          border: 1px solid #334155;
        }

        .photoPreview img {
          display: block;
          width: 100%;
          max-height: 350px;
          object-fit: contain;
          background: #020617;
        }

        .photoActions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px;
        }

        .removePhoto {
          padding: 8px 10px;
          background: #475569;
          color: white;
          font-size: 12px;
        }

        .aiInfo {
          margin: 0 10px 10px;
          padding: 10px;
          border-radius: 10px;
          background: rgba(139,92,246,.1);
          border: 1px solid rgba(139,92,246,.2);
          color: #c4b5fd;
          font-size: 12px;
          line-height: 1.4;
        }

        .drink {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .drinkMain {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .drinkIcon {
          font-size: 25px;
        }

        .drinkButton {
          white-space: nowrap;
          background: #f59e0b;
        }

        .consumption {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 12px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .undo {
          background: #334155;
          color: white;
          white-space: nowrap;
        }

        .empty {
          padding: 15px;
          border-radius: 12px;
          text-align: center;
          color: #94a3b8;
          background: rgba(255,255,255,.04);
        }

        .promilleCard {
          text-align: center;
        }

        .promille {
          font-size: 48px;
          font-weight: bold;
          color: #fbbf24;
          margin: 10px 0;
        }

        .promilleInfo {
          padding: 12px;
          border-radius: 12px;
          background: rgba(34,197,94,.08);
          border: 1px solid rgba(34,197,94,.2);
        }

        .promilleInfo strong {
          color: #4ade80;
        }

        .warning {
          font-size: 12px;
          margin-top: 14px;
        }

        .history {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .history > span {
          color: #4ade80;
          font-weight: bold;
        }

        .total {
          text-align: center;
          font-size: 40px;
          font-weight: bold;
          color: #fbbf24;
        }

        .center {
          text-align: center;
        }

        .row {
          display: flex;
          justify-content: space-between;
          padding: 13px;
          margin-top: 8px;
          border-radius: 12px;
          background: rgba(255,255,255,.05);
        }

        .paymentSummary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 15px;
        }

        .paymentBox {
          text-align: center;
          padding: 15px;
          border-radius: 15px;
          background: rgba(255,255,255,.05);
        }

        .paymentBox span {
          display: block;
          font-size: 24px;
        }

        .paymentBox strong {
          display: block;
          font-size: 25px;
          margin-top: 4px;
        }

        .paymentBox.paid {
          border: 1px solid rgba(34,197,94,.35);
        }

        .paymentBox.open {
          border: 1px solid rgba(245,158,11,.35);
        }

        .paymentPerson {
          display: grid;
          grid-template-columns: 40px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 12px;
          margin-top: 8px;
          border-radius: 15px;
          background: rgba(255,255,255,.05);
        }

        .paidRow {
          border: 1px solid rgba(34,197,94,.4);
          background: rgba(34,197,94,.08);
        }

        .paymentInfo {
          min-width: 0;
        }

        .paidButton {
          background: #22c55e;
          color: white;
        }

        .openButton {
          background: #f59e0b;
          color: #111;
        }

        .ranking {
          display: grid;
          grid-template-columns: 45px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 13px;
          margin-top: 8px;
          border-radius: 14px;
          background: rgba(255,255,255,.05);
        }

        .rank {
          font-size: 24px;
        }

        .points {
          text-align: right;
          font-weight: bold;
          font-size: 18px;
        }

        .points small {
          font-size: 12px;
          font-weight: normal;
        }

        .totalPoints {
          margin-top: 15px;
          padding: 15px;
          text-align: center;
          border-radius: 14px;
          background: rgba(245,158,11,.1);
          color: #fbbf24;
          font-weight: bold;
        }

        .message {
          padding: 14px;
          margin-bottom: 15px;
          text-align: center;
          border-radius: 13px;
          background: #172535;
          color: #fbbf24;
        }

        footer {
          padding: 25px;
          text-align: center;
          color: #64748b;
        }

        @media(max-width:650px) {

          .stats {
            grid-template-columns: repeat(2,1fr);
          }

          .three {
            grid-template-columns: 1fr;
          }

          .addParticipant,
          .joinBox {
            grid-template-columns: 1fr;
          }

          .codeRow {
            grid-template-columns: 1fr;
          }

          .codeRow strong {
            font-size: 22px;
          }

          .setting {
            align-items: flex-start;
          }

          .settingText {
            padding-right: 5px;
          }

          .toggle {
            min-width: 72px;
          }

          .drink {
            align-items: stretch;
            flex-direction: column;
          }

          .drinkButton {
            width: 100%;
          }

          .consumption {
            align-items: stretch;
            flex-direction: column;
          }

          .undo {
            width: 100%;
          }

          .paymentPerson {
            grid-template-columns: 40px 1fr;
          }

          .paymentPerson button {
            grid-column: 1 / -1;
            width: 100%;
          }

          .photoHeader {
            align-items: flex-start;
          }

          .photoActions {
            align-items: stretch;
            flex-direction: column;
          }

          .removePhoto {
            width: 100%;
          }
        }
      `}</style>

    </main>
  );
}
