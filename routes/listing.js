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

router.route("/:id")
.get( wrapAsync (listingController.showListing))
.put( isLoggedIn, isOwner, upload.single('image'), validateListing, wrapAsync(listingController.updateListing))
.delete( isLoggedIn, isOwner, wrapAsync (listingController.destroyListing))


//Index route - we write it in router.route ("/")
 


//Show route - we write it in router.route ("/:id")


//Create Route - we write it in router.route ("/")


//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync (listingController.renderEditForm));



//Update Route - we write it in router.route ("/:id")



//Delete Routew - we write it in router.route ("/:id")



module.exports = router;