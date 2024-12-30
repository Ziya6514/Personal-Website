const User=require("../models/userschema")



//------------------user middleware------------------------
const userAuth = (req, res, next) => {
  console.log('User Session:', req.session.user); // Add this line to debug session

  if (req.session.user && req.session.user.id) {  // Ensure the user is logged in and their ID exists in the session
    User.findById(req.session.user.id)
      .then(data => {
        if (data && !data.isBlocked) {// Check if user is found and is not blocked
          console.log("User authenticated successfully:", data);
          next(); // Proceed to the next middleware or route handler
        } else {
          console.log("User is blocked or not found.");
          res.redirect("/login"); // Redirect to login if blocked or not found
        }
      })
      .catch(error => {
        console.error("Error in userAuth middleware:", error.message);
        res.status(500).send("Internal Server Error");
      });
  } else {
    console.log("No user session found. Redirecting to login.");
    res.redirect("/login"); // Redirect to login if no session exists
  }
};
//------------------admin middleware----------------------------
const adminAuth=(req,res,next)=>{// protect admin-specific routes in a web application
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next()
        }else{
            res.redirect("/admin/login")
        }
    })
    .catch(error=>{
        console.log("Error in adminauth middleware",error)
        res.status(500).send("InternaL Server Error")
    })
}

module.exports={
    userAuth,
    adminAuth,
}