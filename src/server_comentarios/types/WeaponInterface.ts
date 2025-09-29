export interface WeaponEffectInterface {
  effectType: string;
  value: number | string;
  durationTurns: number;
}

export default interface WeaponInterface {
  _id?: string;
  id: number;
  image: string;
  heroType: string;
  description: string;
  name: string;
  status: boolean;
  effects: WeaponEffectInterface[];
  dropRate: number;
  stock: number;
}