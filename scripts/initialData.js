let ownFaction = null
let targetFaction = null
let ownChain = null
let targetChain = null
let war = null

const fetchOwnFaction = async () => {
  const faction = await getTornApi('faction')
  if (!faction?.basic) return false

  ownFaction = faction.basic

  // Club serpent alias
  if (ownFaction.name === 'Club Serpent DUTCH ONLY!!') {
    ownFaction.name = 'Club Serpent'
  }

  const replacementEls = [...document.getElementsByClassName('own-faction-name')]
  replacementEls.forEach(el => el.textContent = ownFaction.name)
  return true
}

const fetchTargetFaction = async () => {
  const warResponse = await getTornApi('faction/wars')
  war = warResponse?.wars?.ranked || null

  const warFactions = war?.factions
  if (!warFactions || warFactions.length == 0) return

  const targetId = warFactions.filter(f => f.id !== ownFaction.id)?.[0]?.id
  if (!targetId) return

  const faction = (await getTornApi(`faction/${targetId}`))?.basic
  if (!faction) return

  targetFaction = faction

  const replacementEls = [...document.getElementsByClassName('target-faction-name')]
  replacementEls.forEach(el => el.textContent = targetFaction.name)
}
