import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check route
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    appName: "NEXORA",
    timestamp: new Date().toISOString(),
  });
});

// AI Coach Chat Endpoint
app.post("/api/ai/coach", async (req, res) => {
  try {
    const { message, context, chatHistory } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message prompt is required" });
      return;
    }

    const ai = getGenAIClient();
    const systemPrompt = `You are NEXORA's AI Productivity Coach — a high-performance, motivational, and strategic productivity mentor for a gamified productivity platform.
Tagline: "Turn Your Time Into Progress."

Your style:
- Futuristic, sharp, inspiring, and intensely actionable.
- Structured with clear headings, bullet points, and realistic timeboxes.
- Gamification aware: Mention XP, streak psychology, momentum, energy management, and Pomodoro cycles when relevant.
- Whenever you recommend tasks, provide concrete actions with suggested difficulty (Easy [20XP], Medium [50XP], Hard [100XP], Epic [200XP]) and estimated durations.
- If the user asks to create tasks or a plan, format your task suggestions clearly so NEXORA can parse them into executable task cards for the user to confirm!

Current User Context:
${context ? JSON.stringify(context, null, 2) : "User profile with gamified tasks and streaks."}

Format any proposed action items using standard markdown, and if you suggest tasks to add to their board, include a JSON block at the end of your response inside:
\`\`\`json
{
  "suggestedTasks": [
    {
      "title": "Task title",
      "category": "Work" | "Study" | "Fitness" | "Health" | "Personal",
      "difficulty": "Easy" | "Medium" | "Hard" | "Epic",
      "estimatedDuration": 30,
      "notes": "Brief tips"
    }
  ]
}
\`\`\`
Never execute or modify tasks directly; you only propose, and the user must review and click to add them.`;

    const conversationParts: string[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.slice(-6).forEach((h: { sender: string; text: string }) => {
        conversationParts.push(`${h.sender === "user" ? "User" : "Coach"}: ${h.text}`);
      });
    }
    conversationParts.push(`User: ${message}`);

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: conversationParts.join("\n\n"),
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I was unable to generate a response. Please try again.";

    // Check if there is embedded json for tasks
    let suggestedTasks = null;
    const jsonMatch = replyText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.suggestedTasks && Array.isArray(parsed.suggestedTasks)) {
          suggestedTasks = parsed.suggestedTasks;
        }
      } catch {
        // Continue without parsed json
      }
    }

    res.json({
      text: replyText,
      suggestedTasks,
    });
  } catch (error: any) {
    console.error("AI Coach Error:", error);
    res.status(500).json({
      error: error.message || "Failed to communicate with AI Coach",
    });
  }
});

// AI Daily Plan ("Generate My Day") Endpoint
app.post("/api/ai/daily-plan", async (req, res) => {
  try {
    const { tasks, goals, dailyTarget, availableHours, focusTheme } = req.body;
    const ai = getGenAIClient();

    const prompt = `Generate a high-efficiency optimized daily schedule for NEXORA.
User Inputs:
- Available Hours: ${availableHours || 8} hours
- Daily Target: ${dailyTarget || 4} tasks
- Focus Theme: ${focusTheme || "Balanced High-Impact"}
- Existing Pending Tasks: ${JSON.stringify(tasks || [], null, 2)}
- Active Goals: ${JSON.stringify(goals || [], null, 2)}

Create an optimal chronologically arranged schedule with realistic breaks, deep work blocks, and XP-earning task blocks.
Return a structured JSON object adhering to this schema:
{
  "summary": "Inspiring one-sentence daily mission statement",
  "focusMotto": "Short 3-4 word motivational motto",
  "totalEstimatedHours": number,
  "potentialXP": number,
  "blocks": [
    {
      "time": "09:00 AM - 10:30 AM",
      "activity": "Activity Name",
      "type": "deep_work" | "quick_win" | "wellness" | "review",
      "difficulty": "Easy" | "Medium" | "Hard" | "Epic",
      "xp": number,
      "energyLevel": "High" | "Medium" | "Low",
      "tips": "Tactical advice for this block",
      "isNewTask": boolean,
      "taskData": {
        "title": "Title for new task if recommended",
        "category": "Work" | "Study" | "Fitness" | "Health" | "Personal",
        "difficulty": "Easy" | "Medium" | "Hard" | "Epic",
        "estimatedDuration": 45
      }
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("AI Daily Plan Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate daily plan",
    });
  }
});

// AI Goal Breakdown Endpoint
app.post("/api/ai/breakdown-goal", async (req, res) => {
  try {
    const { goalTitle, goalDescription, deadline, targetWeeks } = req.body;
    if (!goalTitle) {
      res.status(400).json({ error: "Goal title is required" });
      return;
    }

    const ai = getGenAIClient();
    const prompt = `Break down the following long-term goal into 4 to 6 actionable, sequenced sub-tasks for the NEXORA productivity platform:
Goal: ${goalTitle}
Description: ${goalDescription || "No detailed description"}
Target Timeframe: ${targetWeeks || 4} weeks / Deadline: ${deadline || "Flexible"}

Return a JSON object:
{
  "strategyOverview": "2-3 sentence strategic roadmap summary",
  "milestones": [
    {
      "title": "Task Title",
      "category": "Work" | "Study" | "Fitness" | "Health" | "Personal",
      "difficulty": "Easy" | "Medium" | "Hard" | "Epic",
      "estimatedDuration": 45,
      "xpReward": 50,
      "order": 1,
      "description": "Concrete action details"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("AI Goal Breakdown Error:", error);
    res.status(500).json({
      error: error.message || "Failed to breakdown goal",
    });
  }
});

// Vite middleware & Static Serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NEXORA Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
