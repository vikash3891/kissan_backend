import "dotenv/config";

const BASE_URL = "https://kissan-backend-e9rm.onrender.com/api";

async function run() {
    try {
        // Register a test user
        console.log("Registering test user...");
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test User",
                email: "test_address_" + Date.now() + "@test.com",
                password: "password123",
                phone: "123456789" + Math.floor(Math.random()*10)
            })
        });
        
        const regData = await regRes.json();
        console.log("Register Response:", regData);
        
        if (!regData.success) {
            console.log("Registration failed, stopping.");
            return;
        }
        
        const token = regData.data.accessToken;
        
        // Fetch addresses
        console.log("\nFetching addresses...");
        const addressRes = await fetch(`${BASE_URL}/address`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const addressData = await addressRes.text();
        console.log("Address Status:", addressRes.status);
        console.log("Address Body:", addressData);
        
        // Fetch orders
        console.log("\nFetching orders...");
        const ordersRes = await fetch(`${BASE_URL}/orders/my`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const ordersData = await ordersRes.text();
        console.log("Orders Status:", ordersRes.status);
        console.log("Orders Body:", ordersData);

    } catch (e) {
        console.error("Error:", e);
    }
}
run();
