const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true, //field is required
        unique: true,
        minlength: [3, 'username must be at least 3 characters long'],
        trim: true,
        lowercase: true
    },
    email: { 
        type: String, 
        required: true, //field is required
        unique: true,
        trim: true, 
        lowercase: true,
        minlength: [13, 'email must be at least 13 characters long'],
        
    }, 
    password: { 
        type: String,  
        required: true, //field is required
        trim: true,
        minlength: [5, 'password must be at least 5 characters long']
    }
});

const user = mongoose.model('User', userSchema); //creating model
module.exports = user; //exporting the model so that we can use it in other files 

