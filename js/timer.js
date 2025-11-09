class Timer {
    constructor(duration, onTick, onComplete) {
        this.duration = duration;
        this.remainingTime = duration;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.isRunning = false;
        this.intervalId = null;
        this.startTime = null;
        this.pausedTime = null;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = Date.now();
        
        this.intervalId = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.remainingTime = Math.max(0, this.duration - elapsed);
            
            this.onTick(this.remainingTime);
            
            if (this.remainingTime <= 0) {
                this.stop();
                this.onComplete();
            }

            // Добавляем предупреждение при малом оставшемся времени
            if (this.remainingTime === 60) {
                this.showWarning('Осталась 1 минута!');
            } else if (this.remainingTime === 30) {
                this.showWarning('Осталось 30 секунд!');
            } else if (this.remainingTime === 10) {
                this.showWarning('Осталось 10 секунд!');
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;
        
        this.stop();
        this.pausedTime = this.remainingTime;
    }

    resume() {
        if (this.isRunning || this.pausedTime === null) return;
        
        this.duration = this.pausedTime;
        this.start();
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    reset() {
        this.stop();
        this.remainingTime = this.duration;
        this.pausedTime = null;
        this.onTick(this.remainingTime);
    }

    getFormattedTime() {
        return Utils.formatTime(this.remainingTime);
    }

    showWarning(message) {
        // Создаем уведомление
        const warning = document.createElement('div');
        warning.className = 'timer-warning-notification';
        warning.innerHTML = `
            <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <span>${message}</span>
            </div>
        `;
        
        warning.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #FFF3CD;
            border: 1px solid #FFEAA7;
            color: #856404;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(warning);

        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            if (warning.parentNode) {
                warning.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (warning.parentNode) {
                        warning.parentNode.removeChild(warning);
                    }
                }, 300);
            }
        }, 3000);
    }
}

// Добавляем CSS для анимаций уведомлений
const timerStyles = document.createElement('style');
timerStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .timer-warning {
        color: #dc3545;
        font-weight: bold;
        animation: pulse 1s infinite;
    }
    
    .warning-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .warning-icon {
        font-size: 1.2rem;
    }
`;
document.head.appendChild(timerStyles);