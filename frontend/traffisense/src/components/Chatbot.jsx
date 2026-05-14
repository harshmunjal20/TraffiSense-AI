import React, { useState, useRef, useEffect } from "react";
import { getHeatmap } from "../api";

const DELHI_LOCATIONS = [
  { name: "Connaught Place", lat: 28.6315, lng: 77.2167 },
  { name: "Chandni Chowk", lat: 28.6506, lng: 77.2334 },
  { name: "Anand Vihar", lat: 28.6469, lng: 77.3159 },
  { name: "Lajpat Nagar", lat: 28.5677, lng: 77.2436 },
  { name: "Karol Bagh", lat: 28.6514, lng: 77.1907 },
  { name: "Rohini Sector 10", lat: 28.7331, lng: 77.12 },
  { name: "Dwarka Expressway", lat: 28.5921, lng: 77.046 },
  { name: "Noida Link Road", lat: 28.5673, lng: 77.321 },
  { name: "Mathura Road", lat: 28.5494, lng: 77.25 },
  { name: "ITO Crossing", lat: 28.6289, lng: 77.2403 },
  { name: "Ashram Chowk", lat: 28.5706, lng: 77.2513 },
  { name: "Dhaula Kuan", lat: 28.5933, lng: 77.1568 },
  { name: "Akshardham", lat: 28.6127, lng: 77.2773 },
  { name: "Saket", lat: 28.5245, lng: 77.2066 },
  { name: "Vasant Kunj", lat: 28.5215, lng: 77.158 },
  { name: "Janakpuri", lat: 28.6289, lng: 77.08 },
  { name: "Pitampura", lat: 28.7005, lng: 77.15 },
  { name: "Shahdara", lat: 28.6694, lng: 77.2887 },
  { name: "Lal Quila", lat: 28.6562, lng: 77.241 },
  { name: "IGI Airport", lat: 28.5562, lng: 77.1 },
  { name: "Cyber Hub Gurgaon", lat: 28.4959, lng: 77.0882 },
  { name: "MG Road Gurgaon", lat: 28.4794, lng: 77.0806 },
  { name: "Sector 18 Noida", lat: 28.5706, lng: 77.324 },
  { name: "India Gate", lat: 28.6129, lng: 77.2295 },
  { name: "Sarojini Nagar", lat: 28.5756, lng: 77.1968 },
  { name: "Jahangirpuri", lat: 28.728, lng: 77.1628 },
  { name: "Kashmere Gate", lat: 28.6677, lng: 77.228 },
  { name: "Rajiv Chowk", lat: 28.6328, lng: 77.2197 },
  { name: "Hauz Khas", lat: 28.5431, lng: 77.2066 },
  { name: "Nehru Place", lat: 28.5491, lng: 77.2519 },
  { name: "Dilshad Garden", lat: 28.6814, lng: 77.321 },
  { name: "Uttam Nagar", lat: 28.6219, lng: 77.0588 },
  { name: "Mayur Vihar", lat: 28.6091, lng: 77.2952 },
  { name: "Preet Vihar", lat: 28.642, lng: 77.295 },
  { name: "Netaji Subhash Place", lat: 28.6955, lng: 77.1411 },
];

