import express from "express";

import {

    addAddress,

    getAddresses,

    updateAddress,

    deleteAddress,

    setDefaultAddress

}
from "../controllers/address.controller.js";

import { verifyJWT }
from "../middlewares/auth.middleware.js";

const router = express.Router();



// =====================================
// ADD ADDRESS
// =====================================

router.post(
    "/",
    verifyJWT,
    addAddress
);



// =====================================
// GET ADDRESSES
// =====================================

router.get(
    "/",
    verifyJWT,
    getAddresses
);



// =====================================
// UPDATE ADDRESS
// =====================================

router.put(
    "/:id",
    verifyJWT,
    updateAddress
);



// =====================================
// DELETE ADDRESS
// =====================================

router.delete(
    "/:id",
    verifyJWT,
    deleteAddress
);



// =====================================
// SET DEFAULT ADDRESS
// =====================================

router.patch(
    "/default/:id",
    verifyJWT,
    setDefaultAddress
);



export default router;