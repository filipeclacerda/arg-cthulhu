import React, { useState } from "react";
import WindowComponent from "../WindowComponent/WindowComponent";
import { createRoot } from "react-dom/client";

interface PopUpProps {
  title: string;
  children: React.ReactNode;
}

const PopUp: React.FC<PopUpProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
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
  let max = 70;
  let min = 20;
  popUp.style.position = "absolute";
  popUp.style.top = Math.random() * (max - min) + min + "%";
  popUp.style.left = Math.random() * (max - min) + min + "%";
  popUp.style.transform = "translate(-50%, -50%)";

  console.log(popUp);
  popUp.id = "pop-up";
  root?.appendChild(popUp);
  createRoot(popUp).render(<PopUp title={title}>{children}</PopUp>);
};

export default PopUp;
