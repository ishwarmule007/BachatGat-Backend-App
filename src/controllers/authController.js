const bcrypt = require('bcrypt');
const User = require('../models/User');
const OTP = require('../models/otpModel');
const sendSMS = require('../utils/sendSMS');
const generateToken = require("../utils/generateToken");
const jwt = require("jsonwebtoken");


const passwordlogin = async(req, res) => {
    try {
        const { mobileNumber, password, roleSelection } = req.body;

        if (!mobileNumber || !password || !roleSelection) {
            return res.status(400).json({
                message: "Mobile number, password, and role selection are required"
            });
        }

        const user = await User.findOne({ mobileNumber });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.password) {
            return res.status(400).json({
                message: "Password not set for this user"
            });
        }

        if (user.roleSelection !== roleSelection) {
            return res.status(400).json({
                message: "Selected role does not match user's role"
            });
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            message: "Login successful",
            token,
            roleSelection: user.roleSelection
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
const sendOTP = async(req, res) => {
    try {
        const { mobileNumber } = req.body;
        const user = await User.findOne({ mobileNumber });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const otpRecord = await OTP.findOne({ mobileNumber });
        if (otpRecord) {
            if (otpRecord.resendCount >= 3) {
                return res.status(429).json({
                    message: "Maximum OTP resend attempts reached. Please try again later."
                })
            }
            const timeDiff = (new Date() - otpRecord.lastSentAt) / 1000;
            if (timeDiff < 30) {
                return res.status(429).json({
                    message: `Please wait ${Math.ceil(30 - timeDiff)} seconds before requesting a new OTP.`
                });
            }
            otpRecord.resendCount += 1;
            await otpRecord.save(); // FIX
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OTP.findOneAndUpdate({ mobileNumber }, {
            otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            lastSentAt: new Date(),
            $setOnInsert: { resendCount: 0 }
        }, { upsert: true });

        const message = `Your OTP for BachatGatApp is ${otp}. It is valid for 5 minutes.`;

        await sendSMS(mobileNumber, message);

        res.status(200).json({ message: "OTP sent successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getMyProfile = async(req, res) => {
    try {
        const user = await User.findById(req.user._id).select(
            "fullName mobileNumber emailAddress profilePicture roleSelection prefferedLanguage"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.status(200).json({
            message: "Profile fetched successfully",
            user: {
                ...user.toObject(),
                preferredLanguage: user.prefferedLanguage,
            },
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const verifyOTP = async(req, res) => {
    try {
        const { mobileNumber, otp, purpose } = req.body;

        if (!mobileNumber || !otp || !purpose) {
            return res.status(400).json({
                message: "mobileNumber, otp and purpose are required"
            });
        }
        const otpRecord = await OTP.findOne({ mobileNumber, otp });
        if (!otpRecord) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }
        if (otpRecord.expiresAt < new Date()) {
            return res.status(400).json({
                message: "OTP has expired"
            });
        }
        const user = await User.findOne({ mobileNumber });
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        await OTP.deleteOne({ _id: otpRecord._id });
        if (purpose === "login") {
            const token = generateToken(
                user._id,
                user.roleSelection
            );
            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                user
            });
        }
        if (purpose === "forgotPassword") {
            const resetToken = jwt.sign({
                    id: user._id,
                    purpose: "resetPassword"
                },
                process.env.JWT_SECRET, { expiresIn: "10m" }
            );
            return res.status(200).json({
                success: true,
                message: "OTP verified successfully",
                resetToken
            });
        }
        return res.status(400).json({
            message: "Invalid purpose"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
const forgetPassword = async(req, res) => {
    try {

        const { resetToken, newPassword, confirmPassword } = req.body;
        if (!resetToken || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "resetToken, newPassword and confirmPassword are required"
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match"
            });
        }
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.purpose !== "resetPassword") {
            return res.status(400).json({
                message: "Invalid reset token"
            });
        }
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        const hashPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashPassword;
        await user.save();
        res.status(200).json({
            message: "Password reset successful"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
module.exports = {
    passwordlogin,
    sendOTP,
    verifyOTP,
    getMyProfile,
    forgetPassword
}