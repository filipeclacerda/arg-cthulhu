"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { useI18n } from "@/app/i18n";
import {
  getTelemetryConsent,
  setTelemetryConsent,
  TelemetryConsent,
} from "@/app/game/telemetry";
import "../ArgTools/style.scss";
import "./style.scss";

type Operation = "+" | "−" | "×" | "÷" | null;

export const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [replace, setReplace] = useState(true);

  const inputDigit = (digit: string) => {
    setDisplay((value) => {
      if (replace) return digit;
      if (value === "0") return digit;
      return `${value}${digit}`.slice(0, 12);
    });
    setReplace(false);
  };

  const calculate = (nextOperation: Operation = null) => {
    const current = Number(display);
    if (stored !== null && operation) {
      const result =
        operation === "+"
          ? stored + current
          : operation === "−"
            ? stored - current
            : operation === "×"
              ? stored * current
              : current === 0
                ? NaN
                : stored / current;
      const next = Number.isFinite(result)
        ? String(Number(result.toFixed(8))).slice(0, 12)
        : "Error";
      setDisplay(next);
      setStored(nextOperation ? Number(next) : null);
    } else if (nextOperation) {
      setStored(current);
    }
    setOperation(nextOperation);
    setReplace(true);
  };

  return (
    <div className="retro-calculator">
      <div className="retro-calculator__display">{display}</div>
      <div className="retro-calculator__keys">
        <button className="button wide" onClick={() => {
          setDisplay("0");
          setStored(null);
          setOperation(null);
          setReplace(true);
        }}>C</button>
        <button className="button" onClick={() => setDisplay((value) => String(-Number(value)))}>+/−</button>
        <button className="button operator" onClick={() => calculate("÷")}>÷</button>
        {["7", "8", "9"].map((digit) => <button className="button" key={digit} onClick={() => inputDigit(digit)}>{digit}</button>)}
        <button className="button operator" onClick={() => calculate("×")}>×</button>
        {["4", "5", "6"].map((digit) => <button className="button" key={digit} onClick={() => inputDigit(digit)}>{digit}</button>)}
        <button className="button operator" onClick={() => calculate("−")}>−</button>
        {["1", "2", "3"].map((digit) => <button className="button" key={digit} onClick={() => inputDigit(digit)}>{digit}</button>)}
        <button className="button operator" onClick={() => calculate("+")}>+</button>
        <button className="button zero" onClick={() => inputDigit("0")}>0</button>
        <button className="button" onClick={() => {
          if (!display.includes(".")) {
            setDisplay((value) => `${value}.`);
            setReplace(false);
          }
        }}>.</button>
        <button className="button operator" onClick={() => calculate()}>=</button>
      </div>
    </div>
  );
};

const COLORS = ["#000000", "#ffffff", "#800000", "#ff0000", "#808000", "#ffff00", "#008000", "#00ff00", "#008080", "#00ffff", "#000080", "#0000ff", "#800080", "#ff00ff"];

export const Paint = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#000000");
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
  }, []);

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    context.fillStyle = color;
    context.fillRect(Math.floor(x / 2) * 2, Math.floor(y / 2) * 2, 4, 4);
  };

  return (
    <div className="retro-paint">
      <div className="retro-paint__menu">File&nbsp;&nbsp; Edit&nbsp;&nbsp; View&nbsp;&nbsp; Image&nbsp;&nbsp; Colors&nbsp;&nbsp; Help</div>
      <div className="retro-paint__toolbar">
        <button className="button active" title="Pencil">✎</button>
        <button className="button" title="Fill">▰</button>
        <button className="button" title="Eraser">▱</button>
        <span>Untitled - 256 Color Bitmap</span>
      </div>
      <div className="retro-paint__workspace">
        <canvas
          ref={canvasRef}
          width={560}
          height={340}
          onMouseDown={(event) => {
            drawing.current = true;
            draw(event);
          }}
          onMouseMove={draw}
          onMouseUp={() => { drawing.current = false; }}
          onMouseLeave={() => { drawing.current = false; }}
        />
      </div>
      <div className="retro-paint__palette">
        <span className="retro-paint__current" style={{ background: color }} />
        {COLORS.map((item) => (
          <button
            key={item}
            aria-label={`Color ${item}`}
            className={color === item ? "selected" : ""}
            style={{ background: item }}
            onClick={() => setColor(item)}
          />
        ))}
      </div>
    </div>
  );
};

