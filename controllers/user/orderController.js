const User = require("../../models/userschema");
const Product = require("../../models/productschema");
const Address = require("../../models/addressschema");
const Order = require("../../models/orderschema");
const Cart = require("../../models/cartschema");
const Category = require("../../models/categoryschema");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const razorpay = require("razorpay");
const env = require("dotenv").config();
const crypto = require("crypto");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const easyinvoice = require("easyinvoice");
const Coupon = require("../../models/couponSchema");
let instance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



//===========================================================checkout function==================================================
const getCheckoutPage = async (req, res) => {
  try {
      console.log('In checkout');

      if (!req.session.user || !req.session.user.id) {
          console.log('User not logged in, redirecting to login.');
          return res.redirect('/login'); // Redirect to login if user session is missing
      }

      const userId = req.session.user.id; // Ensure the session userId is correctly set
      console.log('Session User ID:', userId);

      const [user, products, categories, cart] = await Promise.all([
          User.findById(userId), // Fetch user details
          Product.find({ isBlocked: false, isDeleted: false }), // Active products
          Category.find({ islisted: true, isDeleted: false }), // Active categories
          Cart.findOne({ userId }).populate({
              path: 'items.productId',
              model: Product
          }),
      ]);

      // Fetching the user's address data
      const addressData = await Address.findOne({ userId:userId});
      console.log('Fetched Address Data:', addressData);

      let addresses = [];
      if (addressData && addressData.address && addressData.address.length > 0) {
          addresses = addressData.address; // Access the address array inside the Address document
      } else {
          console.log('No addresses found for this user');
      }

      console.log('Fetched Addresses:', addresses);

      // If no cart data exists
      if (!cart || !cart.items) {
          return res.render('checkOut', {
              title: 'Feather - Checkout',
              user,
              products,
              categories,
              addresses,
              cart: null,
              totalPrice: 0,
              grandTotal: 0
          });
      }

      // Calculate totals from cart items
      const totalPrice = cart.items.reduce((total, item) => total + item.quantity * item.productId.salePrice, 0);

      const grandTotal = totalPrice; // Adjust for discounts, taxes, etc.

      res.render('checkoutcart', {
          title: 'Feather - Checkout',
          user, // Pass user object directly
          products,
          categories,
          addresses,
          cart,
          totalPrice,
          grandTotal
      });
  } catch (error) {
      console.error('Error in getCheckoutPage:', error);
      res.redirect('/pageNotFound');
  }
};
//=====================================================================
const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    const cartIndex = user.cart.findIndex((item) => item.productId == id);
    user.cart.splice(cartIndex, 1);
    await user.save();
    res.redirect("/checkout");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};
