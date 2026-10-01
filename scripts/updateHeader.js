const format_war_timer = (seconds) => {
    const segments = []

    const total_days = Math.floor(seconds / 86400)
    const total_hours = Math.floor(seconds / 3600)
    const total_minutes = Math.floor(seconds / 60)

    if (total_days)
        segments.push(`${total_days}d`)
    if (total_hours)
        segments.push(`${total_hours - total_days*24}h`)
    if (total_minutes)
        segments.push(`${total_minutes - total_hours*60}m`)
    segments.push(`${seconds - total_minutes*60}s`)

    return segments.join(' ')
}

const updateWarStatus = () => {
    const current_timestamp = Math.floor(Date.now() / 1000)

    // War status
    const warStatusEl = document.getElementById('war-status')
    warStatusEl.innerHTML = 'Not currently in war'

    if (war?.war_id && ownFaction && targetFaction) {
        const started = current_timestamp >= war.start
        warStatusEl.innerHTML = `${ownFaction.name} - ${targetFaction.name} ${!started ? '(awaiting start)' : ''}`
    }

    const warTimerEl = document.getElementById('war-timer')
    warTimerEl.innerHTML = ''

    if (war?.war_id) {
        const war_time = current_timestamp - war.start
        const t = Math.abs(war_time)
        warTimerEl.innerHTML = format_war_timer(t)
    }
}
