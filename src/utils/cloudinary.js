// import { v2 as cloudinary }
// from "cloudinary";



// cloudinary.config({

//     cloud_name:
//     process.env.CLOUDINARY_CLOUD_NAME,

//     api_key:
//     process.env.CLOUDINARY_API_KEY,

//     api_secret:
//     process.env.CLOUDINARY_API_SECRET
// });



// const uploadOnCloudinary =
// async (localFilePath) => {

//     try {

//         if (!localFilePath)
//             return null;



//         const response =
//         await cloudinary.uploader.upload(

//             localFilePath,

//             {
//                 resource_type: "auto"
//             }
//         );



//         return response;

//     } catch (error) {

//         console.log(
//             "Cloudinary Error:",
//             error
//         );

//         return null;
//     }
// };



// export {

//     uploadOnCloudinary
// };



import { v2 as cloudinary } from "cloudinary";

cloudinary.config({

    cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
        process.env.CLOUDINARY_API_KEY,

    api_secret:
        process.env.CLOUDINARY_API_SECRET

});



// =====================================
// UPLOAD IMAGE
// =====================================

const uploadOnCloudinary = async (localFilePath) => {

    try {

        if (!localFilePath) {

            return null;

        }

        const response =
            await cloudinary.uploader.upload(

                localFilePath,

                {
                    folder: "kisaan_kart/reviews",
                    resource_type: "image"
                }

            );

        return response;

    } catch (error) {

        console.log(
            "Cloudinary Upload Error:",
            error
        );

        return null;

    }

};



// =====================================
// DELETE IMAGE
// =====================================

const deleteFromCloudinary = async (publicId) => {

    try {

        if (!publicId) {

            return null;

        }

        const response =
            await cloudinary.uploader.destroy(publicId);

        return response;

    } catch (error) {

        console.log(
            "Cloudinary Delete Error:",
            error
        );

        return null;

    }

};



export {

    uploadOnCloudinary,

    deleteFromCloudinary

};