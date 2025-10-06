export interface EpicaEffectInterface {
  effectType: string;
  value: number | string; // Valor numérico o representado como texto
  durationTurns: number; // Duración en turnos del efecto
  cooldown: number; // Turnos de enfriamiento
  isAvailable: boolean; // Si se puede usar actualmente
  masterChance?: number; // Probabilidad de efecto maestro (opcional)
  stock?: number; // Stock asociado al efecto (opcional en algunas colecciones)
}

export default interface EpicaInterface {
  _id?: string; // ObjectId en la base de datos
  id: number; // ID lógico numérico
  image: string; // URL o ruta de imagen
  name: string;
  heroType: string; // TANK, SHAMAN, etc.
  description: string;
  status: boolean; // Activa / visible
  effects: EpicaEffectInterface[]; // Lista de efectos
  // Algunos campos opcionales siguiendo patrón de otros modelos
  stock?: number; // stock global (si aplica)
}
