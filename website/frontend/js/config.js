/* Vedyam frontend configuration.
 * The frontend is a separate app that talks to the Vedyam backend over HTTP.
 * This is the ONLY place you tell it where the backend lives.
 *
 * All URLs are configurable here. For production, change these to your
 * deployed server addresses. For local dev, the defaults work as-is.
 *
 * The frontend REQUIRES a running backend. There is no offline mode.
 */
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

window.VEDYAM = {
  // Base URL of the Vedyam backend API.
  //   ""                       -> same origin that served this page
  //                               (use this when the backend also serves the frontend)
  //   "http://127.0.0.1:8000"  -> backend running separately on your machine
  //   "https://api.vedyam.org" -> a deployed backend
  API_BASE: isLocal ? "http://127.0.0.1:8000" : "https://vijayyh-vedyamchatbot1-0-0.hf.space",

  // URL of the ShastraBot chatbot (simulator backend).
  // Used when redirecting users to the full chatbot experience.
  CHATBOT_URL: "/chatbot",

  // URL of the simulator frontend.
  // Used for "Try Learning Mode" and other simulator links.
  SIMULATOR_URL: isLocal ? "http://localhost:5173" : "/",

  // URL of this website itself (used for back-links from the simulator).
  WEBSITE_URL: isLocal ? "http://127.0.0.1:8000" : "https://vedyam.org",
};
