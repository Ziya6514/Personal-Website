
const User=require("../../models/userschema")


//--------------custumer information function--------------------
const customerInfo=async(req,res)=>{
    try {
      
      let search="";
      if(req.query.search){
        search=req.query.search;
      }  

      let page=1;
      if(req.query.page){
        page=req.query.page
      }
      const limit=3

      const userData=await User.find({
        isAdmin:false,
        $or:[

            {name:{$regex:".*" + search + ".*"}},
            {email:{$regex:".*" + search + ".*"}},
        ],
      })
      .limit(limit*1)
      .skip((page - 1)*limit)
      .exec();

      console.log(userData);  

      const count=await User.find({
        isAdmin:false,
        $or:[

            {name:{$regex:".*"+search+".*"}},
            {email:{$regex:".*"+search+".*"}},
        ],
        
      }).countDocuments();
      
      const totalPages = Math.ceil(count / limit); // Calculate total pages

      res.render('customers', {
        data: userData,
        count,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.log(error);
    }
  };
//-------------------customer blocking function-------------------
  const customerBlocked=async(req,res)=>{
    try {
      let id=req.query.id;
      console.log("Blocking user with id:", id);  // Check if ID is being received

      await User.updateOne({_id:id},{$set:{isBlocked:true}})
      res.redirect("/admin/users")
    } catch (error) {
      console.error("Error blocking user:", error);
       res.redirect("/pageerror")
    }
  }
//-------------------customer unblocked function------------------
  const customerunBlocked=async(req,res)=>{
    try {
      let id=req.query.id;
      await User.updateOne({_id:id},{$set:{isBlocked:false}})
      res.redirect("/admin/users")
    } catch (error) {
       res.redirect("/pageerror")
    }
  }





module.exports={
    customerInfo,
    customerBlocked,
    customerunBlocked,
}