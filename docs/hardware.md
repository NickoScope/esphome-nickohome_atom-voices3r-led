# Hardware

## Bill of Materials

| Qty | Item | Notes |
|---:|---|---|
| 1 | **M5Stack Atom VoiceS3R** (Atom EchoS3R) | ESP32‑S3‑PICO‑1‑N8R8 · 8 MB flash + 8 MB octal PSRAM · 2.4 GHz Wi‑Fi · ES8311 mono codec · MEMS mic · NS4150B class‑D amp · 1 W 8 Ω speaker |
| 1 | **WS2812 / WS2812B / SK6812** addressable LED strip | Set `num_leds` to your strip's **physical** length; the `Active LEDs` control then sets how many are lit (the rest are driven OFF) |
| 1 | Grove HY2.0‑4P cable (or jumpers) | For LED data + power |
| 1 | USB‑C **data** cable | First flash only (later updates are OTA) |
| — | External 5 V power supply | Only if the strip is longer than ~10–15 LEDs |

## Pinout (verified)

| Function | GPIO |
|---|---|
| I²S BCLK | 17 |
| I²S LRCLK (WS) | 3 |
| I²S MCLK | 11 |
| Microphone DIN | 4 |
| Speaker DOUT | 48 |
| ES8311 I²C SDA | 45 |
| ES8311 I²C SCL | 0 |
| Amplifier enable | 18 |
| User button | 41 |
| **Free — Grove port** | **GPIO2** (yellow), GPIO1 (white) + 5V + GND |

The **LED strip data line goes to GPIO2** (the Grove yellow wire). GPIO1 is a spare.

## Wiring the LED strip

```
Atom Grove HY2.0-4P            WS2812 strip
  5V  (red)  ───────────────►  +5V
  GND (black)───────────────►  GND
  GPIO2 (yellow) ───────────►  DIN  (data in)
  GPIO1 (white)  ── (unused)
```

### Power notes
- The Grove 5 V rail can drive only **~10–15 LEDs** safely.
- For a longer strip, power the strip from an **external 5 V supply** and connect that
  supply's **ground to the Atom's ground** (common ground is required).
- WS2812 expect ~5 V data logic; the ESP32 drives 3.3 V. Short runs usually work; for long
  runs add a level shifter (e.g. 74AHCT125).

## Power / first‑flash tips
- The board ships with firmware that claims the native USB, so a USB serial port may not
  appear until you enter **download mode**: hold the side **Reset** button ~2 s until the
  internal green LED lights, then release.
