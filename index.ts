import axios from "axios"
import fs from "fs"
import speech from "@google-cloud/speech"
import dotenv from "dotenv"
dotenv.config();
// Google Cloud Speech-to-Text APIの設定
const client = new speech.SpeechClient({
  keyFilename: "./keys/credential.json"
})

// 音声ファイルをテキストに変換する関数
async function transcribeAudio(audioFilePath: string) {
  //
  const audioFile = fs.readFileSync(audioFilePath);
  const audioBytes = audioFile.toString("base64");

  const request: any = {
    audio: {
      content: audioBytes,
    },
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 44100,
      languageCode: "ja-JP",
    },
  };

  const [response]: any = await client.recognize(request);
  const transcription = response.results
    .map((result: { alternatives: { transcript: any; }[]; }) => result.alternatives[0].transcript)
    .join("\n");
  return transcription;
}

// OpenAI APIを使用してテキストを処理する関数
async function processTextWithOpenAI(text: any) {
  const apiKey = process.env.OPEN_AI_APIKEY 
  const apiUrl = "https://api.openai.com/v1/engines/davinci-codex/completions";

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${apiKey}`,
};

const data = {
  prompt: text,
  max_tokens: 50, // 希望する応答の最大トークン数
  n: 1, // 応答数
  stop: null, // 応答の終了文字列
  temperature: 0.7, // クリエイティビティの指標。低いほど確実性が高く、高いほど多様性が高まる
};

const response = await axios.post(apiUrl, data, { headers });
const processedText = response.data.choices[0].text;
return processedText;
}

// メイン関数
async function main() {
  const audioFilePath = "./ohayo.wav"; // 音声ファイルへのパスに置き換えてください

  // 音声をテキストに変換
  const text = await transcribeAudio(audioFilePath);
  console.log("Transcribed Text:", text);

  // OpenAI APIを使用してテキストを処理
  const processedText = await processTextWithOpenAI(text);
  console.log("Processed Text:", processedText);
}

// メイン関数を実行
main();
