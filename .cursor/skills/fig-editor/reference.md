<!--
PolyForm Shield License 1.0.0
https://polyformproject.org/licenses/shield/1.0.0
Required Notice: Copyright (c) 2026 Rogie King
Licensor Line of Business: FigUI3 editor and lab (Figma-style plugin UI kit)
-->

# FigUI3 editor API reference

React recipes: [components.md](components.md).

## `fig-select-option`

Observed: `value`, `disabled`, `selected`, `label`.

- `value` falls back to trimmed `textContent` if the attr is omitted
- `label` is the closed-trigger string when option content is rich
- `subtle` uses the secondary hover/focus fill
- `role="option"`, `aria-selected`, `aria-disabled`

## `fig-select-options`

- Auto `slot="panel"` if missing
- Unwraps a legacy nested `fig-chooser`
- A leading labeled `fig-separator` omits its rule
- Overflow nav buttons: `data-fig-select-nav`, classes `overflow-start` / `overflow-end`
- Methods: `syncOverflow()`, `scrollToOption(option, behavior)`

## `fig-select` observed

`value`, `default`, `disabled`, `label`, `options`, `menu-anchor`, `position`, `offset`, `closedby`, `open`, `variant`, `size`

- `icon` renders a square chevron-only trigger; `icon="compact"` uses the compact `fig-button` sizing; provide `aria-label`
- `variant="primary"` uses brand button colors for emphasis
- `variant="input"` matches input-style fill, hover, press, and focus states
- `subtle` applies the secondary hover/focus fill to every option
- `size="large"` sets a 32px trigger
- `menu-anchor` accepts an alternate anchor selector; the `menuAnchor` property accepts an `Element`, selector string, or `null`
- `.default` / `.defaultValue` resolve to the authored default or existing fallback option; `.isDefault` and `.resetToDefault()` use that option.

Position: omit to overlay the selected option on the trigger. Set to place the menu like a popup:

- `bottom left`, `bottom right`, `top left`, `top right`, `bottom center`, `top center`

Events: `input`, `change`, `optionhover`, `optionfocus`.

Methods: `focus(options)` focuses the trigger. `activate(options)` focuses the
trigger and opens the menu unless the select is disabled.

## `fig-font-picker`

Observed: `label`, `aria-label`, `aria-describedby`, `value`, `default`,
`options`, `preview-text`, `minimal`, `local-fonts`, `google-fonts`,
`google-font-limit`, `dialog-position`, `dialog-offset`, `disabled`.

- `value` / `defaultValue`: normalized `{ family, face?, axes }`; plain family strings are accepted.
- `options`: comma/newline family strings or JSON family/face metadata.
- Sources merge in priority order: provided, local, loaded web, Google, generic.
- `minimal` defaults true. Full mode adds Fonts/Favorites tabs and source, category, capability, and language filters.
- Properties: `fonts`, `favorites`, `selectedFamily`, `selectedFace`, `selectedResource`, `result`, `cssValue`, `anchorElement`.
- Methods: `open()`, `close()`, `focus(options)`, `refreshFonts({ requestLocal })`, `inspectSelectedFace()`, `resetToDefault()`.
- Events: `input`, `change`, `optionhover`, and `optionfocus` include `{ value, family, face, axes, css, resource }`; `favoriteschange`, `fontmetadata`, `previewend`, and `close` report picker lifecycle changes.
- Favorites and the minimal-mode favorites-only filter persist in local storage under `figui3:*` keys.
- Google previews and the selected embeddable face load with `FontFace`; set `google-fonts="false"` to avoid network-backed catalog entries. Local Font Access is progressive and permission-dependent.

## Border, stroke, and outline module shells

`fig-module-border`, `fig-module-stroke`, and `fig-module-outline` are the
rendered shells for `figCreateModule("border" | "stroke" | "outline")`.
Create, mount, synchronize, and destroy them through the CSS module controller.
Stroke exposes `stroke-dasharray` and signed `stroke-dashoffset`; Outline derives
`outline-offset` from Inside/Center/Outside alignment presets and exposes a
signed split input for Custom alignment. All three expose style, add,
visibility, and remove controls; advanced controls are limited to Border.

## Input rotate

`fig-input-rotate` observes `x`, `y`, `z`, `default-x`, `default-y`, `default-z`, `units`, `variant`, `open`, and `disabled`.

- Missing or invalid axis values resolve to `0`.
- Units default to `deg`; `deg` and `°` display as `°`.
- Other unit strings display literally.
- `variant="simple"` omits the prepend icon and X/Y/Z labels; the default variant includes both.
- `value` returns numeric `{ x, y, z }`.
- Clicking opens an anchored popup containing `fig-3d-rotate` with all three rotation fields.
- `focus(options)` focuses the trigger; `activate(options)` focuses and clicks it.
- Popup edits update the axis attributes and emit `input` and `change` with `{ x, y, z }`.
- `.default` / `.defaultValue` return `{ x, y, z }`; `.isDefault` and `.resetToDefault()` aggregate all three popup number fields.
- `full` makes the host fill its parent.

