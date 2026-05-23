// ======================
// 4. CRON JOB
// ======================

const cron = require("node-cron");

const Message = require("../models/Message");

const cloudinary = require("../config/cloudinary");

cron.schedule("0 * * * *", async() => {
    try {
        console.log(
            "Running expired media cleanup..."
        );

        const expiredMessages =
            await Message.find({
                isMediaExpired: false,

                mediaExpiresAt: {
                    $lte: new Date(),
                },

                cloudinaryPublicId: {
                    $ne: "",
                },
            });

        for (const msg of expiredMessages) {
            try {
                await cloudinary.uploader.destroy(
                    msg.cloudinaryPublicId, {
                        resource_type: msg.messageType === "video" ?
                            "video" :
                            "image",
                    }
                );

                msg.mediaUrl = "";

                msg.thumbnailUrl = "";

                msg.isMediaExpired = true;

                msg.mediaExpiredAt =
                    new Date();

                msg.message =
                    msg.messageType === "video" ?
                    "This video has expired" :
                    "This photo has expired";

                await msg.save();

                console.log(
                    `Expired media removed for message ${msg._id}`
                );
            } catch (err) {
                console.log(
                    "Error deleting media:",
                    err.message
                );
            }
        }
    } catch (error) {
        console.log(
            "Cron job failed:",
            error.message
        );
    }
});