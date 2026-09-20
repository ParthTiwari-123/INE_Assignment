const scrapeProductAndSave = require("./scrapeProductAndSave");

const PRODUCT_ID = 1;

const PRODUCT_URL =
    "https://demo.inelabteamdev.com/product/313";

async function test() {
    try {
        const result = await scrapeProductAndSave(
            PRODUCT_ID,
            PRODUCT_URL
        );

        console.log("\n========== DATABASE RESULT ==========");

        console.log(result);

        console.log("=====================================");

    } catch (error) {
        console.error("\nERROR:");
        console.error(error.message);
    }
}

test();