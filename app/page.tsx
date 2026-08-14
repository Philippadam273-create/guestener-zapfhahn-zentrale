"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function login() {
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("Anmeldung fehlgeschlagen: " + error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="page">
      <div className="loginCard">
        <div className="logo">🍺🍺🍺</div>

        <h1>Güstener Zapfhahn Zentrale</h1>

        <p className="subtitle">
          Anmeldung
        </p>

        <input
          type="email"
          placeholder="E-Mail-Adresse"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              login();
            }
          }}
        />

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <button
          className="primary"
          onClick={login}
          disabled={loading}
        >
          {loading ? "⏳ Anmeldung..." : "🔑 Anmelden"}
        </button>

        <button
          className="secondary"
          onClick={() => router.push("/register")}
        >
          👤 Neues Konto erstellen
        </button>

        <button
          className="back"
          onClick={() => router.push("/")}
        >
          ← Zurück
        </button>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 20px;
          background:
            radial-gradient(
              circle at top,
              #26384b 0%,
              #111820 42%,
              #070b0f 100%
            );
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: Arial, sans-serif;
        }

        .loginCard {
          width: 100%;
          max-width: 430px;
          background: rgba(20, 29, 39, 0.96);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 20px 60px rgba(0,0,0,.45);
          text-align: center;
        }

        .logo {
          font-size: 42px;
          margin-bottom: 10px;
          letter-spacing: -8px;
        }

        h1 {
          margin: 0;
          font-size: 24px;
        }

        .subtitle {
          color: #9ca8b5;
          margin: 8px 0 25px;
        }

        input {
          width: 100%;
          padding: 15px;
          margin-bottom: 12px;
          border-radius: 13px;
          border: 1px solid #344250;
          background: #101720;
          color: white;
          font-size: 16px;
          outline: none;
        }

        input:focus {
          border-color: #f59e0b;
        }

        button {
          width: 100%;
          border: none;
          border-radius: 13px;
          padding: 14px;
          margin-top: 9px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        }

        .primary {
          background: #f59e0b;
          color: #111;
        }

        .primary:disabled {
          opacity: .6;
          cursor: wait;
        }

        .secondary {
          background: #263442;
          color: white;
        }

        .back {
          background: transparent;
          color: #8d9baa;
        }

        .message {
          background: rgba(239,68,68,.12);
          border: 1px solid rgba(239,68,68,.3);
          color: #fca5a5;
          border-radius: 12px;
          padding: 12px;
          margin: 8px 0;
          text-align: left;
          font-size: 14px;
        }
      `}</style>
    </main>
  );
}
