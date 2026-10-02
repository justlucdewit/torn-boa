const MEMBER_TAG_STORAGE_KEY = 'boa.member-tags.v1'

const MEMBER_TAGS = {
  'group-target': {
    label: 'Group target',
    icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
  'alternative-target': {
    label: 'Alternative target',
    icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
  },
  unknown: {
    label: 'Unknown',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4"/><path d="M12 17h.01"/>',
  },
  avoid: {
    label: 'Avoid',
    icon: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  },
}

const MEMBER_TAG_ORDER = ['group-target', 'alternative-target', 'unknown', 'avoid']
let targetFactionMembers = []
let targetBattleStats = {}

const getMemberTags = () => {
  try {
    return JSON.parse(localStorage.getItem(MEMBER_TAG_STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

const getMemberTag = (member) => getMemberTags()[member.id] || 'unknown'

const setMemberTag = (memberId, tag) => {
  const memberTags = getMemberTags()
  memberTags[memberId] = tag
  try {
    localStorage.setItem(MEMBER_TAG_STORAGE_KEY, JSON.stringify(memberTags))
  } catch {
    // Keep the current session usable when storage is unavailable.
  }
}

const iconSvg = (icon) => `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        ${icon}
    </svg>
`

const sortMembers = (a, b) => {
  const tagDifference = MEMBER_TAG_ORDER.indexOf(getMemberTag(a)) - MEMBER_TAG_ORDER.indexOf(getMemberTag(b))
  if (tagDifference) return tagDifference

  const hittableDifference = Number(b.status.state === 'Okay') - Number(a.status.state === 'Okay')
  if (hittableDifference) return hittableDifference

  return b.level - a.level
}

const formatTravelStatus = (member) => {
  const description = member.status.description.trim()

  const match = description.match(/^Traveling from (.+) to (.+)$/)
  if (!match) return description

  const origin = match[1]
  const destination = match[2]
  if (destination === 'Torn') return `✈ ← ${origin}`

  return `✈ → ${destination}`
}

const formatAbroadStatus = (member) => {
  const description = member.status.description.trim()
  const country = description.replace(/^In /, '')
  return `📍 ${country}`
}

const formatHospitalRelease = (member) => {
  if (member.status.state !== 'Hospital') return member.status.state

  const releaseTime = Number(member.status.until)
  if (!Number.isFinite(releaseTime) || releaseTime <= 0) return member.status.state

  const releaseLabel = new Date(releaseTime * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `Hospital (out ${releaseLabel})`
}

const formatMemberStatus = (member) => {
  switch (member.status.state) {
    case 'Hospital': return formatHospitalRelease(member)
    case 'Traveling': return formatTravelStatus(member)
    case 'Abroad': return formatAbroadStatus(member)
    default: return member.status.state
  }
}

const createTagPicker = (member) => {
  const selectedTag = getMemberTag(member)
  const pickerEl = document.createElement('details')
  pickerEl.className = `tag-picker tag-${selectedTag}`
  pickerEl.addEventListener('click', event => event.stopPropagation())

  const triggerEl = document.createElement('summary')
  triggerEl.className = 'tag-trigger'
  triggerEl.title = `Tag: ${MEMBER_TAGS[selectedTag].label}`
  triggerEl.setAttribute('aria-label', `Change tag for ${member.name}. Current tag: ${MEMBER_TAGS[selectedTag].label}`)
  triggerEl.innerHTML = iconSvg(MEMBER_TAGS[selectedTag].icon)

  const menuEl = document.createElement('div')
  menuEl.className = 'tag-menu'
  menuEl.setAttribute('role', 'menu')
  menuEl.setAttribute('aria-label', `Tags for ${member.name}`)

  Object.entries(MEMBER_TAGS).forEach(([tag, config]) => {
    const optionEl = document.createElement('button')
    optionEl.type = 'button'
    optionEl.className = `tag-option tag-${tag}`
    optionEl.title = config.label
    optionEl.setAttribute('aria-label', config.label)
    optionEl.setAttribute('role', 'menuitem')
    optionEl.setAttribute('aria-pressed', String(selectedTag === tag))
    optionEl.innerHTML = iconSvg(config.icon)
    optionEl.addEventListener('click', () => {
      setMemberTag(member.id, tag)
      renderTargetFactionMembers()
    })
    menuEl.appendChild(optionEl)
  })

  pickerEl.append(triggerEl, menuEl)
  return pickerEl
}

const updateTargetBattleStats = async () => {
  const battleStatsToFetch = targetFactionMembers.map(member => member.id).filter(id => !targetBattleStats[id])

  if (battleStatsToFetch.length == 0) return false

  const response = await getFfscouterApi(battleStatsToFetch)
  if (!response) return false

  response.forEach(battleStats => {
    const memberId = battleStats.player_id
    targetBattleStats[memberId] = battleStats
  })

  return true
}

const renderTargetFactionMembers = () => {
  const targetMemberListEl = document.getElementById('target-member-list')
  targetMemberListEl.replaceChildren()
  const sortedMembers = targetFactionMembers.slice().sort(sortMembers)

  sortedMembers.forEach(member => {
    const rowEl = document.createElement('tr')
    const isHittable = member.status.state === 'Okay'
    const activityStatus = member.last_action.status
    const levelCellEl = document.createElement('td')
    const nameCellEl = document.createElement('td')
    const battleStatsCellEl = document.createElement('td')
    const battleStats = targetBattleStats[member.id]
    const nameEl = document.createElement('span')
    const statusCellEl = document.createElement('td')

    rowEl.className = isHittable ? 'hittable' : 'unhittable'
    rowEl.dataset.tag = getMemberTag(member)
    levelCellEl.textContent = member.level
    nameCellEl.className = `member-name status-${activityStatus}`
    nameEl.textContent = member.name
    battleStatsCellEl.className = 'member-battle-stats'
    battleStatsCellEl.textContent = battleStats?.bs_estimate_human || '-'
    if (battleStats?.fair_fight)
      battleStatsCellEl.title = `Fair fight: ${battleStats.fair_fight}`
    statusCellEl.className = 'member-status'
    statusCellEl.textContent = formatMemberStatus(member)
    statusCellEl.title = member.status.description

    nameCellEl.append(nameEl, createTagPicker(member))
    rowEl.append(levelCellEl, nameCellEl, battleStatsCellEl, statusCellEl)
    rowEl.addEventListener('click', () => {
      window.open(`https://www.torn.com/page.php?sid=attack&user2ID=${member.id}`, '_blank')
    })
    targetMemberListEl.appendChild(rowEl)
  })
}

const updateTargetFactionMembers = async () => {
  if (!targetFaction?.id) {
    document.getElementById('target-member-list').replaceChildren()
    return
  }

  const response = await getTornApi(`faction/${targetFaction.id}/members`)
  if (!response?.members) return

  targetFactionMembers = response.members
  renderTargetFactionMembers()

  if (await updateTargetBattleStats())
    renderTargetFactionMembers()
}
