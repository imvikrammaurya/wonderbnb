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
  filename: {
    type: String,
    default: "https://static.toiimg.com/thumb/msid-118821086,width-1280,height-720,resizemode-4/118821086.jpg"
  },
  url: {
    type: String,
    default: "https://static.vecteezy.com/system/resources/previews/012/400/885/large_2x/tropical-sunset-beach-and-sky-background-as-exotic-summer-landscape-with-beach-swing-or-hammock-and-white-sand-and-calm-sea-beach-banner-paradise-island-beach-vacation-or-summer-holiday-destination-photo.jpg"
  }
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
    ]
});

listingSchema.post("findOneAndDelete", async (listing) => {
   if(listing){
      await Review.deleteMany({_id: {$in: listing.reviews}});
      }
   })
   

const Listing = mongoose.model("listing", listingSchema);

module.exports = Listing;