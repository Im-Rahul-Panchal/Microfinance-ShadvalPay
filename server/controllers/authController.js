const axios = require("axios");
const jwt = require("jsonwebtoken");
const {
  BASE_URL,
  COMPANY_GROUP_ID,
  SIGNATURE,
  DEVICE_ID,
  AUTHENTICATION,
  SESSION_SECRET,
} = require("../config/config");

const { getClientIP, getServerIP } = require("../utils/ipUtils");

exports.login = async (req, res) => {
  try {
    const { userName, password, latitude, longitude } = req.body;

    const payload = {
      companyGroupId: COMPANY_GROUP_ID,
      userName,
      password,
      latitude,
      longitude,
      clientIp: getClientIP(req),
      serverIp: getServerIP(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/associate_login/login_page`,
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

exports.verifyMpin = async (req, res) => {
  try {
    const { userName, password, tPin, latitude, longitude } = req.body;

    const response = await axios.post(
      `${BASE_URL}/api/associate_login/verify_mpin`,
      {
        companyGroupId: COMPANY_GROUP_ID,
        userName,
        password,
        tPin,
        latitude,
        longitude,
        clientIp: getClientIP(req),
        serverIp: getServerIP(),
      },
      {
        headers: {
          "Content-Type": "application/json",
          signature: SIGNATURE,
          deviceId: DEVICE_ID,
          authorization: AUTHENTICATION,
        },
      },
    );

    const apiData = response.data;

    if (apiData?.resCode === "100" && apiData.data?.isVerify) {
      const token = jwt.sign(
        {
          userName,
          userId: apiData.data.userId,
          authenticatedAt: Date.now(),
        },
        SESSION_SECRET,
        { expiresIn: "15m" },
      );

      return res.json({
        ...apiData,
        token,
      });
    }

    res.json(apiData);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const user = req.user;

    const newToken = jwt.sign(
      {
        userName: user.userName,
        userId: user.userId,
        authenticatedAt: Date.now(),
      },
      process.env.SESSION_SECRET,
      { expiresIn: "15m" },
    );

    res.json({
      token: newToken,
    });
  } catch (error) {
    res.status(500).json({
      error: "Token refresh failed",
    });
  }
};
