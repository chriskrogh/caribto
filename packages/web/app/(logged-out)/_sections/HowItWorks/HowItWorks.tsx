import { detectCountry } from "../../_lib/currency";

import { Steps } from "./Steps";

export const HowItWorks: React.FC = async () => {
  const country = await detectCountry();
  return <Steps country={country} />;
};
