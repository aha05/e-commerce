import React, { useEffect, useRef } from "react";
import axios from "axios";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    ArcElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

// Register necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, ArcElement, PointElement, Title, Tooltip, Legend);

const OrderStatisticsChart = () => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        axios.get("/api/admin/reports")
            .then((response) => {
                const { orders } = response.data;
                renderChart(orders);
            })
            .catch((error) => {
                if (error.response.status === 401) navigate('/unauthorized');
                console.error("Error fetching order statistics:", error);
            });

        return () => {
            // Cleanup existing chart on component unmount
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, []);

    const renderChart = (orders) => {
        const statusColorMap = {
            Cancelled: "rgba(255, 99, 132, 0.6)",   // Red
            Delivered: "rgba(65, 165, 88, 0.6)",    // Green
            Pending: "rgba(54, 162, 235, 0.6)",     // Blue
            Shipped: "rgba(255, 206, 86, 0.6)",     // Yellow
        };

        const borderColorMap = {
            Cancelled: "rgba(255, 99, 132, 1)",
            Delivered: "rgba(89, 198, 87, 1)",
            Pending: "rgba(54, 162, 235, 1)",
            Shipped: "rgba(255, 206, 86, 1)",
        };

        const backgroundColors = orders.labels.map(label => statusColorMap[label] || "gray");
        const borderColors = orders.labels.map(label => borderColorMap[label] || "black");

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current;

        chartInstanceRef.current = new ChartJS(ctx, {
            type: "pie",
            data: {
                labels: orders.labels,
                datasets: [{
                    data: orders.values,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    };

    return (
        <div className="card shadow-sm">
            <div className="card-body">
                <h5>Order Statistics</h5>
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default OrderStatisticsChart;
