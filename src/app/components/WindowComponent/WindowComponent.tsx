"use client";
export const WindowComponent = ({
  title,
  children,
  onClose,
  ...otherProps
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  [key: string]: any;
}) => {
  return (
    <div className="container" {...otherProps}>
      <div className="title">
        <div className="text">
          <p className="p">{title}</p>
        </div>
        <div className="windowButtons">
          <button className="button questionMark">?</button>
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
