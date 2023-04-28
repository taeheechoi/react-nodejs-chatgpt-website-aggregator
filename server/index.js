import { createRequire } from "module";
import { ChatGPTAPI } from "chatgpt";
const require = createRequire(import.meta.url);
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const app = express();
const PORT = 4000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get("/api", (req, res) => {
  res.json({
    message: "Hello World",
  });
});

async function chatgptFunction(content) {
  //Go to https://chat.openai.com/api/auth/session to get access token after log in.
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const getBrandName = await api.sendMessage(
    `I have a raw text of a website, what is the brand name in a single word? ${content}`
  );

  const getBrandDescription = "";
  // const getBrandDescription = await api.sendMessage(
  //   `I have a raw text of a website, can you extract the description of the website from the raw text. I need only the description and nothing else. ${content}`
  // );
  console.log(getBrandName, getBrandDescription);
  return {
    brandName: getBrandName.text,
    brandDescription: getBrandDescription.text,
  };
}

const database = [];
const generateID = () => Math.random().toString(36).substring(2, 10);

app.post("/api/url", (req, res) => {
  const { url } = req.body;

  // https://en.wikipedia.org/wiki/Immediately_invoked_function_expression
  // https://stackoverflow.com/questions/54994196/puppeteer-what-do-the-round-brackets-enclosing-an-async-function-mean
  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const websiteContent = await page.evaluate(() => {
      return document.documentElement.innerText.trim();
    });

    const websiteOgImage = await page.evaluate(() => {
      const metas = document.getElementsByTagName("meta");
      for (let i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute("property") === "og:image") {
          return metas[i].getAttribute("content");
        }
      }
    });
    console.log({ websiteContent, websiteOgImage });
    let result = await chatgptFunction(websiteContent);
    result.brandImage = websiteOgImage;
    result.id = generateID();
    database.push(result);
    return res.json({
      message: "Request successful!",
      database,
    });
  })();
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
