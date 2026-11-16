# 🛍️ ShopEase – E-Commerce Website

ShopEase is a user-friendly e-commerce website where customers can browse products, explore categories, add items to their shopping cart, place orders, and track their purchases.

The project is built using HTML, CSS, JavaScript, Node.js, Express.js, and MongoDB.

## ✨ Features

### Customer Features
- Browse products without logging in.
- Search for products.
- Explore product categories:
  - Shoes
  - Clothing
  - Bags
  - Electronics
- Create an account and log in.
- Add products to the shopping cart after logging in.
- Update product quantities and remove cart items.
- Checkout and place orders.
- View order history.
- Track order status:
  - Processing
  - Packaging
  - Shipping
  - Delivered
- Write product reviews after delivery.

### Admin Features
- Admin dashboard.
- Add, edit, and delete products.
- Manage product categories.
- Restock products and manage inventory.
- View and manage customer orders.
- Update order and delivery statuses.
- Monitor available product stock.

*Note: Admin features are planned for development and are not yet implemented.*

## 🛠️ Technologies Used

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB Atlas
- Mongoose

**Authentication**
- JSON Web Tokens (JWT)
- bcryptjs
- Cookie Parser

## 📁 Project Structure

```text
ShopEase/
├── middleware/
│   └── auth.js
├── models/
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   └── orders.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/leomelnasalita5-droid/ShopEase.git
```

### 2. Open the Project Folder

```bash
cd ShopEase
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Replace the placeholder values with your own credentials. Never upload your `.env` file to GitHub.

### 5. Start the Server

```bash
npm start
```

If no start script is configured in `package.json`, use:

```bash
node server.js
```

### 6. Open the Website

Open the forwarded port 3000 in your GitHub Codespace browser.

## 🗄️ Database

ShopEase uses MongoDB Atlas to store:
- Customer accounts
- Product information
- Shopping orders
- Order statuses

## 🎯 Project Goal

The goal