"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserFromJwtToken = getUserFromJwtToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
function getUserFromJwtToken(authorizationHeader) {
    if (!authorizationHeader)
        return null;
    const [type, token] = authorizationHeader.split(' ');
    if (type !== 'Bearer' || !token) {
        return null;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return {
            id: decoded.sub,
            name: decoded.name,
            role: decoded.role,
            email: decoded.email,
        };
    }
    catch (error) {
        console.error('Invalid JWT:', error);
        return null;
    }
}
//# sourceMappingURL=auth.js.map