const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const officeHolders = require('./office-holders')
const { getSplitAction } = require('./board-action')
const crypto = require('crypto')

const START_DATE = '06-18-1996'
const END_DATE = '09-02-2019'

const genURL = officeHolder => `https://www.miamidade.gov/govaction/Votingrecord.asp?` +
  `begdate=${START_DATE}&` +
  `enddate=${END_DATE}&` +
  `OfficeHolders=${officeHolder}&` +
  `MatterType=AllMatters&` +
  `BodyType=AllBodies` +
  `&submit1=Submit`

const getCombinedRecords = $ => {
  const allObjs = $('tr[valign="top"]')
  const combinedRecords = (() => {
    let cr = []
    for (let i = 0; i < allObjs.length; i += 1) {
      const currentObj = allObjs[i]
      switch (i % 3) {
        case 0: // 1st line
          cr.push([currentObj]); break
        case 1:
        case 2:
          cr[cr.length - 1].push(currentObj); break
      }
    }
    return cr
  })()
  return combinedRecords
}

const c$get = (a, b, c, d) => {
  const nodeInd = a[b]
  const mainNode = cheerio.load(nodeInd)(d)
  const selectNode = mainNode.eq(c)

  return selectNode.text()
}

const cleanInv = str => str.replace(/�/gi, '\'').replace(/\n/gm, '')

const getResolutions = (combinedRecords, vote = true) => combinedRecords.map(a => {
  const id = Number(c$get(a, 0, 0, 'td'))
  const name = cleanInv(String(c$get(a, 0, 1, 'td')))
  const type = String(c$get(a, 0, 2, 'td'))
  const description = cleanInv(String(c$get(a, 1, 1, 'td')))
  const resolutionFull = cleanInv(String(c$get(a, 2, 1, 'td')))
  const date = resolutionFull.match(/([0-9]){1,2}\/([0-9]){1,2}\/([0-9]){4}/g)[0]
  const resolutionVerbose = getSplitAction(resolutionFull.split(date)[1])
  const status = resolutionVerbose[1]
  const control = resolutionVerbose[0]
  const voting = String(c$get(a, 2, 2, 'td')).split('VOTED:')[1]
  const _id = crypto.createHash('md5').update(id + date + status).digest('hex')
  return {
    _id, id, name, type, description, date, control, status, voting
  }
})

const getVotingRecord = async officeHolder => {
  const url = genURL(officeHolder)
  console.log(`Fetching for ${officeHolders[officeHolder]} via ${url}`)
  let hdata
  try {
    const { data } = await axios.get(url, {
      headers: {
        'user-agent': 'Mozilla/5.0'
      }
    })
    hdata = data
  } catch (err) {
    throw err
  }
  console.log(`Finished fetching records for ${officeHolders[officeHolder]}`)
  return hdata
}

const get$ = htmlData => {
  return cheerio.load(htmlData)
}

const loopy = async () => {
  for (let a in officeHolders) {
    await getVotingRecord(a)
      .then(get$)
      .then(getCombinedRecords)
      .then(getResolutions)
      .then(data => {
        // _id, id, name, type, description, date, control, status, voting
        const origHeaders = ['_id', 'id', 'name', 'type', 'description', 'date', 'control', 'status', 'voting']
        const headers = [
          '_id', 'File Number', 'File Name', 'File Type', 'Title', 'Date', 'Control', 'Status', 'Voted'
        ].map(a => `"${a}"`).join(',')
        const sanitizedName = officeHolders[a].replace(/[^A-Za-z0-9\s]/gm, '')
        const ws = fs.createWriteStream(`csv/${sanitizedName}.csv`)
        console.log(`Writing for ${officeHolders[a]}`)
        ws.write(headers + '\n')
        const tot = data.length
        for (let i = 0; i < tot; i += 1) {
          let line = []
          origHeaders.forEach(h => line.push(`"${data[i][h]}"`))
          ws.write(line.join(',') + '\n')
          console.log(`${((i + 1) / tot * 100).toFixed(2)}%\t${officeHolders[a]}`)
        }
        ws.end()
      })
  }
}

loopy().then(process.exit)
