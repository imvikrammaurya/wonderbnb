const User = require("../models/user.js");


module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs", {searchParams: {}});
};

module.exports.signup = async (req, res) => {
    try{
    let {username, email, password} = req.body;
    const newUser = new User ({email, username});
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
        if(err){
           return next(err);
        }
          req.flash("success", "Welcome to wonderlust");
    res.redirect("/listings");
    });
    }catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }
    
};


module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs", {searchParams: {}});
};

module.exports.login = async(req, res) => {
    req.flash("success", "welcome back to wonderlust");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);

};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if(err){
           return next(err);
        }
        req.flash("success", "You are Logged Out Now");
        res.redirect("/listings");
    });
};

module.exports.showWishlist = async (req, res) => {
  // Find the current user and populate their wishlist with listing details
  const user = await User.findById(req.user._id).populate("wishlist");
  
  if (!user) {
    req.flash("error", "User not found.");
    return res.redirect("/listings");
  }

  res.render("users/wishlist.ejs", {
    allListings: user.wishlist,
    wishlist: req.user.wishlist, // Pass the populated listings
    category: "My Wishlist",
    searchParams: {}, // For the navbar
  });
};