import Image from "next/image";
import Link from "next/link";

import { Typography } from "@/_components/ui/typography";
import logo from "@/logo.svg";

const HEADER_HEIGHT = 64;
export const getTotalHeaderHeight = () => {
  return HEADER_HEIGHT;
};

export const Header: React.FC = () => {
  return (
    <div className="sticky top-0 z-[60] border-b shadow-sm">
      <div
        className="flex w-full items-center justify-between bg-background px-4 sm:px-6"
        style={{ height: HEADER_HEIGHT }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image src={logo} alt="Caribto" width={28} height={28} />
          <Typography as="h4">Caribto</Typography>
        </Link>
      </div>
    </div>
  );
};
