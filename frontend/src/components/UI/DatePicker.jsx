import React, { useRef, useEffect } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

const DatePicker = ({ onChange, placeholder }) => {
    const dateInput = useRef(null);

    useEffect(() => {
        const fp = flatpickr(dateInput.current, {
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "F j, Y",
            onChange: (selectedDates, dateStr) => {
                if (onChange) onChange(dateStr);
            }
        });

        return () => fp.destroy(); // Clean up
    }, [onChange]);

    return (
        <input
            type="text"
            placeholder={placeholder || "Select date"}
            ref={dateInput}
            style={{ display: 'none' }}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    );
};

export default DatePicker;