## Input point

`fig-input-point` observes `x`, `y`, `default-x`, `default-y`, `units`, `open`, and `disabled`.

- Missing or invalid coordinates resolve to `0`.
- The trigger displays `X … · Y …` with up to one decimal place and the authored unit suffix.
- Clicking opens an anchored `fig-origin-grid` popup with X/Y fields.
- Popup `input` and `change` events update the host attributes and provide numeric `{ x, y }` in `detail`.
- `.default` / `.defaultValue` return `{ x, y }`; `.isDefault` compares both axes and reset emits one host `input` / `change` pair.
- `focus(options)` focuses the trigger; `activate(options)` focuses and clicks it.
- `full` makes the host fill its parent.

## Property

`fig-property` observes `label`, `ratio`, `leading`, `trailing`, `show-leading`, and `show-trailing`.

- Direct slots: `input`, `label`, `leading`, `trailing`
- Authored `slot="label"` markup takes precedence over the `label` attribute.
- `ratio="label:input"` changes the default `1:2` grid split; both sides must be positive numbers. Invalid or missing values resolve to `1:2`, and the reflected `ratio` property supports React assignment.
- `--fig-property-label-ratio`, `--fig-property-input-ratio`, and `--fig-property-label-track` provide lower-level CSS overrides.
- `leading`: `drag` or `chevron`
- `trailing`: `remove`, `add`, or `bind`
- `show-leading` / `show-trailing`: omitted or `hover` reveals on hover, `false` hides, and an empty attribute always shows
- `selected`: present or `true` uses `--figma-color-bg-selected`; `false` leaves the row unselected
- `activation="row"` activates the slotted control from the label or unused row surface; input and accessory clicks remain native, while focus moves the outline to the row and applies `--figma-color-bg-selected`. A slotted `fig-select` anchors its menu to the property row.
- Row activation keeps content-sized tracks and ignores `ratio`.
- Row activation overrides `full` sizing; color, gradient, palette, and point inputs use the standard compact width.
- Authored accessory slots override generated shortcuts.
- `input` returns the direct `slot="input"` element.
- `focus(options)` delegates focus to the slotted control and falls back to its first native focus target.
- `activate(options)` delegates to the slotted control's `activate()` method and falls back to `focus()`.
- `isDefault` is true only when at least one resettable slotted control exists and every resettable control reports `isDefault === true`.
- `resetToDefault()` delegates to the slotted control's method. The generated right-click menu updates from control events, default/value attributes, and input replacement while keeping “Reset to default” disabled when unavailable, disabled, or `isDefault === true`. The row gets `selected` while that menu is open, then restores any authored `selected` value. `context-menu="none"` leaves the native event untouched and disables the generated menu.
- Generated labels associate to the input with `aria-labelledby` unless it already has an accessible name.
- Generated trailing events bubble across shadow roots with `detail: { input }`.
- Child control events are not normalized or re-emitted.

## Fill module

`fig-module-fills` observes `fills`, `label`, `mode`, `multiple`,
`value-property`, and `disabled`.

- `fills`: JSON array of `{ type, visible, ...fillData }`; the property accepts and returns the same array.
- `mode`: comma-separated supported fill types; defaults to `solid,gradient,image`.
- `multiple="false"` limits the list to one fill.
- `value-property="fill"` maps the first visible solid fill to SVG `fill`; the default maps ordered layers to `background-color` and `background-image`.
- `values` returns the current CSS-property map.
- User changes reflect `fills` and emit bubbling `input` / `change` events. Detail includes `{ fills, values, phase, path }` plus action/index metadata.
- Drag handles appear only when at least two fills exist.

## Filter module

`fig-module-filters` observes `filters`, `label`, `multiple`, and `disabled`.

- `filters`: JSON array of SVG-derived filter objects; the property accepts and returns the same array.
- Targets: `layer` maps to `filter`; `backdrop` maps to `backdrop-filter`.
- Types: `gaussian-blur`, `brightness`, `contrast`, `grayscale`, `hue-rotate`, `invert`, `saturate`, and `sepia`.
- `multiple="false"` limits the list to one filter.
- `values` returns `{ filter, "backdrop-filter" }` with visible effects serialized in order.
- User changes reflect `filters` and emit bubbling `input` / `change` events. Detail includes `{ filters, values, phase, path }` plus action/index metadata.
- Each filter wraps a grouped `fig-select` and unit-aware `fig-input-number` in `fig-stack[slot="input"]`, with trailing visibility/remove actions.

## Shadow module

`fig-module-shadows` observes `shadows`, `label`, `multiple`, and `disabled`.

