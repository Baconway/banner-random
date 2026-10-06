import fs from "node:fs";
import http from "node:http";

import { getRandomInt, ExtractColorPalette } from "./banner.js";

const bannerDirContents = fs.readdirSync(process.env.FOLDER_NAME);

/* const bannerDirContents = fs.readdirSync(
  "/home/baconway/Documents/banner-random/placeholder/",
);*/

const server = http.createServer();
const proxyRegex =
  /^\/internal\/proxy\/(?:(?<folder>[^\/]+)\/)?(?<filename>[^\/?]+\.png)(?<query>\?.*)?$/; // gemini
const frameRegex = /[^/]+$/;

server.on("request", async (request, response) => {
  if (request.method != "GET") return;

  console.log(request.url);

  if (request.url.includes("internal/frame")) {
    const filenameFound = request.url.match(frameRegex);
    console.log(request.url, filenameFound);
    if (!filenameFound) {
      response.statusCode = 404;
      response.appendHeader("Content-Type", "text/plain; charset=utf-8");
      response.end("Frame asset not found");
      return;
    }

    const filename = filenameFound[0];
    console.log(filename);

    try {
      response.statusCode = 200;
      response.appendHeader("Content-Type", "image/png; charset=utf-8");
      response.end(Buffer.from(fs.readFileSync(`/banners/${filename}`)));
      return;
    } catch (error) {
      response.statusCode = 404;
      response.appendHeader("Content-Type", "text/plain; charset=utf-8");
      response.end("Frame asset not found");
      return;
    }
  } else if (request.url === "/internal/randomizer") {
    const randomBanner =
      bannerDirContents[getRandomInt(0, bannerDirContents.length)];
    const Banner_Palette = await ExtractColorPalette(randomBanner);

    response.appendHeader("Content-Type", "application/json; charset=utf-8");
    response.end(
      JSON.stringify({ name: randomBanner, palette: Banner_Palette }),
    );
  } else if (request.url.includes("/internal/proxy")) {
    const matchesPattern = request.url.match(proxyRegex);

    if (!matchesPattern) {
      response.statusCode = 404;
      response.appendHeader("Content-Type", "text/plain; charset=utf-8");
      response.end("Proxied URL not found");
      return;
    }

    const { folder, filename, query } = matchesPattern.groups;
    const proxied_fetch = await fetch(
      `https://maimaidx-eng.com/maimai-mobile/img${folder ? `/${folder}/` : "/"}${filename}${query ? `?${query}` : ""}`,
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
    return;
  } else if (request.url.includes("/internal/video")) {
    const FullURL = new URL(`https://bway.lol${request.url}`);

    const videoURL_toFetch = FullURL.searchParams.get("video_link");

    if (!videoURL_toFetch) {
      response.statusCode = 404;
      response.end("Video Link Not Provided");
      return;
    }

    const encodedURL = decodeURI(videoURL_toFetch);

    const videoResponse = await fetch(videoURL_toFetch, {
      method: "GET",
      headers: {
        Accept: "video/mp4",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      },
    });

    const videoStream = Buffer.from(await videoResponse.arrayBuffer());

    response.appendHeader("Access-Control-Allow-Origin", "*");
    response.appendHeader("Content-Type", "video/mp4");
    response.appendHeader("Cache-Control", "public, max-age=604800");
    response.appendHeader("Content-Disposition", "inline");

    response.statusCode = 200;
    response.end(videoStream);
  }
});

server.listen(process.env.PORT);
console.log("Listening on port: ", process.env.PORT);
// server.listen(2020);