const fetchOSRM = async (from, to, via = null) => {
  const points = via
    ? `${from.lng},${from.lat};${via.lng},${via.lat};${to.lng},${to.lat}`
    : `${from.lng},${from.lat};${to.lng},${to.lat}`;

  const url = `https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.routes?.length > 0) {
    const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [
      lat,
      lng,
    ]);
    const duration = Math.round(data.routes[0].duration / 60);
    return {
      coords,
      duration,
      distance: (data.routes[0].distance / 1000).toFixed(1),
    };
  }

  return null;
};

const similarity = (a, b) => {
  a = a.toLowerCase();
  b = b.toLowerCase();
  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
};

const scoreLocation = (loc, inputWords, lower) => {
  const locName = loc.name.toLowerCase();
  const locWords = locName.split(" ");

  if (lower.includes(locName)) return 1.0;

  let best = 0;
  for (const locWord of locWords) {
    if (locWord.length < 3) continue;
    for (const inputWord of inputWords) {
      if (inputWord.length < 3) continue;
      const s = similarity(locWord, inputWord);
      if (s > best) best = s;
    }
  }
  return best;
};

const detectRoute = (text) => {
  const lower = text.toLowerCase();

  const hasIntent = [
    "from",
    "to",
    "route",
    "travel",
    "reach",
    "go",
    "direction",
    "need",
  ].some((word) => lower.includes(word));

  if (!hasIntent) return null;

  const inputWords = lower.split(/\s+/);
  const THRESHOLD = 0.6;

  const scored = DELHI_LOCATIONS.map((loc) => ({
    loc,
    score: scoreLocation(loc, inputWords, lower),
  }))
    .filter((x) => x.score >= THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (scored.length < 2) return null;

  const fromIdx = lower.indexOf("from");
  const toIdx = lower.indexOf("to");

  let from = null;
  let to = null;

  if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
    const beforeTo = lower.substring(0, toIdx);
    const afterTo = lower.substring(toIdx);

    const beforeWords = beforeTo.split(/\s+/);
    const afterWords = afterTo.split(/\s+/);

    const fromCandidates = DELHI_LOCATIONS.map((loc) => ({
      loc,
      score: scoreLocation(loc, beforeWords, beforeTo),
    }))
      .filter((x) => x.score >= THRESHOLD)
      .sort((a, b) => b.score - a.score);

    const toCandidates = DELHI_LOCATIONS.map((loc) => ({
      loc,
      score: scoreLocation(loc, afterWords, afterTo),
    }))
      .filter((x) => x.score >= THRESHOLD)
      .sort((a, b) => b.score - a.score);

    from = fromCandidates[0]?.loc || scored[0]?.loc;
    to =
      toCandidates.find((x) => x.loc !== from)?.loc ||
      scored.find((x) => x.loc !== from)?.loc;
  } else {
    from = scored[0]?.loc;
    to = scored.find((x) => x.loc !== from)?.loc;
  }

  if (from && to && from.name !== to.name) return { from, to };
  return null;
};

export default function Chatbot({
  onRouteDrawn,
  onCardSelect,
  roads = [],
  minutesAhead = 0,
}) {
  const [messages, setMessages] = useState([
    {
      from: "Traffistant",
      text: "Ready to navigate Delhi chaos. Ask for routes, traffic, or ETA.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildSystemPrompt = (roadsData) => {
    const roadLines = roadsData
      .slice(0, 15)
      .map((r) => `${r.name}: ${r.congestion_label}`)
      .join(", ");
    return `You are TraffiSense AI. Live Data: ${roadLines}. Guide users through Delhi traffic. Concise 2-3 sentences.`;
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setLoading(true);

    try {
      const liveRoads =
        roads.length > 0 ? roads : await getHeatmap().catch(() => []);

      const routeDetected = detectRoute(userText);
      let routeInfo = "";

      if (routeDetected && onRouteDrawn) {
        onRouteDrawn(null);

        const { from, to } = routeDetected;
        const timeScaler = 1 + minutesAhead / 150;

        const fastest = await fetchOSRM(from, to);

        const ecoMid = {
          lat: (from.lat + to.lat) / 2 + 0.005,
          lng: (from.lng + to.lng) / 2 + 0.005,
        };
        const eco = await fetchOSRM(from, to, ecoMid);

        const dist = Math.sqrt(
          Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2),
        );
        const aiAvoid = {
          lat: (from.lat + to.lat) / 2 + dist * 0.3,
          lng: (from.lng + to.lng) / 2 + dist * 0.3,
        };
        const ai = await fetchOSRM(from, to, aiAvoid);

        if (fastest) {
          onRouteDrawn({
            ...fastest,
            type: "fastest",
            duration: fastest.duration,
            rawDuration: fastest.duration, 
            fromName: from.name,
            toName: to.name,
          });
        }

        if (eco) {
          onRouteDrawn({
            ...eco,
            type: "eco",
            duration: eco.duration,
            rawDuration: eco.duration, 
          });
        }

        if (ai) {
          onRouteDrawn({
            ...ai,
            type: "ai",
            duration: ai.duration,
            rawDuration: ai.duration, 
          });
        }

        if (fastest) {
          onCardSelect?.({
            coords: fastest.coords,
            color: "#38bdf8",
            weight: 6,
          });
        }

        routeInfo = `🗺️ Drawing 3 options for ${from.name} to ${to.name}:
 Fastest: ${Math.round(fastest?.duration * timeScaler)}m
 Eco: ${Math.round(eco?.duration * timeScaler)}m
 AI Recommended: ${Math.round(ai?.duration * timeScaler)}m`;
      }

      const history = messages.slice(-4).map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_GROQ_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: buildSystemPrompt(liveRoads) },
              ...history,
              {
                role: "user",
                content:
                  userText + (routeInfo ? `\n[System: ${routeInfo}]` : ""),
              },
            ],
          }),
        },
      );

      const data = await response.json();
      let reply =
        data.choices?.[0]?.message?.content || "Service busy. Try again.";

      if (routeInfo) reply = "Routes updated on map!\n" + reply;

      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Connection error." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="widget chatbot">
      <h3>AI Traffic Assistant</h3>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.from}`}>
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="chat-msg bot">Calculating optimal paths...</div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. Route from Saket to India Gate"
          disabled={loading}
        />
        <button className="chat-send" onClick={send} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
