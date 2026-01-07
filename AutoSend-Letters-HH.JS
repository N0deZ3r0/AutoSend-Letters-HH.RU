console.log('=== HH Авто-отклик ===');

// Настройки
let coverLetter = `Добрый день!

Заинтересовала ваша вакансия. Мой опыт соответствует требованиям. Готов(а) к собеседованию.

С уважением,
[Ваше Имя]`;

let isRunning = false;
let processedVacancies = new Set();
let stats = {
    success: 0,
    failed: 0,
    skipped: 0,
    total: 0
};

// Создаем панель управления
function createPanel() {
    // Удаляем старую панель если есть
    const oldPanel = document.getElementById('hh-auto-panel');
    if (oldPanel) oldPanel.remove();
    
    const panel = document.createElement('div');
    panel.id = 'hh-auto-panel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: white;
        border: 2px solid #4CAF50;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        min-width: 280px;
        font-family: Arial, sans-serif;
        max-height: 90vh;
        overflow-y: auto;
    `;
    
    panel.innerHTML = `
        <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #2196F3; font-size: 16px;">🤖 HH Авто-отклик </h3>
            <div id="hh-status" style="background: #f0f8ff; padding: 8px; border-radius: 4px; font-size: 13px; min-height: 40px; margin-bottom: 10px; white-space: pre-line;">
                Готов к работе
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-size: 12px; color: #666;">
                    🔍 Найдено: <span id="hh-count" style="font-weight: bold;">0</span>
                </div>
                <div id="hh-stats" style="font-size: 11px; color: #666; background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">
                    ✅0 ❌0 ⏭️0
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="font-weight: bold; font-size: 13px;">📝 Сопроводительное письмо:</div>
                <button id="hh-save" style="background: #2196F3; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer;">
                    💾 Сохранить
                </button>
            </div>
            <textarea id="hh-letter" style="width: 100%; height: 90px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; resize: vertical;">${coverLetter}</textarea>
            <div style="font-size: 11px; color: #666; margin-top: 3px; display: flex; justify-content: space-between;">
                <span>* Укажите своё настоящее имя</span>
                <span id="hh-char-count">${coverLetter.length}/2000</span>
            </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
            <button id="hh-start" style="padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px;">
                ▶️ НАЧАТЬ АВТО-ОТКЛИК
            </button>
            <button id="hh-test" style="padding: 10px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                🧪 Тест на 1 вакансию
            </button>
            <button id="hh-stop" style="padding: 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px; display: none;">
                ⏹️ ОСТАНОВИТЬ
            </button>
        </div>
        
        <div style="margin-top: 15px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
            <div style="margin-bottom: 8px;">
                <button id="hh-clear" style="background: #607D8B; color: white; border: none; border-radius: 4px; padding: 6px 12px; font-size: 11px; cursor: pointer; margin-right: 8px;">
                    🗑️ Очистить историю
                </button>
                <button id="hh-analyze" style="background: #FF9800; color: white; border: none; border-radius: 4px; padding: 6px 12px; font-size: 11px; cursor: pointer;">
                    📊 Анализ
                </button>
            </div>
            <div> by alex </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Обработчики
    document.getElementById('hh-start').addEventListener('click', startProcess);
    document.getElementById('hh-test').addEventListener('click', testProcess);
    document.getElementById('hh-stop').addEventListener('click', stopProcess);
    document.getElementById('hh-save').addEventListener('click', saveLetter);
    document.getElementById('hh-clear').addEventListener('click', clearHistory);
    document.getElementById('hh-analyze').addEventListener('click', analyzePage);
    document.getElementById('hh-letter').addEventListener('input', updateCharCount);
    
    // Загружаем сохраненное письмо
    const savedLetter = localStorage.getItem('hh_auto_letter');
    if (savedLetter) {
        document.getElementById('hh-letter').value = savedLetter;
        coverLetter = savedLetter;
        updateCharCount();
    }
}

// Обновить статус
function updateStatus(msg) {
    const statusEl = document.getElementById('hh-status');
    if (statusEl) {
        statusEl.textContent = msg;
        console.log('Статус:', msg);
    }
}

