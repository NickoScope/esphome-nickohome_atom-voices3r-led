# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com); this project uses
[Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- **Home Assistant companion config — Atom Voice dashboard + media/action controls package.**
  Companion‑config only; the firmware binary is unchanged (still **v1.12.0**, no re‑flash needed).
  - **`homeassistant/atom-voice-dashboard.yaml`** — full Lovelace YAML of the Atom Voice
    dashboard (7 sections: свет/эффекты, часы, звук, голос/медиа, диагностика, быстрые действия,
    медиа). Import via *Settings → Dashboards → Raw configuration editor*.
  - **`homeassistant/atom-voice-package.yaml`** — drop‑in HA package: `input_select` player
    picker + volume `input_number`, five scripts (LED effect cycler + player next / previous /
    play‑pause / volume‑set) and two automations (slider → player volume, and player → slider
    sync). Adjust the `player_map` / `input_select` entity_ids to your own media fleet.

## [1.12.0] — 2026-07-18

### Added
- **Push‑to‑talk voice assistant (triple‑click the G41 big button)** — a new
  `voice_assistant:` component (no wake word) hands the on‑board mic to Home Assistant Assist for
  one conversation turn, then plays the TTS reply through the speaker `media_player`. The mic stays
  free for the audio‑reactive effects the rest of the time.
- **Spoken activation prompt** — on triple‑click the device speaks
  *«Голосовой ассистент активирован, говорите»* via HA TTS (Piper) and **waits for it to finish**
  before opening the mic (half‑duplex I2S: the prompt TX and the recording RX can't overlap).
- **`voice_active` global + arbiter back‑off** — while a voice turn owns the mic the MIC↔AMP
  arbiter stands down; `on_end` waits for the spoken reply to actually finish (not just enqueue)
  before releasing the mic, so a reactive effect can't `media_player.stop` mid‑reply.

### Changed
- **Big‑button gestures are now 1 / 2 / 3‑click + long‑hold** — the new triple‑click joins
  1‑click = next effect, 2‑click = play/pause NickoScope32 (Music Assistant), long‑hold =
  brightness ramp. All four are disambiguated with trailing‑OFF timing (single/double tails widened
  to `OFF for at least 0.4s`).
- **Microphone sample rate 48 kHz → 16 kHz** — `voice_assistant` requires a 16 kHz mic; the
  speaker stays at 48 kHz. The mixed rates coexist on the exclusively‑used shared bus and the mic
  was re‑verified working for the effects and Spectrum analyzer.

## [1.11.0] — 2026-07-18

### Added
- **G41 big‑button double‑click → media play/pause** — a second `on_multi_click` gesture calls
  `media_player.media_play_pause` on `media_player.nickoscope32` (the **NickoScope32** player in
  Music Assistant), so playback can be toggled from the device with no app.

### Changed
- **Single‑click effect cycle now waits out a possible double‑click** — the single‑click timing
  gained an `OFF for at least 0.3s` tail (and tightened to `ON for at most 0.6s`) to
  disambiguate it from the new double‑click. Long‑hold (≥ 1 s) brightness ramp is unchanged.
  All three gestures verified conflict‑free on hardware.

## [1.10.0] — 2026-07-12

### Added
- **Spectrum audio‑reactive LED effect** — a real 10‑band FFT spectrum analyzer driven by the
  on‑board mic:
  - **512‑point radix‑2 FFT** computed live in the microphone `on_data` handler — Hann window,
    twiddle factors and bit‑reversal table precomputed once, with an auto‑gain (AGC) envelope.
    The FFT runs only while the `Spectrum` effect is the active effect. Its output is stored as
    10 log‑spaced band levels (0..1) in a new `std::array<float,10>` global (`id: spec`).
  - **`Spectrum` `addressable_lambda` effect** (33 ms) renders **10 frequency bands × 6 LEDs =
    60 LEDs**, each band a distinct color across the hue wheel; bar height per band tracks its
    level. Like `Clock`, it **owns the whole strip** (skipped by the tail‑off interval) and
    clears LEDs beyond the 60‑LED display.
  - Integrated into the **mic ↔ amp arbiter** and **tail‑off exemption** (mic ON, strip fully
    owned while active), the **G41 button FX cycle** (after Color Music, before TV Simulator),
    and the **`Startup Effect`** select.
  - Brings the reactive‑effect count to **10**.

## [1.9.0] — 2026-07-11

### Added
- **Diagnostic sensors** surfaced in the ⚙️ System group of the on‑device web interface and in
  Home Assistant (both `entity_category: diagnostic`, 60 s update interval):
  - **`WiFi Signal`** (`platform: wifi_signal`, `id: wifi_rssi`) — link RSSI in dBm.
  - **`Uptime`** (`platform: uptime`, `id: dev_uptime`) — time since last boot.

## [1.8.0] — 2026-07-11

### Changed
- **G41 on‑device button reassigned** (was: cycle mic sensitivity):
  - **Short press** (≤ 0.8 s) now **cycles the strip effect** — Clock → Fireplace → Matrix Rain →
    Terminal → Fireworks Burst → Chaos → VU Meter → Color Music → TV Simulator → Bell Glow → None →
    (back to Clock), via an `on_multi_click` handler and `light.turn_on` with `set_effect`.
  - **Long hold** (≥ 1 s) **ramps the strip brightness** while the button is held (`light.dim_relative`
    in a `while` loop); each new hold reverses direction (brighten ⇄ dim), tracked by a new
    `dim_dir` global. Mic sensitivity remains adjustable from the `Mic Sensitivity` slider (web/HA).
- **On‑device web interface (`web_server` v3) organized into named groups** via `sorting_groups`:
  🎨 Effects & Light / 🕐 Clock / 🔊 Sound / 📢 Announcements / 🚀 Startup / ⚙️ System. Every control
  is now assigned to its section (`web_server: { sorting_group_id: … }`) instead of one flat list.

## [1.7.0] — 2026-06-21

### Added
- **On‑device web interface (`web_server`, v3)** — a settings page at `http://<device-ip>/`
  (port 80, `local: true`, `ota: false`) that lists and controls every entity (Active LEDs,
  Startup Effect, Startup Greeting, Clock Style, effects, volumes, Restart). Reachable whenever
  the device is on Wi‑Fi.
- **`Startup Effect` select** (`id: startup_effect`; Clock / Fireplace / Matrix Rain / Terminal /
  Fireworks Burst / Chaos / TV Simulator / Bell Glow / None; default Clock, restored) — the effect
  applied to the strip on boot, wired into `on_boot` via `light.turn_on` with
  `effect: !lambda 'return id(startup_effect).state;'`.
- **Editable `Startup Greeting` text** (`id: startup_greeting`, default
  `"Hi! I am your personal interactive LED strip! Enjoy!"`, restored, max 255) — shown in the web
  interface; Home Assistant speaks it on boot via TTS. New example:
  [homeassistant/startup-greeting.yaml](homeassistant/startup-greeting.yaml).
- **`Restart` button** (`platform: restart`) — restart the device from the web interface / HA.

### Changed
- **README Wi‑Fi‑provisioning clarification** (verified against ESPHome source): the `web_server`
  page is reachable by device IP only while Wi‑Fi is connected and does **not** contain Wi‑Fi
  settings; Wi‑Fi configuration is available **only** via the `Atom_Strip` fallback AP + captive
  portal, which comes up automatically when the device can't join the configured network. There is
  no way to force the AP while connected (`wifi.disable` turns Wi‑Fi fully off) and Wi‑Fi fields
  cannot be added to `web_server`.

## [1.6.0] — 2026-06-21

### Added
- **Wi‑Fi fallback access point for on‑device provisioning/recovery** — the `wifi:` block now
  defines an `ap:` (SSID **`Atom_Strip`**, password from `secrets.yaml` `ap_password`).
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
