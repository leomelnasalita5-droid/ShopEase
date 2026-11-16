
// ==========================================
// SHOEASE - MAIN JAVASCRIPT
// ==========================================

const API_URL = "/api";

let products = [];
let currentUser = null;
let cart = [];
let selectedCategory = "All";
let currentOrderFilter = "all";
let currentSearchKeyword = "";

// ==========================================
// STORAGE KEYS
// ==========================================

const CART_STORAGE_KEY = "shopease_cart";
const PAGE_STORAGE_KEY = "shopease_current_page";
const CATEGORY_STORAGE_KEY = "shopease_category";
const SEARCH_STORAGE_KEY = "shopease_search";

// ==========================================
// SHOPEASE TOAST NOTIFICATIONS
// ==========================================

function initializeToastStyles() {
    if (document.getElementById("shopease-toast-styles")) return;

    const style = document.createElement("style");
    style.id = "shopease-toast-styles";

    style.textContent = `
        #shopease-toast-container {
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: min(360px, calc(100vw - 32px));
            pointer-events: none;
        }

        .shopease-toast {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #ffffff;
            color: #202039;
            border: 1px solid #eeeeee;
            border-left: 5px solid #16a34a;
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
            pointer-events: auto;
            animation: shopeaseToastIn 0.3s ease forwards;
            overflow: hidden;
        }

        .shopease-toast.success {
            border-left-color: #16a34a;
        }

        .shopease-toast.error {
            border-left-color: #dc2626;
        }

        .shopease-toast.warning {
            border-left-color: #f59e0b;
        }

        .shopease-toast.info {
            border-left-color: #ff5722;
        }

        .shopease-toast-icon {
            font-size: 23px;
            flex-shrink: 0;
        }

        .shopease-toast-content {
            flex: 1;
            min-width: 0;
        }

        .shopease-toast-title {
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 3px;
        }

        .shopease-toast-message {
            font-size: 13px;
            line-height: 1.4;
            color: #77778b;
            overflow-wrap: anywhere;
        }

        .shopease-toast-close {
            border: none;
            background: transparent;
            color: #77778b;
            font-size: 20px;
            cursor: pointer;
            padding: 3px 6px;
            flex-shrink: 0;
        }

        .shopease-toast-close:hover {
            color: #202039;
        }

        .shopease-toast.removing {
            animation: shopeaseToastOut 0.25s ease forwards;
        }

        @keyframes shopeaseToastIn {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes shopeaseToastOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(30px);
            }
        }

        @media (max-width: 480px) {
            #shopease-toast-container {
                top: 85px;
                right: 12px;
                width: calc(100vw - 24px);
            }
        }
    `;

    document.head.appendChild(style);

    const container = document.createElement("div");
    container.id = "shopease-toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "false");

    document.body.appendChild(container);
}

