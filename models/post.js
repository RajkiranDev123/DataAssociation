

import mongoose from "mongoose";

//mongoose.connect("mongodb://localhost:27017/dataAssociation")


const postSchema=mongoose.Schema({
    content:String,
    user:{type:mongoose.Schema.Types.ObjectId,ref:"userModel"},
    date:{
        type:Date,
        default:Date.now
    },
    likes:[
        {type:mongoose.Schema.Types.ObjectId,ref:"userModel"}
    ]
})

export const postModel=mongoose.model("postModel",postSchema)