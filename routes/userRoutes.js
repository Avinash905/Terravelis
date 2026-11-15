const express = require("express");
const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth");

const userRouter = express.Router();

userRouter.post("/register", userController.register);
userRouter.post("/login", userController.login);
userRouter.get("/me", requireAuth, userController.getMe);
userRouter.post("/watchlist", requireAuth, userController.addToWatchlist);
userRouter.delete("/watchlist/:itemId", requireAuth, userController.removeFromWatchlist);

module.exports = userRouter;
