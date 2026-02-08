import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

function HelloWorld() {
  return <p>Hello, world!</p>;
}

describe("HelloWorld", () => {
  it("renders the expected text", () => {
    render(<HelloWorld />);
    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
  });
});
