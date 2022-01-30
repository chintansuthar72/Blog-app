const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');   
const Blog = require('./models/blogModel');
const User = require('./models/userModel');
const validate = require('./validation');
const jwt = require('jsonwebtoken');
const verify = require('./verifyToken')
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const app = express();

dotenv.config();

const storage = multer.diskStorage({
    destination : (req,file,cb) => {
        cb(null,'public/uploads/');
    },
    filename : (req,file,cb) => {
        const ext = path.extname(file.originalname)
        cb(null,Date.now()+ext);
    }
});

const upload = multer({
    storage : storage,
    fileFilter : (req,file,cb) => {
        if(file.mimetype == "image/jpg" || file.mimetype == "image/png" || file.mimetype == "image/jpeg") {
            cb(null,true);
        } else {
            console.log("Not supported file type.")
            cb("Not supported file type. Please use jpg/jpeg/img.", false);
        }
    }
})

mongoose.connect(process.env.DATABASE_URL)
    .then((result)=>{
        console.log("connected to database...");
        app.listen(process.env.PORT,'localhost',()=>{
            console.log("listening on port " + process.env.PORT);
        })
    }) .catch((error)=>{
        console.log(error);
    });

app.set('view engine','ejs');
app.set('views','views')
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/user/signin', (req,res)=>{
    res.render('signin');
});

app.post('/user/signin', async (req,res)=>{ 
    const validation = validate.signinValidation(req.body);
    if(validation.error){
        res.status(400).send(validation.error.details[0].message)
    } else  {
        const checkForEmail = await User.findOne({email : req.body.email});
        if(checkForEmail){
            res.status(400).send("email already exists")
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            const user = new User({
                username : req.body.username,
                email : req.body.email,
                password : hashedPassword 
            });
            user.save()
            .then(result => res.render('login',{message:"You can now login!"}))
            .catch(err => res.status(400).send(err))
        }
    }  
});

app.get('/user/login',(req,res) => {
    res.render('login',{message:""});
})

app.post('/user/login', async (req,res)=>{
    const validation = validate.loginvalidation(req.body)
    if(validation.error){
        res.status(400).send(validation.error.details[0].message)
    } else{
        const user = await User.findOne({email : req.body.email});
        if(!user) {
            res.status(400).send("User does not exists!")
        } else {
            const valid = await bcrypt.compare(req.body.password,user.password);
            if(!valid){
                res.status(400).send("Invalid password")
            } else {
                const token = jwt.sign({_id : user._id}, process.env.TOKEN_SECRET);
                // res.header('auth-token', token)
                res.redirect(`/blogs?token=${token}`)
            }
        }
    }
});

app.get('/', (req,res) => {
    res.redirect('/user/login');
});

app.get('/create', (req,res)=>{
    const token = req.query.token;
    res.render('create',{token});
})

app.get('/blogs',verify, async (req,res) => {
    const id = req.user._id;
    const user = await User.findById(id);
    const email = user.email;
    const token = req.query.token;
    Blog.find({email}).sort({createdAt : -1}).then((result) => {
        res.render('index',{blogs : result,token : token, username : user.username}); 
    }).catch(err => res.send(err));
})

app.post('/blogs', verify, upload.single('image'), async (req,res)=>{
    const token = req.query.token;
    const id = req.user._id;
    const user = await User.findById(id);
    const blog = new Blog({
        title : req.body.title,
        body : req.body.body,
        email : user.email
    })
    if(req.file){
        blog.image = req.file.filename
    }
    blog.save().then(result => {
        res.redirect(`/blogs?token=${token}`);
    }).catch(err => res.send(err));
})

app.get('/blogs/:id', (req,res)=>{
    const id = req.params.id;
    const token = req.query.token;
    Blog.findById(id).then((result)=>{
        res.render('details',{blog:result,token:token});
    }).catch(err => res.send(err));
})

app.delete('/blogs/:id', (req, res) => {
    const token = req.query.token;
    const id = req.params.id;
    Blog.findByIdAndDelete(id)
    .then(result => {
        res.json({ redirect: `/blogs?token=${token}` });
    })
    .catch(err => {
        res.send(err);
    });
});

app.get('/blogs/update/:id',(req,res)=> {
    const token = req.query.token;
    const id = req.params.id;
    Blog.findById(id).then(result => {
        res.render('update',{blog:result,token});
    }).catch(err => res.send(err));
});

app.post('/blogs/update/:id', (req,res) => {
    const token = req.query.token;
    const id = req.params.id;
    Blog.findByIdAndUpdate(id,req.body).then(result => {
        res.redirect(`/blogs/${id}?token=${token}`)
    }).catch(err => res.send(err));
})

// 404 page
app.use((req,res) => {
    res.status(404).send('Error 404 : resource not found')
})
