import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

dotenv.config();

const app = express();
const port = 5005;

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(bodyParser.json());

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const response = await model.invoke([new HumanMessage(message)]);
    console.log("Model Response:", response); // Log the full response for debugging

    if (response instanceof AIMessage) {
      const botReply = response.content || "No response received";

      // Split the response into paragraphs or chunks
      const chunks = botReply.split("\n\n"); // Split by paragraphs (double newline)

      let index = 0;
      const interval = setInterval(() => {
        if (index < chunks.length) {
          res.write(`data: ${chunks[index]}\n\n`); // Send each chunk as 'data'
          index++;
        } else {
          clearInterval(interval);
          res.write("data: [---------]\n\n"); // Mark the end of the message
          res.end(); // Close the connection
        }
      }, 1000); // Adjust the interval for chunk delay (in ms)
    } else {
      res.status(500).json({ error: "Invalid response format" });
    }
  } catch (error) {
    console.error("Error during inference:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
