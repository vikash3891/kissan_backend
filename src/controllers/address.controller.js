
import pool from "../db/index.js";
import { ApiError }
from "../utils/ApiError.js";

import { ApiResponse }
from "../utils/ApiResponse.js";

import { asyncHandler }
from "../utils/asyncHandler.js";


const addAddress=asyncHandler(async(req,res)=>{

    const userId = req.user.id;

    const {

        full_name,
        phone,
        pincode,
        state,
        city,
        house_no,
        area,
        landmark,
        address_type

    } = req.body;

    // ==============================
    // VALIDATION
    // ==============================

    if (

        !full_name ||
        !phone ||
        !pincode ||
        !state ||
        !city ||
        !house_no ||
        !area

    ) {

        throw new ApiError(
            400,
            "All required fields are mandatory"
        );
    }

    const existing=await pool.query(
        
        `
        SELECT * FROM addresses WHERE 
        user_id=$1

        `,
        [userId]
    )

    let isDefault = false;

    if (existing.rows.length === 0) {

        isDefault = true;
    }

 // ==============================
 // INSERT ADDRESS
// ==============================

   const result =await pool.query(
    `INSERT INTO addresses (user_id,
     full_name,
      phone,
      pincode, 
      state, 
      city,
      house_no, area, landmark, address_type, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING * `
   ,
           [

            userId,
            full_name,
            phone,
            pincode,
            state,
            city,
            house_no,
            area,
            landmark,
            address_type || "home",
            isDefault
        ]
    )

    return res.status(201).json(
        new ApiResponse(
            201,
            result.rows[0],
            "Address added successfully",
        )
    
        )
    


})

const getAddresses=asyncHandler(async(req,res)=>{


    const userId = req.user.id;
    const result=await pool.query(
        `SELECT * FROM addresses WHERE user_id=$1
        ORDER BY is_default DESC,
        created_at DESC`,
        [userId]
    )

    return res.status(200).json(
        new ApiResponse(
            200,
            "Addresses retrieved successfully",
            result.rows
        )
    )



})  


const updateAddress=asyncHandler(async(req,res)=>{

     const userId = req.user.id;

     const { id } = req.params;


     const {

        full_name,
        phone,
        pincode,
        state,
        city,
        house_no,
        area,
        landmark,
        address_type

    } = req.body;


     const result=await pool.query(
        `UPDATE addresses SET
        full_name=$1,
        phone=$2,
        pincode=$3,
        state=$4,
        city=$5,
        house_no=$6,
        area=$7,
        landmark=$8,
        address_type=$9
        WHERE id=$10 AND user_id=$11
        RETURNING *`
     ,[
            full_name,
            phone,
            pincode,
            state,
            city,
            house_no,
            area,
            landmark,
            address_type || "home",
            id,
            userId
        ])

        if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Address not found"
        );
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            "Address updated successfully",
            result.rows[0]
        )
    )
    
    



})


// =====================================
// DELETE ADDRESS
// =====================================

const deleteAddress = asyncHandler(
async (req, res) => {

    const userId = req.user.id;

    const { id } = req.params;



    const result =
    await pool.query(

        `
        DELETE FROM addresses

        WHERE id = $1
        AND user_id = $2

        RETURNING *
        `,

        [

            id,
            userId
        ]
    );



    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Address not found"
        );
    }



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Address deleted successfully"
        )
    );
});




// =====================================
// SET DEFAULT ADDRESS
// =====================================

const setDefaultAddress = asyncHandler(
async (req, res) => {

    const userId = req.user.id;

    const { id } = req.params;



    // REMOVE OLD DEFAULT
    await pool.query(

        `
        UPDATE addresses

        SET is_default = false

        WHERE user_id = $1
        `,

        [userId]
    );



    // SET NEW DEFAULT
    const result =
    await pool.query(

        `
        UPDATE addresses

        SET is_default = true

        WHERE id = $1
        AND user_id = $2

        RETURNING *
        `,

        [

            id,
            userId
        ]
    );



    if (result.rows.length === 0) {

        throw new ApiError(
            404,
            "Address not found"
        );
    }



    return res.status(200).json(

        new ApiResponse(

            200,

            result.rows[0],

            "Default address updated"
        )
    );
});



export {

    addAddress,

    getAddresses,

    updateAddress,

    deleteAddress,

    setDefaultAddress
};
