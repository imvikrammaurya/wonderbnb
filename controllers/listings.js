const Listing = require("../models/listing");
const User = require("../models/user");

module.exports.index = async (req, res) => {
    const { category, sort, rating, amenities } = req.query;
    let filter = {};

    if (category) {
        filter.category = category;
    }

    if (rating) {
        filter.averageRating = { $gte: parseInt(rating) };
    }

    if (amenities) {
        let amenitiesList;
        if (Array.isArray(amenities)) {
            amenitiesList = amenities;
        } else {
            amenitiesList = [amenities];
        }
        filter.amenities = { $all: amenitiesList };
    }

    let query = Listing.find(filter);

    if (sort) {
        if (sort === 'price_asc') {
            query = query.sort({ price: 1 });
        } else if (sort === 'price_desc') {
            query = query.sort({ price: -1 });
        }
    }

    const allListings = await query;

    res.render("listings/index.ejs", {
        allListings,
        category,
        searchParams: {},
        wishlist: req.user ? req.user.wishlist : [],
        showFilterButton: true
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", { searchParams: {} });
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author", }, }).populate("owner");

    if (!listing) {
        req.flash('error', `Listing you requested for does not exist!`);
        return res.redirect("/listings");
    }

    // Get price from query, or default to the listing's base price
    const displayPrice = req.query.price || listing.price;
    // Check if the price is a total (from search) or a nightly rate
    const isTotalPrice = !!req.query.price && req.query.price !== String(listing.price);

    res.render("listings/show.ejs", {
        listing,
        displayPrice,
        isTotalPrice,
        searchParams: {},
        wishlist: req.user ? req.user.wishlist : []
    });
};

module.exports.createListing = async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    await newListing.save();
    req.flash('success', `Successfully added "${newListing.title}"`);
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', `Listing you requested for does not exist!`);
        return res.redirect('/listings');
    }
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to edit this listing.");
        return res.redirect(`/listings/${id}`);
    }

    let orginalImageUrl = listing.image.url;
    orginalImageUrl = orginalImageUrl.replace("/upload", "/upload/h_300/w_250/");
    res.render("listings/edit.ejs", { listing, orginalImageUrl, searchParams: {} });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash('success', `Successfully Updated Listing`);
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
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



    res.render("listings/index.ejs", {
        allListings: updatedListings,
        category: "Search Results",
        searchParams: { location, dates, guests },
        wishlist: req.user ? req.user.wishlist : [],
        showFilterButton: true
    });
};

module.exports.renderPaymentPage = async (req, res) => {
    const { id } = req.params;
    const price = req.query.price;

    const listing = await Listing.findById(id).populate('reviews').populate('owner');
    if (!listing) {
        req.flash('error', 'Listing not found.');
        return res.redirect('/listings');
    }

    if (!price) {
        req.flash('error', 'Booking price is missing.');
        return res.redirect(`/listings/${id}`);
    }

    res.render('listings/payment.ejs', {
        listing,
        price,
        searchParams: {}
    });
};

// In controllers/listings.js

module.exports.calculatePrice = async (req, res) => {
    try { // Add a try...catch block to catch ANY error
        const { id } = req.params;
        const { dates, guests } = req.query;
        console.log(`[calculatePrice] Received request for ID: ${id}, Dates: ${dates}, Guests: ${guests}`);

        const listing = await Listing.findById(id);
        if (!listing) {
            console.error(`[calculatePrice] Listing not found for ID: ${id}`);
            return res.status(404).json({ error: "Listing not found" });
        }
        console.log(`[calculatePrice] Found listing: ${listing.title}, Base price: ${listing.price}`);

        // --- Date Parsing (using UTC) ---
        let startDate, endDate;
        if (dates && dates.includes(' - ')) {
            const [startDateStr, endDateStr] = dates.split(' - ');
            startDate = new Date(startDateStr.trim() + 'T00:00:00.000Z');
            endDate = new Date(endDateStr.trim() + 'T00:00:00.000Z');

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
                console.warn(`[calculatePrice] Invalid dates received: ${dates}. Falling back to default.`);
                startDate = new Date(); startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date(startDate); endDate.setUTCDate(startDate.getUTCDate() + 1);
            }
        } else {
            console.warn(`[calculatePrice] Dates missing or invalid format: ${dates}. Falling back to default.`);
            startDate = new Date(); startDate.setUTCHours(0, 0, 0, 0);
            endDate = new Date(startDate); endDate.setUTCDate(startDate.getUTCDate() + 1);
        }
        console.log(`[calculatePrice] Parsed Start Date: ${startDate.toISOString()}, End Date: ${endDate.toISOString()}`);
        // --- End Date Parsing ---

        const numAdults = guests ? parseInt(guests.match(/(\d+) Adult/)?.[1] || '1') : 1;
        const numChildren = guests ? parseInt(guests.match(/(\d+) Child/)?.[1] || '0') : 0;
        console.log(`[calculatePrice] Parsed Guests: Adults=${numAdults}, Children=${numChildren}`);

        let baseNightlyGuestPrice = listing.price * (1 + (0.10 * (numAdults - 1)));
        if (numChildren > 0) {
            baseNightlyGuestPrice *= (1 + (0.05 * numChildren));
        }
        console.log(`[calculatePrice] Base nightly price (with guests): ${baseNightlyGuestPrice}`);

        let finalPrice = 0;
        let currentDate = new Date(startDate);

        while (currentDate.getTime() < endDate.getTime()) {
            const dayOfWeek = currentDate.getUTCDay(); // 0=Sun, 6=Sat
            let dailyPrice = baseNightlyGuestPrice;
            console.log(`[calculatePrice] Processing date: ${currentDate.toISOString().split('T')[0]}, Day: ${dayOfWeek}`);

            switch (dayOfWeek) {
                case 6: case 0: dailyPrice *= 1.40; break;
                case 3: case 5: dailyPrice *= 1.20; break;
            }
            finalPrice += dailyPrice;
            console.log(`[calculatePrice] Daily price: ${dailyPrice.toFixed(2)}, Cumulative price: ${finalPrice.toFixed(2)}`);
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        const roundedFinalPrice = Math.round(finalPrice);
        console.log(`[calculatePrice] Final calculated price: ${roundedFinalPrice}`);
        res.json({ newPrice: roundedFinalPrice });

    } catch (error) { // Catch ANY unexpected error during the process
        console.error("[calculatePrice] UNEXPECTED ERROR:", error); // Log the full error to the terminal
        res.status(500).json({ error: "Internal server error during price calculation." });
    }
};

module.exports.toggleWishlist = async (req, res) => {
    const { id } = req.params; // The listing ID
    const userId = req.user._id; // The current user's ID

    const user = await User.findById(userId);
    const listing = await Listing.findById(id);
    if (!user || !listing) {
        req.flash("error", "Cannot find user or listing");
        return res.redirect("back");
    }

    // Check if the listing is already in the wishlist
    const index = user.wishlist.indexOf(listing._id);

    if (index > -1) {
        // Listing is in wishlist, so remove it
        user.wishlist.pull(listing._id);
        await user.save();
        res.json({ saved: false, message: "Listing removed from wishlist." });
    } else {
        // Listing is not in wishlist, so add it
        user.wishlist.push(listing._id);
        await user.save();
        res.json({ saved: true, message: "Listing added to wishlist." });
    }
};