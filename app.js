//-------------------import modules----------------------
const express = require('express');
const path = require('path');
const env = require("dotenv").config();
const session = require("express-session");
const passport = require("./config/passport");
const app = express();
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter=require("./routes/adminRouter")
db();


//--------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user=req.user||null
    next();
});

//---------------------------- Set view engine-------------------
app.set("view engine", "ejs");

//------------------------------Set views directories for user and admin-----------------
app.set("views", [
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
]);


//----------------------------Serve static files from the 'public' folder------------------
app.use(express.static(path.join(__dirname, 'public')));

//--------------------------Use userRouter for routing---------------------
app.use("/", userRouter);
app.use('/admin',adminRouter)


//--------------------------Start the server-------------------------
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

//---------------------------exports the module------------------------
module.exports = app;
