# Contributing

Thanks for your interest! This is a small, focused ESPHome project for the M5Stack
Atom VoiceS3R. Issues and pull requests are welcome.

## Ground rules
- **Never commit secrets.** `secrets.yaml` is gitignored; only edit `secrets.yaml.example`
  (placeholders only). Don't paste real Wi‑Fi/API/OTA values, MAC addresses or private IPs
  into issues or PRs.
- Keep all code comments and docs in **English**.
- Validate before opening a PR: `esphome config atom-voices3r-led.yaml` must pass, and
  ideally flash to real hardware and confirm no boot loop / no crash in the LED effects.

## Good first contributions
- New LED effects (keep the lambdas bounds‑safe and NaN‑safe — see
  [docs/architecture.md](docs/architecture.md)).
- Photos / GIFs of the effects for the README (`images/`).
- A Home Assistant blueprint (e.g. auto‑enable TV Simulator when away).

## Reporting a bug
Include: ESPHome version, the relevant `esphome logs` output (with any secrets redacted),
your strip length, and steps to reproduce.
