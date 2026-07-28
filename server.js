const fs = require("fs");
const path = require("path");

function logStep(msg) {
  try {
    fs.appendFileSync(
      path.join(__dirname, "debug-startup.log"),
      `\n${new Date().toISOString()} - ${msg}`
    );
  } catch (e) {}
}

function logError(title, err) {
  try {
    fs.appendFileSync(
      path.join(__dirname, "crash.log"),
      `\n\n===== ${title} =====\nTime: ${new Date().toISOString()}\n${
        err?.stack || err?.message || err
      }\n`
    );
  } catch (e) {}
}

logStep("STEP 1: server.js started");

process.on("uncaughtException", (err) => {
  logError("UNCAUGHT EXCEPTION", err);
});

process.on("unhandledRejection", (err) => {
  logError("UNHANDLED REJECTION", err);
});

require("dotenv").config();
logStep("STEP 2: dotenv loaded");

const mongoose = require("mongoose");
logStep("STEP 3: mongoose loaded");

const app = require("./app");
logStep("STEP 4: app.js loaded");

// fs.writeFileSync(
//   path.join(__dirname, "startup-test.txt"),
//   "mountcentric started " + new Date()
// );
logStep("STEP 5: startup-test created");

const PORT = process.env.PORT || 8000;
const mongoURI = process.env.MONGODB_ATLAS;

logStep("STEP 6: PORT = " + PORT);
logStep("STEP 7: Mongo URI exists = " + !!mongoURI);

if (!mongoURI) {
  logError("MONGODB URI MISSING", "MONGODB_ATLAS missing in .env");
} else {
  mongoose
    .connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    })
    .then(() => {
      logStep("STEP 8: MongoDB connected");
    })
    .catch((err) => {
      logError("MONGODB CONNECTION ERROR", err);
    });
}

const server = app.listen(PORT, "127.0.0.1", () => {
  logStep("STEP 9: server running on port " + PORT);
});

server.on("error", (err) => {
  logError("SERVER LISTEN ERROR", err);
});

process.on("exit", (code) => {
  logStep("PROCESS EXITED WITH CODE " + code);
});

process.on("SIGTERM", () => {
  logStep("SIGTERM RECEIVED");
  process.exit(0);
});