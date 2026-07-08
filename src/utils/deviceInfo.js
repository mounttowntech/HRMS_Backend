const UAParser = require("ua-parser-js");

exports.getDeviceInfo = (req) => {
  const parser = new UAParser(req.headers["user-agent"]);

  const result = parser.getResult();

  return {
    deviceType: result.device.type || "Desktop",
    os: `${result.os.name || ""} ${result.os.version || ""}`.trim(),
    browser: `${result.browser.name || ""} ${result.browser.version || ""}`.trim(),
    platform: req.headers["sec-ch-ua-platform"] || "",
    userAgent: req.headers["user-agent"],
    ipAddress:
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress,
  };
};