const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// Config for 1000x2000 layout
const W = 1000;
const HEADER_H = 160;
const ROW_H = 190; 
const PADDING = 30;
const THUMB_W = 260; 
const THUMB_H = 146;
const FOOT_H = 90;

// APIs
const XALMAN_API = "https://xalman-apis.vercel.app/api";
const DOWNLOADER_API = "https://shadowx-downloader.vercel.app";
const API_KEY = "shadowx";

// Function to clean text
function cleanText(text) {
  if (!text) return "";
  const boldMap = {
    '𝗮': 'a', '𝗯': 'b', '𝗰': 'c', '𝗱': 'd', '𝗲': 'e', '𝗳': 'f', '𝗴': 'g', '𝗵': 'h', '𝗶': 'i', '𝗷': 'j', '𝗸': 'k', '𝗹': 'l', '𝗺': 'm',
    '𝗻': 'n', '𝗼': 'o', '𝗽': 'p', '𝗾': 'q', '𝗿': 'r', '𝘀': 's', '𝘁': 't', '𝘂': 'u', '𝘃': 'v', '𝘄': 'w', '𝘅': 'x', '𝘆': 'y', '𝘇': 'z',
    '𝗔': 'A', '𝗕': 'B', '𝗖': 'C', '𝗗': 'D', '𝗘': 'E', '𝗙': 'F', '𝗚': 'G', '𝗛': 'H', '𝗜': 'I', '𝗝': 'J', '𝗞': 'K', '𝗟': 'L', '𝗠': 'M',
    '𝗡': 'N', '𝗢': 'O', '𝗣': 'P', '𝗤': 'Q', '𝗥': 'R', '𝗦': 'S', '𝗧': 'T', '𝗨': 'U', '𝗩': 'V', '𝗪': 'W', '𝗫': 'X', '𝗬': 'Y', '𝗭': 'Z',
    '𝐚': 'a', '𝐛': 'b', '𝐜': 'c', '𝐝': 'd', '𝐞': 'e', '𝐟': 'f', '𝐠': 'g', '𝐡': 'h', '𝐢': 'i', '𝐣': 'j', '𝐤': 'k', '𝐥': 'l', '𝐦': 'm',
    '𝐧': 'n', '𝐨': 'o', '𝐩': 'p', '𝐪': 'q', '𝐫': 'r', '𝐬': 's', '𝐭': 't', '𝐮': 'u', '𝐯': 'v', '𝐰': 'w', '𝐱': 'x', '𝐲': 'y', '𝐳': 'z',
    '𝐀': 'A', '𝐁': 'B', '𝐂': 'C', '𝐃': 'D', '𝐄': 'E', '𝐅': 'F', '𝐆': 'G', '𝐇': 'H', '𝐈': 'I', '𝐉': 'J', '𝐊': 'K', '𝐋': 'L', '𝐌': 'M',
    '𝐍': 'N', '𝐎': 'O', '𝐏': 'P', '𝐐': 'Q', '𝐑': 'R', '𝐒': 'S', '𝐓': 'T', '𝐔': 'U', '𝐕': 'V', '𝐖': 'W', '𝐗': 'X', '𝐘': 'Y', '𝐙': 'Z',
    '𝟬': '0', '𝟭': '1', '𝟮': '2', '𝟯': '3', '𝟰': '4', '𝟱': '5', '𝟲': '6', '𝟳': '7', '𝟴': '8', '𝟵': '9'
  };
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += boldMap[text[i]] || text[i];
  }
  return result;
}

