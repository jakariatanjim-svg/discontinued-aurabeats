import { Innertube, UniversalCache } from 'youtubei.js';

async function run() {
  try {
    const yt = await Innertube.create({ cache: new UniversalCache(false) });
    const info = await yt.getBasicInfo('QcQpqWhTBCE');
    console.log("Title:", info.basic_info.title);
    
    // Attempt to get streaming data directly
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    if (format.url) {
      console.log("Direct URL:", format.url.substring(0, 80));
    } else if (format.signature_cipher) {
      console.log("Needs deciphering");
      const url = format.decipher(yt.session.player);
      console.log("Deciphered URL:", typeof url, url);
    } else {
      console.log("No URL or cipher found", Object.keys(format));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
