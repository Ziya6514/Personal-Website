//------------------------
const Product=require("../../models/productschema")
const Category=require("../../models/categoryschema")
const Brand= require("../../models/brandschema")
const User=require("../../models/userschema")
const fs=require("fs")
const path=require("path");
const sharp=require("sharp")




//-------------------product adding page function---------------
const getProductAddpage=async (req,res)=>{
    try {
        const category =await Category.find({isListed:true})
        const brands=await Brand.find({isBlocked:false})
        res.render("product-add",{
            cat:category,
            brand:brands
        })
    } catch (error) {
        res.redirect("/pageerror")
    }
}
//------------------------adding product function---------------
const addProducts=async(req,res)=>{
    try {
        const products = req.body;
        const productExists = await Product.findOne({ productName: products.productName });// Check if the product already exists

        if (productExists) {
          return res.status(400).json("Product already exists, please try with another name");
        }
        const images = [];
        const imageDirectory = path.join('public', 'uploads', 'product-images');
    
        // Ensure the target directory exists
        if (!fs.existsSync(imageDirectory)) {
          fs.mkdirSync(imageDirectory, { recursive: true });
        }
    
        // Process images if there are files uploaded
        if (req.files && req.files.length > 0) {
          for (let i = 0; i < req.files.length; i++) {
            const originalImagePath = req.files[i].path;
            const resizedImagePath = path.join(imageDirectory, req.files[i].filename);
    
            // Resize and save the image using Sharp
            await sharp(originalImagePath)
              .resize({ width: 440, height: 440 })
              .toFile(resizedImagePath);
    
            images.push(req.files[i].filename);
          }
        }
    
        // Validate and fetch the category
        const categoryId = await Category.findOne({ name: products.category });
        if (!categoryId) {
          return res.status(400).json("Invalid category name");
        }
    
        // Create a new product instance
        const newProduct = new Product({
          productName: products.productName,
          description: products.description,
          brand: products.brand,
          category: categoryId._id,
          regularPrice: products.regularPrice,
          salePrice: products.salePrice,
          createdOn: new Date(),
          quantity: products.quantity,
          size: products.size,
          color: products.color,
          productImage: images,
          status: 'Available',
        });
    
        // Save the new product to the database
        await newProduct.save();
        return res.redirect("/admin/addProducts");
      } catch (error) {
        console.error("Error saving product:", error.message);
        return res.redirect("/admin/pageerror");
      }
    };
