import type { PortfolioData, BuilderState } from "./types.ts";
import { cloneResume, cloneBranding, defaultConfig, cloneConfig } from "./layout.ts";
import { fullContentConfig } from "./content.ts";

export const emptyData: PortfolioData = {
  profile: {
    name: "",
    role: "",
    tagline: "",
    about: "",
    email: "",
    location: "",
    availability: "",
    heroImageUrl: "",
    socials: [],
  },
  experience: [],
  projects: [],
  skills: [],
  customSections: [],
};

export const emptyBuilderState: BuilderState = {
  data: emptyData,
  variants: [
    {
      id: "portfolio",
      name: "",
      targetRole: "",
      data: emptyData,
      config: cloneConfig(defaultConfig),
      content: fullContentConfig(emptyData),
      branding: cloneBranding(),
      resume: cloneResume(),
    },
  ],
  activeVariantId: "portfolio",
};
