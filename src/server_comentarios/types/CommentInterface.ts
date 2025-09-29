export type ReferenciaTipo = 'armor' | 'item' | 'weapon';

export default interface CommentInterface {
  _id?: any; // ObjectId
  usuario: string; // autor del comentario
  comentario: string; // texto del comentario
  fecha: Date; // fecha de creación
  valoracion: number; // 1..5
  imagen?: string | null; // data URL o URL opcional
  referencia: {
    tipo: ReferenciaTipo; // tipo de recurso referenciado
    id_objeto: any; // ObjectId del recurso
  };
  eliminado?: boolean; // soft delete flag
  deletedAt?: Date;
  deletedBy?: { user: string; role: 'player' | 'admin' };
  updatedAt?: Date;
  updatedBy?: { user: string; role: 'player' | 'admin' };
  respuestas?: Array<{
    _id?: any; // ObjectId
    usuario: string;
    comentario: string;
    fecha: Date;
  }>;
}
