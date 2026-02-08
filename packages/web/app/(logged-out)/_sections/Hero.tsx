import { Typography } from "@/_components/ui/typography";

export const Hero: React.FC = () => {
  return (
    <section className="flex w-full flex-col items-center gap-4 px-6 pt-16 pb-8 text-center sm:px-8 sm:pt-24 sm:pb-12">
      <Typography
        as="h1"
        className="max-w-2xl text-5xl sm:text-6xl lg:text-7xl"
      >
        <span className="slate-text">Crypto</span> for the{" "}
        <span className="text-teal-200">Caribbean</span>
      </Typography>
      <Typography
        as="p"
        className="max-w-lg text-lg text-muted-foreground sm:text-xl"
      >
        Buy USDC with your local currency. Fast, secure, and delivered straight
        to your wallet.
      </Typography>
    </section>
  );
};
