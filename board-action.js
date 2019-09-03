const actions = [
  'Adopted as amended',
  'Adopted on first reading',
  'Adopted',
  'Accepted',
  'Forwarded to BCC with a favorable recommendation with committee amendment(s)',
  'Forwarded to the BCC by the BCC Chairman with a favorable recommendation',
  'Forwarded to the BCC by the BCC Chairwoman with a favorable recommendation',
  'Forwarded to the BCC by the BCC Chairperson with a favorable recommendation',
  'Forwarded to BCC with a favorable recommendation as corrected',
  'Forwarded to BCC with a favorable recommendation',
  'Deferred to next committee meeting',
  'Report Received',
  'Approved',
  'Deferred',
  'Withdrawn'
]

const getSplitAction = str => {
  let final = str
  for (let a = 0; a < actions.length; a += 1) {
    if (str.indexOf(actions[a]) !== -1) {
      const astr = str.split(actions[a])
      astr[1] = actions[a] + astr[1]
      final = astr
      break
    }
  }
  return final
}

module.exports = { actions, getSplitAction }