function showToast(message, type = "success") {
    initializeToastStyles();

    const container = document.getElementById(
        "shopease-toast-container"
    );

    const settings = {
        success: {
            icon: "✓",
            title: "Success"
        },
        error: {
            icon: "✕",
            title: "Something went wrong"
        },
        warning: {
            icon: "⚠",
            title: "Please note"
        },
        info: {
            icon: "ℹ",
            title: "ShopEase"
        }
    };

    const selected = settings[type] || settings.info;

    const toast = document.createElement("div");
    toast.className = `shopease-toast ${type}`;

    const icon = document.createElement("div");
    icon.className = "shopease-toast-icon";
    icon.textContent = selected.icon;

    const content = document.createElement("div");
    content.className = "shopease-toast-content";

    const title = document.createElement("div");
    title.className = "shopease-toast-title";
    title.textContent = selected.title;

    const messageElement = document.createElement("div");
    messageElement.className = "shopease-toast-message";
    messageElement.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.className = "shopease-toast-close";
    closeButton.type = "button";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close notification");

    content.appendChild(title);
    content.appendChild(messageElement);

    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeButton);

    container.appendChild(toast);

    let timeout;

    function removeToast() {
        if (toast.classList.contains("removing")) return;

        clearTimeout(timeout);
        toast.classList.add("removing");

        setTimeout(() => {
            toast.remove();
        }, 250);
    }

    closeButton.addEventListener("click", removeToast);

    timeout = setTimeout(removeToast, 3200);
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function money(value) {
    return Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getProductImage(product) {
    return product.image || "";
}

function getUserCartKey() {
    const identifier = currentUser?._id || currentUser?.id || currentUser?.email;

    return identifier
        ? `shopease_cart_${identifier}`
        : CART_STORAGE_KEY;
}

function getCartQuantity() {
    return cart.reduce((total, item) => {
        return total + Math.max(0, Number(item.quantity) || 0);
    }, 0);
}

// ==========================================
// CART STORAGE
// ==========================================

function loadUserCart() {
    if (!currentUser) {
        cart = [];
        updateCart();
        return;
    }

    const userCartKey = getUserCartKey();
    const savedCart = localStorage.getItem(userCartKey);

    if (savedCart) {
        try {
            const parsed = JSON.parse(savedCart);
            cart = Array.isArray(parsed) ? parsed : [];
        } catch {
            cart = [];
        }
    } else {
        try {
            const parsed = JSON.parse(
                localStorage.getItem(CART_STORAGE_KEY)
            );

            cart = Array.isArray(parsed) ? parsed : [];
        } catch {
            cart = [];
        }

        if (cart.length) {
            localStorage.setItem(
                userCartKey,
                JSON.stringify(cart)
            );
        }
    }

    localStorage.removeItem(CART_STORAGE_KEY);

    updateCart();
}

function saveCart() {
    if (currentUser) {
        localStorage.setItem(
            getUserCartKey(),
            JSON.stringify(cart)
        );
    }

    updateCart();
}

// ==========================================
// ACCOUNT MESSAGES
// ==========================================

function showAccountMessage(message, type = "error") {
    const element = document.getElementById("account-message");

    if (!element) return;

    element.textContent = message;
    element.className = "";

    if (message) {
        element.classList.add(type);
    }
}

function clearAccountMessage() {
    showAccountMessage("");
}

function showCheckoutMessage(message) {
    const element = document.getElementById("checkout-message");

    if (element) {
        element.textContent = message;
    }
}

// ==========================================
// READ SERVER RESPONSES SAFELY
// ==========================================

async function readResponse(response) {
    const responseText = await response.text();

    try {
        return JSON.parse(responseText);
    } catch {
        throw new Error(
            "The server returned an invalid response. Please try again."
        );
    }
}

// ==========================================
// LOGIN AND SIGNUP VIEW SWITCHING
// ==========================================

function showLoginForm() {
    document.getElementById("login-view").hidden = false;
    document.getElementById("register-view").hidden = true;

    clearAccountMessage();

    const email = document.getElementById("register-email").value;

    if (email) {
        document.getElementById("login-email").value = email;
    }
}

function showRegisterForm() {
    document.getElementById("login-view").hidden = true;
    document.getElementById("register-view").hidden = false;

    clearAccountMessage();
}

document.getElementById("show-register-button")
    .addEventListener("click", showRegisterForm);

document.getElementById("show-login-button")
    .addEventListener("click", showLoginForm);

// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(pageName, savePage = true) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageName + "-page");

    if (selectedPage) {
        selectedPage.classList.add("active");

        if (savePage) {
            localStorage.setItem(PAGE_STORAGE_KEY, pageName);
        }
    }

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    if (pageName === "cart") updateCart();
    if (pageName === "orders") loadOrders();
    if (pageName === "account") updateAccountView();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

// ==========================================
// RESTORE LAST PAGE AFTER REFRESH
// ==========================================

function restoreSavedPage() {
    const savedPage = localStorage.getItem(PAGE_STORAGE_KEY);

    const allowedPages = [
        "home",
        "products",
        "categories",
        "cart",
        "orders",
        "account"
    ];

    if (!allowedPages.includes(savedPage)) {
        showPage("home", false);
        return;
    }

    selectedCategory =
        localStorage.getItem(CATEGORY_STORAGE_KEY) || "All";

    currentSearchKeyword =
        localStorage.getItem(SEARCH_STORAGE_KEY) || "";

    if (savedPage === "products") {
        const searchInput = document.getElementById("search");

        searchInput.value = currentSearchKeyword;

        if (currentSearchKeyword) {
            const keyword = currentSearchKeyword.toLowerCase();

            const filtered = products.filter(product =>
                String(product.name || "").toLowerCase().includes(keyword) ||
                String(product.category || "").toLowerCase().includes(keyword) ||
                String(product.description || "").toLowerCase().includes(keyword)
            );

            document.getElementById("search-result-message").textContent =
                `Search results for "${currentSearchKeyword}" (${filtered.length} products)`;

            displayAllProducts(filtered);
        } else if (selectedCategory !== "All") {
            filterProductsWithoutNavigation(selectedCategory);
        } else {
            displayAllProducts(products);

            document.getElementById("search-result-message").textContent =
                "Showing all products";
        }
    }

    showPage(savedPage, false);
}

// ==========================================
// LOGIN REQUIRED MODAL
// ==========================================

function openLoginModal() {
    const modal = document.getElementById("login-required-modal");

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
}

function closeLoginModal() {
    const modal = document.getElementById("login-required-modal");

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
}

document.getElementById("close-login-modal")
    .addEventListener("click", closeLoginModal);

document.getElementById("login-required-modal")
    .addEventListener("click", event => {
        if (event.target === event.currentTarget) {
            closeLoginModal();
        }
    });

document.getElementById("modal-login-button")
    .addEventListener("click", () => {
        closeLoginModal();
        showPage("account");
        showLoginForm();

        document.getElementById("login-email").focus();
    });

document.getElementById("modal-register-button")
    .addEventListener("click", () => {
        closeLoginModal();
        showPage("account");
        showRegisterForm();

        document.getElementById("register-name").focus();
    });

// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);

        if (!response.ok) {
            throw new Error("Unable to load products.");
        }

        const data = await readResponse(response);

        products = Array.isArray(data)
            ? data
            : data.products || [];

        displayHomeProducts();
        displayAllProducts(products);
        displayCategories();
        updateCart();

    } catch (error) {
        console.error(error);

        document.getElementById("featured-products").innerHTML =
            "<p>Products are currently unavailable.</p>";

        document.getElementById("top-selling-products").innerHTML =
            "<p>Products are currently unavailable.</p>";

        document.getElementById("home-product-list").innerHTML =
            "<p>Products are currently unavailable.</p>";

        document.getElementById("product-list").innerHTML =
            "<p>Products are currently unavailable.</p>";
    }
}

