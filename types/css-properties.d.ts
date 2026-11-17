import type {
  PropsKitChangeRecord,
  PropsKitConfig,
  PropsKitInteraction,
  PropsKitOptionHoverInteraction,
} from "@rogieking/figui3/propskit.js";

export type CssPropertyModuleId =
  | "layout"
  | "typography"
  | "background"
  | "border"
  | "stroke"
  | "outline"
  | "filters"
  | "shadow"
  | "transforms"
  | "mask"
  | "appearance";

export interface CssPropertyMapping {
  readonly property: string;
  readonly label: string;
  readonly applies: string;
  readonly definition: Readonly<Record<string, unknown>>;
  readonly parser: "text" | "color" | "number" | "options";
}

export interface CssPropertyModule {
  readonly id: CssPropertyModuleId;
  readonly label: string;
  readonly properties: readonly CssPropertyMapping[];
}

export type CssPropertyCapabilityStatus =
  | "applicable"
  | "not-applicable";

export interface CssPropertyCapability {
  readonly moduleId: CssPropertyModuleId;
  readonly moduleLabel: string;
  readonly property: string;
  readonly label: string;
  readonly status: CssPropertyCapabilityStatus;
  readonly confidence: "high" | "low" | "unconstrained";
  readonly reason: string;
}

export interface CssModuleCapability {
  readonly id: CssPropertyModuleId;
  readonly label: string;
  readonly applicable: boolean;
  readonly properties: readonly CssPropertyCapability[];
}

export interface ElementStyleCapabilities {
  readonly mode: "element";
  readonly tagName: string;
  readonly display: string;
  readonly parentDisplay: string;
  readonly modules: readonly CssModuleCapability[];
  readonly properties: readonly CssPropertyCapability[];
  readonly applicableProperties: readonly CssPropertyCapability[];
}

export interface CssModuleConfigResult {
  readonly module: Readonly<{
    id: CssPropertyModuleId;
    label: string;
  }>;
  readonly mode: "element" | "unconstrained";
  readonly config: Readonly<PropsKitConfig>;
  readonly capabilities: readonly CssPropertyCapability[];
}

export const CSS_PROPERTY_MODULES: readonly CssPropertyModule[];

export function analyzeElementStyleCapabilities(
  element: Element,
): ElementStyleCapabilities;

export function getElementStyleCapability(
  element: Element,
  property: string,
): CssPropertyCapability | null;

export function createCssModuleConfig(
  moduleId: CssPropertyModuleId,
  options?: {
    element?: Element;
    values?: Readonly<Record<string, unknown>>;
  },
): CssModuleConfigResult;

export interface CreateCssModuleOptions {
  id?: string;
  element?: Element;
  values?: Readonly<Record<string, unknown>>;
  onInput?: (
    path: string,
    value: unknown,
    interaction: PropsKitInteraction,
  ) => void;
  onChange?: (
    path: string,
    value: unknown,
    interaction: PropsKitInteraction,
  ) => void;
  onOptionHover?: (
    path: string,
    value: unknown,
    interaction: PropsKitOptionHoverInteraction,
  ) => void;
}

export interface CssModuleController {
  readonly id: string;
  readonly module: Readonly<{
    id: CssPropertyModuleId;
    label: string;
  }>;
  readonly element: HTMLElement | null;
  readonly values: Record<string, unknown>;
  getValues(): Record<string, unknown>;
  setValue(path: string, value: unknown): void;
  setValues(values: Readonly<Record<string, unknown>>): void;
  resetValues(): void;
  subscribe(
    listener: (values: Record<string, unknown>) => void,
    immediate?: boolean,
  ): () => void;
  subscribe(
    listener: (records: readonly PropsKitChangeRecord[]) => void,
    options: { mode: "changes"; immediate?: boolean },
  ): () => void;
  mount(target: HTMLElement | string): this;
  unmount(): void;
  destroy(): void;
}

export function figCreateModule(
  moduleId: CssPropertyModuleId,
  options?: CreateCssModuleOptions,
): CssModuleController;
