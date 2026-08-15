module.exports = {
  config: {
    name: "autoreact",
    version: "4.4.0",
    author: "Anik Islam Sadik",
    role: 0,
    category: "system",
    shortDescription: "Auto react (emoji + text)",
    longDescription: "Stable auto reaction without silent API fail"
  },
  onStart: async function () {},
  onChat: async function ({ api, event }) {
    try {
      const { messageID, body, senderID, threadID } = event;
      if (!messageID || !body) return;
      if (senderID === api.getCurrentUserID()) return;
      global.__autoReactCooldown ??= {};
      if (
        global.__autoReactCooldown[threadID] &&
        Date.now() - global.__autoReactCooldown[threadID] < 2500
      ) return;
      global.__autoReactCooldown[threadID] = Date.now();
      const text = body.toLowerCase();
      let react = null;
      const categories = [
        { e: ["😂","🤣","😆","😄","😁"], r: "😆" },
        { e: ["😭","😢","🥺","💔"], r: "😢" },
        { e: ["❤️","💖","💘","🥰","😍"], r: "❤️" },
        { e: ["😡","🤬"], r: "😡" },
        { e: ["😮","😱","😲"], r: "😮" },
        { e: ["😎","🔥","💯"], r: "😎" },
        { e: ["👍","👌","🙏"], r: "👍" },
        { e: ["🖕","🥒","👃"], r: "🖕" },
        { e: ["🎉","🥳"], r: "🎉" }
      ];
      const texts = [
        { k: ["haha","lol","moja","xd","bal"], r: "😆" },
        { k: ["sad","kharap","kosto","mon kharap","cry"], r: "😢" },
        { k: ["love","valobasi","miss","alya","hinata","baby","bot","jan","bby"], r: "🥹" },
        { k: ["rag","angry","rage"], r: "😡" },
        { k: ["wow","omg"], r: "😮" },
        { k: ["prefix"], r: "🤖" },
        { k: ["ok","yes","okay","hmm"], r: "✅" },
        { k: ["cmd"], r: "🔖"},
        { k: ["cdi","fuck","xdi","fk","chudi"], r: "🖕" },
        { k: ["hlw","hellow","hey"], r: "😸" },
        { k: ["fork","repo","repository"], r: "🍴" },
        { k: ["alhamdulillah","valo","sweet","cute","beautiful"], r: "🥰" },
        { k: ["birthday","birth","cake","happy birthday"], r: "🎂" },
        { k: ["thanks","tnx","thank you","wlc","welcome"], r: "🦋" },
        { k: ["good night","night","gn"], r: "💤" },
        { k: ["good morning","morning","gm"], r: "🥱" },
      ];
      for (const c of categories) {
        if (c.e.some(x => text.includes(x))) {
          react = c.r;
          break;
        }
      }
      if (!react) {
        for (const t of texts) {
          if (t.k.some(x => text.includes(x))) {
            react = t.r;
            break;
          }
        }
      }
      if (!react) return;
      await new Promise(r => setTimeout(r, 800));
      api.setMessageReaction(react, messageID, threadID);
    } catch (e) {}
  }
};
