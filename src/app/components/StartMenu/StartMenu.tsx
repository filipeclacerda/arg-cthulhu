import React, { useState } from "react";
import "./style.scss";
import Image from "next/image";

const StartMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    const startMenu = document.getElementById("start-menu");
    if (startMenu) {
      startMenu.classList.toggle("active");
    }
  };
  const onClickOutside = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = ev.target as HTMLDivElement;
    if (target.closest(".startMenuContainer")) {
      return;
    } else {
      if (isOpen) {
        toggleMenu();
      }
    }
  };

  return (
    <>
      <button id="start-menu" className="button" onClick={toggleMenu}>
        <Image
          src="/windows-logo.png"
          alt="Windows Logo"
          width={28}
          height={28}
        />
        Start
      </button>
      {isOpen && (
        <div className="startMenuContainer">
          <button className="startMenuButton button">Programs</button>
          <button className="startMenuButton button">Documents</button>
          <button className="startMenuButton button">Settings</button>
          <button className="startMenuButton button">Help</button>
          <button className="startMenuButton button">Run...</button>
          <button className="startMenuButton button">Shut Down...</button>
        </div>
      )}
    </>
  );
};

export default StartMenu;
