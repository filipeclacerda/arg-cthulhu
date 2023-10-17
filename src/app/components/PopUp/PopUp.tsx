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
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  popUp.style.position = "absolute";
  popUp.style.top = Math.ceil(Math.random() * (max - min) + min) + "%";
  popUp.style.left = Math.ceil(Math.random() * (max - min) + min) + "%";
  popUp.style.transform = "translate(-50%, -50%)";

  // Adicionar evento de clique para iniciar o arrasto
  popUp.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - popUp.getBoundingClientRect().left;
    offsetY = e.clientY - popUp.getBoundingClientRect().top;
  });

  // Adicionar evento de soltura para parar o arrasto
  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // Adicionar evento de movimento do mouse para arrastar a pop-up
  window.addEventListener("mousemove", (e) => {
    if (isDragging) {
      popUp.style.left = e.clientX - offsetX + "px";
      popUp.style.top = e.clientY - offsetY + "px";
    }
  });

  console.log(popUp);
  popUp.id = "pop-up-" + createUuid();
  root?.appendChild(popUp);
  createRoot(popUp).render(
    <PopUp title={title} id={popUp.id}>
      {children}
    </PopUp>
  );
};

export default PopUp;
