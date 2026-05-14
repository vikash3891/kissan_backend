// import pool from "../db/index.js";

// import { ApiError }
// from "../utils/ApiError.js";

// import { ApiResponse }
// from "../utils/ApiResponse.js";

// import { asyncHandler }
// from "../utils/asyncHandler.js";
// import { uploadOnCloudinary }
// from "../utils/cloudinary.js";


// // ===============================
// // CREATE PRODUCT
// // ===============================

// const createProduct = asyncHandler(
// async (req, res) => {

//     const {

//         name,
//         description,
//         price,
//         discount_price,
//         stock,
//         image_url,
//         category,
//         brand,
//         unit

//     } = req.body;



//     if (!name || !price) {

//         throw new ApiError(
//             400,
//             "Name and price are required"
//         );
//     }



//     const result = await pool.query(

//         `
//         INSERT INTO products
//         (

//             name,
//             description,
//             price,
//             discount_price,
//             stock,
//             image_url,
//             category,
//             brand,
//             unit

//         )

//         VALUES
//         (
//             $1,$2,$3,$4,$5,
//             $6,$7,$8,$9
//         )

//         RETURNING *
//         `,

//         [

//             name,
//             description,
//             price,
//             discount_price,
//             stock,
//             image_url,
//             category,
//             brand,
//             unit
//         ]
//     );



//     return res.status(201).json(

//         new ApiResponse(

//             201,

//             result.rows[0],

//             "Product created successfully"
//         )
//     );
// });




// // ===============================
// // GET ALL PRODUCTS
// // ===============================

// const getAllProducts = asyncHandler(
// async (_, res) => {

//     const result = await pool.query(

//         `
//         SELECT *

//         FROM products

//         ORDER BY created_at DESC
//         `
//     );



//     return res.status(200).json(

//         new ApiResponse(

//             200,

//             result.rows,

//             "Products fetched successfully"
//         )
//     );
// });




// // ===============================
// // GET SINGLE PRODUCT
// // ===============================

// const getSingleProduct = asyncHandler(
// async (req, res) => {

//     const { id } = req.params;



//     const result = await pool.query(

//         `
//         SELECT *

//         FROM products

//         WHERE id = $1
//         `,

//         [id]
//     );



//     if (result.rows.length === 0) {

//         throw new ApiError(
//             404,
//             "Product not found"
//         );
//     }



//     return res.status(200).json(

//         new ApiResponse(

//             200,

//             result.rows[0],

//             "Product fetched successfully"
//         )
//     );
// });




// // ===============================
// // UPDATE PRODUCT
// // ===============================

// const updateProduct = asyncHandler(
// async (req, res) => {

//     const { id } = req.params;

//     const {

//         name,
//         description,
//         price,
//         discount_price,
//         stock,
//         image_url,
//         category,
//         brand,
//         unit

//     } = req.body;



//     const result = await pool.query(

//         `
//         UPDATE products

//         SET

//         name = $1,
//         description = $2,
//         price = $3,
//         discount_price = $4,
//         stock = $5,
//         image_url = $6,
//         category = $7,
//         brand = $8,
//         unit = $9

//         WHERE id = $10

//         RETURNING *
//         `,

//         [

//             name,
//             description,
//             price,
//             discount_price,
//             stock,
//             image_url,
//             category,
//             brand,
//             unit,
//             id
//         ]
//     );



//     if (result.rows.length === 0) {

//         throw new ApiError(
//             404,
//             "Product not found"
//         );
//     }



//     return res.status(200).json(

//         new ApiResponse(

//             200,

//             result.rows[0],

//             "Product updated successfully"
//         )
//     );
// });




// // ===============================
// // DELETE PRODUCT
// // ===============================

// const deleteProduct = asyncHandler(
// async (req, res) => {

//     const { id } = req.params;



//     const result = await pool.query(

//         `
//         DELETE FROM products

//         WHERE id = $1

//         RETURNING *
//         `,

//         [id]
//     );



//     if (result.rows.length === 0) {

//         throw new ApiError(
//             404,
//             "Product not found"
//         );
//     }



//     return res.status(200).json(

//         new ApiResponse(

//             200,

//             result.rows[0],

//             "Product deleted successfully"
//         )
//     );
// });



// export {

//     createProduct,

//     getAllProducts,

//     getSingleProduct,

//     updateProduct,

//     deleteProduct
// };



import fs from "fs";

import pool from "../db/index.js";

import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";

import { uploadOnCloudinary }
from "../utils/cloudinary.js";



