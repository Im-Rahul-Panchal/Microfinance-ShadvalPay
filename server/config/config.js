require("dotenv").config();

module.exports = {
  BASE_URL: process.env.BASE_URL,
  COMPANY_GROUP_ID: process.env.COMPANY_GROUP_ID,
  SIGNATURE: process.env.SIGNATURE,
  DEVICE_ID: process.env.DEVICE_ID,
  AUTHENTICATION: process.env.AUTHENTICATION,
  SESSION_SECRET: process.env.SESSION_SECRET,
};
