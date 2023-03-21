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
exports.generateMarkdown = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const speech_1 = __importDefault(require("@google-cloud/speech"));
const dotenv_1 = __importDefault(require("dotenv"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const markdown_it_1 = __importDefault(require("markdown-it"));
dotenv_1.default.config();
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
// Google Cloud Speech-to-Text APIの設定
const client = new speech_1.default.SpeechClient({
    keyFilename: "./keys/credential.json"
});
//チャンネル数を一つに変換
function convertStereoToMono(inputPath, outputPath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(inputPath)
                .audioChannels(1)
                .on('error', (error) => {
                reject(error);
            })
                .on('end', () => {
                resolve();
            })
                .save(outputPath);
        });
    });
}
// 音声ファイルをテキストに変換する関数
function transcribeAudio(audioFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        //引数の先にあるファイルを開く
        const audioFile = fs_1.default.readFileSync(audioFilePath);
        const audioBytes = audioFile.toString("base64");
        const request = {
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
        const [response] = yield client.recognize(request);
        const transcription = response.results
            .map((result) => result.alternatives[0].transcript)
            .join("\n");
        console.log(transcription);
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
        console.log(processedText);
        return processedText;
    });
}
function generateMarkdown(text, outputPath) {
    const md = new markdown_it_1.default();
    const markdown = md.render(text);
    fs_1.default.writeFileSync(outputPath, markdown, 'utf-8');
}
exports.generateMarkdown = generateMarkdown;
// メイン関数
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const inputPath = "./g_03.wav"; // 音声ファイルへのパスに置き換えてください
        const outputPath = "./g3.wav";
        const markdownOutputPath = "./output.md"; // Markdownファイルの出力先を指定
        // 音声ファイルのチャンネルを１つに変換する
        yield convertStereoToMono(inputPath, outputPath);
        // 音声をテキストに変換
        const text = yield transcribeAudio(outputPath);
        console.log("Transcribed Text:", text);
        // OpenAI APIを使用してテキストを処理
        const processedText = yield processTextWithOpenAI(text);
        generateMarkdown(processedText, markdownOutputPath);
        console.log("Processed Text:", processedText);
    });
}
// メイン関数を実行
main();
