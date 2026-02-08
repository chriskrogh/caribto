/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

async function loadGoogleFont(font: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status == 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error("failed to load font data");
}

export async function GET(request: Request) {
  const baseUrl = getBaseUrl();
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const description = searchParams.get("description");

  const displayTitle = title || "Crypto for the Caribbean";
  const fullDescription =
    description ||
    "Buy USDC with your local Caribbean currency. Fast, secure, and delivered straight to your wallet.";
  const displayDescription =
    fullDescription.length > 70
      ? fullDescription.substring(0, 70) + "..."
      : fullDescription;

  return new ImageResponse(
    (
      <div tw="relative h-full w-full flex" style={{ fontFamily: "Manrope" }}>
        <img
          alt="Caribto"
          src={`${baseUrl}/og/bg.png`}
          width={1200}
          height={630}
          tw="absolute top-0 left-0 bottom-0 right-0"
        />
        <div tw="absolute top-0 left-0 bottom-0 right-0 flex flex-col items-center justify-center gap-4">
          <h1 tw="text-white text-6xl font-extrabold text-center max-w-[1000px]">
            {displayTitle}
          </h1>
          <h5 tw="text-white text-3xl text-center max-w-[560px]">
            {displayDescription}
          </h5>
        </div>
        <div tw="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 pb-12">
          <h3 tw="text-white text-4xl font-extrabold">Caribto</h3>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Manrope",
          data: await loadGoogleFont("Manrope"),
          style: "normal",
        },
      ],
    }
  );
}

const getBaseUrl = () => {
  switch (process.env.NEXT_PUBLIC_ENVIRONMENT) {
    case "production":
      return "https://www.caribto.com";
    case "preview":
      return "https://caribto-preview.vercel.app";
    case "development":
    default:
      return "http://localhost:3000";
  }
};
