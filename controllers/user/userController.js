const User = require("../../models/userschema");
const Category=require("../../models/categoryschema")
const Brand=require("../../models/brandschema")
const Product=require("../../models/productschema")
const Banner=require("../../models/bannerschema")
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');


//-----------------function for error page---------------------
const pageNotFound=async(req,res)=>{
    try {
        res.render("page-404")
    } catch (error) {
        res.redirect("/pageNoteFound")
    }
}

// ------------=-----Render the homepage-----------------
const loadHomepage = async (req, res) => {
    try {
        const today = new Date().toISOString();
        const findBanner = await Banner.find({
            // startDate: { $lt: new Date(today) },
            // endDate: { $gt: new Date(today) },
        });

        const userSession = req.session.user;
        const categories = await Category.find({ isListed: true });

        let productData = await Product.find({
            isBlocked: false,
            category: { $in: categories.map((category) => category._id) },
            quantity: { $gt: 0 },
        });

        // Sort by createdOn date (latest first) and slice to the top 4
        productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
        productData = productData.slice(0, 4);

        let userData = null;
        if (userSession) {
            // Fetch user data using the correct ID field
            userData = await User.findById(userSession.id);
        }

        // Render the homepage with user, products, and banners
        res.render("home", {
            user: userData,
            products: productData,
            banner: findBanner || [],
        });
    } catch (error) {
        console.error("Error loading homepage:", error);
        res.status(500).send("Server error");
    }
};



