import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import fetch from "node-fetch";

// bothost даёт токен как API_TOKEN
const TELEGRAM_TOKEN = process.env.API_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// логируем, но НЕ падаем
if (!TELEGRAM_TOKEN) {
  console.error("❌ API_TOKEN (Telegram) не задан");
}
if (!DEEPSEEK_API_KEY) {
  console.warn("⚠️ DEEPSEEK_API_KEY не задан — бот будет отвечать без ИИ");
}

// сброс старых сессий Telegram
if (TELEGRAM_TOKEN) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook`);
}

// запускаем бота ТОЛЬКО если есть токен
const bot = TELEGRAM_TOKEN
  ? new TelegramBot(TELEGRAM_TOKEN, { polling: true })
  : null;

// простая память
const memory = new Map();

// характер (прямо тут, без файлов)
const systemPrompt = `
Ты живой человек.
Иногда грубый, иногда саркастичный, иногда как кент.
Отвечай коротко, без моралей и извинений.
`;

if (bot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    if (!text) return;

    if (!memory.has(userId)) memory.set(userId, []);
    const history = memory.get(userId);

    history.push({ role: "user", content: text });
    if (history.length > 6) history.shift();

    // если нет DeepSeek — простой ответ
    if (!DEEPSEEK_API_KEY) {
      bot.sendMessage(chatId, "Пиши яснее, а то я не телепат.");
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
          temperature: 1.0,
          max_tokens: 180
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 20000
        }
      );

      const reply = res.data.choices[0].message.content;
      history.push({ role: "assistant", content: reply });
      bot.sendMessage(chatId, reply);

    } catch (e) {
      bot.sendMessage(chatId, "Я туплю. Напиши позже.");
    }
  });
}

// чтобы Node не падал
process.on("unhandledRejection", (e) => {
  console.error("Unhandled promise:", e);
});
