import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Set token getter SYNCHRONOUSLY before any React Query requests fire
setAuthTokenGetter(() => localStorage.getItem("nexus_token"));

createRoot(document.getElementById("root")!).render(<App />);