function formatViews(n) {
  if (!n || n === 0) return "0";
  if (typeof n === 'string') {
    if (n.includes('M')) return n;
    if (n.includes('K')) return n;
    if (n.includes('B')) return n;
    return n;
  }
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

function truncate(text, maxLen) {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen - 2) + ".." : text;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split('');
  const lines = [];
  let currentLine = '';
  
  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + words[i];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

async function generateSearchImage(videos, query, type, quality) {
  const resultsCount = Math.min(videos.length, 6);
  const totalH = HEADER_H + (resultsCount * ROW_H) + FOOT_H;
  const canvas = createCanvas(W, totalH);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, totalH);
  bg.addColorStop(0, "#000814");
  bg.addColorStop(1, "#001d3d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, totalH);

  ctx.fillStyle = "rgba(0, 53, 102, 0.6)";
  ctx.fillRect(0, 0, W, HEADER_H);
  
  ctx.fillStyle = "#00b4d8";
  ctx.font = "bold 46px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("🎵 YOUTUBE DOWNLOADER", PADDING, 85);

  ctx.fillStyle = "#caf0f8";
  ctx.font = "24px 'Segoe UI', Arial, sans-serif";
  const typeLabel = type === "audio" ? "🎵 AUDIO" : "📹 VIDEO";
  const qualityText = type === "video" ? ` • QUALITY: ${quality}p` : "";
  ctx.fillText(`${typeLabel} • "${truncate(query, 55)}"${qualityText}`, PADDING, 125);

  ctx.strokeStyle = "#003566";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PADDING, HEADER_H - 10);
  ctx.lineTo(W - PADDING, HEADER_H - 10);
  ctx.stroke();

  for (let i = 0; i < resultsCount; i++) {
    const r = videos[i];
    const y = HEADER_H + (i * ROW_H);
    let currentY = y + 30;

    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(0, 53, 102, 0.25)";
      ctx.fillRect(0, y, W, ROW_H);
    }

    ctx.fillStyle = "#00b4d8";
    ctx.font = "bold 38px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`${i + 1}`, PADDING, y + 85);

    const thumbX = PADDING + 60;
    const thumbY = y + (ROW_H - THUMB_H) / 2;

    try {
      const img = await loadImage(r.thumbnail);
      ctx.drawImage(img, thumbX, thumbY, THUMB_W, THUMB_H);
    } catch(e) {
      ctx.fillStyle = "#003566";
      ctx.fillRect(thumbX, thumbY, THUMB_W, THUMB_H);
      ctx.fillStyle = "#00b4d8";
      ctx.font = "18px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NO IMAGE", thumbX + THUMB_W/2, thumbY + THUMB_H/2);
      ctx.textAlign = "left";
    }

    ctx.strokeStyle = "#0066a0";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(thumbX, thumbY, THUMB_W, THUMB_H);

    const textX = thumbX + THUMB_W + 20;
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
    const cleanTitle = cleanText(r.title);
    const maxTitleWidth = W - textX - 30;
    const titleLines = wrapText(ctx, cleanTitle, maxTitleWidth);
    
    for (let lineIdx = 0; lineIdx < titleLines.length; lineIdx++) {
      ctx.fillText(titleLines[lineIdx], textX, currentY + (lineIdx * 28));
    }
    
    const titleHeight = titleLines.length * 28;
    const channelY = currentY + titleHeight + 5;

    ctx.fillStyle = "#00b4d8";
    ctx.font = "18px 'Segoe UI', Arial, sans-serif";
    const cleanChannel = cleanText(r.author.name);
    let channelText = cleanChannel;
    const maxChannelWidth = W - textX - 30;
    if (ctx.measureText(channelText).width > maxChannelWidth) {
      channelText = truncate(cleanChannel, 40);
    }
    ctx.fillText(`${channelText} • ${r.timestamp}`, textX, channelY);

    ctx.fillStyle = "#6c757d";
    ctx.font = "16px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`${formatViews(r.views)} views`, textX, channelY + 25);

    if (i < resultsCount - 1) {
      ctx.strokeStyle = "#003566";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING, y + ROW_H);
      ctx.lineTo(W - PADDING, y + ROW_H);
      ctx.stroke();
    }
  }

  const footerY = totalH - FOOT_H + 25;
  ctx.fillStyle = "#caf0f8";
  ctx.textAlign = "center";
  ctx.font = "20px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("📌 Reply 1-6 to Download • Type 'next' or 'prev' for more", W/2, footerY);
  ctx.fillStyle = "#6c757d";
  ctx.font = "15px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Developer: Mueid Mursalin Rifat", W/2, footerY + 30);
  ctx.textAlign = "left";

  return canvas.toBuffer("image/jpeg", { quality: 0.92 });
}

