const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema ({
    title: {
       type: String,
       required : true,
    },
    description: {
       type: String,
       required : true,
    },
    image: {
        url: String,
        filename: String,
   },

    price: {
       type: Number,
       required : true,
    },
    location: {
       type: String,
       required : true,
    },
    country : {
       type: String, 
       required : true,
    },
    reviews: [
      {
         type : Schema.Types.ObjectId,
         ref: "Review",
      }
    ],
    owner : {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    averageRating: {
    type: Number,
    default: 0,
  },
    category: {
    type: [String],
    enum: [
      "Trending",
      "Rooms",
      "Iconic Cities",
      "Mountains",
      "Castles",
      "Amazing Pools",
      "Arctic",
      "Camping",
      "Dome",
      "Boats",
      "Farms",
    ],
  },
});

listingSchema.post("findOneAndDelete", async (listing) => {
   if(listing){
      await Review.deleteMany({_id: {$in: listing.reviews}});
      }
   })
   

const Listing = mongoose.model("listing", listingSchema);

module.exports = Listing;