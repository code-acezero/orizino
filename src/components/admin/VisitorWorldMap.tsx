import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Map ISO_A2 codes to TopoJSON numeric IDs isn't reliable,
// so we map via ISO_A3 which is available in the TopoJSON properties.
// We need ISO_A2 (from our analytics) → ISO_A3 for matching.
const iso2ToIso3: Record<string, string> = {
  AF:"AFG",AL:"ALB",DZ:"DZA",AD:"AND",AO:"AGO",AG:"ATG",AR:"ARG",AM:"ARM",
  AU:"AUS",AT:"AUT",AZ:"AZE",BS:"BHS",BH:"BHR",BD:"BGD",BB:"BRB",BY:"BLR",
  BE:"BEL",BZ:"BLZ",BJ:"BEN",BT:"BTN",BO:"BOL",BA:"BIH",BW:"BWA",BR:"BRA",
  BN:"BRN",BG:"BGR",BF:"BFA",BI:"BDI",KH:"KHM",CM:"CMR",CA:"CAN",CV:"CPV",
  CF:"CAF",TD:"TCD",CL:"CHL",CN:"CHN",CO:"COL",KM:"COM",CG:"COG",CD:"COD",
  CR:"CRI",CI:"CIV",HR:"HRV",CU:"CUB",CY:"CYP",CZ:"CZE",DK:"DNK",DJ:"DJI",
  DM:"DMA",DO:"DOM",EC:"ECU",EG:"EGY",SV:"SLV",GQ:"GNQ",ER:"ERI",EE:"EST",
  SZ:"SWZ",ET:"ETH",FJ:"FJI",FI:"FIN",FR:"FRA",GA:"GAB",GM:"GMB",GE:"GEO",
  DE:"DEU",GH:"GHA",GR:"GRC",GD:"GRD",GT:"GTM",GN:"GIN",GW:"GNB",GY:"GUY",
  HT:"HTI",HN:"HND",HU:"HUN",IS:"ISL",IN:"IND",ID:"IDN",IR:"IRN",IQ:"IRQ",
  IE:"IRL",IL:"ISR",IT:"ITA",JM:"JAM",JP:"JPN",JO:"JOR",KZ:"KAZ",KE:"KEN",
  KI:"KIR",KP:"PRK",KR:"KOR",KW:"KWT",KG:"KGZ",LA:"LAO",LV:"LVA",LB:"LBN",
  LS:"LSO",LR:"LBR",LY:"LBY",LI:"LIE",LT:"LTU",LU:"LUX",MG:"MDG",MW:"MWI",
  MY:"MYS",MV:"MDV",ML:"MLI",MT:"MLT",MH:"MHL",MR:"MRT",MU:"MUS",MX:"MEX",
  FM:"FSM",MD:"MDA",MC:"MCO",MN:"MNG",ME:"MNE",MA:"MAR",MZ:"MOZ",MM:"MMR",
  NA:"NAM",NR:"NRU",NP:"NPL",NL:"NLD",NZ:"NZL",NI:"NIC",NE:"NER",NG:"NGA",
  MK:"MKD",NO:"NOR",OM:"OMN",PK:"PAK",PW:"PLW",PS:"PSE",PA:"PAN",PG:"PNG",
  PY:"PRY",PE:"PER",PH:"PHL",PL:"POL",PT:"PRT",QA:"QAT",RO:"ROU",RU:"RUS",
  RW:"RWA",KN:"KNA",LC:"LCA",VC:"VCT",WS:"WSM",SM:"SMR",ST:"STP",SA:"SAU",
  SN:"SEN",RS:"SRB",SC:"SYC",SL:"SLE",SG:"SGP",SK:"SVK",SI:"SVN",SB:"SLB",
  SO:"SOM",ZA:"ZAF",SS:"SSD",ES:"ESP",LK:"LKA",SD:"SDN",SR:"SUR",SE:"SWE",
  CH:"CHE",SY:"SYR",TW:"TWN",TJ:"TJK",TZ:"TZA",TH:"THA",TL:"TLS",TG:"TGO",
  TO:"TON",TT:"TTO",TN:"TUN",TR:"TUR",TM:"TKM",TV:"TUV",UG:"UGA",UA:"UKR",
  AE:"ARE",GB:"GBR",US:"USA",UY:"URY",UZ:"UZB",VU:"VUT",VE:"VEN",VN:"VNM",
  YE:"YEM",ZM:"ZMB",ZW:"ZWE",XK:"XKX",
};

