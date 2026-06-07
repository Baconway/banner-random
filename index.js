import fs from "node:fs";
import http from "node:http";

import { Canvas, loadImage } from "skia-canvas";
import { getPalette } from "colorthief";

const bannerDirContents = fs.readdirSync(process.env.FOLDER_NAME);
const server = http.createServer();

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

async function ExtractColorPalette(source) {
  // load the img from the link, creates and draws the image onto a similarly sized canvas, then gets the 3-color palette as a buffer
  if (!process.env.FOLDER_NAME) return ["#d7dae8", "#a2a8c6", "#c3c8de"];

  const image = await loadImage(`${process.env.FOLDER_NAME}/${source}`);
  const canvas = new Canvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);

  const returningPalette = await getPalette(await canvas.toBuffer(), {
    colorCount: 3,
  });

  const hexPalette = [];
  returningPalette.forEach((c) => hexPalette.push(c.hex()));

  return hexPalette;
}

server.on("request", async (request, response) => {
  if (request.method == "GET") {
    const randomBanner =
      bannerDirContents[getRandomInt(0, bannerDirContents.length)];
    const Banner_Palette = await ExtractColorPalette(randomBanner);

    response.appendHeader("Content-Type", "application/json; charset=utf-8");
    response.end(
      JSON.stringify({ name: randomBanner, palette: Banner_Palette }),
    );
  }
});

server.listen(process.env.PORT);