- `shadows`: JSON array of `{ type, x, y, blur, spread?, color, visible }`; the property accepts and returns the same array.
- Types: `drop`, `inner`, and `text`. Text shadows omit spread; inner shadows serialize with `inset`.
- `multiple="false"` limits the list to one shadow.
- `values` returns `{ "box-shadow", "text-shadow" }` with visible shadows serialized in order.
- User changes reflect `shadows` and emit bubbling `input` / `change` events. Detail includes `{ shadows, values, phase, path }` plus action/index metadata.
- Each row uses a property button with an anchored editor and trailing visibility/remove actions.

## Transform module

`fig-module-transforms` observes `transforms`, `label`, `multiple`, and
`disabled`.

- `transforms`: JSON array of ordered transform objects; the property accepts and returns the same array.
- Types: `translate`, `rotate`, `scale`, `skew`, and `perspective`.
- `multiple="false"` limits the list to one transform.
- `values` returns `{ transform }` with visible transform functions serialized in order.
- User changes reflect `transforms` and emit bubbling `input` / `change` events. Detail includes `{ transforms, values, phase, path }` plus action/index metadata.
- Each row uses a property button with an anchored editor and trailing visibility/remove actions.

## Easing popup

`dialog[is="fig-popup-easing"]` extends `fig-popup` and owns a
`fig-easing-curve` with `aspect-ratio="4/3"`.

- Observes and forwards `value`, `mode`, `precision`, `edit`, `presets`, and `text`.
- Forwards bubbling `input` / `change` events and reflects the current easing value.
- Defaults: `position="bottom left"`, `offset="0 8"`, `viewport-margin="8"`, and `popover="manual"`.

## Reorder

`fig-reorder` observes `axis`, `handle`, `items`, `indicator`, and `disabled`.

- `items`: selector for reorderable direct children; non-matching children remain in place.
- `indicator`: `default` or `ring`.
- `refresh()`: force child/selector synchronization.
- Event `reorder`: `{ oldIndex, newIndex, item }`; indices count matching items.
- Nested drag controls are ignored unless an explicit `handle` is configured.

## Palette editor

`fig-palette-editor` observes `value`, `min`, `max`, `fixed`, `disabled`, `overflow`, and `show-rows`. An omitted `max` allows unlimited colors.

- `value`: JSON array of hex strings or `{ color, alpha }` objects, or comma-separated hex
- `value` property and `input` / `change` event `detail`: normalized ordered `{ color, alpha }[]`
- `overflow="fade|visible"`: defaults to a bounded list with vertical fades; `visible` shows every row.
- `show-rows`: defaults to `6.5` and maps to `--fig-palette-editor-overflow-show-rows`.
- Rows are direct `fig-reorder` items and support pointer or keyboard reordering.

## Gradient editor

`fig-gradient-editor` observes `value`, `color-space`, `disabled`, `overflow`, and `show-rows`.

- `value` accepts a gradient config or `{ type: "gradient", gradient }` and returns a normalized gradient config.
- `cssValue` returns the current CSS gradient.
- `pickerAnchor` anchors nested stop color pickers.
- `overflow="fade|visible"`: stop rows default to a bounded list with vertical fades; `visible` shows every stop.
- `show-rows`: defaults to `6.5` and maps to `--fig-gradient-editor-overflow-show-rows`.
- Bubbling `input` / `change` detail is `{ type: "gradient", gradient, css }`.
- Interpolation remains locked to sRGB to match the fill picker’s current behavior.

## Gradient popup

`dialog[is="fig-popup-gradient"]` extends `fig-popup`, owns a
`fig-gradient-editor`, and observes `value`, `color-space`, `disabled`,
`overflow`, and `show-rows`.

- Defaults: `position="bottom left"`, `offset="0 8"`, `viewport-margin="8"`, and `popover="manual"`.
- Bubbling `input` / `change` detail is `{ type: "gradient", gradient, css }`.

## Palette popup

`dialog[is="fig-popup-palette"]` extends `fig-popup`, owns a
`fig-palette-editor`, and observes `value`, `min`, `max`, `fixed`, and
`disabled`, `overflow`, and `show-rows` in addition to inherited popup attributes.

- `value` property and bubbling `input` / `change` detail are normalized `{ color, alpha }[]`.
- Defaults: `position="bottom left"`, `offset="0 8"`, `viewport-margin="8"`, and `popover="manual"`.
- Import through `fig-editor.js`; create it with `document.createElement("dialog", { is: "fig-popup-palette" })` or matching HTML.

## Fill picker modes

Built-in: `solid`, `gradient`, `image`, `video`, `webcam`.

Gradient spaces: `srgb`, `srgb-linear`, `display-p3`, `oklab`, `oklch`, `hsl`.
Hue interpolations (oklch/hsl): `shorter`, `longer`, `increasing`, `decreasing`.

`fig-interpolation-swatch` observed: `value` (gradient payload). Size via attr/CSS.

## Color input + picker

When picker is registered, `fig-input-color` / `fig-input-fill` open it on interaction.

- Do not emit `input` from programmatic `value` writes (React loop avoidance)
- Custom mode JSON: `type` = mode name, remaining keys in payload
