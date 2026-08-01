---
name: ui-components
description: Design standards, state management, glassmorphism aesthetics, and accessibility guidelines for React 19 UI components.
---

# UI Components Skill

## Scope & Applicability
Applies when creating or modifying React 19 components in `src/components/`, `src/App.tsx`, `src/index.css`, `src/App.css`, or updating `AppContext.tsx`.

## Core Rules & Constraints
- **Rich Visual Aesthetics**: Follow the design system—vibrant HSL colors, smooth dark mode, glassmorphism containers, modern typography, and subtle micro-animations.
- **State Efficiency**: Manage shared application state in `AppContext.tsx` using React 19 hooks cleanly without unnecessary re-renders.
- **Accessibility & Identification**: Ensure semantic HTML5 elements are used. All interactive elements must have unique, descriptive `id` attributes.
- **No Hardcoded Layout Math**: Avoid arbitrary static pixel offsets when calculating dynamic container bounds.

## Verification Checklist
- [ ] UI layout responsive and tested on both desktop and mobile viewports.
- [ ] All interactive buttons and inputs have unique, descriptive `id` attributes.
- [ ] Styling relies on CSS custom properties in `index.css` rather than ad-hoc inline styles.
