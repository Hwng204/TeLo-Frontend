---
name: SEP · Tiểu học Phạm Công Bình
description: Exam-matrix assignment and review console for a primary school office; team Figma palette, blue rail, white sheet.
colors:
  rail-blue: "#2f6fb0"
  rail-blue-hover: "#28619c"
  rail-blue-active: "#225585"
  focus-blue: "#4a90e2"
  sheet-white: "#ffffff"
  tint-panel: "#f1f6fc"
  tint-hover: "#eaf2fb"
  tint-pressed: "#dde9f7"
  tint-row: "#f7fafd"
  brand-soft: "#eaf4ff"
  hairline: "#dce6f0"
  hairline-hover: "#c3d6ea"
  ink: "#26364a"
  ink-secondary: "#44566c"
  ink-placeholder: "#5d6d80"
  danger-ink: "#b3403f"
  danger-soft: "#fdf3f3"
  error-red: "#d64545"
  amber-soft: "#fdf8ec"
  amber-ink: "#7a5a1e"
  green-soft: "#ecf7ef"
  green-ink: "#2b6b3f"
  archive-soft: "#f1f0f4"
  archive-ink: "#555061"
typography:
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "30px"
    letterSpacing: "-0.2px"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "24px"
  nav:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: "22px"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"
    letterSpacing: "0"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  table-head:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
  small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"
  hint:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "18px"
rounded:
  pager: "6px"
  sm: "8px"
  md: "10px"
  panel: "12px"
  nav-pill: "20px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  gap: "20px"
  gutter: "24px"
  page-x: "32px"
components:
  button-primary:
    backgroundColor: "{colors.rail-blue}"
    textColor: "{colors.sheet-white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.rail-blue-hover}"
  button-primary-active:
    backgroundColor: "{colors.rail-blue-active}"
  button-secondary:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.rail-blue}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.tint-hover}"
  button-ghost:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.rail-blue}"
    rounded: "{rounded.md}"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.danger-ink}"
    rounded: "{rounded.md}"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
  button-sm:
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "34px"
  button-toolbar:
    height: "40px"
  icon-button-row:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    size: "34px"
  input:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  input-disabled:
    backgroundColor: "{colors.tint-panel}"
    textColor: "{colors.ink-secondary}"
  read-field:
    backgroundColor: "{colors.tint-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
    height: "44px"
  nav-rail:
    backgroundColor: "{colors.rail-blue}"
    textColor: "{colors.sheet-white}"
    typography: "{typography.nav}"
    width: "264px"
  nav-item:
    rounded: "{rounded.nav-pill}"
    padding: "0 16px"
    height: "40px"
  nav-item-active:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.rail-blue}"
  top-bar:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    height: "64px"
  tab:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.nav}"
    height: "46px"
  tab-active:
    textColor: "{colors.rail-blue}"
  table-head:
    textColor: "{colors.rail-blue}"
    typography: "{typography.table-head}"
    padding: "12px 16px"
  table-cell:
    padding: "14px 16px"
  table-row-hover:
    backgroundColor: "{colors.tint-row}"
  status-draft:
    backgroundColor: "{colors.tint-panel}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  status-assigned:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.rail-blue}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  status-submitted:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  status-approved:
    backgroundColor: "{colors.green-soft}"
    textColor: "{colors.green-ink}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  status-archived:
    backgroundColor: "{colors.archive-soft}"
    textColor: "{colors.archive-ink}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  pager-page:
    textColor: "{colors.ink}"
    rounded: "{rounded.pager}"
    size: "32px"
  pager-page-active:
    backgroundColor: "{colors.rail-blue}"
    textColor: "{colors.sheet-white}"
  matrix-panel:
    backgroundColor: "{colors.sheet-white}"
    rounded: "{rounded.panel}"
  matrix-head-cell:
    backgroundColor: "{colors.tint-panel}"
    textColor: "{colors.ink-secondary}"
  dialog:
    backgroundColor: "{colors.sheet-white}"
    rounded: "{rounded.panel}"
    padding: "24px"
    width: "520px"
---

# Design System: SEP · Tiểu học Phạm Công Bình

## Overview

**Creative North Star: "The Office Ledger"**

This is a school office's working ledger, set on a computer. A solid blue rail holds the school's navigation. The screen that is open is cut out of that rail in the page's own white, so the selected item runs straight into the sheet. The sheet stays plain white: no tinted canvas, no floating cards. Hairline rules, brand-blue column heads and soft tinted pills give the page its structure. Density suits people who scan rows of assignments at a desk: 14px body, tabular figures, a numbered row index, and one quiet action column.

