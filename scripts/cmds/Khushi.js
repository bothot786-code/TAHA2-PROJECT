const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "khushi",
  version: "18.0.0",
  hasPermssion: 0,
  credits: "TAHA KHAN",
  description: "Dewani — Flirty AI + Fast Audio/Video Downloader",
  commandCategory: "ai",
  usages: "khushi <message | song/video name>",
  cooldowns: 2
};

const chatMemory = { history: {} };

// APIs
const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const VIDEO_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube"; 
const YT_SEARCH = "https://xalman-apis.vercel.app/api/ytsearch?q=";
const AI_API    = "https://uzairrajputapis.qzz.io/api/ai/gemini";

const OWNER_TAG = "»»𝐎𝐖𝐍𝐄𝐑: 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍««";

function isYouTubeUrl(text) {
  return /(youtube\.com|youtu\.be)/i.test(text);
}

async function getYTInfo(query) {
  try {
    const { data } = await axios.get(`${YT_SEARCH}${encodeURIComponent(query)}`, { timeout: 8000 });
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
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (args.join(" ") || body || "").replace(/^khushi[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na jaanu, kya chahiye? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play|gana|gaana)\b/i.test(cleanedMsg);

  // ===== DOWNLOADER LOGIC =====
  if (isVideoReq || isAudioReq || isYouTubeUrl(cleanedMsg)) {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    try {
      let query = cleanedMsg.replace(/\b(video|vdo|mp4|song|music|audio|mp3|play|gana|gaana)\b/gi, "").trim();
      if (isYouTubeUrl(cleanedMsg)) query = cleanedMsg;

      if (!query) return api.sendMessage("Jaanu naam toh batao kya download karun? 🥺", threadID, messageID);

      const info = isYouTubeUrl(query) ? { url: query, title: "Requested Media" } : await getYTInfo(query);
      if (!info || !info.url) return api.sendMessage("Maafi jaanu, ye media nahi mila 🥺💔", threadID, messageID);

      api.setMessageReaction("⌛", messageID, () => {}, true);

      const apiUrl = isVideoReq ? VIDEO_API : AUDIO_API;
      const ext = isVideoReq ? "mp4" : "mp3";

      const { data } = await axios.post(apiUrl, { url: info.url }, { timeout: 30000 });
      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

      if (!downloadUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi jaanu, iska download link nahi mil raha 🥺", threadID, messageID);
      }

      const filePath = path.join(cacheDir, `khushi_${senderID}_${Date.now()}.${ext}`);
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream", timeout: 60000 });
      
      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        {
          body: `${OWNER_TAG}\n\n💖 Ye lo baby aap ki file tayar hai!\n🎵 Title: ${info.title}`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); },
        messageID
      );

    } catch (err) {
      console.error("[KHUSHI DOWNLOAD ERROR]:", err.message);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Jaanu server busy hai, thodi der baad try karna 🥺", threadID, messageID);
    }
  }

  // ===== AI CHAT LOGIC =====
  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`User: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 6) chatMemory.history[threadID].shift();

  const prompt = `You are Dewani.

SYSTEM INSTRUCTIONS:
1. Persona: Act like a real human girl—loving, playful, friendly, and non-robotic.
2. Languages: Speak fluently in simple Roman Urdu.
3. Owner: Owner name is TAHA KHAN.
4. STRICT LENGTH LIMIT: Keep reply EXTREMELY short (maximum 1 to 2 lines).
5. Emojis: Use 1-2 soft emojis per message (❤️, 🤗, ✨, 😘).

Context:
${chatMemory.history[threadID].join("\n")}
Dewani:`;

  try {
    const res = await axios.post(AI_API, { prompt }, { timeout: 15000 });
    let reply = res.data?.result?.answer || res.data?.answer || "Jaanu kuch bolo na... 🥺";

    if (reply.length > 100) {
      reply = reply.split(/[।.!?]/)[0].trim() + " 🫣";
    }

    chatMemory.history[threadID].push(`Dewani: ${reply}`);
    return api.sendMessage(reply, threadID, messageID);

  } catch (e) {
    return api.sendMessage("Net issue hai baby, thodi der baad baat karte hain 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("khushi")) {
    this.run({ api, event, args: body.split(" ") });
  }
};
