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
        .replace(/₹|rs\.?|inr/gi, "")
        .trim();

    if (!text) {
        return null;
    }

    // ------------------------------------------------------------
    // Indian format:
    // 3 crore 70 lakh
    // 2 crore 5 lakh
    // ------------------------------------------------------------
    let crore = 0;
    let lakh = 0;

    const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*(crore|crores|cr)\b/i);
    if (croreMatch) {
        crore = parseFloat(croreMatch[1]);
    }

    const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs)\b/i);
    if (lakhMatch) {
        lakh = parseFloat(lakhMatch[1]);
    }

    if (crore > 0 || lakh > 0) {
        return (crore * 100) + lakh;
    }

    // ------------------------------------------------------------
    // Million
    // ------------------------------------------------------------
    const millionMatch = text.match(/(\d+(?:\.\d+)?)\s*million\b/i);
    if (millionMatch) {
        return parseFloat(millionMatch[1]) * 10;
    }

    // ------------------------------------------------------------
    // Billion
    // ------------------------------------------------------------
    const billionMatch = text.match(/(\d+(?:\.\d+)?)\s*billion\b/i);
    if (billionMatch) {
        return parseFloat(billionMatch[1]) * 10000;
    }

    // ------------------------------------------------------------
    // Thousand / K
    // ------------------------------------------------------------
    const thousandMatch = text.match(/(\d+(?:\.\d+)?)\s*(thousand|k)\b/i);
    if (thousandMatch) {
        return parseFloat(thousandMatch[1]) / 100;
    }

    // ------------------------------------------------------------
    // Plain numeric
    // ------------------------------------------------------------
    const numberMatch = text.match(/(\d+(?:\.\d+)?)/);

    if (!numberMatch) {
        return null;
    }

    return parseFloat(numberMatch[1]);

}

module.exports = normalizeBudget;