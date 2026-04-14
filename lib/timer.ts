// Interval workout timer — pure state machine

export type Mode = "tabata" | "emom" | "amrap"
export type Phase = "work" | "rest" | "idle" | "completed"
export type Status = "idle" | "running" | "paused" | "completed"

export type TabataConfig = {
  work: number
  rest: number
  rounds: number
}

export type EmomConfig = {
  minutes: number
}

export type AmrapConfig = {
  minutes: number
}

export type Config = TabataConfig | EmomConfig | AmrapConfig

export type State = {
  mode: Mode
  config: Config
  status: Status
  phase: Phase
  round: number
  remaining: number
  total: number
  startedAt: number | null
  pausedAt: number | null
  elapsed: number
  amrapRounds: number
}

export const DEFAULTS: Record<Mode, Config> = {
  tabata: { work: 20, rest: 10, rounds: 8 },
  emom: { minutes: 10 },
  amrap: { minutes: 10 },
}

export function init(mode: Mode, config?: Config): State {
  const cfg = config ?? DEFAULTS[mode]
  return {
    mode,
    config: cfg,
    status: "idle",
    phase: "idle",
    round: 0,
    remaining: duration(mode, cfg),
    total: duration(mode, cfg),
    startedAt: null,
    pausedAt: null,
    elapsed: 0,
    amrapRounds: 0,
  }
}

export function duration(mode: Mode, config: Config): number {
  if (mode === "tabata") {
    const c = config as TabataConfig
    return c.work
  }
  if (mode === "emom") return 60
  const c = config as AmrapConfig
  return c.minutes * 60
}

export function totalDuration(mode: Mode, config: Config): number {
  if (mode === "tabata") {
    const c = config as TabataConfig
    return (c.work + c.rest) * c.rounds
  }
  if (mode === "emom") {
    const c = config as EmomConfig
    return c.minutes * 60
  }
  const c = config as AmrapConfig
  return c.minutes * 60
}

export function start(state: State, now: number): State {
  if (state.status === "running") return state
  const round = state.mode === "tabata" ? 1 : (state.mode === "emom" ? 1 : 0)
  const rem = duration(state.mode, state.config)
  return {
    ...state,
    status: "running",
    phase: "work",
    round,
    remaining: rem,
    total: rem,
    startedAt: now,
    pausedAt: null,
    elapsed: 0,
    amrapRounds: 0,
  }
}

export function pause(state: State, now: number): State {
  if (state.status !== "running") return state
  return {
    ...state,
    status: "paused",
    pausedAt: now,
    elapsed: state.elapsed + (now - (state.startedAt ?? now)),
  }
}

export function resume(state: State, now: number): State {
  if (state.status !== "paused") return state
  return {
    ...state,
    status: "running",
    startedAt: now,
    pausedAt: null,
  }
}

export function reset(state: State): State {
  return init(state.mode, state.config)
}

export function addRound(state: State): State {
  if (state.mode !== "amrap") return state
  if (state.status !== "running") return state
  return { ...state, amrapRounds: state.amrapRounds + 1 }
}

export type TickResult = {
  state: State
  transition: "none" | "work" | "rest" | "minute" | "warning30" | "warning10" | "completed"
}

export function tick(state: State, now: number): TickResult {
  if (state.status !== "running" || state.startedAt === null) {
    return { state, transition: "none" }
  }

  const sinceStart = (now - state.startedAt) / 1000
  const totalElapsed = state.elapsed / 1000 + sinceStart

  if (state.mode === "tabata") return tickTabata(state, totalElapsed)
  if (state.mode === "emom") return tickEmom(state, totalElapsed)
  return tickAmrap(state, totalElapsed)
}

function tickTabata(state: State, elapsed: number): TickResult {
  const cfg = state.config as TabataConfig
  const cycle = cfg.work + cfg.rest
  const total = cycle * cfg.rounds

  if (elapsed >= total) {
    return {
      state: { ...state, status: "completed", phase: "completed", remaining: 0, round: cfg.rounds },
      transition: "completed",
    }
  }

  const pos = elapsed % cycle
  const round = Math.min(Math.floor(elapsed / cycle) + 1, cfg.rounds)
  const inWork = pos < cfg.work
  const phase: Phase = inWork ? "work" : "rest"
  const remaining = inWork
    ? Math.max(0, Math.ceil(cfg.work - pos))
    : Math.max(0, Math.ceil(cfg.rest - (pos - cfg.work)))

  let transition: TickResult["transition"] = "none"
  if (phase !== state.phase) {
    transition = phase === "work" ? "work" : "rest"
  }

  return {
    state: { ...state, phase, round, remaining, total: inWork ? cfg.work : cfg.rest },
    transition,
  }
}

function tickEmom(state: State, elapsed: number): TickResult {
  const cfg = state.config as EmomConfig
  const total = cfg.minutes * 60

  if (elapsed >= total) {
    return {
      state: { ...state, status: "completed", phase: "completed", remaining: 0, round: cfg.minutes },
      transition: "completed",
    }
  }

  const minute = Math.floor(elapsed / 60) + 1
  const inMinute = elapsed % 60
  const remaining = Math.max(0, Math.ceil(60 - inMinute))

  let transition: TickResult["transition"] = "none"
  if (minute !== state.round && state.round > 0) {
    transition = "minute"
  }

  return {
    state: { ...state, phase: "work", round: minute, remaining, total: 60 },
    transition,
  }
}

function tickAmrap(state: State, elapsed: number): TickResult {
  const cfg = state.config as AmrapConfig
  const total = cfg.minutes * 60
  const remaining = Math.max(0, Math.ceil(total - elapsed))

  if (elapsed >= total) {
    return {
      state: { ...state, status: "completed", phase: "completed", remaining: 0 },
      transition: "completed",
    }
  }

  let transition: TickResult["transition"] = "none"
  if (remaining === 30 && state.remaining > 30) transition = "warning30"
  if (remaining === 10 && state.remaining > 10) transition = "warning10"

  return {
    state: { ...state, phase: "work", remaining, total: total },
    transition,
  }
}

export function format(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function roundLabel(state: State): string {
  if (state.mode === "tabata") {
    const cfg = state.config as TabataConfig
    return `${state.round} / ${cfg.rounds}`
  }
  if (state.mode === "emom") {
    const cfg = state.config as EmomConfig
    return `Minute ${state.round} / ${cfg.minutes}`
  }
  return `${state.amrapRounds} rounds`
}

export function phaseLabel(state: State): string {
  if (state.phase === "work") return "WORK"
  if (state.phase === "rest") return "REST"
  if (state.phase === "completed") return "DONE"
  return ""
}

export function pauseDuration(state: State, now: number): number {
  if (state.status !== "paused" || !state.pausedAt) return 0
  return Math.floor((now - state.pausedAt) / 1000)
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function progress(state: State): number {
  if (state.total === 0) return 0
  return 1 - state.remaining / state.total
}
