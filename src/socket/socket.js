const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

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
        console.log("User connected:", socket.user.fullName);

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

                const isApprovedMember = group.members.some(
                    (m) =>
                    m.userId &&
                    m.userId.toString() === socket.user._id.toString() &&
                    m.status === "approved"
                );

                if (!isApprovedMember) {
                    return socket.emit("errorMessage", {
                        message: "You are not approved member of this group"
                    });
                }

                socket.join(cleanGroupCode);

                socket.emit("joinedGroup", {
                    message: "Joined group chat successfully",
                    groupCode: cleanGroupCode
                });
            } catch (error) {
                socket.emit("errorMessage", {
                    message: error.message
                });
            }
        });

        socket.on("sendMessage", async(data) => {
            try {
                const groupCode = data && data.groupCode;
                const message = data && data.message;
                const messageType = data && data.messageType;

                const cleanGroupCode = String(groupCode || "").trim();

                if (!cleanGroupCode || !message) {
                    return socket.emit("errorMessage", {
                        message: "groupCode and message are required"
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

                const isApprovedMember = group.members.some(
                    (m) =>
                    m.userId &&
                    m.userId.toString() === socket.user._id.toString() &&
                    m.status === "approved"
                );

                if (!isApprovedMember) {
                    return socket.emit("errorMessage", {
                        message: "You are not approved member of this group"
                    });
                }

                const newMessage = await Message.create({
                    groupId: group._id,
                    senderId: socket.user._id,
                    messageType: messageType || "text",
                    message,
                    readBy: [{
                        userId: socket.user._id
                    }]
                });

                const populatedMessage = await Message.findById(newMessage._id)
                    .populate("senderId", "fullName mobileNumber roleSelection");

                socket.join(cleanGroupCode);

                io.to(cleanGroupCode).emit("receiveMessage", populatedMessage);
            } catch (error) {
                socket.emit("errorMessage", {
                    message: error.message
                });
            }
        });

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

                const isApprovedMember = group.members.some(
                    (m) =>
                    m.userId &&
                    m.userId.toString() === socket.user._id.toString() &&
                    m.status === "approved"
                );

                if (!isApprovedMember) {
                    return socket.emit("errorMessage", {
                        message: "You are not approved member of this group"
                    });
                }

                const isOwnMessage =
                    message.senderId.toString() === socket.user._id.toString();

                const isAdmin =
                    group.adminId &&
                    group.adminId.toString() === socket.user._id.toString();

                if (!isOwnMessage && !isAdmin) {
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

                const isAdmin =
                    group.adminId &&
                    group.adminId.toString() === socket.user._id.toString();

                if (!isAdmin) {
                    return socket.emit("errorMessage", {
                        message: "Only admin can pin message"
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

                const isAdmin =
                    group.adminId &&
                    group.adminId.toString() === socket.user._id.toString();

                if (!isAdmin) {
                    return socket.emit("errorMessage", {
                        message: "Only admin can unpin message"
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

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.user.fullName);
        });
    });
};

module.exports = initializeSocket;