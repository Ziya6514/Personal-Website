const mongoose=require("mongoose")
const {Schema}= mongoose;




//---------------------model for categoryschema-------------------

const categoryschema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
 },
 description:{
    type:String,
    required:true
 },
 isListed:{
    type:Boolean,
    default:false,

 },
 categoryOffer:{
    type:Number,
    default:0
 },
 createdAt:{
    type:Date,
    default:Date.now
 }

})

const Category=mongoose.model("Category",categoryschema)
module.exports=Category;