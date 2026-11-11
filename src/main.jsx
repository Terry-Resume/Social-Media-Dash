import React from "react";
import ReactDOM from "react-dom/client";
import { AuthShell } from "@kato8/core/react";
import { getTool, toolUrl } from "@kato8/core";
import App from "./App";
import "./index.css";

const demo = import.meta.env.VITE_KATO8_DEMO === "1";

// Same Clerk sign-in and role gate as every Kato.8 tool. VITE_KATO8_DEMO=1 replaces it with a role switcher
// and fictional data so the dashboard runs with no keys.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthShell
      appName="Orbit Social Command"
      roles={getTool("social").roles}
      demo={demo}
      clerkPublishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      hubUrl={toolUrl("hub", (name) => import.meta.env[name])}
      logoSrc="/kato8-logo-circle.png"
    >
      <App />
    </AuthShell>
  </React.StrictMode>
);
