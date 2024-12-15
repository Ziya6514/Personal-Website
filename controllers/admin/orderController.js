const Order=require("../../models/orderschema")


//----------------------------------------loadcoupon function defnition-------------------------------------
const loadorder = async (req, res) => {
    try {
        const findOrders = await Order.find({}); // Fetch all orders from the database
        return res.render("order", { orders: findOrders }); // Pass orders to the view
    } catch (error) {
        console.error(error);
        return res.redirect("/pageerror");
    }
};



module.exports={
    loadorder,
}