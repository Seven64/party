import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("qb_admin_token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("qb_admin_token");
  }
}

// Restore token on load
const savedToken = localStorage.getItem("qb_admin_token");
if (savedToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

export function getSavedToken() {
  return localStorage.getItem("qb_admin_token");
}

export function getGuestName() {
  return localStorage.getItem("qb_guest_name") || "";
}

export function setGuestName(name) {
  localStorage.setItem("qb_guest_name", name);
}