// ==========================================
// PRODUCT CATEGORIES
// ==========================================

const categoryIcons = {
    shoes: "👟",
    footwear: "👟",
    clothing: "👕",
    clothes: "👕",
    electronics: "📱",
    bags: "🎒",
    accessories: "⌚",
    beauty: "🧴",
    skincare: "🧴",
    home: "🏠",
    sports: "⚽",
    toys: "🧸",
    food: "🍔",
    books: "📚",
    furniture: "🪑"
};

function getCategoryIcon(category) {
    return categoryIcons[String(category).toLowerCase()] || "🛍️";
}

function getCategories() {
    const categories = [
        ...new Set(
            products
                .map(product => product.category)
                .filter(category => category)
        )
    ];

    return categories.sort();
}

function displayCategories() {
    const categories = getCategories();

    const categoryHTML = categories.length
        ? categories.map(category => `
            <button class="category-card"
                onclick="filterByCategory('${escapeHTML(category)}')">
                <div class="category-icon">
                    ${getCategoryIcon(category)}
                </div>
                <h3>${escapeHTML(category)}</h3>
            </button>
        `).join("")
        : "<p>No product categories available yet.</p>";

    document.getElementById("category-list").innerHTML =
        categoryHTML;

    document.getElementById("all-category-list").innerHTML = `
        <button class="category-card"
            onclick="filterByCategory('All')">
            <div class="category-icon">🛍️</div>
            <h3>All Products</h3>
        </button>
        ${categoryHTML}
    `;
}

