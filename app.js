const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null
const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running At http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
intializeDbAndServer()
const hasPriorityStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}
const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}
const hasCategory = requestQuery => {
  return requestQuery.category !== undefined
}
const hasDueDate = requestQuery => {
  return requestQuery.dueDate !== undefined
}
const isValidPriority = item => {
  const array = ['HIGH', 'MEDIUM', 'LOW']
  if (array.includes(item)) {
    return true
  } else {
    return false
  }
}
const isValidStatus = item => {
  const array = ['TO DO', 'IN PROGRESS', 'DONE']
  if (array.includes(item)) {
    return true
  } else {
    return false
  }
}
const isValidCategory = item => {
  const array = ['WORK', 'HOME', 'LEARNING']
  if (array.includes(item)) {
    return true
  } else {
    return false
  }
}
const isValidDueDate = item => {
  return isValid(new Date(item))
}
const convertDueDate = dbobject => {
  return {
    id: dbobject.id,
    todo: dbobject.todo,
    priority: dbobject.priority,
    status: dbobject.status,
    category: dbobject.category,
    dueDate: dbobject.due_date,
  }
}
app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', priority, category, status} = request.query
  switch (true) {
    case hasPriorityStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE 
        todo LIKE '%${search_q}%' 
        AND status ='${status}' 
        AND priority='${priority}' 
        `
      if (isValidPriority(priority) && isValidStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(eachTodo => convertDueDate(eachTodo)))
      } else if (isValidPriority(priority)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategoryStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE 
        todo LIKE '%${search_q}%' 
        AND status ='${status}'  
        AND category='${category}'`
      if (isValidCategory(category) && isValidStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(eachTodo => convertDueDate(eachTodo)))
      } else if (isValidCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE 
        todo LIKE '%${search_q}%'
        AND priority='${priority}' 
        AND category='${category}'`
      if (isValidCategory(category) && isValidPriority(priority)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(eachTodo => convertDueDate(eachTodo)))
      } else if (isValidCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Priority')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE 
        todo LIKE '%${search_q}%'
        AND priority='${priority}'`
      if (isValidPriority(priority)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(eachTodo => convertDueDate(eachTodo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE 
        todo LIKE '%${search_q}%' 
        AND status ='${status}'`
      if (isValidStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(eachTodo => convertDueDate(eachTodo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasCategory(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE 
        todo LIKE '%${search_q}%'  
        AND category='${category}'`
      if (isValidCategory(category)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(eachTodo => convertDueDate(eachTodo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    default:
      getTodoQuery = `SELECT * FROM todo WHERE 
        todo LIKE '%${search_q}%'`
      data = await db.all(getTodoQuery)
      response.send(data.map(eachTodo => convertDueDate(eachTodo)))
      break
  }
})
app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId}`
  const data = await db.get(getTodoQuery)
  response.send(convertDueDate(data))
})
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (date === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    if (isValidDueDate(date)) {
      const formateDate = format(new Date(date), 'yyyy-MM-dd')
      const getTodoQuery = `SELECT * FROM todo WHERE due_date='${formateDate}';`
      const data = await db.all(getTodoQuery)
      response.send(data.map(eachDate => convertDueDate(eachDate)))
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})
app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status, category, dueDate} = todoDetails
  switch (false) {
    case isValidPriority(priority):
      response.status(400)
      response.send('Invalid Todo Priority')
      break
    case isValidStatus(status):
      response.status(400)
      response.send('Invalid Todo Status')
      break
    case isValidCategory(category):
      response.status(400)
      response.send('Invalid Todo Category')
      break
    case isValidDueDate(dueDate):
      response.status(400)
      response.send('Invalid Due Date')
      break
    default:
      const formateDate = format(new Date(dueDate), 'yyyy-MM-dd')
      const addTodoQuery = `INSERT INTO 
    todo (id,todo,priority,status,category,due_date)
    VALUES (
      ${id},
      '${todo}',
      '${priority}',
      '${status}',
      '${category}',
      '${formateDate}'
    );`
      const dbResponse = await db.run(addTodoQuery)
      response.send('Todo Successfully Added')
      break
  }
})
app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const todoDetails = request.body
  const {id, todo, priority, status, category, dueDate} = todoDetails
  switch (true) {
    case hasPriority(request.body):
      const updateTodoPriortyQuery = `UPDATE todo 
      SET priority='${priority}' 
      WHERE 
        id=${todoId}`
      if (isValidPriority(priority)) {
        data = await db.run(updateTodoPriortyQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatus(request.body):
      const updateTodoStatusQuery = `UPDATE todo 
      SET status='${status}' 
      WHERE 
        id=${todoId}`
      if (isValidStatus(status)) {
        data = await db.run(updateTodoStatusQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasCategory(request.body):
      const updateTodoCategoryQuery = `UPDATE todo 
      SET category='${category}' 
      WHERE 
        id=${todoId}`
      if (isValidCategory(category)) {
        data = await db.run(updateTodoCategoryQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasDueDate(request.body):
      const updateTodoDueDateQuery = `UPDATE todo 
      SET due_date='${dueDate}' 
      WHERE 
        id=${todoId}`
      if (isValidDueDate(dueDate)) {
        data = await db.run(updateTodoDueDateQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
    default:
      const updateTodoQuery = `UPDATE todo 
      SET todo='${todo}' 
      WHERE 
        id=${todoId}`
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
  }
})
app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id=${todoId}`
  const data = await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})
module.exports = app
