const axios = require("axios");
const { getClientIP, getServerIP } = require("../utils/ipUtils");
const decodeUserId = require("../utils/decodeUserId");
const FormData = require("form-data");
const upload = require("../middlewares/uploadMiddleware");
const {
  BASE_URL,
  COMPANY_GROUP_ID,
  SIGNATURE,
  DEVICE_ID,
  AUTHENTICATION,
} = require("../config/config");

async function fetchList(endpoint, reqBody, req) {
  const decodedUserId = decodeUserId(reqBody.userId);
  const payload = {
    userId: decodedUserId ? parseInt(decodedUserId) : undefined,
    companyGroupID: COMPANY_GROUP_ID,
    latitude: reqBody.latitude,
    longitude: reqBody.longitude,
    clientIp: getClientIP(req),
    serverIp: getServerIP(),
    ...(reqBody.extra || {}),
  };

  const response = await axios.post(`${BASE_URL}${endpoint}`, payload, {
    headers: {
      "Content-Type": "application/json",
      signature: SIGNATURE,
      deviceId: DEVICE_ID,
      authorization: AUTHENTICATION,
    },
  });
  return response.data;
}

// 15. Branch List
exports.branchList = async (req, res) => {
  try {
    const data = await fetchList(
      "/api/apply_NewLoan/branch_List",
      req.body,
      req,
    );
    res.json(data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Internal server error" });
  }
};

// 16. Center List
exports.centerList = async (req, res) => {
  try {
    const data = await fetchList(
      "/api/apply_NewLoan/center_List",
      req.body,
      req,
    );
    res.json(data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Internal server error" });
  }
};

// 17. Group Name List
exports.groupList = async (req, res) => {
  try {
    const data = await fetchList(
      "/api/apply_NewLoan/group_Name",
      req.body,
      req,
    );
    res.json(data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Internal server error" });
  }
};

// 18. Loan Type List
exports.loanTypeList = async (req, res) => {
  try {
    const data = await fetchList(
      "/api/apply_NewLoan/loanType_list",
      req.body,
      req,
    );
    res.json(data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Internal server error" });
  }
};

// 19. Loan Scheme List
exports.schemeList = async (req, res) => {
  try {
    const data = await fetchList(
      "/api/apply_NewLoan/scheme_list",
      req.body,
      req,
    );
    res.json(data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Internal server error" });
  }
};

// 20. Guarantor List
exports.guarantorList = async (req, res) => {
  try {
    const data = await fetchList(
      "/api/apply_NewLoan/gaurantor_list",
      req.body,
      req,
    );
    res.json(data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Internal server error" });
  }
};

// 21. Pincode Details
exports.pincodeDetails = async (req, res) => {
  try {
    const data = await fetchList(
      "/api/get_PinCodeDetails/PinCode_Details",
      { ...req.body, extra: { pinCode: req.body.pinCode } },
      req,
    );
    res.json(data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Internal server error" });
  }
};

// 22. IFSC Details
exports.ifscDetails = async (req, res) => {
  try {
    const data = await fetchList(
      "/api/get_IfscData/get_IfscDetails",
      { ...req.body, extra: { ifsc: req.body.ifsc } },
      req,
    );
    res.json(data);
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Internal server error" });
  }
};

// 23. Apply New Loan
exports.applyNewLoan = async (req, res) => {
  upload.single("documents")(req, res, async (err) => {
    if (err)
      return res
        .status(400)
        .json({ error: "File upload error", message: err.message });

    try {
      const body = req.body;
      const decodedUserId = decodeUserId(body.userId);
      const clientIp = getClientIP(req);
      const serverIp = getServerIP();

      const formData = new FormData();
      formData.append("userId", parseInt(decodedUserId));
      formData.append("companyGroupId", parseInt(COMPANY_GROUP_ID));
      formData.append("latitude", parseFloat(body.latitude) || 0);
      formData.append("longitude", parseFloat(body.longitude) || 0);
      formData.append("clientIp", clientIp);
      formData.append("serverIp", serverIp);
      formData.append("openDate", body.applyDate || "");
      formData.append("memberCode", body.clientCode || "");
      formData.append("memberId", body.clientId);
      formData.append("memberName", body.clientName || "");
      formData.append("branches", parseInt(body.branchId) || 0);
      formData.append("associates", parseInt(body.associateId) || 0);
      formData.append("center", parseInt(body.centerId) || 0);
      formData.append("group", parseInt(body.groupId) || 0);
      formData.append("gaurantorType1", parseInt(body.guarantor1) || 0);
      formData.append("gaurantorType2", parseInt(body.guarantor2) || 0);

      const loanTypeValue = body.loanTypeId || body.loanType;
      const loanSchemeValue = body.loanSchemeId || body.loanScheme;
      formData.append("loanType", parseInt(loanTypeValue) || 0);
      formData.append("loanScheme", parseInt(loanSchemeValue) || 0);

      formData.append("tenureTime", parseInt(body.tenureTime) || 0);
      formData.append("amount", parseFloat(body.loanRequestAmount) || 0);
      formData.append("tenureType", body.tenureType || "");
      formData.append(
        "payModeOption",
        body.payMode === "Other Bank" ? "OtherBank" : body.payMode,
      );
      formData.append("bankName", body.bankName || "");
      formData.append("name", body.memberName || "");
      formData.append("accountNo", body.accountNumber || "");
      formData.append("ifscCode", body.ifscCode || "");
      formData.append("itemType", body.itemType || "");
      formData.append("itemName", body.itemName || "");

      if (req.file) {
        if (req.file.size > 500 * 1024) {
          return res
            .status(400)
            .json({ error: "File too large", message: "Max 500kb" });
        }
        formData.append("documents", req.file.buffer, req.file.originalname);
      }

      const response = await axios.post(
        `${BASE_URL}/api/apply_NewLoan/ApplyNewLoan`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            signature: SIGNATURE,
            deviceId: DEVICE_ID,
            authorization: AUTHENTICATION,
          },
        },
      );

      if (response.data?.resCode === "100") res.json(response.data);
      else res.status(400).json(response.data);
    } catch (error) {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { error: "Internal server error" });
    }
  });
};

// 24. Collection Report
exports.collectionReport = async (req, res) => {
  try {
    const body = req.body;
    const decodedUserId = decodeUserId(body.userId);
    const payload = {
      userId: parseInt(decodedUserId),
      companyGroupId: parseInt(COMPANY_GROUP_ID),
      latitude: body.latitude,
      longitude: body.longitude,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
      startDate: body.startDate,
      endDate: body.endDate,
    };
    const response = await axios.post(
      `${BASE_URL}/api/collection_ReportData/collection_Report`,
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
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Internal server error" });
  }
};

// 25. Loan Report
exports.loanReport = async (req, res) => {
  try {
    const body = req.body;
    const decodedUserId = decodeUserId(body.userId);
    const payload = {
      userId: parseInt(decodedUserId),
      companyGroupId: parseInt(COMPANY_GROUP_ID),
      latitude: body.latitude,
      longitude: body.longitude,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
      startDate: body.startDate,
      endDate: body.endDate,
    };
    const response = await axios.post(
      `${BASE_URL}/api/loan_ReportList/loan_Report`,
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
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Internal server error" });
  }
};

// 26. Associate Profile
exports.associateProfile = async (req, res) => {
  try {
    const body = req.body;
    const decodedUserId = decodeUserId(body.userId);
    const payload = {
      userId: parseInt(decodedUserId),
      companyGroupID: COMPANY_GROUP_ID,
      latitude: body.latitude,
      longitude: body.longitude,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };
    const response = await axios.post(
      `${BASE_URL}/api/associate_Profile/kyc_docs`,
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
    console.error("Associate Profile ERROR:");
    console.error(error.response?.data || error.message || error);

    res.status(500).json({
      message: "Associate profile failed",
      error: error.response?.data || error.message,
    });
  }
};

// 27. Loan Profile
exports.loanProfile = async (req, res) => {
  try {
    const body = req.body;
    const decodedUserId = decodeUserId(body.userId);
    const payload = {
      userId: parseInt(decodedUserId),
      companyGroupId: parseInt(COMPANY_GROUP_ID),
      latitude: body.latitude,
      longitude: body.longitude,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
      loanId: body.loanId,
    };
    const response = await axios.post(
      `${BASE_URL}/api/personalLoan_Profiles/Loan_Profile`,
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
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Internal server error" });
  }
};

// 28. Loan Ledger
exports.loanLedger = async (req, res) => {
  try {
    const body = req.body;
    const decodedUserId = decodeUserId(body.userId);
    const payload = {
      userId: parseInt(decodedUserId),
      companyGroupId: parseInt(COMPANY_GROUP_ID),
      latitude: body.latitude,
      longitude: body.longitude,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
      loanId: body.loanId,
      startDate: body.startDate,
      endDate: body.endDate,
    };
    const response = await axios.post(
      `${BASE_URL}/api/personalLoan_Profiles/GetLedger`,
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
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Internal server error" });
  }
};
