import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import satori from "https://esm.sh/satori@0.10.14";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

let wasmInitialized = false;

async function ensureWasm() {
  if (wasmInitialized) return;
  const wasmRes = await fetch(
    "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm"
  );
  await initWasm(wasmRes);
  wasmInitialized = true;
}

// Fetch fonts - use Noto Sans TTF from Google Fonts (satori needs ttf/woff, not woff2)
let fontData: ArrayBuffer | null = null;
async function getFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;
  const res = await fetch(
    "https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf"
  );
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
  fontData = await res.arrayBuffer();
  return fontData;
}

function truncate(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.substring(0, max - 1) + "…" : str;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

interface OgData {
  type: "product" | "category";
  title: string;
  description: string;
  image?: string;
  price?: number;
  comparePrice?: number;
  rating?: number;
  reviewCount?: number;
  categoryName?: string;
}

function buildProductLayout(data: OgData) {
  const hasDiscount =
    data.comparePrice && data.price && data.comparePrice > data.price;
  const discount = hasDiscount
    ? Math.round(
        ((data.comparePrice! - data.price!) / data.comparePrice!) * 100
      )
    : 0;

  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0d1117 100%)",
        fontFamily: "Inter",
        position: "relative",
        overflow: "hidden",
      },
      children: [
        // Background decoration
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
            },
          },
        },
        // Left: Product image
        data.image
          ? {
              type: "div",
              props: {
                style: {
                  width: "480px",
                  height: "630px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px",
                },
                children: [
                  {
                    type: "img",
                    props: {
                      src: data.image,
                      width: 400,
                      height: 400,
                      style: {
                        borderRadius: "24px",
                        objectFit: "cover",
                        border: "2px solid rgba(255,255,255,0.1)",
                      },
                    },
                  },
                ],
              },
            }
          : {
              type: "div",
              props: {
                style: {
                  width: "480px",
                  height: "630px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "400px",
                        height: "400px",
                        borderRadius: "24px",
                        background: "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "120px",
                      },
                      children: "🛍️",
                    },
                  },
                ],
              },
            },
        // Right: Product info
        {
          type: "div",
          props: {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "60px 60px 60px 0",
              gap: "16px",
            },
            children: [
              // Category badge
              data.categoryName
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              background: "rgba(16,185,129,0.15)",
                              color: "#10b981",
                              padding: "6px 16px",
                              borderRadius: "100px",
                              fontSize: "16px",
                              fontWeight: 600,
                              border: "1px solid rgba(16,185,129,0.3)",
                            },
                            children: data.categoryName,
                          },
                        },
                      ],
                    },
                  }
                : null,
              // Title
              {
                type: "div",
                props: {
                  style: {
                    fontSize: data.title.length > 40 ? "32px" : "40px",
                    fontWeight: 700,
                    color: "#ffffff",
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                  },
                  children: truncate(data.title, 80),
                },
              },
              // Description
              data.description
                ? {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "18px",
                        color: "rgba(255,255,255,0.6)",
                        lineHeight: 1.5,
                      },
                      children: truncate(data.description, 120),
                    },
                  }
                : null,
              // Price row
              data.price
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginTop: "8px",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "42px",
                              fontWeight: 700,
                              color: "#10b981",
                            },
                            children: formatPrice(data.price),
                          },
                        },
                        hasDiscount
                          ? {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: "24px",
                                  color: "rgba(255,255,255,0.4)",
                                  textDecoration: "line-through",
                                },
                                children: formatPrice(data.comparePrice!),
                              },
                            }
                          : null,
                        hasDiscount
                          ? {
                              type: "div",
                              props: {
                                style: {
                                  background: "#ef4444",
                                  color: "#ffffff",
                                  padding: "4px 12px",
                                  borderRadius: "100px",
                                  fontSize: "16px",
                                  fontWeight: 700,
                                },
                                children: `-${discount}%`,
                              },
                            }
                          : null,
                      ].filter(Boolean),
                    },
                  }
                : null,
              // Rating
              data.rating && data.rating > 0
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "4px",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: { fontSize: "20px", color: "#fbbf24" },
                            children:
                              "★".repeat(Math.round(data.rating)) +
                              "☆".repeat(5 - Math.round(data.rating)),
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "16px",
                              color: "rgba(255,255,255,0.5)",
                            },
                            children: `${data.rating.toFixed(1)} (${data.reviewCount || 0} reviews)`,
                          },
                        },
                      ],
                    },
                  }
                : null,
              // Brand footer
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "auto",
                    paddingTop: "20px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          fontSize: "16px",
                          fontWeight: 700,
                        },
                        children: "A",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "18px",
                          color: "rgba(255,255,255,0.7)",
                          fontWeight: 600,
                        },
                        children: "Ace Marketplace",
                      },
                    },
                  ],
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

