"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { RenewMark } from "@/components/brand/RenewMark";

/**
 * A Renew-branded QR code: the code itself rendered crisp, with the Renew mark
 * floating on a soft white plate in the dead centre — the way WhatsApp, PayPal
 * and Google Pay brand their codes.
 *
 * Scannability is protected two ways: the code is generated at error-correction
 * level **H** (recovers ~30% of the modules), and the centre plate covers well
 * under that, so every scanner still reads it cleanly. The plate + mark are an
 * overlay (not baked into the matrix) so they stay razor-sharp at any size.
 */
export function BrandedQr({
  value,
  size = 224,
  className,
}: {
  value: string;
  /** Rendered pixel size (width & height). */
  size?: number;
  className?: string;
}) {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let alive = true;
    // Generating the QR is an async call to an external encoder; state is set in
    // its callback (the sanctioned pattern), so nothing is set synchronously.
    void QRCode.toString(value || " ", {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#0b1020", light: "#ffffff" },
    }).then((markup) => {
      if (alive) setSvg(value ? markup : "");
    });
    return () => {
      alive = false;
    };
  }, [value]);

  // The centre plate is ~26% of the code — comfortably inside level-H recovery.
  const plate = Math.round(size * 0.26);
  const mark = Math.round(plate * 0.66);

  return (
    <div
      className={className}
      style={{ position: "relative", width: size, height: size }}
    >
      {svg ? (
        <div
          className="[&>svg]:size-full"
          style={{ width: "100%", height: "100%" }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="size-full animate-pulse rounded-xl bg-black/5" />
      )}

      {svg && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: plate,
            height: plate,
            transform: "translate(-50%, -50%)",
            display: "grid",
            placeItems: "center",
            borderRadius: "9999px",
            background: "#ffffff",
            // Subtle champagne ring + soft lift so the mark reads as "floating".
            boxShadow:
              "0 0 0 2px rgba(198,161,91,0.55), 0 6px 16px rgba(11,16,32,0.22)",
          }}
        >
          <RenewMark size={mark} idSuffix="qr" title="Renew" />
        </div>
      )}
    </div>
  );
}
