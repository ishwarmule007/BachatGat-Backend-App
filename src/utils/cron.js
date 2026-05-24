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

                let resourceType = "image";

                if (
                    msg.messageType === "video"
                ) {
                    resourceType = "video";
                }

                if (
                    msg.messageType === "audio"
                ) {
                    resourceType = "video";
                }

                await cloudinary.uploader.destroy(
                    msg.cloudinaryPublicId, {
                        resource_type: resourceType,
                    }
                );

                msg.mediaUrl = "";

                msg.thumbnailUrl = "";

                msg.isMediaExpired = true;

                msg.mediaExpiredAt =
                    new Date();

                // EXPIRED MESSAGE TEXT
                if (
                    msg.messageType === "video"
                ) {

                    msg.message =
                        "This video has expired";

                } else if (
                    msg.messageType === "audio"
                ) {

                    msg.message =
                        "This voice note has expired";

                } else {

                    msg.message =
                        "This photo has expired";
                }

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