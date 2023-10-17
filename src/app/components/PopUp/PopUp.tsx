import React, { useState } from "react";
import WindowComponent from "../WindowComponent/WindowComponent";
import { createRoot } from "react-dom/client";
import { createUuid } from "@/app/utils/utils";

interface PopUpProps {
  title: string;
  id?: string;
  children: React.ReactNode;
}

const PopUp: React.FC<PopUpProps> = ({ title, id, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    const popUp = document.getElementById(id!);
    popUp?.remove();
  };

  return (
    <WindowComponent
      title={title}
      style={{ display: isOpen ? "block" : "none" }}
      onClose={handleClose}
    >
      <div>{children}</div>
    </WindowComponent>
  );
};

export const createPopUp = (title: string, children: React.ReactNode) => {
  const root = document.getElementById("root");
  const popUp = document.createElement("div");
  let max = 60;
  let min = 20;
  popUp.style.position = "absolute";
  popUp.style.top = Math.ceil(Math.random() * (max - min) + min) + "%";
  popUp.style.left = Math.ceil(Math.random() * (max - min) + min) + "%";
  popUp.style.transform = "translate(-50%, -50%)";

  console.log(popUp);
  popUp.id = "pop-up-" + createUuid();
  root?.appendChild(popUp);
  createRoot(popUp).render(<PopUp title={title} id={popUp.id}>{children}</PopUp>);
};

export default PopUp;
