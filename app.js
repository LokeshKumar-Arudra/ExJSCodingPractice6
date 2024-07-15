let express = require('express')
let app = express()

let path = require('path')
let {open} = require('sqlite')
let sqlite3 = require('sqlite3')

let dbPath = path.join(__dirname, 'covid19India.db')

let dataBase

let initializeDBAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(error.message)
  }
}

initializeDBAndServer()

convertDBResponse = each => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  }
}

//1. GET all states
app.get('/states/', async (request, response) => {
  let getStates = `SELECT * FROM state ;`
  let dbResponse1 = await dataBase.all(getStates)
  response.send(dbResponse1.map(each => convertDBResponse(each)))
})

//2. GET Returns a state based on the state ID

app.get('/states/:stateId/', async (request, response) => {
  try {
    let {stateId} = request.params
    let getQuery2 = `
  SELECT *
  FROM 
    state
  WHERE
    state_id = ${stateId};
  `
    let get2Response = await dataBase.get(getQuery2)
    response.send(convertDBResponse(get2Response))
  } catch (error) {
    console.error(error.message)
  }
})

//3. Create a district in the district table

app.use(express.json())

app.post('/districts/', async (request, response) => {
  let bodyDetails = request.body
  let {districtName, stateId, cases, cured, active, deaths} = bodyDetails
  let insertQuery = `
  INSERT INTO
    district (district_name , state_id , cases, cured , active , deaths)
  VALUES
    (
      '${districtName}', '${stateId}' , '${cases}' , '${cured}' , '${active}' ,'${deaths}'
    );
  `

  await dataBase.run(insertQuery)
  response.send('District Successfully Added')
})

//4. Returns a district based on the district ID

let convertDistrictTable = each => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    cured: each.cured,
    active: each.active,
    deaths: each.deaths,
  }
}

app.get('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let districtGetQuery = `
  SELECT * 
  FROM district
  WHERE district_id = ${districtId};
  `
  let dbResponse4 = await dataBase.get(districtGetQuery)
  response.send(convertDistrictTable(dbResponse4)) // cant use map here since app.get is returning an object not an array.
})

// 5. Deletes a district from the district table based on the district ID

app.delete('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let delQuery = `
  DELETE FROM 
    district
  WHERE district_id = ${districtId};
  `
  await dataBase.run(delQuery)
  response.send('District Removed')
})

//6. Updates the details of a specific district based on the district ID

app.put('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let updateBody = request.body
  let {districtName, stateId, cases, cured, active, deaths} = updateBody
  let updtaeQuery = `
  UPDATE 
    district 
  SET 
    district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}' ,
    active = '${active}' ,
    deaths = '${deaths}' 
  WHERE 
    district_id = '${districtId}';
    `

  await dataBase.run(updtaeQuery)
  response.send('District Details Updated')
})

//7. Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
let convertGetResult = each => {
  return {
    totalCases: each.cases,
    totalCured: each.cured,
    totalActive: each.active,
    totalDeaths: each.deaths,
  }
}

app.get('/states/:stateId/stats/', async (request, response) => {
  let {stateId} = request.params
  let getQuery3 = `SELECT * FROM district WHERE state_id = ${stateId} ;`
  let dbResponse5 = await dataBase.get(getQuery3)
  console.log(typeof dbResponse5)
  response.send(convertGetResult(dbResponse5))
})

// 

module.exports = app
