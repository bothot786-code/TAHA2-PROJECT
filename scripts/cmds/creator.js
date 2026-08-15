const { writeFileSync, readFileSync } = require("fs");
const path = require("path");

module.exports = {
    config: {
        name: "creator",
        aliases: ["ctr"],
        version: "0.0.7",
        author: "Siam Ahmed Saan",
        role: 6,
        shortDescription: { en: "Add, remove or view bot creators" },
        longDescription: { en: "Manage bot creators — add/remove/view" },
        category: "owner",
        guide: { en:
`Usage:
{pn} list
{pn} add <uid|tag|reply|@mention>
{pn} remove <uid|tag|reply|@mention>` }
    },

    langs: {
        en: {
            usageGuide: `⚠️ 𝐔𝐬𝐚𝐠𝐞 𝐆𝐮𝐢𝐝𝐞
➥ {pn} list
➥ {pn} add @mention
➥ {pn} remove @mention`,
            listCreator: `[ 👑 𝐂𝐫𝐞𝐚𝐭𝐨𝐫𝐬 ]\n%1\n`,
            noCreator: "⚠️ 𝐍𝐨 𝐟𝐨𝐮𝐧𝐝!",
            added: `[ ✅ 𝐀𝐝𝐝𝐞𝐝 ]\n%2\n`,
            alreadyCreator: `[ ⚠️ 𝐀𝐥𝐫𝐞𝐚𝐝𝐲 𝐂𝐫𝐞𝐚𝐭𝐨𝐫 ]\n%2\n`,
            removed: `[ ❌ 𝐑𝐞𝐦𝐨𝐯𝐞𝐝 ]\n%2\n`,
            notCreator: `[ ⚠️ 𝐍𝐨𝐭 𝐂𝐫𝐞𝐚𝐭𝐨𝐫 ]\n%2\n`,
            missingIdAdd: "⚠️ 𝐓𝐚𝐠/𝐑𝐞𝐩𝐥𝐲/𝐔𝐈𝐃/mention needed to add creator.",
            missingIdRemove: "⚠️ 𝐓𝐚𝐠/𝐑𝐞𝐩𝐥𝐲/𝐔𝐈𝐃/mention needed to remove creator.",
            notAllowed: "⛔ 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐚𝐥𝐥𝐨𝐰𝐞𝐝 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬!"
        }
    },

    onStart: async function ({ message, args, event, api, getLang, prefix }) {
        const senderID = event.senderID;

        const configPath = global.client.dirConfig || path.join(process.cwd(), "config.json");
        let configData;

        try {
            configData = JSON.parse(readFileSync(configPath, "utf8"));
        } catch (e) {
            configData = {};
        }

        if (!configData.creator) {
            configData.creator = [];
        }

        if (!args || args.length === 0) {
            const usage = getLang("usageGuide")
                .replace(/{pn}/g, `${prefix}${this.config.name}`);
            return message.reply(usage);
        }

        const formatCreator = async (uid) => {
            try {
                const userInfo = await api.getUserInfo(uid);
                const name = userInfo[uid]?.name || "Unknown";
                return `┋➥ • ${name}\n┋➥ • (${uid})`;
            } catch (e) {
                return `┋➥ • User\n┋➥ • (${uid})`;
            }
        };

        if (args[0] === "list" || args[0] === "-l") {
            const list = await Promise.all((configData.creator || []).map(formatCreator));
            if (!list.length) return message.reply(getLang("noCreator"));
            return message.reply(getLang("listCreator", list.join("\n")));
        }

        if (!configData.creator.includes(senderID)) {
            return message.reply(getLang("notAllowed"));
        }

        let uids = [];
        if (Object.keys(event.mentions || {}).length) {
            uids = Object.keys(event.mentions);
        } else if (event.messageReply) {
            uids = [event.messageReply.senderID];
        } else {
            uids = args.slice(1).filter(a => !isNaN(a));
        }

        if (!uids.length) {
            if (args[0] === "add") {
                const usage = getLang("usageGuide").replace(/{pn}/g, `${prefix}${this.config.name}`);
                return message.reply(getLang("missingIdAdd") + "\n\n" + usage);
            }
            if (args[0] === "remove") {
                const usage = getLang("usageGuide").replace(/{pn}/g, `${prefix}${this.config.name}`);
                return message.reply(getLang("missingIdRemove") + "\n\n" + usage);
            }
            const usage = getLang("usageGuide").replace(/{pn}/g, `${prefix}${this.config.name}`);
            return message.reply(usage);
        }

        const added = [];
        const removed = [];
        const existed = [];
        const notFound = [];

        for (const uid of uids) {
            const index = configData.creator.indexOf(uid);

            if (args[0] === "add") {
                if (index !== -1) existed.push(uid);
                else {
                    configData.creator.push(uid);
                    added.push(uid);
                }
            } else if (args[0] === "remove") {
                if (index === -1) notFound.push(uid);
                else {
                    configData.creator.splice(index, 1);
                    removed.push(uid);
                }
            } else {
                const usage = getLang("usageGuide").replace(/{pn}/g, `${prefix}${this.config.name}`);
                return message.reply(usage);
            }
        }

        writeFileSync(configPath, JSON.stringify(configData, null, 2));

        const formatUsers = async (uids) => {
            const results = await Promise.all(
                uids.map(async uid => {
                    try {
                        const userInfo = await api.getUserInfo(uid);
                        const name = userInfo[uid]?.name || "User";
                        return `┋➥ • ${name}\n┋➥ • (${uid})`;
                    } catch (e) {
                        return `┋➥ • ${uid}`;
                    }
                })
            );
            return results.join("\n");
        };

        let msg = "";
        if (added.length) {
            const userList = await formatUsers(added);
            msg += getLang("added").replace(/%2/g, userList) + "\n";
        }
        if (removed.length) {
            const userList = await formatUsers(removed);
            msg += getLang("removed").replace(/%2/g, userList) + "\n";
        }
        if (existed.length) {
            const userList = await formatUsers(existed);
            msg += getLang("alreadyCreator").replace(/%2/g, userList) + "\n";
        }
        if (notFound.length) {
            const userList = await formatUsers(notFound);
            msg += getLang("notCreator").replace(/%2/g, userList) + "\n";
        }

        return message.reply(msg.trim() || getLang("usageGuide").replace(/{pn}/g, `${prefix}${this.config.name}`));
    }
};
