import "@testing-library/jest-dom/vitest";

// jsdom does not lay out the page, so it has no scrollIntoView
Element.prototype.scrollIntoView = vi.fn();
