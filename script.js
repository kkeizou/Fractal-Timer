// ページの要素を取得
const phaseInput = document.getElementById('phase-input');
const nextTimerDurationDisplay = document.getElementById('next-timer-duration');
const taskInput = document.getElementById('task-input');
const countdown15s = document.getElementById('countdown-15s');

const phaseTimer = document.getElementById('phase-timer');
const currentTaskDisplay = document.getElementById('current-task-display');
const timerDisplay = document.getElementById('timer-display');

const phaseCheck = document.getElementById('phase-check');
const taskCheckDisplay = document.getElementById('task-check-display');
const taskCompleteCheckbox = document.getElementById('task-complete-checkbox');
const countdown10s = document.getElementById('countdown-10s');

const phaseLog = document.getElementById('phase-log');
const gemCanvas = document.getElementById('gem-canvas');
const incompleteTasksList = document.getElementById('incomplete-tasks-list');
const restartButton = document.getElementById('restart-button');

// 概要文ローテーション用
const appSummaryElements = document.querySelectorAll('.app-summary');
let currentSummaryIndex = 0;
let summaryIntervalId;

// 砂時計アニメーション用キャンバス
const sandCanvas = document.getElementById('sand-canvas');
const sandCtx = sandCanvas.getContext('2d');
let sandAnimationId;
let sandTime = 0; // 砂のアニメーション用の時間
let targetSandHeight = 0; // 目標とする砂の高さ
let currentSandHeight = 0; // 現在の砂の高さ

