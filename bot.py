import os
import logging
from aiogram import Bot, Dispatcher, executor, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

# Получаем токен из переменной окружения BOT_TOKEN
# На BotHost её нужно создать в разделе "Переменные" или "Environment"
API_TOKEN = os.getenv('BOT_TOKEN')

# Проверка, что переменная установлена, чтобы бот не упал с ошибкой позже
if not API_TOKEN:
    exit("Ошибка: Переменная окружения BOT_TOKEN не установлена!")

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Инициализация бота и диспетчера
bot = Bot(token=API_TOKEN)
dp = Dispatcher(bot)

def get_keyboard():
    """Создает клавиатуру с кнопкой-ссылкой"""
    keyboard = InlineKeyboardMarkup()
    button = InlineKeyboardButton(
        text="Подписаться на канал 🎵", 
        url="https://t.me/faneencikmusic"
    )
    keyboard.add(button)
    return keyboard

@dp.message_handler(commands=['start'])
async def send_welcome(message: types.Message):
    """Обработка команды /start"""
    text = (
        "Пошёл нахуй!\n\n"
        "(без негатива чувак с любовью 😍)"
    )
    await message.answer(text, reply_markup=get_keyboard())

@dp.message_handler()
async def echo_all(message: types.Message):
    """Обработка любых других текстовых сообщений"""
    text = (
        "Я же сказал, пошёл нахуй!\n\n"
        "(без негатива чувак с любовью 😍)"
    )
    await message.answer(text, reply_markup=get_keyboard())

if __name__ == '__main__':
    executor.start_polling(dp, skip_updates=True)
