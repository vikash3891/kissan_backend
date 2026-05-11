import jwt from "jsonwebtoken";


// ACCESS TOKEN
const generateAccessToken = (user) => {

    return jwt.sign(

        {
            id: user.id,
            phone: user.phone
        },

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn:
                process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};



// REFRESH TOKEN
const generateRefreshToken = (user) => {

    return jwt.sign(

        {
            id: user.id
        },

        process.env.REFRESH_TOKEN_SECRET,

        {
            expiresIn:
                process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

export {
    generateAccessToken,
    generateRefreshToken
};