
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// CREATE ORDER
router.post("/", protect, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { items, shippingAddress } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty."
            });
        }

        if (!shippingAddress || !shippingAddress.trim()) {
            return res.status(400).json({
                message: "Shipping address is required."
            });
        }

        let newOrder;

        await session.withTransaction(async () => {
            const orderItems = [];
            let totalAmount = 0;

            for (const item of items) {
                if (
                    !mongoose.isValidObjectId(item.productId) ||
                    !Number.isInteger(item.quantity) ||
                    item.quantity < 1
                ) {
                    throw new Error("Invalid product or quantity.");
                }

                const product = await Product.findOneAndUpdate(
                    {
                        _id: item.productId,
                        stock: { $gte: item.quantity }
                    },
                    {
                        $inc: { stock: -item.quantity }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!product) {
                    throw new Error("Product unavailable or insufficient stock.");
                }

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity
                });

                totalAmount += product.price * item.quantity;
            }

            const orders = await Order.create(
                [{
                    user: req.user.id,
                    items: orderItems,
                    totalAmount,
                    shippingAddress: shippingAddress.trim(),
                    paymentMethod: "Cash on Delivery"
                }],
                { session }
            );

            newOrder = orders[0];
        });

        res.status(201).json({
            message: "Order placed successfully!",
            order: newOrder
        });
    } catch (error) {
        res.status(400).json({
            message: error.message || "Unable to place order."
        });
    } finally {
        await session.endSession();
    }
});

// CUSTOMER ORDER HISTORY
router.get("/my-orders", protect, async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.json({ orders });
    } catch (error) {
        res.status(500).json({
            message: "Unable to load your orders."
        });
    }
});

// ADMIN: VIEW ALL ORDERS
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.json({ orders });
    } catch (error) {
        res.status(500).json({
            message: "Unable to load orders."
        });
    }
});

// ADMIN: UPDATE ORDER STATUS
router.patch("/:id/status", protect, adminOnly, async (req, res) => {
    try {
        const allowedStatuses = [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(req.body.status)) {
            return res.status(400).json({
                message: "Invalid order status."
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        res.json({
            message: "Order status updated.",
            order
        });
    } catch (error) {
        res.status(400).json({
            message: "Unable to update order."
        });
    }
});

module.exports = router;
