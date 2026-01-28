/**
 * КБЖУ-Трекер - Главный скрипт приложения
 * Функционал: загрузка фото, предпросмотр, анализ через OpenAI GPT-4 Vision
 */

// ========================================
// Конфигурация API
// ========================================

const API_URL = 'http://localhost:5000';

// ========================================
// Получение элементов DOM
// ========================================

const photoInput = document.getElementById('photo-input');
const uploadLabel = document.querySelector('.upload-label');
const previewSection = document.getElementById('preview-section');
const previewImage = document.getElementById('preview-image');
const removeBtn = document.getElementById('remove-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const resultSection = document.getElementById('result-section');
const loader = document.getElementById('loader');

// Элементы результатов
const dishName = document.getElementById('dish-name');
const calories = document.getElementById('calories');
const proteins = document.getElementById('proteins');
const fats = document.getElementById('fats');
const carbs = document.getElementById('carbs');
const additionalInfo = document.getElementById('additional-info');

// ========================================
// Переменные состояния
// ========================================

let selectedFile = null; // Выбранный файл изображения

// ========================================
// Обработчики событий
// ========================================

// Обработка выбора файла через input
photoInput.addEventListener('change', handleFileSelect);

// Обработка drag & drop
uploadLabel.addEventListener('dragover', handleDragOver);
uploadLabel.addEventListener('dragleave', handleDragLeave);
uploadLabel.addEventListener('drop', handleDrop);

// Удаление выбранного фото
removeBtn.addEventListener('click', removePhoto);

// Запуск анализа
analyzeBtn.addEventListener('click', analyzePhoto);

// ========================================
// Функции загрузки и предпросмотра
// ========================================

/**
 * Обработка выбора файла
 * @param {Event} event - событие изменения input
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

/**
 * Обработка перетаскивания файла (dragover)
 * @param {DragEvent} event - событие drag
 */
function handleDragOver(event) {
    event.preventDefault();
    uploadLabel.style.borderColor = '#3498db';
    uploadLabel.style.backgroundColor = '#f8fafc';
}

/**
 * Обработка выхода из зоны перетаскивания
 * @param {DragEvent} event - событие drag
 */
function handleDragLeave(event) {
    event.preventDefault();
    uploadLabel.style.borderColor = '#ddd';
    uploadLabel.style.backgroundColor = 'transparent';
}

/**
 * Обработка сброса файла (drop)
 * @param {DragEvent} event - событие drop
 */
function handleDrop(event) {
    event.preventDefault();
    uploadLabel.style.borderColor = '#ddd';
    uploadLabel.style.backgroundColor = 'transparent';

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    }
}

/**
 * Обработка выбранного файла - создание предпросмотра
 * @param {File} file - файл изображения
 */
function processFile(file) {
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
    }

    // Сохраняем файл
    selectedFile = file;

    // Создаём предпросмотр
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        showPreview();
    };
    reader.readAsDataURL(file);
}

/**
 * Показать секцию предпросмотра
 */
function showPreview() {
    previewSection.hidden = false;
    uploadLabel.parentElement.hidden = true; // Скрываем область загрузки
    analyzeBtn.disabled = false;
    resultSection.hidden = true; // Скрываем предыдущие результаты
}

/**
 * Удалить выбранное фото и вернуться к форме загрузки
 */
function removePhoto() {
    selectedFile = null;
    photoInput.value = '';
    previewImage.src = '';
    previewSection.hidden = true;
    uploadLabel.parentElement.hidden = false;
    analyzeBtn.disabled = true;
    resultSection.hidden = true;
}

// ========================================
// Функции анализа
// ========================================

/**
 * Запуск анализа фото через бэкенд API
 */
async function analyzePhoto() {
    if (!selectedFile) return;

    // Показываем индикатор загрузки
    loader.hidden = false;
    analyzeBtn.disabled = true;
    resultSection.hidden = true;

    try {
        // Отправляем изображение на бэкенд
        const result = await sendToApi(selectedFile);

        // Отображаем результаты
        displayResults(result);
    } catch (error) {
        console.error('Ошибка анализа:', error);
        alert(error.message || 'Произошла ошибка при анализе изображения');
    } finally {
        // Скрываем индикатор загрузки
        loader.hidden = true;
        analyzeBtn.disabled = false;
    }
}

/**
 * Отобразить результаты анализа
 * @param {Object} data - данные анализа от API
 */
function displayResults(data) {
    dishName.textContent = data.product_name || 'Неизвестный продукт';
    calories.textContent = data.calories || '—';
    proteins.textContent = data.proteins || '—';
    fats.textContent = data.fats || '—';
    carbs.textContent = data.carbs || '—';

    // Формируем дополнительную информацию
    const infoParts = [];
    if (data.weight) {
        infoParts.push(`Порция: ~${data.weight}г`);
    }
    if (data.confidence) {
        const confidenceMap = {
            high: 'Высокая точность',
            medium: 'Средняя точность',
            low: 'Низкая точность'
        };
        infoParts.push(confidenceMap[data.confidence] || '');
    }
    if (data.notes) {
        infoParts.push(data.notes);
    }

    additionalInfo.textContent = infoParts.join(' • ');
    resultSection.hidden = false;
}

// ========================================
// Интеграция с бэкендом
// ========================================

/**
 * Отправка фото на сервер для анализа КБЖУ
 * @param {File} file - файл изображения
 * @returns {Promise<Object>} - результат анализа от API
 */
async function sendToApi(file) {
    // Создаём FormData для отправки файла
    const formData = new FormData();
    formData.append('image', file);

    // Отправляем запрос на бэкенд
    const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData
    });

    // Парсим JSON ответ
    const result = await response.json();

    // Проверяем на ошибки
    if (!response.ok) {
        throw new Error(result.message || result.error || 'Ошибка сервера');
    }

    if (!result.success) {
        throw new Error(result.message || 'Не удалось проанализировать изображение');
    }

    return result.data;
}
