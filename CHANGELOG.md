# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com); this project uses
[Semantic Versioning](https://semver.org).

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
