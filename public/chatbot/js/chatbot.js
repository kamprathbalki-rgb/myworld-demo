const messages = document.getElementById("messages");
const input = document.getElementById("message");
const send = document.getElementById("send");

let sessionId = sessionStorage.getItem("chatSessionId");

if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("chatSessionId", sessionId);
}

function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = "message " + type;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

const now = new Date();

const greeting =
    now.getHours() < 12
        ? "Good Morning"
        : now.getHours() < 17
            ? "Good Afternoon"
            : "Good Evening";

const date = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
});

const time = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
});

addMessage(`${greeting}! ${date}
${time}`, "bot");

setTimeout(() => {
    addMessage(
`I'm your AI Property Assistant.

I'm here to help you find the right property based on your requirements.`,
"bot");
}, 3000);

setTimeout(() => {
    addMessage(
`You can ask me about:

🏡 Buying a property
🏢 Commercial spaces
💰 Property investments
📍 Projects in your preferred location
📄 Pricing, brochures and site visits`,
"bot");
}, 6000);

setTimeout(() => {
    addMessage(
`For personalized recommendations, kindly share your:

• Name
• Mobile Number
• Email Address

Your information will only be used to assist you with your property search.`,
"bot");
}, 9000);

setTimeout(() => {
    addMessage(
"How can I help you today?",
"bot");
}, 12000);

async function sendMessage() {

    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");

    input.value = "";

    const response = await fetch(`/${tenant}/chat/message`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({sessionId, message})
    });

    const data = await response.json();

if (data.sessionId && data.sessionId !== sessionId) {
    sessionId = data.sessionId;
    sessionStorage.setItem("chatSessionId", sessionId);
}

    addMessage(data.reply, "bot");
}

send.addEventListener("click", sendMessage);

input.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

