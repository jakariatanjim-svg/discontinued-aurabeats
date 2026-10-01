import { Innertube, UniversalCache } from 'youtubei.js';

async function run() {
  console.log("Starting InnerTube...");
  try {
    const yt = await Innertube.create({ cache: new UniversalCache(false) });
    console.log("Fetching video info...");
    const info = await yt.getInfo('QcQpqWhTBCE');
    
    console.log("Title:", info.basic_info.title);
    
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    console.log("Audio Format found:", format.mime_type);
    
    const url = format.decipher(yt.session.player);
    console.log("Deciphered URL:", url.substring(0, 100) + "...");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
