module.exports.createRoles = (permissionDocs) => {
    const get = (name) => permissionDocs.find(p => p.name === name)?._id;

    return [
        {
            name: 'admin',
            permissions: permissionDocs.map(p => p._id)
        },
        {
            name: 'manager',
            permissions: [
                get('view_users'),
                get('edit_user'),
                get('manage_orders'),
                get('view_products'),
                get('edit_product'),
                get('view_sales_reports'),
            ].filter(Boolean)
        },
        {
            name: 'sales',
            permissions: [
                get('view_products'),
                get('view_customers'),
                get('view_sales_reports'),
            ].filter(Boolean)
        },
        {
            name: 'customer',
            permissions: []
        }
    ];
};
