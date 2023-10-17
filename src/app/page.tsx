"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import WindowComponent from "./components/WindowComponent/WindowComponent";
import PopUp, { createPopUp } from "./components/PopUp/PopUp";

export default function Home() {
  const [form, setForm] = useState({
    username: "sarah.bishop",
    password: "",
  });

  const handleSubmit = () => {
    if (form.username === "sarah.bishop" && form.password === "password") {
      window.location.href = "/desktop";
    } else {
      console.log("incorrect username or password");
      createPopUp(
        "Incorrect Username or Password",
        <div className="description">
          <p className="p">
            The username or password you entered is incorrect. Please try again.
          </p>
        </div>
      );
    }
  };
  return (
    <>
      <WindowComponent title="Login">
        <div className="description">
          <Image
            alt="Windows 98 Logo"
            src="/windows-98-logo.png"
            width={200}
            height={150}
          />
        </div>
        <form className="form">
          <div className="formItem">
            <label className="label">Username:</label>
            <input
              className="input"
              type="text"
              autoComplete="off"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            ></input>
          </div>
          <div className="formItem">
            <label className="label">Password:</label>
            <input
              className="input"
              type="password"
              autoComplete="off"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            ></input>
          </div>
          <div className="options">
            <button
              className="button btn-lg"
              type="button"
              onClick={handleSubmit}
            >
              OK
            </button>
            <button className="button btn-lg" type="button">
              Cancel
            </button>
          </div>
        </form>
      </WindowComponent>
      {/* <PopUp title="Incorrect Username or Password">
        <div className="description">
          <p className="p">
            The username or password you entered is incorrect. Please try again.
          </p>
        </div>
        <div className="options">
          <button className="button btn-lg" type="button">
            OK
          </button>
        </div>
      </PopUp> */}
    </>
  );
}
