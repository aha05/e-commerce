import SelesChart from "./SelesChart";
import CustomerGrowthChart from "./CustomerGrowthChart";
import OrderStatisticsChart from "./OrderStatisticsChart";

const Report = () => {

    return (
        <div className="container my-4">

            {/* Sales Analytics (Line Chart) */}
            <div className="mt-4 mb-2" style={{ height: "100%", width: "83%" }}>
                <SelesChart />
            </div>

            <div className="row">
                {/* Customer Growth (Bar Chart) */}
                <div className="col-md-6 mt-4">
                    <CustomerGrowthChart />
                </div>

                {/* Order Statistics (Pie Chart) */}
                <div className="col-md-4 mt-4">
                    <div className="card shadow-sm">
                        <OrderStatisticsChart />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Report;

