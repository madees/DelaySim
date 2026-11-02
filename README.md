# DelaySim — Phase & Interference Simulator

An interactive educational web tool for understanding **phase relationships**, **acoustic interference**, and **frequency-dependent gain** in audio mixing.

## 🎯 What It Does

DelaySim lets you:
- Generate two identical audio signals (sine, pink noise, white noise)
- Control their **level** in dB, **frequency**, and **phase offset**
- Visualize **constructive/destructive interference** in real-time
- See the exact **gain relationship** (0° → +6 dB, 90° → +3 dB, 180° → silence)
- Monitor the combined output in both **time domain** (oscilloscope) and **frequency domain** (spectrum analyzer)

Perfect for **audio training**, **acoustics classes**, or **audio engineering education**.

## 🚀 Try It Online

👉 **[Open DelaySim](https://YOUR_USERNAME.github.io/delaySim/)**

No installation needed — just click and play!

## 🛠 Local Development

Want to modify or contribute?

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/delaySim.git
cd delaySim

# Install dependencies (one-time)
npm install

# Start dev server
npm run dev
# → Open http://localhost:5173/

# Build for production
npm run build
```

## 📚 Features

| Feature | Details |
|---------|---------|
| **Generator A & B** | Sine, Pink Noise, White Noise modes |
| **Level Control** | -30 dB to +10 dB range |
| **Frequency** | 20 Hz to 2000 Hz adjustable |
| **Phase/Delay** | 0° to 360° in degrees or 0-10 ms |
| **Coherence Toggle** | Shared or independent noise sources |
| **Level Meter** | Real-time output with interference gain display |
| **Oscilloscope** | Time-domain view of A, B, and sum |
| **Spectrum Analyzer** | Frequency-domain representation |

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

## 📄 License

MIT — Use freely for education and projects.

---

**Questions or improvements?** Open an issue or PR on GitHub!

