import fs from "node:fs";
import http from "node:http";

import { getRandomInt, ExtractColorPalette } from "./banner.js";

const bannerDirContents = fs.readdirSync(process.env.FOLDER_NAME);

const server = http.createServer();
const proxyRegex =
  /^\/internal\/proxy\/(?<folder>[^\/]+)\/(?<filename>[^\/]+\.png)$/; // gemini

server.on("request", async (request, response) => {
  if (request.method != "GET") return;
  console.log(request.url);
  if (request.url === "/internal/randomizer") {
    const randomBanner =
      bannerDirContents[getRandomInt(0, bannerDirContents.length)];
    const Banner_Palette = await ExtractColorPalette(randomBanner);

    response.appendHeader("Content-Type", "application/json; charset=utf-8");
    response.end(
      JSON.stringify({ name: randomBanner, palette: Banner_Palette }),
    );
  } else if (request.url.includes("/internal/proxy")) {
    const a = new URL(request.url, "https://bway.lol");
    const matchesPattern = request.url.match(proxyRegex);

    if (!matchesPattern) {
      response.statusCode = 404;
      response.appendHeader("Content-Type", "text/plain; charset=utf-8");
      response.end("Proxied URL not found");
    }
    const { folder, filename } = matchesPattern.groups;

    const proxied_fetch = await fetch(
      `https://maimaidx-eng.com/maimai-mobile/img/${folder}/${filename}`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      },
    );

    const arrBuffer = await proxied_fetch.arrayBuffer();
    const returnedBuffer = Buffer.from(arrBuffer);

    response.statusCode = 200;
    response.appendHeader("Access-Control-Allow-Origin", "*");
    response.appendHeader("Content-Type", "image/png");
    response.appendHeader("Cache-Control", "public, max-age=604800");
    response.end(returnedBuffer);
  }
});

server.listen(process.env.PORT);