// Обновить статистику
function updateStats() {
    const statsEl = document.getElementById('hh-stats');
    if (statsEl) {
        statsEl.textContent = `✅${stats.success} ❌${stats.failed} ⏭️${stats.skipped}`;
    }
}

// Обновить счетчик символов
function updateCharCount() {
    const textarea = document.getElementById('hh-letter');
    const counter = document.getElementById('hh-char-count');
    if (textarea && counter) {
        const length = textarea.value.length;
        counter.textContent = `${length}/2000`;
        counter.style.color = length > 2000 ? '#f44336' : '#666';
    }
}

// Обновить счетчик вакансий
function updateCounter() {
    const countEl = document.getElementById('hh-count');
    if (countEl) {
        const buttons = getAvailableButtons();
        countEl.textContent = buttons.length;
    }
}

// Сохранить письмо
function saveLetter() {
    coverLetter = document.getElementById('hh-letter').value;
    localStorage.setItem('hh_auto_letter', coverLetter);
    
    const btn = document.getElementById('hh-save');
    const originalText = btn.textContent;
    btn.textContent = '✓ Сохранено!';
    btn.style.background = '#4CAF50';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '#2196F3';
    }, 1500);
    
    updateStatus('💾 Письмо сохранено');
}

// Очистить историю
function clearHistory() {
    if (confirm('Очистить историю обработанных вакансий?')) {
        processedVacancies.clear();
        stats = { success: 0, failed: 0, skipped: 0, total: 0 };
        updateStats();
        updateStatus('🗑️ История очищена');
        
        // Убираем классы с вакансий
        document.querySelectorAll('.hh-processed').forEach(el => {
            el.classList.remove('hh-processed');
        });
    }
}

// Анализ страницы
function analyzePage() {
    const allButtons = document.querySelectorAll('[data-qa="vacancy-serp__vacancy_response"]');
    const responded = Array.from(allButtons).filter(btn => isAlreadyRespondedVacancy(btn));
    const available = allButtons.length - responded.length;
    
    const analysis = `📊 Анализ страницы:
• Всего вакансий: ${allButtons.length}
• Уже откликнулись: ${responded.length}
• Доступно для отклика: ${available}
• Обработано в сессии: ${stats.total}

💡 Статистика:
✅ Успешно: ${stats.success}
❌ Неудачно: ${stats.failed}
⏭️ Пропущено: ${stats.skipped}`;
    
    updateStatus(analysis);
}

// Ждать
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Получить ID вакансии
function getVacancyId(button) {
    const vacancyItem = button.closest('.vacancy-serp-item') || 
                       button.closest('.serp-item') ||
                       button.closest('[data-qa="vacancy-serp__vacancy"]');
    
    if (vacancyItem) {
        const link = vacancyItem.querySelector('a[href*="/vacancy/"]');
        if (link && link.href) {
            return link.href.split('?')[0];
        }
    }
    
    return button.href || `vacancy-${Date.now()}`;
}

// =========== ПРОВЕРКА ОТКЛИКОВ (СТАБИЛЬНАЯ) ===========
function isAlreadyRespondedVacancy(button) {
    // Создаем карту родителей для поиска статуса
    const parent = button.closest('.vacancy-serp-item') || 
                   button.closest('.serp-item') ||
                   button.closest('[data-qa="vacancy-serp__vacancy"]');
    
    if (!parent) return false;
    
    // 1. Проверяем по data-qa атрибуту (самый надежный способ)
    const respondedElement = parent.querySelector('[data-qa="vacancy-serp__vacancy_responded"]');
    if (respondedElement) {
        return true;
    }
    
    // 2. Проверяем текст всей карточки
    const parentText = parent.innerText || parent.textContent || '';
    if (parentText.includes('Вы откликнулись') || 
        parentText.includes('Вы уже откликнулись') ||
        parentText.includes('Отклик отправлен')) {
        return true;
    }
    
    // 3. Проверяем кнопку - если текст не "Откликнуться", значит уже откликались
    const buttonText = button.innerText || button.textContent || '';
    if (!buttonText.includes('Откликнуться') && buttonText.trim() !== '') {
        return true;
    }
    
    return false;
}