export const SystemProperties = () => {
  const { locale, setLocale, t } = useI18n();
  const [telemetry, setTelemetry] =
    useState<TelemetryConsent>("unknown");

  useEffect(() => {
    setTelemetry(getTelemetryConsent());
  }, []);

  const updateTelemetry = (next: "granted" | "denied") => {
    setTelemetryConsent(next);
    setTelemetry(next);
  };

  return (
  <div className="system-properties">
    <div className="system-properties__hero">
      <Image src="/windows-98-logo.png" alt="Windows 98" width={122} height={86} />
      <div>
        <strong>Microsoft Windows 98</strong>
        <span>Second Edition</span>
        <span>4.10.2222 A</span>
      </div>
    </div>
    <div className="system-properties__rule" />
    <dl>
      <dt>Registered to:</dt><dd>Sarah Bishop / Miskatonic University</dd>
      <dt>Computer:</dt><dd>GenuineIntel Pentium II, 64.0 MB RAM</dd>
      <dt>Disk label:</dt><dd>VOL_114_RECOVERED</dd>
      <dt>Network:</dt><dd>3Com EtherLink — cable disconnected</dd>
      <dt>System clock:</dt><dd>CMOS checksum invalid; tomorrow retained</dd>
    </dl>
    <div className="system-properties__rule" />
    <section className="system-properties__preferences">
      <label>
        <strong>{t("language")}</strong>
        <select
          value={locale}
          onChange={(event) =>
            setLocale(event.target.value as "en" | "pt-BR")
          }
        >
          <option value="en">{t("english")}</option>
          <option value="pt-BR">{t("portuguese")}</option>
        </select>
      </label>
      <div>
        <strong>{t("telemetryTitle")}</strong>
        <p>{t("telemetryBody")}</p>
        <label>
          <input
            type="radio"
            name="telemetry"
            checked={telemetry === "granted"}
            onChange={() => updateTelemetry("granted")}
          />
          {t("diagnosticsOn")}
        </label>
        <label>
          <input
            type="radio"
            name="telemetry"
            checked={telemetry !== "granted"}
            onChange={() => updateTelemetry("denied")}
          />
          {t("diagnosticsOff")}
        </label>
      </div>
    </section>
    <div className="system-properties__buttons">
      <button className="button">OK</button>
      <button className="button">Cancel</button>
      <button className="button" disabled>Apply</button>
    </div>
  </div>
  );
};

export const RecycleBin = () => {
  const { openWindow } = useWindowManager();
  return (
    <div className="recycle-bin">
      <div className="recycle-bin__toolbar">File&nbsp;&nbsp; Edit&nbsp;&nbsp; View&nbsp;&nbsp; Help</div>
      <div className="recycle-bin__address"><strong>Address</strong><span>Recycle Bin</span></div>
      <div className="recycle-bin__files">
        <button onDoubleClick={() => openWindow({ id: "danforth-cache", appType: "browser", title: "Internet Explorer", props: { initialAddress: "http://www.geocities.com/arkham_heights/danforth.html" } })}>
          <Image src="/icons/internet-explorer.png" alt="" width={34} height={34} />
          <span>DANFORTH.URL</span>
        </button>
        <button onDoubleClick={() => openWindow({ id: "expedition-scrap", appType: "notepad", title: "EXPEDITION.TMP - Notepad", props: { fileId: "expedition_tmp" } })}>
          <Image src="/icons/notepad.png" alt="" width={34} height={34} />
          <span>EXPEDITION.TMP</span>
        </button>
      </div>
      <div className="recycle-bin__status">2 object(s) — deletion date unavailable</div>
    </div>
  );
};
