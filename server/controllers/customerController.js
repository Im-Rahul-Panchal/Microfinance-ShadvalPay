const axios = require("axios");
const FormData = require("form-data");

const {
  BASE_URL,
  COMPANY_GROUP_ID,
  SIGNATURE,
  DEVICE_ID,
  AUTHENTICATION,
} = require("../config/config");

const { getClientIP, getServerIP } = require("../utils/ipUtils");
const decodeUserId = require("../utils/decodeUserId");

// 3. Menu List
exports.menuList = async (req, res) => {
  try {
    const { latitude, longitude, userId } = req.body;

    const payload = {
      companyGroupId: COMPANY_GROUP_ID,
      userId: parseInt(decodeUserId(userId)),
      latitude,
      longitude,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/associate_login/menu_list`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 4. Dashboard
exports.dashboardData = async (req, res) => {
  try {
    const { latitude, longitude, userId } = req.body;

    const payload = {
      userId: parseInt(decodeUserId(userId)),
      companyGroupId: COMPANY_GROUP_ID,
      latitude,
      longitude,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/associate_login/dashboard_data`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 5. Verification
exports.verification = async (req, res) => {
  try {
    const {
      aadharNumber,
      mobileNumber,
      verifyType,
      latitude,
      longitude,
      userId,
    } = req.body;

    const payload = {
      userId: parseInt(decodeUserId(userId)),
      companyGroupId: COMPANY_GROUP_ID,
      latitude,
      longitude,
      aadharNumber,
      mobileNumber,
      verifyType,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/add_customersDetails/customer_Enroll`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      },
    );

    res.json(response.data);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 6. Generate Aadhaar OTP
exports.generateAadhaarOtp = async (req, res) => {
  try {
    const { aadharNumber, mobileNumber, latitude, longitude, userId } =
      req.body;

    const payload = {
      userId: parseInt(decodeUserId(userId)),
      companyGroupId: COMPANY_GROUP_ID,
      latitude,
      longitude,
      aadharNumber,
      mobileNumber,
      verifyType: "otp",
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/customersEnroll_ByOtp/GenerateAadhaarOtp`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      },
    );

    res.json(response.data);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 7. Verify Aadhaar OTP
exports.verifyAadhaarOtp = async (req, res) => {
  try {
    const { userId, latitude, longitude, otp, refNo, AadhaarRef } = req.body;

    const payload = {
      userId: parseInt(decodeUserId(userId)),
      companyGroupId: COMPANY_GROUP_ID,
      latitude,
      longitude,
      otp,
      refNo,
      AadhaarRef,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/customersEnroll_ByOtp/AadhaarVerify_otp`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      },
    );

    res.json(response.data);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 8. Personal Details
exports.personalDetails = async (req, res) => {
  try {
    const data = req.body;

    const payload = {
      ...data,
      userId: parseInt(decodeUserId(data.userId)),
      companyGroupId: COMPANY_GROUP_ID,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/add_customersDetails/CustomerPersonalDetails`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      },
    );

    res.json(response.data);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 9. Upload Documents
exports.uploadDocuments = async (req, res) => {
  try {
    const form = new FormData();
    const decodedUserId = decodeUserId(req.body.userId);

    form.append("userId", decodedUserId);
    form.append("companyGroupId", COMPANY_GROUP_ID);
    form.append("latitude", req.body.latitude || "0");
    form.append("longitude", req.body.longitude || "0");
    form.append("customerKey", req.body.customerKey || "");
    form.append("clientIp", getClientIP(req));
    form.append("serverIp", getServerIP());

    const fields = [
      "aadharFront",
      "aadharBack",
      "panCard",
      "photo",
      "signature",
      "fatherMotherAadhar",
      "otherDocuments",
    ];

    fields.forEach((field) => {
      if (req.files?.[field]) {
        const file = req.files[field][0];
        form.append(field, file.buffer, file.originalname);
      }
    });

    const response = await axios.post(
      `${BASE_URL}/api/add_customersDetails/UploadDocuments`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      },
    );

    res.json(response.data);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 10. Customer Profile
exports.customerProfile = async (req, res) => {
  try {
    const { customerKey, latitude, longitude, userId } = req.body;

    const payload = {
      userId: parseInt(decodeUserId(userId)),
      companyGroupId: COMPANY_GROUP_ID,
      latitude,
      longitude,
      customerKey,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/customer_Profile/Customer_Profile`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      },
    );

    res.json(response.data);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 11. Customer Documents
exports.customerDocuments = async (req, res) => {
  try {
    const { customerKey, latitude, longitude, userId } = req.body;

    const payload = {
      userId: parseInt(decodeUserId(userId)),
      companyGroupId: COMPANY_GROUP_ID,
      latitude,
      longitude,
      customerKey,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/customer_Details/customer_Detail`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};


// 12. Customer Loan Accounts
exports.customerLoanAccounts = async (req, res) => {
  try {
    const { customerKey, latitude, longitude, userId } = req.body;

    const payload = {
      userId: parseInt(decodeUserId(userId)),
      companyGroupId: COMPANY_GROUP_ID,
      latitude,
      longitude,
      customerKey,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/customer_Profile/CustomerLoanAccountDetails`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};


// 13. Customer List
exports.customerList = async (req, res) => {
  try {
    const { latitude, longitude, startDate, endDate, userId } = req.body;

    const payload = {
      userId: parseInt(decodeUserId(userId)),
      companyGroupId: COMPANY_GROUP_ID,
      latitude,
      longitude,
      startDate,
      endDate,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/associate_CustomerList/customer_List`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};


// 14. Client List
exports.clients = async (req, res) => {
  try {
    const { latitude, longitude, userId } = req.body;

    const payload = {
      userId: parseInt(decodeUserId(userId)),
      companyGroupId: COMPANY_GROUP_ID,
      latitude,
      longitude,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/apply_NewLoan/search_Client`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};