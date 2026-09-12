const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream/promises");
const { Transform } = require("stream");

module.exports = {
  config: {
    name: "khushi",
    aliases: ["dewani", "khush"],
    version: "17.0.0",
    author: "TAHA KHAN",
    countDown: 2,
    role: 0,
    description: {
      en: "Dewani — Short AI + Fixed Video/Audio Downloader",
      ur: "Dewani — Short AI + Fixed Video/Audio Downloader"
    },
    category: "ai",
    guide: {
      en: "{pn} <message | song/video name>",
      ur: "{pn} <paigham | gane ya video ka naam>"
    }
  },

  chatMemory: {},

  AUDIO_API: "https://uzairrajputapis.qzz.io/api/downloader/ytmp3",
  VIDEO_API: "https://uzairrajputapis.qzz.io/api/downloader/youtube",
  YT_SEARCH: "https://xalman-apis.vercel.app/api/ytsearch?q=Hd",
  AI_API: "https://uzairrajputapis.qzz.io/api/ai/gemini",
  MAX_FILE_SIZE: 25 * 1024 * 1024,
  OWNER_TAG: "»»𝐎𝐖𝐍𝐄𝐑««★™  »»𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍««",
  TRIGGER_WORDS: ["khushi", "dewani", "khush"],

  fileSizeGuard(maxBytes) {
    let received = 0;
    return new Transform({
      transform(chunk, _, cb) {
        received += chunk.length;
        if (received > maxBytes) {
          const e = new Error("File too large");
          e.code = "TOO_LARGE";
          return cb(e);
        }
        cb(null, chunk);
      }
    });
  },

  async removeFile(p) {
    if (p && fs.existsSync(p)) {
      try { await fs.unlink(p); } catch {}
    }
  },

  async getYTInfo(query) {
    try {
      const { data } = await axios.get(this.YT_SEARCH, { params: { q: query }, timeout: 8000 });
      const video = data?.result?.[0] || data?.result?.items?.[0];
      if (video) return { url: video.url, title: video.title };
    } catch (e) {}

    try {
      const search = await yts(query);
      if (search.videos?.[0]) {
        return { url: search.videos[0].url, title: search.videos[0].title };
      }
    } catch (err) {}

    return null;
  },

  isYouTubeUrl(text) {
    return /(youtube\.com|youtu\.be)/i.test(text);
  },

  // ===== AUDIO DOWNLOADER =====
  async downloadAudio(api, event, query) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    let filePath = null;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
      const info = this.isYouTubeUrl(query) ? { url: query, title: "Requested Media" } : await this.getYTInfo(query);
      if (!info || !info.url) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi jaanu, ye video nahi mili 🥺💔", threadID, messageID);
      }

      const { data } = await axios.post(this.AUDIO_API, { url: info.url }, { timeout: 30000 });
      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

      if (!downloadUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi jaanu, iska download link nahi mil raha 🥺", threadID, messageID);
      }

      filePath = path.join(cacheDir, `cache_${senderID}_${Date.now()}.mp3`);
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream", timeout: 60000 });

      await pipeline(
        res.data,
        this.fileSizeGuard(this.MAX_FILE_SIZE),
        fs.createWriteStream(filePath)
      );

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage({
        body: `${this.OWNER_TAG}\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MP3 file tayar hai! 💖`,
        attachment: fs.createReadStream(filePath)
      }, threadID, async () => {
        await this.removeFile(filePath);
      }, messageID);

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      await this.removeFile(filePath);
      return api.sendMessage("Jaanu server busy hai, thodi der baad try karna 🥺", threadID, messageID);
    }
  },

  // ===== VIDEO DOWNLOADER =====
  async downloadVideo(api, event, query) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    let filePath = null;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
      const info = this.isYouTubeUrl(query) ? { url: query, title: "Requested Media" } : await this.getYTInfo(query);
      if (!info || !info.url) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi jaanu, ye video nahi mili 🥺💔", threadID, messageID);
      }

      const { data } = await axios.post(this.VIDEO_API, { url: info.url }, { timeout: 30000 });
      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

      if (!downloadUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi jaanu, iska download link nahi mil raha 🥺", threadID, messageID);
      }

      filePath = path.join(cacheDir, `cache_${senderID}_${Date.now()}.mp4`);
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream", timeout: 60000 });

      await pipeline(
        res.data,
        this.fileSizeGuard(this.MAX_FILE_SIZE),
        fs.createWriteStream(filePath)
      );

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage({
        body: `${this.OWNER_TAG}\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MP4 file tayar hai! 💖`,
        attachment: fs.createReadStream(filePath)
      }, threadID, async () => {
        await this.removeFile(filePath);
      }, messageID);

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      await this.removeFile(filePath);
      return api.sendMessage("Jaanu server busy hai, thodi der baad try karna 🥺", threadID, messageID);
    }
  },

  // ===== AI (Dewani Chat Logic) =====
  async handleAI(api, event, cleanedMsg) {
    const { threadID, messageID, senderID } = event;

    this.chatMemory[threadID] = this.chatMemory[threadID] || [];
    this.chatMemory[threadID].push(`User: ${cleanedMsg}`);
    if (this.chatMemory[threadID].length > 5) this.chatMemory[threadID].shift();

    const prompt = `You are Dewani,.

SYSTEM INSTRUCTIONS:
1. Persona: Act like a real human girl—funny, loving, playful, and completely non-robotic.
2. Languages: Speak fluently in whatever language the user talks in (Roman Urdu, Pashto, Punjabi, English, etc.).
4. STRICT LENGTH LIMIT: Keep every reply EXTREMELY short (maximum 1 to 2 lines only).
5. Emojis: Always use 1-2 soft emojis per message (like ❤️, 🤗, ✨).

Context:
${this.chatMemory[threadID].join("\n")}
Dewani:`;

    try {
      const res = await axios.post(this.AI_API, { prompt }, { timeout: 20000 });
      let reply = res.data?.result?.answer || "Jaanu kuch bolo na... 🥺";

      if (reply.length > 100) {
        reply = reply.split('.')[0] + "🫣";
      }

      this.chatMemory[threadID].push(`Dewani: ${reply}`);

      return api.sendMessage(reply, threadID, (err, info) => {
        if (!err && info) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            author: senderID,
            messageID: info.messageID
          });
        }
      }, messageID);
    } catch (e) {
      console.error("[khushi AI]", e.message);
      return api.sendMessage("Net issue hai baby, main thak gayi hoon 🥺", threadID, messageID);
    }
  },

  // ===== MAIN PROCESS =====
  async processMessage(api, event, text, message) {
    let cleanedMsg = text.replace(/^khushi[\s,!.?:-]*/i, "").trim();
    if (!cleanedMsg) return api.sendMessage("Bolo na jaanu, kya chahiye? 😘", event.threadID, event.messageID);

    const isVideoReq = /\b(video|vdo|mp4)\b/i.test(cleanedMsg);
    const isAudioReq = /\b(song|music|audio|mp3|play)\b/i.test(cleanedMsg);

    if (isVideoReq || isAudioReq || this.isYouTubeUrl(cleanedMsg)) {
      let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play/gi, "").trim();
      if (this.isYouTubeUrl(cleanedMsg)) query = cleanedMsg;

      if (!query) return api.sendMessage("Jaanu naam to batao kya download karun? 🥺", event.threadID, event.messageID);

      if (isVideoReq) {
        return this.downloadVideo(api, event, query);
      } else {
        return this.downloadAudio(api, event, query);
      }
    }

    return this.handleAI(api, event, cleanedMsg);
  },

  // ===== COMMAND =====
  async onStart({ api, event, args, message }) {
    return this.processMessage(api, event, args.join(" "), message);
  },

  // ===== ONCHAT =====
  async onChat({ api, event, message }) {
    const body = (event.body || "").toLowerCase().trim();
    if (!body) return;

    const triggered = this.TRIGGER_WORDS.some(word =>
      body.includes(word.toLowerCase())
    );
    if (!triggered) return;

    const prefix = global.GoatBot?.config?.prefix || ".";
    if (body.startsWith(prefix)) return;

    return this.processMessage(api, event, event.body, message);
  },

  // ===== ONREPLY =====
  async onReply({ api, event, message, Reply }) {
    if (event.senderID !== Reply.author) return;
    const text = (event.body || "").trim();
    if (!text) return;
    return this.processMessage(api, event, text, message);
  }
};
