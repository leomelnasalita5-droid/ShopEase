
// ==========================================
// SHOEASE - MAIN JAVASCRIPT
// ==========================================

const API_URL = "/api";

// Shopping cart
let cart = JSON.parse(localStorage.getItem("shopease_cart")) || [];
let products = [];
let currentUser = null;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Save cart
function saveCart() {
    localStorage.setItem("shopease_cart", JSON.stringify(cart));
    updateCart();
}

// Safely display text
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// Display account message
function showMessage(message) {
    document.getElementById("account-message").textContent = message;
}

// Display checkout message
function showCheckoutMessage(message) {
    document.getElementById("checkout-message").textContent = message;
}

// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {
    const productList = document.getElementById("product-list");

    try {
        const response = await fetch(`${API_URL}/products`);

        if (!response.ok) {
            throw new Error("Unable to load products.");
        }

        const data = await response.json();

        products = Array.isArray(data)
            ? data
            : data.products || [];

        displayProducts(products);

    } catch (error) {
        productList.textContent =
            "Products are currently unavailable. Please try again later.";

        console.error(error);
    }
}

// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(items) {
    const productList = document.getElementById("product-list");

    if (items.length === 0) {
        productList.innerHTML = "<p>No products found.</p>";
        return;
    }

    productList.innerHTML = items.map(product => `
        <div class="product-card">

            ${product.image ? `
                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    onerror="this.style.display='none'"
                >
            ` : ""}

            <h3>${escapeHTML(product.name)}</h3>

            <p>${escapeHTML(product.description)}</p>

            <p class="price">
                ₱${Number(product.price).toFixed(2)}
            </p>

            <p>Stock: ${Number(product.stock || 0)}</p>

            <button
                onclick="addToCart('${escapeHTML(product._id)}')"
                ${Number(product.stock) <= 0 ? "disabled" : ""}
            >
                Add to Cart
            </button>

        </div>
    `).join("");
}

// ==========================================
// SEARCH PRODUCTS
// ==========================================

document.getElementById("search").addEventListener("input", function() {
    const keyword = this.value.toLowerCase();

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(keyword) ||
        (product.category || "").toLowerCase().includes(keyword)
    );

    displayProducts(filteredProducts);
});

// ==========================================
// ADD TO CART
// ==========================================

function addToCart(productId) {
    const product = products.find(p => p._id === productId);

    if (!product) {
        alert("Product not found.");
        return;
    }

    const existingItem = cart.find(
        item => item.productId === productId
    );

    const quantity = existingItem
        ? existingItem.quantity + 1
        : 1;

    if (quantity > Number(product.stock)) {
        alert("Not enough stock available.");
        return;
    }

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            productId: product._id,
            name: product.name,
            price: Number(product.price),
            quantity: 1
        });
    }

    saveCart();

    alert("Product added to cart!");
}

// ==========================================
// UPDATE SHOPPING CART
// ==========================================

function updateCart() {
    const cartItems = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");

    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
    } else {
        cartItems.innerHTML = cart.map((item, index) => {
            const subtotal = item.price * item.quantity;

            total += subtotal;
            count += item.quantity;

            return `
                <div class="cart-item">
                    <div>
                        <h4>${escapeHTML(item.name)}</h4>

                        <p>
                            ₱${Number(item.price).toFixed(2)}
                            × ${item.quantity}
                        </p>

                        <p>
                            Subtotal:
                            ₱${subtotal.toFixed(2)}
                        </p>
                    </div>

                    <button onclick="removeFromCart(${index})">
                        Remove
                    </button>
                </div>
            `;
        }).join("");
    }

    cartCount.textContent = count;
    cartTotal.textContent = total.toFixed(2);
}

// ==========================================
// REMOVE FROM CART
// ==========================================

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
}

// ==========================================
// CUSTOMER REGISTRATION
// ==========================================

