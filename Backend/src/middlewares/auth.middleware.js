import jwt from "jsonwebtoken";
import tokenBlacklistModel from "../models/blacklist.model.js";
import userModel from "../models/user.model.js";

async function authUser(req, res, next) {
  try {
    // get token from BOTH cookie + header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    console.log(`AUTH DEBUG: route=${req.originalUrl} tokenSource=${req.cookies.token ? 'cookie' : req.headers.authorization ? 'header' : 'none'} token=${token ? token.slice(0, 20) + '...' : 'none'}`);

    if (!token) {
      return res.status(401).json({
        message: "Authentication token not provided",
      });
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token });

    if (isTokenBlacklisted) {
      return res.status(401).json({
        message: "Token is blacklisted. Please login again.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(`AUTH DEBUG: verified id=${decoded.id} username=${decoded.username} role=${decoded.role}`);

    const user = await userModel.findById(decoded.id).select("isBanned role");

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been restricted. Contact support.",
      });
    }

    req.user = decoded;

    next();
  } catch (err) {
    console.error("AUTH DEBUG ERROR:", err.message);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

export default authUser;
