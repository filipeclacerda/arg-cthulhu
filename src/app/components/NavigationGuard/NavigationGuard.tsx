"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GUARD_KEY = "__miskatonicNavigationGuard";
const GUARD_URL_KEY = "__miskatonicNavigationGuardUrl";

const NavigationGuard = () => {
  const pathname = usePathname();
  const [blocked, setBlocked] = useState(false);
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (pathname !== "/desktop") return;
    const lockedUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    const showBlockedNotice = () => {
      setBlocked(true);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => setBlocked(false), 2200);
    };

    const guardState = {
      ...(window.history.state ?? {}),
      [GUARD_KEY]: true,
      [GUARD_URL_KEY]: lockedUrl,
    };

    // A same-document entry absorbs the browser's first Back operation. When
    // it is popped, we immediately restore it at the same URL. The URL marker
    // matters because a full navigation can inherit history.state from the
    // relay page; "/" and "/desktop" each need their own guard entry.
    if (
      !window.history.state?.[GUARD_KEY] ||
      window.history.state?.[GUARD_URL_KEY] !== lockedUrl
    ) {
      window.history.pushState(guardState, "", lockedUrl);
    }

    const handlePopState = () => {
      window.history.pushState(guardState, "", lockedUrl);
      showBlockedNotice();
    };

    const blockMouseNavigation = (event: MouseEvent) => {
      // DOM MouseEvent buttons: 3 = browser back, 4 = browser forward.
      if (event.button !== 3 && event.button !== 4) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showBlockedNotice();
    };

    const blockKeyboardNavigation = (event: KeyboardEvent) => {
      const altArrow =
        event.altKey &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight");
      const macHistory =
        event.metaKey && (event.key === "[" || event.key === "]");
      const browserKey =
        event.key === "BrowserBack" || event.key === "BrowserForward";
      if (!altArrow && !macHistory && !browserKey) return;
      event.preventDefault();
      event.stopPropagation();
      showBlockedNotice();
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("mousedown", blockMouseNavigation, true);
    window.addEventListener("mouseup", blockMouseNavigation, true);
    window.addEventListener("auxclick", blockMouseNavigation, true);
    window.addEventListener("keydown", blockKeyboardNavigation, true);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("mousedown", blockMouseNavigation, true);
      window.removeEventListener("mouseup", blockMouseNavigation, true);
      window.removeEventListener("auxclick", blockMouseNavigation, true);
      window.removeEventListener("keydown", blockKeyboardNavigation, true);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, [pathname]);

  if (pathname !== "/desktop") return null;

  return (
    <div
      className={`navigation-guard-notice ${
        blocked ? "navigation-guard-notice--visible" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <strong>Mounted image cannot be left this way.</strong>
      <span>Use Disconnect in the Start menu to leave the mounted image.</span>
    </div>
  );
};

export default NavigationGuard;
