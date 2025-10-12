const Review = require("../models/review");
const Listing = require("../models/listing");

// This is a helper function we'll create for average rating
async function recalculateAverageRating(listingId) {
    const listing = await Listing.findById(listingId).populate("reviews");
    if (listing.reviews.length === 0) {
        listing.averageRating = 0;
    } else {
        let totalRating = listing.reviews.reduce((sum, review) => sum + review.rating, 0);
        listing.averageRating = totalRating / listing.reviews.length;
    }
    await listing.save();
}


module.exports.createReview = async (req, res) => {
   let listing = await Listing.findById(req.params.id);
   let newReview = new Review(req.body.review);
   newReview.author = req.user._id;
   console.log(newReview);

   listing.reviews.push(newReview);

   await newReview.save();
   await listing.save();
   console.log("new review saved");
   await recalculateAverageRating(req.params.id);
    req.flash('success', `New Review Created!`);
   res.redirect(`/listings/${listing._id}`);
};


module.exports.destroyReview = async (req, res) => {
    let {id, reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    await recalculateAverageRating(id);
     req.flash('success', `Review Successfully deleted `);

    res.redirect(`/listings/${id}`);
};