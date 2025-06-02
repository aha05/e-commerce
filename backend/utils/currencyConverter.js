// utils/currencyConverter.js
const rates = {
    USD: 1,
    EUR: 0.93,
    GBP: 0.8,
    ETB: 55,
};

function convertPrice(price, currency = 'USD') {
    return (price * (rates[currency] || 1)).toFixed(2);
}

module.exports = { convertPrice };
