const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "gpt",
    aliases: ["gptimg"],
    version: "4.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "AI Image Generator",
    category: "ai"
  },

  onStart: async function ({ message, args, event, api }) {
    try {

      const prompt = args.join(" ");

      if (!prompt && event.type !== "message_reply") {
        return message.reply("❌ Give prompt or reply image");
      }

      let imageUrl = "";

      if (event.type === "message_reply") {
        const att = event.messageReply.attachments?.[0];
        if (att?.type === "photo") {
          imageUrl = att.url;
        }
      }

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const apiUrl = imageUrl
        ? `https://xalman-apis.vercel.app/api/gptimg?prompt=${encodeURIComponent(prompt)}&image_url=${encodeURIComponent(imageUrl)}`
        : `https://xalman-apis.vercel.app/api/gptimg?prompt=${encodeURIComponent(prompt)}`;

      const img = await axios({
        url: apiUrl,
        method: "GET",
        responseType: "arraybuffer"
      });

      const trashDir = path.join(__dirname, "cache", "trash");
      fs.ensureDirSync(trashDir);

      const filePath = path.join(trashDir, `gpt_${Date.now()}.jpg`);

      fs.writeFileSync(filePath, img.data);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      const caption = imageUrl
        ? `━━━━━━━━━━━━━━━\n✨ 𝗘𝗗𝗜𝗧𝗘𝗗 𝗜𝗠𝗔𝗚𝗘\n━━━━━━━━━━━━━━━\n🎨 ${prompt}\n━━━━━━━━━━━━━━━`
        : `━━━━━━━━━━━━━━━\n🌟 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗘𝗗 𝗜𝗠𝗔𝗚𝗘\n━━━━━━━━━━━━━━━\n🎨 ${prompt}\n━━━━━━━━━━━━━━━`;

      await message.reply({
        body: caption,
        attachment: fs.createReadStream(filePath)
      });

     
      setTimeout(() => {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
      }, 3000);

    } catch (err) {
      console.log(err);

      api.setMessageReaction("❌", event.messageID, () => {}, true);

      return message.reply(
        "━━━━━━━━━━━━━━━\n" +
        "❌ 𝗘𝗥𝗥𝗢𝗥 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗜𝗢𝗡\n" +
        "━━━━━━━━━━━━━━━\n" +
        "⚠️ Try again later\n" +
        "━━━━━━━━━━━━━━━"
      );
    }
  }
};