function filterProductsWithoutNavigation(category) {
    const filtered = category === "All"
        ? products
        : products.filter(product =>
            String(product.category).toLowerCase() ===
            String(category).toLowerCase()
        );

    document.getElementById("search-result-message").textContent =
        category === "All"
            ? "Showing all products"
            : "Showing products in " + category;

    displayAllProducts(filtered);
}

function filterByCategory(category) {
    selectedCategory = category;
    currentSearchKeyword = "";

    localStorage.setItem(CATEGORY_STORAGE_KEY, category);
    localStorage.removeItem(SEARCH_STORAGE_KEY);

    document.getElementById("search").value = "";

    filterProductsWithoutNavigation(category);

    showPage("products");
}

// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function createProductCard(product) {
    const image = getProductImage(product);
    const stock = Number(product.stock || 0);

    return `
        <div class="product-card">
            ${image ? `
                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product.name)}"
                    onerror="this.style.display='none'"
                >
            ` : `
                <div class="product-image-placeholder">🛍️</div>
            `}

            <h3>${escapeHTML(product.name)}</h3>

            <p>${escapeHTML(product.description || "")}</p>

            <p class="price">₱${money(product.price)}</p>

            <p>Stock: ${stock}</p>

            <button
                onclick="addToCart('${escapeHTML(product._id)}')"
                ${stock <= 0 ? "disabled" : ""}
            >
                🛒 ${stock <= 0 ? "Out of Stock" : "Add to Cart"}
            </button>
        </div>
    `;
}

function displayAllProducts(items) {
    const productList = document.getElementById("product-list");

    if (!items || items.length === 0) {
        productList.innerHTML = "<p>No products found.</p>";
        return;
    }

    productList.innerHTML = items
        .map(createProductCard)
        .join("");
}

function displayHomeProducts() {
    const featured = products.slice(0, 8);

    const topSelling = [...products]
        .sort((a, b) =>
            Number(b.sold || b.soldCount || b.sales || 0) -
            Number(a.sold || a.soldCount || a.sales || 0)
        )
        .slice(0, 8);

    document.getElementById("featured-products").innerHTML =
        featured.length
            ? featured.map(createProductCard).join("")
            : "<p>No featured products available.</p>";

    document.getElementById("top-selling-products").innerHTML =
        topSelling.length
            ? topSelling.map(createProductCard).join("")
            : "<p>No top-selling products available.</p>";

    document.getElementById("home-product-list").innerHTML =
        products.length
            ? products.map(createProductCard).join("")
            : "<p>No products available.</p>";
}

// ==========================================
// SEARCH PRODUCTS
// ==========================================

function searchProducts() {
    const keyword = document.getElementById("search")
        .value.trim();

    currentSearchKeyword = keyword;
    selectedCategory = "All";

    localStorage.setItem(SEARCH_STORAGE_KEY, keyword);
    localStorage.setItem(CATEGORY_STORAGE_KEY, "All");

    const normalizedKeyword = keyword.toLowerCase();

    const filtered = products.filter(product =>
        String(product.name || "").toLowerCase().includes(normalizedKeyword) ||
        String(product.category || "").toLowerCase().includes(normalizedKeyword) ||
        String(product.description || "").toLowerCase().includes(normalizedKeyword)
    );

    document.getElementById("search-result-message").textContent =
        keyword
            ? `Search results for "${keyword}" (${filtered.length} products)`
            : "Showing all products";

    displayAllProducts(filtered);
    showPage("products");
}

document.getElementById("search").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchProducts();
    }
});

// ==========================================
// SHOPPING CART
// ==========================================

function addToCart(productId) {
    if (!currentUser) {
        openLoginModal();
        return;
    }

    const product = products.find(item => item._id === productId);

    if (!product) {
        showToast("Product not found.", "error");
        return;
    }

    const existingItem = cart.find(
        item => item.productId === productId
    );

    const newQuantity = existingItem
        ? Number(existingItem.quantity) + 1
        : 1;

    if (newQuantity > Number(product.stock)) {
        showToast("Not enough stock available.", "warning");
        return;
    }

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            productId: product._id,
            name: product.name,
            price: Number(product.price),
            image: product.image || "",
            quantity: 1
        });
    }

    saveCart();

    showToast(
        `${product.name} has been added to your cart!`,
        "success"
    );
}

