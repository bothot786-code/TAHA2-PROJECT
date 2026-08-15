const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "say",
		version: "1.2",
		author: "Toshiro Editz",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Text to Speech"
		},
		longDescription: {
			en: "Generate speech from text"
		},
		category: "media",
		guide: {
			en: "{pn} <text>\n{pn} <text> - <lang>\n\nExamples:\n{pn} Hello\n{pn} Hi - bn\n{pn} Hello Isagi - ja\n{pn} नमस्ते - hi"
		}
	},

	onStart: async function ({ event, args, message }) {
		if (!args.length)
			return message.reply(
				"Usage:\n.say <text>\n.say <text> - <lang>\n\nExamples:\n.say Hello\n.say Hi - bn\n.say Hello Isagi - ja"
			);

		let input = args.join(" ").trim();

		let lang = "en";
		let text = input;

		const match = input.match(/^(.*?)\s*-\s*([a-z]{2})$/i);

		if (match) {
			text = match[1].trim();
			lang = match[2].toLowerCase();
		}

		if (!text)
			return message.reply("Please provide some text.");

		const cacheDir = path.join(__dirname, "cache");
		await fs.ensureDir(cacheDir);

		const filePath = path.join(
			cacheDir,
			`say_${event.senderID}_${Date.now()}.mp3`
		);

		try {
			const res = await axios({
				method: "GET",
				url: `https://toshiro-api-editz6t9.vercel.app/api/tools/sayv2?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`,
				responseType: "arraybuffer",
				validateStatus: () => true
			});

			const contentType = res.headers["content-type"] || "";

			if (contentType.includes("application/json")) {
				const data = JSON.parse(Buffer.from(res.data).toString("utf8"));
				return message.reply(data.message || "Request failed.");
			}

			await fs.writeFile(filePath, Buffer.from(res.data));

			await message.reply({
				body: `🗣️ Language: ${lang}`,
				attachment: fs.createReadStream(filePath)
			});

			fs.unlink(filePath, () => {});
		}
		catch (err) {
			console.error(err);
			message.reply("Failed to generate speech.");
		}
	}
};
