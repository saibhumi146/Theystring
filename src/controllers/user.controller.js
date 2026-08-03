import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";




const registerUser = asyncHandler(async(req,res)=>{
       //get user detils from frontend
       //validation - not empty
       //check if user alresdy exists:username,email
       //check for images,check for avatar 
       //upload them to cloudinary
       //create user object - create entry in db
       //remove password and refresh token from response
       //check for user creation
       //return response to frontend



       const {username,email,fullName,password} = req.body
       console.log("email:",email);
 
       /* if(fullName === ""){
              throw new ApiError("Full name is required",400)  
       } */
       if(
              [fullName,email,username,password].some((field)=>
                     field?.trim() === "" )
       ){
              throw new ApiError("All fields are required",400)        
       }

const existedUser = await User.findOne({
       $or:[ {username},{email}]
})

if (existedUser){
       throw new ApiError("User already exists",409)
}
 console.log(req.files);

const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
       throw new ApiError("Avatar is required",400)
}

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
       throw new ApiError("Avatar upload failed",500)

}
if(!coverImage){
       throw new ApiError("Cover image upload failed",500)
}

const user = await User.create({
       fullName,
       avatar:avatar.url,
       coverImage:coverImage.url,
       email,
       password ,
       username :username.toLowerCase()
})

const createdUser = await User.findById(user._id).select(
       " -password -refreshToken "
)
if (!createdUser) {
       throw new ApiError("User creation failed",500)
}

return res.status(201).json(
       new ApiResponse(201,createdUser,"User created successfully"))
})

export {registerUser}