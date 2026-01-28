"""
Flask backend для КБЖУ-трекера с OpenAI GPT-4 Vision API.
Анализирует фотографии еды и возвращает данные о калориях, белках, жирах и углеводах.
"""

import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

app = Flask(__name__)

# Включаем CORS для всех маршрутов (разрешаем запросы с фронтенда)
CORS(app)

# Инициализируем клиент OpenAI с API ключом из переменных окружения
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Системный промпт для анализа КБЖУ
SYSTEM_PROMPT = """Ты — эксперт-нутрициолог. Проанализируй фотографию еды и определи приблизительные значения КБЖУ.

Верни ответ СТРОГО в формате JSON без дополнительного текста:
{
    "product_name": "название блюда или продукта",
    "calories": число (ккал),
    "proteins": число (грамм белка),
    "fats": число (грамм жиров),
    "carbs": число (грамм углеводов),
    "weight": число (примерный вес порции в граммах),
    "confidence": "high" | "medium" | "low",
    "notes": "дополнительные заметки о продукте (опционально)"
}

Если на фото несколько продуктов, суммируй все значения.
Если не можешь определить еду на фото, верни JSON с пустыми значениями и объяснением в notes."""


def encode_image_to_base64(image_data: bytes) -> str:
    """
    Кодирует изображение в формат base64.

    Args:
        image_data: Байты изображения

    Returns:
        Строка в формате base64
    """
    return base64.b64encode(image_data).decode("utf-8")


def analyze_food_image(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """
    Отправляет изображение в OpenAI GPT-4 Vision для анализа КБЖУ.

    Args:
        image_base64: Изображение в формате base64
        mime_type: MIME тип изображения

    Returns:
        Словарь с данными КБЖУ
    """
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Проанализируй эту еду и определи КБЖУ:"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{image_base64}",
                            "detail": "high"
                        }
                    }
                ]
            }
        ],
        max_tokens=500,
        temperature=0.3  # Низкая температура для более точных ответов
    )

    # Извлекаем текст ответа
    result_text = response.choices[0].message.content

    # Парсим JSON из ответа
    import json

    # Убираем возможные markdown-обёртки ```json ... ```
    if "```json" in result_text:
        result_text = result_text.split("```json")[1].split("```")[0]
    elif "```" in result_text:
        result_text = result_text.split("```")[1].split("```")[0]

    return json.loads(result_text.strip())


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Эндпоинт для анализа фотографии еды.

    Принимает:
        - Файл изображения (multipart/form-data, поле "image")
        - ИЛИ JSON с base64 изображением ({"image": "base64_string", "mime_type": "image/jpeg"})

    Возвращает:
        JSON с данными КБЖУ или сообщение об ошибке
    """
    try:
        # Проверяем наличие API ключа
        if not os.getenv("OPENAI_API_KEY"):
            return jsonify({
                "error": "API ключ OpenAI не настроен",
                "message": "Добавьте OPENAI_API_KEY в файл .env"
            }), 500

        image_base64 = None
        mime_type = "image/jpeg"

        # Вариант 1: Файл загружен через form-data
        if "image" in request.files:
            file = request.files["image"]

            # Проверяем, что файл выбран
            if file.filename == "":
                return jsonify({
                    "error": "Файл не выбран",
                    "message": "Пожалуйста, выберите изображение для анализа"
                }), 400

            # Определяем MIME тип
            mime_type = file.content_type or "image/jpeg"

            # Читаем и кодируем изображение
            image_data = file.read()
            image_base64 = encode_image_to_base64(image_data)

        # Вариант 2: Base64 изображение в JSON
        elif request.is_json:
            data = request.get_json()

            if "image" not in data:
                return jsonify({
                    "error": "Изображение не предоставлено",
                    "message": "Отправьте изображение в поле 'image'"
                }), 400

            image_base64 = data["image"]
            mime_type = data.get("mime_type", "image/jpeg")

            # Убираем префикс data:image/..., если он есть
            if image_base64.startswith("data:"):
                # Извлекаем MIME тип из префикса
                header, image_base64 = image_base64.split(",", 1)
                mime_type = header.split(":")[1].split(";")[0]

        else:
            return jsonify({
                "error": "Неверный формат запроса",
                "message": "Отправьте изображение через form-data или JSON с base64"
            }), 400

        # Анализируем изображение через OpenAI
        result = analyze_food_image(image_base64, mime_type)

        return jsonify({
            "success": True,
            "data": result
        })

    except json.JSONDecodeError as e:
        # Ошибка парсинга JSON ответа от OpenAI
        return jsonify({
            "error": "Ошибка обработки ответа",
            "message": "Не удалось распознать ответ от AI. Попробуйте другое фото."
        }), 500

    except Exception as e:
        # Общая обработка ошибок
        return jsonify({
            "error": "Внутренняя ошибка сервера",
            "message": str(e)
        }), 500


@app.route("/health", methods=["GET"])
def health_check():
    """
    Эндпоинт для проверки работоспособности сервера.
    """
    return jsonify({
        "status": "ok",
        "message": "КБЖУ-трекер backend работает"
    })


if __name__ == "__main__":
    # Запускаем сервер в режиме отладки на порту 5000
    app.run(debug=True, host="0.0.0.0", port=5000)