//----------------------all product getting function--------------------
const getAllProducts=async(req,res)=>{
  try {
    
    const search=req.query.search || ""
    const page=req.query.page || 1 
    const limit=4;

    const productData=await Product.find({
      $or:[
        {productName:{$regex:new RegExp(".*"+search+".*","i")}},
      {brand:{$regex:new RegExp(".*"+search+".*","i")}}
    ],
    })
    .limit(limit*1)
    .skip((page - 1)*limit)
    .populate('category')
    .exec();
    const count = await Product.find({
      $or:[
        {productName:{$regex:new RegExp(".*"+search+".*","i")}},
        {brand:{$regex:new RegExp(".*"+search+".*","i")}},
      ],
    }).countDocuments()
    const category=await Category.find({isListed:true})
   const brand=await Brand.find({isBlocked:false})
 if(category && brand){
  res.render("products",{
    data:productData,
    currentPage:page,
    totalPages:Math.ceil(count/limit),
    cat:category,
    brand:brand,

  })
 }else{
  res.render("page-404")
 }
 
  } catch (error) {
    res.redirect("/pageerror");
  }
}
//------------------adding product offer function-------------------
const addproductOffer = async (req, res) => {
  try {
    const { productId, percentage } = req.body;
    // Find the product
    const findProduct = await Product.findOne({ _id: productId });
    if (!findProduct) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }
    // Find the category of the product
    const findCategory = await Category.findOne({ _id: findProduct.category });

    if (!findCategory) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    // Check if the category already has an offer
    if (findCategory.categoryOffer > percentage) {
      return res.json({ status: false, message: "This product's category already has a category offer" });
    }
    // Ensure the regularPrice and salePrice are valid numbers
    const regularPrice = parseFloat(findProduct.regularPrice);
    if (isNaN(regularPrice)) {
      return res.status(400).json({ status: false, message: "Invalid regular price" });
    }

    // Calculate the salePrice based on the offer
    findProduct.salePrice = regularPrice - Math.floor(regularPrice * (percentage / 100));

    // Ensure salePrice is a valid number
    if (isNaN(findProduct.salePrice)) {
      return res.status(400).json({ status: false, message: "Invalid sale price calculation" });
    }

    // Set the product offer and save the product
    findProduct.productOffer = parseInt(percentage);
    await findProduct.save();

    // Reset the category offer to 0
    findCategory.categoryOffer = 0;
    await findCategory.save();

    return res.json({ status: true, message: "Product offer applied successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};
//-------------------remove product offer function----------------
const removeProductOffer=async (req,res)=>{
  try {
    const {productId}=req.body
    const findProduct=await Product.findOne({_id:productId})
    const percentage=findProduct.productOffer
    findProduct.salePrice=findProduct.salePrice+Math.floor(findProduct.regularPrice*(percentage/100))
  await findProduct.save()
  res.json({status:true})
  } catch (error) {
    res.redirect("/pageerror")
  }
}
//-------------------block product function-----------------
const blockProduct=async(req,res)=>{
  try {
    let id=req.query.id
    await Product.updateOne({_id:id},{$set:{isBlocked:true}})
    res.redirect("/admin/products")

  } catch (error) {
    res.redirect("/pageerror")
  }
}


//---------------------unblock  define-----------------

const unblockProduct=async(req,res)=>{
  try {
    let id=req.query.id
    await Product.updateOne({_id:id},{$set:{isBlocked:false}})
  res.redirect("/admin/products")
  } catch (error) {
    res.redirect("/pageerror")
  }
}

//-----------------editing product function---------------------
const getEditProduct=async(req,res)=>{
  try {
    const id=req.query.id
    const product=await Product.findOne({_id:id})
    const category=await Category.find({})
    const brand=await Brand.find({})
    res.render("edit-product",{
      product:product,
      cat:category,
      brand:brand
    })
  } catch (error) {
    res.redirect("/pageerror")
  }
}

///-----------------------define the function of edited product---------------
const editProduct=async(req,res)=>{
  try {
    const id=req.params.id;
    const product=await Product.findOne({_id:id})
  const data=req.body;
  const existingProduct=await Product.findOne({
    productName:data.productName,
    _id:{$ne:id}
  })
  if(existingProduct){
    return res.status(400).json({error:"Product with this name already exist.please try with another name "})
  }
  const images=[];
  if(req.files && req.files.length){
    for(let i=0;i<req.files.length;i++){
      images.push(req.files[i].fileName)
    }
  }

  const updateFields={
    productName:data.productName,
    description:data.description,
    brand:data.brand,
    category:product.category,
    regularPrice:data.regularPrice,
    salePrice:data.salePrice,
    quantity:data.quantity,
    size:data.size,
    color:data.color
  }
  if(req.files.length>0){
    updateFields.$push={productImage:{$each:images}}
  }

  await Product.findByIdAndUpdate(id.updateFields,{new:true})
  res.redirect("/admin/products")
  } catch (error) {
    console.error(error)
    res.redirect("/pageerror")
  }
}
//---------------------------deleting single image function in product------------------
const deleteSingleImage=async(req,res)=>{
  try {
    const {imageNameToServer,productIdToServer}=req.body;
    const product=await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}})
  const imagePath=path.join("public","uploads","re-image",imageNameToServer)
 if(fs.existsSync(imagePath)){
  await fs.unlinkSync(imagePath)
  console.log(`Image ${imageNameToServer}delete successfully`)
 }else{
  console.log(`Image ${imageNameToServer}not found`)
 }
res.send({status:true})

} catch (error) {
    res.redirect("/pageerror")
  }
}




module.exports={
    getProductAddpage,
    addProducts,
    getAllProducts,
    addproductOffer,
    removeProductOffer,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,
}
