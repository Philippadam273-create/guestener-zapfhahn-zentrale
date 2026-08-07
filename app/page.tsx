"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {

  const [events, setEvents] = useState<any[]>([]);
  const [drinks, setDrinks] = useState<any[]>([]);

  const [eventId, setEventId] = useState("");
  const [drinkName, setDrinkName] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("1.20");

  const [message, setMessage] = useState("");



  async function loadData() {

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });


    if (eventError) {
      console.log(eventError);
      return;
    }


    setEvents(eventData || []);



    const { data: drinkData, error:
