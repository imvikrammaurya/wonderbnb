const Listing = require("../models/listing");

// COMBINED AND CORRECTED INDEX FUNCTION
module.exports.index = async (req, res) => {
    const { category } = req.query; // Get category from query if it exists
    const filter = category ? { category: category } : {}; // Create a filter if a category is provided

    const allListings = await Listing.find(filter); // Apply the filter

    // Always pass an empty searchParams for the homepage/category pages
    res.render("listings/index.ejs", {
        allListings,
        category,
        searchParams: {}
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", {searchParams: {}});
};

module.exports.showListing = async(req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews", populate : {path: "author",},}).populate("owner");
    if(!listing){
        req.flash('error', `Listing you requested for does not exist!`);
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", {listing, searchParams: {}});
};

module.exports.createListing = async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    await newListing.save();
    req.flash('success', `Successfully added "${newListing.title}"`);
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash('error', `Listing you requested for does not exist!`);
        return res.redirect('/listings');
    }
    if(!listing.owner.equals(res.locals.currUser._id)){
        req.flash("error", "You don't have permission to edit this listing.");
        return res.redirect(`/listings/${id}`);
    }

    let orginalImageUrl = listing.image.url;
    orginalImageUrl = orginalImageUrl.replace("/upload", "/upload/h_300/w_250/");
    res.render("listings/edit.ejs", {listing, orginalImageUrl , searchParams: {}});
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if(typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url, filename};
    await listing.save();
    }
    
    req.flash('success', `Successfully Updated Listing`);
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash('success', `Successfully deleted`);
    res.redirect("/listings");
};

module.exports.searchListings = async (req, res) => {
    // 1. Get search parameters from the URL query
    const { location, dates, guests } = req.query;

    // 2. Build the database query for location
    const locationQuery = location ? {
        $or: [
            { country: new RegExp(location, 'i') },
            { location: new RegExp(location, 'i') }
        ]
    } : {};

    const listings = await Listing.find(locationQuery);

    // 3. Parse dates and guests, with defaults
    const [startDateStr, endDateStr] = dates ? dates.split(' - ') : [null, null];
    const startDate = startDateStr ? new Date(startDateStr.trim()) : new Date();
    const endDate = endDateStr ? new Date(endDateStr.trim()) : new Date(startDate);
    if (!endDateStr) {
        endDate.setDate(startDate.getDate() + 1); // Default to one night
    }

    const numAdults = guests ? parseInt(guests.match(/(\d+) Adult/)?.[1] || '1') : 1;
    const numChildren = guests ? parseInt(guests.match(/(\d+) Child/)?.[1] || '0') : 0;

    // 4. Calculate the dynamic price for each listing
    const updatedListings = listings.map(listing => {
        // --- THIS IS THE ONLY LINE THAT HAS CHANGED ---
        // It now correctly calculates price based on adults after the first one.
        let totalGuestPrice = listing.price * (1 + (0.10 * (numAdults - 1)));
        
        if (numChildren > 0) {
            totalGuestPrice *= (1 + (0.05 * numChildren));
        }

        let finalPrice = 0;
        let currentDate = new Date(startDate);

        while (currentDate < endDate) {
            const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            let dailyPrice = totalGuestPrice;

            switch (dayOfWeek) {
                case 6: // Saturday
                case 0: // Sunday
                    dailyPrice *= 1.40;
                    break;
                case 3: // Wednesday
                case 5: // Friday
                    dailyPrice *= 1.20;
                    break;
            }
            finalPrice += dailyPrice;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return { ...listing._doc, displayPrice: Math.round(finalPrice) };
    });

    res.render("listings/index.ejs", { allListings: updatedListings, category: "Search Results", searchParams: { location, dates, guests } });
};