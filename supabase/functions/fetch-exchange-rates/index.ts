import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current currency config
    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "currency_config")
      .maybeSingle();

    const config = settingsRow?.value
      ? (settingsRow.value as any)?.value ?? settingsRow.value
      : { default_currency: "BDT", enabled_currencies: ["BDT"], exchange_rates: {} };

    const baseCurrency = config.default_currency || "BDT";
    const enabledCurrencies: string[] = config.enabled_currencies || [];

    // Fetch rates from free API (no key required)
    const apiUrl = `https://open.er-api.com/v6/latest/${baseCurrency}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.result !== "success" || !data.rates) {
      throw new Error("Invalid response from exchange rate API");
    }

    // Build exchange rates for enabled currencies only
    const newRates: Record<string, number> = {};
    for (const code of enabledCurrencies) {
      if (code === baseCurrency) continue;
      if (data.rates[code]) {
        // Round to 6 decimal places
        newRates[code] = Math.round(data.rates[code] * 1_000_000) / 1_000_000;
      }
    }

    // Update config with new rates and timestamp
    const updatedConfig = {
      ...config,
      exchange_rates: newRates,
      rates_last_updated: new Date().toISOString(),
      rates_source: "open.er-api.com",
    };

    const jsonValue = { value: updatedConfig } as any;

    if (settingsRow) {
      await supabase
        .from("site_settings")
        .update({ value: jsonValue })
        .eq("id", settingsRow.id);
    } else {
      await supabase
        .from("site_settings")
        .insert({ key: "currency_config", value: jsonValue });
    }

    return new Response(
      JSON.stringify({
        success: true,
        base: baseCurrency,
        rates: newRates,
        updated_at: updatedConfig.rates_last_updated,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error fetching exchange rates:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
