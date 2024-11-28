const mongoose = require('mongoose'); 
const User=require("../../models/userschema")
const Address=require("../../models/addressschema")
const nodemailer=require("nodemailer")
const bcrypt=require("bcrypt")
const env=require("dotenv").config()
const session=require("express-session")
// const { resendOtp } = require("./userController")


//---------------function set in globally -------------------
function generateOtp(){
    const digits="1234567890"
    let otp=""
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)]

    }
    return otp;
}
const sendVerificationEmail=async(email,otp)=>{
    try {
        const transporter=nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD,
            }
        })
        const mailOptions={
               from:process.env.NODEMAILER_EMAIL,
               to:email,
               subject:"Your OTP for password reset",
               text:`Your OTP is ${otp}`,
               html:`<b><h4>Your OTP:${otp}</h4><br></b>`
        }

        const info=await transporter.sendMail(mailOptions)
        console.log("Email sent:",info.messageId)
        return true;
    } catch (error) {
        console.error("Error sending email",error)
    return false
    }
}

const securePassword=async (password)=>{
    try {
        const passwordHash=await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        
    }
}


//----------------forgot password getting function---------------------
const getForgotPassPage=async(req,res)=>{
try {
    

    res.render("forgot-password")
} catch (error) {
    res.redirect("/pageNotFound")
}


}

//---------------email valif dunction-------------------------
const forgotEmailValid=async(req,res)=>{
    try {
        const{email}=req.body
        const findUser=await User.findOne({email:email})
        if(findUser){
            const otp=generateOtp()
            const emailSent=await sendVerificationEmail(email,otp)
       if(emailSent){
        req.session.userOtp=otp;
        req.session.email=email;
        res.render("forgotPass-otp")

        console.log("OTP:",otp)
    }else{
        res.json({success:false,message:"Failed to send OTP.please try again "})
    }
        }else{
             res.render("forgot-password",{
            message:"User With this email does not exist"
     
        
        })
        }
    } catch (error) {
       res.redirect("/pageNotFound")
     

    }
}


//-----------------verify pass ---------------------

const verifyForgotPassOtp=async(req,res)=>{
    try {
        const enteredOtp = req.body.otp;
        if(enteredOtp=== req.session.userOtp){
            res.json({success:true,redirectUrl:"/reset-password"})
       
       
        }else{
            res.json({success:false,message:"OTP not matching"})
        }

    } catch (error) {
        res.status(500).json({success:false,message:"An error occured.please try again "})
   
    }
}

//------------------------resent pass function--------------------

