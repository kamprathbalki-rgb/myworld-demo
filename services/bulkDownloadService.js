const XLSX = require("xlsx");

/**
 * Convert JSON array to CSV and send as download
 */
function downloadCSV(res, data, filename) {

    const worksheet = XLSX.utils.json_to_sheet(data);

    const csv = XLSX.utils.sheet_to_csv(worksheet);

    res.setHeader(
        "Content-Type",
        "text/csv"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.csv"`
    );

    res.send(csv);

}

/**
 * Convert JSON array to Excel and send as download
 */
function downloadExcel(res, data, filename) {

    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Data"
    );

    const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx"
    });

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.xlsx"`
    );

    res.send(buffer);

}

module.exports = {
    downloadCSV,
    downloadExcel
};