// タイマーの候補時間（秒）
const presetTimes = [45, 60, 180];
function getRandomTime(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let mainTimer;
let remainingTime;
let currentTask = '';
let currentTimerDuration;

let tasksLog = JSON.parse(localStorage.getItem('tasksLog')) || [];

let gems = [];
let gemAnimationId;

// ----------------------------------------
// 概要文のローテーション関数
// ----------------------------------------
function rotateSummary() {
    appSummaryElements.forEach(el => el.classList.remove('active'));
    currentSummaryIndex = (currentSummaryIndex + 1) % appSummaryElements.length;
    appSummaryElements[currentSummaryIndex].classList.add('active');
}

// ----------------------------------------
// フェーズ切り替え関数
// ----------------------------------------
function showPhase(phase) {
    [phaseInput, phaseTimer, phaseCheck, phaseLog].forEach(el => el.classList.remove('active'));
    phase.classList.add('active');
}

// ----------------------------------------
// タイマー表示更新関数
// ----------------------------------------
function updateTimerDisplay(displayElement, totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    displayElement.textContent = `${formattedMinutes}:${formattedSeconds}`;
}

// ----------------------------------------
// 砂のアニメーション描画関数
// ----------------------------------------
function drawSandAnimation() {
    const width = sandCanvas.width;
    const height = sandCanvas.height;
    
    currentSandHeight += (targetSandHeight - currentSandHeight) * 0.05;

    sandCtx.clearRect(0, 0, width, height);

    // 砂の境界線を波打たせるための計算
    const waveHeight = Math.sin(sandTime * 0.05) * 10;
    
    sandCtx.beginPath();
    sandCtx.moveTo(0, height - currentSandHeight);
    sandCtx.bezierCurveTo(
        width / 3, height - currentSandHeight - waveHeight,
        width / 3 * 2, height - currentSandHeight + waveHeight,
        width, height - currentSandHeight
    );
    sandCtx.lineTo(width, height);
    sandCtx.lineTo(0, height);
    sandCtx.closePath();
    
    const gradient = sandCtx.createLinearGradient(0, height - currentSandHeight, 0, height);
    gradient.addColorStop(0, '#e9d2a6');
    gradient.addColorStop(1, '#d2b48c');

    sandCtx.fillStyle = gradient;
    sandCtx.fill();
    
    sandTime++;
    sandAnimationId = requestAnimationFrame(drawSandAnimation);
}


// ----------------------------------------
// フェーズ1: タスク入力と15秒の猶予時間
// ----------------------------------------
function startTaskInputPhase() {
    showPhase(phaseInput);
    taskInput.value = '';
    
    // 概要文のローテーションを開始
    if (summaryIntervalId) clearInterval(summaryIntervalId);
    summaryIntervalId = setInterval(rotateSummary, 5000);

    const allPossibleTimes = [...presetTimes, getRandomTime(5 * 60, 30 * 60)];
    const randomIndex = Math.floor(Math.random() * allPossibleTimes.length);
    currentTimerDuration = allPossibleTimes[randomIndex];

    updateTimerDisplay(nextTimerDurationDisplay, currentTimerDuration);

    let countdown = 15;
    countdown15s.textContent = countdown;
    
    sandCanvas.width = window.innerWidth;
    sandCanvas.height = window.innerHeight;
    
    // 砂アニメーション開始
    targetSandHeight = 0;
    currentSandHeight = 0;
    sandAnimationId = requestAnimationFrame(drawSandAnimation);
    
    mainTimer = setInterval(() => {
        countdown--;
        countdown15s.textContent = countdown;
        
        targetSandHeight = sandCanvas.height * ((15 - countdown) / 15);
        
        if (countdown <= 0) {
            clearInterval(mainTimer);
            startMainTimerPhase();
        }
    }, 1000);
}

// ----------------------------------------
// フェーズ2: メインタイマー
// ----------------------------------------
function startMainTimerPhase() {
    showPhase(phaseTimer);
    
    // 概要文のローテーションを停止
    clearInterval(summaryIntervalId);

    currentTask = taskInput.value || 'タスク未記入';
    currentTaskDisplay.textContent = currentTask;
    
    remainingTime = currentTimerDuration;
    updateTimerDisplay(timerDisplay, remainingTime);

    // 砂を満杯の状態から空にしていく
    targetSandHeight = sandCanvas.height;

    mainTimer = setInterval(() => {
        remainingTime--;
        updateTimerDisplay(timerDisplay, remainingTime);

        targetSandHeight = sandCanvas.height * (remainingTime / currentTimerDuration);
        
        if (remainingTime <= 0) {
            clearInterval(mainTimer);
            startCheckPhase();
        }
    }, 1000);
}

// ----------------------------------------
// フェーズ3: タスク完了チェックと10秒の猶予時間
// ----------------------------------------
function startCheckPhase() {
    showPhase(phaseCheck);
    
    taskCheckDisplay.textContent = `今回のタスク: ${currentTask}`;
    taskCompleteCheckbox.checked = false;
    
    let countdown = 10;
    countdown10s.textContent = countdown;
    
    // 砂アニメーションを非表示
    targetSandHeight = 0;
    
    mainTimer = setInterval(() => {
        countdown--;
        countdown10s.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(mainTimer);
            saveTaskToLog();
            startLogPhase();
        }
    }, 1000);
}

// ----------------------------------------
// タスクをログに保存する関数
// ----------------------------------------
function saveTaskToLog() {
    const isCompleted = taskCompleteCheckbox.checked;
    
    const taskEntry = {
        task: currentTask,
        duration: currentTimerDuration,
        completed: isCompleted,
        timestamp: new Date().toLocaleString()
    };
    
    tasksLog.push(taskEntry);
    localStorage.setItem('tasksLog', JSON.stringify(tasksLog));
}

// ----------------------------------------
// フェーズ4: ログ表示
// ----------------------------------------
function startLogPhase() {
    showPhase(phaseLog);
    renderTasksLog();
}

// ----------------------------------------
// ログ表示を更新する関数
// ----------------------------------------
function renderTasksLog() {
    incompleteTasksList.innerHTML = '';
    
    const completedTasks = tasksLog.filter(task => task.completed);
    const incompleteTasks = tasksLog.filter(task => !task.completed);

    if (completedTasks.length > 0) {
        gems = createGems(completedTasks);
        animateGems();
    } else {
        const ctx = gemCanvas.getContext('2d');
        ctx.clearRect(0, 0, gemCanvas.width, gemCanvas.height);
        cancelAnimationFrame(gemAnimationId);
    }

    incompleteTasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.task;
        
        const timestampSmall = document.createElement('small');
        timestampSmall.textContent = ` (${task.timestamp})`;
        li.appendChild(timestampSmall);
        
        const timeDurationSmall = document.createElement('small');
        timeDurationSmall.textContent = ` [${Math.floor(task.duration / 60)}分]`;
        li.appendChild(timeDurationSmall);

        li.classList.add('incomplete');
        incompleteTasksList.appendChild(li);
    });
}

