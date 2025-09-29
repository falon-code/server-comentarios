import Server from "./express/Server";
// Carga variables de entorno desde ./env/.env si existe (también funciona en Docker)
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('dotenv').config({ path: './env/.env' });
} catch {
	// ignore if dotenv is not available; dev uses ts-node-dev --env-file
}
import ArmorModel from "./server_comentarios/model/ArmorModel";
import ArmorController from "./server_comentarios/controller/ArmorController";
import ArmorView from "./server_comentarios/view/ArmorView";
import ItemModel from "./server_comentarios/model/ItemModel";
import ItemController from "./server_comentarios/controller/ItemController";
import ItemView from "./server_comentarios/view/ItemView";
import WeaponModel from "./server_comentarios/model/WeaponModel";
import WeaponController from "./server_comentarios/controller/WeaponController";
import WeaponView from "./server_comentarios/view/WeaponView";
import CommentModel from "./server_comentarios/model/CommentModel";
import CommentController from "./server_comentarios/controller/CommentController";
import CommentView from "./server_comentarios/view/CommentView";
import AuthController from "./server_comentarios/controller/AuthController";
import AuthView from "./server_comentarios/view/AuthView";
// Proyecto simplificado: solo lectura de armors, items, weapons

// Módulo de lectura de Armors (Inventario)
const armorModel = new ArmorModel();
const armorController = new ArmorController(armorModel);
const armorView = new ArmorView(armorController);

// Items
const itemModel = new ItemModel();
const itemController = new ItemController(itemModel);
const itemView = new ItemView(itemController);

// Weapons
const weaponModel = new WeaponModel();
const weaponController = new WeaponController(weaponModel);
const weaponView = new WeaponView(weaponController);

// Comments
const commentModel = new CommentModel();
const commentController = new CommentController(commentModel);
const commentView = new CommentView(commentController);
const authController = new AuthController();
const authView = new AuthView(authController);

// Servidor
const server = new Server(armorView, itemView, weaponView, commentView, authView);

// Iniciar el servidor
server.start();
