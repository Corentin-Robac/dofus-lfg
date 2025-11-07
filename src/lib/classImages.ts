// src/lib/classImages.ts
const classImage: Record<string, string> = {
  Feca: "/images/classes/feca.png",
  Osamodas: "/images/classes/osamodas.png",
  Enutrof: "/images/classes/enutrof.png",
  Sram: "/images/classes/sram.png",
  Xelor: "/images/classes/xelor.png",
  Ecaflip: "/images/classes/ecaflip.png",
  Eniripsa: "/images/classes/eniripsa.png",
  Iop: "/images/classes/iop.png",
  Crâ: "/images/classes/cra.png",
  Cra: "/images/classes/cra.png",
  Sadida: "/images/classes/sadida.png",
  Sacrieur: "/images/classes/sacrieur.png",
  Pandawa: "/images/classes/pandawa.png",
  Roublard: "/images/classes/roublard.png",
  Zobal: "/images/classes/zobal.png",
  Steamer: "/images/classes/steamer.png",
  Eliotrope: "/images/classes/eliotrope.png",
  Huppermage: "/images/classes/huppermage.png",
  Ouginak: "/images/classes/ouginak.png",
  Forgelance: "/images/classes/forgelance.png",
};

export function getClassImage(cls: string) {
  return classImage[cls] ?? "/images/classes/_placeholder.png";
}