// ===============================
// CREATE PRODUCT
// ===============================

const createProduct = asyncHandler(
async (req, res) => {

    const {

        name,
        description,
        price,
        discount_price,
        stock,
        category,
        brand,
        unit

    } = req.body;



    // ===============================
    // VALIDATION
    // ===============================

    if (!name || !price) {

        throw new ApiError(
            400,
            "Name and price are required"
        );
    }



    // ===============================
    // IMAGE UPLOAD
    // ===============================

    let image_url = null;

    const imageLocalPath =
    req.file?.path;



    if (imageLocalPath) {

        const uploadedImage =
        await uploadOnCloudinary(
            imageLocalPath
        );



        if (!uploadedImage) {

            throw new ApiError(
                500,
                "Image upload failed"
            );
        }



        image_url =
        uploadedImage.secure_url;



        // DELETE LOCAL FILE
        fs.unlinkSync(imageLocalPath);
    }



    // ===============================
    // INSERT PRODUCT
    // ===============================

    const result = await pool.query(

        `
        INSERT INTO products
        (

            name,
            description,
            price,
            discount_price,
            stock,
            image_url,
            category,
            brand,
            unit

        )

        VALUES
        (
            $1,$2,$3,$4,$5,
            $6,$7,$8,$9
        )

        RETURNING *
        `,

        [

            name,
            description,
            price,
            discount_price,
            stock,
            image_url,
            category,
            brand,
            unit
        ]
    );



    return res.status(201).json(

        new ApiResponse(

            201,

            result.rows[0],

            "Product created successfully"
        )
    );
});




// ===============================
// GET ALL PRODUCTS
// ===============================

const getAllProducts = asyncHandler(
async (_, res) => {

    const result = await pool.query(

        `
        SELECT *

        FROM products

        ORDER BY created_at DESC
        `
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows,

            "Products fetched successfully"
        )
    );
});




// ===============================
// GET SINGLE PRODUCT
// ===============================

const getSingleProduct = asyncHandler(
async (req, res) => {

    const { id } = req.params;



    const result = await pool.query(

        `
        SELECT *

        FROM products

        WHERE id = $1
        `,

        [id]
    );



    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Product not found"
        );
    }



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Product fetched successfully"
        )
    );
});




// ===============================
// UPDATE PRODUCT
// ===============================

const updateProduct = asyncHandler(
async (req, res) => {

    const { id } = req.params;

    const {

        name,
        description,
        price,
        discount_price,
        stock,
        category,
        brand,
        unit

    } = req.body;



    // ===============================
    // CHECK PRODUCT EXISTS
    // ===============================

    const existingProduct =
    await pool.query(

        `
        SELECT *

        FROM products

        WHERE id = $1
        `,

        [id]
    );



    if (existingProduct.rows.length === 0) {

        throw new ApiError(
            404,
            "Product not found"
        );
    }



    let image_url =
    existingProduct.rows[0].image_url;



    // ===============================
    // NEW IMAGE UPLOAD
    // ===============================

    const imageLocalPath =
    req.file?.path;



    if (imageLocalPath) {

        const uploadedImage =
        await uploadOnCloudinary(
            imageLocalPath
        );



        if (!uploadedImage) {

            throw new ApiError(
                500,
                "Image upload failed"
            );
        }



        image_url =
        uploadedImage.secure_url;



        // DELETE LOCAL FILE
        fs.unlinkSync(imageLocalPath);
    }



    // ===============================
    // UPDATE PRODUCT
    // ===============================

    const result = await pool.query(

        `
        UPDATE products

        SET

        name = $1,
        description = $2,
        price = $3,
        discount_price = $4,
        stock = $5,
        image_url = $6,
        category = $7,
        brand = $8,
        unit = $9

        WHERE id = $10

        RETURNING *
        `,

        [

            name,
            description,
            price,
            discount_price,
            stock,
            image_url,
            category,
            brand,
            unit,
            id
        ]
    );



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Product updated successfully"
        )
    );
});




// ===============================
// DELETE PRODUCT
// ===============================

const deleteProduct = asyncHandler(
async (req, res) => {

    const { id } = req.params;



    const result = await pool.query(

        `
        DELETE FROM products

        WHERE id = $1

        RETURNING *
        `,

        [id]
    );



    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Product not found"
        );
    }



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Product deleted successfully"
        )
    );
});



export {

    createProduct,

    getAllProducts,

    getSingleProduct,

    updateProduct,

    deleteProduct
};