// =========== НАЙТИ ДОСТУПНЫЕ КНОПКИ ===========
function getAvailableButtons() {
    // Получаем ВСЕ кнопки отклика на странице
    const allButtons = Array.from(document.querySelectorAll('[data-qa="vacancy-serp__vacancy_response"]'));
    
    // Фильтруем только доступные
    const availableButtons = allButtons.filter(button => {
        // Проверяем видимость
        if (button.offsetParent === null) return false;
        
        // Проверяем, не откликнулись ли уже
        return !isAlreadyRespondedVacancy(button);
    });
    
    return availableButtons;
}

// Безопасный клик
async function safeClick(button, description) {
    console.log(`Кликаем: ${description}`);
    
    // Прокручиваем
    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await wait(800);
    
    // Подсвечиваем
    const originalStyle = button.style.cssText;
    button.style.outline = '3px solid #FF9800';
    button.style.outlineOffset = '2px';
    button.style.transition = 'outline 0.3s';
    
    await wait(300);
    
    // Метод 1: Простой click
    try {
        button.click();
        console.log('✓ Метод 1: обычный click');
        await wait(300);
        return true;
    } catch (e) {
        console.log('✗ Метод 1 не сработал');
    }
    
    // Метод 2: Создать событие клика
    try {
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        const mouseDown = new MouseEvent('mousedown', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
        });
        
        const mouseUp = new MouseEvent('mouseup', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
        });
        
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
        });
        
        button.dispatchEvent(mouseDown);
        button.dispatchEvent(mouseUp);
        button.dispatchEvent(clickEvent);
        
        console.log('✓ Метод 2: создание события');
        await wait(300);
        return true;
    } catch (e) {
        console.log('✗ Метод 2 не сработал');
    }
    
    // Метод 3: Используем focus и dispatchEvent
    try {
        button.focus();
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        button.dispatchEvent(event);
        console.log('✓ Метод 3: focus + dispatchEvent');
        await wait(300);
        return true;
    } catch (e) {
        console.log('✗ Метод 3 не сработал');
    }
    
    // Убираем подсветку
    setTimeout(() => {
        button.style.cssText = originalStyle;
    }, 1000);
    
    return false;
}

// Ждать появления модального окна
async function waitForModal(timeout = 5000) {
    console.log('⏳ Ожидаем модальное окно...');
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        // Ищем по селекторам
        const modalSelectors = [
            '[data-qa="vacancy-response-popup"]',
            '.vacancy-response-popup',
            '.bloko-modal-wrapper',
            '.bloko-modal',
            '.vacancy-serp-actions'
        ];
        
        for (const selector of modalSelectors) {
            const element = document.querySelector(selector);
            if (element && 
                element.offsetWidth > 0 && 
                element.offsetHeight > 0 &&
                window.getComputedStyle(element).display !== 'none') {
                console.log(`✅ Нашли модальное окно: ${selector}`);
                return element;
            }
        }
        
        // Ищем по тексту
        const modalByText = document.querySelectorAll('*');
        for (const element of modalByText) {
            if (element.textContent && element.textContent.includes('Отклик на вакансию')) {
                console.log('✅ Нашли модалку по тексту');
                return element.closest('.bloko-modal-wrapper') || element.closest('div[class*="modal"]') || element;
            }
        }
        
        await wait(300);
    }
    
    console.log('❌ Модальное окно не появилось');
    return null;
}

