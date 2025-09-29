import express, { Application } from "express";
import ArmorView from "../server_comentarios/view/ArmorView";
import ItemView from "../server_comentarios/view/ItemView";
import WeaponView from "../server_comentarios/view/WeaponView";
import cors from 'cors';
import CommentView from "../server_comentarios/view/CommentView";
import AuthView from "../server_comentarios/view/AuthView";

export default class Server {
    private readonly app: Application;

    constructor(
        private readonly armorView: ArmorView,
        private readonly itemView: ItemView,
        private readonly weaponView: WeaponView,
    private readonly commentView: CommentView,
    private readonly authView: AuthView) {
        this.app = express();
        this.configure();
        this.routes();
    }

    readonly configure = (): void => {
        // Configurar CORS para permitir peticiones desde el cliente
        this.app.use(cors({
            // Permite puertos comunes en desarrollo desde localhost y 127.0.0.1
            origin: [/^http:\/\/localhost(?::\d+)?$/, /^http:\/\/127\.0\.0\.1(?::\d+)?$/, "http://nexus-battle.com","http://nexus-battle.com:80", "http://nexus-battle.com:8080","http://nexus-battle.com:4200"],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-user', 'x-auth-role', 'user', 'pass']
        }));
        
        // Configurar middleware para procesar JSON y datos de formulario
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    }

    readonly routes = (): void => {
        this.app.use('/api', this.armorView.router);
        this.app.use('/api', this.itemView.router);
    this.app.use('/api', this.weaponView.router);
    this.app.use('/api', this.commentView.router);
    this.app.use('/api', this.authView.router);
    };

    readonly start = (): void => {
        const port = Number(process.env["PORT"]) || 1802;
        this.app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    };
}
