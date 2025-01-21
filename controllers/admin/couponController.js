const Coupon=require("../../models/couponSchema")
const mongoose = require("mongoose");


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
        console.log("adding coupon error........",error)
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
const updateCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        const oid = new mongoose.Types.ObjectId(couponId);

        console.log("Received Coupon ID:", couponId);
        console.log("New Coupon Name:", req.body.couponName);
        console.log("New Offer Price:", req.body.offerPrice);

        const selectedCoupon = await Coupon.findById(oid);
        if (!selectedCoupon) {
            return res.status(404).send("Coupon not found");
        }

        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

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
            }
        );

        if (updatedCoupon.modifiedCount > 0) {
            res.send("Coupon updated successfully");
        } else {
            res.status(500).send("Failed to update the coupon. No changes detected.");
        }
    } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteCoupon=async(req,res)=>{
    try {
        const id=req.query.id
        await Coupon.deleteOne({_id:id})
        res.status(200).send({success:true,message:"Coupon deleted successfully"})
    } catch (error) {
        console.log("Error deleting coupon...........",error)
        res.status(500).send({success:false,message:"Failed to delete coupon"})
    }
}

module.exports={
    loadCoupon,
    createCoupon,
    editCoupon,
    updateCoupon,
    deleteCoupon
}