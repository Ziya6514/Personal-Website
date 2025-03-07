//----------------------import the modules------------------------
const express=require("express")
const router=express.Router()
const path = require("path");
const adminController = require("../controllers/admin/adminController");
const customerController=require("../controllers/admin/customerController")
const categoryController=require("../controllers/admin/categoryController")
const brandController=require("../controllers/admin/brandController")
const productController=require("../controllers/admin/productController")
const bannerController=require("../controllers/admin/bannerController")
const couponController=require("../controllers/admin/couponController")
const orderController=require("../controllers/admin/orderController")
const {userAuth,adminAuth} = require("../middleware/auth")
const multer=require("multer")
const storage=require("../helpers/multer")
const uploads=multer({storage:storage})

//----------------------errormanagment-----------------------------
router.get("/pageerror",adminController.pageerror)
//----------------------login managment----------------------------
router.get("/login",adminController.loadLogin)
router.post("/login", adminController.login);
router.get("/", adminAuth, adminController.loadDashboard);
router.get("/logout",adminController.logout)
//----------------------customer managment--------------------------
router.get("/users",adminAuth,customerController.customerInfo)
router.get("/blockCustomer",adminAuth,customerController.customerBlocked)
router.get("/unblockCustomer",adminAuth,customerController.customerunBlocked)
//------------------------category managment-------------------------
router.get("/category",adminAuth,categoryController.categoryInfo)
router.post("/addCategory",adminAuth,categoryController.addCategory)
router.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer)
router.post("/removeCategoryOffer",adminAuth,categoryController.removeCategoryOffer)
router.get("/listCategory",adminAuth,categoryController.getListCategory)
router.get("/unlistCategory",adminAuth,categoryController.getunlistCategory)
router.get("/editCategory",adminAuth,categoryController.getEditCategory)
router.post("/editCategory/:id",adminAuth,categoryController.editCategory)
//--------------------------brand managment----------------------------
router.get("/brands",adminAuth,brandController.getBrandPage)
router.post("/addBrand",adminAuth,uploads.single("image"),brandController.addBrand)
router.get("/blockBrand",adminAuth,brandController.blockBrand)
router.get("/unBlockBrand",adminAuth,brandController.unBlockBrand)
router.get("/deleteBrand",adminAuth,brandController.deleteBrand)
//----------------------------product managment------------------------
router.get("/addProducts",adminAuth,productController.getProductAddpage)
router.post("/addProducts",adminAuth,uploads.array("images",4),productController.addProducts)
router.get("/products",adminAuth,productController.getAllProducts)
router.post("/addProductOffer",adminAuth,productController.addproductOffer)
router.post("/removeProductOffer", adminAuth, productController.removeProductOffer);
router.get("/blockProduct",adminAuth,productController.blockProduct)
router.get("/unblockProduct",adminAuth,productController.unblockProduct)
router.get("/editProduct",adminAuth,productController.getEditProduct)
router.post("/editProduct/:id",adminAuth,uploads.array("images",4),productController.editProduct)
router.post("/deleteImage",adminAuth,productController.deleteSingleImage)
//-------------------------------banner managment-----------------------
router.get("/banner",adminAuth,bannerController.getBannerPage)
router.get("/addBanner",adminAuth,bannerController.getAddBannerPage)
router.post("/addBanner",adminAuth,uploads.single("images"),bannerController.addBanner)
router.get("/deleteBanner",adminAuth,bannerController.deleteBanner)
//--------------------------------coupon managment---------------------------
router.get("/coupon",adminAuth,couponController.loadCoupon)
router.post("/createCoupon",adminAuth,couponController.createCoupon)
router.get("/editCoupon",adminAuth,couponController.editCoupon)
router.post("/updatecoupon",adminAuth,couponController.updateCoupon)
router.get("/deleteCoupon",adminAuth,couponController.deleteCoupon)

router.get("/order", adminAuth, orderController.getOrderListPageAdmin)
router.get("/orderDetailsAdmin", adminAuth, orderController.getOrderDetailsPageAdmin)
router.get("/changeStatus", adminAuth, orderController.changeOrderStatus);


//-------------------------------exports the module----------------------
module.exports=router