function buildCategoryLayout(data: OgData) {
  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0d1117 100%)",
        fontFamily: "Inter",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
        padding: "60px",
      },
      children: [
        // Glow decoration
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
            },
          },
        },
        // Category badge
        {
          type: "div",
          props: {
            style: {
              background: "rgba(16,185,129,0.15)",
              color: "#10b981",
              padding: "8px 24px",
              borderRadius: "100px",
              fontSize: "18px",
              fontWeight: 600,
              border: "1px solid rgba(16,185,129,0.3)",
              marginBottom: "24px",
            },
            children: "Category",
          },
        },
        // Title
        {
          type: "div",
          props: {
            style: {
              fontSize: "64px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "20px",
            },
            children: truncate(data.title, 50),
          },
        },
        // Description
        data.description
          ? {
              type: "div",
              props: {
                style: {
                  fontSize: "22px",
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.5,
                  maxWidth: "700px",
                },
                children: truncate(data.description, 150),
              },
            }
          : null,
        // Brand footer
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "40px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "18px",
                    fontWeight: 700,
                  },
                  children: "A",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "20px",
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: 600,
                  },
                  children: "Ace Marketplace",
                },
              },
            ],
          },
        },
      ].filter(Boolean),
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "product";
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response("Missing slug parameter", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let ogData: OgData;

    if (type === "category") {
      const { data: category } = await supabase
        .from("categories")
        .select("name, description, meta_title, meta_description, image_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!category) {
        return new Response("Category not found", {
          status: 404,
          headers: corsHeaders,
        });
      }

      ogData = {
        type: "category",
        title: category.meta_title || category.name,
        description: category.meta_description || category.description || "",
        image: category.image_url || undefined,
      };
    } else {
      const { data: product } = await supabase
        .from("products")
        .select(
          "name, short_description, meta_title, meta_description, thumbnail, price, compare_at_price, avg_rating, review_count, categories(name)"
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!product) {
        return new Response("Product not found", {
          status: 404,
          headers: corsHeaders,
        });
      }

      ogData = {
        type: "product",
        title: product.meta_title || product.name,
        description:
          product.meta_description || product.short_description || "",
        image: product.thumbnail || undefined,
        price: product.price,
        comparePrice: product.compare_at_price || undefined,
        rating: product.avg_rating || undefined,
        reviewCount: product.review_count || undefined,
        categoryName: (product.categories as any)?.name || undefined,
      };
    }

    // Initialize WASM and fetch fonts
    const [font, boldFont] = await Promise.all([
      getFont(),
      getBoldFont(),
      ensureWasm(),
    ]);

    // Build layout
    const layout =
      ogData.type === "category"
        ? buildCategoryLayout(ogData)
        : buildProductLayout(ogData);

    // Generate SVG with satori
    const svg = await satori(layout, {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: font, weight: 400, style: "normal" },
        { name: "Inter", data: boldFont, weight: 700, style: "normal" },
      ],
    });

    // Convert SVG to PNG with resvg
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(pngBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("OG image generation error:", error);
    return new Response(`Error generating image: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