The palette comes from the team's Figma variables (`--pcb-*`, `--sep-*` in `src/styles/tokens.css`), and Inter is the only typeface. Both are brand commitments, not choices made on this surface. The system has one accent, the rail blue, used for the rail, primary actions, active tabs, table heads and the current page number. Status gets a small set of soft color fields, and red appears only for danger and overdue dates.

The build rejects the earlier stack of floating cards on a tinted canvas with boxed, labeled filters. The sheet is one surface, and grouping comes from rules and tints rather than from lifted containers.

**Key Characteristics:**
- Solid rail-blue navigation with a white active pill and two concave corners that merge it into the page.
- White sheet, 1px hairlines, no canvas tint behind content.
- Full-width underline tabs, a one-row search-and-filter toolbar, and the primary action at the far right.
- Unframed list tables with brand-blue bold heads. The matrix grid is the one framed panel, with tinted head cells.
- Soft status pills that are scannable without being loud. An overdue date turns red and carries a "Quá hạn" flag.
- 10px radius on controls, 6px on pagination squares, 12px on panels and dialogs.

## Colors

This is a single-accent blue office palette on white. Tints of the same blue mark state, and four soft color fields carry workflow status.

### Primary
- **Rail Blue** (rail-blue): The navigation rail background, primary buttons, the active tab underline, table-head text, the brand text on links and the active nav pill, and the current pagination square. It darkens to rail-blue-hover and then rail-blue-active when a primary button is pressed.
- **Focus Blue** (focus-blue): The focus border on fields, the outline on focus-visible controls, the text caret, and the border of secondary buttons. Keyboard focus is also marked by a 3px ring at 32% of this color.

### Tertiary (status fields)
- **Amber Wait** (amber-soft / amber-ink): SUBMITTED, meaning the item waits on someone else. It also colors warning alerts and the "due today" flag.
- **Settled Green** (green-soft / green-ink): APPROVED and COMPLETED, plus success alerts.
- **Shelf Gray** (archive-soft / archive-ink): ARCHIVED.
- **Assigned Blue** (brand-soft with rail-blue text): ASSIGNED, meaning work is in progress. The same soft blue fills the user avatar.
- **Danger Red** (danger-ink / danger-soft): Destructive buttons and overdue due dates.
- **Error Red** (error-red): The field error border and error message.

### Neutral
- **Sheet White** (sheet-white): The page, the top bar, tables, panels and dialogs. It is also the color of the active nav pill, which is how the pill merges with the page.
- **Ledger Tint** (tint-panel): Read-only field values, disabled controls, matrix head cells, the matrix total row, the DRAFT pill, and info alerts.
- **Hover Tints** (tint-hover, tint-pressed, tint-row): Hover and pressed states for ghost and secondary buttons, icon buttons and pager squares, plus the table row hover.
- **Hairline** (hairline): Every 1px rule, including the top-bar bottom, tab track, table rows, field borders, panel frames and the pager top. hairline-hover is the border of a field under the pointer and the scrollbar thumb color.
- **Ink** (ink) and **Ink Secondary** (ink-secondary): Primary text, and secondary text such as sublines, inactive tabs, icons, hints and the row index. ink-placeholder is used only for placeholders.

### Named Rules
**The One Accent Rule.** Rail blue is the only saturated hue that does not signal status. Anything that needs attention and is not a status or a danger uses rail blue or nothing.

**The Status Field Rule.** Workflow status always appears as a soft pill: amber means it waits on someone else, green means done, blue means in progress, gray means shelved, and neutral means draft. Never show status as bare colored text.

**The Overdue Rule.** Only an overdue due date turns red. It stays in its column in danger-ink and carries a "Quá hạn" flag with an icon. The row is never tinted red.

## Typography

**Display Font:** Inter (with system-ui, sans-serif)
**Body Font:** Inter
**Icons:** Material Symbols Rounded (weight 400), addressed by ligature name

**Character:** One humanist sans at a few weights, set as a working typeface rather than an expressive one. Hierarchy comes from weight (400/500/600) and a narrow size range (12 to 22px). Numbers use tabular figures wherever they line up in columns.

### Hierarchy
- **Headline** (600, 22px/30px, -0.2px): The screen title in the top bar. On narrow screens it drops to 18px/26px.
- **Title** (600, 17px/24px): Section titles on detail and form screens. Dialog titles use 600 at 18px/26px.
- **Nav** (500, 15px/22px): Rail items and underline tabs. The active item goes to 600.
- **Body** (400, 14px/22px): Default text, cells and alerts.
- **Label** (500, 14px/20px): Field labels. Read-only values also use 500, and row-name links use 600.
- **Table head** (600, 14px/20px, rail blue): List table column heads. Matrix grid heads use 600 at 13px in ink-secondary.
- **Small** (400/500, 13px/20px): Sublines under row names and status pills (500).
- **Hint** (400, 12px/18px): Field hints, errors, grid-input labels and due-date flags (500, 12px/16px).

