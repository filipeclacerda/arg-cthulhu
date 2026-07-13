"use client";

import { useEffect } from "react";
import { useI18n } from "@/app/i18n";

export default function LocaleDocumentSync() {
  const { locale } = useI18n();
  useEffect(() => {
    document.documentElement.lang = locale === "pt-BR" ? "pt-BR" : "en";
  }, [locale]);
  return null;
}