// -------------------Rendering signup page------------------
const loadSignup = async (req, res) => {
    try {
        return res.render("signup");//--rendering signup page
    } catch (error) {
        console.log("Signup page not found");
        res.status(500).send("Server error");// handle errors
    }
};

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();//generatate a random 6 digit otp for verify
}
async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`,
        });

        console.log("Email sent status:", info); 
        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}


//----------------------Handle user signup---------------------

const signup = async (req, res) => {
    try {
        console.log("Signup process started");

        const { name, phone, email, password, cpassword } = req.body;//get user input data
        console.log("Received data:", { name, phone, email, password, cpassword });

     // Check if passwords match
        if (password !== cpassword) {
            console.log("Passwords do not match");
            return res.render("signup", { message: "Passwords do not match" });
        }
        // Check if the user already exists

        const findUser = await User.findOne({ email });
        if (findUser) {
            console.log("User with this email already exists");
            return res.render("signup", { message: "User with this email already exists" });
        }

        const otp = generateOtp();
        console.log("Generated OTP:", otp);
        
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            console.log("Failed to send email");
            return res.json("email-error");
        }

        req.session.userOtp = otp;//srore otp in session
        req.session.userData = { name, phone, email, password };

        console.log("OTP Sent:", otp);
        
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        const newUser = new User({
            name,
            phone,
            email,
            password: hashedPassword,
            isAdmin: false,  // Ensure isAdmin is false for regular users
                 googleId: null,
        });
        await newUser.save();
        

        return res.render("verify", { message: null });// Render OTP verification page

    } catch (error) {
        console.error("Signup error", error);
        res.redirect("/pageNotFound");     // Redirect to 404 page if error occu
    }
};
//-----------------------handile verification page--------------------
const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body; // Get the OTP entered by the user
        const { userOtp } = req.session; // Retrieve the OTP and user data from the session

        if (otp === userOtp) {
            console.log("OTP verified successfully");
            return res.render('success');    // Render success page if OTP matches
        } else {
            console.log("OTP verification failed");
            return res.render('verify', { message: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.error("Verification error", error);
        res.redirect("/pageNotFound"); // Redirect on error
    }
};

//--------------------------handle the signup success---------------------
const loadSuccess = async (req, res) => {
    try {
        return res.render("success"); // Renders the success page
    } catch (error) {
        console.error("Error loading success page", error);
        res.status(500).send("Server error");
    }
};


//-------------------Load the Resend OTP page----------------------
const loadResendOtpPage = (req, res) => {
    try {
        res.render('resend-otp'); 
    } catch (error) {
        console.error("Error loading Resend OTP page", error);
        res.status(500).send("Server error");
    }
};
//-------------------- Handle Resend OTP functionality--------------
const resendOtp = async (req, res) => {
    try {
        const newOtp = Math.floor(100000 + Math.random() * 900000); // Generate new 6-digit OTP
        req.session.userOtp = newOtp; // Store in session

        // Logic to send the OTP via email/SMS (e.g., using Nodemailer)
        console.log("New OTP sent:", newOtp);
        res.status(200).send("OTP resent successfully.");
    } catch (error) {
        console.error("Error resending OTP", error);
        res.status(500).send("Server error");
    }
};
//------------------------handling successpage----------------------

const loadLogin = async(req,res)=>{
    try {
        if(!req.session.user){
          return res.render("login")
        }else{
           res.redirect("/")
        }
    } catch (error) {
        res.redirect("pageNotFound")
         
    }
}
//-------------------rendering login --------------------

const login = async (req, res) => {
    try {
        const { email, password } = req.body;// Get login credentials from the user
        const trimmedPassword = password.trim();// Check if user exists (not an admin)
        console.log("Login attempt:", { email, password });  

        const findUser = await User.findOne({ isAdmin: 0, email });

        if (!findUser) {
            return res.render("login",{message:"user not found"})
        }

        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" });
        }
        console.log("Stored password hash:", findUser.password);
        console.log("Entered password:", trimmedPassword);


        const passwordMatch = await bcrypt.compare(trimmedPassword, findUser.password);
        console.log("Password match result:", passwordMatch);  // Log the entered password

        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect Password" });
        }

        req.session.user = {
        id:findUser._id.toString(),
        name:findUser.name,
        email:findUser.email,
        };
        console.log("Session after login:", req.session);
        return res.redirect("/"); // Redirect to homepage after successful login
    } catch (error) {
        console.error("Login error", error);
        res.render("login", { message: "Login failed. Please try again later." });
    }
};
//--------------------------handling for loagout----------------
const logout=async (req,res)=>{
    try {
        
   req.session.destroy((err)=>{
    if(err){
    console.log("Session destructure error",err.message)
   return res.redirect("/pageNotFound")    
}
return res.redirect("/login")

   })

    } catch (error) {

        console.log("Logout error",error)
        res.redirect("/pageNotFound")
    }
}
//---------------------rendering shopping page-----------------------
const loadShoppingPage=async (req,res)=>{
    try {
        const user=req.user//access user from session
        const userData=await User.findOne({_id:user}) //fetch usedata from db
        const categories=await Category.find({isListed:true})
        const categoryId=categories.map((category)=>category._id.toString())
        const page=parseInt(req.query.page) || 1
        const limit=9
        const skip=(page-1)*limit
        const products=await Product.find({
            isBlocked:false,
            category:{$in:categoryId},
            quantity:{$gt:0},
        }).sort({createdOn:-1}).skip(skip).limit(limit).lean()
        console.log("products",products)
        const totalProducts=await Product.countDocuments({
            isBlocked:false,
            category:{$in:categoryId},

        })
        const totalPages=Math.ceil(totalProducts/limit)
        const brands=await Brand.find({isBlocked:false}) //find brand and category
        const categoriesWithIds=categories.map(category=>({_id:category._id,name:category.name}))

        res.render("shop",{
            user:userData,
            products:products,
            category:categoriesWithIds,
            brand:brands,
            totalProducts:totalProducts,
            currentPage:page,
            totalPages
        })
    } catch (error) {
        console.error("Error")
        res.redirect("/pageNotFound")
    }
}
//--------------------function define forfiltering product------------------------

const filterProduct=async (req,res)=>{
    try {
        const userId=req.session.user._id;
        const category=req.query.category
        const brand=req.query.brand
        const findCategory=category ? await Category.findOne({_id:category}):null
        const findBrand=brand ? await Brand.findOne({_id:brand}):null
        const brands=await Brand.find({}).lean()
        const query={
            isBlocked:false,
            quantity:{$gt:0}, 
        }
        if(findCategory){
            query.category=findCategory._id
        }
        if(findBrand){
            query.brand=findBrand.brandName
        }
        let findProducts=await Product.find(query).lean()
        findProducts.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn))

        const categories=await Category.find({isListed:true})
        let itemsPerPage=6
        let currentPage = parseInt(req.query.page) || 1
        let startIndex=(currentPage-1)*itemsPerPage
        let endIndex=startIndex+itemsPerPage
        let totalPages = Math.ceil(findProducts.length / itemsPerPage)
        let currentProduct=findProducts.slice(startIndex,endIndex)
        let userData=null
        if(userId){
            userData=await User.findOne({_id:userId})
            if(userData){
                const searchEntry={
                    category:findCategory ? findCategory._id:null,
                    brand:findBrand ? findBrand.brandName:null,
                    searchedOn:new Date(),
                }
                userData.searchHistory.push(searchEntry)
                await userData.save()
            }
        }

        req.session.filteredProducts = currentProduct;
        res.render("shop",{
            user:userData,
            products:currentProduct,
            category:categories,
            brand:brands,
            totalPages,
            currentPage,
            selectedCategory:category || null,
            selectedBrand:brand || null,
        })
    } catch (error) {
        console.error("Error in filterProduct:", error.message);
        res.redirect("/pageNotFound")
    }
}
//-----------------------rendering filterdred product by price------------------------
const filterByPrice=async(req,res)=>{
    try {
        const userId=req.session.user._id
        const userData=await User.findOne({_id:userId})
        const brands=await Brand.find({}).lean()
        const categories=await Category.find({isListed:true}).lean()
        let findProducts=await Product.find({
            salePrice:{$gt:req.query.gt,$lt:req.query.lt},
            isBlocked:false,
            quantity:{$gt:0}
        }).lean()

        findProducts.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn))

        let itemsPerPage=6
        let currentPage=parseInt(req.query.page)||1
        let startIndex=(currentPage-1)*itemsPerPage
        let endIndex=startIndex+itemsPerPage
        let totalPages=Math.ceil(findProducts.length/itemsPerPage)
        const currentProduct=findProducts.slice(startIndex,endIndex)
        req.session.filteredProducts=findProducts;

        res.render("shop",{
            user:userData,
            products:currentProduct,
            category:categories,
            brand:brands,
            totalPages,
            currentPage,
        })
    } catch (error) {
        console.log(error)
       res.redirect("/pageNotFound")
    }
}
//------------------------rendering search product function------------------------
const searchProducts=async(req,res)=>{
    try {
        const userId=req.session.user._id
        const userData=await User.findOne({_id:userId})
        let search=req.body.query
        const brands=await Brand.find({}).lean()
        const categories=await Category.find({isListed:true}).lean()
        const categoryIds=categories.map(category=>category._id.toString())
        let searchResult=[]
        if(req.session.filteredProducts && req.session.filteredProducts.length>0){
            searchResult=req.session.filteredProducts.filter(product=>
                product.productName.toLowerCase().includes(search.toLowerCase())
            )
        }else{
            searchResult=await Product.find({
                productName:{$regex:".*"+search+".*",$options:"i"},
                isBlocked:false,
                quantity:{$gt:0},
                category:{$in:categoryIds}
            })
        }
        searchResult.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn))
        let itemsPerPage=6
        let currentPage=parseInt(req.query.page)||1
        let startIndex=(currentPage-1)*itemsPerPage
        let endIndex=startIndex+itemsPerPage
        let totalPages=Math.ceil(searchResult.length/itemsPerPage)
        const currentProduct=searchResult.slice(startIndex,endIndex)
        res.render("shop",{
            user:userData,
            products:currentProduct,
            category:categories,
            brand:brands,
            totalPages,
            currentPage,
            count:searchResult.length
        })
    } catch (error) {
        console.log("Error",error)
        res.redirect("/pageNotFound")
    }
}

// Exporting module
module.exports = {
    loadHomepage,
    loadSignup,
    signup,
    verifyOtp,
    loadSuccess,
    resendOtp,
    loadLogin,
    pageNotFound,
    login,
    logout,
    loadShoppingPage,
    filterProduct,
    filterByPrice,
    searchProducts,
};