//===================================================================
const applyCoupon = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const selectedCoupon = await Coupon.findOne({ name: req.body.coupon });

    if (!selectedCoupon) {
      return res.json({ success: false, message: 'Coupon not found' });
    } 

    if (selectedCoupon.userId.includes(userId)) {
      return res.json({ success: false, message: 'Coupon already used' });
    }

    await Coupon.updateOne(
      { name: req.body.coupon },
      { $addToSet: { userId: userId } }
    );

    const gt = parseInt(req.body.total) - parseInt(selectedCoupon.offerPrice);
    return res.json({ success: true, gt: gt, offerPrice: parseInt(selectedCoupon.offerPrice) });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.json({ success: false, message: 'Error applying coupon' });
  }
};
//==========================================================================
const orderPlaced = async (req, res) => {
  try {

    const { totalPrice, addressId, payment, discount } = req.body;
    const userId = req.session.user.id;
    
    console.log("Starting order placement...");

    // 1. Find User
    const findUser = await User.findOne({ _id: userId });
    if (!findUser) {
      console.error("User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }
    const userCart = await Cart.findOne({userId: findUser._id})
    // 2. Check if cart is empty
    if (userCart.length===0) {
      console.error("Cart is empty for user:", userId);
      return res.status(404).json({ error: "Your cart is empty" });
    }
    // const productIds = findUser.cart.map((item) => item.productId);
   
    const productIds=userCart.items.map((item)=>item.productId)
console.log("productIds..............",productIds)
    // 3. Find Address
    const findAddress = await Address.findOne({ userId: userId, "address._id": addressId });
    if (!findAddress) {
      console.error("Address not found for user:", userId);
      return res.status(404).json({ error: "Address not found" });
    }

    const desiredAddress = findAddress.address.find((item) => item._id.toString() === addressId.toString());
    if (!desiredAddress) {
      console.error("Specific address not found:", addressId);
      return res.status(404).json({ error: "Specific address not found" });
    }

    // 4. Find Products
    const findProducts = await Product.find({ _id: { $in: productIds } });
    if (findProducts.length !== productIds.length) {
      console.error("Some products not found, expected:", productIds.length, "found:", findProducts.length);
      return res.status(400).json({ error: "Some products not found" });
    }else{
      console.log("find product successfully added")
    }

    const cartItemQuantities = userCart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    // 5. Prepare ordered products
    const orderedProducts = findProducts.map((item) => {
      const quantity = cartItemQuantities.find((cartItem) => cartItem.productId.toString() === item._id.toString()).quantity;
      if (quantity > item.quantity) {
        console.error("Not enough stock for product:", item.productName);
        throw new Error(`Not enough stock for ${item.productName}`);
      }

      return {
        _id: item._id,
        price: item.salePrice,
        name: item.productName,
        image: item.productImage[0],
        productStatus: "Confirmed",
        quantity: quantity,
      };
    });

    // 6. Cash on Delivery limitation
    if (payment === "cod" && totalPrice > 1000) {
      console.error("COD not allowed for orders above ₹1000. Total price:", totalPrice);
      return res.status(400).json({ error: "Orders above ₹1000 are not allowed for Cash on Delivery (COD)" });
    }

    // 7. Final order amount calculation
    const finalAmount = totalPrice - discount;
    const productsOrdered = orderedProducts.map((product)=>{
      return {
      product: product._id,
      quantity: product.quantity,
      price: product.price
      }
      })
    console.log("productsOrdered..........",productsOrdered)
    let newOrder = new Order({
      orderedItems: productsOrdered,
      totalPrice: totalPrice,
      discount: discount,
      finalAmount: finalAmount,
      address: desiredAddress,
      payment: payment,
      userId: userId,
      status: payment === "razorpay" ? "Failed" : "Confirmed",
      createdOn: Date.now(),
    });
    
    let orderDone = await newOrder.save();
    console.log("Order created successfully:", orderDone._id);

    // 9. Clear the user's cart after order
    await User.updateOne({ _id: userId }, { $set: { cart: [] } });
    console.log("User's cart cleared for user:", userId);

    // 10. Update product stock based on the ordered quantity
    for (let orderedProduct of orderedProducts) {
      const product = await Product.findOne({ _id: orderedProduct._id });
      if (product) {
        product.quantity = Math.max(product.quantity - orderedProduct.quantity, 0);
        await product.save();
        console.log("Product stock updated for:", orderedProduct.name);
      }
    }
console.log("new order...........",newOrder)
    // 11. Handle payment methods
    if (newOrder.payment === "cod") {
      console.log("Cash on Delivery payment successful");
      res.json({
        payment: true,
        method: "cod",
        order: orderDone,
        quantity: cartItemQuantities,
        orderId: orderDone._id,
      });
    } else if (newOrder.payment === "wallet") {
      if (findUser.wallet >= newOrder.finalAmount) {
        findUser.wallet -= newOrder.finalAmount;
        findUser.history.push({ amount: newOrder.finalAmount, status: "debit", date: Date.now() });
        await findUser.save();
        console.log("Wallet payment successful for order:", orderDone._id);
        res.json({
          payment: true,
          method: "wallet",
          order: orderDone,
          orderId: orderDone._id,
          quantity: cartItemQuantities,
          success: true,
        });
      } else {
        await Order.updateOne({ _id: orderDone._id }, { $set: { status: "Failed" } });
        console.error("Insufficient wallet balance for user:", userId);
        res.json({ payment: false, method: "wallet", success: false, error: "Insufficient wallet balance" });
      }
    } else if (newOrder.payment === "razorpay") {
      const razorPayGeneratedOrder = await generateOrderRazorpay(orderDone._id, orderDone.finalAmount);
      console.log("Razorpay order generated for order:", orderDone._id);
      res.json({
        payment: false,
        method: "razorpay",
        razorPayOrder: razorPayGeneratedOrder,
        order: orderDone,
        quantity: cartItemQuantities,
      });
    }
  } catch (error) {
    console.error('Error processing order:', error.message);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};




//===============================================================================================
const getOrderDetailsPage = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const orderId = req.query.id;
 console.log("orderId..........",orderId)
    const findOrder = await Order.findOne({ _id: orderId }).populate(['address','orderedItems.product']);
    const findUser = await User.findOne({ _id: userId });
console.log("find order.........",findOrder)
    if (!findOrder || !findUser) {
      console.log("Order or user not found");
      // return res.redirect("/pageNotFound");
    }

    let totalGrant = findOrder.finalAmount;
    

    res.render("orderDetails", {
      title: "Order Details",
      user: findUser,
      order: findOrder,
      totalGrant,
    });
  } catch (error) {
   console.error("Error fetching order details:", error);
  //   res.redirect("/pageNotFound");
  } 
};

//========================================================================
const paymentConfirm = async (req, res) => {
  try {
    await Order.updateOne(
      { _id: req.body.orderId },
      { $set: { status: "Confirmed" } }
    ).then((data) => {
      res.json({ status: true });
    });
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const getCartCheckoutPage = async (req, res) => {
  try {
    res.render("checkoutCart");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const changeSingleProductStatus = async (req, res) => {
  const { orderId, singleProductId, status } = req.body;
  const oid = new mongodb.ObjectId(singleProductId);

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(singleProductId)) {
      return res.status(400).json({ message: "Invalid ID format" });
  }

  const order = await Order.findOne({ _id: orderId });
  const productIndex = order.product.findIndex((product) => product._id.toString() === singleProductId);
  const orderedProductDataPrice = order.product[productIndex].price;
  const newPrice = order.totalPrice - orderedProductDataPrice;

  try {
    const filter = { _id: orderId };
    const update = {
      $set: {
        "product.$[elem].productStatus": status,
        totalPrice: newPrice,
      },
    };
    const options = {
      arrayFilters: [{ "elem._id": oid }],
    };
    const result = await Order.updateOne(filter, update, options);
    res.status(200).json({ message: "Product status updated successfully", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//==================================================================
const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const findUser = await User.findOne({ _id: userId });
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const { orderId } = req.body;
    const findOrder = await Order.findOne({ _id: orderId });
    if (!findOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (findOrder.status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }
    
    // Handle refund if payment was made via Razorpay or wallet
    if ((findOrder.payment === "razorpay" || findOrder.payment === "wallet") && findOrder.status === "Confirmed") {
      findUser.wallet += findOrder.totalPrice;
      // Update user wallet history
      await User.updateOne(
        { _id: userId },
        {
          $push: {
            history: {
              amount: findOrder.totalPrice,
              status: "credit",
              date: Date.now(),
              description: `Order ${orderId} cancelled`,
            },
          },
        }
      );
      await findUser.save();
    }

    // Update order status to cancelled
    await Order.updateOne({ _id: orderId }, { status: "Cancelled" });

    // Update product quantities
    for (const productData of findOrder.product) {
      const productId = productData._id;
      const quantity = productData.quantity;
      const product = await Product.findById(productId);
      if (product) {
        product.quantity += quantity;
        await product.save();
      } else {
        console.log("No Product");
      }
    }

    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//=====================================================================
const returnorder = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const findUser = await User.findOne({ _id: userId });
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const { orderId } = req.body;
    const findOrder = await Order.findOne({ _id: orderId });
    if (!findOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (findOrder.status === "returned") {
      return res.status(400).json({ message: "Order is already returned" });
    }
    await Order.updateOne({ _id: orderId }, { status: "Return Request" });
    res.status(200).json({ message: "Return request initiated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//================================================================
const generateOrderRazorpay = (orderId, total) => {
  return new Promise((resolve, reject) => {
    const options = {
      amount: total * 100,
      currency: "INR",
      receipt: String(orderId),
    };
    instance.orders.create(options, (err, order) => {
      if (err) {
        reject(err);
      } else {
        resolve(order);
      }
    });
  });
};
//==================================================================
const verify = (req, res) => {
  let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(
    `${req.body.payment.razorpay_order_id}|${req.body.payment.razorpay_payment_id}`
  );
  hmac = hmac.digest("hex");
  console.log(hmac,"HMAC");
  console.log(req.body.payment.razorpay_signature,"signature");
  if (hmac === req.body.payment.razorpay_signature) {
    console.log("true");
    res.json({ status: true });
  } else {
    console.log("false");
    res.json({ status: false });
  }
};
//=================================================================
const downloadInvoice = async (req, res) => {
  try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId).populate('userId');

      if (!order) {
          return res.status(404).send('Order not found');
      }

      const data = {
          "documentTitle": "INVOICE",
          "currency": "INR",
          "taxNotation": "gst",
          "marginTop": 25,
          "marginRight": 25,
          "marginLeft": 25,
          "marginBottom": 25,
          apiKey: process.env.EASYINVOICE_API,
          mode: "development",
          images: {
              logo: "https://firebasestorage.googleapis.com/v0/b/ecommerce-397a7.appspot.com/o/logo.jpg?alt=media&token=07b6be19-1ce8-4797-a3a0-f0eaeaafedad",
          },
          "sender": {
              "company": "Trend Setter",
              "address": "Thrikkakkara",
              "zip": "682021",
              "city": "Kochi",
              "country": "India"
          },
          "client": {
              "company": order.address[0].name,
              "address": order.address[0].landMark + ", " + order.address[0].city,
              "zip": order.address[0].pincode,
              "city": order.address[0].state,
              "country": "India"
          },
          "information": {
              "number": order.orderId,
              "date": moment(order.date).format("YYYY-MM-DD HH:mm:ss")
          },
          "products": order.product.map(prod => ({
              "quantity": prod.quantity,
              "description": prod.name || prod.title,
              "tax": 0,
              "price": prod.price,

          })),
          "bottomNotice": "Thank you for your business",
      };

      const result = await easyinvoice.createInvoice(data);
      const invoicePath = path.join(__dirname, "../../public/invoice/", `invoice_${orderId}.pdf`);
      fs.writeFileSync(invoicePath, result.pdf, 'base64');
      res.download(invoicePath, `invoice_${orderId}.pdf`, (err) => {
          if (err) {
              console.error("Error downloading the file", err);
          }
          fs.unlinkSync(invoicePath);
      });
  } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while generating the invoice');
  }
};







module.exports = {
  getCheckoutPage,
  applyCoupon,
  deleteProduct,
  cancelOrder,
  orderPlaced,
  getOrderDetailsPage,
  getCartCheckoutPage,
  verify,
  changeSingleProductStatus,
  paymentConfirm,
  returnorder,
  downloadInvoice
};
