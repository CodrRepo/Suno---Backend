const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        coverImage: {
            type: String,
            default: ''
        },
        genre: {
            type: String,
            enum: ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Electronic', 'Country', 'Metal', 'Folk', 'Other'],
            default: 'Other'
        },
        followers: {
            type: Number,
            default: 0
        }
    }, {
    timestamps: true
}
);

const Album = mongoose.model('Album', albumSchema);
module.exports = Album;