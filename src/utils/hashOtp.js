import crypto from "crypto";

const hashOtp = (otp) => {

    return crypto
        .createHash("sha256")
        .update(otp.toString())
        .digest("hex");
};

export default hashOtp;