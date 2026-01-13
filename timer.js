let timerSec = 0;
let timerInterval = null;

/*
  タイマー開始
*/
function startTimer() {

    // すでに動いていたら何もしない
    if (timerInterval !== null) return;

    timerInterval = setInterval(() => {
        timerSec++;

        let min = String(Math.floor(timerSec / 60)).padStart(2,"0");
        let sec = String(timerSec % 60).padStart(2,"0");

        document.getElementById("timer").textContent = `${min}:${sec}`;

        // 1分経過
        if (timerSec === 60) {
            document.getElementById("slowMsg").textContent = "少し遅いです";
        }

        // 2分経過
        if (timerSec === 120) {
            document.getElementById("slowMsg").textContent = "遅いです";
        }

    }, 1000);
}

/*
  タイマーを完全にリセットして再スタート
  ※ 次へボタン専用
*/
function resetAndRestartTimer() {

    // 停止
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // 値リセット
    timerSec = 0;
    document.getElementById("timer").textContent = "00:00";
    document.getElementById("slowMsg").textContent = "";

    // 再スタート
    startTimer();
}

/*
  ページ表示時に自動スタート
*/
window.addEventListener("DOMContentLoaded", () => {
    startTimer();
});
