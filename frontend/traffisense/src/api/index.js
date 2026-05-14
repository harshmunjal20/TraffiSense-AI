import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5001';

export const getRoads = async () => {
  const res = await axios.get(`${BASE_URL}/roads`);
  return res.data;
};

export const getHeatmap = (minutesAhead = 0) =>
  axios.get(`http://localhost:5001/heatmap?minutes_ahead=${minutesAhead}`).then(r => r.data);

export const predict = async (road_id, weather, event_nearby, simulate_peak = false) => {
  const res = await axios.post(`${BASE_URL}/predict`, {
    road_id,
    weather,
    event_nearby,
    simulate_peak: simulate_peak ? 1 : 0
  });
  return res.data;
};