const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Group = require("../models/Group");
const Message = require("../models/Message");

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.use(async(socket, next) => {
        try {
            let token;

            if (socket.handshake.auth && socket.handshake.auth.token) {
                token = socket.handshake.auth.token;
            } else if (
                socket.handshake.headers &&
                socket.handshake.headers.authorization
            ) {
                token = socket.handshake.headers.authorization.split(" ")[1];
            } else if (
                socket.handshake.query &&
                socket.handshake.query.token
            ) {
                token = socket.handshake.query.token;
            }

            if (!token) {
                return next(new Error("Token missing"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id).select("-password");

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        socket.on("joinGroup", async(data) => {
            try {

                const groupCode = data && data.groupCode;

                const cleanGroupCode = String(groupCode || "").trim();

                if (!cleanGroupCode) {
                    return socket.emit("errorMessage", {
                        message: "groupCode is required"
                    });
                }

                const group = await Group.findOne({
                    groupCode: cleanGroupCode
                });

                if (!group) {
                    return socket.emit("errorMessage", {
                        message: "Group not found"
                    });
                }
                const userId = socket.user._id;
                const isPresident =
                    group.presidentId &&
                    group.presidentId.toString() === userId.toString();
                const isSecretary =
                    group.secretaryId &&
                    group.secretaryId.toString() === userId.toString();
                const isTreasurer =
                    group.treasurerId &&
                    group.treasurerId.toString() === userId.toString();
                const member = group.members.find(
                    (m) =>
                    m.userId &&
                    ((m.userId._id || m.userId).toString() === userId.toString())
                );
                if (!isTreasurer && !isPresident && !isSecretary) {
                    if (!member || member.status !== "approved") {
                        return socket.emit("errorMessage", {
                            message: "You are not approved member of this group"
                        });
                    }
                }

                socket.join(cleanGroupCode);

                socket.emit("groupJoined", {
                    success: true,
                    groupCode: cleanGroupCode,
                    message: `Joined group ${cleanGroupCode}`
                });

                console.log(
                    `${socket.user.fullName} joined ${cleanGroupCode}`
                );

            } catch (error) {

                socket.emit("errorMessage", {
                    message: error.message
                });
            }
        });

        const MAX_IMAGE_SIZE =
            1 * 1024 * 1024;

        const MAX_VIDEO_SIZE =
            10 * 1024 * 1024;

        const MAX_AUDIO_SIZE =
            2 * 1024 * 1024;

        socket.on(
            "sendMessage",
            async(data) => {

                try {

                    const groupCode =
                        data && data.groupCode;

                    const message =
                        data && data.message;

                    const messageType =
                        data && data.messageType;

                    const mediaUrl =
                        data && data.mediaUrl;

                    const thumbnailUrl =
                        data && data.thumbnailUrl;

                    const cloudinaryPublicId =
                        data &&
                        data.cloudinaryPublicId;

                    const mediaSize =
                        data && data.mediaSize;

                    const mediaDuration =
                        data &&
                        data.mediaDuration;

                    const audioDuration =
                        data &&
                        data.audioDuration;

                    const replyTo =
                        data && data.replyTo;

                    const cleanGroupCode =
                        String(
                            groupCode || ""
                        ).trim();
                    if (!cleanGroupCode) {

                        return socket.emit(
                            "errorMessage", {
                                message: "groupCode is required",
                            }
                        );
                    }

                    const allowedMessageTypes = [
                        "text",
                        "image",
                        "video",
                        "audio",
                    ];

                    if (
                        messageType &&
                        !allowedMessageTypes.includes(
                            messageType
                        )
                    ) {

                        return socket.emit(
                            "errorMessage", {
                                message: "Invalid message type",
                            }
                        );
                    }

                    if (!message &&
                        !mediaUrl
                    ) {

                        return socket.emit(
                            "errorMessage", {
                                message: "message or mediaUrl is required",
                            }
                        );
                    }
                    if (
                        messageType ===
                        "image" &&
                        mediaSize >
                        MAX_IMAGE_SIZE
                    ) {

                        return socket.emit(
                            "errorMessage", {
                                message: "Image size should be less than or equal to 1 MB",
                            }
                        );
                    }
                    if (
                        messageType ===
                        "video" &&
                        mediaSize >
                        MAX_VIDEO_SIZE
                    ) {

                        return socket.emit(
                            "errorMessage", {
                                message: "Video size should be less than or equal to 10 MB",
                            }
                        );
                    }
                    if (
                        messageType ===
                        "audio" &&
                        mediaSize >
                        MAX_AUDIO_SIZE
                    ) {

                        return socket.emit(
                            "errorMessage", {
                                message: "Audio size should be less than or equal to 2 MB",
                            }
                        );
                    }
                    const group =
                        await Group.findOne({
                            groupCode: cleanGroupCode,
                        });

                    if (!group) {

                        return socket.emit(
                            "errorMessage", {
                                message: "Group not found",
                            }
                        );
                    }
                    const userId = socket.user._id;
                    const isPresident =
                        group.presidentId &&
                        group.presidentId.toString() === userId.toString();
                    const isSecretary =
                        group.secretaryId &&
                        group.secretaryId.toString() === userId.toString();
                    const isTreasurer =
                        group.treasurerId &&
                        group.treasurerId.toString() === userId.toString();
                    const member = group.members.find(
                        (m) =>
                        m.userId &&
                        ((m.userId._id || m.userId).toString() === userId.toString())
                    );
                    if (!isPresident && !isSecretary && !isTreasurer) {
                        if (!member || member.status !== "approved") {
                            return socket.emit("errorMessage", {
                                message: "You are not approved member of this group"
                            });
                        }
                    }
                    let repliedMessage = null;

                    if (replyTo) {

                        if (!mongoose.Types.ObjectId.isValid(replyTo)) {
                            return socket.emit("errorMessage", {
                                message: "Invalid reply message id"
                            });
                        }

                        repliedMessage = await Message.findOne({
                            _id: replyTo,
                            groupId: group._id,
                            isDeleted: false
                        });

                        if (!repliedMessage) {
                            return socket.emit("errorMessage", {
                                message: "Reply message not found in this group"
                            });
                        }
                    }
                    const mediaExpireDate =
                        messageType ===
                        "image" ||
                        messageType ===
                        "video" ||
                        messageType ===
                        "audio" ?
                        new Date(
                            Date.now() +
                            7 *
                            24 *
                            60 *
                            60 *
                            1000
                        ) :
                        null;
                    const newMessage =
                        await Message.create({
                            groupId: group._id,

                            senderId: socket.user
                                ._id,

                            messageType: messageType ||
                                "text",

                            message: message || "",

                            mediaUrl: mediaUrl || "",

                            thumbnailUrl: thumbnailUrl ||
                                "",

                            cloudinaryPublicId: cloudinaryPublicId ||
                                "",

                            mediaSize: mediaSize || 0,

                            mediaDuration: messageType ===
                                "video" ?
                                mediaDuration ||
                                0 : 0,

                            audioDuration: messageType ===
                                "audio" ?
                                audioDuration ||
                                0 : 0,

                            mediaExpiresAt: mediaExpireDate,

                            replyTo: replyTo ||
                                null,

                            readBy: [{
                                userId: socket
                                    .user
                                    ._id,
                            }, ],
                        });
                    await Group.updateOne({ _id: group._id }, {
                        $inc: {
                            "members.$[elem].unreadCount": 1
                        }
                    }, {
                        arrayFilters: [{
                            "elem.userId": {
                                $ne: socket.user._id
                            },
                            "elem.status": "approved"
                        }]
                    });
                    const populatedMessage =
                        await Message.findById(
                            newMessage._id
                        ).populate("senderId", "fullName mobileNumber roleSelection")
                        .populate({
                            path: "replyTo",
                            select: "message messageType senderId createdAt",
                            populate: {
                                path: "senderId",
                                select: "fullName mobileNumber roleSelection"
                            }
                        })
                    io.to(
                        cleanGroupCode
                    ).emit(
                        "receiveMessage",
                        populatedMessage
                    );

                } catch (error) {

                    socket.emit(
                        "errorMessage", {
                            message: error.message,
                        }
                    );
                }
            }
        );

        socket.on("deleteMessage", async(data) => {
            try {
                const messageId = data && data.messageId;

                if (!messageId) {
                    return socket.emit("errorMessage", {
                        message: "messageId is required"
                    });
                }

                const message = await Message.findById(messageId);

                if (!message) {
                    return socket.emit("errorMessage", {
                        message: "Message not found"
                    });
                }

                const group = await Group.findById(message.groupId);

                if (!group) {
                    return socket.emit("errorMessage", {
                        message: "Group not found"
                    });
                }

                const userId = socket.user._id;
                const isPresident =
                    group.presidentId &&
                    group.presidentId.toString() === userId.toString();
                const isSecretary =
                    group.secretaryId &&
                    group.secretaryId.toString() === userId.toString();
                const isTreasurer =
                    group.treasurerId &&
                    group.treasurerId.toString() === userId.toString();
                const member = group.members.find(
                    (m) =>
                    m.userId &&
                    ((m.userId._id || m.userId).toString() === userId.toString())
                );
                if (!isPresident && !isSecretary && !isTreasurer) {
                    if (!member || member.status !== "approved") {
                        return socket.emit("errorMessage", {
                            message: "You are not approved member of this group"
                        });
                    }
                }

                const isOwnMessage =
                    message.senderId.toString() === socket.user._id.toString();

                if (!isOwnMessage && !isPresident) {
                    return socket.emit("errorMessage", {
                        message: "You can delete only your own message"
                    });
                }

                message.isDeleted = true;
                message.message = "This message was deleted";
                message.deletedBy = socket.user._id;
                message.deletedAt = new Date();

                await message.save();

                io.to(group.groupCode).emit("messageDeleted", {
                    messageId: message._id,
                    groupCode: group.groupCode,
                    deletedBy: socket.user._id,
                    deletedAt: message.deletedAt
                });
            } catch (error) {
                socket.emit("errorMessage", {
                    message: error.message
                });
            }
        });

        socket.on("pinMessage", async(data) => {
            try {
                const messageId = data && data.messageId;

                if (!messageId) {
                    return socket.emit("errorMessage", {
                        message: "messageId is required"
                    });
                }

                const message = await Message.findById(messageId);

                if (!message) {
                    return socket.emit("errorMessage", {
                        message: "Message not found"
                    });
                }

                const group = await Group.findById(message.groupId);

                if (!group) {
                    return socket.emit("errorMessage", {
                        message: "Group not found"
                    });
                }

                const isPresident =
                    group.presidentId &&
                    group.presidentId.toString() === userId.toString();
                if (!isPresident) {
                    return socket.emit("errorMessage", {
                        message: "Only President can pin message"
                    });
                }

                message.isPinned = true;
                message.pinnedBy = socket.user._id;
                message.pinnedAt = new Date();

                await message.save();

                const populatedMessage = await Message.findById(message._id)
                    .populate("senderId", "fullName mobileNumber roleSelection")
                    .populate("pinnedBy", "fullName mobileNumber roleSelection");

                io.to(group.groupCode).emit("messagePinned", {
                    groupCode: group.groupCode,
                    message: populatedMessage
                });
            } catch (error) {
                socket.emit("errorMessage", {
                    message: error.message
                });
            }
        });

        socket.on("unpinMessage", async(data) => {
            try {
                const messageId = data && data.messageId;

                if (!messageId) {
                    return socket.emit("errorMessage", {
                        message: "messageId is required"
                    });
                }

                const message = await Message.findById(messageId);

                if (!message) {
                    return socket.emit("errorMessage", {
                        message: "Message not found"
                    });
                }

                const group = await Group.findById(message.groupId);

                if (!group) {
                    return socket.emit("errorMessage", {
                        message: "Group not found"
                    });
                }

                const isPresident =
                    group.presidentId &&
                    group.presidentId.toString() === userId.toString();

                if (!isPresident) {
                    return socket.emit("errorMessage", {
                        message: "Only president can unpin message"
                    });
                }

                message.isPinned = false;
                message.pinnedBy = null;
                message.pinnedAt = null;

                await message.save();

                io.to(group.groupCode).emit("messageUnpinned", {
                    groupCode: group.groupCode,
                    messageId: message._id
                });
            } catch (error) {
                socket.emit("errorMessage", {
                    message: error.message
                });
            }
        });

        socket.on("reactMessage", async(data) => {
            try {
                const messageId = data && data.messageId;
                const emoji = data && data.emoji;

                if (!messageId || !emoji) {
                    return socket.emit("errorMessage", {
                        message: "messageId and emoji are required"
                    });
                }

                const message = await Message.findById(messageId);

                if (!message) {
                    return socket.emit("errorMessage", {
                        message: "Message not found"
                    });
                }

                const group = await Group.findById(message.groupId);

                if (!group) {
                    return socket.emit("errorMessage", {
                        message: "Group not found"
                    });
                }

                const userId = socket.user._id;
                const isPresident =
                    group.presidentId &&
                    group.presidentId.toString() === userId.toString();
                const isSecretary =
                    group.secretaryId &&
                    group.secretaryId.toString() === userId.toString();
                const isTreasurer =
                    group.treasurerId &&
                    group.treasurerId.toString() === userId.toString();
                const member = group.members.find(
                    (m) =>
                    m.userId &&
                    ((m.userId._id || m.userId).toString() === userId.toString())
                );
                if (!isPresident && !isSecretary && !isTreasurer) {
                    if (!member || member.status !== "approved") {
                        return socket.emit("errorMessage", {
                            message: "You are not approved member of this group"
                        });
                    }
                }
                const existingReactionIndex = message.reactions.findIndex(
                    (reaction) =>
                    reaction.userId.toString() === socket.user._id.toString()
                );

                if (existingReactionIndex !== -1) {
                    message.reactions[existingReactionIndex].emoji = emoji;
                    message.reactions[existingReactionIndex].reactedAt = new Date();
                } else {
                    message.reactions.push({
                        userId: socket.user._id,
                        emoji
                    });
                }

                await message.save();

                const updatedMessage = await Message.findById(message._id)
                    .populate("senderId", "fullName mobileNumber roleSelection")
                    .populate("reactions.userId", "fullName mobileNumber roleSelection");

                io.to(group.groupCode).emit("messageReacted", {
                    groupCode: group.groupCode,
                    messageId: message._id,
                    reactions: updatedMessage.reactions
                });
            } catch (error) {
                socket.emit("errorMessage", {
                    message: error.message
                });
            }
        });
        socket.on("removeReaction", async(data) => {
            try {
                const messageId = data && data.messageId;

                if (!messageId) {
                    return socket.emit("errorMessage", {
                        message: "messageId is required"
                    });
                }

                const message = await Message.findById(messageId);

                if (!message) {
                    return socket.emit("errorMessage", {
                        message: "Message not found"
                    });
                }

                const group = await Group.findById(message.groupId);

                if (!group) {
                    return socket.emit("errorMessage", {
                        message: "Group not found"
                    });
                }

                const userId = socket.user._id;
                const isPresident =
                    group.presidentId &&
                    group.presidentId.toString() === userId.toString();
                const isSecretary =
                    group.secretaryId &&
                    group.secretaryId.toString() === userId.toString();
                const isTreasurer =
                    group.treasurerId &&
                    group.treasurerId.toString() === userId.toString();
                const member = group.members.find(
                    (m) =>
                    m.userId &&
                    ((m.userId._id || m.userId).toString() === userId.toString())
                );
                if (!isPresident && !isSecretary && !isTreasurer) {
                    if (!member || member.status !== "approved") {
                        return socket.emit("errorMessage", {
                            message: "You are not approved member of this group"
                        });
                    }
                }


                message.reactions = message.reactions.filter(
                    (reaction) =>
                    reaction.userId.toString() !== socket.user._id.toString()
                );

                await message.save();

                const updatedMessage = await Message.findById(message._id)
                    .populate("reactions.userId", "fullName mobileNumber roleSelection");

                io.to(group.groupCode).emit("messageReactionRemoved", {
                    groupCode: group.groupCode,
                    messageId: message._id,
                    reactions: updatedMessage.reactions
                });
            } catch (error) {
                socket.emit("errorMessage", {
                    message: error.message
                });
            }
        });
        socket.on("starMessage", async(data) => {
            try {
                const messageId = data && data.messageId;

                if (!messageId) {
                    return socket.emit("errorMessage", {
                        message: "messageId is required"
                    });
                }

                const message = await Message.findById(messageId);

                if (!message) {
                    return socket.emit("errorMessage", {
                        message: "Message not found"
                    });
                }

                const group = await Group.findById(message.groupId);

                if (!group) {
                    return socket.emit("errorMessage", {
                        message: "Group not found"
                    });
                }

                const userId = socket.user._id;
                const isPresident =
                    group.presidentId &&
                    group.presidentId.toString() === userId.toString();
                const isSecretary =
                    group.secretaryId &&
                    group.secretaryId.toString() === userId.toString();
                const isTreasurer =
                    group.treasurerId &&
                    group.treasurerId.toString() === userId.toString();
                const member = group.members.find(
                    (m) =>
                    m.userId &&
                    ((m.userId._id || m.userId).toString() === userId.toString())
                );
                if (!isPresident && !isSecretary && !isTreasurer) {
                    if (!member || member.status !== "approved") {
                        return socket.emit("errorMessage", {
                            message: "You are not approved member of this group"
                        });
                    }
                }

                const alreadyStarred = message.starredBy.some(
                    (star) => star.userId.toString() === socket.user._id.toString()
                );

                if (!alreadyStarred) {
                    message.starredBy.push({
                        userId: socket.user._id
                    });

                    await message.save();
                }

                socket.emit("messageStarred", {
                    groupCode: group.groupCode,
                    messageId: message._id,
                    starredBy: socket.user._id,
                    starredAt: new Date()
                });
            } catch (error) {
                socket.emit("errorMessage", {
                    message: error.message
                });
            }
        });
        socket.on("unstarMessage", async(data) => {
            try {
                const messageId = data && data.messageId;

                if (!messageId) {
                    return socket.emit("errorMessage", {
                        message: "messageId is required"
                    });
                }

                const message = await Message.findById(messageId);

                if (!message) {
                    return socket.emit("errorMessage", {
                        message: "Message not found"
                    });
                }

                const group = await Group.findById(message.groupId);

                if (!group) {
                    return socket.emit("errorMessage", {
                        message: "Group not found"
                    });
                }

                const userId = socket.user._id;
                const isPresident =
                    group.presidentId &&
                    group.presidentId.toString() === userId.toString();
                const isSecretary =
                    group.secretaryId &&
                    group.secretaryId.toString() === userId.toString();
                const isTreasurer =
                    group.treasurerId &&
                    group.treasurerId.toString() === userId.toString();
                const member = group.members.find(
                    (m) =>
                    m.userId &&
                    ((m.userId._id || m.userId).toString() === userId.toString())
                );
                if (!isPresident && !isSecretary && !isTreasurer) {
                    if (!member || member.status !== "approved") {
                        return socket.emit("errorMessage", {
                            message: "You are not approved member of this group"
                        });
                    }
                }

                message.starredBy = message.starredBy.filter(
                    (star) => star.userId.toString() !== socket.user._id.toString()
                );

                await message.save();

                socket.emit("messageUnstarred", {
                    groupCode: group.groupCode,
                    messageId: message._id,
                    unstarredBy: socket.user._id
                });
            } catch (error) {
                socket.emit("errorMessage", {
                    message: error.message
                });
            }
        });
        socket.on("disconnect", () => {});
    });
};

module.exports = initializeSocket;