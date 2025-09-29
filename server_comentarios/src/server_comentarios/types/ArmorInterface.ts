export interface ArmorEffectInterface {
  effectType: string;
  value: number | string;
  durationTurns: number;
}

export default interface ArmorInterface {
  _id?: string;         
  image: string;
  id: number;            // ID numérico propio
  name: string;
  description: string;
  status: boolean;
  effects: ArmorEffectInterface[];
  dropRate: number;
  stock: number;
  armorType: string;     // CHEST, HELMET, etc.
  heroType: string;      // SHAMAN, TANK, etc.
}