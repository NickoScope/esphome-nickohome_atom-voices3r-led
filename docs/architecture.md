# Architecture & Engineering Notes

This device packs a microphone, a speaker (sharing one audio codec) and an addressable LED
strip onto a single ESP32‑S3. Three non‑obvious problems had to be solved; they are
documented here so others don't repeat the debugging.

## 1. Getting the ES8311 microphone to work — `channel: left`

On the Atom VoiceS3R the MEMS microphone feeds the **ES8311 mono ADC**, which streams its
samples back to the ESP over I²S. ESPHome's `i2s_audio` microphone defaults to
`channel: right`, but the ES8311 mono ADC places its data on the **left** I²S slot. Reading
the right slot returns pure digital zeros, so `sound_level` reports a constant `-inf dB` and
nothing reacts.

```yaml
microphone:
  - platform: i2s_audio
    i2s_din_pin: GPIO4
    adc_type: external
    channel: left        # <- the fix
```

Also requires **ESPHome ≥ 2026.1** (older builds lack proper ES8311 analog‑mic support) and
the mic/codec/speaker sharing one sample rate (48 kHz here).

## 2. Mic and speaker cannot run at the same time — automatic bus hand‑off

There is a **single ES8311 codec on a single I²S bus**. ESPHome cannot run the microphone
(RX) and the speaker (TX) simultaneously; the second one to claim the bus fails with
`Parent bus is busy` / `Driver failed to start`. (The voice‑assistant world hides this by
time‑sharing the bus — listen, then speak.)

Here the LED effects want the mic running all the time, but the `media_player` needs the
speaker. The config hands the bus off automatically around playback state:

```yaml
media_player:
  on_play:                 # speaker needs the bus
    - sound_level.stop: sound_meter
  on_idle:                 # give it back to the mic
    - delay: 1s            # let the speaker fully release first
    - speaker.stop: i2s_speaker
    - sound_level.start: sound_meter
  on_pause: { ... same as on_idle ... }
```

Plus an `on_boot` (priority `-100`, after setup) `speaker.stop` so the idle speaker driver
doesn't sit there flooding `Parent bus is busy` while the always‑on mic owns the bus.

> Why a switch was removed: an earlier design used a "Mic Mode" template switch whose
> `restore_mode` ran `media_player.stop` / `sound_level.start` **during `setup()`** — before
> those components existed — which crashed in a boot loop. Driving the hand‑off purely from
> `media_player` state triggers (which only fire in `loop()`, never at boot) avoids that.

### What is NOT possible
ESPHome's speaker component exposes only the **duration** of audio written
(`add_audio_output_callback(void(uint32_t, int64_t))`), not the sample data or amplitude. So
the strip **cannot** react to the device's own digital media‑player audio on‑device. For
true "react to the exact track" you need an external sender (e.g. WLED Audio Sync UDP).
What *does* work: play music on a room speaker and the mic reacts to it for real.

## 3. NaN‑safe audio math

When the mic is stopped (during the hand‑off), `sound_level` can publish `NaN`. The level
filter normalizes dB to 0..1 and clamps it — but a naive clamp leaks NaN:

```cpp
// WRONG: NaN passes both tests (every comparison with NaN is false)
if (nrm < 0) nrm = 0;  if (nrm > 1) nrm = 1;
```

A single NaN then poisons the smoothing accumulator (`c = c*k + t*(1-k)` stays NaN forever),
and `(int)(NaN * num_leds)` is undefined behaviour → an out‑of‑bounds LED index → crash, and
afterwards the strip is "dead" because the level is latched at NaN. The fix:

```cpp
// RIGHT: !(nrm > 0) is TRUE for NaN / -inf / negative
if (!(nrm > 0.0f)) nrm = 0.0f;  if (nrm > 1.0f) nrm = 1.0f;
```

plus a defense‑in‑depth guard at the top of every effect lambda
(`if (!(t >= 0.0f)) t = 0.0f; if (!(c >= 0.0f)) c = 0.0f;`).

