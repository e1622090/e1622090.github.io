// question.html 直アクセス対策
if (!localStorage.getItem("mode")) {
    location.href = "index.html";
}


document.addEventListener("DOMContentLoaded", () => {

    if (!document.getElementById("questionText")) {
        return;
    }


if (!document.getElementById("questionText")) {
    return;
}



// タイトルへ戻る
document.getElementById("titleBtn").onclick = () => {

    // ★ 前回の問題IDを完全にクリア
    localStorage.removeItem("currentProblem");
    localStorage.removeItem("mode");
    // タイトルへ戻る
    window.location.href = "index.html";
};


// 選択されたモード取得
let mode = localStorage.getItem("mode");

// 「scenario」のまま来た場合はメニューに戻す
if (mode === "scenario" || !problems[mode]) {
    alert("問題形式を選択してください");
    location.href = "index.html";
}


/*
  問題をランダムに選ぶ
  ・exclude：現在の問題（次へで同じ問題を避ける）
*/
function loadRandomProblem(exclude = "") {
    let list = [...problems[mode]];

    // 現在の問題を除外
    list = list.filter(p => p !== exclude);

    // ランダム選択
    const chosen = list[Math.floor(Math.random() * list.length)];

    localStorage.setItem("currentProblem", chosen);
    loadProblem(chosen);
}

/*
  問題ファイルを読み込む
*/
function loadProblem(key) {
    fetch(`problems/${key}.html`)
        .then(res => res.text())
        .then(text => {
            document.getElementById("questionText").innerHTML = text;
            
            // ★ 表示された問題に応じてボタン切り替え//連続会話について
            updateNextButton(key);
        });
}


// 初回表示
let current = localStorage.getItem("currentProblem");
if (!current) {
    loadRandomProblem();
} else {
    loadProblem(current);
}

// Start
document.getElementById("startBtn").onclick = () => {
    if (recognition && !recognizing) {
        recognizing = true;
        recognition.start();
        resetTimer();
        startTimer();
    }
};

// Stop
document.getElementById("stopBtn").onclick = () => {

    recognizing = false;
    recognition.stop();

    clearInterval(timerInterval);

    // 現在の問題ID（R1 / P1 など）を取得
    const problemId = localStorage.getItem("currentProblem");

    // 認識された文章
    const spokenText = document.getElementById("resultText").textContent;

    // ▼ 問題ごとの採点実行
    judgeTextByRule(problemId, spokenText);
};


// Reset
document.getElementById("resetBtn").onclick = () => {

    // 音声認識結果を消す
    document.getElementById("resultText").textContent = "";

    // 採点結果を消す
    document.getElementById("judgeResult").textContent = "";

    // ★ タイマーは一切触らない
};

// 次へ
document.getElementById("nextBtn").onclick = () => {

    const current = localStorage.getItem("currentProblem");
    const mode = document.getElementById("nextBtn").dataset.mode;

    if (mode === "flow") {
        // 連続会話
        const next = problemFlow[current].next;
        localStorage.setItem("currentProblem", next);
        loadProblem(next);
    } else {
        // 通常ランダム
        loadRandomProblem(current);
    }

    clearAnswerAndJudge();
    resetAndRestartTimer();
};

//次へ・連続会話ボタン切り替え
function updateNextButton(problemId) {

    const btn = document.getElementById("nextBtn");
    const flow = problemFlow[problemId];

    if (flow && flow.next) {
        // 連続会話モード
        btn.textContent = flow.buttonLabel || "連続会話";
        btn.dataset.mode = "flow";
    } else {
        // 通常モード
        btn.textContent = "次へ";
        btn.dataset.mode = "random";
    }
}



/*　採点枠の初期化　*/ 
function clearAnswerAndJudge() {
    document.getElementById("resultText").textContent = "";
    document.getElementById("judgeResult").textContent = "";
}
document.getElementById("resetBtn").onclick = () => {
    clearAnswerAndJudge();
};


/*
  問題ごとの表記ゆれ正規化
*/
function normalizeTextByRule(text, rule) {

    if (!rule.normalize) return text;

    let normalized = text;

    for (const standard in rule.normalize) {
        rule.normalize[standard].forEach(variant => {
            const regex = new RegExp(variant, "g");
            normalized = normalized.replace(regex, standard);
        });
    }

    return normalized;
}



/*
  問題IDに応じて採点を行う（共通ロジック）
*/
function judgeTextByRule(problemId, text) {

    const rule = judgeRules[problemId];
    const judgeResult = document.getElementById("judgeResult");

     // ★ 問題ごとの正規化を先に行う
    const normalizedText = normalizeTextByRule(text, rule);

    // ルールが未定義なら何もしない
    if (!rule) {
        judgeResult.textContent = "（この問題には採点ルールがありません）";
        judgeResult.style.color = "gray";
        return;
    }

    let misses = [];

    // --------------------
    // 必須語チェック
    // --------------------
    if (rule.must) {
        rule.must.forEach(word => {
            if (!normalizedText.includes(word)) {
                misses.push(`「${word}」無し`);
            }
        });
    }


    // --------------------
    // NG語チェック
    // --------------------
    if (rule.mustNot) {
        rule.mustNot.forEach(word => {
            if (text.includes(word)) {
                misses.push(`「${word}」が含まれています`);
            }
        });
    }

    // --------------------
    // クッション言葉（あれば判定）
    // --------------------
    if (rule.cushion) {
        const hasCushion = rule.cushion.some(word =>
            normalizedText.includes(word)
            );
        if (!hasCushion) {
            misses.push("クッション言葉が含まれていません");
        }
    }

    // --------------------
    // ★ 丁寧な表現（あれば判定）
    // --------------------
    if (rule.polite) {
        const hasPolite = rule.polite.some(word =>
            normalizedText.includes(word)
            );
        if (!hasPolite) {
            misses.push("丁寧な表現が不足しています");
        }
    }

    // --------------------
    // ★ 謙譲表現（あれば判定）
    // --------------------
    if (rule.humble) {
        const hasHumble = rule.humble.some(word =>
            normalizedText.includes(word)
            );
        if (!hasHumble) {
            misses.push("謙譲表現が不足しています");
        }
    }


    // --------------------
    // 判定結果表示
    // --------------------
    if (misses.length === 0) {
        judgeResult.textContent = rule.successMessage;
        judgeResult.style.color = "red";
    } else {
        judgeResult.textContent =
            "減点理由：\n・" +
            misses.join("\n・") +
            "\n\n" +
            rule.example;
        judgeResult.style.color = "blue";
    }
}

});
