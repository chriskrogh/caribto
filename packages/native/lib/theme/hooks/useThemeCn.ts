import { useTheme } from "../context";

type Arg = {
  light: string;
  dark: string;
};

export const useThemeCn = () => {
  const { isDark } = useTheme();
  return (arg: Arg) => (isDark ? arg.dark : arg.light);
};
