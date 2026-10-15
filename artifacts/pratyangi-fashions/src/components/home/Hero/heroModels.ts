export type HeroModelSlot = {
  id: string;
  image: string;
  left: string;
  width: string;
  height: string;
  bottom: string;
  zIndex: number;
  variant: "side" | "center";
  objectPosition?: string;
};

/** Model positions from Figma frame 1032:9564 (stage 1440×591). */
export const heroModelSlots: HeroModelSlot[] = [
  {
    id: "left-3",
    image: "/images/reference/hero-model-left3.png",
    left: "-23.19%",
    width: "15.97%",
    height: "38.92%",
    bottom: "35.68%",
    zIndex: 3,
    variant: "side",
  },
  {
    id: "left-2",
    image: "/images/reference/hero-model-left2.png",
    left: "7.22%",
    width: "13.13%",
    height: "55.84%",
    bottom: "27.24%",
    zIndex: 4,
    variant: "side",
  },
  {
    id: "left-1",
    image: "/images/reference/hero-model-left1.png",
    left: "22.62%",
    width: "15.87%",
    height: "67.68%",
    bottom: "21.32%",
    zIndex: 5,
    variant: "side",
  },
  {
    id: "center",
    image: "/images/reference/hero-model-center.png",
    left: "40.76%",
    width: "18.5%",
    height: "67.68%",
    bottom: "10.49%",
    zIndex: 7,
    variant: "center",
  },
  {
    id: "right-1",
    image: "/images/reference/hero-model-right1.png",
    left: "61.51%",
    width: "14.82%",
    height: "67.68%",
    bottom: "21.32%",
    zIndex: 5,
    variant: "side",
  },
  {
    id: "right-2",
    image: "/images/reference/hero-model-right2.png",
    left: "78.61%",
    width: "13.68%",
    height: "55.84%",
    bottom: "27.24%",
    zIndex: 4,
    variant: "side",
  },
  {
    id: "right-3",
    image: "/images/reference/hero-model-right3.png",
    left: "94.51%",
    width: "9.93%",
    height: "43.99%",
    bottom: "33.16%",
    zIndex: 3,
    variant: "side",
  },
];
