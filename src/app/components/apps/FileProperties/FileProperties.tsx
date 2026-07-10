"use client";

import React, { useEffect } from "react";
import { files } from "@/app/data/filesystem";
import { useProgress } from "@/app/context/ProgressContext";
import { resolveTokens } from "@/app/utils/narrative";
import "../ArgTools/style.scss";
import { useI18n } from "@/app/i18n";

const FileProperties = ({ fileId }: { fileId: string }) => {
  const file = files.find((candidate) => candidate.id === fileId);
  const {
    isPuzzleSolved,
    collectReference,
    dispatchGameEvent,
    discoverEvidence,
    setFlag,
    state,
  } = useProgress();
  const { t } = useI18n();
  const referenceVisible = isPuzzleSolved("future_log") && Boolean(file?.reference);

  useEffect(() => {
    if (referenceVisible && file?.reference) collectReference(file.reference);
  }, [collectReference, file, referenceVisible]);

  if (!file) return <div className="arg-tool">{t("objectNotFound")}</div>;

  const embeddedRecovered = Boolean(
    file.embeddedVariant &&
      state.assetVariantsSeen.includes(file.embeddedVariant.id)
  );
  const recoverEmbeddedVariant = () => {
    if (!file.embeddedVariant || embeddedRecovered) return;
    setFlag(file.embeddedVariant.setsFlag);
    dispatchGameEvent({
      type: "SEE_ASSET_VARIANT",
      variantId: file.embeddedVariant.id,
    });
    if (file.embeddedVariant.evidenceId) {
      discoverEvidence(file.embeddedVariant.evidenceId, file.id);
    }
  };
  const emptyExpanded = file.id === "empty_tmp" && state.readFileIds.includes(file.id);
  const displaySize = emptyExpanded
    ? "404 bytes"
    : file.size ?? `${Math.max(1, file.content.length / 1024).toFixed(1)} KB`;
  const displayModified =
    file.id === "solitaire_save" && state.ending
      ? "{TOMORROW} 03:14"
      : file.modified ?? "2026-03-16 03:14";

  return (
    <div className="arg-tool" style={{ width: 420, height: 390 }}>
      <div className="arg-tool__content">
        <h2>{file.name}</h2>
        <dl className="arg-tool__properties">
          <dt>{t("typeLabel")}</dt><dd>{file.kind}</dd>
          <dt>{t("dosAliasLabel")}</dt><dd>{file.alias ?? file.name.toUpperCase()}</dd>
          <dt>{t("sizeLabel")}</dt><dd>{displaySize}</dd>
          <dt>{t("modifiedLabel")}</dt><dd>{resolveTokens(displayModified)}</dd>
          <dt>{t("evidenceIdLabel")}</dt><dd>{file.evidenceId ?? t("noneLabel")}</dd>
          {emptyExpanded && <><dt>Owner</dt><dd>{state.playerName?.trim() || "NEXT USER"}</dd></>}
          {file.id === "record_2014" && state.optionalDiscoveries.includes("eleanor_record") && (
            <><dt>Owner</dt><dd>CHECKSUM</dd><dt>Human attribution</dt><dd>E. VALE / UNRESOLVED</dd></>
          )}
        </dl>
        {file.embeddedVariant && (
          <div className="arg-tool__result">
            <strong>{file.embeddedVariant.detail}</strong>
            <p>{embeddedRecovered ? file.embeddedVariant.label : "Embedded thumbnail data available."}</p>
            <button className="button" type="button" disabled={embeddedRecovered} onClick={recoverEmbeddedVariant}>
              {embeddedRecovered
                ? state.locale === "pt-BR" ? "Thumbnail recuperado" : "Thumbnail recovered"
                : state.locale === "pt-BR" ? "Recuperar thumbnail" : "Recover thumbnail"}
            </button>
          </div>
        )}
        {referenceVisible && (
          <div className="arg-tool__reference">OBJECT REF: {file.reference}</div>
        )}
      </div>
      <div className="arg-tool__status"><span>{t("readOnlyLabel")}</span><span>{t("archivePropertiesLabel")}</span></div>
    </div>
  );
};

export default FileProperties;
