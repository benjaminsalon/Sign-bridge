# Phase 4: Showing SignWriting Notation on Screen

## Objective
Implement the display of SignWriting notation (FSW text) visually on the frontend screen using the existing SignWriting web components.

## Background
- The SignWriting notation is received from the backend as a string of FSW tokens.
- The '@sutton-signwriting/sgnw-components' package provides custom web components such as `<fsw-sign>` to render SignWriting visually.
- Fonts for SignWriting must be loaded for proper display.
- The Angular example subscribes to a store for SignWriting objects and renders `<fsw-sign>` elements with tooltips and interaction.

## Implementation Steps

1. **Install SignWriting Web Components**
   - Add `@sutton-signwriting/sgnw-components` package to the frontend dependencies.
   - Ensure the package is loaded dynamically or imported in the React app.

2. **Load SignWriting Fonts**
   - Use the `@sutton-signwriting/font-ttf` package to load SignWriting fonts asynchronously.
   - Load fonts on app initialization or before rendering SignWriting components.

3. **Normalize FSW Tokens**
   - Use the `@sutton-signwriting/font-ttf/fsw` module to normalize FSW tokens if needed.
   - This ensures consistent rendering and compatibility with the web components.

4. **Create a React Component for SignWriting Display**
   - Create a new React component, e.g., `SignWritingDisplay`.
   - Accept props: an array of FSW tokens or a single FSW string.
   - Dynamically load the SignWriting web components if not already loaded.
   - Render a container div.
   - For each FSW token, render an `<fsw-sign>` element with the `sign` attribute set to the token.
   - Optionally add tooltips or interaction handlers (e.g., onDoubleClick).

5. **Integrate the SignWritingDisplay Component**
   - Import and use `SignWritingDisplay` in the main app or wherever SignWriting notation is to be shown.
   - Pass the SignWriting tokens received from the backend to this component.

6. **Styling and Responsiveness**
   - Apply CSS styles to the container and `<fsw-sign>` elements for layout and responsiveness.
   - Support dark mode if applicable.

7. **Testing**
   - Test with various SignWriting strings to ensure correct rendering.
   - Verify font loading and fallback behavior.
   - Test interaction handlers if implemented.

## Deliverables
- React component for SignWriting display using web components.
- Font loading logic integrated into the frontend.
- Proper rendering of SignWriting notation on screen.
- Documentation of usage and integration.

## References
- [@sutton-signwriting/sgnw-components](https://www.npmjs.com/package/@sutton-signwriting/sgnw-components)
- [@sutton-signwriting/font-ttf](https://www.npmjs.com/package/@sutton-signwriting/font-ttf)
- Angular example: `translate/src/app/pages/translate/signwriting/sign-writing.component.ts` and `.html`
