const messages = document.getElementById("messages");
const input = document.getElementById("message");
const send = document.getElementById("send");

const newChat = document.getElementById("newChat");
const endSession = document.getElementById("endSession");
const sessionStatus = document.getElementById("sessionStatus");
const chatTimer = document.getElementById("chatTimer");

let timer = 0;

setInterval(() => {

    timer++;

    const mins = String(Math.floor(timer / 60)).padStart(2, "0");
    const secs = String(timer % 60).padStart(2, "0");

    chatTimer.textContent = `${mins}:${secs}`;

}, 1000);

let sessionId = sessionStorage.getItem("chatSessionId");

if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("chatSessionId", sessionId);
}

function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = "message " + type;
    div.innerHTML = text.replace(/\n/g, "<br>");
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

addMessage(`${greeting}!`, "bot");

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

endSession.addEventListener("click", async () => {

    if (!confirm("End this chat session?"))
        return;

    const response = await fetch(`/${tenant}/chat/end`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            sessionId
        })

    });

    const data = await response.json();

    if (!data.success)
        return;

    input.disabled = true;
    send.disabled = true;

    endSession.disabled = true;
    newChat.disabled = false;

    sessionStatus.textContent = "🔴 Session Closed";

    addMessage(
        "Thank you for chatting with us. Have a great day!",
        "bot"
    );

});

newChat.addEventListener("click", async () => {

    sessionId = crypto.randomUUID();

    sessionStorage.setItem("chatSessionId", sessionId);

    messages.innerHTML = "";

    input.disabled = false;
    send.disabled = false;

    endSession.disabled = false;
    newChat.disabled = true;

    sessionStatus.textContent = "🟢 Session Active";

    timer = 0;
    chatTimer.textContent = "00:00";

    addMessage("Hello! I'm your AI Property Assistant.", "bot");
    addMessage("How can I help you today?", "bot");

});

function updateHeaderDateTime() {

    const now = new Date();

    document.getElementById("chatDate").textContent =
        now.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

    document.getElementById("chatTime").textContent =
        now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });

}

updateHeaderDateTime();

setInterval(updateHeaderDateTime, 1000);
