import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import { systemPrompt } from "./persona.js";

const TELEGRAM_TOKEN = "8568257091:AAE5QCTQrGP3dU8r7BKti2_KoxlUUzLqUaY";
const DEEPSEEK_API_KEY = "sk-61baaa1bdeb641329464db179e0ad9e5";

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const memory = new Map();

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!text) return;

  if (!memory.has(userId)) memory.set(userId, []);
  const history = memory.get(userId);

  history.push({ role: "user", content: text });
  if (history.length > 8) history.shift();

  try {
    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...history
        ],
        temperature: 1.1,
        max_tokens: 250
      },
      {
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    history.push({ role: "assistant", content: reply });
    bot.sendMessage(chatId, reply);

  } catch (e) {
    bot.sendMessage(chatId, "Я завис. Напиши позже.");
  }
});
