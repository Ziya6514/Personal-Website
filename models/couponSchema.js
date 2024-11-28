const mongoose=require("mongoose")
const {Schema}=mongoose;




//---------------------model for couponschema-------------------

const couponSchema=new mongoose.Schema({
    naem:{
        type:String,
        required:true,
        unique:true
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    expireOn:{
        type:Date,
        required:true
    },
    offerPrice:{
        type:Number,
        required:true
    },
    minimumPrice:{
        type:Number,
        required:true
    },
    isList:{
        type:Boolean,
        default:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Uset'
    }
})

const Coupon=mongoose.model("Coupon",couponSchema)

module.exports=Coupon;