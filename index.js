import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import fetch from "node-fetch";

const TELEGRAM_TOKEN = process.env.API_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// === ПРОСТОЙ ХАМСКИЙ FALLBACK (БЕЗ ИИ) ===
const fallbackReplies = [
  "Ты нормально можешь написать или как?",
  "Я понял, но ты сейчас чё хотел?",
  "Ку. И дальше что?",
  "Ну привет, герой.",
  "Ты это всерьёз сейчас?",
  "Давай конкретнее, не тяни резину.",
  "Я не телепат, если что.",
  "О, опять ты.",
  "Салам. Говори.",
  "Ну?"
];

// === SYSTEM PROMPT ===
const systemPrompt = `
Ты живой человек.
Иногда грубый, иногда саркастичный, иногда как кент.
Можно слегка хамить.
Отвечай коротко.
Не извиняйся.
`;

// логируем, но НЕ падаем
if (!TELEGRAM_TOKEN) {
  console.error("❌ API_TOKEN (Telegram) не задан");
}
if (!DEEPSEEK_API_KEY) {
  console.warn("⚠️ DEEPSEEK_API_KEY не задан — работаем в fallback-режиме");
}

// сброс старых сессий
if (TELEGRAM_TOKEN) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook`);
}

const bot = TELEGRAM_TOKEN
  ? new TelegramBot(TELEGRAM_TOKEN, { polling: true })
  : null;

// память
const memory = new Map();

function randomFallback() {
  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
}

if (bot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    if (!text) return;

    // /start
    if (text === "/start") {
      bot.sendMessage(chatId, "Ну здарова. Пиши, не стесняйся.");
      return;
    }

    if (!memory.has(userId)) memory.set(userId, []);
    const history = memory.get(userId);

    history.push({ role: "user", content: text });
    if (history.length > 6) history.shift();

    // === ЕСЛИ НЕТ DEEPSEEK — СРАЗУ FALLBACK ===
    if (!DEEPSEEK_API_KEY) {
      bot.sendMessage(chatId, randomFallback());
      return;
    }

    try {
      const res = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            ...history
          ],
          temperature: 1.1,
          max_tokens: 180
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      const reply = res.data.choices[0].message.content;

      history.push({ role: "assistant", content: reply });
      bot.sendMessage(chatId, reply);

    } catch (e) {
      // 🔥 ВАЖНО: НЕ ОДНА И ТА ЖЕ ФРАЗА
      bot.sendMessage(chatId, randomFallback());
    }
  });
}

process.on("unhandledRejection", (e) => {
  console.error("Unhandled:", e);
});
