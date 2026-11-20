# Mobile App Shell Design

**Intent:** Make DescoWise feel like a real mobile app by giving the account list a persistent app bar, drawer-based utilities, and bottom navigation while preserving the existing account and dashboard routes.

**Goals:** Make the primary action—opening an account—obvious; keep utilities reachable without desktop-style toolbars; provide comfortable mobile safe-area spacing; preserve all existing handlers and desktop layout.

**Non-goals:** No changes to account data, dashboard analytics, authentication, or desktop navigation behavior.

**Approaches:** (1) Add a drawer and bottom navigation around the existing list, (2) replace the app with separate tab routes, or (3) redesign every screen at once. Option 1 is selected because it gives the app-native structure with the least route and data risk.

**Structure:** The account list becomes the Home surface. The top app bar opens a right-side utility drawer for AI settings, notifications, help, and language. A fixed mobile bottom bar exposes Home, Notifications, Add account, Help, and Menu. Account detail remains a pushed route with its existing back button. Desktop keeps the current toolbar and footer.
