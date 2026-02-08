import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

function HelloWorld() {
  return <Text>Hello, world!</Text>;
}

describe("HelloWorld", () => {
  it("renders the expected text", () => {
    render(<HelloWorld />);
    expect(screen.getByText("Hello, world!")).toBeTruthy();
  });
});
