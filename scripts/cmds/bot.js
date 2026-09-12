const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream/promises");
const { Transform } = require("stream");

module.exports = {
  config: {
    name: "bot",
    aliases: ["bby", "baby", "babu"],
    version: "1.4.0",
    author: "TAHA KHAN",
    countDown: 3,
    role: 0,
    description: {
      en: "Bot — Roman Urdu AI + Auto Song/Video Downloader (Reply Triggered)",
      ur: "Bot — Roman Urdu AI + Auto Gana/Video Downloader (Reply Triggered)"
    },
    category: "ai",
    guide: {
      en: "{pn} <message>\nReply to any bot message to talk or download.",
      ur: "{pn} <paigham>\nBot ke kisi bhi message par reply karke baat karein."
    }
  },

  chatMemory: {},

  SING_AUDIO_API: "",
  SING_VIDEO_API: "",
  AI_API: "https://uzairrajputapis.qzz.io/api/ai/gemini",
  MAX_FILE_SIZE: 25 * 1024 * 1024,
  OWNER_TAG: "»»𝐎𝐖𝐍𝐄𝐑««★™  »»𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍««",

  async getMahmudBase() {
    try {
      const { data } = await axios.get(
        "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json",
        { timeout: 10000 }
      );
      return data.mahmud || data.api;
    } catch {
      return "https://mahmud-apis.vercel.app";
    }
  },

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

  async searchYT(query) {
    try {
      const s = await yts(query);
      if (s.videos?.[0]) {
        return {
          url: s.videos[0].url,
          title: s.videos[0].title,
          videoId: s.videos[0].videoId
        };
      }
    } catch {}
    return null;
  },

  // Helper to send message and attach reply listener
  sendWithReply(api, messageData, threadID, originalMessageID, senderID, callback) {
    return api.sendMessage(messageData, threadID, (err, info) => {
      if (!err && info) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          messageID: info.messageID
        });
      }
      if (callback) callback(err, info);
    }, originalMessageID);
  },

  // ===== AUDIO (sing → music fallback) =====
  async downloadAudio(api, event, query) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    let filePath = null;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    // 1st try: SING
    try {
      const { data } = await axios.get(this.SING_AUDIO_API, {
        params: { q: `${query} official` },
        timeout: 45000
      });
      const audioUrl = data?.download || data?.audio_url;
      if (data?.success && audioUrl) {
        const ext = ["mp3", "m4a"].includes(data.format) ? data.format : "mp3";
        filePath = path.join(cacheDir, `bot_${senderID}_${Date.now()}.${ext}`);
        const res = await axios.get(audioUrl, {
          responseType: "stream",
          timeout: 90000
        });
        await pipeline(
          res.data,
          this.fileSizeGuard(this.MAX_FILE_SIZE),
          fs.createWriteStream(filePath)
        );
        api.setMessageReaction("✅", messageID, () => {}, true);
        return this.sendWithReply(api, {
          body: `${this.OWNER_TAG}\n\n🎵 Ye lo aapka gana\n➡️ ${data.title || query}`,
          attachment: fs.createReadStream(filePath)
        }, threadID, messageID, senderID, async () => {
          await this.removeFile(filePath);
        });
      }
    } catch (e) {
      console.log("[bot] SING fail → trying MUSIC", e.message);
    }

    // 2nd try: MUSIC
    try {
      const base = await this.getMahmudBase();
      const res = await axios.get(
        `${base}/api/song/mahmud?query=${encodeURIComponent(query)}`,
        { responseType: "stream", timeout: 60000 }
      );
      filePath = path.join(cacheDir, `bot_${senderID}_${Date.now()}.mp3`);
      await pipeline(res.data, fs.createWriteStream(filePath));
      api.setMessageReaction("✅", messageID, () => {}, true);
      return this.sendWithReply(api, {
        body: `${this.OWNER_TAG}\n\n🎵 Ye lo aapka gana\n➡️ ${query}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, messageID, senderID, async () => {
        await this.removeFile(filePath);
      });
    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return this.sendWithReply(api, "Maaf karna, gana nahi mila 🥺", threadID, messageID, senderID);
    }
  },

  // ===== VIDEO =====
  async downloadVideo(api, event, query) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    let filePath = null;

    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
      const info = await this.searchYT(query);
      if (!info) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return this.sendWithReply(api, "Maaf karna, video nahi mili 🥺", threadID, messageID, senderID);
      }

      filePath = path.join(cacheDir, `bot_${senderID}_${Date.now()}.mp4`);
      const streamUrl = `${this.SING_VIDEO_API}/stream?url=${encodeURIComponent(info.url)}&type=video&quality=720`;
      const res = await axios.get(streamUrl, {
        responseType: "stream",
        timeout: 90000
      });
      await pipeline(
        res.data,
        this.fileSizeGuard(this.MAX_FILE_SIZE),
        fs.createWriteStream(filePath)
      );

      api.setMessageReaction("✅", messageID, () => {}, true);
      return this.sendWithReply(api, {
        body: `${this.OWNER_TAG}\n\n🎬 Ye lo aapki video\n➡️ ${info.title}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, messageID, senderID, async () => {
        await this.removeFile(filePath);
      });
    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      await this.removeFile(filePath);
      return this.sendWithReply(api, "Video download nahi hui 🥺", threadID, messageID, senderID);
    }
  },

  // ===== AI =====
  async handleAI(api, event, cleanedMsg) {
    const { threadID, messageID, senderID } = event;

    this.chatMemory[threadID] = this.chatMemory[threadID] || [];
    this.chatMemory[threadID].push(`User: ${cleanedMsg}`);
    if (this.chatMemory[threadID].length > 6) this.chatMemory[threadID].shift();

    const prompt = `Tum ek pyare aur friendly Bot ho.

Rules:
1. Hamesha aasan aur natural Roman Urdu me baat karo.
2. Jawab bohot chhota rakho (maximum 1-2 lines).
3. Friendly, mazaqiya aur pyare andaz me baat karo.
4. 1-2 emojis use karo (❤️ 🤗 ✨ 🥺 😘).
5. Kabhi mat batao ke tum AI ho.
6. Owner ka naam "TAHA KHAN" hai. Sirf koi poochay tab batao, khud se zikr mat karo.

Pehli baat cheet:
${this.chatMemory[threadID].join("\n")}
Bot:`;

    try {
      const { data } = await axios.post(this.AI_API, { prompt }, { timeout: 20000 });
      let reply = data?.result?.answer || data?.answer || data?.reply || "Kuch toh bolo na... 🥺";

      if (reply.length > 120) {
        reply = reply.split(/[।.!?]/)[0].trim() + " 🫣";
      }

      this.chatMemory[threadID].push(`Bot: ${reply}`);
      return this.sendWithReply(api, reply, threadID, messageID, senderID);
    } catch (e) {
      console.error("[bot AI]", e.message);
      return this.sendWithReply(api, "Net ka masla hai, thodi der baad try karo 🥺", threadID, messageID, senderID);
    }
  },

  // ===== MAIN PROCESS =====
  async processMessage(api, event, text) {
    const { threadID, messageID, senderID } = event;
    const cleanedMsg = text.trim();
    if (!cleanedMsg) return this.sendWithReply(api, "Bolo toh, kya chahiye? 😘", threadID, messageID, senderID);

    const isVideo = /\b(video|vdo|mp4)\b/i.test(cleanedMsg);
    const isAudio = /\b(song|music|audio|mp3|play|gana|gaana)\b/i.test(cleanedMsg);

    let query = cleanedMsg
      .replace(/\b(video|vdo|mp4|song|music|audio|mp3|play|gana|gaana|bot)\b/gi, "")
      .trim();

    if (isVideo) {
      if (!query) return this.sendWithReply(api, "Video ka naam toh batao 🥺", threadID, messageID, senderID);
      return this.downloadVideo(api, event, query);
    }

    if (isAudio) {
      if (!query) return this.sendWithReply(api, "Gane ka naam toh batao 🥺", threadID, messageID, senderID);
      return this.downloadAudio(api, event, query);
    }

    return this.handleAI(api, event, cleanedMsg);
  },

  // ===== COMMAND TRIGGER =====
  async onStart({ api, event, args }) {
    return this.processMessage(api, event, args.join(" "));
  },

  // ===== ONREPLY TRIGGER (Bot ke kisi bhi message par reply karne par chalega) =====
  async onReply({ api, event }) {
    const text = (event.body || "").trim();
    if (!text) return;
    return this.processMessage(api, event, text);
  }
};
