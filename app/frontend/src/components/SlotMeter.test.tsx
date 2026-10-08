import { render, screen } from "@testing-library/react";
import SlotMeter from "./SlotMeter";

function filledSegments() {
  return screen.getByRole("img").querySelectorAll("[data-used='true']").length;
}

describe("SlotMeter", () => {
  it.each([
    [0, 5],
    [3, 5],
    [5, 5],
  ])("fills %i of %i segments", (used, total) => {
    render(<SlotMeter used={used} total={total} />);

    expect(screen.getByRole("img", { name: `${used} of ${total} slots in use` })).toBeInTheDocument();
    expect(filledSegments()).toBe(used);
    expect(screen.getByRole("img").children).toHaveLength(total);
  });

  it("shows the caption when given one", () => {
    render(<SlotMeter used={1} total={5} caption="A slot frees up later." />);

    expect(screen.getByText("A slot frees up later.")).toBeInTheDocument();
  });
});