document.getElementById("register-form")
.addEventListener("submit", async function(event) {

    event.preventDefault();

    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed.");
        }

        showMessage("Account created successfully! You can now log in.");

        this.reset();

    } catch (error) {
        showMessage(error.message);
    }
});

// ==========================================
// CUSTOMER LOGIN
// ==========================================

document.getElementById("login-form")
.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed.");
        }

        currentUser = data.user;

        updateAccountInfo();

        showMessage("Welcome, " + currentUser.name + "!");

        this.reset();

        loadOrders();

    } catch (error) {
        showMessage(error.message);
    }
});

// ==========================================
// DISPLAY ACCOUNT INFORMATION
// ==========================================

function updateAccountInfo() {
    const accountInfo = document.getElementById("account-info");

    if (!currentUser) {
        accountInfo.textContent = "You are not logged in.";
        return;
    }

    accountInfo.innerHTML = `
        <p>Welcome, ${escapeHTML(currentUser.name)}!</p>
        <p>Email: ${escapeHTML(currentUser.email)}</p>
        <p>Account Type: ${escapeHTML(currentUser.role)}</p>
    `;
}

// ==========================================
// CUSTOMER LOGOUT
// ==========================================

document.getElementById("logout-button")
.addEventListener("click", async function() {

    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Logout failed.");
        }

        currentUser = null;

        updateAccountInfo();

        document.getElementById("order-list").textContent =
            "Log in to view your orders.";

        showMessage("You have logged out.");

    } catch (error) {
        showMessage(error.message);
    }
});

// ==========================================
// CUSTOMER ORDER HISTORY
// ==========================================

async function loadOrders() {
    const orderList = document.getElementById("order-list");

    try {
        const response = await fetch(
            `${API_URL}/orders/my-orders`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load orders.");
        }

        const orders = data.orders || [];

        if (orders.length === 0) {
            orderList.innerHTML = "<p>You have no orders yet.</p>";
            return;
        }

        orderList.innerHTML = orders.map(order => `
            <div class="order-card">

                <h3>Order #${escapeHTML(order._id)}</h3>

                <p>
                    Date:
                    ${new Date(order.createdAt).toLocaleDateString()}
                </p>

                <p>
                    Total:
                    ₱${Number(order.totalAmount).toFixed(2)}
                </p>

                <p>
                    Payment:
                    ${escapeHTML(order.paymentMethod)}
                </p>

                <p>
                    Status:
                    <span class="order-status">
                        ${escapeHTML(order.status)}
                    </span>
                </p>

                <h4>Ordered Products</h4>

                ${order.items.map(item => `
                    <p>
                        ${escapeHTML(item.name)}
                        × ${Number(item.quantity)}
                    </p>
                `).join("")}

            </div>
        `).join("");

    } catch (error) {
        orderList.textContent = error.message;
    }
}

// ==========================================
// CHECKOUT
// ==========================================

document.getElementById("checkout-button")
.addEventListener("click", async function() {

    if (cart.length === 0) {
        showCheckoutMessage("Your shopping cart is empty.");
        return;
    }

    const shippingAddress = document
        .getElementById("shipping-address")
        .value.trim();

    if (!shippingAddress) {
        showCheckoutMessage("Please enter your shipping address.");
        return;
    }

    const confirmed = confirm(
        "Do you want to place your order using Cash on Delivery?"
    );

    if (!confirmed) return;

    const orderItems = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
    }));

    this.disabled = true;

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                items: orderItems,
                shippingAddress
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Checkout failed.");
        }

        cart = [];
        saveCart();

        document.getElementById("shipping-address").value = "";

        showCheckoutMessage(
            "Your order has been placed successfully!"
        );

        await loadProducts();
        await loadOrders();

    } catch (error) {
        showCheckoutMessage(error.message);
    } finally {
        this.disabled = false;
    }
});

// ==========================================
// INITIALIZE WEBSITE
// ==========================================

updateCart();
updateAccountInfo();
loadProducts();

console.log("ShopEase JavaScript loaded successfully!");