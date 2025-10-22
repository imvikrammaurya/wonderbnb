const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");

const listingController = require("../controllers/listings.js");
const multer  = require('multer')
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });


router.route("/")
.get(wrapAsync (listingController.index))
.post(isLoggedIn, upload.single('listing[image][url]'), validateListing, wrapAsync(listingController.createListing));

//New Route 
router.get("/new", isLoggedIn, listingController.renderNewForm);




//Index route - we write it in router.route ("/")
 


//Show route - we write it in router.route ("/:id")


//Create Route - we write it in router.route ("/")





//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

// NEW SEARCH ROUTE
router.get("/search", wrapAsync(listingController.searchListings));

router.get("/:id/calculate-price", wrapAsync(listingController.calculatePrice)); // <-- Move this UP
router.get("/:id/payment", isLoggedIn, wrapAsync(listingController.renderPaymentPage));
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync (listingController.renderEditForm)); // <-- Edit route AFTER calculate-price

router.route("/:id")
.get( wrapAsync (listingController.showListing))
.put( isLoggedIn, isOwner, upload.single('image'), validateListing, wrapAsync(listingController.updateListing))
.delete( isLoggedIn, isOwner, wrapAsync (listingController.destroyListing))


// NEW ROUTE for payment review page
// router.get("/:id/payment", isLoggedIn, wrapAsync(listingController.renderPaymentPage));

// //Edit Route
// router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync (listingController.renderEditForm));

//Update Route - we write it in router.route ("/:id")



//Delete Routew - we write it in router.route ("/:id")



module.exports = router;