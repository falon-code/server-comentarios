"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swaggerConfig_1 = __importDefault(require("../swagger/swaggerConfig"));
class Server {
    armorView;
    itemView;
    weaponView;
    epicaView;
    commentView;
    authView;
    app;
    constructor(armorView, itemView, weaponView, epicaView, commentView, authView) {
        this.armorView = armorView;
        this.itemView = itemView;
        this.weaponView = weaponView;
        this.epicaView = epicaView;
        this.commentView = commentView;
        this.authView = authView;
        this.app = (0, express_1.default)();
        this.configure();
        this.routes();
    }
    configure = () => {
        // Configurar CORS para permitir peticiones desde el cliente
        this.app.use((0, cors_1.default)({
            // Permite puertos comunes en desarrollo desde localhost y 127.0.0.1
            origin: [
                /^http:\/\/localhost(?::\d+)?$/,
                /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
                'http://nexus-battle.com',
                'http://nexus-battle.com:80',
                'http://nexus-battle.com:8080',
                'http://nexus-battle.com:4200',
            ],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-user', 'x-auth-role', 'user', 'pass'],
        }));
        // Configurar middleware para procesar JSON y datos de formulario
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    };
    routes = () => {
        // Documentación Swagger
        this.app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerConfig_1.default, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'API Comentarios - Documentación',
        }));
        // Ruta para obtener la especificación JSON de Swagger
        this.app.get('/api-docs.json', (_req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerConfig_1.default);
        });
        this.app.use('/api', this.armorView.router);
        this.app.use('/api', this.itemView.router);
        this.app.use('/api', this.weaponView.router);
        this.app.use('/api', this.epicaView.router);
        this.app.use('/api', this.commentView.router);
        this.app.use('/api', this.authView.router);
    };
    start = () => {
        const port = Number(process.env['PORT']) || 1802;
        this.app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    };
}
exports.default = Server;
