
const express = require("express");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET ALL PRODUCTS
router.get("/", async (req, res) => {
    try {
        const products = await Product.find().sort({
            createdAt: -1
        });

        res.json({ products });
    } catch (error) {
        res.status(500).json({
            message: "Unable to load products."
        });
    }
});

// GET SINGLE PRODUCT
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.json({ product });
    } catch (error) {
        res.status(400).json({
            message: "Invalid product ID."
        });
    }
});

// ADD PRODUCT (ADMIN)
router.post("/", protect, adminOnly, async (req, res) => {
    try {
        const { name, description, price, stock, category, image } = req.body;

        const product = await Product.create({
            name,
            description,
            price,
            stock,
            category,
            image
        });

        res.status(201).json({
            message: "Product added successfully!",
            product
        });
    } catch (error) {
        res.status(400).json({
            message: "Unable to add product.",
            error: error.message
        });
    }
});

// UPDATE PRODUCT (ADMIN)
router.put("/:id", protect, adminOnly, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.json({
            message: "Product updated successfully!",
            product
        });
    } catch (error) {
        res.status(400).json({
            message: "Unable to update product.",
            error: error.message
        });
    }
});

// DELETE PRODUCT (ADMIN)
router.delete("/:id", protect, adminOnly, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.json({
            message: "Product deleted successfully."
        });
    } catch (error) {
        res.status(400).json({
            message: "Unable to delete product."
        });
    }
});

module.exports = router;
