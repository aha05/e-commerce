import React, { useEffect, useRef, useState } from "react";
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
import Chart from "chart.js/auto";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, ArcElement, PointElement, Title, Tooltip, Legend);

const SelesChart = () => {
    const salesChartRef = useRef(null);


    useEffect(() => {
        // Fetch data from backend
        axios.get("/api/admin/reports") // Update this URL
            .then((response) => {
                const { sales } = response.data;
                renderCharts(sales);
            })
            .catch((error) => {
                if (error.response.status === 401) navigate('/unauthorized');
                console.error("Error fetching data:", error);
            });
    }, []);

    const renderCharts = (sales) => {
        if (salesChartRef.current) {
            new Chart(salesChartRef.current, {
                type: "line",
                data: {
                    labels: sales.labels,
                    datasets: [{
                        label: "Revenue",
                        data: sales.values,
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                    }],
                },
            });
        }
    };

    return (
        <div className="card border-0 h-100 shadow-sm" >
            <div className="card-body h-100">
                <p className="fs-5">Sales Analytics</p>
                <canvas ref={salesChartRef} style={{ width: '100%', height: '100%' }}></canvas>
            </div>
        </div>
    );
};

export default SelesChart;
