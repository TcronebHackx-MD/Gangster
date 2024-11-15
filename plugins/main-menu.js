import { promises as fsPromises } from "fs";
import { join } from "path";
import { xpRange } from "../lib/levelling.js";
import moment from "moment-timezone";
import os from "os";
import fetch from "node-fetch";

const defaultMenu = {
  before: `
  「 ${botname} 🎁𝚅10 」
  *%ucpn*

⍟🇬 🇦 🇳 🇬 🇸 🇹 🇪 🇷 

╭─────────────────⦿
┃   🔰〘 𝙄𝙉𝙁𝙊 〙🔰
╰┬────────────────⦿
┌┤
┃
┃ *_𝐅𝐎𝐔𝐍𝐃𝐄𝐑_*: 𝐓𝐂𝐑𝐎𝐍𝐄𝐁 𝐇𝐀𝐂𝐊𝐗
┃ *_𝐁𝐎𝐓 𝐍𝐀𝐌𝐄_*: ${botname}
┃ *_𝐌𝐎𝐃𝐄_*: %mode
┃ *_𝐇𝐎𝐒𝐓_*: 𝐖𝐓𝐅 𝐓𝐄𝐑𝐌𝐔𝐗
┃ *_𝐓𝐘𝐏𝐄_*: 𝐁𝐀𝐈𝐋𝐄𝐘𝐒
┃ *_𝐁𝐀𝐈𝐋𝐄𝐘𝐒_*: 𝐌𝐔𝐋𝐓𝐈 𝐃𝐄𝐕𝐈𝐂𝐄
┃ *_𝐏𝐑𝐄𝐅𝐈𝐗_*: [ *%_p* ]
┃ *_𝐔𝐏𝐓𝐈𝐌𝐄_*: %muptime
┃ *_𝐃𝐀𝐓𝐀𝐁𝐀𝐒𝐄_*: %totalreg
┃
╰──────────────────⦿
╭──────────────────⦿
┃    🔰〘 𝙄𝙉𝙁𝙊 𝘾𝙈𝘿  〙🔰
╰┬─────────────────⦿
┌┤     
┃
┃ *_%totalfeatures_* Commands
┃
╰──────────────────⦿
╭──────────────────⦿
┃   🔰〘 𝙄𝙉𝙁𝙊 〙🔰
╰┬─────────────────⦿
┌┤ *_𝙽𝙰𝙼𝙴_*: %name
┃ *_𝙶𝙾𝙻𝙳_*: %credit
┃ *_𝘙𝘖𝘓𝘌_*: 𝗚𝗮𝗻𝗴𝘀𝘁𝗲𝗿-𝙓𝙢𝘿
┃ *_𝘓𝘌𝘝𝘌𝘓_*: %level [%xp4levelup XP for level up]
┃ *_𝘟𝘗_*: %exp / %maxexp
┃ *_Total Xp_*: %totalexp
┃
╰──────────────────⦿
  `.trimStart(),
  header: "┌─⦿『 *_%category_* 』⦿",
  body: "┃⬡▸ %cmd %isPremium %islimit",
  footer: "╰─────────────────⦿",
  after: "\n%me",
};

