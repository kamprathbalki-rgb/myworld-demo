const bcrypt = require("bcrypt");

const newPassword = "Admin@123";

bcrypt.hash(newPassword, 10).then(hash => {
    console.log(hash);
});