export const protect = (req, res, next) => {
  try {
    if (req.path === "/sync-member") {
      console.log("\n=== SYNC-MEMBER REQUEST HIT PROTECT MIDDLEWARE ===");
      console.log("Method:", req.method);
      console.log("Path:", req.path);
      console.log("Full URL:", req.originalUrl);
      console.log("Headers:", req.headers);
    }

    const { userId } = req.auth(); // ← remove async/await

    if (req.path === "/sync-member") {
      console.log("Auth check - User ID:", userId);
    }

    if (!userId) {
      console.error("Auth failed: No userId");
      return res.status(401).json({ error: "Unauthorized" });
    }

    return next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
};
