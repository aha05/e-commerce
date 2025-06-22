import React, { useState } from 'react';
import axios from 'axios';
import toastr from "toastr";

const RefundModal = ({ order, show, onClose }) => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleChange = (productId, field, value) => {
        setRefunds(prev => {
            const updated = [...prev];
            const index = updated.findIndex(r => r.productId === productId);
            if (index > -1) {
                updated[index][field] = value;
            } else {
                updated.push({ productId, quantity: 1, reason: '', [field]: value });
            }
            return updated;
        });
    };

    const submitRefund = async () => {
        try {
            setLoading(true);
            const response = await axios.post('/api/orders/order/refund', {
                orderId: order._id,
                refunds,
            });
            toastr.success(response?.data?.message || error)
            setRefunds([]);
            onClose();
        } catch (error) {
            setRefunds([]);
            toastr.error(error.response?.data?.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">🧾 Request Refund</h5>
                        <button className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <table className="table table-bordered">
                            <thead>
                                <tr><th>Product</th><th>Ordered Qty</th><th>Refund Qty</th><th>Reason</th></tr>
                            </thead>
                            <tbody>
                                {order.items.map(item => (
                                    <tr key={item.productId._id}>
                                        <td>{item.productId.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.quantity}
                                                defaultValue={1}
                                                className="form-control"
                                                onChange={e =>
                                                    handleChange(item.productId._id, 'quantity', parseInt(e.target.value))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <textarea
                                                type="text"
                                                className="form-control"
                                                placeholder="Refund reason"
                                                onChange={e =>
                                                    handleChange(item.productId._id, 'reason', e.target.value)
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Close</button>
                        <button className="btn btn-danger" onClick={submitRefund} disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Refund Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundModal;