## LED count: drive the whole strip, mask the unused tail

`esp32_rmt_led_strip`'s `num_leds` is fixed at compile time. **Set it to your strip's
PHYSICAL length** — if it is shorter than the real strip, the controller never sends data to
the extra LEDs and they show uncontrolled garbage that you cannot turn off (a WS2812 chain
holds its last state until it is clocked new data).

To light only part of the strip, the `Active LEDs` number (default 30) is read inside every
effect, which lights `[0, active)` and forces the tail `[active, num_leds)` to black **every
frame**. The read is NaN‑safe (`(isnan(af) || af < 1) ? N : (int)af`) so a missing/invalid
value falls back to the full strip rather than crashing.

Effects only cover the case where an effect is running. To keep the tail off in **every**
state — including a plain solid/monochrome color with no effect selected — a global 30 ms
`interval` also clears the tail directly on the strip:

```cpp
auto *al = static_cast<esphome::light::AddressableLight *>(id(led_strip).get_output());
int total = al->size();
int act = ...;                       // NaN-safe Active LEDs
for (int i = act; i < total; i++) (*al)[i] = Color(0, 0, 0);
al->schedule_show();                 // schedule_write_() also enable_loop()s the idle light
```

`schedule_show()` re‑enables the light loop, so the blacked tail is flushed to the LEDs even
when the light is otherwise idle. The interval only ever writes `[active, num_leds)`, never the
active region, so it never fights an effect — both leave the tail black and coalesce into one
write per loop.

> An earlier attempt set `num_leds` to a max with built‑in light effects (rainbow/scan/pulse)
> that ignored the active length — that diverged and looked chaotic. The built‑ins were
> removed; all effects here are custom lambdas that honour it. A partition‑based variant was
> also tried (a hidden raw strip + an active partition + an off tail partition); it is clean
> in theory but is **not** used here.

## Announcements: ducking, loud playback, and state restore

The Westminster clock ([../homeassistant/westminster-clock.yaml](../homeassistant/westminster-clock.yaml))
plays a chime — and on the hour the spoken time — *over* whatever the device was doing, then
puts everything back. Three pieces make that work:

1. **`announce: true`.** The speaker `media_player` declares two pipelines, `announcement`
   and `media`, summed by a `mixer` speaker. Playing with `announce: true` routes audio to the
   announcement pipeline, so a track on the media pipeline is **not** stopped — it keeps
   playing underneath and continues after. The mic/idle state is likewise preserved.

2. **Ducking + loud announcement.** To make the chime stand out, the HA script flips the
   `Announce Ducking` switch (which calls `mixer_speaker.apply_ducking` on the **music** source
   `media_spk`, `decibel_reduction = (100 − Announce Background)/2`) and raises the master
   volume to `Announce Volume`. Afterwards it un‑ducks (0 dB) and restores the prior volume.
   The strip's effect is snapshotted with `scene.create` and restored with `scene.turn_on`.

3. **Why a `switch`, not an `api:` user service.** The natural design is an `api:` service
   `announce_duck(active: bool)`. On ESPHome **2026.6.0 this fails to *link*** —
   `undefined reference to get_execute_arg_value<bool>` / `to_service_arg_type<bool>` — even
   though `esphome config` passes (it never compiles lambdas). A failed `compile` followed by
   `esphome upload` will also silently flash the *previous* binary and still print "OTA
   successful", so always gate the upload on `compile` succeeding. The workaround used here is
   a template `switch` (`restore_mode: DISABLED`, so no action runs at boot) whose on/off
   actions apply the ducking — no typed‑service template machinery involved.

> Timing note: between two back‑to‑back announcements (chime → spoken time) the script waits
> ~2 s. When an announcement ends with no media underneath, the media_player goes idle and the
> mic/speaker hand‑off (§2) schedules a `speaker.stop`; the gap lets that settle so it cannot
> clip the start of the next announcement.
