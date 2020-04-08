let model = {};
const LineBot = require("./linebot/line_init");

/**
 * 
 * @param {string} lineIDs - 推播訊息
 * @param {object} data - 
 */

model.notify = async function (ID, title) {
  await LineBot.pushText(ID, `Robot提醒 今晚有研討會喔！`);
}

module.exports = model;
