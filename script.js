const micBtn = document.getElementById("mic-btn");
const reactor = document.getElementById("reactor");
const statusText = document.getElementById("status-text");
const chatLog = document.getElementById("chat-log");
const textInput = document.getElementById("text-input");
const sendBtn = document.getElementById("send-btn");

const apiModal = document.getElementById("api-modal");
const keyBtn = document.getElementById("key-btn");
const saveKeyBtn = document.getElementById("save-key-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const apiKeyInput = document.getElementById("api-key-input");

let isSpeaking = false;
let chatHistory = [
  {
    role: "system",
    content:
      "You are J.A.R.V.I.S., Tony Stark's hyper-intelligent AI assistant. You possess complete A-to-Z real-world knowledge across science, coding, history, movies, current affairs, and daily life. Always address the user as 'Boss' or 'Sir'. Keep your answers sharp, accurate, slightly witty, and concise (2-4 sentences max so they sound natural when spoken aloud). Reply in the same language (English or Hinglish) the user uses. Never use markdown symbols like asterisks or bullet points."
  }
];

setInterval(() => {
  const now = new Date();
  document.getElementById("clock").innerText = now.toLocaleTimeString();
}, 1000);

if ("getBattery" in navigator) {
  navigator.getBattery().then((battery) => {
    const updateBattery = () => {
      document.getElementById("battery").innerText = `PWR: ${Math.round(battery.level * 100)}%`;
    };
    updateBattery();
    battery.addEventListener("levelchange", updateBattery);
  });
}

function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const jarvisVoice =
    voices.find((v) => v.lang.includes("en-GB")) ||
    voices.find((v) => v.lang.includes("en"));
  if (jarvisVoice) utterance.voice = jarvisVoice;
  utterance.pitch = 0.92;
  utterance.rate = 1.03;

  utterance.onstart = () => {
    isSpeaking = true;
    reactor.classList.add("active");
  };
  utterance.onend = () => {
    isSpeaking = false;
    reactor.classList.remove("active");
  };
  window.speechSynthesis.speak(utterance);
}

function addLog(sender, message, isUser = false) {
  const p = document.createElement("p");
  p.className = isUser ? "user-msg" : "ai-msg";
  p.innerText = `[${sender}]: ${message}`;
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function processCommand(command) {
  const cleanCmd = command.toLowerCase().trim();
  addLog("BOSS", command, true);

  if (cleanCmd.startsWith("open ")) {
    const site = cleanCmd.replace("open ", "").trim();
    const urls = {
      youtube: "https://youtube.com",
      google: "https://google.com",
      github: "https://github.com",
      instagram: "https://instagram.com",
      whatsapp: "https://whatsapp.com",
      gmail: "https://google.com"
    };
    if (urls[site]) {
      const reply = `Launching ${site} interface now, Boss.`;
      addLog("J.A.R.V.I.S.", reply);
      speak(reply);
      window.open(urls[site], "_blank");
      return;
    }
  }

  const apiKey = localStorage.getItem("GROQ_API_KEY");
  if (!apiKey) {
    const reply = "Boss, click the API button below and enter your free Groq API key to unlock my full A to Z global intelligence.";
    addLog("J.A.R.V.I.S.", reply);
    speak(reply);
    return;
  }

  statusText.innerText = "ACCESSING GLOBAL NEURAL NET...";
  chatHistory.push({ role: "user", content: command });

  if (chatHistory.length > 11) {
    chatHistory = [chatHistory.at(0), ...chatHistory.slice(-10)];
  }

  try {
    const response = await fetch("https://groq.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: chatHistory,
        temperature: 0.7,
        max_tokens: 250
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const aiReply = data.choices.at(0).message.content.trim();
    chatHistory.push({ role: "assistant", content: aiReply });

    addLog("J.A.R.V.I.S.", aiReply);
    speak(aiReply);
  } catch (err) {
    const errMsg = "Connection error with the neural core, Boss. Please verify your Groq API key.";
    addLog("J.A.R.V.I.S.", errMsg);
    speak(errMsg);
  } finally {
    statusText.innerText = "SYSTEM READY";
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;

  micBtn.addEventListener("click", () => {
    if (isSpeaking) window.speechSynthesis.cancel();
    recognition.start();
    statusText.innerText = "LISTENING TO VOICE INPUT...";
    reactor.classList.add("active");
  });

  recognition.onresult = (event) => {
    if (isSpeaking) return;
    const transcript = event.results.item(0).item(0).transcript;
    processCommand(transcript);
  };

  recognition.onerror = () => {
    statusText.innerText = "VOICE INPUT INTERRUPTED. TRY AGAIN.";
    reactor.classList.remove("active");
  };

  recognition.onend = () => {
    if (!isSpeaking) reactor.classList.remove("active");
  };
}

sendBtn.addEventListener("click", () => {
  if (textInput.value.trim()) {
    processCommand(textInput.value);
    textInput.value = "";
  }
});

textInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && textInput.value.trim()) {
    processCommand(textInput.value);
    textInput.value = "";
  }
});

keyBtn.addEventListener("click", () => {
  apiKeyInput.placeholder = "gsk_...";
  apiKeyInput.value = localStorage.getItem("GROQ_API_KEY") || "";
  apiModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => apiModal.classList.add("hidden"));

saveKeyBtn.addEventListener("click", () => {
  localStorage.setItem("GROQ_API_KEY", apiKeyInput.value.trim());
  apiModal.classList.add("hidden");
  addLog("SYSTEM", "Groq Neural Core connected. Full A-to-Z knowledge active.");
  speak("All global databases online, Boss. Ask me anything.");
});
