const Coupon=require("../../models/couponSchema")


//----------------------------------------loadcoupon function defnition-------------------------------------
const loadCoupon = async (req, res) => {
    try {
        const findCoupons = await Coupon.find({}); // Fetch all coupons from the database
        return res.render("coupon", {coupons: findCoupons}); // Pass 'findCoupons' to the view as 'coupon'
    } catch (error) {
        return res.redirect("/pageerror");
    }
};

//---------------------------------------function define for coupon file-----------------------------------
const createCoupon=async(req,res)=>{
    try {
        const date={
            couponName:req.body.couponName,
            startDate:new Date(req.body.startDate + "T00:00:00"),
            endDate:new Date(req.body.endDate + "T00:00:00"),
            offerPrice:parseInt(req.body.offerPrice),
            minimumPrice:parseInt(req.body.minimumPrice),
        }
        const newCoupon = Coupon({
            name:date.couponName,
            createdOn:date.startDate,
            expireOn:date.endDate,
            offerPrice:date.offerPrice,
            minimumPrice:date.minimumPrice,
        })
        await newCoupon.save()
        return res.redirect("/admin/coupon")
    } catch (error) {
        res.redirect("/pageerror")
    }
}
//--------------------------------edit coupon definition--------------------------------------
const editCoupon=async (req,res)=>{
    try {
        const id=req.query.id
        const findCoupon = await Coupon.findOne({_id:id})
        res.render('edit-coupon',{
            findCoupon:findCoupon,
        })
    } catch (error) {
        res.redirect("/pageerror")
    }
}
//------------------------------
const updateCoupon=async(req,res)=>{
    try {
     const couponId = req.body.couponId
       const oid=new mongoose.Types.ObjectId(couponId)
       const selectedCoupon=await Coupon.findOne({_id:oid})
       if(selectedCoupon){
        const startDate=new Date(req.body.startDate)
        const endDate=new Date(req.body.endDate)
        const updatedCoupon = await Coupon.updateOne(
            { _id: oid },
            {
                $set: {
                    name: req.body.couponName,
                    createdOn: startDate,
                    expireOn: endDate,
                    offerPrice: parseInt(req.body.offerPrice),
                    minimumPrice: parseInt(req.body.minimumPrice),
                },
            },
            { new: true }
        );
        
        if(updatedCoupon!==null){
            res.send("Coupon updated successfully")
        }else{
            res.status(500).send("Coupon update failed")
        }
       }
    } catch (error) {
        res.redirect("/pageerror")
    }
}
module.exports={
    loadCoupon,
    createCoupon,
    editCoupon,
    updateCoupon,
}