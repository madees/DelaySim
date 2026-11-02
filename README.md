# DelaySim — Phase & Interference Simulator

An interactive educational web tool for understanding **phase relationships**, **acoustic interference**, and **frequency-dependent gain** in audio mixing.

> **Original concept** by **John Taylor** and **Boris Rehders** at **d&b audiotechnik** (with LabView, 2014)

## 🎯 What It Does

DelaySim lets you:
- Generate two identical audio signals (sine, pink noise, white noise)
- Control their **level** in dB, **frequency**, and **phase offset**
- Visualize **constructive/destructive interference** in real-time
- See the exact **gain relationship** (0° → +6 dB, 90° → +3 dB, 180° → silence)
- Monitor the combined output in both **time domain** (oscilloscope) and **frequency domain** (spectrum analyzer)

Perfect for **audio training**, **acoustics classes**, or **audio engineering education**.

## 🚀 Try It Online

👉 **[Open DelaySim](https://madees.github.io/DelaySim/)**

No installation needed — just click and play!

## 🎮 Quick Start

1. **Open [DelaySim](https://madees.github.io/DelaySim/)** in your browser
2. **Generator A** produces a reference signal (sine, pink, or white noise)
3. **Generator B** produces the same signal with adjustable **phase** and **delay**
4. Watch how the two signals **interfere** in the time and frequency domains
5. Adjust the **Phase** slider (or spinner with **5° steps**) to see gain changes
6. Adjust the **Delay** slider (or spinner with **0.1 ms steps**) for time offsets
7. Toggle **Coherence** to share or separate noise sources
8. Check **Link Generators** to sync frequency and mode between both channels

## 🛠 Local Development

Want to modify or contribute?

```bash
# Clone the repo
git clone https://github.com/madees/DelaySim.git
cd DelaySim

# Install dependencies (one-time)
npm install

# Start dev server
npm run dev
# → Open http://localhost:5173/DelaySim/

# Build for production
npm run build
```

## 📚 Features

| Feature | Details |
|---------|---------|
| **Generator A & B** | Sine, Pink Noise, White Noise modes |
| **Level Control** | -30 dB to +10 dB range with real-time meter |
| **Frequency** | 20 Hz to 2000 Hz adjustable (synchronized or independent) |
| **Phase Control** | 0° to 360° — spinner with **5° steps** or smooth slider |
| **Delay Control** | 0–10 ms — spinner with **0.1 ms steps** or smooth slider |
| **Coherence Toggle** | Shared or independent noise sources for A and B |
| **Link Generators** | Sync frequency and mode between both channels |
| **Level Meter** | Real-time output with interference gain display |
| **Oscilloscope** | Time-domain view of A, B, and combined signal |
| **Spectrum Analyzer** | Frequency-domain with log/linear scale and smoothing |

## 🎓 Educational Use

Great for teaching:
- **Phase relationships** between signals
- **Constructive interference** (signals in phase → +6 dB)
- **Destructive interference** (signals 180° out of phase → silence)
- **Acoustic cancellation** (headphone anti-noise)
- **Comb filtering** (delay + sum effects)
- **Frequency response** in mixing

## 🔧 Built With

- **React** + **TypeScript** — Component-based UI
- **Vite** — Lightning-fast build tool
- **Web Audio concepts** — DFT-based spectrum analysis, dB calculations

## 🙏 Credits & Acknowledgments

Web implementation and interactive simulator by [Mathieu Delquignies](https://github.com/madees)

Original concept by John Taylor and Boris Rehders at d&b audiotechnik (2014)

## 📄 License

MIT — Use freely for education and projects.

---

**Questions or improvements?** Open an issue or PR on GitHub!

