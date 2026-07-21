import "dotenv/config";
import express from "express";
import { getHomeData } from "./src/controllers/home.controller.js";
import pool from "./src/db/index.js";

const app = express();
app.get("/api/home", getHomeData);

app.use((err, req, res, next) => {
    console.error("EXPRESS ERROR:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(3001, async () => {
    console.log("Server running on 3001");
    try {
        const res = await fetch("http://localhost:3001/api/home");
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response text length:", text.length);
        if (res.status === 500) console.log("Text:", text);
    } catch (e) {
        console.error("Fetch error:", e);
    }
    process.exit(0);
});
