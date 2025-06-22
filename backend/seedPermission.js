// seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Permission = require('./models/Permission');

const permissions = [

    // Dashboard
    { name: 'view_dashboard', description: 'view dashboard' },
    { name: 'view_logs', description: 'view logs' },
    { name: 'clear_logs', description: 'clear logs' },

    // 👤 User Management
    { name: 'view_users', description: 'view users' },
    { name: 'create_user', description: 'create user' },
    { name: 'edit_user', description: 'edit user' },
    { name: 'delete_user', description: 'delete user' },
    { name: 'block_user', description: 'block user' },

    // 📦 Product Management
    { name: 'view_products', description: 'view products' },
    { name: 'create_product', description: 'create product' },
    { name: 'edit_product', description: 'edit product' },
    { name: 'delete_product', description: 'delete product' },
    { name: 'delete_selected_product', description: 'delete selected product' },
    { name: 'product_pdf_export', description: 'export product in pdf ' },
    { name: 'product_excel_export', description: 'export product in excel' },
    { name: 'product_excel_import', description: 'import product in excel' },

    // 🏷️ Category Management
    { name: 'view_categories', description: 'view categories' },
    { name: 'create_category', description: 'create category' },
    { name: 'edit_category', description: 'edit category' },
    { name: 'delete_category', description: 'delete category' },

    // 📋 Order Management
    { name: 'view_order_details', description: 'view order details' },
    { name: 'manage_orders', description: 'manage orders' },
    { name: 'update_order_status', description: 'update order status' },
    { name: 'delete_selected_order', description: 'delete selected product' },
    { name: 'order_pdf_export', description: 'export product in pdf ' },
    { name: 'order_excel_export', description: 'export product in excel' },

    // 💬 Customers
    { name: 'view_customers', description: 'view customers' },
    { name: 'manage_customers', description: 'manage customers' },
    { name: 'delete_customers', description: 'delete review' },

    // ⚙️ Role & Permission Management
    { name: 'view_roles', description: 'view roles' },
    { name: 'create_role', description: 'create role' },
    { name: 'edit_role', description: 'edit role' },
    { name: 'delete_role', description: 'delete role' },
    { name: 'assign_roles', description: 'assign permissions' },

    { name: 'assign_permissions', description: 'assign permissions' },
    { name: 'view_permissions', description: 'view permissions' },

    // 📈 Reporting & Analytics
    { name: 'view_reports', description: 'view reports' },
    { name: 'view_sales_reports', description: 'view sales reports' },
    { name: 'view_customer_reports', description: 'view customer reports' },

    // 💵 Promotion & Discounts
    { name: 'view_promotion', description: 'view promotion' },
    { name: 'create_promotion', description: 'create promotion' },
    { name: 'edit_promotion', description: 'edit promotion' },
    { name: 'delete_promotion', description: 'delete promotion' },

    // 🛒 Cart/Wishlist
    { name: 'view_wishlist', description: 'view wishlist' },
    { name: 'edit_wishlist', description: 'edit wishlist' },

    // ⚠️ System / Admin-only
    { name: 'access_admin_panel', description: 'access admin panel' },
    { name: 'manage_settings', description: 'manage settings' },
    { name: 'view_activity_log', description: 'view activity log' },
];



dotenv.config();
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

const seedData = async () => {
    try {
        for (const perm of permissions) {
            const exists = await Permission.findOne({ name: perm.name });
            if (!exists) {
                await Permission.create(perm);
                console.log(`Permission added: ${perm.name}`);
            } else {
                console.log(`Permission already exists: ${perm.name}`);
            }
        }

        console.log('Permissions seeding completed!');
        process.exit();
    } catch (err) {
        console.error('Error seeding permissions:', err);
        process.exit(1);
    }
};


seedData();
