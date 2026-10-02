const TORN_API_URL = 'https://api.torn.com/v2'
const FFSCOUTER_API_URL = 'https://ffscouter.com/api/v1'
const SETTINGS_STORAGE_KEY = 'boa.settings.v1'
const DEFAULT_UPDATE_FREQUENCY = 30

let ffscouterApiKey = null
let tornApiKey = null
let updateFrequency = DEFAULT_UPDATE_FREQUENCY
let mainLoopIntervalId = null
let fastLoopIntervalId = null

const getSettings = () => {
  try {
    const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)) || {}
    const savedFrequency = Number(savedSettings.updateFrequency)

    return {
      apiKey: typeof savedSettings.apiKey === 'string' && savedSettings.apiKey.trim() ? savedSettings.apiKey.trim() : null,
      ffscouterApiKey: typeof savedSettings.ffscouterApiKey === 'string' && savedSettings.ffscouterApiKey.trim() ? savedSettings.ffscouterApiKey.trim() : null,
      updateFrequency: Number.isFinite(savedFrequency) && savedFrequency >= 1 ? Math.min(savedFrequency, 3600) : DEFAULT_UPDATE_FREQUENCY,
    }
  } catch {
    return { apiKey: null, ffscouterApiKey: null, updateFrequency: DEFAULT_UPDATE_FREQUENCY }
  }
}

const saveSettings = () => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      apiKey: tornApiKey,
      ffscouterApiKey,
      updateFrequency,
    }))
  } catch {
    // The dashboard still works for the current session when storage is unavailable.
  }
}

const getTornApi = async (path) => {
  if (!tornApiKey) return null

  const fullUrl = `${TORN_API_URL}/${path}?key=${tornApiKey}`

  try {
    const response = await fetch(fullUrl)
    return response.ok ? await response.json() : null
  } catch {
    return null
  }
}

const getFfscouterApi = async (targetIds) => {
  if (!ffscouterApiKey) return null
  if (!targetIds || targetIds.length == 0) return null

  const fullUrl = `${FFSCOUTER_API_URL}/get-stats?key=${ffscouterApiKey}&targets=${targetIds.join(',')}`
  try {
    const response = await fetch(fullUrl)
    return response.ok ? await response.json() : null
  } catch {
    return null
  }
}

const debug = (msg) => {
  const elem = document.getElementById('debug')
  elem.innerText = JSON.stringify(msg)
}

const mainLoop = async () => {
  if (!tornApiKey) return
  await updateBars()
  await updateTargetFactionMembers()
  await updateWarLive()
}

const fastLoop = () => {
  updateWarStatus()
  updateWarChainLive()
}

const stopDashboard = () => {
  clearInterval(mainLoopIntervalId)
  clearInterval(fastLoopIntervalId)
  mainLoopIntervalId = null
  fastLoopIntervalId = null
}

const startDashboard = async () => {
  stopDashboard()
  if (!tornApiKey) return

  ownFaction = null
  targetFaction = null
  ownChain = null
  targetChain = null
  war = null
  targetBattleStats = {}

  const ownFactionLoaded = await fetchOwnFaction()
  if (!ownFactionLoaded) return

  await fetchTargetFaction()
  await mainLoop()
  fastLoop()

  mainLoopIntervalId = setInterval(mainLoop, updateFrequency * 1000)
  fastLoopIntervalId = setInterval(fastLoop, 1000)
}

const initializeSettings = () => {
  const apiKeyInputEl = document.getElementById('api-key-input')
  const ffscouterApiKeyInputEl = document.getElementById('ffscouter-api-key-input')
  const updateFrequencyInputEl = document.getElementById('update-frequency-input')
  const settings = getSettings()

  tornApiKey = settings.apiKey
  ffscouterApiKey = settings.ffscouterApiKey
  updateFrequency = settings.updateFrequency
  apiKeyInputEl.value = tornApiKey || ''
  ffscouterApiKeyInputEl.value = ffscouterApiKey || ''
  updateFrequencyInputEl.value = updateFrequency

  const applySettings = () => {
    tornApiKey = apiKeyInputEl.value.trim() || null
    ffscouterApiKey = ffscouterApiKeyInputEl.value.trim() || null
    const requestedFrequency = Number(updateFrequencyInputEl.value)
    updateFrequency = Number.isFinite(requestedFrequency) && requestedFrequency >= 1
      ? Math.min(requestedFrequency, 3600)
      : DEFAULT_UPDATE_FREQUENCY
    updateFrequencyInputEl.value = updateFrequency
    saveSettings()
    startDashboard()
  }

  apiKeyInputEl.addEventListener('change', applySettings)
  ffscouterApiKeyInputEl.addEventListener('change', applySettings)
  updateFrequencyInputEl.addEventListener('change', applySettings)
}

initializeSettings()
startDashboard()
