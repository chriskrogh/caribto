import { getExchangeRates } from "@server/models/exchange-rate/get";
import { setExchangeRates } from "@server/models/exchange-rate/set";
import { fetchExchangeRates } from "@server/utils/exchange-rate";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch existing and new exchange rates
    const [existingRates, newRates] = await Promise.all([
      getExchangeRates({ admin: true }),
      fetchExchangeRates(),
    ]);

    let ratesToUpdate;
    let processedCount = 0;

    if (existingRates.length === 0) {
      // No existing rates, insert all new rates
      ratesToUpdate = newRates;
      processedCount = newRates.length;
    } else {
      // Update existing rates with new values
      ratesToUpdate = existingRates.map((rate) => {
        const newRate = newRates.find(
          (r) => r.source === rate.source && r.target === rate.target
        );
        if (newRate) {
          processedCount++;
          return {
            ...rate,
            rate: newRate.rate,
          };
        }
        return rate;
      });
    }

    // Update exchange rates in database
    await setExchangeRates(ratesToUpdate);

    const result = {
      success: true,
      processedCount,
      totalRates: ratesToUpdate.length,
      hasExistingRates: existingRates.length > 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        processedCount: 0,
        totalRates: 0,
      },
      { status: 500 }
    );
  }
}
