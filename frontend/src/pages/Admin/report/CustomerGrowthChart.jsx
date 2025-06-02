import React, { useEffect, useRef } from "react";
import axios from "axios";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

// Register necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CustomerGrowthChart = () => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("/api/admin/reports");
                const { customers } = response.data;

                const labels = customers?.labels || [];
                const values = customers?.values?.map((v) => Math.round(v)) || [];

                // Destroy existing chart instance if any
                if (chartInstanceRef.current) {
                    chartInstanceRef.current.destroy();
                }

                // Create new chart
                const ctx = chartRef.current;
                chartInstanceRef.current = new ChartJS(ctx, {
                    type: "bar",
                    data: {
                        labels: labels,
                        datasets: [{
                            label: "New Customers",
                            data: values,
                            backgroundColor: "rgba(75, 192, 192, 0.6)",
                            borderColor: "rgba(75, 192, 192, 1)",
                            borderWidth: 1,
                        }],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: true },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const value = context.raw ?? 0;
                                        return `New Customers: ${Math.round(value)}`;
                                    },
                                },
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1,
                                    callback: function (val) {
                                        return Math.round(val);
                                    },
                                },
                            },
                        },
                    },
                });
            } catch (error) {
                if (error.response.status === 401) navigate('/unauthorized');
                console.error("Error fetching customer growth data:", error);
            }
        };

        fetchData();

        // Cleanup chart on unmount
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div className="card shadow-sm">
            <div className="card-body">
                <h5>Customer Growth</h5>
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default CustomerGrowthChart;
