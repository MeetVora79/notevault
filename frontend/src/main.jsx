import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "@/app/store.js";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App.jsx";
import { Toaster } from "sonner";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <TooltipProvider delayDuration={200}>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: "font-sans text-sm",
              },
            }}
            richColors
          />
        </TooltipProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
