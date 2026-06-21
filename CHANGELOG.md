# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com); this project uses
[Semantic Versioning](https://semver.org).

## [1.6.0] — 2026-06-21

### Added
- **Wi‑Fi fallback access point for on‑device provisioning/recovery** — the `wifi:` block now
  defines an `ap:` (SSID **`Atom Voice Setup`**, password from `secrets.yaml` `ap_password`).
  Combined with the existing `captive_portal:`, if the device can't join the configured Wi‑Fi it
  starts its own hotspot; connect from a phone and a captive‑portal page lets you scan and enter a
  new network — no USB reflash needed. Documented in the README (Installation + Troubleshooting),
  with an `ap_password` placeholder added to `secrets.yaml.example`.

## [1.5.0] — 2026-06-21

### Added
- **Text‑to‑Speech announcement HA example** — type any text in Home Assistant and the device
  speaks it via Piper (an `input_text` + `script` + Lovelace card):
  [homeassistant/text-to-speech-announce.yaml](homeassistant/text-to-speech-announce.yaml).
- **Voice‑assistant experiment notes** — a write‑up of the Home Assistant Voice (Assist) satellite
  experiment on this board: it ran end‑to‑end (on‑device "Okay Nabu" wake word → Whisper STT →
  conversation agent → Piper TTS) but is blocked by a Music Assistant I²S‑bus conflict; documents
  what worked, the VAD removal and media/wake‑word handoff, and ends with an open question inviting
  help: [docs/voice-assistant-experiment.md](docs/voice-assistant-experiment.md). (The voice YAML is
  preserved in git history.)

### Changed
- **Analog clock** — the hour‑marks loop now draws a 12‑o'clock end mark at LED 60 (light‑red),
  duplicating the 12‑o'clock mark at the far end of the unrolled dial so the face visually closes
  the loop.

## [1.4.0] — 2026-06-20

### Added
- **On‑strip clock** — a new **Clock** light effect that renders an **HH:MM:SS clock**
  (12‑hour) directly on the LED strip, with three styles selectable at runtime:
  - **Analog** — a 60‑LED clock face unrolled along the strip (dim‑white face, light‑red
    hour marks, bright‑red hour hand, bright‑green minute hand, smooth blue running second).
  - **Digital** — 6 groups of 10 LEDs (`H H : M M : S S`), each digit drawn as a bar
    (red hours / green minutes / blue seconds).
  - **Binary** — BCD bit columns per field (compact), same red/green/blue color coding.
- **`time:` component** (`platform: homeassistant`, id `ha_time`) — the clock reads the
  current time from Home Assistant.
- **`Clock Style` select** (`Analog` / `Digital` / `Binary`) — picks the on‑strip clock look.
- The **Clock** effect is **visual‑only and non‑reactive**: it **owns the whole strip** (the
  30 ms tail‑off interval skips it) and the mic↔amp arbiter keeps the mic OFF / amplifier ON
  while it is showing.

## [1.3.0] — 2026-06-20

### Added
- **5 new non-audio (ambient) light effects:** **Fireplace** (Fire2012-style fire),
  **Matrix Rain** (continuous green code-rain), **Terminal** (running cursor + random green
  characters), **Fireworks Burst** (random colored bursts), and **Chaos** (random per-pixel
  flicker). They need no microphone, so the arbiter keeps the mic OFF / amplifier ON.
- **Project photos** (`images/`) added to the README.

### Changed
- `num_leds` 100 → **120** to match the physical strip (M5Stack Unit RGB Strip 2m, SK6812);
  `Active LEDs` maximum raised to 120.

## [1.2.0] — 2026-06-20

### Changed
- **Mic/amp I2S-bus arbitration redesigned.** The microphone is now **OFF by default**
  (amplifier ON) and turns ON only while an audio-reactive light effect is the active effect.
  Selecting a reactive effect stops any playback and frees the shared ES8311/I2S bus;
  deselecting it (or selecting a non-reactive effect like TV Simulator / Bell Glow / None)
  returns to amp-ON / mic-OFF so the speaker can play. This removes the half-duplex bus
  contention that previously let the microphone hold the bus and wedge the speaker. New
  `MIC<->AMP ARBITER` 250 ms interval; `on_boot` starts mic-OFF/amp-ON; `media_player on_play`
  frees the bus immediately. (`on_idle`/`on_pause` mic-restart handlers removed — the arbiter
  restores the mic when an audio-reactive effect is active.)

### Added
- **Cuckoo announcement style** (Home Assistant runtime): an `input_select` switches the time
  announcement between **Westminster bells + English voice** and a **cuckoo clock** (cuckoos N
  times on the hour, once at the half-hour) with the time spoken in **Russian**. The cuckoo
  tone is synthesized and served from Home Assistant local media.

## [1.1.0] — 2026-06-20

### Added
- **Westminster clock** (Home Assistant): [homeassistant/westminster-clock.yaml](homeassistant/westminster-clock.yaml)
  plays the Westminster chimes at :30 and :00 and speaks the time on the hour (British
  English via a TTS engine), with quiet hours 23:00–08:00 and a `Westminster Test` button
  to preview/tune on demand.
- **Bell Glow** light effect — warm‑gold breathing accompaniment for the chimes.
- **Announcement ducking**: `Announce Ducking` switch (`mixer_speaker.apply_ducking` on the
  music source) plus `Announce Volume` and `Announce Background` numbers — the announcement
  plays loud while the music dips, then the previous volume / effect / playback all restore.
  Chimes and the spoken time play as `announce: true` so any music or mic state is preserved.

### Notes
- The chime audio streams from a public URL (no local media hosting needed).
- ESPHome 2026.6.0 gotcha: an `api:` user service with a `bool` variable fails to **link**
  (config validates, compile dies) — the ducking control is a template `switch` instead.

## [1.0.0] — 2026-06-19

First public release. Verified on ESPHome 2026.6.0 on the M5Stack Atom VoiceS3R.

### Added
- ES8311 microphone support on the Atom VoiceS3R (`channel: left`) — believed to be the
  first public working ESPHome config for this board's mic.
- 9 microphone audio‑reactive LED effects: VU Meter, Gravimeter, Gravcenter, Pixels,
  Matripix, Color Music, Matrix, Fireworks, Strobe.
- TV Simulator presence/occupancy effect.
- Home Assistant media player with automatic mic ↔ speaker I²S bus hand‑off.
- HA controls: `Mic Sensitivity`, `Speaker Volume` and `Active LEDs` numbers; on‑device
  button cycles sensitivity.
- `num_leds` = physical strip length; effects light `Active LEDs` and force the unused tail
  off every frame (so LEDs beyond the lit region never show stale/garbage colors).
- NaN‑safe audio level math and bounds‑safe effect lambdas.
