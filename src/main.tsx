import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initAuth } from "./firebase";

initAuth().then((cred) => {
  console.log("Anonymous Auth UID:", cred.user.uid);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
