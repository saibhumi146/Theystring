import { asyncHandler } from '../utils/asynchandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
const generateAccessAndRefreshTokens =  async(userId) => {
       try{
          const user = await User.findById(userId)
          const accessToken = user.generateAccessToken()
          const refreshToken = user.generateRefreshToken()

          user.refreshToken = refreshToken
          user.save({validateBeforeSave :false})

         return {accessToken,refreshToken}
          



       }catch(error){
              throw new ApiError("Token generation failed",500)
       }
}


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

const loginUser = asyncHandler(async(req,res)=>{
         //req body-> data
         //username or email
         //find the user
         //password check
         //access token and refresh token
         //send cookie

         const {username,email,password} = req.body
         if(!(username || email)){
                     throw new ApiError("Username or email is required",400)

       }
       const user =  await User.findOne({
              $or:[{username},{email}]
       })
       if (!user) {
                     throw new ApiError("User does not exist",404)
       }
       
       const isPasswordValid = await user.isPasswordCorrect(password)
      
       if (!isPasswordValid) {
                     throw new ApiError("Invalid user credentials",401)
       }
       
      const{accessToken ,refreshToken} = await generateAccessAndRefreshTokens(user._id)

      const loggedInUser = await User.findById(user._id).
      select("-password -refreshToken")

      const options = {
       httpOnly:true,
       secure:true
      }
      return res.status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(
       new ApiResponse(
              200,
              {
                user:loggedInUser,accessToken,
                refreshToken
              },
              "User   loggedin Successfully"
       )
      )

})

const logoutUser = asyncHandler(async(req,res)=>{
       User.findByIdAndUpdate(
              req.user._id,
              {
                  $set:{
                     refreshToken:undefined
                  }
              },
              {
                     new:true
              }
       )
       const options ={
              httpOnly:true,
              secure:true
       }
       return res
       .status(200)
       .clearCookie("accessToken",options)
       .clearCookie("refreshToken",options)
       .json(new ApiResponse(200,{},"user loggedout successfully"))
})

const  refreshAccessToken = asyncHandler(async(req,res)=>{
       const incomingRefreshToken = req.cookies.refreshToken
       refreshToken || req.body.refreshToken

       if(!incomingRefreshToken){
              throw new ApiError(401,"unauthorized request")}
              
       const decodedToken = jwt.verify(
              incomingRefreshToken,
              process.env.REFRESH_TOKEN_SECRET
       )
       const user =  await User.findById(decodedToken?._id)
        if(!user){
              throw new ApiError(401,"invalid refesh token ")}
       
       

       if(incomingRefreshToken !== user.refreshToken){
              throw new ApiError(401,"expired refresh token")
       }
       
       const options ={
              httpOnly:true,
              secure:true
       }
       const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)  

       return res
       .status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",newRefreshToken,options)
       .json(
              new ApiResponse(200,
                     {
                            accessToken,
                            newRefreshToken
                     },
                     "Access token refreshed successfully"
              )
       )




       })

       const changeCurrentPassword = asyncHandler(async(req,res)
=>{

       const{oldpassword,newPassword} = req.body 
       const user = await User.findById(req.user?.id)
       const isPasswordValid = await user.is
       PasswordCorrect(oldPassword)

       if(!isPasswordCorrect){
              throw new ApiError(400,"Invalid old password     ")
       }
        user.password = newPassword
       await user.save({validateBeforeSave:false})

       return res.status(200).json(
              new ApiResponse(200,{},"Password changed successfully")
       )

})
const getCurrentUser = asyncHandler(async(req,res)=>{
        return res 
       .status(200)
       .json(200,req.user,"current user fetched s uccessfully")
       
})
const updateAccountDetails = asyncHandler(async(req,res)=> {
     if(!fullName || !email){
       throw new ApiError("All fields are required",400)
     }

     User.findByIdAndUpdate(
       req.user?._id,
       {
              $set:{
                     fullName,
                     email
              }
       },
       {new:true}
     ).select("-password")
     return res
       .status(200)
       .json(new ApiResponse(200,updatedUser,"Account details updated successfully"))

})

const updateUserAvatar = syncHandler(async(req,res) =>
{
      const avatarLocalPath = req.files?.avatar[0]?.path
      
      if(!avatarLocalPath){
              throw new ApiError("Avatar is required",400)
      }       

      const avatar = await uploadOnCloudinary
      (avatarLocalPath)
      if(!avatar.url){
              throw new ApiError("Error uploading avatar",500)
      }

    const user =  await User.findByIdAndUpdate(
              req.user?._id,
              {
                     $set:{
                            avatar:avatar.url
                     }
              },
              {new:true}
      ).select("-password")      
      return res
       .status(200)
       .json(
              new ApiResponse
              (200,updatedUser,"avatar image updated successfully")
       )

})
    
const updateUserCoverImage = syncHandler(async(req,res) =>
{
      const coverImageLocalPath = req.files?.coverImage[0]?.path
      
      if(!coverImageLocalPath){
              throw new ApiError("Cover image is required",400)
      }       

      const coverImage = await uploadOnCloudinary
      (coverImageLocalPath)
      if(!coverImage.url){
              throw new ApiError("Error uploading cover image",500)
      }

      await User,findByIdAndUpdate(
              req.user?._id,
              {
                     $set:{
                            coverImage:coverImage.url
                     }
              },
              {new:true}
      ).select("-password")      
return res
       .status(200)
       .json(
              new ApiResponse
              (200,updatedUser,"Cover image updated successfully")
       )
})
    

export {registerUser, 
       loginUser,
       logoutUser,
       refreshAccessToken,
       changeCurrentPassword,
       getCurrentUser,
       updateAccountDetails,
       updateUserAvatar,
       updateUserCoverImage
}