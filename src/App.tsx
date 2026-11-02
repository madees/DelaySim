import { useMemo, useState, useEffect } from 'react'

type WaveMode = 'off' | 'sine' | 'pink' | 'white'

type ChannelState = {
  mode: WaveMode
  frequency: number
  level: number
  coherent: boolean
  delayMs: number
  phaseDeg: number
  muted: boolean
  inverted: boolean
}

type GeneratorPanelProps = {
  title: string
  channel: ChannelState
  onUpdate: (updater: (current: ChannelState) => ChannelState) => void
  meterClass?: string
  frequencyLocked?: boolean
  modeLocked?: boolean
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const dbToAmplitude = (db: number): number => Math.pow(10, db / 20)

const valueToPercent = (value: number, min: number, max: number) =>
  ((value - min) / (max - min)) * 100

const deterministicNoise = (value: number, seed: number): number => {
  const x = Math.sin(value * 12.9898 + seed * 78.233) * 43758.5453123
  return x - Math.floor(x)
}

const noiseSampleForTime = (mode: WaveMode, time: number, seed: number): number => {
  if (mode === 'white') {
    return deterministicNoise(time * 48000 + seed * 11.7, seed) * 2 - 1
  }

  if (mode === 'pink') {
    const n1 = deterministicNoise(time * 48000 * 1 + seed * 3.1, seed + 1.3) * 2 - 1
    const n2 = deterministicNoise(time * 48000 * 0.5 + seed * 5.7, seed + 2.9) * 2 - 1
    const n3 = deterministicNoise(time * 48000 * 0.25 + seed * 11.1, seed + 4.7) * 2 - 1
    const n4 = deterministicNoise(time * 48000 * 0.125 + seed * 17.3, seed + 8.3) * 2 - 1
    const n5 = deterministicNoise(time * 48000 * 0.0625 + seed * 23.9, seed + 13.1) * 2 - 1
    const n6 = deterministicNoise(time * 48000 * 0.03125 + seed * 31.7, seed + 21.7) * 2 - 1

    return n1 * 0.05 + n2 * 0.09 + n3 * 0.14 + n4 * 0.2 + n5 * 0.24 + n6 * 0.28
  }

  return 0
}

const cycleSample = (
  time: number,
  frequency: number,
  phase: number,
  mode: WaveMode,
  levelDb: number,
  _seed: number,
  inverted: boolean = false,
  noiseValue: number = 0,
) => {
  const amplitude = dbToAmplitude(levelDb)
  const basePhase = time * frequency * Math.PI * 2 + phase
  let sample = 0

  if (mode === 'sine') {
    sample = Math.sin(basePhase) * amplitude
  } else if (mode === 'pink') {
    sample = noiseValue * amplitude
  } else if (mode === 'white') {
    sample = noiseValue * amplitude
  }

  return inverted ? -sample : sample
}

function GeneratorPanel({ title, channel, onUpdate, meterClass, frequencyLocked, modeLocked }: GeneratorPanelProps) {
  const panelClass = meterClass === 'secondary' ? 'yellow-panel' : 'blue-panel'
  
  return (
    <div className={`control-panel panel ${panelClass} generator-panel`}>
      <div className="panel-title">{title}</div>
      <div className="panel-body">
        <div className="generator-top-grid">
          <label className="field select-field">
            <span>Mode</span>
            <select
              value={channel.mode}
              disabled={modeLocked}
              onChange={(event) => onUpdate((current) => ({ ...current, mode: event.target.value as WaveMode }))}
            >
              <option value="off">Off</option>
              <option value="sine">Sine</option>
              <option value="pink">Pink</option>
              <option value="white">White</option>
            </select>
          </label>

          <label className="field number-field">
            <span>Frequency</span>
            <div className="frequency-inline">
              <input
                type="number"
                min={20}
                max={2000}
                step={1}
                value={channel.frequency}
                disabled={frequencyLocked}
                className="frequency-number-input"
                onChange={(event) => {
                  const rawValue = event.target.value
                  if (rawValue === '') return

                  const nextFrequency = Number(rawValue)
                  if (Number.isNaN(nextFrequency)) return

                  onUpdate((current) => ({
                    ...current,
                    frequency: nextFrequency,
                  }))
                }}
                onBlur={(event) => {
                  const cleanedFrequency = clamp(Math.round(Number(event.target.value || 20)), 20, 2000)
                  onUpdate((current) => ({
                    ...current,
                    frequency: cleanedFrequency,
                  }))
                }}
              />
              <span className="frequency-unit">Hz</span>
            </div>
          </label>
        </div>

        <div className="generator-meter-section">
          <div className="fader-display">
            <div className="fader-wrapper">
              <div className="fader-scale-labels">
                {Array.from({ length: 9 }, (_, index) => (
                  <span key={index}>{10 - index * 5}</span>
                ))}
              </div>
              <input
                type="range"
                className={`fader-slider ${meterClass ?? 'primary'}`.trim()}
                min="-30"
                max="10"
                step="1"
                value={channel.level}
                onChange={(event) =>
                  onUpdate((current) => ({
                    ...current,
                    level: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="level-controls">
              <button
                type="button"
                className="level-btn"
                onClick={() =>
                  onUpdate((current) => ({
                    ...current,
                    level: clamp(current.level - 1, -30, 10),
                  }))
                }
              >
                −
              </button>
              <span className="level-display">{channel.level.toFixed(1)}</span>
              <button
                type="button"
                className="level-btn"
                onClick={() =>
                  onUpdate((current) => ({
                    ...current,
                    level: clamp(current.level + 1, -30, 10),
                  }))
                }
              >
                +
              </button>
            </div>
          </div>

          <div className="quick-buttons">
            <button
              type="button"
              className="quick-btn"
              onClick={() => onUpdate((current) => ({ ...current, level: 0 }))}
              title="Reset to 0 dB"
            >
              0 dB
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => onUpdate((current) => ({ ...current, level: -6 }))}
              title="Set to -6 dB"
            >
              −6 dB
            </button>
            <button
              type="button"
              className={`quick-btn mute-btn ${channel.muted ? 'active' : ''}`.trim()}
              onClick={() =>
                onUpdate((current) => ({
                  ...current,
                  muted: !current.muted,
                }))
              }
              title="Mute/Unmute"
            >
              Mute
            </button>
            <button
              type="button"
              className={`quick-btn inv-btn ${channel.inverted ? 'active' : ''}`.trim()}
              onClick={() =>
                onUpdate((current) => ({
                  ...current,
                  inverted: !current.inverted,
                }))
              }
              title="Invert Polarity"
            >
              Inv. Pol.
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [channelA, setChannelA] = useState<ChannelState>({
    mode: 'sine',
    frequency: 100,
    level: 0,
    coherent: true,
    delayMs: 0,
    phaseDeg: 0,
    muted: false,
    inverted: false,
  })

  const [channelB, setChannelB] = useState<ChannelState>({
    mode: 'sine',
    frequency: 100,
    level: 0,
    coherent: true,
    delayMs: 0,
    phaseDeg: 0,
    muted: false,
    inverted: false,
  })

  const [coherent, setCoherent] = useState(true)
  const [linkFrequency, setLinkFrequency] = useState(true)
  const [timeScale, setTimeScale] = useState(0.02)
  const [spectrumSmooth, setSpectrumSmooth] = useState(false)
  const [spectrumLog, setSpectrumLog] = useState(true)

  // When linkFrequency is enabled, keep B frequency synced with A
  useEffect(() => {
    if (linkFrequency) {
      setChannelB((current) => ({
        ...current,
        frequency: channelA.frequency,
        mode: channelA.mode,
      }))
    }
  }, [channelA.frequency, channelA.mode, linkFrequency])

  const isNoiseChannel = (mode: WaveMode) => mode === 'pink' || mode === 'white'

  const phaseForDelay = useMemo(() => {
    if (isNoiseChannel(channelA.mode) || isNoiseChannel(channelB.mode)) {
      return 0
    }

    const freq = channelB.frequency || 1
    return clamp((channelB.delayMs * freq * 360) / 1000, 0, 360)
  }, [channelA.mode, channelB.delayMs, channelB.frequency, channelB.mode])

  // Combined level with interference gain - correct formula using actual amplitudes
  const combinedMeterValue = useMemo(() => {
    const activeA = channelA.mode !== 'off' && !channelA.muted
    const activeB = channelB.mode !== 'off' && !channelB.muted

    if (!activeA && !activeB) {
      return -80
    }

    const amplitudeA = activeA ? dbToAmplitude(channelA.level) : 0
    const amplitudeB = activeB ? dbToAmplitude(channelB.level) : 0

    if (isNoiseChannel(channelA.mode) || isNoiseChannel(channelB.mode)) {
      if (
        coherent &&
        isNoiseChannel(channelA.mode) &&
        isNoiseChannel(channelB.mode) &&
        channelA.mode === channelB.mode
      ) {
        const coherentAmplitude = amplitudeA + amplitudeB
        const coherentDb = 20 * Math.log10(Math.max(0.0001, coherentAmplitude))
        return Number.isFinite(coherentDb) ? coherentDb : -80
      }

      const incoherentAmplitude = Math.sqrt(amplitudeA * amplitudeA + amplitudeB * amplitudeB)
      const incoherentDb = 20 * Math.log10(Math.max(0.0001, incoherentAmplitude))
      return Number.isFinite(incoherentDb) ? incoherentDb : -80
    }

    const phase = (phaseForDelay * Math.PI) / 180
    
    // Combined amplitude using vector sum formula: sqrt(A² + B² + 2AB·cos(φ))
    const combinedAmplitude = Math.sqrt(
      amplitudeA * amplitudeA + 
      amplitudeB * amplitudeB + 
      2 * amplitudeA * amplitudeB * Math.cos(phase)
    )
    
    const combinedDb = 20 * Math.log10(Math.max(0.0001, combinedAmplitude))
    return Number.isFinite(combinedDb) ? combinedDb : -80
  }, [channelA.level, channelA.mode, channelA.muted, channelB.level, channelB.mode, channelB.muted, coherent, phaseForDelay])

  const combinedMeterPercent = valueToPercent(clamp(combinedMeterValue, -21, 9), -21, 9)

  const waveformData = useMemo(() => {
    const points = Math.ceil(260 * (timeScale / 0.02))
    const totalDuration = timeScale
    const noisePair = isNoiseChannel(channelA.mode) || isNoiseChannel(channelB.mode)
    const coherentNoisePair =
      coherent &&
      channelA.mode === channelB.mode &&
      isNoiseChannel(channelA.mode) &&
      isNoiseChannel(channelB.mode)
    const coherentPair =
      !noisePair &&
      coherent &&
      channelA.mode !== 'sine' &&
      channelB.mode !== 'sine' &&
      channelA.mode !== 'off' &&
      channelB.mode !== 'off'
    const sharedNoiseSeed = 3.91

    return Array.from({ length: points }, (_, index) => {
      const t = (index / points) * totalDuration
      const noiseA = isNoiseChannel(channelA.mode)
        ? noiseSampleForTime(channelA.mode, t, coherentNoisePair ? sharedNoiseSeed : 1.7)
        : 0
      const noiseB = isNoiseChannel(channelB.mode)
        ? (coherentNoisePair
          ? noiseSampleForTime(channelB.mode, t - channelB.delayMs / 1000, sharedNoiseSeed)
          : noiseSampleForTime(channelB.mode, t - channelB.delayMs / 1000, 7.1))
        : 0

      const timeA = channelA.mode !== 'off' && !channelA.muted
        ? cycleSample(
            t,
            channelA.frequency,
            0,
            channelA.mode,
            channelA.level,
            coherentNoisePair ? sharedNoiseSeed : coherentPair ? sharedNoiseSeed : 1.7,
            channelA.inverted,
            noiseA,
          )
        : 0
      const timeB = channelB.mode !== 'off' && !channelB.muted
        ? cycleSample(
            t - channelB.delayMs / 1000,
            channelB.frequency,
            0,
            channelB.mode,
            channelB.level,
            coherentNoisePair ? sharedNoiseSeed : coherentPair ? sharedNoiseSeed : 7.1,
            channelB.inverted,
            noiseB,
          )
        : 0

      return {
        x: (index / (points - 1)) * 100,
        a: timeA,
        b: timeB,
        sum: timeA + timeB,
      }
    })
  }, [channelA, channelB, coherent, timeScale])

  const minFreq = 20
  const maxFreq = 20000
  const logX = (freq: number) => {
    const safeFreq = clamp(freq, minFreq, maxFreq)
    return ((Math.log10(safeFreq) - Math.log10(minFreq)) /
      (Math.log10(maxFreq) - Math.log10(minFreq))) * 600
  }

  const linearX = (freq: number) => {
    const safeFreq = clamp(freq, minFreq, maxFreq)
    return ((safeFreq - minFreq) / (maxFreq - minFreq)) * 600
  }

  const frequencyTicks = useMemo(
    () => spectrumLog
      ? [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
      : [0, 5000, 10000, 15000, 20000],
    [spectrumLog],
  )

  const spectrumSignal = useMemo(() => {
    const sampleRate = 22050
    const analysisDuration = 0.75
    const points = Math.ceil(sampleRate * analysisDuration)
    const noisePair = isNoiseChannel(channelA.mode) || isNoiseChannel(channelB.mode)
    const coherentNoisePair =
      coherent &&
      channelA.mode === channelB.mode &&
      isNoiseChannel(channelA.mode) &&
      isNoiseChannel(channelB.mode)
    const coherentPair =
      !noisePair &&
      coherent &&
      channelA.mode !== 'sine' &&
      channelB.mode !== 'sine' &&
      channelA.mode !== 'off' &&
      channelB.mode !== 'off'
    const sharedNoiseSeed = 3.91

    return Array.from({ length: points }, (_, index) => {
      const t = index / sampleRate
      const noiseA = isNoiseChannel(channelA.mode)
        ? noiseSampleForTime(channelA.mode, t, coherentNoisePair ? sharedNoiseSeed : 1.7)
        : 0
      const noiseB = isNoiseChannel(channelB.mode)
        ? (coherentNoisePair
          ? noiseSampleForTime(channelB.mode, t - channelB.delayMs / 1000, sharedNoiseSeed)
          : noiseSampleForTime(channelB.mode, t - channelB.delayMs / 1000, 7.1))
        : 0

      const timeA = channelA.mode !== 'off' && !channelA.muted
        ? cycleSample(
            t,
            channelA.frequency,
            0,
            channelA.mode,
            channelA.level,
            coherentNoisePair ? sharedNoiseSeed : coherentPair ? sharedNoiseSeed : 1.7,
            channelA.inverted,
            noiseA,
          )
        : 0
      const timeB = channelB.mode !== 'off' && !channelB.muted
        ? cycleSample(
            t - channelB.delayMs / 1000,
            channelB.frequency,
            0,
            channelB.mode,
            channelB.level,
            coherentNoisePair ? sharedNoiseSeed : coherentPair ? sharedNoiseSeed : 7.1,
            channelB.inverted,
            noiseB,
          )
        : 0

      return timeA + timeB
    })
  }, [channelA, channelB, coherent])

  const spectrumFrequencies = useMemo(() => {
    const points = spectrumLog ? 240 : 400

    if (!spectrumLog) {
      return Array.from({ length: points }, (_, index) => {
        const ratio = index / (points - 1)
        return minFreq + ratio * (maxFreq - minFreq)
      })
    }

    return Array.from({ length: points }, (_, index) => {
      const ratio = index / (points - 1)
      return 10 ** (Math.log10(minFreq) + ratio * (Math.log10(maxFreq) - Math.log10(minFreq)))
    })
  }, [spectrumLog])

  const spectrumData = useMemo(() => {
    if (spectrumSignal.length === 0) {
      return spectrumFrequencies.map((frequency) => ({ frequency, db: -50, offset: 0 }))
    }

    const signal = spectrumSignal
    const sampleRate = 22050
    const analysisLength = Math.min(signal.length, 8192)
    const trimmed = signal.slice(0, analysisLength)
    const coherentNoiseSource =
      coherent &&
      channelA.mode === channelB.mode &&
      isNoiseChannel(channelA.mode) &&
      !channelA.muted &&
      !channelB.muted
    const pinkSpectrum =
      channelA.mode === 'pink' &&
      channelB.mode === 'pink' &&
      !channelA.muted &&
      !channelB.muted

    const magnitudes = spectrumFrequencies.map((frequency) => {
      let real = 0
      let imag = 0

      for (let n = 0; n < trimmed.length; n++) {
        const angle = (-2 * Math.PI * frequency * n) / sampleRate
        real += trimmed[n] * Math.cos(angle)
        imag += trimmed[n] * Math.sin(angle)
      }

      return {
        frequency,
        magnitude: Math.sqrt(real * real + imag * imag) / trimmed.length,
      }
    })

    const maxMagnitude = Math.max(...magnitudes.map((bin) => bin.magnitude), 0.0001)

    const bins = magnitudes.map(({ frequency, magnitude }) => {
      const normalizedMagnitude = magnitude / maxMagnitude
      const dftDb = 20 * Math.log10(Math.max(0.00001, normalizedMagnitude))
      const pinkTiltDb = pinkSpectrum
        ? -3 * Math.log2(Math.max(frequency, minFreq) / minFreq)
        : 0
      const delaySeconds = channelB.delayMs / 1000
      const combShapeDb = coherentNoiseSource
        ? 20 * Math.log10(Math.max(0.05, Math.abs(Math.cos(Math.PI * frequency * delaySeconds))))
        : 0

      return {
        frequency,
        db: clamp(dftDb + pinkTiltDb + combShapeDb, -50, 10),
      }
    })

    return bins.map((bin, offset) => ({ ...bin, offset }))
  }, [channelA.mode, channelA.muted, channelB.delayMs, channelB.mode, channelB.muted, coherent, spectrumFrequencies, spectrumSignal])

  const spectrumPath = useMemo(() => {
    if (spectrumData.length === 0) return ''

    const points = spectrumData.map((point) => ({
      x: spectrumLog ? logX(point.frequency) : linearX(point.frequency),
      y: 200 - ((point.db + 50) / 60) * 200,
    }))

    const smoothOnce = (values: number[]) =>
      values.map((_, index) => {
      const weights = [1, 2, 3, 4, 5, 4, 3, 2, 1]
      let totalWeight = 0
      let totalY = 0

      for (let offset = -4; offset <= 4; offset++) {
        const targetIndex = clamp(index + offset, 0, values.length - 1)
        const weight = weights[offset + 4]
        totalWeight += weight
        totalY += values[targetIndex] * weight
      }

      return totalY / totalWeight
    })

    const rawY = points.map((point) => point.y)
    const weightedY = spectrumSmooth ? smoothOnce(smoothOnce(rawY)) : rawY

    if (!spectrumSmooth) {
      return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${weightedY[index].toFixed(2)}`)
        .join(' ')
    }

    if (points.length < 3) {
      return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${weightedY[index].toFixed(2)}`)
        .join(' ')
    }

    let path = `M ${points[0].x.toFixed(2)} ${weightedY[0].toFixed(2)}`
    for (let index = 1; index < points.length - 1; index++) {
      const current = points[index]
      const next = points[index + 1]
      const controlY = weightedY[index]
      const nextY = weightedY[index + 1]
      const midX = (current.x + next.x) / 2
      const midY = (controlY + nextY) / 2
      path += ` Q ${current.x.toFixed(2)} ${controlY.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`
    }

    const last = points[points.length - 1]
    path += ` T ${last.x.toFixed(2)} ${weightedY[weightedY.length - 1].toFixed(2)}`
    return path
  }, [spectrumData, spectrumSmooth])

  const waveformPath = useMemo(() => {
    if (waveformData.length === 0) return ''

    return waveformData
      .map((point, index) => {
        const x = (point.x / 100) * 780
        const y = 115 - point.sum * 57.5
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }, [waveformData])

  const channelAPath = useMemo(() => {
    return waveformData
      .map((point, index) => {
        const x = (point.x / 100) * 780
        const y = 115 - point.a * 57.5
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }, [waveformData])

  const channelBPath = useMemo(() => {
    return waveformData
      .map((point, index) => {
        const x = (point.x / 100) * 780
        const y = 115 - point.b * 57.5
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }, [waveformData])

  const updateDelay = (nextDelayMs: number) => {
    const safeDelay = clamp(nextDelayMs, 0, 10)
    const nextPhase = clamp((safeDelay * channelB.frequency * 360) / 1000, 0, 360)
    setChannelB((current) => ({ ...current, delayMs: safeDelay, phaseDeg: nextPhase }))
  }

  const updatePhase = (nextPhase: number) => {
    const safePhase = clamp(nextPhase, 0, 360)
    const freq = channelB.frequency || 1
    const nextDelay = (safePhase / (360 * freq)) * 1000
    setChannelB((current) => ({ ...current, delayMs: nextDelay, phaseDeg: safePhase }))
  }

  return (
    <div className="delay-sim-app">
      <div className="app-shell">
        <aside className="sidebar">
          <GeneratorPanel
            title="Generator A"
            channel={channelA}
            onUpdate={(updater) => setChannelA((current) => updater(current))}
          />

          <GeneratorPanel
            title="Generator B"
            channel={channelB}
            onUpdate={(updater) => setChannelB((current) => updater(current))}
            meterClass="secondary"
            frequencyLocked={linkFrequency}
            modeLocked={linkFrequency}
          />

          <div className="control-panel panel yellow-panel coupling-panel">
            <div className="panel-title alt">Phase / Delay</div>
            <div className="panel-body">
              <label className="field toggle-field">
                <span>Coherence</span>
                <input
                  type="checkbox"
                  checked={coherent}
                  onChange={(event) => setCoherent(event.target.checked)}
                />
              </label>

              <label className="field toggle-field">
                <span>Link Generators</span>
                <input
                  type="checkbox"
                  checked={linkFrequency}
                  onChange={(event) => {
                    const nextLinked = event.target.checked
                    setLinkFrequency(nextLinked)
                    if (nextLinked) {
                      setChannelB((current) => ({
                        ...current,
                        frequency: channelA.frequency,
                        mode: channelA.mode,
                      }))
                    }
                  }}
                />
              </label>

              <div className="phase-grid">
                <label className="phase-box phase-input-box">
                  <span>Phase</span>
                  <input
                    type="number"
                    min={0}
                    max={360}
                    step={5}
                    value={Math.round(channelB.phaseDeg)}
                    onChange={(event) => {
                      const rawValue = event.target.value
                      if (rawValue === '') return

                      const nextPhase = Number(rawValue)
                      if (Number.isNaN(nextPhase)) return
                      updatePhase(nextPhase)
                    }}
                    onBlur={(event) => {
                      const safePhase = clamp(Number(event.target.value || 0), 0, 360)
                      updatePhase(safePhase)
                    }}
                  />
                  <small>°</small>
                </label>
                <label className="phase-box phase-input-box">
                  <span>Delay</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={channelB.delayMs.toFixed(2)}
                    onChange={(event) => {
                      const rawValue = event.target.value
                      if (rawValue === '') return

                      const nextDelay = Number(rawValue)
                      if (Number.isNaN(nextDelay)) return
                      updateDelay(nextDelay)
                    }}
                    onBlur={(event) => {
                      const safeDelay = clamp(Number(event.target.value || 0), 0, 10)
                      updateDelay(safeDelay)
                    }}
                  />
                  <small>ms</small>
                </label>
              </div>

              <div className="phase-controls">
                <button type="button" className="phase-button" onClick={() => updatePhase(0)}>
                  0°
                </button>
                <button type="button" className="phase-button" onClick={() => updatePhase(90)}>
                  90°
                </button>
                <button type="button" className="phase-button" onClick={() => updatePhase(180)}>
                  180°
                </button>
                <button type="button" className="phase-button" onClick={() => updatePhase(270)}>
                  270°
                </button>
              </div>

              <label className="field phase-slider-field">
                <span>Delay (ms)</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.01}
                  value={channelB.delayMs}
                  onChange={(event) => updateDelay(Number(event.target.value))}
                />
              </label>

              <label className="field phase-slider-field">
                <span>Phase (°)</span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={channelB.phaseDeg}
                  onChange={(event) => updatePhase(Number(event.target.value))}
                />
              </label>

            </div>
          </div>
        </aside>

        <main className="visual-panel">
          <div className="meter-section">
            <div className="meter-container">
              <div className="meter-title">Level</div>
              <div className="meter-scale-wrap">
                <div className="meter-labels">
                  {Array.from({ length: 11 }, (_, i) => {
                    const dbVal = 9 - i * 3
                    return (
                      <div key={i} className="meter-label">
                        {dbVal}
                      </div>
                    )
                  })}
                </div>
                <div className="meter-bar-wrap">
                  <div className="meter-bar">
                    <div className="meter-ticks">
                      {Array.from({ length: 61 }, (_, i) => {
                        const dbVal = 9 - i * 0.5
                        const isMajor = i % 2 === 0
                        return (
                          <div
                            key={i}
                            className={`meter-tick ${isMajor ? 'major' : 'minor'}`}
                            style={{ bottom: `${(dbVal + 30) * 2.5}%` }}
                          />
                        )
                      })}
                    </div>
                    <div
                      className="meter-bar-fill"
                      style={{ height: `${combinedMeterPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="meter-value">{combinedMeterValue.toFixed(1)} dB</div>
            </div>
          </div>

          <div className="scope-panel">
            <div className="scope-header">
              <h2>Time domain</h2>
            </div>

            <div className="scope-container">
              <div className="amplitude-labels">
                {[2, 1.5, 1, 0.5, 0, -0.5, -1, -1.5, -2].map((val) => (
                  <div
                    key={val}
                    className="amplitude-label"
                    style={{
                      bottom: `${((val + 2) / 4) * 100}%`,
                    }}
                  >
                    {val}
                  </div>
                ))}
              </div>

              <div className="scope-wrapper">
                <svg viewBox="0 0 780 230" className="scope-svg" preserveAspectRatio="none">
                  <g className="grid-lines">
                    {Array.from({ length: 9 }, (_, index) => {
                      const y = (230 / 8) * index;
                      return <line key={`h-${index}`} x1="0" y1={y} x2="780" y2={y} />;
                    })}
                    {Array.from({ length: 5 }, (_, index) => {
                      const x = (780 / 4) * index;
                      return <line key={`v-${index}`} x1={x} y1="0" x2={x} y2="230" />;
                    })}
                  </g>

                  <path d={channelAPath} className="wave wave-a" />
                  <path d={channelBPath} className="wave wave-b" />
                  <path d={waveformPath} className="wave wave-sum" />
                </svg>

                <div className="time-labels">
                  {[0, 1, 2, 3, 4].map((val, idx) => {
                    const timeVal = (val / 4) * timeScale
                    const ms = Math.round(timeVal * 1000)
                    return (
                      <div key={idx} className="time-label">{ms}ms</div>
                    )
                  })}
                </div>
              </div>

              <div className="timescale-slider">
                <div className="slider-label">timescale</div>
                <input
                  type="range"
                  min="0.01"
                  max="0.1"
                  step="0.001"
                  value={timeScale}
                  onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                  className="slider"
                />
                <div className="slider-values">
                  <div className="slider-min">0.1</div>
                  <div className="slider-max">0.01</div>
                </div>
              </div>
            </div>
          </div>

          <div className="spectrum-panel">
            <div className="spectrum-header">
              <h2>Frequency domain</h2>
              <div className="spectrum-controls">
                <button
                  type="button"
                  className={spectrumLog ? 'active' : ''}
                  onClick={() => setSpectrumLog((current) => !current)}
                >
                  Log
                </button>
                <button
                  type="button"
                  className={spectrumSmooth ? 'active' : ''}
                  onClick={() => setSpectrumSmooth((current) => !current)}
                >
                  Smooth
                </button>
              </div>
            </div>

            <div className="spectrum-graph">
              <div className="spectrum-container">
                <div className="amplitude-labels-spectrum">
                  {[10, 0, -10, -20, -30, -40, -50].map((val) => (
                    <div
                      key={val}
                      className="amplitude-label-spectrum"
                      style={{ top: `${((10 - val) / 60) * 100}%` }}
                    >
                      {val}dB
                    </div>
                  ))}
                </div>

                <div className="spectrum-inner">
                  {/* Grid lines */}
                  <svg className="spectrum-grid" viewBox="0 0 600 200" preserveAspectRatio="none">
                    {/* Horizontal grid lines for dB */}
                    {[0, 1, 2, 3, 4, 5, 6].map((index) => {
                      const y = (200 / 6) * index
                      return <line key={`h-${index}`} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    })}
                    {/* Vertical grid lines for frequency bins */}
                    {frequencyTicks.map((freq) => {
                      const x = spectrumLog ? logX(freq) : linearX(freq)
                      return <line key={`v-${freq}`} x1={x} y1="0" x2={x} y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    })}
                  </svg>

                  <svg className="spectrum-curve-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <path
                      d={spectrumPath}
                      className={`spectrum-curve ${spectrumSmooth ? 'smooth' : 'raw'}`.trim()}
                    />
                  </svg>

                  <div className="frequency-labels">
                    {frequencyTicks.map((freq) => {
                      const xPos = spectrumLog
                        ? ((Math.log10(freq) - Math.log10(minFreq)) /
                          (Math.log10(maxFreq) - Math.log10(minFreq))) * 100
                        : ((freq - minFreq) / (maxFreq - minFreq)) * 100

                      return (
                        <div key={freq} className="frequency-label" style={{ left: `${xPos}%` }}>
                          {freq < 1000 ? `${freq}Hz` : `${(freq / 1000).toFixed(freq >= 5000 ? 0 : 1)}kHz`}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
