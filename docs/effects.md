# Effects Catalog

All reactive effects are driven by the microphone level (`vu` / `vu_target`, a smoothed
0..1 value derived from `sound_level` RMS and `Mic Sensitivity`). Select an effect from the
`light.strip` effect dropdown in Home Assistant.

| # | Effect | Reactive | Update | Description |
|--:|---|:---:|---:|---|
| 1 | **VU Meter** | ✅ | 33 ms | Level bar, green (low) → red (high). |
| 2 | **Gravimeter** | ✅ | 30 ms | Bar rises with sound; a white peak dot falls back under "gravity". WLED‑SR style. |
| 3 | **Gravcenter** | ✅ | 30 ms | Symmetric bar growing out from the strip center with falling peaks. |
| 4 | **Pixels** | ✅ | 30 ms | Random colored sparkles; the louder the sound, the more pixels. |
| 5 | **Matripix** | ✅ | 33 ms | A trail scrolls along the strip; the new head pixel is colored by the current loudness. |
| 6 | **Color Music** | ✅ | 33 ms | A flowing rainbow whose speed and brightness track the sound. |
| 7 | **Matrix** | ✅ | 50 ms | Falling green "code rain"; drop density follows the sound. |
| 8 | **Fireworks** | ✅ | 33 ms | On a detected beat, a colored burst spawns and fades. |
| 9 | **Strobe** | ✅ | 25 ms | Whole strip flashes white on beats. |
| 10 | **TV Simulator** | — | 90 ms | Non‑reactive. Bluish‑white TV glow with random "scenes", bright cuts and warm/dark scenes — looks like a working television from outside. Use it as a presence/occupancy ("away mode") deterrent. |
| 11 | **Bell Glow** | — | 33 ms | Non‑reactive. Warm‑gold breathing glow that flows along the strip; used as the light accompaniment for the Westminster chimes (Home Assistant enables it while the bells play). Time‑based because the mic is off during speaker playback. |
| 12 | **Fireplace** | — | 60 ms | Non‑reactive. Flickering fire / fireplace simulation (Fire2012‑style heat model: cool‑down, upward heat diffusion, random sparks at the base, heat‑map colors). |
| 13 | **Matrix Rain** | — | 60 ms | Non‑reactive. Continuous green "code rain" falling along the strip with white drop heads (always animating, no audio). |
| 14 | **Terminal** | — | 50 ms | Non‑reactive. A running cursor leaves a fading green trail while random green "characters" blink — like a terminal printing output. |
| 15 | **Fireworks Burst** | — | 33 ms | Non‑reactive. Random colored bursts spawn and fade across the strip on a timer (the audio "Fireworks" effect without needing a beat). |
| 16 | **Chaos** | — | 40 ms | Non‑reactive. Every pixel randomly flickers to a new random color and fades — colorful noise. |
| 17 | **Clock** | — | 50 ms | Non‑reactive, visual‑only. An on‑strip **HH:MM:SS clock** (12‑hour, time read from Home Assistant via the `time` component). The look is chosen by the **`Clock Style`** select — **Analog / Digital / Binary**. This effect **owns the whole strip** (the global tail‑off interval skips it), so `Active LEDs` does not apply while it runs. |

### Clock styles (the `Clock Style` select)

- **Analog** — a 60‑LED clock face unrolled along the strip: dim‑white = the inactive face, the 12 hour marks light‑red, **bright‑red = hour hand**, **bright‑green = minute hand**, **blue = the running second** (smooth, sub‑second via `millis()`).
- **Digital** — 6 groups of 10 LEDs (`H H : M M : S S`); each digit 0–9 is shown as a bar — **red hours / green minutes / blue seconds**.
- **Binary** — BCD bit columns per field (compact, geeky); same red/green/blue color coding for hours / minutes / seconds.

**Mic note:** the reactive effects (rows 1–9) need the microphone; selecting one turns the mic
ON (and the amplifier OFF). The non‑reactive effects (rows 10–17, including **Clock**) keep the
mic OFF / amplifier ON, since they don't need audio. See [architecture.md](architecture.md) for
the mic↔amp arbiter.

## Tuning

- **`Mic Sensitivity` (0–100 %)** maps the dB window. Higher = lower noise floor = reacts to
  quieter sounds, but set it too high and everything saturates to full‑on (no swing). A good
  starting point for a normal room is **~30–40 %**. The on‑device top button cycles it in
  +10 % steps.
- **`Active LEDs`** sets how many LEDs animate. `num_leds` (in the YAML) must be your strip's
  **physical** length so every LED is driven; each effect lights `[0, active)` and forces the
  tail `[active, num_leds)` off every frame.
- Per‑effect attack/decay constants and beat thresholds are inline in
  [`atom-voices3r-led.yaml`](../atom-voices3r-led.yaml) if you want to fine‑tune them.

## Safety / robustness

Every effect lambda is written to be crash‑safe on a 30‑LED strip:
- all `it[i]` writes are proven in‑bounds (peak/neighbor writes are explicitly guarded);
- each effect clamps the incoming level with `if (!(x >= 0)) x = 0;` so a stray `NaN`
  (possible when the mic is stopped for playback) can never reach an array index.
