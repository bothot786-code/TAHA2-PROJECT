const axios = require('axios');
const baseApiUrl = async () => {
    return "https://noobs-api.top/dipto";
};

const utils = {
    monospace: (text) => {
        const monospaceMap = {
            'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝',
            'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧',
            'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
            'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷',
            'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁',
            'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
            '0': '𝟶', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
        };
        return text.split('').map(char => monospaceMap[char] || char).join('');
    },
    realMention: (name, uid, message) => { 
        const finalMessage = `『 ${name} 』\n\n${message}`; 
        return { body: finalMessage, mentions: [{ tag: name, id: uid }] }; 
    }, 
    normalMention: (name, uid, message) => { 
        return { body: message, mentions: [{ tag: name, id: uid }] }; 
    }, 
    getRandomGreeting: () => { 
        const greetings = [""]; 
        return greetings[Math.floor(Math.random() * greetings.length)]; 
    }
};

module.exports.config = {
    name: "baby",
    aliases: ["bby", "bot"],
    version: "10.1",
    author: "dipto cdi | Siam Ahmed Saan",
    countDown: 0,
    role: 0,
    description: "Dipto ki taraf se tamam simsimi api se behtar bot",
    category: "chat",
    guide: {
        en: "{pn} [koiBhiMessage] YA\nteach [AapkaMessage] - [Jawab1], [Jawab2], [Jawab3]... YA\nteach [react] [AapkaMessage] - [react1], [react2], [react3]... YA\nremove [AapkaMessage] YA\nrm [AapkaMessage] - [indexNumber] YA\nmsg [AapkaMessage] YA\nlist YA \nall YA\nedit [AapkaMessage] - [NayaMessage]"
    }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const link = `${await baseApiUrl()}/baby`;
    const xalman = args.join(" ").toLowerCase();
    const uid = event.senderID;
    const senderName = (await usersData.getName(uid)) || "User";

    try {
        if (!args[0]) {
            const ran = ["", "", "", ""];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }
        if (args[0] === 'remove') {
            const fina = xalman.replace("remove ", "");
            const dat = (await axios.get(`${link}?remove=${encodeURIComponent(fina)}&senderID=${uid}`)).data.message;
            return api.sendMessage(dat, event.threadID, event.messageID);
        }
        if (args[0] === 'rm' && xalman.includes('-')) {
            const [fi, f] = xalman.replace("rm ", "").split(/\s*-\s*/);
            const da = (await axios.get(`${link}?remove=${encodeURIComponent(fi)}&index=${f}`)).data.message;
            return api.sendMessage(da, event.threadID, event.messageID);
        }
        if (args[0] === 'list') {
            if (args[1] === 'all') {
                const data = (await axios.get(`${link}?list=all`)).data;
                const limit = parseInt(args[2]) || 100;
                const limited = data?.teacher?.teacherList?.slice(0, limit);
                const teachers = await Promise.all(limited.map(async (item) => {
                    const number = Object.keys(item)[0];
                    const value = item[number];
                    const name = await usersData.getName(number).catch(() => number) || "Nahi mila";
                    return { name, value };
                }));
                teachers.sort((a, b) => b.value - a.value);
                const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
                return api.sendMessage(`= \n${output}`, event.threadID, event.messageID);
            } else {
                const d = (await axios.get(`${link}?list=all`)).data;
                return api.sendMessage(`❇️ | Kul Seekh = ${d.length || "api band hai"}\n♻️ | Kul Jawab = ${d.responseLength || "api band hai"}`, event.threadID, event.messageID);
            }
        }
        if (args[0] === 'msg') {
            const fuk = xalman.replace("msg ", "");
            const d = (await axios.get(`${link}?list=${encodeURIComponent(fuk)}`)).data.data;
            return api.sendMessage(`Message ${fuk} = ${d}`, event.threadID, event.messageID);
        }
        if (args[0] === 'edit') {
            const parts = xalman.split(/\s*-\s*/);
            if (parts.length < 2) return api.sendMessage('❌ | Ghalat tareeqa! Istemaal karein: edit [AapkaMessage] - [NayaReply]', event.threadID, event.messageID);
            const dA = (await axios.get(`${link}?edit=${encodeURIComponent(args[1])}&replace=${encodeURIComponent(parts[1])}&senderID=${uid}`)).data.message;
            return api.sendMessage(`Tabdeel ho gaya: ${dA}`, event.threadID, event.messageID);
        }
        if (args[0] === 'teach' && args[1] === 'react') {
            const parts = xalman.replace("teach react ", "").split(/\s*-\s*/);
            if (parts.length < 2) return api.sendMessage('❌ | Ghalat tareeqa! Istemaal karein: teach react message - ❤️, 😀', event.threadID, event.messageID);
            const msg = parts[0].trim();
            const reacts = parts[1].trim();
            const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&react=${encodeURIComponent(reacts)}`);
            return api.sendMessage(`✅ Reacts shamil kar diye gaye: ${res.data.message}`, event.threadID, event.messageID);
        }
        if (args[0] === 'teach' && args[1] === 'amar') {
            const parts = xalman.split(/\s*-\s*/);
            if (parts.length < 2) return api.sendMessage('❌ | Ghalat tareeqa! Istemaal karein: teach amar message - reply', event.threadID, event.messageID);
            const msg = parts[0].replace("teach amar ", "").trim();
            const reply = parts[1].trim();
            const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&senderID=${uid}&reply=${encodeURIComponent(reply)}&key=intro`);
            return api.sendMessage(`✅ Taarufi jawab shamil ho gaya: ${res.data.message}`, event.threadID, event.messageID);
        }
        if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
            const parts = xalman.split(/\s*-\s*/);
            if (parts.length < 2) return api.sendMessage('❌ | Ghalat tareeqa! Istemaal karein: teach message - reply1, reply2', event.threadID, event.messageID);
            const msg = parts[0].replace("teach ", "").trim();
            const replies = parts[1].trim();
            const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&reply=${encodeURIComponent(replies)}&senderID=${uid}&threadID=${event.threadID}`);
            const teacherName = (await usersData.get(res.data.teacher)).name || "Anjaan";
            const outputMessage = utils.monospace(`✅ Jawab shamil ho gaya: ${res.data.message}\n👤 Ustaad: ${teacherName}\n📚 Kul Teachs: ${res.data.teachs}`);
            return api.sendMessage(outputMessage, event.threadID, event.messageID);
        }

        const resData = (await axios.get(`${link}?text=${encodeURIComponent(xalman)}&senderID=${uid}`)).data.reply;
        const replyText = utils.monospace(resData);
        api.sendMessage(replyText, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, type: "reply", messageID: info.messageID, author: event.senderID, apiUrl: link });
        }, event.messageID);

    } catch (e) {
        console.log(e);
        api.sendMessage("Console check karein error ke liye", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    try {
        if (event.type == "message_reply") {
            const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(event.body?.toLowerCase())}&senderID=${event.senderID}`)).data.reply;
            const replyText = utils.monospace(a);
            await api.sendMessage(replyText, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, type: "reply", messageID: info.messageID, author: event.senderID });
            }, event.messageID);
        }
    } catch (err) {
        return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    }
};

