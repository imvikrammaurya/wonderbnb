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
        type: Object,
        default: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1473773508845-188df298d2d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG5hdHVyYWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
        },
        set: (v) => v.url === "" ? { url: "https://images.unsplash.com/photo-1473773508845-188df298d2d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG5hdHVyYWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60", filename: "listingimage" } : v,
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
});

listingSchema.post("findOneAndDelete", async (listing) => {
   if(listing){
      await Review.deleteMany({_id: {$in: listing.reviews}});
      }
   })
   

const Listing = mongoose.model("listing", listingSchema);

module.exports = Listing;