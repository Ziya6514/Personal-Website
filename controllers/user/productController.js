const Product=require("../../models/productschema")
const Category=require("../../models/categoryschema")
const User=require("../../models/userschema")



//----------------product detail getting function------------------
const productDetails=async(req,res)=>{
    try {
        const userId=req.session.user.id //extract user id from session
        const userData=await User.findById(userId)
        const productId=req.query.id
        console.log("productId",productId) //used to replace the category field in product
        const product=await Product.findById(productId).populate("category") //fetching product and its category
        const findCategory=product.category
        const categoryOffer=findCategory ?.categoryOffer || 0 //accessing category and offers
        const productOffer=product.productOffer || 0
        const totalOffer=categoryOffer+productOffer
        res.render("product-details",{
            user:userData,  //rendering the view
            product:product,
           quantity:product.quantity,
            totalOffer:totalOffer,
            category:findCategory,
           
        })
    } catch (error) {
        console.log("Error for fetching product details",error)
        res.redirect("/pageNotFound")//error handling
    }
}




module.exports={
    productDetails,
}