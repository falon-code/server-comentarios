"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TokenService_1 = require("../auth/TokenService");
class AuthController {
    // POST /api/login con headers x-user/x-pass
    login = async (req, res) => {
        try {
            const auth = req.auth;
            if (!auth) {
                res.status(401).json({ message: 'No autenticado' });
                return;
            }
            const token = (0, TokenService_1.signToken)({ username: auth.user, role: auth.role }, 4 * 60 * 60);
            res.status(200).json({ token, user: { username: auth.user, role: auth.role } });
        }
        catch (e) {
            res.status(500).json({ message: 'Error en login', error: e.message });
        }
    };
}
exports.default = AuthController;
