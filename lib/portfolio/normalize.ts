import type {
  BuiltInSectionType,
  ThemeName,
  Profile,
  Experience,
  Project,
  CustomSection,
  PortfolioData,
  SectionConfig,
  PortfolioConfig,
  VariantContentConfig,
  BuilderState,
} from "./types.ts";
import { cloneResume, cloneBranding, defaultConfig, sectionType, templateCatalog } from "./layout.ts";
import { fullContentConfig } from "./content.ts";
import { slugify } from "./identifiers.ts";

export function normalizeBuilderState(input: BuilderState): BuilderState {
  const data = normalizeData(input?.data || ({} as PortfolioData));
  const fallbackContent = fullContentConfig(data);

  const rawVariants = Array.isArray(input?.variants) ? input.variants : [];
  const variants = rawVariants.map((variant, index) => {
    const rawContent = variant.content as VariantContentConfig | undefined;

    // A workspace saved before content became per-portfolio has no data on its
    // variants. Each one inherits a full copy of the old shared pool, so its
    // published output is unchanged while its edits become independent.
    const rawVariantData = (variant as { data?: PortfolioData }).data;
    const variantData = rawVariantData ? normalizeData(rawVariantData) : data;

    const variantValidExperience = new Set(
      variantData.experience.map((item) => item.id)
    );
    const variantValidProjects = new Set(
      variantData.projects.map((item) => item.id)
    );
    const variantValidSkills = new Set(variantData.skills);
    const variantFallback = fullContentConfig(variantData);

    const experienceIds = rawContent?.experienceIds?.filter((id) =>
      variantValidExperience.has(id)
    );
    const projectIds = rawContent?.projectIds?.filter((id) =>
      variantValidProjects.has(id)
    );
    const skills = rawContent?.skills?.filter((skill) =>
      variantValidSkills.has(skill)
    );

    return {
      ...variant,
      data: variantData,
      id: variant.id || `portfolio-${index + 1}`,
      name:
        typeof variant.name === "string"
          ? variant.name
          : `Portfolio ${index + 1}`,
      targetRole:
        typeof variant.targetRole === "string"
          ? variant.targetRole
          : data.profile.role,
      config: normalizePortfolioConfig(variant.config, variantData.customSections),
      branding: {
        faviconUrl:
          typeof variant.branding?.faviconUrl === "string"
            ? variant.branding.faviconUrl
            : "",
        shareTitle:
          typeof variant.branding?.shareTitle === "string"
            ? variant.branding.shareTitle
            : "",
        shareDescription:
          typeof variant.branding?.shareDescription === "string"
            ? variant.branding.shareDescription
            : "",
        shareImageUrl:
          typeof variant.branding?.shareImageUrl === "string"
            ? variant.branding.shareImageUrl
            : "",
      },
      resume: {
        url:
          typeof variant.resume?.url === "string"
            ? variant.resume.url
            : "",
        publicId:
          typeof variant.resume?.publicId === "string"
            ? variant.resume.publicId
            : "",
        fileName:
          typeof variant.resume?.fileName === "string"
            ? variant.resume.fileName
            : "",
        showInHero:
          typeof variant.resume?.showInHero === "boolean"
            ? variant.resume.showInHero
            : false,
        hideSectionWhenHeroLink:
          typeof variant.resume?.hideSectionWhenHeroLink === "boolean"
            ? variant.resume.hideSectionWhenHeroLink
            : false,
      },
      content: {
        experienceIds:
          rawContent?.experienceIds !== undefined
            ? experienceIds || []
            : variantFallback.experienceIds,
        projectIds:
          rawContent?.projectIds !== undefined
            ? projectIds || []
            : variantFallback.projectIds,
        skills:
          rawContent?.skills !== undefined ? skills || [] : variantFallback.skills,
      },
    };
  });

  if (!variants.length) {
    variants.push({
      id: "general",
      name: "General",
      targetRole: data.profile.role,
      data,
      config: normalizePortfolioConfig(defaultConfig, data.customSections),
      content: fallbackContent,
      branding: cloneBranding(),
      resume: cloneResume(),
    });
  }

  const activeVariantId = variants.some(
    (variant) => variant.id === input?.activeVariantId
  )
    ? input.activeVariantId
    : variants[0].id;

  // The working data is always the open portfolio's own data, so every reader
  // of state.data sees the portfolio currently being edited rather than a
  // pool shared with the others.
  const active =
    variants.find((variant) => variant.id === activeVariantId) ?? variants[0];

  return {
    data: active.data,
    variants,
    activeVariantId,
  };
}

