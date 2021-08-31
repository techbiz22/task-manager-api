const express = require('express')
require('./db/mongoose')
const userRouter = require('./routes/user')
const taskRouter = require('./routes/task')
// const User = require('./models/user')
// const Task = require('./models/task')

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)







app.listen(port, () => {
    console.log('Server is running on port: ' + port)
})

// const Task = require('./models/task')
// const User = require('./models/user')

// const main = async () => {
//     const task = await Task.findById('6128fd5ba9a6994f54ff0dfb')
//     await task.populate('owner')
//     console.log(task.owner)

//     // const user = await User.findById('6128fd3ea9a6994f54ff0df5')
//     // await user.populate('tasks')
//     // console.log(user.tasks)
// }

// main()