module.exports = {
  config: {
    name: "dice",
    version: "1.7",
    author: "xnil6x",
    shortDescription: "🎲 Dice Game | Bet & win coins!",
    longDescription: "Bet coins and roll the dice. Dice value decides your fate. No need to guess!",
    category: "Game",
    guide: {
      en: "{p}dice <bet amount>\nExample: {p}dice 1000"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID } = event;
    const userData = await usersData.get(senderID);

    if (!userData || userData.money === undefined) {
      return api.sendMessage("❌ Account issue! Please try again later.", threadID);
    }

    const betAmount = parseInt(args[0]);

    if (isNaN(betAmount) || betAmount <= 0) {
      return api.sendMessage("⚠️ Invalid usage!\nUse like: {p}dice <bet amount>\nExample: {p}dice 1000", threadID);
    }

    

    if (betAmount > userData.money) {
      return api.sendMessage(`❌ You only have ${formatMoney(userData.money)} coins!`, threadID);
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    let resultMessage = `🎲 Dice rolled: ${diceRoll}\n`;
    let winAmount = 0;

    switch (diceRoll) {
      case 1:
      case 2:
        winAmount = -betAmount;
        resultMessage += `❌ You lost!\nLost: ${formatMoney(betAmount)} coins`;
        break;
      case 3:
        winAmount = betAmount * 2;
        resultMessage += `✅ You won DOUBLE!\nWon: +${formatMoney(winAmount)} coins`;
        break;
      case 4:
      case 5:
        winAmount = betAmount * 3;
        resultMessage += `✅ You won TRIPLE!\nWon: +${formatMoney(winAmount)} coins`;
        break;
      case 6:
        winAmount = betAmount * 10;
        resultMessage += `🎉 JACKPOT! Rolled 6\nWon: +${formatMoney(winAmount)} coins`;
        break;
    }

    await usersData.set(senderID, {
      money: userData.money + winAmount
    });

    return api.sendMessage(resultMessage, threadID);
  }
};

// Money formatting function
function formatMoney(num) {
  if (num >= 1e15) return (num / 1e15).toFixed(2).replace(/\.00$/, "") + "Q";
  if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, "") + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, "") + "K";
  return num.toString();
}