// ----------------------------------------
// 宝石の破片を生成する関数
// ----------------------------------------
function createGems(tasks) {
    const newGems = [];
    const width = gemCanvas.offsetWidth;
    const height = gemCanvas.offsetHeight;
    
    const durations = tasks.map(t => t.duration);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    tasks.forEach(task => {
        const sizeFactor = maxDuration === minDuration ? 1 : (task.duration - minDuration) / (maxDuration - minDuration);
        const radius = 30 + sizeFactor * 40;

        const gem = {
            task: task.task,
            timestamp: task.timestamp,
            points: [],
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            rotation: Math.random() * 2 * Math.PI,
            vr: (Math.random() - 0.5) * 0.005,
            color: `hsl(${Math.random() * 360}, 70%, 80%)`,
            radius: radius
        };
        
        const sides = Math.floor(Math.random() * 4) + 3;
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * 2 * Math.PI;
            gem.points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        newGems.push(gem);
    });
    return newGems;
}

// ----------------------------------------
// 宝石のアニメーション関数
// ----------------------------------------
function animateGems() {
    const ctx = gemCanvas.getContext('2d');
    const width = gemCanvas.offsetWidth;
    const height = gemCanvas.offsetHeight;
    
    gemCanvas.width = width;
    gemCanvas.height = height;

    ctx.clearRect(0, 0, width, height);

    gems.forEach(gem => {
        gem.x += gem.vx;
        gem.y += gem.vy;
        gem.rotation += gem.vr;

        if (gem.x < gem.radius || gem.x > width - gem.radius) gem.vx *= -1;
        if (gem.y < gem.radius || gem.y > height - gem.radius) gem.vy *= -1;
        
        ctx.save();
        ctx.translate(gem.x, gem.y);
        ctx.rotate(gem.rotation);
        
        ctx.beginPath();
        ctx.moveTo(gem.points[0].x, gem.points[0].y);
        for (let i = 1; i < gem.points.length; i++) {
            ctx.lineTo(gem.points[i].x, gem.points[i].y);
        }
        ctx.closePath();
        
        ctx.fillStyle = gem.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.rotate(-gem.rotation);
        
        const taskText = gem.task;
        const words = taskText.split(' ');
        let line = '';
        let lines = [];
        
        ctx.font = '12px sans-serif';
        const maxWidth = gem.radius * 1.5;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > maxWidth) {
                 lines.push(line);
                 line = words[n] + ' ';
            } else {
                 line = testLine;
            }
        }
        lines.push(line);
        
        const lineHeight = 14;
        const startY = -(lineHeight * lines.length / 2) + lineHeight / 2;
        
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let n = 0; n < lines.length; n++) {
             ctx.fillText(lines[n], 0, startY + n * lineHeight);
        }

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(gem.timestamp, 0, startY + lines.length * lineHeight);

        ctx.restore();
    });
    
    gemAnimationId = requestAnimationFrame(animateGems);
}

// ----------------------------------------
// ボタンイベントリスナー
// ----------------------------------------
restartButton.addEventListener('click', () => {
    clearInterval(mainTimer);
    cancelAnimationFrame(gemAnimationId);
    cancelAnimationFrame(sandAnimationId);
    startTaskInputPhase();
});

// アプリケーション開始
window.addEventListener('load', () => {
    sandCanvas.width = window.innerWidth;
    sandCanvas.height = window.innerHeight;
    startTaskInputPhase();
});

// ウィンドウのリサイズ時にキャンバスを再描画
window.addEventListener('resize', () => {
    sandCanvas.width = window.innerWidth;
    sandCanvas.height = window.innerHeight;
    if (document.getElementById('phase-log').classList.contains('active')) {
        renderTasksLog();
    }
});