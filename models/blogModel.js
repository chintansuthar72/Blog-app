const mongoose = require('mongoose');

const blogSchema = mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    body : {
        type : String,
        required : true
    },
    image : {
        data : Buffer,
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    }
}, {timestamps : true});

const Blog = mongoose.model('blog',blogSchema);
module.exports = Blog;