const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public"))); //we have to tell where are static files such as css and js files are served from
app.use(express.urlencoded({extended:true}));//to parse data that we fill in form in creating new post
const Chat = require("./models/chat.js");
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

const ExpressError = require("./ExpressError");

main()
    .then(() => {
        console.log("Connection successful");
    })
    .catch((err) => console.log(err));

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/whatsapp");
}

app.get("/", (req, res) => {
    res.send("Root is working");
});

//index route
app.get("/chats", asyncWrap(async (req, res) => { 
    let chats = await Chat.find();
    res.render("index.ejs", {chats});
}));

//new route
app.get("/chats/new", (req, res) => {
    res.render("new.ejs");
});

//create route
app.post("/chats", asyncWrap(async (req, res, next) => {
    let {from, to, msg} = req.body;
    let newChat = new Chat({
        from: from,
        to: to,
        msg: msg,
        created_at: new Date()
    });
    await newChat.save();
    res.redirect("/chats");
}));

function asyncWrap(fn){
    return function(req, res, next){
        fn(req, res, next).catch((err) => next(err));
    };
}

//Show route - to see chat
app.get("/chats/:id", asyncWrap(async (req, res, next) => {
    let {id} = req.params;
    let chat = await Chat.findById(id);
    if(!chat){
        next(new ExpressError(404, "Chat not found"));
    }
    res.render("show.ejs", {chat}); 
}));

//edit route
app.get("/chats/:id/edit", asyncWrap(async (req, res) => {
    let {id} = req.params;
    let chat = await Chat.findById(id);
    res.render("edit.ejs", {chat}); 
}));

//update route
app.put("/chats/:id", asyncWrap(async (req, res) => {
    let {id} = req.params;
    let {msg: newMsg} = req.body;
    let updatedChat = await Chat.findByIdAndUpdate(
        id,
        {msg: newMsg},
        {runValidators: true, new: true}
    );
    res.redirect("/chats");    
}));

//Destroy route
app.delete("/chats/:id", asyncWrap(async (req, res) => {
    let {id} = req.params;
    let deletedChat = await Chat.findByIdAndDelete(id);
    console.log(deletedChat);
    res.redirect("/chats");  
}));

//Error handling middleware
app.use((err, req, res, next) => {
    let {status=500, message="Some error occured"} = err;
    res.status(status).send(message);
});

app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});