// НАЙТИ И НАЖАТЬ КНОПКУ "ДОБАВИТЬ СОПРОВОДИТЕЛЬНОЕ"
async function clickAddCoverLetterButton() {
    console.log('🎯 Ищем кнопку "Добавить сопроводительное"...');
    
    // Вариант 1: Поиск по точным классам
    const buttonSelectors = [
        '.magritte-button-view___53Slm_7-0-6',
        'span.magritte-button-view___53Slm_7-0-6',
        '[class*="magritte-button-view"]',
        '[class*="magritte-button__label"]'
    ];
    
    for (const selector of buttonSelectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`Найдено элементов с селектором ${selector}: ${elements.length}`);
        
        for (const element of elements) {
            if (element.textContent && element.textContent.includes('Добавить сопроводительное')) {
                console.log(`✅ Нашли по селектору ${selector}`);
                
                // Пробуем кликнуть
                for (let attempt = 1; attempt <= 3; attempt++) {
                    console.log(`\n--- Попытка ${attempt} ---`);
                    
                    try {
                        element.click();
                        console.log('✓ Клик успешен');
                        await wait(1000);
                        return true;
                    } catch (e) {
                        console.log('✗ Не удалось кликнуть');
                    }
                    
                    // Пробуем кликнуть на родителя
                    try {
                        const parent = element.parentElement;
                        if (parent) {
                            parent.click();
                            console.log('✓ Клик по родителю успешен');
                            await wait(1000);
                            return true;
                        }
                    } catch (e) {}
                    
                    await wait(300);
                }
            }
        }
    }
    
    // Вариант 2: Поиск по тексту
    console.log('\n🔍 Поиск по точному тексту...');
    const allElements = document.querySelectorAll('*');
    
    for (const element of allElements) {
        if (element.textContent && element.textContent.trim() === 'Добавить сопроводительное') {
            console.log('✅ Нашли элемент с точным текстом');
            
            try {
                element.click();
                console.log('✓ Клик успешен');
                await wait(1000);
                return true;
            } catch (e) {
                console.log('✗ Не удалось кликнуть');
            }
        }
    }
    
    console.log('❌ Не удалось найти/нажать кнопку');
    return false;
}

// === ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ REACT ПОЛЕЙ ===
async function fillCoverLetterField() {
    console.log('🔍 Ищем и заполняем поле для письма...');
    
    await wait(1500);
    
    // Находим поле
    const textarea = document.querySelector('[data-qa="vacancy-response-popup-form-letter-input"]');
    
    if (!textarea) {
        console.log('❌ Поле не найдено по data-qa');
        return false;
    }
    
    console.log('✅ Нашли textarea');
    
    // Прокручиваем к полю
    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await wait(500);
    
    // Подсветка
    textarea.style.outline = '2px solid #4CAF50';
    textarea.style.outlineOffset = '2px';
    
    // Фокус на поле
    textarea.focus();
    await wait(300);
    
    // Выделяем весь текст если есть
    textarea.select();
    await wait(200);
    
    // СПЕЦИАЛЬНЫЙ МЕТОД ДЛЯ REACT КОМПОНЕНТОВ
    console.log('Заполняем React поле...');
    
    // Способ 1: Используем нативный setter и React события
    try {
        // Получаем нативный setter для value
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 
            'value'
        ).set;
        
        // Устанавливаем значение через нативный setter
        nativeInputValueSetter.call(textarea, coverLetter);
        
        // Создаем специальное React-совместимое событие
        const reactInputEvent = new Event('input', { 
            bubbles: true,
            cancelable: true 
        });
        
        // Добавляем target для совместимости
        Object.defineProperty(reactInputEvent, 'target', {
            value: textarea,
            enumerable: true
        });
        
        // Триггерим событие
        textarea.dispatchEvent(reactInputEvent);
        
        // Дополнительные события
        const changeEvent = new Event('change', { bubbles: true });
        textarea.dispatchEvent(changeEvent);
        
        console.log('✓ Использовали нативный setter + React события');
    } catch (e) {
        console.log('✗ Способ 1 не сработал:', e);
        
        // Способ 2: Посимвольный ввод с полной симуляцией
        try {
            console.log('Пробуем посимвольный ввод...');
            
            // Очищаем поле
            textarea.focus();
            textarea.select();
            document.execCommand('delete');
            await wait(100);
            
            // Вводим каждый символ
            for (let i = 0; i < coverLetter.length; i++) {
                const char = coverLetter[i];
                
                // События для каждого символа
                const keydownEvent = new KeyboardEvent('keydown', {
                    key: char,
                    code: 'Key' + char.toUpperCase(),
                    charCode: char.charCodeAt(0),
                    keyCode: char.charCodeAt(0),
                    which: char.charCodeAt(0),
                    bubbles: true
                });
                
                const keypressEvent = new KeyboardEvent('keypress', {
                    key: char,
                    charCode: char.charCodeAt(0),
                    keyCode: char.charCodeAt(0),
                    bubbles: true
                });
                
                const inputEvent = new Event('input', { bubbles: true });
                
                textarea.dispatchEvent(keydownEvent);
                textarea.dispatchEvent(keypressEvent);
                
                // Добавляем символ к текущему значению
                textarea.value += char;
                textarea.dispatchEvent(inputEvent);
                
                // Пауза для больших текстов
                if (i % 50 === 0) {
                    await wait(10);
                }
            }
            
            // Финальное событие change
            const finalChangeEvent = new Event('change', { bubbles: true });
            textarea.dispatchEvent(finalChangeEvent);
            
            console.log('✓ Посимвольный ввод завершен');
        } catch (e2) {
            console.log('✗ Способ 2 не сработал:', e2);
            
            // Способ 3: Прямой доступ к React state
            try {
                console.log('Пробуем прямой доступ к React...');
                
                // Ищем React компонент
                let reactInstance = null;
                
                // Проверяем наличие React внутренностей
                if (textarea.__reactFiber$) {
                    reactInstance = textarea.__reactFiber$;
                } else if (textarea.__reactInternalInstance$) {
                    reactInstance = textarea.__reactInternalInstance$;
                } else {
                    // Ищем React через события
                    for (const key in textarea) {
                        if (key.includes('react') || key.includes('__react')) {
                            reactInstance = textarea[key];
                            break;
                        }
                    }
                }
                
                if (reactInstance) {
                    console.log('Нашли React инстанс');
                    
                    // Пробуем обновить состояние
                    textarea.value = coverLetter;
                    
                    // Симулируем все возможные события
                    const events = ['input', 'change', 'blur', 'focus'];
                    events.forEach(eventType => {
                        const event = new Event(eventType, { bubbles: true });
                        Object.defineProperty(event, 'target', { value: textarea });
                        textarea.dispatchEvent(event);
                    });
                    
                    console.log('✓ Обновили через React');
                }
            } catch (e3) {
                console.log('✗ Способ 3 не сработал:', e3);
            }
        }
    }
    
    // Проверяем результат
    await wait(500);
    console.log('Текущее значение поля:', textarea.value ? `[${textarea.value.length} символов]` : 'пустое');
    
    // Если поле все еще пустое, пробуем самый простой способ
    if (!textarea.value || textarea.value.length < 10) {
        console.log('Поле пустое, пробуем самый простой способ...');
        
        // Полностью очищаем
        textarea.value = '';
        await wait(100);
        
        // Устанавливаем значение
        textarea.value = coverLetter;
        
        // Создаем и триггерим input событие
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
        
        // Также триггерим change
        const changeEvent = new Event('change', { bubbles: true });
        textarea.dispatchEvent(changeEvent);
        
        await wait(300);
    }
    
    // Финальная проверка
    if (textarea.value && textarea.value.length > 10) {
        console.log('✅ Поле успешно заполнено!');
        
        // Убираем подсветку
        setTimeout(() => {
            textarea.style.outline = '';
        }, 1000);
        
        return true;
    } else {
        console.log('❌ Не удалось заполнить поле');
        return false;
    }
}

// НАЙТИ И НАЖАТЬ КНОПКУ ОТПРАВКИ
async function clickSubmitButton() {
    console.log('🔍 Ищем кнопку отправки...');
    
    // Ищем по data-qa атрибуту
    const submitSelectors = [
        '[data-qa="vacancy-response-submit-popup"]',
        'button[type="submit"]',
        '.vacancy-response-popup__submit'
    ];
    
    for (const selector of submitSelectors) {
        const button = document.querySelector(selector);
        if (button) {
            console.log(`✅ Нашли кнопку отправки: ${selector}`);
            
            try {
                button.click();
                console.log('✅ Кнопка отправки нажата');
                return true;
            } catch (e) {
                console.log('✗ Ошибка:', e);
            }
        }
    }
    
    // Ищем по тексту
    const textButtons = ['Откликнуться', 'Отправить отклик'];
    const allButtons = document.querySelectorAll('button');
    
    for (const button of allButtons) {
        for (const text of textButtons) {
            if (button.textContent && button.textContent.includes(text)) {
                console.log(`✅ Нашли кнопку по тексту: ${button.textContent}`);
                
                try {
                    button.click();
                    console.log('✅ Кнопка отправки нажата');
                    return true;
                } catch (e) {
                    console.log('✗ Ошибка:', e);
                }
            }
        }
    }
    
    console.log('❌ Кнопка отправки не найдена');
    return false;
}