interface VisitorWorldMapProps {
  countryData: Record<string, { count: number; name: string }>;
}

const VisitorWorldMap: React.FC<VisitorWorldMapProps> = ({ countryData }) => {
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  // Build a ISO_A3 lookup for fast matching
  const iso3Data = useMemo(() => {
    const map: Record<string, { count: number; name: string }> = {};
    Object.entries(countryData).forEach(([code2, data]) => {
      const code3 = iso2ToIso3[code2];
      if (code3) map[code3] = data;
    });
    return map;
  }, [countryData]);

  const maxVisitors = useMemo(
    () => Math.max(...Object.values(countryData).map((d) => d.count), 1),
    [countryData]
  );

  const getCountryColor = (iso3: string) => {
    const data = iso3Data[iso3];
    if (!data) return "hsl(var(--secondary) / 0.3)";
    const intensity = Math.max(0.25, data.count / maxVisitors);
    return `hsl(var(--primary) / ${intensity})`;
  };

  const hasData = Object.keys(countryData).length > 0;

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Visitor World Map
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.min(z * 1.5, 8))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.max(z / 1.5, 1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setZoom(1);
                setCenter([0, 20]);
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {!hasData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-xl">
            <p className="text-muted-foreground text-sm">
              No geographic data yet. Visit the homepage to generate geo-tracked events.
            </p>
          </div>
        )}

        {/* Tooltip */}
        {tooltipContent && (
          <div
            className="absolute z-20 pointer-events-none glass-strong rounded-lg px-3 py-2 text-xs text-foreground shadow-lg border border-border/50"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translate(-50%, -120%)",
            }}
          >
            {tooltipContent}
          </div>
        )}

        <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--secondary) / 0.15)" }}>
          <ComposableMap
            projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
            height={380}
            style={{ width: "100%", height: "auto" }}
          >
            <ZoomableGroup
              zoom={zoom}
              center={center}
              onMoveEnd={({ coordinates, zoom: z }) => {
                setCenter(coordinates as [number, number]);
                setZoom(z);
              }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const iso3 = geo.properties.ISO_A3 || geo.id;
                    const data = iso3Data[iso3];
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getCountryColor(iso3)}
                        stroke="hsl(var(--border))"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none", transition: "fill 0.2s" },
                          hover: {
                            outline: "none",
                            fill: data
                              ? "hsl(var(--primary))"
                              : "hsl(var(--secondary) / 0.5)",
                            cursor: data ? "pointer" : "default",
                          },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(evt) => {
                          const name = geo.properties.name || geo.properties.NAME || iso3;
                          if (data) {
                            setTooltipContent(
                              `${countryFlag(data.name)} ${data.name}: ${data.count} event${data.count !== 1 ? "s" : ""}`
                            );
                          } else {
                            setTooltipContent(name);
                          }
                          const rect = (evt.target as SVGElement).closest("svg")?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPos({
                              x: evt.clientX - rect.left,
                              y: evt.clientY - rect.top,
                            });
                          }
                        }}
                        onMouseMove={(evt) => {
                          const rect = (evt.target as SVGElement).closest("svg")?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPos({
                              x: evt.clientX - rect.left,
                              y: evt.clientY - rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setTooltipContent("")}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* Legend */}
        {hasData && (
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="text-[11px] text-muted-foreground">Less</span>
            <div className="flex gap-0.5">
              {[0.15, 0.3, 0.5, 0.7, 1].map((opacity) => (
                <div
                  key={opacity}
                  className="w-6 h-3 rounded-sm"
                  style={{ background: `hsl(var(--primary) / ${opacity})` }}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">More</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/** Find the 2-letter code from the country name for flag emoji */
const countryFlag = (name: string) => {
  // Simple lookup - we just return a globe since we have the name not code here
  return "🌍";
};

export default VisitorWorldMap;
