const scrapeWithRetry = require("./retryScraper");
const supabase = require("../config/supabase");

async function scrapeProductAndSave(trackedProductId, productUrl) {
    console.log(
        `\nStarting scrape for product ${trackedProductId}`
    );

    const result = await scrapeWithRetry(productUrl, {
        maxAttempts: 3,
        headless: true
    });

    // Save every scrape attempt to scrape_logs
    for (const log of result.logs) {
        const { error } = await supabase
            .from("scrape_logs")
            .insert({
                tracked_product_id: trackedProductId,
                attempt_number: log.attempt,
                status: log.status,
                message: log.message
            });

        if (error) {
            throw new Error(
                `Failed to save scrape log: ${error.message}`
            );
        }
    }

    // If scraping failed after all attempts,
    // do not save price history
    if (!result.success) {
        return {
            success: false,
            message: "All scrape attempts failed.",
            logs: result.logs
        };
    }

    // Save successful price + stock
    const { data, error } = await supabase
        .from("price_history")
        .insert({
            tracked_product_id: trackedProductId,
            price: result.data.price,
            stock: result.data.stock
        })
        .select()
        .single();

    if (error) {
        console.error("FULL SUPABASE ERROR:");
        console.error(error);

        throw new Error(
            `Failed to save scrape log: ${error.message}`
        );
    }

    return {
        success: true,
        data,
        logs: result.logs
    };
}

module.exports = scrapeProductAndSave;