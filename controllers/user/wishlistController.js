const User=require("../../models/userschema")
const Product=require("../../models/productschema")
// const Wishlist=require("../../models/wishlistschema")



//------------------------wishlist function definition--------------------
const loadWishlist=async (req,res)=>{
    try {
        const userId=req.session.user.id
        const user=await User.findById(userId)
        const products=await Product.find({_id:{$in:user.Wishlist}}).populate('category')
         
        res.render("wishlist",{
       user,
       wishlist:products,
        })
    } catch (error) {
        console.error(error)
        res.redirect("/pageNotFound")
    }
}
//-------------------------addto wishlist function------------------
const addToWishlist=async (req,res)=>{
    try {
        const productId=req.body.productId
        const userId=req.session.user.id
        const user=await User.findById(userId)
        if(user.Wishlist.includes(productId)){
            return res.status(200).json({status:false,message:'product already in wishlist'})
        }
        user.Wishlist.push(productId)
        await user.save()
        return res.status(200).json({status:true,message:'product added to wishlist'})
    } catch (error) {
        console.error(error)
        res.status(500).json({status:false,message:"server error"})
    }
}
//--------------------------remove product-------------------
const removeProduct=async (req,res)=>{
    try {
        const productId=req.query.productId
        const userId=req.session.user.id
        const user=await User.findById(userId)
        const index=user.Wishlist.indexOf(productId)
        user.Wishlist.splice(index,1)
        await user.save()
        res.redirect("/wishlist")
    } catch (error) {
        console.error(error)
        return res.status(500).json({status:false,message:'server error'})
    }
}

module.exports={
    loadWishlist,
    addToWishlist,
    removeProduct
}