//-------------------routes for different pages------------------------
const express=require("express")
const passport = require("passport");
const router=express.Router()
const userController = require("../controllers/user/userController");
const profileController=require("../controllers/user/profileController")
const { userAuth } = require('../middleware/auth'); 
const productController=require("../controllers/user/productController")
const wishlistController=require("../controllers/user/wishlistController")
const cartController = require('../controllers/user/cartController');

//------------------------error managment-----------------------------
router.get("/pageNotFound",userController.pageNotFound)
//----------------------user signup managment-------------------------
router.get("/signup",userController.loadSignup)
router.post("/signup",userController.signup);
router.post("/verify-otp", userController.verifyOtp);
router.get("/success", userController.loadSuccess);
//-----------------------Resend OTP page-----------------------------
router.post("/resend-otp", userController.resendOtp); 
//----------------------google auth----------------------------------
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup', successRedirect: '/success',}),(req,res)=>{
    res.redirect('/')
})
//----------------------login managment---------------------------------
router.get("/login",userController.loadLogin)
router.post("/login",userController.login)
router.get("/logout",userController.logout)
//----------------------home page &shopping page------------------------
router.get("/",userController.loadHomepage)
router.get("/shop",userAuth,userController.loadShoppingPage)
router.post("/search",userAuth,userController.searchProducts)
router.get("/filter",userAuth,userController.filterProduct)
router.get("/filterPrice",userAuth,userController.filterByPrice)
//-----------------------profile managment-------------------------------
router.get("/forget-password",profileController.getForgotPassPage)
router.post("/forgot-email-valid",profileController.forgotEmailValid)
router.post("/verify-passForgot-otp",profileController.verifyForgotPassOtp)
router.get("/reset-password",profileController.getResetPassPage)
router.post("/resend-forgot-otp",profileController.resendOtp)
router.post("/reset-password",profileController.postNewPassword)
router.get("/userProfile", userAuth, profileController.userProfile);
router.get("/change-email",userAuth,profileController.changeEmail)
router.post("/change-email",profileController.changeEmailValid)
router.post("/verify-email-otp",userAuth,profileController.VerifyEmailOtp)
router.post("/update-email",userAuth,profileController.updateEmail)
router.get("/change-password",userAuth,profileController.changePassword)
router.post("/change-password",profileController.changePasswordValid)
router.post("/verify-changepassword-otp",userAuth,profileController.VerifyChangePassOtp)
//--------------------------adress managment---------------------------------
router.get("/addAddress",userAuth,profileController.addAddress)
router.post("/addAddress",userAuth,profileController.postaddAddress)
router.get("/editAddress",userAuth,profileController.editAddress)
router.post("/editAddress",userAuth,profileController.postEditAddress)
router.get("/deleteAddress",userAuth,profileController.deleteAddress)
//--------------------------product managment---------------------------------
router.get("/productDetails", userAuth, productController.productDetails);
//--------------------------wishlist managment--------------------------------
router.get("/wishlist",userAuth,wishlistController.loadWishlist)
router.post("/addToWishlist",userAuth,wishlistController.addToWishlist)
router.get("/removeFromWishlist",userAuth,wishlistController.removeProduct)
// Cart Management
router.get("/cart", userAuth, cartController.getCartPage)
router.post("/addToCart",userAuth, cartController.addToCart)
router.post("/changeQuantity", userAuth,cartController.changeQuantity)
router.get("/deleteItem", userAuth, cartController.deleteProduct)





//--------------------------exports module----------------------------------
module.exports=router;