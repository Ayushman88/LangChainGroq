const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatWindow = document.getElementById("chat-window");

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Display user message
  appendMessage("You", userMessage);

  // Clear input field
  chatInput.value = "";

  try {
    // Send user message to backend and fetch bot's response
    const response = await fetch("http://localhost:5005/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await response.json();
    console.log("Response from bot:", data); // Log the response

    const botReply = data.response || "No response received";
    appendMessage("Bot", botReply);
  } catch (error) {
    console.error("Error:", error);
    appendMessage("Bot", "An error occurred. Please try again.");
  }
});

function appendMessage(sender, message) {
  const messageElement = document.createElement("div");
  messageElement.className = "my-2";
  messageElement.innerHTML = `
    <p class="text-sm ${sender === "You" ? "text-right" : "text-left"}">
      <span class="font-bold">${sender}:</span> ${message}
    </p>
  `;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
