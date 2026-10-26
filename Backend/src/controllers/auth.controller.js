import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import tokenBlacklistModel from "../models/blacklist.model.js";
import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];

apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function registerUserController(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please provide username, email and password",
      });
    }

    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Account already exists with this email or username",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOTP = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();
    console.log(`🔑 [OTP] Registration verification code for ${user.email} is: ${otp}`);

    emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL || "santraakash999@gmail.com",
        name: "Nexus AI",
      },
      to: [{ email: user.email }],
      subject: "Verify your Nexus account",
      htmlContent: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 500px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #f9f9f9;
        }
        .card {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #6366f1; /* Nexus Indigo */
          margin-bottom: 30px;
          letter-spacing: -1px;
        }
        .logo span {
          color: #f43f5e; /* Pink accent */
        }
        .otp-container {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 12px;
          margin: 30px 0;
          border: 1px solid #e5e7eb;
        }
        .otp-code {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 6px;
          color: #111827;
          margin: 0;
        }
        p {
          color: #4b5563;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 10px;
        }
        .footer {
          margin-top: 35px;
          font-size: 11px;
          color: #9ca3af;
          border-top: 1px solid #f3f4f6;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">NEXUS<span>.</span></div>
          <p>Hello,</p>
          <p>Welcome to Nexus AI! Use the verification code below to complete your registration:</p>
          
          <div class="otp-container">
            <h1 class="otp-code">${otp}</h1>
          </div>
          
          <p>This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
          
          <div class="footer">
            &copy; 2026 Nexus AI. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
    }).catch(err => console.error("❌ Error sending verification email:", err.response?.body || err.response?.text || err.message || err));

    res.status(201).json({
      message: "Verification OTP sent to your email",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      otp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

async function loginUserController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // if (!user.isVerified) {
    //   return res.status(403).json({
    //     message: "Please verify your email first",
    //   });
    // }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
    });

    res.status(200).json({
      message: "User logged in successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

async function logoutUserController(req, res) {
  try {
    const token = req.cookies.token;

    if (token) {
      await tokenBlacklistModel.create({ token });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      secure: true,
    });

    res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

async function getMeController(req, res) {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.set("Cache-Control", "no-store");

    res.status(200).json({
      message: "User fetched successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        grokApiKey: !!user.grokApiKey,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

async function forgotPasswordController(req, res) {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    user.resetOTP = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();
    console.log(`🔑 [OTP] Password reset code for ${email} is: ${otp}`);

    emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL || "santraakash999@gmail.com",
        name: "Nexus AI",
      },
      to: [{ email }],
      subject: "Password Reset OTP",
      htmlContent: `
        <h2>Password Reset</h2>
        <p>Your OTP code is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      `,
    }).catch(err => console.error("❌ Error sending password reset email:", err.response?.body || err.response?.text || err.message || err));

    res.status(200).json({
      message: "OTP sent to email",
      otp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

async function verifyOtpController(req, res) {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });

    if (!user || user.resetOTP !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    user.isVerified = true;
    // user.resetOTP = null;
    // user.otpExpiry = null;

    await user.save();
    emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL || "santraakash999@gmail.com",
        name: "Nexus AI",
      },
      to: [{ email: user.email }],
      subject: "Welcome to Nexus 🚀",
      htmlContent: `
  <h1>Welcome to Nexus</h1>
  <p>Your account has been verified successfully.</p>
  `,
    }).catch(err => console.error("❌ Error sending welcome email:", err.response?.body || err.response?.text || err.message || err));

    res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

async function resetPasswordController(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    console.log("REQ BODY:", req.body);

    // Validate input first
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const user = await userModel.findOne({ email });

    console.log("DB OTP:", user?.resetOTP);

    // Check user exists
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check OTP exists
    if (!user.resetOTP) {
      return res.status(400).json({
        message: "No OTP found. Request a new one.",
      });
    }

    // Compare OTP safely (trim + string)
    if (user.resetOTP.trim() !== String(otp).trim()) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // Check expiry
    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    // Optional: password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOTP = null;
    user.otpExpiry = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });

  } catch (error) {
    console.error("RESET ERROR:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

export default {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
  forgotPasswordController,
  verifyOtpController,
  resetPasswordController,
};
