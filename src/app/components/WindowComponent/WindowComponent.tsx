"use client";
export const WindowComponent = ({
  title,
  children,
  onClose,
  className,
  ...otherProps
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <div className={`container ${className ?? ""}`.trim()} {...otherProps}>
      <div className="title">
        <div className="text">
          <p className="p">{title}</p>
        </div>
        <div className="windowButtons">
          <button className="button minimize">_</button>
          <button className="button maximize">&#9633;</button>
          <button className="button close" onClick={onClose}>
            X
          </button>
        </div>
      </div>
      <div className="body">{children}</div>
    </div>
  );
};

export default WindowComponent;