const getResetPassPage=async(req,res)=>{
    try {
        res.render("reset-password")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}


//--------------------resend otp function---------------------
const resendOtp=async (req,res)=>{
    try {
        const otp=generateOtp()
        req.session.userOtp=otp
        const email=req.session.email;
        console.log("Resending OTP to email:",email)
        const emailSent=await sendVerificationEmail(email,otp)
        if(emailSent){
            console.log("Resend OTP:",otp)
            res.status(200).json({success:true,message:"Resend OTP successful"})

        }
    } catch (error) {
        console.error("Error in resend otp",error)
        res.status(500).json({success:false,message:'Internal Server'})
    }
}

//------------------setting new pass function---------------------
const postNewPassword=async (req,res)=>{
    try {
        const {newPass1,newPass2}=req.body
        const email=req.session.email;
        if(newPass1===newPass2){
            const passWordHash=await securePassword(newPass1)
            await User.updateOne(
                {email:email},
                {$set:{password:passWordHash}}
            )
            res.redirect("/login")
        }else{
            res.render("reset-password",{message:'Passwords do not match'})
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}
//---------------------user profile definition-------------------
const userProfile = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userData = await User.findById(userId);
        const addressData=await Address.findOne({userId:userId})
        res.render('profile', {
            user: userData,
            userAddress:addressData
        });
    } catch (error) {
        console.error("Error fetching profile data:", error);
        res.redirect("/pageNotFound");
    }
};
//-----------------changing email function------------------
const changeEmail=async (req,res)=>{
    try {
        res.render("change-email")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}
//---------------------validating email-------------------
const changeEmailValid=async(req,res)=>{
    try {
        const {email}=req.body;
        const userExists=await User.findOne({email})
        if(userExists){
          const otp=generateOtp()
          const emailSent=await sendVerificationEmail(email,otp)
          if(emailSent){
            req.session.userOtp=otp
            req.session.userData=req.body
            req.session.email=email;
            res.render("change-email-otp")
            console.log("Email sent:",email)
            console.log("OTP:",otp)
          }else{
            res.json("email-error")
          }
        }else{
            res.render("change-email",{
                message:"User with this email not exist"
            })
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}
//----------------------otp validation------------------
const VerifyEmailOtp=async (req,res)=>{
    try {
        const enteredOtp=req.body.otp
        if(enteredOtp===req.session.userOtp){
            req.session.userData=req.body.userData;
            res.render("new-email",{
                userData:req.session.userData
            })
        }else{
            res.render("change-email-otp",{
                message:"OTP not matching",
                userData:req.session.userData
            })

        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}
//-------------------------updated email--------------------
const updateEmail=async(req,res)=>{
    try {
        const newEmail=req.body.newEmail
        const userId=req.session.user.id
        await User.findByIdAndUpdate(userId,{email:newEmail})
        res.redirect("/userProfile")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}
//--------------------change password function-----------------------
const changePassword=async(req,res)=>{
    try {
        res.render("change-password")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}
//-------------
const changePasswordValid=async(req,res)=>{
    try {
        const {email}=req.body;
        const userExists=await User.findOne({email})
        if(userExists){
          const otp=generateOtp()
          const emailSent=await sendVerificationEmail(email,otp)
          if(emailSent){
            req.session.userOtp=otp
            req.session.userData=req.body
            req.session.email=email;
            res.render("change-password-otp")
            console.log("OTP:",otp)
          }else{
            res.json({
                success:false,
                message:"Failed to send otp.please try again",
            })
          }
        }else{
            res.render("change-password",{
                message:"User with this email not exist"
            })
        }
    } catch (error) {
        console.log("Error in change password validation",error)
        res.redirect("/pageNotFound")
    }
}
//-----------------------verification of changed pass--------------------
const VerifyChangePassOtp = async (req, res) => {
    try {
        const enteredOtp = req.body.otp;
        console.log("Entered OTP:", enteredOtp);
        console.log("Session OTP:", req.session.userOtp);

        if (enteredOtp === req.session.userOtp) {
            res.json({ success: true, redirectUrl: "/reset-password" });
        } else {
            res.json({ success: false, message: "OTP not matching" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "An error occurred. Please try again later." });
    }
};
//----------------------------adding address -----------------------
const addAddress = async (req, res) => {
    try {
      const user = req.session.user; // Retrieve the user from the session
      res.render("add-address", { user: user }); // Render the "add-address" view and pass the user data
    } catch (error) {
      res.redirect("/pageNotFound"); // Redirect to pageNotFound if an error occurs
    }
  }
  //-----------------adding address posted------------------------
  const postaddAddress = async (req, res) => {
    try {
      const userId = req.session.user._id ? req.session.user._id : req.session.user;
  
      if (!userId) {
        console.error("User not found in session");
        return res.redirect("/login");
      }
  
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const userData = await User.findOne({ _id: userObjectId });
  
      if (!userData) {
        console.error("User not found in the database");
        return res.redirect("/login");
      }
  
      // Destructure the address data from the request body
      const { addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body;
  
      // Check if the user already has an address
      const userAddress = await Address.findOne({ userId: userData._id });
  
      if (!userAddress) {
        // If no address exists, create a new address entry
        const newAddress = new Address({
          userId: userData._id,
          address: [{ addressType, name, city, landMark, state, pincode, phone, altPhone }]
        });
        await newAddress.save();
      } else {
        // If address exists, push the new address to the address array
        userAddress.address.push({ addressType, name, city, landMark, state, pincode, phone, altPhone });
        await userAddress.save();
      }
  
      // Redirect to user profile page after successfully adding the address
      res.redirect("/userProfile");
    } catch (error) {
      console.error("Error adding address:", error);
      res.redirect("/pageNotFound");
    }
  };
  //------------------------editing address definition---------------------
  const editAddress = async (req, res) => {
    try {
        const addressId = req.query.id;
        const user = req.session.user;

        // Find the user address document based on addressId
        const currAddress = await Address.findOne({
            "address._id": addressId
        });

        // If no address document is found, redirect to pageNotFound
        if (!currAddress) {
            return res.redirect("/pageNotFound");
        }

        // Find the specific address in the user's address array
        const addressData = currAddress.address.find((item) => {
            return item._id.toString() === addressId.toString();
        });

        // If no addressData is found, redirect to pageNotFound
        if (!addressData) {
            return res.redirect("/pageNotFound");
        }

        // Render the edit-address page with addressData and user data
        res.render("edit-address", { address: addressData, user: user });
    } catch (error) {
        console.error("Error in edit address", error);
        res.redirect("/pageNotFound");
    }
};
//-------------------------edited address-----------------------
const postEditAddress=async(req,res)=>{
    try {
        const data=req.body
        const addressId=req.query.id
        const user=req.session.user
        const findAddress=await Address.findOne({"address._id":addressId})
        if(!findAddress){
            res.redirect("/pageNotFound")
        }
        await Address.updateOne(
            {"address._id":addressId},
            {$set:{
                "address.$":{
               _id:addressId,
               addressType:data.addressType,
               name:data.name,
               city:data.city,
               landMark:data.landMark,
               state:data.state,
               pincode:data.pincode,
               phone:data.phone,
               altPhone:data.altPhone,
                }
            }}
        )
        res.redirect("/userProfile")
    } catch (error) {
        console.error("Error in edit address",error)
        res.redirect("/pageNotFound")
    }

}
//------------------------deleting address function------------------
const deleteAddress=async(req,res)=>{
    try {
        const addressId=req.query.id
        const findAddress=await Address.findOne({"address._id":addressId})
        if(!findAddress){
            return res.status(404).send("Address not found")
        }
        await Address.updateOne({
            "address._id":addressId
        },
        {
            $pull:{
                address:{
                    _id:addressId,
                }
            }
        }
    )
    res.redirect("/userProfile")
    } catch (error) {
        console.error("Error in delete address",error)
        res.redirect("/pageNotFound")
    }
}

module.exports={
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,
    userProfile,
    changeEmail,
    changeEmailValid,
    VerifyEmailOtp,
    updateEmail,
    changePassword,
    changePasswordValid,
    VerifyChangePassOtp,
    addAddress,
    postaddAddress,
    editAddress,
    postEditAddress,
    deleteAddress,
}

