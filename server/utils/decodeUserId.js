module.exports = function decodeUserId(userId) {
  try {
    const base64regex =
      /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;

    if (typeof userId === "string" && base64regex.test(userId)) {
      return Buffer.from(userId, "base64").toString("utf8");
    }

    return userId;
  } catch {
    return userId;
  }
};
