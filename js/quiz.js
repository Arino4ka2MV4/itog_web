class QuizManager {
    constructor() {
        this.quizzes = [];
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.timer = null;
        this.startTime = null;
        this.quizState = 'idle'; // idle, running, paused, finished
    }

    async loadQuizzes() {
        try {
            // Имитация загрузки с задержкой для демонстрации
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const response = await fetch('data/quizzes.json');
            if (!response.ok) {
                throw new Error('Не удалось загрузить тесты');
            }
            
            const data = await response.json();
            this.quizzes = data.quizzes;
            this.renderQuizzes();
            this.updateHomeStats();
            this.updateQuizzesStats();
            
            return true;
        } catch (error) {
            console.error('Ошибка загрузки тестов:', error);
            this.showError('Не удалось загрузить тесты. Пожалуйста, проверьте подключение к интернету.');
            return false;
        }
    }

    renderQuizzes() {
        const container = document.getElementById('quizzes-container');
        if (!container) return;

        container.innerHTML = '';

        // Получаем текущие фильтры
        const categoryFilter = document.getElementById('category-filter')?.value || 'all';
        const difficultyFilter = document.getElementById('difficulty-filter')?.value || 'all';
        const sortFilter = document.getElementById('sort-filter')?.value || 'default';

        // Фильтрация тестов
        let filteredQuizzes = this.quizzes.filter(quiz => {
            const categoryMatch = categoryFilter === 'all' || quiz.category === categoryFilter;
            const difficultyMatch = difficultyFilter === 'all' || quiz.difficulty === difficultyFilter;
            return categoryMatch && difficultyMatch;
        });

        // Сортировка тестов
        switch (sortFilter) {
            case 'duration':
                filteredQuizzes.sort((a, b) => a.duration - b.duration);
                break;
            case 'questions':
                filteredQuizzes.sort((a, b) => a.questions.length - b.questions.length);
                break;
            case 'difficulty':
                const difficultyOrder = { 'Начальный': 1, 'Средний': 2, 'Продвинутый': 3 };
                filteredQuizzes.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
                break;
            default:
                // По умолчанию - в порядке ID
                filteredQuizzes.sort((a, b) => a.id - b.id);
        }

        // Показываем/скрываем сообщение о пустом результате
        const noResults = document.getElementById('no-quizzes');
        if (filteredQuizzes.length === 0) {
            if (noResults) noResults.style.display = 'block';
            return;
        } else {
            if (noResults) noResults.style.display = 'none';
        }

        // Рендерим отфильтрованные тесты
        filteredQuizzes.forEach((quiz, index) => {
            const quizCard = document.createElement('div');
            quizCard.className = 'quiz-card';
            quizCard.style.animationDelay = `${index * 0.1}s`;
            
            // Получаем прогресс пользователя для этого теста
            const userProgress = this.getUserProgress(quiz.id);
            const progressPercentage = userProgress ? (userProgress.score / userProgress.maxScore) * 100 : 0;
            
            // Определяем класс сложности для бейджа
            const difficultyClass = this.getDifficultyClass(quiz.difficulty);
            
            quizCard.innerHTML = `
                <div class="quiz-card-header">
                    <div class="quiz-card-badge ${difficultyClass}">
                        ${quiz.difficulty}
                    </div>
                    <h3 class="quiz-card-title">${quiz.title}</h3>
                    <div class="quiz-card-category">${quiz.category}</div>
                    <p class="quiz-card-description">${quiz.description}</p>
                    
                    <div class="quiz-card-features">
                        <div class="feature-tag">
                            <span>📊</span>
                            <span>${quiz.questions.length} вопросов</span>
                        </div>
                        <div class="feature-tag">
                            <span>⏱️</span>
                            <span>${Utils.formatTime(quiz.duration)}</span>
                        </div>
                        <div class="feature-tag highlight">
                            <span>⭐</span>
                            <span>Макс. ${quiz.questions.reduce((sum, q) => sum + q.points, 0)} баллов</span>
                        </div>
                    </div>
                </div>
                
                ${userProgress ? `
                <div class="quiz-card-progress">
                    <div class="progress-label">
                        <span>Ваш прогресс</span>
                        <span>${Math.round(progressPercentage)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                ` : ''}
                
                <div class="quiz-card-footer">
                    <div class="quiz-stats">
                        <div class="quiz-stat">
                            <span class="icon">❓</span>
                            <span>${quiz.questions.length} в.</span>
                        </div>
                        <div class="quiz-stat">
                            <span class="icon">⏱️</span>
                            <span>${Utils.formatTime(quiz.duration)}</span>
                        </div>
                        <div class="quiz-stat">
                            <span class="icon">🎯</span>
                            <span>${this.getDifficultyIcon(quiz.difficulty)}</span>
                        </div>
                    </div>
                    <button class="quiz-card-button start-quiz-btn" data-quiz-id="${quiz.id}">
                        <span>🚀</span>
                        ${userProgress ? 'Продолжить' : 'Начать тест'}
                    </button>
                </div>
            `;
            
            container.appendChild(quizCard);
        });

        // Добавляем обработчики событий для кнопок
        this.attachQuizButtonHandlers();
    }

    // Новые вспомогательные методы для QuizManager
    getUserProgress(quizId) {
        const results = Utils.getFromLocalStorage('quizResults') || [];
        return results.find(result => result.quizId === quizId);
    }

    getDifficultyClass(difficulty) {
        switch (difficulty) {
            case 'Начальный': return 'difficulty-beginner';
            case 'Средний': return 'difficulty-intermediate';
            case 'Продвинутый': return 'difficulty-advanced';
            default: return 'difficulty-beginner';
        }
    }

    getDifficultyIcon(difficulty) {
        switch (difficulty) {
            case 'Начальный': return 'Легко';
            case 'Средний': return 'Средне';
            case 'Продвинутый': return 'Сложно';
            default: return difficulty;
        }
    }

    attachQuizButtonHandlers() {
        document.querySelectorAll('.start-quiz-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quizId = parseInt(e.currentTarget.dataset.quizId);
                const quiz = this.quizzes.find(q => q.id === quizId);
                if (quiz) {
                    this.startQuiz(quiz);
                    
                    // Анимация нажатия кнопки
                    e.currentTarget.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        e.currentTarget.style.transform = '';
                    }, 150);
                }
            });
        });
    }

    // Обновляем статистику на главной странице тестов
    updateQuizzesStats() {
        const totalQuizzes = this.quizzes.length;
        const totalQuestions = this.quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
        
        const totalQuizzesElement = document.getElementById('total-quizzes');
        const totalQuestionsElement = document.getElementById('total-questions');
        
        if (totalQuizzesElement) totalQuizzesElement.textContent = totalQuizzes;
        if (totalQuestionsElement) totalQuestionsElement.textContent = totalQuestions;
    }

    startQuiz(quiz) {
        this.currentQuiz = quiz;
        this.currentQuestionIndex = 0;
        this.userAnswers = new Array(quiz.questions.length).fill(null);
        this.score = 0;
        this.startTime = Date.now();
        this.quizState = 'running';

        // Инициализация таймера
        this.timer = new Timer(
            quiz.duration,
            (time) => {
                const timerElement = document.getElementById('timer-text');
                if (timerElement) {
                    timerElement.textContent = Utils.formatTime(time);
                    
                    // Добавляем класс предупреждения при малом времени
                    if (time <= 60) {
                        timerElement.classList.add('timer-warning');
                    } else {
                        timerElement.classList.remove('timer-warning');
                    }
                }
            },
            () => {
                this.finishQuiz();
            }
        );

        this.timer.start();
        this.showCurrentQuestion();
        showPage('quiz-page');
        
        // Обновляем навигацию
        this.updateNavigation();
    }

    showCurrentQuestion() {
        if (!this.currentQuiz) return;

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        
        // Обновляем заголовок теста
        document.getElementById('quiz-title').textContent = this.currentQuiz.title;
        
        // Обновляем счетчик вопросов
        document.getElementById('question-counter').innerHTML = 
            `<span class="meta-icon">❓</span> Вопрос ${this.currentQuestionIndex + 1} из ${this.currentQuiz.questions.length}`;
        
        // Обновляем текст вопроса
        document.getElementById('question-text').textContent = question.text;
        
        // Обновляем баллы вопроса
        document.getElementById('question-points').textContent = `${question.points} балл${this.getPointsSuffix(question.points)}`;

        // Обновляем прогресс
        const progress = ((this.currentQuestionIndex) / this.currentQuiz.questions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-percent').textContent = `${Math.round(progress)}%`;
        
        // Обновляем навигационную информацию
        document.getElementById('nav-info').textContent = 
            `Вопрос ${this.currentQuestionIndex + 1} из ${this.currentQuiz.questions.length}`;

        // Отображение вариантов ответов
        this.renderOptions(question);
        
        // Управление кнопками
        this.updateControlButtons();
    }

    renderOptions(question) {
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            if (this.userAnswers[this.currentQuestionIndex] === index) {
                optionElement.classList.add('selected');
            }
            
            optionElement.innerHTML = `
                <div class="option-index">${String.fromCharCode(65 + index)}</div>
                <div class="option-text">${option}</div>
            `;
            
            optionElement.addEventListener('click', () => this.selectAnswer(index));
            optionsContainer.appendChild(optionElement);
        });
    }

    selectAnswer(answerIndex) {
        this.userAnswers[this.currentQuestionIndex] = answerIndex;
        
        // Сброс выделения у всех вариантов
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Выделение выбранного варианта
        document.querySelectorAll('.option')[answerIndex].classList.add('selected');
        
        // Автоматическое продвижение вперед на мобильных устройствах
        if (MobileHelper.isMobile() && this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            setTimeout(() => {
                this.nextQuestion();
            }, 500);
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.currentQuestionIndex++;
            this.showCurrentQuestion();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.showCurrentQuestion();
        }
    }

    updateControlButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');

        if (prevBtn) {
            prevBtn.style.display = this.currentQuestionIndex > 0 ? 'flex' : 'none';
        }

        if (nextBtn) {
            nextBtn.style.display = this.currentQuestionIndex < this.currentQuiz.questions.length - 1 ? 'flex' : 'none';
        }

        if (submitBtn) {
            submitBtn.style.display = this.currentQuestionIndex === this.currentQuiz.questions.length - 1 ? 'flex' : 'none';
        }
    }

    submitQuiz() {
        if (this.userAnswers.includes(null)) {
            const unanswered = this.userAnswers.filter(answer => answer === null).length;
            if (!confirm(`Вы не ответили на ${unanswered} вопрос(ов). Вы уверены, что хотите завершить тест?`)) {
                return;
            }
        }
        
        this.finishQuiz();
    }

    finishQuiz() {
        if (this.timer) {
            this.timer.stop();
        }

        this.quizState = 'finished';
        this.calculateScore();
        this.saveResults();
        this.showResults();
    }

    calculateScore() {
        this.score = 0;
        this.currentQuiz.questions.forEach((question, index) => {
            if (this.userAnswers[index] === question.correctAnswer) {
                this.score += question.points;
            }
        });
    }

    saveResults() {
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        const results = Utils.getFromLocalStorage('quizResults') || [];
        
        const result = {
            quizId: this.currentQuiz.id,
            quizTitle: this.currentQuiz.title,
            score: this.score,
            maxScore: this.currentQuiz.questions.reduce((sum, q) => sum + q.points, 0),
            totalQuestions: this.currentQuiz.questions.length,
            correctAnswers: this.userAnswers.filter((answer, index) => 
                answer === this.currentQuiz.questions[index].correctAnswer
            ).length,
            timeSpent: timeSpent,
            timestamp: new Date().toISOString(),
            userAnswers: [...this.userAnswers]
        };
        
        results.unshift(result); // Добавляем в начало массива
        Utils.saveToLocalStorage('quizResults', results);
    }

    showResults() {
        showPage('results-page');
        this.renderResultsHistory();
    }

    renderResultsHistory() {
        const resultsList = document.getElementById('results-list');
        const noResults = document.getElementById('no-results');
        const results = Utils.getFromLocalStorage('quizResults') || [];

        if (results.length === 0) {
            if (noResults) noResults.style.display = 'block';
            if (resultsList) resultsList.innerHTML = '';
            this.updateResultsStats(results);
            return;
        }

        if (noResults) noResults.style.display = 'none';
        if (resultsList) resultsList.innerHTML = '';

        results.forEach((result, index) => {
            const resultElement = document.createElement('div');
            resultElement.className = 'result-item';
            
            const percentage = Utils.calculatePercentage(result.score, result.maxScore);
            const date = Utils.formatDate(result.timestamp);
            
            resultElement.innerHTML = `
                <div class="result-header">
                    <div class="result-title">${result.quizTitle}</div>
                    <div class="result-score">${result.score}/${result.maxScore}</div>
                </div>
                <div class="result-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="progress-text">${percentage}%</span>
                </div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="detail-label">Правильные ответы:</span>
                        <span class="detail-value">${result.correctAnswers}/${result.totalQuestions}</span>
                    </div>
                    <div class="result-detail">
                        <span class="detail-label">Затраченное время:</span>
                        <span class="detail-value">${Utils.formatTime(result.timeSpent)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="detail-label">Дата прохождения:</span>
                        <span class="detail-value">${date}</span>
                    </div>
                </div>
            `;
            
            if (resultsList) resultsList.appendChild(resultElement);
        });

        this.updateResultsStats(results);
    }

    updateResultsStats(results) {
        if (results.length === 0) {
            document.getElementById('total-tests').textContent = '0';
            document.getElementById('average-score').textContent = '0';
            document.getElementById('best-score').textContent = '0';
            document.getElementById('total-answered').textContent = '0';
            return;
        }

        const totalTests = results.length;
        const totalScore = results.reduce((sum, result) => sum + result.score, 0);
        const averageScore = Math.round(totalScore / totalTests);
        const bestScore = Math.max(...results.map(result => result.score));
        const totalAnswered = results.reduce((sum, result) => sum + result.totalQuestions, 0);

        document.getElementById('total-tests').textContent = totalTests;
        document.getElementById('average-score').textContent = averageScore;
        document.getElementById('best-score').textContent = bestScore;
        document.getElementById('total-answered').textContent = totalAnswered;
    }

    updateHomeStats() {
        const totalTests = this.quizzes.length;
        const totalQuestions = this.quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
        
        // Анимируем числа
        const testsElement = document.getElementById('stat-tests');
        const questionsElement = document.getElementById('stat-questions');
        
        if (testsElement) {
            Utils.animateValue(testsElement, 0, totalTests, 1000);
        }
        if (questionsElement) {
            Utils.animateValue(questionsElement, 0, totalQuestions, 1000);
        }
    }

    updateNavigation() {
        // Обновляем активную страницу в навигации
        const currentPage = document.querySelector('.page.active').id.replace('-page', '');
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === `${currentPage}-page`) {
                link.classList.add('active');
            }
        });
    }

    getPointsSuffix(points) {
        if (points === 1) return '';
        if (points >= 2 && points <= 4) return 'а';
        return 'ов';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span>${message}</span>
            </div>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #F8D7DA;
            border: 1px solid #F5C6CB;
            color: #721C24;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Глобальный экземпляр менеджера тестов
const quizManager = new QuizManager();

// Глобальные функции для управления тестом
function nextQuestion() {
    quizManager.nextQuestion();
}

function previousQuestion() {
    quizManager.previousQuestion();
}

function submitQuiz() {
    quizManager.submitQuiz();
}

function restartQuiz() {
    if (quizManager.currentQuiz) {
        quizManager.startQuiz(quizManager.currentQuiz);
    }
}

// Функции для работы с фильтрами
function resetFilters() {
    document.getElementById('category-filter').value = 'all';
    document.getElementById('difficulty-filter').value = 'all';
    document.getElementById('sort-filter').value = 'default';
    quizManager.renderQuizzes();
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}