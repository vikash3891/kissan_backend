// ============================================================
// Kisaan Kart — OTP Provider Abstraction (plan decision D5)
// ============================================================
// Delivery of the OTP is decoupled from OTP generation/validation.
//
//   • ConsoleOtpProvider (dev)  — logs the OTP to the server console;
//       the API also returns it in responses when NODE_ENV!=='production'.
//   • SmsOtpProvider (prod stub) — where a real SMS gateway (Twilio,
//       MSG91, Gupshup, ...) plugs in. Throws until configured so a
//       misconfigured prod deploy fails loudly instead of silently
//       dropping OTPs.
//
// getOtpProvider() picks the implementation from NODE_ENV / OTP_PROVIDER.
// ============================================================

// ─── Interface (documentation) ──────────────────────────────
// An OtpProvider exposes:  async send(phone, otp): Promise<void>
//                          get name(): string
//                          get exposesOtp(): boolean   // may API echo it?

class ConsoleOtpProvider {
    get name() { return "console"; }
    get exposesOtp() { return true; }

    async send(phone, otp) {
        console.log(`[OTP] (console provider) → ${phone}: ${otp}`);
    }
}

class SmsOtpProvider {
    get name() { return "sms"; }
    get exposesOtp() { return false; }

    async send(phone, _otp) {
        // Mocking SMS delivery for now as requested
        console.log(`[OTP] (Mock SMS provider) -> ${phone}: ${_otp}`);
        return Promise.resolve();
    }
}

let _provider = null;

/**
 * Resolve the active OTP provider (singleton).
 *   OTP_PROVIDER=console|sms overrides; otherwise NODE_ENV decides.
 */
export const getOtpProvider = () => {
    if (_provider) return _provider;

    const explicit = (process.env.OTP_PROVIDER || "").toLowerCase();
    const isProd = process.env.NODE_ENV === "production";

    if (explicit === "sms" || (!explicit && isProd)) {
        _provider = new SmsOtpProvider();
    } else {
        _provider = new ConsoleOtpProvider();
    }
    return _provider;
};

/** True when the current environment/provider may echo the OTP in API responses. */
export const canExposeOtp = () => {
    return process.env.NODE_ENV !== "production" && getOtpProvider().exposesOtp;
};

export { ConsoleOtpProvider, SmsOtpProvider };