// ==========================================
// UPDATE CART DISPLAY AND LIVE COUNTER
// ==========================================

function updateCart() {
    const cartItems = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");

    if (!currentUser) {
        cartItems.innerHTML =
            "<p>Please log in to view your shopping cart.</p>";

        cartCount.textContent = "0";

        document.getElementById("cart-subtotal").textContent = "0.00";

        const shippingFee = document.getElementById("shipping-fee");
        if (shippingFee) shippingFee.textContent = "0.00";

        document.getElementById("cart-total").textContent = "0.00";

        return;
    }

    // Count every item quantity, not just different product types.
    const count = getCartQuantity();

    let subtotal = 0;

    cartCount.textContent = count;

    // Update the cart icon's accessible label if available.
    const cartLink = cartCount.closest("button, a, .nav-item");

    if (cartLink) {
        cartLink.setAttribute(
            "aria-label",
            `Shopping cart with ${count} items`
        );
    }

    if (cart.length === 0) {
        cartItems.innerHTML =
            "<p>Your shopping cart is empty.</p>";
    } else {
        cartItems.innerHTML = cart.map((item, index) => {
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const itemSubtotal = price * quantity;

            subtotal += itemSubtotal;

            return `
                <div class="cart-item">
                    ${item.image ? `
                        <img
                            src="${escapeHTML(item.image)}"
                            alt="${escapeHTML(item.name)}"
                        >
                    ` : ""}

                    <div class="cart-item-info">
                        <h3>${escapeHTML(item.name)}</h3>

                        <p>Price: ₱${money(price)}</p>

                        <p>
                            Subtotal: ₱${money(itemSubtotal)}
                        </p>

                        <div class="quantity-controls">
                            <button onclick="changeQuantity(${index}, -1)">−</button>

                            <strong>${quantity}</strong>

                            <button onclick="changeQuantity(${index}, 1)">+</button>
                        </div>

                        <button
                            class="remove-button"
                            onclick="removeFromCart(${index})"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    document.getElementById("cart-subtotal").textContent =
        money(subtotal);

    const shippingElement = document.getElementById("shipping-fee");
    const shippingFee = shippingElement
        ? Number(shippingElement.textContent.replace(/[^0-9.]/g, "")) || 0
        : 0;

    document.getElementById("cart-total").textContent =
        money(subtotal + shippingFee);
}

// ==========================================
// CHANGE PRODUCT QUANTITY
// ==========================================

function changeQuantity(index, amount) {
    if (!currentUser) {
        openLoginModal();
        return;
    }

    const item = cart[index];

    if (!item) return;

    const product = products.find(
        product => product._id === item.productId
    );

    const maximumStock = product
        ? Number(product.stock)
        : item.quantity;

    const newQuantity = Number(item.quantity) + amount;

    if (newQuantity <= 0) {
        removeFromCart(index);
        return;
    }

    if (newQuantity > maximumStock) {
        showToast("Not enough stock available.", "warning");
        return;
    }

    item.quantity = newQuantity;

    saveCart();
}

// ==========================================
// REMOVE PRODUCT FROM CART
// ==========================================

function removeFromCart(index) {
    if (!currentUser) {
        openLoginModal();
        return;
    }

    const removedItem = cart[index];

    if (!removedItem) return;

    cart.splice(index, 1);

    saveCart();

    showToast(
        `${removedItem.name} was removed from your cart.`,
        "info"
    );
}

// ==========================================
// REGISTER ACCOUNT
// ==========================================

document.getElementById("register-form")
    .addEventListener("submit", async function(event) {
        event.preventDefault();

        const name = document.getElementById("register-name").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value;

        const submitButton = this.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = "Creating Account...";

        clearAccountMessage();

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ name, email, password })
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            this.reset();

            document.getElementById("login-email").value = email;

            showLoginForm();

            showAccountMessage(
                "Your account has been created! Please log in.",
                "success"
            );

        } catch (error) {
            showAccountMessage(error.message, "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create Account";
        }
    });

// ==========================================
// LOGIN
// ==========================================

document.getElementById("login-form")
    .addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        const submitButton = this.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";

        clearAccountMessage();

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    data.message || "Incorrect email or password. Please try again."
                );
            }

            currentUser = data.user;

            loadUserCart();

            this.reset();

            updateAccountView();
            updateCart();

            // Successful login goes straight to the homepage.
            clearAccountMessage();
            showPage("home");

            loadOrders();

        } catch (error) {
            showAccountMessage(
                error.message || "Incorrect email or password. Please try again.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Login";
        }
    });

// ==========================================
// RESTORE LOGIN SESSION
// ==========================================

async function restoreLoginSession() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            credentials: "include"
        });

        if (!response.ok) {
            currentUser = null;
            cart = [];

            updateAccountView();
            updateCart();

            return;
        }

        const data = await readResponse(response);

        currentUser = data.user;

        loadUserCart();

        updateAccountView();
        updateCart();

        loadOrders();

    } catch (error) {
        console.log("No active login session.");

        currentUser = null;
        cart = [];

        updateAccountView();
        updateCart();
    }
}

// ==========================================
// ACCOUNT DISPLAY
// ==========================================

function updateAccountView() {
    const loggedOut = document.getElementById("logged-out-view");
    const loggedIn = document.getElementById("logged-in-view");

    if (currentUser) {
        loggedOut.hidden = true;
        loggedIn.hidden = false;

        document.getElementById("account-name").textContent =
            currentUser.name || "Customer";

        document.getElementById("account-email").textContent =
            currentUser.email || "";
    } else {
        loggedOut.hidden = false;
        loggedIn.hidden = true;
    }
}

// ==========================================
// ACCOUNT SETTINGS DISPLAY
// ==========================================

function showAccountSection(section) {
    if (!currentUser) {
        openLoginModal();
        return;
    }

    const content = document.getElementById(
        "account-settings-content"
    );

    const sections = {
        payment: `
            <div class="settings-form">
                <h2>ShopEase Pay</h2>
                <p>Manage your preferred payment method.</p>
                <p>Card connection will require a secure payment provider.</p>
                <p>For security, ShopEase will not store your card number or CVV.</p>
            </div>
        `,

        paylater: `
            <div class="settings-form">
                <h2>ShopEase PayLater</h2>
                <p>PayLater is an optional installment payment feature.</p>
                <p>This feature will be connected to an eligible payment provider.</p>
                <p>No credit or installment account is activated here.</p>
            </div>
        `,

        password: `
            <div class="settings-form">
                <h2>Change Password</h2>
                <p>The password update form will be connected to the secure backend next.</p>
                <p>Never share your password with anyone.</p>
            </div>
        `,

        profile: `
            <div class="settings-form">
                <h2>Edit Profile</h2>
                <p>Current name: ${escapeHTML(currentUser.name)}</p>
                <p>Current email: ${escapeHTML(currentUser.email)}</p>
                <p>Profile editing will be connected to the backend next.</p>
            </div>
        `,

        addresses: `
            <div class="settings-form">
                <h2>My Addresses</h2>
                <p>Your delivery address can be entered during checkout.</p>
                <p>Saved address management will be added next.</p>
            </div>
        `
    };

    content.innerHTML = sections[section] ||
        "<p>Account section not found.</p>";

    content.scrollIntoView({ behavior: "smooth" });
}

// ==========================================
// LOGOUT
// ==========================================

document.getElementById("logout-button")
    .addEventListener("click", async function() {
        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include"
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.message || "Logout failed.");
            }

            currentUser = null;
            cart = [];

            localStorage.removeItem(CART_STORAGE_KEY);

            document.getElementById("account-settings-content")
                .innerHTML = "";

            document.getElementById("order-list").innerHTML =
                "<p>Please log in to view your orders.</p>";

            updateAccountView();
            updateCart();

            showLoginForm();

            showPage("account");

            showToast(
                "You have logged out successfully.",
                "success"
            );

        } catch (error) {
            showToast(error.message, "error");
        }
    });

// ==========================================
// CHECKOUT
// ==========================================

document.getElementById("checkout-button")
    .addEventListener("click", async function() {
        if (!currentUser) {
            openLoginModal();
            return;
        }

        if (cart.length === 0) {
            showCheckoutMessage("Your shopping cart is empty.");
            return;
        }

        const shippingAddress = document
            .getElementById("shipping-address")
            .value.trim();

        if (!shippingAddress) {
            showCheckoutMessage("Please enter your delivery address.");
            return;
        }

        if (!confirm("Place your order using Cash on Delivery?")) {
            return;
        }

        const items = cart.map(item => ({
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
                    items,
                    shippingAddress
                })
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.message || "Checkout failed.");
            }

            cart = [];
            saveCart();

            document.getElementById("shipping-address").value = "";

            showCheckoutMessage(
                "Your order has been placed successfully!"
            );

            showToast(
                "Your order has been placed successfully!",
                "success"
            );

            await loadProducts();
            await loadOrders();

            showPage("orders");

        } catch (error) {
            showCheckoutMessage(error.message);
            showToast(error.message, "error");
        } finally {
            this.disabled = false;
        }
    });

// ==========================================
// MY ORDERS
// ==========================================

async function loadOrders() {
    const orderList = document.getElementById("order-list");

    if (!currentUser) {
        orderList.innerHTML =
            "<p>Please log in to view your orders.</p>";

        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders/my-orders`, {
            credentials: "include"
        });

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(data.message || "Unable to load orders.");
        }

        const orders = data.orders || [];

        if (orders.length === 0) {
            orderList.innerHTML =
                "<p>You have no orders yet.</p>";

            return;
        }

        displayOrders(orders);

    } catch (error) {
        orderList.innerHTML =
            `<p>${escapeHTML(error.message)}</p>`;
    }
}

