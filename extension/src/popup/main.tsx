import { createRoot } from "react-dom/client";
import "@/style.css";
import { Popup } from "@/popup/Popup";

createRoot(document.getElementById("root")!).render(<Popup />);
