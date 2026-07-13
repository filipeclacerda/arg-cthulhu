"use client";
import { useI18n } from "@/app/i18n";
export const WindowComponent = ({
  title,
  children,
  onClose,
  onMinimize,
  onMaximize,
  className,
  ...otherProps
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  className?: string;
  [key: string]: any;
}) => {
  const { locale } = useI18n();
  const label = (en: string, pt: string) => locale === "pt-BR" ? pt : en;
  return (
    <div className={`container ${className ?? ""}`.trim()} {...otherProps}>
      <div className="title" aria-label={`${title} ${label("window", "janela")}`}>
        <div className="text">
          <p className="p">{title}</p>
        </div>
        <div className="windowButtons">
          <button className="button minimize" onClick={onMinimize} aria-label={label("Minimize window", "Minimizar janela")}>_</button>
          <button className="button maximize" onClick={onMaximize} aria-label={label("Maximize window", "Maximizar janela")}>&#9633;</button>
          <button className="button close" onClick={onClose} aria-label={label("Close window", "Fechar janela")}>
            X
          </button>
        </div>
      </div>
      <div className="body">{children}</div>
    </div>
  );
};

export default WindowComponent;
