const Product=require("../../models/productschema")
const Category=require("../../models/categoryschema")
const User=require("../../models/userschema")



//----------------product detail getting function------------------
const productDetails=async(req,res)=>{
    try {
        const userId=req.session.user.id
        const userData=await User.findById(userId)
        const productId=req.query.id
        console.log("productId",productId)
        const product=await Product.findById(productId).populate("category")
        const findCategory=product.category
        const categoryOffer=findCategory ?.categoryOffer || 0
        const productOffer=product.productOffer || 0
        const totalOffer=categoryOffer+productOffer
        res.render("product-details",{
            user:userData,
            product:product,
           quantity:product.quantity,
            totalOffer:totalOffer,
            category:findCategory,
           
        })
    } catch (error) {
        console.log("Error for fetching product details",error)
        res.redirect("/pageNotFound")
    }
}




module.exports={
    productDetails,
}