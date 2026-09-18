import {
  createEntityId,
  normalizeBuilderState,
  type BuilderState,
  type CustomSectionItem,
} from "./portfolio.ts";

export function addCustomSection(
  input: BuilderState,
  title: string
): BuilderState {
  const state = normalizeBuilderState(input);
  const id = createEntityId("custom-section");
  const cleanTitle = title.trim() || "Custom section";

  return {
    ...state,
    data: {
      ...state.data,
      customSections: [
        ...state.data.customSections,
        {
          id,
          title: cleanTitle,
          items: [],
        },
      ],
    },
    variants: state.variants.map((variant) => ({
      ...variant,
      config: {
        ...variant.config,
        sections: [
          ...variant.config.sections,
          {
            id: `custom-${id}`,
            type: "custom",
            customSectionId: id,
            variant: "list",
            visible: variant.id === state.activeVariantId,
          },
        ],
      },
    })),
  };
}

export function removeCustomSection(
  input: BuilderState,
  customSectionId: string
): BuilderState {
  const state = normalizeBuilderState(input);

  return {
    ...state,
    data: {
      ...state.data,
      customSections: state.data.customSections.filter(
        (section) => section.id !== customSectionId
      ),
    },
    variants: state.variants.map((variant) => ({
      ...variant,
      config: {
        ...variant.config,
        sections: variant.config.sections.filter(
          (section) => section.customSectionId !== customSectionId
        ),
      },
    })),
  };
}

export function updateCustomSectionTitle(
  input: BuilderState,
  customSectionId: string,
  title: string
): BuilderState {
  const state = normalizeBuilderState(input);

  return {
    ...state,
    data: {
      ...state.data,
      customSections: state.data.customSections.map((section) =>
        section.id === customSectionId ? { ...section, title } : section
      ),
    },
  };
}

export function addCustomSectionItem(
  input: BuilderState,
  customSectionId: string
): BuilderState {
  const state = normalizeBuilderState(input);
  const item: CustomSectionItem = {
    id: createEntityId("custom-item"),
    heading: "",
    subheading: "",
    meta: "",
    description: "",
    linkLabel: "",
    linkUrl: "",
  };

  return {
    ...state,
    data: {
      ...state.data,
      customSections: state.data.customSections.map((section) =>
        section.id === customSectionId
          ? { ...section, items: [...section.items, item] }
          : section
      ),
    },
  };
}

export function updateCustomSectionItem(
  input: BuilderState,
  customSectionId: string,
  itemId: string,
  field: keyof Omit<CustomSectionItem, "id">,
  value: string
): BuilderState {
  const state = normalizeBuilderState(input);

  return {
    ...state,
    data: {
      ...state.data,
      customSections: state.data.customSections.map((section) =>
        section.id === customSectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
              ),
            }
          : section
      ),
    },
  };
}

export function removeCustomSectionItem(
  input: BuilderState,
  customSectionId: string,
  itemId: string
): BuilderState {
  const state = normalizeBuilderState(input);

  return {
    ...state,
    data: {
      ...state.data,
      customSections: state.data.customSections.map((section) =>
        section.id === customSectionId
          ? {
              ...section,
              items: section.items.filter((item) => item.id !== itemId),
            }
          : section
      ),
    },
  };
}
