

import mongoose from "mongoose";
////////////////////////////127.0.0.1:27017
mongoose.connect("mongodb://localhost:27017/dataAssociation")


const userSchema=mongoose.Schema({
    username:String,
    name:String,
    email:String,
    age:Number,
    password:String,
   posts:[//array of ids

        {type:mongoose.Schema.Types.ObjectId,ref:"postModel"}
       
    ]
})

export const userModel=mongoose.model("userModel",userSchema)