import React, { useState, useEffect } from "react";
import "../App.css"; // Stile per il pop-up

const ChatPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Aggiungi lo script di JotForm
    const script = document.createElement("script");
    script.src = "https://cdn.jotfor.ms/s/umd/latest/for-embedded-agent.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.AgentInitializer.init({
        agentRenderURL: "https://eu.jotform.com/agent/019634d3258f79d7894315d93ca756d73e98",
        rootId: "JotformAgent-019634d3258f79d7894315d93ca756d73e98",
        formID: "019634d3258f79d7894315d93ca756d73e98",
        queryParams: ["skipWelcome=1", "maximizable=1"],
        domain: "https://eu.jotform.com",
        isDraggable: false,
        background: "linear-gradient(180deg, #DAF4F6 0%, #A9E0E6 100%)",
        buttonBackgroundColor: "#0A1551",
        buttonIconColor: "#FFF",
        variant: false,
        customizations: {
          greeting: "Yes",
          greetingMessage: "hey, hai bisogno di aiuto?",
          openByDefault: "No",
          pulse: "Yes",
          position: "right",
          autoOpenChatIn: "0",
        },
        isVoice: true,
      });
    };

    return () => {
      // Rimuovi lo script quando il componente viene smontato
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="chat-popup-container">
      <div id="JotformAgent-019634d3258f79d7894315d93ca756d73e98"></div>
    </div>
  );
};

export default ChatPopup;