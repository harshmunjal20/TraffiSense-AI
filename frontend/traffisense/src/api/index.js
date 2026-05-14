import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';

export const getRoads = async () => {
  const res = await axios.get(`${BASE_URL}/roads`);
  return res.data;
};

export const getHeatmap = async () => {
  const res = await axios.get(`${BASE_URL}/heatmap`);
  return res.data;
};

export const predict = async (road_id, weather, event_nearby) => {
  const res = await axios.post(`${BASE_URL}/predict`, {
    road_id,
    weather,
    event_nearby
  });
  return res.data;
};