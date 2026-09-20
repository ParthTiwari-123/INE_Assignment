const { chromium } = require("playwright");

const URL = "https://demo.inelabteamdev.com/product/313";

async function test() {
    const browser = await chromium.launch({
        headless: false
    });

    try {
        const page = await browser.newPage();

        console.log("Opening product page...");

        await page.goto(URL, {
            waitUntil: "domcontentloaded",
            timeout: 15000
        });

        console.log("Page loaded.");

        // --------------------------------
        // HANDLE COOKIE POPUP
        // --------------------------------

        console.log("Checking for cookie popup...");

        const cookieButtons = page.locator("button").filter({
            hasText: /^(accept|decline)$/i
        });

        try {
            await cookieButtons.first().waitFor({
                state: "visible",
                timeout: 10000
            });

            const buttons = await cookieButtons.allTextContents();

            console.log(
                "Cookie popup found:",
                buttons
            );

            const acceptButton = page.locator("button").filter({
                hasText: /^accept$/i
            }).first();

            if (await acceptButton.isVisible()) {
                await acceptButton.click();

                console.log("Cookies accepted.");
            } else {
                const declineButton = page.locator("button").filter({
                    hasText: /^decline$/i
                }).first();

                await declineButton.click();

                console.log("Cookies declined.");
            }

            await page.waitForTimeout(1000);

        } catch {
            console.log("No cookie popup appeared.");
        }

        // --------------------------------
        // FIND PRICE AREA
        // --------------------------------

        const priceBlock = page.locator(".price-block").first();

        await priceBlock.waitFor({
            state: "visible",
            timeout: 10000
        });

        console.log("Price area found.");

        // --------------------------------
        // SCROLL PRICE AREA INTO VIEW
        // --------------------------------

        await priceBlock.scrollIntoViewIfNeeded();

        // --------------------------------
        // HOVER PRICE AREA
        // --------------------------------

        console.log("Hovering over price area...");

        await priceBlock.hover({
            force: true
        });

        await page.waitForTimeout(500);

        // --------------------------------
        // ALSO MOVE MOUSE TO MULTIPLE
        // POINTS IN PRICE AREA
        // --------------------------------

        const box = await priceBlock.boundingBox();

        if (!box) {
            throw new Error(
                "Could not get price area position."
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
            },
            {
                x: box.x + box.width * 0.5,
                y: box.y + box.height * 0.25
            },
            {
                x: box.x + box.width * 0.5,
                y: box.y + box.height * 0.75
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

        console.log(
            "Playwright mouse moved across price area."
        );

        // --------------------------------
        // FIND REVEAL BUTTON
        // --------------------------------

        const revealButton = page.getByRole("button", {
            name: /reveal price/i
        });

        await revealButton.waitFor({
            state: "visible",
            timeout: 10000
        });

        console.log("Reveal price button found.");

        // --------------------------------
        // CHECK BUTTON STATE
        // --------------------------------

        const disabled = await revealButton.isDisabled();

        console.log(
            "Reveal button disabled:",
            disabled
        );

        // --------------------------------
        // IF STILL DISABLED, TRY HOVERING
        // DIRECTLY OVER THE BUTTON
        // --------------------------------

        if (disabled) {
            console.log(
                "Button is disabled. Hovering directly over button..."
            );

            await revealButton.hover({
                force: true
            });

            await page.waitForTimeout(1000);
        }

        const disabledAfterHover =
            await revealButton.isDisabled();

        console.log(
            "Reveal button disabled after hover:",
            disabledAfterHover
        );

        if (disabledAfterHover) {
            throw new Error(
                "Reveal Price button is still disabled after Playwright hover."
            );
        }

        // --------------------------------
        // CLICK
        // --------------------------------

        await revealButton.click();

        console.log("Clicked Reveal price.");

        // --------------------------------
        // WAIT FOR STOCK
        // --------------------------------

        await page.locator(".stock-badge").waitFor({
            state: "visible",
            timeout: 10000
        });

        console.log("Price and stock loaded.");

        // --------------------------------
        // PRODUCT NAME
        // --------------------------------

        const name = await page
            .locator(".detail-info h1")
            .first()
            .textContent();

        // --------------------------------
        // STOCK
        // --------------------------------

        const stock = await page
            .locator(".stock-badge")
            .first()
            .textContent();

        // --------------------------------
        // PRICE ELEMENTS
        // --------------------------------

        const priceElements = await page
            .locator(".price-main span")
            .evaluateAll((elements) => {
                return elements.map((element) => {
                    const style =
                        element.getAttribute("style") || "";

                    const className =
                        element.className || "";

                    const text =
                        element.textContent.trim();

                    return {
                        text,
                        style,
                        className: String(className)
                    };
                });
            });

        console.log("\nPrice elements:");
        console.log(priceElements);

        // --------------------------------
        // FIND CURRENT PRICE
        // --------------------------------

        let currentPriceText = null;

        for (const element of priceElements) {
            const text = element.text;

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
                text.includes("₹") &&
                !isHidden &&
                !isOldPrice &&
                !isDealPrice
            ) {
                currentPriceText = text;
                break;
            }
        }

        if (!currentPriceText) {
            throw new Error(
                "Current price could not be found."
            );
        }

        // --------------------------------
        // CONVERT PRICE TO NUMBER
        // --------------------------------

        const priceMatch =
            currentPriceText.match(
                /₹\s*([\d,]+(?:\.\d+)?)/
            );

        if (!priceMatch) {
            throw new Error(
                `Could not extract number from price: ${currentPriceText}`
            );
        }

        const price = Number(
            priceMatch[1].replace(/,/g, "")
        );

        if (
            !Number.isFinite(price) ||
            price <= 0
        ) {
            throw new Error(
                `Invalid price extracted: ${currentPriceText}`
            );
        }

        // --------------------------------
        // VALIDATE STOCK
        // --------------------------------

        if (!stock || !stock.trim()) {
            throw new Error(
                "Stock information could not be found."
            );
        }

        // --------------------------------
        // RESULT
        // --------------------------------

        console.log(
            "\n========== RESULT =========="
        );

        console.log(
            "Name:",
            name.trim()
        );

        console.log(
            "Current price:",
            currentPriceText
        );

        console.log(
            "Price as number:",
            price
        );

        console.log(
            "Stock:",
            stock.trim()
        );

        console.log(
            "============================"
        );

        await page.screenshot({
            path: "scraper-success.png",
            fullPage: true
        });

        console.log(
            "\nScreenshot saved as scraper-success.png"
        );

        await page.waitForTimeout(3000);

    } catch (error) {
        console.error(
            "\nSCRAPING FAILED:"
        );

        console.error(
            error.message
        );

    } finally {
        await browser.close();
    }
}

test();