import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import fetch from "node-fetch";
import { systemPrompt } from "./persona.js";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!TELEGRAM_TOKEN || !DEEPSEEK_API_KEY) {
  console.error("❌ Не заданы переменные окружения TELEGRAM_TOKEN или DEEPSEEK_API_KEY");
  process.exit(1);
}

await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook`);

const bot = new TelegramBot(TELEGRAM_TOKEN, {
  polling: { interval: 300, autoStart: true }
});

const memory = new Map();

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  if (!text) return;

  if (!memory.has(userId)) memory.set(userId, []);
  const history = memory.get(userId);

  history.push({ role: "user", content: text });
  if (history.length > 6) history.shift();

  try {
    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...history
        ],
        temperature: 1.0,
        max_tokens: 200
      },
      {
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    const reply = response.data.choices[0].message.content;
    history.push({ role: "assistant", content: reply });
    bot.sendMessage(chatId, reply);
  } catch (e) {
    bot.sendMessage(chatId, "Я завис. Напиши позже.");
  }
});

process.on("unhandledRejection", (e) => {
  console.error("Unhandled:", e);
});
