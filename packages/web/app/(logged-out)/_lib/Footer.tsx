import { cn } from "@shared/utils/cn";
import Link from "next/link";
import { FaXTwitter } from "react-icons/fa6";

import { Button } from "@/_components/ui/button";

const PADDING_BOTTOM = 32;
export const getTotalFooterHeight = () => {
  return 50 + PADDING_BOTTOM;
};

const VingsLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="458"
    height="504"
    viewBox="0 0 458 504"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M186.652 395.515L1.66765 161.201C-0.824562 158.044 2.37729 153.596 6.16167 154.958L133.277 200.706C134.011 200.97 134.652 201.443 135.12 202.066L220.122 315.149C220.931 316.226 221.144 317.637 220.689 318.905L193.556 394.389C192.494 397.344 188.598 397.979 186.652 395.515Z"
      fill="#5068B8"
    />
    <path
      d="M274.805 502.513L201.475 413.007C200.592 411.929 200.333 410.469 200.792 409.154L318.405 72.0742C318.739 71.1177 319.423 70.3234 320.319 69.8518L451.668 0.758595C454.89 -0.936026 458.517 2.20353 457.301 5.63458L281.67 501.314C280.629 504.25 276.779 504.923 274.805 502.513Z"
      fill="#5068B8"
    />
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-4 px-6",
      )}
      style={{ paddingBottom: PADDING_BOTTOM }}
    >
      <div className="flex items-center">
        <Button variant="link" asChild>
          <Link href="https://x.com/caribto">
            <FaXTwitter />
          </Link>
        </Button>
        <Button variant="link" asChild>
          <Link href="/terms-and-conditions">Terms and Conditions</Link>
        </Button>
        <Button variant="link" asChild>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </Button>
      </div>
      <Link
        href="https://vin.gs"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        a <VingsLogo className="h-4 w-auto" /> Vings product
      </Link>
    </div>
  );
};