let handler = async (m, { conn, usedPrefix: _p, __dirname, args }) => {
  await conn.sendMessage(m.chat, {
    react: {
      text: "⏳",
      key: m.key,
    },
  });

  let tags = {};
  try {
    let glb = global.db.data.users;
    let usrs = glb[m.sender];
    let tag = `@${m.sender.split("@")[0]}`;
    let mode = process.env.MODE || (global.opts["self"] ? "Private" : "Public");
    let _package = JSON.parse(await fsPromises.readFile(join(__dirname, "../package.json")).catch(() => ({}))) || {};
    
    let { age, exp, limit, level, role, registered, credit } = glb[m.sender];
    let { min, xp, max } = xpRange(level, global.multiplier);
    let name = await conn.getName(m.sender);
    let premium = glb[m.sender].premiumTime;
    let prems = premium > 0 ? "Premium" : "Free";
    let platform = os.platform();
    
    let ucpn = `${ucapan()}`;
    let _uptime = process.uptime() * 1000;
    let _muptime;
    if (process.send) {
      process.send("uptime");
      _muptime = await new Promise((resolve) => {
        process.once("message", resolve);
        setTimeout(resolve, 1000);
      }) * 1000;
    }
    let muptime = clockString(_muptime);
    let uptime = clockString(_uptime);

    let totalfeatures = Object.values(global.plugins).filter((v) => v.help && v.tags).length;
    let totalreg = Object.keys(glb).length;
    let help = Object.values(global.plugins)
      .filter((plugin) => !plugin.disabled)
      .map((plugin) => ({
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: "customPrefix" in plugin,
        limit: plugin.limit,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      }));

    for (let plugin of help) {
      if (plugin && "tags" in plugin) {
        for (let tag of plugin.tags) {
          if (!(tag in tags) && tag) tags[tag] = tag;
        }
      }
    }

    conn.menu = conn.menu || {};
    let before = conn.menu.before || defaultMenu.before;
    let header = conn.menu.header || defaultMenu.header;
    let body = conn.menu.body || defaultMenu.body;
    let footer = conn.menu.footer || defaultMenu.footer;
    let after = conn.menu.after || (conn.user.jid == global.conn.user.jid ? "" : `Powered by https://wa.me/${global.conn.user.jid.split`@`[0]}`) + defaultMenu.after;
    
    let _text = [
      before,
      ...Object.keys(tags).map((tag) => {
        return `${header.replace(/%category/g, tags[tag])}\n${
          help
            .filter((menu) => menu.tags.includes(tag) && menu.help)
            .map((menu) =>
              menu.help
                .map((help) =>
                  body
                    .replace(/%cmd/g, menu.prefix ? help : "%_p" + help)
                    .replace(/%islimit/g, menu.limit ? "Ⓛ" : "")
                    .replace(/%isPremium/g, menu.premium ? "🅟" : "")
                    .trim()
                )
                .join("\n")
            )
            .join("\n")
        }\n${footer}`;
      }),
      after,
    ].join("\n");

    let text = typeof conn.menu == "string" ? conn.menu : _text;

    const replacements = {
      "%": "%",
      p: _p,
      uptime,
      muptime,
      me: conn.getName(conn.user.jid),
      npmname: _package.name,
      npmdesc: _package.description,
      version: _package.version,
      exp: exp - min,
      maxexp: xp,
      totalexp: exp,
      xp4levelup: max - exp,
      github: _package.homepage ? _package.homepage.url || _package.homepage : "[unknown github url]",
      tag,
      ucpn,
      platform,
      mode,
      _p,
      credit,
      age,
      tag,
      name,
      prems,
      level,
      limit,
      totalreg,
      totalfeatures,
      role,
      readmore: readMore,
    };

    text = text.replace(new RegExp(`%(${Object.keys(replacements).sort((a, b) => b.length - a.length).join("|")})`, "g"), (_, name) => replacements[name]);

    const pp = "./Assets/XLICON-V2.jpg";

    let contact = {
      key: {
        fromMe: false,
        participant: `${m.sender.split("@")[0]}@s.whatsapp.net`,
        ...(m.chat ? { remoteJid: "16504228206@s.whatsapp.net" } : {}),
      },
      message: {
        contactMessage: {
          displayName: `${name}`,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:${name}\nitem1.TEL;waid=${m.sender.split("@")[0]}:${m.sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
        },
      },
    };

    conn.sendMessage(m.chat, { video: { url: menuvid }, caption: text.trim(), gifPlayback: true, gifAttribution: 0 }, { quoted: contact });
  } catch (e) {
    await conn.reply(m.chat, "error", m);
    throw e;
  }
};

handler.command = /^(menu|help|\?)$/i;

export default handler;

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

function clockString(ms) {
  let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000);
  let m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60;
  let s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60;
  return [h, " H ", m, " M ", s, " S "].map((v) => v.toString().padStart(2, 0)).join("");
}

function clockStringP(ms) {
  let ye = isNaN(ms) ? "--" : Math.floor(ms / 31104000000) % 10;
  let mo = isNaN(ms) ? "--" : Math.floor(ms / 2592000000) % 12;
  let d = isNaN(ms) ? "--" : Math.floor(ms / 86400000) % 30;
  let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000) % 24;
  let m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60;
  let s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60;
  return [ye, " *Years 🗓️*\n", mo, " *Month 🌙*\n", d, " *Days ☀️*\n", h, " *Hours 🕐*\n", m, " *Minutes ⏰*\n", s, " *Seconds ⏱️*"].map((v) => v.toString().padStart(2, 0)).join("");
}

function ucapan() {
  const time = moment.tz("Asia/Kolkata").format("HH");
  if (time >= 18) return "Good Night 🌙";
  if (time >= 15) return "Good Afternoon 🌇";
  if (time >= 10) return "Good Afternoon ☀️";
  return "Good Morning 🌄";
}
