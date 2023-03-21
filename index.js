"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const speech_1 = __importDefault(require("@google-cloud/speech"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Google Cloud Speech-to-Text APIの設定
const client = new speech_1.default.SpeechClient({
    keyFilename: "./keys/credential.json"
});
// 音声ファイルをテキストに変換する関数
function transcribeAudio(audioFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        //
        const audioFile = fs_1.default.readFileSync(audioFilePath);
        const audioBytes = audioFile.toString("base64");
        const request = {
            audio: {
                content: audioBytes,
            },
            config: {
                encoding: "LINEAR16",
                sampleRateHertz: 44100,
                languageCode: "ja-JP",
            },
        };
        const [response] = yield client.recognize(request);
        const transcription = response.results
            .map((result) => result.alternatives[0].transcript)
            .join("\n");
        return transcription;
    });
}
// OpenAI APIを使用してテキストを処理する関数
function processTextWithOpenAI(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = process.env.OPEN_AI_APIKEY;
        const apiUrl = "https://api.openai.com/v1/engines/davinci-codex/completions";
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        };
        const data = {
            prompt: text,
            max_tokens: 50,
            n: 1,
            stop: null,
            temperature: 0.7, // クリエイティビティの指標。低いほど確実性が高く、高いほど多様性が高まる
        };
        const response = yield axios_1.default.post(apiUrl, data, { headers });
        const processedText = response.data.choices[0].text;
        return processedText;
    });
}
// メイン関数
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const audioFilePath = "./ohayo.wav"; // 音声ファイルへのパスに置き換えてください
        // 音声をテキストに変換
        const text = yield transcribeAudio(audioFilePath);
        console.log("Transcribed Text:", text);
        // OpenAI APIを使用してテキストを処理
        const processedText = yield processTextWithOpenAI(text);
        console.log("Processed Text:", processedText);
    });
}
// メイン関数を実行
main();