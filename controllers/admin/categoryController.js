//-------------import category model---------------
const Category = require("../../models/categoryschema");
const product = require("../../models/productschema")



//--------------define category info  function-------------------
const categoryInfo=async(req,res)=>{
    try {
        const page =parseInt(req.query.page)|| 1
        const limit=4;
        const skip=(page-1)*limit;
       const categoryData=await Category.find({})//access the categorys in database
       .sort({createdAt:-1})
       .skip(skip)
       .limit(limit)
       const totalCategories=await Category .countDocuments() //count total categorys
       const totalPages=Math.ceil(totalCategories/limit)
       res.render("category",{
       cat:categoryData,
       currentPage:page,
      totalPages:totalPages,
      totalCategories:totalCategories
       });
    } catch (error) {
        console.error(error)
        res.redirect("/pageerror")
    }
}
//---------------------define addcategory-------------------
const addCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }
        const newCategory = new Category({ name, description });
        await newCategory.save();
        return res.json({ success: true, message: "Category added successfully" }); //Updated response
    } catch (error) {
        console.error("Error adding category:", error); // logging
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
//---------------------define addcategory offer function-----------------
const addCategoryOffer = async(req,res)=>{
    try {
        const percentage=parseInt(req.body.percentage)
        const categoryId=req.body.categoryId
        const category=await category.findById(categoryId)
        if(!category){
            return res.status(404).json({status:false,message:"Category not found"})
        }
        const products=await Product.find({category:categoryId})

     const hasProductOffer = products.some((product)=>product.productOffer > percentage)
if(hasProductOffer){
    return res.json({status:false , message:"Product within this category already have product offer"})
}
   await category.updateOne({_id:categoryId},{$set: {categoryOffer:percentage}})
    
   for(const product of products){
     product.productOffer=0;
     product.salePrice=product.regularPrice;
     await product.save()
   }
   res.json({status:true, message: "Category offer added successfully"})
} catch (error) {
    console.error("Error occurred:", error); 

        res.status(500).json({status:false,message:"Internal server error"})
    }
}
//------------------------function for remove categoryoffer--------------
const removeCategoryOffer=async (req,res)=>{
    try {
        const categoryId=req.body.categoryId
        const category= await Category.findById(categoryId)
        if(!category){
            return res.status(404).json({status:false,message:"Category not found"})
        }
 const percentage=category.categoryOffer;
 const products=await Product.find({category:categoryId})

   if(products.length > 0){
       for(const product of products){
        product.salePrice += Math.floor(product.regularPrice * (percentage/100))
        product.productOffer=0;
        await product.save()
       }
       category.categoryOffer=0
       await category.save()
       res.json({status:true,message: "Category offer removed successfully"})
   }else{
    res.json({ status: false, message: "No products found in this category" });

   }
    } catch (error) {
        console.error("Error occurred:", error); 

        res.status(500).json({status:false,message:"Internal server error"})
    }
}
//--------------------define list category-------------------
const getListCategory=async (req,res)=>{
    try {
        let id=req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:false}})
       res.redirect("/admin/category")
    } catch (error) {
        res.redirect("/pageerror")
    }
}
//---------------------unlist catgeory------------------
const getunlistCategory=async (req,res)=>{
    try {
        let id=req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:true}})
        res.redirect("/admin/category")

    } catch (error) {
        res.redirect("/pageerror")

    }
}
//---------------------edit catgeory function--------------
const getEditCategory=async(req,res)=>{
    try {
        const id=req.query.id
        const category=await Category.findOne({_id:id})
        res.render("edit-category",{category:category})
    } catch (error) {
        res.redirect("/pageerror")
    }
}
//-------------------editingoption-------------------
const editCategory=async(req,res)=>{
    try {
        const id =req.params.id
        const{categoryName,description} =req.body;
        const existingCategory=await Category.findOne({name:categoryName,_id:{$ne:id}})
        
        if(existingCategory){
            return res.status(400).json({error:"category exist,please choose another name"})
        }
       const updateCategory = await Category.findByIdAndUpdate(id,{
        name:categoryName,
        description:description
       },{new:true});
          if(updateCategory){
            res.redirect("/admin/category")
          }else{
            res.status(404).json({error:"category not found"})
          }
    } catch (error) {
        res.status(500).json({error:"internal server error"})
    }
}


//---------------------exports module-------
module.exports={
    categoryInfo,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    getListCategory,
    getunlistCategory,
    getEditCategory,
    editCategory,
}