### Named Rules
**The Tabular Figures Rule.** Table cells, read-only values and pager numbers set `font-variant-numeric: tabular-nums`. Counts, percentages and dates must line up down a column.

## Layout

The shell is a flex row. On the left is a sticky rail 264px wide and 100vh tall. The user can collapse it to 84px, and the choice persists in localStorage. Below 900px the rail is forced to icon-only at 72px and the collapse toggle is hidden. The main column starts with a sticky 64px top bar: back button (when present), title and optional status pill on the left, avatar with name and role on the right. The page below it is a vertical stack with a 20px gap and 16px 32px 40px padding (12px 16px 32px below 900px).

A list screen follows a fixed order: underline tabs across the full width, then the toolbar, then the table, then the pager. The toolbar puts search and compact filters on one wrapping row. Filter controls size to their content (search 200px, filters at least 104px) and are 40px tall. Actions stay at the far right and never shrink. Below 900px the toolbar stacks, with actions on top and one filter per row.

Detail and form screens use a label-above field grid. The field grid has 4 columns with a 20px 24px gap, dropping to 2 columns at 1200px and 1 column at 900px. The academic-context grid has 5 columns, dropping to 3 and then 1 at the same breakpoints. Page actions sit in a row aligned right, with secondary actions pushed to the left. Below 900px each button takes an equal share of the row.

Spacing is built on 8/12/16 (`--pcb-spacing-xs/sm/md`), with 20 and 24 as section gaps and 32 as the desktop page gutter. Tables scroll horizontally below 900px (list tables are at least 760px wide, and the matrix grid is at least 900px) rather than squeezing their columns.

The pager is sticky at the bottom of the viewport above 900px. Below 900px it is static and stacks.

## Elevation & Depth

The system is flat. The sheet, tables, panels, fields and the rail have no shadow. Depth comes from hairlines and from the tint steps (white, tint-row, tint-panel, tint-hover, tint-pressed). Shadows appear only on surfaces that float above the page.

### Shadow Vocabulary
- **Menu lift** (`box-shadow: 0 10px 24px rgba(34, 79, 125, .16)`): Custom select dropdown menus.
- **Dialog lift** (`box-shadow: 0 18px 48px rgba(20, 61, 107, .22)`): Modal dialogs, over a `rgba(20, 61, 107, .35)` backdrop.
- **Focus ring** (`box-shadow: 0 0 0 3px rgba(74, 144, 226, .32)`): The focus state on fields and textareas. It marks state, not elevation.

### Named Rules
**The Flat Sheet Rule.** Nothing that sits on the page casts a shadow. A shadow means the surface floats above the page and will close.

## Shapes

Corners are gently rounded and grow with the size of the object. Pagination squares are 6px. Small buttons, row icon buttons, pager selects and alert buttons are 8px. Standard buttons, fields, read-only values, cards, alerts and textareas are 10px. The matrix panel and dialogs are 12px. Status pills and avatars are fully round.

The one distinctive shape is the active rail item. It is a white pill rounded only on the left (20px), flush against the rail's right edge. Two 20px concave corners, drawn with radial gradients, sit above and below it, so the pill reads as part of the page rather than a chip on the rail. The active tab underline is a 2px rail-blue bar with 2px rounded top corners, inset 8% from each side of the tab.

Borders are always 1px. The one exception is the rail's circular collapse toggle, which uses a 1.5px white stroke at 80%.

## Components

### Buttons
Buttons are firm and plainly labeled, with no shadows.
- **Shape:** 10px radius, 44px tall, at least 100px wide, 16px horizontal padding, Inter 600 at 14px/20px, 8px icon gap. In the toolbar they are 40px tall.
- **Primary:** Rail blue with white text. Hover and press step to rail-blue-hover and rail-blue-active.
- **Secondary:** White with a focus-blue 1px border and rail-blue text. Hover goes to tint-hover, press to tint-pressed.
- **Ghost:** White, borderless, rail-blue text, same hover and press tints. Used for inline actions like "Sửa".
- **Danger:** White, borderless, danger-ink text, with a danger-soft hover. It must never look like the Cancel button next to it.
- **Small:** 34px tall, 8px radius, 13px text, no minimum width. Used in table cells and pagers.
- **Focus / Disabled:** Focus is a 2px focus-blue outline at 2px offset. Disabled buttons drop to 50% opacity with a not-allowed cursor.

### Status Pills
- **Style:** Fully round, 2px 10px padding, Inter 500 at 13px/20px, no border. The fill and text pairs are listed in Colors under the Status Field Rule.
- **Placement:** In the status column, and after the title in the top bar on detail screens.

