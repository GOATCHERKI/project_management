export const protect = (req, res, next) => {
  try {
    const { userId } = req.auth(); // ← remove async/await
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
};