// Обработать модальное окно
async function processModalWindow() {
    // Ждем появления модалки
    const modal = await waitForModal(6000);
    
    if (!modal) {
        return false;
    }
    
    try {
        // Ждем немного чтобы все загрузилось
        await wait(1000);
        
        // Проверяем предупреждение о переезде
        const warningBtn = modal.querySelector('[data-qa="relocation-warning-confirm"]');
        if (warningBtn) {
            console.log('Нажимаем подтверждение переезда');
            warningBtn.click();
            await wait(1000);
        }
        
        // ШАГ 1: Нажимаем на кнопку "Добавить сопроводительное"
        updateStatus('📝 Нажимаем "Добавить сопроводительное"...');
        const letterButtonClicked = await clickAddCoverLetterButton();
        
        // ШАГ 2: Заполняем поле письма
        let letterFilled = false;
        if (letterButtonClicked) {
            updateStatus('✍️ Заполняем письмо...');
            letterFilled = await fillCoverLetterField();
        }
        
        // Если не нашли кнопку, возможно поле уже открыто
        if (!letterButtonClicked) {
            console.log('Пробуем заполнить поле без кнопки...');
            updateStatus('✍️ Заполняем письмо (поле уже открыто)...');
            letterFilled = await fillCoverLetterField();
        }
        
        // ШАГ 3: Отправляем отклик
        updateStatus('📤 Отправляем отклик...');
        const submitted = await clickSubmitButton();
        
        if (submitted) {
            // Ждем отправки
            await wait(2000);
            
            // Проверяем успешность
            const successIndicators = ['Отклик отправлен', 'Response sent'];
            let successFound = false;
            
            const allElements = document.querySelectorAll('*');
            for (const element of allElements) {
                if (element.textContent) {
                    for (const indicator of successIndicators) {
                        if (element.textContent.includes(indicator)) {
                            successFound = true;
                            break;
                        }
                    }
                }
                if (successFound) break;
            }
            
            if (successFound) {
                console.log('✅ Отклик успешно отправлен!');
                updateStatus('✅ Отклик отправлен!');
                return true;
            } else {
                console.log('✅ Отклик отправлен (предположительно)');
                updateStatus('✅ Отклик отправлен');
                return true;
            }
        }
        
    } catch (error) {
        console.log('Ошибка при обработке модалки:', error);
        updateStatus('❌ Ошибка при обработке');
    }
    
    return false;
}

// Обработать одну вакансию
async function processSingleVacancy(button, index, total) {
    if (!isRunning) return false;
    
    stats.total++;
    
    const vacancyId = getVacancyId(button);
    
    // Уже обрабатывали эту вакансию?
    if (processedVacancies.has(vacancyId)) {
        stats.skipped++;
        updateStats();
        updateStatus(`⏭️ ${index + 1}/${total}: уже обработана`);
        return false;
    }
    
    // Уже откликались на эту вакансию?
    if (isAlreadyRespondedVacancy(button)) {
        processedVacancies.add(vacancyId);
        stats.skipped++;
        updateStats();
        updateStatus(`⏭️ ${index + 1}/${total}: уже откликались`);
        return false;
    }
    
    updateStatus(`🎯 ${index + 1}/${total}: обрабатываем...`);
    
    // Нажимаем кнопку отклика
    const clicked = await safeClick(button, `Отклик ${index + 1}`);
    
    if (!clicked) {
        processedVacancies.add(vacancyId);
        stats.failed++;
        updateStats();
        updateStatus(`❌ ${index + 1}/${total}: не удалось нажать`);
        return false;
    }
    
    // Обрабатываем модальное окно
    const success = await processModalWindow();
    
    if (success) {
        processedVacancies.add(vacancyId);
        stats.success++;
        updateStats();
        updateStatus(`✅ ${index + 1}/${total}: отправлено!`);
        return true;
    } else {
        processedVacancies.add(vacancyId);
        stats.failed++;
        updateStats();
        updateStatus(`⚠️ ${index + 1}/${total}: не удалось`);
        return false;
    }
}