module.exports = {
  config: {
    name: "yt",
    aliases: ["youtube", "ytb"],
    version: "6.2",
    author: "Siam Ahmed Saan",
    countDown: 5,
    role: 0,
    shortDescription: "🎵 YouTube downloader",
    longDescription: "Search and download YouTube audio (-a) or video (-v).",
    category: "media",
    guide: {
      en: "{pn} <query/link> -a (audio)\n{pn} <query/link> -v (video)\n\nExamples:\n{prefix}yt Believer -a\n{prefix}yt https://youtube.com/watch?v=... -v"
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const raw = args.join(" ");
    if (!raw) return message.reply("❗ Use: yt <query/link> -a or -v");

    const isAudio = raw.includes("-a");
    const isVideo = raw.includes("-v");

    if (!isAudio && !isVideo)
      return message.reply("❗ Please use `-a` for audio or `-v` for video.");

    const query = raw.replace(/-a|-v|\b(144|360|480|720|1080)\b/g, "").trim();

    if (!query) return message.reply("❗ Please provide a search query or YouTube URL.");

    // Handle direct URL
    if (/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(query)) {
      const wait = await message.reply(`⏳ Fetching metadata...`);
      
      // Get metadata using yt-search
      try {
        const searchResult = await yts(query);
        let videoInfo = null;
        
        if (searchResult && searchResult.videos && searchResult.videos.length > 0) {
          videoInfo = searchResult.videos[0];
        } else {
          // Try to extract video ID and search
          const videoId = extractVideoId(query);
          if (videoId) {
            const result = await yts({ videoId });
            if (result) videoInfo = result;
          }
        }
        
        const metadata = {
          title: videoInfo?.title || "YouTube Video",
          channel: videoInfo?.author?.name || "N/A",
          duration: videoInfo?.timestamp || "N/A",
          views: videoInfo?.views || "0",
          thumbnail: videoInfo?.thumbnail || ""
        };
        
        await api.unsendMessage(wait.messageID);
        const downloadWait = await message.reply(`⏳ Downloading ${isAudio ? "audio" : "video"}...`);
        await handleDownload(query, isAudio ? "audio" : "video", message, downloadWait.messageID, metadata);
      } catch (error) {
        console.error("Metadata fetch error:", error);
        await api.unsendMessage(wait.messageID);
        const downloadWait = await message.reply(`⏳ Downloading...`);
        await handleDownload(query, isAudio ? "audio" : "video", message, downloadWait.messageID);
      }
      return;
    }

    try {
      const res = await yts(query);
      const videos = res.videos.slice(0, 6);
      if (videos.length === 0) return message.reply("❌ No results found.");

      const imgBuffer = await generateSearchImage(videos, query, isAudio ? "audio" : "video", "HD");
      const cachePath = path.join(__dirname, "cache", `yt_search_${Date.now()}.jpg`);
      fs.ensureDirSync(path.join(__dirname, "cache"));
      fs.writeFileSync(cachePath, imgBuffer);

      const sent = await message.reply({ attachment: fs.createReadStream(cachePath) });
      
      global.GoatBot.onReply.set(sent.messageID, {
        commandName: "yt",
        messageID: sent.messageID,
        author: event.senderID,
        data: videos,
        isAudio: isAudio,
        query: query
      });
      
      setTimeout(() => { if(fs.existsSync(cachePath)) fs.unlinkSync(cachePath); }, 10000);

    } catch (e) {
      console.error("Search error:", e);
      message.reply("⚠️ Failed to search YouTube.");
    }
  },

  onReply: async function ({ event, message, Reply, api }) {
    const { author, data, isAudio, messageID } = Reply;
    if (event.senderID !== author) return;

    const input = event.body.toLowerCase().trim();

    if (["next", "n", ">"].includes(input)) {
      return message.reply("📌 Only first 6 results shown. Try a more specific search.");
    }
    if (["prev", "p", "<"].includes(input)) {
      return message.reply("📌 This is the first page.");
    }

    const index = parseInt(event.body);
    if (isNaN(index) || index < 1 || index > data.length)
      return message.reply("❗ Reply with a number from 1–6.");

    const selected = data[index - 1];

    try {
      await api.unsendMessage(messageID);
    } catch (e) {}

    const wait = await message.reply(`⏳ Downloading ${isAudio ? "audio" : "video"}...`);
    
    // Pass metadata from search results
    const metadata = {
      title: selected.title,
      channel: selected.author?.name || "N/A",
      duration: selected.timestamp || "N/A",
      views: selected.views || "0",
      thumbnail: selected.thumbnail || ""
    };
    
    await handleDownload(selected.url, isAudio ? "audio" : "video", message, wait.messageID, metadata);
  }
};

// Extract video ID from URL
function extractVideoId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Download Handler with Xalman API primary and ShadowX Downloader fallback
async function handleDownload(url, type, message, waitMsgID, metadata = null) {
  try {
    let downloadUrl;
    let apiSource;
    let downloadSuccess = false;

    // FIRST TRY: Xalman API (Primary)
    try {
      console.log("📥 Trying Xalman API...");
      const apiUrl = `${XALMAN_API}/ytdlv2?url=${encodeURIComponent(url)}`;
      console.log("📥 Xalman URL:", apiUrl);
      
      const { data } = await axios.get(apiUrl, { timeout: 20000 });
      
      console.log("📥 Xalman Response:", JSON.stringify(data, null, 2));
      
      if (data.success) {
        if (type === "audio" && data.audio_url) {
          downloadUrl = data.audio_url;
        } else if (type === "video" && data.video_url) {
          downloadUrl = data.video_url;
        } else {
          downloadUrl = data.video_url || data.audio_url;
        }
        
        if (downloadUrl) {
          // Use metadata from yt-search if available, otherwise use API data
          if (!metadata) {
            metadata = {
              title: data.title || "YouTube Media",
              duration: data.duration || "N/A",
              channel: data.author || data.channel || "N/A",
              views: data.views || "0"
            };
          }
          apiSource = "Xalman API";
          downloadSuccess = true;
          console.log("✅ Xalman API success!");
        }
      }
    } catch (xalmanError) {
      console.log("❌ Xalman API error:", xalmanError.message);
    }

    // SECOND TRY: ShadowX Downloader API (Fallback)
    if (!downloadSuccess) {
      try {
        console.log("📥 Trying ShadowX Downloader API...");
        
        const downloaderApiURL = `${DOWNLOADER_API}/dl?url=${encodeURIComponent(url)}&key=${API_KEY}`;
        console.log("📥 Downloader URL:", downloaderApiURL);
        
        const { data: downloaderData } = await axios.get(downloaderApiURL, { timeout: 20000 });
        
        if (downloaderData.success && downloaderData.download_url) {
          downloadUrl = downloaderData.download_url || downloaderData["Download url"];
          if (!metadata) {
            metadata = {
              title: downloaderData.title || "YouTube Video",
              duration: downloaderData.duration || "N/A",
              channel: downloaderData.uploader || "N/A",
              views: downloaderData.view_count || downloaderData.views || "0"
            };
          }
          apiSource = "ShadowX-Downloader";
          downloadSuccess = true;
          console.log("✅ ShadowX Downloader API success!");
        }
      } catch (downloaderError) {
        console.error("❌ ShadowX Downloader API error:", downloaderError.message);
      }
    }

    if (!downloadSuccess || !downloadUrl) {
      throw new Error("All download methods failed. Please try again later.");
    }

    await downloadAndSendFile(downloadUrl, metadata, type, message, waitMsgID, apiSource);

  } catch (err) {
    console.error("Download failed:", err.message);
    try { await message.unsend(waitMsgID); } catch (e) {}
    message.reply(`❌ Download failed: ${err.message}`);
  }
}

async function downloadAndSendFile(downloadUrl, metadata, type, message, waitMsgID, apiSource) {
  try {
    const fileExtension = type === "audio" ? "mp3" : "mp4";
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = path.join(__dirname, "cache", fileName);

    console.log("Downloading from:", downloadUrl);
    
    const res = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      }
    });

    const writer = fs.createWriteStream(filePath);
    res.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    try { await message.unsend(waitMsgID); } catch (e) {}

    const fileSize = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
    
    const title = metadata?.title || "YouTube Media";
    const channel = metadata?.channel || "N/A";
    const duration = metadata?.duration || "N/A";
    const views = metadata?.views ? formatViews(metadata.views) : "N/A";
    
    let body = `🎵 ${title}\n`;
    body += `📺 Channel: ${channel}\n`;
    body += `⏱ Duration: ${duration}\n`;
    body += `👁 Views: ${views}\n`;
    body += `📦 Size: ${fileSize}MB\n`;
    body += `🔧 API: ${apiSource}\n\n`;
    body += `🔰 Made by Siam Ahmed Saan`;

    await message.reply({
      body: body,
      attachment: fs.createReadStream(filePath)
    });

    fs.unlinkSync(filePath);

  } catch (err) {
    console.error("Download and send error:", err.message);
    throw err;
  }
}
