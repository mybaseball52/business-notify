require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const lineHelper = require("./services/line-helper");
let app = express();
let moment = require("moment-timezone");
const bodyParser = require('body-parser');
const sheetHelper = require("./services/google/google-sheet-helper");
const DATA_RANGE = process.env.DATA_RANGE;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

async function readFromGoogleSheet(dataRange) {
  let s = new sheetHelper("1gEr2nDrfwPIj25DSDgYGEmly-V89im18Kq70hWXe6u4");
  await s.getAuthorize();
  let l = await s.ReadDataFrom(dataRange);
  let r = l.map((a) => { return new Date(`${a[1].split('/')[0]}-${a[1].split('/')[1]}-${a[1].split('/')[2]}`); });
  let t = l.map((a) => { return a[0]; });

  return {
      titleList: t,
      dateList: r
  };
}

/* 
 * 讀書會 schedule events 
 */
// 0 10 * * * => PM 6:00 at Taipei/Asia
cron.schedule('0 10 * * *', async () => {
  console.log("notify at PM 6:00 in Taiwan");
  try {
    let scheduleDates = await readFromGoogleSheet(DATA_RANGE)

    let now = moment().tz("Asia/Taipei").format("YYYYMMDD");
    scheduleDates = scheduleDates.dateList.filter((a) => { return moment(a).isAfter(now) });

    if (scheduleDates !== "") {
        lineHelper.notify("Cf4f166dac19ea479efdfcad6d1089843");
    }

  } catch (e) {
    console.log(e);
  }
});

app.get('/', async function (req, res) {
  let now = moment().tz("Asia/Taipei").format("YYYYMMDD");
  let ret = await readFromGoogleSheet(DATA_RANGE)
  scheduleDates = ret.dateList.filter((a) => { return moment(a).isAfter(now) });

  res.json(scheduleDates)
});

const handleEvent = event => {
    console.log('live')
  };
  
app.post('/webhook', (req, res) => {
    const { body } = req;
    const { events } = body;
  
    Promise.all(events.map(handleEvent))
      .then(result => res.status(200).send(result))
      .catch(err => console.log(err));
  });

module.exports = app;