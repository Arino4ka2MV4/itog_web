// Основной класс приложения
class App {
    constructor() {
        this.currentPage = 'home-page';
        this.isInitialized = false;
        this.init();
    }
    // метод который вызывается в самом начале 
    async init() {
        try {
            // Инициализация помощников
            MobileHelper.setupTouchEvents();
            
            // Настройка навигации
            this.setupNavigation();
            
            // Настройка фильтров тестов
            this.setupQuizFilters();
            
            // Загрузка тестов
            await quizManager.loadQuizzes();
            
            // Восстановление состояния
            this.restoreAppState();
            
            // Настройка обработчиков событий
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('EduTest приложение инициализировано');
            
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            this.showFatalError();
        }
    }

    // метод обработки кликов по навигации
    setupNavigation() {
        // Обработка кликов по навигационным ссылкам
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = link.dataset.page;
                if (targetPage) {
                    this.showPage(targetPage);
                    
                    // Закрываем мобильное меню если открыто
                    this.closeMobileMenu();
                }
            });
        });

        // Обработка кнопки мобильного меню
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Закрытие мобильного меню при клике вне его
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-container')) {
                this.closeMobileMenu();
            }
        });
    }

    // метод фильтрации квизов
    setupQuizFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const difficultyFilter = document.getElementById('difficulty-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                quizManager.renderQuizzes();
            });
        }
        
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', () => {
                quizManager.renderQuizzes();
            });
        }
        
        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                quizManager.renderQuizzes();
            });
        }
    }

    // обработчики событий 
    setupEventListeners() {
        // Обработка изменения размера окна
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Обработка клавиатуры
        document.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // Предотвращение закрытия страницы во время теста
        window.addEventListener('beforeunload', (e) => {
            if (quizManager.quizState === 'running') {
                e.preventDefault();
                e.returnValue = 'Вы проходите тест. Все несохраненные данные будут потеряны.';
            }
        });

        // Восстановление скролла при возврате на страницу
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                window.scrollTo(0, 0);
            }
        });
    }

    // показывает конкретную страницу по ее ид 
    showPage(pageId) {
        // Скрыть все страницы
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Показать целевую страницу
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
            
            // Сохраняем текущую страницу
            Utils.saveToLocalStorage('currentPage', pageId);
            
            // Прокрутка к верху страницы
            window.scrollTo(0, 0);
            
            // Обновление навигации
            this.updateNavigation();
            
            // Специальные действия для разных страниц
            this.handlePageChange(pageId);
        }
    }

    // смена страниц
    handlePageChange(pageId) {
        switch (pageId) {
            case 'results-page':
                quizManager.renderResultsHistory();
                break;
            case 'quizzes-page':
                // Можно добавить дополнительную логику
                break;
            case 'home-page':
                // Обновляем статистику на главной
                quizManager.updateHomeStats();
                break;
        }
    }

    // обновление навигации
    updateNavigation() {
        const currentPage = this.currentPage.replace('-page', '');
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === this.currentPage) {
                link.classList.add('active');
            }
        });
    }

    // метод вкл мобильного менб (бургер)
    toggleMobileMenu() {
        const navLinks = document.getElementById('nav-links');
        const menuBtn = document.getElementById('mobile-menu-btn');
        
        if (navLinks && menuBtn) {
            navLinks.classList.toggle('active');
            menuBtn.classList.toggle('active');
            
            // Блокировка скролла тела при открытом меню
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        }
    }

    // метод выкл мобильного менб (бургер)
    closeMobileMenu() {
        const navLinks = document.getElementById('nav-links');
        const menuBtn = document.getElementById('mobile-menu-btn');
        
        if (navLinks && menuBtn) {
            navLinks.classList.remove('active');
            menuBtn.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // обработчик изменения размеров окна 
    handleResize() {
        // Закрываем мобильное меню при увеличении экрана
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
        }
        
        // Обновляем отображение элементов при изменении размера
        if (this.currentPage === 'quiz-page' && quizManager.quizState === 'running') {
            quizManager.showCurrentQuestion();
        }
    }

    // обработчик нажатия клавиш 
    handleKeydown(e) {
        // Глобальные горячие клавиши
        switch (e.key) {
            case 'Escape':
                this.closeMobileMenu();
                break;
        }

        // Горячие клавиши для страницы теста
        if (this.currentPage === 'quiz-page' && quizManager.quizState === 'running') {
            this.handleQuizKeys(e);
        }
    }

    // обработка нажатия на кнопки в викторине 
    handleQuizKeys(e) {
        if (e.key >= '1' && e.key <= '4') {
            // Выбор ответа цифрами 1-4
            const answerIndex = parseInt(e.key) - 1;
            quizManager.selectAnswer(answerIndex);
            e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === ' ') {
            // Следующий вопрос
            if (quizManager.currentQuestionIndex < quizManager.currentQuiz.questions.length - 1) {
                quizManager.nextQuestion();
                e.preventDefault();
            }
        } else if (e.key === 'ArrowLeft') {
            // Предыдущий вопрос
            if (quizManager.currentQuestionIndex > 0) {
                quizManager.previousQuestion();
                e.preventDefault();
            }
        } else if (e.key === 'Enter') {
            // Завершение теста на последнем вопросе
            if (quizManager.currentQuestionIndex === quizManager.currentQuiz.questions.length - 1) {
                quizManager.submitQuiz();
                e.preventDefault();
            }
        }
    }

    // восстановление состояния приложения
    restoreAppState() {
        // Восстановление последней страницы
        const lastPage = Utils.getFromLocalStorage('currentPage') || 'home-page';
        this.showPage(lastPage);
        
        // Восстановление других состояний при необходимости
        const results = Utils.getFromLocalStorage('quizResults');
        if (results && results.length > 0) {
            console.log(`Загружено ${results.length} результатов тестов`);
        }
    }

    // метод отображения критической ошибки 
    showFatalError() {
        const errorHtml = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 2rem;
                text-align: center;
            ">
                <div style="font-size: 4rem; margin-bottom: 1rem;">😞</div>
                <h1 style="font-size: 2rem; margin-bottom: 1rem;">Произошла ошибка</h1>
                <p style="font-size: 1.2rem; margin-bottom: 2rem; max-width: 500px;">
                    Не удалось загрузить приложение. Пожалуйста, проверьте подключение к интернету и обновите страницу.
                </p>
                <button onclick="window.location.reload()" style="
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: bold;
                    cursor: pointer;
                ">
                    Обновить страницу
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorHtml;
    }
}

// Глобальные функции для доступа из HTML
function showPage(pageId) {
    if (window.app) {
        window.app.showPage(pageId);
    }
}

function toggleMobileMenu() {
    if (window.app) {
        window.app.toggleMobileMenu();
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Service Worker для оффлайн-работы (опционально)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}