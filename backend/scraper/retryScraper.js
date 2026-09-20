const scrapeProduct = require("./productScraper");

async function scrapeWithRetry(url, options = {}) {
    const maxAttempts = options.maxAttempts ?? 3;

    const retryDelays = [
        2000,
        4000
    ];

    const logs = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(
            `\nScrape attempt ${attempt}/${maxAttempts}`
        );

        try {
            const result = await scrapeProduct(
                url,
                {
                    headless:
                        options.headless ?? true
                }
            );

            logs.push({
                attempt,
                status: "success",
                message: "Scrape completed successfully"
            });

            return {
                success: true,
                data: result,
                logs
            };

        } catch (error) {
            console.error(
                `Attempt ${attempt} failed:`,
                error.message
            );

            if (attempt === maxAttempts) {
                logs.push({
                    attempt,
                    status: "failed",
                    message: error.message
                });

                return {
                    success: false,
                    data: null,
                    logs
                };
            }

            logs.push({
                attempt,
                status: "retried",
                message: error.message
            });

            const delay =
                retryDelays[attempt - 1] ?? 4000;

            console.log(
                `Retrying in ${delay / 1000} seconds...`
            );

            await new Promise(resolve =>
                setTimeout(resolve, delay)
            );
        }
    }
}

module.exports = scrapeWithRetry;