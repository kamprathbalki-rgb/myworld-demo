function normalizeBudget(input) {

    if (input == null) {
        return null;
    }

    if (typeof input === "number") {
        return input;
    }

    let text = String(input)
        .toLowerCase()
        .replace(/,/g, "")
        .replace(/₹|rs\.?|inr/g, "")
        .trim();

    const number = parseFloat(text);

    if (isNaN(number)) {

        const match = text.match(/(\d+(\.\d+)?)/);

        if (!match) {
            return null;
        }

        const value = parseFloat(match[1]);

        if (text.includes("crore") || text.includes("crores") || text.includes("cr")) {
            return value * 100;
        }

        if (text.includes("lakh") || text.includes("lakhs") || text.includes("lac") || text.includes("lacs") || text.includes("l")) {
            return value;
        }

        if (text.includes("thousand") || text.includes("k")) {
            return value / 100;
        }

        if (text.includes("million")) {
            return value * 10;
        }

        if (text.includes("billion")) {
            return value * 10000;
        }

        return value;
    }

    if (text.includes("crore") || text.includes("crores") || text.includes("cr")) {
        return number * 100;
    }

    if (text.includes("lakh") || text.includes("lakhs") || text.includes("lac") || text.includes("lacs")) {
        return number;
    }

    if (text.includes("thousand") || text.includes("k")) {
        return number / 100;
    }

    if (text.includes("million")) {
        return number * 10;
    }

    if (text.includes("billion")) {
        return number * 10000;
    }

    return number;

}

module.exports = normalizeBudget;