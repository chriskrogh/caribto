import { connection } from "next/server";

import { detectCountry } from "../../_lib/currency";

import { Steps } from "./Steps";

export const HowItWorks: React.FC = async () => {
  await connection();

  const country = await detectCountry();
  return <Steps country={country} />;
};
