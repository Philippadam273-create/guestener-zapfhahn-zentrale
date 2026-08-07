"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState("");

  const [drinks, setDrinks] = useState<any[]>([]);

  const [drink, setDrink] = useState("");
  const [liters, setLiters] = useState("0.5");
  const [alcohol, setAlcohol] = useState("5");
  const [price, setPrice] = useState("0");

  const [message, setMessage] = useState("");

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id,title")
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setEvents(data);

      if (data.length > 0 && !eventId) {
        setEventId(data[0].id);
      }
    }
  }


  async function loadDrinks() {

    if (!eventId) return;


    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", {
        ascending:false,
      });


    if (!error && data) {
      setDrinks(data);
    }

  }



  async function saveDrink() {


    if (!eventId) {
      setMessage("❌ Bitte zuerst ein Event auswählen");
      return;
    }


    if (!drink.trim()) {
      setMessage("❌ Bitte Getränk eingeben");
      return;
    }



    const { error } = await supabase
      .from("drinks")
      .insert([
        {
          event_id: eventId,

          getraenk: drink,

          drink_name: drink,

          menge: Number(liters),

          liters: Number(liters),

          alkohol: Number(alcohol),

          alcohol_percent: Number(alcohol),

          preis: Number(price),

          quantity: 1
        }
      ]);



    if (error) {

      setMessage(
        "❌ Fehler beim Speichern: " +
        error.message
      );

      return;

    }



    setMessage(
      "✅ Getränk gespeichert"
    );


    setDrink("");
    setLiters("0.5");
    setAlcohol("5");
    setPrice("0");


    loadDrinks();

  }



  useEffect(() => {
    loadEvents();
  }, []);



  useEffect(() => {

    loadDrinks();

  }, [eventId]);



  const totalLiters =
    drinks.reduce(
      (sum,d)=>
        sum +
        Number(
          d.liters ||
          d.menge ||
          0
        ),
      0
    );


  const totalCost =
    drinks.reduce(
      (sum,d)=>
        sum +
        Number(
          d.preis ||
          0
        ),
      0
    );



  return (

    <main
      style={{
        minHeight:"100vh",
        background:"#111827",
        color:"white",
        padding:"20px",
        fontFamily:"Arial"
      }}
    >


      <h1>
        🍻 Güstener Zapfhahn Zentrale
      </h1>


      <p>
        Events · Getränke · Kosten · Rankings
      </p>



      <hr />



      <h2>
        📅 Aktuelles Event
      </h2>



      <select

        value={eventId}

        onChange={(e)=>
          setEventId(e.target.value)
        }

        style={{
          width:"100%",
          padding:"12px",
          borderRadius:"10px"
        }}

      >

        <option>
          Event auswählen
        </option>


        {events.map(event=>(

          <option
            key={event.id}
            value={event.id}
          >

            {event.title}

          </option>

        ))}


      </select>





      <h2>
        🍺 Getränk hinzufügen
      </h2>



      <input

        placeholder="Getränk"

        value={drink}

        onChange={(e)=>
          setDrink(e.target.value)
        }

        style={{
          width:"100%",
          padding:"12px",
          marginBottom:"10px"
        }}

      />



      <input

        type="number"

        placeholder="Liter"

        value={liters}

        onChange={(e)=>
          setLiters(e.target.value)
        }

        style={{
          width:"100%",
          padding:"12px",
          marginBottom:"10px"
        }}

      />



      <input

        type="number"

        placeholder="Alkohol %"

        value={alcohol}

        onChange={(e)=>
          setAlcohol(e.target.value)
        }

        style={{
          width:"100%",
          padding:"12px",
          marginBottom:"10px"
        }}

      />



      <input

        type="number"

        placeholder="Preis"

        value={price}

        onChange={(e)=>
          setPrice(e.target.value)
        }

        style={{
          width:"100%",
          padding:"12px",
          marginBottom:"10px"
        }}

      />




      <button

        onClick={saveDrink}

        style={{
          width:"100%",
          padding:"15px",
          borderRadius:"10px",
          background:"#f59e0b",
          fontWeight:"bold"
        }}

      >

        🍻 Getränk speichern

      </button>




      <p>
        {message}
      </p>




      <hr />



      <h2>
        🍺 Getränke
      </h2>



      {drinks.length===0 && (

        <p>
          Noch keine Getränke
        </p>

      )}



      {drinks.map(d=>(

        <div

          key={d.id}

          style={{
            background:"#1f2937",
            padding:"15px",
            borderRadius:"12px",
            marginBottom:"10px"
          }}

        >

          🍺 {d.getraenk || d.drink_name}

          <br />

          💧
          {
            d.liters ||
            d.menge
          }
          Liter

          <br />

          🍺
          {
            d.alcohol_percent ||
            d.alkohol
          }
          %

          <br />

          💶
          {
            d.preis || 0
          }
          €

        </div>

      ))}




      <h2>
        🏆 Statistik
      </h2>


      <p>
        🍺 Getränke: {drinks.length}
      </p>


      <p>
        💧 Liter: {totalLiters.toFixed(1)}
      </p>


      <p>
        💶 Kosten: {totalCost.toFixed(2)} €
      </p>



    </main>

  );

}