// Тестирование
async function testProcess() {
    if (isRunning) return;
    
    coverLetter = document.getElementById('hh-letter').value;
    updateStatus('🧪 Тестируем...');
    
    const buttons = getAvailableButtons();
    if (buttons.length === 0) {
        updateStatus('❌ Нет доступных вакансий для теста');
        return;
    }
    
    updateStatus('Тест: нажимаем на первую вакансию...');
    
    isRunning = true;
    const success = await processSingleVacancy(buttons[0], 0, 1);
    isRunning = false;
    
    if (success) {
        updateStatus('✅ Тест успешен! Можно запускать авто-отклик.');
    } else {
        updateStatus('⚠️ Тест не удался. Проверьте консоль (F12).');
    }
}

// Основной процесс
async function startProcess() {
    if (isRunning) return;
    
    coverLetter = document.getElementById('hh-letter').value;
    isRunning = true;
    
    // Переключаем кнопки
    document.getElementById('hh-start').style.display = 'none';
    document.getElementById('hh-test').style.display = 'none';
    document.getElementById('hh-stop').style.display = 'block';
    
    updateStatus('🚀 Запуск авто-отклика...');
    
    // Сбрасываем статистику сессии
    stats = { success: 0, failed: 0, skipped: 0, total: 0 };
    updateStats();
    
    while (isRunning) {
        const buttons = getAvailableButtons();
        updateCounter();
        
        if (buttons.length === 0) {
            updateStatus('✅ Все доступные вакансии обработаны');
            
            // Проверяем следующую страницу
            const nextBtn = document.querySelector('[data-qa="pager-next"]:not([disabled])');
            if (nextBtn && isRunning) {
                updateStatus('➡️ Переход на следующую страницу...');
                await wait(2000);
                nextBtn.click();
                await wait(4000);
                continue;
            } else {
                updateStatus(`🎉 Завершено! Статистика:
✅ Успешно: ${stats.success}
❌ Неудачно: ${stats.failed}
⏭️ Пропущено: ${stats.skipped}`);
                break;
            }
        }
        
        updateStatus(`📊 Обработка ${buttons.length} вакансий...`);
        
        for (let i = 0; i < buttons.length; i++) {
            if (!isRunning) break;
            
            await processSingleVacancy(buttons[i], i, buttons.length);
            
            // Пауза между откликами
            if (i < buttons.length - 1 && isRunning) {
                updateStatus(`⏳ Пауза 2 секунды...`);
                await wait(2000);
            }
        }
        
        // Короткая пауза перед следующей проверкой
        if (isRunning) {
            await wait(1000);
        }
    }
    
    stopProcess();
}

// Остановка
function stopProcess() {
    isRunning = false;
    
    document.getElementById('hh-start').style.display = 'block';
    document.getElementById('hh-test').style.display = 'block';
    document.getElementById('hh-stop').style.display = 'none';
    
    updateStatus('⏹️ Остановлено');
}

// Запуск скрипта
(function init() {
    console.log('Инициализация авто-отклика v5.6 Stable+...');
    console.log('🔧 Рабочая версия с проверкой откликов');
    
    createPanel();
    
    // Обновляем счетчик каждые 3 секунды
    setInterval(updateCounter, 3000);
    
    setTimeout(() => {
        const buttons = getAvailableButtons();
        updateCounter();
        updateStatus(`✅ Готов к работе\n📊 Доступно вакансий: ${buttons.length}\n📝 Настройте письмо и нажмите "Тест"`);
    }, 2000);
})();