module.exports.onChat = async ({ api, event, usersData }) => {
    try {
        const body = event.body ? event.body.toLowerCase() : "";
        if (body.startsWith("baby") || body.startsWith("bot") || body.startsWith("hinata") || body.startsWith("mahiru") || body.startsWith("bby") || body.startsWith("jan") || body.startsWith("babu") || body.startsWith("alya")) {
            const arr = body.replace(/^\S+\s*/, "");
            const uid = event.senderID;
            const senderName = (await usersData.getName(uid)) || "User";
            const baseReplies = [
                "𝗢𝗶𝗶-Mama mat bula please, 32 tareekh ko meri shadi hai! 🫣💃🏻", 
                "Kitne din ho gaye bistar pe nahi moota, miss karta hu bachpan ke din 🥺🥀", 
                "🍺_Yeh lo juice piyo, baby bol bol ke thak gaye ho na? 🤗", 
                "Nahi sunungi 😼 tumne mujhe kisi se set nahi karwaya 🥺 gande ho tum 🥺",
                "Chaudhry saab main ghareeb ho sakta hu 😾🤭 lekin ameer nahi 🥹😐", 
                "Tumhare bina bohot udaas lagta hai 💔", 
                "Thoda muskurao na, tumhari muskaan bohot achhi lagti hai 💕", 
                "Tumhein bohot miss kar raha hu pata hai? 🥺",
                "Tumhare liye roz dua karta hu ❤️", 
                "Tumhein pa kar main bohot khush-naseeb hu 😇", 
                "Tumhare chehre par hamesha meethi muskaan rahe ✨", 
                "Tumse bohot pyar karta hu pagal 💝",
                "Tum meri zindagi ke sabse khoobsurat insan ho 🌸", 
                "Tum jaisa dost pa kar main dhanya ho gaya 🙏", 
                "Tumhare baare mein soch kar dil ko sukoon milta hai 🕊️", 
                "Tum meri sabse best crush ho 💘",
                "Tumhare liye main hamesha hazir hu 🤗", 
                "Tum meri dhadkan ho 💓", 
                "Tumhari yaadein meri aankhon mein rehti hain 🌙", 
                "Yaqeen hota hai ke Allah ne tumhein mere liye hi banaya hai 🤲"
            ];

            if (!arr) {
                const randomReply = baseReplies[Math.floor(Math.random() * baseReplies.length)];
                const mentionObj = utils.realMention(senderName, uid, randomReply);
                await api.sendMessage(mentionObj, event.threadID, (error, info) => {
                    if (info) {
                        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, type: "reply", messageID: info.messageID, author: event.senderID });
                    }
                }, event.messageID);
                return;
            }
            const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}`)).data.reply;
            const replyText = utils.monospace(a);
            await api.sendMessage(replyText, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, type: "reply", messageID: info.messageID, author: event.senderID });
            }, event.messageID);
        }
    } catch (err) {
        console.error("onChat Error:", err);
    }
};
