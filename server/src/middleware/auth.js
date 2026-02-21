import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { prisma } from "../prismaClient.js";

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
        blocked: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (user.blocked) {
      return res
        .status(403)
        .json({ message: "Your account has been blocked by an administrator" });
    }

    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
