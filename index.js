const axios = require('axios')
const cheerio = require('axios')
const fs = require('fs')
const officeHolders = require('./office-holders')

const START_DATE = '06-18-1996'
const END_DATE = '08-25-2019'

const genURL = officeHolder => `https://www.miamidade.gov/govaction/Votingrecord.asp?` +
  `begdate=${START_DATE}&` +
  `enddate=${END_DATE}&` +
  `OfficeHolders=${officeHolders[officeHolder]}&` +
  `MatterType=AllMatters&` +
  `BodyType=AllBodies` +
  `&submit1=Submit`

const allObjs = document.querySelectorAll('tr[valign="top"]')
const combinedRecords = (() => {
  let cr = []
  for (let i = 0; i < allObjs.length; i += 1) {
    var currentObj = allObjs[i]
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

const resolutions = (() => {
  const r = {}
  combinedRecords.forEach(a => {
    var id = Number(Array.from(a[0].querySelectorAll('b'))[0].innerText)
    var name = String(Array.from(a[0].querySelectorAll('b'))[1].innerText)
    var type = String(Array.from(a[0].querySelectorAll('b'))[2].innerText)
    var description = String(Array.from(a[1].querySelectorAll('b'))[1].innerText)
    var resolutionFull = String(Array.from(a[2].querySelectorAll('b'))[1].innerText)
    var date = resolutionFull.match(/([0-9]){1,2}\/([0-9]){1,2}\/([0-9]){4}/g)[0]
    var resolution = resolutionFull.split(date)[1]
    r[id] = {
      id, name, type, description, date, resolution
    }
  })
  return r
})()
