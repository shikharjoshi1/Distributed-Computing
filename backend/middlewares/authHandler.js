const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("password");
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Token failed!");
    }

    if (!req.user) {
      // Check if req.user is set after verification
      res.status(401);
      throw new Error("No token!");
    }
  } else {
    res.status(401);
    throw new Error("No token!");
  }
});

module.exports = { protect };
