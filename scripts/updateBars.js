const formatCooldown = (seconds) => {
    const totalSeconds = Math.max(0, Math.floor(seconds))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor(totalSeconds % 3600 / 60)
    const remainingSeconds = totalSeconds % 60

    if (hours) return `${hours}h ${minutes}m`
    if (minutes) return `${minutes}m ${remainingSeconds}s`
    return `${remainingSeconds}s`
}

const updateBars = async () => {
    const barsResponse = await getTornApi('user/bars')
    const cooldownsResponse = await getTornApi('user/cooldowns')
    const bars = barsResponse?.bars
    const cooldowns = cooldownsResponse?.cooldowns
    if (!bars?.energy || !bars?.life || !cooldowns) return

    const max_med_cooldown = 60 * 60 * 6 // 6h
    const max_drug_cooldown = 60 * 60 * 8 // 8h

    const energyEl = document.getElementById('energy-bar')
    const healthEl = document.getElementById('health-bar')
    const medCooldownEl = document.getElementById('med-bar')
    const drugCooldownEl = document.getElementById('drug-bar')
    const energyValueEl = document.getElementById('energy-value')
    const healthValueEl = document.getElementById('health-value')
    const medValueEl = document.getElementById('med-value')
    const drugValueEl = document.getElementById('drug-value')

    energyEl.style.width = `${bars.energy.current / bars.energy.maximum * 100}%`
    healthEl.style.width = `${bars.life.current / bars.life.maximum * 100}%`
    medCooldownEl.style.width = `${cooldowns.medical / max_med_cooldown * 100}%`
    drugCooldownEl.style.width = `${cooldowns.drug / max_drug_cooldown * 100}%`

    energyValueEl.textContent = `(${bars.energy.current}/${bars.energy.maximum})`
    healthValueEl.textContent = `(${bars.life.current}/${bars.life.maximum})`
    medValueEl.textContent = `(${formatCooldown(cooldowns.medical)}/${formatCooldown(max_med_cooldown)})`
    drugValueEl.textContent = `(${formatCooldown(cooldowns.drug)}/${formatCooldown(max_drug_cooldown)})`
}
