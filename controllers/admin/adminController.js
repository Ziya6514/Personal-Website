//-------------import modules--------------
const User =require("../../models/userschema")
const mongoose=require("mongoose")
const bcrypt=require("bcrypt")
const Category = require("../../models/categoryschema"); // Assuming you have a category schema
const Product = require("../../models/productschema"); // Assuming you have a product schema
const Order = require("../../models/orderschema"); // 

//------------function difine for error page------------------
const pageerror=async (req,res)=>{
    res.render("admin-error")
}

//-------------function define for admin login load-----------------
const loadLogin=(req,res)=>{

    if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }

    res.render("admin-login",{message:null})
}
//-------------function define for admin login form------------------
const login=async(req,res)=>{
    try {
         const {email,password}=req.body;
         const admin=await User.findOne({email,isAdmin:true})
         if(admin){
            const passwordMatch=await bcrypt.compare(password,admin.password)
            if(passwordMatch){
                req.session.admin=true;
                return res.redirect("/admin")
            }else{
                return res.redirect("/login")
            }
         }else {
            return res.redirect("/login")
         }
        } catch (error) {
            console.log("login error",error)
            return res.redirect("/pageerror")        
    }
}
//----------------function define for after login dashboard---------------------
const loadDashboard = async (req, res) => {
    if (req.session.admin) {
        try {
            // Fetch data dynamically
            const totalCategories = await Category.countDocuments();
            const totalProducts = await Product.countDocuments();
            const totalUsers = await User.countDocuments({ isAdmin: false }); // Only count non-admin users
            const totalOrders = await Order.countDocuments();

            // Calculate revenue
            const codRevenue = await Order.aggregate([
                { $match: { paymentMethod: "COD" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]);

            const stripeRevenue = await Order.aggregate([
                { $match: { paymentMethod: "Stripe" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]);

            const totalRevenue = (codRevenue[0]?.total || 0) + (stripeRevenue[0]?.total || 0);

            // Render the dashboard with fetched data
            res.render("dashboard", {
                totalCategories,
                totalProducts,
                totalUsers,
                totalOrders,
                codRevenue: codRevenue[0]?.total || 0,
                stripeRevenue: stripeRevenue[0]?.total || 0,
                totalRevenue,
            });
        } catch (error) {
            console.error("Error loading dashboard:", error);
            res.redirect("/pageerror");
        }
    } else {
        res.redirect("/admin/login");
    }
};
//----------------logout function--------------------
const logout=(req,res)=>{
    try {
        req.session.destroy(err =>{
            if(err){
                console.log("Error destroying session",err)
             return res.redirect("/pageerror")
            }
            res.redirect("/admin/login")
        })
    } catch (error) {
        console.log("unexprected error during logout",error)
        res.redirect("/pageerror")
    }
}
//---------------exoport all modules----------------------
module.exports={
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout,
}