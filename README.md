# 🛒 MERN E-Commerce Web App

A full-featured e-commerce application built with the MERN stack (MongoDB, Express, React, Node.js), supporting customer and admin functionalities, product variants, secure checkout, refunds, and a flexible promotion system.

## 🚀 Features

### ✅ Customer
- JWT-based authentication & session guest carts
- Product browsing with variant selection
- Add to cart, edit quantity, and remove
- Secure checkout with multiple payment methods:
  - Credit Card, PayPal, Bank Transfer
- Promotion support: `code`, `automatic`, `hybrid`
- Order confirmation modal
- Order history & tracking
- Refund request option
- Default payment method handling
- Multi-currency pricing (USD, EUR, etc.)

### 🛠️ Admin
- Product management (add/edit/delete with soft delete, images, variants)
- Import/export products in **Excel and PDF**
- View & process refund requests
- Role-based access control (admin, manager, sales)
- Promotion management (date-based, type-based
- Multi-currency management
- Payment method control per user
- Logging with Winston
- Sales report dashboard with:
  - Export options: **CSV, Excel, PDF, Print**
  - Filters by date, status, category, user, etc.
- Background **bulk notifications**:
  - In-App
  - Email
  - SMS
  - Sent asynchronously with user preferences

## 🧱 Tech Stack
- **Frontend**: React, Bootstrap, Axios, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + session-based guest cart
- **Uploads**: Multer for product images
- **Logging**: Winston logger
- **Exports**: exceljs, pdfkit, json2csv 

