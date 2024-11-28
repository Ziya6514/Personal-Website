const passport=require("passport")
const GoogleStratergy=require("passport-google-oauth20").Strategy
const User =require("../models/userschema")
const env=require("dotenv").config()




//----------------------google through login--------------------------

passport.use(new GoogleStratergy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"http://localhost:5000/auth/google/callback"
},
async (accessToken,refreshToken,profile,done)=>{
    try{
    let user=await User.findOne({googleId:profile.id})
    if(user){
        return done(null,user);

    }else{
        user =new User({
            name:profile.displayName,
            email:profile.emails[0].value,
            googleId:profile.id,

        })
        await user.save()
        return done(null,user)
    }
    }catch(error){
        return done(error,null)
    }
}

));

passport.serializeUser((user,done)=>{
       done(null,user._id)
})


passport.deserializeUser((id,done)=>{
   User.findById(id)
   .then(user=>{
    done(null,user)
   })
   .catch(err =>{
    done(err,null)
   })
})


module.exports=passport