import { asyncHandler } from "../utils/asynchandler";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,_,next)  => {
    try {
        const token =  req.cookies.accessTokenn  || req.header
        ("AUthorization")?.replace("Bearer","")
    
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.
            ACCESS_TOKEN_SECRET)
    
            const user = await User.findById(decodedToken?._id).select
            ("-password -refreshToken")
        
            if(!user){
                throw new ApiError(401,"invalid access token")
            }
            req.user = user;
            next()
    } catch (error) {
        throw new ApiError(401,error?.message ||
            "invalid access token"
        )
    }
})