/*
  Web Speech API 設定
  ・continuous = true → 発話が途切れても継続
  ・結果は追記（上書きしない）
*/
let recognition;
let recognizing = false;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = false;

    // 音声認識結果を受け取る
    recognition.onresult = function(event) {
        let text = "";

        // 新しく認識された分だけ追加
        for (let i = event.resultIndex; i < event.results.length; i++) {
            text += event.results[i][0].transcript + " ";
        }

        document.getElementById("resultText").textContent += text;
    };

    // 途中で止まっても自動再開
    recognition.onend = function() {
        if (recognizing) recognition.start();
    };
}
