import React, { useState, useRef, useEffect } from 'react';
import { getHeatmap } from '../api';

const DELHI_LOCATIONS = [
  { name: 'Connaught Place',   lat: 28.6315, lng: 77.2167 },
  { name: 'Chandni Chowk',     lat: 28.6506, lng: 77.2334 },
  { name: 'Anand Vihar',       lat: 28.6469, lng: 77.3159 },
  { name: 'Lajpat Nagar',      lat: 28.5677, lng: 77.2436 },
  { name: 'Karol Bagh',        lat: 28.6514, lng: 77.1907 },
  { name: 'Rohini Sector 10',  lat: 28.7331, lng: 77.1200 },
  { name: 'Dwarka Expressway', lat: 28.5921, lng: 77.0460 },
  { name: 'Noida Link Road',   lat: 28.5673, lng: 77.3210 },
  { name: 'Mathura Road',      lat: 28.5494, lng: 77.2500 },
  { name: 'ITO Crossing',      lat: 28.6289, lng: 77.2403 },
  { name: 'Ashram Chowk',      lat: 28.5706, lng: 77.2513 },
  { name: 'Dhaula Kuan',       lat: 28.5933, lng: 77.1568 },
  { name: 'Akshardham',        lat: 28.6127, lng: 77.2773 },
  { name: 'Saket',             lat: 28.5245, lng: 77.2066 },
  { name: 'Vasant Kunj',       lat: 28.5215, lng: 77.1580 },
  { name: 'Janakpuri',         lat: 28.6289, lng: 77.0800 },
  { name: 'Pitampura',         lat: 28.7005, lng: 77.1500 },
  { name: 'Shahdara',          lat: 28.6694, lng: 77.2887 },
  { name: 'Lal Quila',         lat: 28.6562, lng: 77.2410 },
  { name: 'IGI Airport',       lat: 28.5562, lng: 77.1000 },
  { name: 'Cyber Hub Gurgaon', lat: 28.4959, lng: 77.0882 },
  { name: 'MG Road Gurgaon',   lat: 28.4794, lng: 77.0806 },
  { name: 'Sector 18 Noida',   lat: 28.5706, lng: 77.3240 },
  { name: 'India Gate',        lat: 28.6129, lng: 77.2295 },
  { name: 'Sarojini Nagar',    lat: 28.5756, lng: 77.1968 },
  { name: 'Jahangirpuri',      lat: 28.7280, lng: 77.1628 },
  { name: 'Kashmere Gate',     lat: 28.6677, lng: 77.2280 },
  { name: 'Rajiv Chowk',       lat: 28.6328, lng: 77.2197 },
  { name: 'Hauz Khas',         lat: 28.5431, lng: 77.2066 },
  { name: 'Nehru Place',       lat: 28.5491, lng: 77.2519 },
  { name: 'Dilshad Garden',    lat: 28.6814, lng: 77.3210 },
  { name: 'Uttam Nagar',       lat: 28.6219, lng: 77.0588 },
  { name: 'Mayur Vihar',       lat: 28.6091, lng: 77.2952 },
  { name: 'Preet Vihar',       lat: 28.6420, lng: 77.2950 },
  { name: 'Netaji Subhash Place', lat: 28.6955, lng: 77.1411 },
];

const fetchOSRM = async (from, to) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.routes?.length > 0) {
    const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const duration = Math.round(data.routes[0].duration / 60);
    return { coords, duration };
  }
  return null;
};

const detectRoute = (text) => {
  const lower = text.toLowerCase();
  if (!lower.includes('from') && !lower.includes('to') && !lower.includes('route') && !lower.includes('travel') && !lower.includes('reach') && !lower.includes('go')) return null;

  let from = null, to = null;
  for (const loc of DELHI_LOCATIONS) {
    const n = loc.name.toLowerCase();
    if (lower.includes(n)) {
      if (!from) from = loc;
      else if (!to) { to = loc; break; }
    }
  }
  if (from && to) return { from, to };
  return null;
};

export default function Chatbot({ onRouteDrawn, roads = [] }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! Ask me anything about Delhi traffic or say "route from X to Y" to see it on the map.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildSystemPrompt = (roadsData) => {
    const roadLines = roadsData.map(r =>
      `${r.name}: ${r.congestion_label} (${r.congestion_score}%)`
    ).join('\n');

    return `You are TraffiSense AI, a smart traffic assistant for Delhi NCR.
Live congestion data:
${roadLines || 'Data loading...'}

Known locations you can route between: ${DELHI_LOCATIONS.map(l => l.name).join(', ')}

Rules:
- Answer only traffic/commute questions
- Use live data when answering, quote actual scores
- Suggest alternatives for High/Very High roads
- For route questions, mention congestion on roads along the way
- Be concise, 2-3 sentences
- Peak hours: 8-10 AM and 5-8 PM weekdays`;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: userText }]);
    setLoading(true);

    try {
      const liveRoads = roads.length > 0 ? roads : await getHeatmap().catch(() => []);

      // Detect and draw route on map
      const routeDetected = detectRoute(userText);
      let routeInfo = '';
      if (routeDetected && onRouteDrawn) {
        try {
          const osrm = await fetchOSRM(routeDetected.from, routeDetected.to);
          if (osrm) {
            onRouteDrawn({ coords: osrm.coords, color: '#38bdf8', weight: 6 });
            routeInfo = ` Route from ${routeDetected.from.name} to ${routeDetected.to.name} is now shown on the map (estimated ${osrm.duration} mins driving).`;
          }
        } catch (e) {
          console.warn('OSRM failed:', e);
        }
      }

      const history = messages
        .slice(1)
        .map(m => ({
          role: m.from === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_GROQ_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 200,
          messages: [
            { role: 'system', content: buildSystemPrompt(liveRoads) },
            ...history,
            { role: 'user', content: userText + (routeInfo ? `\n[System: ${routeInfo}]` : '') }
          ]
        })
      });

      const data = await response.json();
      let reply = data.choices?.[0]?.message?.content || 'Could not get a response.';
      if (routeInfo) reply = routeInfo + '\n' + reply;
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    } catch (e) {
      console.error('Chatbot error:', e);
      setMessages(prev => [...prev, { from: 'bot', text: 'Something went wrong. Try again.' }]);
    }

    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter') send(); };

  return (
    <div className="widget chatbot">
      <h3>AI Traffic Assistant</h3>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.from}`}>{m.text}</div>
        ))}
        {loading && <div className="chat-msg bot">Analysing live traffic...</div>}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about traffic or route from X to Y..."
          disabled={loading}
        />
        <button className="chat-send" onClick={send} disabled={loading}>Send</button>
      </div>
    </div>
  );
}