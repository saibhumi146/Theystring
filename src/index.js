import dotenv from "dotenv";
import connectDB from "./db/index.js";


dotenv.config({
    path: "./.env"
});
 
connectDB()
.then((db) => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
})
.catch((error) => {
    console.error("db connection failed:", error);
})

















/* import express from "express";
const app = express();

;( async ()=>{
try{
    mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
    app.on("error", (error) => {
        console.error("ERROR: ", error);
        throw error;    
    });

    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}
catch(error){
    console.log("ERROR: ",error);
}
})() */