### Cards / Containers
- **Matrix panel:** A 12px radius, a 1px hairline frame and a white fill. The inner table has tinted head cells (tint-panel, ink-secondary, 13px/600), vertical hairlines between cells, row-head cells tinted like the heads, a tinted total row and no row hover. A footer strip sits below it, separated by a hairline.
- **List tables:** No frame. Rail-blue 600 heads above a hairline, 14px 16px cells aligned to the top, hairlines between rows, and a tint-row hover. There is a narrow 56px centered STT column, and the action column shrinks to fit its icons.
- **Alerts:** A 10px radius, a 1px border and a 12px 14px pad in four tones: danger (default), info (tint-panel), warn (amber) and success (green). Buttons inside an alert are 30px tall, transparent, and take the alert's text color for their border.

### Inputs / Fields
- **Style:** 44px tall (40 in the toolbar, 38 in the matrix grid), 10px radius, 1px hairline border, white fill, 12px horizontal padding. The label sits 8px above the control in Inter 500 at 14px. Toolbar filters have visually hidden labels that screen readers still read.
- **Hover / Focus:** On hover the border goes to hairline-hover. On focus it goes to focus-blue and adds the 3px focus ring. Transitions run at 150ms ease.
- **Error / Disabled:** Error sets the border to error-red and adds a 12px error line. Disabled fills the whole control with tint-panel, shows the text in ink-secondary and halves the icon opacity.
- **Select menu:** Fixed position, 10px radius, 6px inner padding, 38px options with a 7px radius, and a soft-blue fill on hover and selected. It uses the menu lift shadow.
- **Read-only field:** Same size and radius as an input, filled with tint-panel and a hairline border, text in Inter 500. Long text values keep line breaks and switch to weight 400.

### Navigation
- **Rail:** Rail-blue background with white text. The brand block is 72px tall and holds a 44px round logo and the school name at 600, 15px. Items are 40px rows with a 22px icon, a 14px gap and Inter 500 at 15px. Hover is white at 12%. Inert items (screens not built yet) show at 72% white with no hover, keep the "(sắp có)" title, and can't be clicked.
- **Active item:** The white left-rounded pill with concave corners described in Shapes. Its text is rail blue at weight 600.
- **Collapsed / narrow:** Icons only, centered. Clicking a group while collapsed expands the rail first.
- **Top bar:** Sticky, 64px, white with a hairline bottom. Holds the title (Headline role) on the left and a 36px round brand-soft avatar with name and role on the right.
- **Underline tabs:** Tabs share the full width equally, are 46px tall, and use Inter 500 at 15px in ink-secondary. Hover tints to tint-row. The active tab is rail blue at 600 with a 2px underline. Below 900px the tab row scrolls horizontally.

### Pager
The pager is a strip at the foot of every list, sticky on desktop. On the left: "Hiển thị" [an 84px select, 34px tall, 8px radius] "bản ghi / trang", then a total count set off by a hairline. On the right: previous/next steps and numbered 32px squares with a 6px radius. The current page is filled rail blue with white text. Other pages tint on hover.

### Row Actions
Row actions are 34px transparent icon links with an 8px radius and a 20px icon in ink-secondary. On hover the icon turns rail blue on tint-hover. They only navigate (view, open matrix), so they are links, not buttons. The row name is a 600-weight ink link that underlines in rail blue on hover.

### Empty and Loading
An empty table shows a centered message with 48px vertical padding and a 15px/500 ink title over secondary text. While loading, skeleton rows keep the table's shape with a 14px shimmer bar. The shimmer is removed under reduced motion.

## Do's and Don'ts

### Do:
- **Do** take every color from `src/styles/tokens.css`. The palette and Inter are the team's Figma commitments.
- **Do** mark the current screen with the white rail pill and its concave corners, and nothing else.
- **Do** use rail-blue 600 heads, a 56px STT column and a shrink-to-fit icon column on list tables.
- **Do** show workflow status only through the soft status pills, and overdue dates through the red date plus the "Quá hạn" flag.
- **Do** use 44px controls on forms, 40px in toolbars, and 34px for row actions and small buttons.
- **Do** keep the pager sticky at the bottom on desktop so paging works without scrolling.
- **Do** show Figma features that are not built yet as disabled or inert with a "Sắp có" title, never as working controls.

### Don't:
- **Don't** put a tinted canvas behind the sheet or float shadowed cards on it. Group content with hairlines and tint-panel.
- **Don't** use a shadow on anything that sits on the page. Shadows are for menus and dialogs only.
- **Don't** introduce a second accent hue, or reuse the red of the StarMath reference screenshots.
- **Don't** tint whole rows for status or lateness.
- **Don't** make a destructive button look like the neutral button beside it.
