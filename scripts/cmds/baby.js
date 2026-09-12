const utils = {
    realMention: (name, uid, message) => { 
        const finalMessage = `『 ${name} 』\n\n${message}`; 
        return { body: finalMessage, mentions: [{ tag: name, id: uid }] }; 
    }
};

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
    "Yaqeen hota hai ke Allah ne tumhein mere liye hi banaya hai 🤲",
    "Suno na! Thoda paas toh aao, ek secret batana hai 🫣🤫",
    "Zyada hero mat bano, warna abhi chocolate chheen lunga 🍫😜",
    "Aap itne pyare kyun ho? Koi offline jaa ke bataye 🙈❤️",
    "Ghar walon ko bol do, rista pakka karne aa raha hu 💍👀",
    "Kahan gaib rehte ho yaar? Dil udaas ho jata hai 🥺💔",
    "Aapki awaaz sunne ko dil kar raha hai, voice note bhejo na 🎧✨",
    "Chai peene chaloge mere sath? ☕😌",
    "Itna gussa kyun karte ho, thoda sa pyar bhi kar lo 🥺❤️",
    "Main to sirf tumhara hu, chahe kitne bhi log bula lein 😼💖",
    "Oye hoye! Aaj to bada chamak rahe ho ✨😉",
    "Aap meri DP par likes count kar rahe the kya? 😜📸",
    "Mujhe bhool toh nahi jaoge na baad mein? 🥺🥀",
    "Pata hai tumhare message ka wait kar raha tha kab se 🕒❤️",
    "Dil garden garden ho gaya aapko dekh kar 🌸😍",
    "Kitna bhao khate ho yaar! Thoda meetha bhi khaya karo 🍰😝",
    "Sirf mera message dekhte ho ya dil se bhi yaad karte ho? 💭💘",
    "Aaj ka din bohot achha gaya kyunki aap se baat ho gayi 🥰✨",
    "Acha suno, thoda muskura do warna raat ko sapne me aaoon ga 👻🤪",
    "Aapki smile kitni killer hai, maafi chaho toh jaan le lo 💘😜",
    "Mera balance khatam ho gaya, apna contact number dedo 📲😉",
    "Janeman thoda ignore kam karo na, dil dukhta hai 🥺💔",
    "Khatarnak lag rahe ho aaj toh! 🙈🔥",
    "Aapki waja se hi toh group me raunaq hai ✨🥳",
    "Khana khaya aapne? Apni sehat ka khayal rakha karo ❤️🍲",
    "Bolo kya chahiye? Jaan mangoge toh woh bhi hazir hai 😇💖",
    "Main smart hoon na? Mujhe pata hai aap bhi yahi soch rahe the 🤭✨",
    "Dosti gehri honi chahiye, batain to koi bhi kar leta hai 🤝💫",
    "Hum to bane hi aapke liye hain, koi aur raasta hi nahi 🙈💓",
    "Khush raha karo, aapki khushi se meri duniya me rang hain 🌈🥰",
    "Subah se shaam tak sirf aapka hi khayal rehta hai 💭🌸"
];

module.exports.config = {
    name: "baby",
    aliases: ["bby", "bot", "babu", "jan"],
    version: "12.0",
    author: "Taha Khan",
    countDown: 0,
    role: 0,
    description: "Pure BaseReplies Auto-Mention Bot",
    category: "chat",
    guide: {
        en: "{pn} or trigger words (bot, baby, jan, etc.)"
    }
};

module.exports.onStart = async ({ api, event, usersData }) => {
    const uid = event.senderID;
    const senderName = (await usersData.getName(uid)) || "User";
    const randomReply = baseReplies[Math.floor(Math.random() * baseReplies.length)];
    const mentionObj = utils.realMention(senderName, uid, randomReply);
    return api.sendMessage(mentionObj, event.threadID, event.messageID);
};

module.exports.onReply = async ({ api, event, usersData }) => {
    const uid = event.senderID;
    const senderName = (await usersData.getName(uid)) || "User";
    const randomReply = baseReplies[Math.floor(Math.random() * baseReplies.length)];
    const mentionObj = utils.realMention(senderName, uid, randomReply);
    return api.sendMessage(mentionObj, event.threadID, event.messageID);
};

module.exports.onChat = async ({ api, event, usersData }) => {
    try {
        const body = event.body ? event.body.toLowerCase().trim() : "";
        const triggers = ["baby", "bot", "bby", "babu", "jan", "simi"];

        const isTriggered = triggers.some(t => body === t || body.startsWith(t + " "));

        if (isTriggered) {
            const uid = event.senderID;
            const senderName = (await usersData.getName(uid)) || "User";
            const randomReply = baseReplies[Math.floor(Math.random() * baseReplies.length)];
            const mentionObj = utils.realMention(senderName, uid, randomReply);

            if (api.setMessageReaction) {
                api.setMessageReaction("❤️", event.messageID, () => {}, true);
            }

            await api.sendMessage(mentionObj, event.threadID, (error, info) => {
                if (info && global.GoatBot?.onReply) {
                    global.GoatBot.onReply.set(info.messageID, { 
                        commandName: this.config.name, 
                        type: "reply", 
                        messageID: info.messageID, 
                        author: event.senderID 
                    });
                }
            }, event.messageID);
        }
    } catch (err) {
        console.error("onChat Error:", err);
    }
};
