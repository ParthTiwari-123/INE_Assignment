const scrapeWithRetry = require("./retryScraper");

const URL =
    "https://demo.inelabteamdev.com/product/313";

async function test() {
    const result = await scrapeWithRetry(URL, {
        maxAttempts: 3,
        headless: false
    });

    console.log("\n========== FINAL RESULT ==========");

    console.log(result);

    console.log("==================================");
}

test();