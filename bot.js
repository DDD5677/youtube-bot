const { Telegraf } = require("telegraf");
const app = require("express")();
const fileupload = require("express-fileupload");
require("dotenv").config();
const TOKEN = process.env.BOT_TOKEN;
const fs = require("fs");
const ytdl = require("ytdl-core");
const helpMessage = `
/start - Botga start berish
/help - buyruqlar ro'yhati 
Bizning telegram kanal https://t.me/soul_channels`;
let oneTimes = false;

const bot = new Telegraf(TOKEN);
app.use(
   fileupload({
      useTempFiles: true,
      tempFileDir: "/tmp",
   })
);
const randomName = Math.floor(Math.random() * 100);
bot.start(async (ctx) => {
   const full_name = ctx.message.from.first_name;
   await ctx.reply(
      `Assalomu alaykum <b>${full_name}</b> botimizga xush kelibsiz. Botga youtube link yuboring men yuklab beraman.`,
      {
         parse_mode: "HTML",
      }
   );
   ctx.reply(helpMessage);
});
bot.help((ctx) => {
   ctx.reply(helpMessage);
});
bot.on("message", async (ctx) => {
   try {
      ctx.state.finished = false;
      if (ytdl.validateURL(ctx.message.text)) {
         const info = await ytdl.getInfo(ctx.message.text);
         const video_title = info.videoDetails.title;
         console.log(video_title);
         const stream = ytdl(ctx.message.text, { quality: "highest" });
         stream.pipe(fs.createWriteStream(`video-${randomName}.mp4`));
         stream.once("response", () => {
            ctx.reply("Yuklash boshlandi.");
         });
         stream.on("progress", (downloaded, total) => {
            const percent = downloaded / total;

            if ((percent * 100).toFixed() == 50 && !oneTimes) {
               ctx.reply(`${(percent * 100).toFixed()}% downloaded `);
               oneTimes = true;
            } else if ((percent * 100).toFixed() == 55) {
               oneTimes = false;
            } else if ((percent * 100).toFixed() == 75 && !oneTimes) {
               ctx.reply(`${(percent * 100).toFixed()}% downloaded `);
               oneTimes = true;
            }
         });

         stream.on("end", async () => {
            try {
               ctx.reply(`Video ${video_title} jo'natilmoqda`);
               await ctx.replyWithVideo({
                  source: `video-${randomName}.mp4`,
               });
               ctx.state.finished = true;
               if (ctx.state.finished) {
                  console.log("deleting file");
                  fs.unlink(`video-${randomName}.mp4`, (err) => {
                     if (err) {
                        // File deletion failed
                        console.error(err.message);
                        return;
                     }
                     console.log("File deleted successfully");
                  });
               }
            } catch (e) {
               console.log(e);
            }
         });
      } else {
         ctx.reply("Iltimos youtube linkni tekshirib qaytadan yuboring");
      }
   } catch (e) {
      console.log(e);
   }
});
if (process.env.NODE_ENV == "production") {
   bot.launch({
      webhook: {
         domain: process.env.CYCLIC_URL, // Your domain URL (where server code will be deployed)
         port: process.env.PORT || 8000,
      },
   }).then(() => {
      console.info(`The bot ${bot.botInfo.username} is running on server`);
   });
} else {
   // if local use Long-polling
   bot.launch().then(() => {
      console.info(`The bot ${bot.botInfo.username} is running locally`);
   });
}
