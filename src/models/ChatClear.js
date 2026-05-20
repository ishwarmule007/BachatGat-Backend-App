const mongoose = require("mongoose");

const chatClearSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    clearedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

chatClearSchema.index({ userId: 1, groupId: 1 }, { unique: true });

module.exports = mongoose.model("ChatClear", chatClearSchema);