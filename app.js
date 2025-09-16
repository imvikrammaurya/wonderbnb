const express = require("express");
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const methodOverride = require("method-override");
const path = require("path");
const app = express();
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wonderlust";
main().then(() => {
    console.log("Connect to mongodb");
}).catch(err =>{
    console.log(err);
})
async function main() {
    await mongoose.connect(MONGO_URL);
};


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));




app.get("/", (req, res) => {
    res.send("hii I'm root");
});


const validateListing = (req, res, next) => {
 let {error} = listingSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(",");  
        throw new ExpressError(400, msg);  
        
    }else{
        next();
    }
}

//Index route
app.get("/listings", wrapAsync (async (req, res) => {
  const allListings = await Listing.find({});
   res.render("listings/index.ejs", {allListings});
}));


//New Route 
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});






//Show route
app.get("/listings/:id", wrapAsync (async(req, res)  =>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", {listing});
}));




//Create Route
app.post("/listings", validateListing, wrapAsync(async (req, res, next) => { 
    // Check first
   
        const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");


    
}));


//Edit Route
app.get("/listings/:id/edit", wrapAsync (async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", {listing});
}));


//Update Route
app.put("/listings/:id", validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
}));

//Delete Routew
app.delete("/listings/:id", wrapAsync (async(req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

// app.get("/testListing", async (req, res) => {
//     const sampleListing = new Listing({
//         title: "My New villa",
//         description: "Rent the best beach",
//         price: 1200,
//         location: "Calangut",
//         country: "India"
//     });
//     await sampleListing.save();
//     console.log("Sample was saved");
//     res.send("successfull testing");
// });

app.use((req, res, next) => {
    next (new ExpressError(404, "Page Not Found"));
});



app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { message });
});



app.listen(8080, () =>{
    console.log("App is listning to port 8080");
});