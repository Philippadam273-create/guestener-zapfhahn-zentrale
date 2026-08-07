"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {

  const [events, setEvents] = useState<any[]>([]);
  const [drinks, setDrinks] = useState<any[]>([]);


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



    const { data: drinkData, error: drinkError } = await supabase
      .from("drinks")
      .select("*")
      .order("created_at", { ascending: false });


    if (drinkError) {
      console.log(drinkError);
      return;
    }


    setDrinks(drinkData || []);

  }



  useEffect(() => {

    loadData();

  }, []);



  return (

    <main style={{ padding: "20px" }}>

      <h1>
        🍻 Güstener Zapfhahn Zentrale
      </h1>


      <p>
        Deine Zentrale für Events, Getränke, Kosten und Rankings.
      </p>



      <h2>
        📅 Gespeicherte Events
      </h2>


      {events.map((event) => (

        <p key={event.id}>
          🍻 {event.title}
        </p>

      ))}



      <h2>
        🍺 Getränke
      </h2>


      {drinks.map((drink) => (

        <p key={drink.id}>
          🍺 {drink.drink_name} - {drink.liters} Liter
        </p>

      ))}



      <h2>
        🏆 Statistik
      </h2>


      <p>
        🍺 Getränke: {drinks.length}
      </p>


    </main>

  );

}
