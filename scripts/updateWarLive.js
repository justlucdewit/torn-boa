const format_chain_timer = (seconds) => {
    const total_minutes = Math.floor(seconds / 60)
    return `${total_minutes}:${seconds - total_minutes*60}`
}

const updateWarLive = async () => {
    if (!ownFaction?.id || !targetFaction?.id || !war?.factions) return

    const ownChainResponse = await getTornApi('faction/chain')
    const targetChainResponse = await getTornApi(`faction/${targetFaction.id}/chain`)
    if (!ownChainResponse?.chain || !targetChainResponse?.chain) return

    ownChain = ownChainResponse.chain
    targetChain = targetChainResponse.chain

    // Score
    const ownWar = war.factions.filter(f => f.name.includes(ownFaction.name))[0]
    const targetWar = war.factions.filter(f => f.name.includes(targetFaction.name))[0]

    const warLiveVersusEL = document.getElementById('war-live-versus')
    warLiveVersusEL.innerHTML = `${ownFaction.name} - ${targetFaction.name}`

    const warLiveScoreEl = document.getElementById('war-live-score')
    warLiveScoreEl.innerHTML = `${ownWar.score} - ${targetWar.score}`
    
    // Lead target overview
    const warLiveLeadEl = document.getElementById('war-live-lead')
    if (ownWar.score >= targetWar.score) {
        const lead = ownWar.score - targetWar.score
        warLiveLeadEl.innerHTML = `${ownFaction.name} is currently in lead by <b>${lead}</b><br>leader needs <b>${war.target}</b> lead to win. <b>${100 * lead / war.target}%</b> of the way there.`
    } else {
        const lead = targetWar.score - ownWar.score
        warLiveLeadEl.innerHTML = `${targetFaction.name} is currently in lead by <b>${lead}</b><br>leader needs <b>${war.target}</b> lead to win. <b>${100 * lead / war.target}%</b> of the way there.`
    }

    // 3 / 100 (3:23)
}

const updateWarChainLive = () => {
    if (!ownChain || !targetChain) return;
    const current_timestamp = Math.floor(Date.now() / 1000)
    const ownChainTimerEl = document.getElementById('own-chain-timer')
    const targetChainTimerEl = document.getElementById('target-chain-timer')

    if (ownChain.start) {
        if (ownChain.end < current_timestamp) {
            ownChainTimerEl.innerHTML = '*cooldown*'
        } else {
            const chainTimer = ownChain.end - current_timestamp
            ownChainTimerEl.innerHTML = `${ownChain.current} / ${ownChain.max} (${format_chain_timer(chainTimer)})`
        }
    } else {
        ownChainTimerEl.innerHTML = '*no chain*'
    }

    if (targetChain.start) {
        if (targetChain.end < current_timestamp) {
            targetChainTimerEl.innerHTML = '*cooldown*'
        } else {
            const chainTimer = targetChain.end - current_timestamp
            targetChainTimerEl.innerHTML = `${targetChain.current} / ${targetChain.max} (${format_chain_timer(chainTimer)})`
        }
    } else {
        targetChainTimerEl.innerHTML = '*no chain*'
    }
}
