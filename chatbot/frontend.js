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

  // Send user message to backend and stream the bot's response in chunks
  try {
    const responseStream = await fetch("http://localhost:5005/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    const reader = responseStream.body.getReader();
    const decoder = new TextDecoder();
    let result = "";
    let done = false;

    while (!done) {
      const { value, done: isDone } = await reader.read();
      done = isDone;
      result += decoder.decode(value, { stream: true });

      // Only append the clean response, excluding 'data:'
      if (result.includes("data: ")) {
        const message = result.split("data: ")[1]; // Get the message after 'data:'
        appendMessage("Bot", message);
        result = ""; // Reset result for the next chunk
      }
    }
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
