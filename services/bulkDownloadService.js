const XLSX = require("xlsx");

/*
 * CSV Buffer
 */
function createCSVBuffer(data) {

    const worksheet =
        XLSX.utils.json_to_sheet(data);

    const csv =
        XLSX.utils.sheet_to_csv(worksheet);

    return Buffer.from(csv, "utf8");

}

/*
 * Excel Buffer
 */
function createExcelBuffer(data) {

    const workbook =
        XLSX.utils.book_new();

    const worksheet =
        XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Data"
    );

    return XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx"
    });

}

/*
 * Existing CSV Download
 */
function downloadCSV(res, data, filename) {

    res.setHeader(
        "Content-Type",
        "text/csv"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.csv"`
    );

    res.send(
        createCSVBuffer(data)
    );

}

/*
 * Existing Excel Download
 */
function downloadExcel(res, data, filename) {

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.xlsx"`
    );

    res.send(
        createExcelBuffer(data)
    );

}

module.exports = {

    downloadCSV,
    downloadExcel,

    createCSVBuffer,
    createExcelBuffer

};