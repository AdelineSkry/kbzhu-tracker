/**
 * КБЖУ-Трекер - Главный скрипт приложения
 * Функционал: загрузка фото, предпросмотр, анализ (заглушка)
 */

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
 * Запуск анализа фото (заглушка)
 * В будущем здесь будет вызов API Claude
 */
async function analyzePhoto() {
    if (!selectedFile) return;

    // Показываем индикатор загрузки
    loader.hidden = false;
    analyzeBtn.disabled = true;
    resultSection.hidden = true;

    try {
        // Имитация задержки API-запроса (заглушка)
        await simulateApiCall();

        // Получаем данные заглушки
        const mockData = getMockAnalysisResult();

        // Отображаем результаты
        displayResults(mockData);
    } catch (error) {
        console.error('Ошибка анализа:', error);
        alert('Произошла ошибка при анализе изображения');
    } finally {
        // Скрываем индикатор загрузки
        loader.hidden = true;
        analyzeBtn.disabled = false;
    }
}

/**
 * Имитация задержки API-запроса
 * @returns {Promise} - промис с задержкой
 */
function simulateApiCall() {
    return new Promise(resolve => setTimeout(resolve, 1500));
}

/**
 * Получить данные заглушки для результатов анализа
 * @returns {Object} - объект с данными КБЖУ
 */
function getMockAnalysisResult() {
    // Заглушка - в будущем здесь будут реальные данные от Claude API
    const mockResults = [
        {
            name: 'Греческий салат',
            calories: 180,
            proteins: 5,
            fats: 14,
            carbs: 9,
            info: 'Примерная порция: 250г'
        },
        {
            name: 'Куриная грудка с рисом',
            calories: 420,
            proteins: 35,
            fats: 8,
            carbs: 52,
            info: 'Примерная порция: 350г'
        },
        {
            name: 'Овсяная каша с фруктами',
            calories: 280,
            proteins: 8,
            fats: 6,
            carbs: 48,
            info: 'Примерная порция: 300г'
        }
    ];

    // Возвращаем случайный результат для демонстрации
    const randomIndex = Math.floor(Math.random() * mockResults.length);
    return mockResults[randomIndex];
}

/**
 * Отобразить результаты анализа
 * @param {Object} data - данные анализа
 */
function displayResults(data) {
    dishName.textContent = data.name;
    calories.textContent = data.calories;
    proteins.textContent = data.proteins;
    fats.textContent = data.fats;
    carbs.textContent = data.carbs;
    additionalInfo.textContent = data.info;

    resultSection.hidden = false;
}

// ========================================
// TODO: Интеграция с бэкендом
// ========================================

/**
 * Будущая функция для отправки фото на сервер
 * @param {File} file - файл изображения
 * @returns {Promise<Object>} - результат анализа от API
 */
async function sendToApi(file) {
    // TODO: Реализовать отправку на бэкенд
    // const formData = new FormData();
    // formData.append('photo', file);
    //
    // const response = await fetch('/api/analyze', {
    //     method: 'POST',
    //     body: formData
    // });
    //
    // return response.json();

    throw new Error('API ещё не реализован');
}
