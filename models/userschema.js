const mongoose=require("mongoose")
const {Schema}=mongoose;




//---------------------model for userschema-------------------

const userSchema= new Schema({
    name:{
       type:String,
       required:true 
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    phone:{
        type:String,
        required:false,
        unique:false,
        sparse:true,
        default:null
    },
    googleId:{
        type:String,

        
      
    },
    password:{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    cart:[{
        type:Schema.Types.ObjectId,
        ref:"Cart",
    }],
    Wallet:{
        type:Number,
        default:0,
    },
    Wishlist:[{
        type:Schema.Types.ObjectId,
        ref:"Wishlist"
    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default:Date.now,

    },
    referalCode:{
        type:String,
        
    },
    redeemed:{
        type:Boolean
    },
    redeemedUser:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    searchHistory:[{
        category:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Category",
        },
        brand:{
            type:String
        },
        searchOn:{
            type:Date,
            default:Date.now
        }
    }]
     
    
})



const User=mongoose.model("User",userSchema);
module.exports=User;