function normalizePortfolioConfig(
  input: PortfolioConfig | undefined,
  customSections: CustomSection[]
): PortfolioConfig {
  const rawSections = Array.isArray(input?.sections) ? input.sections : [];
  const defaultByType = new Map(
    defaultConfig.sections.map((section) => [sectionType(section), section])
  );
  const validCustom = new Map(customSections.map((section) => [section.id, section]));
  const seenBuiltIns = new Set<BuiltInSectionType>();
  const seenCustom = new Set<string>();
  const sections: SectionConfig[] = [];

  for (const raw of rawSections) {
    if (!raw || typeof raw !== "object") continue;
    const type = sectionType(raw);

    if (type === "custom") {
      const customId = raw.customSectionId;
      const custom = customId ? validCustom.get(customId) : undefined;
      if (!custom || seenCustom.has(custom.id)) continue;

      seenCustom.add(custom.id);
      sections.push({
        id: raw.id || `custom-${custom.id}`,
        type: "custom",
        customSectionId: custom.id,
        variant:
          typeof raw.variant === "string" &&
          templateCatalog.custom.some((option) => option.id === raw.variant)
            ? raw.variant
            : "list",
        visible: Boolean(raw.visible),
        title:
          typeof raw.title === "string" && raw.title.trim()
            ? raw.title
            : custom.title,
      });
      continue;
    }

    const builtIn = type as BuiltInSectionType;
    if (seenBuiltIns.has(builtIn)) continue;
    const fallback = defaultByType.get(builtIn);
    if (!fallback) continue;

    seenBuiltIns.add(builtIn);
    sections.push({
      ...fallback,
      ...raw,
      id: builtIn,
      type: builtIn,
      variant:
        typeof raw.variant === "string" &&
        templateCatalog[builtIn].some((option) => option.id === raw.variant)
          ? raw.variant
          : fallback.variant,
      visible:
        typeof raw.visible === "boolean" ? raw.visible : fallback.visible,
      title:
        typeof raw.title === "string" && raw.title.trim()
          ? raw.title
          : fallback.title,
    });
  }

  for (const fallback of defaultConfig.sections) {
    const type = sectionType(fallback) as BuiltInSectionType;
    if (!seenBuiltIns.has(type)) {
      sections.push({ ...fallback, id: type, type });
    }
  }

  for (const custom of customSections) {
    if (!seenCustom.has(custom.id)) {
      sections.push({
        id: `custom-${custom.id}`,
        type: "custom",
        customSectionId: custom.id,
        variant: "list",
        visible: false,
        title: custom.title,
      });
    }
  }

  const themes: ThemeName[] = [
    "ink",
    "sand",
    "moss",
    "aurora",
    "cobalt",
    "rose",
    "mono",
    "sunset",
    "ice",
    "noir",
  ];

  return {
    theme:
      input?.theme && themes.includes(input.theme)
        ? input.theme
        : defaultConfig.theme,
    sections,
  };
}

export function normalizeData(input: PortfolioData): PortfolioData {
  const profileInput = input?.profile || ({} as Profile);
  const profile: Profile = {
    name: typeof profileInput.name === "string" ? profileInput.name : "",
    role: typeof profileInput.role === "string" ? profileInput.role : "",
    tagline: typeof profileInput.tagline === "string" ? profileInput.tagline : "",
    about: typeof profileInput.about === "string" ? profileInput.about : "",
    email: typeof profileInput.email === "string" ? profileInput.email : "",
    location: typeof profileInput.location === "string" ? profileInput.location : "",
    availability:
      typeof profileInput.availability === "string" ? profileInput.availability : "",
    heroImageUrl:
      typeof profileInput.heroImageUrl === "string" ? profileInput.heroImageUrl : "",
    socials: Array.isArray(profileInput.socials)
      ? profileInput.socials
          .filter((social) => social && typeof social === "object")
          .map((social) => ({
            label: typeof social.label === "string" ? social.label : "",
            url: typeof social.url === "string" ? social.url : "",
          }))
      : [],
  };

  return {
    profile,
    experience: (input?.experience || []).map((item, index) => ({
      ...item,
      id:
        (item as Experience).id ||
        stableEntityId("experience", `${item.company}-${item.role}`, index),
    })),
    projects: (input?.projects || []).map((item, index) => ({
      ...item,
      id:
        (item as Project).id ||
        stableEntityId("project", item.title, index),
      stack: Array.isArray(item.stack) ? item.stack.filter(Boolean) : [],
    })),
    skills: Array.from(new Set((input?.skills || []).filter(Boolean))),
    customSections: (input?.customSections || [])
      .filter((section) => section && typeof section === "object")
      .map((section, sectionIndex) => ({
        id:
          section.id ||
          stableEntityId("custom-section", section.title || "section", sectionIndex),
        title:
          typeof section.title === "string" && section.title.trim()
            ? section.title
            : "Custom section",
        items: (section.items || [])
          .filter((item) => item && typeof item === "object")
          .map((item, itemIndex) => ({
            id:
              item.id ||
              stableEntityId(
                "custom-item",
                item.heading || `item-${itemIndex + 1}`,
                itemIndex
              ),
            heading: typeof item.heading === "string" ? item.heading : "",
            subheading:
              typeof item.subheading === "string" ? item.subheading : "",
            meta: typeof item.meta === "string" ? item.meta : "",
            description:
              typeof item.description === "string" ? item.description : "",
            linkLabel:
              typeof item.linkLabel === "string" ? item.linkLabel : "",
            linkUrl: typeof item.linkUrl === "string" ? item.linkUrl : "",
          })),
      })),
  };
}

function stableEntityId(prefix: string, value: string, index: number) {
  return `${prefix}-${slugify(value)}-${index + 1}`;
}
