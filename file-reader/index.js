import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import fs from "fs";
import csvParser from "csv-parser"; // CSV parsing module

dotenv.config();

const app = express();
const port = 5005;

// Initialize LangChain with API key
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Store the CSV data in memory
let csvData = [];

// Read the CSV file and store it in memory
const readCSV = () => {
  fs.createReadStream("./data.csv") // Path to your CSV file
    .pipe(csvParser())
    .on("data", (row) => {
      csvData.push(row); // Push each row into the array
    })
    .on("end", () => {
      console.log("CSV file successfully processed");
      console.log("CSV Data:", csvData); // Log CSV data for debugging
    });
};

// Call the function to read the CSV file
readCSV();

// CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins for testing
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

// Chat route that handles the user query
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Log the message to see what is coming from the frontend
    console.log("User Message:", message);

    // Pass the message and CSV data as context to the model
    const response = await model.invoke([
      new HumanMessage(message + "\nContext: " + JSON.stringify(csvData)),
    ]);

    // Log the full response from the model (for debugging)
    console.log("Model Response:", response);

    // Ensure the response is of type AIMessage
    if (response instanceof AIMessage) {
      const botReply = response.content || "No response received";
      console.log("Bot Reply:", botReply); // Log the bot's reply for debugging
      res.json({ response: botReply });
    } else {
      res.status(500).json({ error: "Invalid response format" });
    }
  } catch (error) {
    console.error("Error during inference:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
