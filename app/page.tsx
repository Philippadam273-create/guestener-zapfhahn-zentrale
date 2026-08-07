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
  const [price, setPrice] = useState("0");



  async function loadData() {

    const { data: eventData } = await supabase
      .from("events")
      .select("*");

    setEvents(eventData || []);


    const { data: drinkData } = await supabase
      .from("drinks")
      .select("*")
      .order("created_at", { ascending: false });


    setDrinks(drinkData || []);

  }



  async function addDrink() {


    const { error } = await supabase
      .from("drinks")
      .insert([

        {
          event_id: eventId,
          drink_name: drinkName,
          liters: Number(liters),
          alcohol_percent: Number(alcohol),
          price: Number(price),
          quantity: 1
        }

      ]);



    if(error){

      alert("Fehler beim Speichern");

      console.log(error);

      return;

    }


    setDrinkName("");
    setPrice("0");

    loadData();

  }



  useEffect(()=>{

    loadData();

  },[]);




  return (

    <main style={{padding:20}}>


      <h1>
        🍻 Güstener Zapfhahn Zentrale
      </h1>


      <p>
        Deine Zentrale für Events, Getränke, Kosten und Rankings.
      </p>



      <h2>
        📅 Event auswählen
      </h2>


      <select
        value={eventId}
        onChange={(e)=>setEventId(e.target.value)}
      >

        <option>
          Event wählen
        </option>


        {events.map(event=>(

          <option key={event.id} value={event.id}>
            {event.title}
          </option>

        ))}


      </select>



      <h2>
        🍺 Getränk hinzufügen
      </h2>


      <input
        placeholder="Getränk"
        value={drinkName}
        onChange={(e)=>setDrinkName(e.target.value)}
      />


      <br/><br/>


      <input
        placeholder="Liter"
        value={liters}
        onChange={(e)=>setLiters(e.target.value)}
      />


      <br/><br/>


      <input
        placeholder="Alkohol %"
        value={alcohol}
        onChange={(e)=>setAlcohol(e.target.value)}
      />


      <br/><br/>


      <input
        placeholder="Preis"
        value={price}
        onChange={(e)=>setPrice(e.target.value)}
      />


      <br/><br/>


      <button onClick={addDrink}>
        🍻 Getränk speichern
      </button>




      <h2>
        🍺 Getränke
      </h2>



      {drinks.map(drink=>(

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
