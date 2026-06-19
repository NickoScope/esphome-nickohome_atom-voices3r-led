# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com); this project uses
[Semantic Versioning](https://semver.org).

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
