const Listing = require("./models/listing");
const {listingSchema, reviewSchema} = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");

module.exports.isLoggedIn = (req, res, next) => {
if(!req.isAuthenticated()){
    // save the url the user requested so we can redirect after login
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "Login first to create listing");
    return res.redirect("/login");
} 
 
 next();
 
    }

    module.exports.saveRedirectUrl = (req, res, next) => {
        if(req.session.redirectUrl){
            res.locals.redirectUrl = req.session.redirectUrl;
        }
        next();
    };  

    module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if(! listing.owner.equals(res.locals.currUser._id)){
        req.flash("error", "You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
    };

    module.exports.validateListing = (req, res, next) => {
    const {error} = listingSchema.validate(req.body);
    if(error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, msg);
    } else {
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if(error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, msg);
    } else {
        next();
    }
}