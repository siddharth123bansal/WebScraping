const { default: puppeteer } = require("puppeteer");
const { load } = require("cheerio");
const { writeFile } = require("fs/promises");
const axios = require('axios');

const products = [];
const apiUrl = 'https://siddharthbansal.000webhostapp.com/AddData.php';
const headers = {
  'Content-Type': 'application/json',
};
const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      height: 768,
      width: 1366,
    },
  });
  const page = await browser.newPage();
  await page.goto("https://www.croma.com");
  await page.click("#searchV2");
  await page.waitForTimeout(1000);
  await page.type("#searchV2", "macbook");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(5000);

  while (true) {
    const $ = load(await page.content());

    $(".product-item").each(async (_, el) => {
      const img = $("img", el).attr("src");
      const name = $("h3.product-title.plp-prod-title", el).text();
      const price = $("span.amount[data-testid='new-price']", el).text();
      const discount = $("span.amount[data-testid='old-price']", el).text();
      const link = $(el).find("h3.product-title.plp-prod-title > a").attr("href");
      const base_url = 'https://www.croma.com/';
      const url = new URL(link, base_url).href;

      products.push({
        name,
        price,
        discount,
        link: url,
        img,
      });
    });

    const loadMoreButton = await page.$("#product-list-back > div > button");
    if (loadMoreButton) {
      await loadMoreButton.click();
      await page.waitForTimeout(10000);
    } else {
      break;
    }
  }
  await writeFile("products.json", JSON.stringify(products));
  //here is output https://siddharthbansal.000webhostapp.com/eshop.php
  axios.post(apiUrl, products, { headers })
  .then((response) => {
    console.log('POST request successful');
    console.log(response.data);
  })
  .catch((error) => {
    console.error('Error making POST request:', error);
  });
  await browser.close();
};
main();