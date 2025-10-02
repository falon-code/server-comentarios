export interface ItemEffectInterface {
  effectType: string;
  value: number | string;
  durationTurns: number;
}

export default interface ItemInterface {
  _id?: string;
  id: number;
  image: string;
  heroType: string;
  description: string;
  name: string;
  status: boolean;
  effects: ItemEffectInterface[];
  dropRate: number;
  stock: number;
}
