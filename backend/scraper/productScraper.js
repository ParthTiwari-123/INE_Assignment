const { chromium } = require("playwright");

async function scrapeProduct(url, options = {}) {
    const headless = options.headless ?? true;

    const browser = await chromium.launch({
        headless
    });

    try {
        const page = await browser.newPage();

        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 15000
        });

        // Handle cookie popup
        const cookieButtons = page.locator("button").filter({
            hasText: /^(accept|decline)$/i
        });

        try {
            await cookieButtons.first().waitFor({
                state: "visible",
                timeout: 5000
            });

            const acceptButton = page.locator("button").filter({
                hasText: /^accept$/i
            }).first();

            if (await acceptButton.isVisible()) {
                await acceptButton.click();
            } else {
                const declineButton = page.locator("button").filter({
                    hasText: /^decline$/i
                }).first();

                await declineButton.click();
            }

            await page.waitForTimeout(500);

        } catch {
            // Cookie popup did not appear
        }

        // Find price area
        const priceBlock = page.locator(".price-block").first();

        await priceBlock.waitFor({
            state: "visible",
            timeout: 10000
        });

        await priceBlock.scrollIntoViewIfNeeded();

        // Hover over price area
        const box = await priceBlock.boundingBox();

        if (!box) {
            throw new Error(
                "Could not find price area."
            );
        }

        const points = [
            {
                x: box.x + box.width * 0.25,
                y: box.y + box.height * 0.5
            },
            {
                x: box.x + box.width * 0.5,
                y: box.y + box.height * 0.5
            },
            {
                x: box.x + box.width * 0.75,
                y: box.y + box.height * 0.5
            }
        ];

        for (const point of points) {
            await page.mouse.move(
                point.x,
                point.y,
                {
                    steps: 10
                }
            );

            await page.waitForTimeout(300);
        }

        // Find Reveal Price
        const revealButton = page.getByRole("button", {
            name: /reveal price/i
        });

        await revealButton.waitFor({
            state: "visible",
            timeout: 10000
        });

        // Wait until enabled
        await page.waitForFunction(() => {
            const button = Array.from(
                document.querySelectorAll("button")
            ).find(
                button =>
                    button.getAttribute("aria-label") ===
                    "Reveal price"
            );

            return button && !button.disabled;
        }, null, {
            timeout: 10000
        });

        // Click Reveal Price
        await revealButton.click();

        // Wait for stock
        await page.locator(".stock-badge").waitFor({
            state: "visible",
            timeout: 10000
        });

        // Product name
        const productName = (
            await page
                .locator(".detail-info h1")
                .first()
                .textContent()
        ).trim();

        // Stock
        const stock = (
            await page
                .locator(".stock-badge")
                .first()
                .textContent()
        ).trim();

        // Get price elements
        const priceElements = await page
            .locator(".price-main span")
            .evaluateAll(elements => {
                return elements.map(element => ({
                    text: element.textContent.trim(),
                    style:
                        element.getAttribute("style") || "",
                    className:
                        String(element.className || "")
                }));
            });

        // Find current price
        let currentPriceText = null;

        for (const element of priceElements) {
            const isHidden =
                element.style.includes(
                    "display: none"
                );

            const isOldPrice =
                element.style.includes(
                    "line-through"
                );

            const isDealPrice =
                element.className.includes(
                    "sl-z6"
                );

            if (
                element.text.includes("₹") &&
                !isHidden &&
                !isOldPrice &&
                !isDealPrice
            ) {
                currentPriceText = element.text;
                break;
            }
        }

        if (!currentPriceText) {
            throw new Error(
                "Current price could not be found."
            );
        }

        // Extract numeric price
        const priceMatch =
            currentPriceText.match(
                /₹\s*([\d,]+(?:\.\d+)?)/
            );

        if (!priceMatch) {
            throw new Error(
                `Invalid price: ${currentPriceText}`
            );
        }

        const price = Number(
            priceMatch[1].replace(/,/g, "")
        );

        if (!Number.isFinite(price) || price <= 0) {
            throw new Error(
                `Invalid price: ${currentPriceText}`
            );
        }

        if (!stock) {
            throw new Error(
                "Stock information is missing."
            );
        }

        return {
            productName,
            price,
            stock,
            url
        };

    } finally {
        await browser.close();
    }
}

module.exports = scrapeProduct;