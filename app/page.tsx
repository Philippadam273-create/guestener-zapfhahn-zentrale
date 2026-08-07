"use client";

import { useEffect, useState } from "react";
imporimport { supabase } from "@/lib/supabase";

export default function Home() {

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [events, setEvents] = useState<any[]>([]);


  async function loadEvents() {

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });


    if (error) {
      console.log(error);
      return;
    }


    setEvents(data || []);
  }



  async function saveEvent() {

    if (!name.trim()) {
      setMessage("❗ Bitte einen Eventnamen eingeben.");
      return;
    }


    const { error } = await supabase
      .from("events")
      .insert([
        {
          title: name
        }
      ]);


    if (error) {

      console.log(error);
      setMessage("❌ Fehler beim Speichern");

      return;
    }


    setMessage("🍻 Event wurde erstellt: " + name);

    setName("");

    setShowForm(false);

    loadEvents();

  }




  useEffect(() => {

    loadEvents();

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
        📅 Aktuelles Event
      </h2>



      {!showForm && (

        <button onClick={() => setShowForm(true)}>

          ➕ Neues Event erstellen

        </button>

      )}





      {showForm && (

        <div>

          <h2>
            Neues Event
          </h2>


          <input

            value={name}

            onChange={(e) => setName(e.target.value)}

            placeholder="Name des Events"

          />



          <br />
          <br />



          <button onClick={saveEvent}>

            💾 Event speichern

          </button>



        </div>

      )}





      {message && (

        <p>
          {message}
        </p>

      )}






      <h2>
        🍻 Gespeicherte Events
      </h2>




      {events.length === 0 && (

        <p>
          Noch keine Events vorhanden.
        </p>

      )}






      {events.map((event) => (

        <div key={event.id}>

          🍻 {event.title}

        </div>

      ))}






      <h2>
        🏆 Statistik
      </h2>


      <p>
        🍺 Getränke: 0
      </p>


      <p>
        👥 Teilnehmer: 0
      </p>


      <p>
        💶 Kosten: 0 €
      </p>



    </main>

  );

}
