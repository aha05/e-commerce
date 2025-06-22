// utils/exportUtils.js
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Helper: Convert to CSV
exports.exportToCSV = (res, data, fileName) => {
    try {
        const parser = new Parser();
        const csv = parser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment(`${fileName}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV Export Error:', error);
        res.status(500).send('Error generating CSV');
    }
};

// Helper: Convert to Excel
exports.exportToExcel = async (res, data, fileName) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(fileName);

        if (data.length) {
            worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
            worksheet.addRows(data);
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Excel Export Error:', error);
        res.status(500).send('Error generating Excel');
    }
};

// Helper: Convert to PDF
exports.exportToPDF = (res, data, fileName) => {
    try {
        const doc = new PDFDocument({ margin: 30 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}.pdf`);
        doc.pipe(res);

        const keys = data.length ? Object.keys(data[0]) : [];

        doc.fontSize(14).text(`${fileName} Report`, { align: 'center' }).moveDown();

        data.forEach((item, index) => {
            keys.forEach(key => {
                doc.fontSize(10).text(`${key}: ${item[key]}`, { continued: false });
            });
            if (index < data.length - 1) doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).send('Error generating PDF');
    }
};
