import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { userModel } from "./models/user.js";
import { postModel } from "./models/post.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config({
  path: "./.env",
});

const app = express();

app.use(cors()); //If you make a request to your app, you will notice a new header being returned: Access-Control-Allow-Origin: *
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("meta :", import.meta.url); //contains information about the module, such as the module's URL.
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
console.log("filename : ", __filename);
const __dirname = path.dirname(__filename); // get the name of the directory
console.log("dirname : ", __dirname);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
console.log("join : ", path.join(__dirname, "public"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", async (req, res) => {
  const { username, age, email, password, name } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User already registered!");

  bcrypt.genSalt(10, (err, salt) => {
    console.log("salt", salt);

    bcrypt.hash(password, salt, async (err, hash) => {
      console.log("hash", hash);
      let user = userModel.create({
        username,
        age,
        email,
        name,
        password: hash,
      });

      let token = jwt.sign({ email: email, userid: user._id }, "sk");
      res.cookie("token", token);
      res.send("registered");
    });
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) return res.status(500).send("user does not exist !");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "sk");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else res.redirect("/login");
  });
});

app.get("/logout", async (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  console.log("from profile", req.user);
  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  //Population is the process of automatically replacing the specified paths /refs
  // in the document with document(s) from other collection(s)

  console.log("pop", user);
  res.render("profile", { user });
});

//like
app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");

  if (post.likes.indexOf(req.user.userid) == -1) {
    //if id is not found
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }

  await post.save();
  res.redirect("/profile"); // redirect use /
});
//edit
app.get("/edit/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id });
  res.render("edit", { post }); // redirect use /
});

//update
app.post("/update/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { content: req.body.content }
  );
  res.redirect("/profile"); // redirect use /
});

//middleware for checking log in or not (protected route)
function isLoggedIn(req, res, next) {
  if (req.cookies.token == "") res.redirect("/login");
  else {
    let data = jwt.verify(req.cookies.token, "sk");
    req.user = data;
    next();
  }
}

app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  const { content } = req.body;
  console.log("content", content);
  let post = await postModel.create({
    user: user._id, // post knows which is the user
    content: content,
  });
  console.log("new post", post);
  console.log("user from /post", user);
  user.posts.push(post._id);
  await user.save();

  res.redirect("/profile");
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`app is running at ${process.env.PORT || 3001}`);
});
