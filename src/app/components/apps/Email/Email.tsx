"use client";
import React, { useEffect, useState } from "react";
import "./style.scss";
import { emails } from "@/app/data/emails";
import { useProgress } from "@/app/context/ProgressContext";

const Email = () => {
  const { markEmailRead, readEmailIds } = useProgress();
  const [selectedId, setSelectedId] = useState<string | null>(
    emails[0]?.id ?? null
  );

  const selected = emails.find((e) => e.id === selectedId);

  useEffect(() => {
    if (selectedId) markEmailRead(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div className="email">
      <div className="email-menubar">
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Tools</span>
        <span>Help</span>
      </div>
      <div className="email-toolbar">
        <button className="email-toolbar-button">New</button>
        <button className="email-toolbar-button">Reply</button>
        <button className="email-toolbar-button">Forward</button>
        <button className="email-toolbar-button">Delete</button>
      </div>
      <div className="email-panes">
      <div className="email-list">
        {emails.map((email) => (
          <div
            key={email.id}
            className={`email-list-item ${
              email.id === selectedId ? "selected" : ""
            } ${readEmailIds.includes(email.id) ? "read" : "unread"}`}
            onClick={() => setSelectedId(email.id)}
          >
            <p className="email-sender">{email.sender}</p>
            <p className="email-subject">{email.subject}</p>
          </div>
        ))}
      </div>
      <div className="email-detail">
        {selected ? (
          <>
            <div className="email-detail-header">
              <p>
                <strong>From:</strong> {selected.sender}
              </p>
              <p>
                <strong>Date:</strong> {selected.date}
              </p>
              <p>
                <strong>Subject:</strong> {selected.subject}
              </p>
            </div>
            <pre className="email-body">{selected.body}</pre>
          </>
        ) : (
          <p>No message selected.</p>
        )}
      </div>
      </div>
    </div>
  );
};

export default Email;
