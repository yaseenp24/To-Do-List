"use client";
import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I can create, list, and complete your tasks. Try: 'Add buy milk', 'List tasks', or 'Complete task <id>'" },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!input.trim() || pending) return;
    const nextMessages = [...messages, { role: "user" as const, content: input }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data?.error || "Server error" }]);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.content ?? "" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong." }]);
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <div style={{ flex: 1, overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#fff" }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            alignItems: "flex-start",
          }}>
            <div style={{
              fontWeight: 600,
              width: 90,
              color: m.role === "assistant" ? "#2563eb" : "#111827",
              textTransform: "capitalize",
            }}>{m.role}</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={pending ? "Thinking..." : "Type a message"}
          disabled={pending}
          style={{
            flex: 1,
            border: "1px solid #d1d5db",
            borderRadius: 8,
            padding: "10px 12px",
          }}
        />
        <button onClick={() => void send()} disabled={pending} style={{
          padding: "10px 16px",
          borderRadius: 8,
          background: pending ? "#9ca3af" : "#2563eb",
          color: "white",
        }}>Send</button>
      </div>
      <p style={{ marginTop: 8, color: "#6b7280" }}>Set your `OPENAI_API_KEY` in `.env.local` and restart the dev server.</p>
    </div>
  );
}