function displayOrders(orders) {
    const orderList = document.getElementById("order-list");

    const filteredOrders = currentOrderFilter === "all"
        ? orders
        : orders.filter(order => {
            return order.status === currentOrderFilter;
        });

    if (filteredOrders.length === 0) {
        orderList.innerHTML =
            "<p>No orders in this category.</p>";

        return;
    }

    orderList.innerHTML = filteredOrders.map(order => `
        <div class="order-card">
            <h3>Order #${escapeHTML(order._id)}</h3>

            <p>
                Order Date:
                ${new Date(order.createdAt).toLocaleDateString()}
            </p>

            <p>
                Total:
                ₱${money(order.totalAmount)}
            </p>

            <p>
                Payment:
                ${escapeHTML(order.paymentMethod || "Cash on Delivery")}
            </p>

            <p>
                Status:
                <span class="order-status">
                    ${escapeHTML(order.status)}
                </span>
            </p>

            <h4>Purchased Products</h4>

            ${(order.items || []).map(item => `
                <div class="order-item">
                    <div>
                        <strong>${escapeHTML(item.name)}</strong>
                        <p>Quantity: ${Number(item.quantity)}</p>
                        <p>Price: ₱${money(item.price)}</p>
                    </div>
                </div>
            `).join("")}

            <p>
                Delivery Address:
                ${escapeHTML(order.shippingAddress)}
            </p>

            ${order.status === "Delivered" ? `
                <p>Delivered! You can now review your purchase.</p>

                <button class="secondary-button"
                    onclick="showToast('Product reviews will be enabled after the review backend is added.', 'info')">
                    Write a Review
                </button>
            ` : ""}
        </div>
    `).join("");
}

document.querySelectorAll(".order-tab").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".order-tab").forEach(tab => {
            tab.classList.remove("active");
        });

        button.classList.add("active");

        currentOrderFilter = button.dataset.status;

        loadOrders();
    });
});

// ==========================================
// INITIALIZE SHOEASE
// ==========================================

async function initializeShopEase() {
    initializeToastStyles();

    updateAccountView();
    updateCart();

    await loadProducts();

    await restoreLoginSession();

    restoreSavedPage();

    console.log("ShopEase loaded successfully!");
}

initializeShopEase();
