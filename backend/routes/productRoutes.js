const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

router.get("/search", async (req, res) => {
    try {
        const query = req.query.q;

        if (!query) {
            return res.json([]);
        }

        const { data, error } = await supabase
            .from("tracked_products")
            .select("*")
            .ilike("product_name", `%${query}%`)
            .eq("active", true);

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        res.json(data);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});
router.post("/track", async (req, res) => {
    try {
        const { product_name, product_url, image_url } = req.body;

        if (!product_name || !product_url) {
            return res.status(400).json({
                error: "Product name and URL are required."
            });
        }

        const { data: existingProduct, error: findError } =
            await supabase
                .from("tracked_products")
                .select("*")
                .eq("product_url", product_url)
                .maybeSingle();

        if (findError) {
            return res.status(500).json({
                error: findError.message
            });
        }

        if (existingProduct) {
            return res.json(existingProduct);
        }

        const { data, error } = await supabase
            .from("tracked_products")
            .insert({
                product_name,
                product_url,
                image_url: image_url || null
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        res.status(201).json(data);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});
router.get("/tracked", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("tracked_products")
            .select("*")
            .eq("active", true)
            .order("created_at", {
                ascending: false
            });

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        res.json(data);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});
router.get("/:id/history", async (req, res) => {
    try {
        const productId = req.params.id;

        const { data, error } = await supabase
            .from("price_history")
            .select("*")
            .eq("tracked_product_id", productId)
            .order("scraped_at", {
                ascending: false
            });

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        res.json(data);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});
router.get("/:id/logs", async (req, res) => {
    try {
        const productId = req.params.id;

        const { data, error } = await supabase
            .from("scrape_logs")
            .select("*")
            .eq("tracked_product_id", productId)
            .order("scraped_at", {
                ascending: false
            });

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        res.json(data);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});
module.exports = router;