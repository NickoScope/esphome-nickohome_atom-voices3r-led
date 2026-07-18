# Voice Assistant experiment — and why the *always-listening* satellite is not in the shipped firmware

> **Update (v1.12.0):** a **push-to-talk** voice assistant *did* ship — triple-click the G41 button
> to run one Assist turn (no wake word), which sidesteps the bus conflict below by only handing the
> mic to Assist for a single turn. See the README's *Voice assistant (push-to-talk)* section. This
> note is about the harder **always-listening wake-word satellite**, which remains unsolved.

We tried turning this board into a full **Home Assistant Voice (Assist) satellite**: on-device
wake word (`micro_wake_word`) → HA Assist pipeline (Whisper STT → a conversation agent → Piper TTS),
all on the **same device that already runs** the mixer speaker, media player, 18 LED effects, the
on-strip clock and the mic/amp arbiter.

It worked **end-to-end** — and then a Music Assistant bus conflict made it unreliable, so it is
**not** in the released firmware. These notes are here in case someone can solve the conflict.
**Help welcome — see the open question below.**

## What worked

- Merged the official **M5Stack Atom EchoS3R satellite** blocks (`micro_wake_word` + `voice_assistant`)
  into this firmware. Same board / pinout (i2s LRCLK GPIO3, BCLK GPIO17, MCLK GPIO11, mic DIN GPIO4,
  speaker DOUT GPIO48, amp GPIO18).
- Mic reconfigured to **16 kHz** (micro_wake_word requirement); the ES8311 DAC / speaker / announcement
  pipeline stay **48 kHz**. One **half-duplex** `i2s_audio` bus — mic-16k and speaker-48k are
  time-multiplexed, never simultaneous.
- Wake word **"Okay Nabu" detected reliably** (`sliding average probability 0.99, max 1.00`). STT,
  the conversation agent (we used a Claude conversation agent) and **Piper TTS all ran** — the device
  logged `Response: "..."`, a TTS proxy URL, and `Decoded audio has 1 channels, 48000 Hz`.
- An **Assistant ↔ Ambient mode switch** + LED "assist states" (idle / listening / thinking /
  replying / error), with the mic/amp arbiter frozen while the assistant owns the mic.

## Two things we had to change

- **Dropped the VAD model.** At our mic level the VAD vetoed valid detections
  (`Wake word model predicts 'Okay Nabu', but VAD model doesn't`). The wake-word model alone fires reliably.
- **Added the media ↔ wake-word handoff** (the official pattern): on `media_player.on_play` stop the
  wake word (free the half-duplex mic so the speaker can play), on `on_idle` restart it — guarded by
  `not voice_assistant.is_running` so the assistant's own replies are unaffected.

## The blocker — Music Assistant grabs the I2S bus

The device's `media_player` gets an **auto-resuming Music Assistant queue**
(`active_queue` → this device, `source: "Music Assistant Queue"`). Music Assistant continuously
(re)claims the player and streams audio to it. On this **half-duplex single-I2S bus**, while the
wake-word mic is listening, any speaker output collides:

```
[E][i2s_audio.speaker.std]: Parent bus is busy
[E][i2s_audio.speaker]: Driver failed to start; retrying in 1 second
[E][component]: i2s_audio.speaker set Error flag: unspecified   (looping)
```

So the wake word + STT + LLM + TTS **all succeed**, but the **spoken reply never reaches the speaker**
because MA owns the bus. Stopping / clearing / pausing the MA queue over the HA API does **not** hold —
it re-injects within seconds. This same MA hijack also intermittently swallowed plain media playback.

## Open question (help appreciated)

On a shared-I2S voice satellite that **also** uses a `mixer` speaker + media pipelines, how do you
either:

1. **stop Music Assistant from auto-claiming** an ESPHome `media_player` (exclude this one player), or
2. let the **wake-word mic and MA playback coexist** on one half-duplex `i2s_audio` bus?

If you've shipped an EchoS3R / Atom satellite alongside Music Assistant, we'd love to know how you
avoided the bus war. The voice-assistant YAML lives in this repo's **git history** (the commits around
the voice-assistant work) — diff them to try it yourself.

## What shipped instead

We kept the stable system (LED effects + clock + announcements) and added a **text-to-speech
announcement** box in Home Assistant — type text, the device speaks it via Piper, no wake word / bus
contention. See [text-to-speech-announce.yaml](../homeassistant/text-to-speech-announce.yaml).
