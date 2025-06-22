import React, { useState, useEffect } from 'react';
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import * as bootstrap from "bootstrap";
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/tooltip.css'
import DatePicker from "../../../components/UI/DatePicker";
import toastr from "toastr";
import { hasPermission } from '../../../utils/authUtils';
import { useAuth } from '../../../contexts/AuthContext';


const SalesReport = () => {
    const [activeTab, setActiveTab] = useState('transactions');
    const [data, setData] = useState({});
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'All Status',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/admin/reports/sales');
                setData(res.data);
                // set each part of your state here
            } catch (error) {
                alert(error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach((tooltipTriggerEl) => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }, [activeTab]);

    const filter = async () => {
        try {
            const params = {
                startDate: filters.startDate,
                endDate: filters.endDate,
                status: filters.status !== "All Status" ? filters.status : undefined,
            };
            const res = await axios.get('/api/admin/reports/sales/filter', { params });
            setData(res.data);
        } catch (error) {
            alert(error);
        }
    };

    const [loadingExcelExport, setLoadingExcelExport] = useState(false);
    const [loadingCSVExport, setLoadingCSVExport] = useState(false);
    const [loadingPDFExport, setLoadingPDFExport] = useState(false);
    const [loadingPrint, setLoadingPrint] = useState(false);

    const exportFile = async (type, format) => {
        if (format === "csv") {
            setLoadingCSVExport(true);
        } else if (format === "excel") {
            setLoadingExcelExport(true);
        } else {
            setLoadingPDFExport(true);
        }

        try {
            const response = await axios.post(
                `/api/admin/reports/${type}/export/${format}`,
                {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    status: filters.status !== "All Status" ? filters.status : undefined,
                },
                {
                    responseType: "blob", // Needed to handle file downloads
                }
            );

            const fileExtension = format === "excel" ? "xlsx" : format === "csv" ? "csv" : "pdf";
            const fileName = `${type}.${fileExtension}`;

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toastr.success(`Exported ${fileName} successfully`);
        } catch (error) {
            toastr.error(error.message || "Failed to export file.");
        } finally {
            setLoadingCSVExport(false);
            setLoadingExcelExport(false);
            setLoadingPDFExport(false);
        }
    };

    const handlePrint = () => {
        setLoadingPrint(true)
        try {
            const printableContent = document.getElementById("printable-section")?.innerHTML;
            if (!printableContent) return toastr.error("Nothing to print.");

            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(`
    <html>
      <head>
        <title>Sales Report - ${activeTab}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
        <style>
          body { font-family: sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border: 1px solid #ccc; }
          h4 { margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <h4>Sales Report - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h4>
        ${printableContent}
      </body>
    </html>
  `);
            printWindow.document.close();

            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();

                // Optional: close after print
                printWindow.onafterprint = () => {
                    printWindow.close();
                };
            };
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingPrint(false);
        }
    };


    return (
        <div className="container my-4">
            <p className="fs-5 text-muted mb-3">
                <span>Sales Report</span>
            </p>
            <div className="row mb-4">
                <div className="col">
                    <div className="card bg-light border-0 shadow-sm rounded">
                        <div className="card-body d-flex row">
                            <div className="mb-1 col-2">
                                <i className={`bi bi-currency-dollar fs-3 text-muted`}></i>
                            </div>
                            <div className="col-8 ms-auto text-end">
                                <span className="fs-4 fw-semibold text-end">${data?.totalSales}</span>
                                <h6 className="fs-6 fw-light text-muted" style={{ color: '#bbb' }}>Total Sales</h6>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card bg-light border-0 shadow-sm rounded">
                        <div className="card-body d-flex row">
                            <div className="mb-1 col-2">
                                <i className={`bi bi-cash-stack fs-3 text-muted`}></i>
                            </div>
                            <div className="col-8 ms-auto text-end">
                                <span className="fs-4 fw-semibold text-end">${data?.netSales}</span>
                                <h6 className="fw-light text-muted" style={{ color: '#bbb' }}>Net Sales</h6>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card bg-light border-0 shadow-sm rounded">
                        <div className="card-body d-flex row">
                            <div className="mb-1 col-2">
                                <i className={`bi bi-bar-chart fs-3 text-muted`}></i>
                            </div>
                            <div className="col-8 ms-auto text-end">
                                <span className="fs-4 fw-semibold text-end">${data?.avgOrderValue}</span>
                                <h6 className="fs-6 fw-light text-muted" style={{ color: '#bbb' }}>Avg Order</h6>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card bg-light border-0 shadow-sm rounded">
                        <div className="card-body d-flex row">
                            <div className="mb-1 col-2">
                                <i className={`bi bi-graph-up-arrow fs-3 text-muted`}></i>
                            </div>
                            <div className="col-8 ms-auto text-end">
                                <span className="fs-4 fw-semibold text-end">{data?.salesGrowth >= 0 ? '+' : ''}{data?.salesGrowth}%</span>
                                <h6 className="fs-6 fw-light text-muted" style={{ color: '#bbb' }}>Growth</h6>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col">
                    <div className="card bg-light border-0 shadow-sm rounded">
                        <div className="card-body d-flex row">
                            <div className="mb-1 col-2">
                                <i className={`bi bi-arrow-counterclockwise fs-3 text-muted`}></i>
                            </div>
                            <div className="col-8 ms-auto text-end">
                                <span className="fs-4 fw-semibold text-end">${data?.totalRefunds}</span>
                                <h6 className="fw-light text-muted" style={{ color: '#bbb' }}>Refunds</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔹 Navigation Tabs */}
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'transactions' ? 'active fw-bold' : 'text-muted'}`} onClick={() => setActiveTab('transactions')}>Transactions</button>
                </li>

                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'products' ? 'active fw-bold' : 'text-muted'}`} onClick={() => setActiveTab('products')}>Top Products</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'category' ? 'active fw-bold' : 'text-muted'}`} onClick={() => setActiveTab('category')}>By Category</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'country' ? 'active fw-bold' : 'text-muted'}`} onClick={() => setActiveTab('country')}>By Country</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'payment' ? 'active fw-bold' : 'text-muted'}`} onClick={() => setActiveTab('payment')}>By Payment</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'segment' ? 'active fw-bold' : 'text-muted'}`} onClick={() => setActiveTab('segment')}>Customer Segment</button>
                </li>

            </ul>

            {/* 🔹 1. Filters, Export and Print*/}
            <div className="row d-flex flex-wrap gap-2 mb-4 mx-1">
                <div className="col-2 flex px-0">
                    <DatePicker onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))} />
                </div>
                <div className="col-2 flex px-0">
                    <DatePicker onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))} />
                </div>
                <div className="col-2 flex px-0">
                    <select
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option>All Status</option>
                        <option>Pending</option>
                        <option>Shipped</option>
                        <option>Cancelled</option>
                        <option>Delivered</option>
                        <option>Refunded</option>
                    </select>
                </div>
                <div className="col-2 flex px-2">
                    <button className='btn btn-primary'
                        onClick={() => filter()}
                    >filter</button>
                </div>
                <div className="ms-2 col d-flex justify-content-end gap-2">
                    <button className="btn btn-success d-flex align-items-center gap-2"
                        onClick={() => exportFile(activeTab, "csv")}
                        disabled={loadingCSVExport}
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-html="true"
                        title={`<strong>Export to CSV</strong><br/>Includes all ${activeTab} data`}
                        data-bs-custom-class="custom-tooltip">
                        <span><i className="fas fa-file-csv"></i></span>
                        {loadingCSVExport && (
                            <span className="spinner-border spinner-border-sm text-light" role="status" />
                        )}
                    </button>
                    <button className="btn btn-success d-flex align-items-center gap-2"
                        onClick={() => exportFile(activeTab, "excel")}
                        disabled={loadingExcelExport}
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-html="true"
                        title={`<strong>Export to Excel</strong><br/>Includes all ${activeTab} data`}
                        data-bs-custom-class="custom-tooltip">
                        <span><i className="fas fa-file-excel"></i></span>
                        {loadingExcelExport && (
                            <span className="spinner-border spinner-border-sm text-light" role="status" />
                        )}
                    </button>
                    <button className="btn btn-danger d-flex align-items-center gap-2"
                        onClick={() => exportFile(activeTab, "pdf")}
                        disabled={loadingPDFExport}
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-html="true"
                        title="Export to PDF File"
                        data-bs-custom-class="custom-tooltip">
                        <span><i className="fas fa-file-pdf"></i></span>
                        {loadingPDFExport && (
                            <span className="spinner-border spinner-border-sm text-light" role="status" />
                        )}
                    </button>
                    <button className="btn btn-secondary d-flex align-items-center gap-2"
                        disabled={loadingPrint}
                        onClick={handlePrint}
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-html="true"
                        title="Print"
                        data-bs-custom-class="custom-tooltip">
                        <span><i className="fas fa-print"></i></span>
                        {loadingPrint && (
                            <span className="spinner-border spinner-border-sm text-light" role="status" />
                        )}
                    </button>
                </div >
            </div >
            {/* 🔹 Tab Content */}
            <div id="printable-section">
                {activeTab === 'transactions' && (
                    <>
                        <p className="fs-5">Transactions</p>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className='text-muted'>Transaction ID</th>
                                    <th className='text-muted'>Date</th>
                                    <th className='text-muted'>Customer</th>
                                    <th className='text-muted'>Total</th>
                                    <th className='text-muted'>Status</th>
                                    <th className='text-muted'>Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.transactions?.map(tx => (
                                    <tr key={tx.id}>
                                        <td>{tx.id}</td>
                                        <td>{tx.date}</td>
                                        <td>{tx.customer}</td>
                                        <td>${tx?.total?.toFixed(2)}</td>
                                        <td>{tx.status}</td>
                                        <td>{tx.payment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )
                }
                {activeTab === 'products' && (
                    <>
                        <p className="fs-5">Top-Selling Products</p>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className='text-muted'>Product</th>
                                    <th className='text-muted'>Units Sold</th>
                                    <th className='text-muted'>Revenue</th>
                                    <th className='text-muted'>Returns</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.topProducts?.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>{p.units}</td>
                                        <td>${p?.revenue?.toFixed(2)}</td>
                                        <td>{p?.returns || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )
                }
                {activeTab === 'category' && (
                    <>
                        <p className="fs-5">Sales by Category</p>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className='text-muted'>Category</th>
                                    <th className='text-muted'>Units Sold</th>
                                    <th className='text-muted'>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.salesByCategory?.map(c => (
                                    <tr key={c.category}>
                                        <td>{c.category}</td>
                                        <td>{c.units}</td>
                                        <td>${c?.revenue?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )
                }
                {activeTab === 'country' && (
                    <>
                        <p className="fs-5">Sales by Country</p>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className='text-muted'>Country</th>
                                    <th className='text-muted'>Orders</th>
                                    <th className='text-muted'>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.salesByCountry?.map(c => (
                                    <tr key={c.country}>
                                        <td>{c?.country}</td>
                                        <td>{c.orders}</td>
                                        <td>${c?.revenue?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )
                }
                {activeTab === 'payment' && (
                    <>
                        <p className="fs-5">Sales by Payment Method</p>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className='text-muted'>Method</th>
                                    <th className='text-muted'>Orders</th>
                                    <th className='text-muted'>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.salesByPayment?.map(p => (
                                    <tr key={p.method}>
                                        <td>{p.method}</td>
                                        <td>{p.orders}</td>
                                        <td>${p?.revenue?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )
                }
                {activeTab === 'segment' && (
                    <>
                        <p className="fs-5">Sales by Customer Segment</p>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className='text-muted'>Segment</th>
                                    <th className='text-muted'>Orders</th>
                                    <th className='text-muted'>Revenue</th>
                                    <th className='text-muted'>Avg Order Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.salesBySegment?.map(s => (
                                    <tr key={s.segment}>
                                        <td>{s.segment}</td>
                                        <td>{s.orders}</td>
                                        <td>${s?.revenue?.toFixed(2)}</td>
                                        <td>${s?.aov?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )
                }
            </div>
        </div >
    );
};

export default SalesReport;
