
const jwt = require("jsonwebtoken");

// CHECK IF USER IS LOGGED IN
const protect = (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                message: "Please log in to continue."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired login session."
        });
    }
};

// CHECK IF USER IS ADMIN
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            message: "Access denied. Admin only."
        });
    }

    next();
};

module.exports = {
    protect,
    adminOnly
};
