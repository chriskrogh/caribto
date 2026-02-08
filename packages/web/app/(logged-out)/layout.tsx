import { ThemeProvider } from "@/_components/ThemeProvider";

import { Footer } from "./_lib/Footer";
import { getTotalHeaderHeight, Header } from "./_lib/Header";

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <Header />
      <div
        className="relative pb-20"
        style={{
          minHeight: `calc(100vh - ${getTotalHeaderHeight() + 6}px)`,
        }}
      >
        {children}
        <div className="absolute bottom-0 left-0 right-0">
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Layout;
