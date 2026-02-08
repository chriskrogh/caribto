import { colors } from "../colors";
import { useTheme } from "../context";

export const useThemeColor = () => {
  const { isDark } = useTheme();
  return (colorName: keyof typeof colors) =>
    isDark ? colors[colorName].dark : colors[colorName].DEFAULT;
};
