import axios from "axios"
import fs from "fs"
import speech from "@google-cloud/speech"
import dotenv from "dotenv"
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

dotenv.config();
ffmpeg.setFfmpegPath(ffmpegPath.path);

// Google Cloud Speech-to-Text APIの設定
const client = new speech.SpeechClient({
  keyFilename: "./keys/credential.json"
})


//チャンネル数を一つに変換
async function convertStereoToMono(inputPath: string, outputPath: string): Promise<void>{
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioChannels(1)
      .on('error', (error: any) => {
        reject(error);
      })
      .on('end', () => {
        resolve();
      })
      .save(outputPath);
  });
}


// 音声ファイルをテキストに変換する関数
async function transcribeAudio(audioFilePath: string) {
  //引数の先にあるファイルを開く
  const audioFile = fs.readFileSync(audioFilePath);
  const audioBytes = audioFile.toString("base64");

  const request: any = {
    audio: {
      content: audioBytes,
    },
    config: {
      enableAutomaticPunctuation: true,
      model: "default",
      encoding: "LINEAR16",
      sampleRateHertz: 44100,
      languageCode: "ja-JP",
    },
  };
  const [response]: any = await client.recognize(request);

  const transcription = response.results
    .map((result: { alternatives: { transcript: any; }[]; }) => result.alternatives[0].transcript)
    .join("\n");
    console.log(transcription)
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
console.log(processedText)
return processedText;
}

// メイン関数
async function main() {
  const inputPath = "./ohayo.wav"; // 音声ファイルへのパスに置き換えてください
  const outputPath = "./aaa.wav"
  
  // 音声ファイルのチャンネルを１つに変換する
  await convertStereoToMono(inputPath, outputPath)
  
  // 音声をテキストに変換
  const text = await transcribeAudio(outputPath);
  console.log("Transcribed Text:", text);

  // OpenAI APIを使用してテキストを処理
  const processedText = await processTextWithOpenAI(text);
  console.log("Processed Text:", processedText);
}

// メイン関数を実行
main();
