const User = require('../../models/userschema');
const Cart = require('../../models/cartschema');
const Product = require('../../models/productschema');
const Category = require('../../models/categoryschema');
const {log} = require('console');
const env = require('dotenv').config();

// ======================== cart ===============================================
const cart = async (req, res) => {
  try {

  log('in cart page')
    const user = req.session.user.id;
    const categories = await Category.find({ islisted: true, isDeleted: false });

    log(user);
    if (!user) {
      return res.status(401).json({ message: 'User not logged in' });
    }
  
      const cartData = await Cart.findOne({ userId: user}).populate({
        path: 'items.productId',
        model: Product,
      });
      
   if (!cartData) {
    return res.render('cart', {
      title: 'Cart - Feather',
      user,
      products:  [],
      categories
    });
  }

  const filteredProducts = cartData.items.filter(item => {
    const product = item.productId;
    return product && !product.isBlocked && !product.isDeleted;
  });
  let grandTotal = 0;
  filteredProducts.forEach(item => {
    grandTotal += item.productId.price * item.quantity; // Assuming quantity is stored in item
  });
  console.log(filteredProducts);  // Log the filtered products
  res.render('cart', {
        title: 'Cart - Feather',
        user,
      products: filteredProducts,
        categories,
        grandTotal,
      });
    } catch (error) {
      log(error);
      res.redirect('/pageNotFound');
    }
  };

// ==================== guest cart ============================

const guestCart = async(req,res)=>{
  try{
  
  log('in guest cart');
  const categories = await Category.find({islisted:true,isDeleted:false});
  res.render('pages/cartForguest',{title:'Cart - Feather',categories});

  }catch(err){
    log(err);
    res.redirect('/pageNotFound');
  }
}




// ========================================= add cart ===================
const addToCart = async (req, res) => {
  try {
    log('Adding to cart');
    const { productId, quantity = 1 } = req.body;
    log('Request body:', req.body);
    log('Received productId:', productId);

    const user = req.session.user.id;
    log('User:', user);
    if (!user) {
      return res.status(401).json({ message: 'User not logged in' });
    }

    // Fetch product details from the Product collection
    const product = await Product.findById(productId);
    log('Fetched product:', product); // Log the fetched product to ensure it's correct
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const price = product.salePrice || product.regularPrice;
    log('Product price:', price); // Log the product price to confirm it's correct
    if (typeof price !== 'number' || isNaN(price)) {
      return res.status(400).json({ message: 'Invalid product price' });
    }

    const totalprice = price * quantity; // Calculate the total price
    log('Total price:', totalprice); // Log the total price to confirm it's correct
    if (isNaN(totalprice)) {
      return res.status(400).json({ message: 'Invalid total price calculation' });
    }

    // Find the existing cart for the user or create a new one if it doesn't exist
    let cart = await Cart.findOne({ userId: user });
    if (!cart) {
      // If no cart exists, create a new one
      cart = new Cart({ userId: user, items: [] });
    }

    // Find the product in the cart to update or add it
    const existingProductIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (existingProductIndex >= 0) {
      // If the product is already in the cart, update the quantity and total price
      cart.items[existingProductIndex].quantity += parseInt(quantity);
      cart.items[existingProductIndex].totalprice = price * cart.items[existingProductIndex].quantity; // Update totalprice
    } else {
      // If the product is not in the cart, add it
      cart.items.push({
        productId,
        quantity: parseInt(quantity),
        price, 
        totalprice, 
      });
    }

    // Calculate the grand total for the cart
    let grandTotal = 0;
    cart.items.forEach(item => {
      grandTotal += item.totalprice;
    });

    // Update the grand total
    cart.grandTotal = grandTotal;

    // Save the updated cart to the database
    await cart.save();
    log('Saved cart:', cart);
    return res.json({ success: true, message: 'Product added to cart', grandTotal });
  } catch (error) {
    console.log('Error adding product to cart:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


// =============================== update quantity ==============================

// const updateQuantity = async (req, res) => {
//   try {
//     log('in ')
//       const { productId } = req.params;  // Get productId from URL parameters
//       let quantity = parseInt(req.body.quantity);// Get updated quantity from request body

//      log(productId, 'product id in updateQuantity');
//      log('quantity in updateQuantity', quantity);   
//      console.log('User ID:', req.session.user);

//       log('in ')
//     log('in ')

//       // Find the cart for the current user and update the quantity of the specified product
//       const cart = await Cart.findOneAndUpdate(
//           { userId: req.session.user, 'item.productId': productId },
//           { $set: { 'item.$.quantity': quantity } }, // Update the quantity
//           { new: true } // Return the updated document
//       );
//        log(cart)
//       if (!cart) {
//           return res.status(404).json({ success: false, message: 'Cart not found' });
//       }

//      log(cart, 'updated cart');
//       res.json({ success: true, cart, message: 'Cart updated successfully' });
//   } catch (error) {
//      log(error);
//       res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = parseInt(req.body.quantity); 
    const userId = req.session.user.id; 
    console.log(productId, 'Product ID in updateQuantity');
    console.log('Quantity in updateQuantity', quantity);
    console.log('User ID:', userId);

    const product = await Product.findById(productId);
    const salePrice = product.salePrice; 

    const totalPrice = quantity * salePrice; 
    const cart = await Cart.findOneAndUpdate(
      { userId: userId, 'items.productId': productId },
      { 
        $set: { 
          'items.$.quantity': quantity,
          'items.$.totalprice': totalPrice 
        } 
      },
      { new: true } 
    );

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    let  grandTotal= 0;

    cart.items.forEach(item => {
      const itemTotalPrice = Number(item.totalprice); 
      if (!isNaN(itemTotalPrice)) {
         grandTotal+= itemTotalPrice; 
      }
    });

    console.log('Grand Total Price:',  grandTotal);
    cart. grandTotal=  grandTotal;
    await cart.save();
    return res.status(200).json({ success: true, cart,  grandTotal}); 

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
  

// ================ Remove product from the cart ==================
const removeFromCart = async (req, res) => {
    try {
        const productId = req.query.productId; // Consistent with `removeProduct`
        const userId = req.session.user.id;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ status: false, message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
            await cart.save();

            return res.status(200).json({ status: true, message: 'Product removed from cart successfully' });
        } else {
            return res.status(404).json({ status: false, message: 'Product not found in cart' });
        }
    } catch (error) {
        console.error('Error removing item from cart:', error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};

  
  module.exports = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    guestCart
  }