"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = __importDefault(require("./express/Server"));
// Carga variables de entorno desde ./env/.env si existe (también funciona en Docker)
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config({ path: './env/.env' });
}
catch {
    // ignore if dotenv is not available; dev uses ts-node-dev --env-file
}
const ArmorModel_1 = __importDefault(require("./server_comentarios/model/ArmorModel"));
const ArmorController_1 = __importDefault(require("./server_comentarios/controller/ArmorController"));
const ArmorView_1 = __importDefault(require("./server_comentarios/view/ArmorView"));
const ItemModel_1 = __importDefault(require("./server_comentarios/model/ItemModel"));
const ItemController_1 = __importDefault(require("./server_comentarios/controller/ItemController"));
const ItemView_1 = __importDefault(require("./server_comentarios/view/ItemView"));
const WeaponModel_1 = __importDefault(require("./server_comentarios/model/WeaponModel"));
const WeaponController_1 = __importDefault(require("./server_comentarios/controller/WeaponController"));
const WeaponView_1 = __importDefault(require("./server_comentarios/view/WeaponView"));
const CommentModel_1 = __importDefault(require("./server_comentarios/model/CommentModel"));
const CommentController_1 = __importDefault(require("./server_comentarios/controller/CommentController"));
const CommentView_1 = __importDefault(require("./server_comentarios/view/CommentView"));
const AuthController_1 = __importDefault(require("./server_comentarios/controller/AuthController"));
const AuthView_1 = __importDefault(require("./server_comentarios/view/AuthView"));
// Proyecto simplificado: solo lectura de armors, items, weapons
// Módulo de lectura de Armors (Inventario)
const armorModel = new ArmorModel_1.default();
const armorController = new ArmorController_1.default(armorModel);
const armorView = new ArmorView_1.default(armorController);
// Items
const itemModel = new ItemModel_1.default();
const itemController = new ItemController_1.default(itemModel);
const itemView = new ItemView_1.default(itemController);
// Weapons
const weaponModel = new WeaponModel_1.default();
const weaponController = new WeaponController_1.default(weaponModel);
const weaponView = new WeaponView_1.default(weaponController);
// Comments
const commentModel = new CommentModel_1.default();
const commentController = new CommentController_1.default(commentModel);
const commentView = new CommentView_1.default(commentController);
const authController = new AuthController_1.default();
const authView = new AuthView_1.default(authController);
// Servidor
const server = new Server_1.default(armorView, itemView, weaponView, commentView, authView);
// Iniciar el servidor
server.start();
