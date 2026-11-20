# Floating Info and DESCO Sign-out Spacing

**Intent:** Prevent the floating info button from overlapping the fixed DESCO sign-out button in the authenticated dashboard.

**Goals:** Keep both controls visible and clickable at desktop and mobile widths, with a small consistent vertical gap.

**Non-goals:** No changes to account-card layout, sign-out behavior, info-popover content, or z-index behavior.

**Approaches:** The considered options were (1) move the sign-out control, (2) conditionally coordinate both controls through React state, or (3) reserve a higher bottom offset for the info control. Option 3 is selected because the controls already have stable fixed positioning and the overlap is purely spatial; it is the smallest change with no runtime coupling.

**Implementation:** Increase the floating info button's bottom offset in `index.css` and the matching inline stylesheet in `index.html`. Preserve the existing responsive right offsets and use a slightly smaller reserved offset on narrow screens.
