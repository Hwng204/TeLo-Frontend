---
version: 1
slug: "src-features-matrix"
primary_target: "src/features/matrix"
related_targets: ["src/layouts/MatrixLayout.tsx"]
---

# Surface brief: Ma trận đề (PHT + Tổ trưởng)

Scope: every screen under MatrixLayout — shell (sidebar + top bar), matrix list, matrix detail, matrix editor/review, task list, task assign, task detail. Mode: Operate.

Audience/job: PHT reviews, confirms, archives, exports matrices and assigns matrix tasks; Tổ trưởng works their assigned tasks and submits matrices. Success = at a glance they see what waits on them, what is overdue, what is done.

Constraints: user pinned the layout format (StarMath reference screenshots: solid sidebar whose selected item merges into the page, top bar, underline tabs, one-row search+filter toolbar with primary action at right, clean table with bold colored heads, STT and action icons, rows-per-page + numbered pagination footer, label-above field grid on detail/form screens, matrix table in a thin framed panel with tinted head cells). Colors must stay on the codebase tokens (blue), not the reference red. Business behavior must not change. Row actions are navigation-only (Xem; Tổ trưởng: Lập/Mở ma trận; PHT: Mở ma trận once submitted). PHT sidebar gains "Nhiệm vụ đã giao" → /matrix-tasks. No bell/notifications, no activity tab (no data behind them).

## Direction contract

THESIS: A school office ledger rendered as a StarMath-format console: one solid blue rail, the chosen screen carved out of it in the sheet's white so navigation visibly continues into the page. Refuses the current stack of floating cards on a tinted canvas with labeled filter boxes.

OWN-WORLD: Rail #2f6fb0 (pcb accent) with white type; sheet #fff; hairlines #dce6f0; tinted panels #f1f6fc; brand text #2f6fb0 for table heads, active tab, page links; status as soft tinted pills (existing sep-status family) plus a red-text overdue marker; Inter, Material Symbols Rounded, 10px radius controls, 6px pagination squares.

STORY: Open a list, read the status tabs, scan rows by STT, name, owner, due, status; overdue rows announce themselves; one click opens the row or its matrix.

FIRST VIEWPORT: rail left (264px, collapsible to 84px); top bar 64px with page title left and role/user at right; underline tabs full width; toolbar row (search 260px, compact filters, primary "+" action at far right); table fills the rest; footer with "Hiển thị [10] bản ghi / trang" left and numbered pager right.

FORM: brief-pinned (user-supplied reference screenshots), no concept roll; code-led (no image generation in this harness).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
